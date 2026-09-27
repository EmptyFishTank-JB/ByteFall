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
  const STEPS = [
    {
      text: 'Welcome to BYTEFALL. Encrypted bits fall into this terminal, and you decrypt them by dropping each one into a column. This quick tutorial shows you how.',
      board: EMPTY, bits: [], next: true, place: 'bottom',
    },
    {
      text: 'This is your CURRENT bit: the next one you drop. Its number is 3. Tap CURRENT.',
      board: [[3], [5], [], [], [], [], []], bits: [3, 2], tap: '.stat-current',
    },
    {
      text: 'A bit decrypts when its number matches the length of the unbroken line it sits in, across or down. Drop the [3] into column 3: with the [3] and [5] there, it makes a line of 3 across.',
      drop: 2, cells: [[0, 0], [0, 1]],
      explain: () => 'Both [3]s were in a line of 3, so both decrypted. The [5] is in a line of 1 now, so it stays.',
    },
    {
      text: 'Lines count down too. Drop the [2] onto the [5] in column 2: it will sit in a column 2 tall.',
      drop: 1, cells: [[0, 1]],
      explain: () => 'The [2] was in a line of 2 going down, so it decrypted.',
    },
    {
      text: 'Each bit decrypted scores 10 plus its number: a [3] is 13. That’s your SCORE. Tap it.',
      tap: '#score-stat',
    },
    {
      text: 'When bits decrypt, the ones above fall, and can land in new matches: a CHAIN. Each link multiplies its points: 2x, 3x and up. Drop the [2] into column 7.',
      board: [[], [], [], [3], [6, 3], [5, 3], [2]], bits: [2], drop: 6, cells: [[1, 4], [1, 5], [0, 6]],
      explain: () => 'The [2]s made a line of 2 going down and the top [3]s a line of 3 across. Then the bits above fell, and the last [3] found itself in a line of 3: a 2x chain. And 4 bits decrypted in one drop make a NIBBLE, 16 bonus points.',
    },
    {
      text: 'CHAIN shows how long the last chain was. Tap it.',
      tap: '#chain-stat',
    },
    {
      text: 'This [=] is an ENCRYPTION LAYER. Decrypt a bit right beside it to peel it. Drop the [2] into column 2: it makes a line of 2 with the layer.',
      board: [['L2:1'], [], [], [], [], [], []], bits: [2, 2], drop: 1, cells: [[0, 0]],
      explain: () => 'The [2] decrypted and peeled the layer once: [=] is now cracked, [-].',
    },
    {
      text: 'Once more. Drop the next [2] into column 2 to peel it again.',
      drop: 1, cells: [[0, 0]],
      explain: () => 'The second peel broke the layer open and revealed the bit hidden under it: a [1], alone in a line of 1, so it decrypted too, as the chain’s second link.',
    },
    {
      text: 'Keep every column below this ======== line. If anything is still above it once the decrypting stops, the trace completes and the game is over.',
      board: EMPTY, bits: [], line: true, next: true, place: 'bottom',
    },
    {
      text: 'A new row of layers rises from the bottom every 8 drops, pushing everything up. ENCRYPT IN counts down the drops until the next one. Tap it.',
      tap: '#pulse-stat',
    },
    {
      text: 'Chain 5 decrypts in one drop to earn an EXPLOIT: a tool that changes the board. They wait on this button. RULES and EXPLOITS in the menu tell you more.',
      pulse: ['#exploit-btn'], next: true,
    },
    {
      text: 'That’s everything you need. Good luck, decryptor.',
      done: true,
    },
  ];

  let step = -1;
  let dropped = false; // this step's drop has happened (waiting on NEXT)
  let tapTarget = null;
  let bannerEl = null;

  const cur = () => STEPS[step];
  function banner() {
    if (bannerEl) return bannerEl;
    bannerEl = document.createElement('div');
    bannerEl.className = 'tut-banner';
    bannerEl.id = 'tut-banner';
    bannerEl.setAttribute('role', 'status');
    document.querySelector('.board-frame').appendChild(bannerEl);
    return bannerEl;
  }
  function clearPulses() {
    document.querySelectorAll('.tut-pulse').forEach((el) => el.classList.remove('tut-pulse'));
    if (tapTarget) tapTarget.removeEventListener('click', onTap, true);
    tapTarget = null;
  }
  function onTap(e) {
    e.stopPropagation();
    SFX.play('click');
    go(step + 1);
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
    const text = document.createElement('p');
    text.className = 'tut-text';
    text.textContent = s.text;
    el.appendChild(text);
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
  function addButton(label, fn) {
    let row = bannerEl.querySelector('.tut-actions');
    if (!row) {
      row = document.createElement('div');
      row.className = 'tut-actions';
      bannerEl.appendChild(row);
    }
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = label;
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
    show();
  }

  // Leaves the tutorial for the mode picked before it (or CLASSIC)
  function leave(to) {
    clearPulses();
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
    return lines;
  }

  return {
    // Called by initGame when the mode is 'tutorial'
    begin() {
      go(0);
    },
    // Called by initGame for every other mode
    end() {
      clearPulses();
      if (bannerEl) bannerEl.hidden = true;
      step = -1;
    },
    canDrop(col) {
      const s = cur();
      if (s && s.drop === col && !dropped) {
        dropped = true;
        clearPulses();
        return true;
      }
      SFX.play('denied');
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
      text.textContent = s.explain();
      const pts = document.createElement('pre');
      pts.className = 'tut-points';
      pts.textContent = breakdown().join('\n');
      bannerEl.insertBefore(pts, text.nextSibling);
      addButton('NEXT', () => go(step + 1));
    },
    // After each render: pulse this step's cells, drop button and the line
    decorate,
    // Only the lesson's column can be pressed
    allows: (col) => { const s = cur(); return !!s && s.drop === col && !dropped; },
    active: () => step >= 0,
  };
})();
