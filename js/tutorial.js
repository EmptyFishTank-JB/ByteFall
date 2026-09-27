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
  // into; after it resolves, explain() adds to the banner and NEXT appears). pulse: selectors to
  // pulse; cells: [row, col] board cells to pulse; line: pulse the ======== line; place: 'bottom'
  // puts the banner under the board's middle instead of at its top.
  // pass: the tapped control also does its own job (opens the menu, arms the exploit); pane: the
  // menu open on that tab; closeMenus: the menus shut; held: exploits waiting in the button;
  // float: the banner at the bottom of the screen, over any open menu. mood / explainMood: BOT's
  // face while it says the step / the explanation after the drop (idle when left out).
  const STEPS = [
    {
      text: 'Welcome to BYTEFALL. Encrypted bits fall into this terminal, and you decrypt them by dropping each one into a column. This quick tutorial shows you how.',
      board: EMPTY, bits: [], next: true, place: 'bottom', mood: 'happy',
    },
    {
      text: 'This is your CURRENT bit: the next one you drop. Its number is 3. Tap CURRENT.',
      board: [[], [], [], [], [3], [5], []], bits: [3, 2], tap: '.stat-current',
    },
    {
      text: 'A bit decrypts when its number matches the length of the unbroken line it sits in, across or down. Any column works for any bit. Drop this [3] into column 7: beside the [3] and [5], it makes a line of 3 across.',
      drop: 6, cells: [[0, 4], [0, 5]],
      explain: () => 'Both [3]s were in a line of 3, so both decrypted. The [5] is now in a line of 1, which doesn’t match its number, so it stays.',
    },
    {
      text: 'Lines count down too. Drop the [2] into column 6, on top of the [5]: it will sit in a column 2 tall.',
      drop: 5, cells: [[0, 5]],
      explain: () => 'The [2] was in a line of 2 going down, so it decrypted.',
    },
    {
      text: 'Each decrypted bit scores 10 plus its number: a [3] is worth 13. That’s your SCORE. Tap it.',
      tap: '#score-stat',
    },
    {
      text: 'When bits decrypt, the ones above fall, and can land in new matches: a CHAIN. Each link multiplies its points: 2x, 3x and up. Drop the [2] into column 7.',
      board: [[], [], [], [3], [6, 3], [5, 3], [2]], bits: [2], drop: 6, cells: [[1, 4], [1, 5], [0, 6]], explainMood: 'happy',
      explain: () => 'The [2]s made a line of 2 going down and the top [3]s a line of 3 across. Then the bits above fell, and the last [3] found itself in a line of 3: a 2x chain. Decrypting 4 bits in one drop also makes a NIBBLE, worth 16 bonus points.',
    },
    {
      text: 'CHAIN shows how long the last chain was. Tap it.',
      tap: '#chain-stat',
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
      text: 'Get a 5x chain in one drop to earn an EXPLOIT: a tool that changes the board. Earned exploits are stored in the EXPLOIT button at the bottom right. You have one waiting: a WORM VIRUS. Tap the EXPLOIT button to arm it.',
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
      pane: 'rules', pulse: ['.menu-tabs [data-pane="rules"]'], float: true, next: true,
    },
    {
      text: 'The RECORDS tab shows your level and DECRYPTOR rank, every unlock with the level it opens at, every achievement with its progress, and your lifetime stats.',
      pane: 'records', pulse: ['.menu-tabs [data-pane="records"]'], float: true, next: true,
    },
    {
      text: 'The EXPLOITS tab is your loadout. You can only earn exploits that are in a slot. Tap a card to put it in a free slot, or tap it again to take it out. More slots and exploits unlock as you level up, and the loadout is locked from a session’s first drop until it ends.',
      pane: 'exploits', pulse: ['.menu-tabs [data-pane="exploits"]'], float: true, next: true,
    },
    {
      text: 'Now tap SETTINGS, at the top right.',
      closeMenus: true, tap: '#settings-btn', pass: true,
    },
    {
      text: 'SETTINGS has sound and music, whether the drop buttons sit under or over the grid, vibration on phones, color THEMES and FONTS (more unlock as you level up), and the PLAYLIST, with the MUSIC PLAYER for listening on its own.',
      float: true, next: true,
    },
    {
      text: 'That’s everything you need to know. Good luck, decryptor.',
      closeMenus: true, done: true, mood: 'happy',
    },
  ];

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
    el.innerHTML = '';
    const head = document.createElement('div');
    head.className = 'tut-head';
    head.innerHTML = `<span>// TUTORIAL ${step + 1} / ${STEPS.length}</span>`;
    const exit = document.createElement('button');
    exit.type = 'button';
    exit.className = 'tut-exit';
    exit.textContent = 'EXIT';
    exit.addEventListener('click', leave);
    head.appendChild(exit);
    el.appendChild(head);
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
    el.appendChild(body);
    botMood(s.mood);
    say(text, s.text);
    if (step > 0) addButton('BACK', back, 'tut-back');
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
      if (s.drop !== undefined) {
        const btn = document.querySelectorAll('#column-buttons button')[s.drop];
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
    const snap = snapshots[to];
    if (!snap) return;
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
    SFX.play('click');
    show();
  }

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
      go(0);
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
      if (s && s.drop === col && !dropped) {
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
      if (!s || s.drop === undefined) return;
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
    allows: (col) => { const s = cur(); return !!s && s.drop === col && !dropped; },
    active: () => step >= 0,
    // The EXPLOIT button works only on the step that asks for it
    allowsExploit: () => { const s = cur(); return !!s && s.tap === '#exploit-btn'; },
  };
})();
