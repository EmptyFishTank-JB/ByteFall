// DEFRAG (THE ARCADE's Friday game; the card around it is arcade.js): swap-and-match on the bits. A 7x7
// board full of bits, [1] to [6], each number its own color (MONOCHROME: none; the numbers tell them apart). Swap two side by side (a swipe from one
// into the other, or a tap on each) and 4 or more of a number touching (up, down, left, right: a line,
// an L, a T, a square) decrypt; the bits above fall, new ones drop in, and whatever the fall puts
// together decrypts too, each fall a chain link worth more (a bit dropping in never makes a group by
// itself: what falls into place is what chains). A swap that matches nothing swaps back.
// ENCRYPTED bits can't be swapped or matched till a match beside them cracks them; INFECTED bits spread
// to a bit beside them every SPREAD_EVERY swaps, till a match on or beside one cleans it, and each one
// left at the end costs points. No swap left: the bits are dealt again, free. SWAPS swaps for the best
// score. Made from the date: the same board, and the same bits dropping in (in order, wherever they
// land), for everyone that Friday.
Arcade.register('defrag', (() => {
  const SIZE = 7;
  const CELLS = SIZE * SIZE;
  const KINDS = 6;
  const MATCH = 4;
  const SWAPS = 30;
  const LOCKS = 6; // (encrypted bits dealt)
  const INFECTED = 2; // (infected bits dealt)
  const SPREAD_EVERY = 5;
  const PTS = { crack: 30, clean: 20, left: 20 }; // (a bit decrypted: 5 x (its group's size - 2), x the chain link)
  const HINT_MS = 6000;
  const SWAP_MS = 150;
  const POP_MS = 230;
  const FALL_MS = 270;
  // (each number's color, [1] to [6]: red, orange, yellow, green, cyan, violet)
  const HUES = ['255, 90, 110', '255, 159, 67', '255, 217, 61', '61, 220, 132', '61, 214, 255', '199, 125, 255'];
  const el = (id) => document.getElementById(id);
  const boardEl = el('df-board');
  const hintEl = el('df-hint');
  const kit = Arcade.kit;
  let s = null; // (the game shown: { cells, score, swaps, best, cracked, cleaned, over, left, nextId, r, draws } and the frame's own)
  let view = null;
  let busy = false; // (a swap playing out)
  let timers = [];
  let sel = -1; // (a bit tapped, waiting for its neighbor)
  let press = null;
  let hintTimer = 0;

  const rc = (i) => [Math.floor(i / SIZE), i % SIZE];
  const around = (i) => { const [r, c] = rc(i); return [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]].filter(([y, x]) => y >= 0 && y < SIZE && x >= 0 && x < SIZE).map(([y, x]) => y * SIZE + x); };
  const near = (a, b) => around(a).includes(b);
  // (the group a bit is in: it and every bit of its number touching, on through them; encrypted bits
  // join nothing)
  function groupAt(cells, i) {
    const t = cells[i];
    if (!t || t.lock) return [];
    const seen = new Set([i]);
    const todo = [i];
    while (todo.length) {
      const j = todo.pop();
      for (const k of around(j)) {
        const u = cells[k];
        if (!seen.has(k) && u && !u.lock && u.v === t.v) { seen.add(k); todo.push(k); }
      }
    }
    return [...seen];
  }
  // (every group of MATCH or more)
  function groups(cells) {
    const seen = new Set();
    const out = [];
    for (let i = 0; i < CELLS; i++) {
      if (seen.has(i) || !cells[i] || cells[i].lock) continue;
      const g = groupAt(cells, i);
      g.forEach((j) => seen.add(j));
      if (g.length >= MATCH) out.push(g);
    }
    return out;
  }
  // (the swaps that would match: [a, b], each a bit and the one right of or under it)
  function swapsFor(x) {
    const out = [];
    const c = x.cells;
    for (let i = 0; i < CELLS; i++) {
      for (const j of [i + 1, i + SIZE]) {
        if (j >= CELLS || (j === i + 1 && j % SIZE === 0)) continue;
        if (c[i].lock || c[j].lock || c[i].v === c[j].v) continue;
        [c[i], c[j]] = [c[j], c[i]];
        const ok = groupAt(c, i).length >= MATCH || groupAt(c, j).length >= MATCH;
        [c[i], c[j]] = [c[j], c[i]];
        if (ok) out.push([i, j]);
      }
    }
    return out;
  }
  // (new numbers on every bit but the encrypted, none of them MATCH together yet, till a swap would match)
  function deal(x, fresh) {
    for (let tries = 0; tries < 50; tries++) {
      for (let i = 0; i < CELLS; i++) {
        const t = fresh ? (x.cells[i] = { id: x.nextId++, v: 0 }) : x.cells[i];
        if (t.lock && !fresh) continue;
        t.v = 0;
        const start = Math.floor(x.r() * KINDS);
        for (let k = 0; k < KINDS; k++) {
          t.v = 1 + ((start + k) % KINDS);
          if (groupAt(x.cells.slice(0, i + 1), i).length < MATCH) break;
        }
      }
      if (fresh) {
        const order = Array.from({ length: CELLS }, (_, i) => i);
        for (let i = CELLS - 1; i > 0; i--) { const j = Math.floor(x.r() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
        order.slice(0, LOCKS).forEach((i) => { x.cells[i].lock = true; });
        order.slice(LOCKS, LOCKS + INFECTED).forEach((i) => { x.cells[i].inf = true; });
        fresh = false; // (another try deals the numbers only)
      }
      if (!groups(x.cells).length && swapsFor(x).length) return;
    }
  }
  function make(rand, saved) {
    let draws = 0;
    const x = { cells: [], score: 0, swaps: 0, best: 0, cracked: 0, cleaned: 0, over: false, left: 0, nextId: 1, r: () => { draws++; return rand(); }, draws: () => draws };
    deal(x, true);
    const ok = saved && Array.isArray(saved.c) && saved.c.length === CELLS && saved.c.every((n) => Number.isInteger(n) && (n & 7) >= 1 && (n & 7) <= KINDS)
      && Number.isInteger(saved.d) && saved.d >= draws && Number.isInteger(saved.n) && saved.n >= 0 && saved.n <= SWAPS;
    if (ok) {
      while (draws < saved.d) x.r(); // (the seed's numbers to where it was)
      x.cells = saved.c.map((n) => ({ id: x.nextId++, v: n & 7, lock: !!(n & 8), inf: !!(n & 16) }));
      x.score = saved.s || 0;
      x.swaps = saved.n;
      x.best = saved.b || 0;
      x.cracked = saved.k || 0;
      x.cleaned = saved.e || 0;
      x.left = saved.l || 0;
      x.over = !!saved.o;
    }
    return x;
  }
  const infectedLeft = (x) => x.cells.filter((t) => t.inf).length;
  // (how each bit looks right now: its number, encrypted, infected)
  const looks = (x) => new Map(x.cells.map((t) => [t, { v: t.v, lock: !!t.lock, inf: !!t.inf }]));

  // A SWAP: the two bits traded; then while MATCH or more of a number touch, they decrypt (cracking the
  // encrypted beside them, cleaning the infected on or beside them), the bits above fall and new ones
  // drop in, each round a chain link; then, every SPREAD_EVERY swaps, the infection spreads, and with
  // no swap left the bits are dealt again. All worked out at once (and saved): what it returns is for
  // the board to play out, round by round. Nothing matched: null (the bits go back)
  function swap(x, i, j) {
    const c = x.cells;
    [c[i], c[j]] = [c[j], c[i]];
    if (!groups(c).length) { [c[i], c[j]] = [c[j], c[i]]; return null; }
    x.swaps++;
    const res = { swapped: c.slice(), rounds: [], spread: null, redealt: false };
    let chain = 0;
    for (let gs = groups(c); gs.length; gs = groups(c)) {
      chain++;
      const gone = new Set(gs.flat());
      let pts = gs.reduce((n, g) => n + g.length * 5 * (g.length - 2), 0) * chain;
      const cracked = [];
      const cleaned = [];
      for (const k of gone) {
        if (c[k].inf && !cleaned.includes(c[k])) cleaned.push(c[k]);
        for (const m of around(k)) {
          const t = c[m];
          if (gone.has(m)) continue;
          if (t.lock && !cracked.includes(t)) cracked.push(t);
          else if (t.inf && !cleaned.includes(t)) cleaned.push(t);
        }
      }
      cracked.forEach((t) => { t.lock = false; });
      cleaned.forEach((t) => { t.inf = false; });
      pts += cracked.length * PTS.crack + cleaned.length * PTS.clean;
      x.score += pts;
      x.cracked += cracked.length;
      x.cleaned += cleaned.length;
      const goneTiles = [...gone].map((k) => c[k]);
      // (the fall: down each column the bits left settle to the bottom; then new ones fill the columns
      // from the top, each starting as far above the board as there are new ones in its column. A new
      // bit never makes a group of MATCH itself (its number moved on till it doesn't, as when dealt):
      // what falls into place is what chains)
      const born = new Map();
      const fresh = [];
      for (let col = 0; col < SIZE; col++) {
        const kept = [];
        for (let r = SIZE - 1; r >= 0; r--) { const k = r * SIZE + col; if (!gone.has(k)) kept.push(c[k]); }
        fresh[col] = SIZE - kept.length;
        for (let r = SIZE - 1, n = 0; r >= 0; r--, n++) c[r * SIZE + col] = n < kept.length ? kept[n] : null;
      }
      for (let col = 0; col < SIZE; col++) {
        for (let r = fresh[col] - 1; r >= 0; r--) {
          const k = r * SIZE + col;
          const t = c[k] = { id: x.nextId++, v: 0 };
          const start = Math.floor(x.r() * KINDS);
          for (let m = 0; m < KINDS; m++) {
            t.v = 1 + ((start + m) % KINDS);
            if (groupAt(c, k).length < MATCH) break;
          }
          born.set(t, r - fresh[col]);
        }
      }
      res.rounds.push({ gone: goneTiles, cracked, cleaned, born, after: c.slice(), looks: looks(x), chain, pts });
    }
    x.best = Math.max(x.best, chain);
    if (x.swaps % SPREAD_EVERY === 0) { // (the infection: one infected bit passes it to a bit beside it)
      const from = [];
      c.forEach((t, k) => { if (t.inf) around(k).forEach((m) => { if (!c[m].inf && !c[m].lock) from.push(m); }); });
      if (from.length) { res.spread = c[from[Math.floor(x.r() * from.length)]]; res.spread.inf = true; }
    }
    if (x.swaps >= SWAPS) {
      x.over = true;
      x.left = infectedLeft(x);
      x.score = Math.max(0, x.score - x.left * PTS.left);
    } else if (!swapsFor(x).length) {
      deal(x, false);
      res.redealt = true;
    }
    res.end = looks(x);
    return res;
  }

  // THE BOARD: the 49 squares under, and the bits over them, each its own box moving from square to
  // square (--x, --y), new ones dropping in from above (the game's, or the ARCADE menu's preview's)
  function boardView(board) {
    const els = new Map(); // (bit -> its element)
    let layer = null;
    const place = (e, i, row) => { e.style.setProperty('--x', i % SIZE); e.style.setProperty('--y', row === undefined ? Math.floor(i / SIZE) : row); };
    function face(e, look) {
      const key = `${look.v}${look.lock ? 'l' : ''}${look.inf ? 'i' : ''}`;
      if (e.dataset.f === key) return;
      e.dataset.f = key;
      e.className = `cell disc df-tile${look.lock ? ' df-lock' : ''}${look.inf ? ' infected' : ''}`;
      e.style.setProperty('--df', HUES[look.v - 1]);
      fillBit(e, look.v);
      if (look.inf) e.insertAdjacentHTML('beforeend', `<span class="inf-mark" aria-hidden="true">${VIRUS_SVG}</span>`);
      e.setAttribute('aria-label', `${look.lock ? 'Encrypted ' : look.inf ? 'Infected ' : ''}${look.v}`);
    }
    return {
      build() {
        els.clear();
        layer = document.createElement('div');
        layer.className = 'df-tiles';
        const slots = Array.from({ length: CELLS }, (_, i) => {
          const c = document.createElement('span');
          c.className = 'cell df-slot';
          c.dataset.i = String(i);
          return c;
        });
        board.replaceChildren(...slots, layer);
      },
      // (the bits where cells has them, as look has them; born: new ones, from the row above the board
      // each starts at)
      show(cells, look, born) {
        const live = new Set(cells);
        for (const [t, e] of els) if (!live.has(t)) { e.remove(); els.delete(t); }
        const dropping = [];
        cells.forEach((t, i) => {
          let e = els.get(t);
          if (!e) {
            e = document.createElement('span');
            els.set(t, e);
            if (born && born.has(t)) { place(e, i, born.get(t)); dropping.push([e, i]); } else place(e, i);
            layer.appendChild(e);
          } else place(e, i);
          face(e, look.get(t));
        });
        if (dropping.length) {
          void layer.offsetWidth; // (laid out above the board first, then let fall)
          for (const [e, i] of dropping) place(e, i);
        }
      },
      // (two bits trading places on screen, as they stand in cells; home: back where cells has them)
      trade(cells, i, j) { place(els.get(cells[i]), j); place(els.get(cells[j]), i); },
      home(cells, ...at) { at.forEach((i) => place(els.get(cells[i]), i)); },
      pop(tiles) { tiles.forEach((t) => { const e = els.get(t); if (e) e.classList.add('df-pop'); }); },
      look(tiles, look) { tiles.forEach((t) => { const e = els.get(t); if (e && look.has(t)) face(e, look.get(t)); }); },
      falling(on) { layer.classList.toggle('df-falling', on); },
      el: (t) => els.get(t),
      mark(tiles, cls) { for (const e of els.values()) e.classList.remove(cls); tiles.forEach((t) => { const e = els.get(t); if (e) e.classList.add(cls); }); },
    };
  }
  // A swap played out on a board (v), as [what to do, ms till the next]: the two bits trading places
  // (and back, if it matched nothing), then each round the bits decrypting (popping; the encrypted
  // beside cracking, the infected cleaned) and the rest falling, new ones dropping in; then the
  // infection spreading, or the bits dealt again. loud: the game's own (its sounds, notes and bursts),
  // not the preview's
  function movie(v, before, i, j, res, loud) {
    const q = [[() => v.trade(before, i, j), SWAP_MS]];
    if (!res) {
      q.push([() => { v.home(before, i, j); if (loud) { SFX.play('denied'); kit.note('NO MATCH // 4 OF A NUMBER MUST TOUCH', 1400); } }, SWAP_MS]);
      return q;
    }
    res.rounds.forEach((r) => {
      q.push([() => {
        v.pop(r.gone);
        v.look([...r.cracked, ...r.cleaned], r.looks);
        if (!loud) return;
        if (typeof FX !== 'undefined') FX.burst(r.gone.map((t) => ({ el: v.el(t), type: 'number' })).filter((b) => b.el).slice(0, 24));
        SFX.play('burst', 1 + Math.min(0.6, (r.chain - 1) * 0.15));
        const bits = [r.chain > 1 ? `CHAIN x${r.chain}` : '', r.cracked.length ? `${r.cracked.length > 1 ? `${r.cracked.length} ` : ''}ENCRYPTED CRACKED` : '', r.cleaned.length ? `${r.cleaned.length > 1 ? `${r.cleaned.length} ` : ''}INFECTED CLEANED` : ''].filter(Boolean);
        if (bits.length) kit.note(bits.join(' // '), 1200);
      }, POP_MS]);
      q.push([() => { v.falling(true); v.show(r.after, r.looks, r.born); }, FALL_MS]);
    });
    q.push([() => {
      v.falling(false);
      v.show(res.rounds[res.rounds.length - 1].after, res.end);
      if (res.spread) { v.mark([res.spread], 'df-spread'); if (loud) { SFX.play('alert'); kit.note('THE INFECTION SPREADS', 1400); } }
      if (res.redealt && loud) { SFX.play('static'); kit.note('NO SWAP LEFT // THE BITS DEALT AGAIN', 1600); }
    }, res.spread || res.redealt ? 420 : 60]);
    return q;
  }

  // THE GAME'S BOARD
  function render() {
    boardEl.classList.toggle('df-over', s.over);
    hintEl.hidden = s.over;
    kit.refresh();
  }
  function line(x) {
    if (x.over) return `SCORE ${fmt(x.score)} // CHAIN x${Math.max(1, x.best)}`;
    if (!x.swaps) return `${MATCH} TOUCHING DECRYPT // ${SWAPS} SWAPS`;
    const inf = infectedLeft(x);
    return `SCORE ${fmt(x.score)} // ${SWAPS - x.swaps} SWAPS LEFT // ${inf ? `${inf} INFECTED` : 'CLEAN'}`;
  }
  function stopTimers() { timers.forEach(clearTimeout); timers = []; busy = false; }
  // (a swap's movie played; then the board as the game has it, and the end, if it's come)
  function play(q) {
    busy = true;
    let k = 0;
    const next = () => {
      if (k >= q.length) {
        busy = false;
        timers = [];
        view.show(s.cells, looks(s));
        render();
        if (s.over) {
          const stamp = document.createElement('p');
          stamp.className = 'ck-stamp good show';
          stamp.textContent = 'DEFRAGMENTED';
          boardEl.appendChild(stamp);
          SFX.play('burst');
          if (s.left) kit.note(`${s.left} INFECTED LEFT // -${s.left * PTS.left}`, 2000);
          kit.finish();
        } else idle();
        return;
      }
      const [f, ms] = q[k++];
      f();
      timers.push(setTimeout(next, ms));
    };
    next();
  }
  function trySwap(i, j) {
    if (busy || s.over || !near(i, j)) return;
    select(-1);
    const a = s.cells[i];
    const b = s.cells[j];
    if (a.lock || b.lock) { SFX.play('denied'); kit.note('ENCRYPTED // A MATCH BESIDE IT CRACKS IT', 1600); return; }
    const before = s.cells.slice();
    const res = swap(s, i, j);
    if (res) { kit.moved(); kit.save(); SFX.play('click'); }
    play(movie(view, before, i, j, res, true));
  }
  function select(i) {
    sel = i;
    view.mark(i >= 0 ? [s.cells[i]] : [], 'df-sel');
  }
  // (idle a while: a swap that works pulses)
  function idle() {
    clearTimeout(hintTimer);
    if (!s || s.over || !kit.isOpen()) return;
    hintTimer = setTimeout(() => {
      if (busy || s.over || boardEl.closest('.arcade-game').hidden) return;
      const all = swapsFor(s);
      if (all.length) { const [a, b] = all[Math.floor(Math.random() * all.length)]; view.mark([s.cells[a], s.cells[b]], 'df-hinted'); }
    }, HINT_MS);
  }
  function unhint() { clearTimeout(hintTimer); view.mark([], 'df-hinted'); }

  // SWIPES AND TAPS: a swipe from a bit trades it with the one it went toward; a tap picks a bit, a tap
  // on one beside it trades them (a tap on it again, or on one further off, picks again)
  const slotAt = (e) => { const c = e.target.closest('.df-slot'); return c ? Number(c.dataset.i) : -1; };
  boardEl.addEventListener('pointerdown', (e) => {
    if (!s || s.over || busy) return;
    const i = slotAt(e);
    if (i < 0) return;
    unhint();
    press = { i, x: e.clientX, y: e.clientY, done: false };
  });
  boardEl.addEventListener('pointermove', (e) => {
    if (!press || press.done) return;
    const dx = e.clientX - press.x;
    const dy = e.clientY - press.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 16) return;
    press.done = true;
    const [r, c] = rc(press.i);
    const [tr, tc] = Math.abs(dx) > Math.abs(dy) ? [r, c + Math.sign(dx)] : [r + Math.sign(dy), c];
    if (tr >= 0 && tr < SIZE && tc >= 0 && tc < SIZE) trySwap(press.i, tr * SIZE + tc);
  });
  boardEl.addEventListener('pointerup', () => {
    if (!press) return;
    const { i, done } = press;
    press = null;
    if (done || busy || s.over) { idle(); return; }
    if (sel >= 0 && near(sel, i)) trySwap(sel, i);
    else if (s.cells[i].lock) { select(-1); SFX.play('denied'); kit.note('ENCRYPTED // A MATCH BESIDE IT CRACKS IT', 1600); }
    else { select(sel === i ? -1 : i); SFX.play('click'); }
    idle();
  });
  boardEl.addEventListener('pointercancel', () => { press = null; });

  // THE ARCADE MENU's preview (arcade.js plays it): DEMO_SWAPS swaps played by themselves, each the one
  // that decrypts the most at once
  const DEMO_SWAPS = 10;
  function demo(host) {
    const x = make(Math.random);
    const board = document.createElement('div');
    board.className = 'df-board';
    host.replaceChildren(board);
    const v = boardView(board);
    v.build();
    v.show(x.cells, looks(x));
    const q = [];
    let n = 0;
    return {
      step() {
        if (!q.length) {
          if (n >= DEMO_SWAPS || x.over) return null;
          const all = swapsFor(x);
          if (!all.length) return null;
          let best = [];
          let most = 0;
          for (const [a, b] of all) {
            [x.cells[a], x.cells[b]] = [x.cells[b], x.cells[a]];
            const size = groups(x.cells).reduce((m, g) => m + g.length, 0);
            [x.cells[a], x.cells[b]] = [x.cells[b], x.cells[a]];
            if (size > most) { most = size; best = [[a, b]]; } else if (size === most) best.push([a, b]);
          }
          const [a, b] = best[Math.floor(Math.random() * best.length)];
          const before = x.cells.slice();
          q.push([() => v.mark([before[a]], 'df-sel'), 260], [() => v.mark([], 'df-sel'), 0], ...movie(v, before, a, b, swap(x, a, b), false), [() => {}, 420]);
          n++;
        }
        const [f, ms] = q.shift();
        f();
        return ms;
      },
    };
  }

  return {
    name: 'DEFRAG',
    rule: () => `swap bits side by side; ${MATCH} of a number touching decrypt.`,
    make,
    pack: (x) => ({ c: x.cells.map((t) => t.v | (t.lock ? 8 : 0) | (t.inf ? 16 : 0)), d: x.draws(), s: x.score, n: x.swaps, b: x.best, k: x.cracked, e: x.cleaned, l: x.left, o: x.over ? 1 : 0 }),
    over: (x) => x.over,
    timed: null,
    status(saved) {
      if (saved && saved.o) return { done: true, text: `SCORE ${fmt(saved.s || 0)} // CHAIN x${Math.max(1, saved.b || 0)}` };
      return { done: false, text: saved && saved.n ? `UNDER WAY // ${SWAPS - saved.n} SWAPS LEFT` : `ONE GAME TODAY // ${SWAPS} SWAPS` };
    },
    line,
    show(x) {
      if (x !== s) { s = x; sel = -1; }
      stopTimers();
      view = view || boardView(boardEl);
      view.build();
      view.show(s.cells, looks(s));
      render();
      idle();
    },
    key: () => false,
    leave() { stopTimers(); unhint(); press = null; sel = -1; },
    // (square bits as big as the room allows, 60px at most)
    fit() {
      if (!s || boardEl.closest('.arcade-game').hidden) return;
      const host = boardEl.parentElement;
      const gap = 4;
      const pad = 18; // (the board's padding and border)
      const room = host.clientHeight - hintEl.offsetHeight - 8;
      const size = Math.floor(Math.min(60, (host.clientWidth - pad - gap * (SIZE - 1)) / SIZE, (room - pad - gap * (SIZE - 1)) / SIZE));
      boardEl.style.setProperty('--df-cell', `${Math.max(28, size)}px`);
    },
    best: (x) => x.score,
    bestText: (v) => `${fmt(v)} POINTS`,
    low: false,
    demo,
    // SHARE: the score and best chain, what was cracked and what was left infected
    share(x) {
      return [`Score ${fmt(x.score)} // best chain x${Math.max(1, x.best)}`, `${x.cracked}/${LOCKS} encrypted cracked // ${x.left ? `${x.left} infected left` : 'no infection left'}`];
    },
    swap, swapsFor, // (for testing)
  };
})());
