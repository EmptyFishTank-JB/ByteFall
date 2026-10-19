// MERGE (THE ARCADE's; the card around it is arcade.js): 2048's rules on the bits.
// A 4x4 board; swipe (or the arrows, or WASD) and every bit slides that way as far as it goes, and two
// the same that meet merge into the next: two [1]s make a [2] ... two [7]s a BYTE, two BYTEs a WORD,
// then a DWORD, a QWORD (2048's own tile) and on. Each merge scores the new bit's worth (a [2] 4, a
// BYTE 256, a QWORD 2,048), and after every move a [1] (now and then a [2]) drops in. Every 10th move
// an ENCRYPTED block drops in too: it slides with the rest but never merges, and a merge beside it
// cracks it. No move left, it's over: the score and the best bit made. What drops in is the same for
// everyone that Wednesday (drawn in order from the date's seed), wherever it lands.
Arcade.register('merge', (() => {
  const SIZE = 4;
  const CELLS = SIZE * SIZE;
  const ENCRYPT_EVERY = 10;
  const MAX_LOCKED = 2;
  const LOCK = -1;
  const SLIDE_MS = 110;
  const NAMES = { 8: 'BYTE', 9: 'WORD', 10: 'DWORD', 11: 'QWORD', 12: 'OWORD', 13: 'YWORD', 14: 'ZWORD' };
  const name = (v) => (v <= 7 ? `[${v}]` : NAMES[v] || `${2 ** (v - 8)} BYTES`);
  const el = (id) => document.getElementById(id);
  const boardEl = el('mg-board');
  const hintEl = el('mg-hint');
  const kit = Arcade.kit;
  let s = null; // (the game shown: { cells, score, moves, top, over, nextId, r, draws } and the frame's own)
  let pending = null; // (a move's second half, after the slide: merges shown, new bits in)

  // The board from the game's seed: each square a bit { id, v } (v: 1 to 7, 8 a BYTE ..., LOCK
  // encrypted) or empty; draws: the seed's numbers used so far (saved, so a game picks up where it
  // left off, the same bits still to come)
  function make(rand, saved) {
    let draws = 0;
    const x = { cells: Array(CELLS).fill(null), score: 0, moves: 0, top: 1, over: false, nextId: 1, r: () => { draws++; return rand(); }, draws: () => draws };
    const ok = saved && Array.isArray(saved.c) && saved.c.length === CELLS && Number.isInteger(saved.d) && saved.d >= 0
      && saved.c.every((v) => v === 0 || v === LOCK || (Number.isInteger(v) && v >= 1 && v <= 20));
    if (ok) {
      for (let i = 0; i < saved.d; i++) x.r(); // (the seed's numbers to where it was)
      x.cells = saved.c.map((v) => (v ? { id: x.nextId++, v } : null));
      x.score = saved.s || 0;
      x.moves = saved.n || 0;
      x.top = Math.max(1, saved.b || 0, ...x.cells.map((t) => (t ? t.v : 0)));
      x.over = !!saved.o;
    } else {
      spawn(x);
      spawn(x);
    }
    return x;
  }
  // (a bit dropped into an empty square at random: a [1], one in ten a [2]; or an encrypted block)
  function spawn(x, locked = false) {
    const empty = [];
    x.cells.forEach((t, i) => { if (!t) empty.push(i); });
    if (!empty.length) return -1;
    const i = empty[Math.floor(x.r() * empty.length)];
    x.cells[i] = { id: x.nextId++, v: locked ? LOCK : x.r() < 0.1 ? 2 : 1, born: true };
    return i;
  }
  // (each row or column, its squares in the order the bits slide toward: the far end first)
  function lines(dir) {
    const out = [];
    for (let a = 0; a < SIZE; a++) {
      const line = [];
      for (let b = 0; b < SIZE; b++) {
        const [r, c] = dir === 'left' ? [a, b] : dir === 'right' ? [a, SIZE - 1 - b] : dir === 'up' ? [b, a] : [SIZE - 1 - b, a];
        line.push(r * SIZE + c);
      }
      out.push(line);
    }
    return out;
  }
  const around = (i) => [i - SIZE, i + SIZE, i % SIZE ? i - 1 : -1, (i + 1) % SIZE ? i + 1 : -1].filter((j) => j >= 0 && j < CELLS);
  function canMove(x) {
    for (let i = 0; i < CELLS; i++) {
      const t = x.cells[i];
      if (!t) return true;
      if (t.v === LOCK) continue;
      if (around(i).some((j) => x.cells[j] && x.cells[j].v === t.v)) return true;
    }
    return false;
  }
  // A move: every bit slid, the pairs that meet merged (each bit merges once a move), the encrypted
  // blocks beside a merge cracked, then what drops in. Returns what happened, or null if nothing moved
  function slide(x, dir) {
    const from = new Map();
    x.cells.forEach((t, i) => { if (t) from.set(t, i); });
    const next = Array(CELLS).fill(null);
    const to = new Map();
    const merged = [];
    for (const line of lines(dir)) {
      let k = 0;
      let open = null; // (the last bit placed in this line, still free to merge)
      for (const i of line) {
        const t = x.cells[i];
        if (!t) continue;
        if (open && t.v !== LOCK && open.v === t.v) {
          const at = to.get(open);
          to.set(t, at);
          merged.push({ at, tile: open, gone: t });
          open = null;
        } else {
          const at = line[k++];
          next[at] = t;
          to.set(t, at);
          open = t.v === LOCK ? null : t;
        }
      }
    }
    if (!merged.length && [...to].every(([t, at]) => from.get(t) === at)) return null;
    x.cells.forEach((t) => { if (t) t.born = false; });
    let gained = 0;
    for (const m of merged) {
      m.tile.v++;
      gained += 2 ** m.tile.v;
      x.top = Math.max(x.top, m.tile.v);
    }
    x.score += gained;
    x.cells = next;
    const cracked = [];
    for (const m of merged) {
      for (const j of around(m.at)) {
        if (x.cells[j] && x.cells[j].v === LOCK && !cracked.includes(x.cells[j])) cracked.push(x.cells[j]);
      }
    }
    for (const t of cracked) x.cells[x.cells.indexOf(t)] = null;
    x.moves++;
    spawn(x);
    if (x.moves % ENCRYPT_EVERY === 0 && x.cells.filter((t) => t && t.v === LOCK).length < MAX_LOCKED) spawn(x, true);
    if (!canMove(x)) x.over = true;
    return { to, merged, cracked, gained };
  }

  // THE BOARD: sixteen empty squares under, and the bits over them, each its own box sliding from
  // square to square (--x, --y)
  function face(elx, v) {
    elx.className = 'cell mg-tile';
    elx.removeAttribute('data-v');
    if (v === LOCK) {
      elx.classList.add('firewall', 'mg-lock');
      elx.textContent = '';
      elx.setAttribute('aria-label', 'Encrypted block');
      return;
    }
    elx.classList.add('disc');
    elx.dataset.v = String(v);
    elx.style.setProperty('--lv', Math.min(v, 12)); // (the higher, the brighter: style.css)
    kit.spin(elx); // (SPECTRUM: each its own cycle, kept as it slides and merges)
    if (v <= 7) fillBit(elx, v);
    else {
      elx.classList.remove('has-glyph');
      elx.classList.add('mg-big');
      elx.textContent = name(v);
    }
    elx.setAttribute('aria-label', name(v));
  }
  const place = (elx, i) => { elx.style.setProperty('--x', i % SIZE); elx.style.setProperty('--y', Math.floor(i / SIZE)); };
  // (a board's bits on screen: the game's, or the ARCADE menu's preview's)
  function tileView(board) {
    const tiles = new Map(); // (tile id -> its element)
    let layer = null;
    function tileEl(t, i, born) {
      let elx = tiles.get(t.id);
      if (!elx) {
        elx = document.createElement('span');
        tiles.set(t.id, elx);
        face(elx, t.v);
        place(elx, i);
        if (born) elx.classList.add('mg-born');
        layer.appendChild(elx);
      }
      return elx;
    }
    // (every bit where x has it, nothing sliding: on show, and after a move's slide)
    function sync(x) {
      const live = new Set();
      x.cells.forEach((t, i) => {
        if (!t) return;
        live.add(t.id);
        place(tileEl(t, i, t.born), i);
      });
      for (const [id, elx] of tiles) if (!live.has(id)) { elx.remove(); tiles.delete(id); }
    }
    return {
      build() {
        tiles.clear();
        layer = document.createElement('div');
        layer.className = 'mg-tiles';
        const slots = Array.from({ length: CELLS }, () => {
          const c = document.createElement('span');
          c.className = 'cell mg-slot';
          return c;
        });
        board.replaceChildren(...slots, layer);
      },
      sync,
      // (a move's slide: each bit's box to its new square)
      slide(res) {
        for (const [t, at] of res.to) {
          const elx = tiles.get(t.id);
          if (elx) { elx.classList.remove('mg-pop', 'mg-born'); place(elx, at); }
        }
      },
      // (the slide done: the merged-away bits gone, the ones they merged into a step up, popping; the
      // cracked blocks gone (crack(elx) first); what dropped in shown)
      settle(x, res, crack) {
        for (const m of res.merged) {
          const gone = tiles.get(m.gone.id);
          if (gone) { gone.remove(); tiles.delete(m.gone.id); }
          const kept = tiles.get(m.tile.id);
          if (kept) { face(kept, m.tile.v); kept.classList.add('mg-pop'); }
        }
        for (const t of res.cracked) {
          const elx = tiles.get(t.id);
          if (!elx) continue;
          if (crack) crack(elx);
          elx.remove();
          tiles.delete(t.id);
        }
        sync(x);
      },
    };
  }
  const view = tileView(boardEl);
  function render() {
    boardEl.classList.toggle('mg-over', s.over);
    hintEl.hidden = s.over;
    kit.refresh();
  }
  function line(x) {
    if (x.over) return `SCORE ${fmt(x.score)} // BEST ${name(x.top)}`;
    const locked = ENCRYPT_EVERY - (x.moves % ENCRYPT_EVERY);
    return `SCORE ${fmt(x.score)} // BEST ${name(x.top)} // ENCRYPT IN ${locked}`;
  }

  // A swipe: the bits slide (their boxes moving to their new squares), then the merges show (the
  // merged-away bit gone, the one it merged into a step up, popping), the cracked blocks burst, and
  // what dropped in appears
  function finishSlide() {
    if (!pending) return;
    const res = pending;
    pending = null;
    view.settle(s, res, (elx) => { if (typeof FX !== 'undefined') FX.burst([{ el: elx, type: 'firewall' }]); });
    render();
    if (s.over) {
      SFX.play('alert');
      // (NO MOVES LEFT, a moment over the board, as CHECKSUM's CONFIRM says what it found)
      const stamp = document.createElement('p');
      stamp.className = 'ck-stamp bad show';
      stamp.textContent = 'NO MOVES LEFT';
      boardEl.appendChild(stamp);
      kit.finish();
    }
  }
  function swipe(dir) {
    if (!s || s.over) return;
    finishSlide(); // (a swipe before the last one's done: that one finished at once)
    const res = slide(s, dir);
    if (!res) { SFX.play('denied'); return; }
    kit.moved();
    kit.save();
    view.slide(res);
    if (res.merged.length) SFX.play(res.merged.some((m) => m.tile.v >= 8) ? 'egg' : 'burst', 1 + Math.min(0.6, res.merged.length * 0.12));
    else SFX.play('click');
    if (res.cracked.length) kit.note(`ENCRYPTED BLOCK CRACKED${res.cracked.length > 1 ? ` x${res.cracked.length}` : ''}`, 1200);
    else if (res.merged.some((m) => m.tile.v === 8)) kit.note('BYTE!', 1000);
    pending = res;
    setTimeout(() => { if (pending === res) finishSlide(); }, SLIDE_MS);
  }

  // THE ARCADE MENU's preview (arcade.js plays it): a game playing itself for DEMO_MOVES moves, each
  // the way that merges the most and keeps the board open, down and left first (the bits kept to a
  // corner, as a good player keeps them)
  const DEMO_MOVES = 28;
  const DIRS = ['down', 'left', 'right', 'up'];
  function demo(host) {
    const x = make(Math.random);
    const board = document.createElement('div');
    board.className = 'mg-board';
    host.replaceChildren(board);
    const v = tileView(board);
    v.build();
    v.sync(x);
    let res = null;
    return {
      step() {
        if (res) { v.settle(x, res); res = null; return 280; }
        if (x.over || x.moves >= DEMO_MOVES) return null;
        let best = null;
        let most = -Infinity;
        DIRS.forEach((dir, k) => {
          const c = { cells: x.cells.map((t) => t && { ...t }), score: 0, moves: x.moves, top: x.top, over: false, nextId: 0, r: Math.random };
          const r = slide(c, dir);
          if (!r) return;
          const score = r.gained + c.cells.filter((t) => !t).length * 3 + (DIRS.length - 1 - k) * 2;
          if (score > most) { most = score; best = dir; }
        });
        if (!best) return null;
        res = slide(x, best);
        v.slide(res);
        return SLIDE_MS + 10;
      },
    };
  }

  // SWIPES on the board (and round it): the way the finger went, if it went far enough
  let press = null;
  const area = boardEl.closest('.arcade-game');
  area.addEventListener('pointerdown', (e) => { press = { x: e.clientX, y: e.clientY }; });
  area.addEventListener('pointerup', (e) => {
    if (!press) return;
    const dx = e.clientX - press.x;
    const dy = e.clientY - press.y;
    press = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
    swipe(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
  });
  area.addEventListener('pointercancel', () => { press = null; });
  const KEYS = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down', a: 'left', d: 'right', w: 'up', s: 'down' };

  return {
    name: 'MERGE',
    rule: () => 'swipe the bits together; two the same merge, two [7]s a BYTE.',
    make,
    pack: (x) => ({ c: x.cells.map((t) => (t ? t.v : 0)), d: x.draws(), s: x.score, n: x.moves, b: x.top, o: x.over ? 1 : 0 }),
    over: (x) => x.over,
    timed: null,
    line,
    show(x) {
      if (x !== s) { s = x; pending = null; }
      view.build();
      view.sync(s);
      render();
    },
    key(e) {
      const dir = KEYS[e.key.length === 1 ? e.key.toLowerCase() : e.key];
      if (!dir || !s || s.over) return false;
      swipe(dir);
      return true;
    },
    leave() { finishSlide(); },
    // (square bits as big as the room allows, 84px at most)
    fit() {
      if (!s || area.hidden) return;
      const gap = 6;
      const pad = 16;
      const room = area.clientHeight - hintEl.offsetHeight - 8;
      const size = Math.floor(Math.min(84, (area.clientWidth - pad - gap * (SIZE - 1)) / SIZE, (room - pad - gap * (SIZE - 1)) / SIZE));
      boardEl.style.setProperty('--mg-cell', `${Math.max(36, size)}px`);
    },
    best: (x) => x.score,
    bestText: (v) => `${fmt(v)} POINTS`,
    low: false,
    demo,
    slide, // (for testing)
  };
})());
