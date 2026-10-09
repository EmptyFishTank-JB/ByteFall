// BYTEFALL — a decryption puzzle inspired by Blockchain from Arcade Paradise.
// Core mechanic is Drop7-style: encrypted bits 1-N fall into an N-wide grid and
// a bit decrypts (clears) when it sits in an unbroken row/column run whose
// length equals its number. Clears peel adjacent encryption layers (the
// 'firewall' cells, which rise in rows every few drops), and a 5x combo
// unlocks an exploit (a 'hack' piece) that is dropped like a bit.
// Easy and Normal play 7x7; Hard plays a full byte, 8x8 with bits up to 8.

// Grid size comes from the difficulty and is set by initGame().
let COLS = 7;
let ROWS = 7;
let MAX_ROWS = ROWS + 1; // top row holds overflow; anything left there after clears ends the run
const STEP_MS = 35; // per-row fall speed
const HACK_COMBO = 5;

const BASE_INTERVAL = 8; // drops between firewall rows
const HARD_MIN_INTERVAL = 4;
const HARD_POINTS_PER_STEP = 700; // hard mode loses one drop per this many points
const BYTE_BITS = 8; // Hard: every 8 bits decrypted by one drop is a byte...
const BYTE_BONUS = 256; // ...worth 2^8 points
const NIBBLE_BITS = 4; // Easy and Normal: every 4 is a nibble...
const NIBBLE_BONUS = 16; // ...worth 2^4 points
// The bonus a drop's decrypts earn: a BYTE on Hard, a NIBBLE on Easy and Normal
const PACKETS = {
  byte: { name: 'BYTE', plural: 'BYTES', bits: BYTE_BITS, bonus: BYTE_BONUS },
  nibble: { name: 'NIBBLE', plural: 'NIBBLES', bits: NIBBLE_BITS, bonus: NIBBLE_BONUS },
};

const DIFFICULTIES = {
  easy: { label: 'EASY', size: 7, packet: 'nibble', showNext: true, interval: () => BASE_INTERVAL },
  normal: { label: 'NORMAL', size: 7, packet: 'nibble', showNext: false, interval: () => BASE_INTERVAL },
  hard: {
    label: 'HARD',
    size: 8,
    packet: 'byte',
    showNext: false,
    interval: (pts) => Math.max(HARD_MIN_INTERVAL, BASE_INTERVAL - Math.floor(pts / HARD_POINTS_PER_STEP)),
  },
};

// easyCombo: on Easy, the chain length that unlocks each hack (stronger hacks need longer chains).
// Which exploits a player can get comes from progress.js (levels and DECRYPTOR ranks).
const HACKS = {
  'worm-virus': { name: 'WORM VIRUS', icon: '§', easyCombo: 5 },
  'buffer-overflow': { name: 'BUFFER OVERFLOW', icon: '+', easyCombo: 4 },
  trojan: { name: 'TROJAN', icon: '◈', easyCombo: 4 },
  rng: { name: 'RNG', icon: '?', easyCombo: 3 },
  bitflip: { name: 'BITFLIP', icon: '\u2195', easyCombo: 3 },
  'dictionary-attack': { name: 'DICTIONARY ATTACK', icon: '#', easyCombo: 4 },
  keylogger: { name: 'KEYLOGGER', icon: '@', easyCombo: 3 },
  backdoor: { name: 'BACKDOOR', icon: '_', easyCombo: 4 },
  'rainbow-table': { name: 'RAINBOW TABLE', icon: '*', easyCombo: 5 },
  'packet-sniffer': { name: 'PACKET SNIFFER', icon: '~', easyCombo: 3 },
  'logic-bomb': { name: 'LOGIC BOMB', icon: '!', easyCombo: 4 },
  honeypot: { name: 'HONEYPOT', icon: '\u25CE', easyCombo: 4 },
  pivot: { name: 'PIVOT', icon: '\u21C6', easyCombo: 3 },
  swap: { name: 'SWAP', icon: 'x', easyCombo: 3 },
  'black-box': { name: 'BLACK BOX', icon: '\u25A0', easyCombo: 5 },
};
const KEYLOGGER_DROPS = 10; // drops the keylogger keeps showing the next bits for
const KEYLOGGER_PREVIEW = 3;
const SNIFFER_BITS = 3; // bits the packet sniffer lets you choose
const BOMB_DROPS = 3; // drops before a logic bomb detonates
const BLAST_RADIUS = 2; // logic bomb and honeypot reach: a 5x5 area

// The Daily Decrypt uses the same five exploits for everyone; elsewhere it's your equipped loadout.
const DAILY_EXPLOITS = ['worm-virus', 'buffer-overflow', 'trojan', 'rng', 'bitflip'];
const hackAvailable = (id) => (daily ? DAILY_EXPLOITS.includes(id) : Progress.isEquipped(id));
Progress.setExploitCount(Object.keys(HACKS).length);
Progress.setExploitNames(Object.fromEntries(Object.entries(HACKS).map(([id, h]) => [id, h.name])));

let columns = []; // columns[c] = array of cells, index 0 = bottom
let queue = []; // upcoming pieces; queue[0] is the one being dropped
let score = 0;
let best = 0;
let bestAtStart = 0;
let dropsSinceLastPulse = 0;
let pulseInterval = BASE_INTERVAL;
let gameOver = false;
let busy = false; // true while animating/resolving, blocks input
let runId = 0; // bumped on every new game so a pending game-over sequence can tell it's stale
let vsPaused = false;
let adware = null; // INFECTIONS (runAnti, infections.js): ADWARE's covered column { col, left }
let spywareLeft = 0; // ...SPYWARE's hidden bits
let malwareLeft = 0; // ...MALWARE's drops with the board's bits corrupted
let infSeq = 0; // (each infection's turn: the later one shows over the earlier where they meet)
let malwareAt = 0; // (MALWARE's turn; a RANSOMWARE lock keeps its own, cell.lockAt)
let scareLeft = 0;
// What the ADWARE, CRYPTOJACKER and SCAREWARE demand: kind -> { want, paid }, never shown. Each tap on
// the ad, the sign or a pop-up takes a few KEYS, toward that one's demand only; paid in full, it
// leaves the terminal. Run out its clock instead, and nothing more's taken (and not a key paid: WE
// DON'T NEGOTIATE)
let demands = {};
const PAYABLE = ['adware', 'cryptojacker', 'scareware'];
const DEMAND = [10, 20]; // (KEYS asked, each strike: somewhere in this range)
const TAKE = [1, 3]; // (KEYS a tap takes: a few, at random) // (SCAREWARE's drops left: its pop-ups keep coming on their own clock till then)
// RANSOMWARE's strikes: each the bits it locked, how many were paid off and the KEYS it got. Every bit
// paid off: its demand paid in full; not a key paid, and every lock ran out: outlasted
let ransoms = {};
let ransomSeq = 0;
let jackLeft = 0; // ...and the CRYPTOJACKER's drops left stealing (RANSOMWARE's locks are on the bits: cell.locked)
let marketOpen = false; // THE BLACK MARKET sells once the game's first encryption layer rises (ZEN: after as many drops) // PAUSE (any mode): the board covered, the CPU's clock stopped, the drop buttons off
let keyloggerDrops = 0; // drops left with the keylogger's preview showing
let snifferBits = 0; // bits left whose number the player can pick
let chainLog = []; // this drop's decrypts: { vals, chain, points } per link, { packet, count, points }
let pivotFrom = null; // PIVOT: column picked, waiting for the player to pick a neighbor
let pivotWith = null; // PIVOT: the neighbor the landing pivot swaps with
let swapPicks = []; // SWAP: the bits picked ({ r, c }), two and it drops
const swapArmed = () => !!queue[0] && queue[0].type === 'hack' && queue[0].id === 'swap';
let breached = false; // BREACH: the board was cleared
let started = false; // the session's first drop has landed (PUZZLE counts as started right away)
let heldHacks = []; // earned exploits waiting in the exploit button
let armedHack = null; // the exploit armed as the next drop (no taking it back)
let armedSlot = null; // (armed from a side slot: that slot, where it stays lit till it's dropped)

const storage = {
  get(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  },
  set(key, value) {
    try { localStorage.setItem(key, value); } catch (e) {}
  },
};

// The EASY / NORMAL / HARD choice (CLASSIC mode). `difficulty` is the rules of the current
// run: the classic choice in CLASSIC, Normal in every other mode.
// A fresh launch (the app or tab opened anew, not a refresh or coming back to it) starts on
// CLASSIC, Normal. (sessionStorage lasts as long as the tab or app window.)
try {
  if (!sessionStorage.getItem('bytefall-launched')) {
    sessionStorage.setItem('bytefall-launched', '1');
    storage.set('bytefall-mode', 'classic');
    storage.set('bytefall-difficulty', 'normal');
  }
} catch (e) {}
let classicDifficulty = DIFFICULTIES[storage.get('bytefall-difficulty')] ? storage.get('bytefall-difficulty') : 'normal';
if (classicDifficulty === 'hard' && !Progress.isUnlocked('mode-hard')) classicDifficulty = 'normal';
let difficulty = classicDifficulty;

const BLITZ_SECONDS = 120;
const DAILY_BLITZ_SECONDS = 60;
const DAILY_BITS = 40; // the Daily Decrypt deals a fixed stack of bits, then ends
const BREACH_BITS = 30; // BREACH deals 30
const BREACH_ROWS = 3; // rows of the pre-built firewall
const BREACH_LAYER_POINTS = 25; // BREACH: extra points for each layer broken open
const BREACH_CLEAR_BONUS = 1000; // BREACH: the whole board cleared
let dealt = 0; // bits dealt so far this run (DECRYPT, BREACH)
const dealLimit = () => (mode === 'decrypt' ? DAILY_BITS : mode === 'breach' ? BREACH_BITS : Infinity);
// DAILY: the first run of each daily game each day is the official one (its score is today's);
// the rest are practice. Daily Decrypt keeps its original key names.
let dailyOfficial = true;
const dailyTag = (kind = mode) => (kind === 'decrypt' ? '' : `${kind}-`);
const dailyKey = (kind = mode) => `bytefall-daily-${dailyTag(kind)}${todayKey()}`;
const dailyPlayedKey = (kind = mode) => `bytefall-daily-played-${dailyTag(kind)}${todayKey()}`;
const DAILY_KINDS = { decrypt: 'DAILY DECRYPT', puzzle: 'DAILY PUZZLE', blitz: 'DAILY BLITZ', breach: 'BREACH' };
const WEEKDAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
const utcWeekday = () => (new Date().getUTCDay() + 6) % 7; // Monday = 0
let reportedScore = 0; // points already added to lifetime data extracted
// The official-or-practice note on each daily game's info line
const dailyNote = (date, what) => (dailyOfficial
  ? `${DAILY_KINDS[mode]} // ${date} (UTC): ${what} Your first attempt today is the official one.`
  : `${DAILY_KINDS[mode]} // ${date} // PRACTICE: your official score today is ${fmt(Number(storage.get(dailyKey())) || 0)}.`);
// `mode` is the game being played. The mode row picks CLASSIC, DAILY, BLITZ, ZEN or PUZZLE; under
// DAILY (`daily`) the second row picks DECRYPT, PUZZLE, BLITZ or BREACH (BREACH is daily only).
const MODES = {
  classic: { label: 'CLASSIC', info: () => 'CLASSIC // No clock and no bit limit: keep your columns under the line as long as you can.' },
  decrypt: {
    label: 'DAILY DECRYPT',
    info: (date) => dailyNote(date, `the same ${DAILY_BITS} bits for everyone.`),
  },
  blitz: {
    label: 'BLITZ',
    info: (date) => (daily
      ? dailyNote(date, `the same bits for everyone and ${DAILY_BLITZ_SECONDS} seconds on the clock.`)
      : 'BLITZ // 2 minutes on the clock, starting with your first drop. Score all you can.'),
  },
  zen: { label: 'ZEN', noLayers: true, info: () => 'ZEN // no encryption layers and no clock. Just decrypt.' },
  // TUTORIAL (RULES → TUTORIAL, tutorial.js): set boards and bits, one lesson at a time
  tutorial: { label: 'TUTORIAL', noLayers: true, info: () => 'TUTORIAL // the rules, one step at a time.' },
  puzzle: {
    label: 'PUZZLE',
    noLayers: true, // no new layers rise (puzzles can start with some)
    noHacks: true,
    info: (date) => {
      const n = currentPuzzle().pieces.length;
      const rule = `Decrypt every block on the board with exactly the ${n === 1 ? 'bit' : `${n} bits`} given, in order.`;
      if (!daily) return 'PUZZLE // clear the board with exactly the bits given, in order. 100 puzzles each on EASY, NORMAL and HARD, each opening once the one before it is solved.';
      const head = `DAILY PUZZLE // ${date} // ${WEEKDAYS[utcWeekday()]}, DIFFICULTY ${utcWeekday() + 1}/7`;
      if (dailyOfficial) return `${head}: ${rule} ${DAILY_PUZZLE_TRIES - dailyPuzzleTries()} of ${DAILY_PUZZLE_TRIES} tries left today.`;
      return `${head} // PRACTICE: ${dailyPuzzleSolvedAt() ? `solved today in ${dailyPuzzleSolvedAt()} of ${DAILY_PUZZLE_TRIES} tries` : `not solved in today's ${DAILY_PUZZLE_TRIES} tries`}. ${rule}`;
    },
  },
  vs: {
    label: 'VS CPU',
    // Rising layers are optional in VS (the LAYERS toggle); both boards get them when on
    get noLayers() { return !vsLayers; },
    get noHacks() { return !vsExploits; }, // the EXPLOITS setting
    info: () => `VS CPU // ${VS_MODES[vsMode].label} // ${CpuBoard.BOTS[vsBot].label} // ${CpuBoard.LEVELS[vsLevel].label} // LAYERS ${vsLayers ? 'ON' : 'OFF'}: your chains send encrypted blocks onto the CPU's board, and its chains send them onto yours. Your chains cancel blocks headed your way first. The first to overflow loses. The CPU starts with your first drop.`,
  },
  breach: {
    label: 'BREACH',
    noLayers: true, // the firewall is built at the start; no new layers rise
    info: (date) => dailyNote(date, `break through a ${BREACH_ROWS}-row firewall with ${BREACH_BITS} bits. +${BREACH_LAYER_POINTS} for every layer broken, +${BREACH_CLEAR_BONUS} for clearing the board.`),
  },
};
// PUZZLE: three sets of 100 (EASY and NORMAL on the 7x7, HARD on the 8x8), each played in order:
// puzzle 1 of each is open, and every one after it opens once the one before it is solved
const PUZZLE_TIERS = ['easy', 'normal', 'hard'];
let puzzleTier = PUZZLE_TIERS.includes(storage.get('bytefall-puzzle-tier')) ? storage.get('bytefall-puzzle-tier') : 'normal';
const tierPuzzles = (t = puzzleTier) => PUZZLES[t];
// (in the saved progress NORMAL's keep the plain numbers they've always had; EASY's and HARD's are e0, h0...)
const puzzleKey = (i, t = puzzleTier) => (t === 'normal' ? i : `${t[0]}${i}`);
const puzzleDone = (i, t = puzzleTier) => Progress.puzzleSolved(puzzleKey(i, t));
const puzzleOpen = (i, t = puzzleTier) => i === 0 || puzzleDone(i - 1, t);
const tierSolved = (t = puzzleTier) => tierPuzzles(t).filter((_, n) => puzzleDone(n, t)).length;
const tierLabel = (t = puzzleTier) => DIFFICULTIES[t].label;
Progress.setPuzzleCount(PUZZLE_TIERS.reduce((n, t) => n + PUZZLES[t].length, 0));
Progress.setTracks(Music.tracks());
// The one you were on in a set (or its first unsolved one)
const firstUnsolved = (t = puzzleTier) => {
  const i = tierPuzzles(t).findIndex((_, n) => !puzzleDone(n, t));
  return i < 0 ? tierPuzzles(t).length - 1 : i;
};
const puzzleIndexKey = (t = puzzleTier) => (t === 'normal' ? 'bytefall-puzzle' : `bytefall-puzzle-${t}`);
const savedPuzzle = (t = puzzleTier) => {
  const n = Number(storage.get(puzzleIndexKey(t)));
  return Math.min(Number.isInteger(n) && n >= 0 && storage.get(puzzleIndexKey(t)) != null ? n : firstUnsolved(t), firstUnsolved(t));
};
let puzzleIndex = savedPuzzle();
let overlayNext = null; // what the overlay button does in PUZZLE: 'next' or 'retry'

// PATCHES (BOOSTERS in the code): bought with KEYS in the STORE (store.js). The ones for before a game are switched on
// from the main menu (and stay on while there are any left), each used up at that game's first
// drop; RESTORE POINT only when it saves you; HINT and UNDO (PUZZLE) when they're pressed. Never
// in DAILY or VS (or the tutorial): those stay the same for everyone. A patched game says so.
const BOOSTERS = {
  'head-start': { name: 'HEAD START', cost: 15, desc: 'The CHAIN METER starts half full.', modes: ['classic', 'blitz', 'zen'] },
  'firewall-delay': { name: 'FIREWALL DELAY', cost: 20, desc: 'The first encryption layer rises 4 drops later.', modes: ['classic', 'blitz'] },
  lookahead: { name: 'LOOKAHEAD', cost: 15, desc: 'See your next bit for the first 60 seconds (EASY always shows it).', modes: ['classic', 'blitz', 'zen'] },
  overtime: { name: 'OVERTIME', cost: 20, desc: '+15 seconds on the BLITZ clock.', modes: ['blitz'] },
  'second-chance': { name: 'RESTORE POINT', cost: 40, desc: 'If the trace completes, the system rolls back: everything above the bottom 3 rows is wiped and you keep playing. Once a game.', modes: ['classic', 'blitz', 'zen'], adPerDay: 1 }, // (adPerDay: free for a rewarded ad that many times a day, the STORE's WATCH AD)
  hint: { name: 'HINT', cost: 10, desc: 'PUZZLE: lights up the column your next bit should go in.', modes: ['puzzle'], inGame: true },
  undo: { name: 'UNDO', cost: 8, desc: 'PUZZLE: takes back your last drop, even after your bits run out.', modes: ['puzzle'], inGame: true },
};
// Each booster's own icon (in the STORE, in brackets, and on the main menu's booster buttons)
const BOOSTER_SVG = {
  'head-start': '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6l6 6-6 6M12 6l6 6-6 6"/></svg>', // (fast-forward: a running start)
  'firewall-delay': '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 5h18v14H3zM3 9.7h18M3 14.3h18M9 5v4.7M15 5v4.7M6 9.7v4.6M12 9.7v4.6M18 9.7v4.6M9 14.3V19M15 14.3V19"/></svg>', // (the wall, held back)
  lookahead: '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>', // (an eye)
  overtime: '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="13.5" r="7.5"/><path d="M9 3h4M11 3v3M11 10v3.5l2.2 2.2M19.5 3.5v5M17 6h5"/></svg>', // (a stopwatch, plus)
  'second-chance': '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 12a8.5 8.5 0 1 0 2.5-6M3.5 4v4.5H8M12 7.5V12l3 2"/></svg>', // (RESTORE POINT: a clock wound back)
  hint: '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.7.6 1.1 1.3 1.1 2.2h5c0-.9.4-1.6 1.1-2.2A6 6 0 0 0 12 3z"/></svg>', // (a light bulb)
  undo: '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 14 4 9l5-5M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/></svg>', // (back a step)
};

window.BOOSTERS = BOOSTERS;
// THE SIDE SLOTS, one each side of the exploit button (CLASSIC, BLITZ and ZEN; not DAILY, PUZZLE,
// VS or the tutorial). STARTER EXPLOITS and BLACK BOXES (bought in the STORE with KEYS and the
// RESOURCES, Progress keeps them; ECONOMY.md): 2 taken into a game (picked on the main menu: two
// of one kind, or one each of two), one in each slot, each used once; a tap arms an exploit as the
// next drop, as an earned one, and it's used up (the ones not used stay owned). A BLACK BOX waits
// sealed: a tap opens it (used up), its slot rolling like a slot machine's reel and landing on an
// exploit, which then waits there to be armed, or an INFECTION, which goes off at once. A slot
// taken in empty, or whose starter is used, is the BLACK MARKET: a random exploit (of
// the ones unlocked by level) or BLACK BOX at the STORE's price, changing every MARKET_EVERY drops.
// A tap opens its window: the price, and BUY (short of it, an exploit takes a MASTER KEY instead, if
// there's one); a buy waits in the slot until it's armed (or opened), then the slot sells again, as
// often as you like. Buying opens once the first encryption layer rises (ZEN, with none: after as
// many drops, BASE_INTERVAL); till then the offers can be looked at. A game that used them says so.
const STARTER_MAX = 2;
const MARKET_EVERY = 4;
const starterFits = (m = mode) => !daily && ['classic', 'blitz', 'zen'].includes(m);
let sideSlots = []; // this game's: [{ state: 'starter' | 'bought' | 'opened' | 'rolling' | 'market' | 'closed', id }]
let marketDrops = 0;
let usedStarters = []; // (for the result screen)
let marketBought = [];
const marketPool = () => Progress.exploitOrder().filter((id) => Progress.sellable(id) && Progress.exploitInfo(id).unlocked);
// (a quarter of the time a BLACK BOX: I most often, III least)
const MARKET_BOX_ODDS = 0.25;
function marketPick(not = []) {
  const all = marketPool();
  // (and always a box while no exploit is unlocked yet: boxes need no unlocking)
  if (Math.random() < MARKET_BOX_ODDS || !all.length) {
    const r = Math.random();
    return Progress.boxIds()[r < 0.6 ? 0 : r < 0.9 ? 1 : 2];
  }
  const pool = all.filter((id) => !not.includes(id));
  const from = pool.length ? pool : all;
  return from[Math.floor(Math.random() * from.length)] || null;
}
// BLACK BOXES and INFECTIONS beside the exploits: their names and icons
const BOX_TIERS = { 'box-1': 'I', 'box-2': 'II', 'box-3': 'III' };
const ANTI = {
  adware: { name: 'ADWARE', does: 'A COLUMN BLOCKED FOR 3 DROPS' },
  spyware: { name: 'SPYWARE', does: 'NEXT 3 BITS HIDDEN' },
  ransomware: { name: 'RANSOMWARE', does: '3 BITS LOCKED FOR 5 DROPS (TAP TO PAY)' },
  malware: { name: 'MALWARE', does: 'BOARD CORRUPTED FOR 3 DROPS' },
  cryptojacker: { name: 'CRYPTOJACKER', does: 'RESOURCES STOLEN FOR 5 DROPS' },
  scareware: { name: 'SCAREWARE', does: 'POP-UPS FOR 8 DROPS' },
};
// (a little virus: the INFECTIONS')
const VIRUS_SVG = '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="5"/><path d="M12 7V3M12 21v-4M7 12H3M21 12h-4M8.5 8.5 5.5 5.5M18.5 18.5l-3-3M8.5 15.5l-3 3M18.5 5.5l-3 3"/></svg>';
// What each one does, for the STORE and the BLACK MARKET's window (the README's exploit table, short)
const ITEM_DESC = {
  rng: 'Scrambles every bit on the board to a random number.',
  bitflip: 'Turns every column upside down.',
  'buffer-overflow': 'Adds 1 to every bit; the top number is re-encrypted under two layers.',
  trojan: 'Wipes out every block touching the spot where it lands.',
  pivot: 'Swaps the column it lands in with a neighbor you pick.',
  swap: 'Any two bits on the board trade places.',
  'worm-virus': 'Wipes out every block in the column it lands in.',
  keylogger: 'Shows your next 3 bits for the next 10 drops.',
  'packet-sniffer': 'For your next 3 bits, you pick each one\'s number.',
  backdoor: 'Deletes the bottom row, layers included; everything drops by one.',
  'logic-bomb': 'Lands as a 3-drop countdown, then wipes out the 5x5 around it.',
  honeypot: 'A trap: when a bit beside it decrypts, every bit of that number within 2 cells does too.',
  'dictionary-attack': 'Every encryption layer on the board loses one level.',
  'rainbow-table': 'Decrypts every bit showing the most common number on the board.',
  'black-box': 'Opens into a random exploit, any of them.',
  'box-1': 'Most likely a tier 1 exploit.',
  'box-2': 'Most likely a tier 2 exploit.',
  'box-3': 'Good odds of a tier 3 exploit.',
};
const itemDesc = (id) => ITEM_DESC[id] || '';
const itemName = (id) => (BOX_TIERS[id] ? `BLACK BOX ${BOX_TIERS[id]}` : ANTI[id] ? ANTI[id].name : HACKS[id] ? HACKS[id].name : id);
// (in a list beside its name: in brackets, as a bit is, [!])
const bracketIcon = (id) => `<span class="ico-br">[</span>${itemIcon(id)}<span class="ico-br">]</span>`;
const itemIcon = (id) => (BOX_TIERS[id] ? `${ICON_SVG['black-box']}<span class="box-tier">${BOX_TIERS[id]}</span>` : ANTI[id] ? VIRUS_SVG : iconHtml(id));
const boosterFits = (id, m = mode) => !daily && BOOSTERS[id].modes.includes(m);
// (switched on per mode: CLASSIC's choice isn't BLITZ's)
const armedKey = () => `bytefall-boosters-on-${mode}`;
let armedBoosts = new Set();
// (one booster per game: an older save with several keeps the first)
const loadArmed = () => { armedBoosts = new Set((storage.get(armedKey()) || '').split(',').filter((id) => BOOSTERS[id] && boosterFits(id)).slice(0, 1)); };
const saveArmed = () => storage.set(armedKey(), [...armedBoosts].join(','));
const LOOKAHEAD_MS = 60000;
let lookaheadLeft = 0; // LOOKAHEAD: the play time it has left (counted while the game is being played)
let runBoosts = new Set(); // this game's (switched on, owned, for this mode): used up at its first drop
let boostsSpent = false;
let secondChanceUsed = false;
let puzzleHistory = []; // PUZZLE: the board before each drop (UNDO)
let hintCol = null; // PUZZLE: the column HINT lit, until the next drop
// The mode row's choice ('daily' or one of MODES) and the daily game under it
const TOP_MODES = ['classic', 'daily', 'blitz', 'zen', 'puzzle', 'vs'];
// VS CPU: the opponent's level
let vsLevel = CpuBoard.LEVELS[storage.get('bytefall-vs-level')] ? storage.get('bytefall-vs-level') : 'normal';
let vsBot = CpuBoard.BOTS[storage.get('bytefall-vs-bot')] ? storage.get('bytefall-vs-bot') : 'bot';
// HARD and INSANE CPUs and the bots past BOT are unlocked by winning (progress.js's VS CPU group)
const fmt = (n) => Number(n).toLocaleString('en-US'); // 12,345

// VS game modes. CLASSIC: first to overflow loses. ATTRITION: both start at 0; points count up,
// and chain links from 2x up plus NIBBLE bonuses also come off the other side; first to the
// target wins. DEATHMATCH: a straight race to the target. TUG OF WAR: both start with a pool, and
// every point scored is taken from the other side's; whoever runs out loses. Blocks fly in all of
// them, and overflowing always loses.
const VS_MODES = {
  classic: { label: 'CLASSIC', note: "Your chains send encrypted blocks onto the CPU's board; its chains send them onto yours. First to overflow loses." },
  attrition: { label: 'ATTRITION', note: 'Both start at 0. Chains of 2x and up and NIBBLEs also take their points from the other side. First to the target wins.' },
  deathmatch: { label: 'DEATHMATCH', note: 'A race: first to the target score wins. Chains still send encrypted blocks, and overflowing still loses.' },
  tug: { label: 'TUG OF WAR', note: 'Both start with the same points. Every point scored is taken from the other side. Run out and you lose.' },
};
const VS_TARGET = { min: 500, max: 10000, step: 500, start: 2000 }; // ATTRITION and DEATHMATCH
const VS_POOL = { min: 500, max: 5000, step: 500, start: 1000 }; // TUG OF WAR, each side
let vsMode = VS_MODES[storage.get('bytefall-vs-mode')] ? storage.get('bytefall-vs-mode') : 'classic';
const storedStep = (key, range) => {
  const n = Number(storage.get(key));
  return n >= range.min && n <= range.max && n % range.step === 0 ? n : range.start;
};
let vsTarget = storedStep('bytefall-vs-target', VS_TARGET);
let vsPool = storedStep('bytefall-vs-pool', VS_POOL);
const vsLevelOpen = (id) => (id === 'hard' || id === 'insane' ? Progress.isUnlocked(`vs-${id}`) : true);
const vsBotOpen = (id) => id === 'bot' || Progress.isUnlocked(`bot-${id}`);
if (!vsLevelOpen(vsLevel)) vsLevel = 'normal';
if (!vsBotOpen(vsBot)) vsBot = 'bot';
const vsName = () => `${CpuBoard.BOTS[vsBot].label === 'BOT' ? '' : `${CpuBoard.BOTS[vsBot].label} `}${CpuBoard.LEVELS[vsLevel].label} CPU`;
let vsLayers = storage.get('bytefall-vs-layers') !== 'off'; // new layer rows every 8 drops, for both boards
let vsExploits = storage.get('bytefall-vs-exploits') === 'on'; // exploits for both sides (the CPU's: cpu.js)
let topMode = TOP_MODES.includes(storage.get('bytefall-mode')) ? storage.get('bytefall-mode') : 'classic';
let dailyKind = DAILY_KINDS[storage.get('bytefall-daily-kind')] ? storage.get('bytefall-daily-kind') : 'decrypt';
let daily = false;
let mode = 'classic';
let homeOpen = false; // the MAIN MENU is up (showHome)
function setModeFromChoice() {
  daily = topMode === 'daily';
  mode = daily ? dailyKind : topMode;
}
setModeFromChoice();

// PUZZLE: the archive puzzle picked, or today's daily one (daily-puzzles.js). The daily list
// is dated from its first Monday and a whole number of weeks long, so past its end it loops
// and each weekday keeps its difficulty.
function todayPuzzle() {
  const day = Math.floor((Date.parse(`${todayKey()}T00:00:00Z`) - Date.parse(`${DAILY_PUZZLES[0].date}T00:00:00Z`)) / 86400000);
  return DAILY_PUZZLES[((day % DAILY_PUZZLES.length) + DAILY_PUZZLES.length) % DAILY_PUZZLES.length];
}
const currentPuzzle = () => (daily ? todayPuzzle() : tierPuzzles()[puzzleIndex]);
// DAILY PUZZLE: 4 official tries a day (a try counts from its first drop); once it's solved or
// they're used up, it's practice. Every attempt, practice too, counts toward STUBBORN.
const DAILY_PUZZLE_TRIES = 4;
const dailyPuzzleTriesKey = () => `bytefall-daily-puzzle-tries-${todayKey()}`;
const dailyPuzzleAttemptsKey = () => `bytefall-daily-puzzle-attempts-${todayKey()}`;
const dailyPuzzleSolvedKey = () => `bytefall-daily-puzzle-solved-${todayKey()}`;
const dailyPuzzleTries = () => Number(storage.get(dailyPuzzleTriesKey())) || 0;
const dailyPuzzleSolvedAt = () => Number(storage.get(dailyPuzzleSolvedKey())) || 0; // the try it was solved on
const dailyPuzzleOfficial = () => !dailyPuzzleSolvedAt() && dailyPuzzleTries() < DAILY_PUZZLE_TRIES;

// Randomness. DAILY seeds each stream from the date, so the bits you're dealt are the same for
// everyone however they play; bits revealed under layers and exploits use their own streams.
function seeded(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return h >>> 0;
}
const todayKey = () => new Date().toISOString().slice(0, 10); // UTC, so the daily is the same worldwide
const dice = { queue: Math.random, reveal: Math.random, hack: Math.random };
function setupDice() {
  if (daily) {
    const day = todayKey();
    for (const stream of Object.keys(dice)) dice[stream] = seeded(hashString(`bytefall:${day}:${dailyTag()}${stream}`));
  } else if (mode === 'vs') {
    // You and the CPU get the same bits, in the same order
    vsSeed = Math.floor(Math.random() * 2 ** 31);
    for (const stream of Object.keys(dice)) dice[stream] = seeded(hashString(`bytefall:vs:${vsSeed}:${stream}`));
  } else {
    for (const stream of Object.keys(dice)) dice[stream] = Math.random;
  }
}
let vsSeed = 0;

// BLITZ clock: counts down from the first drop, paused while the tab is hidden
let timeLeft = BLITZ_SECONDS;
let clockRunning = false;
let timeUp = false;

const boardEl = document.getElementById('board');
const boardWrapEl = document.querySelector('.board-wrap');
Infections.init(boardEl, boardWrapEl, { onPay: (kind) => payInfection(kind) }); // (the INFECTIONS' displays, laid over the board)

{ // (the dev page's INFECTION LOOK switch: every infection shows that look of its four)
  const look = Number(storage.get('bytefall-dev-infection-look'));
  if (look >= 1 && look <= 8) Infections.force({ ad: look - 1, jack: look - 1, spy: look - 1, malware: look - 1, ransom: look - 1, scare: look - 1 });
}
const columnButtonsEl = document.getElementById('column-buttons');
const scoreEl = document.getElementById('score');
const bestEl = document.getElementById('best');
const chainEl = document.getElementById('chain');
const currentEl = document.getElementById('current-piece');
const nextEl = document.getElementById('next-piece');
const nextStatEl = document.getElementById('next-stat');
const nextLabelEl = document.getElementById('next-label');
const pulseCounterEl = document.getElementById('pulse-counter');
const messageEl = document.getElementById('message');
const overlayEl = document.getElementById('game-over');
const finalScoreEl = document.getElementById('final-score');
const newBestEl = document.getElementById('new-best');

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// stream: 'queue' for bits you're dealt, 'reveal' for bits uncovered or rerolled on the board
function newPacket(stream = 'reveal') {
  return { type: 'number', val: 1 + Math.floor(dice[stream]() * COLS) };
}

// Points for a bit a chain decrypts: 10 plus its number ([4] is 14), times the chain.
// Blocks wiped out by exploits are a flat 10 each.
const blockPoints = (cell) => 10 + (cell && cell.type === 'number' ? cell.val : 0);
const EXPLOIT_POINTS = 10;
const pointsFor = (positions) => positions.length * EXPLOIT_POINTS;

function newFirewall(level = 2) {
  return { type: 'firewall', level };
}

// Other modes keep their own bests; DAILY keeps today's official score (practice runs save nothing).
function bestKey() {
  if (mode === 'tutorial') return null; // (no best to keep)
  if (daily) return dailyOfficial ? dailyKey() : null;
  if (mode !== 'classic') return `bytefall-best-${mode}`;
  return `bytefall-best-${difficulty}`;
}

// Always enough upcoming bits for the widest preview (the keylogger's). PUZZLE has a fixed list.
function refillQueue() {
  if (mode === 'puzzle' || mode === 'tutorial') return;
  while (queue.length < 1 + KEYLOGGER_PREVIEW && dealt < dealLimit()) {
    queue.push(newPacket('queue'));
    dealt++;
  }
}

// DECRYPT, BREACH: bits still to drop (dealt-but-waiting plus not yet dealt)
const dailyBitsLeft = () => dealLimit() - dealt + queue.filter((p) => p.type === 'number').length;

function initGame() {
  if (pendingEarned.length) flushEarned(); // (a game left before its meter finished)
  runXp = Progress.levelInfo();
  xpHold = mode !== 'tutorial';
  runId++;
  // (VS plays on the CPU level's board: HARD's 8x8 against HARD and INSANE, NORMAL's 7x7 otherwise)
  difficulty = mode === 'classic' ? classicDifficulty : mode === 'puzzle' && !daily ? puzzleTier
    : mode === 'vs' && CpuBoard.sizeFor(vsLevel) === 8 ? 'hard' : 'normal';
  dailyOfficial = daily && (mode === 'puzzle' ? dailyPuzzleOfficial() : !storage.get(dailyPlayedKey()));
  setupDice();
  Progress.startRun(difficulty, mode, mode === 'puzzle' && !daily ? puzzleKey(puzzleIndex) : null, daily);
  timeLeft = daily ? DAILY_BLITZ_SECONDS : BLITZ_SECONDS;
  clockRunning = false;
  timeUp = false;
  applyModeUi();
  COLS = ROWS = DIFFICULTIES[difficulty].size;
  MAX_ROWS = ROWS + 1;
  boardWrapEl.style.setProperty('--cols', COLS);
  boardWrapEl.classList.toggle('byte-grid', COLS === 8);
  boardEl.classList.remove('meltdown');
  columns = Array.from({ length: COLS }, () => []);
  queue = [];
  dealt = 0;
  reportedScore = 0;
  refillQueue();
  if (mode === 'puzzle') loadPuzzle();
  if (mode === 'breach') buildBreachWall();
  startVs();
  score = 0;
  best = Number(storage.get(daily ? dailyKey() : bestKey())) || 0;
  bestAtStart = best;
  dropsSinceLastPulse = 0;
  keyloggerDrops = 0;
  snifferBits = 0;
  pivotFrom = null;
  pivotWith = null;
  swapPicks = [];
  breached = false;
  started = mode === 'puzzle';
  heldHacks = [];
  armedHack = null;
  armedSlot = null;
  streak = 0;
  chainLit = 0;
  pulseInterval = mode === 'vs' ? BASE_INTERVAL : DIFFICULTIES[difficulty].interval(0); // (VS: both boards on the same pace)
  gameOver = false;
  busy = false;
  chainEl.textContent = '0x';
  document.querySelectorAll('#difficulty-row button').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.difficulty === classicDifficulty);
  });
  document.querySelectorAll('.hack-item').forEach((el) => {
    el.querySelector('.combo').textContent = '';
  });
  document.getElementById('overflow-top').textContent = COLS;
  document.getElementById('rules-keys').textContent = `Tap a column or its button, or press 1\u2013${COLS}, to drop`;
  document.getElementById('rules-pulse').textContent = difficulty === 'hard'
    ? `every ${BASE_INTERVAL} drops, tightening to every ${HARD_MIN_INTERVAL} as your score climbs`
    : `every ${BASE_INTERVAL} drops`;
  // (the boosters switched on for this mode, while there are any left: paid for at the first drop)
  loadArmed();
  runBoosts = new Set([...armedBoosts].filter((id) => !BOOSTERS[id].inGame && id !== 'second-chance' && boosterFits(id) && Progress.boosters(id) > 0));
  boostsSpent = false;
  secondChanceUsed = false;
  usedStarters = [];
  marketBought = [];
  marketDrops = 0;
  adware = null;
  spywareLeft = 0;
  malwareLeft = 0;
  jackLeft = 0;
  scareLeft = 0;
  demands = {};
  ransoms = {};
  Infections.clear();
  marketOpen = false;
  const taken = Progress.startersTaken();
  const open = Progress.sideSlots(); // (by level: the left at Lv 4, the right at Lv 12; one still shut shows its padlock and level)
  sideSlots = starterFits() && mode !== 'tutorial'
    ? [0, 1].map((i) => (i >= open ? { state: 'locked', id: null } : taken[i] ? { state: 'starter', id: taken[i] } : { state: 'market', id: null })) : [];
  for (const sl of sideSlots) { // (a slot taken in empty is the BLACK MARKET from the start)
    if (sl.state !== 'market') continue;
    sl.id = marketPick(sideSlots.map((x) => x.id));
    if (!sl.id) sl.state = 'closed'; // (nothing unlocked yet)
  }
  puzzleHistory = [];
  hintCol = null;
  if (runBoosts.has('head-start')) streak = Math.floor(streakCap() / 2);
  if (runBoosts.has('firewall-delay')) dropsSinceLastPulse = -4;
  if (runBoosts.has('overtime')) timeLeft += 15;
  lookaheadLeft = runBoosts.has('lookahead') ? LOOKAHEAD_MS : 0;
  updateHud();
  buildColumnButtons();
  render();
  overlayEl.classList.add('hidden');
  setMessage('');
  refreshExploitCards();
  fitBoard();
  if (mode === 'tutorial') {
    hideHome(); // (the lesson plays on the game screen)
    Tutorial.begin();
  } else Tutorial.end();
}

// A layer peeled to 0 shows the bit under it: fixed in PUZZLE boards, random otherwise.
function revealBit(layer) {
  return layer.hidden ? { type: 'number', val: layer.hidden } : newPacket();
}

// BREACH: the bottom rows start as a firewall, the same for everyone today. Layers are level 1 or 2
// and hide bits from the day's reveal stream.
function buildBreachWall() {
  const wall = seeded(hashString(`bytefall:${todayKey()}:breach-wall`));
  columns = columns.map(() => Array.from({ length: BREACH_ROWS }, () => newFirewall(wall() < 0.5 ? 1 : 2)));
}
const layersLeft = () => columns.reduce((n, c) => n + c.filter((cell) => cell && cell.type === 'firewall').length, 0);

// PUZZLE: 'L2:5' is a level 2 layer hiding a [5]; plain numbers are bits.
function loadPuzzle() {
  const puzzle = currentPuzzle();
  columns = puzzle.board.map((col) => col.map((block) => {
    if (typeof block === 'number') return { type: 'number', val: block };
    const [level, hidden] = block.slice(1).split(':').map(Number);
    return { type: 'firewall', level, hidden };
  }));
  queue = puzzle.pieces.map((val) => ({ type: 'number', val }));
}

function setPuzzle(i, tier = puzzleTier) {
  puzzleTier = tier;
  puzzleIndex = i;
  storage.set('bytefall-puzzle-tier', tier);
  storage.set(puzzleIndexKey(tier), String(i));
  SFX.play('static');
  initGame();
}

// Runs at the end of each PUZZLE turn (when the board didn't overflow).
function checkPuzzle() {
  if (daily && columns.every((c) => c.length === 0)) {
    const first = dailyOfficial;
    if (first) {
      storage.set(dailyPuzzleSolvedKey(), String(Math.max(1, dailyPuzzleTries())));
      Progress.dailyPuzzleSolved(utcWeekday(), dailyPuzzleSolvedAt());
    }
    announce(Progress.check());
    showPuzzleResult(true, first);
  } else if (daily) {
    if (!queue.length) showPuzzleResult(false);
  } else if (columns.every((c) => c.length === 0)) {
    const first = !puzzleDone(puzzleIndex);
    Progress.solvePuzzle(puzzleKey(puzzleIndex));
    announce(Progress.check());
    showPuzzleResult(true, first);
  } else if (!queue.length) {
    showPuzzleResult(false);
  }
}

// The KEYS and RESOURCES this game earned, under the score
function showRunKeys() {
  const earnedBox = document.getElementById('overlay-earned'); // (EARNED: filled once the level meter's done)
  earnedBox.hidden = true;
  earnedBox.innerHTML = '';
  const el = document.getElementById('overlay-keys');
  const n = Progress.runKeys();
  const got = Progress.runRes();
  const parts = Progress.resIds().filter((id) => got[id]).map((id) => resChip(id, `+${fmt(got[id])}`));
  el.hidden = (!n && !parts.length) || mode === 'tutorial';
  el.innerHTML = `${n ? `+${fmt(n)} KEYS // ${fmt(Progress.keys())} IN ALL` : ''}${parts.length ? `<span class="haul">${parts.join(' ')}</span>` : ''}`;
}

function showPuzzleResult(solved, firstTime = false) {
  gameOver = true;
  Infections.clear();
  busy = true;
  setMessage('');
  SFX.play(solved ? 'egg' : 'denied');
  if (!solved && !daily) Progress.puzzleFailed();
  const last = daily || puzzleIndex === tierPuzzles().length - 1;
  overlayNext = solved && !last ? 'next' : 'retry';
  document.querySelector('.overlay-box').classList.toggle('win', solved);
  document.getElementById('overlay-title').textContent = solved ? 'DECRYPTED' : 'OUT OF BITS';
  const triesLeft = DAILY_PUZZLE_TRIES - dailyPuzzleTries();
  document.getElementById('overlay-sub').textContent = daily
    ? (!dailyOfficial ? (solved ? 'Cracked (practice).' : 'Blocks are still encrypted (practice).')
      : solved ? `Today's puzzle cracked on try ${dailyPuzzleSolvedAt()} of ${DAILY_PUZZLE_TRIES}.`
      : triesLeft > 0 ? `Blocks are still encrypted. ${triesLeft} ${triesLeft === 1 ? 'try' : 'tries'} left today.`
      : `Blocks are still encrypted. That was today's last try.`)
    : solved
    ? (last && tierSolved() === tierPuzzles().length ? `Every ${tierLabel()} puzzle solved. The whole set is yours.` : `Puzzle ${puzzleIndex + 1} cracked${firstTime ? '' : ' again'}.`)
    : 'Blocks are still encrypted.';
  finalScoreEl.textContent = score;
  newBestEl.hidden = true;
  const note = document.getElementById('overlay-note');
  note.hidden = false;
  note.textContent = daily
    ? `DAILY PUZZLE // ${todayKey()} // ${WEEKDAYS[utcWeekday()]}`
    : `${tierLabel()} // PUZZLE ${puzzleIndex + 1} / ${tierPuzzles().length} // ${tierSolved()} SOLVED`;
  shareBtn.hidden = !daily; // every daily shares, win or lose
  shareBtn.textContent = 'SHARE';
  document.getElementById('overlay-restart-btn').textContent = overlayNext === 'next' ? 'NEXT PUZZLE'
    : daily && dailyOfficial && !solved && triesLeft > 0 ? 'NEXT TRY' : daily && dailyOfficial ? 'PRACTICE' : 'RETRY';
  if (!daily && !Progress.runPays()) note.textContent += ' // A REPLAY: XP AND KEYS ONCE A DAY, AGAIN TOMORROW';
  if (!daily) updatePuzzleNav();
  showRunKeys();
  refreshPuzzleTools();
  const run = runId;
  setTimeout(() => {
    if (run !== runId) return;
    overlayEl.classList.remove('hidden');
    playXpMeter(run); // (the level meter fills with the puzzle's bits)
  }, solved ? 500 : 700);
}

// (picked on PUZZLES, the menu card's page: PLAY opens it)
function updatePuzzleNav() {}

// PUZZLES (the menu card's page): the set's puzzles in pages of 25, solved ones lit and ticked,
// the next one to solve open, the rest locked until the one before is solved. A tap plays it.
const PUZZLE_PAGE = 25;
let puzzlePage = 0;
let puzzleListTier = puzzleTier;
function renderPuzzleSelect() {
  const pane = recordsEl.querySelector('.menu-pane[data-pane="puzzles"]');
  if (!pane) return;
  const list = tierPuzzles(puzzleListTier);
  const pages = Math.ceil(list.length / PUZZLE_PAGE);
  puzzlePage = Math.max(0, Math.min(pages - 1, puzzlePage));
  pane.querySelectorAll('[data-ptier-pick]').forEach((b) => b.classList.toggle('active', b.dataset.ptierPick === puzzleListTier));
  pane.querySelector('.pz-count').textContent = `${tierSolved(puzzleListTier)} / ${list.length} SOLVED`;
  const pageRow = pane.querySelector('.pz-pages');
  pageRow.innerHTML = '';
  for (let k = 0; k < pages; k++) {
    const from = k * PUZZLE_PAGE;
    const to = Math.min(list.length, from + PUZZLE_PAGE);
    const done = list.slice(from, to).filter((_, n) => puzzleDone(from + n, puzzleListTier)).length;
    const b = document.createElement('button');
    b.type = 'button';
    b.className = k === puzzlePage ? 'active' : '';
    b.innerHTML = `${from + 1}\u2013${to}<small>${done}/${to - from}</small>`;
    b.addEventListener('click', () => { puzzlePage = k; renderPuzzleSelect(); });
    pageRow.appendChild(b);
  }
  const grid = pane.querySelector('.pz-grid');
  grid.innerHTML = '';
  for (let i = puzzlePage * PUZZLE_PAGE; i < Math.min(list.length, (puzzlePage + 1) * PUZZLE_PAGE); i++) {
    const b = document.createElement('button');
    b.type = 'button';
    const done = puzzleDone(i, puzzleListTier);
    const open = puzzleOpen(i, puzzleListTier);
    b.className = `pz-tile${done ? ' done' : ''}${open && !done ? ' next' : ''}${puzzleListTier === puzzleTier && i === puzzleIndex ? ' current' : ''}`;
    b.disabled = !open;
    b.innerHTML = open ? `${i + 1}${done ? '<i>\u2713</i>' : ''}` : `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 11V8a5 5 0 0 1 10 0v3M5 11h14v10H5z" fill="none" stroke="currentColor" stroke-width="2"/></svg>`;
    b.setAttribute('aria-label', `Puzzle ${i + 1}${done ? ', solved' : open ? '' : ', locked'}`);
    b.addEventListener('click', () => {
      setRecordsOpen(false);
      setPuzzle(i, puzzleListTier);
      if (homeOpen) {
        hideHome();
        SFX.play('static');
      }
    });
    grid.appendChild(b);
  }
}
document.querySelectorAll('[data-ptier-pick]').forEach((btn) => {
  btn.addEventListener('click', () => {
    puzzleListTier = btn.dataset.ptierPick;
    puzzlePage = Math.floor((puzzleListTier === puzzleTier ? puzzleIndex : firstUnsolved(puzzleListTier)) / PUZZLE_PAGE);
    renderPuzzleSelect();
  });
});

// Size the board so the whole game panel fits the window's height (no clipping at the top or
// bottom), between MIN_BOARD and the CSS maximum.
const MIN_BOARD = 240;
const crtEl = document.querySelector('.crt');
// Phones: nudge the header so the title's capitals sit centered on the PAUSE button, as the main
// menu's title sits on its BACK arrow (each font draws its letters at a different height in the line)
const headerEl = document.querySelector('header');
const titleEl = headerEl.querySelector('h1');
const measureCtx = document.createElement('canvas').getContext('2d');
// A title in the top row shrinks (never under min px) till its letters keep 8px clear of the corner
// buttons (PAUSE, BACK): on a narrow phone they'd run into each other
function clearOfCorners(el, min) {
  el.style.fontSize = '';
  el.style.letterSpacing = '';
  const btns = [...crtEl.querySelectorAll(':scope > :is(.records-btn, .settings-btn)')].filter((b) => b.offsetWidth && getComputedStyle(b).visibility !== 'hidden');
  const range = document.createRange();
  range.selectNodeContents(el);
  const hits = () => {
    const t = range.getBoundingClientRect();
    return btns.some((b) => { const r = b.getBoundingClientRect(); return t.left < r.right + 8 && t.right > r.left - 8 && t.top < r.bottom && t.bottom > r.top; });
  };
  const size0 = parseFloat(getComputedStyle(el).fontSize);
  const ls0 = parseFloat(getComputedStyle(el).letterSpacing) || 0;
  let size = size0;
  while (hits() && size > min) { // (its letter spacing in step with it)
    size -= 0.5;
    el.style.fontSize = `${size}px`;
    el.style.letterSpacing = `${(ls0 * size / size0).toFixed(2)}px`;
  }
}
// (on the page's root, so every BYTEFALL takes it: the games', the main menu's, the PUZZLES card's and
// the music player's titles all sit at the top in one line box, so they all land exactly here)
function alignHeader() {
  titleEl.style.fontSize = '';
  titleEl.style.letterSpacing = '';
  document.documentElement.style.removeProperty('--head-nudge');
  if (!document.body.classList.contains('cards-in-settings')) return;
  const cs = getComputedStyle(titleEl);
  // (measured in COURIER: js/fonts.js puts every font's capitals where Courier's are, so the
  // header sits in the same place whatever the font)
  measureCtx.font = `${cs.fontWeight} ${cs.fontSize} 'Courier New', Courier, monospace`;
  const m = measureCtx.measureText(titleEl.textContent);
  if (!m.fontBoundingBoxAscent) return;
  const box = titleEl.getBoundingClientRect();
  const content = m.fontBoundingBoxAscent + m.fontBoundingBoxDescent;
  const baseline = box.top + (box.height - content) / 2 + m.fontBoundingBoxAscent;
  const inkMid = baseline - m.actualBoundingBoxAscent / 2; // (capitals: nothing below the line)
  // (the corner buttons' middle: every one is 8px down and 26px tall, PAUSE, BACK and the main menu's
  // BACK alike, so the title lands in one place whichever is up)
  const btnMid = crtEl.getBoundingClientRect().top + 8 + 13;
  document.documentElement.style.setProperty('--head-nudge', `${(btnMid - inkMid).toFixed(1)}px`);
  clearOfCorners(titleEl, 14);
}

const HUD_MIN_W = 300;
function fitBoard() {
  // (VS's setup card stands in the board's place until START: everything's fitted as the match will
  // have it, so the HUD over the card is the height it keeps, then the card set out at the screen's
  // width, below)
  const setupUp = document.body.classList.contains('vs-setup-up');
  document.body.classList.remove('vs-setup-up');
  layoutVsTop();
  fitStatValues(true);
  alignHeader();
  const frame = document.querySelector('.board-frame');
  const was = parseFloat(boardWrapEl.style.maxWidth) || 0;
  boardWrapEl.style.maxWidth = '';
  const cssMax = boardWrapEl.getBoundingClientRect().width;
  // (the card's contents, not the card: on phones the card fills the screen height)
  crtEl.classList.add('measuring');
  const rest = crtEl.getBoundingClientRect().height - frame.getBoundingClientRect().height;
  crtEl.classList.remove('measuring');
  const pad = parseFloat(getComputedStyle(document.body).paddingTop) * 2;
  const ratio = frame.offsetHeight / frame.offsetWidth;
  const width = Math.max(MIN_BOARD, Math.min(cssMax, (viewportHeight() - pad - rest) / ratio));
  // (what's around the board is measured at the board's last size, and some of it, the buttons
  // under it, follows its width: worked out again, it can land a pixel or two off, and every
  // switch of game type nudged it. A change that small keeps the size it has.)
  boardWrapEl.style.maxWidth = `${was && Math.abs(Math.floor(width) - was) < 3 && was <= cssMax ? was : Math.floor(width)}px`;
  // The HUD's outer edges line up with the grid card's (not in VS, which lays out its own; and
  // no narrower than its boxes need, so nothing has to shrink to fit)
  // (VS too: its strip is then laid out again at that width)
  const hudEl = document.querySelector('.hud');
  hudEl.style.width = `${Math.max(frame.getBoundingClientRect().width, HUD_MIN_W)}px`;
  if (mode === 'vs') layoutVsTop();
  // VS's setup card: the screen's width (8px in from its edges, as the main menu's card), the HUD
  // over it too, at the height it has in the match; the board's fitted again when it comes in
  if (setupUp) {
    document.body.classList.add('vs-setup-up');
    boardWrapEl.style.maxWidth = '';
    hudEl.style.width = `${Math.max(boardWrapEl.getBoundingClientRect().width, HUD_MIN_W)}px`;
    layoutVsSquares();
    fitVsStatus();
  }
  lockButtons(); // (fits the VS setup too)
}

// VS's setup card up (style.css: body.vs-setup-up): in the board's place until START, when the
// board, its drop buttons and EXPLOIT take it back
function syncVsSetup() {
  const up = mode === 'vs' && !document.getElementById('vs-setup').hidden;
  if (document.body.classList.contains('vs-setup-up') === up) return;
  document.body.classList.toggle('vs-setup-up', up);
  fitBoard();
}
// The VS setup's card: its description as tall as the longest game mode's (so picking one never moves
// the buttons under it), and the card no taller than the screen has room for under the HUD (its
// options scroll inside it then, START staying under them). Run by lockButtons, in COURIER, so it's
// the same in every font
const vsSetupBody = document.getElementById('vs-setup-body');
function vsSetupMore() {
  const b = vsSetupBody;
  b.classList.toggle('more', b.scrollHeight - b.scrollTop - b.clientHeight > 2);
}
vsSetupBody.addEventListener('scroll', vsSetupMore, { passive: true });
function fitVsSetup() {
  const el = document.getElementById('vs-setup');
  if (el.hidden) return;
  // (each note measured in a stand-in at the note's width, so the note itself never changes)
  const note = document.getElementById('vs-setup-note');
  const probe = document.createElement('p');
  probe.className = note.className;
  probe.style.cssText = `position: absolute; visibility: hidden; height: auto; width: ${note.clientWidth}px`;
  el.appendChild(probe);
  let tallest = 0;
  for (const m of Object.values(VS_MODES)) {
    probe.textContent = m.note;
    tallest = Math.max(tallest, probe.offsetHeight);
  }
  probe.remove();
  note.style.height = `${tallest}px`;
  note.style.fontSize = ''; // (its own size, then lockButtons shrinks it if a font needs that)
  el.style.maxHeight = '';
  const frame = document.querySelector('.board-frame');
  const room = crtEl.getBoundingClientRect().bottom - parseFloat(getComputedStyle(crtEl).paddingBottom)
    - document.querySelector('.message-slot').offsetHeight - frame.getBoundingClientRect().top - 2; // (the frame's borders)
  el.style.maxHeight = `${Math.max(160, Math.floor(room))}px`;
  vsSetupMore();
  showCpuDesc(); // (the play style card over the CPU's board: fitted to the new layout too)
}

// FIXED BUTTONS: the buttons sized by their text keep the size they have in COURIER whatever the
// font (js/fonts.js already keeps every font's line and letter heights), so switching fonts never
// moves or resizes them. Each is measured in Courier and its size locked; a label wider than that
// in another font closes up its letter spacing, then shrinks, until it fits. The same goes for
// the lines of text above buttons (notes, descriptions): each keeps the height it has in
// Courier, so a wider font wrapping onto another line can't push the buttons below it down.
// Re-measured when the layout changes (fitBoard), a text changes, or one comes into view.
const LOCKED_BUTTONS = '.card-back, #records-btn, .modes button, .difficulty button, #vs-layers-btn, #vs-exploits-btn, #vs-start, #pause-resume, #pause-menu, #home-play, #overlay-restart-btn, #overlay-menu-btn, #overlay-share-btn, .records-tabs button, #vs-goal, .menu-tabs button, .store-buy, .store-restore, .store-shortcut';
const LOCKED_TEXT = '#mode-info, .settings-note, .vs-setup-note, .vs-setup-msg, #overlay-note, footer p, .panel-store p';
function unfitButton(b) {
  if (!('fitLs' in b.dataset)) return;
  b.style.letterSpacing = b.dataset.fitLs;
  b.style.fontSize = b.dataset.fitFs;
  delete b.dataset.fitLs;
  delete b.dataset.fitFs;
}
function fitButtonText(b) {
  const cs = getComputedStyle(b);
  const room = b.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
  const range = document.createRange();
  range.selectNodeContents(b);
  // (in layout pixels: a panel popping in is scaled for a moment)
  const scale = b.getBoundingClientRect().width / b.offsetWidth || 1;
  const wide = () => range.getBoundingClientRect().width / scale > room + 0.5;
  if (!wide()) return;
  b.dataset.fitLs = b.style.letterSpacing;
  b.dataset.fitFs = b.style.fontSize;
  let ls = parseFloat(cs.letterSpacing) || 0;
  while (wide() && ls > 0) b.style.letterSpacing = `${(ls = Math.max(0, ls - 0.5))}px`;
  let size = parseFloat(cs.fontSize);
  while (wide() && size > 6) b.style.fontSize = `${(size -= 0.5)}px`;
}
// (a block of text: tighter, then smaller, until it fits the height it has in Courier)
function fitBlockText(t) {
  const tall = () => t.scrollHeight > t.clientHeight + 1;
  if (!tall()) return;
  const cs = getComputedStyle(t);
  t.dataset.fitLs = t.style.letterSpacing;
  t.dataset.fitFs = t.style.fontSize;
  let ls = parseFloat(cs.letterSpacing) || 0;
  while (tall() && ls > 0) t.style.letterSpacing = `${(ls = Math.max(0, ls - 0.5))}px`;
  let size = parseFloat(cs.fontSize);
  while (tall() && size > 6) t.style.fontSize = `${(size -= 0.5)}px`;
}
function lockButtons() {
  // (not the main menu's: its boxes are set sizes of their own, their words fitted by fitHome)
  const shown = (el) => el.getClientRects().length && (!el.closest('#home') || el.id === 'home-back'); // (its ← BACK locked as every BACK is)
  const btns = [...document.querySelectorAll(LOCKED_BUTTONS)].filter(shown);
  const texts = [...document.querySelectorAll(LOCKED_TEXT)].filter(shown);
  for (const b of [...btns, ...texts]) {
    unfitButton(b);
    b.style.width = b.style.height = b.style.minWidth = b.style.maxWidth = '';
    b.classList.add('ref-font');
  }
  fitVsSetup(); // (its rows decided in Courier too)
  // (layout sizes, not getBoundingClientRect: a panel popping in is scaled for a moment)
  const px = (el, side) => parseFloat(getComputedStyle(el)[side]);
  const sizes = btns.map((b) => [px(b, 'width'), px(b, 'height')]);
  const heights = texts.map((t) => px(t, 'height'));
  btns.forEach((b, i) => {
    // (min and max too: a min-width in ch, say, is the font's own and would win)
    b.style.width = b.style.minWidth = b.style.maxWidth = `${sizes[i][0]}px`;
    b.style.height = `${sizes[i][1]}px`;
    b.classList.remove('ref-font');
  });
  texts.forEach((t, i) => {
    t.style.height = `${heights[i]}px`;
    t.classList.remove('ref-font');
  });
  btns.forEach(fitButtonText);
  texts.forEach(fitBlockText);
}
{
  let queued = false;
  const relock = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; lockButtons(); });
  };
  const seen = window.IntersectionObserver && new IntersectionObserver((entries) => { if (entries.some((e) => e.isIntersecting)) relock(); });
  const text = new MutationObserver(relock);
  document.querySelectorAll(`${LOCKED_BUTTONS}, ${LOCKED_TEXT}`).forEach((b) => {
    if (seen) seen.observe(b);
    text.observe(b, { childList: true, characterData: true, subtree: true });
  });
  if (document.fonts) document.fonts.addEventListener('loadingdone', relock);
}

// The screen's real size. The installed app on Android can report a stale height at launch (and
// fires no resize when it settles), so the page sets its own height (--app-h, used instead of
// 100dvh) from the smallest of the browser's measures, and re-checks it on every viewport event
// plus a cheap poll, refitting the board whenever anything changed.
// THE AD STRIP: room kept at the top of the screen for the Android app's banner ad (js/ads.js), which
// Android draws over the page, not in it. The game's height leaves the strip out, so everything fits
// below it (the body becomes the frame for fixed layers too). Its height is the banner's own, as it
// reports it (0 till one has loaded, and once ads are removed).
// Dev: AD BANNER PREVIEW (dev tools: OFF by default, then 50 / 60 / 90px; or ?adpreview=60) holds
// a gray strip there on the web, at the top (or bottom), the size a phone's banner would be. Re-read
// on coming back from the dev page, so it changes without a reload.
// (its class names never say "ad": ad blockers hide anything named like .ad-top, and on the
// root element that blanks the whole page)
let adPreviewH = 0; // (the strip's height, the banner's or the preview's)
let adBannerH = 0; // (the real banner's: js/ads.js, through window.setAdStrip)
let adPreviewBar = null;
function applyAdPreview() {
  const param = new URLSearchParams(location.search).get('adpreview');
  const flag = storage.get('bytefall-dev-adpreview');
  const h = param !== null ? parseInt(param, 10) || 50 : flag === 'on' ? 50 : parseInt(flag, 10) || 0;
  const real = adBannerH > 0;
  adPreviewH = real ? adBannerH : [50, 60, 90].includes(h) ? h : 0;
  document.documentElement.classList.toggle('strip-preview', adPreviewH > 0);
  // (at the top of the screen by default; AD BANNER SPOT in dev tools, or ?adpos=bottom; a real
  // banner's always at the top, well away from the drop buttons)
  const pos = real ? 'top' : new URLSearchParams(location.search).get('adpos') || storage.get('bytefall-dev-adpos');
  document.documentElement.classList.toggle('strip-top', adPreviewH > 0 && pos !== 'bottom');
  document.documentElement.style.setProperty('--strip-h', `${adPreviewH}px`);
  if (adPreviewH && !real && !adPreviewBar) {
    adPreviewBar = document.createElement('div');
    adPreviewBar.className = 'strip-preview-bar';
    adPreviewBar.setAttribute('aria-hidden', 'true');
    document.body.append(adPreviewBar);
  }
  if (adPreviewBar) {
    adPreviewBar.hidden = !adPreviewH || real; // (the gray stand-in: not under a real one)
    adPreviewBar.textContent = `AD BANNER // ${adPreviewH}PX`;
  }
}
// (the real banner's height, in CSS pixels: Android's dp, which the page's pixels are; 0 for none)
window.setAdStrip = (h) => {
  const next = Math.max(0, Math.round(Number(h) || 0));
  if (next === adBannerH) return;
  adBannerH = next;
  applyAdPreview();
  checkViewport(false);
};
applyAdPreview();
window.addEventListener('pageshow', applyAdPreview);
window.addEventListener('focus', () => { applyAdPreview(); checkViewport(false); });
function viewportHeight() {
  const vv = window.visualViewport;
  const heights = [document.documentElement.clientHeight];
  // (zoomed in, innerHeight and the visual viewport shrink with the zoom: use the page's size)
  if (vv) heights.push(vv.height * vv.scale);
  if (!vv || Math.abs(vv.scale - 1) < 0.01) heights.push(window.innerHeight);
  return Math.floor(Math.min(...heights.filter((h) => h > 0))) - adPreviewH;
}
let viewportKey = '';
function checkViewport(force) {
  const h = viewportHeight();
  const key = `${document.documentElement.clientWidth}x${h}`;
  if (!force && key === viewportKey) return;
  viewportKey = key;
  document.documentElement.style.setProperty('--app-h', `${h}px`);
  fitBoard();
}
const refit = () => checkViewport(true);
window.addEventListener('resize', refit);
window.addEventListener('orientationchange', () => setTimeout(refit, 250));
window.addEventListener('pageshow', refit);
window.addEventListener('load', refit);
document.addEventListener('visibilitychange', () => document.hidden || refit());
if (window.visualViewport) window.visualViewport.addEventListener('resize', refit);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(refit);
setInterval(() => document.hidden || checkViewport(false), 500);

function buildColumnButtons() {
  columnButtonsEl.innerHTML = '';
  for (let c = 0; c < COLS; c++) {
    const btn = document.createElement('button');
    btn.textContent = c + 1;
    btn.addEventListener('click', () => attemptDrop(c));
    columnButtonsEl.appendChild(btn);
  }
}

function updateColumnButtons() {
  updateFreeBtn();
  // (PIVOT's choice: the picked column and the two it can swap with light up the grid too, not only their buttons)
  boardEl.querySelectorAll('.cell[data-pos]').forEach((cell) => {
    const c = Number(cell.dataset.pos.split(',')[1]);
    cell.classList.toggle('pivot-col-from', pivotFrom !== null && c === pivotFrom);
    cell.classList.toggle('pivot-col-target', pivotFrom !== null && Math.abs(c - pivotFrom) === 1);
  });
  if (dropCtlReady) applyDropControls(); // (the tutorial takes both)
  const buttons = columnButtonsEl.querySelectorAll('button');
  buttons.forEach((btn, c) => {
    const target = pivotFrom !== null && Math.abs(c - pivotFrom) === 1;
    // While PIVOT waits for a side, only the two neighbors can be pressed: the choice is committed
    btn.disabled = gameOver || busy || vsPaused || (pivotFrom !== null ? !target : columns[c].length >= MAX_ROWS); // (paused: off, dimmed, till RESUME)
    btn.classList.toggle('pivot-from', c === pivotFrom);
    btn.classList.toggle('pivot-target', target);
    btn.classList.toggle('tut-off', mode === 'tutorial' && !Tutorial.allows(c)); // (dimmed: not this lesson's column)
    btn.textContent = target ? (c < pivotFrom ? '\u2190' : '\u2192') : String(c + 1);
    // (ADWARE: a pop-up over one button; its column takes no drop at all, attemptDrop)
    const ad = !!adware && adware.col === c && pivotFrom === null;
    btn.classList.toggle('adware', ad);
    if (ad) { btn.disabled = true; btn.innerHTML = typeof LedBanner !== 'undefined' ? LedBanner.iconSvg() : 'AD'; btn.setAttribute('aria-label', 'Blocked by an ad'); } else btn.removeAttribute('aria-label');
  });
}

// GLYPH theme: each number is a shape with that many corners (1 is a teardrop pointing up,
// 2 a lens), in a 100x100 box.
const GLYPHS = {
  1: '<path d="M50 12 L72.21 48.48 A26 26 0 1 1 27.79 48.48 Z"/>',
  2: '<path d="M50 12 Q90 52 50 92 Q10 52 50 12 Z"/>',
  3: '<polygon points="50.0,14.0 84.6,74.0 15.4,74.0"/>',
  4: '<polygon points="78.3,25.7 78.3,82.3 21.7,82.3 21.7,25.7"/>',
  5: '<polygon points="50.0,14.0 88.0,41.6 73.5,86.4 26.5,86.4 12.0,41.6"/>',
  6: '<polygon points="50.0,14.0 84.6,34.0 84.6,74.0 50.0,94.0 15.4,74.0 15.4,34.0"/>',
  7: '<polygon points="50.0,14.0 81.3,29.1 89.0,62.9 67.4,90.0 32.6,90.0 11.0,62.9 18.7,29.1"/>',
  8: '<polygon points="65.3,17.0 87.0,38.7 87.0,69.3 65.3,91.0 34.7,91.0 13.0,69.3 13.0,38.7 34.7,17.0"/>',
};
const themeIs = (id) => document.documentElement.dataset.theme === id;
const glyphSvg = (n) => `<svg class="glyph" viewBox="0 0 100 100" aria-hidden="true">${GLYPHS[n]}</svg>`;

// A bit's cell content: [n], or its glyph with a small number under GLYPH.
function fillBit(el, val) {
  if (themeIs('glyph')) {
    el.innerHTML = `${glyphSvg(val)}<span class="glyph-num">${val}</span>`;
    el.classList.add('has-glyph');
    el.setAttribute('aria-label', String(val));
  } else {
    el.textContent = `[${val}]`;
    el.classList.remove('has-glyph');
    el.removeAttribute('aria-label');
  }
}

// SPECTRUM: each bit keeps its own random hue speed, direction and phase across re-renders,
// measured from a shared clock so the cycle carries on smoothly when the board redraws.
function spinBit(el, cell) {
  if (!themeIs('spectrum')) return;
  if (!cell.spin) cell.spin = { dur: 3 + Math.random() * 7, phase: Math.random(), reverse: Math.random() < 0.5 };
  const { dur, phase, reverse } = cell.spin;
  const t = performance.now() / 1000 / dur + phase;
  el.style.setProperty('--spin', `${dur.toFixed(2)}s`);
  el.style.setProperty('--spin-delay', `${(-(t % 1) * dur).toFixed(2)}s`);
  el.style.setProperty('--spin-dir', reverse ? 'reverse' : 'normal');
  el.style.setProperty('--bit-h', String(Math.round(phase * 360))); // still hue under reduced motion
}

// Exploit icons are text, except where a phone could turn the character into an emoji: those
// are drawn as SVG (BITFLIP's up/down arrow). iconHtml() is for places that render markup.
const ICON_SVG = {
  bitflip: '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v18M7 8l5-5 5 5M7 16l5 5 5-5"/></svg>',
  // (two arrows trading places)
  swap: '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h14M14 4l4 4-4 4M20 16H6M10 12l-4 4 4 4"/></svg>',
  // (a closed box with a question mark)
  'black-box': '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h16v16H4z"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.5V14M12 17.5v.5"/></svg>',
};
const iconHtml = (id) => ICON_SVG[id] || HACKS[id].icon;
// (the EXPLOITS menu's cards: each icon in brackets, [!], as in the STORE)
document.querySelectorAll('.hack-item[data-hack]').forEach((el) => {
  const icon = el.querySelector('h3 .icon');
  if (icon && HACKS[el.dataset.hack]) icon.innerHTML = `<span class="ico-br">[</span>${iconHtml(el.dataset.hack)}<span class="ico-br">]</span>`;
});
const UPDOWN_SVG = ICON_SVG.bitflip;

// A bit in a HUD square: its number (or glyph); an exploit shows its icon
function showPiece(el, piece) {
  if (piece.type === 'number') {
    fillBit(el, piece.val);
    // CURRENT shows the bit as [n] (in VS without its box); the NEXT preview shows just the number
    if (!themeIs('glyph')) el.textContent = el === currentEl ? `[${piece.val}]` : String(piece.val);
  } else {
    el.innerHTML = iconHtml(piece.id);
  }
  el.classList.toggle('hack', piece.type === 'hack');
  el.title = piece.type === 'hack' ? HACKS[piece.id].name : '';
}

function buildGrid() {
  // grid[row][col], row 0 = bottom, MAX_ROWS-1 = overflow row
  const grid = Array.from({ length: MAX_ROWS }, () => Array(COLS).fill(null));
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r < columns[c].length; r++) {
      grid[r][c] = columns[c][r];
    }
  }
  return grid;
}

// The ==== line under a board, where encryption layers rise from: flashing amber when the next
// drop brings one
function layerLine(next) {
  const line = document.createElement('div');
  line.className = next ? 'layer-line next' : 'layer-line';
  line.textContent = '='.repeat(80);
  return line;
}

function render(popped = [], falling = null) {
  boardEl.innerHTML = '';
  const grid = buildGrid();
  if (falling) grid[falling.row][falling.col] = falling.cell;
  for (let r = MAX_ROWS - 1; r >= 0; r--) {
    for (let c = 0; c < COLS; c++) {
      const cell = grid[r][c];
      const div = document.createElement('div');
      div.className = 'cell';
      div.dataset.pos = `${r},${c}`;
      if (r >= ROWS) div.classList.add('overflow');
      // (SWAP armed: the bits it can pick, and the one picked)
      if (cell && cell.type === 'number' && swapArmed() && !falling) {
        div.classList.add('swap-target');
        if (swapPicks.some((p) => p.r === r && p.c === c)) div.classList.add('swap-pick');
      }
      if (cell) {
        const lockShows = cell.locked && !(malwareLeft > 0 && malwareAt > (cell.lockAt || 0)); // (MALWARE after the lock: its spoiling covers it)
        if (cell.type === 'number' && cell.locked && lockShows) { // (RANSOMWARE: locked where it is, its little screen and padlock)
          div.classList.add('disc', 'ransom');
          div.innerHTML = Infections.ransomHtml(cell.val, cell.ransom || 0, cell.lockLook || 0);
          div.title = `RANSOMWARE: ${cell.ransom || 0} KEYS to free it (tap to pay), or locked ${cell.locked} more drop${cell.locked === 1 ? '' : 's'}`;
        } else if (cell.type === 'number' && malwareLeft > 0) { // (MALWARE: the bits shown as junk)
          div.classList.add('disc', 'corrupt');
          div.innerHTML = Infections.glitch(3, r, c);
        } else if (cell.type === 'number') {
          div.classList.add('disc');
          fillBit(div, cell.val);
          spinBit(div, cell);
        } else if (cell.type === 'hack') {
          div.classList.add('hack');
          div.innerHTML = `[${iconHtml(cell.id)}]`;
        } else if (cell.type === 'bomb') {
          div.classList.add('hack', 'armed', 'bomb');
          div.textContent = `[!${cell.timer}]`;
          div.title = `LOGIC BOMB: detonates in ${cell.timer} drop${cell.timer === 1 ? '' : 's'}`;
        } else if (cell.type === 'honeypot') {
          div.classList.add('hack', 'armed');
          div.textContent = `[${HACKS.honeypot.icon}]`;
          div.title = 'HONEYPOT: waiting for a bit beside it to decrypt';
        } else {
          div.classList.add('firewall');
          if (cell.level < 2) div.classList.add('cracked');
          div.textContent = cell.level < 2 ? '[-]' : '[=]';
        }
      }
      if (!cell && malwareLeft > 0 && !gameOver && Infections.mosaicOn()) { // (MALWARE's big picture: the empty spots show their piece too, in the grid's colors)
        div.classList.add('mosaic-empty');
        div.innerHTML = Infections.glitch(3, r, c, true);
      }
      if (popped.some((p) => p.row === r && p.col === c)) {
        div.classList.add('pop');
      }
      boardEl.appendChild(div);
    }
    if (r === ROWS) {
      const line = document.createElement('div');
      // Glows red while any stack is right under the line
      line.className = columns.some((c) => c.length >= ROWS) ? 'overflow-line hot' : 'overflow-line';
      line.textContent = '='.repeat(80);
      boardEl.appendChild(line);
    }
  }
  const layerNext = !gameOver && !MODES[mode].noLayers && pulseInterval - dropsSinceLastPulse === 1;
  boardEl.appendChild(layerLine(layerNext));
  document.getElementById('pulse-stat').classList.toggle('layer-next', layerNext); // (its ===== flashes with the line's)
  updateColumnButtons();
  if (mode === 'tutorial') Tutorial.decorate(); // (its pulsing cells, redrawn with the board)
  if (typeof placeGhost === 'function') placeGhost(); // (a bit being aimed stays in the top row)
  if (typeof placeChainMeter === 'function') placeChainMeter();
  Infections.place({ adCol: adware && !gameOver ? adware.col : null, jack: jackLeft > 0 && !gameOver, rows: ROWS, maxRows: MAX_ROWS, cols: COLS }); // (their displays, over the bits)
  updateInfBadge();
  // PIVOT waiting for a side: arrows in the top row over the two neighbors (as on the buttons)
  if (pivotFrom !== null) {
    for (const c of [pivotFrom - 1, pivotFrom + 1]) {
      const cell = c >= 0 && c < COLS && boardEl.querySelector(`.cell[data-pos="${MAX_ROWS - 1},${c}"]`);
      if (cell && !cell.textContent) { cell.textContent = c < pivotFrom ? '\u2190' : '\u2192'; cell.classList.add('pivot-arrow'); }
    }
  }
  Music.setIntensity(dangerLevel());
}

// The last three stack heights under the line: on 7x7, 33% at 4, 67% at 5 and full from 6
// (one higher each on Hard's 8x8).
function dangerLevel() {
  const tallest = Math.max(...columns.map((c) => c.length));
  return (tallest - (ROWS - 4)) / 3;
}

// A HUD number (or a label's word) too long for its box shrinks until it fits. Each is fitted
// again only when its text (or the theme or font) changed since it was last fitted, or the layout
// did (fitBoard: force); and all the sizes are put back before any is measured, so the page lays
// out once for the lot, not once for each (this runs on every HUD update)
const statFits = new WeakMap(); // (each box: what it was last fitted showing)
function fitStatValues(force = false) {
  const labels = [...document.querySelectorAll('.hud .stat:not(.cpu-stat) .label')];
  // (and the CURRENT / NEXT bits: "[5]" in a wide font can outgrow its square)
  const bits = [...document.querySelectorAll('.hud .bit-sq')];
  const root = document.documentElement;
  const look = `|${root.dataset.theme || ''}|${root.dataset.font || ''}`;
  const els = [scoreEl, bestEl, chainEl, pulseCounterEl, ...bits, ...labels].filter((el) => force || statFits.get(el) !== el.textContent + look);
  if (!els.length) return;
  for (const el of els) {
    el.style.fontSize = '';
    el.style.whiteSpace = '';
  }
  const labelMin = parseFloat(getComputedStyle(root).getPropertyValue('--label-min')) || 7;
  const over = els.filter((el) => {
    if (!el.offsetParent) { statFits.delete(el); return false; } // (hidden: fitted when it shows)
    statFits.set(el, el.textContent + look);
    return el.scrollWidth > el.clientWidth;
  });
  for (const el of over) {
    const label = el.classList.contains('label');
    let size = parseFloat(getComputedStyle(el).fontSize);
    // (labels no smaller than the font's readable floor, --label-min: past that they wrap instead)
    while (el.scrollWidth > el.clientWidth && size > (label ? labelMin : 8)) {
      size -= label ? 0.5 : 1;
      el.style.fontSize = `${size}px`;
    }
    if (label && el.scrollWidth > el.clientWidth) el.style.whiteSpace = 'normal';
  }
}

function updateHud() {
  if (mode === 'vs') updateVsBar();
  if (score > best && bestKey()) {
    best = score;
    storage.set(bestKey(), String(best));
  }
  // (VS modes on points: the match points, with this drop's points counting up as they come)
  scoreEl.textContent = mode === 'vs' && vsMode !== 'classic' && cpu
    ? matchPoints(vsMe, vsThem, score - vsCounted, 0)[0] : score;
  bestEl.textContent = best;
  // VS before START: the first bit stays hidden, so a refresh or an option change can't be
  // used to fish for a good one
  if (mode === 'vs' && !vsStarted) {
    currentEl.textContent = '[?]';
    currentEl.classList.remove('hack', 'has-glyph');
    currentEl.removeAttribute('aria-label');
    currentEl.title = '';
  } else if (queue[0]) {
    showPiece(currentEl, queue[0]);
    if (spyHides(0) && queue[0].type === 'number') { currentEl.innerHTML = Infections.eyes(); currentEl.classList.remove('has-glyph'); } // (SPYWARE: eyes watching where it should be)
  } else {
    currentEl.textContent = '';
    currentEl.classList.remove('hack');
  }
  // Easy previews the next bit; an active keylogger shows the next three; PUZZLE shows what's left.
  const preview = mode === 'puzzle' ? Math.min(KEYLOGGER_PREVIEW, Math.max(0, queue.length - 1))
    : keyloggerDrops > 0 ? KEYLOGGER_PREVIEW : DIFFICULTIES[difficulty].showNext || lookaheadLeft > 0 ? 1 : 0;
  nextStatEl.hidden = !preview;
  nextLabelEl.textContent = keyloggerDrops > 0 ? `KEYLOG ${keyloggerDrops}` : 'NEXT';
  nextStatEl.classList.toggle('keylogger', keyloggerDrops > 0);
  const hudBits = document.getElementById('hud-bits');
  if (hudBits.classList.contains('has-next') !== !!preview) {
    hudBits.classList.toggle('has-next', !!preview);
    requestAnimationFrame(fitBoard); // the HUD may wrap differently now
  }
  nextEl.innerHTML = '';
  queue.slice(1, 1 + preview).forEach((piece, n) => {
    const sq = document.createElement('div');
    sq.className = 'bit-sq';
    showPiece(sq, piece);
    if (spyHides(n + 1) && piece.type === 'number') { sq.textContent = '?'; sq.classList.remove('has-glyph'); } // (SPYWARE)
    nextEl.appendChild(sq);
  });
  pulseCounterEl.textContent = mode === 'puzzle' ? queue.length : mode === 'breach' ? layersLeft() : mode === 'vs' && !vsLayers ? '-' : pulseInterval - dropsSinceLastPulse;
  if (dealLimit() < Infinity) showClock();
  const layerNext = !gameOver && !MODES[mode].noLayers && pulseInterval - dropsSinceLastPulse === 1;
  pulseCounterEl.closest('.stat').classList.toggle('danger', layerNext);
  const layerLineEl = boardEl.querySelector('.layer-line');
  if (layerLineEl) layerLineEl.classList.toggle('next', layerNext);
  if (pivotFrom !== null && !(queue[0] && queue[0].id === 'pivot')) clearPivotChoice();
  const sniffing = snifferBits > 0 && queue[0] && queue[0].type === 'number';
  currentEl.closest('.stat').classList.toggle('sniffing', !!sniffing);
  document.getElementById('current-label').innerHTML = sniffing ? `SNIFF ${snifferBits} ${UPDOWN_SVG}` : 'CURRENT';
  currentEl.title = sniffing ? 'Tap (or press up / down) to change this bit' : '';
  const heldHack = queue[0] && queue[0].type === 'hack' ? queue[0].id : null;
  document.querySelectorAll('.hack-item').forEach((el) => {
    el.classList.toggle('held', el.dataset.hack === heldHack);
  });
  fitStatValues(); // (after the labels and numbers above have changed)
  refreshPuzzleTools();
}

function setMessage(text, tone = '') {
  messageEl.textContent = text;
  fitText(messageEl); // (its box is one size; a long one's words shrink)
  messageEl.classList.toggle('hidden', !text);
  messageEl.classList.remove('warn', 'alarm', 'byte');
  if (tone) messageEl.classList.add(tone);
}

// Burst the message's text into particles (the text itself, not the full-width box)
function burstMessage(type) {
  const range = document.createRange();
  range.selectNodeContents(messageEl);
  FX.burst([{ rect: range.getBoundingClientRect(), type }]);
}

// PIVOT: a middle column asks which neighbor to swap with (second tap, or the arrow keys).
// Once picked, the player is committed: only the two neighbors are accepted.
function choosePivot(col) {
  pivotFrom = col;
  setMessage(`PIVOT // SWAP COLUMN ${col + 1} WITH \u2190 ${col} OR ${col + 2} \u2192`);
  SFX.play('click');
  render(); // (the buttons and the top row's arrows)
}
function clearPivotChoice() {
  if (pivotFrom === null) return;
  pivotFrom = null;
  setMessage('');
  if (busy) updateColumnButtons(); // (mid-drop the board is the drop's to draw)
  else render();
}

async function attemptDrop(col) {
  if (gameOver || busy || !queue.length || vsPaused || homeOpen || shopSlot !== null) return;
  if (mode === 'tutorial' && !Tutorial.canDrop(col)) return; // (only where the lesson says)
  // ADWARE: its column takes nothing till the pop-up goes, from the button, the grid or the keys
  // (with every other column full, the pop-up gives way)
  if (adware && adware.col === col && pivotFrom === null) {
    if (columns.some((c, n) => n !== col && c.length < MAX_ROWS)) {
      setMessage(`${ANTI.adware.name} // COLUMN ${col + 1} BLOCKED FOR ${adware.left} MORE DROP${adware.left === 1 ? '' : 'S'}`, 'alarm');
      SFX.play('denied');
      const btn = columnButtonsEl.querySelectorAll('button')[col];
      if (btn) { btn.classList.remove('ad-shake'); void btn.offsetWidth; btn.classList.add('ad-shake'); }
      return;
    }
    adware = null;
  }
  // SWAP: it drops once two bits are picked on the grid (with fewer than two on the board, it
  // drops and does nothing)
  if (swapArmed() && swapPicks.length < 2 && numberCells().length >= 2) {
    setMessage('SWAP // TAP TWO BITS ON THE GRID');
    SFX.play('denied');
    return;
  }
  if (queue[0].type === 'hack' && queue[0].id === 'pivot') {
    if (pivotFrom !== null) {
      if (Math.abs(col - pivotFrom) !== 1) {
        SFX.play('denied');
        return;
      }
      pivotWith = col; // the second tap: drop into the picked column, swap with this one
      col = pivotFrom;
      clearPivotChoice();
    } else if (col === 0 || col === COLS - 1) {
      clearPivotChoice();
      pivotWith = col === 0 ? 1 : COLS - 2; // edges have only one neighbor
    } else {
      choosePivot(col);
      return;
    }
  }
  if (mode === 'vs' && !vsStarted) {
    SFX.play('denied');
    return;
  }
  if (columns[col].length >= MAX_ROWS) {
    pivotWith = null;
    SFX.play('denied');
    return;
  }

  if (mode === 'puzzle' && !daily) puzzleHistory.push(JSON.stringify({ columns, queue, score })); // (for UNDO)
  showHint(null);
  busy = true;
  chainEl.textContent = '0x';
  setMessage('');
  const piecesBefore = columns.reduce((n, c) => n + c.length, 0);
  const scoreBefore = score;
  const resBefore = Progress.runRes();
  chainLog = []; // (what this drop decrypts, link by link, for the tutorial's explanations)
  dropLinks = 0;
  const piece = queue.shift();
  if (piece.type === 'hack') {
    armedHack = null;
    if (armedSlot !== null) { // (dropped: its side slot opens to the market now)
      const sl = sideSlots[armedSlot];
      armedSlot = null;
      if (sl && sl.state === 'armed') slotSpent(sl, sl.id);
      renderStarters();
    }
  }
  refillQueue();
  if (keyloggerDrops > 0) keyloggerDrops--;
  const sniffedOut = snifferBits === 1 && piece.type === 'number'; // the Packet Sniffer's last bit
  if (snifferBits > 0 && piece.type === 'number') snifferBits--;
  if (spywareLeft > 0 && piece.type === 'number') spywareLeft--;
  if (adware && --adware.left <= 0) adware = null;
  updateHud();
  const landing = columns[col].length;
  for (let r = MAX_ROWS - 1; r > landing; r--) {
    render([], { row: r, col, cell: piece });
    SFX.play('click', fallPitch());
    await sleep(STEP_MS);
  }
  columns[col].push(piece);
  if (daily && dailyOfficial) storage.set(dailyPlayedKey(), '1'); // this is today's official run
  if (daily && mode === 'puzzle' && Progress.runDrops() === 0) {
    if (dailyOfficial) storage.set(dailyPuzzleTriesKey(), String(dailyPuzzleTries() + 1));
    const attempts = (Number(storage.get(dailyPuzzleAttemptsKey())) || 0) + 1;
    storage.set(dailyPuzzleAttemptsKey(), String(attempts));
    if (attempts >= 10) Progress.secret('stubborn');
  }
  Progress.drop();
  started = true;
  if (!boostsSpent && runBoosts.size) { // (the game's boosters, paid for now it's under way)
    boostsSpent = true;
    runBoosts.forEach((id) => Progress.useBooster(id));
  }
  if (Progress.runDrops() === 1) refreshExploitCards(); // the loadout locks for this session
  if (mode === 'blitz') clockRunning = true;
  let wentOver = overflowed();
  render();
  SFX.play('enter');
  await sleep(60);

  if (piece.type === 'hack') await runHack(piece.id, landing, col);
  await resolveChains();
  await tickBombs();
  marketTick();

  if (!overflowed() && !MODES[mode].noLayers) {
    dropsSinceLastPulse++;
    if (dropsSinceLastPulse >= pulseInterval) {
      dropsSinceLastPulse = 0;
      await injectPulse();
      openMarket(); // (the first layer: the BLACK MARKET opens)
      wentOver = wentOver || overflowed();
      await resolveChains();
      pulseInterval = mode === 'vs' ? BASE_INTERVAL : DIFFICULTIES[difficulty].interval(score);
    }
  }

  if (mode === 'breach' && !overflowed() && columns.every((c) => c.length === 0)) {
    score += BREACH_CLEAR_BONUS;
    breached = true;
    Progress.breached();
  }
  if (!overflowed()) {
    if (wentOver) Progress.closeCall();
    if (piecesBefore >= 5 && Progress.runDrops() >= 10 && columns.every((c) => c.length === 0)) Progress.sweep();
    if (sniffedOut) Progress.wiretap();
  }
  if (mode === 'vs' && !overflowed()) await vsAfterDrop(score - scoreBefore);
  endStreakDrop(piece.type === 'hack');
  if (jackLeft > 0) { // (the CRYPTOJACKER: what this drop earned, taken)
    const now = Progress.runRes();
    const taken = {};
    for (const id of Progress.resIds()) if ((now[id] || 0) > (resBefore[id] || 0)) taken[id] = now[id] - (resBefore[id] || 0);
    const n = Object.values(taken).reduce((a, b) => a + b, 0);
    if (n) { Progress.siphon(taken); Infections.steal(n); setMessage(`CRYPTOJACKER // ${n} STOLEN`, 'alarm'); }
    jackLeft--;
  }
  await tickInfections();
  showPickup(resBefore);
  Progress.endDrop({
    hack: piece.type === 'hack', heights: columns.map((c) => c.length), rows: ROWS, over: overflowed(),
    lastSecond: mode === 'blitz' && timeLeft <= 1,
  });
  finishTurn();
}

function finishTurn() {
  updateHud();
  busy = false;
  render();
  Progress.score(score);
  Progress.addPoints(score - reportedScore);
  reportedScore = score;
  announce(Progress.check());
  if (overflowed()) secondChance();
  if (overflowed()) endGame();
  else if (timeUp) endGame('time');
  else if (vsLost) endGame('vs-lose');
  else if (cpuDown) endGame('win');
  else if (mode === 'tutorial') Tutorial.afterDrop();
  else if (breached) endGame('breached');
  else if (dealLimit() < Infinity && !queue.length) endGame('daily');
  else if (mode === 'puzzle') checkPuzzle();
  // One drop until a firewall row: warn until the player drops (unless a hack message is showing)
  else if (!MODES[mode].noLayers && pulseInterval - dropsSinceLastPulse === 1 && messageEl.classList.contains('hidden')) {
    setMessage('ENCRYPTION // NEW LAYER NEXT DROP', 'warn');
  }
  if (pauseQueued) openPause(); // (PAUSE pressed mid-drop; not once the run has ended)
}

function overflowed() {
  return columns.some((c) => c.length > ROWS);
}

async function injectPulse() {
  setMessage('ENCRYPTION // NEW LAYER', 'alarm');
  SFX.play('alert');
  await sleep(800);
  for (const col of columns) col.unshift(newFirewall());
  render();
  await sleep(200);
  burstMessage('warning');
  setMessage('');
  await sleep(150);
}

// Drops everything above each gap by one row per frame so falls read block by block.
// One step of falling in a column: the lowest gap with something above it that can fall (up to the
// next RANSOMWARE-locked bit, which hangs where it was locked) closes by one. False: nothing moves
function fallStep(col) {
  for (let i = 0; i < col.length; i++) {
    if (col[i] !== null) continue;
    let end = i + 1;
    while (end < col.length && !(col[end] && col[end].locked)) end++;
    let any = false;
    for (let k = i + 1; k < end; k++) if (col[k]) { any = true; break; }
    if (!any) continue;
    for (let k = i; k < end - 1; k++) col[k] = col[k + 1];
    col[end - 1] = null;
    return true;
  }
  return false;
}
async function collapse() {
  while (true) {
    for (const col of columns) {
      while (col.length && col[col.length - 1] === null) col.pop();
    }
    let moved = false;
    for (const col of columns) if (fallStep(col)) moved = true;
    if (!moved) break;
    render();
    SFX.play('click', fallPitch());
    await sleep(STEP_MS);
  }
  render();
}
// A falling bit's ticks wander up and down in pitch, a little, as the tutorial BOT's voice does
// (its blips anywhere in about 17% either side)
function fallPitch() { return 0.85 + Math.random() * 0.32; }

function computeRunLength(grid, row, col, dRow, dCol) {
  let count = 1;
  let r = row + dRow;
  let c = col + dCol;
  while (r >= 0 && r < MAX_ROWS && c >= 0 && c < COLS && grid[r][c]) {
    count++;
    r += dRow;
    c += dCol;
  }
  r = row - dRow;
  c = col - dCol;
  while (r >= 0 && r < MAX_ROWS && c >= 0 && c < COLS && grid[r][c]) {
    count++;
    r -= dRow;
    c -= dCol;
  }
  return count;
}

// A full chain meter's exploit: one of the equipped ones, at random
function hackForMeter() {
  if (mode === 'tutorial') return 'worm-virus'; // (the tutorial's: the one it goes on to teach)
  const ids = Object.keys(HACKS).filter(hackAvailable);
  return ids.length ? ids[Math.floor(dice.hack() * ids.length)] : null;
}

// Hard: 8 bits decrypted by one drop make a byte. Easy and Normal: 4 make a nibble.
async function awardPackets(kind, count) {
  const packet = PACKETS[kind];
  chainLog.push({ packet: packet.name, count, points: count * packet.bonus });
  score += count * packet.bonus;
  stealPts += count * packet.bonus;
  if (kind === 'byte') Progress.bytes(count);
  else Progress.nibbles(count);
  updateHud();
  setMessage(`${count > 1 ? `${count} ${packet.plural}` : packet.name} DECRYPTED // +${count * packet.bonus}`, 'byte');
  SFX.play('egg');
  await sleep(900);
  burstMessage('number');
  setMessage('');
  await sleep(150);
}

// An earned exploit waits in the exploit button until the player arms it: EXPLOIT READY on the notice
// line for a moment, and the button pulses until it's used
function awardHack(id) {
  heldHacks.push(id);
  setMessage('');
  if (mode !== 'tutorial') showToast(`EXPLOIT READY // ${HACKS[id].name}`, { log: false }); // (the button pulses on; the tutorial says it in its banner)
  SFX.play('egg');
  updateHud();
  updateFreeBtn();
}

// THE CHAIN METER, a STREAK: a 5-segment bar up each side of the grid. Every link of every chain
// lights one. Fill it and an exploit is earned, and the meter starts over, empty. Only one exploit
// at a time: while one waits (earned, the daily free one, or armed) chains don't charge the meter
// at all; it waits empty, pulsing, until the exploit is used. How it keeps its charge
// by level: EASY and NORMAL carry it from drop to drop, a drop that decrypts nothing taking one
// segment off on EASY and emptying it on NORMAL; HARD and INSANE empty it as soon as each chain
// ends (the 5 links in one chain). ZEN and the tutorial play NORMAL's rules, BLITZ its
// difficulty's, VS the CPU's level's.
const chainMeters = [...document.querySelectorAll('.chain-meter')];
const METER_SEG_MS = 110; // (how long one segment takes to fill or drain)
let streak = 0; // the charge, in segments
let chainLit = 0; // a chain under way: its links so far (shown on top of the charge)
let dropLinks = 0; // this drop's links, all its chains together
const streakRule = () => {
  if (mode === 'zen' || mode === 'tutorial') return 'normal';
  const level = mode === 'vs' ? vsLevel : difficulty;
  return ['easy', 'hard', 'insane'].includes(level) ? level : 'normal';
};
const streakCap = () => HACK_COMBO;
const streakCarries = () => !['hard', 'insane'].includes(streakRule()); // (HARD / INSANE: one chain at a time)
const exploitWaiting = () => !!(armedHack || nextExploit()); // (only one at a time)
function showChainMeter() {
  const hacksOn = !MODES[mode].noHacks;
  const cap = streakCap();
  const charge = Math.min(cap, chainLit ? streak + chainLit : streak);
  // (an exploit ready: the empty segments pulse amber, the charged ones stay lit as they are)
  const ready = hacksOn && !chainLit && exploitWaiting();
  for (const m of chainMeters) {
    m.hidden = !hacksOn;
    if (m.children.length !== cap) m.innerHTML = '<i></i>'.repeat(cap);
    m.classList.toggle('ready', ready);
    // (one bar, not five: a fill runs up the segments in turn, a drain down them from the top, each
    // segment's change waiting for the ones before it, at one steady rate of METER_SEG_MS a segment)
    const segs = [...m.children];
    const from = segs.map((seg) => Number(seg.dataset.fill) || 0);
    const to = segs.map((seg, i) => Math.max(0, Math.min(1, charge - i)));
    let wait = 0;
    for (let i = 0; i < segs.length; i++) { // (rising: bottom up)
      if (to[i] <= from[i]) continue;
      const ms = (to[i] - from[i]) * METER_SEG_MS;
      segs[i].style.setProperty('--fill-delay', `${wait}ms`);
      segs[i].style.setProperty('--fill-ms', `${ms}ms`);
      wait += ms;
    }
    wait = 0;
    for (let i = segs.length - 1; i >= 0; i--) { // (falling: top down)
      if (to[i] >= from[i]) continue;
      const ms = (from[i] - to[i]) * METER_SEG_MS;
      segs[i].style.setProperty('--fill-delay', `${wait}ms`);
      segs[i].style.setProperty('--fill-ms', `${ms}ms`);
      wait += ms;
    }
    segs.forEach((seg, i) => {
      const fill = to[i];
      seg.dataset.fill = fill.toFixed(3);
      seg.style.setProperty('--fill', fill.toFixed(3));
      seg.classList.toggle('lit', fill > 0);
      seg.classList.toggle('waiting', ready && fill < 1);
    });
  }
}
// A drop's end: nothing decrypted breaks the streak (EASY: a segment; the rest: all of it)
function endStreakDrop(usedExploit) {
  if (MODES[mode].noHacks || usedExploit || dropLinks > 0) return;
  if (mode === 'tutorial' && Tutorial.holdsMeter()) return;
  streak = streakRule() === 'easy' ? Math.max(0, streak - 1) : 0;
  showChainMeter();
}
// From the top of the grid's top row (under the ==== line) down to the bottom of row 1
function placeChainMeter() {
  const top = boardEl.querySelector(`.cell[data-pos="${ROWS - 1},0"]`); // (the grid's squares: not the overflow row)
  const low = boardEl.querySelector('.cell[data-pos="0,0"]');
  if (!top || !low) return;
  const y0 = boardEl.offsetTop + top.offsetTop;
  const y1 = boardEl.offsetTop + low.offsetTop + low.offsetHeight;
  for (const m of chainMeters) Object.assign(m.style, { top: `${y0}px`, bottom: 'auto', height: `${y1 - y0}px` });
  boardWrapEl.style.setProperty('--cell', `${low.offsetWidth}px`); // (the EXPLOIT button's size)
}
if (window.ResizeObserver) new ResizeObserver(placeChainMeter).observe(boardEl);
function setChainMeter(n) {
  chainLit = n;
  showChainMeter();
}
function resetStreak() {
  streak = 0;
  chainLit = 0;
  showChainMeter();
}

async function resolveChains() {
  let chain = 0;
  let cleared = 0;

  while (true) {
    const grid = buildGrid();
    const pops = [];

    for (let r = 0; r < MAX_ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const cell = grid[r][c];
        if (!cell || cell.type !== 'number' || cell.locked) continue; // (RANSOMWARE's locked bits: held)
        const vertical = computeRunLength(grid, r, c, 1, 0);
        const horizontal = computeRunLength(grid, r, c, 0, 1);
        if (cell.val === vertical || cell.val === horizontal) {
          pops.push({ row: r, col: c, down: cell.val === vertical, across: cell.val === horizontal });
        }
      }
    }

    // HONEYPOT: a bit decrypting beside one also decrypts every bit of that number within
    // BLAST_RADIUS of the trap, and the trap is spent
    const sprung = [];
    for (let r = 0; r < MAX_ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (!grid[r][c] || grid[r][c].type !== 'honeypot') continue;
        const values = pops.filter((p) => Math.abs(p.row - r) + Math.abs(p.col - c) === 1).map((p) => grid[p.row][p.col].val);
        if (!values.length) continue;
        sprung.push({ row: r, col: c });
        Progress.sting();
        for (let dr = -BLAST_RADIUS; dr <= BLAST_RADIUS; dr++) {
          for (let dc = -BLAST_RADIUS; dc <= BLAST_RADIUS; dc++) {
            const cell = grid[r + dr] && grid[r + dr][c + dc];
            if (cell && cell.type === 'number' && !cell.locked && values.includes(cell.val) && !pops.some((p) => p.row === r + dr && p.col === c + dc)) {
              pops.push({ row: r + dr, col: c + dc });
            }
          }
        }
        setMessage(`HONEYPOT // CAUGHT EVERY [${[...new Set(values)].join('] [')}]`);
      }
    }

    if (pops.length === 0) break;

    chain++;
    cleared += pops.length;
    Progress.decrypted(pops.map((p) => grid[p.row][p.col].val), chain);
    // (the RESOURCES: BUGS down a column, CACHE across a row, ROOTKITS both at once, CRYPTO a link from the 3rd on)
    Progress.decryptKinds({
      col: pops.filter((p) => p.down && !p.across).length,
      row: pops.filter((p) => p.across && !p.down).length,
      cross: pops.filter((p) => p.down && p.across).length,
      links: chain >= 3 ? 1 : 0,
    });
    const linkPoints = pops.reduce((n, pos) => n + blockPoints(grid[pos.row][pos.col]), 0) * chain;
    chainLog.push({ vals: pops.map((pos) => grid[pos.row][pos.col].val), chain, points: linkPoints });
    score += linkPoints;
    if (chain >= 2) stealPts += linkPoints; // (VS ATTRITION takes these from the CPU too)
    chainEl.textContent = `${chain}x`;
    setChainMeter(exploitWaiting() ? 0 : chain); // (an exploit waiting: the meter doesn't charge)

    // (no waiting on the burst: its pieces hold the bits' place on the effects layer until they fly
    // (fx.js), so the board moves on at once and the next drop is free sooner)
    FX.burst(cellsAt([...pops, ...sprung]));
    render([...pops, ...sprung]);
    updateHud();
    SFX.play('burst');
    if (chain >= 2) SFX.play('egg');

    let cracked = false;
    let revealed = false;
    for (const p of pops) {
      const neighbors = [
        { row: p.row + 1, col: p.col },
        { row: p.row - 1, col: p.col },
        { row: p.row, col: p.col + 1 },
        { row: p.row, col: p.col - 1 },
      ];
      for (const n of neighbors) {
        if (n.row < 0 || n.row >= MAX_ROWS || n.col < 0 || n.col >= COLS) continue;
        const neighborCell = columns[n.col][n.row];
        if (neighborCell && neighborCell.type === 'firewall') {
          neighborCell.level--;
          Progress.peeled(neighborCell.level <= 0);
          cracked = true;
          if (neighborCell.level <= 0) {
            if (mode === 'breach') score += BREACH_LAYER_POINTS;
            columns[n.col][n.row] = revealBit(neighborCell);
            revealed = true;
          }
        }
      }
    }

    if (revealed) SFX.play('punct');
    else if (cracked) SFX.play('backspace');

    for (const p of [...pops, ...sprung]) columns[p.col][p.row] = null;
    await collapse();
    updateHud();
  }

  if (chain > 0) {
    const kind = mode === 'puzzle' ? null : DIFFICULTIES[difficulty].packet;
    // (on the 8x8 board, every 8 make a BYTE and 4 of what's left a NIBBLE; on 7x7, NIBBLEs)
    const bytes = kind === 'byte' ? Math.floor(cleared / BYTE_BITS) : 0;
    const nibbles = kind ? Math.floor((cleared - bytes * BYTE_BITS) / NIBBLE_BITS) : 0;
    if (bytes) await awardPackets('byte', bytes);
    if (nibbles) await awardPackets('nibble', nibbles);
    // The streak: this chain's links added to the charge (none while an exploit waits). A fill
    // earns an exploit and the meter starts over, empty. HARD / INSANE: empty again once the
    // chain's done.
    dropLinks += chain;
    let earned = null;
    if (!MODES[mode].noHacks && !exploitWaiting()) {
      streak += chain;
      if (streak >= streakCap()) {
        streak = 0;
        earned = hackForMeter();
      }
      if (!streakCarries()) streak = 0;
    }
    chainLit = 0;
    showChainMeter();
    if (earned) awardHack(earned);
    else setMessage('');
  }
}

// LOGIC BOMB: after each drop every armed bomb (except one just placed) counts down; at zero it
// wipes out everything within BLAST_RADIUS, then the board settles and chains resolve.
async function tickBombs() {
  const blasts = [];
  columns.forEach((stack, c) => stack.forEach((cell, r) => {
    if (!cell || cell.type !== 'bomb') return;
    if (cell.fresh) {
      cell.fresh = false;
      return;
    }
    cell.timer--;
    if (cell.timer <= 0) blasts.push({ row: r, col: c });
  }));
  if (!blasts.length) {
    render();
    return;
  }
  const hits = [];
  for (const b of blasts) {
    for (let dr = -BLAST_RADIUS; dr <= BLAST_RADIUS; dr++) {
      for (let dc = -BLAST_RADIUS; dc <= BLAST_RADIUS; dc++) {
        const pos = { row: b.row + dr, col: b.col + dc };
        if (occupied(pos.row, pos.col) && !hits.some((h) => h.row === pos.row && h.col === pos.col)) hits.push(pos);
      }
    }
  }
  setMessage('LOGIC BOMB // DETONATED');
  FX.burst(cellsAt(hits)); // (no waiting on it, as a chain's)
  render(hits);
  SFX.play('burst');
  SFX.play('denied');
  score += pointsFor(hits.filter((h) => columns[h.col][h.row].type !== 'bomb'));
  for (const h of hits) columns[h.col][h.row] = null;
  Progress.bombHits(hits.length - blasts.length);
  await collapse();
  await resolveChains();
}

// PACKET SNIFFER: step the current bit's number up or down (wrapping 1..COLS)
function sniff(step) {
  if (snifferBits <= 0 || busy || gameOver || !queue[0] || queue[0].type !== 'number') return;
  queue[0] = { type: 'number', val: ((queue[0].val - 1 + step + COLS) % COLS) + 1 };
  SFX.play('click');
  updateHud();
}
currentEl.addEventListener('click', () => sniff(1));

// DOM cells for board positions, captured before a re-render replaces them.
// Every numbered bit on the board ({ r, c })
function numberCells() {
  const out = [];
  columns.forEach((stack, c) => stack.forEach((cell, r) => { if (cell && cell.type === 'number' && !cell.locked) out.push({ r, c }); }));
  return out;
}
function cellsAt(positions) {
  return positions.map(({ row, col }) => ({
    el: boardEl.querySelector(`[data-pos="${row},${col}"]`),
    type: columns[col][row] && (['bomb', 'honeypot'].includes(columns[col][row].type) ? 'hack' : columns[col][row].type),
  }));
}

function occupied(row, col) {
  return row >= 0 && row < MAX_ROWS && col >= 0 && col < COLS && !!columns[col][row];
}

// The hack piece has just landed at (row, col) on top of its stack.
async function runHack(id, row, col) {
  Progress.exploit(id);
  if (columns.flat().filter(Boolean).length === 1) Progress.secret('overkill'); // nothing but the exploit
  setMessage(`${HACKS[id].name} // EXECUTING`);
  SFX.play('static');

  if (id === 'worm-virus' || id === 'trojan') {
    const hits = [];
    if (id === 'worm-virus') {
      columns[col].forEach((_, r) => hits.push({ row: r, col }));
    } else {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (occupied(row + dr, col + dc)) hits.push({ row: row + dr, col: col + dc });
        }
      }
    }
    FX.burst(cellsAt(hits)); // (no waiting on the bursts, as a chain's)
    render(hits);
    SFX.play('burst');
    score += pointsFor(hits.filter((h) => !(h.row === row && h.col === col))); // not the exploit itself
    for (const h of hits) columns[h.col][h.row] = null;
    await collapse();
  } else if (id === 'dictionary-attack') {
    // Peel one layer off every encryption block at once
    columns[col].pop();
    const peeled = [];
    columns.forEach((stack, c) => stack.forEach((cell, r) => {
      if (cell && cell.type === 'firewall') peeled.push({ row: r, col: c });
    }));
    FX.burst(cellsAt(peeled));
    let revealed = false;
    for (const { row: r, col: c } of peeled) {
      const cell = columns[c][r];
      cell.level--;
      Progress.peeled(cell.level <= 0);
      if (cell.level <= 0) {
        if (mode === 'breach') score += BREACH_LAYER_POINTS;
        columns[c][r] = revealBit(cell);
        revealed = true;
      }
    }
    render();
    SFX.play(revealed ? 'punct' : 'backspace');
  } else if (id === 'backdoor') {
    // Delete the whole bottom row, layers included; everything drops by one
    columns[col].pop();
    const hits = columns.map((stack, c) => (stack.length ? { row: 0, col: c } : null)).filter(Boolean);
    FX.burst(cellsAt(hits));
    render(hits);
    SFX.play('burst');
    score += pointsFor(hits);
    for (const h of hits) columns[h.col][0] = null;
    await collapse();
  } else if (id === 'rainbow-table') {
    // Decrypt every bit showing the most common number (ties go to the higher number)
    columns[col].pop();
    const counts = {};
    columns.forEach((stack) => stack.forEach((cell) => {
      if (cell && cell.type === 'number') counts[cell.val] = (counts[cell.val] || 0) + 1;
    }));
    const target = Object.keys(counts).map(Number).sort((a, b) => counts[b] - counts[a] || b - a)[0];
    const hits = [];
    columns.forEach((stack, c) => stack.forEach((cell, r) => {
      if (cell && cell.type === 'number' && cell.val === target) hits.push({ row: r, col: c });
    }));
    if (hits.length) {
      setMessage(`RAINBOW TABLE // CRACKED EVERY [${target}]`);
      FX.burst(cellsAt(hits));
      render(hits);
      SFX.play('burst');
      for (const h of hits) columns[h.col][h.row] = null;
      Progress.decrypted(hits.map(() => target), 1);
      score += pointsFor(hits);
      await collapse();
    } else {
      render();
    }
  } else if (id === 'logic-bomb' || id === 'honeypot') {
    // Both stay on the board as armed blocks where they landed
    columns[col][row] = id === 'logic-bomb' ? { type: 'bomb', timer: BOMB_DROPS, fresh: true } : { type: 'honeypot' };
    const armedTypes = columns.flat().map((cell) => cell && cell.type);
    if (armedTypes.includes('bomb') && armedTypes.includes('honeypot')) Progress.secret('double-trouble');
    render();
    SFX.play('enter');
    await sleep(300);
  } else if (id === 'pivot') {
    // Swap the column it landed in with the neighbor the player picked
    columns[col].pop();
    const other = pivotWith === null ? (col === 0 ? 1 : col - 1) : pivotWith;
    pivotWith = null;
    [columns[col], columns[other]] = [columns[other], columns[col]];
    render();
    SFX.play('static');
    await sleep(300);
  } else if (id === 'swap') {
    // The two picked bits trade places (any match they make decrypts next)
    columns[col].pop();
    const [a, b] = swapPicks;
    swapPicks = [];
    if (a && b && columns[a.c][a.r] && columns[b.c][b.r]) {
      [columns[a.c][a.r], columns[b.c][b.r]] = [columns[b.c][b.r], columns[a.c][a.r]];
      FX.burst(cellsAt([{ row: a.r, col: a.c }, { row: b.r, col: b.c }]).map((x) => ({ ...x, type: 'warning' })));
    }
    render();
    SFX.play('static');
    await sleep(300);
  } else if (id === 'packet-sniffer') {
    columns[col].pop();
    snifferBits = SNIFFER_BITS;
    render();
    SFX.play('enter');
    await sleep(300);
  } else if (id === 'keylogger') {
    columns[col].pop();
    keyloggerDrops = KEYLOGGER_DROPS;
    render();
    SFX.play('enter');
    await sleep(300);
  } else {
    columns[col].pop();
    if (id === 'rng') await scrambleBits();
    for (const stack of columns) {
      if (id === 'bitflip') stack.reverse();
      stack.forEach((cell, r) => {
        if (!cell || cell.type !== 'number') return;
        if (cell.locked) return; // (RANSOMWARE's locked bits sit out BUFFER OVERFLOW and RNG: same number, still locked)
        if (id === 'buffer-overflow') {
          stack[r] = cell.val === COLS ? newFirewall(2) : { type: 'number', val: cell.val + 1 };
        } else if (id === 'rng') {
          stack[r] = newPacket();
        }
      });
    }
    render();
    SFX.play('enter');
    await sleep(300);
  }

  updateHud();
  setMessage('');
}

// RNG: before the new numbers land, every bit on the board flickers through random values in
// place (the squares stay put; only what's in them churns), slowing to a stop
const SCRAMBLE_STEPS = [45, 45, 50, 55, 60, 70, 80, 95, 110];
async function scrambleBits() {
  const els = [];
  columns.forEach((stack, c) => stack.forEach((cell, r) => {
    // (RANSOMWARE's locked bits sit it out: no flicker, and they keep their numbers)
    const el = cell && cell.type === 'number' && !cell.locked && boardEl.querySelector(`.cell[data-pos="${r},${c}"]`);
    if (el) els.push(el);
  }));
  if (!els.length) return;
  for (const el of els) el.classList.add('scrambling');
  for (const ms of SCRAMBLE_STEPS) {
    for (const el of els) fillBit(el, 1 + Math.floor(Math.random() * COLS));
    SFX.play('click');
    await sleep(ms);
  }
  for (const el of els) el.classList.remove('scrambling');
}

// Game over: every piece shakes and heats up, bursts at its own random moment,
// then TRACE COMPLETE appears (~1.2s in total).
// Every piece on the board heats up, shakes and bursts into code over ~1s. Returns the piece count.
function meltBoard(run) {
  const pieces = [...boardEl.querySelectorAll('.cell.disc, .cell.firewall, .cell.hack')];
  boardEl.classList.add('meltdown');
  let sounds = 0;
  for (const el of pieces) {
    el.style.animationDelay = `${-Math.random() * 0.08}s, 0s`; // out-of-step shaking
    setTimeout(() => {
      if (run !== runId) return;
      FX.burst([{ el, type: 'hot' }]);
      el.style.opacity = '0';
      if (sounds < 6 && Math.random() < 0.5) {
        sounds++;
        SFX.play('burst');
      }
    }, 450 + Math.random() * 600);
  }
  return pieces.length;
}

// reason: 'trace' (something left above the line) or 'time' (BLITZ ran out)
function endGame(reason = 'trace') {
  gameOver = true;
  Infections.clear(); // (the infections' displays and pop-ups gone: the game-over card over a plain board)
  refreshExploitCards(); // the loadout can change again
  busy = true;
  clockRunning = false;
  SFX.play('denied');
  render();
  Music.setIntensity(0);
  setMessage('');
  finalScoreEl.textContent = mode === 'vs' ? score : 0; // (racked up once the result shows: rackScore)
  newBestEl.hidden = !(score > bestAtStart);
  const endings = {
    trace: ['TRACE COMPLETE', 'They found you.'],
    time: ["TIME'S UP", 'The connection timed out.'],
    daily: [mode === 'breach' ? 'BREACH COMPLETE' : 'DAILY COMPLETE', `All ${dealLimit()} bits dropped.`],
    breached: ['FIREWALL BREACHED', `Every block cleared. +${BREACH_CLEAR_BONUS}`],
    win: ['YOU WIN', vsWhy || `The ${vsName()} overflowed first.`],
    'vs-lose': [`${CpuBoard.BOTS[vsBot].label} WINS`, vsWhy],
  };
  if (mode === 'vs') {
    if (reason === 'trace') endings.trace = [`${CpuBoard.BOTS[vsBot].label} WINS`, `The ${vsName()} traced you first.`];
    Progress.vsResult({
      level: vsLevel, bot: vsBot, mode: vsMode, layers: vsLayers, exploits: vsExploits, won: reason === 'win',
      target: vsTarget, pool: vsPool, cpuPoints: vsThem, overflow: !!cpu && cpu.isDead(), landed: vsLanded, sent: vsSent,
    });
    updatePauseBtn(); // (QUIT again)
    stopVs();
    holdCpu(false);
  }
  document.getElementById('overlay-title').textContent = endings[reason][0];
  document.getElementById('overlay-sub').textContent = endings[reason][1];
  const note = document.getElementById('overlay-note');
  note.hidden = mode === 'classic';
  note.textContent = daily
    ? (dailyOfficial ? `${DAILY_KINDS[mode]} // OFFICIAL SCORE // ${todayKey()}` : `${DAILY_KINDS[mode]} PRACTICE // OFFICIAL SCORE TODAY ${fmt(best)}`)
    : `${MODES[mode].label} // BEST ${best}`;
  if (daily) newBestEl.hidden = true;
  if (runBoosts.size || secondChanceUsed) { // (a boosted game says so)
    note.hidden = false;
    note.textContent += ` // PATCHED: ${[...runBoosts, ...(secondChanceUsed ? ['second-chance'] : [])].map((id) => BOOSTERS[id].name).join(', ')}`;
  }
  if (usedStarters.length) note.textContent += ` // STARTERS: ${usedStarters.map(itemName).join(', ')}`; // (and one that used side slots)
  if (marketBought.length) {
    note.textContent += ` // BLACK MARKET: ${marketBought.map(itemName).join(', ')}`;
  }
  showRunKeys();
  shareBtn.hidden = !daily || mode === 'puzzle';
  shareBtn.textContent = 'SHARE';

  if (mode === 'puzzle') {
    if (!daily) Progress.puzzleFailed();
  } else {
    Progress.endRun({
      score, reason, boardEmpty: columns.every((c) => c.length === 0),
      track: Music.isEnabled() ? Music.currentTrack() : null, theme: document.documentElement.dataset.theme || 'terminal',
      font: shownFont().id,
      silent: SFX.isMuted() && !Music.isEnabled(),
    });
    if (mode === 'breach' && layersLeft() === 1) Progress.secret('so-close');
  }
  announce(Progress.check());

  const run = runId;
  meltBoard(run);
  setTimeout(() => {
    if (run !== runId) return;
    overlayEl.classList.remove('hidden');
    rackScore(run, () => playXpMeter(run)); // (the score racks up, then the level meter fills with the game's bits)
  }, 1200);
}

// KONAMI (hidden achievement): up up down down left right left right B A
const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
let konamiAt = 0;
document.addEventListener('keydown', (e) => {
  const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  konamiAt = key === KONAMI[konamiAt] ? konamiAt + 1 : key === KONAMI[0] ? 1 : 0;
  if (konamiAt === KONAMI.length) {
    konamiAt = 0;
    Progress.secret('konami');
    announce(Progress.check());
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'e' || e.key === 'E') {
    if (nextExploit()) armExploit();
    return;
  }
  if (mode === 'vs' && !vsStarted && !gameOver && (e.key === 'Enter' || e.key === ' ')) {
    e.preventDefault();
    startMatch();
    return;
  }
  const num = parseInt(e.key, 10);
  if (num >= 1 && num <= COLS) attemptDrop(num - 1);
  else if (e.key === 'ArrowLeft' && pivotFrom !== null) { e.preventDefault(); attemptDrop(pivotFrom - 1); }
  else if (e.key === 'ArrowRight' && pivotFrom !== null) { e.preventDefault(); attemptDrop(pivotFrom + 1); }
  else if (e.key === 'ArrowUp' && snifferBits > 0) { e.preventDefault(); sniff(1); }
  else if (e.key === 'ArrowDown' && snifferBits > 0) { e.preventDefault(); sniff(-1); }
});

// Ignored mid-animation: the in-flight drop would keep mutating the fresh board.
function restart() {
  if (busy && !gameOver) return;
  resetNow();
}

function resetNow() {
  disarmReset();
  SFX.play('static');
  initGame();
}

// Resetting a live run (RESTART or a new difficulty) takes two presses, like the ECHOES dice
// roller's reset: the first arms that button for a few seconds, the second melts the board down
// and starts over. Only one button is armed at a time.
const RESET_CONFIRM_MS = 3500;
let armed = null; // { btn, label, timer }

function disarmReset() {
  if (!armed) return;
  clearTimeout(armed.timer);
  if (!armed.icon) armed.btn.innerHTML = armed.label; // (its markup and all: a DAILY card's lines)
  armed.btn.classList.remove('danger');
  armed = null;
}

function armReset(btn, confirmText) {
  disarmReset();
  // Icon buttons (RESTART, QUIT) keep their icon and turn red to ask instead
  const icon = btn.classList.contains('corner-btn');
  armed = { btn, icon, label: btn.innerHTML, timer: setTimeout(disarmReset, RESET_CONFIRM_MS) };
  if (!icon) btn.textContent = confirmText;
  btn.classList.add('danger');
  SFX.play('alert');
}

// (nothing to lose: before the first drop, or a puzzle, which restarts as it started)
function freshRun() { return mode === 'puzzle' || (score === 0 && Progress.runDrops() === 0); }
// apply() runs just before the new run starts (e.g. switching the difficulty).
function requestReset(btn, confirmText, apply = () => {}) {
  // Nothing to lose once the run is over or before the first drop.
  // (PUZZLE boards are short and restart as they started, so they never ask)
  // (under way = a drop made: BREACH's firewall and a puzzle's board are there from the start)
  const fresh = freshRun();
  if (gameOver || fresh) {
    if (busy && !gameOver) return;
    apply();
    resetNow();
    return;
  }
  if (!armed || armed.btn !== btn) {
    armReset(btn, confirmText);
    return;
  }
  if (busy) return; // stays armed; mid-drop the board can't be wiped yet
  disarmReset();
  if (Progress.runDrops() > 0) Progress.restarted();
  busy = true;
  updateColumnButtons();
  Music.setIntensity(0);
  setMessage('');
  const run = runId;
  const melting = !homeOpen && meltBoard(run); // (from the main menu: nothing to see, no melt)
  setTimeout(() => {
    if (run !== runId) return;
    apply();
    resetNow();
  }, melting ? 1200 : 0);
}

const restartBtn = document.getElementById('restart-btn');
restartBtn.addEventListener('click', () => {
  // (EXIT before the first drop: nothing to lose, so one tap, back to the main menu)
  if (restartBtn.classList.contains('exit')) {
    showHome();
    return;
  }
  requestReset(restartBtn, 'TAP AGAIN TO RESTART');
});

document.querySelectorAll('#difficulty-row button').forEach((btn) => {
  btn.addEventListener('click', () => {
    const next = btn.dataset.difficulty;
    if (next === classicDifficulty) return;
    if (next === 'hard' && !Progress.isUnlocked('mode-hard')) {
      SFX.play('denied');
      homeNotice(`LOCKED // ${Progress.unlock('mode-hard').need.toUpperCase()}`);
      return;
    }
    requestReset(btn, 'CONFIRM?', () => {
      classicDifficulty = next;
      storage.set('bytefall-difficulty', next);
    });
  });
});

// Mode buttons: switching mid-run asks to confirm, like RESTART.
document.querySelectorAll('.modes button').forEach((btn) => {
  btn.addEventListener('click', () => {
    const next = btn.dataset.mode;
    if (next === topMode) return;
    requestReset(btn, 'CONFIRM?', () => {
      if (next === 'vs') storage.set('bytefall-before-vs', topMode); // QUIT comes back here
      topMode = next;
      storage.set('bytefall-mode', next);
      setModeFromChoice();
    });
  });
});

// VS CPU: LAYERS ON / OFF
const vsLayersBtn = document.getElementById('vs-layers-btn');
vsLayersBtn.addEventListener('click', () => {
  requestReset(vsLayersBtn, 'CONFIRM?', () => {
    vsLayers = !vsLayers;
    storage.set('bytefall-vs-layers', vsLayers ? 'on' : 'off');
    botMood('annoyed', 2200); // -_- : still not playing
  });
});
const vsExploitsBtn = document.getElementById('vs-exploits-btn');
vsExploitsBtn.addEventListener('click', () => {
  requestReset(vsExploitsBtn, 'CONFIRM?', () => {
    vsExploits = !vsExploits;
    storage.set('bytefall-vs-exploits', vsExploits ? 'on' : 'off');
    // Exploits on: the bot starts scheming; off: -_-
    botMood(vsExploits ? 'devious' : 'annoyed', vsExploits ? 2600 : 2200);
  });
});

// VS CPU's opponent level
document.querySelectorAll('#vs-levels button[data-vs]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const next = btn.dataset.vs;
    if (next === vsLevel) return;
    if (!vsLevelOpen(next)) {
      SFX.play('denied');
      vsNotice(`LOCKED // ${Progress.unlock(`vs-${next}`).need.toUpperCase()}`);
      return;
    }
    requestReset(btn, 'CONFIRM?', () => {
      vsLevel = next;
      storage.set('bytefall-vs-level', next);
      botFlash = null; // (a new level: just its own face, no reaction)
      botMood();
    });
  });
});

// A "can't do that" in the title of the card it happened on, the title stepping aside while it
// shows: it fades in and pulses like the game's warnings, then bursts into pixels. VS's setup (a
// locked bot or level), the main menu's mode card (HARD still locked, a starter slot not open yet),
// the EXPLOITS card (LOADOUT LOCKED, SLOTS FULL)
const titleNoticeTimers = new Map();
function titleNotice(el, text) {
  clearTimeout(titleNoticeTimers.get(el));
  el.classList.remove('show');
  void el.offsetWidth;
  el.textContent = text;
  el.style.fontSize = '';
  let size = parseFloat(getComputedStyle(el).fontSize);
  while (el.scrollWidth > el.clientWidth && size > 7) el.style.fontSize = `${(size -= 0.5)}px`; // one line
  el.classList.add('show');
  titleNoticeTimers.set(el, setTimeout(() => {
    const range = document.createRange();
    range.selectNodeContents(el);
    FX.burst([{ rect: range.getBoundingClientRect(), type: 'warning' }]);
    el.classList.remove('show');
  }, 2200));
}
const vsNotice = (text) => titleNotice(document.getElementById('vs-setup-msg'), text);
const homeNotice = (text) => titleNotice(document.getElementById('home-panel-msg'), text);
const cardNotice = (text) => titleNotice(document.getElementById('records-title-msg'), text);

// VS CPU's opponent: which bot (its look, lines and play style)
document.querySelectorAll('#vs-bots button[data-bot]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const next = btn.dataset.bot;
    if (next === vsBot) return;
    if (!vsBotOpen(next)) {
      SFX.play('denied');
      vsNotice(`LOCKED // ${Progress.unlock(`bot-${next}`).need.toUpperCase()}`);
      return;
    }
    requestReset(btn, 'CONFIRM?', () => {
      vsBot = next;
      storage.set('bytefall-vs-bot', next);
      botMood(BOT_HELLO[next], 2100); // (the new bot's hello, once it's pixelated in)
    });
  });
});

// VS game mode: CLASSIC, ATTRITION, DEATHMATCH, TUG OF WAR
document.querySelectorAll('#vs-modes button[data-vsmode]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const next = btn.dataset.vsmode;
    if (next === vsMode) return;
    requestReset(btn, 'CONFIRM?', () => {
      vsMode = next;
      botMood('skeptic', 1800); // (a new game mode: hm?)
      storage.set('bytefall-vs-mode', next);
    });
  });
});
// The target score (ATTRITION, DEATHMATCH) or starting points (TUG OF WAR): -/+ by 500
function stepVsGoal(dir) {
  if (vsStarted) return;
  if (vsMode === 'classic') { // (no target to set: the row stays lit, and says so)
    SFX.play('denied');
    return;
  }
  const tug = vsMode === 'tug';
  const range = tug ? VS_POOL : VS_TARGET;
  const now = tug ? vsPool : vsTarget;
  const next = Math.min(range.max, Math.max(range.min, now + dir * range.step));
  if (next === now) {
    SFX.play('denied');
    return;
  }
  SFX.play('click');
  botMood(dir > 0 ? 'devious' : 'smug', 1300);
  if (tug) {
    vsPool = next;
    storage.set('bytefall-vs-pool', String(next));
  } else {
    vsTarget = next;
    storage.set('bytefall-vs-target', String(next));
  }
  startVs(); // (the match points start over from the new numbers)
  applyModeUi();
  updateHud();
}
document.getElementById('vs-goal-down').addEventListener('click', () => stepVsGoal(-1));
document.getElementById('vs-goal-up').addEventListener('click', () => stepVsGoal(1));
// (the setup's − / + line and the match's status line: NO TARGET, TARGET 2,000 or START 1,000)
function vsGoalText() {
  if (vsMode === 'classic') return 'NO TARGET';
  return vsMode === 'tug' ? `START ${fmt(vsPool)}` : `TARGET ${fmt(vsTarget)}`;
}
// (never dimmed: − and + at the end of the range, or in CLASSIC, just answer DENIED)
function showVsGoal() {
  document.getElementById('vs-goal').textContent = vsGoalText();
}

// DAILY's setup: today's date, the streak and the time to the next set over a card for each game,
// DECRYPT, PUZZLE, BLITZ, BREACH: its rules in a line and how today stands (the official run still
// to play, its score, or the puzzle's tries); a tap picks it, PLAY plays it
const DAILY_CARD = {
  decrypt: { name: 'DECRYPT', rule: () => `The same ${DAILY_BITS} bits for everyone.` },
  puzzle: { name: 'PUZZLE', rule: () => `The ${WEEKDAYS[utcWeekday()]} puzzle: difficulty ${utcWeekday() + 1}/7, ${DAILY_PUZZLE_TRIES} tries.` },
  blitz: { name: 'BLITZ', rule: () => `${DAILY_BLITZ_SECONDS} seconds, the same bits for everyone.` },
  breach: { name: 'BREACH', rule: () => `Break a ${BREACH_ROWS}-row firewall with ${BREACH_BITS} bits.` },
};
function dailyStatus(kind) {
  if (kind === 'puzzle') {
    const at = dailyPuzzleSolvedAt();
    const used = dailyPuzzleTries();
    if (at) return { done: true, text: `SOLVED ON TRY ${at}/${DAILY_PUZZLE_TRIES}` };
    if (used >= DAILY_PUZZLE_TRIES) return { done: true, text: `NOT SOLVED // ${DAILY_PUZZLE_TRIES}/${DAILY_PUZZLE_TRIES} TRIES USED` };
    return { done: false, text: used ? `${DAILY_PUZZLE_TRIES - used} OF ${DAILY_PUZZLE_TRIES} TRIES LEFT` : `${DAILY_PUZZLE_TRIES} TRIES TODAY` };
  }
  if (storage.get(dailyPlayedKey(kind))) return { done: true, text: `OFFICIAL ${fmt(Number(storage.get(dailyKey(kind))) || 0)} // PRACTICE` };
  return { done: false, text: 'OFFICIAL RUN READY' };
}
// (to the next UTC midnight, when the dailies turn over)
function dailyTurnover() {
  const now = new Date();
  const next = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1);
  const mins = Math.max(1, Math.ceil((next - now) / 60000));
  return mins >= 60 ? `${Math.floor(mins / 60)}H ${mins % 60}M` : `${mins}M`;
}
// (the streak and the countdown on their own line, then what counts: the first play of each, or
// PUZZLE's first tries)
const dailyHeader = () => `STREAK ${fmt(Progress.dailyStreak())} // NEW GAMES IN ${dailyTurnover()}\nYour first play of each game today counts (PUZZLE gives you ${DAILY_PUZZLE_TRIES} tries). After that, it's practice.`;
function renderDailyCards() {
  document.querySelectorAll('#daily-kinds button').forEach((btn) => {
    if (armed && armed.btn === btn) return; // (asking to confirm: left as it is)
    const kind = btn.dataset.daily;
    const st = dailyStatus(kind);
    btn.classList.toggle('active', kind === dailyKind);
    btn.classList.toggle('done', st.done);
    btn.innerHTML = `<span class="dc-name">${DAILY_CARD[kind].name}</span><span class="dc-rule">${DAILY_CARD[kind].rule()}</span><span class="dc-status">${st.done ? '\u2713 ' : ''}${st.text}</span>`;
    btn.setAttribute('aria-pressed', String(kind === dailyKind));
  });
}
setInterval(() => { if (homeOpen && daily) { renderDailyCards(); applyModeUi(); } }, 30000); // (the countdown)
// DAILY's games: DECRYPT, PUZZLE, BLITZ, BREACH, in a row that slides sideways and loops: a copy of
// the four on each side, and once it settles on a copy it's swapped, unseen, for the same card in the
// middle four. The card in the middle (each snaps softly to the center) is in focus at once, the rest
// a little dimmer, and it's the pick: straight away when switching costs nothing, or, with a game under
// way, once the row settles, asking first (CONFIRM? on the card, a tap on it to go; left unanswered,
// the row slides back to the pick). A tap on a card beside the middle slides it in, a tap on a pip too
const dailyRow = document.getElementById('daily-kinds');
const dailyHome = [...dailyRow.querySelectorAll('button')]; // (the middle four)
const DAILY_N = dailyHome.length;
for (const before of [true, false]) { // (the copies either side, for the loop)
  const copies = dailyHome.map((b) => { const c = b.cloneNode(true); c.setAttribute('aria-hidden', 'true'); c.tabIndex = -1; return c; });
  if (before) dailyRow.prepend(...copies);
  else dailyRow.append(...copies);
}
const dailyCards = [...dailyRow.querySelectorAll('button')];
const dailyPips = [...document.querySelectorAll('#daily-pips i')];
const dailyCardOf = (kind) => dailyHome.find((b) => b.dataset.daily === kind);
const dailyMid = (btn) => btn.offsetLeft + btn.offsetWidth / 2;
function dailyNearest() {
  const mid = dailyRow.scrollLeft + dailyRow.clientWidth / 2;
  return dailyCards.reduce((a, b) => (Math.abs(dailyMid(b) - mid) < Math.abs(dailyMid(a) - mid) ? b : a));
}
// (the card in focus: the rest dim softly, the pips light its game; a new one is the pick at once
// when switching costs nothing)
let dailyFocus = null;
function focusDaily() {
  if (!dailyRow.clientWidth) return;
  const near = dailyNearest();
  if (near === dailyFocus) return;
  dailyFocus = near;
  dailyCards.forEach((b) => b.classList.toggle('focus', b === near));
  dailyPips.forEach((p) => p.classList.toggle('on', p.dataset.daily === near.dataset.daily));
  if (near.dataset.daily !== dailyKind && (gameOver || freshRun())) pickDaily(near);
}
function slideDaily(btn, smooth) {
  const slow = smooth && !matchMedia('(prefers-reduced-motion: reduce)').matches;
  dailyRow.scrollTo({ left: dailyMid(btn) - dailyRow.clientWidth / 2, behavior: slow ? 'smooth' : 'instant' });
  focusDaily();
}
// (settled on a copy: the same card in the middle four, in its place)
function homeDaily() {
  const near = dailyNearest();
  const i = dailyCards.indexOf(near);
  if (i >= DAILY_N && i < 2 * DAILY_N) return;
  dailyRow.scrollLeft += dailyMid(dailyCardOf(near.dataset.daily)) - dailyMid(near);
  focusDaily();
}
function pickDaily(btn) {
  const next = btn.dataset.daily;
  if (next === dailyKind) return;
  requestReset(btn, 'CONFIRM?', () => {
    dailyKind = next;
    storage.set('bytefall-daily-kind', next);
    setModeFromChoice();
  });
  if (dailyKind !== next) { // (asking first: unanswered, back to the pick)
    setTimeout(() => { if ((!armed || armed.btn !== btn) && dailyKind !== next && dailyNearest() === btn) slideDaily(dailyCardOf(dailyKind), true); }, RESET_CONFIRM_MS + 100);
  }
}
// (the pick in the middle, as the row comes into view or the cards change: not while it's being
// slid or a card in it asks CONFIRM?)
let dailyHeld = false;
let dailyMoving = false;
function centerDaily() {
  if (!dailyRow.clientWidth || dailyHeld || dailyMoving || (armed && dailyCards.includes(armed.btn))) return;
  if (dailyNearest().dataset.daily !== dailyKind) slideDaily(dailyCardOf(dailyKind), false);
  else { homeDaily(); focusDaily(); }
}
let dailySettle = 0;
function dailySettled() {
  clearTimeout(dailySettle);
  if (dailyHeld || !dailyRow.clientWidth) return;
  dailyMoving = false;
  homeDaily();
  pickDaily(dailyNearest()); // (with a game under way: asks, now it's still)
}
dailyRow.addEventListener('scroll', () => {
  dailyMoving = true;
  requestAnimationFrame(focusDaily);
  clearTimeout(dailySettle);
  dailySettle = setTimeout(dailySettled, 160); // (where scrollend isn't: once it's still)
}, { passive: true });
dailyRow.addEventListener('scrollend', dailySettled);
dailyRow.addEventListener('touchstart', () => { dailyHeld = true; }, { passive: true });
dailyRow.addEventListener('touchend', () => { dailyHeld = false; clearTimeout(dailySettle); dailySettle = setTimeout(dailySettled, 160); }, { passive: true });
dailyRow.addEventListener('touchcancel', () => { dailyHeld = false; }, { passive: true });
dailyCards.forEach((btn) => {
  btn.addEventListener('click', () => {
    if (dailyNearest() !== btn) slideDaily(btn, true); // (beside the middle: in it slides)
    else pickDaily(dailyCardOf(btn.dataset.daily));
  });
});
dailyPips.forEach((p) => p.addEventListener('click', () => {
  // (the nearest copy of its card: the row slides the short way round)
  const mid = dailyRow.scrollLeft + dailyRow.clientWidth / 2;
  const copies = dailyCards.filter((b) => b.dataset.daily === p.dataset.daily);
  slideDaily(copies.reduce((a, b) => (Math.abs(dailyMid(b) - mid) < Math.abs(dailyMid(a) - mid) ? b : a)), true);
}));
addEventListener('resize', () => requestAnimationFrame(centerDaily));

// Shows what the current mode changes: the mode row, its note, the difficulty row (CLASSIC
// only), the layer countdown (not in ZEN) and the BLITZ clock.
// The VS setup's level and bot buttons: which is picked, which are still locked
function refreshVsPicks() {
  if (!vsLevelOpen(vsLevel)) vsLevel = 'normal';
  if (!vsBotOpen(vsBot)) vsBot = 'bot';
  document.querySelectorAll('#vs-levels button[data-vs]').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.vs === vsLevel);
    btn.classList.toggle('locked', !vsLevelOpen(btn.dataset.vs));
  });
  document.querySelectorAll('#vs-bots button[data-bot]').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.bot === vsBot);
    btn.classList.toggle('locked', !vsBotOpen(btn.dataset.bot));
  });
  document.querySelectorAll('#vs-modes button[data-vsmode]').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.vsmode === vsMode);
  });
  document.getElementById('vs-setup-note').textContent = VS_MODES[vsMode].note; // (fitted by lockButtons)
  showVsGoal();
  lockButtons();
}

function applyModeUi() {
  boardEl.parentElement.classList.toggle('with-vs-bar', mode === 'vs'); // (the score bar's room, before the board's fitted)
  refreshVsPicks();
  document.querySelectorAll('.modes button').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.mode === topMode && mode !== 'tutorial');
  });
  renderDailyCards();
  // (on the menu's panel, under the mode's name: without the name it starts with; DAILY's: the day,
  // the streak and the turnover, over its cards)
  document.getElementById('mode-info').textContent = daily ? dailyHeader() : MODES[mode].info(todayKey()).replace(/^[A-Z ]+ \/\/ (.)/, (_, c) => c.toUpperCase());
  // (VS: VS. CPU // its game mode, under BYTEFALL as in every game)
  document.getElementById('game-mode-label').textContent = mode === 'vs' ? `VS. CPU // ${VS_MODES[vsMode].label}` : `// ${modeLine()}`;
  document.getElementById('difficulty-row').hidden = mode !== 'classic';
  document.getElementById('daily-kinds').hidden = !daily;
  document.getElementById('daily-pips').hidden = !daily;
  centerDaily(); // (the pick in the middle of its row)
  document.querySelectorAll('#vs-levels button[data-vs]').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.vs === vsLevel);
  });
  vsLayersBtn.textContent = `LAYERS: ${vsLayers ? 'ON' : 'OFF'}`;
  vsLayersBtn.classList.toggle('active', vsLayers);
  vsExploitsBtn.textContent = `EXPLOITS: ${vsExploits ? 'ON' : 'OFF'}`;
  vsExploitsBtn.classList.toggle('active', vsExploits);
  document.body.classList.toggle('vs-mode', mode === 'vs'); // a slimmer header, room for the boards
  // (VS keeps it with layers off, its count a -, so nothing shifts when the option changes)
  document.getElementById('pulse-stat').hidden = !!MODES[mode].noLayers && mode !== 'puzzle' && mode !== 'breach' && mode !== 'vs' && mode !== 'tutorial';
  document.getElementById('pulse-label').textContent = mode === 'puzzle' ? 'BITS LEFT' : mode === 'breach' ? 'LAYERS LEFT' : 'ENCRYPT IN';
  // (ENCRYPT IN: a ===== under the count, the layer it's counting down to, as [n] is a bit)
  document.getElementById('pulse-stat').classList.toggle('counts-layers', mode !== 'puzzle' && mode !== 'breach');
  updateVsChrome(); // (after ENCRYPT IN shows or hides: it counts the stat rows)
  if (mode === 'puzzle' && !daily) updatePuzzleNav();
  // The overlay goes back to its trace look until a puzzle result changes it
  overlayNext = null;
  document.querySelector('.overlay-box').classList.remove('win');
  document.getElementById('overlay-restart-btn').textContent = mode === 'puzzle' ? 'RETRY' : 'NEW SESSION';
  document.getElementById('overlay-menu-btn').textContent = mode === 'puzzle' && !daily ? 'PUZZLES' : 'MAIN MENU';
  document.getElementById('time-stat').hidden = mode !== 'blitz' && dealLimit() === Infinity;
  document.getElementById('time-label').textContent = mode === 'blitz' ? 'TIME' : 'BITS LEFT';
  // (the HUD's grid: TIME / BITS LEFT under CURRENT when there's a clock or a count; CHAIN the
  // whole right column when there's no ENCRYPT IN)
  const hudEl = document.querySelector('.hud');
  hudEl.classList.toggle('has-time', !document.getElementById('time-stat').hidden);
  hudEl.classList.toggle('no-pulse', document.getElementById('pulse-stat').hidden);
  shareBtn.hidden = true;
  showClock();
  updateHome();
}

const timeLeftEl = document.getElementById('time-left');
function showClock() {
  if (dealLimit() < Infinity) {
    timeLeftEl.textContent = dailyBitsLeft();
    timeLeftEl.closest('.stat').classList.remove('time-low');
    return;
  }
  const secs = Math.ceil(timeLeft);
  timeLeftEl.textContent = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
  timeLeftEl.closest('.stat').classList.toggle('time-low', clockRunning && secs <= 10);
}

// LOOKAHEAD's 60 seconds: play time only (not paused, at the menu or in the background)
setInterval(() => {
  if (lookaheadLeft <= 0 || !started || gameOver || vsPaused || homeOpen || document.hidden) return;
  lookaheadLeft -= 250;
  if (lookaheadLeft > 0) return;
  updateHud();
  if (!busy) setMessage('LOOKAHEAD // OFF');
}, 250);

let lastClockTick = performance.now();
setInterval(() => {
  const now = performance.now();
  const dt = (now - lastClockTick) / 1000;
  lastClockTick = now;
  if (mode !== 'blitz' || !clockRunning || gameOver || document.hidden || vsPaused) return;
  timeLeft = Math.max(0, timeLeft - dt);
  showClock();
  if (timeLeft === 0 && !timeUp) {
    timeUp = true;
    if (!busy) endGame('time'); // mid-drop: finishTurn ends it once the drop resolves
  }
}, 200);

// VS CPU. Your chains attack: every VS_POINTS_PER_BLOCK points a drop scores sends one encrypted
// block (up to a full board row pair at once). Attacks cancel blocks headed your way first; what's
// left lands on the other board after its next move, on top of random columns, as one-peel
// layers. The CPU moves on its own clock from your first drop, paused while a panel is open or
// the tab is hidden.
const VS_POINTS_PER_BLOCK = 30;
const VS_MAX_BLOCKS = 14;
// The most blocks that can wait to land on either board, by CPU level; any sent past it are lost
const VS_CAP = { easy: 8, normal: 16, hard: 24, insane: 32 };
const vsCap = () => VS_CAP[vsLevel] || 16;
// The drop clock: a bit left too long drops by itself into a random column (one that won't
// overflow when it can), so waiting out the CPU is no way to win
const VS_DROP_MS = { easy: 9000, normal: 7000, hard: 5500, insane: 4500 };
let dropClock = 0; // ms the current bit has waited
// Attacks build up, then go: the blocks a chain sends (after canceling what's headed your
// way) charge while the chains keep coming, and cross over once VS_SEND_MS pass with nothing
// added (and your drop has finished). The CPU's charge the same way.
const VS_SEND_MS = 1500;
let outgoing = 0; // your blocks charging, not yet sent
let outgoingAt = 0; // when the last were added
let cpuOutgoing = 0; // the CPU's blocks charging
let cpuOutgoingAt = 0;
let cpu = null;
let incoming = 0; // blocks headed for you
let cpuPending = 0; // blocks headed for the CPU
let cpuDown = false; // the CPU lost (the win shows once your drop finishes)
let vsLost = false; // you lost on points (the loss shows once your drop finishes)
let vsWhy = ''; // the result's line, for a win or loss on points
// Match points (every mode but CLASSIC, which shows the plain scores): yours and the CPU's.
// vsCounted: your score already counted in; stealPts: the part of it ATTRITION takes from the CPU.
let vsMe = 0;
let vsThem = 0;
let vsCounted = 0;
let stealPts = 0;
let vsStarted = false; // START pressed on the setup overlay
let vsPausedAt = 0; // (for AFK)
let vsLanded = 0; // this match: blocks that landed on your board
let vsSent = 0; // this match: blocks you sent at the CPU
let pauseQueued = false; // PAUSE pressed mid-drop: it opens once the drop finishes
let restartQueued = false; // RESTART from PAUSE: the new match starts without the setup screen
let cpuClock = 0;
const cpuStatEl = document.getElementById('cpu-stat');
const cpuFaceEl = document.getElementById('cpu-face'); // BOT, the CPU's face
const incomingEl = document.getElementById('incoming');
const vsBlocks = (points) => Math.min(VS_MAX_BLOCKS, Math.floor(points / VS_POINTS_PER_BLOCK));

function startVs() {
  incoming = 0;
  cpuPending = 0;
  outgoing = 0;
  cpuOutgoing = 0;
  dropClock = 0;
  cpuDown = false;
  vsLost = false;
  vsPaused = false;
  pauseQueued = false;
  document.getElementById('records-btn').classList.remove('pause-queued');
  vsLanded = 0;
  vsSent = 0;
  document.getElementById('vs-pause').hidden = true;
  document.querySelector('.board-frame').classList.remove('paused');
  vsWhy = '';
  vsMe = vsThem = vsMode === 'tug' ? vsPool : 0;
  vsCounted = score;
  stealPts = 0;
  cpuClock = 0;
  vsStarted = false;
  // The setup overlay: shown (popping back in) whenever a match hasn't started
  const setupWasShown = !vsSetupEl.hidden;
  vsSetupEl.hidden = mode !== 'vs';
  if (mode === 'vs' && !setupWasShown) { // (not when it's already up: changing an option)
    vsSetupEl.style.animation = 'none';
    void vsSetupEl.offsetWidth;
    vsSetupEl.style.animation = '';
  }
  lockButtons();
  if (mode !== 'vs') {
    cpu = null;
    showVs();
    return;
  }
  const rnd = seeded(hashString(`bytefall:vs:${vsSeed}:cpu`));
  const bits = seeded(hashString(`bytefall:vs:${vsSeed}:queue`)); // the same bits you get
  cpu = CpuBoard.create(vsLevel, rnd, () => 1 + Math.floor(bits() * CpuBoard.COLS), vsLayers ? BASE_INTERVAL : 0, vsBot, vsExploits);
  cpuFrames = []; // (a new match: nothing of the last one left to play)
  if (restartQueued) { // RESTART from PAUSE: straight into the new match
    restartQueued = false;
    vsStarted = true;
    vsSetupEl.hidden = true;
    setTimeout(updateHud); // (the first bit shows)
  }
  showVs();
}
function stopVs() {
  cpuClock = 0;
}

// Your attack, then the blocks still headed your way land
async function vsAfterDrop(points) {
  vsScored();
  sendToCpu(vsBlocks(points));
  while (incoming > 0 && !overflowed() && !gameOver && !vsLost && !cpuDown) {
    const n = Math.min(incoming, VS_MAX_BLOCKS);
    incoming -= n;
    showVs();
    const before = score;
    await takeGarbage(n);
    await resolveChains();
    vsScored();
    sendToCpu(vsBlocks(score - before)); // a chain set off by the garbage counts as an attack too
  }
  showVs();
}
// Your points since the last count go into the match (ATTRITION, DEATHMATCH, TUG OF WAR)
function vsScored() {
  const points = score - vsCounted;
  const steal = Math.min(stealPts, points);
  vsCounted = score;
  stealPts = 0;
  [vsMe, vsThem] = matchPoints(vsMe, vsThem, points, steal);
  vsCheck();
  updateHud();
}
// The CPU's points into the match
function cpuScored(points) {
  const steal = Math.min(cpu.takeSteal(), points);
  [vsThem, vsMe] = matchPoints(vsThem, vsMe, points, steal);
  vsCheck();
  updateHud();
}
// [scorer's, other side's] match points after the scorer scores `points` (`steal` of them
// from chains and bonuses)
function matchPoints(mine, theirs, points, steal) {
  if (vsMode === 'attrition') return [mine + points, Math.max(0, theirs - steal)];
  if (vsMode === 'tug') {
    const take = Math.min(points, theirs);
    return [mine + take, theirs - take];
  }
  return [mine + points, theirs];
}
// A win or loss on points: it shows once your drop (if one is playing) finishes
function vsCheck() {
  if (cpuDown || vsLost || mode !== 'vs') return;
  const race = vsMode === 'attrition' || vsMode === 'deathmatch';
  if (race && vsMe >= vsTarget) vsWin(`You reached ${fmt(vsTarget)} first.`);
  else if (race && vsThem >= vsTarget) vsLose(`The ${vsName()} reached ${fmt(vsTarget)} first.`);
  else if (vsMode === 'tug' && vsThem <= 0) vsWin(`The ${vsName()} ran out of points.`);
  else if (vsMode === 'tug' && vsMe <= 0) vsLose(`The ${vsName()} took all your points.`);
}
function vsWin(why) {
  cpuDown = true;
  vsWhy = why;
  if (!busy && !gameOver) endGame('win');
}
function vsLose(why) {
  vsLost = true;
  vsWhy = why;
  if (!busy && !gameOver) endGame('vs-lose');
}
// Your attack: it cancels the blocks headed your way (landing first, then the CPU's charging
// attack); the rest charges up to send
function sendToCpu(blocks) {
  if (blocks <= 0) return;
  let cancel = Math.min(blocks, incoming);
  incoming -= cancel;
  const fromCharge = Math.min(blocks - cancel, cpuOutgoing);
  cpuOutgoing -= fromCharge;
  cancel += fromCharge;
  if (cancel > 0) Progress.vsCanceled(cancel);
  const rest = blocks - cancel;
  vsSent += rest;
  if (rest > 0) {
    outgoing += rest;
    outgoingAt = performance.now();
  }
  showVs();
}
function sendToPlayer(blocks) {
  if (blocks <= 0) return;
  let cancel = Math.min(blocks, cpuPending);
  cpuPending -= cancel;
  const fromCharge = Math.min(blocks - cancel, outgoing);
  outgoing -= fromCharge;
  cancel += fromCharge;
  const rest = blocks - cancel;
  if (rest > 0) {
    cpuOutgoing += rest;
    cpuOutgoingAt = performance.now();
  }
  showVs();
}
// Charged attacks cross over once nothing has been added for VS_SEND_MS (yours also waits for
// your drop to finish); the cap applies as they land in the other side's queue
function releaseAttacks(now) {
  if (outgoing > 0 && !busy && now - outgoingAt >= VS_SEND_MS) {
    cpuPending = Math.min(vsCap(), cpuPending + outgoing);
    outgoing = 0;
    SFX.play('punct');
    showVs();
  }
  if (cpuOutgoing > 0 && now - cpuOutgoingAt >= VS_SEND_MS) {
    incoming = Math.min(vsCap(), incoming + cpuOutgoing);
    cpuOutgoing = 0;
    SFX.play('alert');
    showVs();
  }
}
// The drop clock ran out: the bit drops by itself
function autoDrop() {
  dropClock = 0;
  if (!queue.length) return;
  const open = columns.map((col, c) => (col.length < MAX_ROWS ? c : -1)).filter((c) => c >= 0);
  const safe = open.filter((c) => columns[c].length < ROWS);
  const pool = safe.length ? safe : open;
  if (!pool.length) return;
  const col = pool[Math.floor(Math.random() * pool.length)];
  setMessage('TIME // AUTO-DROP', 'warn');
  setTimeout(() => { if (messageEl.textContent === 'TIME // AUTO-DROP') setMessage(''); }, 1200);
  pivotFrom = null;
  attemptDrop(col);
  if (pivotFrom !== null) { // (PIVOT: the second tap, a neighbor)
    const next = [pivotFrom - 1, pivotFrom + 1].filter((c) => c >= 0 && c < COLS);
    attemptDrop(next[Math.floor(Math.random() * next.length)]);
  }
}
const dropTimerEl = document.getElementById('drop-timer');
function showDropClock() {
  const on = mode === 'vs' && vsStarted && !gameOver;
  dropTimerEl.hidden = !on;
  if (!on) return;
  const limit = VS_DROP_MS[vsLevel] || 7000;
  const left = Math.max(0, 1 - dropClock / limit);
  dropTimerEl.style.setProperty('--left', left.toFixed(3));
  dropTimerEl.classList.toggle('low', limit - dropClock < 2000 && !busy);
}

// Encrypted blocks drop onto the top of random columns
async function takeGarbage(n) {
  setMessage(`INCOMING // ${n} ENCRYPTED BLOCK${n === 1 ? '' : 'S'}`, 'alarm');
  for (let k = 0; k < n; k++) {
    const open = columns.map((col, c) => (col.length < MAX_ROWS ? c : -1)).filter((c) => c >= 0);
    if (!open.length) break;
    const c = open[Math.floor(Math.random() * open.length)];
    // Each block falls from the top (overflow) row into place, quickly, one at a time
    const block = newFirewall(1);
    vsLanded++;
    for (let r = MAX_ROWS - 1; r > columns[c].length; r--) {
      render([], { row: r, col: c, cell: block });
      await sleep(11);
    }
    columns[c].push(block);
    render();
    SFX.play('click');
    await sleep(20);
  }
  SFX.play('punct');
  await sleep(200);
  setMessage('');
}

// One CPU move: it drops a bit, attacks, then takes the blocks headed its way
function cpuMove() {
  const scored = cpu.step();
  cpuScored(scored);
  sendToPlayer(vsBlocks(scored));
  if (scored > 0) botMood('happy', 1100);
  if (cpu.used()) {
    botMood('happy', 1400);
    const note = `${CpuBoard.BOTS[vsBot].label} // ${HACKS[cpu.used()].name}`;
    if (!busy) {
      setMessage(note, 'warn');
      setTimeout(() => { if (messageEl.textContent === note) setMessage(''); }, 1800);
    }
  }
  if (cpuPending > 0 && !cpu.isDead()) {
    const n = Math.min(cpuPending, VS_MAX_BLOCKS);
    cpuPending -= n;
    const scoredToo = cpu.takeGarbage(n);
    cpuScored(scoredToo);
    sendToPlayer(vsBlocks(scoredToo));
    botMood('hit', 900); // your blocks land on its board
  }
  queueCpuFrames();
  if (cpu.isDead() && !cpuDown && !vsLost) {
    cpuDown = true;
    vsWhy = '';
    if (!busy && !gameOver) endGame('win');
  }
}

let lastCpuTick = performance.now();
setInterval(() => {
  const now = performance.now();
  const dt = now - lastCpuTick;
  lastCpuTick = now;
  if (mode !== 'vs' || !cpu || !vsStarted || gameOver || cpuDown || vsLost || vsPaused || document.hidden || panelOpen()) return;
  releaseAttacks(now);
  // Your drop clock runs while a bit waits (not mid-drop)
  if (busy) dropClock = 0;
  else {
    dropClock += dt;
    if (dropClock >= (VS_DROP_MS[vsLevel] || 7000)) autoDrop();
  }
  showDropClock();
  cpuClock += dt;
  if (cpuClock >= cpu.delay) {
    cpuClock -= cpu.delay;
    cpuMove();
  }
}, 100);

// The CPU's board beside your stats (numbers and layers), plus the blocks headed each way
const cpuGridEl = document.getElementById('cpu-grid');
const cpuFullEl = document.getElementById('cpu-full');
// The preview plays each CPU move back: the bit falling, landing, decrypting, layers peeling
// (their color changing) and new rows rising. Small: light effects; held full size: the same
// effects as your board (without its defrag background).
let cpuFrames = [];
let cpuPlaying = false;
function queueCpuFrames() {
  if (!cpu) return;
  cpuFrames.push(...cpu.takeFrames());
  if (!cpuPlaying) playCpuFrames();
}
async function playCpuFrames() {
  cpuPlaying = true;
  const match = cpu;
  while (cpuFrames.length && cpu === match) {
    const f = cpuFrames.shift();
    const fast = cpuFrames.length > 12; // falling behind: catch up
    if (f.fall) {
      for (let r = CpuBoard.MAX_ROWS - 1; r > f.fall.row; r--) {
        drawCpu(f, { row: r, col: f.fall.col, val: f.fall.val });
        await sleep(fast ? 8 : STEP_MS);
      }
    } else {
      drawCpu(f);
      await sleep(fast ? 20 : f.pops ? 220 : f.gone ? 120 : f.rose ? 150 : 60);
    }
  }
  cpuPlaying = false;
  if (cpu === match) drawCpu();
}
const cpuHas = (list, r, c) => !!list && list.some(([lr, lc]) => lr === r && lc === c);

// frame: a recorded moment (the live board if left out); falling: a bit on its way down
function drawCpu(frame, falling = null) {
  if (!cpu) return;
  if (!frame && cpuPlaying) return; // the playback draws
  const view = frame || { columns: cpu.columns() };
  const cols = view.columns;
  const glyphs = themeIs('glyph');
  cpuGridEl.innerHTML = '';
  cpuGridEl.style.setProperty('--cpu-cols', CpuBoard.COLS); // (7 or 8, by the level)
  for (let r = CpuBoard.MAX_ROWS - 1; r >= 0; r--) {
    for (let c = 0; c < CpuBoard.COLS; c++) {
      const b = falling && falling.row === r && falling.col === c ? { type: 'number', val: falling.val } : cols[c][r];
      const i = document.createElement('i');
      if (r >= CpuBoard.ROWS) i.classList.add('over');
      if (r === CpuBoard.ROWS) i.classList.add('over-edge');
      if (r === 0) i.classList.add('under-edge');
      if (b && b.type === 'number') {
        i.classList.add('bit');
        if (glyphs) i.innerHTML = glyphSvg(b.val);
        else i.textContent = b.val;
        spinBit(i, b);
      } else if (b && b.type === 'firewall') {
        i.classList.add('layer');
        if (b.level < 2) i.classList.add('cracked');
        i.textContent = b.level < 2 ? '-' : '=';
      }
      if (cpuHas(view.pops, r, c)) i.classList.add('pop');
      if (cpuHas(view.landed, r, c)) i.classList.add('landed');
      if (cpuHas(view.peeled, r, c)) i.classList.add('peeled');
      cpuGridEl.appendChild(i);
    }
  }
  const tallest = Math.max(...cols.map((col) => col.filter(Boolean).length));
  cpuStatEl.classList.toggle('low', tallest >= CpuBoard.ROWS - 1);
  cpuGridEl.classList.toggle('layer-next', cpu.layerIn() === 1); // its bottom edge flashes amber
  if (!cpuFullEl.hidden) drawCpuFull(view, falling);
}

// Held: the CPU's board at full size, drawn like yours, with your board's effects
function drawCpuFull(view = cpuPlaying ? null : { columns: cpu.columns() }, falling = null) {
  if (!view) return; // the playback draws it on its next frame
  const cols = view.columns;
  cpuFullEl.innerHTML = '';
  cpuFullEl.style.setProperty('--cols', CpuBoard.COLS);
  const bursts = [];
  for (let r = CpuBoard.MAX_ROWS - 1; r >= 0; r--) {
    for (let c = 0; c < CpuBoard.COLS; c++) {
      const b = falling && falling.row === r && falling.col === c ? { type: 'number', val: falling.val } : cols[c][r];
      const div = document.createElement('div');
      div.className = 'cell';
      if (r >= CpuBoard.ROWS) div.classList.add('overflow');
      if (b && b.type === 'number') {
        div.classList.add('disc');
        fillBit(div, b.val);
        spinBit(div, b);
      } else if (b && b.type === 'firewall') {
        div.classList.add('firewall');
        if (b.level < 2) div.classList.add('cracked');
        div.textContent = b.level < 2 ? '[-]' : '[=]';
      }
      if (cpuHas(view.pops, r, c)) {
        div.classList.add('pop');
        bursts.push({ el: div, type: 'number' });
      }
      if (cpuHas(view.landed, r, c)) div.classList.add('landed');
      cpuFullEl.appendChild(div);
    }
    if (r === CpuBoard.ROWS) {
      const line = document.createElement('div');
      line.className = cols.some((col) => col.filter(Boolean).length >= CpuBoard.ROWS) ? 'overflow-line hot' : 'overflow-line';
      line.textContent = '='.repeat(80);
      cpuFullEl.appendChild(line);
    }
  }
  cpuFullEl.appendChild(layerLine(cpu.layerIn() === 1));
  if (bursts.length) FX.burst(bursts);
}
function holdCpu(on) {
  if (!cpu || mode !== 'vs') on = false;
  cpuFullEl.hidden = !on;
  if (on) drawCpuFull();
}
cpuStatEl.addEventListener('pointerdown', (e) => {
  if (!cpu) return;
  cpuStatEl.setPointerCapture(e.pointerId);
  holdCpu(true);
});
for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) cpuStatEl.addEventListener(type, () => holdCpu(false));
cpuStatEl.addEventListener('contextmenu', (e) => e.preventDefault()); // a long press shouldn't open a menu

// BOT, the CPU's face: a mood for a moment (happy when it scores, hit when your blocks land),
// otherwise its standing mood: dead / smug once the match is over, worried with a tall stack,
// thinking just before a move, idle
const botSayEl = document.getElementById('bot-say');
// Its lines: at rest by level, and each bot's own for the rest
const BOT_REST = { easy: 'HI!', normal: 'READY', hard: 'GRR', insane: 'MAX CPU' };
const BOT_LINES = {
  bot: { think: '...', happy: 'HA!', hit: 'OOF', worried: 'UH OH', dead: 'ERR', smug: 'GG', annoyed: 'ANY DAY NOW', devious: 'HEH HEH' },
  grifter: { think: 'HMM', happy: 'MINE!', hit: 'HEY!', worried: 'NO NO', dead: 'BROKE', smug: 'PAY UP', annoyed: 'TICK TOCK', devious: 'OH YES' },
  bunker: { think: '...', happy: 'STEADY', hit: 'HOLD', worried: 'BRACE', dead: 'BREACH', smug: 'SECURE', annoyed: 'WAITING', devious: 'PLANNING' },
  glitch: { think: '?#@', happy: 'H4H4', hit: 'ERR0R', worried: 'W4RN', dead: 'NULL', smug: 'G_G', annoyed: '-_-', devious: '>:)' },
};
let botFlash = null; // { mood, until, say }: a reaction, ahead of the waiting and planning faces
// Each bot's hello when picked, and lines for the faces BOT_LINES doesn't cover
const BOT_HELLO = { bot: 'happy', grifter: 'smug', bunker: 'skeptic', glitch: 'devious' };
const MOOD_LINES = { skeptic: '...?', scared: 'EEK!', surprised: '!?', love: '<3', dizzy: '@_@', laugh: 'HAHA', tired: 'PHEW' };
// Now and then its waiting (idle) and planning (think) faces take a variant: waiting BORED
// (half-lidded, sighing) or TAPPING (glancing up, a foot tapping); planning SCAN (eyes sweeping
// the board) or PONDER (looking up, a hand to its chin). The level's own face shows otherwise.
const BOT_VARIANTS = { idle: ['', '', 'bored', 'tapping'], think: ['', 'scan', 'ponder'] };
const BOT_VARIANT_LINES = { bored: 'ZZZ', tapping: 'YOUR MOVE', scan: 'CALC...', ponder: 'HMM...' };
let botVariant = { mood: null, v: '', until: 0 };
// The waiting faces (ZZZ, YOUR MOVE) only on the setup screen, 8 seconds after the last setting
// was touched, and only for the easygoing ones: BOT, GRIFTER and BUNKER on EASY or NORMAL. HARD
// says HURRY UP... instead, its angry face and all; GLITCH and INSANE just wait.
const WAIT_MS = 8000;
let vsTouchedAt = performance.now();
document.getElementById('vs-setup').addEventListener('pointerdown', () => { vsTouchedAt = performance.now(); }, true);
const waitedLong = () => {
  if (vsStarted) vsTouchedAt = performance.now(); // (back on the setup screen after a match: 8s from then)
  return !vsStarted && performance.now() - vsTouchedAt > WAIT_MS;
};
const waitsIdly = () => ['bot', 'grifter', 'bunker'].includes(vsBot) && ['easy', 'normal'].includes(vsLevel);
function botVariantFor(mood) {
  const opts = BOT_VARIANTS[mood];
  if (!opts) {
    botVariant = { mood, v: '', until: 0 };
    return '';
  }
  const now = performance.now();
  if (botVariant.mood !== mood || now > botVariant.until) {
    // (a new pick on each change of mood, and every 5-9s of a long wait)
    botVariant = { mood, v: opts[Math.floor(Math.random() * opts.length)], until: now + 5000 + Math.random() * 4000 };
  }
  return botVariant.v;
}
// A new bot picked: the old one pixelates out, then the new one resolves in (0.25s each)
let botSwapping = false;
function swapBot() {
  if (!cpuFaceEl.dataset.shown || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    cpuFaceEl.dataset.bot = vsBot; // (the first draw, or no motion: straight in)
    cpuFaceEl.dataset.shown = '1';
    return;
  }
  if (cpuFaceEl.dataset.bot === vsBot || botSwapping) return;
  botSwapping = true;
  cpuFaceEl.classList.add('pix-out');
  setTimeout(() => {
    cpuFaceEl.dataset.bot = vsBot;
    cpuFaceEl.classList.replace('pix-out', 'pix-in');
    setTimeout(() => {
      cpuFaceEl.classList.remove('pix-in');
      botSwapping = false;
      swapBot(); // (picked again mid-swap: carry on to the latest)
    }, 250);
  }, 250);
}
function botMood(flash = null, ms = 900, sayThis = '') {
  if (flash) botFlash = { mood: flash, until: performance.now() + ms, say: sayThis };
  let mood = 'idle';
  if (gameOver && vsStarted) mood = cpuDown ? 'dead' : 'smug';
  else if (vsPaused) mood = 'paused'; // -_- : waiting for you to come back
  else if (botFlash && performance.now() < botFlash.until) mood = botFlash.mood;
  else if (cpu && Math.max(...cpu.columns().map((c) => c.length)) >= CpuBoard.ROWS - 1) mood = 'worried';
  else if (vsStarted && cpu && cpu.held()) mood = 'devious'; // holding an exploit: scheming
  else if (vsStarted && cpu && cpuClock > cpu.delay - 450) mood = 'think';
  cpuFaceEl.dataset.level = vsLevel;
  swapBot();
  let variant = botVariantFor(mood);
  if (mood === 'idle' && !(waitedLong() && waitsIdly())) variant = '';
  const hurry = mood === 'idle' && waitedLong() && vsLevel === 'hard' && vsBot !== 'glitch';
  const flashing = botFlash && performance.now() < botFlash.until && mood === botFlash.mood;
  const say = flashing && botFlash.say ? botFlash.say
    : variant ? BOT_VARIANT_LINES[variant] : hurry ? 'HURRY UP...' : mood === 'idle' ? BOT_REST[vsLevel] : mood === 'paused' ? "I'LL WAIT"
      : BOT_LINES[vsBot][mood] || MOOD_LINES[mood] || '';
  if (cpuFaceEl.dataset.mood !== mood || (cpuFaceEl.dataset.variant || '') !== variant || botSayEl.textContent !== say) {
    cpuFaceEl.dataset.mood = mood;
    if (variant) cpuFaceEl.dataset.variant = variant;
    else delete cpuFaceEl.dataset.variant;
    botSayEl.textContent = say;
  }
}
setInterval(() => { if (mode === 'vs' && cpu) botMood(); }, 150);

// Poking the CPU's face: 40% it's startled (EEK!); otherwise it's put out (HEY!), shakes itself off
// in a puff of dust and gives you a raised eyebrow, as the start screen's bots do. Seven quick
// taps in a row count down to a developer mode that isn't there.
let cpuPoking = false;
let devTaps = 0;
let devTapAt = 0;
let devMsgTimer = 0;
function pokeCpu() {
  if (cpuPoking) return;
  cpuPoking = true;
  Progress.botEvent('pokes');
  const bot = vsBot;
  if (vsLevel === 'insane') { // (rabid: a head shake, a snarl, then it snaps at you)
    cpuFaceEl.classList.add('headshaking');
    botMood('angry', 700, 'GRR');
    setTimeout(() => { cpuFaceEl.classList.remove('headshaking'); botMood('snarl', 500, 'GRRR'); }, 650);
    setTimeout(() => { cpuFaceEl.classList.add('snapping'); botMood('snarl', 700, 'SNAP!'); Progress.botEvent('bitten'); announce(Progress.check()); }, 1050);
    setTimeout(() => { cpuFaceEl.classList.remove('snapping'); botMood('angry', 900); }, 1700);
    setTimeout(() => { cpuPoking = false; }, 2600);
    return;
  }
  if (vsLevel === 'hard') { // (a little less: a head shake and a growl, no bite)
    cpuFaceEl.classList.add('headshaking');
    botMood('angry', 1400, 'GRR!');
    setTimeout(() => cpuFaceEl.classList.remove('headshaking'), 650);
    setTimeout(() => { cpuPoking = false; }, 1600);
    announce(Progress.check());
    return;
  }
  if (Math.random() < 0.4) {
    botMood('scared', 1200, 'EEK!');
    setTimeout(() => { cpuPoking = false; }, 1200);
  } else {
    botMood('annoyed', 1500, 'HEY!');
    setTimeout(() => {
      cpuFaceEl.classList.add('shaking');
      for (let k = 0; k < 8; k++) {
        const d = document.createElement('i');
        d.className = 'walker-dust';
        d.style.setProperty('--dx', `${Math.round(Math.random() * 44 - 22)}px`);
        d.style.setProperty('--dy', `${Math.round(Math.random() * 22 - 18)}px`);
        d.style.animationDelay = `${k * 60}ms`;
        cpuFaceEl.appendChild(d);
        setTimeout(() => d.remove(), 800 + k * 60);
      }
    }, 600);
    setTimeout(() => {
      cpuFaceEl.classList.remove('shaking');
      botMood('skeptic', 1500); // (the raised eyebrow, at you)
      Progress.botEvent(`eyebrow-${bot}`);
      announce(Progress.check());
    }, 1500);
    setTimeout(() => { cpuPoking = false; }, 3000);
  }
  announce(Progress.check());
}
cpuFaceEl.addEventListener('click', () => {
  const now = performance.now();
  devTaps = now - devTapAt < 700 ? devTaps + 1 : 1;
  devTapAt = now;
  clearTimeout(devMsgTimer);
  if (devTaps >= 7) {
    devTaps = 0;
    setMessage('NO NEED. THERE IS NO DEV MODE HERE.', 'warn');
    botMood(vsBot === 'glitch' ? 'smug' : 'laugh', 2000, 'NICE TRY');
    Progress.botEvent('dev-taps');
    announce(Progress.check());
  } else if (devTaps >= 3) {
    const left = 7 - devTaps;
    setMessage(`YOU ARE ${left} TAP${left === 1 ? '' : 'S'} AWAY FROM BEING A DEVELOPER`);
  }
  if (devTaps >= 3 || devTaps === 0) devMsgTimer = setTimeout(() => setMessage(''), 1600);
  if (devTaps < 3) pokeCpu();
});

// START: the setup overlay bursts apart and the match (and the CPU's clock) begins
const vsSetupEl = document.getElementById('vs-setup');
function startMatch() {
  if (mode !== 'vs' || vsStarted || gameOver) return;
  vsStarted = true;
  showVs(); // (the play style card goes, PAUSE takes the corner)
  FX.burst([{ el: vsSetupEl, type: 'warning' }]);
  vsSetupEl.hidden = true;
  syncVsSetup(); // (the board takes the card's place)
  SFX.play('static');
  updateHud(); // the first bit shows
}
document.getElementById('vs-start').addEventListener('click', startMatch);

// QUIT: back to the mode you came from (two presses mid-match, like RESTART)
const vsQuitBtn = document.getElementById('vs-quit');
// QUIT: in a match, a second press (it turns red on the first) ends it and goes back to the VS
// menu; on the VS menu, one press goes back to the previous mode
function quitVs() {
  if (vsStarted && !gameOver) { // in a match: PAUSE
    requestPause();
    return;
  }
  if (vsStarted) {
    requestReset(vsQuitBtn, 'TAP AGAIN TO QUIT'); // the new run starts at the VS menu
    return;
  }
  if (busy && !gameOver) return;
  showHome(); // (VS stays picked there)
}
vsQuitBtn.addEventListener('click', quitVs);

// PAUSE (the top-left icon in a game, and the lower-left corner in a VS match): the board is
// covered as on the VS setup screen and the clocks (BLITZ's, the CPU's) stop. RESUME carries on;
// RESTART (VS: a new match, same options) and EXIT (VS: back to its setup screen) each take a
// second tap to confirm. RULES & RECORDS and SETTINGS open over it; MAIN MENU leaves it paused.
// (Not in the tutorial, which keeps the top icons for its lessons.)
const vsPauseEl = document.getElementById('vs-pause');
const canPause = () => !gameOver && (mode !== 'vs' || vsStarted);
function requestPause() {
  if (busy) { pauseQueued = true; recordsBtn.classList.add('pause-queued'); } // (once the drop finishes; lit meanwhile, so the tap shows it took)
  else openPause();
}
function openPause() {
  pauseQueued = false;
  recordsBtn.classList.remove('pause-queued');
  if (!canPause() || vsPaused) return;
  vsPaused = true;
  vsPausedAt = performance.now();
  document.getElementById('pause-note').textContent = mode === 'vs' ? 'The CPU is waiting for you.' : 'The game is waiting for you.';
  requestAnimationFrame(() => { for (const el of document.querySelectorAll('#pause-note, .vs-pause .pause-row button, #pause-menu')) fitText(el); });
  document.getElementById('pause-exit').hidden = mode !== 'vs';
  // (the tutorial: no RESTART or MAIN MENU; its banner's EXIT leaves)
  for (const id of ['pause-restart', 'pause-menu']) document.getElementById(id).hidden = mode === 'tutorial';
  vsPauseEl.classList.remove('closing');
  vsPauseEl.hidden = false;
  document.querySelector('.board-frame').classList.add('paused'); // (the pieces fade out)
  SFX.play('static');
  if (mode === 'vs') botMood();
  updatePauseBtn();
  updateColumnButtons(); // (the drop buttons off while it's paused)
}
function resumeMatch() {
  if (!vsPaused) return;
  disarmReset();
  vsPaused = false;
  if (mode === 'vs' && performance.now() - vsPausedAt >= 5 * 60 * 1000) {
    Progress.secret('afk');
    announce(Progress.check());
  }
  // The options fade out and the pieces fade back in
  vsPauseEl.classList.add('closing');
  document.querySelector('.board-frame').classList.remove('paused');
  setTimeout(() => {
    if (!vsPaused) vsPauseEl.hidden = true;
    vsPauseEl.classList.remove('closing');
  }, 150);
  SFX.play('static');
  if (mode === 'vs') botMood();
  updatePauseBtn();
  updateColumnButtons(); // (the drop buttons back on)
}
// RESTART / EXIT: the first tap arms (CONFIRM?), the second melts the board and starts over
function pauseConfirm(btn, apply) {
  if (!armed || armed.btn !== btn) {
    armReset(btn, 'CONFIRM?');
    return;
  }
  vsPauseEl.hidden = true; // (still paused: the CPU waits out the melt)
  document.querySelector('.board-frame').classList.remove('paused'); // (the melt shows)
  requestReset(btn, 'CONFIRM?', apply);
}
document.getElementById('pause-resume').addEventListener('click', resumeMatch);
document.getElementById('pause-restart').addEventListener('click', (e) => pauseConfirm(e.currentTarget, () => { if (mode === 'vs') restartQueued = true; }));
document.getElementById('pause-exit').addEventListener('click', (e) => pauseConfirm(e.currentTarget));
document.getElementById('pause-records').addEventListener('click', () => setRecordsOpen(true, rulesPane));
document.getElementById('pause-exploits').addEventListener('click', () => setRecordsOpen(true, 'exploits'));
document.getElementById('pause-store').addEventListener('click', () => setRecordsOpen(true, 'store'));
document.getElementById('pause-settings').addEventListener('click', () => setSettingsOpen(true));
document.getElementById('pause-menu').addEventListener('click', () => showHome());
document.getElementById('home-records').addEventListener('click', () => setRecordsOpen(true, rulesPane));
document.getElementById('home-exploits').addEventListener('click', () => setRecordsOpen(true, 'exploits'));
document.getElementById('home-store').addEventListener('click', () => setRecordsOpen(true, 'store'));
document.getElementById('home-settings').addEventListener('click', () => setSettingsOpen(true));
document.addEventListener('keydown', (e) => {
  if ((e.key !== 'Escape' && e.key !== 'p' && e.key !== 'P') || panelOpen() || homeOpen) return;
  if (vsPaused) resumeMatch();
  else if (canPause()) requestPause();
});
// The corner button: PAUSE in a match, QUIT otherwise
function updatePauseBtn() {
  const pause = mode === 'vs' && vsStarted && !gameOver;
  vsQuitBtn.classList.toggle('as-pause', pause);
  vsQuitBtn.setAttribute('aria-label', pause ? 'Pause' : 'Quit VS');
  vsQuitBtn.title = pause ? 'Pause' : 'Quit';
  updateTopIcons();
}

// MAIN MENU: between the start screen and a game (START comes here, and BACK, EXIT and the pause
// screen's MAIN MENU come back to it). The six modes and the picked one's panel: its options
// (difficulty, the daily game, the puzzle), what it is, your best, and PLAY (RESUME when a game
// of it is under way: switching modes then asks first, as a restart does). A game under way is
// paused while the menu is up.
const homeEl = document.getElementById('home');
const homePlayBtn = document.getElementById('home-play');
// The mode's name: on the menu's panel and under the title in a game
function modeLine() {
  if (mode === 'tutorial') return 'TUTORIAL';
  if (mode === 'classic') return `CLASSIC // ${DIFFICULTIES[classicDifficulty].label}`;
  if (mode === 'puzzle' && !daily) return `PUZZLE // ${tierLabel()} ${puzzleIndex + 1}`;
  if (daily) return `${DAILY_KINDS[mode]}${dailyOfficial ? '' : ' // PRACTICE'}`;
  return MODES[mode].label;
}
function updateHome() {
  document.getElementById('home-mode-name').textContent = `// ${daily ? 'DAILY' : MODES[mode].label}`;
  // BEST: the mode's best (not for DAILY: its cards show today's official scores)
  const key = mode === 'vs' || mode === 'tutorial' || mode === 'puzzle' || daily ? null : bestKey(); // (DAILY: each card says how today stands)
  const kept = key ? storage.get(key) : null;
  document.getElementById('home-best').innerHTML = !key || (daily && kept == null) ? ''
    : `${daily ? 'TODAY' : 'BEST'} <b>${fmt(Number(kept) || 0)}</b>`;
  homePlayBtn.textContent = inAGame() && mode !== 'tutorial' ? 'RESUME' : 'PLAY';
  refreshBoosterRow();
  refreshStarterRow();
  fitHome(); // (the words fitted to their boxes; again once the mode's rows have all settled)
  refitHome();
}
function updateTopIcons() {
  const inGame = !homeOpen; // (the tutorial too: PAUSE, as in a game)
  const was = document.body.className;
  document.body.classList.toggle('in-game', inGame);
  document.body.classList.toggle('can-pause', inGame && (canPause() || vsPaused));
  document.body.classList.toggle('at-home', homeOpen);
  if (document.body.className !== was && inGame) { // (PAUSE or BACK in the corner now: locked to its Courier size, the title fitted beside it)
    lockButtons();
    alignHeader();
  }
  document.getElementById('records-btn').setAttribute('aria-label', !inGame ? 'Menu: rules, exploits and records' : vsPaused ? 'Resume' : canPause() ? 'Pause' : 'Back to the main menu');
}
// Fixed boxes, fitted words: the main menu's buttons and panel keep one size in every mode, font
// and TEXT SIZE (style.css); what's written in them shrinks, when it must, to fit. Each element's own
// size is the start (its CSS), so a smaller font or TEXT SIZE never shrinks it past that
function fitText(el, min = 7) {
  if (!el || el.hidden || !el.offsetParent) return;
  el.style.fontSize = '';
  const cs = getComputedStyle(el);
  const room = el.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
  const words = document.createRange();
  words.selectNodeContents(el);
  // (the words' own width too: centered or right-aligned words spill out on the left, where the
  // box's scroll width doesn't count them)
  const over = () => el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1 || words.getBoundingClientRect().width > room + 1;
  let size = parseFloat(cs.fontSize);
  while (over() && size > min) {
    size -= 0.5;
    el.style.fontSize = `${size}px`;
  }
}
function fitHome() {
  if (homeEl.hidden) return;
  const FIT = '#level-bar, .home .modes button, .home-row button, #home-play, #difficulty-row button, .home .home-opts button, #home-best, #home-mode-name';
  for (const el of homeEl.querySelectorAll(FIT)) fitText(el, 10); // (single lines; never under 10px)
  fitText(homeEl.querySelector('.home-head'), 10); // (the title, between BACK and the far edge)
  homePanelMore();
}
// (and the game's other set boxes with words that change: the message line, VS's setup note)
// The panel's body: faded at its foot while there's more to scroll to
const homePanelBody = document.getElementById('home-panel-body');
function homePanelMore() {
  const b = homePanelBody;
  b.classList.toggle('more', b.scrollHeight - b.scrollTop - b.clientHeight > 2);
}
homePanelBody.addEventListener('scroll', homePanelMore, { passive: true });
function refitHome() { requestAnimationFrame(() => { fitHome(); for (const id of ['message', 'pause-note']) fitText(document.getElementById(id)); }); }
window.addEventListener('resize', refitHome);
if (document.fonts) document.fonts.addEventListener('loadingdone', refitHome);
// The MAIN MENU is laid out for the phone the game's designed on (its card 352 x 791); on a bigger card
// (a browser window) it's scaled up to fill it as the game's board does, never down
const HOME_BASE = [352, 791];
function zoomHome() {
  const r = crtEl.getBoundingClientRect();
  if (!r.width) return;
  const z = Math.min(1.6, r.width / HOME_BASE[0], r.height / HOME_BASE[1]);
  homeEl.style.zoom = z > 1.02 ? z.toFixed(3) : '';
  homeEl.style.setProperty('--home-zoom', z > 1.02 ? z.toFixed(3) : '1'); // (← BACK undoes it: one size, as PAUSE and every BACK)
}
addEventListener('resize', () => { zoomHome(); refitHome(); });
requestAnimationFrame(zoomHome);
function showHome() {
  zoomHome();
  if (xpHold || pendingEarned.length) flushEarned(); // (out of a game: what it held back shows now)
  if (mode === 'tutorial') return; // (the lesson leaves by its own EXIT, which comes here)
  disarmReset();
  setRecordsOpen(false);
  setSettingsOpen(false);
  if (inAGame() && !vsPaused) requestPause(); // (kept for RESUME)
  homeOpen = true;
  homeEl.hidden = false;
  updateHome();
  if (daily) { renderDailyCards(); applyModeUi(); } // (how today stands, after a game)
  fitHome();
  updateTopIcons();
  lockButtons(); // (the menu's buttons, now they can be measured)
}
function hideHome() {
  if (!homeOpen) return;
  disarmReset();
  homeOpen = false;
  homeEl.hidden = true;
  updateTopIcons();
  fitBoard();
}
window.showHome = showHome;
window.homeIsOpen = () => homeOpen;
homePlayBtn.addEventListener('click', () => {
  if (busy && !gameOver) return; // (a mode switch still melting the old board)
  if (mode === 'puzzle' && !daily && !inAGame()) { // (PUZZLE: pick one first)
    setRecordsOpen(true, 'puzzles');
    return;
  }
  if (gameOver) resetNow();
  hideHome();
  if (vsPaused) resumeMatch();
  SFX.play('static');
});
document.getElementById('overlay-menu-btn').addEventListener('click', () => {
  resetNow();
  showHome();
  if (mode === 'puzzle' && !daily) setRecordsOpen(true, 'puzzles'); // (PUZZLE: back to the puzzles)
});
// (fitted again once a font finishes loading: it measures differently)
if (document.fonts) document.fonts.addEventListener('loadingdone', () => showCpuDesc());
// Before START: the picked bot's play style over its board
function showCpuDesc() {
  const el = document.getElementById('cpu-desc');
  el.hidden = mode !== 'vs' || vsStarted;
  if (el.hidden) return;
  const [kind, text] = CpuBoard.BOTS[vsBot].desc.split(' // ');
  el.innerHTML = `<b>${kind}</b><span>${text}</span>`;
  el.style.fontSize = '';
  let size = parseFloat(getComputedStyle(el).fontSize);
  const kindEl = el.querySelector('b');
  const tooBig = () => el.scrollHeight > el.clientHeight + 1 || kindEl.getBoundingClientRect().width > el.clientWidth - 8;
  while (tooBig() && size > 7) el.style.fontSize = `${(size -= 0.5)}px`;
}

// The status line over your stats (the target, or the points each side starts with), and how many
// stat rows the left column has
function updateVsChrome() {
  const rows = [...document.querySelectorAll('.hud > .stat:not(.cpu-stat):not(.cpu-face), .hud > .hud-bits')].filter((el) => !el.hidden && getComputedStyle(el).display !== 'none').length;
  document.getElementById('vs-status').textContent = vsGoalText();
  fitVsStatus();
  document.querySelector('.hud').style.setProperty('--vs-rows', rows);
}

// VS: under the header (BYTEFALL and VS. CPU // the game mode, as every game has), the HUD starts where
// the regular HUD does and takes the room to where it ends (at least VS_TOP_MIN), so your board keeps
// its regular size and place. Measured by briefly laying out the regular header and HUD.
const VS_TOP_MIN = 168;
function layoutVsTop() {
  const hud = document.querySelector('.hud');
  hud.style.height = '';
  hud.style.marginTop = '';
  if (mode !== 'vs') return;
  // Laid out as Classic shows it: the difficulty row on, no mode note
  const diffRow = document.getElementById('difficulty-row');
  const info = document.getElementById('mode-info');
  const wasHidden = [diffRow.hidden, info.hidden];
  document.body.classList.remove('vs-mode');
  document.body.classList.add('vs-measure'); // (Classic's header pinned to the top, as Classic has it: nothing under the HUD, the board's 7x7 or 8x8 say, moves where it ends)
  cpuStatEl.hidden = true;
  cpuFaceEl.hidden = true;
  diffRow.hidden = false;
  info.hidden = true;
  // (relative to the game card, which can move as the page re-centers)
  const cardTop = () => crtEl.getBoundingClientRect().top;
  // (8px under the header, as Classic's panels sit)
  const top = hud.getBoundingClientRect().top - cardTop();
  // (at least VS_TOP_MIN tall: the regular HUD is shorter than VS's squares, BOT and the CPU's board
  // need, so the board comes down and fitBoard shrinks it to fit where it must)
  const bottom = Math.max(hud.getBoundingClientRect().bottom - cardTop(), top + VS_TOP_MIN);
  [diffRow.hidden, info.hidden] = wasHidden;
  cpuStatEl.hidden = false;
  cpuFaceEl.hidden = false;
  document.body.classList.remove('vs-measure');
  document.body.classList.add('vs-mode');
  hud.style.marginTop = '0px';
  const vsTop = hud.getBoundingClientRect().top - cardTop();
  hud.style.marginTop = `${top - vsTop}px`;
  hud.style.height = `${bottom - top}px`;
  layoutVsSquares();
  fitVsStatus();
}
// The 2x2 info squares: exactly as tall as the strip allows under the status line (6px gaps),
// BOT's box and the CPU's board sharing the width left; unless that would squeeze those two
// below 80px wide, when the squares give way
function layoutVsSquares() {
  const hud = document.querySelector('.hud');
  const GAP = 6;
  const statusH = document.getElementById('vs-status').offsetHeight;
  const W = hud.clientWidth;
  let sq = (parseFloat(hud.style.height) - statusH - 2 * GAP) / 2;
  let cpuW = (W - 3 * GAP - 2 * sq) / 2;
  if (cpuW < 80) {
    cpuW = 80;
    sq = (W - 3 * GAP - 2 * cpuW) / 2;
  }
  hud.style.setProperty('--vs-cpu-w', `${Math.floor(cpuW)}px`);
  hud.style.setProperty('--vs-sq', `${Math.floor(sq)}px`);
}
// The VS info line shrinks to fit its column
function fitVsStatus() {
  const el = document.getElementById('vs-status');
  el.style.fontSize = '';
  el.style.letterSpacing = '';
  if (mode !== 'vs') return;
  let size = parseFloat(getComputedStyle(el).fontSize);
  if (el.scrollWidth > el.clientWidth) el.style.letterSpacing = '0px';
  while (el.scrollWidth > el.clientWidth && size > 6) {
    size -= 0.5;
    el.style.fontSize = `${size}px`;
  }
}

// THE SCORE BAR, above the grid in VS on points. ATTRITION and DEATHMATCH: two halves filling
// from the middle outward toward the target, yours to the left, the CPU's to the right. TUG OF
// WAR: one bar split where the points stand, a | marker sliding left or right as they change
// hands (yours on the left).
function updateVsBar() {
  const vsBarEl = document.getElementById('vs-bar'); // (looked up here: updateHud can call this early)
  const on = mode === 'vs' && vsMode !== 'classic';
  vsBarEl.hidden = !on;
  // (its room kept in every VS game type, CLASSIC too: the board stays one size as you switch)
  boardEl.parentElement.classList.toggle('with-vs-bar', mode === 'vs');
  if (!on) return;
  const me = cpu ? matchPoints(vsMe, vsThem, score - vsCounted, 0)[0] : (vsMode === 'tug' ? vsPool : 0);
  const them = cpu ? vsThem : (vsMode === 'tug' ? vsPool : 0);
  const mine = vsBarEl.querySelector('.mine');
  const theirs = vsBarEl.querySelector('.theirs');
  const mark = vsBarEl.querySelector('.mark');
  vsBarEl.classList.toggle('tug', vsMode === 'tug');
  if (vsMode === 'tug') {
    const at = me + them > 0 ? (me / (me + them)) * 100 : 50;
    Object.assign(mine.style, { left: '0', right: '', width: `${at}%` });
    Object.assign(theirs.style, { left: `${at}%`, right: '', width: `${100 - at}%` });
    mark.style.left = `${at}%`;
  } else {
    const half = (n) => Math.min(1, Math.max(0, n / vsTarget)) * 50;
    Object.assign(mine.style, { left: '', right: '50%', width: `${half(me)}%` });
    Object.assign(theirs.style, { left: '50%', right: '', width: `${half(them)}%` });
    mark.style.left = '50%';
  }
}

function showVs() {
  updateVsBar();
  const vs = mode === 'vs' && !!cpu;
  cpuStatEl.hidden = !vs;
  cpuFaceEl.hidden = !vs;
  if (vs) botMood();
  incomingEl.hidden = !vs || (incoming === 0 && cpuOutgoing === 0);
  showDropClock();
  showCpuDesc();
  updatePauseBtn();
  syncVsSetup();
  if (!vs) return;
  // ▼ 14 INCOMING, then a pip for each block (up to 32, in groups of 8)
  // (and the CPU's charging attack as hollow pips, +n)
  const charging = Math.min(cpuOutgoing, Math.max(0, 32 - incoming));
  incomingEl.innerHTML = `<span>\u25BC ${incoming} INCOMING${cpuOutgoing ? ` +${cpuOutgoing}` : ''}</span><span class="pips">${'<i></i>'.repeat(incoming)}${'<i class="charging"></i>'.repeat(charging)}</span>`;
  // CPU // its score (or match points), and the blocks headed its way
  const cpuPts = vsMode === 'classic' ? cpu.score() : vsThem;
  document.getElementById('cpu-label').innerHTML = `CPU // <b class="cpu-score">${fmt(cpuPts)}</b>${cpuPending ? ` \u25BC${cpuPending}` : ''}${outgoing ? ` <span class="charging">+${outgoing}</span>` : ''}`;
  drawCpu();
}

// SHARE (DAILY): the phone's share sheet where there is one, otherwise copy to the clipboard.
const shareBtn = document.getElementById('overlay-share-btn');
function dailyShareText() {
  const run = Progress.runStats();
  const bar = (part, whole) => {
    const filled = Math.round((Math.min(part, whole) / whole) * 10);
    return `${'\u25AE'.repeat(filled)}${'\u25AF'.repeat(10 - filled)}`;
  };
  const head = `BYTEFALL // ${DAILY_KINDS[mode]} ${todayKey()}`;
  const url = location.href.split(/[?#]/)[0];
  if (mode === 'puzzle') {
    // One square per official try: green solved, red missed, black unused
    const solvedAt = dailyPuzzleSolvedAt();
    const used = solvedAt || dailyPuzzleTries();
    const squares = Array.from({ length: DAILY_PUZZLE_TRIES }, (_, n) => (n + 1 === solvedAt ? '\u{1F7E9}' : n < used ? '\u{1F7E5}' : '\u2B1B')).join('');
    const result = solvedAt ? `Solved on try ${solvedAt}/${DAILY_PUZZLE_TRIES}`
      : used >= DAILY_PUZZLE_TRIES ? `Not solved // ${DAILY_PUZZLE_TRIES}/${DAILY_PUZZLE_TRIES} tries used`
      : `Not solved yet // ${used}/${DAILY_PUZZLE_TRIES} tries used`;
    return [`${head} // ${WEEKDAYS[utcWeekday()]} ${utcWeekday() + 1}/7`, result, squares, url].join('\n');
  }
  const practice = dailyOfficial ? '' : ' (practice)';
  if (mode === 'breach') {
    const total = BREACH_ROWS * COLS;
    const broken = total - layersLeft();
    return [`${head}${practice}`, `${fmt(score)} pts // ${broken}/${total} layers broken${breached ? ' // BREACHED' : ''}`, bar(broken, total), url].join('\n');
  }
  if (mode === 'blitz') {
    return [`${head}${practice}`, `${fmt(score)} pts in ${DAILY_BLITZ_SECONDS}s // ${run.chain}x best chain // ${run.bits} bits decrypted`, url].join('\n');
  }
  return [`${head}${practice}`, `${fmt(score)} pts // ${run.chain}x best chain // ${run.bits} bits decrypted`, bar(run.bits, DAILY_BITS), url].join('\n');
}
function copyText(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(text);
  const area = document.createElement('textarea');
  area.value = text;
  document.body.appendChild(area);
  area.select();
  document.execCommand('copy');
  area.remove();
  return Promise.resolve();
}
shareBtn.addEventListener('click', async () => {
  const text = dailyShareText();
  try {
    if (navigator.share) {
      await navigator.share({ text });
      return;
    }
    await copyText(text);
    shareBtn.textContent = 'COPIED';
  } catch (e) {
    if (e && e.name === 'AbortError') return; // closed the share sheet
    shareBtn.textContent = 'COPY FAILED';
  }
});

document.getElementById('overlay-restart-btn').addEventListener('click', () => {
  if (mode === 'puzzle' && !daily && overlayNext === 'next') setPuzzle(Math.min(puzzleIndex + 1, tierPuzzles().length - 1));
  else restart();
});

const soundBtn = document.getElementById('sound-btn');
function updateSoundBtn() {
  soundBtn.textContent = SFX.isMuted() ? 'SOUND: OFF' : 'SOUND: ON';
  soundBtn.classList.toggle('on', !SFX.isMuted());
}
soundBtn.addEventListener('click', () => {
  SFX.toggle();
  updateSoundBtn();
  SFX.play('punct');
});
updateSoundBtn();

// SOUND OUTPUT (output.js): PHONE → HEADPHONES → SPEAKERS, for the music and the sound effects
// EFFECTS: FULL / REDUCED (slower phones): the grid backgrounds hold still (grid-bg.js), no
// glows (style.css, .low-fx), fewer pieces when bits burst (fx.js)
const effectsBtn = document.getElementById('effects-btn');
function updateEffectsBtn() {
  const low = document.documentElement.classList.contains('low-fx');
  effectsBtn.textContent = `EFFECTS: ${low ? 'REDUCED' : 'FULL'}`;
  effectsBtn.classList.toggle('on', !low);
}
effectsBtn.addEventListener('click', () => {
  const low = document.documentElement.classList.toggle('low-fx');
  storage.set('bytefall-effects', low ? 'reduced' : 'full');
  updateEffectsBtn();
  SFX.play('punct');
});
updateEffectsBtn();

// CRT DISPLAY: OFF / SOFT / FULL: the whole screen as a tube (style.css, .crt-fx over everything)
const crtBtn = document.getElementById('crt-btn');
const CRT_STEPS = ['off', 'soft', 'full'];
const crtNow = () => (document.documentElement.classList.contains('crt-full') ? 'full' : document.documentElement.classList.contains('crt-soft') ? 'soft' : 'off');
function updateCrtBtn() {
  crtBtn.textContent = `CRT DISPLAY: ${crtNow().toUpperCase()}`;
  crtBtn.classList.toggle('on', crtNow() !== 'off');
}
crtBtn.addEventListener('click', () => {
  const next = CRT_STEPS[(CRT_STEPS.indexOf(crtNow()) + 1) % CRT_STEPS.length];
  document.documentElement.classList.remove('crt-soft', 'crt-full');
  if (next !== 'off') document.documentElement.classList.add(`crt-${next}`);
  storage.set('bytefall-crt', next);
  updateCrtBtn();
  SFX.play('punct');
});
updateCrtBtn();

// PIXEL STYLE: OFF / ON: stepped pixel corners on every box and button, the neon glows kept,
// and the icons redrawn in pixels (pixel-ui.js; style.css, html.px-ui)
const pixelUiBtn = document.getElementById('pixel-ui-btn');
function updatePixelUiBtn() {
  pixelUiBtn.textContent = `PIXEL STYLE: ${PixelUi.on() ? 'ON' : 'OFF'}`;
  pixelUiBtn.classList.toggle('on', PixelUi.on());
}
pixelUiBtn.addEventListener('click', () => {
  PixelUi.set(!PixelUi.on());
  updatePixelUiBtn();
  SFX.play('punct');
});
updatePixelUiBtn();

// (SETTINGS' switch, and the same one in the MUSIC PLAYER)
const outputBtn = document.getElementById('output-btn');
const mpOutputBtn = document.getElementById('mp-output-btn');
function updateOutputBtn() {
  const out = SOUND_OUTPUTS.find((o) => o.id === Music.getOutput());
  outputBtn.textContent = `SOUND OUTPUT: ${out.label}`;
  mpOutputBtn.textContent = `SOUND OUTPUT: ${out.label}`;
}
[outputBtn, mpOutputBtn].forEach((b) => b.addEventListener('click', () => {
  const i = SOUND_OUTPUTS.findIndex((o) => o.id === Music.getOutput());
  Music.setOutput(SOUND_OUTPUTS[(i + 1) % SOUND_OUTPUTS.length].id);
  updateOutputBtn();
  SFX.play('punct');
}));
updateOutputBtn();

const musicBtn = document.getElementById('music-btn');
function updateMusicBtn() {
  musicBtn.textContent = Music.isEnabled() ? 'MUSIC: ON' : 'MUSIC: OFF';
  musicBtn.classList.toggle('on', Music.isEnabled());
}
musicBtn.addEventListener('click', () => {
  Music.toggle();
  updateMusicBtn();
  renderPlaylist();
});
updateMusicBtn();

// Drop buttons under the grid (default, easier to reach on phones) or above it.
const buttonsPosBtn = document.getElementById('buttons-pos-btn');
let buttonsOnTop = storage.get('bytefall-buttons') === 'top';
function updateButtonsPos() {
  boardWrapEl.classList.toggle('buttons-top', buttonsOnTop);
  buttonsPosBtn.textContent = `DROP BUTTONS: ${buttonsOnTop ? 'TOP' : 'BOTTOM'}`;
}
buttonsPosBtn.addEventListener('click', () => {
  buttonsOnTop = !buttonsOnTop;
  storage.set('bytefall-buttons', buttonsOnTop ? 'top' : 'bottom');
  updateButtonsPos();
});
updateButtonsPos();

// DROPPING: the numbered buttons, or touch (or click) and hold on the grid and the bit appears in
// the top row over that column, following the thumb (or the cursor) from column to column, its
// button lit; letting go drops it there (let go well off the grid to call it off). Always both
// (there was a DROP BY setting for the buttons only; it's gone)
const columnsTouchable = () => true;
function applyDropControls() {
  boardEl.classList.toggle('touch-drop', columnsTouchable());
}
applyDropControls();
var dropCtlReady = true; // (var: updateColumnButtons can run before this, and sees it undefined)

// Dragging a bit across the top row (COLUMNS). aim: the column it's over, or null
let aim = null;
let aimPointer = null;
let aimGhost = null;
function aimable(c) {
  const btn = columnButtonsEl.children[c];
  return !!btn && !btn.disabled && !(mode === 'vs' && !vsStarted) && !vsPaused && queue.length > 0 && pivotFrom === null && !swapArmed();
}
// The column under x (past the grid's sides: the edge column)
function columnAt(x) {
  const top = [...boardEl.querySelectorAll('.cell.overflow')].slice(-COLS);
  let best = 0;
  let dist = Infinity;
  top.forEach((cell, c) => {
    const r = cell.getBoundingClientRect();
    const d = Math.abs(x - (r.left + r.width / 2));
    if (d < dist) { dist = d; best = c; }
  });
  return best;
}
// The bit shown over the aimed column, in the top row (redrawn with the board: render())
function placeGhost() {
  [...columnButtonsEl.children].forEach((btn, c) => btn.classList.toggle('aimed', c === aim && aimable(c)));
  if (aim === null || !queue[0] || !aimable(aim)) { // (a full column, or not now: no bit shown)
    if (aimGhost) aimGhost.remove();
    return;
  }
  const cell = boardEl.querySelector(`.cell[data-pos="${MAX_ROWS - 1},${aim}"]`);
  if (!cell) return;
  if (!aimGhost || !aimGhost.isConnected) {
    aimGhost = document.createElement('div');
    boardEl.appendChild(aimGhost);
  }
  const piece = queue[0];
  aimGhost.className = `cell drag-ghost ${piece.type === 'hack' ? 'hack' : 'disc'}`;
  if (piece.type === 'hack') aimGhost.innerHTML = `[${iconHtml(piece.id)}]`;
  else if (spyHides(0)) aimGhost.textContent = '?'; // (SPYWARE)
  else fillBit(aimGhost, piece.val);
  Object.assign(aimGhost.style, { left: `${cell.offsetLeft}px`, top: `${cell.offsetTop}px`, width: `${cell.offsetWidth}px`, height: `${cell.offsetHeight}px` });
}
function setAim(c) {
  if (c === aim) return;
  aim = c;
  placeGhost();
  if (aim !== null && aimable(aim)) SFX.play('click');
}
function endAim() {
  aim = null;
  aimPointer = null;
  [...columnButtonsEl.children].forEach((btn) => btn.classList.remove('aimed'));
  if (aimGhost) aimGhost.remove();
  aimGhost = null;
}
// SWAP armed: a tap on the grid picks a bit (again to put it back); the second pick drops it
// (the bits are picked on the grid)
function pickSwapBit(e) {
  const el = e.target.closest('.cell[data-pos]');
  const [r, c] = el ? el.dataset.pos.split(',').map(Number) : [-1, -1];
  const cell = el && columns[c] && columns[c][r];
  if (!cell || cell.type !== 'number') { SFX.play('denied'); return; }
  const at = swapPicks.findIndex((p) => p.r === r && p.c === c);
  if (at >= 0) swapPicks.splice(at, 1);
  else swapPicks.push({ r, c });
  SFX.play('click');
  render();
  if (swapPicks.length < 2) {
    setMessage(swapPicks.length ? 'SWAP // NOW THE BIT TO TRADE PLACES WITH' : 'SWAP // TAP TWO BITS TO TRADE PLACES');
    return;
  }
  // (it drops into the first bit's column, or any with room: it's gone as it lands)
  const first = swapPicks[0].c;
  const col = columns[first].length < MAX_ROWS ? first : columns.findIndex((s) => s.length < MAX_ROWS);
  if (col >= 0) attemptDrop(col);
}
// (RANSOMWARE: a tap that starts and ends on a locked bit pays toward its ransom instead of dropping;
// pressed there and dragged off, it aims and drops as usual)
let ransomTap = null;
const lockedPos = (x, y) => {
  const el = document.elementFromPoint(x, y);
  const cell = el && el.closest('.cell.ransom[data-pos]');
  return cell && boardEl.contains(cell) ? cell.dataset.pos : null;
};
boardEl.addEventListener('pointerdown', (e) => {
  if (swapArmed() && !busy && !gameOver && !vsPaused && !homeOpen && (e.pointerType !== 'mouse' || e.button === 0)) {
    e.preventDefault();
    pickSwapBit(e);
    return;
  }
  if (!columnsTouchable() || aimPointer !== null || (e.pointerType === 'mouse' && e.button !== 0)) return;
  if (gameOver || busy || !queue.length) return;
  ransomTap = pivotFrom === null ? lockedPos(e.clientX, e.clientY) : null;
  aimPointer = e.pointerId;
  if (pivotFrom !== null) return; // (PIVOT's second pick: a tap on a neighbor column, no bit shown)
  try { boardEl.setPointerCapture(e.pointerId); } catch (err) { /* (not capturable) */ }
  setAim(columnAt(e.clientX));
  e.preventDefault();
});
boardEl.addEventListener('pointermove', (e) => {
  if (e.pointerId !== aimPointer || aim === null) return;
  setAim(columnAt(e.clientX));
});
boardEl.addEventListener('pointerup', (e) => {
  if (e.pointerId !== aimPointer) return;
  const r = boardEl.getBoundingClientRect();
  const off = e.clientX < r.left - 40 || e.clientX > r.right + 40 || e.clientY < r.top - 40 || e.clientY > r.bottom + 40;
  const c = aim !== null ? aim : columnAt(e.clientX);
  const tapped = ransomTap;
  ransomTap = null;
  endAim();
  if (tapped && lockedPos(e.clientX, e.clientY) === tapped) {
    const [lr, lc] = tapped.split(',').map(Number);
    payRansom(lr, lc);
    return;
  }
  if (!off) attemptDrop(c);
});
boardEl.addEventListener('pointercancel', (e) => { if (e.pointerId === aimPointer) endAim(); });

// WANDERING BOTS: the CPUs strolling along the bottom of the game card (wanderers.js), on by default
// GAME MUSIC: LAYERED (building with the stack) or FULL (every layer in)
const musicLayersBtn = document.getElementById('music-layers-btn');
function updateMusicLayersBtn() {
  musicLayersBtn.textContent = `GAME MUSIC: ${Music.isFullInGame() ? 'FULL' : 'LAYERED'}`;
}
musicLayersBtn.addEventListener('click', () => {
  Music.setFullInGame(!Music.isFullInGame());
  updateMusicLayersBtn();
});
updateMusicLayersBtn();
const wanderersBtn = document.getElementById('wanderers-btn');
let wanderersOn = storage.get('bytefall-wanderers') !== 'off';
// (not while the start screen covers the card: start.js starts them when it goes)
const startScreenUp = () => { const el = document.getElementById('start-screen'); return !!el && !el.hidden && !document.documentElement.classList.contains('no-start'); };
// The game card's lane runs from the card's bottom up to meet the grid's card's bottom edge: the drop
// buttons, the exploit row and the message sit over it in their own layer, and what flies in the
// lane passes behind them (fitted as the board's size and place change)
// The wanderers' lane: one fixed height (style.css), whatever else is on the card
function fitGameLane() {}
if (window.ResizeObserver) new ResizeObserver(() => fitGameLane()).observe(boardEl);
window.addEventListener('resize', () => requestAnimationFrame(fitGameLane));
requestAnimationFrame(fitGameLane);
const gameWalkers = createWanderers(document.getElementById('game-walkers'), () => wanderersOn && !startScreenUp() && !document.documentElement.classList.contains('saver-on'));
// A game under way (for BACK, start.js, and the screen saver, saver.js): a session with drops in
// it, the tutorial, or a VS match; a timed one: a BLITZ clock or a VS match running (not paused)
const inAGame = () => !gameOver && (mode === 'tutorial' || (mode === 'vs' ? vsStarted : Progress.runDrops() > 0));
const timedRunning = () => !gameOver && ((mode === 'vs' && vsStarted && !vsPaused) || (mode === 'blitz' && Progress.runDrops() > 0));
function updateWanderersBtn() {
  wanderersBtn.textContent = `WANDERING BOTS: ${wanderersOn ? 'ON' : 'OFF'}`;
  wanderersBtn.classList.toggle('on', wanderersOn);
}
wanderersBtn.addEventListener('click', () => {
  wanderersOn = !wanderersOn;
  storage.set('bytefall-wanderers', wanderersOn ? 'on' : 'off');
  if (wanderersOn) gameWalkers.start();
  updateWanderersBtn();
});
updateWanderersBtn();

// Color themes: each id matches a [data-theme] block in style.css ('terminal' is the default :root).
// Every theme but TERMINAL is unlocked by progress.js (theme-<id>). Keep the head script in index.html in sync.
const THEMES = [
  { id: 'terminal', label: 'TERMINAL', desc: 'green bits, gray layers, amber cracks and exploits.' },
  { id: 'cipher', label: 'CIPHER', desc: 'cyan bits, magenta layers, yellow cracks and exploits.' },
  { id: 'amber-crt', label: 'AMBER CRT', desc: 'an old amber monitor: gray layers, cyan cracks and exploits.' },
  { id: 'monochrome', label: 'MONOCHROME', desc: 'black and white; layers are told apart by stripes and dashed borders.' },
  { id: 'anaglyph', label: 'ANAGLYPH', desc: 'red/cyan 3D glasses: every bit split into a red and a cyan edge, red layers, cyan cracks.' },
  { id: 'synthwave', label: 'SYNTHWAVE', desc: 'pink bits, purple layers, orange cracks and a cyan trace.' },
  { id: 'dot-matrix', label: 'DOT MATRIX', desc: 'four shades of olive green, like an old handheld game screen.' },
  { id: 'paper', label: 'PAPER', desc: 'near-black ink and gray on pale paper with gold accents, for bright rooms and outdoors.' },
  { id: 'glyph', label: 'GLYPH', desc: 'bits become shapes with one corner per point: a teardrop is 1, a triangle 3, an octagon 8.' },
  { id: 'spectrum', label: 'SPECTRUM', desc: 'every bit cycles through the rainbow on its own while the page drifts slowly behind them.' },
  { id: 'seasonal', label: 'SEASONAL', desc: '' }, // (free; its colors follow the time of year: seasonTheme)
];
// SEASONAL: the theme for the time of year (seasons.js): OCTOBER's orange, black and purple (with a
// spooky flicker), NOVEMBER's harvest, December's holidays, and the rest of the year's (seasons.js)
const SEASON_THEMES = [
  ['halloween', 'season-halloween', 'HALLOWEEN: pumpkin orange and witching purple on black, the card glowing between them and the title flickering now and then.'],
  ['november', 'season-harvest', 'HARVEST: gold and rust on deep brown, for November.'],
  ['christmas', 'season-winter', 'THE HOLIDAYS: evergreen and red on a winter night.'],
  ['hanukkah', 'season-winter', 'THE HOLIDAYS: evergreen and red on a winter night.'],
  ['winter', 'season-winter', 'THE HOLIDAYS: evergreen and red on a winter night.'],
  ['newyear', 'season-winter', 'THE HOLIDAYS: evergreen and red on a winter night.'],
  ['valentine', 'season-valentine', 'VALENTINE\'S: rose pink and red on deep wine, with heart lights strung down the card.'],
  ['frost', 'season-frost', 'FROST: ice blue and silver on a polar night, for January and February.'],
  ['spring', 'season-spring', 'SPRING: fresh green and blossom pink, for March to May.'],
  ['summer', 'season-summer', 'SUMMER: sea aqua and sunshine yellow on a deep ocean blue, for June to August.'],
  ['autumn', 'season-autumn', 'SEPTEMBER: school-bus yellow and apple red on chalkboard slate.'],
];
function seasonTheme() {
  for (const [id, theme, desc] of SEASON_THEMES) if (typeof Season !== 'undefined' && Season.is(id)) return { theme, desc };
  return { theme: null, desc: 'TERMINAL\'s colors for now: a holiday brings its own.' };
}
const themeAvailable = (t) => t.id === 'terminal' || t.id === 'seasonal' || Progress.isUnlocked(`theme-${t.id}`);
const themeListEl = document.getElementById('theme-list');
const themeNoteEl = document.getElementById('theme-note');
const themeMeta = document.querySelector('meta[name="theme-color"]');
// The saved choice is kept even while locked, so it comes back once unlocked.
Progress.setThemeCount(THEMES.length);
let themeId = THEMES.some((t) => t.id === storage.get('bytefall-theme')) ? storage.get('bytefall-theme') : 'terminal';

let themeFade = 0; // the timer that brings the screen back from black after a theme change
const themeBlackEl = document.getElementById('theme-black');
let themeSwap = null; // (what goes in while it's black: the latest pick)
function themeThroughBlack(swap) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !themeBlackEl) { swap(); return; }
  const dark = themeBlackEl.classList.contains('on');
  themeSwap = swap;
  themeBlackEl.classList.add('on');
  clearTimeout(themeFade);
  themeFade = setTimeout(() => {
    const go = themeSwap;
    themeSwap = null;
    if (go) go();
    requestAnimationFrame(() => requestAnimationFrame(() => themeBlackEl.classList.remove('on'))); // (once it's drawn)
  }, dark ? 60 : 260);
}
function applyTheme() {
  const theme = THEMES.find((t) => t.id === themeId);
  const shown = themeAvailable(theme) ? theme : THEMES[0];
  const season = seasonTheme();
  const applied = shown.id === 'seasonal' ? season.theme : shown.id === 'terminal' ? null : shown.id;
  const themeBefore = document.documentElement.dataset.theme;
  if (!applied) delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = applied;
  themeMeta.content = getComputedStyle(document.documentElement).getPropertyValue('--bg-solid').trim();
  if (typeof PixelUi !== 'undefined' && PixelUi.on() && themeBefore !== document.documentElement.dataset.theme) PixelUi.refresh(); // (pixel icons in the new theme's colors)
  // GLYPH swaps the bits' markup, so redraw the board and HUD (once the game exists)
  if (columns.length) {
    render();
    updateHud();
  }
  themeNoteEl.textContent = `${shown.label}: ${shown.id === 'seasonal' ? `changes with the time of year. Now ${season.desc}` : shown.desc}`;

  themeListEl.innerHTML = '';
  for (const t of THEMES) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'theme-option';
    btn.classList.toggle('active', t.id === shown.id);
    btn.setAttribute('aria-pressed', String(t.id === shown.id));
    const name = document.createElement('span');
    name.textContent = t.label;
    btn.appendChild(name);
    const swatches = document.createElement('span');
    swatches.className = 'swatches';
    swatches.dataset.theme = t.id === 'seasonal' ? (season.theme || 'terminal') : t.id;
    if (t.id === 'seasonal') btn.classList.add('theme-seasonal'); // (the full width, under the others)
    swatches.innerHTML = '<i></i><i></i><i></i>';
    btn.appendChild(swatches);
    if (!themeAvailable(t)) {
      // Locked: tapping shows what unlocks it
      btn.classList.add('locked');
      lvTag(btn, `theme-${t.id}`);
      btn.addEventListener('click', () => {
        const u = Progress.unlock(`theme-${t.id}`);
        themeNoteEl.textContent = `${t.label} is locked. ${u.need} to unlock it (${Math.min(u.value(), u.goal).toLocaleString('en-US')} / ${u.goal.toLocaleString('en-US')}).`;
      });
    } else {
      btn.addEventListener('click', () => {
        if (themeId !== t.id) {
          Progress.themeChanged();
          announce(Progress.check());
        }
        if (themeId === t.id) return;
        const was = themeId;
        const lightChange = (themeId === 'paper') !== (t.id === 'paper');
        themeId = t.id;
        storage.set('bytefall-theme', themeId);
        // The screen fades to black, the new theme goes in behind it (redrawing everything at once,
        // out of sight: no colors easing across every element, which was slow on phones), and it
        // fades back in. A pick while it's dark just changes what goes in.
        void lightChange;
        themeThroughBlack(() => {
          applyTheme();
          seasonalPackage(was, themeId);
        });
      });
    }
    themeListEl.appendChild(btn);
  }
}
applyTheme();

// Fonts: COURIER is free; the pixel fonts unlock by earning achievements (progress.js's font-<id>)
const FONTS = [
  { id: 'courier', label: 'COURIER', desc: 'the classic terminal typewriter.' },
  { id: 'share-tech', label: 'SHARE TECH MONO', desc: 'clean, squared-off terminal type.' },
  { id: 'press-start', label: 'PRESS START', desc: 'chunky 8-bit arcade pixels.' },
  { id: 'bitcount', label: 'BITCOUNT', desc: 'letters built from a grid of single bits.' },
  { id: 'bytesized', label: 'BYTESIZED', desc: 'tiny pixel type, for the hard-core.' },
  { id: 'orbitron', label: 'ORBITRON', desc: 'wide geometric capitals from the space age, by Matt McInerney.' },
];
const fontAvailable = (f) => f.id === 'courier' || Progress.isUnlocked(`font-${f.id}`);
const fontListEl = document.getElementById('font-list');
const fontNoteEl = document.getElementById('font-note');
let fontId = FONTS.some((f) => f.id === storage.get('bytefall-font')) ? storage.get('bytefall-font') : 'courier';
const shownFont = () => {
  const font = FONTS.find((f) => f.id === fontId);
  return fontAvailable(font) ? font : FONTS[0];
};
function applyFont() {
  const shown = shownFont();
  const before = document.documentElement.dataset.font;
  if (shown.id === 'courier') delete document.documentElement.dataset.font;
  else document.documentElement.dataset.font = shown.id;
  if (before !== document.documentElement.dataset.font) { requestAnimationFrame(fitBoard); refitHome(); } // text sizes shift
  fontNoteEl.textContent = `${shown.label}: ${shown.desc}`;
  fontListEl.innerHTML = '';
  for (const f of FONTS) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'theme-option';
    btn.classList.toggle('active', f.id === shown.id);
    btn.setAttribute('aria-pressed', String(f.id === shown.id));
    const name = document.createElement('span');
    name.textContent = f.label;
    btn.appendChild(name);
    btn.dataset.fontPreview = f.id; // each name shows in its own font
    if (!fontAvailable(f)) {
      btn.classList.add('locked');
      lvTag(btn, `font-${f.id}`);
      btn.addEventListener('click', () => {
        const u = Progress.unlock(`font-${f.id}`);
        fontNoteEl.textContent = `${f.label} is locked. ${u.need} to unlock it (${Math.min(u.value(), u.goal).toLocaleString('en-US')} / ${u.goal.toLocaleString('en-US')}).`;
      });
    } else {
      btn.addEventListener('click', () => {
        fontId = f.id;
        storage.set('bytefall-font', fontId);
        applyFont();
      });
    }
    fontListEl.appendChild(btn);
  }
  fitFontNames();
}
// Each font's name shrinks (from its normal size) until it fits its box; only measurable while
// SETTINGS is open, so it also runs when the panel opens
function fitFontNames() {
  if (document.getElementById('settings').hidden) return;
  for (const btn of fontListEl.children) {
    btn.style.fontSize = '';
    const cs = getComputedStyle(btn);
    const room = btn.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const name = btn.firstElementChild;
    let size = parseFloat(cs.fontSize);
    while (name.getBoundingClientRect().width > room && size > 6) {
      size -= 0.5;
      btn.style.fontSize = `${size}px`;
    }
  }
}
applyFont();

const PLAYLIST_SLOTS = 16; // unmade tracks show as COMING SOON
const settingsBtn = document.getElementById('settings-btn');
const settingsEl = document.getElementById('settings');
const playlistTracksEl = document.getElementById('playlist-tracks');

// A locked THEME or FONT button: the level it opens at, in its corner (as the PLAYLIST's tracks show)
function lvTag(btn, unlockId) {
  const u = Progress.unlock(unlockId);
  if (!u || !u.goal) return;
  const tag = document.createElement('span');
  tag.className = 'lv-tag';
  tag.textContent = `LV ${u.goal}`;
  btn.appendChild(tag);
}
function renderPlaylist() {
  playlistTracksEl.innerHTML = '';
  const tracks = Music.slots(PLAYLIST_SLOTS); // (by number: an unmade one is a gap)
  for (let n = 0; n < tracks.length; n++) {
    const track = tracks[n];
    const btn = document.createElement('button');
    const num = String(n + 1).padStart(2, '0');
    if (track && track.locked) {
      btn.textContent = `${num}  ${track.title}`;
      btn.disabled = true;
      btn.classList.add('locked');
      const need = document.createElement('span');
      need.className = 'need';
      need.textContent = `LV ${Progress.unlock(`track-${n + 1}`).goal}`;
      btn.appendChild(need);
      btn.title = `${track.need} to unlock`;
    } else if (track) {
      btn.textContent = `${num}  ${track.title}`;
      const on = track.id === Music.currentTrack() && Music.isEnabled();
      btn.classList.toggle('active', track.id === Music.currentTrack());
      btn.classList.toggle('playing', on);
      btn.addEventListener('click', () => {
        // (the one playing, tapped again: its other way, if it has one: FULL SPEED, a RANDOM song)
        if (on && Music.hasVariant(track.id)) Music.toggleVariant(track.id);
        else Music.play(track.id);
        updateMusicBtn();
        renderPlaylist();
      });
    } else {
      btn.textContent = `${num}  COMING SOON`;
      btn.disabled = true;
    }
    const li = document.createElement('li');
    li.appendChild(btn);
    playlistTracksEl.appendChild(li);
  }
  updateGenSeedNote();
}

const vizBtn = document.getElementById('viz-toggle');
// The small one has the styles that read at its height; the MUSIC PLAYER has them all
const playlistViz = createVisualizer(document.getElementById('playlist-viz'), Music.getAnalyser, { modes: ['bars', 'wave', 'scope', 'spectro', 'vu', 'plasma'] });

function updateVizLabel() {
  vizBtn.setAttribute('aria-label', `Visualizer: ${playlistViz.name}. Tap the right side for the next style, the left side for the one before.`);
  vizBtn.title = `${playlistViz.name} (tap right: next / left: back)`;
}
// (a tap on its left half: the style before; on its right half: the next one)
vizBtn.addEventListener('click', (e) => {
  const r = vizBtn.getBoundingClientRect();
  playlistViz.toggle(e.clientX && e.clientX < r.left + r.width / 2 ? -1 : 1);
  updateVizLabel();
});
updateVizLabel();

function visualizerLoop() {
  if (settingsEl.hidden) return;
  playlistViz.draw();
  requestAnimationFrame(visualizerLoop);
}

const MODE_LABELS = { repeat: 'MODE: REPEAT', sequence: 'MODE: SEQUENCE', shuffle: 'MODE: SHUFFLE', radio: 'MODE: RADIO' };
const modeBtn = document.getElementById('play-mode-btn');
function updateModeBtn() {
  modeBtn.textContent = MODE_LABELS[Music.getMode()];
  modeBtn.classList.add('on'); // same brightness in every mode
}
modeBtn.addEventListener('click', () => {
  Music.cycleMode();
  updateModeBtn();
});
updateModeBtn();
Music.onTrackChange(() => {
  if (!settingsEl.hidden) renderPlaylist();
});

const bgPlayBtn = document.getElementById('bg-play-btn');
function updateBgPlayBtn() {
  bgPlayBtn.textContent = `BACKGROUND PLAY: ${Music.isBackgroundPlay() ? 'ON' : 'OFF'}`;
  bgPlayBtn.classList.toggle('on', Music.isBackgroundPlay());
}
bgPlayBtn.addEventListener('click', () => {
  Music.setBackgroundPlay(!Music.isBackgroundPlay());
  updateBgPlayBtn();
});
updateBgPlayBtn();
bgPlayBtn.hidden = !!window.BYTEFALL_APP; // (the Android app: in the background, everything rests)

// SOUND EFFECTS: the game's sound theme (sfx.js), the open ones in turn; each plays a taste of itself
const sfxThemeBtn = document.getElementById('sfx-theme-btn');
const sfxThemeNote = document.getElementById('sfx-theme-note');
function updateSfxThemeBtn() {
  const all = SFX.themes();
  const cur = all.find((t) => t.id === SFX.theme() && t.open) || all[0];
  sfxThemeBtn.textContent = `SOUND EFFECTS: ${cur.name}`;
  sfxThemeNote.textContent = `${cur.desc} More sound effects coming soon.`;
}
sfxThemeBtn.addEventListener('click', () => {
  const open = SFX.themes().filter((t) => t.open);
  const i = open.findIndex((t) => t.id === SFX.theme());
  const next = open[(i + 1) % open.length];
  SFX.setTheme(next.id);
  updateSfxThemeBtn();
  SFX.play('egg');
});
updateSfxThemeBtn();

// GENERATED (track 16): what it's playing, under the playlist. Tapping it while it plays switches
// the SONG OF THE DAY (the same for everyone that day) and RANDOM (a new song each time; on REPEAT a
// radio, a new song after each has played twice); STACK OVERFLOW the same, ramping or FULL SPEED.
const genSeedNote = document.getElementById('gen-seed-note');
function updateGenSeedNote() {
  const song = Music.genSong();
  const name = song ? ` ${song.title} (${song.style}, CODE ${song.code})` : '';
  genSeedNote.textContent = Music.genMode() === 'day'
    ? `Track 16 is seeded: a new song each day in the season's style, and everyone hears the same one. Today's:${name}. Tap it while it plays for RANDOM songs. Each song has a CODE: enter it in the MUSIC PLAYER to hear it again.`
    : `Track 16 is on RANDOM: a new song every time${name ? `, now${name}` : ''}. Tap it while it plays for the SONG OF THE DAY. Each song has a CODE: enter it in the MUSIC PLAYER to hear it again.`;
}
// The SEASONAL theme comes with its audio: picking it puts on GENERATED (in the season's style) and
// the season's sound effects (October: HAUNTED), as a starting point (either can be changed after);
// picking another theme puts back the track and sounds from before, if they're still the seasonal ones
const SEASON_SFX = { halloween: 'haunted', valentine: 'sweetheart', frost: 'icicle', spring: 'birdsong', summer: 'island', autumn: 'schoolyard' }; // (VALENTINE before FROST: it sits on it)
const PRE_SEASONAL_KEY = 'bytefall-pre-seasonal';
function seasonalPackage(from, to) {
  if (to === 'seasonal' && from !== 'seasonal') {
    const sfx = Object.keys(SEASON_SFX).find((id) => Season.is(id));
    storage.set(PRE_SEASONAL_KEY, JSON.stringify({ track: Music.currentTrack(), sfx: SFX.theme(), seasonSfx: sfx ? SEASON_SFX[sfx] : null }));
    Music.useTrack('generated');
    if (sfx) SFX.setTheme(SEASON_SFX[sfx]);
  } else if (from === 'seasonal' && to !== 'seasonal') {
    let pre = null;
    try { pre = JSON.parse(storage.get(PRE_SEASONAL_KEY) || 'null'); } catch (e) {}
    if (pre && pre.track && Music.currentTrack() === 'generated') Music.useTrack(pre.track);
    if (pre && pre.sfx && pre.seasonSfx && SFX.theme() === pre.seasonSfx) SFX.setTheme(pre.sfx);
    storage.set(PRE_SEASONAL_KEY, '');
  } else return;
  updateSfxThemeBtn();
  updateMusicBtn();
  renderPlaylist();
}

function setSettingsOpen(open) {
  settingsEl.hidden = !open;
  document.body.classList.toggle('panel-open', !settingsEl.hidden || !recordsEl.hidden);
  if (open && !recordsEl.hidden) setRecordsOpen(false);
  settingsBtn.setAttribute('aria-expanded', String(open));
  if (open) {
    updateSfxThemeBtn(); // (one may have opened since)
    renderPlaylist();
    fitFontNames();
    requestAnimationFrame(visualizerLoop);
  }
}

settingsBtn.addEventListener('click', () => setSettingsOpen(settingsEl.hidden));
// (a card of its own over the game card: BACK or Esc closes it, not a tap beside it)
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !settingsEl.hidden) setSettingsOpen(false);
});

// VIBRATION: on devices that support it (Android), the game's key sound events also buzz,
// whether or not SOUND is on. On by default there; the setting is hidden elsewhere.
const HAPTICS = { enter: 8, burst: 18, egg: [14, 30, 14], alert: 40, denied: [60, 40, 90], backspace: 10, punct: 14 };
const canVibrate = typeof navigator.vibrate === 'function';
let vibrate = canVibrate && storage.get('bytefall-vibrate') !== 'off';
const playSound = SFX.play;
SFX.play = (name, pitch) => {
  playSound(name, pitch);
  if (vibrate && HAPTICS[name]) {
    try { navigator.vibrate(HAPTICS[name]); } catch (e) {}
  }
};

const vibrateBtn = document.getElementById('vibrate-btn');
vibrateBtn.hidden = !canVibrate;
function updateVibrateBtn() {
  vibrateBtn.textContent = `VIBRATION: ${vibrate ? 'ON' : 'OFF'}`;
  vibrateBtn.classList.toggle('on', vibrate);
}
vibrateBtn.addEventListener('click', () => {
  vibrate = !vibrate;
  storage.set('bytefall-vibrate', vibrate ? 'on' : 'off');
  updateVibrateBtn();
  if (vibrate) navigator.vibrate(20);
});
updateVibrateBtn();
// Every button ticks once it's pressed: on a successful tap (released on it), not on a touch that
// slides off (the drop buttons have the drop's own sound)
document.addEventListener('click', (e) => {
  if (e.button !== 0) return;
  const b = e.target.closest('button:not(:disabled)');
  if (!b || b.closest('.column-buttons')) return;
  SFX.play('button');
}, { capture: true, passive: true });
// Every button buzzes as it's pressed (with VIBRATION on), as the game's own sounds do: on the same
// successful tap
document.addEventListener('click', (e) => {
  if (!vibrate || e.button !== 0 || !e.target.closest('button:not(:disabled), a[href], .walker, .visitor')) return;
  try { navigator.vibrate(12); } catch (err) {}
}, { capture: true, passive: true });

// DAILY DROP: each day (the player's own date) one free exploit, 25 KEYS and 3 each of BUGS, CACHE and CRYPTO, to claim in the
// STORE; claimed, the exploit waits behind the exploit button until used. It's one of the first
// five in the unlock order, locked or not, so new players get a feel for them. Unused, it doesn't
// stack. Not in DAILY, PUZZLE or VS, which stay the same for everyone.
const FREE_KEY = 'bytefall-free-exploit';
const localDay = () => new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD in local time
let freeExploit = { day: '', ready: false, claimable: false };
try { freeExploit = { ...freeExploit, ...JSON.parse(storage.get(FREE_KEY)) }; } catch (e) {}
const saveFree = () => storage.set(FREE_KEY, JSON.stringify(freeExploit));
let freeGrantedNow = false;
const DAILY_DROP_KEYS = 25; // (about a game's worth)
const DAILY_DROP_RES = { bugs: 3, cache: 3, crypto: 3 };
// LOGIN STREAK: days in a row the game's been opened (the player's own date). Every 7th day in a
// row, the DAILY DROP also holds 3 MASTER KEYS. A day missed starts it over at 1
const LOGIN_KEY = 'bytefall-login-streak';
const STREAK_EVERY = 7;
const STREAK_MASTERS = 3;
let loginStreak = { last: '', days: 0, paid: '' };
try { loginStreak = { ...loginStreak, ...JSON.parse(storage.get(LOGIN_KEY)) }; } catch (e) {}
const saveStreak = () => storage.set(LOGIN_KEY, JSON.stringify(loginStreak));
// A NEW DAY: the DAILY DROP renewed and the LOGIN STREAK counted. At launch, and again whenever the
// date has turned while the game was open (the app's often kept in the background for days and
// brought back without starting over): when it comes back to the front, and once a minute.
// True when the drop was renewed.
function newDay() {
  const today = localDay();
  let renewed = false;
  if (freeExploit.day !== today) {
    // (yesterday's, claimed and still unused, doesn't stack; but one waiting in a game under way
    // stays for that game)
    const keep = freeExploit.ready && started && !gameOver && !homeOpen;
    freeExploit = { day: today, ready: keep, claimable: true, ...(keep ? { id: freeExploit.id } : {}) };
    saveFree();
    renewed = true;
  }
  if (loginStreak.last !== today) {
    const y = new Date();
    y.setDate(y.getDate() - 1);
    loginStreak.days = loginStreak.last === y.toLocaleDateString('en-CA') ? loginStreak.days + 1 : 1;
    loginStreak.last = today;
    saveStreak();
  }
  return renewed;
}
freeGrantedNow = newDay();
const streakPays = () => loginStreak.days % STREAK_EVERY === 0 && loginStreak.paid !== localDay();
window.dailyDrop = {
  claimable: () => !!freeExploit.claimable,
  got: () => (!freeExploit.claimable && freeExploit.day === localDay() && freeExploit.got) || '', // (today's, once claimed)
  // (the STORE's streak line: days in a row, and how far into this run of 7)
  streak: () => ({ days: loginStreak.days, into: ((loginStreak.days - 1) % STREAK_EVERY) + 1, every: STREAK_EVERY, masters: STREAK_MASTERS, paysToday: streakPays() }),
  claim() {
    if (!freeExploit.claimable) return false;
    freeExploit.claimable = false;
    freeExploit.ready = true;
    saveFree();
    Progress.claimKeys(DAILY_DROP_KEYS);
    for (const [id, n] of Object.entries(DAILY_DROP_RES)) Progress.addRes(id, n);
    const streak = streakPays();
    if (streak) {
      Progress.addRes('master', STREAK_MASTERS);
      loginStreak.paid = localDay();
      saveStreak();
    }
    SFX.play('egg');
    // (no pop-up: the STORE card shows it where it was claimed; NOTICES keeps it)
    freeExploit.got = `+${DAILY_DROP_KEYS} KEYS, +3 BUGS, CACHE AND CRYPTO${streak ? `, +${STREAK_MASTERS} MASTER KEYS (${loginStreak.days}-DAY STREAK)` : ''} AND A FREE EXPLOIT FOR YOUR NEXT GAME`;
    saveFree();
    logNotice(`DAILY DROP // ${freeExploit.got}`, true);
    updateFreeBtn();
    showKeys();
    return true;
  },
};

// KEYS: on the main menu under the title, and in the STORE; the STORE buttons get a mark
// while the DAILY DROP waits
const KEY_SVG = '<svg class="key-ico" viewBox="0 0 16 16" aria-hidden="true"><path d="M1 4h6v8H1zM3 6v4h2V6zM7 7h8v2H7zM11 9h1.5v2H11zM13.5 9H15v3h-1.5z" fill="currentColor" fill-rule="evenodd"/></svg>';
// The RESOURCES (Progress, ECONOMY.md): a name and a small pixel icon each
const resSvg = (d) => `<svg class="key-ico res-ico" viewBox="0 0 16 16" aria-hidden="true"><path d="${d}" fill="currentColor" fill-rule="evenodd"/></svg>`;
const RES_INFO = {
  keys: { name: 'KEYS', svg: KEY_SVG },
  bugs: { name: 'BUGS', svg: resSvg('M6 0h1.2v2H6zM8.8 0H10v2H8.8zM6 2h4v2H6zM4 4h8v10H4zM7 6v7h2V6zM1 6h3v1.5H1zM12 6h3v1.5h-3zM1 9h3v1.5H1zM12 9h3v1.5h-3zM2 12h2v1.5H2zM12 12h2v1.5h-2z') },
  cache: { name: 'CACHE', svg: resSvg('M2 2h12v3.5H2zM2 6.25h12v3.5H2zM2 10.5h12V14H2zM11 3h2v1.5h-2zM11 7.25h2v1.5h-2zM11 11.5h2V13h-2z') },
  // (the game's own coin: a hexagon, a C struck through twice)
  crypto: { name: 'CRYPTO', svg: '<svg class="key-ico res-ico" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 0.5l6.8 3.9v7.2L8 15.5l-6.8-3.9V4.4zM8 2.3 2.8 5.3v5.4L8 13.7l5.2-3V5.3z" fill="currentColor" fill-rule="evenodd"/><path d="M5.5 5.5h5V7h-3.5v2h3.5v1.5h-5zM7.2 4h1v1.5h-1zM7.2 10.5h1V12h-1zM8.8 4h1v1.5h-1zM8.8 10.5h1V12h-1z" fill="currentColor"/></svg>' },
  rootkits: { name: 'ROOTKITS', svg: resSvg('M4.5 1.5h2v13h-2zM9.5 1.5h2v13h-2zM1.5 4.5h13v2h-13zM1.5 9.5h13v2h-13z') },
  // (the heavier key, its head lengthened so the currency sign's two lines run through it, top to bottom)
  master: { name: 'MASTER KEYS', svg: '<svg class="key-ico res-ico" viewBox="0 0 16 16" aria-hidden="true"><path d="M0 3h8.5v10H0zM2 5v6h4.5V5z" fill="currentColor" fill-rule="evenodd"/><path d="M2.6 0.8h1.2v14.4H2.6zM4.7 0.8h1.2v14.4H4.7zM8.5 7h7v2h-7zM10.5 9H12v3h-1.5zM13 9h1.5v4H13z" fill="currentColor"/></svg>' },
};
// THE BYTEFALL CURRENCY SIGN: a bit's 0 struck through twice, as a dollar sign is: no one
// country's, it marks what's for sale (the BLACK MARKET)
const CURRENCY_SVG = '<svg class="cur-ico" viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 3.5h9v9h-9zM5.5 5.5v5h5v-5z" fill="currentColor" fill-rule="evenodd"/><path d="M6 0.5h1.5v15H6zM8.5 0.5H10v15H8.5z" fill="currentColor"/></svg>';
const resChip = (id, n) => `<span class="res-chip res-${id}" title="${RES_INFO[id].name}">${RES_INFO[id].svg}${n}</span>`;
// A price as the BLACK MARKET (and the STORE) shows it: each resource's icon over what you have / what
// it costs, green where you have enough and red where you're short
const costHtml = (price, keys = true) => [...(keys ? ['keys'] : []), ...Progress.resIds()].filter((res) => price[res]).map((res) => {
  const have = res === 'keys' ? Progress.keys() : Progress.res(res);
  return `<div class="shop-cost res-${res}${have < price[res] ? ' short' : ' afford'}" title="${RES_INFO[res].name}">${RES_INFO[res].svg}<span>${fmt(have)}/${price[res]}</span></div>`;
}).join('');
// What's short of a price flashes harder for a moment (a BUY tapped without enough): the pulsing
// amounts in el (a STORE item or the BLACK MARKET's window)
function flashShort(el) {
  el.querySelectorAll('.shop-cost.short, .buy-keys.short').forEach((x) => {
    x.classList.remove('nudge');
    void x.offsetWidth;
    x.classList.add('nudge');
  });
}
// BUY, with the currency sign; given a KEYS cost, that cost under it (red when you're short): the STORE's
// buttons, leaving the price row for up to four resources
const BUY_HTML = (keys = 0) => (keys
  ? `<span class="buy-word">${CURRENCY_SVG} BUY</span><span class="buy-keys res-keys${Progress.keys() < keys ? ' short' : ''}">${KEY_SVG}${fmt(keys)}</span>`
  : `${CURRENCY_SVG} BUY`);
// A price as chips: KEYS first, then the resources in their order
// (checked: each amount green if you have enough of it, red if not)
const priceHtml = (price, checked = false) => ['keys', ...Progress.resIds()].filter((id) => price[id]).map((id) => {
  const chip = resChip(id, price[id]);
  if (!checked) return chip;
  const have = id === 'keys' ? Progress.keys() : Progress.res(id);
  return chip.replace('class="res-chip ', `class="res-chip ${have >= price[id] ? 'afford' : 'short'} `);
}).join(' ');
const priceText = (price) => ['keys', ...Progress.resIds()].filter((id) => price[id]).map((id) => `${price[id]} ${RES_INFO[id].name}`).join(' + ');
// The wallet: the main menu's line under the level bar, and the STORE's
function showWallet() {
  const html = Progress.resIds().map((id) => resChip(id, fmt(Progress.res(id)))).join('');
  for (const id of ['wallet', 'store-wallet']) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = html;
  }
}
// What a drop earned, in the SCORE box along its foot (as far up from its bottom border as SCORE is down
// from its top), every resource on the one line at once (a long line shrinks to fit), for a moment
function showPickup(before) {
  const now = Progress.runRes();
  const parts = Progress.resIds().filter((id) => (now[id] || 0) > (before[id] || 0)).map((id) => resChip(id, `+${now[id] - (before[id] || 0)}`));
  if (!parts.length) return;
  const box = document.getElementById('score-stat');
  box.querySelectorAll('.res-pop').forEach((old) => old.remove());
  const el = document.createElement('div');
  el.className = 'res-pop';
  el.innerHTML = parts.join('');
  const label = box.querySelector('.label').getBoundingClientRect();
  el.style.bottom = `${Math.max(2, label.top - box.getBoundingClientRect().top - 1).toFixed(1)}px`; // (less the box's border)
  box.appendChild(el);
  let size = parseFloat(getComputedStyle(el).fontSize);
  while (el.scrollWidth > el.clientWidth + 0.5 && size > 6) el.style.fontSize = `${(size -= 0.5)}px`;
  setTimeout(() => el.remove(), 1700);
}
function showKeys() {
  showWallet();
  const n = fmt(Progress.keys());
  document.getElementById('key-label').innerHTML = `${KEY_SVG} ${n}`;
  const inStore = document.getElementById('store-key-count');
  if (inStore) inStore.innerHTML = `${KEY_SVG} ${n}`;
  // (the STORE buttons' sign: the currency sign, always there, lit like a HOT NOW sign while the DAILY DROP waits)
  for (const id of ['home-store', 'pause-store']) {
    const b = document.getElementById(id);
    if (!b) continue;
    if (!b.querySelector('.store-lamp')) b.insertAdjacentHTML('beforeend', `<span class="store-lamp" aria-hidden="true">${CURRENCY_SVG}</span>`);
    b.classList.toggle('has-drop', !!freeExploit.claimable);
    b.setAttribute('aria-label', freeExploit.claimable ? 'Store: the daily drop is ready' : 'Store');
  }
  refreshBoosterRow();
  refreshStarterRow();
  refreshPuzzleTools();
}

// The main menu's PATCHES: one button, saying what's on (none or its name); a tap opens its card:
// the ones owned for this mode, one of them switched on at a time (on: used up in the next game, at
// its first drop), and GET PATCHES (the STORE's)
// THE STORE'S i: each resource, its icon, and how it's earned (ECONOMY.md has the numbers in full)
const RES_HOW = {
  keys: 'The STORE\'s money. +1 for every 10 bits you decrypt. +2 when a chain reaches 5 links, +5 at 7. +10 for each level and achievement. +5 for your first daily game of the day. +2 / 4 / 6 the first time you solve an EASY / NORMAL / HARD puzzle. +25 in the DAILY DROP.',
  bugs: '+1 for every 5 bits you decrypt in a column (a vertical line). +3 in the DAILY DROP.',
  cache: '+1 for every 5 bits you decrypt in a row (a horizontal line). +3 in the DAILY DROP.',
  crypto: '+1 for each link in a chain, from the 3rd link on. +3 in the DAILY DROP.',
  rootkits: '+1 for every 2 bits that decrypt in a row and a column at the same time. +1 for every 20 encryption layers you break. +1 for each BYTE (HARD).',
  master: 'Rare. +1 every 5th level. +1 for your first daily game of the day. +1 for your first VS win of the day. +3 in the DAILY DROP on every 7th day in a row you play. One buys any exploit, whatever its price.',
};
const resInfoEl = document.getElementById('res-info');
function closeResInfo() { resInfoEl.classList.add('hidden'); }
function openResInfo() {
  const list = document.getElementById('res-info-list');
  list.innerHTML = ['keys', ...Progress.resIds()].map((id) => `<div class="res-info-row res-${id}"><b>${RES_INFO[id].svg}${RES_INFO[id].name}</b><span>${RES_HOW[id] || ''}</span></div>`).join('');
  showInfo('// HOW THEY\'RE EARNED', true);
}
// THE STORE's sections' [i]s: what each kind of thing is (what each one does is on its own tag)
const SECTION_INFO = {
  // (EXPLOITS' [i]: how they're earned depends on the difficulty, so it's written as it opens)
  exploits: () => ['// EXPLOITS', [
    'Exploits are power-ups you drop onto the board like a bit, and they go off wherever they land.',
    difficulty === 'hard'
      ? `Make chains to fill the CHAIN METER beside the grid. On HARD, the ${HACK_COMBO} links have to come from one chain. Fill it and you get a random exploit from the ones you've equipped.`
      : `Make chains to fill the CHAIN METER beside the grid: ${HACK_COMBO} links, and they carry over from drop to drop. Fill it and you get a random exploit from the ones you've equipped.`,
    'It waits in the EXPLOIT button under the grid. Tap the button when you want it, and it becomes your next drop. Once it\'s armed, there\'s no taking it back.',
    'Tap an exploit below to equip it, or tap an equipped one to take it off. You get more slots as you level up.']],
  boosters: ['// PATCHES', [
    'A patch gives your next game an edge.',
    'Buy them with KEYS. Before a game, tap PATCHES on the main menu and switch one on.',
    'One per game. It\'s used up when the game starts (RESTORE POINT only when it saves you).',
    'Not in DAILY or VS.']],
  starters: ['// STARTER EXPLOITS', [
    'An exploit you own and bring into a game, instead of waiting for the CHAIN METER to earn one.',
    'Pick up to two under STARTERS on the main menu. Each sits in a side slot next to the exploit button: the left slot opens at Lv 4, the right at Lv 12.',
    'In the game, tap one to use it as your next drop. Any you don\'t use stay yours.',
    'Short on resources? A MASTER KEY buys any exploit.',
    'An empty side slot turns into the BLACK MARKET once the first encryption layer rises: something for sale that changes every 4 drops.',
    'CLASSIC, BLITZ and ZEN only.']],
  boxes: ['// BLACK BOXES', [
    'A sealed box with a random exploit inside, for less than it usually holds.',
    'Bring it into a game in a side slot, then tap it to open it. Most of the time you get an exploit of the box\'s tier, to use when you like.',
    'Sometimes it\'s INFECTED, and the infection hits right away: ADWARE blocks a column with an ad, SPYWARE hides your next bits, RANSOMWARE locks bits so they can\'t decrypt (tap one to pay its ransom, a few KEYS a tap), MALWARE scrambles what your board shows, a CRYPTOJACKER steals the resources you earn, or SCAREWARE throws up fake alerts over your board for 8 drops, up to 4 at once, each closed only by its little X.',
    'Infections stack: open two infected boxes and both hit. The same infection twice starts its count over, a second RANSOMWARE locks more bits, and a second SCAREWARE stacks another pop-up over the first.',
    'The higher the tier, the better the odds. Each box shows its own.']],
};
function openSectionInfo(key) {
  const [title, lines] = typeof SECTION_INFO[key] === 'function' ? SECTION_INFO[key]() : SECTION_INFO[key];
  const body = document.getElementById('res-info-body');
  body.innerHTML = lines.map((l) => `<p>${l}</p>`).join('');
  showInfo(title, false);
}
function showInfo(title, resources) {
  document.getElementById('res-info-title').textContent = title;
  document.getElementById('res-info-list').hidden = !resources;
  document.getElementById('res-info-note').hidden = !resources;
  document.getElementById('res-info-body').hidden = resources;
  resInfoEl.classList.remove('hidden');
  document.getElementById('res-info-close').focus();
}
document.querySelectorAll('.store-info[data-info]').forEach((b) => b.addEventListener('click', () => openSectionInfo(b.dataset.info)));
document.getElementById('store-info').addEventListener('click', openResInfo);
document.getElementById('store-wallet').addEventListener('click', openResInfo);
document.getElementById('store-wallet').addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openResInfo(); } });
document.getElementById('res-info-close').addEventListener('click', closeResInfo);
resInfoEl.addEventListener('click', (e) => { if (e.target === resInfoEl) closeResInfo(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !resInfoEl.classList.contains('hidden')) { e.stopImmediatePropagation(); closeResInfo(); } }, true);

const boosterPickEl = document.getElementById('booster-pick');
const boosterIds = () => Object.keys(BOOSTERS).filter((id) => !BOOSTERS[id].inGame && boosterFits(id));
function boostersChanged() {
  saveArmed();
  // (a game not yet under way takes it now; one under way, from the next game)
  if (!started && !gameOver && !busy && !inAGame()) initGame();
  refreshBoosterRow();
}
function openBoosterStore() {
  closeBoosterPick();
  closeStarterPick();
  setRecordsOpen(true, 'store');
  const shop = document.getElementById('booster-shop');
  if (shop) requestAnimationFrame(() => shop.previousElementSibling.previousElementSibling.scrollIntoView({ block: 'start' }));
}
function closeBoosterPick() { boosterPickEl.classList.add('hidden'); }
function openBoosterPick() {
  loadArmed();
  const owned = boosterIds().filter((id) => Progress.boosters(id) > 0);
  document.getElementById('booster-pick-note').textContent = owned.length
    ? `Switch on one to use in your next ${MODES[mode].label} game (one per game). It's used up at its first drop (RESTORE POINT only if it saves you).`
    : 'You don\'t have any patches for this mode yet.';
  const list = document.getElementById('booster-pick-list');
  list.textContent = '';
  for (const id of owned) {
    const b = document.createElement('button');
    b.type = 'button';
    const on = armedBoosts.has(id);
    b.className = `starter-pick-item${on ? ' on' : ''}`;
    b.setAttribute('aria-pressed', String(on));
    b.innerHTML = `<span class="exploit-glyph bracketed"><span class="ico-br">[</span>${BOOSTER_SVG[id] || ''}<span class="ico-br">]</span></span><span class="starter-pick-name"></span><span class="starter-pick-count">×${Progress.boosters(id)}</span><span class="booster-pick-state">${on ? 'ON' : 'OFF'}</span>`;
    b.querySelector('.starter-pick-name').textContent = BOOSTERS[id].name;
    b.title = BOOSTERS[id].desc;
    b.addEventListener('click', () => {
      const was = armedBoosts.has(id);
      armedBoosts.clear(); // (one per game: switching one on switches the other off)
      if (!was) armedBoosts.add(id);
      boostersChanged();
      openBoosterPick(); // (redrawn in place)
    });
    list.appendChild(b);
  }
  if (boosterPickEl.classList.contains('hidden')) {
    boosterPickEl.classList.remove('hidden');
    (list.querySelector('button') || document.getElementById('booster-pick-buy')).focus();
  }
}
document.getElementById('booster-pick-close').addEventListener('click', closeBoosterPick);
document.getElementById('booster-pick-buy').addEventListener('click', openBoosterStore);
boosterPickEl.addEventListener('click', (e) => { if (e.target === boosterPickEl) closeBoosterPick(); }); // (a tap off the card)
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !boosterPickEl.classList.contains('hidden')) { e.stopImmediatePropagation(); closeBoosterPick(); } }, true);
function refreshBoosterRow() {
  const row = document.getElementById('booster-row');
  if (!row) return;
  loadArmed(); // (this mode's)
  const ids = boosterIds();
  row.hidden = !ids.length || mode === 'tutorial';
  if (row.hidden) return;
  row.innerHTML = '';
  const on = ids.filter((id) => armedBoosts.has(id) && Progress.boosters(id) > 0);
  const b = document.createElement('button');
  b.type = 'button';
  b.className = on.length ? 'active' : ''; // (lit while one's on, as VS's LAYERS: ON)
  b.innerHTML = `<span class="opt-text">PATCHES: ${!on.length ? 'NONE ON' : on.length === 1 ? `${BOOSTER_SVG[on[0]] || ''}${BOOSTERS[on[0]].name}` : `${on.map((id) => BOOSTER_SVG[id] || '').join('')}${on.length} ON`}</span>`;
  b.setAttribute('aria-label', `Patches: ${on.length ? on.map((id) => BOOSTERS[id].name).join(', ') : 'none on'}. Tap to choose`);
  b.addEventListener('click', openBoosterPick);
  row.appendChild(b);
  refitHome(); // (new words in set boxes)
}

// The main menu's STARTERS: the two side slots, STARTER L and STARTER R, what's in each (or EMPTY), as
// VS's settings are: NAME: what's on it, lit while one's in it. A slot not open yet is locked (its
// level; a tap says so in the card's title). A tap on an open slot opens its card (BUY EXPLOITS in it: the STORE's starters): every starter exploit
// owned (and unlocked), how many, to put in that slot (two of one kind, if there are two; one each
// of two), and EMPTY to take it out
const starterPickEl = document.getElementById('starter-pick');
let starterPickSlot = 0;
function setStarters(ids) {
  Progress.setStartersTaken(ids);
  // (a game not yet under way takes them now; one under way, from the next game)
  if (!started && !gameOver && !busy && !inAGame()) initGame();
  refreshStarterRow();
}
function openStarterStore() {
  closeStarterPick();
  setRecordsOpen(true, 'store');
  const shop = document.getElementById('starter-shop');
  if (shop) requestAnimationFrame(() => shop.previousElementSibling.previousElementSibling.scrollIntoView({ block: 'start' }));
}
function closeStarterPick() { starterPickEl.classList.add('hidden'); }
function openStarterPick(slot) {
  starterPickSlot = slot;
  const taken = Progress.startersTaken();
  const here = taken[slot] || null;
  const other = taken[1 - slot] || null;
  document.getElementById('starter-pick-title').textContent = `// ${slot ? 'RIGHT' : 'LEFT'} SLOT`;
  const owned = [...Progress.exploitOrder().filter((id) => Progress.starters(id) > 0 && Progress.exploitInfo(id).unlocked),
    ...Progress.boxIds().filter((id) => Progress.starters(id) > 0)];
  document.getElementById('starter-pick-note').textContent = owned.length
    ? 'Pick a starter exploit or BLACK BOX for this side of the exploit button. It\'s used once in the game; the ones you don\'t use stay yours.'
    : 'You don\'t have any starter exploits yet.';
  const list = document.getElementById('starter-pick-list');
  list.textContent = '';
  for (const id of owned) {
    const b = document.createElement('button');
    b.type = 'button';
    // (all of them already in the other slot: none left for this one)
    const free = Progress.starters(id) - (other === id ? 1 : 0);
    b.className = `starter-pick-item${here === id ? ' on' : ''}`;
    b.disabled = free <= 0;
    b.innerHTML = `<span class="exploit-glyph bracketed">${bracketIcon(id)}</span><span class="starter-pick-name"></span><span class="starter-pick-count">\u00d7${Progress.starters(id)}</span>`;
    b.querySelector('.starter-pick-name').textContent = itemName(id);
    b.addEventListener('click', () => {
      const ids = taken.slice();
      ids[slot] = id;
      setStarters(ids);
      closeStarterPick();
    });
    list.appendChild(b);
  }
  if (here) {
    const e = document.createElement('button');
    e.type = 'button';
    e.className = 'starter-pick-item starter-pick-empty';
    e.textContent = 'EMPTY THIS SLOT';
    e.addEventListener('click', () => { const ids = taken.slice(); ids[slot] = null; setStarters(ids); closeStarterPick(); });
    list.appendChild(e);
  }
  starterPickEl.classList.remove('hidden');
  (list.querySelector('button:not(:disabled)') || document.getElementById('starter-pick-buy')).focus();
}
document.getElementById('starter-pick-close').addEventListener('click', closeStarterPick);
document.getElementById('starter-pick-buy').addEventListener('click', openStarterStore);
starterPickEl.addEventListener('click', (e) => { if (e.target === starterPickEl) closeStarterPick(); }); // (a tap off the card)
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !starterPickEl.classList.contains('hidden')) { e.stopImmediatePropagation(); closeStarterPick(); } }, true);
function refreshStarterRow() {
  const row = document.getElementById('starter-row');
  if (!row) return;
  row.hidden = !starterFits() || mode === 'tutorial';
  if (row.hidden) return;
  row.innerHTML = ''; // (a long name trails off in its slot)
  const taken = Progress.startersTaken();
  for (let i = 0; i < STARTER_MAX; i++) {
    const b = document.createElement('button');
    b.type = 'button';
    const name = `STARTER ${i ? 'R' : 'L'}`;
    if (i >= Progress.sideSlots()) { // (not open yet: the level it opens at, behind a lock)
      const lv = Progress.sideSlotLevel(i);
      b.className = 'locked';
      b.innerHTML = `<span class="opt-text">${name}: LV ${lv}</span>`;
      b.setAttribute('aria-label', `${i ? 'Right' : 'Left'} starter slot: opens at level ${lv}`);
      b.addEventListener('click', () => { SFX.play('denied'); homeNotice(`LOCKED // ${name} OPENS AT LV ${lv}`); });
      row.appendChild(b);
      continue;
    }
    b.className = taken[i] ? 'active' : '';
    b.innerHTML = `<span class="opt-text">${name}: ${taken[i] ? `${itemIcon(taken[i])}${itemName(taken[i])}` : 'EMPTY'}</span>`; // (which side: where it sits)
    b.setAttribute('aria-label', `${i ? 'Right' : 'Left'} starter slot: ${taken[i] ? itemName(taken[i]) : 'empty'}. Tap to choose`);
    b.addEventListener('click', () => openStarterPick(i));
    row.appendChild(b);
  }
  refitHome(); // (new words in set boxes)
}

// RESTORE POINT (id second-chance): the trace completes, but everything above the bottom 3 rows is wiped and the game
// goes on (once a game, when it's switched on and there's one left)
const SECOND_CHANCE_KEEP = 3;
function secondChance() {
  if (secondChanceUsed || !armedBoosts.has('second-chance') || !boosterFits('second-chance')) return false;
  if (!Progress.useBooster('second-chance')) return false;
  secondChanceUsed = true;
  FX.burst(cellsAt(columns.flatMap((c, col) => c.slice(SECOND_CHANCE_KEEP).map((_, k) => ({ row: SECOND_CHANCE_KEEP + k, col })))));
  columns = columns.map((c) => c.slice(0, SECOND_CHANCE_KEEP)); // (the bottom rows stay)
  render();
  SFX.play('egg');
  setMessage('RESTORE POINT // TRACE ROLLED BACK', 'warn');
  return true;
}

// PUZZLE's HINT and UNDO: one owned is used; none owned, a second tap buys one with KEYS
const toolArm = {};
function useTool(id, btn, action) {
  if (Progress.boosters(id) > 0) {
    if (action()) Progress.useBooster(id);
    refreshPuzzleTools();
    return;
  }
  const cost = BOOSTERS[id].cost;
  if (Progress.keys() < cost) {
    SFX.play('denied');
    setMessage(`${BOOSTERS[id].name} // ${cost} KEYS (YOU HAVE ${Progress.keys()})`);
    return;
  }
  if (!toolArm[id]) { // (first tap: BUY?)
    toolArm[id] = setTimeout(() => { toolArm[id] = null; refreshPuzzleTools(); }, 3000);
    btn.textContent = `BUY: ${cost} KEYS?`;
    return;
  }
  clearTimeout(toolArm[id]);
  toolArm[id] = null;
  if (!Progress.spendKeys(cost)) return;
  Progress.addBooster(id);
  if (action()) Progress.useBooster(id);
  showKeys();
}
function refreshPuzzleTools() {
  const box = document.getElementById('puzzle-tools');
  if (!box) return;
  box.hidden = mode !== 'puzzle' || daily;
  if (box.hidden) return;
  for (const id of ['hint', 'undo']) {
    if (toolArm[id]) continue;
    const n = Progress.boosters(id);
    document.getElementById(`puzzle-${id}`).textContent = n ? `${BOOSTERS[id].name} \u00d7${n}` : `${BOOSTERS[id].name} (${BOOSTERS[id].cost} KEYS)`;
  }
  document.getElementById('puzzle-undo').disabled = !puzzleHistory.length || overlayNext === 'next';
  document.getElementById('puzzle-hint').disabled = gameOver;
}
function showHint(col) {
  hintCol = col;
  [...columnButtonsEl.children].forEach((b, c) => b.classList.toggle('hinted', c === col));
}
// The column the next bit goes in, worked out from the board as it is now (the solver the
// puzzles were made with, js/puzzle-sim.js)
function puzzleHint() {
  if (busy || gameOver || hintCol !== null) return false;
  const board = columns.map((c) => c.map((b) => (b.type === 'number' ? b.val : `L${b.level}:${b.hidden}`)));
  const r = PuzzleSim.solve(board, queue.map((q) => q.val), ROWS, 1);
  if (!r.solutions.length) {
    SFX.play('denied');
    setMessage('NO WAY THROUGH FROM HERE // UNDO OR RETRY', 'warn');
    return false;
  }
  showHint(r.solutions[0][0]);
  SFX.play('punct');
  setMessage(`HINT // COLUMN ${r.solutions[0][0] + 1}`);
  return true;
}
function puzzleUndo() {
  if ((busy && !gameOver) || !puzzleHistory.length || overlayNext === 'next') return false;
  const was = JSON.parse(puzzleHistory.pop());
  columns = was.columns;
  queue = was.queue;
  score = was.score;
  gameOver = false;
  busy = false;
  overlayNext = null;
  overlayEl.classList.add('hidden');
  showHint(null);
  render();
  updateHud();
  updateColumnButtons();
  SFX.play('backspace');
  setMessage('UNDO // LAST DROP TAKEN BACK');
  return true;
}
document.getElementById('puzzle-hint').addEventListener('click', (e) => useTool('hint', e.currentTarget, puzzleHint));
document.getElementById('puzzle-undo').addEventListener('click', (e) => useTool('undo', e.currentTarget, puzzleUndo));
const freeAllowed = () => freeExploit.ready && !daily && mode !== 'puzzle' && mode !== 'vs' && mode !== 'tutorial';
// Which one it'll be is picked once (so the button can show its icon), from the first five
function freeExploitId() {
  const ids = Progress.exploitOrder().slice(0, 5);
  if (!ids.includes(freeExploit.id)) {
    freeExploit.id = ids[Math.floor(Math.random() * ids.length)];
    saveFree();
  }
  return freeExploit.id;
}

// The footer lives inside SETTINGS and the game card fills the screen: the phone layout, on
// every screen. (RULES and EXPLOITS are tabs in the MENU, top left.)
const footerEl = document.querySelector('footer');
(document.getElementById('settings-panel') || settingsEl).append(footerEl); // (in the box that scrolls)
document.body.classList.add('cards-in-settings');

// The lower corners: RESTART (QUIT in VS; grayed out until the first drop), and the
// exploit button
const exploitBtn = document.getElementById('exploit-btn');
const LIGHTNING_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 2 4 14h7l-1 8 10-13h-7z" fill="currentColor"/></svg>';

// The exploit button: dim lightning when there's nothing to arm; glowing green (showing that
// exploit's icon) when one is ready; glowing, pulsing amber once armed as the next drop
function nextExploit() {
  if (heldHacks.length) return heldHacks[0];
  return freeAllowed() ? freeExploitId() : null;
}
function updateFreeBtn() {
  // (retired: RESTART is on the pause screen now; the button stays for its code paths)
  restartBtn.hidden = true;
  // (EXIT until the first drop; grayed out once the run is over)
  const exit = !started && !gameOver;
  if (exit !== restartBtn.classList.contains('exit')) {
    restartBtn.classList.toggle('exit', exit);
    restartBtn.setAttribute('aria-label', exit ? 'Exit to the main menu' : 'Restart');
    restartBtn.title = exit ? 'Exit to the main menu' : 'Restart (press twice)';
  }
  restartBtn.disabled = gameOver;
  vsQuitBtn.hidden = true; // (PAUSE is the top-left icon now, in VS too; EXIT is on the pause screen)
  updateTopIcons();
  showChainMeter();
  const ready = nextExploit();
  const centerArmed = armedHack && armedSlot === null; // (one armed from a side slot shows there, not here)
  const shown = (centerArmed && armedHack) || ready;
  document.getElementById('exploit-glyph').innerHTML = shown ? iconHtml(shown) : LIGHTNING_SVG;
  exploitBtn.classList.toggle('armed', !!centerArmed);
  exploitBtn.classList.toggle('ready', !armedHack && !!ready);
  exploitBtn.title = armedHack ? `${HACKS[armedHack].name} // ARMED: drop it`
    : ready ? `${HACKS[ready].name} // tap to arm it as your next drop` : 'Exploits';
  const count = heldHacks.length + (freeAllowed() ? 1 : 0);
  const countEl = document.getElementById('exploit-count');
  countEl.hidden = count < 2 || !!armedHack;
  countEl.textContent = `x${count}`;
  renderStarters();
}
// (the frame's four sides, top, right, bottom, left: MARKET_EVERY of them)
const MARKET_SIDES = ['M9 1H31', 'M39 9V31', 'M31 39H9', 'M1 31V9'];
// (a side slot not open yet: a pixel padlock)
const SLOT_LOCK_SVG = '<svg class="slot-lock" viewBox="0 0 10 12" aria-hidden="true" shape-rendering="crispEdges"><path d="M3 1h4v1h1v3H7V2H3v3H2V2h1zM1 5h8v6H1zM4 7v2h2V7z" fill="currentColor" fill-rule="evenodd"/></svg>';
// The side slots: built once, either side of the exploit button, redrawn as they change
let slotEls = null;
const sideSlotEls = () => slotEls || (slotEls = [0, 1].map((i) => {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'exploit-icon side-slot';
  b.hidden = true;
  b.addEventListener('click', () => slotTap(i));
  const btn = document.getElementById('exploit-btn');
  if (i === 0) btn.before(b);
  else btn.after(b);
  return b;
}));
function renderStarters() {
  sideSlotEls().forEach((b, i) => {
    const sl = sideSlots[i];
    const show = !!sl && !gameOver && mode !== 'tutorial';
    b.hidden = !sideSlots.length || gameOver || mode === 'tutorial';
    b.classList.toggle('closed', !show || sl.state === 'closed');
    b.classList.toggle('locked-slot', show && sl.state === 'locked');
    if (!show || sl.state === 'closed') { b.innerHTML = ''; b.dataset.key = ''; b.disabled = true; return; }
    if (sl.state === 'locked') { // (not open yet: a padlock and the level it opens at)
      b.className = 'exploit-icon side-slot locked-slot';
      b.disabled = true;
      b.innerHTML = `${SLOT_LOCK_SVG}<span class="slot-lv">LV ${Progress.sideSlotLevel(i)}</span>`;
      b.dataset.key = '';
      b.title = `${i ? 'RIGHT' : 'LEFT'} SIDE SLOT // opens at Lv ${Progress.sideSlotLevel(i)}`;
      b.setAttribute('aria-label', b.title);
      return;
    }
    if (sl.state === 'rolling') { b.dataset.key = ''; return; } // (the reel draws itself)
    const market = sl.state === 'market';
    const price = Progress.price(sl.id);
    const sealed = Progress.isBox(sl.id);
    const short = market && Progress.missing(sl.id).length > 0 && !(sealed ? false : Progress.res('master') > 0);
    b.disabled = false;
    b.classList.toggle('market', market);
    b.classList.toggle('owned', !market);
    b.classList.toggle('sealed', sealed && !market);
    b.classList.toggle('confirm', market && shopSlot === i);
    b.classList.toggle('armed', sl.state === 'armed');
    b.classList.toggle('locked', market && !marketOpen); // (not open yet: the first layer hasn't risen)
    b.classList.toggle('short', short);
    // (the BLACK MARKET's frame: a side for each drop till it turns over, going dark one a drop, clockwise from the top)
    const left = MARKET_EVERY - (marketDrops % MARKET_EVERY);
    // (drawn afresh only when what it holds changes: a new item, bought, opened, the market opening; a
    // drop only darkens a side of the frame, so its icon's animation runs on unbroken)
    const key = `${sl.id}|${sl.state}|${market && marketOpen}`;
    if (b.dataset.key !== key) {
      b.dataset.key = key;
      b.innerHTML = `<span class="exploit-glyph">${itemIcon(sl.id)}</span>`
        + (market && marketOpen ? `<svg class="slot-timer" viewBox="0 0 40 40" preserveAspectRatio="none" aria-hidden="true">${MARKET_SIDES.map((d) => `<path d="${d}"/>`).join('')}</svg>` : '')
        + (market ? `<span class="slot-sale" aria-hidden="true">${CURRENCY_SVG}</span>` : sl.state === 'armed' ? '' : `<span class="starter-tag">${sl.state === 'starter' ? 'S' : '✓'}</span>`);
    }
    b.querySelectorAll('.slot-timer path').forEach((path, k) => path.classList.toggle('on', k >= MARKET_EVERY - left));
    const name = itemName(sl.id);
    b.title = sl.state === 'armed' ? `${itemName(sl.id)} // ARMED: drop it` : market ? `BLACK MARKET // ${name}: ${priceText(price)} (${marketOpen ? `tap to see it; a new one in ${left} drop${left === 1 ? '' : 's'}` : `opens in ${marketOpensIn()} drops`})`
      : sealed ? `${sl.state === 'starter' ? 'STARTER' : 'BOUGHT'} // ${name}: tap to open it`
        : `${sl.state === 'starter' ? 'STARTER' : sl.state === 'opened' ? 'BLACK BOX' : 'BOUGHT'} // ${name}: tap to arm it`;
    b.setAttribute('aria-label', b.title);
    if (!market && !sealed && armedHack) b.disabled = true;
  });
}
// The slot's next life once what was in it is used: the BLACK MARKET, again
function slotSpent(sl, used) {
  sl.state = 'market';
  sl.id = marketPick(sideSlots.map((x) => x.id).concat(used));
  if (!sl.id) sl.state = 'closed';
}
// Drops till the BLACK MARKET opens: till the first layer rises (ZEN: BASE_INTERVAL drops)
const marketOpensIn = () => (MODES[mode].noLayers ? Math.max(1, BASE_INTERVAL - marketDrops) : Math.max(1, pulseInterval - dropsSinceLastPulse));
function openMarket() {
  if (marketOpen || !sideSlots.some((sl) => sl.state === 'market')) { marketOpen = true; return; }
  marketOpen = true;
  setMessage('BLACK MARKET // OPEN FOR BUSINESS');
  SFX.play('egg');
  renderStarters();
}
function slotTap(i) {
  const sl = sideSlots[i];
  if (!sl || gameOver || sl.state === 'closed' || sl.state === 'locked' || sl.state === 'rolling' || sl.state === 'armed') return; // (armed: no taking it back)
  if (sl.state !== 'market') {
    if (Progress.isBox(sl.id)) openBox(i);
    else if (!armExploit(i)) SFX.play('denied');
    return;
  }
  openShop(i);
}
// THE BLACK MARKET's window: what's for sale (its icon, name, and a box's odds), its price as each
// resource's icon over what you have / what it costs (red where you're short), BUY in the middle
// (and USE A MASTER KEY when short of an exploit's price with one), a neon sign of a border and
// a tilted, flickering $$$ in the corner. Drops wait while it's open
const shopEl = document.getElementById('market-shop');
let shopSlot = null;
function openShop(i) {
  const sl = sideSlots[i];
  if (!sl || sl.state !== 'market') return;
  shopSlot = i;
  const id = sl.id;
  const box = Progress.isBox(id);
  const price = Progress.price(id);
  const missing = Progress.missing(id);
  const master = missing.length > 0 && !box && Progress.res('master') > 0;
  const odds = box ? Progress.boxOdds(id) : null;
  document.getElementById('shop-item').innerHTML = `<span class="shop-ico">${bracketIcon(id)}</span><span class="shop-name">${itemName(id)}</span>`
    + `<span class="shop-tier">${box ? `T1 ${odds[0]}% // T2 ${odds[1]}% // T3 ${odds[2]}% // INFECTION ${odds[3]}%` : `TIER ${Progress.tierOf(id) + 1} EXPLOIT`}</span>`
    + `<span class="shop-desc">${itemDesc(id)}</span>`;
  document.getElementById('shop-costs').innerHTML = costHtml(price);
  const buy = document.getElementById('shop-buy');
  const opensIn = marketOpen ? 0 : marketOpensIn();
  buy.disabled = missing.length > 0 || !marketOpen;
  if (!marketOpen) buy.textContent = `OPENS IN ${opensIn} DROP${opensIn === 1 ? '' : 'S'}`;
  else if (missing.length) buy.textContent = 'NOT ENOUGH';
  else buy.innerHTML = BUY_HTML();
  const mk = document.getElementById('shop-master');
  mk.hidden = !master || !marketOpen;
  document.getElementById('shop-note').textContent = !marketOpen
    ? `THE BLACK MARKET OPENS WHEN THE FIRST ENCRYPTION ${MODES[mode].noLayers ? 'LAYER WOULD RISE' : 'LAYER RISES'}`
    : ''; // (short of something: its amount pulses red, no words needed)
  document.getElementById('shop-sign').innerHTML = CURRENCY_SVG.repeat(3);
  shopEl.classList.remove('hidden');
  SFX.play('click');
  renderStarters();
  (buy.disabled ? (master ? mk : document.getElementById('shop-close')) : buy).focus();
}
function closeShop() {
  if (shopSlot === null) return;
  shopSlot = null;
  shopEl.classList.add('hidden');
  renderStarters();
}
function shopBuy(master) {
  const sl = sideSlots[shopSlot];
  if (!sl || sl.state !== 'market' || gameOver || !marketOpen) { closeShop(); return; }
  const name = itemName(sl.id);
  if (!Progress.payFor(sl.id, master)) { SFX.play('denied'); flashShort(shopEl); return; }
  closeShop();
  sl.state = 'bought';
  marketBought.push(sl.id);
  SFX.play('egg');
  setMessage(`BLACK MARKET // BOUGHT ${name}${master ? ' WITH A MASTER KEY' : ''}: TAP IT TO ${Progress.isBox(sl.id) ? 'OPEN' : 'ARM'}`);
  showKeys();
  renderStarters();
}
document.getElementById('shop-buy').addEventListener('click', () => shopBuy(false));
document.getElementById('shop-master').addEventListener('click', () => shopBuy(true));
document.getElementById('shop-close').addEventListener('click', closeShop);
shopEl.addEventListener('click', (e) => { if (e.target === shopEl) closeShop(); }); // (a tap off the window)
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && shopSlot !== null) { e.stopImmediatePropagation(); closeShop(); } }, true);
// A BLACK BOX opened in its slot: the reel spins through the icons, slowing, and lands on what
// Progress rolled. An exploit waits there to be armed; an INFECTION goes off
// (the dev page's INFECTION switch: every box opens as that infection, or a random one on ANY)
function devInfection() {
  const v = storage.get('bytefall-dev-infection');
  if (v === 'any') return Progress.antiIds()[Math.floor(Math.random() * Progress.antiIds().length)];
  return Progress.isAnti(v) ? v : null;
}
const REEL_STEPS = [50, 50, 55, 60, 65, 75, 85, 100, 115, 135, 160, 190, 230, 280];
function openBox(i) {
  const sl = sideSlots[i];
  const box = sl.id;
  if (sl.state === 'starter') {
    if (!Progress.useStarter(box)) { SFX.play('denied'); return; }
    usedStarters.push(box);
  }
  Progress.openedBlackBox();
  const result = devInfection() || Progress.rollBox(box);
  sl.state = 'rolling';
  const b = sideSlotEls()[i];
  b.dataset.key = ''; // (the reel's: drawn afresh after)
  b.classList.remove('market', 'short', 'confirm', 'sealed');
  b.classList.add('owned', 'rolling');
  const faces = [...Progress.exploitOrder().filter((id) => id !== 'black-box'), ...Progress.antiIds()];
  setMessage(`${itemName(box)} // OPENING...`);
  let step = 0;
  const spin = () => {
    if (gameOver) return;
    if (step < REEL_STEPS.length) {
      b.innerHTML = `<span class="exploit-glyph">${itemIcon(faces[Math.floor(Math.random() * faces.length)])}</span>`;
      SFX.play('click');
      setTimeout(spin, REEL_STEPS[step++]);
      return;
    }
    b.classList.remove('rolling');
    if (Progress.isAnti(result)) {
      b.innerHTML = `<span class="exploit-glyph">${VIRUS_SVG}</span>`;
      b.classList.add('glitched');
      setTimeout(() => { b.classList.remove('glitched'); slotSpent(sl, box); renderStarters(); }, 700);
      runAnti(result);
      return;
    }
    sl.id = result;
    sl.state = 'opened';
    setMessage(`BLACK BOX // ${itemName(result)}: TAP IT TO ARM`);
    burstMessage('warning');
    SFX.play('egg');
    renderStarters();
  };
  spin();
}
// Every MARKET_EVERY drops, the market's slots turn over (a price shown and not taken up goes too)
function marketTick() {
  if (!sideSlots.length) return;
  if (++marketDrops >= BASE_INTERVAL && MODES[mode].noLayers) openMarket(); // (ZEN: no layers rise)
  if (marketDrops % MARKET_EVERY) { renderStarters(); return; }
  sideSlots.forEach((sl, i) => {
    if (sl.state !== 'market') return;
    sl.id = marketPick(sideSlots.map((x) => x.id)) || sl.id;
    const b = sideSlotEls()[i];
    b.classList.remove('turned');
    void b.offsetWidth;
    b.classList.add('turned');
  });
  renderStarters();
}

// INFECTIONS (a BLACK BOX's bad luck): mild and short, each with its own display (infections.js).
// ADWARE an ad blocking a column; SPYWARE eyes where your next bits should be; RANSOMWARE padlocked bits;
// MALWARE a corrupted board; the CRYPTOJACKER stealing resources; SCAREWARE a fake alert to close. ADWARE blocks one column for 3 drops
// (nothing drops into that column, by the button, the grid or the keys); SPYWARE hides the next 3 bits until they land;
// RANSOMWARE locks 3 bits on the board under a one-peel layer
const ANTI_DROPS = 3;
const SCARE_DROPS = 8; // (SCAREWARE: pop-ups for up to eight drops)
const RANSOM_DROPS = 5; // (RANSOMWARE's locks and the CRYPTOJACKER: five drops)
// (RANSOMWARE: each locked bit's own ransom in KEYS, shown on it going down; every tap on it pays 1 to 8
// of it, at random. Paid off, the bit's free at once; its lock running out first, what was paid on it is lost)
const RANSOM_PRICE = [8, 24];
const RANSOM_TAKE = [1, 8];
const spyHides = (n) => spywareLeft > n; // (the bit n places down the queue: 0 is CURRENT)
// (after each drop: RANSOMWARE's locks and MALWARE's corruption a drop nearer gone; a lock lifting,
// the bit falls into any gap under it and the board settles)
// (the demand's never shown: how much it wants, nor what it's taken)
function showDue(kind) { Infections.due(kind, null); }
// Is it still on?
function infectionOn(kind) {
  if (kind === 'adware') return !!adware;
  if (kind === 'cryptojacker') return jackLeft > 0;
  if (kind === 'scareware') return scareLeft > 0 || Infections.scareUp();
  if (kind === 'ransomware') return columns.some((col) => col.some((c) => c && c.locked));
  return false;
}
// Ran out its clock: its demand gone (never a key paid: one outlasted). A RANSOMWARE strike, once none
// of its bits is locked: every one paid off, its demand paid in full; not a key paid, outlasted
function settleDemands() {
  for (const kind of Object.keys(demands)) {
    if (infectionOn(kind)) continue;
    if (!demands[kind].paid) Progress.outlasted();
    delete demands[kind];
    showDue(kind);
  }
  for (const [id, s] of Object.entries(ransoms)) {
    if (columns.some((col) => col.some((x) => x && x.locked && x.ransomOf === Number(id)))) continue;
    if (s.freed === s.locked) Progress.ransomPaid();
    else if (!s.keys) Progress.outlasted();
    delete ransoms[id];
  }
  announce(Progress.check());
}
// RANSOMWARE: a tap on a locked bit pays 1 to 8 KEYS toward its own ransom (a -KEYS floating up off it);
// paid off, the bit's free at once and the board settles. Its lock still runs out after its drops, and
// whatever was paid on it is gone with it
function ransomPop(r, c, n) {
  const cellEl = boardEl.querySelector(`.cell[data-pos="${r},${c}"]`);
  if (!cellEl) return;
  const a = cellEl.getBoundingClientRect();
  const b = boardWrapEl.getBoundingClientRect();
  const el = document.createElement('div');
  el.className = 'ransom-pop';
  el.innerHTML = `-${KEY_SVG}${n}`;
  Object.assign(el.style, { left: `${a.left - b.left + a.width / 2}px`, top: `${a.top - b.top + a.height / 2}px` });
  boardWrapEl.appendChild(el); // (on the board's frame: the board itself is redrawn under it)
  setTimeout(() => el.remove(), 1700);
}
async function payRansom(r, c) {
  const cell = columns[c] && columns[c][r];
  if (!cell || !cell.locked || gameOver || busy || vsPaused || paying) return;
  const ask = Math.min(cell.ransom, RANSOM_TAKE[0] + Math.floor(Math.random() * (RANSOM_TAKE[1] - RANSOM_TAKE[0] + 1)));
  const got = Progress.extort(ask);
  if (!got) {
    setMessage('RANSOMWARE // NO KEYS LEFT TO TAKE', 'alarm');
    SFX.play('denied');
    return;
  }
  cell.ransom -= got;
  const strike = ransoms[cell.ransomOf];
  if (strike) strike.keys += got;
  ransomPop(r, c, got);
  SFX.play('burst');
  if (cell.ransom > 0) {
    setMessage('RANSOMWARE // KEYS STOLEN', 'alarm');
    render();
    announce(Progress.check());
    return;
  }
  // Paid off: the bit's free, and falls into any gap under it
  if (strike) strike.freed++;
  for (const k of ['locked', 'lockLook', 'lockAt', 'ransom', 'ransomOf']) delete cell[k];
  setMessage('RANSOMWARE // PAID OFF: THE BIT IS FREE', 'alarm');
  SFX.play('egg');
  paying = true;
  busy = true;
  try {
    await collapse();
    await resolveChains();
  } finally {
    busy = false;
    paying = false;
  }
  render();
  updateHud();
  updateColumnButtons();
  updateInfBadge();
  settleDemands();
}
// A tap on an infection: it takes a few KEYS toward its demand, and paid in full, it goes
let paying = false;
async function payInfection(kind) {
  const dm = demands[kind];
  if (!dm || gameOver || vsPaused || paying) return;
  const ask = Math.min(dm.want - dm.paid, TAKE[0] + Math.floor(Math.random() * (TAKE[1] - TAKE[0] + 1)));
  const got = Progress.extort(ask);
  const name = ANTI[kind].name;
  if (!got) {
    setMessage(`${name} // NO KEYS LEFT TO TAKE`, 'alarm');
    SFX.play('denied');
    return;
  }
  dm.paid += got;
  SFX.play('burst');
  if (dm.paid < dm.want) {
    setMessage(`${name} // KEYS STOLEN`, 'alarm');
    showDue(kind);
    announce(Progress.check());
    return;
  }
  // Paid in full: it leaves the terminal
  paying = true;
  delete demands[kind];
  showDue(kind);
  Progress.ransomPaid();
  if (kind === 'adware') adware = null;
  else if (kind === 'cryptojacker') jackLeft = 0;
  else if (kind === 'scareware') { scareLeft = 0; Infections.scareClear(); }
  setMessage(`${name} // PAID OFF: IT LEAVES THE TERMINAL`, 'alarm');
  burstMessage('warning');
  SFX.play('egg');
  render();
  updateHud();
  updateColumnButtons();
  announce(Progress.check());
  paying = false;
}
async function tickInfections() {
  if (malwareLeft > 0) malwareLeft--;
  if (scareLeft > 0 && --scareLeft === 0) Infections.scareEnd(); // (no more come; the ones up stay till closed)
  let lifted = false;
  for (const col of columns) for (const cell of col) if (cell && cell.locked && --cell.locked <= 0) { delete cell.locked; lifted = true; }
  if (lifted) {
    await collapse();
    await resolveChains();
  }
  render();
  settleDemands();
}
// INFECTED: a little bot at its laptop in CURRENT's corner, typing away at the virus on its screen,
// while any infection's on (its count beside it past one)
const INF_BADGE_SVG = (() => {
  const A = ['..H.............', '.HHHHH..SSSSSSS.', '.HEHEH..S.R.R.S.', '.HHHHH..S..R..S.', '..HHH...S.R.R.S.', '.HHHHH..SSSSSSS.', '.HHHHH.KKKKKKKKK'];
  let px = '';
  A.forEach((r, y) => [...r].forEach((ch, x) => { if (ch !== '.') px += `<rect class="ib-${ch}" x="${x}" y="${y}" width="1" height="1"/>`; }));
  return `<svg viewBox="0 0 16 8" shape-rendering="crispEdges" aria-hidden="true">${px}<rect class="ib-A ib-a1" x="6" y="5" width="1" height="1"/><rect class="ib-A ib-a2" x="6" y="6" width="1" height="1"/></svg>`;
})();
function activeInfections() {
  const on = [];
  if (adware) on.push('ADWARE');
  if (spywareLeft > 0) on.push('SPYWARE');
  if (columns.some((col) => col.some((c) => c && c.locked))) on.push('RANSOMWARE');
  if (malwareLeft > 0) on.push('MALWARE');
  if (jackLeft > 0) on.push('CRYPTOJACKER');
  if (scareLeft > 0 || Infections.scareUp()) on.push('SCAREWARE');
  return on;
}
function updateInfBadge() {
  const infBadgeEl = document.getElementById('inf-badge');
  if (!infBadgeEl) return;
  const on = gameOver ? [] : activeInfections();
  infBadgeEl.hidden = !on.length;
  if (!on.length) return;
  if (!infBadgeEl.firstChild) infBadgeEl.innerHTML = `${INF_BADGE_SVG}<b></b>`;
  infBadgeEl.lastChild.textContent = on.length > 1 ? `x${on.length}` : '';
  infBadgeEl.title = `INFECTED: ${on.join(', ')}`;
  infBadgeEl.setAttribute('aria-label', infBadgeEl.title);
}
function runAnti(id) {
  if (id === 'adware') {
    const open = columns.map((c, n) => n).filter((n) => columns[n].length < MAX_ROWS);
    if (adware) adware.left = ANTI_DROPS; // (one already up: its column stays blocked, the count starts over)
    else if (open.length) adware = { col: open[Math.floor(Math.random() * open.length)], left: ANTI_DROPS };
  } else if (id === 'spyware') {
    spywareLeft = ANTI_DROPS;
    Infections.pick('spy');
  } else if (id === 'ransomware') { // (up to 3 more bits locked where they are, never ones already locked: they can't decrypt, nor fall, till it lifts or it's paid)
    const cells = numberCells();
    const look = Infections.pick('ransom');
    const strike = ++ransomSeq;
    let locked = 0;
    for (let n = 0; n < ANTI_DROPS && cells.length; n++) {
      const { r, c } = cells.splice(Math.floor(Math.random() * cells.length), 1)[0];
      columns[c][r].locked = RANSOM_DROPS;
      columns[c][r].lockLook = look;
      columns[c][r].lockAt = ++infSeq;
      columns[c][r].ransom = RANSOM_PRICE[0] + Math.floor(Math.random() * (RANSOM_PRICE[1] - RANSOM_PRICE[0] + 1));
      columns[c][r].ransomOf = strike;
      locked++;
    }
    if (locked) ransoms[strike] = { locked, freed: 0, keys: 0 };
  } else if (id === 'malware') {
    malwareLeft = ANTI_DROPS;
    malwareAt = ++infSeq;
    Infections.pick('malware');
  } else if (id === 'cryptojacker') {
    jackLeft = RANSOM_DROPS;
  } else if (id === 'scareware') {
    scareLeft = SCARE_DROPS; // (again: the count starts over, and another pops up over the ones up)
    Infections.scare({
      canPop: () => !gameOver && !vsPaused && !document.hidden && document.getElementById('home').hidden,
      onPop: (n) => { SFX.play('denied'); if (n > 1) setMessage(`SCAREWARE // ${n} POP-UPS`, 'alarm'); },
      onClose: (n) => { SFX.play('click'); setMessage(n ? `SCAREWARE // ${n} LEFT` : 'SCAREWARE // CLOSED'); updateInfBadge(); },
    });
  }
  if (PAYABLE.includes(id)) { // (a demand, or more on the one it has)
    const dm = demands[id] || (demands[id] = { want: 0, paid: 0 });
    dm.want += DEMAND[0] + Math.floor(Math.random() * (DEMAND[1] - DEMAND[0] + 1));
    showDue(id);
  }
  render();
  setMessage(`INFECTED // ${ANTI[id].name}: ${ANTI[id].does}`, 'alarm');
  burstMessage('warning');
  SFX.play('denied');
  updateHud();
  updateColumnButtons();
}

// Arm the ready exploit as the next drop. Committed: it can't be taken back.
function armExploit(slot = null) {
  if (armedHack || gameOver || busy || pivotFrom !== null) return false;
  let id = slot === null ? heldHacks.shift() : null;
  let free = false;
  let label = 'ARMED';
  if (slot !== null) { // (a side slot's: a STARTER, used up as it's armed, or one bought on the BLACK MARKET)
    const sl = sideSlots[slot];
    if (!sl || !['starter', 'bought', 'opened'].includes(sl.state) || Progress.isBox(sl.id)) return false;
    if (sl.state === 'starter') {
      if (!Progress.useStarter(sl.id)) return false;
      usedStarters.push(sl.id);
      label = 'STARTER';
    } else label = sl.state === 'opened' ? 'BLACK BOX' : 'BLACK MARKET';
    id = sl.id;
    sl.state = 'armed'; // (it stays in its slot, lit, till it's dropped; then the slot opens to the market)
    armedSlot = slot;
  } else if (!id) {
    if (!freeAllowed()) return false;
    id = freeExploitId();
    freeExploit.ready = false;
    freeExploit.id = null;
    saveFree();
    free = true;
  }
  // BLACK BOX: opens into a random exploit, any of them (equipped or not), shuffling through
  // their icons on the button first
  const opened = id === 'black-box';
  if (opened) {
    Progress.openedBlackBox();
    const pool = Object.keys(HACKS).filter((h) => h !== 'black-box');
    id = pool[Math.floor(dice.hack() * pool.length)];
    let flicks = 0;
    const glyph = document.getElementById('exploit-glyph');
    const timer = setInterval(() => {
      if (++flicks > 9) { clearInterval(timer); updateFreeBtn(); return; }
      glyph.innerHTML = iconHtml(pool[Math.floor(Math.random() * pool.length)]);
    }, 70);
  }
  armedHack = id;
  queue.unshift({ type: 'hack', id });
  swapPicks = [];
  setMessage(opened ? `BLACK BOX // OPENED: ${HACKS[id].name}` : id === 'swap' ? 'SWAP // TAP TWO BITS TO TRADE PLACES' : `${free ? 'FREE EXPLOIT' : label} // ${HACKS[id].name}`);
  burstMessage('warning');
  SFX.play('egg');
  updateHud();
  updateFreeBtn();
  if (id === 'swap') render(); // (the bits it can pick)
  return true;
}
exploitBtn.addEventListener('click', () => {
  if (mode === 'tutorial' && !Tutorial.allowsExploit()) { SFX.play('denied'); return; } // (only when the lesson says)
  if (armedHack) return; // armed: drop it
  if (nextExploit()) {
    if (!armExploit()) SFX.play('denied');
    return;
  }
  SFX.play('denied'); // (nothing held: the EXPLOITS card opens only from RULES & RECORDS)
});

// THE NOTICE LINE (style.css's .notice-line): every notice in one spot on every screen, the line under
// BYTEFALL (a game's // CLASSIC // NORMAL, the main menu's // MAIN MENU), in the ENCRYPTION warning's
// style: plain glowing words fading in over the line's own, holding, then bursting into pixels; one at
// a time, the next waiting for it. They wait while a card is open (RULES & RECORDS, SETTINGS, the music
// player) and while the title screen is up. Each is kept in RULES & RECORDS → NOTICES too, unless
// opts.log is false (the passing ones: EXPLOIT READY); opts.read keeps it without the unread dot
const NOTICE_MS = 2600;
const NOTICE_LONG_MS = 3600; // (an ACHIEVEMENT, a LEVEL UP, an UNLOCKED: a little longer to read)
const NOTICE_GAP_MS = 350;
const noticeEl = document.getElementById('notice-line');
const noticeQueue = [];
let noticeShowing = false;
function showToast(text, opts = {}) {
  if (window.infTestQuiet && window.infTestQuiet()) return; // (the INFECTION TESTER, its banners switched off)
  if (opts.log !== false) logNotice(text, opts.read);
  noticeQueue.push(text);
  if (!noticeShowing) nextNotice();
}
// (a card over the game, the title screen or the screen saver: notices wait)
const panelOpen = () => !recordsEl.hidden || !settingsEl.hidden || !document.getElementById('music-player').hidden;
const noticeWaits = () => panelOpen() || startScreenUp() || document.getElementById('start-black').classList.contains('on') || document.documentElement.classList.contains('saver-on'); // (and the screen saver)
function nextNotice() {
  noticeShowing = noticeQueue.length > 0;
  if (!noticeShowing) return;
  if (noticeWaits()) {
    setTimeout(nextNotice, 250);
    return;
  }
  const text = noticeQueue.shift();
  placeNotice(text);
  noticeEl.classList.remove('show');
  void noticeEl.offsetWidth; // (the fade in from the start)
  noticeEl.classList.add('show');
  document.body.classList.add('noticing');
  const long = /^(ACHIEVEMENT|LEVEL UP|UNLOCKED|DECRYPTOR)/.test(text);
  setTimeout(() => {
    const range = document.createRange();
    range.selectNodeContents(noticeEl);
    FX.burst([{ rect: range.getBoundingClientRect(), type: 'warning' }]);
    noticeEl.hidden = true;
    noticeEl.classList.remove('show');
    document.body.classList.remove('noticing');
    setTimeout(nextNotice, NOTICE_GAP_MS);
  }, long ? NOTICE_LONG_MS : NOTICE_MS);
}
// On the line under BYTEFALL (the main menu's, or the game's), one line across the screen: a long
// one closes up, then shrinks, to fit
function placeNotice(text) {
  const line = homeOpen ? document.querySelector('.home-tagline') : headerEl.querySelector('.tagline');
  const r = line.getBoundingClientRect();
  const card = crtEl.getBoundingClientRect();
  noticeEl.style.top = `${(r.top + r.height / 2 - card.top).toFixed(1)}px`;
  noticeEl.textContent = text;
  noticeEl.hidden = false;
  noticeEl.style.letterSpacing = noticeEl.style.fontSize = '';
  const wide = () => noticeEl.scrollWidth > noticeEl.clientWidth + 0.5;
  let ls = parseFloat(getComputedStyle(noticeEl).letterSpacing) || 0;
  let size = parseFloat(getComputedStyle(noticeEl).fontSize);
  while (wide() && ls > 0) noticeEl.style.letterSpacing = `${(ls = Math.max(0, ls - 0.5))}px`;
  while (wide() && size > 8) noticeEl.style.fontSize = `${(size -= 0.5)}px`;
}

// NOTICES (RULES & RECORDS' third tab): every notice kept, newest first, with when it came; the RULES &
// RECORDS buttons (the main menu's, the pause screen's) and the tab get a dot while some are unread
const NOTICES_KEY = 'bytefall-notices';
const NOTICES_MAX = 60;
let notices = []; // ({ t: when, text, read })
try { notices = JSON.parse(storage.get(NOTICES_KEY)) || []; } catch (e) { notices = []; }
const saveNotices = () => storage.set(NOTICES_KEY, JSON.stringify(notices));
function logNotice(text, read = false) {
  const looking = !recordsEl.hidden && menuPane === 'notices';
  notices.push({ t: Date.now(), text, read: read || looking }); // (read: seen where it happened, the result screen or the STORE)
  if (notices.length > NOTICES_MAX) notices = notices.slice(-NOTICES_MAX);
  saveNotices();
  updateNoticeDots();
  if (looking) renderNotices();
}
function markNoticesRead() {
  if (!notices.some((n) => !n.read)) return;
  notices.forEach((n) => { n.read = true; });
  saveNotices();
  updateNoticeDots();
}
function updateNoticeDots() {
  const unread = notices.some((n) => !n.read);
  for (const el of document.querySelectorAll('#home-records, #pause-records, .menu-tabs [data-pane="notices"]')) el.classList.toggle('has-unread', unread);
}
// (when: the time today, YESTERDAY and the time, or the date)
function noticeWhen(t) {
  const d = new Date(t);
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const day = (x) => x.toLocaleDateString('en-CA');
  const y = new Date();
  y.setDate(y.getDate() - 1);
  if (day(d) === day(new Date())) return `TODAY ${time}`;
  if (day(d) === day(y)) return `YESTERDAY ${time}`;
  return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()} ${time}`;
}
function renderNotices() {
  const body = document.getElementById('notices-body');
  body.innerHTML = notices.length
    ? notices.slice().reverse().map((n) => `<div class="notice-item${n.read ? '' : ' unread'}"><span class="notice-when">${noticeWhen(n.t)}</span><span class="notice-text">${n.text}</span></div>`).join('')
    : '<p class="notices-empty">Nothing yet. Achievements, unlocks, level ups and rewards are kept here as they come.</p>';
}
updateNoticeDots();



// Track unlocks are named TRACK 03 etc.; add the title once the track exists.
function unlockLabel(name) {
  const m = name.match(/^TRACK (\d+)$/);
  const track = m && Music.slots()[Number(m[1]) - 1];
  return track ? `${name} // ${track.title}` : name;
}

const earnedText = (e) => `${e.type} // ${unlockLabel(e.name)}${e.keys ? ` +${e.keys} KEYS` : ''}`;
function announce(earned) {
  updateLevelBar();
  if (xpHold) { // (in a game: everything earned waits, quietly, for the result screen's EARNED list)
    pendingEarned.push(...earned);
    showKeys();
    return;
  }
  if (!earned.length) return;
  SFX.play('egg');
  for (const e of earned) showToast(earnedText(e));
  showKeys();
  applyUnlocks();
  if (!recordsEl.hidden) renderRecords();
}
// The result screen's EARNED: what the game held back, listed under its level meter (and kept in
// NOTICES, read); left another way (MAIN MENU from PAUSE, say), it shows on the notice line instead
function showEarned(held) {
  const box = document.getElementById('overlay-earned');
  if (overlayEl.classList.contains('hidden') || mode === 'tutorial') return false;
  box.innerHTML = `<p class="oe-head">EARNED</p>${held.map((e) => `<p class="oe-item">${earnedText(e)}</p>`).join('')}`;
  box.hidden = false;
  for (const e of held) logNotice(earnedText(e), true);
  SFX.play('egg');
  showKeys();
  applyUnlocks();
  if (!recordsEl.hidden) renderRecords();
  return true;
}

// THE LEVEL METER (Pokemon-style): through a game the level stays as it was; once it's over, the
// result screen's meter fills with the game's bits (a rising tone), a fanfare at each LEVEL UP,
// and then the LEVEL UP and UNLOCKED pop-ups held back during the game. A tap on it skips to the end.
let xpHold = false;
let pendingEarned = [];
let runXp = null; // the level at the start of the game
const xpTotal = (lv) => lv.level * lv.need + lv.into;
function flushEarned() {
  xpHold = false;
  const held = pendingEarned;
  pendingEarned = [];
  if (held.length && !showEarned(held)) announce(held);
}
// The result screen's score, racking up from 0 to the game's (quickly: under a second and a half,
// however big), ticking as it counts; then done(). A tap on the result box skips to the end
function rackScore(run, done) {
  const total = score;
  if (total <= 0 || mode === 'vs') { finalScoreEl.textContent = fmt(total); done(); return; }
  const ms = Math.min(1400, 400 + Math.log10(total + 1) * 280);
  const box = overlayEl.querySelector('.overlay-box');
  let skip = false;
  const onTap = () => { skip = true; };
  box.addEventListener('click', onTap, { once: true });
  finalScoreEl.textContent = '0';
  const t0 = performance.now();
  let lastTick = 0;
  const frame = (now) => {
    if (run !== runId) return;
    const p = skip ? 1 : Math.min(1, (now - t0) / ms);
    const eased = 1 - Math.pow(1 - p, 2); // (slowing toward the total)
    finalScoreEl.textContent = fmt(Math.round(total * eased));
    if (now - lastTick > 45 && p < 1) { lastTick = now; SFX.count(eased); }
    if (p < 1) { requestAnimationFrame(frame); return; }
    box.removeEventListener('click', onTap);
    SFX.play('punct');
    setTimeout(() => { if (run === runId) done(); }, 250);
  };
  requestAnimationFrame(frame);
}
function playXpMeter(run) {
  const box = document.getElementById('overlay-xp');
  const start = runXp;
  const end = Progress.levelInfo();
  const gained = start ? xpTotal(end) - xpTotal(start) : 0;
  if (!start || gained <= 0 || start.maxed || end.decryptor !== start.decryptor) { box.hidden = true; flushEarned(); return; }
  box.hidden = false;
  box.classList.remove('leveled');
  const lvEl = document.getElementById('oxp-level');
  const fill = document.getElementById('oxp-fill');
  const gainEl = document.getElementById('oxp-gain');
  const need = start.need;
  const from = xpTotal(start);
  const to = Math.min(xpTotal(end), end.rankBits || Infinity);
  const show = (x) => {
    const level = Math.floor(x / need);
    const capped = end.maxed && x >= to;
    lvEl.textContent = `LV ${level}`;
    fill.style.width = `${capped ? 100 : ((x - level * need) / need) * 100}%`;
    gainEl.textContent = `+${fmt(Math.round(x - from))} BITS`;
  };
  show(from);
  // (a level's worth takes about 1.2s, sped up so the whole fill is over in about 4s)
  const perBit = Math.min(12, 4000 / Math.max(1, to - from));
  let x = from;
  let skip = false;
  let done = false;
  box.onclick = () => { skip = true; };
  const finish = () => {
    if (done) return;
    done = true;
    show(to);
    box.onclick = null;
    flushEarned();
  };
  const step = () => {
    if (run !== runId || done) return finish();
    if (skip) return finish();
    const levelEnd = (Math.floor(x / need) + 1) * need;
    const target = Math.min(to, levelEnd);
    const dur = ((target - x) * perBit) / 1000;
    SFX.xpFill((x % need) / need, target === levelEnd ? 1 : (target % need) / need, dur);
    const t0 = performance.now();
    const x0 = x;
    const tick = (now) => {
      if (run !== runId || skip) return finish();
      const p = Math.min(1, (now - t0) / (dur * 1000));
      x = x0 + (target - x0) * p;
      show(Math.min(x, target - (target === levelEnd && p < 1 ? 0.001 : 0)));
      if (p < 1) { requestAnimationFrame(tick); return; }
      x = target;
      if (target === levelEnd) { // (LEVEL UP: the fanfare, a flash, a moment)
        show(x);
        box.classList.remove('leveled');
        void box.offsetWidth;
        box.classList.add('leveled');
        SFX.levelUp();
        if (x < to) setTimeout(step, 750);
        else setTimeout(finish, 750);
      } else finish();
    };
    requestAnimationFrame(tick);
  };
  setTimeout(step, 150);
}

// Level bar under the title: level, DECRYPTOR rank and XP (bits) toward the next level
const levelBarEl = document.getElementById('level-bar');
function updateLevelBar() {
  const lv = Progress.levelInfo();
  document.getElementById('level-label').textContent = `LV ${lv.level}${lv.decryptor ? ` \u00b7 D${lv.decryptor}` : ''}`;
  document.getElementById('xp-fill').style.width = `${lv.maxed ? 100 : (lv.into / lv.need) * 100}%`;
  document.getElementById('xp-label').textContent = lv.maxed ? 'DECRYPTOR READY' : `${fmt(lv.into)} / ${fmt(lv.need)} BITS`;
  levelBarEl.classList.toggle('maxed', lv.maxed);
}

// The MENU (the button top left): RULES, EXPLOITS and RECORDS tabs. RECORDS has unlocks and
// achievements with trackers, and lifetime stats.
const recordsBtn = document.getElementById('records-btn');
const recordsEl = document.getElementById('records');
const recordsBodyEl = document.getElementById('records-body');
let recordsTab = 'unlocks';
let menuPane = 'rules';
// Bits decrypted as data, in decimal units: 1 kilobit = 1,000 bits, 1 kilobyte = 8,000 bits
function fmtData(bits) {
  if (bits < 1000) return `${fmt(bits)} bits`;
  if (bits < 8000) return `${(bits / 1000).toFixed(2)} kilobits`;
  if (bits < 1000000) return `${(bits / 8000).toFixed(2)} kilobytes`;
  if (bits < 8000000) return `${(bits / 1000000).toFixed(2)} megabits`;
  return `${(bits / 8000000).toFixed(2)} megabytes`;
}

function recordRow({ name, desc, current, goal, done }) {
  const li = document.createElement('li');
  li.className = done ? 'rec-row done' : 'rec-row';
  const shown = Math.min(current, goal);
  li.innerHTML = '<div class="rec-head"><span class="rec-name"></span><span class="rec-state"></span></div>'
    + '<p class="rec-desc"></p><div class="rec-bar"><i></i></div>';
  li.querySelector('.rec-name').textContent = name;
  if (done) li.querySelector('.rec-name').insertAdjacentHTML('beforeend', ' <span class="rec-check">✓</span>');
  // Done: the full goal shows (in amber), e.g. 25 / 25
  li.querySelector('.rec-state').textContent = `${fmt(done ? goal : shown)} / ${fmt(goal)}`;
  li.querySelector('.rec-desc').textContent = desc;
  li.querySelector('.rec-bar i').style.width = `${done ? 100 : (shown / goal) * 100}%`;
  return li;
}

// A RECORDS section title in amber, after an amber ======= line
function recHead(title) {
  const sep = document.createElement('div');
  sep.className = 'rec-sep';
  sep.setAttribute('aria-hidden', 'true');
  sep.textContent = '='.repeat(80);
  const head = document.createElement('p');
  head.className = 'rec-group';
  head.textContent = title;
  recordsBodyEl.append(sep, head);
}

function renderRecords() {
  recordsEl.querySelectorAll('.records-tabs button').forEach((b) => {
    b.setAttribute('aria-selected', String(b.dataset.tab === recordsTab));
  });
  recordsBodyEl.innerHTML = '';
  if (recordsTab === 'unlocks') {
    // Level and DECRYPTOR rank, with RANK UP (four presses) once at Lv 80
    const lv = Progress.levelInfo();
    const box = document.createElement('div');
    box.className = 'rec-level';
    const row = recordRow({
      name: `LV ${lv.level} // DECRYPTOR ${lv.decryptor}`,
      desc: lv.maxed
        ? 'A kilobyte decrypted. Rank up to the next DECRYPTOR rank to start again at Lv 0: everything locks again (exploits, slots, Hard mode, VS, tracks, themes and fonts) and unlocks again by level, but you keep one more exploit slot for good.'
        : `100 bits per level. Reach Lv 80 (${fmt(lv.xp)} / ${fmt(lv.rankBits)} bits, a kilobyte) to rank up to DECRYPTOR ${lv.decryptor + 1}.`,
      current: lv.maxed ? 1 : lv.into,
      goal: lv.maxed ? 1 : lv.need,
      done: lv.maxed,
    });
    row.style.borderBottom = 'none';
    // Bright green labels with amber numbers
    row.querySelector('.rec-name').innerHTML = `LV <em>${lv.level}</em> // DECRYPTOR <em>${lv.decryptor}</em>${lv.maxed ? ' <span class="rec-check">✓</span>' : ''}`;
    row.querySelector('.rec-state').innerHTML = `<em>${fmt(lv.maxed ? lv.need : lv.into)}</em> / <em>${fmt(lv.need)}</em>`;
    const rowList = document.createElement('ul');
    rowList.className = 'rec-list';
    rowList.appendChild(row);
    box.appendChild(rowList);
    if (lv.maxed) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'rec-rankup';
      btn.textContent = `RANK UP TO DECRYPTOR ${lv.decryptor + 1}?`;
      // Each press arms the next warning (for a few seconds); the fourth one ranks up
      const warnings = ['CONFIRM? EVERYTHING LOCKS AGAIN', 'NO GOING BACK. ARE YOU SURE?', 'YES, ENCRYPT MY PROGRESS!!'];
      let stage = 0;
      btn.addEventListener('click', () => {
        if (!armed || armed.btn !== btn) stage = 0;
        if (stage < warnings.length) {
          armReset(btn, warnings[stage++]);
          return;
        }
        disarmReset();
        if (Progress.rankUp()) {
          showToast(`DECRYPTOR ${Progress.levelInfo().decryptor} // BACK TO LV 0`);
          announce(Progress.check());
          applyUnlocks();
          renderRecords();
        }
      });
      box.appendChild(btn);
    }
    recordsBodyEl.appendChild(box);

    // This rank's exploit unlocks
    const exUnlocked = Progress.exploitOrder().filter((id) => Progress.exploitInfo(id).unlocked).length;
    recHead(`// EXPLOITS // DECRYPTOR ${lv.decryptor} (${exUnlocked} / ${Progress.exploitOrder().length})`);
    const exList = document.createElement('ul');
    exList.className = 'rec-list';
    const slotsNow = Progress.slotInfo();
    exList.appendChild(recordRow({
      name: `EXPLOIT SLOTS ${slotsNow.slots} / ${slotsNow.max}`,
      desc: slotsNow.nextLevel ? `Next slot at Lv ${slotsNow.nextLevel}. Each DECRYPTOR rank keeps one more.` : 'Each DECRYPTOR rank keeps one more, up to 6.',
      current: slotsNow.slots,
      goal: slotsNow.max,
      done: slotsNow.slots >= slotsNow.max,
    }));
    for (const id of Progress.exploitOrder()) {
      const info = Progress.exploitInfo(id);
      exList.appendChild(recordRow({
        name: HACKS[id].name,
        desc: info.kept ? 'Kept for good by your DECRYPTOR rank' : `Unlocks at Lv ${info.level}`,
        current: info.kept ? 1 : Math.min(lv.level, info.level),
        goal: info.kept ? 1 : info.level,
        done: info.unlocked,
      }));
    }
    recordsBodyEl.appendChild(exList);

    let group = '';
    let list = null;
    const unlocks = Progress.unlocks();
    for (const u of unlocks) {
      if (u.group !== group) {
        group = u.group;
        const inGroup = unlocks.filter((x) => x.group === group);
        recHead(`// ${group} (${inGroup.filter((x) => x.done).length} / ${inGroup.length})`);
        list = document.createElement('ul');
        list.className = 'rec-list';
        recordsBodyEl.appendChild(list);
      }
      const m = u.name.match(/^TRACK (\d+)$/);
      const track = m && Music.slots()[Number(m[1]) - 1];
      const name = m ? `${u.name} · ${track ? track.title : 'COMING SOON'}` : u.name;
      list.appendChild(recordRow({ name, desc: u.need, current: u.current, goal: u.goal, done: u.done }));
    }
  } else if (recordsTab === 'achievements') {
    // HIDDEN and IMPOSSIBLE ones get their own sections at the bottom; hidden ones count toward
    // EARNED, impossible ones don't
    const all = Progress.achievements();
    const counted = all.filter((a) => !a.impossible);
    const summary = document.createElement('p');
    summary.className = 'rec-summary';
    summary.textContent = `${counted.filter((a) => a.done).length} / ${counted.length} EARNED`;
    recordsBodyEl.appendChild(summary);
    const listOf = (items) => {
      const list = document.createElement('ul');
      list.className = 'rec-list';
      for (const a of items) {
        // Hidden ones stay a mystery until earned
        const secret = a.hidden && !a.done;
        const desc = a.note && !a.done ? `${a.desc}. ${a.note}.` : a.desc; // (how its progress counts)
        list.appendChild(recordRow({ name: secret ? '???' : a.name, desc: secret ? 'Hidden: keep playing to find it' : desc, current: a.current, goal: a.goal, done: a.done }));
      }
      return list;
    };
    const section = (title, items) => {
      recHead(title);
      recordsBodyEl.appendChild(listOf(items));
    };
    // Standard ones under their group's // TITLE
    const standard = counted.filter((a) => !a.hidden);
    for (const group of [...new Set(standard.map((a) => a.group))]) {
      const items = standard.filter((a) => a.group === group);
      section(`// ${group} (${items.filter((a) => a.done).length} / ${items.length})`, items);
    }
    const hidden = counted.filter((a) => a.hidden);
    section(`// HIDDEN ACHIEVEMENTS !? (${hidden.filter((a) => a.done).length} / ${hidden.length} FOUND)`, hidden);
    section('// IMPOSSIBLE ACHIEVEMENTS', all.filter((a) => a.impossible));
  } else {
    const s = Progress.stats();
    const favorite = Object.entries(s.exploitUses).sort((a, b) => b[1] - a[1])[0];
    const lv = Progress.levelInfo();
    const rows = [
      ['LEVEL', `${lv.level}`],
      ['DECRYPTOR RANK', `${lv.decryptor}`],
      ['SESSIONS PLAYED', fmt(s.games)],
      ['TOTAL DROPS', fmt(s.drops)],
      ['BITS DECRYPTED', fmt(s.bits)],
      ['NIBBLES DECRYPTED', fmt(s.nibbles)],
      ['MOST NIBBLES IN ONE DROP', fmt(s.bestDropNibbles)],
      ['NIBBLE BONUS POINTS', fmt(s.nibbles * NIBBLE_BONUS)],
      ['BYTES DECRYPTED', fmt(s.bytes)],
      ['LAYERS PEELED', fmt(s.peeled)],
      ['BITS REVEALED', fmt(s.broken)],
      ['EXPLOITS RUN', fmt(s.exploits)],
      ['FAVORITE EXPLOIT', favorite ? `${HACKS[favorite[0]] ? HACKS[favorite[0]].name : favorite[0]} (${fmt(favorite[1])})` : '—'],
      ['LONGEST CHAIN', `${s.bestChain}x`],
      ['BEST SCORE // EASY', fmt(s.bestEasy)],
      ['BEST SCORE // NORMAL', fmt(s.bestNormal)],
      ['BEST SCORE // HARD', fmt(s.bestHard)],
      ['LONGEST HARD SESSION', `${fmt(s.bestHardDrops)} drops`],
      ['CLEAN SWEEPS', fmt(s.sweeps)],
      ['CLOSE CALLS', fmt(s.closeCalls)],
      ['DAILY DECRYPTS PLAYED', fmt(s.dailies)],
      ['DAILY STREAK', `${fmt(Progress.dailyStreak())} (best ${fmt(s.bestDailyStreak)})`],
      ['DAILY DECRYPT TODAY', storage.get(dailyPlayedKey('decrypt')) ? fmt(Number(storage.get(dailyKey('decrypt'))) || 0) : 'not played'],
      ['DATA DECRYPTED', fmtData(s.bits)],
      ['TOTAL POINTS', fmt(s.points)],
      ['BEST // BLITZ', fmt(Number(storage.get('bytefall-best-blitz')) || 0)],
      ['BEST // ZEN', fmt(Number(storage.get('bytefall-best-zen')) || 0)],
      ...Object.entries(CpuBoard.LEVELS).map(([id, l]) => [`VS ${l.label} CPU // WON-LOST`, `${fmt(s.vsWins[id] || 0)} - ${fmt(s.vsLosses[id] || 0)}`]),
    ];
    const dl = document.createElement('dl');
    dl.className = 'rec-stats';
    for (const [label, value] of rows) {
      const dt = document.createElement('dt');
      dt.textContent = label;
      const dd = document.createElement('dd');
      dd.textContent = value;
      const line = document.createElement('div'); // label ........ value
      line.append(dt, dd);
      dl.append(line);
    }
    recordsBodyEl.appendChild(dl);
    // RESET PROGRESS: two presses, like RESTART. Clears stats, unlocks, achievements, puzzles, best
    // scores, the LOGIN STREAK and the DAILY DROP (today's comes back to claim); settings (sound,
    // music, theme choice...) stay.
    const reset = document.createElement('button');
    reset.type = 'button';
    reset.className = 'rec-reset';
    reset.textContent = 'RESET PROGRESS';
    reset.addEventListener('click', () => {
      if (!armed || armed.btn !== reset) {
        armReset(reset, 'CONFIRM? THIS ERASES ALL PROGRESS');
        return;
      }
      disarmReset();
      try {
        Object.keys(localStorage)
          // (the puzzle each tier was on: NORMAL's bytefall-puzzle, EASY's and HARD's bytefall-puzzle-easy
          // and -hard; the tier picked, bytefall-puzzle-tier, is a setting and stays)
          .filter((k) => k === 'bytefall-progress' || k === 'bytefall-puzzle' || (k.startsWith('bytefall-puzzle-') && k !== 'bytefall-puzzle-tier')
            || k === LOGIN_KEY || k === FREE_KEY
            || k.startsWith('bytefall-best-') || (k.startsWith('bytefall-daily-') && k !== 'bytefall-daily-kind')) // (the daily game picked: a setting too)
          .forEach((k) => localStorage.removeItem(k));
      } catch (e) {}
      location.reload();
    });
    recordsBodyEl.appendChild(reset);
  }
}

// RULES & RECORDS (its two tabs), EXPLOITS and STORE: one card, opened on its own by each's
// button (main menu, pause screen); EXPLOITS and STORE show alone, under their own title
const SOLO_PANES = { exploits: '// EXPLOITS', store: '// STORE', puzzles: '// PUZZLES' };
let rulesPane = 'rules'; // (the RULES & RECORDS tab last open)
function showMenuPane(pane) {
  menuPane = pane;
  if (!SOLO_PANES[pane]) rulesPane = pane;
  recordsEl.classList.toggle('solo', !!SOLO_PANES[pane]);
  recordsEl.classList.toggle('puzzles', pane === 'puzzles'); // (BYTEFALL over its name, as a game's top)
  document.getElementById('records-title').textContent = SOLO_PANES[pane] || '// RULES & RECORDS';
  recordsEl.querySelectorAll('.menu-tabs button').forEach((b) => {
    b.setAttribute('aria-selected', String(b.dataset.pane === pane));
  });
  recordsEl.querySelectorAll('.menu-pane').forEach((el) => { el.hidden = el.dataset.pane !== pane; });
  if (pane === 'records') renderRecords();
  if (pane === 'notices') { renderNotices(); markNoticesRead(); } // (seen: the dots go)
  if (pane === 'puzzles') { puzzleListTier = puzzleTier; renderPuzzleSelect(); }
  if (typeof Store !== 'undefined') Store.render(); // (and the REMOVE ADS link, off on its own tab)
  const box = menuScroller();
  if (box) box.scrollTop = 0;
}
// The page that scrolls in RULES & RECORDS: the open tab's dashed box (the card itself stays put)
const menuScroller = () => recordsEl.querySelector('.menu-pane:not([hidden]) > .panel .store-scroll') || recordsEl.querySelector('.menu-pane:not([hidden]) > .panel'); // (the STORE's: under its fixed top)
// pane: which tab to show (the last one shown if left out)
// RULES → TUTORIAL: the guided lesson (tutorial.js). A live session asks first, as a restart does.
const tutorialBtn = document.getElementById('tutorial-btn');
// (from RULES, or the main menu's TUTORIAL; a game under way asks first, CONFIRM?)
function startTutorial(btn) {
  if (vsStarted && !gameOver && !homeOpen) return; // (not mid-match: PAUSE → EXIT first)
  requestReset(btn, 'CONFIRM?', () => {
    mode = 'tutorial';
    daily = false;
    setRecordsOpen(false);
  });
}
tutorialBtn.addEventListener('click', () => startTutorial(tutorialBtn));
document.getElementById('home-tutorial').addEventListener('click', (e) => startTutorial(e.currentTarget));

function setRecordsOpen(open, pane = menuPane) {
  recordsEl.hidden = !open;
  document.body.classList.toggle('panel-open', !settingsEl.hidden || !recordsEl.hidden);
  recordsBtn.setAttribute('aria-expanded', String(open));
  if (open) {
    setSettingsOpen(false);
    showMenuPane(pane);
    // (RECORDS' own tabs stick just under the card's top: BACK and the four tabs)
    recordsEl.style.setProperty('--card-top-h', `${recordsEl.querySelector('.card-top').offsetHeight}px`);
  }
}
// (in a game it's PAUSE / RESUME, or the main menu when there's nothing to pause)
recordsBtn.addEventListener('click', () => {
  if (!recordsEl.hidden || !document.body.classList.contains('in-game')) {
    setRecordsOpen(recordsEl.hidden);
    return;
  }
  setSettingsOpen(false);
  if (vsPaused) resumeMatch();
  else if (canPause()) requestPause();
  else showHome();
});
recordsEl.querySelectorAll('.menu-tabs button').forEach((b) => {
  b.addEventListener('click', () => showMenuPane(b.dataset.pane));
});
recordsEl.querySelectorAll('.records-tabs button').forEach((b) => {
  b.addEventListener('click', () => {
    recordsTab = b.dataset.tab;
    renderRecords();
  });
});
// (a card of its own over the game card: BACK or Esc closes it, not a tap beside it)
document.querySelectorAll('.card-back').forEach((b) => b.addEventListener('click', () => {
  if (b.dataset.close === 'records') setRecordsOpen(false);
  else setSettingsOpen(false);
}));
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !recordsEl.hidden) setRecordsOpen(false);
});

// Locked exploits dim with their points tracker (this rank); DAILY shows its fixed five.
// Exploit cards, in unlock order: locked (with the level that unlocks them), unlocked (tap to
// equip) or equipped (tap to remove). DAILY shows its fixed five instead.
const hacksPanelEl = document.querySelector('.panel-hacks');
const hacksListEl = hacksPanelEl.querySelector('.hacks-scroll') || hacksPanelEl;
// The loadout can only change before a session's first drop, or once it's over
const loadoutEditable = () => gameOver || Progress.runDrops() === 0;
const slotInfoEl = document.getElementById('slot-info');
// The list's sections, by tier (as priced in the STORE and the BLACK MARKET), each under a ===== line
const EXPLOIT_TIERS = [
  ['TIER 1 // THE BASICS', 'Quick fixes that shake up the board. The first you unlock, and the cheapest to buy.'],
  ['TIER 2 // PRECISION TOOLS', 'Aim these where they do the most. Their price takes ROOTKITS too.'],
  ['TIER 3 // HEAVY HITTERS', 'Big plays that change the whole board. The last to unlock, and the dearest.'],
  ['SPECIAL // UNKNOWN', 'Never sold. Nobody knows what\'s inside until it opens.'],
];
const tierHeads = EXPLOIT_TIERS.map(([title, note], t) => {
  const el = document.createElement('div');
  el.className = 'tier-head';
  el.innerHTML = `${t ? '<div class="store-rule" aria-hidden="true">================================================================================</div>' : ''}<h3 class="tier-sub">${title}</h3><p class="tier-note">${note}</p>`;
  return el;
});
const tierOfCard = (id) => (id === 'black-box' ? 3 : Progress.tierOf(id));
function refreshExploitCards() {
  const { slots, max, nextLevel } = Progress.slotInfo();
  const equipped = Progress.equipped();
  const editable = loadoutEditable();
  if (daily) {
    slotInfoEl.textContent = mode === 'puzzle' ? 'DAILY PUZZLE // NO EXPLOITS' : 'DAILY // THE SAME FIVE EXPLOITS FOR EVERYONE';
  } else {
    slotInfoEl.textContent = `SLOTS ${equipped.length} / ${slots}`
      + (slots < max ? (nextLevel ? ` // NEXT SLOT AT LV ${nextLevel}` : ' // MORE SLOTS WITH DECRYPTOR RANKS') : '')
      + (editable ? '' : ' // LOCKED UNTIL THE SESSION ENDS');
  }
  tierHeads.forEach((h) => { delete h.dataset.placed; });
  for (const id of Progress.exploitOrder()) {
    const el = hacksPanelEl.querySelector(`.hack-item[data-hack="${id}"]`);
    if (!el) continue;
    const head = tierHeads[tierOfCard(id)];
    if (!head.dataset.placed) { hacksListEl.appendChild(head); head.dataset.placed = '1'; } // (its tier's heading first)
    hacksListEl.appendChild(el); // keep the cards in unlock order (in the list that scrolls)
    const info = Progress.exploitInfo(id);
    const on = daily ? DAILY_EXPLOITS.includes(id) : equipped.includes(id);
    el.classList.toggle('locked', !daily && !info.unlocked);
    el.classList.toggle('unused', daily && !on); // not one of the Daily's five (not locked)
    el.classList.toggle('unlocked', !daily && info.unlocked && editable);
    el.classList.toggle('equipped', on);
    let tag;
    if (daily) tag = on ? '' : 'NOT USED IN THE DAILY';
    else if (!info.unlocked) tag = `UNLOCKS AT LV ${info.level} THIS RANK`;
    else if (!editable) tag = on ? '' : 'NOT EQUIPPED THIS SESSION';
    else if (on) tag = 'TAP TO REMOVE';
    else tag = equipped.length < slots ? 'TAP TO EQUIP' : 'SLOTS FULL // REMOVE ONE TO SWAP';
    el.querySelector('.lock-tag').textContent = tag;
  }
}
// DEV (the dev page's UNLOCK EVERYTHING switch): press and hold any exploit card for 2 seconds
// to make it your next drop, slotted or not, to try it out.
const DEV_HOLD_MS = 2000;
let devHold = null; // { card, timer }
let devHoldFired = false; // swallow the click that ends a successful hold
function cancelDevHold() {
  if (!devHold) return;
  clearTimeout(devHold.timer);
  devHold.card.classList.remove('dev-holding');
  devHold = null;
}
hacksPanelEl.addEventListener('pointerdown', (e) => {
  const card = e.target.closest('.hack-item');
  if (!card || !Unlocks.isDevUnlock()) return;
  cancelDevHold();
  devHoldFired = false;
  card.classList.add('dev-holding');
  devHold = {
    card,
    timer: setTimeout(() => {
      const id = card.dataset.hack;
      cancelDevHold();
      devHoldFired = true;
      if (gameOver || busy || pivotFrom !== null) {
        SFX.play('denied');
        return;
      }
      queue.unshift({ type: 'hack', id });
      setMessage(`DEV // ${HACKS[id].name} READY`);
      SFX.play('egg');
      updateHud();
    }, DEV_HOLD_MS),
  };
});
for (const type of ['pointerup', 'pointerleave', 'pointercancel']) hacksPanelEl.addEventListener(type, cancelDevHold);
hacksPanelEl.addEventListener('contextmenu', (e) => {
  if (Unlocks.isDevUnlock() && e.target.closest('.hack-item')) e.preventDefault(); // long-press menu on phones
});

hacksPanelEl.addEventListener('click', (e) => {
  if (devHoldFired) {
    devHoldFired = false;
    return;
  }
  const card = e.target.closest('.hack-item');
  if (!card || daily || !Progress.exploitInfo(card.dataset.hack).unlocked) return;
  if (!loadoutEditable()) {
    SFX.play('denied');
    cardNotice('LOADOUT LOCKED // FINISH OR RESTART FIRST');
    return;
  }
  const id = card.dataset.hack;
  if (Progress.isEquipped(id)) {
    Progress.unequip(id);
    SFX.play('backspace');
  } else if (Progress.equip(id)) {
    SFX.play('enter');
  } else {
    SFX.play('denied');
    cardNotice(Progress.slotInfo().slots ? 'SLOTS FULL // REMOVE ONE TO SWAP' : 'NO EXPLOIT SLOTS YET');
  }
  refreshExploitCards();
});

// Refreshes everything that can be locked, after progress or Full Access changes.
function applyUnlocks() {
  refreshExploitCards();
  updateLevelBar();
  const hardBtn = document.querySelector('#difficulty-row [data-difficulty="hard"]');
  const hardLocked = !Progress.isUnlocked('mode-hard');
  hardBtn.classList.toggle('locked', hardLocked);
  hardBtn.title = hardLocked ? `${Progress.unlock('mode-hard').need} to unlock` : '';
  if (hardLocked && classicDifficulty === 'hard') { // (locked again by a RANK UP: the next session is Normal)
    classicDifficulty = 'normal';
    storage.set('bytefall-difficulty', 'normal');
    document.querySelectorAll('#difficulty-row button').forEach((b) => b.classList.toggle('active', b.dataset.difficulty === 'normal'));
  }
  Music.refreshUnlocks();
  refreshVsPicks();
  applyTheme();
  applyFont();
  renderPlaylist();
}
Unlocks.onChange(applyUnlocks);
applyUnlocks();
document.getElementById('dev-badge').hidden = !Unlocks.isDevUnlock();
// UNLOCK EVERYTHING in the Android TEST app, where the web's DEV link is (the dev page's switch,
// the same flag): the padlock lit while it's on; the game starts over with it. (The RELEASE app
// has no padlock: tools/build-app.js takes it out)
const unlockBtn = document.getElementById('dev-unlock-btn');
if (window.BYTEFALL_APP && !window.BYTEFALL_APP.release && unlockBtn) {
  const devLink = document.querySelector('a.dev-link');
  if (devLink) devLink.hidden = true;
  unlockBtn.hidden = false;
  const on = Unlocks.isDevUnlock();
  unlockBtn.classList.toggle('on', on);
  unlockBtn.setAttribute('aria-pressed', String(on));
  document.getElementById('dev-unlock-state').textContent = on ? 'ON' : 'OFF';
  unlockBtn.addEventListener('click', () => {
    storage.set('bytefall-dev-unlockall', on ? 'off' : 'on');
    location.reload();
  });
}
document.body.classList.toggle('dev-unlock', Unlocks.isDevUnlock());

// (the old layout editor's saved edits, locks and panel: gone with it, so the layout is the game's own)
for (const k of ['bytefall-layout-edits', 'bytefall-layout-locks', 'bytefall-layout-editor', 'bytefall-layout-editor-panel']) {
  try { localStorage.removeItem(k); } catch (e) {}
}
initGame();
updateFreeBtn();
if (freeGrantedNow) logNotice('DAILY DROP // READY TO CLAIM IN THE STORE'); // (no pop-up: the STORE buttons light up, and NOTICES has it)
showKeys();
// (the date turned while the game was open: the new day's drop lit in the STORE, and said)
function checkNewDay() {
  if (!newDay()) return;
  updateFreeBtn();
  showKeys();
  if (typeof Store !== 'undefined') Store.render();
  logNotice('DAILY DROP // READY TO CLAIM IN THE STORE');
}
document.addEventListener('visibilitychange', () => { if (!document.hidden) checkNewDay(); });
setInterval(() => document.hidden || checkNewDay(), 60000);

function formatCentral(isoDate) {
  const d = new Date(isoDate);
  const date = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Chicago', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(d);
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Chicago', hour: '2-digit', minute: '2-digit', hour12: false, timeZoneName: 'short',
  }).formatToParts(d);
  const get = (type) => parts.find((p) => p.type === type).value;
  const hh = get('hour') === '24' ? '00' : get('hour');
  return `${date} ${hh}:${get('minute')} ${get('timeZoneName')}`;
}

// The build number: this page's own version (index.html's ?v= on this script)
{
  const build = (window.BYTEFALL_APP && window.BYTEFALL_APP.build) || (document.currentScript && new URL(document.currentScript.src).searchParams.get('v'));
  document.getElementById('buildInfo').textContent = build || '\u2014';
}
// (the bundled Android app has them baked in: tools/build-app.js; the LIVE one asks, as the web does)
if (window.BYTEFALL_APP && !window.BYTEFALL_APP.live) {
  document.getElementById('commitInfo').textContent = window.BYTEFALL_APP.commit || '\u2014';
  document.getElementById('updatedInfo').textContent = window.BYTEFALL_APP.date ? formatCentral(window.BYTEFALL_APP.date) : '\u2014';
} else fetch('https://api.github.com/repos/EmptyFishTank-JB/ByteFall/commits?sha=main&per_page=1')
  .then((r) => {
    if (!r.ok) throw new Error('bad response');
    return r.json();
  })
  .then((data) => {
    const c = data[0];
    document.getElementById('commitInfo').textContent = c.sha.slice(0, 7);
    document.getElementById('updatedInfo').textContent = formatCentral(c.commit.committer.date);
  })
  .catch(() => {
    document.getElementById('commitInfo').textContent = 'unavailable';
    document.getElementById('updatedInfo').textContent = 'unavailable';
  });

// The Android app's back button (tools/android/MainActivity.java): as Escape here (closes the open
// card, the music player or the settings; pauses a game, or resumes it; wakes the screen saver);
// at the main menu with nothing open, back to the start screen. false on the start screen: the
// app goes to the background
// The main menu's ← (top left): back to the title screen
document.getElementById('home-back').addEventListener('click', () => { if (window.showStartScreen) window.showStartScreen(); });
window.bytefallBack = () => {
  if (!starterPickEl.classList.contains('hidden')) { closeStarterPick(); return true; } // (a starter slot's card)
  if (!boosterPickEl.classList.contains('hidden')) { closeBoosterPick(); return true; } // (the BOOSTERS card)
  if (shopSlot !== null) { closeShop(); return true; } // (the BLACK MARKET's window)
  const start = document.getElementById('start-screen');
  if (start && !start.hidden) return false;
  if (homeOpen && !panelOpen() && window.showStartScreen) {
    window.showStartScreen();
    return true;
  }
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  return true;
};

// Every button (and link): tinted while held (RESTART and QUIT turn red), and sliding the finger
// or mouse off it before letting go cancels the press, even where the browser would still click
(() => {
  let held = null; // { el, id }
  let canceled = null; // the button whose next click is swallowed
  const SLOP = 16; // (a finger rolls a little as it lifts: only a real slide off cancels)
  const inside = (el, e) => {
    const r = el.getBoundingClientRect();
    return e.clientX >= r.left - SLOP && e.clientX <= r.right + SLOP && e.clientY >= r.top - SLOP && e.clientY <= r.bottom + SLOP;
  };
  const release = () => {
    if (held) held.el.classList.remove('pressing');
    held = null;
  };
  document.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    const el = e.target.closest('button, a[href]');
    if (!el || el.disabled) return;
    held = { el, id: e.pointerId };
    canceled = null;
    el.classList.add('pressing');
  }, true);
  document.addEventListener('pointermove', (e) => {
    if (held && e.pointerId === held.id) held.el.classList.toggle('pressing', inside(held.el, e));
  }, true);
  document.addEventListener('pointerup', (e) => {
    if (!held || e.pointerId !== held.id) return;
    if (!inside(held.el, e)) {
      const el = held.el;
      canceled = el;
      setTimeout(() => { if (canceled === el) canceled = null; }, 400); // (no click came)
    }
    release();
  }, true);
  document.addEventListener('pointercancel', release, true);
  document.addEventListener('click', (e) => {
    if (canceled && canceled.contains(e.target) && e.detail !== 0) {
      e.preventDefault();
      e.stopImmediatePropagation();
      canceled = null;
    }
  }, true);
})();
