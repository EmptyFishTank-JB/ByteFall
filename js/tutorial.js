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
  // the screen). holdMeter: the chain meter stays lit after the drop, for the lesson on it. mood / explainMood: BOT's
  // face while it says the step / the explanation after the drop (idle when left out). intro:
  // the welcome ahead of the steps (step 0, not counted; BEGIN starts step 1).
  const STEPS = [
    {
      text: 'Welcome to BYTEFALL! This tutorial will help you understand how the game is played, along with some other useful information. As you can see, there are 20 steps! Don’t worry, they’re not too long, and despite all of the numbers, there’s really no math required as long as you can count to 7!',
      board: EMPTY, bits: [], intro: true, place: 'bottom', mood: 'happy',
    },
    {
      text: 'This grid is called the TERMINAL. You’ll be dropping encrypted bits into the TERMINAL’s columns. Encrypted bits are the numbered blocks with brackets: [1] [2] [3] [4] [5] [6] [7]',
      board: EMPTY, bits: [], next: true, place: 'bottom',
    },
    {
      text: 'This flashing display panel shows your CURRENT bit, [3], which is the one that will be dropped into a column on your next tap. Go ahead and tap the CURRENT display panel!',
      board: [[], [], [], [], [3], [5], []], bits: [3, 2], tap: '.stat-current',
    },
    {
      text: 'A bit clears only when its value matches the exact number of bits in the row or column that it sits in. Clearing bits is called DECRYPTING. Any bit can be dropped into any column by tapping a number button below or by tapping the column itself. Go ahead and drop the CURRENT bit, [3], into either column 4 or 7, next to the [3] and [5] bits.',
      drop: [3, 6], cells: [[0, 4], [0, 5]],
      explain: () => 'BOOM! Both [3] bits were DECRYPTED, since the row was made 3 bits long. The [5] bit remains, since it was in neither a row nor a column 5 bits long, before or after the drop.',
    },
    {
      text: 'Let’s try a column. Drop the CURRENT bit, [2], on top of the [5] bit in column 6.',
      drop: 5, cells: [[0, 5]],
      explain: () => 'Nice! Since dropping the [2] bit made the column 2 bits tall, the [2] bit was DECRYPTED.',
    },
    {
      text: 'Now for the scoring! Each decrypted bit earns you 10 points plus the number it displays. A [1] bit is worth 11 points, a [2] bit is worth 12 points, and a [7] bit is worth 17 points. Get the idea? Up top is your SCORE display panel. Tap it now!',
      tap: '#score-stat',
    },
    {
      text: 'Any time a bit decrypts, any bits that were above it will fall, and they can cause more bits to DECRYPT. This is called a CHAIN. Each DECRYPTED bit that is part of a CHAIN has its points multiplied by its position within the CHAIN: 2x, 3x, and up. Let’s drop the [2] into column 6.',
      board: [[], [], [6, 6], [7, 5, 2, 7], [3, 4], [2], [6, 5]], bits: [2], drop: 5, cells: [[0, 5], [1, 3], [1, 6]], explainMood: 'happy', holdMeter: true,
      explain: () => 'Nice one! The dropped [2] made column 6 two bits tall, and the two [5]s were in a row 5 bits wide. The [2] and [7] above the cleared [5] fell. Then the [3] found itself in a row of 3, and once it cleared, the [4] beside the fallen [2] dropped away, leaving the [2] in a row of 2. Decrypting 4 bits in one drop is called a NIBBLE and is worth 16 bonus points. This drop was a 3x chain, with 16 bonus points from the NIBBLE.',
    },
    {
      text: 'CHAIN shows how long the last chain was. The bars up each side of the grid are the CHAIN METER: each link lights a segment. A chain that stops short of 5 lets it go dark again; reach 5 and it stays lit, pulsing: an exploit is ready. Tap CHAIN.',
      tap: '#chain-stat', pulse: ['.chain-meter'], holdMeter: true,
    },
    {
      text: 'This [=] is an ENCRYPTION LAYER. Decrypt a bit right beside it to peel it. Drop the [2] into column 5, next to the layer: the two of them make a line of 2.',
      board: [[], [], [], ['L2:1'], [], [], []], bits: [2, 2], drop: 4, cells: [[0, 3]],
      explain: () => 'The [2] decrypted and peeled the layer once: [=] is now cracked, [-].',
    },
    {
      text: 'Drop the next [2] into column 5 to peel the layer a second time.',
      drop: 4, cells: [[0, 3]],
      explain: () => 'The second peel broke the layer open and revealed the bit hidden under it: a [1], alone in a line of 1, so it decrypted too, as the chain’s second link.',
    },
    {
      text: 'Keep every column below this ======== line. If anything is still above it once the decrypting stops, the trace completes and the game is over.',
      board: EMPTY, bits: [], line: true, next: true, place: 'bottom', mood: 'worried',
    },
    {
      text: 'A new row of layers rises from the bottom every 8 drops, pushing everything up. ENCRYPT IN counts down the drops until the next one. Tap it.',
      tap: '#pulse-stat',
    },
    {
      text: 'Get a 5x chain in one drop, filling the CHAIN METER, to earn an EXPLOIT: a tool that changes the board. While one is waiting, the meter stays lit and pulses. Earned exploits are stored in the EXPLOIT button. You have one waiting: a WORM VIRUS. Tap the EXPLOIT button to arm it.',
      board: [[], [], [6, 2, 7, 3], [], [], [], []], bits: [], held: ['worm-virus'], tap: '#exploit-btn', pass: true, mood: 'devious',
    },
    {
      text: 'The WORM VIRUS is armed and is now your CURRENT. It drops like a bit. Drop it into column 3, the tall one: it wipes out every block in that column.',
      drop: 2, cells: [[0, 2], [1, 2], [2, 2], [3, 2]], mood: 'devious', explainMood: 'happy',
      explain: () => 'The WORM VIRUS wiped out the whole column. Blocks wiped out by an exploit score a flat 10 each. Other exploits wipe an area, peel layers or change bits: each has its card in the EXPLOITS tab.',
    },
    {
      text: 'Two buttons open the menus. Tap MENU, at the top left.',
      board: EMPTY, bits: [], closeMenus: true, tap: '#records-btn', pass: true,
    },
    {
      text: 'The RULES tab has everything you just learned, written down, with the TUTORIAL button to come back here any time.',
      pane: 'rules', pulse: ['.menu-tabs [data-pane="rules"]'], float: 'middle', next: true,
    },
    {
      text: 'The RECORDS tab shows your level and DECRYPTOR rank, every unlock with the level it opens at, every achievement with its progress, and your lifetime stats.',
      pane: 'records', pulse: ['.menu-tabs [data-pane="records"]'], float: 'middle', next: true,
    },
    {
      text: 'The EXPLOITS tab is your loadout. You can only earn exploits that are in a slot: SLOTS, at the top, counts the slots you’ve filled and the ones you have. Tap an unlocked card to put it in a free slot, or tap it again to take it out. More slots and exploits unlock as you level up, and the loadout is locked from a session’s first drop until it ends.',
      pane: 'exploits', pulse: ['.menu-tabs [data-pane="exploits"]', '#slot-info', '.hack-item'], float: true, next: true,
    },
    {
      text: 'Now tap SETTINGS, at the top right.',
      closeMenus: true, tap: '#settings-btn', pass: true,
    },
    {
      text: 'SETTINGS has sound and music, whether the drop buttons sit under or over the grid, vibration on phones, color THEMES and FONTS (more unlock as you level up), and the PLAYLIST, with the MUSIC PLAYER for listening on its own.',
      float: 'middle', next: true,
    },
    {
      text: 'That’s everything you need to know. Good luck, decryptor.',
      closeMenus: true, done: true, mood: 'happy',
    },
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
  function say(el, text, done) {
    stopTyping(true);
    // (the rest of the line is there but unseen, so the banner is its full size from the start)
    el.innerHTML = '<span class="said"></span><span class="unsaid"></span>';
    const said = el.firstChild;
    const unsaid = el.lastChild;
    unsaid.textContent = text;
    const t = { el, text, i: 0, timer: 0, done };
    typing = t;
    if (narrator) narrator.classList.add('talking');
    const tick = () => {
      if (typing !== t) return;
      const ch = t.text[t.i++];
      said.textContent = t.text.slice(0, t.i);
      unsaid.textContent = t.text.slice(t.i);
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
    if (s.pane) setRecordsOpen(true, s.pane);
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
    if (!s.holdMeter) setChainMeter(0); // (the chain lesson's meter stays lit until it's done)
    el.innerHTML = '';
    // The framed card (heading, BOT and what it says); BACK / NEXT go under it, outside the frame
    const card = document.createElement('div');
    card.className = 'tut-card';
    el.appendChild(card);
    const head = document.createElement('div');
    head.className = 'tut-head';
    // (the welcome isn't a step: it shows 0 / 20, and the steps count from the one after it)
    head.innerHTML = `<span>// TUTORIAL ${step} / ${STEPS.length - 1}</span>`;
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
    say(text, s.text);
    if (step > 0) addButton('BACK', back, 'tut-back');
    if (s.intro) addButton('BEGIN', () => go(step + 1));
    if (s.next) addButton('NEXT', () => go(step + 1));
    if (s.done) {
      addButton('PLAY CLASSIC', () => leave('classic'));
      addButton('RULES', () => { leave(); setRecordsOpen(true, 'rules'); });
    }
    // What it's talking about pulses
    (s.pulse || []).forEach((sel) => document.querySelectorAll(sel).forEach((n) => n.classList.add('tut-pulse')));
    if (s.tap) {
      tapTarget = document.querySelector(s.tap);
      if (tapTarget) {
        tapTarget.classList.add('tut-pulse');
        tapTarget.addEventListener('click', onTap, true);
      }
    }
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
    setRecordsOpen(false);
    setSettingsOpen(false);
    if (bannerEl) bannerEl.hidden = true;
    step = -1;
    if (to === 'classic') {
      topMode = 'classic';
      storage.set('bytefall-mode', 'classic');
    }
    setModeFromChoice();
    resetNow();
  }

  // What the last drop decrypted, link by link: "[3] [3] (13 + 13) x1 = 26"
  function breakdown() {
    const lines = [];
    let total = 0;
    for (const link of chainLog) {
      total += link.points;
      if (link.packet) lines.push(`${link.count > 1 ? `${link.count} ` : ''}${link.packet} +${link.points}`);
      else lines.push(`${link.vals.map((v) => `[${v}]`).join(' ')}  (${link.vals.map((v) => 10 + v).join(' + ')}) ×${link.chain} = ${link.points}`);
    }
    if (lines.length > 1) lines.push(`TOTAL +${total}`);
    if (!lines.length) lines.push(`+${score - scoreAtDrop}`); // (an exploit's flat points)
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
    },
    canDrop(col) {
      const s = cur();
      if (s && drops(s).includes(col) && !dropped) {
        dropped = true;
        scoreAtDrop = score;
        clearPulses();
        return true;
      }
      SFX.play('denied');
      botMood('annoyed', 1300); // -_-
      if (bannerEl) {
        bannerEl.classList.remove('nudge');
        void bannerEl.offsetWidth;
        bannerEl.classList.add('nudge');
      }
      return false;
    },
    // Called by finishTurn once a drop has resolved
    afterDrop() {
      const s = cur();
      if (!s || !drops(s).length) return;
      const text = bannerEl.querySelector('.tut-text');
      const pts = document.createElement('pre');
      pts.className = 'tut-points';
      pts.textContent = breakdown().join('\n');
      pts.hidden = true;
      bannerEl.querySelector('.tut-body').after(pts);
      botMood(s.explainMood);
      text.setAttribute('aria-label', s.explain());
      say(text, s.explain(), () => { pts.hidden = false; }); // (the points once it's said)
      addButton('NEXT', () => go(step + 1));
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
