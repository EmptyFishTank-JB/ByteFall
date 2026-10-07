// Progress: lifetime stats, levels and DECRYPTOR ranks, earnable unlocks (Hard mode,
// tracks, themes, exploits) and achievements, saved in this browser. Full Access
// (unlocks.js) unlocks everything straight away; otherwise it's earned by playing.
// script.js reports what happens in a run; check() then returns anything newly earned.
//
// Levels: bits decrypted are XP, from Lv 0 to Lv 80. At Lv 80 the player can RANK UP to the
// next DECRYPTOR rank: back to Lv 0, rank +1, and everything locks again. Every unlock (exploits,
// exploit slots, Hard mode, the VS CPU levels and bots, tracks, themes and fonts) comes at a level
// within a rank. The one thing kept for good: DECRYPTOR N keeps N exploit slots (up to 6).
// Only exploits equipped in a slot are awarded.
const Progress = (() => {
  const KEY = 'bytefall-progress';
  const fresh = () => ({
    games: 0, // sessions started (first drop of a run)
    drops: 0,
    bits: 0, // bits decrypted
    bitsByValue: {}, // number -> bits of that number decrypted
    bytes: 0, // Hard: BYTE bonuses
    nibbles: 0, // Easy and Normal: NIBBLE bonuses
    bestDropNibbles: 0, // most nibbles from a single drop
    peeled: 0, // encryption layer levels removed
    broken: 0, // layers peeled all the way, revealing a bit
    exploits: 0, // exploits run
    exploitUses: {}, // per exploit id
    bestChain: 0,
    bestScore: 0, // any difficulty
    points: 0, // lifetime points
    bestHardDrops: 0, // longest Hard session, in drops
    bestDropBytes: 0, // most bytes from a single drop
    sweeps: 0, // board cleared completely (after 10+ drops)
    closeCalls: 0, // decrypted back under the line
    dailies: 0, // days the Daily Decrypt was played
    lastDaily: '', // UTC date of the last one
    dailyStreak: 0, // consecutive days, up to lastDaily
    bestDailyStreak: 0,
    puzzles: {}, // puzzle index -> true once solved
    unlocksSeen: {}, // unlock id -> true once announced this rank
    achieved: {}, // achievement id -> true
    decryptor: 0, // DECRYPTOR rank
    xp: 0, // bits decrypted this rank
    decryptorPoints: 0, // points earned this rank
    equipped: [], // exploit ids in the loadout slots
    lastLevel: 0, // for LEVEL UP announcements
    exploitsSeen: {}, // exploit id -> true once announced this rank
    slotsSeen: 0, // slots announced this rank
    firstDropClears: 0, // sessions where the first drop decrypted something
    bestClearStreak: 0, // most drops in a row that each decrypted a bit
    bestNoToolsScore: 0, // best score in a session with no exploit run
    bestDropBits: 0, // most bits decrypted by one drop
    bestDropBroken: 0, // most layers broken open by one drop
    fullStacks: 0, // columns filled to the line, then brought down to half height
    bestRunCloseCalls: 0,
    bestBlitz: 0,
    bestZenDrops: 0,
    perfectDailies: 0, // Daily Decrypts ended with the board empty
    puzzleTries: {}, // puzzle index -> attempts (runs with at least one drop)
    firstTries: 0, // puzzles solved on the first attempt
    puzzleStreak: 0, // solves since the last failed puzzle
    bestPuzzleStreak: 0,
    bestBombHits: 0, // most blocks one Logic Bomb blast wiped
    stings: 0, // Honeypots sprung
    wiretaps: 0, // Packet Sniffers used up without losing the run
    pivotChains: 0, // PIVOT drops that decrypted bits
    bestRunExploits: 0,
    bestEquipped: 0, // most loadout slots filled at once
    tracksHeard: {}, // track id -> true once played
    tracksPlayed: {}, // track id -> true after a full session (10+ drops) on it
    themesPlayed: {}, // theme id -> true after a full session in it
    fontsPlayed: {}, // font id -> true after a full session in it
    lateNight: 0, // dropped a bit between 2 and 4 AM
    birthday: 0, // dropped a bit on Sep 23
    rageQuit: 0, // restarted 10 live sessions in one sitting
    snakeEyes: 0, // lost with 0 points
    leet: 0, // finished on exactly 1,337
    bestClassicDrops: 0, // longest CLASSIC session, in drops
    dailyDay: { date: '', kinds: {} }, // daily games played on the latest local day
    dailySweeps: 0, // days all four daily games were played
    breaches: 0, // BREACH boards cleared
    sundaySolves: 0, // Sunday (hardest) daily puzzles solved
    dailyFirstTries: 0, // daily puzzles solved on the first try
    secrets: {}, // hidden achievement id -> true (reported by script.js)
    vsWins: {}, // VS CPU: CPU level -> wins
    vsLosses: {}, // VS CPU: CPU level -> losses
    vsMatches: 0, // VS matches finished
    vsBotWins: {}, // bot id -> wins
    vsBotLevelWins: {}, // 'bot:level' -> true once beaten
    vsModeWins: {}, // VS game mode -> wins
    vsFeats: {}, // one-off VS wins (BARE METAL, FLAWLESS and the like) -> true
    vsBestCancel: 0, // most incoming blocks one attack cancelled
    vsBestSent: 0, // most blocks sent at the CPU in one match
    vsLossStreak: 0, // VS losses in a row
    bots: {}, // the bots on the start screen and the VS CPU: event -> count (pokes, bolts, eyebrow-<bot> ...)
    keys: 0, // KEYS: the game's currency, spent on boosters in the STORE
    keysEarned: 0, // every one ever earned
    keyBits: 0, // bits decrypted toward the next key (one every KEY_BITS)
    boosters: {}, // booster id -> how many owned
    starters: {}, // STARTER EXPLOITS: exploit id -> how many owned
    puzzlePaid: {}, // puzzle key -> the day a solve of it last paid XP and KEYS (a replay pays once a day)
    startersTaken: [], // the 2 the player takes into each game (one a side slot; two of one kind, or one each of two)
    res: { bugs: 0, cache: 0, crypto: 0, rootkits: 0, master: 0 }, // the RESOURCES (ECONOMY.md), beside KEYS
    resPart: {}, // resource -> the part of the next one earned so far
    resEarned: {}, // resource -> every one ever earned
    vsMasterDay: '', // the day a VS win last paid a MASTER KEY (one a day)
  });

  let d = fresh();
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if (saved) d = { ...d, ...saved, res: { ...d.res, ...(saved.res || {}) } };
    for (const k of Object.keys(d.res)) d.res[k] = Math.min(999, d.res[k] || 0); // (RES_CAP)
    if (saved && saved.hashes != null && saved.keys == null) { // (KEYS were HASHES for a day)
      d.keys = saved.hashes;
      d.keysEarned = saved.hashesEarned || 0;
      d.keyBits = saved.hashBits || 0;
    }
    delete d.reserves; // (STARTERS were RESERVES before release: those aren't carried over)
    delete d.reservesTaken;
  } catch (e) {}
  const save = () => {
    try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) {}
  };

  // Best scores live under script.js's keys (named before the rename to ByteFall).
  const best = (difficulty) => {
    const key = `bytefall-best-${difficulty}`;
    try { return Number(localStorage.getItem(key)) || 0; } catch (e) { return 0; }
  };

  // The levels (within a rank) where everything unlocks, spread so each level or two brings
  // something: exploits at EXPLOIT_LEVELS and slots at SLOT_LEVELS (below), and around them
  // tracks 02-16, themes, fonts, Hard mode, and the VS CPU's levels and bots
  // Bots to play in VS (BOT is free): [id, name, level]
  const BOT_ORDER = [['grifter', 'GRIFTER', 6], ['bunker', 'BUNKER', 17], ['glitch', 'GLITCH', 33]];
  const TRACK_LEVELS = [2, 7, 11, 16, 20, 25, 31, 36, 40, 44, 50, 55, 62, 68, 77]; // tracks 02-16

  const MAX_LEVEL = 80;
  // 100 bits (12.5 bytes) per level, from Lv 0. Lv 80 comes at 8,000 bits, when RANK UP opens:
  // a full DECRYPTOR rank is exactly 1 kilobyte.
  const BITS_PER_LEVEL = 100;
  const RANK_BITS = MAX_LEVEL * BITS_PER_LEVEL;
  function levelInfo() {
    const level = Math.min(MAX_LEVEL, Math.floor(d.xp / BITS_PER_LEVEL)); // (from Lv 0)
    const into = level >= MAX_LEVEL ? BITS_PER_LEVEL : d.xp - level * BITS_PER_LEVEL;
    return { level, into, need: BITS_PER_LEVEL, maxed: d.xp >= RANK_BITS, decryptor: d.decryptor, xp: Math.min(d.xp, RANK_BITS), rankBits: RANK_BITS };
  }

  // Weakest first, each at its level in EXPLOIT_LEVELS
  const EXPLOIT_ORDER = ['rng', 'bitflip', 'buffer-overflow', 'trojan', 'pivot', 'swap', 'worm-virus', 'keylogger', 'packet-sniffer',
    'backdoor', 'logic-bomb', 'honeypot', 'dictionary-attack', 'rainbow-table', 'black-box'];
  const EXPLOIT_LEVELS = [3, 8, 13, 18, 23, 26, 29, 35, 41, 47, 53, 59, 65, 70, 76];
  // Loadout slots: DECRYPTOR N keeps N (up to MAX_SLOTS); the rest unlock at SLOT_LEVELS in turn
  const MAX_SLOTS = 6;
  const SLOT_LEVELS = [5, 15, 30, 45, 60, 75];
  // The SIDE SLOTS either side of the exploit button (STARTER EXPLOITS and the BLACK MARKET): the
  // left one early, the right one a little later, so the market's prices are met a step at a time
  const SIDE_SLOT_LEVELS = [4, 12];
  const sideSlots = () => (Unlocks.hasFullAccess() ? 2 : SIDE_SLOT_LEVELS.filter((l) => levelInfo().level >= l).length);
  let exploitNames = {}; // id -> name, from script.js

  function exploitInfo(id) {
    const level = EXPLOIT_LEVELS[EXPLOIT_ORDER.indexOf(id)];
    return { unlocked: Unlocks.hasFullAccess() || levelInfo().level >= level, kept: false, level };
  }
  function slotInfo() {
    if (Unlocks.hasFullAccess()) return { slots: MAX_SLOTS, max: MAX_SLOTS, kept: MAX_SLOTS, nextLevel: 0 };
    const kept = Math.min(d.decryptor, MAX_SLOTS);
    const { level } = levelInfo();
    const levels = SLOT_LEVELS.slice(0, MAX_SLOTS - kept);
    const earned = levels.filter((l) => level >= l).length;
    const next = levels.find((l) => level < l);
    return { slots: kept + earned, max: MAX_SLOTS, kept, nextLevel: next || 0 };
  }
  const unlockedExploits = () => EXPLOIT_ORDER.filter((id) => exploitInfo(id).unlocked);

  // Keep the loadout valid: only unlocked exploits, no more than the slots.
  function tidyLoadout() {
    const { slots } = slotInfo();
    d.equipped = d.equipped.filter((id, i, all) => exploitInfo(id).unlocked && all.indexOf(id) === i).slice(0, slots);
  }
  // When an exploit or slot unlocks, fill free slots with unlocked exploits in order, so new
  // unlocks are ready to use. (Not on every change, or unequipping to swap would refill.)
  function fillLoadout() {
    tidyLoadout();
    const { slots } = slotInfo();
    for (const id of unlockedExploits()) {
      if (d.equipped.length >= slots) break;
      if (!d.equipped.includes(id)) d.equipped.push(id);
    }
  }

  // Themes: [id, name, level]
  const THEME_ORDER = [['cipher', 'CIPHER', 4], ['amber-crt', 'AMBER CRT', 12], ['monochrome', 'MONOCHROME', 19], ['anaglyph', 'ANAGLYPH', 27],
    ['synthwave', 'SYNTHWAVE', 34], ['dot-matrix', 'DOT MATRIX', 43], ['paper', 'PAPER', 52], ['glyph', 'GLYPH', 63], ['spectrum', 'SPECTRUM', 72]];

  // Pixel fonts (COURIER is free): [id, name, level]
  const FONT_ORDER = [['share-tech', 'SHARE TECH MONO', 9], ['press-start', 'PRESS START', 21], ['bitcount', 'BITCOUNT', 39], ['bytesized', 'BYTESIZED', 57], ['orbitron', 'ORBITRON', 66]];

  // group: where it shows in the UNLOCKS list; level: the level (within a rank) it unlocks at
  const atLevel = (level) => ({ need: `Reach Lv ${level}`, value: () => levelInfo().level, goal: level, level });
  const UNLOCKS = [
    { id: 'mode-hard', group: 'MODE', name: 'HARD MODE', ...atLevel(10) },
    // VS CPU: the harder CPU levels and more bots
    { id: 'vs-hard', group: 'VS CPU', name: 'HARD CPU', ...atLevel(14) },
    { id: 'vs-insane', group: 'VS CPU', name: 'INSANE CPU', ...atLevel(46) },
    ...BOT_ORDER.map(([id, name, level]) => ({ id: `bot-${id}`, group: 'VS CPU', name: `BOT: ${name}`, ...atLevel(level) })),
    ...TRACK_LEVELS.map((level, i) => ({ id: `track-${i + 2}`, group: 'TRACKS', name: `TRACK ${String(i + 2).padStart(2, '0')}`, ...atLevel(level) })),
    ...SIDE_SLOT_LEVELS.map((level, i) => ({ id: `side-slot-${i + 1}`, group: 'SIDE SLOTS', name: `SIDE SLOT: ${i ? 'RIGHT' : 'LEFT'}`, ...atLevel(level) })),
    ...THEME_ORDER.map(([id, name, level]) => ({ id: `theme-${id}`, group: 'THEMES', name, ...atLevel(level) })),
    ...FONT_ORDER.map(([id, name, level]) => ({ id: `font-${id}`, group: 'FONTS', name, ...atLevel(level) })),
  ];
  const unlockById = Object.fromEntries(UNLOCKS.map((u) => [u.id, u]));

  const themeIds = UNLOCKS.filter((u) => u.group === 'THEMES').map((u) => u.id);
  let exploitCount = 7; // set by script.js from HACKS
  let puzzleCount = 30; // set by script.js from PUZZLES
  let madeTracks = []; // the tracks made so far ({ no, free }): set by script.js from Music.tracks()
  const ALL_TRACKS = 16; // the playlist's full length (the music achievements need all of them)
  let themeCount = 10; // set by script.js from THEMES
  let sittingRestarts = 0; // live sessions restarted since the page loaded
  let sittingThemes = 0; // theme changes since the page loaded
  let sittingTracks = 0; // tracks picked since the page loaded
  const count = (obj) => Object.keys(obj).length;
  // A local calendar day as YYYY-MM-DD, `offset` days from today
  const localDay = (offset = 0) => {
    const t = new Date();
    t.setDate(t.getDate() + offset);
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
  };
  // The Daily streak as it stands today: back to 0 once a day has been missed (the streak
  // achievements track this, not the best one, so a missed day starts them over)
  // (days are the player's own: they turn over at local midnight)
  const currentStreak = () => (d.lastDaily === localDay() || d.lastDaily === localDay(-1) ? d.dailyStreak : 0);
  // The daily games played today, toward DAILY SWEEP (back to 0 at local midnight)
  const kindsToday = () => (d.dailyDay.date === localDay() ? count(d.dailyDay.kinds) : 0);

  const ACHIEVEMENTS = [
    { id: 'first-contact', name: 'FIRST CONTACT', desc: 'Start your first session', value: () => d.games, goal: 1 },
    { id: 'regular', name: 'REGULAR', desc: 'Play 25 sessions', value: () => d.games, goal: 25 },
    { id: 'veteran', name: 'VETERAN', desc: 'Play 100 sessions', value: () => d.games, goal: 100 },
    { id: 'handshake', name: 'HANDSHAKE', desc: 'Decrypt 100 bits', value: () => d.bits, goal: 100 },
    // Data decrypted, in decimal units of bits decrypted (8 bits to a byte)
    { id: 'kilobit', name: 'KILOBIT', desc: 'Decrypt 1,000 bits', value: () => d.bits, goal: 1000 },
    { id: 'kilobyte', name: 'KILOBYTE', desc: 'Decrypt 8,000 bits', value: () => d.bits, goal: 8000 },
    { id: 'megabit', name: 'MEGABIT', desc: 'Decrypt 1,000,000 bits', value: () => d.bits, goal: 1000000 },
    { id: 'megabyte', name: 'MEGABYTE', desc: 'Decrypt 8,000,000 bits', value: () => d.bits, goal: 8000000 },
    { id: 'chain-reaction', name: 'CHAIN REACTION', desc: 'Get a 4x chain', value: () => d.bestChain, goal: 4 },
    { id: 'cascade', name: 'CASCADE', desc: 'Get a 6x chain', value: () => d.bestChain, goal: 6 },
    { id: 'overclocked', name: 'OVERCLOCKED', desc: 'Get an 8x chain', value: () => d.bestChain, goal: 8 },
    { id: 'first-byte', name: 'FIRST BYTE', desc: 'Decrypt a BYTE on Hard', value: () => d.bytes, goal: 1 },
    { id: 'double-byte', name: 'DOUBLE BYTE', desc: 'Decrypt 2 bytes with one drop', value: () => d.bestDropBytes, goal: 2 },
    { id: 'byte-stream', name: 'BYTE STREAM', desc: 'Decrypt 10 bytes', value: () => d.bytes, goal: 10 },
    { id: 'layer-peeler', name: 'LAYER PEELER', desc: 'Peel 100 encryption layers', value: () => d.peeled, goal: 100 },
    { id: 'onion-router', name: 'ONION ROUTER', desc: 'Peel 1,000 encryption layers', value: () => d.peeled, goal: 1000 },
    { id: 'script-kiddie', name: 'SCRIPT KIDDIE', desc: 'Run your first exploit', value: () => d.exploits, goal: 1 },
    { id: 'black-hat', name: 'BLACK HAT', desc: 'Run 50 exploits', value: () => d.exploits, goal: 50 },
    { id: 'full-toolkit', name: 'FULL TOOLKIT', desc: 'Run every exploit at least once', value: () => Object.keys(d.exploitUses).length, goal: () => exploitCount },
    { id: 'root-access', name: 'ROOT ACCESS', desc: 'Score 1,000 in one session', value: () => d.bestScore, goal: 1000 },
    { id: 'superuser', name: 'SUPERUSER', desc: 'Score 5,000 in one session', value: () => d.bestScore, goal: 5000 },
    { id: 'kernel-mode', name: 'KERNEL MODE', desc: 'Score 10,000 in one session', value: () => d.bestScore, goal: 10000 },
    { id: 'hardened', name: 'HARDENED', desc: 'Unlock Hard mode', value: () => (isUnlocked('mode-hard') ? 1 : 0), goal: 1 },
    { id: 'ghost', name: 'GHOST', desc: 'Last 100 drops in one Hard session', value: () => d.bestHardDrops, goal: 100 },
    { id: 'clean-sweep', name: 'CLEAN SWEEP', desc: 'Clear the whole board after 10+ drops', value: () => d.sweeps, goal: 1 },
    { id: 'close-call', name: 'CLOSE CALL', desc: 'Decrypt your way back under the line', value: () => d.closeCalls, goal: 1 },
    { id: 'daily-driver', name: 'DAILY DRIVER', desc: 'Play a Daily game 7 days in a row', value: currentStreak, goal: 7, note: 'Progress shows your current streak; a missed day (at midnight) starts it over' },
    { id: 'locksmith', name: 'LOCKSMITH', desc: 'Solve 10 puzzles', value: () => Object.keys(d.puzzles).length, goal: 10 },
    { id: 'master-key', name: 'SKELETON KEY', desc: 'Solve every puzzle', value: () => Object.keys(d.puzzles).length, goal: () => puzzleCount },
    { id: 'maxed-out', name: 'MAXED OUT', desc: 'Reach Lv 80 as DECRYPTOR 9', value: () => (d.decryptor >= 10 || (d.decryptor >= 9 && levelInfo().maxed) ? 1 : 0), goal: 1 },
    { id: 'rollover', name: 'ROLLOVER', desc: 'Rank up to DECRYPTOR 1', value: () => d.decryptor, goal: 1 },
    { id: 'full-spectrum', name: 'FULL SPECTRUM', desc: 'Unlock every theme', value: () => themeIds.filter(isUnlocked).length, goal: themeIds.length },
    // All 16 tracks: only tracks that exist count, so these wait until track 16 is made
    { id: 'collector', name: 'COLLECTOR', desc: 'Unlock all 16 music tracks', value: () => madeTracks.filter((t) => t.free || isUnlocked(`track-${t.no}`)).length, goal: ALL_TRACKS },
    // Skill
    { id: 'zero-day', name: 'ZERO-DAY', desc: 'Decrypt a bit with the first drop of a session', value: () => d.firstDropClears, goal: 1 },
    { id: 'surgical', name: 'SURGICAL', desc: '20 drops in a row that each decrypt a bit (exploit drops skip)', value: () => d.bestClearStreak, goal: 20, note: 'Progress shows your best run so far' },
    { id: 'no-tools', name: 'NO TOOLS', desc: 'Score 2,000 in one session without running an exploit', value: () => d.bestNoToolsScore, goal: 2000 },
    { id: 'heap-spray', name: 'HEAP SPRAY', desc: 'Decrypt 15 bits with one drop', value: () => d.bestDropBits, goal: 15 },
    { id: 'full-stack', name: 'FULL STACK', desc: 'Fill a column to the line, then bring it back down to half height', value: () => d.fullStacks, goal: 1 },
    { id: 'firewall-breach', name: 'FIREWALL BREACH', desc: 'Break 3 encryption layers open with one drop', value: () => d.bestDropBroken, goal: 3 },
    { id: 'second-wind', name: 'SECOND WIND', desc: 'Get two CLOSE CALLs in one session', value: () => d.bestRunCloseCalls, goal: 2 },
    // Modes
    { id: 'speed-run', name: 'SPEED RUN', desc: 'Score 1,000 in one Blitz', value: () => d.bestBlitz, goal: 1000 },
    { id: 'blitzkrieg', name: 'BLITZKRIEG', desc: 'Score 3,000 in one Blitz', value: () => d.bestBlitz, goal: 3000 },
    { id: 'zen-master', name: 'ZEN MASTER', desc: 'Last 300 drops in one Zen session', value: () => d.bestZenDrops, goal: 300 },
    { id: 'daily-grind', name: 'DAILY GRIND', desc: 'Play the Daily on 30 different days', value: () => d.dailies, goal: 30 },
    { id: 'streak', name: 'STREAK', desc: 'Play a Daily game 30 days in a row', value: currentStreak, goal: 30, note: 'Progress shows your current streak; a missed day (at midnight) starts it over' },
    { id: 'perfect-daily', name: 'PERFECT DAILY', desc: 'Finish a Daily Decrypt with the board empty', value: () => d.perfectDailies, goal: 1 },
    { id: 'first-try', name: 'FIRST TRY', desc: 'Solve a puzzle on your first attempt', value: () => d.firstTries, goal: 1 },
    { id: 'pickpocket', name: 'PICKPOCKET', desc: 'Solve 5 puzzles in a row without failing one', value: () => d.bestPuzzleStreak, goal: 5, note: 'Progress shows your best run so far' },
    // Exploits
    { id: 'time-bomb', name: 'TIME BOMB', desc: 'Wipe 5 blocks with one Logic Bomb blast', value: () => d.bestBombHits, goal: 5 },
    { id: 'sting', name: 'STING', desc: 'Spring a Honeypot', value: () => d.stings, goal: 1 },
    { id: 'wiretap', name: 'WIRETAP', desc: 'Use all 3 Packet Sniffer bits without losing the session', value: () => d.wiretaps, goal: 1 },
    { id: 'lateral-movement', name: 'LATERAL MOVEMENT', desc: 'Start a chain with a PIVOT', value: () => d.pivotChains, goal: 1 },
    { id: 'chained-exploits', name: 'CHAINED EXPLOITS', desc: 'Run 3 exploits in one session', value: () => d.bestRunExploits, goal: 3 },
    { id: 'arsenal', name: 'ARSENAL', desc: 'Fill all 6 exploit slots', value: () => d.bestEquipped, goal: MAX_SLOTS },
    // Collection and progress
    { id: 'tech-support', name: 'TECH SUPPORT', desc: 'Play a full session (10+ drops) in the SHARE TECH MONO font', value: () => (d.fontsPlayed['share-tech'] ? 1 : 0), goal: 1 },
    { id: 'insert-coin', name: 'INSERT COIN', desc: 'Play a full session (10+ drops) in the PRESS START font', value: () => (d.fontsPlayed['press-start'] ? 1 : 0), goal: 1 },
    { id: 'bit-by-bit', name: 'BIT BY BIT', desc: 'Play a full session (10+ drops) in the BITCOUNT font', value: () => (d.fontsPlayed.bitcount ? 1 : 0), goal: 1 },
    { id: 'bite-sized', name: 'BITE-SIZED', desc: 'Play a full session (10+ drops) in the BYTESIZED font', value: () => (d.fontsPlayed.bytesized ? 1 : 0), goal: 1 },
    { id: 'in-orbit', name: 'IN ORBIT', desc: 'Play a full session (10+ drops) in the ORBITRON font', value: () => (d.fontsPlayed.orbitron ? 1 : 0), goal: 1 },
    { id: 'dj', name: 'DJ', desc: 'Listen to all 16 tracks', value: () => count(d.tracksHeard), goal: ALL_TRACKS },
    { id: 'audiophile', name: 'AUDIOPHILE', desc: 'Play a full session (10+ drops) on all 16 tracks', value: () => count(d.tracksPlayed), goal: ALL_TRACKS },
    { id: 'chameleon', name: 'CHAMELEON', desc: 'Play a full session (10+ drops) in every theme', value: () => count(d.themesPlayed), goal: () => themeCount },
    { id: 'lv-40', name: 'LV 40', desc: 'Reach level 40', value: () => (d.decryptor > 0 ? 40 : levelInfo().level), goal: 40 },
    { id: 'gigabit', name: 'GIGABIT', desc: 'Decrypt 1,000,000,000 bits', value: () => d.bits, goal: 1000000000, impossible: true },
    { id: 'insomniac', name: 'INSOMNIAC', desc: 'Play between 2 and 4 AM', value: () => d.lateNight, goal: 1 },
    { id: 'birthday', name: 'BIRTHDAY', desc: "Play on September 23, ByteFall's birthday", value: () => d.birthday, goal: 1, hidden: true },
    // Hidden until earned
    { id: 'rage-quit', name: 'RAGE QUIT', desc: 'Restart 10 sessions in one sitting', value: () => d.rageQuit, goal: 1, hidden: true },
    { id: 'snake-eyes', name: 'SNAKE EYES', desc: 'Lose a session with 0 points', value: () => d.snakeEyes, goal: 1, hidden: true },
    { id: '1337', name: '1337', desc: 'Finish a session on exactly 1,337 points', value: () => d.leet, goal: 1, hidden: true },
    // More: skill, totals and modes
    { id: 'lifer', name: 'LIFER', desc: 'Play 500 sessions', value: () => d.games, goal: 500 },
    { id: 'marathon', name: 'MARATHON', desc: 'Last 250 drops in one Classic session', value: () => d.bestClassicDrops, goal: 250 },
    { id: 'supernova', name: 'SUPERNOVA', desc: 'Get a 10x chain', value: () => d.bestChain, goal: 10 },
    { id: 'byte-array', name: 'BYTE ARRAY', desc: 'Decrypt 100 bytes', value: () => d.bytes, goal: 100 },
    { id: 'triple-byte', name: 'TRIPLE BYTE', desc: 'Decrypt 3 bytes with one drop', value: () => d.bestDropBytes, goal: 3 },
    { id: 'onion-core', name: 'ONION CORE', desc: 'Peel 10,000 encryption layers', value: () => d.peeled, goal: 10000 },
    { id: 'demolition', name: 'DEMOLITION', desc: 'Break 500 encryption layers all the way open', value: () => d.broken, goal: 500 },
    { id: 'advanced-persistent-threat', name: 'ADVANCED PERSISTENT THREAT', desc: 'Run 500 exploits', value: () => d.exploits, goal: 500 },
    { id: 'hypervisor', name: 'HYPERVISOR', desc: 'Score 20,000 in one session', value: () => d.bestScore, goal: 20000 },
    { id: 'hard-target', name: 'HARD TARGET', desc: 'Score 5,000 on Hard', value: () => best('hard'), goal: 5000 },
    { id: 'full-range', name: 'FULL RANGE', desc: 'Decrypt 100 of every number from [1] to [7]', value: () => Math.min(...[1, 2, 3, 4, 5, 6, 7].map((n) => d.bitsByValue[n] || 0)), goal: 100 },
    { id: '106473', name: '106473', desc: 'Decrypt 106,473 bits', value: () => d.bits, goal: 106473 },
    { id: 'lucky-sevens', name: 'LUCKY SEVENS', desc: 'Decrypt 1,000 [7]s', value: () => d.bitsByValue[7] || 0, goal: 1000 },
    { id: 'lightspeed', name: 'LIGHTSPEED', desc: 'Score 5,000 in one Blitz', value: () => d.bestBlitz, goal: 5000 },
    { id: 'daily-sweep', name: 'DAILY SWEEP', desc: 'Play all four daily games on the same day', value: () => (d.dailySweeps ? 4 : kindsToday()), goal: 4, note: 'Progress shows today\u2019s games; it starts over at midnight' },
    { id: 'breached', name: 'BREACHED', desc: 'Clear the whole board in BREACH', value: () => d.breaches, goal: 1 },
    { id: 'one-shot', name: 'ONE SHOT', desc: 'Solve a daily puzzle on the first try', value: () => d.dailyFirstTries, goal: 1 },
    { id: 'sunday-best', name: 'SUNDAY BEST', desc: "Solve a Sunday daily puzzle (the week's hardest)", value: () => d.sundaySolves, goal: 1 },
    { id: 'safecracker', name: 'SAFECRACKER', desc: 'Solve 30 puzzles', value: () => count(d.puzzles), goal: 30 },
    { id: 'century', name: 'CENTURY', desc: 'Play a Daily game 100 days in a row', value: currentStreak, goal: 100, note: 'Progress shows your current streak; a missed day (at midnight) starts it over' },
    { id: 'triple-crown', name: 'TRIPLE CROWN', desc: 'Reach DECRYPTOR 3', value: () => d.decryptor, goal: 3 },
    // Nibbles (Easy and Normal: 4 bits decrypted by one drop)
    ...[
      ['just-a-crumb', 'JUST A CRUMB', 'Decrypt your first nibble', 1],
      ['a-full-byte', 'A FULL BYTE', 'Decrypt 2 nibbles (8 bits: one byte)', 2],
      ['64-bit-architecture', '64-BIT ARCHITECTURE', 'Decrypt 16 nibbles (64 bits)', 16],
      ['snack-attack', 'SNACK ATTACK', 'Decrypt 100 nibbles', 100],
      ['nibbling', 'NIBBLING', 'Decrypt 250 nibbles (1,000 bits: a kilobit)', 250],
      ['kilonibble', 'KILONIBBLE', 'Decrypt 1,000 nibbles', 1000],
      ['kibinibble', 'KIBINIBBLE', 'Decrypt 1,024 nibbles', 1024],
      ['kibibyte', 'KIBIBYTE', 'Decrypt 2,048 nibbles (1,024 bytes)', 2048],
      ['dial-up-speeds', 'DIAL-UP SPEEDS', 'Decrypt 16,384 nibbles (65,536 bits)', 16384],
      ['16-bit-era', 'THE 16-BIT ERA', 'Decrypt 65,536 nibbles (2^16)', 65536],
      ['64k-memory-limit', '64K MEMORY LIMIT', 'Decrypt 131,072 nibbles (65,536 bytes: 64 KiB)', 131072],
      ['meganibble', 'MEGANIBBLE', 'Decrypt 1,000,000 nibbles', 1000000],
      ['mebinibble', 'MEBINIBBLE', 'Decrypt 1,048,576 nibbles (1,024 x 1,024)', 1048576],
      ['mebibyte', 'MEBIBYTE', 'Decrypt 2,097,152 nibbles (1,048,576 bytes: 1 MiB)', 2097152],
    ].map(([id, name, desc, goal]) => ({ id, name, desc, value: () => d.nibbles, goal })),
    // More hidden ones
    ...[
      ['konami', 'KONAMI', 'Enter the Konami code'],
      ['not-found', 'NOT FOUND', 'Finish a session on exactly 404 points'],
      ['deep-thought', 'DEEP THOUGHT', 'Finish a session with exactly 42 bits decrypted'],
      ['jackpot', 'JACKPOT', 'Decrypt seven [7]s with one drop'],
      ['silent-running', 'SILENT RUNNING', 'Play a full session (10+ drops) with the sound and music off'],
      ['stubborn', 'STUBBORN', 'Try the same daily puzzle 10 times'],
      ['so-close', 'SO CLOSE', 'End a BREACH with one layer left'],
      ['full-house', 'FULL HOUSE', 'Survive a drop with every column one block from the line or higher'],
      ['theme-park', 'THEME PARK', 'Change the theme 10 times in one sitting'],
      ['channel-surfer', 'CHANNEL SURFER', 'Pick a track 10 times in one sitting'],
      ['last-second', 'LAST SECOND', 'Decrypt a bit in Blitz with under a second left'],
      ['palindrome', 'PALINDROME', 'Finish a session on a score that reads the same backwards (4+ digits)'],
      ['overkill', 'OVERKILL', 'Run an exploit on an empty board'],
      ['double-trouble', 'DOUBLE TROUBLE', 'Have a Logic Bomb and a Honeypot armed at the same time'],
      ['friday-13th', 'FRIDAY THE 13TH', 'Play on a Friday the 13th'],
      ['pi-day', 'PI DAY', 'Play on March 14'],
    ].map(([id, name, desc]) => ({ id, name, desc, value: () => (d.secrets[id] ? 1 : 0), goal: 1, hidden: true })),
    // VS CPU
    ...(() => {
      const wins = () => Object.values(d.vsWins).reduce((n, w) => n + w, 0);
      const feat = (id) => () => (d.vsFeats[id] ? 1 : 0);
      const levelWin = (level) => () => d.vsWins[level] || 0;
      const botWin = (bot) => () => d.vsBotWins[bot] || 0;
      const BOTS = ['bot', 'grifter', 'bunker', 'glitch'];
      const MODES = ['classic', 'attrition', 'deathmatch', 'tug'];
      return [
        { id: 'first-blood', name: 'FIRST BLOOD', desc: 'Win your first VS match', value: wins, goal: 1 },
        { id: 'sparring-partner', name: 'SPARRING PARTNER', desc: 'Play 10 VS matches', value: () => d.vsMatches, goal: 10 },
        { id: 'gladiator', name: 'GLADIATOR', desc: 'Win 25 VS matches', value: wins, goal: 25 },
        { id: 'warlord', name: 'WARLORD', desc: 'Win 100 VS matches', value: wins, goal: 100 },
        { id: 'easy-target', name: 'EASY TARGET', desc: 'Beat the EASY CPU', value: levelWin('easy'), goal: 1 },
        { id: 'fair-fight', name: 'FAIR FIGHT', desc: 'Beat the NORMAL CPU', value: levelWin('normal'), goal: 1 },
        { id: 'hard-reset', name: 'HARD RESET', desc: 'Beat the HARD CPU', value: levelWin('hard'), goal: 1 },
        { id: 'insanity-check', name: 'INSANITY CHECK', desc: 'Beat the INSANE CPU', value: levelWin('insane'), goal: 1 },
        { id: 'debugged', name: 'DEBUGGED', desc: 'Beat BOT', value: botWin('bot'), goal: 1 },
        { id: 'outhustled', name: 'OUTHUSTLED', desc: 'Beat GRIFTER', value: botWin('grifter'), goal: 1 },
        { id: 'bunker-buster', name: 'BUNKER BUSTER', desc: 'Beat BUNKER', value: botWin('bunker'), goal: 1 },
        { id: 'patched', name: 'PATCHED', desc: 'Beat GLITCH', value: botWin('glitch'), goal: 1 },
        { id: 'rogues-gallery', name: "ROGUES' GALLERY", desc: 'Beat every bot', value: () => BOTS.filter((b) => d.vsBotWins[b]).length, goal: BOTS.length },
        { id: 'kill-9', name: 'NO CONTEST', desc: 'Beat every bot on INSANE', value: () => BOTS.filter((b) => d.vsBotLevelWins[`${b}:insane`]).length, goal: BOTS.length },
        { id: 'stack-overflow', name: 'STACK OVERFLOW', desc: 'Win a CLASSIC VS match', value: () => d.vsModeWins.classic || 0, goal: 1 },
        { id: 'war-of-attrition', name: 'WAR OF ATTRITION', desc: 'Win an ATTRITION VS match', value: () => d.vsModeWins.attrition || 0, goal: 1 },
        { id: 'frag-limit', name: 'FRAG LIMIT', desc: 'Win a DEATHMATCH VS match', value: () => d.vsModeWins.deathmatch || 0, goal: 1 },
        { id: 'rope-a-dope', name: 'ROPE-A-DOPE', desc: 'Win a TUG OF WAR VS match', value: () => d.vsModeWins.tug || 0, goal: 1 },
        { id: 'multi-boot', name: 'MULTI-BOOT', desc: 'Win a VS match in every game mode', value: () => MODES.filter((m) => d.vsModeWins[m]).length, goal: MODES.length },
        { id: 'long-haul', name: 'LONG HAUL', desc: 'Win an ATTRITION or DEATHMATCH to 10,000', value: feat('long-haul'), goal: 1 },
        { id: 'heavyweight', name: 'HEAVYWEIGHT', desc: 'Win a TUG OF WAR starting at 5,000', value: feat('heavyweight'), goal: 1 },
        { id: 'bankrupt', name: 'BANKRUPT', desc: 'Win an ATTRITION match with the CPU on 0 points', value: feat('bankrupt'), goal: 1 },
        { id: 'knockout', name: 'KNOCKOUT', desc: 'Win an ATTRITION, DEATHMATCH or TUG OF WAR match by overflowing the CPU', value: feat('knockout'), goal: 1 },
        { id: 'bare-metal', name: 'BARE METAL', desc: 'Win a VS match with ENCRYPTED LAYERS off', value: feat('bare-metal'), goal: 1 },
        { id: 'arms-race', name: 'ARMS RACE', desc: 'Win a VS match with EXPLOITS on', value: feat('arms-race'), goal: 1 },
        { id: 'zero-mercy', name: 'ZERO MERCY', desc: 'Beat the INSANE CPU with layers and exploits on', value: feat('zero-mercy'), goal: 1 },
        { id: 'flawless', name: 'FLAWLESS', desc: 'Win a VS match without a single block landing on your board', value: feat('flawless'), goal: 1 },
        { id: 'counterstrike', name: 'COUNTERSTRIKE', desc: 'Cancel 10 incoming blocks with one attack', value: () => d.vsBestCancel, goal: 10 },
        { id: 'ddos', name: 'DDOS', desc: 'Send 50 encrypted blocks at the CPU in one match', value: () => d.vsBestSent, goal: 50 },
      ];
    })(),
    ...[
      ['tilted', 'TILTED', 'Lose 5 VS matches in a row'],
      ['afk', 'AFK', 'Leave a VS match paused for 5 minutes'],
    ].map(([id, name, desc]) => ({ id, name, desc, value: () => (d.secrets[id] ? 1 : 0), goal: 1, hidden: true })),
    // The bots: poking them (start screen wanderers, the VS CPU's face) and watching them
    ...(() => {
      const n = (id) => () => d.bots[id] || 0;
      return [
        { id: 'poke', name: 'POKE', desc: 'Poke a bot', value: n('pokes'), goal: 1 },
        { id: 'boo', name: 'BOO!', desc: 'Poke a bot so hard it runs away', value: n('bolts'), goal: 1 },
        { id: 'the-eyebrow', name: 'THE EYEBROW', desc: 'Get a raised eyebrow from all four bots', value: () => ['bot', 'grifter', 'bunker', 'glitch'].filter((b) => d.bots[`eyebrow-${b}`]).length, goal: 4 },
        { id: 'third-wheel', name: 'THIRD WHEEL', desc: 'Poke a bot in the middle of a conversation', value: n('third-wheel'), goal: 1 },
        { id: 'matchmaker', name: 'MATCHMAKER', desc: 'Watch two bots fall for each other on the start screen', value: n('love-pair'), goal: 1 },
        { id: 'jump-scare', name: 'JUMP SCARE', desc: 'Watch a bot pop into view and startle another', value: n('jump-scare'), goal: 1 },
        { id: 'now-you-see-me', name: 'NOW YOU SEE ME', desc: 'Watch a bot decrypt itself away', value: n('vanish'), goal: 1 },
        { id: 'full-crew', name: 'FULL CREW', desc: 'See all four bots on screen at once', value: n('crew'), goal: 1 },
        { id: 'personal-space', name: 'PERSONAL SPACE', desc: 'Poke 100 bots', value: n('pokes'), goal: 100, hidden: true },
        { id: 'hr-wants-a-word', name: 'HR WANTS A WORD', desc: 'Poke 200 bots', value: n('pokes'), goal: 200, hidden: true },
        { id: 'sweet-tooth', name: 'SWEET TOOTH', desc: 'Watch the bots eat 100 Halloween candies', value: n('candy'), goal: 100, hidden: true },
        { id: 'monster-mash', name: 'MONSTER MASH', desc: 'Meet all eight Halloween visitors: the monster, the mummy, the creature, Nosferatu, the ghost, the bats, the crows and the spider', value: () => ['frank', 'mummy', 'creature', 'nosferatu', 'ghost', 'bats', 'crows', 'spider'].filter((k) => (d.bots[`visit-${k}`] || 0) > 0).length, goal: 8, hidden: true },
        { id: 'uprooted', name: 'UPROOTED', desc: 'Watch a bot push a scary tree onto the card', value: n('push-tree'), goal: 1, hidden: true },
        { id: 'gobble-gobble', name: 'GOBBLE GOBBLE', desc: 'Meet the November turkey', value: n('visit-turkey'), goal: 1, hidden: true },
        { id: 'snow-day', name: 'SNOW DAY', desc: 'Poke a snowman a bot pushed onto the card', value: n('snowman-pokes'), goal: 1, hidden: true },
        { id: 'full-byte', name: 'FULL BYTE', desc: 'See the bots push out every BIT from 1 to 8', value: () => [1, 2, 3, 4, 5, 6, 7, 8].filter((n) => d.bots[`seen-bit-${n}`]).length, goal: 8, hidden: true },
        { id: 'belly-slide', name: 'BELLY SLIDE', desc: 'Poke the winter penguin and send it sliding', value: n('penguin-slide'), goal: 1, hidden: true },
        { id: 'red-nose', name: 'RED NOSE', desc: 'See the reindeer with the glowing red nose', value: n('visit-rudolph'), goal: 1, hidden: true },
        { id: 'eight-nights', name: 'EIGHT NIGHTS', desc: 'Watch a bot push a menorah onto the card during Hanukkah', value: n('push-menorah'), goal: 1, hidden: true },
        { id: 'gimel', name: 'GIMEL', desc: 'See the Hanukkah dreidel land on GIMEL', value: n('gimel'), goal: 1, hidden: true },
        { id: 'seven-candles', name: 'SEVEN CANDLES', desc: 'Watch a bot push a kinara onto the card during Kwanzaa', value: n('push-kinara'), goal: 1, hidden: true },
        { id: 'storm-chaser', name: 'STORM CHASER', desc: 'See a thunderstorm, a blizzard and hail roll over the bots', value: () => ['storm', 'blizzard', 'hail'].filter((k) => d.bots[`weather-${k}`]).length, goal: 3, hidden: true },
        { id: 'stargazer', name: 'STARGAZER', desc: 'See the northern lights, a meteor shower and fireflies over the bots', value: () => ['aurora', 'meteors', 'fireflies'].filter((k) => d.bots[`weather-${k}`]).length, goal: 3, hidden: true },
        { id: 'gone-fishing', name: 'GONE FISHING', desc: 'Watch a bot reel in a fish off the dock', value: () => (d.bots['fish-caught'] || 0) + (d.bots['fish-gold'] || 0), goal: 1, hidden: true },
        { id: 'the-one-that-got-away', name: 'THE ONE THAT GOT AWAY', desc: 'Tap a fishing bot\'s bobber and scare off its fish', value: n('fish-lost'), goal: 1, hidden: true },
        { id: 'midnight', name: 'MIDNIGHT', desc: 'Be there when the bots count down to the new year', value: n('countdown'), goal: 1, hidden: true },
        { id: 'costume-party', name: 'COSTUME PARTY', desc: 'All four bots on screen at once in their Halloween costumes', value: n('costume-party'), goal: 1, hidden: true },
        { id: 'rabid', name: 'RABID', desc: 'Poke a HARD or INSANE bot and get snapped at', value: n('bitten'), goal: 1, hidden: true },
        { id: 'developer-options', name: 'DEVELOPER OPTIONS', desc: 'Tap the VS CPU seven times in a row', value: n('dev-taps'), goal: 1, hidden: true },
      ];
    })(),
    // Buying anything in the STORE (a real purchase: the dev page's previews don't count)
    { id: 'indie-supporter', name: 'INDIE SUPPORTER', desc: 'Buy REMOVE ADS or FULL ACCESS in the STORE. Thank you for supporting an indie game!', value: () => (Unlocks.hasPurchase() ? 1 : 0), goal: 1 },
    // Impossible (or nearly): lifetime points. Listed on their own, outside the EARNED count.
    { id: '32-bit-overflow', name: '32-BIT OVERFLOW', desc: 'Decrypt 1,073,741,824 nibbles (2^32 bits)', value: () => d.nibbles, goal: 1073741824, impossible: true },
    { id: 'gigabyte', name: 'GIGABYTE', desc: 'Earn 8,000,000,000 points in total', value: () => d.points, goal: 8e9, impossible: true },
    { id: 'terabyte', name: 'TERABYTE', desc: 'Earn 8,000,000,000,000 points in total', value: () => d.points, goal: 8e12, impossible: true },
  ];

  // RECORDS sections, in order. Hidden and impossible ones show in their own sections at the
  // bottom whatever their group; the group is also the category in achievements.csv.
  const ACHIEVEMENT_GROUPS = [
    ['SESSIONS', ['first-contact', 'regular', 'veteran', 'lifer', 'marathon', 'rage-quit']],
    ['BITS DECRYPTED', ['handshake', 'kilobit', 'kilobyte', 'megabit', 'megabyte', '106473', 'full-range', 'lucky-sevens', 'jackpot', 'gigabit']],
    ['NIBBLES', ['just-a-crumb', 'a-full-byte', '64-bit-architecture', 'snack-attack', 'nibbling', 'kilonibble', 'kibinibble', 'kibibyte', 'dial-up-speeds', '16-bit-era', '64k-memory-limit', 'meganibble', 'mebinibble', 'mebibyte', '32-bit-overflow']],
    ['CHAINS AND SKILL', ['chain-reaction', 'cascade', 'overclocked', 'supernova', 'heap-spray', 'surgical', 'zero-day', 'clean-sweep', 'close-call', 'second-wind', 'full-stack', 'full-house']],
    ['SCORE', ['root-access', 'superuser', 'kernel-mode', 'hypervisor', 'no-tools', 'snake-eyes', '1337', 'not-found', 'deep-thought', 'palindrome', 'gigabyte', 'terabyte']],
    ['HARD MODE AND BYTES', ['hardened', 'ghost', 'hard-target', 'first-byte', 'double-byte', 'triple-byte', 'byte-stream', 'byte-array']],
    ['ENCRYPTION LAYERS', ['layer-peeler', 'onion-router', 'onion-core', 'demolition', 'firewall-breach']],
    ['EXPLOITS', ['script-kiddie', 'black-hat', 'advanced-persistent-threat', 'full-toolkit', 'chained-exploits', 'arsenal', 'time-bomb', 'sting', 'wiretap', 'lateral-movement', 'overkill', 'double-trouble']],
    ['BLITZ AND ZEN', ['speed-run', 'blitzkrieg', 'lightspeed', 'zen-master', 'last-second']],
    ['DAILY', ['daily-driver', 'daily-grind', 'streak', 'century', 'daily-sweep', 'perfect-daily', 'breached', 'one-shot', 'sunday-best', 'stubborn', 'so-close']],
    ['PUZZLES', ['first-try', 'locksmith', 'safecracker', 'master-key', 'pickpocket']],
    ['LEVELS AND DECRYPTOR RANKS', ['lv-40', 'maxed-out', 'rollover', 'triple-crown', 'full-spectrum']],
    ['THEMES, FONTS AND MUSIC', ['collector', 'chameleon', 'tech-support', 'insert-coin', 'bit-by-bit', 'bite-sized', 'in-orbit', 'dj', 'audiophile', 'theme-park', 'channel-surfer', 'silent-running']],
    ['DATES AND TIMES', ['insomniac', 'birthday', 'friday-13th', 'pi-day']],
    ['VS CPU', ['first-blood', 'sparring-partner', 'gladiator', 'warlord', 'easy-target', 'fair-fight', 'hard-reset', 'insanity-check', 'counterstrike', 'ddos', 'flawless', 'tilted', 'afk']],
    ['VS BOTS', ['debugged', 'outhustled', 'bunker-buster', 'patched', 'rogues-gallery', 'kill-9']],
    ['VS MODES AND SETTINGS', ['stack-overflow', 'war-of-attrition', 'frag-limit', 'rope-a-dope', 'multi-boot', 'long-haul', 'heavyweight', 'bankrupt', 'knockout', 'bare-metal', 'arms-race', 'zero-mercy']],
    ['BOTS', ['poke', 'boo', 'the-eyebrow', 'third-wheel', 'matchmaker', 'jump-scare', 'now-you-see-me', 'full-crew', 'personal-space', 'hr-wants-a-word', 'rabid', 'costume-party', 'sweet-tooth', 'monster-mash', 'uprooted', 'gobble-gobble', 'snow-day', 'belly-slide', 'red-nose', 'eight-nights', 'gimel', 'seven-candles', 'midnight', 'developer-options']],
    ['THANK YOU', ['indie-supporter']],
    ['SECRETS', ['konami']],
  ];
  const groupOf = {};
  ACHIEVEMENT_GROUPS.forEach(([group, ids]) => ids.forEach((id) => { groupOf[id] = group; }));
  const byId = Object.fromEntries(ACHIEVEMENTS.map((a) => [a.id, a]));
  const ORDERED = [
    ...ACHIEVEMENT_GROUPS.flatMap(([, ids]) => ids.map((id) => byId[id])).filter(Boolean),
    ...ACHIEVEMENTS.filter((a) => !groupOf[a.id]), // any not listed above land at the end
  ];

  const goalOf = (item) => (typeof item.goal === 'function' ? item.goal() : item.goal);

  function isUnlocked(id) {
    const u = unlockById[id];
    return Unlocks.hasFullAccess() || (!!u && levelInfo().level >= u.level);
  }

  // The current run, reset by startRun()
  let run = { difficulty: 'normal', mode: 'classic', drops: 0, started: false, bits: 0, chain: 0, bytes: 0 };

  // One Daily Decrypt per UTC day counts toward the streak
  // (the player's local day: the streak turns over at their midnight)
  function playedDaily() {
    const today = localDay();
    if (d.lastDaily === today) return;
    earn(KEY_PAY.daily); // (the day's first daily game)
    gain('master', 1);
    d.dailyStreak = d.lastDaily === localDay(-1) ? d.dailyStreak + 1 : 1;
    d.bestDailyStreak = Math.max(d.bestDailyStreak, d.dailyStreak);
    d.lastDaily = today;
    d.dailies++;
  }

  // KEYS: earned by playing, spent on boosters (script.js's STORE). One for every KEY_BITS bits
  // decrypted, a bonus for long chains, and some for firsts: a puzzle solved for the first time (by
  // its set), each achievement, each level, the day's first daily game, the DAILY DROP
  const KEY_BITS = 10;
  const KEY_PAY = { chain5: 2, chain7: 5, achievement: 10, level: 10, daily: 5, puzzle: { e: 2, n: 4, h: 6 } };
  function earn(n) {
    if (!(n > 0)) return;
    d.keys += n;
    d.keysEarned += n;
    if (run) run.keys = (run.keys || 0) + n;
  }

  // RESOURCES (ECONOMY.md has the whole table): earned by how bits are decrypted, spent with KEYS on
  // STARTER EXPLOITS and BLACK BOXES (the STORE, and the BLACK MARKET in a game).
  //   BUGS: bits decrypted down a column; CACHE: across a row; CRYPTO: chain links from the 3rd on;
  //   ROOTKITS: a bit decrypted across and down at once, layers broken, BYTES;
  //   MASTER KEYS: every 5th level, the day's first daily game, the day's first VS win. One pays
  //   for any exploit in place of its price.
  // A resource comes whole once enough of its events add up (RES_PER); CLASSIC and DAILY earn
  // all of them, BLITZ and ZEN at half the rate, VS only CRYPTO and ROOTKITS (not from layers),
  // PUZZLE and the tutorial nothing
  const RES_IDS = ['bugs', 'cache', 'crypto', 'rootkits', 'master'];
  const RES_PER = { bugs: { col: 5 }, cache: { row: 5 }, crypto: { link: 1 }, rootkits: { cross: 2, layer: 20, byte: 1 } };
  function resRate(kind) {
    if (!run || run.noPay || ['puzzle', 'tutorial'].includes(run.mode)) return 0;
    if (run.daily) return 1;
    if (run.mode === 'vs') return kind === 'link' || kind === 'cross' || kind === 'byte' ? 1 : 0;
    return run.mode === 'blitz' || run.mode === 'zen' ? 0.5 : 1;
  }
  // (each resource holds at most RES_CAP; what's earned past it is lost. KEYS have no cap)
  const RES_CAP = 999;
  function gain(res, n) {
    if (!(n > 0)) return;
    n = Math.min(n, RES_CAP - (d.res[res] || 0));
    if (!(n > 0)) return;
    d.res[res] = (d.res[res] || 0) + n;
    d.resEarned[res] = (d.resEarned[res] || 0) + n;
    if (run) run.res = { ...(run.res || {}), [res]: ((run.res || {})[res] || 0) + n };
  }
  // n events of a kind ('col', 'row', 'link', 'cross', 'layer', 'byte')
  function events(kind, n) {
    const rate = resRate(kind);
    if (!(n > 0) || !rate) return;
    for (const res of RES_IDS) {
      const per = RES_PER[res] && RES_PER[res][kind];
      if (!per) continue;
      const part = (d.resPart[res] || 0) + (n * rate) / per;
      gain(res, Math.floor(part + 1e-9));
      d.resPart[res] = part - Math.floor(part + 1e-9);
    }
  }
  // Prices: KEYS plus resources, by tier (EXPLOIT_ORDER in fives). BLACK BOX itself isn't sold:
  // the BLACK BOXES (I, II, III) are, a random pull each
  const PRICES = {
    rng: { keys: 10, bugs: 6, cache: 6 },
    bitflip: { keys: 10, cache: 8, crypto: 4 },
    'buffer-overflow': { keys: 10, bugs: 8, crypto: 4 },
    trojan: { keys: 10, bugs: 7, crypto: 5 },
    pivot: { keys: 10, cache: 7, bugs: 5 },
    swap: { keys: 20, cache: 10, crypto: 6, rootkits: 1 },
    'worm-virus': { keys: 20, bugs: 12, crypto: 5, rootkits: 1 },
    keylogger: { keys: 20, cache: 9, crypto: 8, rootkits: 1 },
    'packet-sniffer': { keys: 20, bugs: 8, cache: 8, rootkits: 1 },
    backdoor: { keys: 20, bugs: 10, crypto: 6, rootkits: 1 },
    'logic-bomb': { keys: 30, bugs: 14, crypto: 8, rootkits: 2 },
    honeypot: { keys: 30, cache: 12, crypto: 10, rootkits: 2 },
    'dictionary-attack': { keys: 30, cache: 12, bugs: 6, rootkits: 3 },
    'rainbow-table': { keys: 30, crypto: 12, cache: 8, rootkits: 2 },
    'box-1': { keys: 5, crypto: 3 },
    'box-2': { keys: 12, crypto: 5, rootkits: 1 },
    'box-3': { keys: 20, crypto: 8, rootkits: 2 },
  };
  const BOX_IDS = ['box-1', 'box-2', 'box-3'];
  const ANTI_IDS = ['adware', 'spyware', 'ransomware', 'malware', 'cryptojacker', 'scareware']; // (the INFECTIONS)
  // Each BLACK BOX's odds, in percent: a tier 1, 2 or 3 exploit, or an INFECTION (any of the six alike)
  const BOX_ODDS = { 'box-1': [65, 20, 3, 12], 'box-2': [35, 45, 12, 8], 'box-3': [10, 45, 42, 3] };
  const tierOf = (id) => Math.min(2, Math.floor(EXPLOIT_ORDER.indexOf(id) / 5)); // 0, 1, 2
  const sellable = (id) => !!PRICES[id];
  const have = (res) => (res === 'keys' ? d.keys : d.res[res] || 0);
  // What's short of a price: [[resource, how many more]]
  const missing = (id) => Object.entries(PRICES[id] || {}).filter(([res, n]) => have(res) < n).map(([res, n]) => [res, n - have(res)]);
  function payFor(id, master = false) {
    if (!PRICES[id]) return false;
    if (master) {
      if (BOX_IDS.includes(id) || !d.res.master) return false; // (a MASTER KEY buys an exploit, not a box)
      d.res.master--;
    } else {
      if (missing(id).length) return false;
      for (const [res, n] of Object.entries(PRICES[id])) {
        if (res === 'keys') d.keys -= n;
        else d.res[res] -= n;
      }
    }
    save();
    return true;
  }
  // A BLACK BOX opened: an exploit of the tier its odds land on (any of the tier, unlocked or not;
  // not BLACK BOX itself), or an INFECTION
  function rollBox(box, rnd = Math.random) {
    const odds = BOX_ODDS[box];
    let roll = rnd() * 100;
    let tier = 0;
    while (tier < 3 && roll >= odds[tier]) roll -= odds[tier++];
    if (tier === 3) return ANTI_IDS[Math.floor(rnd() * ANTI_IDS.length)];
    const pool = EXPLOIT_ORDER.filter((id) => id !== 'black-box' && tierOf(id) === tier);
    return pool[Math.floor(rnd() * pool.length)];
  }

  // Marks newly met unlocks and achievements; returns them as [{ type, name }] (quiet: just record).
  function check(quiet = false) {
    const earned = [];
    // (announced once per rank: they all lock again at RANK UP)
    for (const u of UNLOCKS) {
      if (!d.unlocksSeen[u.id] && isUnlocked(u.id)) {
        d.unlocksSeen[u.id] = true;
        if (!Unlocks.hasFullAccess()) earned.push({ type: 'UNLOCKED', name: u.name });
      }
    }
    const { level } = levelInfo();
    if (level > d.lastLevel) {
      earned.push({ type: 'LEVEL UP', name: `LV ${level}`, keys: (level - d.lastLevel) * KEY_PAY.level });
      if (!quiet) {
        earn((level - d.lastLevel) * KEY_PAY.level);
        const fives = Math.floor(level / 5) - Math.floor(d.lastLevel / 5); // (a MASTER KEY every 5th level)
        if (fives > 0) {
          gain('master', fives);
          earned.push({ type: 'MASTER KEY', name: `LV ${Math.floor(level / 5) * 5}` });
        }
      }
    }
    d.lastLevel = Math.max(d.lastLevel, level);
    let opened = false;
    for (const id of EXPLOIT_ORDER) {
      if (!d.exploitsSeen[id] && exploitInfo(id).unlocked) {
        d.exploitsSeen[id] = true;
        earned.push({ type: 'UNLOCKED', name: exploitNames[id] || id });
        opened = true;
      }
    }
    const { slots } = slotInfo();
    if (slots > d.slotsSeen) {
      earned.push({ type: 'UNLOCKED', name: `EXPLOIT SLOT ${slots}` });
      d.slotsSeen = slots;
      opened = true;
    }
    if (opened) fillLoadout();
    else tidyLoadout();
    d.bestEquipped = Math.max(d.bestEquipped, d.equipped.length);
    for (const a of ACHIEVEMENTS) {
      if (!d.achieved[a.id] && a.value() >= goalOf(a)) {
        d.achieved[a.id] = true;
        earn(KEY_PAY.achievement);
        earned.push({ type: 'ACHIEVEMENT', name: a.name, keys: KEY_PAY.achievement });
      }
    }
    save();
    return quiet ? [] : earned;
  }
  // The slots a rank starts with aren't announced
  const markKept = () => {
    d.slotsSeen = Math.max(d.slotsSeen, Math.min(d.decryptor, MAX_SLOTS));
  };
  markKept();
  if (!d.equipped.length) fillLoadout(); // first load, or a new Full Access / dev unlock
  check(true); // seed from existing best scores without announcing anything

  return {
    isUnlocked,
    unlock(id) {
      const u = UNLOCKS.find((x) => x.id === id);
      return u && { ...u, goal: goalOf(u) };
    },
    setExploitCount(n) { exploitCount = n; },
    setExploitNames(names) { exploitNames = names; },
    exploitInfo,
    exploitOrder: () => [...EXPLOIT_ORDER],
    slotInfo,
    sideSlots, // (how many side slots are open: 0, 1 (the left) or 2)
    sideSlotLevel: (i) => SIDE_SLOT_LEVELS[i],
    equipped: () => (tidyLoadout(), [...d.equipped]),
    isEquipped: (id) => (tidyLoadout(), d.equipped.includes(id)),
    // Returns false when it can't (locked, or every slot is taken)
    equip(id) {
      tidyLoadout();
      if (d.equipped.includes(id) || !exploitInfo(id).unlocked || d.equipped.length >= slotInfo().slots) return false;
      d.equipped.push(id);
      save();
      return true;
    },
    unequip(id) {
      d.equipped = d.equipped.filter((x) => x !== id);
      save();
    },
    levelInfo,
    dailyStreak: currentStreak, // (as it stands today, back to 0 after a missed day)
    // Lv 80 only: back to Lv 0 with everything locked again but one more kept exploit slot
    rankUp() {
      if (!levelInfo().maxed) return false;
      d.decryptor++;
      d.xp = 0;
      d.decryptorPoints = 0;
      d.lastLevel = 0;
      d.exploitsSeen = {};
      d.unlocksSeen = {};
      d.slotsSeen = 0;
      d.equipped = [];
      markKept();
      fillLoadout();
      save();
      return true;
    },
    setPuzzleCount(n) { puzzleCount = n; },
    setTracks(list) { madeTracks = list.map((t) => ({ no: t.no, free: t.free })); },
    setThemeCount(n) { themeCount = n; },
    puzzleSolved: (i) => !!d.puzzles[i],
    runPays: () => !run.noPay,
    solvePuzzle(i) {
      if (!d.puzzles[i] && d.puzzleTries[i] === 1) d.firstTries++;
      if (!d.puzzles[i]) earn(KEY_PAY.puzzle[typeof i === 'number' ? 'n' : String(i)[0]] || 0); // (a first solve: EASY 2, NORMAL 4, HARD 6)
      d.puzzles[i] = true;
      d.puzzlePaid = { ...(d.puzzlePaid || {}), [i]: localDay() }; // (today's pay for it is had)
      d.puzzleStreak++;
      d.bestPuzzleStreak = Math.max(d.bestPuzzleStreak, d.puzzleStreak);
    },
    puzzleFailed() { d.puzzleStreak = 0; },
    // Lists for the RECORDS panel
    unlocks: () => UNLOCKS.map((u) => ({ ...u, goal: goalOf(u), current: u.value(), done: isUnlocked(u.id) })),
    // In RECORDS order, each with its section (group)
    achievements: () => ORDERED.map((a) => ({ ...a, group: groupOf[a.id] || 'OTHER', goal: goalOf(a), current: a.value(), done: !!d.achieved[a.id] })),
    stats: () => ({ ...d, bestNormal: best('normal'), bestEasy: best('easy'), bestHard: best('hard') }),

    // Run events from script.js
    // mode: the game played ('decrypt', 'breach' and the others); daily: a daily game
    startRun(difficulty, mode = 'classic', puzzle = null, daily = false) {
      // (a solved puzzle played again pays XP and KEYS once a day: the first solve, and a replay's
      // solve, mark the day; another replay that day pays nothing)
      const noPay = !!puzzle && !!d.puzzles[puzzle] && (d.puzzlePaid || {})[puzzle] === localDay();
      run = {
        noPay, difficulty, mode, puzzle, daily, drops: 0, started: false, bits: 0, chain: 0, bytes: 0,
        exploits: 0, closeCalls: 0, clearStreak: 0, dropBits: 0, dropSevens: 0, dropBroken: 0, pivoted: false, fullCols: new Set(),
      };
    },
    drop() {
      if (run.mode === 'tutorial') return; // (the tutorial counts toward nothing)
      if (!run.started) {
        run.started = true;
        if (run.mode !== 'puzzle' && run.mode !== 'vs' && run.mode !== 'tutorial') d.games++; // puzzle retries, VS matches and the tutorial aren't sessions
        if (run.daily) {
          playedDaily();
          const today = localDay();
          if (d.dailyDay.date !== today) d.dailyDay = { date: today, kinds: {} };
          if (!d.dailyDay.kinds[run.mode]) {
            d.dailyDay.kinds[run.mode] = true;
            if (count(d.dailyDay.kinds) === 4) d.dailySweeps++;
          }
        }
        if (run.mode === 'puzzle' && run.puzzle !== null) d.puzzleTries[run.puzzle] = (d.puzzleTries[run.puzzle] || 0) + 1;
      }
      run.drops++;
      d.drops++;
      if (run.difficulty === 'hard') d.bestHardDrops = Math.max(d.bestHardDrops, run.drops);
      if (run.mode === 'zen') d.bestZenDrops = Math.max(d.bestZenDrops, run.drops);
      if (run.mode === 'classic') d.bestClassicDrops = Math.max(d.bestClassicDrops, run.drops);
      const now = new Date();
      if (now.getHours() >= 2 && now.getHours() < 4) d.lateNight = 1;
      if (now.getMonth() === 8 && now.getDate() === 23) d.birthday = 1;
      if (now.getDay() === 5 && now.getDate() === 13) d.secrets['friday-13th'] = true;
      if (now.getMonth() === 2 && now.getDate() === 14) d.secrets['pi-day'] = true;
      if (typeof Music !== 'undefined' && Music.isEnabled()) d.tracksHeard[Music.currentTrack()] = true;
    },
    // After a drop and everything it set off. heights: each column's height; over: the board overflowed.
    endDrop({ hack, heights, rows, over, lastSecond }) {
      if (run.mode === 'tutorial') return; // (the tutorial counts toward nothing)
      if (run.dropSevens >= 7) d.secrets.jackpot = true;
      if (lastSecond && run.dropBits > 0) d.secrets['last-second'] = true;
      if (!over && heights.every((h) => h >= rows - 1)) d.secrets['full-house'] = true;
      if (run.dropBits > 0) run.clearStreak++;
      else if (!hack) run.clearStreak = 0;
      d.bestClearStreak = Math.max(d.bestClearStreak, run.clearStreak);
      if (run.drops === 1 && run.dropBits > 0 && run.mode !== 'puzzle' && run.mode !== 'vs') d.firstDropClears++;
      d.bestDropBits = Math.max(d.bestDropBits, run.dropBits);
      d.bestDropBroken = Math.max(d.bestDropBroken, run.dropBroken);
      if (run.pivoted && run.dropBits > 0) d.pivotChains++;
      if (!over) {
        heights.forEach((h, c) => {
          if (h >= rows) run.fullCols.add(c);
          else if (run.fullCols.has(c) && h <= Math.floor(rows / 2)) {
            run.fullCols.delete(c);
            d.fullStacks++;
          }
        });
      }
      run.dropBits = 0;
      run.dropSevens = 0;
      run.dropBroken = 0;
      run.pivoted = false;
    },
    // A session ended (not PUZZLE): reason 'trace', 'time' or 'daily'
    endRun({ score, reason, boardEmpty, track, theme, font, silent }) {
      if (run.mode === 'tutorial') return; // (the tutorial counts toward nothing)
      if (run.mode === 'vs') return; // (a VS match isn't a session: vsResult() has its own)
      if (score === 404) d.secrets['not-found'] = true;
      if (run.bits === 42) d.secrets['deep-thought'] = true;
      if (score >= 1000 && String(score) === [...String(score)].reverse().join('')) d.secrets.palindrome = true;
      if (silent && run.drops >= 10) d.secrets['silent-running'] = true;
      if (run.mode === 'decrypt' && reason === 'daily' && boardEmpty) d.perfectDailies++;
      if (run.drops >= 10) {
        if (track) d.tracksPlayed[track] = true;
        d.themesPlayed[theme] = true;
        if (font) d.fontsPlayed[font] = true;
      }
      if (reason === 'trace' && score === 0 && run.drops > 0) d.snakeEyes = 1;
      if (score === 1337) d.leet = 1;
    },
    heardTrack(id) {
      d.tracksHeard[id] = true;
      if (++sittingTracks >= 10) d.secrets['channel-surfer'] = true;
    },
    themeChanged() {
      if (++sittingThemes >= 10) d.secrets['theme-park'] = true;
    },
    // Hidden achievements script.js spots itself (KONAMI, OVERKILL and the like)
    secret(id) { d.secrets[id] = true; },
    breached() { if (run.mode === 'tutorial') return; d.breaches++; },
    // A VS match ended. m: { level, bot, mode, layers, exploits, won, target, pool, cpuPoints,
    // overflow (the CPU overflowed), landed (blocks that landed on your board), sent }
    vsResult(m) {
      const tally = m.won ? d.vsWins : d.vsLosses;
      tally[m.level] = (tally[m.level] || 0) + 1;
      d.vsMatches++;
      d.vsBestSent = Math.max(d.vsBestSent, m.sent);
      d.vsLossStreak = m.won ? 0 : d.vsLossStreak + 1;
      if (d.vsLossStreak >= 5) d.secrets.tilted = true;
      if (!m.won) return;
      if (d.vsMasterDay !== localDay()) { // (the day's first win: a MASTER KEY)
        d.vsMasterDay = localDay();
        gain('master', 1);
      }
      d.vsBotWins[m.bot] = (d.vsBotWins[m.bot] || 0) + 1;
      d.vsBotLevelWins[`${m.bot}:${m.level}`] = true;
      d.vsModeWins[m.mode] = (d.vsModeWins[m.mode] || 0) + 1;
      const feat = (id, yes) => { if (yes) d.vsFeats[id] = true; };
      feat('long-haul', (m.mode === 'attrition' || m.mode === 'deathmatch') && m.target >= 10000);
      feat('heavyweight', m.mode === 'tug' && m.pool >= 5000);
      feat('bankrupt', m.mode === 'attrition' && m.cpuPoints === 0);
      feat('knockout', m.mode !== 'classic' && m.overflow);
      feat('bare-metal', !m.layers);
      feat('arms-race', m.exploits);
      feat('zero-mercy', m.level === 'insane' && m.layers && m.exploits);
      feat('flawless', m.landed === 0);
    },
    // Something happened with the bots (a poke, a bolt, an eyebrow-<bot> ...); saved at once, since
    // the start screen's are outside any run
    botEvent(id) {
      d.bots[id] = (d.bots[id] || 0) + 1;
      save();
    },
    // One attack cancelled `n` blocks headed your way
    vsCancelled(n) { d.vsBestCancel = Math.max(d.vsBestCancel, n); },
    dailyPuzzleSolved(weekday, tries) {
      if (weekday === 6) d.sundaySolves++;
      if (tries === 1) d.dailyFirstTries++;
    },
    // A live session thrown away with RESTART or a difficulty switch
    restarted() {
      if (run.mode === 'tutorial') return; // (the tutorial counts toward nothing)
      if (run.mode === 'vs') return;
      sittingRestarts++;
      if (sittingRestarts >= 10) d.rageQuit = 1;
    },
    runDrops: () => run.drops,
    runStats: () => ({ ...run }),
    // values: the numbers of the bits decrypted
    decrypted(values, chain) {
      if (run.mode === 'tutorial') return; // (the tutorial counts toward nothing)
      d.bits += values.length;
      run.bits += values.length;
      run.dropBits += values.length;
      run.dropSevens += values.filter((v) => v === 7).length;
      run.chain = Math.max(run.chain, chain);
      if (!run.noPay) { // (XP and KEYS: not on a replay already paid for today)
        d.xp += values.length;
        d.keyBits += values.length;
        earn(Math.floor(d.keyBits / KEY_BITS));
        d.keyBits %= KEY_BITS;
        if (chain === 5) earn(KEY_PAY.chain5); // (a chain reaching 5 links, and 7)
        if (chain === 7) earn(KEY_PAY.chain7);
      }
      for (const v of values) d.bitsByValue[v] = (d.bitsByValue[v] || 0) + 1;
      d.bestChain = Math.max(d.bestChain, chain);
    },
    bytes(count) {
      if (run.mode === 'tutorial') return; // (the tutorial counts toward nothing)
      d.bytes += count;
      run.bytes += count;
      events('byte', count);
      d.bestDropBytes = Math.max(d.bestDropBytes, count);
    },
    nibbles(count) {
      if (run.mode === 'tutorial') return; // (the tutorial counts toward nothing)
      d.nibbles += count;
      d.bestDropNibbles = Math.max(d.bestDropNibbles, count);
    },
    peeled(broken) {
      if (run.mode === 'tutorial') return; // (the tutorial counts toward nothing)
      d.peeled++;
      if (broken) {
        d.broken++;
        run.dropBroken++;
        events('layer', 1);
      }
    },
    // BLACK BOX opened (as whatever it turns into, it counts as that one when it runs): marked as
    // used too, for FULL TOOLKIT
    openedBlackBox() {
      if (run.mode === 'tutorial') return;
      d.exploitUses['black-box'] = (d.exploitUses['black-box'] || 0) + 1;
      save();
    },
    exploit(id) {
      if (run.mode === 'tutorial') return; // (the tutorial counts toward nothing)
      d.exploits++;
      d.exploitUses[id] = (d.exploitUses[id] || 0) + 1;
      run.exploits++;
      if (run.mode !== 'vs') d.bestRunExploits = Math.max(d.bestRunExploits, run.exploits);
      if (id === 'pivot') run.pivoted = true;
    },
    score(points) {
      if (run.mode === 'tutorial') return; // (the tutorial counts toward nothing)
      if (run.mode === 'vs') return; // (the SCORE achievements are for sessions)
      d.bestScore = Math.max(d.bestScore, points);
      if (run.mode === 'blitz' && !run.daily) d.bestBlitz = Math.max(d.bestBlitz, points);
      if (run.exploits === 0 && run.mode !== 'puzzle') d.bestNoToolsScore = Math.max(d.bestNoToolsScore, points);
    },
    bombHits(n) { if (run.mode === 'tutorial') return; d.bestBombHits = Math.max(d.bestBombHits, n); },
    sting() { if (run.mode === 'tutorial') return; d.stings++; },
    wiretap() { if (run.mode === 'tutorial') return; d.wiretaps++; },
    addPoints(n) {
      if (run.mode === 'tutorial') return; // (the tutorial counts toward nothing)
      if (n <= 0) return;
      d.points += n;
      d.decryptorPoints += n;
    },
    sweep() { if (run.mode === 'tutorial') return; d.sweeps++; },
    closeCall() {
      if (run.mode === 'tutorial') return; // (the tutorial counts toward nothing)
      d.closeCalls++;
      run.closeCalls++;
      if (run.mode !== 'vs') d.bestRunCloseCalls = Math.max(d.bestRunCloseCalls, run.closeCalls);
    },
    check,
    // KEYS and boosters (the STORE)
    keys: () => d.keys,
    runKeys: () => (run && run.keys) || 0,
    claimKeys(n) { earn(n); save(); },
    spendKeys(n) {
      if (d.keys < n) return false;
      d.keys -= n;
      save();
      return true;
    },
    boosters: (id) => d.boosters[id] || 0,
    addBooster(id, n = 1) { d.boosters[id] = (d.boosters[id] || 0) + n; save(); },
    useBooster(id) {
      if (!d.boosters[id]) return false;
      d.boosters[id]--;
      save();
      return true;
    },
    // STARTER EXPLOITS (and BLACK BOXES): bought with KEYS and resources (PRICES), taken into a
    // game (2, one in each side slot: startersTaken, two of one kind or one each of two), each used
    // once there, then gone
    // RESOURCES and prices (above)
    resIds: () => [...RES_IDS],
    res: (id) => have(id),
    runRes: () => ({ ...((run && run.res) || {}) }),
    // A drop's decrypts by how they matched: down a column, across a row, both at once; and its
    // chain links from the 3rd on
    decryptKinds({ col = 0, row = 0, cross = 0, links = 0 }) {
      events('col', col);
      events('row', row);
      events('cross', cross);
      events('link', links);
    },
    price: (id) => ({ ...(PRICES[id] || {}) }),
    sellable,
    missing,
    payFor,
    tierOf,
    boxIds: () => [...BOX_IDS],
    isBox: (id) => BOX_IDS.includes(id),
    antiIds: () => [...ANTI_IDS],
    isAnti: (id) => ANTI_IDS.includes(id),
    boxOdds: (box) => [...BOX_ODDS[box]],
    rollBox,
    // (testing and the dev page)
    addRes(id, n) { gain(id, n); save(); },
    // The CRYPTOJACKER: what a drop earned, taken back ({ resource: n })
    siphon(taken) {
      for (const [res, n] of Object.entries(taken)) {
        const k = Math.min(n, d.res[res] || 0);
        d.res[res] = (d.res[res] || 0) - k;
        d.resEarned[res] = Math.max(0, (d.resEarned[res] || 0) - k);
        if (run && run.res) run.res[res] = Math.max(0, (run.res[res] || 0) - k);
      }
      save();
    },
    starters: (id) => d.starters[id] || 0,
    addStarter(id, n = 1) { d.starters[id] = (d.starters[id] || 0) + n; save(); },
    useStarter(id) {
      if (!d.starters[id]) return false;
      d.starters[id]--;
      save();
      return true;
    },
    // (the picks still owned, [LEFT, RIGHT], null for an empty slot: an exploit taken twice needs two of it)
    startersTaken: () => {
      const left = {};
      return [0, 1].map((i) => {
        const id = (d.startersTaken || [])[i];
        if (!id || !(BOX_IDS.includes(id) || (EXPLOIT_ORDER.includes(id) && exploitInfo(id).unlocked))) return null;
        if (left[id] == null) left[id] = d.starters[id] || 0;
        return left[id]-- > 0 ? id : null;
      });
    },
    setStartersTaken(ids) { d.startersTaken = [ids[0] || null, ids[1] || null]; save(); },
  };
})();
