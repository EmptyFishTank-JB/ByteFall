// CHECKSUM (THE ARCADE's Thursday game; the card around it is arcade.js): a 9x9 grid in nine 3x3 boxes,
// some bits given, the same for everyone that Thursday (made from the date: a full grid, then bits
// taken out in pairs, opposite each other, as long as it still has one answer only, down to GIVENS).
// Fill it so every row, column and box holds [1] to [9] once. Tap a square, then a bit in the row under
// the board to write it in (the same bit again takes it out); with NOTES on, the bits are pencil marks
// instead, the ones it could be, small in the square; ERASE clears the square. Writing a bit in takes
// it off the notes round it. (The same bit elsewhere isn't lit: that made it too easy.) CONFIRM checks
// the grid: INCOMPLETE (squares still empty), CHECKSUM FAILED (full, but wrong somewhere: it doesn't
// say where) or CHECKSUM VALID, the game over. Timed: the clock runs whenever the card's up, till it's
// valid. Keys: 1 to 9, 0 or Backspace to erase, N for NOTES, the arrows to move, Enter to CONFIRM.
Arcade.register('checksum', (() => {
  const GIVENS = 30;
  const ROW = Array.from({ length: 81 }, (_, i) => Math.floor(i / 9));
  const COL = Array.from({ length: 81 }, (_, i) => i % 9);
  const BOX = Array.from({ length: 81 }, (_, i) => Math.floor(i / 27) * 3 + Math.floor((i % 9) / 3));
  const PEERS = Array.from({ length: 81 }, (_, i) => Array.from({ length: 81 }, (_, j) => j).filter((j) => j !== i && (ROW[j] === ROW[i] || COL[j] === COL[i] || BOX[j] === BOX[i])));
  const ALL = 0x3fe; // (bits 1 to 9 of a mask)
  const bits = (m) => { let n = 0; for (let x = m; x; x &= x - 1) n++; return n; };
  const el = (id) => document.getElementById(id);
  const boardEl = el('ck-board');
  const padEl = el('ck-pad');
  const actsEl = el('ck-acts');
  const notesBtn = el('ck-notes');
  const kit = Arcade.kit;
  let s = null; // (the game shown: { given, sol, v, n, fails, solved } and the frame's own)
  let sel = -1;
  let notesOn = false;
  let cells = [];
  let stamp = null;

  // THE SOLVER: the squares filled one at a time, always the one with the fewest bits it could be;
  // pick: the order to try them in (a random one makes a grid), stop: solutions enough
  function solve(grid, stop, pick) {
    const g = Uint8Array.from(grid);
    const rows = new Uint16Array(9);
    const cols = new Uint16Array(9);
    const boxes = new Uint16Array(9);
    for (let i = 0; i < 81; i++) if (g[i]) { const m = 1 << g[i]; rows[ROW[i]] |= m; cols[COL[i]] |= m; boxes[BOX[i]] |= m; }
    let found = 0;
    let first = null;
    (function step() {
      let best = -1;
      let bestMask = 0;
      let bestN = 10;
      for (let i = 0; i < 81; i++) {
        if (g[i]) continue;
        const m = ALL & ~(rows[ROW[i]] | cols[COL[i]] | boxes[BOX[i]]);
        const n = bits(m);
        if (n < bestN) { best = i; bestMask = m; bestN = n; if (n <= 1) break; }
      }
      if (best < 0) { if (!found++) first = Uint8Array.from(g); return; }
      if (!bestN) return;
      const ds = [];
      for (let d = 1; d <= 9; d++) if (bestMask & (1 << d)) ds.push(d);
      for (const d of pick ? pick(ds) : ds) {
        const m = 1 << d;
        g[best] = d; rows[ROW[best]] |= m; cols[COL[best]] |= m; boxes[BOX[best]] |= m;
        step();
        g[best] = 0; rows[ROW[best]] &= ~m; cols[COL[best]] &= ~m; boxes[BOX[best]] &= ~m;
        if (found >= stop) return;
      }
    })();
    return { found, first };
  }
  function shuffle(a, rand) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  // The day's grid: a full one, then pairs of squares (opposite each other through the middle) taken
  // out, in a random order, each pair only if the grid keeps one answer, till GIVENS are left
  function generate(rand) {
    const sol = solve(new Uint8Array(81), 1, (ds) => shuffle(ds, rand)).first;
    const given = Uint8Array.from(sol);
    let left = 81;
    for (const i of shuffle(Array.from({ length: 41 }, (_, k) => k), rand)) {
      if (left <= GIVENS) break;
      const j = 80 - i;
      const a = given[i];
      const b = given[j];
      given[i] = 0;
      given[j] = 0;
      if (solve(given, 2).found === 1) left -= i === j ? 1 : 2;
      else { given[i] = a; given[j] = b; }
    }
    return { given, sol };
  }
  function make(rand, saved) {
    const { given, sol } = generate(rand);
    const x = { given, sol, v: Uint8Array.from(given), n: new Uint16Array(81), fails: 0, solved: false };
    if (saved && typeof saved.v === 'string' && saved.v.length === 81) {
      [...saved.v].forEach((ch, i) => { if (!given[i] && /[1-9]/.test(ch)) x.v[i] = +ch; });
      if (Array.isArray(saved.n) && saved.n.length === 81) saved.n.forEach((m, i) => { if (!x.v[i]) x.n[i] = m & ALL; });
      x.fails = saved.x || 0;
      x.solved = !!saved.s && x.v.every((d, i) => d === sol[i]);
    }
    return x;
  }
  const empty = (x) => x.v.reduce((a, d) => a + (d ? 0 : 1), 0);

  // THE GRID: nine boxes of nine squares; a given bit, a bit written in (the accent's), or notes. The
  // boxes, their squares into sq (the game's, or the ARCADE menu's preview's)
  function boxes(sq) {
    return Array.from({ length: 9 }, (_, b) => {
      const box = document.createElement('div');
      box.className = 'ck-box';
      for (let k = 0; k < 9; k++) {
        const i = (Math.floor(b / 3) * 3 + Math.floor(k / 3)) * 9 + (b % 3) * 3 + (k % 3);
        const c = document.createElement('span');
        c.dataset.i = String(i);
        c.setAttribute('role', 'gridcell');
        sq[i] = c;
        box.appendChild(c);
      }
      return box;
    });
  }
  function build() {
    cells = new Array(81);
    stamp = document.createElement('p');
    stamp.className = 'ck-stamp';
    stamp.setAttribute('aria-hidden', 'true');
    boardEl.replaceChildren(...boxes(cells), stamp);
    padEl.replaceChildren(...Array.from({ length: 9 }, (_, k) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.dataset.v = String(k + 1);
      b.setAttribute('aria-label', `Bit ${k + 1}`);
      const face = document.createElement('span');
      face.className = 'cb-face';
      fillBit(face, k + 1); // (as the theme draws them: GLYPH's shapes, say)
      b.appendChild(face);
      return b;
    }));
  }
  // (the squares, sq, drawn from x, at the square picked)
  function paint(x, sq, at) {
    sq.forEach((c, i) => {
      const d = x.v[i];
      let cls = 'cell ck-cell';
      if (d) cls += ` disc ${x.given[i] ? 'ck-given' : 'ck-mine'}`;
      if (i === at) cls += ' sel';
      else if (at >= 0 && (ROW[i] === ROW[at] || COL[i] === COL[at] || BOX[i] === BOX[at])) cls += ' peer';
      if (x.solved) cls += ' ck-valid';
      c.className = cls;
      if (d) {
        fillBit(c, d);
        c.setAttribute('aria-label', `${d}${x.given[i] ? ', given' : ''}`);
      } else if (x.n[i]) {
        const box = document.createElement('span');
        box.className = 'ck-notes';
        for (let k = 1; k <= 9; k++) {
          const m = document.createElement('i');
          m.textContent = x.n[i] & (1 << k) ? String(k) : '';
          box.appendChild(m);
        }
        c.replaceChildren(box);
        c.classList.remove('has-glyph');
        c.setAttribute('aria-label', `Notes ${[1, 2, 3, 4, 5, 6, 7, 8, 9].filter((k) => x.n[i] & (1 << k)).join(' ')}`);
      } else {
        c.replaceChildren();
        c.classList.remove('has-glyph');
        c.setAttribute('aria-label', 'Empty');
      }
      if (x.solved) c.style.animationDelay = `${(ROW[i] + COL[i]) * 30}ms`;
    });
  }
  function render() {
    paint(s, cells, sel);
    // (a bit with all nine in: its button dimmed)
    const count = new Array(10).fill(0);
    s.v.forEach((d) => { count[d]++; });
    padEl.querySelectorAll('button').forEach((b) => b.classList.toggle('full', count[+b.dataset.v] >= 9));
    padEl.classList.toggle('notes', notesOn);
    notesBtn.textContent = `NOTES: ${notesOn ? 'ON' : 'OFF'}`;
    notesBtn.classList.toggle('on', notesOn);
    notesBtn.setAttribute('aria-pressed', String(notesOn));
    padEl.hidden = actsEl.hidden = s.solved;
    kit.refresh();
  }
  function line(x) {
    const time = kit.fmtTime(x.t);
    if (x.solved) return `CHECKSUM VALID IN ${time}${x.k ? ` // +${x.k} KEYS` : ''}`;
    const e = empty(x);
    return `TIME ${time} // ${e ? `${e} TO FILL` : 'GRID FULL: CONFIRM IT'}`;
  }
  // (a big word over the grid for a moment: what CONFIRM found)
  function declare(text, cls) {
    stamp.textContent = text;
    stamp.className = `ck-stamp ${cls}`;
    void stamp.offsetWidth;
    stamp.classList.add('show');
  }

  function write(d) {
    if (s.solved) return;
    if (sel < 0) { SFX.play('denied'); kit.note('TAP A SQUARE FIRST'); return; }
    if (s.given[sel]) { SFX.play('denied'); kit.note('A GIVEN BIT // IT STAYS'); return; }
    kit.moved();
    const m = 1 << d;
    if (notesOn) {
      if (s.v[sel]) { SFX.play('denied'); kit.note('ERASE THE BIT FIRST'); return; }
      s.n[sel] ^= m;
      SFX.play('punct');
    } else if (s.v[sel] === d) {
      s.v[sel] = 0;
      SFX.play('backspace');
    } else {
      s.v[sel] = d;
      s.n[sel] = 0;
      for (const j of PEERS[sel]) s.n[j] &= ~m; // (off the notes round it)
      SFX.play('click');
    }
    kit.save();
    render();
  }
  function erase() {
    if (s.solved || sel < 0 || s.given[sel] || (!s.v[sel] && !s.n[sel])) return;
    kit.moved();
    s.v[sel] = 0;
    s.n[sel] = 0;
    SFX.play('backspace');
    kit.save();
    render();
  }
  function confirm() {
    if (s.solved) return;
    const e = empty(s);
    if (e) {
      SFX.play('denied');
      kit.note(`INCOMPLETE // ${e} SQUARE${e === 1 ? '' : 'S'} EMPTY`);
      declare('INCOMPLETE', 'bad');
      return;
    }
    kit.moved();
    if (!s.v.every((d, i) => d === s.sol[i])) {
      s.fails++;
      kit.save();
      SFX.play('denied');
      kit.note("CHECKSUM FAILED // SOMETHING DOESN'T ADD UP");
      declare('CHECKSUM FAILED', 'bad');
      boardEl.classList.remove('shake');
      void boardEl.offsetWidth;
      boardEl.classList.add('shake');
      return;
    }
    s.solved = true;
    sel = -1;
    SFX.play('burst');
    render();
    declare('CHECKSUM VALID', 'good');
    if (typeof FX !== 'undefined') {
      const r = boardEl.getBoundingClientRect();
      FX.burst([{ rect: { left: r.left + 8, top: r.bottom - 10, width: r.width - 16, height: 6 }, type: 'number' }]);
    }
    kit.finish();
  }
  function select(i) {
    sel = sel === i ? -1 : i;
    render();
  }

  // THE ARCADE MENU's preview (arcade.js plays it): a grid filled a square at a time, the one with the
  // fewest bits it could be first (now and then its notes pencilled in before), then CHECKSUM VALID
  function demo(host) {
    const sol = solve(new Uint8Array(81), 1, (ds) => shuffle(ds, Math.random)).first;
    const given = Uint8Array.from(sol);
    shuffle(Array.from({ length: 81 }, (_, i) => i), Math.random).slice(GIVENS).forEach((i) => { given[i] = 0; });
    const x = { given, sol, v: Uint8Array.from(given), n: new Uint16Array(81), solved: false };
    const board = document.createElement('div');
    board.className = 'ck-board';
    const sq = new Array(81);
    const word = document.createElement('p');
    word.className = 'ck-stamp';
    board.replaceChildren(...boxes(sq), word);
    host.replaceChildren(board);
    paint(x, sq, -1);
    const could = (i) => { let m = ALL; for (const j of PEERS[i]) if (x.v[j]) m &= ~(1 << x.v[j]); return m; };
    let at = -1;
    return {
      step() {
        if (x.solved) return null;
        if (at >= 0) { // (the bit written in, and off the notes round it)
          x.v[at] = sol[at];
          x.n[at] = 0;
          for (const j of PEERS[at]) x.n[j] &= ~(1 << sol[at]);
          paint(x, sq, at);
          at = -1;
          return 100;
        }
        let fewest = 10;
        let pick = [];
        for (let i = 0; i < 81; i++) {
          if (x.v[i]) continue;
          const n = bits(could(i));
          if (n < fewest) { fewest = n; pick = [i]; } else if (n === fewest) pick.push(i);
        }
        if (!pick.length) {
          x.solved = true;
          paint(x, sq, -1);
          word.textContent = 'CHECKSUM VALID';
          word.className = 'ck-stamp good show';
          return 0;
        }
        at = pick[Math.floor(Math.random() * pick.length)];
        if (fewest > 1 || Math.random() < 0.15) x.n[at] = could(at); // (its notes first)
        paint(x, sq, at);
        return x.n[at] ? 380 : 110;
      },
    };
  }

  boardEl.addEventListener('click', (e) => {
    const c = e.target.closest('.ck-cell');
    if (!c || !s || s.solved) return;
    select(Number(c.dataset.i));
  });
  padEl.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (b) write(Number(b.dataset.v));
  });
  notesBtn.addEventListener('click', () => {
    notesOn = !notesOn;
    SFX.play('button');
    render();
  });
  el('ck-erase').addEventListener('click', erase);
  el('ck-confirm').addEventListener('click', confirm);

  return {
    name: 'CHECKSUM',
    rule: () => 'fill the grid, [1] to [9] once in every row, column and box.',
    make,
    pack: (x) => ({ v: [...x.v].map((d, i) => (x.given[i] ? 0 : d)).join(''), n: [...x.n], x: x.fails, s: x.solved ? 1 : 0 }),
    over: (x) => x.solved,
    timed: 'open',
    status(saved) {
      const t = kit.fmtTime((saved && saved.t) || 0);
      if (saved && saved.s) return { done: true, text: `VALID IN ${t}` };
      return { done: false, text: saved && saved.t ? `UNDER WAY // ${t}` : 'ONE GAME TODAY // TIMED' };
    },
    line,
    show(x) {
      if (x !== s) { s = x; sel = -1; notesOn = false; }
      build();
      render();
    },
    key(e) {
      if (s.solved) return false;
      const d = Number(e.key);
      if (d >= 1 && d <= 9) write(d);
      else if (e.key === '0' || e.key === 'Backspace' || e.key === 'Delete') erase();
      else if (e.key === 'n' || e.key === 'N') { notesOn = !notesOn; render(); }
      else if (e.key === 'Enter') confirm();
      else if (e.key.startsWith('Arrow')) {
        const i = sel < 0 ? 40 : sel;
        const r = ROW[i] + (e.key === 'ArrowDown') - (e.key === 'ArrowUp');
        const c = COL[i] + (e.key === 'ArrowRight') - (e.key === 'ArrowLeft');
        sel = ((r + 9) % 9) * 9 + ((c + 9) % 9);
        render();
      } else return false;
      return true;
    },
    // (square cells as big as the room allows, 44px at most)
    fit() {
      if (!s || boardEl.closest('.arcade-game').hidden) return;
      const host = boardEl.parentElement;
      const pad = 16; // (the board's padding and border)
      const gaps = 2 * 4 + 6 * 2; // (between boxes, and between squares)
      const room = host.clientHeight - padEl.offsetHeight - actsEl.offsetHeight - 16;
      const size = Math.floor(Math.min(44, (host.clientWidth - pad - gaps) / 9, (room - pad - gaps) / 9));
      boardEl.style.setProperty('--ck-cell', `${Math.max(16, size)}px`);
    },
    pay: (x) => Progress.arcadeResult('checksum', true, Math.floor(x.t / 1000)),
    best: (x) => Math.floor(x.t / 1000),
    bestText: (v) => kit.fmtTime(v * 1000),
    low: true,
    demo,
    // SHARE: the time and the failed checks, over the nine boxes, all green
    share(x) {
      const box = '\u{1F7E9}\u{1F7E9}\u{1F7E9}';
      return [`Valid in ${kit.fmtTime(x.t)}`, x.fails ? `${x.fails} failed check${x.fails === 1 ? '' : 's'}` : 'No failed checks', box, box, box];
    },
    solve, // (for testing)
  };
})());
