// THE CYBERPUNK STREET (scenes.js's CYBER; the bot sandbox's for now, not in the game's own picks yet):
// a long street at night that the wanderers walk along, seen close up (the shop fronts tall over the
// bots, their details plain), far longer than the card, the view panning slowly along it now and then
// to show more of it. Always night: neon and rain weather. Far off and nearer, the city shows through
// every opening: over the low roofs, down the alleys, through the big windows.
// DRAWN FINER THAN THE BOTS: the street's pixels are a half or a third of a bot's (RES: 2x or 3x by the
// screen's sharpness; 4x on the sandbox's RES), its parts measured in bot pixels (u) so they stand as
// tall as before, the finer pixels spent on detail: window frames, sills and glints, brickwork, the
// goods on the shops' shelves, hanging lamps, ribbed lanterns, neon tubes with a hot core, grilles. The
// crowd is scaled up the pixel artist's way (Scale2x / Scale3x: smooth diagonals, still pixels).
//   THE TOWERS   megatowers far off, black against the haze, a few windows lit, red lights blinking on
//                their masts (the slowest to pan: far away), and on one roof BYTEFALL in neon on its
//                scaffold, BYTE in the game's green, FALL in its amber
//   THE CITY     nearer blocks, window grids, small neon signs, HOLO BILLBOARDS playing (BYTEFALL, a
//                bit, an eye, a beat, scrolling words), an elevated line on its pillars with a train
//                along it now and then
//   THE STREET   its own fronts behind the sidewalk, lot by lot: a SHOP lit inside, a SHUTTERED shop
//                (lanterns along its awning), the METRO (its big sign, the clock, doors of lit mesh), a
//                KIOSK wall (a terminal, a ticket booth, a neon tube), a wall with a big WINDOW the city
//                shows through, a FOOD STALL (steam off the pot, a string of bulbs), LOW roofs and
//                ALLEYS. Above the shops: windows, blinds, balconies, vents, fire escapes, AC units, neon
//                banners, cables and lanterns strung across. A few signs are faulty and flicker
//   THE SIDEWALK wet: the shops' light and the signs' colors spilled in it, puddles; in front,
//                bollards, grates (steam rising), bags, a cone
//   THE CROWD    the street's own people, behind the bots (darker, their eyes and lights glowing: the
//                four CPUs stay the ones you see): HOODED figures, one under a neon UMBRELLA, chrome
//                ROBOTS, tall ANDROIDS, hovering DROIDS, DRONES flying over with parcels
//   THE TRAFFIC  flying cars crossing between the towers, headlights and tail lights
// THE BOTS ARE AWARE OF IT: one passed close by a figure turns to look (a hooded one: wary; a robot: a
// wave; a droid zipping by: startled; the umbrella: a smile), looks up at a drone or the train going over,
// at a sign sputtering above it, flinches at a grate's steam under it, stops at a lit shop window a moment
// (ooh). Never all at once: one at a time, each with a while before it notices anything again.
// THE PAN: every minute or two the view drifts along the street, slowly; everything on the street pans
// with it, the bots too (one carried off the card walks off it), the far layers less (parallax).
// THE CLOSE-UP: now and then (every two to four minutes, or the sandbox's CLOSE-UP) the view cuts in
// close on one of the CPUs, anime style, for a few seconds: letterbox bars, the bot big and drawn at four
// times its pixels (its own art as it is that moment, face and all, scaled up and lit: a neon rim on
// the sign's side, shadow on the other, rain's sheen on top, its eyes glowing), its name in neon behind
// it, lights blurred to bokeh, rain streaking past, its reflection in the wet ground, a slow push in;
// then the cut back. On the start screen, under START; in the game card, the lane's own height.
// Static layers are drawn once (the whole street, wider than the card) and slid; only what changes is
// redrawn. REDUCED EFFECTS: no flicker, no steam, no push in, no rain in the close-up.
function createCyberStreet(api) {
  const P = api.P; // (the bots' own pixel)
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (list) => list[Math.floor(Math.random() * list.length)];
  const rng = (seed) => { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  const rp = (r, list) => list[Math.floor(r() * list.length)];
  const ri = (r, a, b) => a + Math.floor(r() * (b - a + 1));
  const NEON = ['#ff2a6d', '#05d9e8', '#ff9f1c', '#b14aed', '#39ff88', '#fffb6b', '#ff5ec4'];
  const lowFx = () => document.documentElement.classList.contains('low-fx') || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  // RES: the street's pixels a bot's / Q (the sandbox's choice, else by the screen: 2x on a plain screen,
  // 3x on a sharp one, where a third of a bot's pixel is still at least a whole pixel of the screen's)
  const autoRes = () => ((window.devicePixelRatio || 1) >= 1.75 ? 3 : 2);
  let Q = 2;
  let C = P / 2; // (a cell of the street's, in the page's pixels)
  const u = (n) => n * Q; // (a length in bot pixels, in cells)

  // ── The layers: [name, how fast it pans (1: the street), z-index, card-wide (redrawn) or the whole street] ──
  const LAYERS = [
    ['towers', 0.18, -5], ['towers-fx', 0.18, -5], ['traffic', 0, -4, true], ['mid', 0.5, -3], ['mid-fx', 0.5, -3], ['rail', 0, -3, true],
    ['front', 1, -2], ['front-fx', 1, -2], ['ground', 1, -1], ['crowd', 0, 0, true], ['steam', 0, 4, true], ['near', 1, 5], ['shot', 0, 9, true],
  ];
  const els = {};
  for (const [name, , z] of LAYERS) {
    const c = document.createElement('canvas');
    c.className = `scene-layer cy-${name}${name === 'ground' ? ' scene-ground' : name === 'near' ? ' scene-near' : ''}`;
    c.setAttribute('aria-hidden', 'true');
    c.style.zIndex = String(z);
    api.lane.appendChild(c);
    els[name] = c;
  }
  const speedOf = Object.fromEntries(LAYERS.map(([n, f]) => [n, f]));

  let world = null; // { Wc, WW (the street's length, in cells), heights, signs, boards, lights, grates, spills, stops, rail }
  let cam = 0; // (the view's left edge along the street, in cells)
  let pan = null; // { from, to, t0, dur }
  let nextPan = performance.now() + rand(25000, 60000);
  const crowd = [];
  let nextWalker = performance.now() + rand(600, 2500);
  const steam = [];
  const cars = [];
  let nextCar = performance.now() + rand(1000, 4000);
  let train = null;
  let nextTrain = performance.now() + rand(4000, 15000);
  let shot = null; // (THE CLOSE-UP, while it's on)
  let nextShot = performance.now() + rand(90000, 180000);
  let lastFx = 0;
  let lastDyn = 0;
  let lastAware = 0;
  let nextNotice = 0; // (the street's: one bot noticing something at a time)

  // ── A 3x5 font for the signs (k cells a pixel; at 3 and over each stroke a tube with a hot core) ──
  const FONT = {
    A: '###,#.#,###,#.#,#.#', B: '##.,#.#,##.,#.#,##.', C: '###,#..,#..,#..,###', D: '##.,#.#,#.#,#.#,##.', E: '###,#..,##.,#..,###',
    F: '###,#..,##.,#..,#..', G: '###,#..,#.#,#.#,###', H: '#.#,#.#,###,#.#,#.#', I: '###,.#.,.#.,.#.,###', K: '#.#,#.#,##.,#.#,#.#',
    L: '#..,#..,#..,#..,###', M: '#.#,###,###,#.#,#.#', N: '##.,#.#,#.#,#.#,#.#', O: '###,#.#,#.#,#.#,###', P: '###,#.#,###,#..,#..',
    Q: '###,#.#,#.#,###,..#', R: '##.,#.#,##.,#.#,#.#', S: '###,#..,###,..#,###', T: '###,.#.,.#.,.#.,.#.', U: '#.#,#.#,#.#,#.#,###',
    V: '#.#,#.#,#.#,#.#,.#.', W: '#.#,#.#,###,###,#.#', X: '#.#,#.#,.#.,#.#,#.#', Y: '#.#,#.#,.#.,.#.,.#.', Z: '###,..#,.#.,#..,###',
    0: '###,#.#,#.#,#.#,###', 1: '.#.,##.,.#.,.#.,###', 2: '###,..#,###,#..,###', 3: '###,..#,.##,..#,###', 4: '#.#,#.#,###,..#,..#',
    5: '###,#..,###,..#,###', 6: '###,#..,###,#.#,###', 7: '###,..#,.#.,.#.,.#.', 8: '###,#.#,###,#.#,###', 9: '###,#.#,###,..#,###',
    '[': '##.,#..,#..,#..,##.', ']': '.##,..#,..#,..#,.##', ' ': '...,...,...,...,...', '/': '..#,..#,.#.,#..,#..', ':': '...,.#.,...,.#.,...',
    '>': '#..,.#.,..#,.#.,#..', '-': '...,...,###,...,...',
  };
  const textW = (s, k = 1) => (s.length * 4 - 1) * k;
  const HOT = 'rgba(255, 248, 252, 0.75)';
  function text(g, s, x, y, col, k = 1, core = true) {
    for (let i = 0; i < s.length; i++) {
      const rows = (FONT[s[i]] || FONT[' ']).split(',');
      for (let ry = 0; ry < 5; ry++) for (let rx = 0; rx < 3; rx++) {
        if (rows[ry][rx] !== '#') continue;
        const px = x + (i * 4 + rx) * k;
        const py = y + ry * k;
        g.fillStyle = col;
        g.fillRect(px, py, k, k);
        if (core && k >= 3) { g.fillStyle = HOT; g.fillRect(px + 1, py + 1, k - 2, k - 2); } // (the tube's hot core)
      }
    }
  }
  // (a pseudo-kanji, 5x5: a few strokes, seeded)
  function glyph(r) {
    const cells = new Set();
    const n = 2 + Math.floor(r() * 3);
    for (let k = 0; k < n; k++) {
      const t = r();
      if (t < 0.4) { const y = Math.floor(r() * 5); const a = Math.floor(r() * 2); const b = 2 + Math.floor(r() * 3); for (let x = a; x <= b; x++) cells.add(`${x},${y}`); }
      else if (t < 0.8) { const x = Math.floor(r() * 5); const a = Math.floor(r() * 2); const b = 2 + Math.floor(r() * 3); for (let y = a; y <= b; y++) cells.add(`${x},${y}`); }
      else { for (let i = 0; i < 4; i++) cells.add(`${Math.floor(r() * 5)},${Math.floor(r() * 5)}`); }
    }
    return [...cells].map((s) => s.split(',').map(Number));
  }
  const glowCol = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`; };
  const R = (g, x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
  const A = (g, x, y, w, h, c, a) => { g.fillStyle = glowCol(c, a); g.fillRect(x, y, w, h); };

  function size(c, cw, ch, k = C) {
    if (c.width !== cw || c.height !== ch) { c.width = cw; c.height = ch; }
    c.style.width = `${cw * k}px`;
    c.style.height = `${ch * k}px`;
    const g = c.getContext('2d');
    g.clearRect(0, 0, cw, ch);
    return g;
  }

  // ── THE STREET, laid out and drawn (again on a resize, or a new RES) ──
  function build(seed) {
    const W = api.laneW();
    const H = api.laneH();
    if (!W || !H) return;
    const was = world ? cam / world.WW : null; // (a new RES: the view where it was along the street)
    Q = window.CYBER_RES || autoRes();
    C = P / Q;
    const Wc = Math.ceil(W / C);
    const game = api.game();
    const WW = Math.max(Wc * 4, u(720));
    const hF = Math.max(u(56), Math.round((game ? H * 0.92 : Math.min(H * 0.42, 380)) / C));
    const hM = Math.max(hF + u(12), Math.round((game ? H : Math.min(H * 0.52, 460)) / C));
    const hT = Math.max(hM + u(10), Math.round((game ? H * 1.05 : Math.min(H * 0.6, 520)) / C));
    const GF = Math.max(u(30), Math.min(u(46), Math.round(hF * 0.36))); // (the shops' height: about twice a bot's)
    world = { Wc, WW, hT, hM, hF, GF, seed, signs: [], boards: [], lights: [], grates: [], spills: [], stops: [], rail: null };
    cam = Math.max(0, Math.min(WW - Wc, was !== null ? was * WW : (WW - Wc) * rand(0.2, 0.8)));
    crowd.length = 0;
    cars.length = 0;
    train = null;
    spriteCache.clear();
    const lenOf = (f) => Wc + Math.ceil((WW - Wc) * f) + 2;
    drawTowers(size(els.towers, lenOf(speedOf.towers), hT), lenOf(speedOf.towers), hT, rng(seed));
    size(els['towers-fx'], lenOf(speedOf.towers), hT);
    drawMid(size(els.mid, lenOf(speedOf.mid), hM), lenOf(speedOf.mid), hM, rng(seed + 1));
    size(els['mid-fx'], lenOf(speedOf.mid), hM);
    drawFront(size(els.front, WW + 2, hF), WW + 2, hF, rng(seed + 2));
    size(els['front-fx'], WW + 2, hF);
    const under = Math.ceil((parseFloat(getComputedStyle(api.lane).getPropertyValue('--floor-under')) || 0) / P);
    els.ground.style.bottom = els.near.style.bottom = `${-under * P}px`;
    els.front.style.bottom = els['front-fx'].style.bottom = `${4 * P}px`; // (the shops stand at the sidewalk's back edge, not under it)
    drawGround(size(els.ground, WW + 2, u(5 + under)), WW + 2, u(5 + under), rng(seed + 3));
    drawNear(size(els.near, WW + 2, u(7)), WW + 2, u(7), rng(seed + 4));
    // (the card-wide ones: the crowd at the sidewalk's back, the steam, the train, the traffic in the sky)
    size(els.crowd, Wc + 2, u(96));
    els.crowd.style.bottom = `${3 * P}px`;
    size(els.steam, Wc + 1, u(48));
    size(els.rail, Wc + 1, hM);
    size(els.traffic, Wc + 1, hT);
    for (const s of world.signs) s.on = true;
    paintFx(performance.now(), true);
    place();
  }

  // THE TOWERS: tall, black against the haze, a few windows, a light strip, masts with red lights; on
  // one, BYTEFALL in neon on its scaffold
  function drawTowers(g, cw, ch, r) {
    let x = Math.floor(r() * u(6));
    const tops = [];
    while (x < cw) {
      const w = u(16) + Math.floor(r() * u(26));
      const h = Math.floor(ch * (0.5 + r() * 0.5));
      const top = ch - h;
      R(g, x, top, w, h, rp(r, ['#0c0a1a', '#100d22', '#0e0c1e']));
      if (r() < 0.5) { g.fillRect(x + u(2), top - u(4), w - u(4), u(4)); g.fillRect(x + u(5), top - u(8), w - u(10), u(4)); } // (a stepped crown)
      R(g, x, top, 1, h, '#1a1630'); // (its lit edge)
      if (r() < 0.5) A(g, x + Math.floor(w / 2), top + u(2), Math.max(1, Q - 1), h - u(2), rp(r, ['#05d9e8', '#ff2a6d', '#b14aed']), 0.35); // (a light strip up its face)
      const wd = Math.max(1, Math.ceil(Q / 2));
      for (let wy = top + u(3); wy < ch - u(2); wy += u(3)) for (let wx = x + u(2); wx < x + w - u(2); wx += u(3)) {
        if (r() < 0.07) { g.globalAlpha = 0.55; R(g, wx, wy, wd, wd, rp(r, ['#ffcf6b', '#6fe3ff', '#ff8fb8', '#d9d4ff'])); g.globalAlpha = 1; }
      }
      const mx = x + Math.floor(w / 2);
      const mh = u(4) + Math.floor(r() * u(12));
      R(g, mx, top - mh - u(8), 1, mh + u(8), '#16132a');
      world.lights.push({ x: mx, y: Math.max(0, top - mh - u(8)), ph: r() * 6.28, layer: 'towers-fx' });
      tops.push({ x, w, top });
      x += w + Math.floor(r() * u(4));
    }
    // BYTEFALL on a roof near the middle of the view's way along the street: in sight most of the time
    const k = Q + 1;
    const lw = textW('BYTEFALL', k);
    const want = cw * rp(r, [0.35, 0.5, 0.65]);
    const fits = tops.filter((o) => o.top > 5 * k + u(14));
    const near = fits.filter((o) => Math.abs(o.x + o.w / 2 - want) < cw * 0.2);
    const t = (near.length ? near : fits).sort((a, b) => a.top - b.top)[0]; // (the tallest about there: over the nearer roofs)
    if (t) {
      const lx = Math.round(t.x + t.w / 2 - lw / 2);
      const ly = t.top - u(4) - 5 * k;
      const base = ly + 5 * k + u(1);
      R(g, lx - u(1), base, lw + u(2), 1, '#2a2440'); // (its scaffold: a rail, legs down to the roof, braces)
      for (let sx = lx; sx <= lx + lw; sx += u(4)) { R(g, sx, base, 1, t.top - base, '#1e1a34'); if (sx + u(4) <= lx + lw) for (let k2 = 0; k2 < u(4); k2++) R(g, sx + k2, base + Math.round(k2 * (t.top - base) / u(4)), 1, 1, '#1a1630'); }
      R(g, lx - u(1), ly - u(1), lw + u(2), 5 * k + u(2), '#06050c');
      world.signs.push({ kind: 'logo', x: lx, y: ly, w: lw, h: 5 * k, k, col: '#39ff8f', col2: '#ffb000', on: true, next: 0, faulty: true, layer: 'towers-fx' });
    }
  }

  // THE CITY: nearer blocks (what shows over the low roofs, down the alleys, through the windows),
  // window grids, small signs, the HOLO BILLBOARDS, the elevated line on its pillars
  function drawMid(g, cw, ch, r) {
    let x = Math.floor(r() * u(4));
    while (x < cw) {
      const w = u(16) + Math.floor(r() * u(22));
      const h = Math.floor(ch * (0.4 + r() * 0.6));
      const top = ch - h;
      R(g, x, top, w, h, rp(r, ['#1a1631', '#1e1a38', '#171a30', '#22183a', '#16202e']));
      R(g, x, top, w, 1, '#3a3260'); // (its roofline catching the glow)
      R(g, x + w - Q, top, Q, h, '#120f24'); // (its shadowed side)
      const lit = rp(r, ['#ffcf6b', '#7fd8ff', '#ff9fd0', '#c8b8ff']);
      for (let wy = top + u(3); wy < ch - u(1); wy += u(4)) for (let wx = x + u(2); wx < x + w - u(3); wx += u(4)) {
        const on = r() < 0.34;
        R(g, wx - 1, wy - 1, u(2) + 2, u(2) + 2, '#120f22'); // (its frame)
        g.globalAlpha = on ? 0.45 + r() * 0.45 : 1;
        R(g, wx, wy, u(2), u(2), on ? lit : '#0e0c1c');
        g.globalAlpha = 1;
        if (on && Q >= 3) A(g, wx, wy, 1, u(2), '#ffffff', 0.25); // (a glint at its edge)
      }
      if (r() < 0.35) { // (a small neon word on its side)
        const word = rp(r, ['BAR', 'HOTEL', '24H', 'NODE', 'VR', 'OPEN', 'CAFE']);
        const sx = x + ri(r, u(1), Math.max(u(1), w - textW(word, Q) - u(1)));
        const sy = top + ri(r, u(4), Math.max(u(5), Math.floor(h * 0.6)));
        R(g, sx - Q, sy - Q, textW(word, Q) + u(2), u(7), '#07060d');
        text(g, word, sx, sy, rp(r, NEON), Q);
      }
      if (w >= u(26) && h > u(26) && r() < 0.55) { // (a holo billboard on its face)
        const bw = Math.min(w - u(4), u(30) + Math.floor(r() * u(6)));
        const bh = u(13) + Math.floor(r() * u(4));
        const bx = x + Math.floor((w - bw) / 2);
        const by = top + u(4) + Math.floor(r() * Math.max(1, h * 0.35 - bh));
        R(g, bx - Q, by - Q, bw + u(2), bh + u(2), '#05040c');
        world.boards.push({ x: bx, y: by, w: bw, h: bh, mode: rp(r, ['logo', 'bit', 'eye', 'beat', 'words']), col: rp(r, ['#05d9e8', '#ff2a6d', '#b14aed', '#39ff88']), t: r() * 10, glitch: 0 });
      }
      if (r() < 0.45) world.lights.push({ x: x + u(2) + Math.floor(r() * (w - u(4))), y: top - Q, ph: r() * 6.28, layer: 'mid-fx' });
      x += w + Math.floor(r() * u(3));
    }
    // the elevated line: its beam across, pillars down, a lit rail under it (the train runs on it: 'rail')
    const ty = ch - Math.round(ch * 0.46);
    R(g, 0, ty, cw, u(3), '#24223a');
    R(g, 0, ty, cw, 1, '#3d3a5a');
    R(g, 0, ty + u(3), cw, Q, '#3d2a52');
    A(g, 0, ty + u(4), cw, Q, '#ff5ec4', 0.35);
    for (let px = Math.floor(r() * u(30)); px < cw; px += u(34) + Math.floor(r() * u(12))) { R(g, px, ty + u(4), u(3), ch - ty - u(4), '#1b1930'); R(g, px - Q, ty + u(4), u(5), u(2), '#24223a'); R(g, px, ty + u(4), 1, ch - ty - u(4), '#2a2744'); }
    world.rail = { y: ty };
  }

  // ── THE STREET's own fronts, lot by lot ──
  const WORDS = ['RAMEN', 'SOBA', 'BAR', 'HOTEL', '24H', 'CYBER', 'NOODLE', 'DATA', 'BYTE', 'CLINIC', 'ARCADE', 'SUSHI', 'NEON', 'PAWN', 'REPAIR', 'DINER', 'CHROME', 'PHARMA', 'BITS', 'HACK', 'NODE', 'DECRYPT', 'CAFE', 'KEYS', 'LIQUOR'];
  const LOTS = [['shop', 3], ['shutter', 2.4], ['metro', 0.8], ['kiosk', 1.4], ['window', 1.4], ['stall', 1.3], ['low', 1.4], ['alley', 2]];
  function lotPick(r, last) {
    const opts = LOTS.filter(([k]) => !((k === 'alley' || k === 'low') && (last === 'alley' || last === 'low')) && !(k === 'metro' && world.metro));
    let t = r() * opts.reduce((a, [, w]) => a + w, 0);
    for (const [k, w] of opts) if ((t -= w) <= 0) return k;
    return 'shop';
  }
  const sign = (o) => { world.signs.push({ on: true, next: 0, faulty: false, k: Q, layer: 'front-fx', ...o }); return o; };
  // (a building's shell: its wall (brick or panels, finely), its edges, the ledge at its top)
  function shell(g, x, w, top, ch, r) {
    const wall = rp(r, ['#1b1a2e', '#221d33', '#1a2433', '#2a1f2f', '#1e2a2a', '#262033', '#24282e']);
    R(g, x, top, w, ch - top, wall);
    if (r() < 0.5) { // (brickwork: its courses, the joints staggered)
      g.fillStyle = 'rgba(0, 0, 0, 0.18)';
      let row = 0;
      for (let by = top + u(1); by < ch; by += u(1) + 1, row++) { g.fillRect(x, by, w, 1); for (let bx = x + (row % 2 ? u(1) : u(3)); bx < x + w; bx += u(4)) g.fillRect(bx, by - u(1), 1, u(1)); }
    } else { // (panels: their seams)
      g.fillStyle = 'rgba(0, 0, 0, 0.22)';
      for (let px = x + u(6); px < x + w; px += u(6)) g.fillRect(px, top, 1, ch - top);
    }
    R(g, x, top, w, Q, '#3a3456');
    R(g, x, top, w, 1, '#4a4470');
    R(g, x, top + Q, w, 1, '#14121f');
    R(g, x, top, 1, ch - top, '#14121f');
    R(g, x + 1, top, 1, ch - top, 'rgba(255, 255, 255, 0.04)');
    return wall;
  }
  // (a window: its frame, the glass lit or dark, a sill, a glint, now and then someone at it)
  function win(g, x, y, w, h, lit, on, r) {
    R(g, x - 1, y - 1, w + 2, h + 2, '#121019');
    g.globalAlpha = on ? 0.5 + r() * 0.4 : 1;
    R(g, x, y, w, h, on ? lit : '#0d0b16');
    g.globalAlpha = 1;
    if (on && r() < 0.25) R(g, x + Math.floor(w * 0.5), y + Math.floor(h * 0.3), Math.ceil(w * 0.4), h - Math.floor(h * 0.3), '#0d0b16'); // (someone there)
    if (on && r() < 0.3) for (let k = 0; k < Math.min(w, h); k++) A(g, x + k, y + k, 1, 1, '#ffffff', 0.18); // (a glint across the glass)
    R(g, x - 1, y + h + 1, w + 2, 1, '#3a3650'); // (the sill)
    R(g, x + Math.floor(w / 2), y, 1, h, '#121019'); // (its bar)
  }
  // THE FLOORS ABOVE THE SHOPS: one style a building (windows, slatted blinds, balconies, an industrial
  // face of vents and pipes), AC units, a fire escape now and then, a neon banner hanging off it
  function upper(g, x, w, top, yb, r) {
    const style = rp(r, ['grid', 'grid', 'slats', 'balcony', 'panel']);
    const lit = rp(r, ['#ffcf6b', '#7fd8ff', '#ff9fd0', '#c8b8ff', '#b8e07a']);
    for (let fy = yb - u(12); fy > top + u(3); fy -= u(12)) {
      R(g, x, fy + u(11), w, Q, '#14121f'); // (the floor's ledge)
      R(g, x, fy + u(11), w, 1, '#2c2846');
      if (style === 'grid') {
        for (let wx = x + u(3); wx + u(5) <= x + w - u(2); wx += u(8)) {
          win(g, wx, fy + u(3), u(5), u(6), lit, r() < 0.42, r);
          if (r() < 0.14) { R(g, wx, fy + u(10), u(5), u(3), '#4a4e5c'); R(g, wx + Q, fy + u(11), u(3), Q, '#2c2f3a'); for (let k = 0; k < u(3); k += 2) R(g, wx + Q + k, fy + u(10) + 1, 1, Q, '#3a3e4a'); } // (an AC unit, its grille)
        }
      } else if (style === 'slats') { // (a wide window, its blinds lit from inside)
        const sw = w - u(6);
        const on = r() < 0.65;
        R(g, x + u(3), fy + u(2), sw, u(8), '#121019');
        for (let sy = 0; sy < u(6); sy++) { g.globalAlpha = on ? (sy % 2 ? 0.25 : 0.7) : 1; R(g, x + u(4), fy + u(3) + sy, sw - u(2), 1, on ? lit : '#0d0b16'); g.globalAlpha = 1; }
      } else if (style === 'balcony') { // (railings, a plant, washing on a line)
        for (let wx = x + u(3); wx + u(6) <= x + w - u(2); wx += u(10)) win(g, wx, fy + u(2), u(6), u(5), lit, r() < 0.5, r);
        R(g, x + Q, fy + u(7), w - u(2), Q, '#4a4e5c');
        for (let k = x + Q; k < x + w - Q; k += u(2)) R(g, k, fy + u(8), Math.max(1, Q - 1), u(3), '#3a3f4e');
        if (r() < 0.5) { const px = x + ri(r, u(3), w - u(5)); R(g, px, fy + u(5), u(3), u(2), '#2f6a3a'); R(g, px + Q, fy + u(4), Q, Q, '#3f8a4a'); R(g, px + Q + 1, fy + u(4) - 1, 1, 1, '#5aa860'); }
        if (r() < 0.4) { R(g, x + u(2), fy + u(3), w - u(4), 1, '#5a5a6a'); for (let k = x + u(3); k < x + w - u(3); k += u(5)) R(g, k, fy + u(3), u(2), u(2) + (k % 3), rp(r, ['#7a6a9a', '#9a5a6a', '#5a7a9a', '#c8c0d0'])); }
      } else { // (an industrial face: a louvred vent, pipes)
        const vw = Math.min(w - u(8), u(16));
        const vx = x + ri(r, u(3), Math.max(u(3), w - vw - u(3)));
        R(g, vx, fy + u(2), vw, u(8), '#15141e');
        for (let sy = 0; sy < u(8); sy += Q) { R(g, vx + 1, fy + u(2) + sy, vw - 2, 1, '#2c2b3a'); R(g, vx + 1, fy + u(2) + sy + 1, vw - 2, 1, '#0c0b12'); }
        R(g, x + Q, fy + Q, w - u(2), Q, '#2a2d38');
        R(g, x + Q, fy + Q, w - u(2), 1, '#3e4250');
      }
    }
    if (yb - top > u(30) && r() < 0.3) { // (a fire escape: its landings and the stairs between)
      const fx = x + u(2) + Math.floor(r() * Math.max(1, w - u(16)));
      for (let fy = yb - u(12); fy > top + u(6); fy -= u(12)) {
        R(g, fx, fy + u(10), u(14), Q, '#3a3f4e');
        for (let k = 0; k < u(14); k += u(2)) R(g, fx + k, fy + u(7), 1, u(3), '#3a3f4e');
        R(g, fx, fy + u(7), u(14), 1, '#3a3f4e');
        for (let k = 0; k < u(10); k++) R(g, fx + u(2) + k, fy + u(10) - Math.round(k * 1.1), 1, 1, '#3a3f4e');
      }
    }
    R(g, x + w - u(2), top + u(3), Q, yb - top - u(3), '#2a2d38'); // (a drain pipe)
    R(g, x + w - u(2), top + u(3), 1, yb - top - u(3), '#3e4250');
    for (let py = top + u(8); py < yb; py += u(10)) R(g, x + w - u(3), py, u(3), Q, '#3a3d48');
    if (yb - top > u(28) && r() < 0.5) { // (a neon banner hanging off it: glyphs down a tall box)
      const n = 3 + Math.floor(r() * 4);
      const left = r() < 0.5;
      const bx = left ? x - u(4) : x + w - u(5);
      const by = Math.max(top + u(3), yb - u(6) - n * u(7));
      const col = rp(r, NEON);
      const box = r() < 0.4; // (a lightbox: lit panel, dark glyphs; else neon glyphs on dark)
      R(g, bx - Q, by - Q, u(9), n * u(7) + u(3), '#07060d');
      R(g, bx - Q, by - Q, u(9), 1, '#2a2840');
      R(g, bx + u(3), by - u(4), Q, u(3), '#3a3f4e');
      sign({ kind: 'glyphs', glyphs: Array.from({ length: n }, () => glyph(r)), x: bx + Q, y: by + Q, w: u(5), h: n * u(7), col, box, faulty: r() < 0.18 });
    }
  }
  // (the roof's own: a water tank, an antenna, a dish, AC units)
  function roof(g, x, w, top, r) {
    const t = r();
    if (t < 0.3) { R(g, x + u(3), top - u(7), u(8), u(7), '#23263a'); for (let k = 1; k < u(7); k += Q) R(g, x + u(3), top - u(7) + k, u(8), 1, '#1a1c2c'); R(g, x + u(4), top - u(8), u(6), Q, '#2c3046'); R(g, x + u(4), top - u(2), Q, u(2), '#16182a'); R(g, x + u(9), top - u(2), Q, u(2), '#16182a'); }
    else if (t < 0.55) { R(g, x + w - u(6), top - u(12), Math.max(1, Q - 1), u(12), '#23263a'); R(g, x + w - u(8), top - u(9), u(5), 1, '#23263a'); R(g, x + w - u(7), top - u(6), u(3), 1, '#23263a'); world.lights.push({ x: x + w - u(6), y: top - u(13), ph: r() * 6.28, layer: 'front-fx' }); }
    else if (t < 0.75) { R(g, x + u(4), top - u(4), u(6), Q, '#2c3046'); R(g, x + u(3), top - u(5), Q, Q, '#2c3046'); R(g, x + u(10), top - u(5), Q, Q, '#2c3046'); R(g, x + u(7), top - u(3), Q, u(3), '#23263a'); }
    else { for (let k = 0; k < 2; k++) { R(g, x + u(3 + k * 7), top - u(4), u(5), u(4), '#3a3e4c'); R(g, x + u(4 + k * 7), top - u(3), u(3), u(2), '#23263a'); for (let f = 0; f < u(3); f += 2) R(g, x + u(4 + k * 7) + f, top - u(3), 1, u(2), '#30333f'); } }
  }

  function drawFront(g, cw, ch, r) {
    const GF = world.GF;
    const yG = ch - GF; // (the top of the shops)
    let x = 0;
    let last = null;
    const tops = [];
    while (x < cw) {
      const kind = lotPick(r, last);
      last = kind;
      const W = { shop: [44, 60], shutter: [36, 48], metro: [52, 62], kiosk: [52, 70], window: [42, 58], stall: [38, 48], low: [34, 50], alley: [16, 26] }[kind];
      const w = u(ri(r, W[0], W[1]));
      if (kind === 'alley') { alley(g, x, w, ch, r); tops.push({ x, w, top: ch, gap: true }); x += w; continue; }
      const top = kind === 'low' ? yG - u(ri(r, 4, 14)) : Math.max(u(6), ch - ri(r, GF + u(24), ch));
      shell(g, x, w, top, ch, r);
      if (kind !== 'low') upper(g, x, w, top, yG, r);
      roof(g, x, w, top, r);
      R(g, x, yG - Q, w, u(2), '#3a3456'); // (the ledge over the shops)
      R(g, x, yG - Q, w, 1, '#5a5480');
      ({ shop, shutter, metro, kiosk, window: windowLot, stall, low: lowLot })[kind](g, x, w, ch, yG, r, top);
      tops.push({ x, w, top });
      x += w;
    }
    // cables strung across from roof to roof (over the alleys and the low roofs too), lanterns on some
    for (let i = 0; i + 2 < tops.length; i++) {
      if (r() < 0.4) continue;
      const a = tops[i];
      const b = tops[i + 1].gap || tops[i + 1].top > yG - u(16) ? tops[i + 2] : tops[i + 1];
      if (!b || b.gap) continue;
      const x0 = a.x + a.w - u(4);
      const x1 = b.x + u(4);
      const y0 = Math.max(a.top, yG - u(30)) + u(4);
      const y1 = Math.max(b.top, yG - u(30)) + u(4);
      const sag = u(4) + r() * u(8);
      const lantern = r() < 0.55 ? rp(r, ['#ff2a6d', '#ff9f1c', '#fffb6b']) : null;
      for (let cx = x0; cx <= x1; cx++) {
        const t = (cx - x0) / Math.max(1, x1 - x0);
        const cy = Math.round(y0 + (y1 - y0) * t + sag * 4 * t * (1 - t));
        R(g, cx, cy, 1, 1, '#0a0912');
        if (lantern && (cx - x0) % u(5) === u(2)) sign({ kind: 'lantern', x: cx - Q, y: cy + 1, w: u(3), h: u(3), col: lantern, faulty: r() < 0.1 });
      }
    }
  }

  // A SHOP, lit inside: its window's panes, shelves and their goods, posters, hanging lamps, a glass
  // door, OPEN glowing in the window
  function shop(g, x, w, ch, yG, r) {
    const L = rp(r, ['#b8d86a', '#ffc46b', '#7fe3ff', '#ff9fd0', '#c8b8ff']);
    R(g, x + Q, yG + Q, w - u(2), u(5), '#100e18'); // (the fascia)
    A(g, x + u(2), yG + u(5), w - u(4), Q, L, 0.8);
    const word = rp(r, WORDS.filter((s) => textW(s, Q) <= w - u(10)));
    if (word) { const sx = x + Math.floor((w - textW(word, Q)) / 2); R(g, sx - u(2), yG, textW(word, Q) + u(4), u(6), '#07060d'); sign({ kind: 'text', s: word, x: sx, y: yG + Math.floor(Q / 2), w: textW(word, Q), h: u(5), col: rp(r, NEON), faulty: r() < 0.15 }); }
    const wy = yG + u(8);
    const wh = ch - wy - u(2);
    R(g, x + u(2), wy - Q, w - u(4), wh + u(2), '#0e0c15'); // (the frame)
    g.globalAlpha = 0.85;
    R(g, x + u(3), wy, w - u(6), wh, L);
    g.globalAlpha = 1;
    A(g, x + u(3), wy, w - u(6), Math.floor(wh / 2), '#ffffff', 0.12); // (brighter up by the lights)
    for (let sy = wy + Math.floor(wh * 0.45); sy < ch - u(3); sy += u(5)) { // (its shelves, and the goods on them)
      A(g, x + u(3), sy, w - u(6), Q, '#000000', 0.35);
      for (let gx = x + u(3); gx < x + w - u(3); gx += Q + 1) if (r() < 0.55) { const gh = ri(r, Q, u(2)); A(g, gx, sy - gh, Q, gh, rp(r, ['#2a2040', '#40202a', '#203040', '#c03050', '#3060c0', '#e0c040']), 0.6); }
    }
    for (let k = 0; k < 2; k++) { const lx = x + u(8) + Math.floor(r() * (w - u(16))); R(g, lx, wy, 1, u(3), '#2a2830'); R(g, lx - Q, wy + u(3), u(2) + 1, Q, '#fff4c0'); A(g, lx - u(2), wy + u(4), u(4) + 1, u(2), '#fff4c0', 0.25); } // (lamps hanging)
    for (let mx = x + u(3) + u(ri(r, 7, 10)); mx < x + w - u(4); mx += u(ri(r, 9, 12))) R(g, mx, wy, Q, wh, '#0e0c15'); // (the mullions)
    R(g, x + u(3), wy + Math.floor(wh * 0.3), w - u(6), Q, '#0e0c15');
    for (let k = 0, n = ri(r, 1, 3); k < n; k++) { const px = x + u(5) + Math.floor(r() * (w - u(14))); const py = wy + u(2) + Math.floor(r() * u(4)); R(g, px, py, u(5), u(6), rp(r, ['#e8e4f0', '#f0d0d8', '#d8f0e8'])); R(g, px + Q, py + Q, u(3), u(2), rp(r, ['#c02040', '#202040', '#208040'])); R(g, px + Q, py + u(4), u(3), 1, '#606070'); R(g, px + Q, py + u(4) + 2, u(2), 1, '#808090'); } // (posters)
    const door = r() < 0.5 ? x + u(4) : x + w - u(14);
    R(g, door, wy, u(10), wh, '#0e0c15');
    g.globalAlpha = 0.6; R(g, door + Q, wy + Q, u(8), wh - Q, L); g.globalAlpha = 1;
    for (let k = 0; k < Math.min(u(8), wh); k++) A(g, door + Q + k, wy + Q + k, 1, 1, '#ffffff', 0.15); // (a glint on the glass)
    R(g, door + u(7), wy + Math.floor(wh / 2), Q, u(3), '#d8d4e0'); // (its handle)
    const ox = door === x + u(4) ? x + w - u(18) : x + u(8);
    sign({ kind: 'text', s: 'OPEN', x: ox, y: wy + u(3), w: textW('OPEN', Q), h: u(5), col: rp(r, ['#ff2a6d', '#05d9e8']), faulty: r() < 0.3 });
    world.spills.push({ x: x + u(3), w: w - u(6), col: L, shop: true });
    world.stops.push(x + Math.floor(w / 2));
    if (r() < 0.6) { R(g, x + w - u(12), yG - u(8), u(8), u(6), '#4a4e5c'); R(g, x + w - u(11), yG - u(7), u(6), u(4), '#2c2f3a'); for (let f = 0; f < u(6); f += 2) R(g, x + w - u(11) + f, yG - u(7), 1, u(4), '#3a3e4a'); R(g, x + w - u(9), yG - u(6), u(2), u(2), '#4a4e5c'); } // (an AC unit)
  }
  // A SHUTTERED SHOP: its shutter lit by the lanterns along its awning, a neon sign of glyphs over it,
  // a ladder of neon rungs up the wall
  function shutter(g, x, w, ch, yG, r) {
    const col = rp(r, ['#ff6a2a', '#ff2a6d', '#ff9f1c']);
    R(g, x + u(2), yG + u(6), w - u(4), u(2), '#3a1a10');
    A(g, x + u(2), yG + u(7), w - u(4), Q, col, 0.9); // (the awning's lit edge)
    const sy = yG + u(9);
    for (let y = sy; y < ch - Q; y++) {
      const k = (y - sy) / (ch - sy);
      R(g, x + u(3), y, w - u(6), 1, (Math.floor((y - sy) / Q)) % 2 ? '#4a2a20' : '#5a3424');
      if ((y - sy) % Q === 0) R(g, x + u(3), y, w - u(6), 1, '#2e1812'); // (the slats' joints)
      A(g, x + u(3), y, w - u(6), 1, col, 0.22 * (1 - k)); // (lit from above)
    }
    R(g, x + u(3), ch - u(2), w - u(6), Q, '#2a1610');
    R(g, x + Math.floor(w / 2) - Q, ch - u(4), u(2), u(2), '#8a8a96'); // (its lock)
    for (let lx = x + u(6); lx < x + w - u(5); lx += u(ri(r, 7, 10))) sign({ kind: 'lantern', x: lx, y: yG + u(9), w: u(3), h: u(4), col, faulty: r() < 0.08 });
    const n = Math.min(4, Math.floor((w / Q - 8) / 7));
    const gx = x + Math.floor((w - n * u(7) + u(2)) / 2);
    R(g, gx - u(3), yG - u(9), n * u(7) + u(4), u(9), '#0a0608');
    sign({ kind: 'glyphs', glyphs: Array.from({ length: n }, () => glyph(r)), x: gx, y: yG - u(7), w: n * u(7) - u(2), h: u(5), col, across: true, faulty: r() < 0.2 });
    if (r() < 0.7) { // (neon rungs up the wall)
      const rx = r() < 0.5 ? x + u(3) : x + w - u(9);
      const rn = ri(r, 6, 12);
      sign({ kind: 'rungs', x: rx, y: yG - u(12) - rn * u(3), w: u(6), h: rn * u(3), n: rn, col, faulty: r() < 0.25 });
    }
    world.spills.push({ x: x + u(3), w: w - u(6), col });
  }
  // THE METRO: its big sign (METRO, the line's glyphs, arrows, the clock), doors of lit mesh
  function metro(g, x, w, ch, yG, r) {
    world.metro = true;
    const T = '#7ff2d8';
    R(g, x + u(2), yG - u(18), w - u(4), u(22), '#0c2424');
    R(g, x + u(2), yG - u(18), w - u(4), Q, '#3a8a80');
    R(g, x + u(2), yG + u(3), w - u(4), Q, '#3a8a80');
    for (let k = 0; k < 3; k++) { const gl = glyph(r); for (const [gx, gy] of gl) R(g, x + u(5 + k * 7 + gx), yG - u(16 - gy), Q, Q, '#4fb3a8'); }
    sign({ kind: 'text', s: 'METRO', x: x + Math.floor((w - textW('METRO', u(2))) / 2), y: yG - u(9), w: textW('METRO', u(2)), h: u(10), k: u(2), col: T });
    sign({ kind: 'screen', mode: 'clock', x: x + w - u(24), y: yG - u(16), w: textW('00:00', Q), h: u(5), col: T });
    sign({ kind: 'text', s: '>>>', x: x + w - u(16), y: yG + u(5), w: textW('>>>', Q), h: u(5), col: '#ff2a6d', faulty: true });
    const dy = yG + u(6);
    const dw = Math.floor((w - u(10)) / 2);
    for (let k = 0; k < 2; k++) {
      const dx = x + u(4) + k * (dw + u(2));
      R(g, dx, dy, dw, ch - dy, '#0e1a1a');
      const m = Q + 1;
      for (let yy = dy + 1; yy < ch; yy++) for (let xx = dx + 1; xx < dx + dw - 1; xx++) if ((xx + yy) % m === 0 || (xx - yy + 3000) % m === 0) A(g, xx, yy, 1, 1, '#4fb3a8', 0.55);
      R(g, dx, dy, dw, Q, '#3a8a80');
    }
    A(g, x + u(3), dy, Q, ch - dy, T, 0.7);
    A(g, x + w - u(4), dy, Q, ch - dy, T, 0.7);
    world.spills.push({ x: x + u(3), w: w - u(6), col: '#4fb3a8' });
    world.stops.push(x + Math.floor(w / 2));
  }
  // A KIOSK wall: a terminal (its screen playing), a ticket booth lit inside, a tall neon tube, pipes,
  // a junction box, a bin
  function kiosk(g, x, w, ch, yG, r) {
    R(g, x + Q, yG - u(6), w - u(2), u(2), '#3a3f4e'); // (pipes along the top)
    R(g, x + Q, yG - u(6), w - u(2), 1, '#4e5464');
    R(g, x + Q, yG - u(3), w - u(2), Q, '#2c303c');
    for (let px = x + u(4); px < x + w - u(2); px += u(9)) R(g, px, yG - u(7), Q, u(5), '#4a4e5c');
    for (let px = x + u(6); px < x + w; px += u(12)) R(g, px, yG, 1, ch - yG, '#1a1826'); // (its panels' seams)
    const kx = x + u(4);
    R(g, kx, ch - u(22), u(13), u(22), '#3a3466');
    R(g, kx + Q, ch - u(21), u(11), Q, '#5a54a0');
    R(g, kx, ch - u(22), 1, u(22), '#5a54a0');
    R(g, kx + u(2), ch - u(19), u(9), u(8), '#081418');
    sign({ kind: 'screen', mode: 'radar', x: kx + u(2), y: ch - u(19), w: u(9), h: u(8), col: '#05d9e8' });
    R(g, kx + u(3), ch - u(9), u(7), u(2), '#2a2650');
    for (let k = 0; k < 3; k++) R(g, kx + u(3) + k * u(2), ch - u(6), Q, Q, rp(r, ['#ff2a6d', '#39ff88', '#fffb6b'])); // (its buttons)
    const tube = rp(r, ['#ff2a6d', '#ff5ec4', '#05d9e8']);
    sign({ kind: 'tube', x: kx + u(16), y: yG + Q, w: u(2), h: ch - yG - u(3), col: tube, faulty: r() < 0.3 });
    const bx = kx + u(21);
    if (bx + u(18) < x + w - u(8)) {
      R(g, bx, ch - u(26), u(18), u(26), '#1c1a26');
      R(g, bx + Q, ch - u(25), u(16), Q, '#4a3a5a');
      R(g, bx + u(2), ch - u(23), u(14), u(7), '#140c1a');
      sign({ kind: 'screen', mode: 'menu', x: bx + u(3), y: ch - u(22), w: u(12), h: u(5), col: '#ffc46b' });
      R(g, bx + u(2), ch - u(15), u(14), u(10), '#2a1640');
      A(g, bx + u(2), ch - u(15), u(14), u(10), '#b14aed', 0.3); // (the booth's inside, lit)
      R(g, bx + u(8), ch - u(13), u(3), u(8), '#140a20'); // (someone in it)
      R(g, bx + u(8), ch - u(15), u(3), u(2), '#140a20');
      R(g, bx + u(2), ch - u(5), u(14), u(5), '#2a2836');
      R(g, bx + u(2), ch - u(5), u(14), 1, '#4a4858');
      world.spills.push({ x: bx, w: u(18), col: '#b14aed' });
      world.stops.push(bx + u(9));
    }
    R(g, x + w - u(7), ch - u(12), u(5), u(9), '#4a4e5c'); R(g, x + w - u(6), ch - u(10), u(3), Q, '#2a2d38'); R(g, x + w - u(5), ch - u(7), Q, Q, '#ffb000'); // (a junction box)
    R(g, x + w - u(6), ch - u(3), u(3), u(3), '#3a2a26'); // (a bin)
  }
  // A WINDOW the city shows through: cut out of the wall (the far layers behind it), its frame, cables
  // hanging inside, a neon sign on the glass
  function windowLot(g, x, w, ch, yG, r) {
    const wx = x + u(6);
    const ww = w - u(12);
    const wy = yG - u(18);
    const wh = ch - wy - u(8);
    R(g, wx - u(2), wy - u(2), ww + u(4), wh + u(4), '#1a1f24');
    R(g, wx - u(2), wy - u(2), ww + u(4), 1, '#3a3f4e');
    g.clearRect(wx, wy, ww, wh); // (the hole: the city behind)
    A(g, wx, wy, ww, wh, '#1a0a2a', 0.18); // (the glass's tint)
    for (let k = 0; k < 3; k++) { const sx = wx + ri(r, u(2), Math.max(u(3), ww - u(8))); for (let i = 0; i < u(6); i++) A(g, sx + i, wy + u(3) + i, 1, 1, '#ffffff', 0.1); } // (reflections)
    R(g, wx + Math.floor(ww / 2), wy, Q, wh, '#1a1f24'); // (its bar)
    for (let c = 0; c < 3; c++) { // (cables hanging inside)
      const cx0 = wx + ri(r, 0, ww - u(4));
      const cx1 = Math.min(wx + ww - 1, cx0 + u(ri(r, 6, 16)));
      const sag = u(ri(r, 2, 6));
      for (let cx = cx0; cx <= cx1; cx++) { const t = (cx - cx0) / Math.max(1, cx1 - cx0); R(g, cx, wy + Math.round(sag * 4 * t * (1 - t)), 1, Math.max(1, Q - 1), '#05040a'); }
    }
    if (ww > u(20)) {
      const n = Math.min(5, Math.floor((wh - u(4)) / u(7)));
      sign({ kind: 'glyphs', glyphs: Array.from({ length: n }, () => glyph(r)), x: wx + ww - u(9), y: wy + u(3), w: u(5), h: n * u(7), col: rp(r, ['#ff5ec4', '#b14aed', '#05d9e8']), faulty: r() < 0.15 });
    }
    R(g, wx - u(3), wy + wh + u(2), ww + u(6), Q, '#3a3f4e'); // (the sill)
    R(g, x + u(3), ch - u(4), w - u(6), Q, '#1a1826');
    world.stops.push(x + Math.floor(w / 2));
  }
  // A FOOD STALL: its canopy, a string of bulbs, the counter, a pot steaming, its menu lit
  function stall(g, x, w, ch, yG, r) {
    const can = rp(r, [['#a8203a', '#5a1020'], ['#206a6a', '#103434'], ['#a86a20', '#583410']]);
    for (let cx = x + Q; cx < x + w - Q; cx++) R(g, cx, yG + u(4), 1, u(4), can[Math.floor(cx / u(3)) % 2]);
    for (let cx = x + Q; cx < x + w - Q; cx += u(3)) R(g, cx, yG + u(8), u(3), Q, can[Math.floor(cx / u(3)) % 2]); // (its scalloped edge)
    R(g, x + Q, yG + u(8) + Q, w - u(2), 1, '#1a0a10');
    for (let bx = x + u(3); bx < x + w - u(2); bx += u(4)) sign({ kind: 'lantern', x: bx, y: yG + u(9) + 1, w: Q, h: Q, col: '#fff2b0', faulty: r() < 0.05 });
    R(g, x + u(3), yG + u(8), Q, ch - yG - u(8), '#2a1a14');
    R(g, x + w - u(4), yG + u(8), Q, ch - yG - u(8), '#2a1a14');
    A(g, x + u(4), yG + u(9), w - u(8), ch - yG - u(18), '#ffb347', 0.18); // (warm light under the canopy)
    R(g, x + u(6), ch - u(9), w - u(12), u(9), '#4a2e20'); // (the counter)
    for (let px = x + u(6); px < x + w - u(6); px += u(3)) R(g, px, ch - u(9), 1, u(9), '#3a2418');
    R(g, x + u(6), ch - u(9), w - u(12), Q, '#7a5034');
    const pot = x + u(ri(r, 9, Math.floor(w / Q) - 16));
    R(g, pot, ch - u(13), u(6), u(4), '#5a5e6a'); R(g, pot - Q, ch - u(13), u(8), Q, '#7a7e8a'); R(g, pot + Q, ch - u(12), 1, u(3), '#8a8e9a');
    world.grates.push({ x: pot + u(3), y: u(13), pot: true });
    const mx = x + w - u(16);
    R(g, mx, yG + u(11), u(11), u(9), '#0a0608');
    sign({ kind: 'screen', mode: 'menu', x: mx + Q, y: yG + u(12), w: u(9), h: u(7), col: '#ffc46b' });
    world.spills.push({ x: x + u(4), w: w - u(8), col: '#ffb347', shop: true });
    world.stops.push(x + Math.floor(w / 2));
  }
  // A LOW building: its rooftop (railing, a rooftop sign), the city plain over it
  function lowLot(g, x, w, ch, yG, r, top) {
    R(g, x + Q, top - u(3), w - u(2), Q, '#3a3f4e');
    for (let k = x + Q; k < x + w - Q; k += u(3)) R(g, k, top - u(2), Math.max(1, Q - 1), u(2), '#3a3f4e');
    if (r() < 0.6) {
      const word = rp(r, WORDS.filter((s) => textW(s, u(2)) <= w - u(6))) || 'BAR';
      const k = textW(word, u(2)) <= w - u(6) ? u(2) : Q;
      const sx = x + Math.floor((w - textW(word, k)) / 2);
      const sy = top - u(6) - 5 * k;
      if (sy < u(2)) return (r() < 0.5 ? shop : shutter)(g, x, w, ch, yG, r); // (no room over it for the sign)
      R(g, sx - u(2), sy - u(2), textW(word, k) + u(4), 5 * k + u(4), '#07060d');
      R(g, sx + u(2), sy + 5 * k + u(2), Q, top - (sy + 5 * k + u(2)), '#2a2d38');
      R(g, sx + textW(word, k) - u(3), sy + 5 * k + u(2), Q, top - (sy + 5 * k + u(2)), '#2a2d38');
      sign({ kind: 'text', s: word, x: sx, y: sy, w: textW(word, k), h: 5 * k, k, col: rp(r, NEON), faulty: r() < 0.2 });
    }
    return (r() < 0.5 ? shop : shutter)(g, x, w, ch, yG, r); // (the shop under it, as the shops are)
  }
  // AN ALLEY: the city down it (left open), its shadowed floor, a dumpster, boxes, a hanging sign
  function alley(g, x, w, ch, r) {
    const d = u(26);
    for (let y = ch - d; y < ch; y++) A(g, x, y, w, 1, '#05040c', 0.25 + 0.5 * ((y - (ch - d)) / d)); // (the dark down it)
    A(g, x + Math.floor(w / 2) - u(2), ch - u(22), u(4), u(6), '#ffc46b', 0.35); // (a door lit far down it)
    if (w >= u(18)) { R(g, x + u(2), ch - u(8), u(11), u(8), '#1d3a2e'); R(g, x + u(2), ch - u(8), u(11), Q, '#2a5040'); R(g, x + u(3), ch - u(6), u(9), 1, '#16302a'); R(g, x + u(4), ch - u(4), u(2), Q, '#c8c8c8'); } // (a dumpster)
    R(g, x + w - u(6), ch - u(5), u(5), u(5), '#5a4630'); R(g, x + w - u(5), ch - u(8), u(4), u(3), '#6a5238'); R(g, x + w - u(6), ch - u(3), u(5), 1, '#3a2e20'); // (boxes)
    world.grates.push({ x: x + Math.floor(w / 2), y: u(2), alley: true });
    if (r() < 0.7) { // (a sign hung off the wall on a bracket)
      const hy = ch - u(ri(r, 34, 50));
      R(g, x, hy, u(4), Q, '#3a3f4e');
      R(g, x + u(3), hy + Q, Q, u(2), '#3a3f4e');
      R(g, x + Q, hy + u(3), u(7), u(13), '#07060d');
      sign({ kind: 'glyphs', glyphs: [glyph(r), glyph(r)], x: x + u(2), y: hy + u(4), w: u(5), h: u(12), col: rp(r, NEON), box: r() < 0.5, faulty: r() < 0.2 });
    }
    for (let c = 0; c < 2; c++) { // (cables across it)
      const y0 = ch - u(ri(r, 40, 70));
      for (let cx = x; cx < x + w; cx++) { const t = (cx - x) / w; R(g, cx, y0 + Math.round(u(4) * 4 * t * (1 - t)), 1, 1, '#05040a'); }
    }
  }

  // THE SIDEWALK: wet, the shops' light and the signs' colors spilled in it (in streaks, as light lies
  // on the wet), puddles, its tiles
  function drawGround(g, cw, ch, r) {
    R(g, 0, 0, cw, ch, '#14121f');
    R(g, 0, 0, cw, Q, '#2a2540');
    g.fillStyle = '#1b1829';
    for (let x = Math.floor(r() * u(7)); x < cw; x += u(7)) g.fillRect(x, Q, 1, ch - Q);
    g.fillRect(0, u(3), cw, 1);
    const rows = Math.min(ch, u(5));
    for (const s of world.spills) for (let y = Q; y < rows; y++) for (let x = s.x; x < s.x + s.w; x++) {
      if (r() < (0.6 - (y / Q) * 0.1) * (x % 3 ? 1 : 0.4)) A(g, x, y, 1, 1, s.col, 0.12 + r() * 0.22);
    }
    for (const s of world.signs) {
      if (s.kind !== 'text' && s.kind !== 'tube') continue;
      for (let y = Q; y < rows; y++) for (let x = s.x - Q; x <= s.x + s.w; x++) if (r() < 0.35 - (y / Q) * 0.06) A(g, x, y, 1, 1, s.col, 0.15 + r() * 0.2);
    }
    for (let i = 0, n = Math.round(cw / u(50)); i < n; i++) { // (puddles: darker, a glint)
      const px = Math.floor(r() * cw);
      const pw = u(6) + Math.floor(r() * u(10));
      const py = u(2) + Math.floor(r() * u(2));
      R(g, px, py, pw, Q, '#0c0b16');
      R(g, px + Q, py + Q, pw - u(2), Q, '#0c0b16');
      A(g, px + u(2) + Math.floor(r() * (pw - u(4))), py, u(2), 1, rp(r, NEON), 0.5);
    }
  }
  // IN FRONT: bollards, grates, bags, a cone (low: the bots' feet show over them)
  function drawNear(g, cw, ch, r) {
    for (let x = Math.floor(r() * u(30)); x < cw; x += u(26) + Math.floor(r() * u(40))) {
      const t = r();
      if (t < 0.35) { R(g, x, ch - u(5), u(2), u(5), '#2c2f3c'); R(g, x, ch - u(5), 1, u(5), '#40445a'); R(g, x, ch - u(6), u(2), Q, rp(r, ['#05d9e8', '#ff2a6d', '#fffb6b'])); }
      else if (t < 0.6) { R(g, x, ch - Q, u(6), Q, '#0b0a12'); for (let k = 0; k < u(6); k += 2) R(g, x + k, ch - Q, 1, Q, '#3a3a48'); world.grates.push({ x: x + u(3), y: -u(3), near: true }); }
      else if (t < 0.8) { R(g, x, ch - u(3), u(4), u(3), '#0d0d14'); R(g, x + Q, ch - u(4), u(2), Q, '#0d0d14'); R(g, x + Q, ch - u(3), Q, Q, '#23232e'); }
      else { R(g, x + Q, ch - u(4), Q, Q, '#ff6a1c'); R(g, x, ch - u(3), u(3), u(2), '#ff6a1c'); R(g, x, ch - u(2), u(3), Q, '#f2f2f2'); R(g, x - Q, ch - Q, u(5), Q, '#2a1a10'); }
    }
  }

  // ── What flickers and plays: the signs, the screens, the billboards, the blinking lights ──
  function bounds(s) { const m = Q * 2; return [s.x - m, s.y - m, s.w + m * 2, s.h + m * 2]; }
  const meets = (a, b) => a[0] < b[0] + b[2] && b[0] < a[0] + a[2] && a[1] < b[1] + b[3] && b[1] < a[1] + a[3];
  function paintSign(g, s, now) {
    const [bx, by, bw, bh] = bounds(s);
    const on = s.on;
    const col = on ? s.col : '#3a2a3a';
    const k = s.k || Q;
    if (on && s.kind !== 'screen') { // (its glow: a soft halo, stepped)
      A(g, bx, by, bw, bh, s.col, s.kind === 'lantern' ? 0.18 : 0.08);
      A(g, bx + Q, by + Q, bw - u(2), bh - u(2), s.col, s.kind === 'lantern' ? 0.18 : 0.08);
    }
    if (s.kind === 'text') text(g, s.s, s.x, s.y, col, k, on);
    else if (s.kind === 'logo') { text(g, 'BYTE', s.x, s.y, on ? s.col : '#1a3a2a', k, on); text(g, 'FALL', s.x + 16 * k, s.y, on ? s.col2 : '#3a2a10', k, on); }
    else if (s.kind === 'glyphs') {
      if (s.box && on) { R(g, s.x - Q, s.y - Q, s.w + u(2), s.h + Q, s.col); A(g, s.x - Q, s.y - Q, s.w + u(2), Q, '#ffffff', 0.3); }
      const gc = s.box ? (on ? '#1a0a14' : '#2a1a24') : col;
      s.glyphs.forEach((gl, i) => { for (const [gx, gy] of gl) { const px = s.x + (s.across ? i * u(7) + gx * Q : gx * Q); const py = s.y + (s.across ? gy * Q : i * u(7) + gy * Q); R(g, px, py, Q, Q, gc); if (on && !s.box && Q >= 3) R(g, px + 1, py + 1, Q - 2, Q - 2, HOT); } });
    } else if (s.kind === 'tube') {
      R(g, s.x, s.y, s.w, s.h, col);
      if (on) { A(g, s.x - Q, s.y, Q, s.h, s.col, 0.45); A(g, s.x + s.w, s.y, Q, s.h, s.col, 0.45); R(g, s.x + Math.floor(s.w / 2), s.y, 1, s.h, '#ffe6f0'); }
    } else if (s.kind === 'rungs') {
      for (let i = 0; i < s.n; i++) { R(g, s.x, s.y + i * u(3), s.w, Q, col); if (on) R(g, s.x + 1, s.y + i * u(3), s.w - 2, 1, HOT); }
    } else if (s.kind === 'lantern') { // (ribbed paper, lit from within; a dark cap)
      R(g, s.x, s.y + 1, s.w, Math.max(1, s.h - 1), col);
      if (s.w >= 3) { R(g, s.x + 1, s.y, s.w - 2, s.h, col); R(g, s.x + 1, s.y, s.w - 2, 1, '#2a1010'); for (let ry = s.y + 2; ry < s.y + s.h - 1; ry += 2) A(g, s.x, ry, s.w, 1, '#000000', 0.25); if (on) R(g, s.x + Math.floor(s.w / 2), s.y + 1, 1, s.h - 2, '#fff4d0'); }
    } else if (s.kind === 'screen') paintScreen(g, s, now);
  }
  function paintScreen(g, s, now) {
    const t = (now || 0) / 1000;
    R(g, s.x, s.y, s.w, s.h, '#05080a');
    if (!s.on) return;
    if (s.mode === 'clock') { const d = new Date(); const hm = `${String(d.getHours()).padStart(2, '0')}${t % 2 < 1 ? ':' : ' '}${String(d.getMinutes()).padStart(2, '0')}`; text(g, hm, s.x, s.y, s.col, Q, false); }
    else if (s.mode === 'radar') { // (a sweep round a ring, a blip)
      const cx = s.x + Math.floor(s.w / 2); const cy = s.y + Math.floor(s.h / 2);
      const rx = s.w / 2 - 1; const ry = s.h / 2 - 1;
      for (let a = 0; a < 6.28; a += 0.25 / Q) A(g, cx + Math.round(Math.cos(a) * rx), cy + Math.round(Math.sin(a) * ry), 1, 1, s.col, 0.5);
      const a = t * 2.4; for (let k = 0; k < rx; k++) A(g, cx + Math.round(Math.cos(a) * k), cy + Math.round(Math.sin(a) * k * (ry / rx)), 1, 1, s.col, 0.9);
      if ((t % 3) < 1.5) R(g, cx + Math.round(rx * 0.5), cy - Math.round(ry * 0.3), Q, Q, '#ff2a6d');
    } else { // ('menu': lines of it, a cursor blinking)
      for (let ly = 0; ly < s.h; ly += Q + 1) A(g, s.x + Q, s.y + ly, Math.max(2, s.w - u(2) - ((ly * 7) % u(5))), 1, s.col, 0.7);
      if (t % 1 < 0.5) R(g, s.x + s.w - u(2), s.y + s.h - Q, Q, Q, s.col);
    }
  }
  function paintBoard(g, b, now) {
    const { x, y, w, h, col } = b;
    g.clearRect(x, y, w, h);
    const t = now / 1000 + b.t;
    const off = b.glitch > now ? Math.round(rand(-2, 2)) * Q : 0;
    A(g, x, y, w, h, col, 0.16);
    g.fillStyle = col;
    if (b.mode === 'logo') {
      const s = Math.floor(t) % 6 < 4 ? 'BYTEFALL' : 'DECRYPT';
      const one = textW(s, Q) <= w - Q ? s : 'BYTE';
      text(g, one, x + Math.floor((w - textW(one, Q)) / 2) + off, y + Math.floor((h - u(5)) / 2), col, Q, false);
    } else if (b.mode === 'bit') {
      const s = `[${1 + (Math.floor(t * 1.5) % 7)}]`;
      text(g, s, x + Math.floor((w - textW(s, Q)) / 2) + off, y + Math.floor((h - u(5)) / 2), col, Q, false);
    } else if (b.mode === 'eye') {
      const cx = x + Math.floor(w / 2) + off;
      const cy = y + Math.floor(h / 2);
      const blink = (t % 4) > 3.8;
      const rx = u(7);
      for (let dx = -rx; dx <= rx; dx++) { const e = Math.round(Math.sqrt(Math.max(0, 1 - (dx / rx) ** 2)) * (blink ? 0 : u(3))); g.fillRect(cx + dx, cy - e, 1, 1); g.fillRect(cx + dx, cy + e, 1, 1); }
      if (!blink) { const lx = Math.round(Math.sin(t * 0.9) * u(3)); g.fillRect(cx + lx - Q, cy - Q, u(3), u(3)); g.fillStyle = '#05040c'; g.fillRect(cx + lx, cy, Q, Q); }
    } else if (b.mode === 'beat') {
      for (let i = 0; i < Math.floor((w - u(2)) / u(3)); i++) { const bh = Math.max(1, Math.round((h - u(2)) * (0.25 + 0.75 * Math.abs(Math.sin(t * 2.3 + i * 0.9) * Math.cos(t * 1.1 + i * 0.4))))); g.fillRect(x + Q + i * u(3) + off, y + h - Q - bh, u(2), bh); }
    } else {
      const s = 'NEON NEVER SLEEPS // DATA IS CURRENCY // 2099 // ';
      const sx = x + w - (Math.floor(t * 9 * Q) % (textW(s, Q) + w));
      g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
      text(g, s, sx + off, y + Math.floor((h - u(5)) / 2), col, Q, false);
      g.restore();
    }
    g.fillStyle = 'rgba(5, 4, 12, 0.45)'; // (its scanlines)
    for (let sy = y + 1; sy < y + h; sy += 2) g.fillRect(x, sy, w, 1);
  }
  function paintFx(now, all) {
    if (!world) return;
    const calm = lowFx();
    const dirty = {};
    for (const s of world.signs) {
      let changed = all || s.kind === 'screen';
      if (s.faulty && !calm && now >= s.next) { // (a faulty tube: off a moment, stuttering, back)
        s.on = !s.on;
        s.next = now + (s.on ? (Math.random() < 0.7 ? rand(40, 160) : rand(1500, 6000)) : rand(40, 220));
        if (!s.on) s.out = now; // (for whoever's under it to notice)
        changed = true;
      }
      if (changed) { const b = bounds(s); els[s.layer].getContext('2d').clearRect(...b); (dirty[s.layer] = dirty[s.layer] || []).push(b); }
    }
    // (what changed drawn again, and the part of any sign it overlaps: only inside what was cleared, so
    // a glow is never laid over itself)
    for (const [layer, rects] of Object.entries(dirty)) {
      const g = els[layer].getContext('2d');
      g.save();
      g.beginPath();
      for (const d of rects) g.rect(...d);
      g.clip();
      for (const s of world.signs) { if (s.layer !== layer) continue; const b = bounds(s); if (rects.some((d) => meets(b, d))) paintSign(g, s, calm ? 0 : now); }
      g.restore();
    }
    const mid = els['mid-fx'].getContext('2d');
    for (const b of world.boards) {
      if (!calm && Math.random() < 0.01) b.glitch = now + rand(80, 260);
      paintBoard(mid, b, calm ? 0 : now);
    }
    for (const L of world.lights) { // (the masts' and roofs' red lights, blinking)
      const g = els[L.layer].getContext('2d');
      const on = calm || Math.sin(now / 600 + L.ph) > 0.2;
      g.clearRect(L.x - Q, L.y - Q, u(3), u(3));
      if (on) { A(g, L.x - Q, L.y - Q, u(3), u(3), '#ff283c', 0.35); R(g, L.x, L.y, Math.max(1, Q - 1), Math.max(1, Q - 1), '#ff3a4a'); }
    }
  }

  // ── THE CROWD: pixel figures at the bots' pixel size, taller than them (rows of palette letters, two
  // frames of legs), scaled up to the street's pixels the pixel artist's way, each pose drawn once ──
  const PAL = {
    K: '#06050b', h: '#1d1a2e', H: '#2c2744', B: '#000000', C: '#26213a', c: '#16132a', G: '#141220', b: '#0b0a12',
    M: '#6c7488', m: '#a2aabe', Q: '#4a5266', q: '#5e6680', a: '#3a3f4e', D: '#3c4458', d: '#262c3e', S: '#22222e', J: '#1c1b2a', P: '#121220',
    X: '#6b4a2a', x: '#8a6440', p: '#5c6478', w: '#33304a',
  };
  // (e: eyes, L: an LED, v: a visor, U: an umbrella's neon rim, u: its canopy, s: its shaft, g: a hover glow,
  // r: a red light, O: a droid's eye, o: its rim)
  const HOOD = {
    w: 12,
    rows: ['....hhhh....', '...hHHHHh...', '..hHHHHHHh..', '..hHBBBBHh..', '..hHBeBeHh..', '..hHBBBBHh..', '...hHBBHh...', '..cCCCCCCc..', '.cCCCCCCCCc.', '.cCCcCCcCCc.', '.cCCcCCcCCc.', '.cCLcCCcCCc.', '.cCCcCCcCCc.', '.cCCCCCCCCc.', '..cCCCCCCc..', '..cCCwwCCc..', '..cCC..CCc..'],
    legs: [['..GG....GG..', '..GG....GG..', '.bbb....bbb.'], ['....GG.GG...', '....GG.GG...', '...bbb.bbb..']],
  };
  // (the umbrella: a hooded figure under it, the shaft down to the hand at its side)
  const UMB = (() => {
    const canopy = ['..........UUUU......', '.......UUuuuuuUU....', '.....UUuuuuuuuuuUU..', `....U${'u'.repeat(13)}U.`, '...UUUUUUUUUUUUUUUUU'];
    const rows = [...canopy];
    for (let i = 0; i < 2; i++) rows.push('............s.......');
    HOOD.rows.forEach((r, i) => { let row = `${r}........`.slice(0, 20); if (i <= 9) row = `${row.slice(0, 12)}s${row.slice(13)}`; rows.push(row); });
    return { w: 20, rows, legs: HOOD.legs.map((f) => f.map((r) => `${r}........`.slice(0, 20))), eyeRow: 7 + 4 };
  })();
  const FIG = {
    hood: { ...HOOD, eyeRow: 4 },
    umbrella: UMB,
    robot: { w: 14, rows: ['......r.......', '......a.......', '....MMMMMM....', '...MmmmmmmM...', '...MvvvvvvM...', '...MmmmmmmM...', '....MMMMMM....', '.....QQQQ.....', '.MMQQQQQQQQMM.', 'MmmQqqqqqqQmmM', 'MmmQqLLqqqQmmM', 'Mm.QqLLqqqQ.mM', 'Mm.QqqqqqqQ.mM', 'pp.QQQQQQQQ.pp', '...QQQQQQQQ...', '...Qq....qQ...'], legs: [['...QQ....QQ...', '...QQ....QQ...', '..QQ......QQ..', '..KKK....KKK..'], ['....QQ..QQ....', '....QQ..QQ....', '....QQ..QQ....', '...KKK..KKK...']] },
    android: { w: 10, rows: ['...SSSS...', '..SSSSSS..', '..SvvvvS..', '..SSSSSS..', '...SSSS...', '....SS....', '..JJJJJJ..', '.JJJLJJJJ.', 'JJ.JLJJ.JJ', 'J..JLJJ..J', 'J..JLJJ..J', 'S..JJJJ..S', '...JJJJ...', '...JJJJ...', '...JJJJ...', '...P..P...', '...P..P...', '...P..P...'], legs: [['..P....P..', '..P....P..', '.bb....bb.'], ['...P..P...', '...P..P...', '..bb..bb..']] },
    droid: { w: 12, rows: ['....dddd....', '..dDDDDDDd..', '.dDDDDDDDDd.', '.dDDoOOoDDd.', 'dDDDoOOoDDDd', 'dDDDDDDDDDDd', '.dDDDDDDDDd.', '..dDDDDDDd..', '...dddddd...'], legs: [['...g.gg.g...', '....gggg....', '............'], ['..g.g..g.g..', '...gggggg...', '....g..g....']], hover: 4 },
    drone: { w: 13, rows: ['ppp.......ppp', '.a.........a.', '.aDDDDDDDDDa.', '...DDDrDDD...', '....DDDDD....', '.....XxX.....', '....XXXXX....', '....XXxXX....'], legs: [[], []], fly: true },
  };
  const FIG_KINDS = ['hood', 'hood', 'umbrella', 'robot', 'android', 'droid', 'drone'];
  // SCALE2X / SCALE3X (EPX): a grid made 2 or 3 times as fine, its diagonals smoothed, its colors kept
  function scale2(g) {
    const h = g.length; const w = g[0].length;
    const at = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? '.' : g[y][x]);
    const out = Array.from({ length: h * 2 }, () => new Array(w * 2));
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const p = at(x, y); const a = at(x, y - 1); const b = at(x + 1, y); const c = at(x - 1, y); const d = at(x, y + 1);
      out[y * 2][x * 2] = c === a && c !== d && a !== b ? a : p;
      out[y * 2][x * 2 + 1] = a === b && a !== c && b !== d ? b : p;
      out[y * 2 + 1][x * 2] = d === c && d !== b && c !== a ? c : p;
      out[y * 2 + 1][x * 2 + 1] = b === d && b !== a && d !== c ? d : p;
    }
    return out;
  }
  function scale3(g) {
    const h = g.length; const w = g[0].length;
    const at = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? '.' : g[y][x]);
    const out = Array.from({ length: h * 3 }, () => new Array(w * 3));
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const A0 = at(x - 1, y - 1); const B = at(x, y - 1); const C0 = at(x + 1, y - 1); const D = at(x - 1, y); const E = at(x, y); const F = at(x + 1, y); const G = at(x - 1, y + 1); const H = at(x, y + 1); const I = at(x + 1, y + 1);
      const o = [
        D === B && B !== F && D !== H ? D : E,
        (D === B && B !== F && D !== H && E !== C0) || (B === F && B !== D && F !== H && E !== A0) ? B : E,
        B === F && B !== D && F !== H ? F : E,
        (D === B && B !== F && D !== H && E !== G) || (D === H && D !== B && H !== F && E !== A0) ? D : E,
        E,
        (B === F && B !== D && F !== H && E !== I) || (H === F && D !== H && B !== F && E !== C0) ? F : E,
        D === H && D !== B && H !== F ? D : E,
        (D === H && D !== B && H !== F && E !== I) || (H === F && D !== H && B !== F && E !== G) ? H : E,
        H === F && D !== H && B !== F ? F : E,
      ];
      for (let k = 0; k < 9; k++) out[y * 3 + Math.floor(k / 3)][x * 3 + (k % 3)] = o[k];
    }
    return out;
  }
  const upscale = (g, q) => (q === 2 ? scale2(g) : q === 3 ? scale3(g) : q === 4 ? scale2(scale2(g)) : g);
  const spriteCache = new Map();
  function sprite(e, frame, blink) {
    const key = `${e.kind}|${frame}|${e.dir}|${e.eye}|${e.led}|${blink}|${Q}`;
    let c = spriteCache.get(key);
    if (c) return c;
    const f = e.f;
    const rows = [...f.rows, ...(f.legs[frame] || [])].map((r) => (e.dir > 0 ? r : [...r].reverse().join('')));
    const grid = upscale(rows.map((r) => [...r]), Q);
    c = document.createElement('canvas');
    c.width = grid[0].length;
    c.height = grid.length;
    const g = c.getContext('2d');
    for (let y = 0; y < grid.length; y++) for (let x = 0; x < grid[0].length; x++) {
      const ch = grid[y][x];
      if (ch === '.') continue;
      let col = PAL[ch];
      if (ch === 'e' || ch === 'v' || ch === 'O') col = e.eye;
      else if (ch === 'L') col = e.led;
      else if (ch === 'U') col = '#05d9e8';
      else if (ch === 'u') col = 'rgba(5, 217, 232, 0.16)';
      else if (ch === 's') col = '#8ff2ff';
      else if (ch === 'o') col = '#16324a';
      else if (ch === 'g') col = 'rgba(255, 94, 196, 0.6)';
      else if (ch === 'r') col = blink ? '#ff3a4a' : '#40141a';
      else if (ch === 'p' && f.fly) col = frame ? '#5c6478' : 'rgba(92, 100, 120, 0.4)';
      g.fillStyle = col;
      g.fillRect(x, y, 1, 1);
    }
    // (lit from above by the signs: a sheen along its top edges)
    const img = g.getImageData(0, 0, c.width, c.height);
    const px = img.data;
    for (let y = 1; y < c.height; y++) for (let x = 0; x < c.width; x++) {
      const i = (y * c.width + x) * 4;
      if (px[i + 3] > 200 && px[i - c.width * 4 + 3] === 0) { px[i] = Math.min(255, px[i] + 40); px[i + 1] = Math.min(255, px[i + 1] + 34); px[i + 2] = Math.min(255, px[i + 2] + 60); }
    }
    g.putImageData(img, 0, 0);
    if (f.eyeRow !== undefined) { const ex = e.dir > 0 || f.w === 12 ? u(3) : u(f.w - 9); A(g, ex, u(f.eyeRow - 1), u(6), u(3), e.eye, 0.22); } // (the eyes' glow in the hood)
    spriteCache.set(key, c);
    return c;
  }
  function spawnWalker(kind, side) {
    if (!world) return;
    kind = kind && FIG[kind] ? kind : pick(FIG_KINDS);
    const f = FIG[kind];
    const dir = side ? (side === 'left' ? 1 : -1) : (Math.random() < 0.5 ? 1 : -1);
    // (stopping a while at a window, a stall, the metro's doors, part way across: the nearest one ahead)
    const ahead = world.stops.filter((s) => (dir > 0 ? s > cam + world.Wc * 0.15 : s < cam + world.Wc * 0.85) && s > cam && s < cam + world.Wc);
    crowd.push({
      kind, f, dir, t: 0,
      x: dir > 0 ? cam - u(f.w) - u(2) : cam + world.Wc + u(2), // (along the whole street, in cells)
      v: u(kind === 'droid' ? rand(9, 14) : kind === 'drone' ? rand(10, 16) : rand(4.5, 7)),
      eye: pick(['#05d9e8', '#ff2a6d', '#b14aed', '#fffb6b']),
      led: pick(['#05d9e8', '#ff2a6d', '#39ff88']),
      y: kind === 'drone' ? u(ri(Math.random, 50, 72)) : 0,
      stop: !f.fly && ahead.length && Math.random() < 0.45 ? pick(ahead) : null,
      wait: 0,
      seen: new Set(), // (the bots that have noticed it already)
    });
  }
  function crowdTick(dt, now) {
    if (!world) return;
    if (now > nextWalker) {
      nextWalker = now + rand(3500, 9000);
      if (crowd.length < 5) spawnWalker();
    }
    for (const e of crowd) {
      e.t += dt;
      if (e.wait > 0) { e.wait -= dt; continue; }
      if (e.stop !== null && ((e.dir > 0 && e.x + u(e.f.w) / 2 >= e.stop) || (e.dir < 0 && e.x + u(e.f.w) / 2 <= e.stop))) { e.wait = rand(4, 10); e.stop = null; continue; }
      e.x += e.dir * e.v * dt;
    }
    for (let i = crowd.length - 1; i >= 0; i--) {
      const e = crowd[i];
      if (e.x < cam - u(e.f.w) - u(60) || e.x > cam + world.Wc + u(60)) crowd.splice(i, 1);
    }
  }
  function drawCrowd(now) {
    const c = els.crowd;
    const g = c.getContext('2d');
    g.clearRect(0, 0, c.width, c.height);
    for (const e of crowd) {
      const f = e.f;
      const walking = e.wait <= 0;
      const frame = walking ? Math.floor(e.t * (e.kind === 'droid' ? 8 : 4)) % 2 : 0;
      const blink = Math.sin(now / 300 + e.x) > 0;
      const img = sprite(e, frame, blink);
      const bob = f.hover ? Math.round(Math.sin(e.t * 3) * Q) : f.fly ? Math.round(Math.sin(e.t * 5) * Q) : 0;
      g.drawImage(img, Math.round(e.x - cam), c.height - img.height - u(f.hover || 0) - e.y + bob);
      if (e.kind === 'umbrella') A(g, Math.round(e.x - cam) + (e.dir > 0 ? u(3) : 0), c.height - img.height - e.y + u(4), u(17), u(6), '#05d9e8', 0.06); // (the light off its rim)
    }
  }

  // ── THE BOTS' AWARENESS: what's around them, noticed now and then (one bot at a time) ──
  // (what a bot makes of a figure passing close: its face, what it says; a look its way)
  const PASSING = {
    hood: [['worried', '...'], ['skeptic', 'hm'], ['scared', '!?']],
    umbrella: [['happy', 'nice'], ['love', '<3'], ['happy', 'ooh']],
    robot: [['happy', 'hi!'], ['surprised', 'beep?'], ['smug', 'nice bolts']],
    android: [['skeptic', 'hm'], ['surprised', '!'], ['worried', 'uh']],
    droid: [['surprised', '!'], ['scared', 'eep'], ['surprised', 'whoa']],
    drone: [['surprised', '?'], ['happy', 'ooh'], ['skeptic', 'hm']],
  };
  function notice(w, mood, words, look, now) {
    if (!api.say) return;
    if (look && api.turn && w.state === 'idle') api.turn(w, look);
    api.say(w, mood, words);
    w.cyNext = now + rand(10000, 20000);
    nextNotice = now + rand(3000, 7000);
    api.botEvent(`cyber-notice-${mood}`);
  }
  function awareTick(now) {
    if (!world || shot || now < nextNotice || !api.walkers) return;
    const W = api.laneW();
    const ws = api.walkers().filter((w) => w.el && !w.leaving && !w.claimed && w.x > 0 && w.x < W - 34 && ['walk', 'idle'].includes(w.state) && now > (w.cyNext || 0));
    if (!ws.length) return;
    for (const w of ws.sort(() => Math.random() - 0.5)) {
      const mid = w.x + 17; // (the bot's middle, in the page's pixels across the lane)
      // a figure passing close behind it (each one noticed once by each bot)
      for (const e of crowd) {
        const ex = (e.x - cam + u(e.f.w) / 2) * C;
        if (e.seen.has(w) || Math.abs(ex - mid) > 40) continue;
        e.seen.add(w);
        if (Math.random() < 0.45) { const [m, t] = pick(PASSING[e.kind]); notice(w, m, t, ex > mid ? 1 : -1, now); return; }
      }
      // the train going over
      if (train && Math.random() < 0.02) { const tx = (train.x - cam * speedOf.mid + train.len / 2) * C; if (tx > 0 && tx < W) { notice(w, pick(['surprised', 'happy']), pick(['whoa', 'choo', 'ooh']), tx > mid ? 1 : -1, now); return; } }
      // a sign over it sputtering out
      const at = cam + mid / C; // (where it stands along the street, in cells)
      const sput = world.signs.find((s) => s.layer === 'front-fx' && s.out && now - s.out < 600 && at > s.x - u(10) && at < s.x + s.w + u(10));
      if (sput && Math.random() < 0.5) { sput.out = 0; notice(w, 'skeptic', pick(['eh?', 'hm', '...']), 0, now); return; }
      // steam out of a grate under it
      const vent = world.grates.find((gr) => (gr.near || gr.alley) && Math.abs(gr.x - at) < u(5));
      if (vent && !lowFx() && Math.random() < 0.08) { notice(w, pick(['hit', 'surprised']), pick(['hot!', 'pff', 'ack']), 0, now); return; }
      // a lit shop window behind it, stopped at a moment
      const win = world.spills.find((s) => s.shop && at > s.x && at < s.x + s.w);
      if (win && w.state === 'idle' && Math.random() < 0.04) { notice(w, pick(['love', 'happy']), pick(['ooh', 'want', 'shiny']), 0, now); return; }
    }
  }

  // ── THE STEAM (the grates, the alleys, a stall's pot), THE TRAIN and THE TRAFFIC ──
  function steamTick(dt) {
    if (!world || lowFx()) { steam.length = 0; return; }
    for (const gr of world.grates) {
      const sx = gr.x - cam;
      if (sx < -u(10) || sx > world.Wc + u(10)) continue;
      if (Math.random() < dt * (gr.pot ? 3 : gr.alley ? 1.4 : 2)) steam.push({ x: gr.x + rand(-1.5, 1.5) * Q, y: u(3) + (gr.y || 0), vx: rand(-0.6, 0.6) * Q, vy: rand(2.2, 4) * Q, life: rand(2.5, 4.5), t: 0 });
    }
    for (const p of steam) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx += rand(-0.5, 0.5) * Q * dt; }
    for (let i = steam.length - 1; i >= 0; i--) if (steam[i].t > steam[i].life) steam.splice(i, 1);
    const c = els.steam;
    const g = c.getContext('2d');
    g.clearRect(0, 0, c.width, c.height);
    for (const p of steam) {
      const a = 0.2 * (1 - p.t / p.life);
      const rr = Q + Math.floor(p.t * 0.8 * Q);
      g.fillStyle = `rgba(200, 196, 230, ${(a * 0.6).toFixed(3)})`;
      g.fillRect(Math.round(p.x - cam) - rr, c.height - Math.round(p.y) - rr, rr * 2 + 1, rr * 2 + 1);
      g.fillStyle = `rgba(220, 216, 240, ${(a * 0.6).toFixed(3)})`;
      g.fillRect(Math.round(p.x - cam) - Math.floor(rr / 2), c.height - Math.round(p.y) - Math.floor(rr / 2), rr + 1, rr + 1);
    }
  }
  function railTick(dt, now) {
    if (!world || !world.rail) return;
    const c = els.rail;
    const g = c.getContext('2d');
    const k = speedOf.mid;
    if (!train && now > nextTrain) {
      nextTrain = now + rand(18000, 45000);
      const dir = Math.random() < 0.5 ? 1 : -1;
      const len = u(ri(Math.random, 70, 110));
      train = { dir, len, x: dir > 0 ? cam * k - len - u(4) : cam * k + world.Wc + u(4), v: u(rand(26, 40)) };
    }
    g.clearRect(0, 0, c.width, c.height);
    if (!train) return;
    train.x += train.dir * train.v * dt;
    const sx = Math.round(train.x - cam * k);
    const ty = world.rail.y - u(6); // (on top of the beam)
    R(g, sx, ty, train.len, u(6), '#2a2f44');
    R(g, sx, ty, train.len, Q, '#4a5070');
    for (let wx = sx + u(3); wx < sx + train.len - u(3); wx += u(4)) { if ((wx - sx) % u(26) < u(2)) { R(g, wx, ty + Q, 1, u(5), '#1a1e2e'); continue; } A(g, wx, ty + u(2), u(3), u(2), '#ffe6a0', 0.8); }
    A(g, sx, ty + u(5), train.len, Q, '#05d9e8', 0.6); // (its lit underside)
    const nose = train.dir > 0 ? sx + train.len : sx - u(2);
    R(g, nose, ty + u(2), u(2), u(3), '#fff6c8');
    if ((train.dir > 0 && sx > world.Wc + u(20)) || (train.dir < 0 && sx + train.len < -u(20))) train = null;
  }
  function trafficTick(dt, now) {
    if (!world) return;
    const c = els.traffic;
    const g = c.getContext('2d');
    const k = speedOf.towers + 0.12;
    if (now > nextCar && cars.length < (lowFx() ? 1 : 4)) {
      nextCar = now + rand(2500, 7000);
      const dir = Math.random() < 0.5 ? 1 : -1;
      const lane = Math.floor(rand(world.hM + u(4), Math.max(world.hM + u(6), world.hT - u(6))));
      cars.push({ x: dir > 0 ? cam * k - u(10) : cam * k + world.Wc + u(10), y: lane, dir, v: u(rand(10, 24)), body: pick(['#2a2f44', '#3a2440', '#1f3a40']) });
    }
    g.clearRect(0, 0, c.width, c.height);
    for (const car of cars) {
      car.x += car.dir * car.v * dt;
      const sx = Math.round(car.x - cam * k);
      const sy = c.height - car.y;
      R(g, sx, sy, u(5), u(2), car.body);
      R(g, sx + Q, sy - Q, u(3), Q, car.body);
      R(g, sx + Q, sy - Q, u(3), 1, '#5a6080');
      const head = car.dir > 0 ? sx + u(5) : sx - Q;
      const tail = car.dir > 0 ? sx - Q : sx + u(5);
      R(g, head, sy, Q, Q, '#fff6c8');
      A(g, car.dir > 0 ? head + Q : head - u(4), sy, u(4), Q, '#fff6c8', 0.25);
      R(g, tail, sy + Q, Q, Q, '#ff2a4a');
      A(g, car.dir > 0 ? tail - u(3) : tail + Q, sy + Q, u(3), Q, '#ff2a4a', 0.3);
    }
    for (let i = cars.length - 1; i >= 0; i--) { const sx = cars[i].x - cam * k; if (sx < -u(30) || sx > world.Wc + u(30)) cars.splice(i, 1); }
  }

  // ── THE CLOSE-UP ──
  // (a bot's art as it is right now, read off its own page element: every rect drawn, its color, and
  // whether it's its face's, on the 16x17 grid)
  function botArt(w) {
    const svg = w.el.querySelector('svg.cpu-bot');
    if (!svg) return null;
    const grid = Array.from({ length: 17 }, () => new Array(16).fill('.'));
    for (const rect of svg.querySelectorAll('rect')) {
      if (!rect.getClientRects().length) continue;
      const cs = getComputedStyle(rect);
      if (cs.display === 'none' || cs.visibility === 'hidden' || !cs.fill || cs.fill === 'none') continue;
      let op = 1;
      for (let n = rect; n && n !== svg; n = n.parentNode) op *= parseFloat(getComputedStyle(n).opacity || '1');
      if (op < 0.35) continue;
      const x = Math.round(+rect.getAttribute('x') || 0); const y = Math.round(+rect.getAttribute('y') || 0);
      const rw = Math.round(+rect.getAttribute('width') || 1); const rh = Math.round(+rect.getAttribute('height') || 1);
      const key = `${cs.fill}${rect.closest('.bot-face') ? '|f' : ''}`;
      for (let yy = y; yy < Math.min(17, y + rh); yy++) for (let xx = x; xx < Math.min(16, x + rw); xx++) if (yy >= 0 && xx >= 0) grid[yy][xx] = key;
    }
    return grid;
  }
  const rgbOf = (s) => { const m = /(\d+)[, ]+(\d+)[, ]+(\d+)/.exec(s); return m ? [+m[1], +m[2], +m[3]] : [128, 128, 128]; };
  const hexRgb = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const mixRgb = (a, b, k) => a.map((v, i) => Math.round(v + (b[i] - v) * k));
  // (the bot, four times as fine, lit: a neon rim on the light's side (its glow spilling past the edge),
  // shadow on the other, lighter up top and darker to its feet, the night's blue in it, rain's sheen on
  // top, a shine in each eye, its face glowing; side: the light's side, +1 right)
  function litBot(grid, light, side) {
    const big = scale2(scale2(grid));
    const h = big.length; const w = big[0].length;
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const g = c.getContext('2d');
    const img = g.createImageData(w, h);
    const L = hexRgb(light);
    const night = [26, 20, 64];
    const empty = (x, y) => x < 0 || y < 0 || x >= w || y >= h || big[y][x] === '.';
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const k = big[y][x];
      if (k === '.') continue;
      const face = k.endsWith('|f');
      let col = rgbOf(k);
      if (!face) {
        const across = side > 0 ? x / w : 1 - x / w;
        col = col.map((v) => Math.round(v * (0.55 + 0.4 * across) * (1.12 - 0.3 * (y / h)))); // (darker away from the light, and down to its feet)
        col = mixRgb(col, night, 0.18);
        if (empty(x + side, y) || empty(x + side * 2, y)) col = mixRgb(col, L, empty(x + side, y) ? 0.7 : 0.4); // (the neon rim)
        else if (empty(x - side, y)) col = col.map((v) => Math.round(v * 0.55)); // (the far edge, in shadow)
        if (empty(x, y - 1)) col = mixRgb(col, [230, 240, 255], 0.25); // (rain's sheen on its top)
        if (((x + y) & 1) === 0 && across < 0.25) col = col.map((v) => Math.round(v * 0.85)); // (dithered shadow)
      } else col = mixRgb(col, [255, 255, 255], 0.12);
      const i = (y * w + x) * 4;
      img.data[i] = col[0]; img.data[i + 1] = col[1]; img.data[i + 2] = col[2]; img.data[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    // (a shine in each eye, anime style: one in each face shape starting in the face's upper half (the
    // eyes, not the mouth), up at its top left, a fainter one lower down)
    const isFace = (x, y) => !empty(x, y) && big[y][x].endsWith('|f');
    let fTop = h; let fBot = 0;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (isFace(x, y)) { fTop = Math.min(fTop, y); fBot = Math.max(fBot, y); }
    const seen = new Set();
    for (let y = fTop; y < fTop + Math.max(4, (fBot - fTop) / 2); y++) for (let x = 0; x < w; x++) {
      if (!isFace(x, y) || seen.has(y * w + x)) continue;
      let [x0, y0, x1, y1] = [x, y, x, y];
      const todo = [[x, y]];
      seen.add(y * w + x);
      while (todo.length) {
        const [px, py] = todo.pop();
        x0 = Math.min(x0, px); x1 = Math.max(x1, px); y0 = Math.min(y0, py); y1 = Math.max(y1, py);
        for (const [nx, ny] of [[px + 1, py], [px - 1, py], [px, py + 1], [px, py - 1]]) if (isFace(nx, ny) && !seen.has(ny * w + nx)) { seen.add(ny * w + nx); todo.push([nx, ny]); }
      }
      const bw = x1 - x0 + 1; const bh = y1 - y0 + 1;
      if (bw < 3 || bh < 3 || bw > bh * 3) continue; // (too small, or a wide shape: a mouth)
      const gx = x0 + Math.max(1, Math.round(bw * 0.22)); const gy = y0 + Math.max(1, Math.round(bh * 0.2));
      if (isFace(gx, gy) && isFace(gx + 1, gy + 1)) R(g, gx, gy, 2, 2, '#ffffff');
      const sx = x0 + Math.round(bw * 0.68); const sy = y0 + Math.round(bh * 0.68);
      if (bh >= 6 && isFace(sx, sy)) R(g, sx, sy, 1, 1, 'rgba(255, 255, 255, 0.6)');
    }
    const glow = document.createElement('canvas'); // (its face's glow, a halo round each lit pixel; the rim's light past its edge)
    glow.width = w; glow.height = h;
    const gg = glow.getContext('2d');
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const k = big[y][x];
      if (k === '.') { if (!empty(x - side, y)) A(gg, x, y, 1, 1, light, 0.35); continue; }
      if (!k.endsWith('|f')) continue;
      const col = rgbOf(k);
      gg.fillStyle = `rgba(${col[0]}, ${col[1]}, ${col[2]}, 0.12)`;
      gg.fillRect(x - 3, y - 3, 7, 7);
    }
    return { img: c, glow, w, h };
  }
  const NAMES = { bot: 'BOT', grifter: 'GRIFTER', bunker: 'BUNKER', glitch: 'GLITCH' };
  function closeUp() {
    if (shot || !world) return false;
    const W = api.laneW();
    const ws = (api.walkers ? api.walkers() : []).filter((w) => w.el && w.x > 0 && w.x < W - 34);
    if (!ws.length) return false;
    const w = pick(ws);
    const grid = botArt(w);
    if (!grid) return false;
    const H = api.laneH();
    // (in the game card, the whole scene: down past the lane's floor, up to the towers' tops; on the start
    // screen, its lower part, under START)
    const under = (parseFloat(getComputedStyle(api.lane).getPropertyValue('--floor-under')) || 0);
    const fh = api.game() ? Math.max(H, Math.round(world.hT * C)) + Math.ceil(under) : Math.round(H * 0.4);
    const side = Math.random() < 0.5 ? 1 : -1; // (the light's side: the sign's)
    const light = pick(['#ff2a6d', '#05d9e8', '#b14aed', '#ff9f1c']);
    const bot = litBot(grid, light, side);
    const pc = Math.max(1, (fh * 0.66) / bot.h); // (a cell of the shot, in the page's pixels: the bot two thirds of it tall)
    const cw = Math.ceil(W / pc);
    const ch = Math.ceil(fh / pc);
    // its backdrop, drawn once: a wall in the dark, the bot's name in neon on the light's side, a second
    // tube, lights blurred to bokeh, the wet ground and the light in it
    const bg = document.createElement('canvas');
    bg.width = cw; bg.height = ch;
    const g = bg.getContext('2d');
    const r = rng(Math.floor(Math.random() * 1e9));
    for (let y = 0; y < ch; y++) { const k = y / ch; R(g, 0, y, cw, 1, `rgb(${Math.round(14 + 10 * k)}, ${Math.round(10 + 6 * k)}, ${Math.round(30 + 12 * k)})`); }
    g.fillStyle = 'rgba(0, 0, 0, 0.22)';
    let row = 0;
    for (let by = 2; by < ch * 0.8; by += 3, row++) { g.fillRect(0, by, cw, 1); for (let bx = row % 2 ? 2 : 5; bx < cw; bx += 7) g.fillRect(bx, by - 2, 1, 2); } // (brickwork)
    for (let i = 0; i < 18; i++) { const rr = ri(r, 2, 7); const x = ri(r, 0, cw); const y = ri(r, 0, Math.floor(ch * 0.6)); const col = rp(r, NEON); for (let yy = -rr; yy <= rr; yy++) for (let xx = -rr; xx <= rr; xx++) if (xx * xx + yy * yy <= rr * rr) A(g, x + xx, y + yy, 1, 1, col, xx * xx + yy * yy >= (rr - 1) * (rr - 1) ? 0.22 : 0.1); } // (bokeh)
    const name = NAMES[w.bot] || 'BOT';
    const k = Math.max(2, Math.floor(Math.min((ch * 0.16) / 5, (cw * 0.4) / textW(name, 1))));
    const nx = side > 0 ? cw - textW(name, k) - Math.round(cw * 0.06) : Math.round(cw * 0.06);
    const ny = Math.round(ch * 0.14);
    R(g, nx - k * 2, ny - k * 2, textW(name, k) + k * 4, 5 * k + k * 4, '#07060d');
    const signLayer = document.createElement('canvas'); // (the name lit, apart: it flickers)
    signLayer.width = cw; signLayer.height = ch;
    const sg = signLayer.getContext('2d');
    A(sg, nx - k * 3, ny - k * 3, textW(name, k) + k * 6, 5 * k + k * 6, light, 0.12);
    text(sg, name, nx, ny, light, k, true);
    const tx = side > 0 ? Math.round(cw * 0.08) : cw - Math.round(cw * 0.08);
    const tube = pick(NEON.filter((col) => col !== light));
    A(g, tx - 1, 0, 3, Math.round(ch * 0.75), tube, 0.35); R(g, tx, 0, 1, Math.round(ch * 0.75), tube);
    const gy = Math.round(ch * 0.8); // (the ground)
    R(g, 0, gy, cw, ch - gy, '#0e0c18');
    R(g, 0, gy, cw, 1, '#2a2540');
    for (let y = gy + 1; y < ch; y++) for (let x = 0; x < cw; x++) if (Math.random() < 0.08) A(g, x, y, 1, 1, Math.random() < 0.5 ? light : tube, 0.25);
    const bx = side > 0 ? Math.round(cw * 0.3 - bot.w / 2) : Math.round(cw * 0.7 - bot.w / 2); // (on a third, looking into the frame)
    const by = gy - bot.h + 6; // (its feet on the ground)
    const c = els.shot;
    if (c.width !== cw || c.height !== ch) { c.width = cw; c.height = ch; }
    Object.assign(c.style, { width: `${W}px`, height: `${fh}px`, bottom: api.game() ? `${-Math.ceil(under)}px` : '0px', top: 'auto', transition: 'none', opacity: '1' });
    const rain = Array.from({ length: Math.round((cw * ch) / 900) }, () => ({ x: rand(0, cw), y: rand(0, ch), v: rand(70, 110), l: ri(Math.random, 4, 9) }));
    shot = { t0: performance.now(), dur: 5600, bg, signLayer, bot, bx, by, cw, ch, rain, sign: true, nextFlick: 0 };
    api.botEvent('scene-cyber-closeup');
    return true;
  }
  function shotTick(now, dt) {
    if (!shot) return;
    const s = shot;
    const t = (now - s.t0) / s.dur;
    const c = els.shot;
    const g = c.getContext('2d');
    if (t >= 1) { g.clearRect(0, 0, c.width, c.height); c.style.opacity = '0'; shot = null; nextShot = now + rand(120000, 240000); return; }
    g.imageSmoothingEnabled = false;
    const calm = lowFx();
    const z = calm ? 1 : 1 + 0.06 * t; // (the slow push in, on the bot)
    const fx = s.bx + s.bot.w / 2;
    const fy = s.by + s.bot.h * 0.4;
    g.save();
    g.clearRect(0, 0, s.cw, s.ch);
    g.translate(fx, fy); g.scale(z, z); g.translate(-fx, -fy);
    g.drawImage(s.bg, 0, 0);
    if (!calm && now > s.nextFlick) { s.sign = !s.sign || Math.random() < 0.6; s.nextFlick = now + (s.sign ? rand(400, 2400) : rand(40, 140)); }
    if (s.sign) g.drawImage(s.signLayer, 0, 0);
    const bob = calm ? 0 : Math.round(Math.sin(t * Math.PI * 3)); // (breathing)
    g.globalAlpha = 0.28; // (its reflection in the wet, broken)
    for (let row = 0; row < Math.min(s.bot.h, s.ch - (s.by + s.bot.h - 6)); row++) {
      const wob = Math.round(Math.sin(row * 0.9 + now / 160) * 1.2);
      g.drawImage(s.bot.img, 0, s.bot.h - 1 - row, s.bot.w, 1, s.bx + wob, s.by + s.bot.h - 6 + row + bob, s.bot.w, 1);
    }
    g.globalAlpha = 1;
    g.drawImage(s.bot.glow, s.bx, s.by + bob);
    g.drawImage(s.bot.img, s.bx, s.by + bob);
    g.restore();
    if (!calm) { // (rain streaking past, in front)
      g.fillStyle = 'rgba(190, 210, 255, 0.35)';
      for (const d of s.rain) { d.y += d.v * dt; d.x -= d.v * dt * 0.15; if (d.y > s.ch) { d.y = -d.l; d.x = rand(0, s.cw + 20); } for (let i = 0; i < d.l; i++) g.fillRect(Math.round(d.x - i * 0.15), Math.round(d.y - i), 1, 1); }
    }
    const inK = Math.min(1, t / 0.06); const outK = Math.min(1, (1 - t) / 0.06); // (the letterbox bars, in and out)
    const bar = Math.round(s.ch * 0.12 * Math.min(inK, outK));
    R(g, 0, 0, s.cw, bar, '#000000');
    R(g, 0, s.ch - bar, s.cw, bar, '#000000');
    if (t < 0.03) { g.fillStyle = `rgba(255, 255, 255, ${(0.5 * (1 - t / 0.03)).toFixed(2)})`; g.fillRect(0, 0, s.cw, s.ch); } // (the cut in)
    c.style.opacity = t > 0.97 ? '0' : '1';
  }

  // ── THE PAN ──
  function place() {
    if (!world) return;
    for (const [name, f, , wide] of LAYERS) {
      if (wide) continue;
      els[name].style.transform = `translate3d(${-Math.round(cam * f * C)}px, 0, 0)`;
    }
  }
  function startPan(dir) {
    if (!world) return false;
    const room = dir > 0 ? world.WW - world.Wc - cam : cam;
    if (room < u(8)) return false;
    const dist = Math.min(room, world.Wc * rand(0.35, 1));
    const speed = u(3.2); // (about 7px a second)
    pan = { from: cam, to: cam + dir * dist, t0: performance.now(), dur: (dist / speed) * 1000 };
    api.botEvent('scene-cyber-pan');
    return true;
  }
  function panTick(now) {
    if (!pan) {
      if (now > nextPan && !shot) {
        nextPan = now + rand(60000, 140000);
        const dir = cam < world.WW * 0.25 ? 1 : cam > world.WW * 0.6 ? -1 : (Math.random() < 0.5 ? 1 : -1);
        startPan(dir);
      }
      return;
    }
    const k = Math.min(1, (now - pan.t0) / pan.dur);
    const e = k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2; // (easing in and out)
    const was = cam;
    cam = pan.from + (pan.to - pan.from) * e;
    const d = cam - was;
    if (d) {
      api.shift(-d * C); // (the bots on the street, carried with it)
      place();
    }
    if (k >= 1) pan = null;
  }

  let last = 0;
  function frame(now) {
    if (!world) return;
    const dt = Math.min(0.1, (now - (last || now)) / 1000);
    last = now;
    panTick(now);
    if (!shot && !pan && now > nextShot) { nextShot = now + rand(120000, 240000); closeUp(); }
    if (now - lastFx > 110) { lastFx = now; paintFx(now, false); }
    if (now - lastDyn > 33) {
      const ddt = Math.min(0.1, (now - (lastDyn || now)) / 1000);
      lastDyn = now;
      crowdTick(ddt, now);
      drawCrowd(now);
      steamTick(ddt);
      railTick(ddt, now);
      trafficTick(ddt, now);
    }
    if (now - lastAware > 400) { lastAware = now; awareTick(now); }
    shotTick(now, dt);
  }

  return {
    els,
    draw: (full, seed) => { if (full || !world || world.Wc !== Math.ceil(api.laneW() / C) || Q !== (window.CYBER_RES || autoRes())) build(seed); },
    frame,
    // (the sandbox's buttons: a pan, someone on the street, the train, a close-up, the RES)
    cmd(c) {
      if (c === 'pan-left') return startPan(-1);
      if (c === 'pan-right') return startPan(1);
      if (c === 'train') { nextTrain = 0; train = null; return true; }
      if (c === 'closeup') return closeUp();
      if (c.startsWith('res-')) { window.CYBER_RES = c === 'res-auto' ? 0 : Number(c.slice(4)); if (world) build(world.seed); return true; }
      if (c.startsWith('spawn-')) { spawnWalker(c.slice(6)); return true; }
      return false;
    },
  };
}
