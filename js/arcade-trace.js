// TRACE (THE DAILY ARCADE's Tuesday game; the card around it is arcade.js): a board of encrypted blocks,
// INFECTED bits hidden under some, the same board for everyone that Tuesday, a patch of it already open
// to start from. Tap a block to decrypt it: under it, a bit counting the infected bits touching it
// (the 8 round it), or nothing, and then the blocks round it open by themselves. Tap an infected one
// and the trace fails. Hold a block (or switch the tap to FLAG) to flag it, a quarantine marker that
// keeps it from opening; tap a bit with as many flags round it as its number to open the rest round
// it. Every safe block open: the board's clean. The clock runs from the first tap.
Arcade.register('trace', (() => {
  const COLS = 9;
  const ROWS = 12;
  const N = COLS * ROWS;
  const INFECTED = 16;
  const START_MAX = 20; // (the opening patch: at most this many blocks, or the board's drawn again)
  const HOLD_MS = 380; // (a press this long flags)
  const el = (id) => document.getElementById(id);
  const boardEl = el('tr-board');
  const actsEl = el('tr-acts');
  const modeBtn = el('tr-mode');
  const kit = Arcade.kit;
  let s = null; // (the game shown: { bad, count, start, open, flag, hit } and the frame's own)
  let flagMode = false;
  let cells = [];
  let press = null; // (a finger down on a block: { i, x, y, timer, held })

  const around = (i) => {
    const r = Math.floor(i / COLS);
    const c = i % COLS;
    const out = [];
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (!dr && !dc) continue;
        const rr = r + dr;
        const cc = c + dc;
        if (rr >= 0 && rr < ROWS && cc >= 0 && cc < COLS) out.push(rr * COLS + cc);
      }
    }
    return out;
  };
  // The board from the day's seed: the infected blocks, each block's count, and the start (a block
  // with nothing round it, opened before the first tap, so nobody's first tap is a guess: of those,
  // the one that opens the least, so it's a foothold, not half the board)
  function make(rand, saved) {
    let x = null;
    let order = null;
    let least = Infinity;
    for (let tries = 0; tries < 12 && least > START_MAX; tries++) { // (a board with no small opening: another, from the same seed)
      const o = Array.from({ length: N }, (_, i) => i);
      for (let i = N - 1; i > 0; i--) {
        const j = Math.floor(rand() * (i + 1));
        [o[i], o[j]] = [o[j], o[i]];
      }
      const bad = new Uint8Array(N);
      o.slice(0, INFECTED).forEach((i) => { bad[i] = 1; });
      const count = Array.from({ length: N }, (_, i) => around(i).filter((j) => bad[j]).length);
      const b = { bad, count, start: -1, open: new Uint8Array(N), flag: new Uint8Array(N), hit: -1, won: false };
      for (const i of o) {
        if (bad[i] || count[i]) continue;
        const size = flood({ ...b, open: new Uint8Array(N) }, i).length;
        if (size < least) { least = size; b.start = i; x = b; order = o; }
      }
      if (!x) { x = b; order = o; } // (no empty block at all: kept only if nothing better turns up)
    }
    if (x.start < 0) x.start = order.find((i) => !x.bad[i]);
    const { bad, start } = x;
    const ok = (v) => typeof v === 'string' && v.length === N && /^[01]+$/.test(v);
    if (saved && ok(saved.o)) {
      [...saved.o].forEach((v, i) => { x.open[i] = +v; });
      if (ok(saved.f)) [...saved.f].forEach((v, i) => { x.flag[i] = +v && !x.open[i] ? 1 : 0; });
      x.hit = Number.isInteger(saved.h) && saved.h >= 0 && saved.h < N && bad[saved.h] ? saved.h : -1;
      x.won = !!saved.w;
    } else flood(x, start);
    return x;
  }
  // (a block opened, and if nothing touches it, the blocks round it too, on out: those opened)
  function flood(x, i) {
    const opened = [];
    const todo = [i];
    while (todo.length) {
      const j = todo.pop();
      if (x.open[j] || x.flag[j] || x.bad[j]) continue;
      x.open[j] = 1;
      opened.push(j);
      if (!x.count[j]) todo.push(...around(j).filter((k) => !x.open[k]));
    }
    return opened;
  }
  const left = (x) => INFECTED - x.flag.reduce((a, v) => a + v, 0);
  const safeLeft = (x) => N - INFECTED - x.open.reduce((a, v) => a + v, 0);
  const over = (x) => x.won || x.hit >= 0;

  // THE BOARD: a square per block, drawn from the game (encrypted, flagged, open with its bit or
  // nothing; once it's over the infected ones showing, the one hit in red, wrong flags crossed)
  function build() {
    cells = Array.from({ length: N }, (_, i) => {
      const c = document.createElement('span');
      c.className = 'cell';
      c.dataset.i = String(i);
      return c;
    });
    boardEl.replaceChildren(...cells);
  }
  const FLAG_SVG = '<svg class="tr-flag" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="6.5"/><path d="M12 2.5v5M12 16.5v5M2.5 12h5M16.5 12h5"/></svg>';
  function render() {
    const done = over(s);
    cells.forEach((c, i) => {
      let cls = 'cell';
      let html = '';
      let label = 'Encrypted block';
      if (s.open[i]) {
        const n = s.count[i];
        cls += n ? ' disc tr-open' : ' tr-open tr-zero';
        label = n ? `${n} infected round it` : 'Clear';
        if (n) { c.className = cls; fillBit(c, n); c.setAttribute('aria-label', label); return; }
      } else if (done && s.bad[i]) {
        cls += ` tr-bad${i === s.hit ? ' tr-hit' : ''}${s.won ? ' tr-caught' : ''}`;
        html = VIRUS_SVG;
        label = 'Infected';
      } else if (s.flag[i]) {
        cls += ` firewall tr-flagged${done && !s.bad[i] ? ' tr-wrong' : ''}`;
        html = FLAG_SVG;
        label = 'Flagged';
      } else cls += ' firewall tr-hidden';
      c.className = cls;
      c.innerHTML = html;
      c.setAttribute('aria-label', label);
    });
    boardEl.classList.toggle('tr-over', done);
    actsEl.hidden = done;
    modeBtn.textContent = flagMode ? 'TAP: FLAG' : 'TAP: OPEN';
    modeBtn.classList.toggle('on', flagMode);
    modeBtn.setAttribute('aria-pressed', String(flagMode));
    kit.refresh();
  }
  function line(x) {
    const time = kit.fmtTime(x.t);
    if (x.won) return `BOARD CLEAN IN ${time}${x.k ? ` // +${x.k} KEYS` : ''}`;
    if (x.hit >= 0) return `INFECTED // TRACE FAILED AT ${time}`;
    if (!x.moved) return `CLEAR THE BOARD // ${INFECTED} INFECTED HIDDEN`;
    return `TIME ${time} // ${left(x)} INFECTED LEFT`;
  }

  // (each block opened bursts as a bit decrypts: a few at most, a big opening shouldn't flood the screen)
  function burst(list) {
    if (typeof FX === 'undefined' || !list.length) return;
    FX.burst(list.slice(0, 24).map((i) => ({ el: cells[i], type: 'firewall' })));
  }
  function open(i) {
    if (over(s) || s.open[i] || s.flag[i]) return;
    kit.moved();
    if (s.bad[i]) { lose(i); return; }
    const opened = flood(s, i);
    burst(opened);
    SFX.play(opened.length > 1 ? 'burst' : 'click');
    if (!safeLeft(s)) { win(); return; }
    kit.save();
    render();
  }
  // (a bit with as many flags round it as its number: the rest round it opened)
  function chord(i) {
    const nb = around(i);
    if (!s.count[i] || nb.filter((j) => s.flag[j]).length !== s.count[i]) return;
    const shut = nb.filter((j) => !s.open[j] && !s.flag[j]);
    if (!shut.length) return;
    kit.moved();
    const hit = shut.find((j) => s.bad[j]);
    if (hit !== undefined) { lose(hit); return; }
    const opened = shut.flatMap((j) => flood(s, j));
    burst(opened);
    SFX.play('burst');
    if (!safeLeft(s)) { win(); return; }
    kit.save();
    render();
  }
  function flag(i) {
    if (over(s) || s.open[i]) return;
    kit.moved();
    s.flag[i] = s.flag[i] ? 0 : 1;
    SFX.play('punct');
    kit.save();
    render();
  }
  function tap(i) {
    if (s.open[i]) chord(i);
    else if (flagMode) flag(i);
    else open(i);
  }
  function lose(i) {
    s.hit = i;
    SFX.play('alert');
    render();
    if (typeof FX !== 'undefined') FX.burst([{ el: cells[i], type: 'warning' }]);
    kit.finish();
  }
  function win() {
    s.won = true;
    for (let i = 0; i < N; i++) if (s.bad[i]) s.flag[i] = 1;
    SFX.play('burst');
    render();
    cells.forEach((c, i) => { if (s.bad[i]) c.style.animationDelay = `${(Math.floor(i / COLS) + (i % COLS)) * 25}ms`; });
    kit.finish();
  }

  // TAPS AND HOLDS: a tap opens (or flags, with FLAG on, or opens round a bit); a hold flags; a
  // right click flags too. A finger sliding off doesn't count
  boardEl.addEventListener('pointerdown', (e) => {
    const c = e.target.closest('.cell');
    if (!c || !s || over(s)) return;
    const i = Number(c.dataset.i);
    if (e.button === 2) { flag(i); return; }
    clearTimeout(press && press.timer);
    press = { i, x: e.clientX, y: e.clientY, held: false };
    press.timer = setTimeout(() => {
      if (!press || press.i !== i || s.open[i]) return;
      press.held = true;
      flag(i);
    }, HOLD_MS);
  });
  boardEl.addEventListener('pointermove', (e) => {
    if (press && Math.hypot(e.clientX - press.x, e.clientY - press.y) > 12) { clearTimeout(press.timer); press = null; }
  });
  boardEl.addEventListener('pointerup', () => {
    if (!press) return;
    clearTimeout(press.timer);
    if (!press.held) tap(press.i);
    press = null;
  });
  const cancel = () => { if (press) { clearTimeout(press.timer); press = null; } };
  boardEl.addEventListener('pointercancel', cancel);
  boardEl.addEventListener('pointerleave', cancel);
  boardEl.addEventListener('contextmenu', (e) => e.preventDefault()); // (a hold isn't the phone's menu)
  modeBtn.addEventListener('click', () => {
    flagMode = !flagMode;
    SFX.play('button');
    render();
  });

  return {
    name: 'TRACE',
    rule: () => 'clear the board without touching an infected bit.',
    make,
    pack: (x) => ({ o: x.open.join(''), f: x.flag.join(''), h: x.hit, w: x.won ? 1 : 0 }),
    over,
    timed: 'move',
    status(saved) {
      const t = kit.fmtTime((saved && saved.t) || 0);
      if (saved && saved.w) return { done: true, text: `CLEAN IN ${t}` };
      if (saved && saved.h >= 0) return { done: true, text: `INFECTED AT ${t}` };
      return { done: false, text: saved && saved.m ? `UNDER WAY // ${t}` : `ONE GAME TODAY // ${INFECTED} INFECTED` };
    },
    line,
    show(x) {
      if (x !== s) { s = x; flagMode = false; }
      build();
      render();
    },
    key: () => false,
    leave() { cancel(); },
    // (square blocks as big as the room allows, 40px at most)
    fit() {
      if (!s || boardEl.closest('.arcade-game').hidden) return;
      const host = boardEl.parentElement;
      const gap = 3;
      const pad = 16; // (the board's padding and border)
      const room = host.clientHeight - actsEl.offsetHeight - 8;
      const size = Math.floor(Math.min(40, (host.clientWidth - pad - gap * (COLS - 1)) / COLS, (room - pad - gap * (ROWS - 1)) / ROWS));
      boardEl.style.setProperty('--tr-cell', `${Math.max(14, size)}px`);
    },
    pay: (x) => Progress.arcadeResult('trace', x.won, Math.floor(x.t / 1000)),
    best: (x) => (x.won ? Math.floor(x.t / 1000) : null),
    bestText: (v) => kit.fmtTime(v * 1000),
    low: true,
    // SHARE: the result, and how much of the board was cleared, as a bar
    share(x) {
      const cleared = x.open.reduce((a, v) => a + v, 0);
      const pct = Math.round((cleared / (N - INFECTED)) * 100);
      const bar = '\u{1F7E9}'.repeat(Math.round(pct / 10)) + '⬛'.repeat(10 - Math.round(pct / 10));
      return [x.won ? `Board clean in ${kit.fmtTime(x.t)}` : `Infected at ${kit.fmtTime(x.t)} // ${pct}% cleared`, bar];
    },
  };
})());
