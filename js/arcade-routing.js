// ROUTING (THE ARCADE's Sunday game; the card around it is arcade.js): Flow's rules on the bits. A 7x7
// grid with six to eight pairs of bits on it, [1] up, each pair in its own color: route a line from each
// bit to its twin, square to square (up, down, left, right), the lines never crossing, till every pair
// is linked and every square has a line through it. Drag from a bit (or from a line's end, to carry it
// on) through the squares; back over the line to take it back; across another line to cut it there.
// Every grid has one way through only, and it fills every square, and a pair's bits are never side
// by side (corner to corner is fine): made from the date (one path through every square, shuffled
// about, cut into runs that never run alongside themselves, their ends the pairs), each checked by a
// solver and drawn again till it has one answer. The clock runs from the first line drawn.
Arcade.register('routing', (() => {
  const N = 7;
  const MIN_PAIRS = 6;
  const MAX_PAIRS = 8;
  // (each pair's color, [1] to [8]: red, orange, yellow, green, cyan, blue, violet, pink)
  const HUES = ['255, 90, 110', '255, 159, 67', '255, 217, 61', '61, 220, 132', '61, 214, 255', '107, 140, 255', '199, 125, 255', '255, 125, 200'];
  const el = (id) => document.getElementById(id);
  const boardEl = el('rt-board');
  const actsEl = el('rt-acts');
  const kit = Arcade.kit;
  let s = null; // (the game shown: { ends, paths, endAt, won } and the frame's own)
  let cells = [];
  let svg = null;
  let drag = null; // (a line being drawn: its pair)
  let pending = null; // (that drag's route, counted at its first change: { pair, fresh })

  const rc = (i) => [Math.floor(i / N), i % N];
  const adjacent = (a, b) => { const [ra, ca] = rc(a); const [rb, cb] = rc(b); return Math.abs(ra - rb) + Math.abs(ca - cb) === 1; };
  const around = (i) => { const [r, c] = rc(i); return [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]].filter(([y, x]) => y >= 0 && y < N && x >= 0 && x < N).map(([y, x]) => y * N + x); };
  // (a line n squares long: its tick's pitch, higher with every square however long it gets: about a
  // semitone a square at first, less as it goes, still near a third of one at 39, the longest a line
  // can be; SFX.count's tick is 880 + 700p Hz)
  const rise = (n) => (880 * Math.pow(2, (16 * Math.log(1 + n / 16)) / 12) - 880) / 700;
  // One path through every square: a snake back and forth, then shuffled by "backbites" (one end
  // stepping onto a square beside it and the path re-joined round it), many times over
  function wander(rand, turns = N * N * 60) {
    let path = [];
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) path.push(r * N + (r % 2 ? N - 1 - c : c));
    const at = new Int16Array(N * N);
    const index = () => path.forEach((cell, i) => { at[cell] = i; });
    index();
    for (let it = 0; it < turns; it++) {
      if (rand() < 0.5) { path.reverse(); index(); }
      const end = path[path.length - 1];
      const nb = around(end);
      const n = nb[Math.floor(rand() * nb.length)];
      const i = at[n];
      if (i === path.length - 2) continue;
      path = path.slice(0, i + 1).concat(path.slice(i + 1).reverse());
      index();
    }
    return path;
  }
  // (cut along the path: a run ends where the next square would touch it anywhere but its end (so no
  // line runs alongside itself, and a pair's bits are never side by side; corner to corner is fine),
  // or at a length picked at random)
  function cut(path, rand) {
    const runs = [];
    let run = [];
    let len = 5 + Math.floor(rand() * 9);
    for (const c of path) {
      const touches = run.slice(0, -1).some((x) => adjacent(x, c));
      if (run.length && (touches || run.length >= len)) { runs.push(run); run = []; len = 5 + Math.floor(rand() * 9); }
      run.push(c);
    }
    runs.push(run);
    return runs;
  }
  // THE SOLVER (for making a grid, not playing it): how many ways it can be routed, every square filled,
  // up to stop (n), and the first way found (lines: each pair's squares, bit to twin). Each pair's line grown from one bit, the line with the fewest squares to go to always
  // next; given up on wherever an empty square has fewer than two ways in, a line can't reach its twin,
  // or a patch of empty squares can't be crossed by any pair's line
  function routings(ends, stop = 2) {
    const K = ends.length;
    const own = new Int8Array(N * N).fill(-1);
    const head = ends.map((e) => e[0]);
    const tgt = ends.map((e) => e[1]);
    const done = new Uint8Array(K);
    ends.forEach(([a, b], k) => { own[a] = k; own[b] = k; });
    const comp = new Int16Array(N * N);
    let found = 0;
    let nodes = 0;
    let first = null;
    const trail = ends.map((e) => [e[0]]);
    function ok() {
      for (let i = 0; i < N * N; i++) {
        if (own[i] >= 0) continue;
        let open = 0;
        for (const j of around(i)) { if (own[j] < 0) open++; else { const k = own[j]; if (!done[k] && (head[k] === j || tgt[k] === j)) open++; } }
        if (open < 2) return false;
      }
      comp.fill(-1);
      let nc = 0;
      for (let i = 0; i < N * N; i++) {
        if (own[i] >= 0 || comp[i] >= 0) continue;
        const stack = [i];
        comp[i] = nc;
        while (stack.length) { const x = stack.pop(); for (const j of around(x)) if (own[j] < 0 && comp[j] < 0) { comp[j] = nc; stack.push(j); } }
        nc++;
      }
      const usable = new Uint8Array(nc);
      for (let k = 0; k < K; k++) {
        if (done[k]) continue;
        const hs = new Set(around(head[k]).filter((j) => own[j] < 0).map((j) => comp[j]));
        let reach = adjacent(head[k], tgt[k]);
        for (const j of around(tgt[k])) if (own[j] < 0 && hs.has(comp[j])) { usable[comp[j]] = 1; reach = true; }
        if (!reach) return false;
      }
      for (let c = 0; c < nc; c++) if (!usable[c]) return false;
      return true;
    }
    (function step() {
      if (found >= stop || ++nodes > 200000) return;
      let best = -1;
      let moves = null;
      for (let k = 0; k < K; k++) {
        if (done[k]) continue;
        const mv = around(head[k]).filter((j) => own[j] < 0 || j === tgt[k]);
        if (!mv.length) return;
        if (!moves || mv.length < moves.length) { best = k; moves = mv; if (mv.length === 1) break; }
      }
      if (best < 0) { if (!own.includes(-1)) { if (!found) first = trail.map((t) => t.slice()); found++; } return; }
      const k = best;
      const h = head[k];
      for (const j of moves.sort((a, b) => (b === tgt[k]) - (a === tgt[k]))) {
        trail[k].push(j);
        if (j === tgt[k]) { done[k] = 1; if (ok()) step(); done[k] = 0; }
        else { own[j] = k; head[k] = j; if (ok()) step(); own[j] = -1; head[k] = h; }
        trail[k].pop();
        if (found >= stop) return;
      }
    })();
    return { n: nodes > 200000 ? stop : found, lines: first }; // (a search too long to finish: taken as not one answer)
  }
  // The grid from a seed: a path through every square, cut into runs that never touch themselves, 6 to 8
  // of them; their ends the pairs, kept only if that's the one way to route them all (so every square
  // fills, and no pair's bits sit side by side). Tried again, from the same seed, till one is
  function grid(rand) {
    let last = null;
    for (let tries = 0; tries < 300; tries++) {
      const runs = cut(wander(rand), rand);
      if (runs.length < MIN_PAIRS || runs.length > MAX_PAIRS || runs.some((r) => r.length < 3)) continue;
      last = runs.map((r) => [r[0], r[r.length - 1]]);
      if (routings(last).n === 1) return last;
    }
    return last; // (never yet: a way through all the same, if not the only one)
  }
  function make(rand, saved) {
    const ends = grid(rand).map((e) => e.slice().sort((a, b) => a - b)).sort((a, b) => a[0] - b[0]); // ([1] the pair whose first bit is nearest the top left, and on)
    const endAt = new Int8Array(N * N).fill(-1);
    ends.forEach(([a, b], k) => { endAt[a] = k; endAt[b] = k; });
    const x = { ends, endAt, paths: ends.map(() => []), won: false, routes: 0, last: -1 };
    // (what was drawn: each line kept if it still makes sense, from one of its pair's bits, square by square)
    if (saved && Array.isArray(saved.p) && saved.p.length === ends.length) {
      const used = new Set();
      saved.p.forEach((p, k) => {
        if (!Array.isArray(p) || !p.length || !ends[k].includes(p[0])) return;
        const ok = p.every((cell, i) => Number.isInteger(cell) && cell >= 0 && cell < N * N && !used.has(cell)
          && (i === 0 || adjacent(p[i - 1], cell)) && (endAt[cell] < 0 || endAt[cell] === k));
        if (ok) { x.paths[k] = p.slice(); p.forEach((cell) => used.add(cell)); }
      });
      x.won = !!saved.w && won(x);
      x.routes = Number.isInteger(saved.r) && saved.r >= 0 ? saved.r : 0;
      x.last = Number.isInteger(saved.l) && saved.l < ends.length ? saved.l : -1;
    }
    return x;
  }
  const done = (x, k) => x.paths[k].length > 1 && x.ends[k].includes(x.paths[k][x.paths[k].length - 1]) && x.paths[k][0] !== x.paths[k][x.paths[k].length - 1];
  const linked = (x) => x.paths.filter((p, k) => done(x, k)).length;
  function owners(x) {
    const own = new Int8Array(N * N).fill(-1);
    x.paths.forEach((p, k) => p.forEach((cell) => { own[cell] = k; }));
    x.ends.forEach(([a, b], k) => { own[a] = k; own[b] = k; });
    return own;
  }
  const filled = (x) => { const own = new Set(); x.paths.forEach((p) => p.forEach((c) => own.add(c))); return own.size; };
  const won = (x) => linked(x) === x.ends.length && filled(x) === N * N;

  // THE GRID: the squares (a pair's bits in its color; a square a line runs through tinted with it)
  // under the lines, drawn over them as one picture, a square to a unit
  // (the squares and the lines' picture into a board: the game's, or the ARCADE menu's preview's)
  function squares(board) {
    const sq = Array.from({ length: N * N }, (_, i) => {
      const c = document.createElement('span');
      c.className = 'cell rt-cell';
      c.dataset.i = String(i);
      return c;
    });
    const lines = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    lines.setAttribute('class', 'rt-lines');
    lines.setAttribute('viewBox', `0 0 ${N} ${N}`);
    lines.setAttribute('aria-hidden', 'true');
    board.replaceChildren(...sq, lines);
    return { sq, lines };
  }
  function build() {
    ({ sq: cells, lines: svg } = squares(boardEl));
  }
  // (the squares, sq, and the lines' picture drawn from x)
  function paint(x, sq, lines) {
    const own = owners(x);
    sq.forEach((c, i) => {
      const k = own[i];
      const end = x.endAt[i];
      c.className = `cell rt-cell${end >= 0 ? ' disc rt-end' : ''}${k >= 0 && end < 0 ? ' rt-on' : ''}${end >= 0 && done(x, end) ? ' rt-linked' : ''}`;
      if (k >= 0) c.style.setProperty('--rt', HUES[k]);
      else c.style.removeProperty('--rt');
      if (end >= 0) fillBit(c, end + 1);
      else { c.replaceChildren(); c.classList.remove('has-glyph'); }
      c.setAttribute('aria-label', end >= 0 ? `Bit ${end + 1}` : k >= 0 ? `Route ${k + 1}` : 'Empty');
    });
    lines.replaceChildren(...x.paths.filter((p) => p.length > 1).map((p) => {
      const k = x.paths.indexOf(p);
      const pl = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
      pl.setAttribute('points', p.map((cell) => { const [r, c] = rc(cell); return `${c + 0.5},${r + 0.5}`; }).join(' '));
      pl.setAttribute('stroke', `rgb(${HUES[k]})`);
      pl.setAttribute('class', done(x, k) ? 'done' : '');
      return pl;
    }));
  }
  function render() {
    paint(s, cells, svg);
    boardEl.classList.toggle('rt-won', s.won);
    actsEl.hidden = s.won;
    kit.refresh();
  }
  const perfect = (x) => x.routes === x.ends.length; // (a route a pair: not one taken up again)
  const routesText = (n) => `${n} ROUTE${n === 1 ? '' : 'S'}`;
  function line(x) {
    const time = kit.fmtTime(x.t);
    if (x.won) return `ALL ROUTED IN ${time} // ${routesText(x.routes)}${perfect(x) ? ': PERFECT' : ''}`;
    if (!x.moved) return `LINK EVERY PAIR // FILL EVERY SQUARE`;
    return `TIME ${time} // ROUTES ${x.routes} // LINKED ${linked(x)}/${x.ends.length} // ${Math.round((filled(x) / (N * N)) * 100)}%`;
  }
  // ROUTES: how many times a line's been drawn. A new one (a drag from a bit, the line started over)
  // counts; carrying on the line drawn last doesn't; carrying on any other line does, as it's taken up
  // again. Counted once a drag draws (or takes back) a square: a tap alone isn't a route, even one that
  // wipes a line by its bit
  function counted() {
    if (!pending) return;
    if (pending.fresh || pending.pair !== s.last) s.routes++;
    s.last = pending.pair;
    pending = null;
  }

  // THE ARCADE MENU's preview (arcade.js plays it): a grid routed a line at a time, square by square,
  // from one of its pair's bits to the other, till every square's filled (made as the day's are, but
  // not checked for one answer only: it's only watched)
  function demo(host) {
    const rand = Math.random;
    let runs = null;
    while (!runs) { // (a path shuffled less than a day's is, and cut again and again till it cuts right: quick)
      const path = wander(rand, N * N * 12);
      for (let t = 0; t < 40 && !runs; t++) {
        const r = cut(path, rand);
        if (r.length >= MIN_PAIRS && r.length <= MAX_PAIRS && r.every((x) => x.length >= 3)) runs = r;
      }
    }
    runs = runs.map((r) => (r[0] < r[r.length - 1] ? r : r.slice().reverse())).sort((a, b) => a[0] - b[0]); // (numbered as the game numbers them)
    const ends = runs.map((r) => [r[0], r[r.length - 1]]);
    const endAt = new Int8Array(N * N).fill(-1);
    ends.forEach(([a, b], k) => { endAt[a] = k; endAt[b] = k; });
    const x = { ends, endAt, paths: ends.map(() => []), won: false };
    const board = document.createElement('div');
    board.className = 'rt-board';
    const { sq, lines } = squares(board);
    host.replaceChildren(board);
    paint(x, sq, lines);
    const todo = runs.map((r, k) => ({ k, run: rand() < 0.5 ? r : r.slice().reverse() }));
    for (let i = todo.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [todo[i], todo[j]] = [todo[j], todo[i]]; }
    let line = 0;
    let at = 0;
    return {
      step() {
        if (x.won) return null;
        if (line >= todo.length) {
          x.won = true;
          board.classList.add('rt-won');
          return 0;
        }
        const { k, run } = todo[line];
        at++;
        x.paths[k] = run.slice(0, at + 1);
        paint(x, sq, lines);
        if (at + 1 < run.length) return 130;
        line++;
        at = 0;
        return 450;
      },
    };
  }

  // DRAWING: a press on a bit starts its pair's line over from it; on a line, carries that line on from
  // there. Each square the finger reaches: the one before it takes the line back, its own line further
  // back cuts it there, another pair's line is cut where it's crossed, another pair's bit stops it,
  // its twin links it (and that's that line done)
  function start(i) {
    const end = s.endAt[i];
    if (end >= 0) {
      s.paths[end] = [i];
      drag = end;
      pending = { pair: end, fresh: true };
    } else {
      const k = s.paths.findIndex((p) => p.includes(i));
      if (k < 0) return;
      s.paths[k] = s.paths[k].slice(0, s.paths[k].indexOf(i) + 1);
      drag = k;
      pending = { pair: k, fresh: false };
    }
    kit.moved();
    render();
  }
  function step(i) {
    const p = s.paths[drag];
    const last = p[p.length - 1];
    if (i === last || !adjacent(last, i)) return false;
    if (p.length > 1 && i === p[p.length - 2]) { p.pop(); return true; } // (back the way it came)
    const back = p.indexOf(i);
    if (back >= 0) { p.length = back + 1; return true; } // (looped onto itself: back to there)
    if (done(s, drag)) return false; // (linked: it goes no further)
    const end = s.endAt[i];
    if (end >= 0 && end !== drag) return false; // (another pair's bit)
    if (end === drag && i === p[0]) return false;
    const k = s.paths.findIndex((q, j) => j !== drag && q.includes(i));
    if (k >= 0) s.paths[k] = s.paths[k].slice(0, s.paths[k].indexOf(i)); // (crossing another line: cut there)
    p.push(i);
    SFX.count(rise(p.length));
    if (done(s, drag)) SFX.play('enter');
    return true;
  }
  // (a fast finger can skip squares: the way there taken a square at a time, the longer way first)
  function reach(i) {
    let moved = false;
    for (let guard = 0; guard < N * 2; guard++) {
      const p = s.paths[drag];
      const last = p[p.length - 1];
      if (last === i) break;
      const [r, c] = rc(last);
      const [tr, tc] = rc(i);
      const dr = Math.sign(tr - r);
      const dc = Math.sign(tc - c);
      const next = Math.abs(tr - r) >= Math.abs(tc - c) ? (r + dr) * N + c : r * N + c + dc;
      if (!step(next)) break;
      moved = true;
    }
    if (moved) { counted(); render(); }
  }
  function release() {
    if (drag === null) return;
    drag = null;
    pending = null; // (a press that changed nothing: no route)
    s.paths = s.paths.map((p) => (p.length > 1 ? p : [])); // (a lone press leaves nothing)
    if (won(s)) {
      s.won = true;
      SFX.play('burst');
      render();
      if (typeof FX !== 'undefined') FX.burst(s.ends.flat().map((i) => ({ el: cells[i], type: 'number' })));
      kit.finish();
      return;
    }
    kit.save();
    render();
    if (linked(s) === s.ends.length) kit.note(`ALL LINKED // ${N * N - filled(s)} SQUARES EMPTY: FILL THEM`);
  }
  const cellAt = (e) => { const t = document.elementFromPoint(e.clientX, e.clientY); const c = t && t.closest('.rt-cell'); return c && boardEl.contains(c) ? Number(c.dataset.i) : -1; };
  boardEl.addEventListener('pointerdown', (e) => {
    if (!s || s.won) return;
    const i = cellAt(e);
    if (i < 0) return;
    e.preventDefault();
    try { boardEl.setPointerCapture(e.pointerId); } catch (err) {}
    start(i);
  });
  boardEl.addEventListener('pointermove', (e) => {
    if (drag === null) return;
    const i = cellAt(e);
    if (i >= 0) reach(i);
  });
  boardEl.addEventListener('pointerup', release);
  boardEl.addEventListener('pointercancel', release);
  el('rt-clear').addEventListener('click', () => {
    if (!s || s.won || !s.paths.some((p) => p.length)) return;
    s.paths = s.paths.map(() => []);
    SFX.play('backspace');
    kit.save();
    render();
  });

  return {
    name: 'ROUTING',
    rule: () => 'link each bit to its twin; the lines fill the grid, never crossing.',
    make,
    pack: (x) => ({ p: x.paths.map((p) => p.slice()), w: x.won ? 1 : 0, r: x.routes, l: x.last }),
    over: (x) => x.won,
    timed: 'move',
    status(saved) {
      const t = kit.fmtTime((saved && saved.t) || 0);
      if (saved && saved.w) return { done: true, text: `ROUTED IN ${t} // ${routesText(saved.r || 0)}` };
      return { done: false, text: saved && saved.m ? `UNDER WAY // ${t}` : 'ONE GAME TODAY // TIMED' };
    },
    line,
    show(x) {
      if (x !== s) { s = x; drag = null; pending = null; }
      build();
      render();
    },
    key: () => false,
    leave() { release(); },
    // (square cells as big as the room allows, 52px at most)
    fit() {
      if (!s || boardEl.closest('.arcade-game').hidden) return;
      const host = boardEl.parentElement;
      const gap = 3;
      const pad = 16;
      const room = host.clientHeight - actsEl.offsetHeight - 8;
      const size = Math.floor(Math.min(52, (host.clientWidth - pad - gap * (N - 1)) / N, (room - pad - gap * (N - 1)) / N));
      boardEl.style.setProperty('--rt-cell', `${Math.max(20, size)}px`);
    },
    best: (x) => Math.floor(x.t / 1000),
    bestText: (v) => kit.fmtTime(v * 1000),
    low: true,
    demo,
    // SHARE: the time, and the seven colors linked
    share: (x) => [`All routed in ${kit.fmtTime(x.t)} // ${x.routes} route${x.routes === 1 ? '' : 's'} for ${x.ends.length} pairs${perfect(x) ? ': perfect' : ''}`, ['\u{1F7E5}', '\u{1F7E7}', '\u{1F7E8}', '\u{1F7E9}', '\u{1F7E6}', '\u{1F7EA}', '\u{1F7EB}', '\u2B1C'].slice(0, x.ends.length).join('')],
    wander, // (for testing)
    routings,
  };
})());
