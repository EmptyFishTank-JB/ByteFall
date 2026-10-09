// TUTORIAL (RULES → TUTORIAL): a guided match on set boards with set bits. A banner over the board
// explains each rule and asks the player to tap what it names (a column's drop button, a HUD
// box); what it's talking about pulses. After each drop it says what happened and how the points
// added up (from script.js's chainLog). Runs as mode 'tutorial' (script.js's MODES): no rising
// layers, a fixed queue, and drops only where the lesson says. Loaded before script.js; it only
// reaches script.js's state (columns, queue, render ...) once a tutorial is running.
const Tutorial = (() => {
  // Boards: columns bottom to top, as in puzzles.js ('L2:1' is a layer at level 2 hiding a [1])
  const EMPTY = [[], [], [], [], [], [], []];
  // A step: text; board / bits to set up (kept from the last step when left out); then what
  // moves it on: next (a NEXT button), tap (a selector to tap), or drop (the column index to drop
  // into, or a list of columns it may go in; after it resolves, explain() adds to the banner and
  // NEXT appears). pulse: selectors to
  // pulse; cells: [row, col] board cells to pulse; line: pulse the ======== line; place: 'bottom'
  // puts the banner under the board's middle instead of at its top.
  // pass: the tapped control also does its own job (opens the menu, arms the exploit); pane: the
  // menu open on that tab; closeMenus: the menus shut; held: exploits waiting in the button;
  // float: the banner at the bottom of the screen, over any open menu ('middle': in the middle of
  // the screen). holdMeter: the chain meter keeps its charge into and through the step (steps 6
  // to 13: the chain lesson, then the carry-over filling it at step 9 and the exploit it earns). mood / explainMood: BOT's
  // face while it says the step / the explanation after the drop (idle when left out). intro:
  // the welcome ahead of the steps (not counted, no number; BEGIN starts step 1). demo: what the
  // game shows only for the lesson ('slots': the bottom row's slots, locked; 'market': one of them a
  // BLACK MARKET; 'goal': CLASSIC's ENCRYPTION STRENGTH line and bar).
  const STEPS = [
    {
      text: 'Welcome to BYTEFALL! This tutorial shows you how the game is played and where everything is. Each card is short, and there’s no math needed as long as you can count to 7. Let’s begin!',
      board: EMPTY, bits: [], intro: true, place: 'bottom', mood: 'happy',
    },
    // THE BASICS
    { text: 'This grid is called the TERMINAL. You’ll be dropping encrypted bits into its columns.', board: EMPTY, bits: [], next: true, place: 'bottom' },
    { text: 'Encrypted bits are the numbered blocks with brackets: [1] [2] [3] [4] [5] [6] [7]', next: true, place: 'bottom' },
    {
      text: 'This flashing panel with the bright border shows your CURRENT bit, [3]: the one your next drop puts into a column. Tap the CURRENT panel!',
      board: [[], [], [], [], [3], [5], []], bits: [3, 2], tap: '.stat-current',
    },
    { text: 'A bit clears when its number matches the exact number of bits in the row or column it sits in. Clearing bits is called DECRYPTING.', next: true },
    {
      text: 'Drop a bit by tapping a number button below, or the column itself. Drop the [3] into column 4 or 7, next to the [3] and [5].',
      drop: [3, 6], cells: [[0, 4], [0, 5]],
      explain: () => 'BOOM! Both [3]s were DECRYPTED: the row was made 3 bits long. The [5] stays, since it isn’t in a row or column 5 bits long.',
    },
    {
      text: 'Now a column. Drop the [2] on top of the [5] in column 6.',
      drop: 5, cells: [[0, 5]],
      explain: () => 'Nice! The column was made 2 bits tall, so the [2] was DECRYPTED.',
    },
    // SCORING AND CHAINS
    { text: 'Each decrypted bit scores 10 points plus its number: a [1] is worth 11, a [2] 12, and a [7] 17.', next: true },
    { text: 'Your SCORE is at the left of the panels up top, under your BEST. Tap SCORE!', tap: '#score-stat' },
    {
      text: 'When a bit decrypts, any bits above it fall, and they can decrypt too. That’s a CHAIN, and each wave of bits that clears is a link.',
      board: [[], [], [6, 6], [7, 5, 2, 7], [3, 4], [2], [6, 5]], bits: [2], next: true, holdMeter: true,
    },
    {
      text: 'The first link scores normal points, the second link doubles (2x), the third triples (3x), and so on. Drop the [2] into column 6.',
      drop: 5, cells: [[0, 5], [1, 3], [1, 6]], explainMood: 'happy', holdMeter: true,
      explain: () => 'Nice one! That was a 3x CHAIN:\n1. The [2]s cleared in a column of 2, and the [5]s in a row of 5.\n2. The [3] cleared in a row of 3.\n3. The [2] cleared in a row of 2.',
    },
    { text: 'Decrypting 4 bits in one drop is a NIBBLE, worth 16 bonus points. You just made one!', next: true, mood: 'happy', holdMeter: true },
    { text: 'CHAIN, at the right of the panels up top, shows how long your last chain was. Tap CHAIN.', tap: '#chain-stat', holdMeter: true },
    { text: 'The bars on each side of the grid are the CHAIN METER. Each link lights a bar, and the meter stays charged from one drop to the next.', pulse: ['.chain-meter'], next: true, holdMeter: true },
    { text: 'Fill all 5 bars to earn an EXPLOIT. A drop that clears nothing ends the streak, and the meter resets.', pulse: ['.chain-meter'], next: true, holdMeter: true },
    // LAYERS AND THE LINE
    {
      text: 'This [=] is an ENCRYPTION LAYER. Decrypt a bit right next to it to peel it.',
      board: [[], [], [], ['L2:1'], [], [], []], bits: [2, 2], cells: [[0, 3]], next: true, holdMeter: true,
    },
    {
      text: 'Drop the [2] into column 3, 4 or 5: beside the layer or on top of it, the two of them make a line of 2.',
      drop: [2, 3, 4], cells: [[0, 3]], holdMeter: true,
      explain: () => 'The [2] decrypted and peeled the layer once: [=] is cracked now, [-]. That was one more link for the CHAIN METER: 4 bars lit.',
    },
    {
      text: 'Drop the next [2] into column 3, 4 or 5 to peel the layer a second time.',
      drop: [2, 3, 4], cells: [[0, 3]], holdMeter: true, explainMood: 'happy',
      explain: () => 'The second peel broke the layer open and revealed the bit under it: a [1], alone in a line of 1, so it decrypted too, as the chain’s second link.',
    },
    { text: 'Those 2 links filled the CHAIN METER (3 + 1 + 2 = 6), so you earned an EXPLOIT!', next: true, mood: 'happy', holdMeter: true },
    {
      text: 'Keep every column below this ======== line. If anything is still above it once the decrypting stops, the trace completes and the game is over.',
      board: EMPTY, bits: [], line: true, next: true, place: 'bottom', mood: 'worried', holdMeter: true,
    },
    { text: 'A new row of layers rises from the bottom every 8 drops, pushing everything up. ENCRYPT IN, just above CHAIN, counts down the drops to the next one. Tap it.', tap: '#pulse-stat', holdMeter: true },
    // EXPLOITS
    {
      text: 'EXPLOITS change the board in different ways, depending on where you drop them. While you have one waiting, the CHAIN METER pulses.',
      board: [[], [], [6, 2, 7, 3], [], [], [], []], bits: [], held: ['worm-virus'], next: true, mood: 'devious', holdMeter: true,
    },
    { text: 'Tap the EXPLOIT button to use yours. It’s a WORM VIRUS!', tap: '#exploit-btn', pass: true, mood: 'devious', holdMeter: true },
    {
      text: 'The WORM VIRUS is armed as your CURRENT, and it drops like a bit. Drop it into column 3, the tall one: it wipes out every block in that column.',
      drop: 2, cells: [[0, 2], [1, 2], [2, 2], [3, 2]], mood: 'devious', explainMood: 'happy', holdMeter: true,
      explain: () => 'The WORM VIRUS wiped out the whole column. Blocks wiped out by an exploit score a flat 10 each.',
    },
    { text: 'Other exploits wipe an area, peel layers or change bits. Each one has its card in EXPLOITS.', next: true },
    // THE BOTTOM ROW
    { text: 'The row under the drop buttons holds more than the EXPLOIT button: a SIDE SLOT on each side of it, and a PATCH SLOT at each end.', board: EMPTY, bits: [], demo: 'slots', pulse: ['.side-slot'], next: true },
    { text: 'They open as you level up. Until then, each one shows a padlock and the level it opens at.', demo: 'slots', pulse: ['.side-slot'], next: true },
    { text: 'A PATCH SLOT sells a patch during a game, for KEYS and resources, and the patch works the moment you buy it.', demo: 'slots', pulse: ['.patch-slot'], next: true },
    { text: 'The SIDE SLOTS hold STARTER EXPLOITS that you bring into a game. An empty one becomes the BLACK MARKET once the first layer rises.', demo: 'market', pulse: ['.side-slot:not(.patch-slot)'], next: true },
    { text: 'It sells an exploit or a BLACK BOX, swapped for another every 4 drops. The pips under it count the drops left, and the last one blinks.', demo: 'market', pulse: ['.side-slot.market'], next: true },
    { text: 'BLACK BOXES are cheap, but some of them are INFECTED!', demo: 'market', mood: 'devious', next: true },
    // THE MENUS
    { text: 'The button at the top right PAUSES the game. Tap it now!', closeMenus: true, tap: '#records-btn', pass: true },
    { text: 'The pause screen has RESUME, RESTART, RULES & RECORDS, SETTINGS, EXPLOITS, the STORE and the MAIN MENU. Tap RULES & RECORDS.', paused: true, closeMenus: true, tap: '#pause-records', pass: true, float: true },
    { text: 'RULES & RECORDS opens as a card over the game, with its tabs along the top.', paused: true, pane: 'rules', float: 'middle', next: true },
    { text: 'The RULES tab has everything you’re learning here, written down, with the TUTORIAL button to come back any time.', paused: true, pane: 'rules', pulse: ['.menu-tabs [data-pane="rules"]'], float: 'middle', next: true },
    { text: 'The RECORDS tab shows your level and DECRYPTOR rank, every unlock and its level, your achievements, HISTORY (your last 10 games) and your lifetime stats.', paused: true, pane: 'records', pulse: ['.menu-tabs [data-pane="records"]'], float: 'middle', next: true },
    { text: 'Every bit you decrypt is XP: 100 bits a level. At Lv 80 you can RANK UP: everything locks again to unlock once more, and each rank earns a little more.', paused: true, pane: 'records', float: 'middle', next: true },
    { text: 'NOTICES, the next tab, keeps every notice the game has shown you.', paused: true, pane: 'records', pulse: ['.menu-tabs [data-pane="notices"]'], float: 'middle', next: true },
    { text: 'Tapping outside a card won’t close it: tap ← BACK, at the top left of the card.', paused: true, pane: 'records', tap: '.card-back[data-close="records"]', pass: true, float: 'middle' },
    { text: 'Now tap EXPLOITS.', paused: true, closeMenus: true, tap: '#pause-exploits', pass: true, float: true },
    { text: 'EXPLOITS is your loadout. You can only earn exploits that are in a slot: SLOTS, at the top, counts the slots you’ve filled and the ones you have.', paused: true, pane: 'exploits', pulse: ['#slot-info'], float: true, next: true },
    { text: 'Tap a card to put it in a free slot, or tap it again to take it out. The loadout locks from a game’s first drop until it ends.', paused: true, pane: 'exploits', pulse: ['.hack-item'], float: true, next: true },
    { text: 'The first three exploits are yours as they unlock. The rest are bought once with resources and kept until you RANK UP.', paused: true, pane: 'exploits', float: true, next: true },
    { text: 'Tap ← BACK to close it.', paused: true, pane: 'exploits', tap: '.card-back[data-close="records"]', pass: true, float: 'middle' },
    { text: 'Now tap the STORE.', paused: true, closeMenus: true, tap: '#pause-store', pass: true, float: true },
    { text: 'YOUR RESOURCES are at the top: KEYS, BUGS, CACHE, CRYPTO, ROOTKITS and MASTER KEYS, all earned by playing. The [i] shows how.', paused: true, pane: 'store', pulse: ['#store-wallet'], float: true, next: true },
    { text: 'Under them, PRICES TODAY: sales, holidays and busy days move the prices up and down.', paused: true, pane: 'store', pulse: ['#price-gauge'], float: true, next: true },
    { text: 'Below that: the DAILY DROP (free once a day), PATCHES, STARTER EXPLOITS, BLACK BOXES, and REMOVE ADS and FULL ACCESS.', paused: true, pane: 'store', float: true, next: true },
    { text: 'Tap ← BACK to close the STORE.', paused: true, pane: 'store', tap: '.card-back[data-close="records"]', pass: true, float: 'middle' },
    { text: 'Now tap SETTINGS.', paused: true, closeMenus: true, tap: '#pause-settings', pass: true, float: true },
    { text: 'SETTINGS has SOUND (sound and music, the sound effects, what you’re listening on), the PLAYLIST and MUSIC PLAYER, and CONTROLS (where the drop buttons sit, vibration).', paused: true, settings: true, float: 'middle', next: true },
    { text: 'DISPLAY has THEMES and FONTS (more unlock as you level up), PIXEL STYLE, the CRT DISPLAY, text size and REDUCED EFFECTS. EXTRAS has the wandering bots and the screen saver.', paused: true, settings: true, float: 'middle', next: true },
    { text: 'Tap ← BACK to close SETTINGS.', paused: true, settings: true, tap: '.card-back[data-close="settings"]', pass: true, float: 'middle' },
    { text: 'And RESUME to get back to the game.', paused: true, closeMenus: true, tap: '#pause-resume', pass: true, float: true },
    // CLASSIC'S GOAL
    { text: 'In CLASSIC, every game has a key to crack: its ENCRYPTION STRENGTH, shown under BYTEFALL. It starts at 128-BIT, cracked at 1,500 points on NORMAL.', closeMenus: true, demo: 'goal', pulse: ['#game-mode-label'], next: true },
    { text: 'The bar along the bottom of SCORE fills toward it. Crack it for KEYS, then GO DEEPER for a stronger key and more KEYS, or DISCONNECT and end the game on a win.', demo: 'goal', pulse: ['#goal-bar'], next: true, mood: 'happy' },
    { text: 'Before a game, PATCHES and STARTERS on the main menu let you bring an edge in, once you have some.', next: true },
    { text: 'That’s everything you need to know. Good luck, decryptor.', closeMenus: true, done: true, mood: 'happy' },
  ];

  // The column(s) a step's drop may go in (drop: an index, or a list of them)
  const drops = (s) => (s.drop === undefined ? [] : [].concat(s.drop));
  let step = -1;
  let dropped = false; // this step's drop has happened (waiting on NEXT)
  let tapTarget = null;
  let bannerEl = null;
  // How the board, bits, score and chain stood as each step began, so BACK can put it back
  let snapshots = [];
  // BOT narrates: its face in the banner's corner, the words typing out fast with a blip of
  // "voice" every other letter (Animalese-style), a little pause at punctuation. A tap on the
  // banner finishes the line at once; the lesson itself never waits on the typing.
  let narrator = null;
  let typing = null; // { el, text, i, timer, done }
  const TYPE_MS = 18;
  // The banner laid out once with all its words, then pinned by its top where that puts it: as
  // the words type out it grows downward, never up (a banner kept at the bottom or the middle
  // of the screen included)
  function pinTop(text, words) {
    const el = bannerEl;
    el.style.top = el.style.bottom = el.style.transform = '';
    text.textContent = words;
    const fixed = el.classList.contains('float');
    // (offsetTop: where it's laid out, not where its fade-in animation has it this frame; the
    // middle one is centered by a transform, half its height up)
    const top = el.offsetTop - (el.classList.contains('middle') ? el.offsetHeight / 2 : 0);
    el.style.top = `${top}px`;
    el.style.bottom = 'auto';
    if (fixed) el.style.transform = 'translateX(-50%)';
    text.textContent = '';
  }
  function say(el, text, done) {
    stopTyping(true);
    // (the banner grows with the words as they're said: only the rest of the word being typed is
    // there unseen, so a word never jumps to the next line halfway through)
    el.innerHTML = '<span class="said"></span><span class="unsaid"></span>';
    const said = el.firstChild;
    const unsaid = el.lastChild;
    const restOfWord = (i) => { const m = /^\S*/.exec(text.slice(i)); return m ? m[0] : ''; };
    unsaid.textContent = restOfWord(0);
    const t = { el, text, i: 0, timer: 0, done };
    typing = t;
    if (narrator) narrator.classList.add('talking');
    const tick = () => {
      if (typing !== t) return;
      const ch = t.text[t.i++];
      said.textContent = t.text.slice(0, t.i);
      unsaid.textContent = restOfWord(t.i);
      if (/[A-Za-z0-9]/.test(ch) && t.i % 2) SFX.blip(430 + Math.random() * 170); // (a voice that wanders a little)
      if (t.i >= t.text.length) return stopTyping(false);
      t.timer = setTimeout(tick, /[.!?:]/.test(ch) ? 190 : /[,;]/.test(ch) ? 110 : TYPE_MS);
    };
    tick();
  }
  // Ends the typing: the rest of the line shows at once (finish) and its done() runs
  function stopTyping(finish = true) {
    const t = typing;
    if (!t) return;
    typing = null;
    clearTimeout(t.timer);
    if (finish) t.el.textContent = t.text;
    if (narrator) narrator.classList.remove('talking');
    if (t.done) t.done();
  }
  let moodTimer = 0;
  function botMood(mood, ms = 0) {
    if (!narrator) return;
    clearTimeout(moodTimer);
    narrator.dataset.mood = mood || 'idle';
    if (ms) moodTimer = setTimeout(() => { if (narrator) narrator.dataset.mood = (cur() && cur().mood) || 'idle'; }, ms);
  }
  let scoreAtDrop = 0;
  const copyCells = (cols) => cols.map((col) => col.map((cell) => ({ ...cell })));

  const cur = () => STEPS[step];
  // A tap the card didn't ask for: a denied sound, BOT's -_- for a moment and a nudge of the card
  function annoyed() {
    SFX.play('denied');
    botMood('annoyed', 1300); // -_-
    if (bannerEl) {
      bannerEl.classList.remove('nudge');
      void bannerEl.offsetWidth;
      bannerEl.classList.add('nudge');
    }
  }
  // A tap before the words are all said: they're all there at once, and BOT's -_- (the next tap
  // does what it's for)
  function early() {
    stopTyping(true);
    botMood('annoyed', 1300);
  }
  // THE TAP GATE: while a lesson's up, a tap only does what the card asks for (its EXIT always
  // works). Before the words are said, any tap finishes them; anything else gets -_-. Drops go on to
  // canDrop, which has its own say
  function gate(e) {
    if (step < 0 || !bannerEl || bannerEl.hidden) return;
    const t = e.target instanceof Element ? e.target : null;
    if (!t || t.closest('.tut-exit')) return;
    const s = cur();
    const block = () => { e.stopPropagation(); e.preventDefault(); };
    if (typing) { block(); early(); return; }
    if (t.closest('#tut-banner')) return; // (its own buttons, once it's said its piece)
    if (!dropped && s.tap && tapTarget && tapTarget.contains(t)) return;
    if (!dropped && drops(s).length && t.closest('#column-buttons, #board')) return; // (canDrop decides)
    if (t.closest('.overlay')) return; // (a result card, if one's up)
    block();
    annoyed();
  }
  document.addEventListener('click', gate, true);
  function banner() {
    if (bannerEl) return bannerEl;
    bannerEl = document.createElement('div');
    bannerEl.className = 'tut-banner';
    bannerEl.id = 'tut-banner';
    bannerEl.setAttribute('role', 'status');
    bannerEl.addEventListener('click', (e) => { if (!e.target.closest('button')) stopTyping(true); });
    document.querySelector('.board-frame').appendChild(bannerEl);
    return bannerEl;
  }
  // THE DIM: on a step that asks for a tap, the whole screen dims a little but for what to tap
  // (and the banner, to read), fading in and out over 0.25s. It's a see-through layer cut open
  // around them (clip-path), so taps go through as usual; it follows them while it's up.
  let dimEl = null;
  let dimOn = null; // (the element left bright, while dimmed)
  let dimRaf = 0;
  function dimPath() {
    // (from the dim's own corner: with the ad banner at the top the page sits under it, so the
    // window's numbers would put each opening a banner's height off)
    const base = dimEl.getBoundingClientRect();
    const W = base.width;
    const H = base.height;
    let d = `M0 0H${W}V${H}H0Z`;
    const parts = bannerEl ? [bannerEl.querySelector('.tut-card'), ...bannerEl.querySelectorAll('.tut-actions button')] : [];
    for (const el of [dimOn, ...parts]) { // (the card and each button: not the empty row beside them)
      if (!el || !el.isConnected) continue;
      const r = el.getBoundingClientRect();
      if (!r.width) continue;
      const pad = el === dimOn ? 4 : 0;
      const L = r.left - base.left - pad;
      const T = r.top - base.top - pad;
      const R = r.right - base.left + pad;
      const B = r.bottom - base.top + pad;
      d += `M${L} ${T}H${R}V${B}H${L}Z`;
    }
    dimEl.style.clipPath = `path(evenodd, '${d}')`;
    if (dimOn) dimRaf = requestAnimationFrame(dimPath);
  }
  function dim(target) {
    if (!dimEl) {
      dimEl = document.createElement('div');
      dimEl.className = 'tut-dim';
      dimEl.setAttribute('aria-hidden', 'true');
      document.body.appendChild(dimEl);
      void dimEl.offsetWidth; // (drawn clear first, so the first dim fades in too)
    }
    cancelAnimationFrame(dimRaf);
    dimOn = target || null;
    if (dimOn) dimPath();
    dimEl.classList.toggle('on', !!dimOn);
  }
  function clearPulses() {
    document.querySelectorAll('.tut-pulse').forEach((el) => el.classList.remove('tut-pulse'));
    if (tapTarget) tapTarget.removeEventListener('click', onTap, true);
    tapTarget = null;
  }
  function onTap(e) {
    if (cur().pass) { // (the control does its own job too, then the lesson moves on)
      setTimeout(() => go(step + 1), 0);
      return;
    }
    e.stopPropagation();
    SFX.play('click');
    go(step + 1);
  }
  // The menus as a step wants them: one open on a tab, or both shut
  function menus(s) {
    // (the pause screen, open or not as the step wants it)
    if (s.paused && !vsPaused) openPause();
    else if (!s.paused && vsPaused) resumeMatch();
    if (s.pane) setRecordsOpen(true, s.pane);
    if (s.settings) setSettingsOpen(true);
    if (s.closeMenus) {
      setRecordsOpen(false);
      setSettingsOpen(false);
    }
  }

  // Sets the board and bits of a step that has them
  function setUp(s) {
    if (s.board) {
      columns = s.board.map((col) => col.map((block) => {
        if (typeof block === 'number') return { type: 'number', val: block };
        const [level, hidden] = block.slice(1).split(':').map(Number);
        return { type: 'firewall', level, hidden };
      }));
    }
    if (s.bits) queue = s.bits.map((val) => ({ type: 'number', val }));
    if (s.held) {
      heldHacks = [...s.held];
      armedHack = null;
    }
    menus(s);
    render();
    updateHud();
  }

  function show() {
    const s = cur();
    clearPulses();
    dropped = false;
    const el = banner();
    el.hidden = false;
    el.classList.toggle('bottom', s.place === 'bottom');
    // Over an open menu: the bottom of the screen, above everything
    const home = s.float ? document.body : document.querySelector('.board-frame');
    if (el.parentNode !== home) home.appendChild(el);
    el.classList.toggle('float', !!s.float);
    el.classList.toggle('middle', s.float === 'middle');
    if (!s.holdMeter) resetStreak(); // (the chain lesson's meter stays lit until it's done)
    el.innerHTML = '';
    // The framed card (heading, BOT and what it says); BACK / NEXT go under it, outside the frame
    const card = document.createElement('div');
    card.className = 'tut-card';
    el.appendChild(card);
    const head = document.createElement('div');
    head.className = 'tut-head';
    // (the welcome isn't a step: no number; the steps count from the one after it)
    head.innerHTML = `<span>// TUTORIAL${s.intro ? '' : ` ${step} / ${STEPS.length - 1}`}</span>`;
    const exit = document.createElement('button');
    exit.type = 'button';
    exit.className = 'tut-exit';
    exit.textContent = 'EXIT';
    exit.addEventListener('click', leave);
    head.appendChild(exit);
    card.appendChild(head);
    // BOT and what it says
    const body = document.createElement('div');
    body.className = 'tut-body';
    narrator = miniBot('bot', 'normal');
    narrator.classList.add('tut-bot');
    body.appendChild(narrator);
    const text = document.createElement('p');
    text.className = 'tut-text';
    text.setAttribute('aria-label', s.text); // (read whole, not letter by letter)
    body.appendChild(text);
    card.appendChild(body);
    botMood(s.mood);
    if (step > 0) addButton('BACK', back, 'tut-back');
    if (s.intro) addButton('BEGIN', () => go(step + 1));
    if (s.next) addButton('NEXT', () => go(step + 1));
    if (s.done) addButton('MAIN MENU', () => leave());
    pinTop(text, s.text);
    say(text, s.text);
    // What it's talking about pulses
    (s.pulse || []).forEach((sel) => document.querySelectorAll(sel).forEach((n) => n.classList.add('tut-pulse')));
    if (!s.tap) dim(null);
    if (s.tap) {
      tapTarget = document.querySelector(s.tap);
      dim(tapTarget);
      if (tapTarget) {
        tapTarget.classList.add('tut-pulse');
        tapTarget.addEventListener('click', onTap, true);
      }
    }
    if (typeof tutorialDemo === 'function') tutorialDemo(s.demo || null);
    decorate();
    updateColumnButtons();
    SFX.play('punct');
  }
  function addButton(label, fn, cls = '') {
    let row = bannerEl.querySelector('.tut-actions');
    if (!row) {
      row = document.createElement('div');
      row.className = 'tut-actions';
      bannerEl.appendChild(row);
    }
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = label;
    if (cls) btn.className = cls;
    btn.addEventListener('click', fn);
    row.appendChild(btn);
  }

  function decorate() {
    const s = cur();
    if (!s) return;
    if (!dropped) {
      (s.cells || []).forEach(([r, c]) => {
        const cell = document.querySelector(`#board .cell[data-pos="${r},${c}"]`);
        if (cell) cell.classList.add('tut-pulse');
      });
      for (const col of drops(s)) {
        const btn = document.querySelectorAll('#column-buttons button')[col];
        if (btn) btn.classList.add('tut-pulse');
      }
    }
    if (s.line) document.querySelectorAll('#board .overflow-line').forEach((n) => n.classList.add('tut-pulse'));
  }

  function go(n) {
    step = n;
    if (step >= STEPS.length) return leave();
    setUp(cur());
    snapshots[step] = {
      columns: copyCells(columns), queue: queue.map((b) => ({ ...b })), score, chain: chainEl.textContent,
      held: [...heldHacks], armed: armedHack,
    };
    show();
  }

  // BACK: after a drop, the same step again from the start; otherwise the step before it. The
  // board, bits, score and chain go back to how they stood as that step began.
  function back() {
    if (busy) return;
    const to = dropped ? step : step - 1;
    if (!snapshots[to]) return;
    restore(to);
    SFX.play('click');
    show();
  }
  // (a step as it stood when it began: BACK, and a refresh picking the lesson up again)
  function restore(to) {
    const snap = snapshots[to];
    step = to;
    columns = copyCells(snap.columns);
    queue = snap.queue.map((b) => ({ ...b }));
    score = snap.score;
    chainEl.textContent = snap.chain;
    heldHacks = [...snap.held];
    armedHack = snap.armed;
    menus(STEPS[step]);
    render();
    updateHud();
  }
  let resumeFrom = null; // (set by resumeAt: the next begin() picks up there)

  // Leaves the tutorial for the mode picked before it (or CLASSIC)
  function leave(to) {
    stopTyping(false);
    clearPulses();
    dim(null);
    setRecordsOpen(false);
    setSettingsOpen(false);
    if (vsPaused) resumeMatch(); // (left from the pause screen)
    if (bannerEl) bannerEl.hidden = true;
    step = -1;
    if (typeof tutorialDemo === 'function') tutorialDemo(null);
    if (to === 'classic') {
      topMode = 'classic';
      storage.set('bytefall-mode', 'classic');
    }
    setModeFromChoice();
    resetNow();
    showHome(); // (out to the main menu)
  }

  // What the last drop decrypted, link by link, each part in its own color: the bits, what each
  // is worth, the chain's multiplier and the link's points: "[3][3] 13+13 ×1 = 26"
  function breakdown() {
    const lines = [];
    let total = 0;
    for (const link of chainLog) {
      total += link.points;
      if (link.packet) lines.push(`<span class="tp-bonus">${link.count > 1 ? `${link.count} ` : ''}${link.packet} +${link.points}</span>`);
      else lines.push(`<span class="tp-bits">${link.vals.map((v) => `[${v}]`).join('')}</span> <span class="tp-sum">${link.vals.map((v) => 10 + v).join('+')}</span> <span class="tp-x">×${link.chain}</span> <span class="tp-eq">= ${link.points}</span>`);
    }
    if (lines.length > 1) lines.push(`<span class="tp-total">TOTAL +${total}</span>`);
    if (!lines.length) lines.push(`<span class="tp-total">+${score - scoreAtDrop}</span>`); // (an exploit's flat points)
    return lines;
  }

  return {
    // Called by initGame when the mode is 'tutorial'
    begin() {
      snapshots = [];
      const saved = resumeFrom;
      resumeFrom = null;
      if (saved && Array.isArray(saved.snapshots) && saved.snapshots[saved.step] && saved.step < STEPS.length) {
        snapshots = saved.snapshots;
        restore(saved.step);
        show();
        return;
      }
      go(0);
    },
    // A refresh mid-lesson (place.js): where it stood, and how each step so far began (for BACK)
    state() {
      return step < 0 ? null : { step, snapshots: snapshots.slice(0, step + 1) };
    },
    resumeAt(saved) {
      resumeFrom = saved;
    },
    // Called by initGame for every other mode
    end() {
      stopTyping(false);
      clearPulses();
      if (bannerEl) bannerEl.hidden = true;
      step = -1;
      if (typeof tutorialDemo === 'function') tutorialDemo(null);
    },
    canDrop(col) {
      const s = cur();
      if (typing) { early(); return false; } // (before the words are done: they finish, and BOT's -_-)
      if (s && drops(s).includes(col) && !dropped) {
        dropped = true;
        scoreAtDrop = score;
        clearPulses();
        return true;
      }
      annoyed();
      return false;
    },
    // PAUSE (its button, Esc, P) only where a card asks for it, or the pause screen's already up
    allowsPause: () => { const s = cur(); return !!s && (s.tap === '#records-btn' || !!s.paused); },
    // Called by finishTurn once a drop has resolved
    afterDrop() {
      const s = cur();
      if (!s || !drops(s).length) return;
      const text = bannerEl.querySelector('.tut-text');
      const pts = document.createElement('div');
      pts.className = 'tut-points';
      pts.innerHTML = breakdown().map((l) => `<div>${l}</div>`).join('');
      pts.hidden = true;
      bannerEl.querySelector('.tut-body').after(pts);
      botMood(s.explainMood);
      text.setAttribute('aria-label', s.explain());
      addButton('NEXT', () => go(step + 1));
      pts.hidden = false; // (measured with the points, then hidden till it's said)
      pinTop(text, s.explain());
      pts.hidden = true;
      say(text, s.explain(), () => { pts.hidden = false; }); // (the points once it's said)
    },
    // After each render: pulse this step's cells, drop button and the line
    decorate,
    // Only the lesson's column can be pressed
    allows: (col) => { const s = cur(); return !!s && drops(s).includes(col) && !dropped; },
    holdsMeter: () => { const s = cur(); return !!s && !!s.holdMeter; },
    active: () => step >= 0,
    // The EXPLOIT button works only on the step that asks for it
    allowsExploit: () => { const s = cur(); return !!s && s.tap === '#exploit-btn'; },
  };
})();
