// THE CYBERPUNK STREET (scenes.js's CYBER; the bot sandbox's for now, not in the game's own picks yet):
// a long street at night that the wanderers walk along, seen close up (the shop fronts tall over the
// bots, their details plain), far longer than the card, the view panning slowly along it now and then
// to show more of it. Always night: neon, rain or snow, a moon behind the towers. Far off and nearer, the
// city shows through every opening: over the low roofs, down the alleys, through the big windows.
// FOUR STREETS (one each visit; the sandbox's VIEW picks):
//   MARKET STREET     shops lit inside, shutters, the METRO, kiosks, a window onto the city, food stalls,
//                     an ARCADE (its cabinets playing), a CLINIC (green cross, an x-ray lit), VENDING
//                     machines, a NOODLE bar (its curtain, the cook, stools), low roofs and alleys, cables
//                     strung across
//   UNDER THE TRACKS  a viaduct overhead on concrete pillars (graffiti, posters), the train thundering
//                     along it, sodium lamps under it, water dripping off it; in its arches noodle bars,
//                     vending machines, chain-link GATES (barbed wire, a hazard sign, a scooter behind),
//                     a BARREL FIRE with a robot warming itself, shutters, stalls
//   NIGHT MARKET      stall after stall, noodle bars, lower roofs, strings of lanterns everywhere overhead
//                     and cloth banners off them; more of a crowd, vendors pushing carts
//   CORPORATE PLAZA   glass towers, their lobbies lit cold (a guard mech, turnstiles, the company's name),
//                     a HOLO column (a koi turning in it) between glowing planters, a VIDEO WALL, polished
//                     tiles with light strips in them; androids, security mechs, couriers
// Over every street: megatowers far off (red lights blinking on their masts, BYTEFALL in neon on one roof:
// BYTE in the game's green, FALL in its amber), the nearer city (window grids, small neon words, HOLO
// BILLBOARDS, an elevated line with a train along it), flying cars between the towers.
// DRAWN FINER THAN THE BOTS: the street's pixels are a half or a third of a bot's (RES: 2x or 3x by the
// screen's sharpness; 4x on the sandbox's RES). The street is laid out in bot pixels, the same at any
// RES (each building's details from its own seed), and drawn at the RES: so THE CLOSE-UP can draw any
// spot of it again, finer still, exactly as it stands.
// THE CROWD, behind the bots (darker, eyes and lights glowing: the four CPUs stay the ones you see),
// scaled up the pixel artist's way (Scale2x / Scale3x): HOODED figures, one under a neon UMBRELLA, chrome
// ROBOTS, tall ANDROIDS, hovering DROIDS, DRONES with parcels, CYBORGS (a red implant, a metal arm),
// security MECHS, COURIERS on hover bikes, VENDORS pushing steaming carts, stray CATS (eyes shining).
// THE BOTS ARE AWARE OF IT, and it's no cheery place (their faces stay gloomy here, wanderers.js): a figure
// passing close behind (a mech: scared; a hooded one: wary; a courier zipping by: startled), a drone or a
// train going over, a sign sputtering above, steam under it, a barrel fire (warm), a lit window. One bot
// at a time, each a while before it notices anything again.
// THE PAN: every minute or two the view drifts along the street, slowly; everything on the street pans
// with it, the bots too (one carried off the card walks off it), the far layers less (parallax).
// THE CLOSE-UP: now and then (every two to four minutes, or the sandbox's CLOSE-UP) the view cuts in on
// one of the CPUs, anime style, for a few seconds, WHERE IT STANDS: the street right there drawn again at
// four times the bot's pixels (the shop behind it, its signs lit, the city through the gaps, the wet
// sidewalk, a curb and the road in front), whoever's walking by there walking by (one comes past if no
// one is), the bot itself four times as fine (its own art that moment, lit by the nearest sign: a neon
// rim, shadow, a shine in its eyes), its reflection in the wet, rain or snow falling, letterbox bars, a
// slow push in. Then the cut back. On the start screen, under START; in the game card, all of it.
// Static layers are drawn once (the whole street, wider than the card) and slid; only what changes is
// redrawn. REDUCED EFFECTS: no flicker, no steam or embers, no push in, nothing falling in the close-up.
function createCyberStreet(api) {
  const P = api.P; // (the bots' own pixel)
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (list) => list[Math.floor(Math.random() * list.length)];
  const rng = (seed) => { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  const rp = (r, list) => list[Math.floor(r() * list.length)];
  const ri = (r, a, b) => a + Math.floor(r() * (b - a + 1));
  const weighted = (r, table) => { const e = Object.entries(table); let t = r() * e.reduce((a, [, w]) => a + w, 0); for (const [k, w] of e) if ((t -= w) <= 0) return k; return e[0][0]; };
  const NEON = ['#ff2a6d', '#05d9e8', '#ff9f1c', '#b14aed', '#39ff88', '#fffb6b', '#ff5ec4'];
  const lowFx = () => document.documentElement.classList.contains('low-fx') || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  // RES: the street's pixels a bot's / Q (the sandbox's choice, else by the screen: 2x on a plain screen,
  // 3x on a sharp one, where a third of a bot's pixel is still at least a whole pixel of the screen's)
  const autoRes = () => ((window.devicePixelRatio || 1) >= 1.75 ? 3 : 2);
  let Q = 2;
  let C = P / 2; // (a cell of the street's, in the page's pixels)
  const u = (n) => n * Q; // (a length in bot pixels, in cells)
  const QC = 4; // (THE CLOSE-UP's cells a bot pixel)
  let out = null; // (where the drawing puts what it finds: signs, lights, spills ... the street's own, or a close-up's)

  // ── THE STREETS: what's built along each (weights), its crowd (weights), how many at once ──
  const VIEWS = {
    market: { name: 'MARKET STREET', lots: { shop: 3, shutter: 2.2, metro: 0.8, kiosk: 1.2, window: 1.3, stall: 1.1, low: 1.3, alley: 1.8, arcade: 1, clinic: 0.8, vending: 0.9, noodle: 0.9 }, cables: true, crowd: { hood: 3, umbrella: 1.5, robot: 1.2, android: 1, droid: 1, drone: 1, cyborg: 1, cat: 0.6, vendor: 0.5, courier: 0.6, mech: 0.3 }, most: 5 },
    underpass: { name: 'UNDER THE TRACKS', lots: { noodle: 2, vending: 1.5, gate: 1.6, fire: 1.2, shutter: 1.8, stall: 1.2, kiosk: 0.8, clinic: 0.6 }, deck: true, ground: 'asphalt', crowd: { hood: 3, umbrella: 1, robot: 1, cyborg: 1.4, cat: 1.2, vendor: 0.6, droid: 0.8, courier: 0.8, android: 0.6 }, most: 5 },
    nightmarket: { name: 'NIGHT MARKET', lots: { stall: 3.5, noodle: 2.2, shop: 1.5, shutter: 1, vending: 0.8, alley: 1, kiosk: 0.5, low: 0.8, arcade: 0.6 }, lanterns: true, low: true, crowd: { hood: 2.5, umbrella: 2, vendor: 1.5, robot: 1, android: 0.8, cat: 1, cyborg: 0.8, drone: 0.6, droid: 0.6 }, most: 7 },
    plaza: { name: 'CORPORATE PLAZA', lots: { corp: 2.6, holo: 1.3, videowall: 1.1, metro: 0.9, vending: 0.8, shop: 1, clinic: 0.5 }, ground: 'tiles', tall: true, crowd: { android: 2.5, mech: 1.2, drone: 1.5, courier: 1.2, cyborg: 1.2, hood: 1.2, umbrella: 0.8, robot: 1, droid: 1 }, most: 5 },
  };
  let view = api.view && VIEWS[api.view] ? api.view : pick(Object.keys(VIEWS));
  // (each lot's width in bot pixels; the open ones: no building, the city behind)
  const LOT_W = { shop: [44, 60], shutter: [36, 48], metro: [52, 62], kiosk: [52, 70], window: [42, 58], stall: [38, 48], low: [34, 50], alley: [16, 26], arcade: [44, 60], clinic: [38, 50], vending: [36, 50], noodle: [34, 46], gate: [36, 52], fire: [34, 46], corp: [56, 76], holo: [44, 60], videowall: [50, 66] };
  const OPEN = ['alley', 'holo'];

  // ── The layers: [name, how fast it pans (1: the street), z-index, card-wide (redrawn) or the whole street] ──
  // (the moon behind the towers; the viaduct's train over the street's front; THE CLOSE-UP over it all)
  const LAYERS = [
    ['moon', 0, -6, true], ['towers', 0.18, -5], ['towers-fx', 0.18, -5], ['traffic', 0, -4, true], ['mid', 0.5, -3], ['mid-fx', 0.5, -3], ['rail', 0, -3, true],
    ['front', 1, -2], ['front-fx', 1, -2], ['deck', 0, -2, true], ['ground', 1, -1], ['crowd', 0, 0, true], ['steam', 0, 4, true], ['near', 1, 5], ['shot', 0, 9, true],
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

  let world = null; // (the street laid out, in bot pixels, and what its drawing found, in cells)
  let cam = 0; // (the view's left edge along the street, in cells)
  let pan = null; // { from, to, t0, dur }
  let nextPan = performance.now() + rand(25000, 60000);
  const crowd = [];
  let nextWalker = performance.now() + rand(600, 2500);
  const steam = [];
  const drips = [];
  const cars = [];
  let nextCar = performance.now() + rand(1000, 4000);
  let train = null;
  let nextTrain = performance.now() + rand(4000, 15000);
  let deckTrain = null;
  let nextDeckTrain = performance.now() + rand(6000, 20000);
  let shot = null; // (THE CLOSE-UP, while it's on)
  let nextShot = performance.now() + rand(90000, 180000);
  let lastFx = 0;
  let lastDyn = 0;
  let lastAware = 0;
  let lastMoon = 0;
  let moonKey = '';
  let nextNotice = 0; // (the street's: one bot noticing something at a time)

  // ── A 3x5 font for the signs (k cells a pixel; at 3 and over each stroke a tube with a hot core) ──
  const FONT = {
    A: '###,#.#,###,#.#,#.#', B: '##.,#.#,##.,#.#,##.', C: '###,#..,#..,#..,###', D: '##.,#.#,#.#,#.#,##.', E: '###,#..,##.,#..,###',
    F: '###,#..,##.,#..,#..', G: '###,#..,#.#,#.#,###', H: '#.#,#.#,###,#.#,#.#', I: '###,.#.,.#.,.#.,###', J: '..#,..#,..#,#.#,###', K: '#.#,#.#,##.,#.#,#.#',
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
  // (a word in neon: each stroke a tube, its hot core running unbroken along it where the strokes join)
  function lettering(g, s, x, y, col, k, core, font, cw, rh, adv) {
    for (let i = 0; i < s.length; i++) {
      const rows = (font[s[i]] || font[' ']).split(',');
      const on = (rx, ry) => ry >= 0 && ry < rh && rx >= 0 && rx < cw && rows[ry][rx] === '#';
      for (let ry = 0; ry < rh; ry++) for (let rx = 0; rx < cw; rx++) {
        if (!on(rx, ry)) continue;
        const px = x + (i * adv + rx) * k;
        const py = y + ry * k;
        g.fillStyle = col;
        g.fillRect(px, py, k, k);
        if (core && k >= 3) { g.fillStyle = HOT; g.fillRect(px + 1, py + 1, k - 2 + (on(rx + 1, ry) ? 2 : 0), k - 2 + (on(rx, ry + 1) ? 2 : 0)); } // (the tube's hot core)
      }
    }
  }
  const text = (g, s, x, y, col, k = 1, core = true) => lettering(g, s, x, y, col, k, core, FONT, 3, 5, 4);
  // (and a 5x7, for the big signs: the shops' names in their lightboxes, the METRO, the companies,
  // BYTEFALL up on its roof)
  const FONT7 = {
    A: '.###.,#...#,#...#,#####,#...#,#...#,#...#', B: '####.,#...#,#...#,####.,#...#,#...#,####.', C: '.###.,#...#,#....,#....,#....,#...#,.###.',
    D: '####.,#...#,#...#,#...#,#...#,#...#,####.', E: '#####,#....,#....,####.,#....,#....,#####', F: '#####,#....,#....,####.,#....,#....,#....',
    G: '.###.,#...#,#....,#.###,#...#,#...#,.####', H: '#...#,#...#,#...#,#####,#...#,#...#,#...#', I: '.###.,..#..,..#..,..#..,..#..,..#..,.###.',
    J: '..###,...#.,...#.,...#.,...#.,#..#.,.##..', K: '#...#,#..#.,#.#..,##...,#.#..,#..#.,#...#', L: '#....,#....,#....,#....,#....,#....,#####',
    M: '#...#,##.##,#.#.#,#.#.#,#...#,#...#,#...#', N: '#...#,#...#,##..#,#.#.#,#..##,#...#,#...#', O: '.###.,#...#,#...#,#...#,#...#,#...#,.###.',
    P: '####.,#...#,#...#,####.,#....,#....,#....', Q: '.###.,#...#,#...#,#...#,#.#.#,#..#.,.##.#', R: '####.,#...#,#...#,####.,#.#..,#..#.,#...#',
    S: '.####,#....,#....,.###.,....#,....#,####.', T: '#####,..#..,..#..,..#..,..#..,..#..,..#..', U: '#...#,#...#,#...#,#...#,#...#,#...#,.###.',
    V: '#...#,#...#,#...#,#...#,#...#,.#.#.,..#..', W: '#...#,#...#,#...#,#.#.#,#.#.#,#.#.#,.#.#.', X: '#...#,#...#,.#.#.,..#..,.#.#.,#...#,#...#',
    Y: '#...#,#...#,.#.#.,..#..,..#..,..#..,..#..', Z: '#####,....#,...#.,..#..,.#...,#....,#####',
    0: '.###.,#...#,#..##,#.#.#,##..#,#...#,.###.', 1: '..#..,.##..,..#..,..#..,..#..,..#..,.###.', 2: '.###.,#...#,....#,...#.,..#..,.#...,#####',
    3: '#####,...#.,..#..,...#.,....#,#...#,.###.', 4: '...#.,..##.,.#.#.,#..#.,#####,...#.,...#.', 5: '#####,#....,####.,....#,....#,#...#,.###.',
    6: '..##.,.#...,#....,####.,#...#,#...#,.###.', 7: '#####,....#,...#.,..#..,.#...,.#...,.#...', 8: '.###.,#...#,#...#,.###.,#...#,#...#,.###.',
    9: '.###.,#...#,#...#,.####,....#,...#.,.##..', '-': '.....,.....,.....,#####,.....,.....,.....', ' ': '.....,.....,.....,.....,.....,.....,.....',
    '/': '....#,...#.,...#.,..#..,.#...,.#...,#....', ':': '.....,..#..,..#..,.....,..#..,..#..,.....', '+': '.....,..#..,..#..,#####,..#..,..#..,.....',
    '.': '.....,.....,.....,.....,.....,.##..,.##..', '>': '#....,.#...,..#..,...#.,..#..,.#...,#....',
  };
  const textW7 = (s, k = 1) => (s.length * 6 - 1) * k;
  const text7 = (g, s, x, y, col, k = 1, core = true) => lettering(g, s, x, y, col, k, core, FONT7, 5, 7, 6);
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

  // ── THE STREET LAID OUT: in bot pixels, the same at any RES (what's drawn finer comes from each
  // piece's own seed) ──
  function layout(seed, W, H) {
    const V = VIEWS[view];
    const game = api.game();
    const Wcb = Math.ceil(W / P);
    const Wb = Math.max(Wcb * 4, 720);
    const hFb = Math.max(56, Math.round((game ? H * 0.92 : Math.min(H * 0.42, 380)) / P));
    const hMb = Math.max(hFb + 12, Math.round((game ? H : Math.min(H * 0.52, 460)) / P));
    const hTb = Math.max(hMb + 10, Math.round((game ? H * 1.05 : Math.min(H * 0.6, 520)) / P));
    const GFb = Math.max(30, Math.min(46, Math.round(hFb * 0.36))); // (the shops' height: about twice a bot's)
    const r = rng(seed + view.length * 7919);
    const L = { view, seed, Wcb, Wb, hTb, hMb, hFb, GFb, towers: [], logo: null, mids: [], rail: null, lots: [], cables: [], strings: [], deck: null, puddles: [], near: [] };
    const lenB = (f) => Wcb + Math.ceil((Wb - Wcb) * f) + 2;
    // the towers
    const TW = lenB(speedOf.towers);
    let x = Math.floor(r() * 6);
    while (x < TW) {
      const w = 16 + Math.floor(r() * 26);
      L.towers.push({ x, w, top: hTb - Math.floor(hTb * (0.5 + r() * 0.5)), seed: Math.floor(r() * 1e9) });
      x += w + Math.floor(r() * 4);
    }
    // (BYTEFALL on the tallest roof about the middle of the view's way along the street: in sight most
    // of the time, over the nearer roofs)
    const want = TW * rp(r, [0.35, 0.5, 0.65]);
    const fits = L.towers.filter((o) => o.top > 24);
    const nearer = fits.filter((o) => Math.abs(o.x + o.w / 2 - want) < TW * 0.2);
    L.logo = (nearer.length ? nearer : fits).sort((a, b) => a.top - b.top)[0] || null;
    // the city: blocks, a small neon word on some, a holo billboard on some, a red light on some
    const MW = lenB(speedOf.mid);
    x = Math.floor(r() * 4);
    while (x < MW) {
      const w = 16 + Math.floor(r() * 22);
      const h = Math.floor(hMb * (0.4 + r() * 0.6));
      const m = { x, w, top: hMb - h, seed: Math.floor(r() * 1e9), word: null, board: null, light: null };
      if (r() < 0.35) {
        const s = rp(r, ['BAR', 'HOTEL', '24H', 'NODE', 'VR', 'OPEN', 'CAFE']);
        m.word = { s, x: x + ri(r, 1, Math.max(1, w - textW(s) - 1)), y: m.top + ri(r, 4, Math.max(5, Math.floor(h * 0.6))), col: rp(r, NEON) };
      }
      if (w >= 26 && h > 26 && r() < 0.55) {
        const bw = Math.min(w - 4, 30 + Math.floor(r() * 6));
        const bh = 13 + Math.floor(r() * 4);
        m.board = { x: x + Math.floor((w - bw) / 2), y: m.top + 4 + Math.floor(r() * Math.max(1, h * 0.35 - bh)), w: bw, h: bh, mode: rp(r, ['logo', 'bit', 'eye', 'beat', 'words']), col: rp(r, ['#05d9e8', '#ff2a6d', '#b14aed', '#39ff88']), t: r() * 10 };
      }
      if (r() < 0.45) m.light = { x: x + 2 + Math.floor(r() * (w - 4)) };
      L.mids.push(m);
      x += w + Math.floor(r() * 3);
    }
    L.rail = { y: hMb - Math.round(hMb * 0.46), seed: Math.floor(r() * 1e9) };
    // the street's own lots (under the viaduct: a pillar every two)
    if (V.deck) L.deck = { top: hFb - GFb - 20, bot: hFb - GFb - 11, seed: Math.floor(r() * 1e9) };
    x = 0;
    let last = null;
    let metro = false;
    let n = 0;
    while (x < Wb + 2) {
      if (V.deck && n > 0 && n % 2 === 0 && last !== 'pillar') { L.lots.push({ kind: 'pillar', x, w: 9, top: L.deck.bot, seed: Math.floor(r() * 1e9) }); x += 9; last = 'pillar'; continue; }
      const opts = Object.fromEntries(Object.entries(V.lots).filter(([k]) => !(OPEN.includes(k) || k === 'low' ? OPEN.includes(last) || last === 'low' : false) && !(k === 'metro' && metro)));
      const kind = weighted(r, opts);
      if (kind === 'metro') metro = true;
      const w = ri(r, LOT_W[kind][0], LOT_W[kind][1]);
      let top;
      if (OPEN.includes(kind)) top = hFb;
      else if (V.deck) top = L.deck.bot;
      else if (kind === 'low') top = hFb - GFb - ri(r, 4, 14);
      else if (V.low) top = Math.max(6, hFb - ri(r, GFb + 14, Math.max(GFb + 16, Math.round(hFb * 0.8))));
      else if (V.tall && kind === 'corp') top = Math.max(4, hFb - ri(r, Math.round(hFb * 0.8), hFb));
      else top = Math.max(6, hFb - ri(r, GFb + 24, hFb));
      L.lots.push({ kind, x, w, top, seed: Math.floor(r() * 1e9) });
      x += w;
      last = kind;
      n++;
    }
    // cables strung from roof to roof (MARKET STREET), over the open lots and the low roofs too
    const yG = hFb - GFb;
    const roofs = L.lots.filter((o) => o.kind !== 'pillar');
    if (V.cables) for (let i = 0; i + 2 < roofs.length; i++) {
      if (r() < 0.4) continue;
      const a = roofs[i];
      if (OPEN.includes(a.kind)) continue;
      const b = OPEN.includes(roofs[i + 1].kind) || roofs[i + 1].top > yG - 16 ? roofs[i + 2] : roofs[i + 1];
      if (!b || OPEN.includes(b.kind)) continue;
      L.cables.push({ x0: a.x + a.w - 4, x1: b.x + 4, y0: Math.max(a.top, yG - 30) + 4, y1: Math.max(b.top, yG - 30) + 4, sag: 4 + r() * 8, lantern: r() < 0.55 ? rp(r, ['#ff2a6d', '#ff9f1c', '#fffb6b']) : null, seed: Math.floor(r() * 1e9) });
    }
    // strings of lanterns everywhere overhead (THE NIGHT MARKET), cloth banners off some
    if (V.lanterns) for (let i = 0; i + 1 < roofs.length; i++) {
      for (let k = 0, m = ri(r, 1, 2); k < m; k++) {
        const a = roofs[i];
        const b = roofs[i + 1];
        L.strings.push({ x0: a.x + Math.floor(a.w * rand01(r, 0.2, 0.6)), x1: b.x + Math.floor(b.w * rand01(r, 0.4, 0.8)), y0: yG - ri(r, 6, 26), y1: yG - ri(r, 6, 26), sag: 3 + r() * 7, cols: [rp(r, ['#ff2a3c', '#ff6a1c', '#ffb000']), rp(r, ['#ff2a3c', '#ff5ec4', '#ffb000', '#fff2b0'])], banner: r() < 0.35, seed: Math.floor(r() * 1e9) });
      }
    }
    // bundles of cables everywhere but the plaza: wall to wall, a few together, sagging, some spanning a
    // building (their own random, so the rest of the street stands the same with them or without)
    const rw = rng(seed ^ 0x2545f491);
    L.wires = [];
    if (!V.tall) {
      const walls = roofs.filter((o) => !OPEN.includes(o.kind));
      for (let i = 0; i + 1 < walls.length; i++) {
        for (let k = 0, m = ri(rw, 0, 2); k < m; k++) {
          const a = walls[i];
          const b = walls[Math.min(walls.length - 1, i + (rw() < 0.3 ? 2 : 1))];
          const hi = V.deck ? L.deck.bot + 2 : Math.max(a.top, b.top) + 3;
          const lo = yG - 3;
          if (lo - hi < 4) continue;
          L.wires.push({ x0: a.x + ri(rw, Math.floor(a.w * 0.3), a.w - 2), x1: b.x + ri(rw, 2, Math.floor(b.w * 0.7)), y0: ri(rw, hi, lo), y1: ri(rw, hi, lo), n: ri(rw, 2, 6), sag: 3 + rw() * 10, spread: 0.5 + rw() * 1.1, seed: Math.floor(rw() * 1e9) });
        }
      }
    }
    // puddles, and what's in front: bollards, grates, bags, cones
    for (let i = 0, k = Math.round(Wb / 50); i < k; i++) L.puddles.push({ x: Math.floor(r() * Wb), w: 6 + Math.floor(r() * 10), y: 2 + Math.floor(r() * 2), col: rp(r, NEON), at: r() });
    for (let nx = Math.floor(r() * 30); nx < Wb; nx += 26 + Math.floor(r() * 40)) L.near.push({ x: nx, t: r(), col: rp(r, ['#05d9e8', '#ff2a6d', '#fffb6b']) });
    return L;
  }
  const rand01 = (r, a, b) => a + r() * (b - a);

  // ── THE STREET DRAWN (again on a resize, a new RES, a new street) ──
  function build(seed) {
    const W = api.laneW();
    const H = api.laneH();
    if (!W || !H) return;
    const was = world ? cam / world.WW : null; // (a new RES: the view where it was along the street)
    Q = window.CYBER_RES || autoRes();
    C = P / Q;
    world = layout(seed, W, H);
    Object.assign(world, { Wc: Math.ceil(W / C), WW: u(world.Wb), hT: u(world.hTb), hM: u(world.hMb), hF: u(world.hFb), signs: [], boards: [], lights: [], grates: [], spills: [], stops: [], fires: [], glows: [] });
    out = world;
    cam = Math.max(0, Math.min(world.WW - world.Wc, was !== null ? was * world.WW : (world.WW - world.Wc) * rand(0.2, 0.8)));
    crowd.length = 0;
    cars.length = 0;
    drips.length = 0;
    train = null;
    deckTrain = null;
    spriteCache.clear();
    moonKey = '';
    const { Wc, WW, hT, hM, hF } = world;
    const lenOf = (f) => Wc + Math.ceil((WW - Wc) * f) + 2;
    // (each layer drawn, then lit by its own lights)
    drawTowers(size(els.towers, lenOf(speedOf.towers), hT), hT, 0, Infinity);
    lightLayer(els.towers, lightsOf('towers-fx'));
    size(els['towers-fx'], lenOf(speedOf.towers), hT);
    drawMid(size(els.mid, lenOf(speedOf.mid), hM), hM, 0, Infinity);
    lightLayer(els.mid, lightsOf('mid-fx'));
    size(els['mid-fx'], lenOf(speedOf.mid), hM);
    drawFront(size(els.front, WW + 2, hF), hF, 0, Infinity);
    lightLayer(els.front, lightsOf('front-fx'));
    size(els['front-fx'], WW + 2, hF);
    for (const s of world.signs) s.on = true;
    paintFx(performance.now(), true); // (the signs lit before the sidewalk's drawn: it mirrors them)
    const under = Math.ceil((parseFloat(getComputedStyle(api.lane).getPropertyValue('--floor-under')) || 0) / P);
    world.underB = under;
    els.ground.style.bottom = els.near.style.bottom = `${-under * P}px`;
    els.front.style.bottom = els['front-fx'].style.bottom = els.deck.style.bottom = `${4 * P}px`; // (the shops stand at the sidewalk's back edge, not under it)
    drawGround(size(els.ground, WW + 2, u(5 + under)), u(5 + under), 0, Infinity, [els.front, els['front-fx']]);
    drawNear(size(els.near, WW + 2, u(7)), u(7), 0, Infinity);
    world.tint = tintMap();
    // (the card-wide ones: the moon, the crowd at the sidewalk's back, the steam, the trains, the traffic)
    size(els.moon, Wc + 1, hT);
    size(els.crowd, Wc + 2, u(96));
    els.crowd.style.bottom = `${3 * P}px`;
    size(els.steam, Wc + 1, u(48));
    size(els.rail, Wc + 1, hM);
    size(els.deck, Wc + 1, hF);
    size(els.traffic, Wc + 1, hT);
    place();
    api.botEvent(`scene-cyber-${view}`);
  }

  // THE TOWERS: tall, black against the haze, a few windows, a light strip, masts with red lights; on
  // one, BYTEFALL in neon on its scaffold
  function drawTowers(g, ch, b0, b1) {
    for (const t of world.towers) {
      if (t.x + t.w < b0 - 2 || t.x > b1 + 2) continue;
      const r = rng(t.seed);
      const x = u(t.x);
      const w = u(t.w);
      const top = u(t.top);
      const h = ch - top;
      R(g, x, top, w, h, rp(r, ['#0c0a1a', '#100d22', '#0e0c1e']));
      if (r() < 0.5) { g.fillRect(x + u(2), top - u(4), w - u(4), u(4)); g.fillRect(x + u(5), top - u(8), w - u(10), u(4)); } // (a stepped crown)
      R(g, x, top, 1, h, '#1a1630'); // (its lit edge)
      if (r() < 0.5) A(g, x + Math.floor(w / 2), top + u(2), Math.max(1, Q - 1), h - u(2), rp(r, ['#05d9e8', '#ff2a6d', '#b14aed']), 0.35); // (a light strip up its face)
      const wd = Math.max(1, Math.ceil(Q / 2));
      for (let wy = top + u(3); wy < ch - u(2); wy += u(3)) for (let wx = x + u(2); wx < x + w - u(2); wx += u(3)) {
        if (r() < 0.07) { g.globalAlpha = 0.55; R(g, wx, wy, wd, wd, rp(r, ['#ffcf6b', '#6fe3ff', '#ff8fb8', '#d9d4ff'])); g.globalAlpha = 1; }
      }
      const mx = x + Math.floor(w / 2);
      const mh = u(4 + Math.floor(r() * 12));
      R(g, mx, top - mh - u(8), 1, mh + u(8), '#16132a');
      out.lights.push({ x: mx, y: Math.max(0, top - mh - u(8)), ph: r() * 6.28, layer: 'towers-fx' });
      if (t === world.logo) logo(g, t);
    }
  }
  function logo(g, t) {
    const k = Q;
    const lw = textW7('BYTEFALL', k);
    const lx = Math.round(u(t.x + t.w / 2) - lw / 2);
    const top = u(t.top);
    const ly = top - u(4) - 7 * k;
    const base = ly + 7 * k + u(1);
    R(g, lx - u(1), base, lw + u(2), 1, '#2a2440'); // (its scaffold: a rail, legs down to the roof, braces)
    for (let sx = lx; sx <= lx + lw; sx += u(4)) { R(g, sx, base, 1, top - base, '#1e1a34'); if (sx + u(4) <= lx + lw) for (let k2 = 0; k2 < u(4); k2++) R(g, sx + k2, base + Math.round((k2 * (top - base)) / u(4)), 1, 1, '#1a1630'); }
    R(g, lx - u(1), ly - u(1), lw + u(2), 7 * k + u(2), '#06050c');
    out.signs.push({ kind: 'logo', x: lx, y: ly, w: lw, h: 7 * k, k, col: '#39ff8f', col2: '#ffb000', on: true, next: 0, faulty: true, layer: 'towers-fx' });
  }

  // THE CITY: nearer blocks (what shows over the low roofs, down the alleys, through the windows),
  // window grids, small signs, the HOLO BILLBOARDS, the elevated line on its pillars
  function drawMid(g, ch, b0, b1) {
    for (const m of world.mids) {
      if (m.x + m.w < b0 - 2 || m.x > b1 + 2) continue;
      const r = rng(m.seed);
      const x = u(m.x);
      const w = u(m.w);
      const top = u(m.top);
      const h = ch - top;
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
      if (m.word) { R(g, u(m.word.x) - Q, u(m.word.y) - Q, u(textW(m.word.s)) + u(2), u(7), '#07060d'); text(g, m.word.s, u(m.word.x), u(m.word.y), m.word.col, Q); out.glows.push({ x: u(m.word.x), y: u(m.word.y), w: u(textW(m.word.s)), h: u(5), col: m.word.col, r: u(5), a: 0.3, layer: 'mid-fx' }); }
      if (m.board) { const b = m.board; R(g, u(b.x) - Q, u(b.y) - Q, u(b.w) + u(2), u(b.h) + u(2), '#05040c'); out.boards.push({ ...b, x: u(b.x), y: u(b.y), w: u(b.w), h: u(b.h), glitch: 0, layer: 'mid-fx' }); }
      if (m.light) out.lights.push({ x: u(m.light.x), y: top - Q, ph: (m.seed % 628) / 100, layer: 'mid-fx' });
    }
    // the elevated line: its beam across, pillars down, a lit rail under it (the train runs on it: 'rail')
    const ty = u(world.rail.y);
    const x0 = u(b0 === 0 ? 0 : b0 - 2);
    const x1 = b1 === Infinity ? g.canvas.width : u(b1 + 2);
    R(g, x0, ty, x1 - x0, u(3), '#24223a');
    R(g, x0, ty, x1 - x0, 1, '#3d3a5a');
    R(g, x0, ty + u(3), x1 - x0, Q, '#3d2a52');
    A(g, x0, ty + u(4), x1 - x0, Q, '#ff5ec4', 0.35);
    const r = rng(world.rail.seed);
    for (let pb = Math.floor(r() * 30); pb < world.Wb; pb += 34 + Math.floor(r() * 12)) {
      if (pb < b0 - 6 || pb > b1 + 6) continue;
      const px = u(pb);
      R(g, px, ty + u(4), u(3), ch - ty - u(4), '#1b1930'); R(g, px - Q, ty + u(4), u(5), u(2), '#24223a'); R(g, px, ty + u(4), 1, ch - ty - u(4), '#2a2744');
    }
  }

  // ── THE STREET's own fronts, lot by lot ──
  const WORDS = ['RAMEN', 'SOBA', 'BAR', 'HOTEL', '24H', 'CYBER', 'NOODLE', 'DATA', 'BYTE', 'CLINIC', 'ARCADE', 'SUSHI', 'NEON', 'PAWN', 'REPAIR', 'DINER', 'CHROME', 'PHARMA', 'BITS', 'HACK', 'NODE', 'DECRYPT', 'CAFE', 'KEYS', 'LIQUOR'];
  const sign = (o) => { out.signs.push({ on: true, next: 0, faulty: false, k: Q, layer: 'front-fx', ...o }); return o; };
  // (a building's shell: its wall (brick or panels, finely), its edges, the ledge at its top; up close,
  // grime down from the ledges and up from the ground)
  function shell(g, x, w, top, ch, r, d) {
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
    if (Q >= 4) { // (up close: streaks of grime down from the ledge, the damp up from the ground)
      for (let i = 0, n = Math.floor(w / u(5)); i < n; i++) { const sx = x + Math.floor(d() * w); const len = Math.floor(d() * u(20)); for (let k = 0; k < len; k++) A(g, sx, top + Q + k, 1, 1, '#000000', 0.18 * (1 - k / len)); }
      for (let k = 0; k < u(6); k++) A(g, x, ch - k, w, 1, '#000000', 0.2 * (1 - k / u(6)));
    }
    return wall;
  }
  // (a window: its frame, the glass lit or dark, a sill, a glint, now and then someone at it; up close,
  // raindrops on the glass)
  function win(g, x, y, w, h, lit, on, r, d) {
    R(g, x - 1, y - 1, w + 2, h + 2, '#121019');
    g.globalAlpha = on ? 0.5 + r() * 0.4 : 1;
    R(g, x, y, w, h, on ? lit : '#0d0b16');
    g.globalAlpha = 1;
    if (on && r() < 0.25) R(g, x + Math.floor(w * 0.5), y + Math.floor(h * 0.3), Math.ceil(w * 0.4), h - Math.floor(h * 0.3), '#0d0b16'); // (someone there)
    if (on && r() < 0.3) for (let k = 0; k < Math.min(w, h); k++) A(g, x + k, y + k, 1, 1, '#ffffff', 0.18); // (a glint across the glass)
    R(g, x - 1, y + h + 1, w + 2, 1, '#3a3650'); // (the sill)
    R(g, x + Math.floor(w / 2), y, 1, h, '#121019'); // (its bar)
    if (Q >= 4 && on && d) for (let k = 0; k < 4; k++) { const dx = x + Math.floor(d() * w); const dy = y + Math.floor(d() * (h - 2)); A(g, dx, dy, 1, 2, '#ffffff', 0.35); A(g, dx, dy + 2, 1, 1, '#000000', 0.2); }
  }
  // THE FLOORS ABOVE THE SHOPS: one style a building (windows, slatted blinds, balconies, an industrial
  // face of vents and pipes; on the plaza, glass), AC units, a fire escape now and then, a neon banner
  function upper(g, x, w, top, yb, r, d) {
    const style = VIEWS[view].tall ? 'glass' : rp(r, ['grid', 'grid', 'slats', 'balcony', 'panel']);
    const lit = rp(r, ['#ffcf6b', '#7fd8ff', '#ff9fd0', '#c8b8ff', '#b8e07a']);
    if (style === 'glass') { // (a curtain wall: dark glass, the neon caught in it, a floor lit here and there)
      const tint = rp(r, ['#0e1a2a', '#141428', '#0c1c22']);
      R(g, x + Q, top + u(2), w - u(2), yb - top - u(2), tint);
      for (let fy = yb - u(6); fy > top + u(2); fy -= u(6)) {
        const on = r() < 0.18;
        if (on) A(g, x + Q, fy, w - u(2), u(5), '#cfe8ff', 0.35);
        R(g, x + Q, fy + u(5), w - u(2), 1, '#26304a');
      }
      for (let mx = x + u(6); mx < x + w - Q; mx += u(6)) R(g, mx, top + u(2), 1, yb - top - u(2), '#26304a');
      for (let k = 0; k < 3; k++) { const rx = x + ri(r, u(2), Math.max(u(2), w - u(8))); A(g, rx, top + u(4), u(2), yb - top - u(6), rp(r, NEON), 0.08); } // (the signs' colors in it)
    }
    if (style !== 'glass') for (let fy = yb - u(12); fy > top + u(3); fy -= u(12)) {
      R(g, x, fy + u(11), w, Q, '#14121f'); // (the floor's ledge)
      R(g, x, fy + u(11), w, 1, '#2c2846');
      if (style === 'grid') {
        for (let wx = x + u(3); wx + u(5) <= x + w - u(2); wx += u(8)) {
          win(g, wx, fy + u(3), u(5), u(6), lit, r() < 0.42, r, d);
          if (r() < 0.14) { R(g, wx, fy + u(10), u(5), u(3), '#4a4e5c'); R(g, wx + Q, fy + u(11), u(3), Q, '#2c2f3a'); for (let k = 0; k < u(3); k += 2) R(g, wx + Q + k, fy + u(10) + 1, 1, Q, '#3a3e4a'); } // (an AC unit, its grille)
        }
      } else if (style === 'slats') { // (a wide window, its blinds lit from inside)
        const sw = w - u(6);
        const on = r() < 0.65;
        R(g, x + u(3), fy + u(2), sw, u(8), '#121019');
        for (let sy = 0; sy < u(6); sy++) { g.globalAlpha = on ? (sy % 2 ? 0.25 : 0.7) : 1; R(g, x + u(4), fy + u(3) + sy, sw - u(2), 1, on ? lit : '#0d0b16'); g.globalAlpha = 1; }
      } else if (style === 'balcony') { // (railings, a plant, washing on a line)
        for (let wx = x + u(3); wx + u(6) <= x + w - u(2); wx += u(10)) win(g, wx, fy + u(2), u(6), u(5), lit, r() < 0.5, r, d);
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
    if (style !== 'glass' && yb - top > u(30) && r() < 0.3) { // (a fire escape: its landings and the stairs between)
      const fx = x + u(2) + Math.floor(r() * Math.max(1, w - u(16)));
      for (let fy = yb - u(12); fy > top + u(6); fy -= u(12)) {
        R(g, fx, fy + u(10), u(14), Q, '#3a3f4e');
        for (let k = 0; k < u(14); k += u(2)) R(g, fx + k, fy + u(7), 1, u(3), '#3a3f4e');
        R(g, fx, fy + u(7), u(14), 1, '#3a3f4e');
        for (let k = 0; k < u(10); k++) R(g, fx + u(2) + k, fy + u(10) - Math.round(k * 1.1), 1, 1, '#3a3f4e');
      }
    }
    if (style !== 'glass') { // (a drain pipe)
      R(g, x + w - u(2), top + u(3), Q, yb - top - u(3), '#2a2d38');
      R(g, x + w - u(2), top + u(3), 1, yb - top - u(3), '#3e4250');
      for (let py = top + u(8); py < yb; py += u(10)) R(g, x + w - u(3), py, u(3), Q, '#3a3d48');
    }
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
    else if (t < 0.55) { R(g, x + w - u(6), top - u(12), Math.max(1, Q - 1), u(12), '#23263a'); R(g, x + w - u(8), top - u(9), u(5), 1, '#23263a'); R(g, x + w - u(7), top - u(6), u(3), 1, '#23263a'); out.lights.push({ x: x + w - u(6), y: top - u(13), ph: r() * 6.28, layer: 'front-fx' }); }
    else if (t < 0.75) { R(g, x + u(4), top - u(4), u(6), Q, '#2c3046'); R(g, x + u(3), top - u(5), Q, Q, '#2c3046'); R(g, x + u(10), top - u(5), Q, Q, '#2c3046'); R(g, x + u(7), top - u(3), Q, u(3), '#23263a'); }
    else { for (let k = 0; k < 2; k++) { R(g, x + u(3 + k * 7), top - u(4), u(5), u(4), '#3a3e4c'); R(g, x + u(4 + k * 7), top - u(3), u(3), u(2), '#23263a'); for (let f = 0; f < u(3); f += 2) R(g, x + u(4 + k * 7) + f, top - u(3), 1, u(2), '#30333f'); } }
  }

  // THE FRONT: the lots overlapping [b0, b1] (in bot pixels), then what's over them (cables, strings
  // of lanterns, the viaduct)
  function drawFront(g, ch, b0, b1) {
    const V = VIEWS[view];
    const yG = ch - u(world.GFb); // (the top of the shops)
    for (const L of world.lots) {
      if (L.x + L.w < b0 - 2 || L.x > b1 + 2) continue;
      const r = rng(L.seed);
      const d = rng(L.seed ^ 0x5bd1e995);
      const x = u(L.x);
      const w = u(L.w);
      const top = u(L.top);
      if (L.kind === 'alley') { alley(g, x, w, ch, r, d); continue; }
      if (L.kind === 'holo') { holo(g, x, w, ch, yG, r, d); continue; }
      if (L.kind === 'pillar') { pillar(g, x, w, ch, top, r, d); continue; }
      shell(g, x, w, top, ch, r, d);
      if (!V.deck && L.kind !== 'low') upper(g, x, w, top, yG, r, d);
      if (!V.deck) roof(g, x, w, top, r);
      R(g, x, yG - Q, w, u(2), '#3a3456'); // (the ledge over the shops)
      R(g, x, yG - Q, w, 1, '#5a5480');
      DRAW[L.kind](g, x, w, ch, yG, r, d, top);
    }
    for (const wb of world.wires) if (wb.x1 >= b0 - 2 && wb.x0 <= b1 + 2) wires(g, wb);
    for (const c of world.cables) if (c.x1 >= b0 - 2 && c.x0 <= b1 + 2) cable(g, c, false);
    for (const c of world.strings) if (c.x1 >= b0 - 2 && c.x0 <= b1 + 2) cable(g, c, true);
    if (world.deck) drawDeck(g, ch, b0, b1);
  }
  // (a cable from roof to roof, sagging, lanterns on some; a NIGHT MARKET string: lanterns all along it,
  // a cloth banner hanging off some)
  // (a bundle of cables: each its own sag and ends, near-black, unbroken however steep; up close, a
  // sheen along their tops where the light catches them (the lighting adds the light's color))
  function wires(g, wb) {
    const r = rng(wb.seed);
    for (let k = 0; k < wb.n; k++) {
      const x0 = u(wb.x0) + Math.round(r() * Q * 2);
      const x1 = u(wb.x1) - Math.round(r() * Q * 2);
      const y0 = u(wb.y0 + k * wb.spread);
      const y1 = u(wb.y1 + k * wb.spread * (0.6 + r() * 0.8));
      const sag = u(wb.sag + k * 0.7 + r() * 2);
      const col = rp(r, ['#06050b', '#0a0911', '#0d0b16', '#110e1a']);
      let py = null;
      for (let cx = x0; cx <= x1; cx++) {
        const t = (cx - x0) / Math.max(1, x1 - x0);
        const cy = Math.round(y0 + (y1 - y0) * t + sag * 4 * t * (1 - t));
        if (py !== null && Math.abs(cy - py) > 1) R(g, cx, Math.min(cy, py) + 1, 1, Math.abs(cy - py), col);
        R(g, cx, cy, 1, 1, col);
        if (Q >= 4 && k === 0) A(g, cx, cy - 1, 1, 1, '#8a84b0', 0.18);
        py = cy;
      }
    }
  }
  function cable(g, c, string) {
    const r = rng(c.seed);
    const x0 = u(c.x0);
    const x1 = u(c.x1);
    const y0 = u(c.y0);
    const y1 = u(c.y1);
    const sag = u(c.sag);
    const at = (cx) => { const t = (cx - x0) / Math.max(1, x1 - x0); return Math.round(y0 + (y1 - y0) * t + sag * 4 * t * (1 - t)); };
    for (let cx = x0; cx <= x1; cx++) R(g, cx, at(cx), 1, 1, '#0a0912');
    const step = string ? u(4) : u(5);
    let i = 0;
    for (let cx = x0 + u(2); cx < x1 - u(1); cx += step, i++) {
      if (!string && !c.lantern) break;
      const col = string ? c.cols[i % 2] : c.lantern;
      sign({ kind: 'lantern', x: cx - Q, y: at(cx) + 1, w: u(3), h: u(string ? 4 : 3), col, faulty: r() < 0.08 });
    }
    if (string && c.banner) { // (a cloth banner off it: a long strip, glyphs down it)
      const bx = Math.round((x0 + x1) / 2);
      const by = at(bx) + 1;
      const col = rp(r, ['#2a1030', '#301018', '#10202a']);
      R(g, bx - u(2), by, u(5), u(14), col);
      R(g, bx - u(2), by + u(14), u(1), u(1), col); R(g, bx + u(2), by + u(14), u(1), u(1), col); // (its tails)
      for (let k = 0; k < 2; k++) for (const [gx, gy] of glyph(r)) R(g, bx - u(2) + Math.round(gx * 0.8 * Q) + Q, by + u(2) + k * u(6) + Math.round(gy * 0.8 * Q), Math.max(1, Q - 1), Math.max(1, Q - 1), '#e8d8c0');
    }
  }

  // A SHOP, lit inside: its window's panes, shelves and their goods, posters, hanging lamps, a glass
  // door, OPEN glowing in the window
  function shop(g, x, w, ch, yG, r, d) {
    const L = rp(r, ['#b8d86a', '#ffc46b', '#7fe3ff', '#ff9fd0', '#c8b8ff']);
    R(g, x + Q, yG + Q, w - u(2), u(11), '#100e18'); // (the fascia)
    A(g, x + u(2), yG + u(11), w - u(4), Q, L, 0.8);
    const word = rp(r, WORDS.filter((s) => textW7(s, Q) <= w - u(12)));
    if (word) { const sx = x + Math.floor((w - textW7(word, Q)) / 2); R(g, sx - u(2), yG, textW7(word, Q) + u(4), u(11), '#07060d'); sign({ kind: 'text', font: 7, frame: true, s: word, x: sx, y: yG + u(2), w: textW7(word, Q), h: u(7), col: rp(r, NEON), faulty: r() < 0.15 }); }
    const wy = yG + u(13);
    const wh = ch - wy - u(2);
    R(g, x + u(2), wy - Q, w - u(4), wh + u(2), '#0e0c15'); // (the frame)
    g.globalAlpha = 0.85;
    R(g, x + u(3), wy, w - u(6), wh, L);
    g.globalAlpha = 1;
    A(g, x + u(3), wy, w - u(6), Math.floor(wh / 2), '#ffffff', 0.12); // (brighter up by the lights)
    for (let sy = wy + Math.floor(wh * 0.45); sy < ch - u(3); sy += u(5)) { // (its shelves, and the goods on them)
      A(g, x + u(3), sy, w - u(6), Q, '#000000', 0.35);
      for (let gx = x + u(3); gx < x + w - u(3); gx += Q + 1) if (d() < 0.55) { const gh = ri(d, Q, u(2)); A(g, gx, sy - gh, Q, gh, rp(d, ['#2a2040', '#40202a', '#203040', '#c03050', '#3060c0', '#e0c040']), 0.6); }
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
    out.spills.push({ x: x + u(3), w: w - u(6), y: wy, h: wh, col: L, shop: true });
    out.stops.push(x + Math.floor(w / 2));
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
      const ry = yG - u(12) - rn * u(3);
      if (ry > u(world.deck ? world.deck.bot + 2 : 2)) sign({ kind: 'rungs', x: rx, y: ry, w: u(6), h: rn * u(3), n: rn, col, faulty: r() < 0.25 });
    }
    out.spills.push({ x: x + u(3), w: w - u(6), col });
  }
  // THE METRO: its big sign (METRO, the line's glyphs, arrows, the clock), doors of lit mesh
  function metro(g, x, w, ch, yG, r) {
    const T = '#7ff2d8';
    R(g, x + u(2), yG - u(18), w - u(4), u(22), '#0c2424');
    R(g, x + u(2), yG - u(18), w - u(4), Q, '#3a8a80');
    R(g, x + u(2), yG + u(3), w - u(4), Q, '#3a8a80');
    for (let k = 0; k < 3; k++) { const gl = glyph(r); for (const [gx, gy] of gl) R(g, x + u(5 + k * 7 + gx), yG - u(16 - gy), Q, Q, '#4fb3a8'); }
    const mk7 = Math.round(Q * 1.4); // (the big letters: about a bot pixel and a half)
    sign({ kind: 'text', font: 7, s: 'METRO', x: x + Math.floor((w - textW7('METRO', mk7)) / 2), y: yG - u(9), w: textW7('METRO', mk7), h: 7 * mk7, k: mk7, col: T });
    sign({ kind: 'screen', mode: 'clock', x: x + w - u(24), y: yG - u(16), w: textW('00:00', Q), h: u(5), col: T });
    sign({ kind: 'text', s: '>>>', x: x + w - u(16), y: yG + u(5), w: textW('>>>', Q), h: u(5), col: '#ff2a6d', faulty: true });
    const dy = yG + u(6);
    const dw = Math.floor((w - u(10)) / 2);
    for (let k = 0; k < 2; k++) {
      const dx = x + u(4) + k * (dw + u(2));
      R(g, dx, dy, dw, ch - dy, '#0e1a1a');
      const m = Q + 1;
      for (let yy = dy + 1; yy < ch; yy++) for (let xx = dx + 1; xx < dx + dw - 1; xx++) if ((xx + yy) % m === 0 || (xx - yy + 30000) % m === 0) A(g, xx, yy, 1, 1, '#4fb3a8', Q >= 4 ? 0.35 : 0.55);
      R(g, dx, dy, dw, Q, '#3a8a80');
    }
    A(g, x + u(3), dy, Q, ch - dy, T, 0.7);
    A(g, x + w - u(4), dy, Q, ch - dy, T, 0.7);
    out.spills.push({ x: x + u(3), w: w - u(6), col: '#4fb3a8' });
    out.stops.push(x + Math.floor(w / 2));
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
      out.spills.push({ x: bx, w: u(18), col: '#b14aed' });
      out.stops.push(bx + u(9));
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
    out.stops.push(x + Math.floor(w / 2));
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
    out.grates.push({ x: pot + u(3), y: u(13), pot: true });
    const mx = x + w - u(16);
    R(g, mx, yG + u(11), u(11), u(9), '#0a0608');
    sign({ kind: 'screen', mode: 'menu', x: mx + Q, y: yG + u(12), w: u(9), h: u(7), col: '#ffc46b' });
    out.spills.push({ x: x + u(4), w: w - u(8), col: '#ffb347', shop: true });
    out.stops.push(x + Math.floor(w / 2));
  }
  // A LOW building: its rooftop (railing, a rooftop sign), the city plain over it
  function lowLot(g, x, w, ch, yG, r, d, top) {
    R(g, x + Q, top - u(3), w - u(2), Q, '#3a3f4e');
    for (let k = x + Q; k < x + w - Q; k += u(3)) R(g, k, top - u(2), Math.max(1, Q - 1), u(2), '#3a3f4e');
    if (r() < 0.6) {
      // (big letters, a bot pixel and a half or so; what fits and whether there's room judged in bot
      // pixels, so it's the same street at any RES)
      const word = rp(r, WORDS.filter((s) => (s.length * 6 - 1) * 1.7 <= w / Q - 6)) || 'BAR';
      const k = Math.round(Q * 1.5);
      const sx = x + Math.floor((w - textW7(word, k)) / 2);
      const sy = top - u(6) - 7 * k;
      if (top / Q - 6 - 12 < 2) return (r() < 0.5 ? shop : shutter)(g, x, w, ch, yG, r, d); // (no room over it for the sign)
      R(g, sx - u(2), sy - u(2), textW7(word, k) + u(4), 7 * k + u(4), '#07060d');
      R(g, sx + u(2), sy + 7 * k + u(2), Q, top - (sy + 7 * k + u(2)), '#2a2d38');
      R(g, sx + textW7(word, k) - u(3), sy + 7 * k + u(2), Q, top - (sy + 7 * k + u(2)), '#2a2d38');
      sign({ kind: 'text', font: 7, s: word, x: sx, y: sy, w: textW7(word, k), h: 7 * k, k, col: rp(r, NEON), faulty: r() < 0.2 });
    }
    return (r() < 0.5 ? shop : shutter)(g, x, w, ch, yG, r, d); // (the shop under it, as the shops are)
  }
  // AN ALLEY: the city down it (left open), its shadowed floor, a dumpster, boxes, a hanging sign
  function alley(g, x, w, ch, r) {
    const dd = u(26);
    for (let y = ch - dd; y < ch; y++) A(g, x, y, w, 1, '#05040c', 0.25 + 0.5 * ((y - (ch - dd)) / dd)); // (the dark down it)
    A(g, x + Math.floor(w / 2) - u(2), ch - u(22), u(4), u(6), '#ffc46b', 0.35); // (a door lit far down it)
    if (w >= u(18)) { R(g, x + u(2), ch - u(8), u(11), u(8), '#1d3a2e'); R(g, x + u(2), ch - u(8), u(11), Q, '#2a5040'); R(g, x + u(3), ch - u(6), u(9), 1, '#16302a'); R(g, x + u(4), ch - u(4), u(2), Q, '#c8c8c8'); } // (a dumpster)
    R(g, x + w - u(6), ch - u(5), u(5), u(5), '#5a4630'); R(g, x + w - u(5), ch - u(8), u(4), u(3), '#6a5238'); R(g, x + w - u(6), ch - u(3), u(5), 1, '#3a2e20'); // (boxes)
    out.grates.push({ x: x + Math.floor(w / 2), y: u(2), alley: true });
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
  // AN ARCADE: ARCADE in big neon over it, bulbs along the fascia, inside in the dark rows of cabinets,
  // their marquees lit and their screens playing, a claw machine
  function arcade(g, x, w, ch, yG, r, d) {
    const col = rp(r, ['#ff2a6d', '#b14aed', '#05d9e8']);
    const word = textW7('ARCADE', Q) <= w - u(10) ? 'ARCADE' : 'GAMES';
    const sx = x + Math.floor((w - textW7(word, Q)) / 2);
    const sy = yG - u(7) - u(4);
    R(g, sx - u(3), sy - u(3), textW7(word, Q) + u(6), u(13), '#07060d');
    sign({ kind: 'text', font: 7, frame: true, s: word, x: sx, y: sy, w: textW7(word, Q), h: u(7), col, faulty: r() < 0.25 });
    R(g, x + Q, yG + Q, w - u(2), u(3), '#100a18');
    for (let bx = x + u(3); bx < x + w - u(3); bx += u(3)) sign({ kind: 'lantern', x: bx, y: yG + u(1) + 1, w: Q, h: Q, col: rp(r, ['#fff2b0', col]), faulty: r() < 0.06 });
    const iy = yG + u(4);
    R(g, x + u(2), iy, w - u(4), ch - iy, '#120a1e');
    A(g, x + u(2), iy, w - u(4), ch - iy, col, 0.1);
    for (let y = ch - u(4); y < ch; y++) for (let cx = x + u(2); cx < x + w - u(2); cx += 2) if (d() < 0.3) A(g, cx, y, 1, 1, rp(d, ['#ff2a6d', '#05d9e8', '#fffb6b']), 0.25); // (the carpet's pattern)
    let n = 0;
    for (let cx = x + u(4); cx + u(8) <= x + w - u(12); cx += u(10), n++) {
      R(g, cx, ch - u(20), u(8), u(20), '#1a1428'); // (a cabinet)
      R(g, cx, ch - u(20), 1, u(20), '#3a2a50');
      const mq = rp(r, NEON);
      R(g, cx, ch - u(20), u(8), u(2), mq); // (its marquee, lit)
      A(g, cx - Q, ch - u(21), u(8) + u(2), u(4), mq, 0.15);
      R(g, cx + Q, ch - u(17), u(6), u(5), '#05080a');
      sign({ kind: 'screen', mode: 'game', x: cx + Q, y: ch - u(17), w: u(6), h: u(5), col: rp(r, ['#39ff88', '#05d9e8', '#ff5ec4', '#fffb6b']), t: r() * 10 });
      R(g, cx, ch - u(11), u(8), u(2), '#2a2238'); // (its control panel: a stick, buttons)
      R(g, cx + u(2), ch - u(12), Q, Q, '#ff2a6d');
      R(g, cx + u(4), ch - u(11), Q, Q, '#05d9e8'); R(g, cx + u(5) + 1, ch - u(11), Q, Q, '#fffb6b');
    }
    const kx = x + w - u(11); // (a claw machine: its glass box, the claw, the prizes)
    R(g, kx, ch - u(24), u(9), u(24), '#2a1838');
    A(g, kx + Q, ch - u(22), u(7), u(10), '#cfe8ff', 0.25);
    R(g, kx + u(4), ch - u(22), 1, u(4), '#c8ccd8'); R(g, kx + u(3), ch - u(18), u(3), Q, '#c8ccd8');
    for (let k2 = 0; k2 < 6; k2++) R(g, kx + Q + (k2 % 3) * u(2), ch - u(14) + Math.floor(k2 / 3) * u(2), u(2) - 1, u(2) - 1, rp(r, ['#ff9fd0', '#7fe3ff', '#fffb6b', '#b8e07a']));
    out.spills.push({ x: x + u(3), w: w - u(6), y: iy, h: ch - iy, col, shop: true });
    out.stops.push(x + Math.floor(w / 2));
  }
  // A CLINIC (a street doctor's: chrome fitted while you wait): its green cross, a cold-lit window, an
  // x-ray of a hand on a light box, the chair under its lamp
  function clinic(g, x, w, ch, yG, r) {
    const L = '#9fffe0';
    const word = textW7('CLINIC', Q) <= w - u(8) ? 'CLINIC' : 'MEDIC';
    R(g, x + Q, yG + Q, w - u(2), u(11), '#0a1410');
    sign({ kind: 'text', font: 7, frame: true, s: word, x: x + Math.floor((w - textW7(word, Q)) / 2), y: yG + u(2), w: textW7(word, Q), h: u(7), col: '#39ff88', faulty: r() < 0.3 });
    R(g, x + u(2), yG - u(10), u(9), u(9), '#06100a');
    sign({ kind: 'cross', x: x + u(3) + Q, y: yG - u(9) + Q, w: u(6), h: u(6), k: u(2), col: '#39ff88', faulty: r() < 0.5 });
    const wy = yG + u(13);
    const wh = ch - wy - u(2);
    R(g, x + u(2), wy - Q, w - u(4), wh + u(2), '#0a1210');
    g.globalAlpha = 0.55; R(g, x + u(3), wy, w - u(6), wh, L); g.globalAlpha = 1;
    const lb = x + u(5); // (the light box, the hand's bones on it)
    R(g, lb, wy + u(2), u(9), u(11), '#cfe8ff');
    R(g, lb, wy + u(2), u(9), u(11), 'rgba(40, 80, 140, 0.5)');
    for (let f = 0; f < 4; f++) R(g, lb + u(2) + Math.round(f * u(1) * 1.5), wy + u(3) + (f === 0 ? u(2) : 0), Math.max(1, Q - 1), u(5) - (f === 0 ? u(2) : 0), '#f0f8ff');
    R(g, lb + u(2), wy + u(8), u(5), u(3), '#f0f8ff'); R(g, lb + u(1), wy + u(7), Q, u(2), '#f0f8ff');
    const cx = x + Math.floor(w * 0.6); // (the chair, the lamp over it)
    R(g, cx - u(5), ch - u(9), u(12), u(2), '#1a2a26'); R(g, cx + u(5), ch - u(14), u(2), u(6), '#1a2a26'); R(g, cx, ch - u(7), u(2), u(5), '#1a2a26');
    R(g, cx - u(1), wy, 1, u(4), '#2a3a36'); R(g, cx - u(3), wy + u(4), u(5), u(2), '#e8fff8'); A(g, cx - u(5), wy + u(6), u(9), u(6), '#ffffff', 0.18);
    R(g, x + w - u(12), wy, u(8), wh, '#0a1210'); // (its door: frosted, a cross on it)
    A(g, x + w - u(11), wy + Q, u(6), wh - Q, '#e8fff8', 0.35);
    R(g, x + w - u(9), wy + u(3), Q, u(4), '#39ff88'); R(g, x + w - u(10), wy + u(4), u(3), Q, '#39ff88');
    out.spills.push({ x: x + u(3), w: w - u(6), y: wy, h: wh, col: L, shop: true });
    out.stops.push(x + Math.floor(w / 2));
  }
  // VENDING MACHINES in a row (lit fronts, rows of cans and bottles, their buttons), a capsule-toy
  // machine at the end
  function vending(g, x, w, ch, yG, r, d) {
    R(g, x + Q, yG + u(2), w - u(2), u(3), '#14121f');
    const n = Math.max(1, Math.floor((w - u(14)) / u(11)));
    for (let k = 0; k < n; k++) {
      const vx = x + u(3) + k * u(11);
      const body = rp(r, ['#b81c34', '#1c46b8', '#d8d8e4', '#1c9058', '#2a2a36']);
      R(g, vx, ch - u(24), u(10), u(24), body);
      R(g, vx, ch - u(24), 1, u(24), 'rgba(255, 255, 255, 0.25)');
      R(g, vx + Q, ch - u(23), u(7), u(13), '#e8f4ff'); // (the lit front)
      A(g, vx + Q, ch - u(23), u(7), u(13), body, 0.15);
      for (let row = 0; row < 3; row++) for (let c = 0; c < 3; c++) { R(g, vx + u(2) + c * u(2), ch - u(22) + row * u(4), Q, u(3), rp(r, ['#c02040', '#2050c0', '#e0c040', '#20a060', '#f0f0f0', '#e06020'])); R(g, vx + u(2) + c * u(2), ch - u(22) + row * u(4), 1, u(3), 'rgba(255, 255, 255, 0.4)'); }
      R(g, vx + Q, ch - u(23), u(7), u(1), rp(r, NEON)); // (its logo strip)
      R(g, vx + u(8), ch - u(20), Q, u(8), '#1a1a22'); for (let b = 0; b < 4; b++) R(g, vx + u(8), ch - u(19) + b * u(2), Q, Q, rp(r, ['#39ff88', '#ff2a6d'])); // (the buttons)
      R(g, vx + u(2), ch - u(7), u(6), u(3), '#0a0a10'); // (the tray)
      out.spills.push({ x: vx, w: u(10), y: ch - u(23), h: u(13), col: '#cfe8ff' });
    }
    const gx = x + u(3) + n * u(11) + u(1); // (a capsule-toy machine: a dome of capsules on a red base)
    if (gx + u(7) < x + w) {
      R(g, gx, ch - u(10), u(7), u(10), '#c81c30');
      R(g, gx + Q, ch - u(16), u(5), u(6), '#cfe8ff');
      for (let k = 0; k < 6; k++) R(g, gx + Q + Math.round((k % 3) * Q * 1.5), ch - u(15) + Math.floor(k / 3) * u(2), Q, Q, rp(r, ['#ff2a6d', '#fffb6b', '#05d9e8', '#39ff88']));
      R(g, gx + u(2), ch - u(7), u(3), u(2), '#f0f0f0');
    }
    out.stops.push(x + Math.floor(w / 2));
  }
  // A NOODLE BAR: its curtain over the door (cloth flaps, a glyph on each), the warm inside, the cook
  // behind the counter, bowls steaming, stools, red lanterns either side
  function noodle(g, x, w, ch, yG, r, d) {
    const warm = '#ffb347';
    const word = rp(r, ['RAMEN', 'SOBA', 'UDON', 'NOODLE'].filter((s) => textW7(s, Q) <= w - u(8)));
    R(g, x + Q, yG + Q, w - u(2), u(11), '#1a0a08');
    if (word) sign({ kind: 'text', font: 7, frame: true, s: word, x: x + Math.floor((w - textW7(word, Q)) / 2), y: yG + u(2), w: textW7(word, Q), h: u(7), col: rp(r, ['#ff2a3c', '#ffb000']), faulty: r() < 0.2 });
    const iy = yG + u(13);
    R(g, x + u(3), iy, w - u(6), ch - iy, '#3a1c10');
    A(g, x + u(3), iy, w - u(6), ch - iy, warm, 0.45);
    R(g, x + Math.floor(w / 2) - u(3), ch - u(19), u(6), u(8), '#1a0c06'); // (the cook: a head, a white cap)
    R(g, x + Math.floor(w / 2) - u(2), ch - u(23), u(4), u(4), '#1a0c06'); R(g, x + Math.floor(w / 2) - u(2), ch - u(25), u(4), u(2), '#f0e8d8');
    R(g, x + u(3), ch - u(11), w - u(6), u(2), '#7a4a2a'); // (the counter)
    R(g, x + u(3), ch - u(9), w - u(6), u(9), '#4a2a18');
    for (let bx = x + u(6); bx < x + w - u(6); bx += u(8)) { R(g, bx, ch - u(13), u(4), u(2), '#f0e8d8'); R(g, bx + Q, ch - u(14), u(2), Q, '#c8a060'); }
    out.grates.push({ x: x + Math.floor(w / 2), y: u(14), pot: true });
    for (let sx = x + u(5); sx < x + w - u(4); sx += u(9)) { R(g, sx, ch - u(6), u(4), Q, '#c03020'); R(g, sx + Q, ch - u(5), Q, u(5), '#2a2a2a'); } // (stools)
    const flaps = Math.max(2, Math.floor((w - u(8)) / u(9))); // (the curtain)
    const fw = Math.floor((w - u(8)) / flaps);
    const cc = rp(r, ['#1c1c48', '#3a0c14', '#14301c']);
    for (let k = 0; k < flaps; k++) {
      const fx = x + u(4) + k * fw;
      R(g, fx, iy, fw - Q, u(10), cc);
      for (const [gx, gy] of glyph(r)) R(g, fx + Math.floor((fw - u(5)) / 2) + gx * Q, iy + u(3) + gy * Q, Q, Q, '#f0e8d8');
    }
    R(g, x + u(3), iy - Q, w - u(6), Q, '#2a1a10');
    sign({ kind: 'lantern', x: x + Q, y: yG + u(13), w: u(3), h: u(5), col: '#ff2a3c', faulty: r() < 0.1 });
    sign({ kind: 'lantern', x: x + w - u(4), y: yG + u(13), w: u(3), h: u(5), col: '#ff2a3c', faulty: r() < 0.1 });
    out.spills.push({ x: x + u(3), w: w - u(6), y: iy, h: ch - iy, col: warm, shop: true });
    out.stops.push(x + Math.floor(w / 2));
  }
  // A GATE under the tracks: chain-link (barbed wire on top, a hazard sign), the wall behind it tagged
  // with graffiti, a scooter parked behind it
  function gate(g, x, w, ch, yG, r, d) {
    for (let k = 0, n = ri(r, 2, 4); k < n; k++) tag(g, x + ri(r, u(3), w - u(16)), ch - u(ri(r, 14, 26)), r, d);
    const sx = x + ri(r, u(6), w - u(18)); // (the scooter)
    R(g, sx, ch - u(7), u(12), u(3), '#2a2a36'); R(g, sx + u(8), ch - u(11), u(2), u(4), '#2a2a36'); R(g, sx + u(1), ch - u(4), u(3), u(3), '#101018'); R(g, sx + u(8), ch - u(4), u(3), u(3), '#101018');
    out.lights.push({ x: sx, y: ch - u(6), ph: r() * 6.28, layer: 'front-fx' });
    const fy = ch - u(28);
    R(g, x + u(2), fy, Q, ch - fy, '#5a5e6a'); R(g, x + w - u(3), fy, Q, ch - fy, '#5a5e6a'); R(g, x + u(2), fy, w - u(4), Q, '#5a5e6a');
    const m = u(2);
    for (let yy = fy + Q; yy < ch; yy++) for (let xx = x + u(2) + Q; xx < x + w - u(3); xx++) if ((xx + yy) % m === 0 || (xx - yy + 30000) % m === 0) A(g, xx, yy, 1, 1, '#8a8e9a', 0.4);
    for (let xx = x + u(2); xx < x + w - u(2); xx++) { const k = (xx - x) % u(3); R(g, xx, Math.round(fy - u(2) + Math.abs(k - u(1.5)) * 0.8), 1, 1, '#6a6e7a'); } // (barbed wire)
    const hx = x + Math.floor(w / 2) - u(3); // (the hazard sign: a black triangle on yellow)
    R(g, hx, fy + u(6), u(7), u(6), '#e8c020');
    for (let k = 0; k < u(4); k++) { const half = Math.floor(k * 0.7); R(g, hx + Math.round(u(3.5)) - half, fy + u(7) + k, half * 2 + 1, 1, '#101010'); }
  }
  // (a graffiti tag: a scrawl in a spray can's neon, faded)
  function tag(g, x, y, r, d) {
    const col = rp(r, ['#ff2a6d', '#39ff88', '#05d9e8', '#fffb6b', '#b14aed', '#ff9f1c']);
    let px = x;
    let py = y;
    for (let k = 0, n = 26 + Math.floor(r() * 30); k < n; k++) {
      px += ri(r, -1, 2);
      py += ri(r, -2, 2);
      py = Math.max(y - u(4), Math.min(y + u(4), py));
      A(g, px * 1, py, Q, Q, col, 0.55);
    }
  }
  // A BARREL FIRE under the tracks: the flames (live), crates and cardboard, a robot warming itself
  function fire(g, x, w, ch, yG, r) {
    A(g, x + u(2), yG, w - u(4), ch - yG, '#000000', 0.35); // (the arch's dark)
    for (let k = 0, n = ri(r, 1, 2); k < n; k++) tag(g, k ? x + w - u(13) : x + u(2), ch - u(ri(r, 18, 26)), r); // (tags on its sides, clear of the fire)
    const bx = x + Math.floor(w / 2) - u(3);
    R(g, bx, ch - u(9), u(6), u(9), '#3a2a20'); R(g, bx, ch - u(7), u(6), Q, '#2a1a10'); R(g, bx, ch - u(3), u(6), Q, '#2a1a10');
    R(g, bx, ch - u(9), u(6), 1, '#6a4a30');
    A(g, x + u(2), ch - u(26), w - u(4), u(26), '#ff6a1c', 0.12); // (its light on the arch)
    sign({ kind: 'fire', x: bx, y: ch - u(17), w: u(6), h: u(8), col: '#ff6a1c' });
    out.fires.push(bx + u(3));
    const rx = r() < 0.5 ? bx - u(9) : bx + u(8); // (a robot squatting by it, one eye lit)
    R(g, rx, ch - u(8), u(6), u(8), '#1a1820'); R(g, rx + Q, ch - u(12), u(4), u(4), '#1a1820'); R(g, rx + (rx < bx ? u(3) : Q), ch - u(10), Q, Q, '#ff6a1c');
    R(g, x + u(3), ch - u(6), u(6), u(6), '#4a3a28'); R(g, x + u(4), ch - u(9), u(5), u(3), '#5a4630'); // (crates)
    R(g, x + w - u(10), ch - u(3), u(7), u(3), '#6a5a40'); // (cardboard)
    out.stops.push(x + Math.floor(w / 2));
  }
  // A CORPORATE LOBBY: its glass front (mullions, the inside lit cold: a reception desk, the company's
  // mark on the back wall, turnstiles, a guard mech), its name over the entrance
  function corp(g, x, w, ch, yG, r) {
    // (its name in big letters, a bot pixel and a half or so; what fits judged in bot pixels)
    const name = rp(r, ['HELIX', 'AXIOM', 'NULLSEC', 'VANTA', 'KESTREL', 'OBLIQ'].filter((s) => (s.length * 6 - 1) * 1.5 <= w / Q - 12));
    const k = Math.round(Q * 1.4);
    R(g, x + Q, yG - u(13), w - u(2), u(13), '#0c0e18');
    if (name) sign({ kind: 'text', font: 7, s: name, x: x + Math.floor((w - textW7(name, k)) / 2), y: yG - u(12), w: textW7(name, k), h: 7 * k, k, col: rp(r, ['#e8f4ff', '#05d9e8', '#ff5ec4']) });
    const iy = yG + Q;
    R(g, x + u(2), iy, w - u(4), ch - iy, '#1a2230');
    A(g, x + u(2), iy, w - u(4), ch - iy, '#cfe8ff', 0.3);
    const mx = x + Math.floor(w / 2) - u(4); // (the company's mark)
    R(g, mx, iy + u(4), u(8), u(8), '#0c1018');
    for (const [gx, gy] of glyph(r)) R(g, mx + u(1) + Math.round(gx * 1.2 * Q), iy + u(5) + Math.round(gy * 1.2 * Q), Q, Q, '#05d9e8');
    R(g, x + u(6), ch - u(10), u(14), u(10), '#2a3448'); R(g, x + u(6), ch - u(10), u(14), Q, '#8ab8d8'); // (the desk)
    for (let tx = x + w - u(22); tx < x + w - u(6); tx += u(5)) { R(g, tx, ch - u(7), Q, u(7), '#4a5468'); R(g, tx, ch - u(7), u(3), Q, '#39ff88'); } // (turnstiles)
    const gx = x + w - u(30); // (a guard mech, standing)
    R(g, gx, ch - u(20), u(7), u(8), '#2a2f3e'); R(g, gx + Q, ch - u(23), u(5), u(3), '#2a2f3e'); R(g, gx + Q, ch - u(22), u(5), Q, '#ff2a3c'); R(g, gx + Q, ch - u(12), u(2), u(12), '#2a2f3e'); R(g, gx + u(4), ch - u(12), u(2), u(12), '#2a2f3e');
    for (let k = x + u(2); k < x + w - u(2); k += u(10)) R(g, k, iy, Q, ch - iy, '#3a4458'); // (the mullions)
    for (let k = 0; k < 3; k++) { const sx = x + ri(r, u(4), w - u(10)); for (let i = 0; i < u(8); i++) A(g, sx + i, iy + u(2) + i, 1, 1, '#ffffff', 0.12); }
    out.spills.push({ x: x + u(2), w: w - u(4), y: iy, h: ch - iy, col: '#cfe8ff', shop: true });
    out.stops.push(x + Math.floor(w / 2));
  }
  // A HOLO COLUMN on the plaza: open (the city behind), planters of glowing synthetic trees either side,
  // a bench, the projector on the ground and the koi turning in its beam
  function holo(g, x, w, ch, yG, r) {
    for (const px of [x + u(2), x + w - u(12)]) { // (planters, a glowing tree in each)
      R(g, px, ch - u(6), u(10), u(6), '#2a2f3e'); R(g, px, ch - u(6), u(10), Q, '#4a5468');
      R(g, px + u(4), ch - u(16), u(2), u(10), '#1a1a22');
      const leaf = rp(r, ['#05d9e8', '#ff5ec4', '#39ff88']);
      for (let k = 0; k < 14; k++) A(g, px + u(1) + Math.floor(r() * u(8)), ch - u(24) + Math.floor(r() * u(9)), u(2), u(2), leaf, 0.55);
      A(g, px - u(1), ch - u(26), u(12), u(13), leaf, 0.08);
    }
    R(g, x + Math.floor(w / 2) + u(8), ch - u(5), u(10), Q, '#4a5468'); R(g, x + Math.floor(w / 2) + u(9), ch - u(4), Q, u(4), '#2a2f3e'); R(g, x + Math.floor(w / 2) + u(16), ch - u(4), Q, u(4), '#2a2f3e'); // (a bench)
    const cx = x + Math.floor(w / 2) - u(5);
    R(g, cx - u(1), ch - u(2), u(12), u(2), '#2a2f3e'); A(g, cx, ch - u(3), u(10), Q, '#05d9e8', 0.8);
    sign({ kind: 'holo', x: cx, y: ch - u(34), w: u(10), h: u(31), col: '#05d9e8', col2: rp(r, ['#ff9f1c', '#ff5ec4', '#fff2b0']) });
    out.spills.push({ x: cx - u(4), w: u(18), y: ch - u(6), h: u(6), col: '#05d9e8' });
    out.stops.push(x + Math.floor(w / 2));
  }
  // A VIDEO WALL: a building's whole face a screen (an advert playing), a lit lobby under it
  function videowall(g, x, w, ch, yG, r, d, top) {
    const by = Math.max(top + u(4), yG - u(34));
    const bh = yG - u(4) - by;
    if (bh > u(10)) {
      R(g, x + u(2), by - Q, w - u(4), bh + u(2), '#05040c');
      out.boards.push({ x: x + u(3), y: by, w: w - u(6), h: bh, mode: rp(r, ['logo', 'eye', 'beat', 'words']), col: rp(r, ['#05d9e8', '#ff2a6d', '#b14aed', '#39ff88']), t: r() * 10, glitch: 0, layer: 'front-fx' });
    }
    corp(g, x, w, ch, yG + u(12), r);
  }
  // A PILLAR of the viaduct: concrete, stained, graffiti on it, a poster or two, a stencil
  function pillar(g, x, w, ch, top, r, d) {
    R(g, x, top, w, ch - top, '#34343e');
    R(g, x, top, Q, ch - top, '#44444e');
    R(g, x + w - Q, top, Q, ch - top, '#24242c');
    for (let k = 0; k < 6; k++) A(g, x + Q + Math.floor(r() * (w - u(2))), top + Math.floor(r() * (ch - top)), u(2), u(ri(r, 3, 12)), '#000000', 0.15); // (stains)
    tag(g, x + Q, ch - u(ri(r, 10, 20)), r, d);
    if (r() < 0.6) { const py = ch - u(ri(r, 22, 34)); R(g, x + Q, py, w - u(2), u(7), rp(r, ['#d8d0c0', '#e8c8c8', '#c8d8e8'])); R(g, x + u(2), py + u(1), w - u(4), u(2), rp(r, ['#c02040', '#202040'])); R(g, x + u(2), py + u(4), w - u(5), Q, '#707080'); }
    if (Q >= 4) for (let k = 0; k < 40; k++) A(g, x + Math.floor(d() * w), top + Math.floor(d() * (ch - top)), 1, 1, '#000000', 0.3); // (up close: its pits)
  }
  // THE VIADUCT over the street: its deck (concrete, the railing on top, poles for the wires), sodium
  // lamps under it
  function drawDeck(g, ch, b0, b1) {
    const t = u(world.deck.top);
    const bt = u(world.deck.bot);
    const x0 = u(Math.max(0, b0 - 2));
    const x1 = b1 === Infinity ? g.canvas.width : u(b1 + 2);
    R(g, x0, t, x1 - x0, bt - t, '#30303a');
    R(g, x0, t, x1 - x0, Q, '#4a4a56');
    R(g, x0, bt - Q, x1 - x0, Q, '#1c1c24');
    R(g, x0, t + u(3), x1 - x0, 1, '#26262e');
    for (let k = 0; k < 4; k++) R(g, x0, bt + k, x1 - x0, 1, glowCol('#000000', 0.35 - k * 0.08)); // (its shadow under it)
    const start = Math.max(0, Math.floor(b0 / 4) * 4);
    for (let pb = start; pb < Math.min(world.Wb, b1 + 4); pb += 4) R(g, u(pb), t - u(3), Q, u(3), '#3a3a46'); // (the railing)
    R(g, x0, t - u(3), x1 - x0, Q, '#4a4a56');
    for (let pb = Math.max(10, Math.floor(b0 / 40) * 40 + 10); pb < Math.min(world.Wb, b1 + 40); pb += 40) { R(g, u(pb), t - u(14), Q, u(11), '#2a2a34'); R(g, u(pb) - u(3), t - u(14), u(7), Q, '#2a2a34'); } // (the wires' poles)
    R(g, x0, t - u(13), x1 - x0, 1, '#14141a');
    for (let lb = Math.max(6, Math.floor(b0 / 24) * 24 + 6); lb < Math.min(world.Wb, b1 + 24); lb += 24) {
      const lx = u(lb);
      R(g, lx + Q, bt, 1, u(2), '#2a2a34');
      sign({ kind: 'lantern', x: lx, y: bt + u(2), w: u(3), h: u(2), col: '#ffa040', faulty: (lb * 7) % 13 === 0, cone: true, reach: ch - bt - u(4) }); // (its light falling to the street)
    }
  }

  const DRAW = { shop, shutter, metro, kiosk, window: windowLot, stall, low: lowLot, arcade, clinic, vending, noodle, gate, fire, corp, videowall };

  // THE SIDEWALK: wet (UNDER THE TRACKS: asphalt, oily; THE PLAZA: polished tiles, light strips in
  // them), the street mirrored in it (mirror: the front's canvases, lined up with this one), pools of
  // the signs' and windows' light on it, their colors streaking down it, puddles; up close, cracks
  function drawGround(g, ch, b0, b1, mirror) {
    const style = VIEWS[view].ground || 'wet';
    const x0 = u(Math.max(0, b0 - 2));
    const x1 = b1 === Infinity ? g.canvas.width : u(b1 + 2);
    const d = rng(world.seed + 3 + Math.floor(b0));
    R(g, x0, 0, x1 - x0, ch, style === 'tiles' ? '#1a1a28' : style === 'asphalt' ? '#100f17' : '#14121f');
    R(g, x0, 0, x1 - x0, Q, style === 'tiles' ? '#3a3a58' : '#2a2540');
    g.fillStyle = style === 'tiles' ? '#24243a' : '#1b1829';
    for (let xb = Math.floor(b0 / 7) * 7; xb < Math.min(world.Wb + 2, b1 + 7); xb += 7) g.fillRect(u(xb), Q, 1, ch - Q);
    g.fillRect(x0, u(3), x1 - x0, 1);
    if (style === 'tiles') for (let xb = Math.floor(b0 / 40) * 40 + 12; xb < Math.min(world.Wb, b1 + 40); xb += 40) A(g, u(xb), u(2), u(18), 1, '#05d9e8', 0.6); // (its light strips)
    const rows = Math.min(ch, u(5));
    // (the street mirrored in the wet: its front upside down from the foot of it (a bot pixel down the
    // sidewalk), squeezed into the sidewalk's depth, rippling, fading; its lit signs brighter in it than
    // its walls)
    if (mirror) {
      const top = u(1);
      const st = (world.GFb + 8) / 4;
      const ox = Math.round(b0 * Q);
      for (let y = top; y < rows; y++) {
        const sy = mirror[0].height - 1 - Math.floor((y - top) * st);
        if (sy < 0) break;
        const off = Math.round(Math.sin(y * 1.9) * Math.max(1, Q / 2));
        const fade = 1 - (y - top) / (rows - top);
        mirror.forEach((m, i) => { g.globalAlpha = (i ? 0.6 : 0.32) * fade; g.drawImage(m, 0, sy, m.width, 1, ox + off, y, m.width, 1); });
      }
      g.globalAlpha = 1;
    }
    // (pools of the lights on it: the lower the light, the brighter its pool)
    g.save();
    g.globalCompositeOperation = 'lighter';
    const foot = u(world.hFb);
    for (const l of lightsOf('front-fx')) {
      const cx = l.x + l.w / 2;
      if (cx + l.w < x0 - u(12) || cx - l.w > x1 + u(12)) continue;
      const up = foot - (l.y + (l.cone ? 0 : l.h));
      const a = l.a * Math.max(0.15, 1 - up / u(world.GFb + 30)) * 0.9;
      for (let i = 0; i < 3; i++) {
        g.fillStyle = i === 2 ? dither(g, l.col, (2 * a) / 3) : glowCol(l.col, a / 3);
        ellipse(g, cx, Q, Math.round(l.w / 2) + u(3 + i * 4), u(1 + i));
      }
    }
    g.restore();
    // (the light on the wet: in streaks down from the back edge, as light lies on a wet street, brighter
    // at their heads)
    const k = style === 'tiles' ? 1.4 : 0.7;
    const streaks = (sx, sw, col, dens, a0) => {
      for (let x = sx; x < sx + sw; x++) {
        if (d() > dens * k) continue;
        const len = Math.max(1, Math.floor(rows * (0.3 + d() * 0.7)));
        const a = a0 + d() * 0.15;
        for (let y = Q; y < Q + len && y < rows; y++) A(g, x, y, 1, 1, col, a * (1 - (y - Q) / len));
      }
    };
    for (const s of out.spills) if (s.x + s.w >= x0 && s.x <= x1) streaks(s.x, s.w, s.col, 0.45, 0.22);
    for (const s of out.signs) if (s.layer === 'front-fx' && ['text', 'tube', 'cross'].includes(s.kind) && s.x + s.w >= x0 && s.x <= x1) streaks(s.x - Q, s.w + u(2), s.col, 0.3, 0.25);
    for (const p of world.puddles) { // (puddles: darker, a glint; under the tracks, oil's sheen on them)
      if (p.x + p.w < b0 - 2 || p.x > b1 + 2) continue;
      const px = u(p.x);
      const pw = u(p.w);
      const py = u(p.y);
      R(g, px, py, pw, Q, '#0c0b16');
      R(g, px + Q, py + Q, pw - u(2), Q, '#0c0b16');
      A(g, px + u(2) + Math.floor(p.at * (pw - u(4))), py, u(2), 1, p.col, 0.5);
      if (style === 'asphalt') A(g, px + u(1), py + Q, pw - u(3), 1, '#7a4ab0', 0.25);
    }
    if (Q >= 4) for (let k2 = 0, n = Math.floor((x1 - x0) / u(12)); k2 < n; k2++) { // (up close: cracks)
      let cx = x0 + Math.floor(d() * (x1 - x0));
      let cy = u(1) + Math.floor(d() * (ch - u(2)));
      for (let s = 0; s < 10; s++) { R(g, cx, cy, 1, 1, '#08070e'); cx += ri(d, 0, 1); cy += ri(d, -1, 1); }
    }
  }
  // IN FRONT: bollards, grates, bags, a cone (low: the bots' feet show over them)
  function drawNear(g, ch, b0, b1) {
    for (const it of world.near) {
      if (it.x < b0 - 8 || it.x > b1 + 2) continue;
      const x = u(it.x);
      const t = it.t;
      if (t < 0.35) { R(g, x, ch - u(5), u(2), u(5), '#2c2f3c'); R(g, x, ch - u(5), 1, u(5), '#40445a'); R(g, x, ch - u(6), u(2), Q, it.col); if (Q >= 4) { R(g, x, ch - u(3), u(2), Q, '#ffb000'); R(g, x, ch - u(2), u(2), 1, '#101010'); } }
      else if (t < 0.6) { R(g, x, ch - Q, u(6), Q, '#0b0a12'); for (let k = 0; k < u(6); k += 2) R(g, x + k, ch - Q, 1, Q, '#3a3a48'); out.grates.push({ x: x + u(3), y: -u(3), near: true }); }
      else if (t < 0.8) { R(g, x, ch - u(3), u(4), u(3), '#0d0d14'); R(g, x + Q, ch - u(4), u(2), Q, '#0d0d14'); R(g, x + Q, ch - u(3), Q, Q, '#23232e'); }
      else { R(g, x + Q, ch - u(4), Q, Q, '#ff6a1c'); R(g, x, ch - u(3), u(3), u(2), '#ff6a1c'); R(g, x, ch - u(2), u(3), Q, '#f2f2f2'); R(g, x - Q, ch - Q, u(5), Q, '#2a1a10'); }
    }
  }

  // ── What flickers and plays: the signs, the screens, the fires, the holo, the billboards, the lights ──
  const LIVE = ['screen', 'fire', 'holo'];
  function bounds(s) { const m = (s.kind === 'fire' || s.kind === 'holo' ? Q * 4 : Q * 2) + (s.frame ? u(2) : 0); return [s.x - m, s.y - m, s.w + m * 2, s.h + m * 2]; }
  // (a lightbox's frame: a neon tube round its word)
  function frame(g, s, col) {
    const m = u(2);
    const t = Math.max(1, Math.round(Q * 0.6));
    const x = s.x - m; const y = s.y - m; const w = s.w + m * 2; const h = s.h + m * 2;
    R(g, x, y, w, t, col); R(g, x, y + h - t, w, t, col); R(g, x, y, t, h, col); R(g, x + w - t, y, t, h, col);
    if (t >= 2 && s.on) { const c = Math.floor(t / 2); R(g, x + c, y + c, w - c * 2, 1, HOT); R(g, x + c, y + h - t + c, w - c * 2, 1, HOT); R(g, x + c, y + c, 1, h - c * 2, HOT); R(g, x + w - t + c, y + c, 1, h - c * 2, HOT); } // (its hot core)
  }
  const meets = (a, b) => a[0] < b[0] + b[2] && b[0] < a[0] + a[2] && a[1] < b[1] + b[3] && b[1] < a[1] + a[3];
  function paintSign(g, s, now) {
    const [bx, by, bw, bh] = bounds(s);
    const on = s.on;
    const col = on ? s.col : '#3a2a3a';
    const k = s.k || Q;
    if (on && s.kind === 'lantern') A(g, bx + Q, by + Q, bw - u(2), bh - u(2), s.col, 0.16); // (a lantern's paper glowing round its frame; the rest's light is the street's own, THE LIGHT)
    if (s.kind === 'text') { (s.font === 7 ? text7 : text)(g, s.s, s.x, s.y, col, k, on); if (s.frame) frame(g, s, col); }
    else if (s.kind === 'logo') { text7(g, 'BYTE', s.x, s.y, on ? s.col : '#1a3a2a', k, on); text7(g, 'FALL', s.x + 24 * k, s.y, on ? s.col2 : '#3a2a10', k, on); }
    else if (s.kind === 'glyphs') {
      if (s.box && on) { R(g, s.x - Q, s.y - Q, s.w + u(2), s.h + Q, s.col); A(g, s.x - Q, s.y - Q, s.w + u(2), Q, '#ffffff', 0.3); }
      const gc = s.box ? (on ? '#1a0a14' : '#2a1a24') : col;
      s.glyphs.forEach((gl, i) => { for (const [gx, gy] of gl) { const px = s.x + (s.across ? i * u(7) + gx * Q : gx * Q); const py = s.y + (s.across ? gy * Q : i * u(7) + gy * Q); R(g, px, py, Q, Q, gc); if (on && !s.box && Q >= 3) R(g, px + 1, py + 1, Q - 2, Q - 2, HOT); } });
    } else if (s.kind === 'tube') {
      R(g, s.x, s.y, s.w, s.h, col);
      if (on) { A(g, s.x - Q, s.y, Q, s.h, s.col, 0.45); A(g, s.x + s.w, s.y, Q, s.h, s.col, 0.45); R(g, s.x + Math.floor(s.w / 2), s.y, 1, s.h, '#ffe6f0'); }
    } else if (s.kind === 'rungs') {
      for (let i = 0; i < s.n; i++) { R(g, s.x, s.y + i * u(3), s.w, Q, col); if (on) R(g, s.x + 1, s.y + i * u(3), s.w - 2, 1, HOT); }
    } else if (s.kind === 'cross') {
      R(g, s.x + k, s.y, k, 3 * k, col); R(g, s.x, s.y + k, 3 * k, k, col);
      if (on && k >= 3) { R(g, s.x + k + 1, s.y + 1, k - 2, 3 * k - 2, HOT); R(g, s.x + 1, s.y + k + 1, 3 * k - 2, k - 2, HOT); }
    } else if (s.kind === 'lantern') { // (ribbed paper, lit from within; a dark cap)
      R(g, s.x, s.y + 1, s.w, Math.max(1, s.h - 1), col);
      if (s.w >= 3) { R(g, s.x + 1, s.y, s.w - 2, s.h, col); R(g, s.x + 1, s.y, s.w - 2, 1, '#2a1010'); for (let ry = s.y + 2; ry < s.y + s.h - 1; ry += 2) A(g, s.x, ry, s.w, 1, '#000000', 0.25); if (on) R(g, s.x + Math.floor(s.w / 2), s.y + 1, 1, s.h - 2, '#fff4d0'); }
    } else if (s.kind === 'screen') paintScreen(g, s, now);
    else if (s.kind === 'fire') paintFire(g, s, now);
    else if (s.kind === 'holo') paintHolo(g, s, now);
  }
  function paintScreen(g, s, now) {
    const t = (now || 0) / 1000 + (s.t || 0);
    R(g, s.x, s.y, s.w, s.h, '#05080a');
    if (!s.on) return;
    if (s.mode === 'clock') { const dd = new Date(); const hm = `${String(dd.getHours()).padStart(2, '0')}${t % 2 < 1 ? ':' : ' '}${String(dd.getMinutes()).padStart(2, '0')}`; text(g, hm, s.x, s.y, s.col, Q, false); }
    else if (s.mode === 'radar') { // (a sweep round a ring, a blip)
      const cx = s.x + Math.floor(s.w / 2); const cy = s.y + Math.floor(s.h / 2);
      const rx = s.w / 2 - 1; const ry = s.h / 2 - 1;
      for (let a = 0; a < 6.28; a += 0.25 / Q) A(g, cx + Math.round(Math.cos(a) * rx), cy + Math.round(Math.sin(a) * ry), 1, 1, s.col, 0.5);
      const a = t * 2.4; for (let k = 0; k < rx; k++) A(g, cx + Math.round(Math.cos(a) * k), cy + Math.round(Math.sin(a) * k * (ry / rx)), 1, 1, s.col, 0.9);
      if ((t % 3) < 1.5) R(g, cx + Math.round(rx * 0.5), cy - Math.round(ry * 0.3), Q, Q, '#ff2a6d');
    } else if (s.mode === 'game') { // (an arcade cabinet's: bits falling down its columns, a paddle after them)
      for (let i = 0; i < s.w; i += Q) { const y = Math.floor((t * (3 + ((i / Q) % 3)) * Q + i * 5) % s.h); R(g, s.x + i, s.y + y, Q - (Q > 2 ? 1 : 0), Q - (Q > 2 ? 1 : 0), s.col); }
      R(g, s.x + Math.floor(((Math.sin(t * 1.7) + 1) / 2) * (s.w - u(2))), s.y + s.h - 1, u(2), 1, '#ffffff');
    } else { // ('menu': lines of it, a cursor blinking)
      for (let ly = 0; ly < s.h; ly += Q + 1) A(g, s.x + Q, s.y + ly, Math.max(2, s.w - u(2) - ((ly * 7) % u(5))), 1, s.col, 0.7);
      if (t % 1 < 0.5) R(g, s.x + s.w - u(2), s.y + s.h - Q, Q, Q, s.col);
    }
  }
  // (a barrel's fire: columns of flame licking up, white-yellow at the root to red at the tips, its glow)
  function paintFire(g, s, now) {
    const t = (now || 0) / 1000;
    A(g, s.x - u(3), s.y - u(2), s.w + u(6), s.h + u(4), '#ff6a1c', 0.12);
    for (let i = 0; i < s.w; i++) {
      const n = 0.5 + 0.5 * Math.sin(t * 9 + i * 1.7) * Math.sin(t * 5.3 + i * 0.9);
      const edge = 1 - Math.abs(i - s.w / 2) / (s.w * 0.7);
      const fh = Math.max(1, Math.round(s.h * (0.35 + 0.65 * n) * edge));
      for (let k = 0; k < fh; k++) { const f = k / fh; R(g, s.x + i, s.y + s.h - 1 - k, 1, 1, f < 0.3 ? '#fff2a0' : f < 0.6 ? '#ffb347' : f < 0.85 ? '#ff6a1c' : '#b02a10'); }
    }
  }
  // (the holo column: its beam, scanlines rising, a koi turning as it swims round, its ring of light)
  function paintHolo(g, s, now) {
    const t = (now || 0) / 1000;
    for (let y = s.y; y < s.y + s.h; y++) A(g, s.x, y, s.w, 1, s.col, (y + Math.floor(t * 12)) % 3 === 0 ? 0.14 : 0.05);
    const cx = s.x + s.w / 2;
    const cy = s.y + s.h * (0.42 + 0.14 * Math.sin(t * 0.8));
    const turn = Math.cos(t * 1.3);
    const bw = Math.max(1, Math.round(Math.abs(turn) * u(4)));
    const bh = u(2);
    for (let dy = -bh; dy <= bh; dy++) { const half = Math.round(bw * Math.sqrt(Math.max(0, 1 - (dy / (bh + 0.5)) ** 2))); R(g, Math.round(cx - half), Math.round(cy + dy), half * 2 + 1, 1, glowCol(s.col2, 0.8)); }
    const dir = turn > 0 ? -1 : 1;
    for (let k = 0; k < u(3); k++) R(g, Math.round(cx + dir * (bw + k)), Math.round(cy - k / 2), 1, k + 1, glowCol(s.col2, 0.6)); // (its tail)
    if (Math.abs(turn) > 0.3) R(g, Math.round(cx - dir * bw * 0.5), Math.round(cy - 1), Math.max(1, Q - 1), Math.max(1, Q - 1), '#05040c'); // (its eye)
    for (let y = Math.round(cy - bh); y <= cy + bh; y += 2) A(g, Math.round(cx - bw), y, bw * 2 + 1, 1, '#ffffff', 0.12);
    A(g, s.x - Q, s.y + s.h - Q, s.w + u(2), Q, s.col, 0.6);
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
      let changed = all || LIVE.includes(s.kind);
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
      for (const dd of rects) g.rect(...dd);
      g.clip();
      for (const s of world.signs) { if (s.layer !== layer) continue; const b = bounds(s); if (rects.some((dd) => meets(b, dd))) paintSign(g, s, calm ? 0 : now); }
      g.restore();
    }
    for (const b of world.boards) {
      if (!calm && Math.random() < 0.01) b.glitch = now + rand(80, 260);
      paintBoard(els[b.layer].getContext('2d'), b, calm ? 0 : now);
    }
    for (const L of world.lights) { // (the masts' and roofs' red lights, blinking)
      const g = els[L.layer].getContext('2d');
      const on = calm || Math.sin(now / 600 + L.ph) > 0.2;
      g.clearRect(L.x - Q, L.y - Q, u(3), u(3));
      if (on) { A(g, L.x - Q, L.y - Q, u(3), u(3), '#ff283c', 0.35); R(g, L.x, L.y, Math.max(1, Q - 1), Math.max(1, Q - 1), '#ff3a4a'); }
    }
  }

  // ── THE LIGHT ──
  // What's lit lights what's round it: the walls, the awnings, the sills, the wires, the sidewalk, and
  // the crowd as it walks under it. In stepped bands, the outermost dithered (a soft light, pixel art's
  // way), drawn once with each layer and added onto its own pixels only (its gaps stay the city's).
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; };
  const pats = new WeakMap(); // (each context's dither patterns, made once a color and strength)
  function dither(g, col, a) {
    let m = pats.get(g);
    if (!m) { m = new Map(); pats.set(g, m); }
    const key = `${col}|${a.toFixed(3)}`;
    let p = m.get(key);
    if (!p) { const c = mk(2, 2); const cg = c.getContext('2d'); cg.fillStyle = glowCol(col, a); cg.fillRect(0, 0, 1, 1); cg.fillRect(1, 1, 1, 1); p = g.createPattern(c, 'repeat'); m.set(key, p); }
    return p;
  }
  function ellipse(g, cx, cy, rx, ry) { for (let dy = -ry; dy <= ry; dy++) { const half = Math.round(rx * Math.sqrt(Math.max(0, 1 - (dy / (ry + 0.5)) ** 2))); g.fillRect(Math.round(cx - half), Math.round(cy + dy), half * 2 + 1, 1); } }
  const BANDS = 4;
  function glow(g, l) {
    const cx = l.x + l.w / 2;
    const cy = l.y + l.h / 2;
    for (let i = 0; i < BANDS; i++) {
      const e = Math.round((l.r * (i + 1)) / BANDS);
      g.fillStyle = i === BANDS - 1 ? dither(g, l.col, (2 * l.a) / BANDS) : glowCol(l.col, l.a / BANDS);
      ellipse(g, cx, cy, Math.round(l.w / 2) + e, Math.round(l.h / 2) + e);
    }
  }
  function cone(g, l) { // (a lamp's light falling: wider as it goes down, fading in bands)
    const dz = dither(g, l.col, (2 * l.a) / BANDS);
    for (let k = 0; k < l.h; k++) {
      const t = k / l.h;
      const lv = Math.ceil((1 - t) * BANDS) / BANDS;
      g.fillStyle = lv <= 1 / BANDS ? dz : glowCol(l.col, l.a * lv);
      const half = Math.round(l.w / 2 + l.spread * t);
      g.fillRect(Math.round(l.x + l.w / 2 - half), l.y + k, half * 2, 1);
    }
  }
  // (a layer's lights: its signs (a lantern's small, a fire's big, a screen's faint, a lightbox's
  // reaching past its frame), its billboards, whatever else glows on it; on the street's front, its lit
  // windows and doors too)
  const REACH = { lantern: 3, fire: 14, holo: 9, screen: 3, glyphs: 6, tube: 6, rungs: 6 };
  const BRIGHT = { fire: 0.45, screen: 0.16, lantern: 0.17, holo: 0.3 };
  function lightsOf(layer) {
    const L = [];
    for (const s of out.signs) {
      if (s.layer !== layer) continue;
      if (s.cone) { L.push({ cone: true, x: s.x, y: s.y + s.h, w: s.w, h: s.reach, spread: u(7), col: s.col, a: 0.32 }); continue; }
      const r = u(REACH[s.kind] || 9) + (s.frame ? u(2) : 0);
      const a = BRIGHT[s.kind] || 0.36;
      if (s.kind === 'logo') { L.push({ x: s.x, y: s.y, w: s.w / 2, h: s.h, col: s.col, r, a }, { x: s.x + s.w / 2, y: s.y, w: s.w / 2, h: s.h, col: s.col2, r, a }); continue; }
      L.push({ x: s.x, y: s.y, w: s.w, h: s.h, col: s.col, r, a });
    }
    for (const b of out.boards) if (b.layer === layer) L.push({ x: b.x, y: b.y, w: b.w, h: b.h, col: b.col, r: u(7), a: 0.22 });
    for (const gl of out.glows) if (gl.layer === layer) L.push(gl);
    if (layer === 'front-fx') {
      const yG = u(world.hFb - world.GFb);
      for (const sp of out.spills) L.push({ x: sp.x, y: sp.y !== undefined ? sp.y : yG + u(10), w: sp.w, h: sp.h !== undefined ? sp.h : u(world.GFb - 12), col: sp.col, r: u(7), a: 0.18 });
    }
    return L;
  }
  // (the layer lit: its own pixels with the light added, kept only where it has pixels; a strip at a
  // time, so the street's long canvases never need another as big all at once)
  function lightLayer(c, lights, ox = 0) {
    if (!lights.length) return;
    const STRIP = 1024;
    const cg = c.getContext('2d');
    for (let x0 = 0; x0 < c.width; x0 += STRIP) {
      const w = Math.min(STRIP, c.width - x0);
      const near = lights.filter((l) => { const reach = (l.cone ? l.spread : l.r) + 2; return l.x - ox - reach < x0 + w && l.x - ox + l.w + reach > x0; });
      if (!near.length) continue;
      const Lc = mk(w, c.height);
      const lg = Lc.getContext('2d');
      lg.globalCompositeOperation = 'lighter';
      lg.translate(-(ox + x0), 0);
      for (const l of near) (l.cone ? cone : glow)(lg, l);
      const T = mk(w, c.height);
      const t = T.getContext('2d');
      t.drawImage(c, x0, 0, w, c.height, 0, 0, w, c.height);
      t.globalCompositeOperation = 'lighter';
      t.drawImage(Lc, 0, 0);
      t.globalCompositeOperation = 'destination-in';
      t.drawImage(c, x0, 0, w, c.height, 0, 0, w, c.height);
      cg.save();
      cg.setTransform(1, 0, 0, 1, 0, 0);
      cg.clearRect(x0, 0, w, c.height);
      cg.drawImage(T, x0, 0);
      cg.restore();
    }
  }
  // (the light along the street where the crowd walks, a bot pixel at a time: its color and how much)
  function tintMap() {
    const n = world.Wb + 2;
    const t = new Float32Array(n * 4);
    for (const l of lightsOf('front-fx')) {
      const cx = (l.x + l.w / 2) / Q;
      const R0 = (l.w / 2 + (l.cone ? l.spread : l.r)) / Q + 4;
      const [cr, cg, cb] = hexRgb(l.col);
      for (let b = Math.max(0, Math.floor(cx - R0)); b < Math.min(n, Math.ceil(cx + R0)); b++) {
        const k = l.a * (1 - Math.abs(b - cx) / R0);
        if (k <= 0) continue;
        t[b * 4] += cr * k; t[b * 4 + 1] += cg * k; t[b * 4 + 2] += cb * k; t[b * 4 + 3] += k;
      }
    }
    return t;
  }

  // ── THE MOON (the weather's, weather.js): behind the towers, its haze round it ──
  function moonTick(now) {
    const m = api.moon ? api.moon() : null;
    const up = m ? Math.min(1, (now - m.rise) / 20000) : 0;
    const key = m ? `${m.side}|${Math.round(m.level * 12)}|${Math.round(up * 24)}|${Q}` : '';
    if (key === moonKey) return;
    moonKey = key;
    const c = els.moon;
    const g = c.getContext('2d');
    g.clearRect(0, 0, c.width, c.height);
    if (!m) return;
    const r0 = u(api.game() ? 6 : 10);
    const k = m.phase;
    const cc = Math.cos(2 * Math.PI * k);
    const cx = Math.round((m.side * api.laneW()) / C);
    const cy = Math.round(c.height * (api.game() ? 0.16 : 0.22) + (1 - up * (2 - up)) * c.height * 0.3);
    g.globalAlpha = m.level;
    for (let ring = 6; ring >= 1; ring--) { const rr = r0 + u(ring * 2); for (let y = -rr; y <= rr; y += 1) { const half = Math.round(Math.sqrt(Math.max(0, rr * rr - y * y))); A(g, cx - half, cy + y, half * 2 + 1, 1, '#b8a8ff', 0.025); } } // (its haze, stepped)
    const crater = (x, y) => { const a = Math.sin(x * 0.37 / Q + y * 0.21 / Q) + Math.sin(x * 0.13 / Q - y * 0.41 / Q); return a > 1.1; };
    for (let y = -r0; y <= r0; y++) for (let x = -r0; x <= r0; x++) {
      if (x * x + y * y > r0 * r0 + 1) continue;
      const half = Math.sqrt(Math.max(0, 1 - (y / (r0 + 0.5)) ** 2));
      const nx = (x + 0.5) / (r0 + 0.5);
      const lit = k < 0.5 ? nx >= cc * half : nx <= -cc * half;
      R(g, cx + x, cy + y, 1, 1, !lit ? 'rgba(120, 125, 160, 0.22)' : crater(x, y) ? '#c9c3a6' : '#efe9d2');
    }
    g.globalAlpha = 1;
  }

  // ── THE CROWD: pixel figures at the bots' pixel size, taller than them (rows of palette letters, two
  // frames of legs), scaled up to the street's pixels the pixel artist's way, each pose drawn once ──
  const PAL = {
    K: '#06050b', h: '#1d1a2e', H: '#2c2744', B: '#000000', C: '#26213a', c: '#16132a', G: '#141220', b: '#0b0a12',
    M: '#6c7488', m: '#a2aabe', Q: '#4a5266', q: '#5e6680', a: '#3a3f4e', D: '#3c4458', d: '#262c3e', S: '#22222e', J: '#1c1b2a', P: '#121220',
    X: '#6b4a2a', x: '#8a6440', p: '#5c6478', w: '#33304a', T: '#b8bcc8', R: '#ff2a3c', W: '#fff6c8', k: '#181620',
  };
  // (e: eyes, L: an LED, v: a visor, U: a neon rim, u: a canopy, s: a shaft, g: a hover glow, r: a
  // blinking red light, R: a steady one, O: a droid's eye, o: its rim, W: a headlight)
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
  // THE PEOPLE (not ByteFall's: off unless the sandbox's PEOPLE turns them on; a start on a city's people
  // for a game of its own): a face, hair, a coat, trousers, each their own (palette letters: f/F skin,
  // y hair, j/N coat, n trousers); one under a clear umbrella, one lit by the phone in their hands
  const PERSON = {
    w: 12,
    rows: ['....yyyy....', '...yyyyyy...', '...yffffy...', '...fBffBf...', '...ffffff...', '....fFFf....', '.....ff.....', '..jjjjjjjj..', '.jjjjjjjjjj.', '.jjNjjjjNjj.', '.jjNjjjjNjj.', '.fjNjjjjNjf.', '.fjjjjjjjjf.', '..jjjjjjjj..', '..nnnnnnnn..', '..nnn..nnn..'],
    legs: [['..nn....nn..', '..nn....nn..', '.bbb....bbb.'], ['....nn.nn...', '....nn.nn...', '...bbb.bbb..']],
  };
  const PHONE = { ...PERSON, rows: ['....yyyy....', '...yyyyyy...', '...yffffy...', '...ffffff...', '...fBffBf...', '....fFFf....', '.....ff.....', '..jjjjjjjj..', '.jjjjjjjjjj.', '.jjNjjjiijj.', '.jjNjjjffjj.', '.jjNjjjjNjj.', '.jjjjjjjjjj.', '..jjjjjjjj..', '..nnnnnnnn..', '..nnn..nnn..'] };
  const BROLLY = (() => {
    const canopy = ['..........VVVV......', '.......VVZZZZZVV....', '.....VVZZZZZZZZZVV..', `....V${'Z'.repeat(13)}V.`, '...VVVVVVVVVVVVVVVVV'];
    const rows = [...canopy, '............s.......', '............s.......'];
    PERSON.rows.forEach((r, i) => { let row = `${r}........`.slice(0, 20); if (i <= 9) row = `${row.slice(0, 12)}s${row.slice(13)}`; rows.push(row); });
    return { w: 20, rows, legs: PERSON.legs.map((f) => f.map((r) => `${r}........`.slice(0, 20))) };
  })();
  const SKIN = [['#e0b090', '#c08a6a'], ['#b07850', '#8a5a3a'], ['#7a4a30', '#5a3420'], ['#f0c8a8', '#d0a080']];
  const HAIR = ['#1a1a20', '#3a2418', '#c8c0b0', '#d04080', '#20a0c0', '#e0c050'];
  const COAT = [['#3a3046', '#2a2234'], ['#5a2a2a', '#3a1a1a'], ['#2a3a46', '#1a2834'], ['#4a4a30', '#34341e'], ['#a08a68', '#806a4c']];
  const PANTS = ['#1a1a24', '#2a2a3a', '#34302a'];
  const PEOPLE_MIX = { person: 4, brolly: 2, phone: 1.5 };
  let people = !!api.people || !!window.CYBER_PEOPLE;
  const FIG = {
    person: { ...PERSON, speed: [4, 6.5], human: true },
    brolly: { ...BROLLY, speed: [4, 6], human: true },
    phone: { ...PHONE, speed: [3, 4.5], human: true },
    hood: { ...HOOD, eyeRow: 4, speed: [4.5, 7] },
    umbrella: { ...UMB, speed: [4.5, 6.5] },
    robot: { w: 14, rows: ['......r.......', '......a.......', '....MMMMMM....', '...MmmmmmmM...', '...MvvvvvvM...', '...MmmmmmmM...', '....MMMMMM....', '.....QQQQ.....', '.MMQQQQQQQQMM.', 'MmmQqqqqqqQmmM', 'MmmQqLLqqqQmmM', 'Mm.QqLLqqqQ.mM', 'Mm.QqqqqqqQ.mM', 'pp.QQQQQQQQ.pp', '...QQQQQQQQ...', '...Qq....qQ...'], legs: [['...QQ....QQ...', '...QQ....QQ...', '..QQ......QQ..', '..KKK....KKK..'], ['....QQ..QQ....', '....QQ..QQ....', '....QQ..QQ....', '...KKK..KKK...']], speed: [4, 6] },
    android: { w: 10, rows: ['...SSSS...', '..SSSSSS..', '..SvvvvS..', '..SSSSSS..', '...SSSS...', '....SS....', '..JJJJJJ..', '.JJJLJJJJ.', 'JJ.JLJJ.JJ', 'J..JLJJ..J', 'J..JLJJ..J', 'S..JJJJ..S', '...JJJJ...', '...JJJJ...', '...JJJJ...', '...P..P...', '...P..P...', '...P..P...'], legs: [['..P....P..', '..P....P..', '.bb....bb.'], ['...P..P...', '...P..P...', '..bb..bb..']], speed: [5, 7] },
    droid: { w: 12, rows: ['....dddd....', '..dDDDDDDd..', '.dDDDDDDDDd.', '.dDDoOOoDDd.', 'dDDDoOOoDDDd', 'dDDDDDDDDDDd', '.dDDDDDDDDd.', '..dDDDDDDd..', '...dddddd...'], legs: [['...g.gg.g...', '....gggg....', '............'], ['..g.g..g.g..', '...gggggg...', '....g..g....']], hover: 4, speed: [9, 14] },
    drone: { w: 13, rows: ['ppp.......ppp', '.a.........a.', '.aDDDDDDDDDa.', '...DDDrDDD...', '....DDDDD....', '.....XxX.....', '....XXXXX....', '....XXxXX....'], legs: [[], []], fly: true, speed: [10, 16] },
    // (a CYBORG: a long coat, a red implant for an eye, a metal arm, a light in its hand)
    cyborg: { w: 12, rows: ['....hhhh....', '...hHHHHh...', '...hSSSSh...', '...SRSSTS...', '...SSSSTT...', '....SSSS....', '..cCCCCCCc..', '.cCCCCCCCTT.', '.cCCcCCcCTmT', '.cCCcCCcCTmT', '.cCCcCCcC.mT', '.cCCcCCcC.TL', '.cCCCCCCC...', '..cCCCCCc...', '..cCCCCCc...', '..cCC.CCc...'], legs: HOOD.legs, speed: [4.5, 6.5] },
    // (a security MECH: big, slow, a red visor, heavy feet)
    mech: { w: 16, rows: ['.......a........', '.....DDDDDD.....', '....DddddddD....', '....DRRRRRRD....', '....DddddddD....', '.....DDDDDD.....', '..QQQQDDDDQQQQ..', '.QqqqQDDDDQqqqQ.', 'QqqaqQDLLDQqaqqQ', 'Qq..qQDDDDQq..qQ', 'Qq..qQDDDDQq..qQ', 'QQ..QQDDDDQQ..QQ', 'pp...QDDDDQ...pp', 'pp...QDDDDQ...pp', '.....QQQQQQ.....', '.....Qq..qQ.....'], legs: [['.....QQ..QQ.....', '....QQq..qQQ....', '....QQ....QQ....', '...KKKK..KKKK...'], ['.....QQ..QQ.....', '.....QQ..QQ.....', '.....QQ..QQ.....', '....KKKK.KKKK...']], speed: [2.8, 4] },
    // (a COURIER on a hover bike: a visor, a light trail behind; fast)
    courier: { w: 20, rows: ['........hhhh........', '.......hHHHHh.......', '.......HvvvvH.......', '........HHHH........', '.......CCCCCC.......', '......CCLCCCCC......', '.....CCC.CCC.CC.....', '....CC...CCC...C....', '..DDDDDDDDDDDDDDDD..', '.DddddddddddddddddWW', 'RDDDDDDDDDDDDDDDDDD.', '..DD............DD..'], legs: [['...gggg......gggg...', '....gg........gg....'], ['..gggggg....gggggg..', '...g..g......g..g...']], hover: 3, speed: [16, 24], trail: true },
    // (a VENDOR: a robot pushing its cart, a pot on it steaming)
    vendor: { w: 22, rows: ['..........UUUUUUUUUUUU', '..MMMM...UuuuuuuuuuuuU', '.MvvvvM...s.........s.', '.MMMMMM...s.........s.', '..QQQQ....s..XxXX...s.', '.QqqqqQQQQXXXXXXXXXXXX', '.QqLLqQ...XxxxxxxxxxxX', '.QqqqqQ...XxxxxxxxxxxX', '.QQQQQQ...XXXXXXXXXXXX'], legs: [['..Q..Q.....K.......K..', '.KK..KK...KKK.....KKK.'], ['...QQ......K.......K..', '..KK.KK...KKK.....KKK.']], speed: [3, 4.5], steams: true },
    // (a stray CAT: a silhouette, its eyes shining; quick, and it sits a while)
    cat: { w: 11, rows: ['........K.K', '.K......KKK', 'K.......KeK', 'K......KKKK', '.KKKKKKKKK.', '..KKKKKKKK.'], legs: [['..K.K..K.K.'], ['...K.K.K.K.']], speed: [7, 11], sits: true },
  };
  // SCALE2X / SCALE3X (EPX): a grid made 2 or 3 times as fine, its diagonals smoothed, its colors kept
  function scale2(g) {
    const h = g.length; const w = g[0].length;
    const at = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? '.' : g[y][x]);
    const o = Array.from({ length: h * 2 }, () => new Array(w * 2));
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const p = at(x, y); const a = at(x, y - 1); const b = at(x + 1, y); const c = at(x - 1, y); const dd = at(x, y + 1);
      o[y * 2][x * 2] = c === a && c !== dd && a !== b ? a : p;
      o[y * 2][x * 2 + 1] = a === b && a !== c && b !== dd ? b : p;
      o[y * 2 + 1][x * 2] = dd === c && dd !== b && c !== a ? c : p;
      o[y * 2 + 1][x * 2 + 1] = b === dd && b !== a && dd !== c ? dd : p;
    }
    return o;
  }
  function scale3(g) {
    const h = g.length; const w = g[0].length;
    const at = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? '.' : g[y][x]);
    const o = Array.from({ length: h * 3 }, () => new Array(w * 3));
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const A0 = at(x - 1, y - 1); const B = at(x, y - 1); const C0 = at(x + 1, y - 1); const D = at(x - 1, y); const E = at(x, y); const F = at(x + 1, y); const G = at(x - 1, y + 1); const H = at(x, y + 1); const I = at(x + 1, y + 1);
      const p = [
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
      for (let k = 0; k < 9; k++) o[y * 3 + Math.floor(k / 3)][x * 3 + (k % 3)] = p[k];
    }
    return o;
  }
  const upscale = (g, q) => (q === 2 ? scale2(g) : q === 3 ? scale3(g) : q === 4 ? scale2(scale2(g)) : g);
  const EMIT = ['e', 'v', 'O', 'R', 'W', 'L', 'i'];
  const spriteCache = new Map();
  function sprite(e, frame, blink, q = Q) {
    const key = `${e.kind}|${frame}|${e.dir}|${e.eye}|${e.led}|${blink}|${q}|${e.palKey || ''}`;
    let c = spriteCache.get(key);
    if (c) return c;
    const f = e.f;
    const rows = [...f.rows, ...(f.legs[frame] || [])].map((r) => (e.dir > 0 ? r : [...r].reverse().join('')));
    const grid = upscale(rows.map((r) => [...r]), q);
    c = document.createElement('canvas');
    c.width = grid[0].length;
    c.height = grid.length;
    const g = c.getContext('2d');
    for (let y = 0; y < grid.length; y++) for (let x = 0; x < grid[0].length; x++) {
      const ch = grid[y][x];
      if (ch === '.') continue;
      let col = PAL[ch];
      if (e.pal && e.pal[ch]) col = e.pal[ch];
      else if (ch === 'V') col = 'rgba(220, 232, 255, 0.75)';
      else if (ch === 'Z') col = 'rgba(200, 220, 255, 0.16)';
      else if (ch === 'i') col = '#c8f4ff';
      else if (ch === 'e' || ch === 'v' || ch === 'O') col = e.eye;
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
    // (what glows on it glowing: eyes, visors, implants, LEDs, headlights; a soft halo, every lit pixel's
    // own small one adding up)
    const hr = Math.ceil(q / 2);
    for (let y = 0; y < grid.length; y++) for (let x = 0; x < grid[0].length; x++) if (EMIT.includes(grid[y][x])) { g.fillStyle = grid[y][x] === 'R' ? 'rgba(255, 42, 60, 0.05)' : grid[y][x] === 'W' ? 'rgba(255, 246, 200, 0.05)' : grid[y][x] === 'i' ? 'rgba(200, 244, 255, 0.07)' : glowCol(grid[y][x] === 'L' ? e.led : e.eye, 0.05); g.fillRect(x - hr, y - hr, hr * 2 + 1, hr * 2 + 1); }
    if (f.eyeRow !== undefined) { const ex = e.dir > 0 || f.w === 12 ? 3 * q : (f.w - 9) * q; A(g, ex, (f.eyeRow - 1) * q, 6 * q, 3 * q, e.eye, 0.22); } // (the eyes' glow in the hood)
    spriteCache.set(key, c);
    return c;
  }
  function spawnWalker(kind, side, at) {
    if (!world) return null;
    kind = kind && FIG[kind] ? kind : weighted(Math.random, people ? { ...VIEWS[view].crowd, ...PEOPLE_MIX } : VIEWS[view].crowd);
    const f = FIG[kind];
    const dir = side ? (side === 'left' ? 1 : -1) : (Math.random() < 0.5 ? 1 : -1);
    // (stopping a while at a window, a stall, the metro's doors, part way across: the nearest one ahead;
    // a cat anywhere, to sit)
    const ahead = world.stops.filter((s) => (dir > 0 ? s > cam + world.Wc * 0.15 : s < cam + world.Wc * 0.85) && s > cam && s < cam + world.Wc);
    const e = {
      kind, f, dir, t: 0,
      x: at !== undefined ? at : dir > 0 ? cam - u(f.w) - u(2) : cam + world.Wc + u(2), // (along the whole street, in cells)
      v: u(rand(f.speed[0], f.speed[1])),
      eye: kind === 'cat' ? pick(['#ffe14a', '#7dff8a']) : pick(['#05d9e8', '#ff2a6d', '#b14aed', '#fffb6b']),
      led: pick(['#05d9e8', '#ff2a6d', '#39ff88']),
      y: kind === 'drone' ? u(ri(Math.random, 50, 72)) : 0,
      stop: at !== undefined || f.fly ? null : f.sits && Math.random() < 0.7 ? cam + world.Wc * rand(0.15, 0.85) : ahead.length && Math.random() < 0.45 ? pick(ahead) : null,
      wait: 0,
      seen: new Set(), // (the bots that have noticed it already)
    };
    if (f.human) { // (a person: their own skin, hair, coat and trousers)
      const p = [Math.floor(Math.random() * SKIN.length), Math.floor(Math.random() * HAIR.length), Math.floor(Math.random() * COAT.length), Math.floor(Math.random() * PANTS.length)];
      e.pal = { f: SKIN[p[0]][0], F: SKIN[p[0]][1], y: HAIR[p[1]], j: COAT[p[2]][0], N: COAT[p[2]][1], n: PANTS[p[3]] };
      e.palKey = p.join('');
    }
    crowd.push(e);
    return e;
  }
  function crowdTick(dt, now) {
    if (!world) return;
    if (now > nextWalker && !shot) {
      nextWalker = now + rand(3500, 9000);
      if (crowd.length < VIEWS[view].most + (people ? 3 : 0)) spawnWalker();
    }
    for (const e of crowd) {
      e.t += dt;
      if (e.wait > 0) { e.wait -= dt; continue; }
      if (e.stop !== null && ((e.dir > 0 && e.x + u(e.f.w) / 2 >= e.stop) || (e.dir < 0 && e.x + u(e.f.w) / 2 <= e.stop))) { e.wait = e.f.sits ? rand(6, 16) : rand(4, 10); e.stop = null; continue; }
      e.x += e.dir * e.v * dt;
    }
    for (let i = crowd.length - 1; i >= 0; i--) {
      const e = crowd[i];
      if (e.x < cam - u(e.f.w) - u(60) || e.x > cam + world.Wc + u(60)) crowd.splice(i, 1);
    }
  }
  // (a figure in the light where it's walking: the street's light there washed over it, on a scratch
  // canvas so it falls on that figure alone; b: where along the street, in bot pixels, or -1 for none)
  const scratch = document.createElement('canvas');
  function lit(img, b) {
    const t = world.tint;
    const w = t && b >= 0 && b * 4 + 3 < t.length ? t[b * 4 + 3] : 0;
    if (w < 0.03) return img;
    if (scratch.width !== img.width || scratch.height !== img.height) { scratch.width = img.width; scratch.height = img.height; }
    const g = scratch.getContext('2d');
    g.globalCompositeOperation = 'source-over';
    g.clearRect(0, 0, img.width, img.height);
    g.drawImage(img, 0, 0);
    g.globalCompositeOperation = 'source-atop';
    g.fillStyle = `rgba(${Math.round(t[b * 4] / w)}, ${Math.round(t[b * 4 + 1] / w)}, ${Math.round(t[b * 4 + 2] / w)}, ${Math.min(0.34, w * 0.5).toFixed(2)})`;
    g.fillRect(0, 0, img.width, img.height);
    return scratch;
  }
  const frameOf = (e) => (e.wait <= 0 ? Math.floor(e.t * (e.kind === 'droid' || e.kind === 'cat' ? 8 : e.kind === 'mech' ? 2.5 : 4)) % 2 : 0);
  const bobOf = (e, q) => (e.f.hover ? Math.round(Math.sin(e.t * 3) * q) : e.f.fly ? Math.round(Math.sin(e.t * 5) * q) : e.kind === 'mech' && e.wait <= 0 ? Math.round(Math.abs(Math.sin(e.t * 8)) * q * 0.5) : 0);
  function drawCrowd(now) {
    const c = els.crowd;
    const g = c.getContext('2d');
    g.clearRect(0, 0, c.width, c.height);
    for (const e of crowd) {
      const f = e.f;
      const img = sprite(e, frameOf(e), Math.sin(now / 300 + e.x) > 0);
      const sx = Math.round(e.x - cam);
      const sy = c.height - img.height - u(f.hover || 0) - e.y + bobOf(e, Q);
      if (f.trail && e.wait <= 0) for (let k = 1; k <= 4; k++) A(g, e.dir > 0 ? sx - u(k * 4) : sx + img.width + u((k - 1) * 4), sy + img.height - u(5), u(4), Q, '#05d9e8', 0.25 / k); // (the courier's light trail)
      g.drawImage(lit(img, f.fly ? -1 : Math.floor((e.x + u(f.w) / 2) / Q)), sx, sy);
      if (e.kind === 'umbrella') A(g, sx + (e.dir > 0 ? u(3) : 0), c.height - img.height - e.y + u(4), u(17), u(6), '#05d9e8', 0.06); // (the light off its rim)
    }
  }

  // ── THE BOTS' AWARENESS: what's around them, noticed now and then (one bot at a time); a gloomy
  // street, gloomy faces (wanderers.js keeps them so: no smiles here) ──
  const PASSING = {
    hood: [['worried', '...'], ['skeptic', 'hm'], ['scared', '!?']],
    umbrella: [['skeptic', '...'], ['worried', 'hm'], ['idle', '...']],
    robot: [['skeptic', 'beep?'], ['surprised', '!'], ['annoyed', '...']],
    android: [['skeptic', 'hm'], ['worried', '...'], ['surprised', '!']],
    droid: [['surprised', '!'], ['scared', 'eep'], ['hit', '!?']],
    drone: [['skeptic', '?'], ['worried', '...'], ['surprised', '!']],
    cyborg: [['worried', '...'], ['scared', '!'], ['skeptic', 'hm']],
    mech: [['scared', '!!'], ['worried', '...'], ['surprised', '!?']],
    courier: [['surprised', '!'], ['hit', '!?'], ['annoyed', 'hey']],
    vendor: [['skeptic', 'hm'], ['tired', '...'], ['annoyed', '...']],
    cat: [['surprised', '?'], ['worried', '...'], ['smug', 'hm']],
    person: [['skeptic', '...'], ['worried', 'hm'], ['surprised', '!']],
    brolly: [['skeptic', '...'], ['tired', '...'], ['surprised', '?']],
    phone: [['skeptic', 'hm'], ['annoyed', '...'], ['worried', '?']],
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
      // a train going over (the viaduct's, right overhead, louder)
      if (deckTrain && Math.random() < 0.08) { notice(w, pick(['scared', 'surprised']), pick(['!!', 'whoa', '...']), 0, now); return; }
      if (train && Math.random() < 0.02) { const tx = (train.x - cam * speedOf.mid + train.len / 2) * C; if (tx > 0 && tx < W) { notice(w, 'surprised', pick(['whoa', '...', '!']), tx > mid ? 1 : -1, now); return; } }
      const at = cam + mid / C; // (where it stands along the street, in cells)
      // a sign over it sputtering out
      const sput = world.signs.find((s) => s.layer === 'front-fx' && s.out && now - s.out < 600 && at > s.x - u(10) && at < s.x + s.w + u(10));
      if (sput && Math.random() < 0.5) { sput.out = 0; notice(w, 'skeptic', pick(['eh?', 'hm', '...']), 0, now); return; }
      // steam out of a grate under it
      const vent = world.grates.find((gr) => (gr.near || gr.alley) && Math.abs(gr.x - at) < u(5));
      if (vent && !lowFx() && Math.random() < 0.08) { notice(w, pick(['hit', 'annoyed']), pick(['hot!', 'pff', 'ack']), 0, now); return; }
      // a barrel fire by it: warm
      const fireBy = world.fires.find((fx) => Math.abs(fx - at) < u(14));
      if (fireBy !== undefined && w.state === 'idle' && Math.random() < 0.1) { notice(w, 'tired', pick(['warm', '...', 'hm']), fireBy > at ? 1 : -1, now); return; }
      // a lit shop window behind it, stopped at a moment
      const lit = world.spills.find((s) => s.shop && at > s.x && at < s.x + s.w);
      if (lit && w.state === 'idle' && Math.random() < 0.04) { notice(w, pick(['skeptic', 'tired']), pick(['want', 'hm', '...']), 0, now); return; }
    }
  }

  // ── THE STEAM (the grates, the alleys, a stall's pot, a vendor's cart), embers off the fires, THE
  // TRAINS and THE TRAFFIC ──
  function steamTick(dt) {
    if (!world || lowFx()) { steam.length = 0; return; }
    for (const gr of world.grates) {
      const sx = gr.x - cam;
      if (sx < -u(10) || sx > world.Wc + u(10)) continue;
      if (Math.random() < dt * (gr.pot ? 3 : gr.alley ? 1.4 : 2)) steam.push({ x: gr.x + rand(-1.5, 1.5) * Q, y: u(3) + (gr.y || 0), vx: rand(-0.6, 0.6) * Q, vy: rand(2.2, 4) * Q, life: rand(2.5, 4.5), t: 0 });
    }
    for (const fx of world.fires) { // (embers rising off a fire)
      if (fx - cam < -u(10) || fx - cam > world.Wc + u(10)) continue;
      if (Math.random() < dt * 4) steam.push({ x: fx + rand(-2, 2) * Q, y: u(21), vx: rand(-1, 1) * Q, vy: rand(4, 8) * Q, life: rand(1, 2.2), t: 0, ember: true }); // (the flames' tips: the front stands 4 up)
    }
    for (const e of crowd) if (e.f.steams && Math.random() < dt * 2.5) steam.push({ x: e.x + (e.dir > 0 ? u(14) : u(6)), y: u(12), vx: rand(-0.6, 0.6) * Q, vy: rand(2, 3.5) * Q, life: rand(1.5, 3), t: 0 });
    for (const p of steam) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx += rand(-0.5, 0.5) * Q * dt; }
    for (let i = steam.length - 1; i >= 0; i--) if (steam[i].t > steam[i].life) steam.splice(i, 1);
    const c = els.steam;
    const g = c.getContext('2d');
    g.clearRect(0, 0, c.width, c.height);
    for (const p of steam) {
      if (p.ember) { const a = 1 - p.t / p.life; R(g, Math.round(p.x - cam), c.height - Math.round(p.y), Math.max(1, Q - 1), Math.max(1, Q - 1), a > 0.5 ? '#ffd27a' : '#ff6a1c'); continue; }
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
    const ty = u(world.rail.y) - u(6); // (on top of the beam)
    R(g, sx, ty, train.len, u(6), '#2a2f44');
    R(g, sx, ty, train.len, Q, '#4a5070');
    for (let wx = sx + u(3); wx < sx + train.len - u(3); wx += u(4)) { if ((wx - sx) % u(26) < u(2)) { R(g, wx, ty + Q, 1, u(5), '#1a1e2e'); continue; } A(g, wx, ty + u(2), u(3), u(2), '#ffe6a0', 0.8); }
    A(g, sx, ty + u(5), train.len, Q, '#05d9e8', 0.6); // (its lit underside)
    const nose = train.dir > 0 ? sx + train.len : sx - u(2);
    R(g, nose, ty + u(2), u(2), u(3), '#fff6c8');
    if ((train.dir > 0 && sx > world.Wc + u(20)) || (train.dir < 0 && sx + train.len < -u(20))) train = null;
  }
  // (UNDER THE TRACKS: the train on the viaduct, right over the street, big and fast, sparks off its
  // pantographs; and water dripping off the deck's edge)
  function deckTick(dt, now) {
    const c = els.deck;
    const g = c.getContext('2d');
    g.clearRect(0, 0, c.width, c.height);
    if (!world || !world.deck) return;
    if (!deckTrain && now > nextDeckTrain && !shot) {
      nextDeckTrain = now + rand(25000, 60000);
      const dir = Math.random() < 0.5 ? 1 : -1;
      const len = u(ri(Math.random, 150, 220));
      deckTrain = { dir, len, x: dir > 0 ? -len - u(10) : world.Wc + u(10), v: u(rand(55, 75)) };
      api.botEvent('scene-cyber-train-over');
    }
    const top = u(world.deck.top);
    if (deckTrain) {
      deckTrain.x += deckTrain.dir * deckTrain.v * dt;
      const sx = Math.round(deckTrain.x);
      const h = u(11);
      const y = top - h;
      R(g, sx, y, deckTrain.len, h, '#2e3448');
      R(g, sx, y, deckTrain.len, Q, '#5a6488');
      R(g, sx, y + h - u(2), deckTrain.len, u(2), '#1a1e2c');
      A(g, sx, y + u(7), deckTrain.len, Q, '#ff2a6d', 0.7); // (its stripe)
      for (let wx = sx + u(4); wx < sx + deckTrain.len - u(5); wx += u(6)) {
        if ((wx - sx) % u(36) < u(3)) { R(g, wx, y + Q, 1, h - u(3), '#141824'); continue; }
        A(g, wx, y + u(2), u(4), u(4), '#ffe6a0', 0.85);
        if (((wx - sx) / u(6)) % 3 === 1) R(g, wx + Q, y + u(3), u(2), u(3), '#1a1410'); // (someone at the window)
      }
      for (let px = sx + u(20); px < sx + deckTrain.len; px += u(40)) { R(g, px, y - u(3), u(6), Q, '#3a3f4e'); R(g, px + u(2), y - u(5), Q, u(2), '#3a3f4e'); if (!lowFx() && Math.random() < 0.15) { A(g, px + u(1), y - u(9), u(4), u(4), '#cfe8ff', 0.8); R(g, px + u(2), y - u(8), Q, Q, '#ffffff'); } }
      const nose = deckTrain.dir > 0 ? sx + deckTrain.len : sx - u(3);
      R(g, nose, y + u(3), u(3), u(4), '#fff6c8');
      A(g, deckTrain.dir > 0 ? nose + u(3) : nose - u(14), y + u(3), u(14), u(4), '#fff6c8', 0.2);
      if ((deckTrain.dir > 0 && sx > world.Wc + u(20)) || (deckTrain.dir < 0 && sx + deckTrain.len < -u(20))) deckTrain = null;
    }
    if (!lowFx()) { // (drips off the deck)
      if (Math.random() < dt * 3) drips.push({ x: Math.floor(rand(0, world.Wc)), y: u(world.deck.bot), v: 0 });
      for (const dd of drips) { dd.v += u(60) * dt; dd.y += dd.v * dt; A(g, dd.x, Math.round(dd.y), 1, u(2), '#bcd4ff', 0.5); }
      for (let i = drips.length - 1; i >= 0; i--) if (drips[i].y > c.height) drips.splice(i, 1);
    }
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
  // (a layer's part drawn again at the close-up's resolution (the street's Q swapped for it while it
  // draws): hB its height and b0 its left, in bot pixels, bw how wide)
  function region(hB, b0, bw, draw) {
    const c = document.createElement('canvas');
    c.width = Math.ceil(bw * Q) + 2;
    c.height = hB * Q;
    const g = c.getContext('2d');
    g.translate(-Math.round(b0 * Q), 0);
    draw(g, c.height, b0, b0 + bw);
    return c;
  }
  // (what's lit on a layer, lit: its signs on, its boards playing, its red lights)
  function litUp(c, b0, layer, now) {
    const g = c.getContext('2d');
    g.save();
    g.translate(-Math.round(b0 * Q), 0);
    for (const s of out.signs) if (s.layer === layer) { s.on = true; paintSign(g, s, now); }
    for (const b of out.boards) if (b.layer === layer) paintBoard(g, b, now);
    for (const L of out.lights) if (L.layer === layer) { A(g, L.x - Q, L.y - Q, u(3), u(3), '#ff283c', 0.35); R(g, L.x, L.y, Math.max(1, Q - 1), Math.max(1, Q - 1), '#ff3a4a'); }
    g.restore();
  }
  const FALLS = { rain: 'rain', drizzle: 'rain', storm: 'rain', sleet: 'rain', heatlightning: null, snow: 'snow', flurries: 'snow' };
  function closeUp(target) {
    if (shot || !world) return false;
    const W = api.laneW();
    const ws = (api.walkers ? api.walkers() : []).filter((w) => w.el && !w.leaving && w.x > -8 && w.x < W - 26);
    if (!ws.length) return false;
    const w = target || pick(ws);
    // (a look that suits the moment, now and then; its art read as it is)
    if (api.say && Math.random() < 0.5) api.say(w, pick(['skeptic', 'worried', 'idle', 'annoyed']), '');
    const grid = botArt(w);
    if (!grid) return false;
    pan = null; // (the view holds still for it)
    const now = performance.now();
    const game = api.game();
    const H = api.laneH();
    const under = parseFloat(getComputedStyle(api.lane).getPropertyValue('--floor-under')) || 0;
    const fh = game ? Math.max(H, Math.round(world.hTb * P)) + Math.ceil(under) : Math.round(H * 0.42);
    // (the light: the nearest sign's, on its side)
    const atC = cam + (w.x + 17) / C;
    const lamp = world.signs.filter((s) => s.layer === 'front-fx' && s.kind !== 'lantern').sort((a, b) => Math.abs(a.x + a.w / 2 - atC) - Math.abs(b.x + b.w / 2 - atC))[0];
    const light = lamp ? lamp.col : pick(NEON);
    const side = lamp && lamp.x + lamp.w / 2 < atC ? -1 : 1;
    const bot = litBot(grid, light, side);
    const pb = (fh * 0.44) / 17; // (a bot pixel in the close-up, in the page's pixels: the bot under half of it tall, the spot round it plain)
    const pc = pb / QC;
    const cw = Math.ceil(W / pc);
    const ch = Math.ceil(fh / pc);
    const LB = Math.round(ch * 0.8); // (the lane's floor: where it stands)
    const bx = Math.round(cw * (side > 0 ? 0.3 : 0.7) - bot.w / 2); // (on a third, looking into the frame, the light ahead of it)
    const by = LB - bot.h;
    // (the street right there, drawn again: each layer from where it shows behind the bot, at its
    // parallax, four times finer)
    const Cm = C;
    const Qm = Q;
    const saved = out;
    Q = QC;
    C = P / QC;
    out = { signs: [], lights: [], boards: [], grates: [], spills: [], stops: [], fires: [], glows: [] };
    const fb = cw / QC + 2;
    const leftAt = (f) => (cam * f * Cm + w.x) / P - bx / QC; // (a layer's left edge in the frame, in its bot pixels)
    const tB = leftAt(speedOf.towers);
    const mB = leftAt(speedOf.mid);
    const sB = leftAt(1);
    // (each lit as the street is, its signs on)
    const towers = region(world.hTb, tB, fb, drawTowers);
    lightLayer(towers, lightsOf('towers-fx'), Math.round(tB * QC));
    litUp(towers, tB, 'towers-fx', now);
    const midC = region(world.hMb, mB, fb, drawMid);
    lightLayer(midC, lightsOf('mid-fx'), Math.round(mB * QC));
    litUp(midC, mB, 'mid-fx', now);
    const front = region(world.hFb, sB, fb, drawFront);
    lightLayer(front, lightsOf('front-fx'), Math.round(sB * QC));
    litUp(front, sB, 'front-fx', now);
    const underB = world.underB || 0;
    const ground = region(5 + underB, sB, fb, (g, hh, b0, b1) => drawGround(g, hh, b0, b1, [front]));
    const near = region(7, sB, fb, drawNear);
    const ng = near.getContext('2d'); // (nothing in front of the bot itself)
    ng.setTransform(1, 0, 0, 1, 0, 0);
    ng.clearRect(bx - u(3), 0, bot.w + u(6), near.height);
    const reflect = out.signs.filter((s) => s.layer === 'front-fx' && ['text', 'tube', 'cross', 'glyphs'].includes(s.kind)).map((s) => ({ x: s.x - Math.round(sB * QC), w: s.w, col: s.col }));
    const spills = out.spills.map((s) => ({ x: s.x - Math.round(sB * QC), w: s.w, col: s.col }));
    out = saved;
    Q = Qm;
    C = Cm;
    // its backdrop, put together once: the sky, the towers and the city (darker: far), the street's front,
    // the sidewalk, then the curb and the road in front, the signs' colors in its wet
    const bg = document.createElement('canvas');
    bg.width = cw; bg.height = ch;
    const g = bg.getContext('2d');
    for (let y = 0; y < ch; y++) { const k = y / ch; R(g, 0, y, cw, 1, `rgb(${Math.round(10 + 22 * k)}, ${Math.round(8 + 6 * k)}, ${Math.round(26 + 30 * k)})`); }
    g.drawImage(towers, 0, LB - towers.height);
    A(g, 0, 0, cw, LB, '#05040c', 0.35);
    g.drawImage(midC, 0, LB - midC.height);
    A(g, 0, 0, cw, LB, '#05040c', 0.25);
    g.drawImage(front, 0, LB - 4 * QC - front.height);
    const gTop = LB - 5 * QC;
    g.drawImage(ground, 0, gTop);
    const curb = gTop + ground.height;
    R(g, 0, curb, cw, 3, '#3a3550'); R(g, 0, curb, cw, 1, '#5a5478'); R(g, 0, curb + 3, cw, 2, '#0a0910');
    R(g, 0, curb + 5, cw, ch - curb - 5, '#0b0a13');
    // (the street mirrored in the road: its front upside down from the curb, squeezed, rippling, fading)
    const rRows = ch - curb - 5;
    const st = (world.GFb * QC * 1.1) / Math.max(1, rRows);
    for (let y = 0; y < rRows; y++) {
      const sy = front.height - 1 - Math.floor(y * st);
      if (sy < 0) break;
      g.globalAlpha = 0.45 * (1 - y / rRows);
      g.drawImage(front, 0, sy, front.width, 1, Math.round(Math.sin(y * 0.8) * 2), curb + 5 + y, front.width, 1);
    }
    g.globalAlpha = 1;
    const d = rng(Math.floor(now));
    for (const s of [...spills, ...reflect]) for (let x = Math.max(0, s.x); x < Math.min(cw, s.x + s.w); x++) { // (the light in the road's wet: long streaks, rippling)
      if (d() > 0.35) continue;
      const len = Math.floor((ch - curb - 5) * (0.4 + d() * 0.6));
      for (let y = 0; y < len; y++) A(g, x + Math.round(Math.sin((curb + y) * 0.5) * 1.5), curb + 5 + y, 1, 1, s.col, 0.3 * (1 - y / len));
    }
    for (let y = curb + 6; y < ch; y += 4) A(g, 0, y, cw, 1, '#ffffff', 0.02);
    // (a vignette, stepped: the edges in the dark)
    const vig = document.createElement('canvas');
    vig.width = cw; vig.height = ch;
    const vg = vig.getContext('2d');
    for (let y = 0; y < ch; y += 2) for (let x = 0; x < cw; x += 2) { const dx = (x - cw / 2) / (cw / 2); const dy = (y - ch * 0.55) / (ch * 0.6); const k = Math.min(3, Math.floor(Math.max(0, Math.sqrt(dx * dx + dy * dy) - 0.55) * 6)); if (k) A(vg, x, y, 2, 2, '#020108', k * 0.14); }
    // (no one about there? someone comes past: from the side away from the light, behind it)
    const XL = w.x - (bx * P) / QC;
    const XR = XL + (cw * P) / QC;
    if (!crowd.some((e) => { const X = (e.x - cam) * Cm; return X > XL - 20 && X < XR + 20 && !e.f.fly; })) {
      const dir = Math.random() < 0.5 ? 1 : -1;
      const kind = weighted(Math.random, Object.fromEntries(Object.entries(VIEWS[view].crowd).filter(([k]) => !FIG[k].fly)));
      const e = spawnWalker(kind, dir > 0 ? 'left' : 'right', cam + (w.x + 17 - dir * 16 * P) / Cm - u(FIG[kind].w) / 2);
      if (e) e.stop = null;
    }
    const c = els.shot;
    if (c.width !== cw || c.height !== ch) { c.width = cw; c.height = ch; }
    Object.assign(c.style, { width: `${W}px`, height: `${fh}px`, bottom: game ? `${-Math.ceil(under)}px` : '0px', top: 'auto', transition: 'none', opacity: '1' });
    const wk = api.weather ? api.weather() : null;
    const falls = lowFx() ? null : FALLS[wk] || null;
    const bits = falls ? Array.from({ length: Math.round((cw * ch) / (falls === 'snow' ? 500 : 900)) }, () => ({ x: rand(0, cw), y: rand(0, ch), v: falls === 'snow' ? rand(12, 24) : rand(70, 110), l: ri(Math.random, 4, 9), ph: rand(0, 6) })) : [];
    shot = { t0: now, dur: 6200, bg, vig, near, bot, bx, by, LB, cw, ch, w, wx: w.x, Cm, bits, falls, storm: wk === 'storm' || wk === 'heatlightning', flash: 0 };
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
    // (whoever's walking by there, walking by: where they are on the street, four times finer)
    for (const e of crowd) {
      const X = (e.x - cam) * s.Cm;
      const col = Math.round(s.bx + ((X - s.wx) / P) * QC);
      if (col < -e.f.w * QC || col > s.cw) continue;
      const img = sprite(e, frameOf(e), Math.sin(now / 300 + e.x) > 0, QC);
      const y = s.LB - 3 * QC - img.height - (e.f.hover || 0) * QC - Math.round(((e.y * s.Cm) / P) * QC) + bobOf(e, QC); // (a drone's height: the street's cells to the close-up's)
      g.drawImage(img, col, y);
    }
    const bob = calm ? 0 : Math.round(Math.sin(t * Math.PI * 3)); // (breathing)
    g.globalAlpha = 0.28; // (its reflection in the wet, broken)
    for (let row = 0; row < Math.min(s.bot.h, s.ch - s.LB); row++) {
      const wob = Math.round(Math.sin(row * 0.9 + now / 160) * 1.2);
      g.drawImage(s.bot.img, 0, s.bot.h - 1 - row, s.bot.w, 1, s.bx + wob, s.LB + row + bob, s.bot.w, 1);
    }
    g.globalAlpha = 1;
    g.drawImage(s.bot.glow, s.bx, s.by + bob);
    g.drawImage(s.bot.img, s.bx, s.by + bob);
    g.drawImage(s.near, 0, s.LB + Math.round((s.ch - s.LB) * 0.45) - s.near.height); // (what's in front, at the curb)
    g.restore();
    g.drawImage(s.vig, 0, 0);
    if (s.falls === 'rain') { // (rain streaking past, in front)
      g.fillStyle = 'rgba(190, 210, 255, 0.35)';
      for (const dd of s.bits) { dd.y += dd.v * dt; dd.x -= dd.v * dt * 0.15; if (dd.y > s.ch) { dd.y = -dd.l; dd.x = rand(0, s.cw + 20); } for (let i = 0; i < dd.l; i++) g.fillRect(Math.round(dd.x - i * 0.15), Math.round(dd.y - i), 1, 1); }
    } else if (s.falls === 'snow') { // (snow drifting down)
      g.fillStyle = 'rgba(240, 244, 255, 0.8)';
      for (const dd of s.bits) { dd.y += dd.v * dt; dd.x += Math.sin(now / 700 + dd.ph) * 6 * dt; if (dd.y > s.ch) { dd.y = -2; dd.x = rand(0, s.cw); } g.fillRect(Math.round(dd.x), Math.round(dd.y), 2, 2); }
    }
    if (s.storm && !calm && Math.random() < 0.006) s.flash = now + 90; // (lightning, now and then)
    if (s.flash > now) { g.fillStyle = 'rgba(220, 230, 255, 0.25)'; g.fillRect(0, 0, s.cw, s.ch); }
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
    if (!world || shot) return false;
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
    const dd = cam - was;
    if (dd) {
      api.shift(-dd * C); // (the bots on the street, carried with it)
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
      deckTick(ddt, now);
      trafficTick(ddt, now);
    }
    if (now - lastAware > 400) { lastAware = now; awareTick(now); }
    if (now - lastMoon > 1000) { lastMoon = now; moonTick(now); }
    shotTick(now, dt);
  }

  return {
    els,
    view: () => view,
    draw: (full, seed) => { if (full || !world || world.Wc !== Math.ceil(api.laneW() / C) || Q !== (window.CYBER_RES || autoRes())) build(seed); },
    frame,
    // (the sandbox's buttons: a pan, someone on the street, the train, a close-up, the RES, the street)
    cmd(c) {
      if (c === 'pan-left') return startPan(-1);
      if (c === 'pan-right') return startPan(1);
      if (c === 'train') { nextTrain = 0; train = null; nextDeckTrain = 0; deckTrain = null; return true; }
      if (c === 'closeup') return closeUp();
      if (c.startsWith('res-')) { window.CYBER_RES = c === 'res-auto' ? 0 : Number(c.slice(4)); if (world) build(world.seed); return true; }
      if (c.startsWith('view-')) { const v = c.slice(5); if (!VIEWS[v]) return false; view = v; shot = null; els.shot.style.opacity = '0'; if (world) build(world.seed); return true; }
      if (c === 'people-on' || c === 'people-off') { people = c === 'people-on'; if (!people) for (let i = crowd.length - 1; i >= 0; i--) if (crowd[i].f.human) crowd.splice(i, 1); return true; } // (THE PEOPLE: not ByteFall's, the sandbox's to see)
      if (c.startsWith('spawn-')) { spawnWalker(c.slice(6)); return true; }
      return false;
    },
  };
}
