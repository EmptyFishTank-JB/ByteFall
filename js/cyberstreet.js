// THE CYBERPUNK STREET (scenes.js's CYBER; the bot sandbox's for now, not in the game's own picks yet):
// a long street at night that the wanderers walk along, seen close up (the shop fronts tall over the
// bots, their details plain), far longer than the card, the view panning slowly along it now and then
// to show more of it. Always night: neon and rain weather. Far off and nearer, the city shows through
// every opening: over the low roofs, down the alleys, through the big windows.
//   THE TOWERS   megatowers far off, black against the haze, a few windows lit, red lights blinking on
//                their masts (the slowest to pan: far away)
//   THE CITY     nearer blocks, window grids, small neon signs, HOLO BILLBOARDS playing (BYTEFALL, a
//                bit, an eye, a beat, scrolling words), an elevated line on its pillars with a train
//                along it now and then
//   THE STREET   its own fronts behind the sidewalk, lot by lot: a SHOP lit inside (its window's panes,
//                posters, a glass door, OPEN in the window), a SHUTTERED shop (lanterns along its
//                awning, a neon sign of glyphs, a ladder of neon rungs up the wall), the METRO (its big
//                sign, the clock, doors of lit mesh), a KIOSK wall (a terminal's screen, a ticket booth,
//                a neon tube, pipes), a wall with a big WINDOW the city shows through, a FOOD STALL
//                (steam off the pot, a string of bulbs), LOW roofs (tanks, dishes, a rooftop sign) and
//                ALLEYS (the city down them, a dumpster, a hanging sign). Above the shops: floors of
//                windows, blinds, balconies, vents, fire escapes, AC units, neon banners, cables and
//                lanterns strung across. A few signs are faulty and flicker
//   THE SIDEWALK wet: the shops' light and the signs' colors spilled in it, puddles; in front,
//                bollards, grates (steam rising), bags, a cone
//   THE CROWD    the street's own people, behind the bots (darker, their eyes and lights glowing: the
//                four CPUs stay the ones you see): HOODED figures, one under a neon UMBRELLA, chrome
//                ROBOTS, tall ANDROIDS (an LED strip down the coat), hovering DROIDS, DRONES flying
//                over with parcels. They come in, cross, stop at a window a while, and go
//   THE TRAFFIC  flying cars crossing between the towers, headlights and tail lights
// THE PAN: every minute or two the view drifts along the street (left or right, as far as it goes),
// slowly; everything on the street pans with it, the bots too (one carried off the card walks off it),
// the far layers less (parallax). The sandbox's PAN buttons start one.
// Static layers are drawn once (the whole street, wider than the card) and slid; only what changes is
// redrawn (a sign flickering, a screen, a billboard's frame, the blinking lights); the crowd, the steam,
// the train and the traffic on card-wide canvases, at about 30 frames a second. REDUCED EFFECTS: no
// flicker, no steam.
function createCyberStreet(api) {
  const P = api.P; // (the bots' own pixel)
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (list) => list[Math.floor(Math.random() * list.length)];
  const rng = (seed) => { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  const rp = (r, list) => list[Math.floor(r() * list.length)];
  const ri = (r, a, b) => a + Math.floor(r() * (b - a + 1));
  const NEON = ['#ff2a6d', '#05d9e8', '#ff9f1c', '#b14aed', '#39ff88', '#fffb6b', '#ff5ec4'];
  const lowFx = () => document.documentElement.classList.contains('low-fx') || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);

  // ── The layers: [name, how fast it pans (1: the street), z-index, card-wide (redrawn) or the whole street] ──
  const LAYERS = [
    ['towers', 0.18, -5], ['towers-fx', 0.18, -5], ['traffic', 0, -4, true], ['mid', 0.5, -3], ['mid-fx', 0.5, -3], ['rail', 0, -3, true],
    ['front', 1, -2], ['front-fx', 1, -2], ['ground', 1, -1], ['crowd', 0, 0, true], ['steam', 0, 4, true], ['near', 1, 5],
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
  let lastFx = 0;
  let lastDyn = 0;
  let lastNow = 0;

  // ── A 3x5 font for the signs (drawn bigger, k cells a pixel, for the big ones) ──
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
  function text(g, s, x, y, col, k = 1) {
    g.fillStyle = col;
    for (let i = 0; i < s.length; i++) {
      const rows = (FONT[s[i]] || FONT[' ']).split(',');
      for (let ry = 0; ry < 5; ry++) for (let rx = 0; rx < 3; rx++) if (rows[ry][rx] === '#') g.fillRect(x + (i * 4 + rx) * k, y + ry * k, k, k);
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

  function size(c, cw, ch, k = P) {
    if (c.width !== cw || c.height !== ch) { c.width = cw; c.height = ch; }
    c.style.width = `${cw * k}px`;
    c.style.height = `${ch * k}px`;
    const g = c.getContext('2d');
    g.clearRect(0, 0, cw, ch);
    return g;
  }

  // ── THE STREET, laid out and drawn (again on a resize) ──
  function build(seed) {
    const W = api.laneW();
    const H = api.laneH();
    if (!W || !H) return;
    const Wc = Math.ceil(W / P);
    const game = api.game();
    const WW = Math.max(Wc * 4, 720);
    const hF = Math.max(56, Math.round((game ? H * 0.92 : Math.min(H * 0.42, 380)) / P));
    const hM = Math.max(hF + 12, Math.round((game ? H : Math.min(H * 0.52, 460)) / P));
    const hT = Math.max(hM + 10, Math.round((game ? H * 1.05 : Math.min(H * 0.6, 520)) / P));
    const GF = Math.max(30, Math.min(46, Math.round(hF * 0.36))); // (the shops' height: about twice a bot's)
    world = { Wc, WW, hT, hM, hF, GF, seed, signs: [], boards: [], lights: [], grates: [], spills: [], stops: [], rail: null };
    cam = Math.max(0, Math.min(WW - Wc, cam || (WW - Wc) * rand(0.2, 0.8)));
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
    drawGround(size(els.ground, WW + 2, 5 + under), WW + 2, 5 + under, rng(seed + 3));
    drawNear(size(els.near, WW + 2, 7), WW + 2, 7, rng(seed + 4));
    // (the card-wide ones: the crowd at the sidewalk's back, the steam, the train, the traffic in the sky)
    size(els.crowd, Wc + 2, 96);
    els.crowd.style.bottom = `${3 * P}px`;
    size(els.steam, Wc + 1, 48);
    size(els.rail, Wc + 1, hM);
    size(els.traffic, Wc + 1, hT);
    for (const s of world.signs) s.on = true;
    paintFx(performance.now(), true);
    place();
  }

  // THE TOWERS: tall, black against the haze, a few windows, a light strip, masts with red lights
  function drawTowers(g, cw, ch, r) {
    let x = Math.floor(r() * 6);
    while (x < cw) {
      const w = 16 + Math.floor(r() * 26);
      const h = Math.floor(ch * (0.5 + r() * 0.5));
      const top = ch - h;
      R(g, x, top, w, h, rp(r, ['#0c0a1a', '#100d22', '#0e0c1e']));
      if (r() < 0.5) { g.fillRect(x + 2, top - 4, w - 4, 4); g.fillRect(x + 5, top - 8, w - 10, 4); } // (a stepped crown)
      if (r() < 0.5) A(g, x + Math.floor(w / 2), top + 2, 1, h - 2, rp(r, ['#05d9e8', '#ff2a6d', '#b14aed']), 0.35); // (a light strip up its face)
      for (let wy = top + 3; wy < ch - 2; wy += 3) for (let wx = x + 2; wx < x + w - 2; wx += 3) {
        if (r() < 0.07) { g.globalAlpha = 0.55; R(g, wx, wy, 1, 1, rp(r, ['#ffcf6b', '#6fe3ff', '#ff8fb8', '#d9d4ff'])); g.globalAlpha = 1; }
      }
      const mx = x + Math.floor(w / 2);
      const mh = 4 + Math.floor(r() * 12);
      R(g, mx, top - mh - 8, 1, mh + 8, '#16132a');
      world.lights.push({ x: mx, y: Math.max(0, top - mh - 8), ph: r() * 6.28, layer: 'towers-fx' });
      x += w + Math.floor(r() * 4);
    }
  }

  // THE CITY: nearer blocks (what shows over the low roofs, down the alleys, through the windows),
  // window grids, small signs, the HOLO BILLBOARDS, the elevated line on its pillars
  function drawMid(g, cw, ch, r) {
    let x = Math.floor(r() * 4);
    while (x < cw) {
      const w = 16 + Math.floor(r() * 22);
      const h = Math.floor(ch * (0.4 + r() * 0.6));
      const top = ch - h;
      R(g, x, top, w, h, rp(r, ['#1a1631', '#1e1a38', '#171a30', '#22183a', '#16202e']));
      R(g, x, top, w, 1, '#2a2448'); // (its roofline catching the glow)
      R(g, x + w - 1, top, 1, h, '#120f24'); // (its shadowed side)
      const lit = rp(r, ['#ffcf6b', '#7fd8ff', '#ff9fd0', '#c8b8ff']);
      for (let wy = top + 3; wy < ch - 1; wy += 4) for (let wx = x + 2; wx < x + w - 3; wx += 4) {
        const on = r() < 0.34;
        g.globalAlpha = on ? 0.45 + r() * 0.45 : 1;
        R(g, wx, wy, 2, 2, on ? lit : '#120f22');
        g.globalAlpha = 1;
      }
      if (r() < 0.35) { // (a small neon word on its side)
        const word = rp(r, ['BAR', 'HOTEL', '24H', 'NODE', 'VR', 'OPEN', 'CAFE']);
        const sx = x + ri(r, 1, Math.max(1, w - textW(word) - 1));
        const sy = top + ri(r, 4, Math.max(5, Math.floor(h * 0.6)));
        R(g, sx - 1, sy - 1, textW(word) + 2, 7, '#07060d');
        text(g, word, sx, sy, rp(r, NEON));
      }
      if (w >= 26 && h > 26 && r() < 0.55) { // (a holo billboard on its face)
        const bw = Math.min(w - 4, 30 + Math.floor(r() * 6));
        const bh = 13 + Math.floor(r() * 4);
        const bx = x + Math.floor((w - bw) / 2);
        const by = top + 4 + Math.floor(r() * Math.max(1, h * 0.35 - bh));
        R(g, bx - 1, by - 1, bw + 2, bh + 2, '#05040c');
        world.boards.push({ x: bx, y: by, w: bw, h: bh, mode: rp(r, ['logo', 'bit', 'eye', 'beat', 'words']), col: rp(r, ['#05d9e8', '#ff2a6d', '#b14aed', '#39ff88']), t: r() * 10, glitch: 0 });
      }
      if (r() < 0.45) world.lights.push({ x: x + 2 + Math.floor(r() * (w - 4)), y: top - 1, ph: r() * 6.28, layer: 'mid-fx' });
      x += w + Math.floor(r() * 3);
    }
    // the elevated line: its beam across, pillars down, a lit rail under it (the train runs on it: 'rail')
    const ty = ch - Math.round(ch * 0.46);
    R(g, 0, ty, cw, 3, '#24223a');
    R(g, 0, ty + 3, cw, 1, '#3d2a52');
    A(g, 0, ty + 4, cw, 1, '#ff5ec4', 0.35);
    for (let px = Math.floor(r() * 30); px < cw; px += 34 + Math.floor(r() * 12)) { R(g, px, ty + 4, 3, ch - ty - 4, '#1b1930'); R(g, px - 1, ty + 4, 5, 2, '#24223a'); }
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
  const sign = (o) => { world.signs.push({ on: true, next: 0, faulty: false, ...o }); return o; };
  // (a building's shell: its wall, the ledge at each floor, a lit ledge over the shops)
  function shell(g, x, w, top, ch, r) {
    const wall = rp(r, ['#1b1a2e', '#221d33', '#1a2433', '#2a1f2f', '#1e2a2a', '#262033', '#24282e']);
    R(g, x, top, w, ch - top, wall);
    R(g, x, top, w, 1, '#3a3456');
    R(g, x, top + 1, w, 1, '#14121f');
    R(g, x, top, 1, ch - top, '#14121f');
    return wall;
  }
  // THE FLOORS ABOVE THE SHOPS: one style a building (windows, slatted blinds, balconies, an industrial
  // face of vents and pipes), AC units, a fire escape now and then, a neon banner hanging off it
  function upper(g, x, w, top, yb, r) {
    const style = rp(r, ['grid', 'grid', 'slats', 'balcony', 'panel']);
    const lit = rp(r, ['#ffcf6b', '#7fd8ff', '#ff9fd0', '#c8b8ff', '#b8e07a']);
    for (let fy = yb - 12; fy > top + 3; fy -= 12) {
      R(g, x, fy + 11, w, 1, '#14121f'); // (the floor's ledge)
      if (style === 'grid') {
        for (let wx = x + 3; wx + 5 <= x + w - 2; wx += 8) {
          const on = r() < 0.42;
          R(g, wx - 1, fy + 2, 7, 8, '#121019');
          g.globalAlpha = on ? 0.5 + r() * 0.4 : 1;
          R(g, wx, fy + 3, 5, 6, on ? lit : '#0d0b16');
          g.globalAlpha = 1;
          R(g, wx + 2, fy + 3, 1, 6, '#121019');
          if (on && r() < 0.25) R(g, wx + 3, fy + 5, 2, 4, '#0d0b16'); // (someone at the window)
          if (r() < 0.14) { R(g, wx, fy + 10, 5, 3, '#4a4e5c'); R(g, wx + 1, fy + 11, 3, 1, '#2c2f3a'); } // (an AC unit)
        }
      } else if (style === 'slats') { // (a wide window, its blinds lit from inside)
        const sw = w - 6;
        const on = r() < 0.65;
        R(g, x + 3, fy + 2, sw, 8, '#121019');
        for (let sy = 0; sy < 6; sy++) { g.globalAlpha = on ? (sy % 2 ? 0.25 : 0.7) : 1; R(g, x + 4, fy + 3 + sy, sw - 2, 1, on ? lit : '#0d0b16'); g.globalAlpha = 1; }
      } else if (style === 'balcony') { // (railings, a plant, washing on a line)
        for (let wx = x + 3; wx + 6 <= x + w - 2; wx += 10) { const on = r() < 0.5; g.globalAlpha = on ? 0.6 : 1; R(g, wx, fy + 2, 6, 6, on ? lit : '#0d0b16'); g.globalAlpha = 1; }
        R(g, x + 1, fy + 7, w - 2, 1, '#4a4e5c');
        for (let k = x + 1; k < x + w - 1; k += 2) R(g, k, fy + 8, 1, 3, '#3a3f4e');
        if (r() < 0.5) { const px = x + ri(r, 3, w - 5); R(g, px, fy + 5, 3, 2, '#2f6a3a'); R(g, px + 1, fy + 4, 1, 1, '#3f8a4a'); }
        if (r() < 0.4) { for (let k = x + 3; k < x + w - 3; k++) if (k % 5 < 2) R(g, k, fy + 3 + (k % 3 === 0 ? 1 : 0), 1, 2, rp(r, ['#7a6a9a', '#9a5a6a', '#5a7a9a'])); }
      } else { // (an industrial face: a louvred vent, pipes)
        const vw = Math.min(w - 8, 16);
        const vx = x + ri(r, 3, Math.max(3, w - vw - 3));
        R(g, vx, fy + 2, vw, 8, '#15141e');
        for (let sy = 0; sy < 8; sy += 2) R(g, vx + 1, fy + 2 + sy, vw - 2, 1, '#2c2b3a');
        R(g, x + 1, fy + 1, w - 2, 1, '#2a2d38');
      }
    }
    if (yb - top > 30 && r() < 0.3) { // (a fire escape: its landings and the stairs between)
      const fx = x + 2 + Math.floor(r() * Math.max(1, w - 16));
      for (let fy = yb - 12; fy > top + 6; fy -= 12) {
        R(g, fx, fy + 10, 14, 1, '#3a3f4e');
        for (let k = 0; k < 14; k += 2) R(g, fx + k, fy + 7, 1, 3, '#3a3f4e');
        for (let k = 0; k < 10; k++) R(g, fx + 2 + k, fy + 10 - Math.round(k * 1.1), 1, 1, '#3a3f4e');
      }
    }
    R(g, x + w - 2, top + 3, 1, yb - top - 3, '#2a2d38'); // (a drain pipe)
    for (let py = top + 8; py < yb; py += 10) R(g, x + w - 3, py, 3, 1, '#3a3d48');
    if (yb - top > 28 && r() < 0.5) { // (a neon banner hanging off it: glyphs down a tall box)
      const n = 3 + Math.floor(r() * 4);
      const left = r() < 0.5;
      const bx = left ? x - 4 : x + w - 5;
      const by = Math.max(top + 3, yb - 6 - n * 7);
      const col = rp(r, NEON);
      const box = r() < 0.4; // (a lightbox: lit panel, dark glyphs; else neon glyphs on dark)
      R(g, bx - 1, by - 1, 9, n * 7 + 3, '#07060d');
      R(g, bx + 3, by - 4, 1, 3, '#3a3f4e');
      sign({ kind: 'glyphs', glyphs: Array.from({ length: n }, () => glyph(r)), x: bx + 1, y: by + 1, w: 5, h: n * 7, col, box, faulty: r() < 0.18 });
    }
  }
  // (the roof's own: a water tank, an antenna, a dish, AC units)
  function roof(g, x, w, top, r) {
    const t = r();
    if (t < 0.3) { R(g, x + 3, top - 7, 8, 7, '#23263a'); R(g, x + 4, top - 8, 6, 1, '#2c3046'); R(g, x + 4, top - 2, 1, 2, '#16182a'); R(g, x + 9, top - 2, 1, 2, '#16182a'); }
    else if (t < 0.55) { R(g, x + w - 6, top - 12, 1, 12, '#23263a'); R(g, x + w - 8, top - 9, 5, 1, '#23263a'); world.lights.push({ x: x + w - 6, y: top - 13, ph: r() * 6.28, layer: 'front-fx' }); }
    else if (t < 0.75) { R(g, x + 4, top - 4, 6, 1, '#2c3046'); R(g, x + 3, top - 5, 1, 1, '#2c3046'); R(g, x + 10, top - 5, 1, 1, '#2c3046'); R(g, x + 7, top - 3, 1, 3, '#23263a'); }
    else { for (let k = 0; k < 2; k++) { R(g, x + 3 + k * 7, top - 4, 5, 4, '#3a3e4c'); R(g, x + 4 + k * 7, top - 3, 3, 2, '#23263a'); } }
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
      const w = ri(r, W[0], W[1]);
      if (kind === 'alley') { alley(g, x, w, ch, r); tops.push({ x, w, top: ch, gap: true }); x += w; continue; }
      const top = kind === 'low' ? yG - ri(r, 4, 14) : Math.max(6, ch - ri(r, GF + 24, ch));
      shell(g, x, w, top, ch, r);
      if (kind !== 'low') upper(g, x, w, top, yG, r);
      roof(g, x, w, top, r);
      R(g, x, yG - 1, w, 2, '#3a3456'); // (the ledge over the shops)
      ({ shop, shutter, metro, kiosk, window: windowLot, stall, low: lowLot })[kind](g, x, w, ch, yG, r, top);
      tops.push({ x, w, top });
      x += w;
    }
    // cables strung across from roof to roof (over the alleys and the low roofs too), lanterns on some
    for (let i = 0; i + 2 < tops.length; i++) {
      if (r() < 0.4) continue;
      const a = tops[i];
      const b = tops[i + 1].gap || tops[i + 1].top > yG - 16 ? tops[i + 2] : tops[i + 1];
      if (!b || b.gap) continue;
      const x0 = a.x + a.w - 4;
      const x1 = b.x + 4;
      const y0 = Math.max(a.top, yG - 30) + 4;
      const y1 = Math.max(b.top, yG - 30) + 4;
      const sag = 4 + r() * 8;
      const lantern = r() < 0.55 ? rp(r, ['#ff2a6d', '#ff9f1c', '#fffb6b']) : null;
      for (let cx = x0; cx <= x1; cx++) {
        const t = (cx - x0) / Math.max(1, x1 - x0);
        const cy = Math.round(y0 + (y1 - y0) * t + sag * 4 * t * (1 - t));
        R(g, cx, cy, 1, 1, '#0a0912');
        if (lantern && (cx - x0) % 5 === 2) sign({ kind: 'lantern', x: cx - 1, y: cy + 1, w: 3, h: 3, col: lantern, faulty: r() < 0.1 });
      }
    }
  }

  // A SHOP, lit inside: its window's panes, shelves, posters, a glass door, OPEN glowing in the window
  function shop(g, x, w, ch, yG, r) {
    const L = rp(r, ['#b8d86a', '#ffc46b', '#7fe3ff', '#ff9fd0', '#c8b8ff']);
    R(g, x + 1, yG + 1, w - 2, 5, '#100e18'); // (the fascia)
    A(g, x + 2, yG + 5, w - 4, 1, L, 0.8);
    const word = rp(r, WORDS.filter((s) => textW(s) <= w - 10));
    if (word) { const sx = x + Math.floor((w - textW(word)) / 2); R(g, sx - 2, yG + 0, textW(word) + 4, 6, '#07060d'); sign({ kind: 'text', s: word, x: sx, y: yG + 1, w: textW(word), h: 5, col: rp(r, NEON), faulty: r() < 0.15 }); }
    const wy = yG + 8;
    const wh = ch - wy - 2;
    R(g, x + 2, wy - 1, w - 4, wh + 2, '#0e0c15'); // (the frame)
    g.globalAlpha = 0.85;
    R(g, x + 3, wy, w - 6, wh, L);
    g.globalAlpha = 1;
    A(g, x + 3, wy, w - 6, Math.floor(wh / 2), '#ffffff', 0.12); // (brighter up by the lights)
    for (let sy = wy + Math.floor(wh * 0.45); sy < ch - 3; sy += 5) A(g, x + 3, sy, w - 6, 1, '#000000', 0.35); // (its shelves)
    for (let sx = x + 3; sx < x + w - 3; sx += 3) if (r() < 0.6) { const sy = wy + Math.floor(wh * 0.45) + 5 * ri(r, 0, 2) - 2; A(g, sx, sy, 2, 2, rp(r, ['#2a2040', '#40202a', '#203040']), 0.6); }
    for (let mx = x + 3 + ri(r, 7, 10); mx < x + w - 4; mx += ri(r, 9, 12)) R(g, mx, wy, 1, wh, '#0e0c15'); // (the mullions)
    R(g, x + 3, wy + Math.floor(wh * 0.3), w - 6, 1, '#0e0c15');
    for (let k = 0, n = ri(r, 1, 3); k < n; k++) { const px = x + 5 + Math.floor(r() * (w - 14)); const py = wy + 2 + Math.floor(r() * 4); R(g, px, py, 5, 6, rp(r, ['#e8e4f0', '#f0d0d8', '#d8f0e8'])); R(g, px + 1, py + 1, 3, 2, rp(r, ['#c02040', '#202040', '#208040'])); R(g, px + 1, py + 4, 3, 1, '#606070'); } // (posters)
    const door = r() < 0.5 ? x + 4 : x + w - 14;
    R(g, door, wy, 10, wh, '#0e0c15');
    g.globalAlpha = 0.6; R(g, door + 1, wy + 1, 8, wh - 1, L); g.globalAlpha = 1;
    R(g, door + 7, wy + Math.floor(wh / 2), 1, 3, '#d8d4e0'); // (its handle)
    const ox = door === x + 4 ? x + w - 18 : x + 8;
    sign({ kind: 'text', s: 'OPEN', x: ox, y: wy + 3, w: textW('OPEN'), h: 5, col: rp(r, ['#ff2a6d', '#05d9e8']), faulty: r() < 0.3 });
    world.spills.push({ x: x + 3, w: w - 6, col: L });
    world.stops.push(x + Math.floor(w / 2));
    if (r() < 0.6) { R(g, x + w - 12, yG - 8, 8, 6, '#4a4e5c'); R(g, x + w - 11, yG - 7, 6, 4, '#2c2f3a'); R(g, x + w - 9, yG - 6, 2, 2, '#4a4e5c'); } // (an AC unit)
  }
  // A SHUTTERED SHOP: its shutter lit by the lanterns along its awning, a neon sign of glyphs over it,
  // a ladder of neon rungs up the wall
  function shutter(g, x, w, ch, yG, r) {
    const col = rp(r, ['#ff6a2a', '#ff2a6d', '#ff9f1c']);
    R(g, x + 2, yG + 6, w - 4, 2, '#3a1a10');
    A(g, x + 2, yG + 7, w - 4, 1, col, 0.9); // (the awning's lit edge)
    const sy = yG + 9;
    for (let y = sy; y < ch - 1; y++) {
      const k = (y - sy) / (ch - sy);
      R(g, x + 3, y, w - 6, 1, y % 2 ? '#4a2a20' : '#5a3424');
      A(g, x + 3, y, w - 6, 1, col, 0.22 * (1 - k)); // (lit from above)
    }
    R(g, x + 3, ch - 2, w - 6, 1, '#2a1610');
    R(g, x + Math.floor(w / 2) - 1, ch - 4, 2, 2, '#8a8a96'); // (its lock)
    for (let lx = x + 6; lx < x + w - 5; lx += ri(r, 7, 10)) sign({ kind: 'lantern', x: lx, y: yG + 9, w: 3, h: 4, col, faulty: r() < 0.08 });
    const n = Math.min(4, Math.floor((w - 8) / 7));
    const gx = x + Math.floor((w - n * 7 + 2) / 2);
    R(g, gx - 3, yG - 9, n * 7 + 4, 9, '#0a0608');
    sign({ kind: 'glyphs', glyphs: Array.from({ length: n }, () => glyph(r)), x: gx, y: yG - 7, w: n * 7 - 2, h: 5, col, across: true, faulty: r() < 0.2 });
    if (r() < 0.7) { // (neon rungs up the wall)
      const rx = r() < 0.5 ? x + 3 : x + w - 9;
      const rn = ri(r, 6, 12);
      sign({ kind: 'rungs', x: rx, y: yG - 12 - rn * 3, w: 6, h: rn * 3, n: rn, col, faulty: r() < 0.25 });
    }
    world.spills.push({ x: x + 3, w: w - 6, col });
  }
  // THE METRO: its big sign (METRO, the line's glyphs, arrows, the clock), doors of lit mesh
  function metro(g, x, w, ch, yG, r) {
    world.metro = true;
    const T = '#7ff2d8';
    R(g, x + 2, yG - 18, w - 4, 22, '#0c2424');
    R(g, x + 2, yG - 18, w - 4, 1, '#3a8a80');
    R(g, x + 2, yG + 3, w - 4, 1, '#3a8a80');
    for (let k = 0; k < 3; k++) { const gl = glyph(r); for (const [gx, gy] of gl) R(g, x + 5 + k * 7 + gx, yG - 16 + gy, 1, 1, '#4fb3a8'); }
    sign({ kind: 'text', s: 'METRO', x: x + Math.floor((w - textW('METRO', 2)) / 2), y: yG - 9, w: textW('METRO', 2), h: 10, k: 2, col: T });
    sign({ kind: 'screen', mode: 'clock', x: x + w - 24, y: yG - 16, w: 19, h: 5, col: T });
    sign({ kind: 'text', s: '>>>', x: x + w - 16, y: yG + 5, w: textW('>>>'), h: 5, col: '#ff2a6d', faulty: true });
    const dy = yG + 6;
    const dw = Math.floor((w - 10) / 2);
    for (let k = 0; k < 2; k++) {
      const dx = x + 4 + k * (dw + 2);
      R(g, dx, dy, dw, ch - dy, '#0e1a1a');
      for (let yy = dy + 1; yy < ch; yy++) for (let xx = dx + 1; xx < dx + dw - 1; xx++) if ((xx + yy) % 3 === 0 || (xx - yy + 300) % 3 === 0) A(g, xx, yy, 1, 1, '#4fb3a8', 0.55);
    }
    A(g, x + 3, dy, 1, ch - dy, T, 0.7);
    A(g, x + w - 4, dy, 1, ch - dy, T, 0.7);
    world.spills.push({ x: x + 3, w: w - 6, col: '#4fb3a8' });
    world.stops.push(x + Math.floor(w / 2));
  }
  // A KIOSK wall: a terminal (its screen playing), a ticket booth lit inside, a tall neon tube, pipes,
  // a junction box, a bin
  function kiosk(g, x, w, ch, yG, r) {
    R(g, x + 1, yG - 6, w - 2, 2, '#3a3f4e'); // (pipes along the top)
    R(g, x + 1, yG - 3, w - 2, 1, '#2c303c');
    for (let px = x + 4; px < x + w - 2; px += 9) R(g, px, yG - 7, 1, 5, '#4a4e5c');
    for (let px = x + 6; px < x + w; px += 12) R(g, px, yG, 1, ch - yG, '#1a1826'); // (its panels' seams)
    const kx = x + 4;
    R(g, kx, ch - 22, 13, 22, '#3a3466');
    R(g, kx + 1, ch - 21, 11, 1, '#5a54a0');
    R(g, kx + 2, ch - 19, 9, 8, '#081418');
    sign({ kind: 'screen', mode: 'radar', x: kx + 2, y: ch - 19, w: 9, h: 8, col: '#05d9e8' });
    R(g, kx + 3, ch - 9, 7, 2, '#2a2650');
    const tube = rp(r, ['#ff2a6d', '#ff5ec4', '#05d9e8']);
    sign({ kind: 'tube', x: kx + 16, y: yG + 1, w: 2, h: ch - yG - 3, col: tube, faulty: r() < 0.3 });
    const bx = kx + 21;
    if (bx + 18 < x + w - 8) {
      R(g, bx, ch - 26, 18, 26, '#1c1a26');
      R(g, bx + 1, ch - 25, 16, 1, '#4a3a5a');
      R(g, bx + 2, ch - 23, 14, 7, '#140c1a');
      sign({ kind: 'screen', mode: 'menu', x: bx + 3, y: ch - 22, w: 12, h: 5, col: '#ffc46b' });
      R(g, bx + 2, ch - 15, 14, 10, '#2a1640');
      A(g, bx + 2, ch - 15, 14, 10, '#b14aed', 0.3); // (the booth's inside, lit)
      R(g, bx + 2, ch - 5, 14, 5, '#2a2836');
      world.spills.push({ x: bx, w: 18, col: '#b14aed' });
      world.stops.push(bx + 9);
    }
    R(g, x + w - 7, ch - 12, 5, 9, '#4a4e5c'); R(g, x + w - 6, ch - 10, 3, 1, '#2a2d38'); // (a junction box)
    R(g, x + w - 6, ch - 3, 3, 3, '#3a2a26'); // (a bin)
  }
  // A WINDOW the city shows through: cut out of the wall (the far layers behind it), its frame, cables
  // hanging inside, a neon sign on the glass
  function windowLot(g, x, w, ch, yG, r) {
    const wx = x + 6;
    const ww = w - 12;
    const wy = yG - 18;
    const wh = ch - wy - 8;
    R(g, wx - 2, wy - 2, ww + 4, wh + 4, '#1a1f24');
    R(g, wx - 2, wy - 2, ww + 4, 1, '#3a3f4e');
    g.clearRect(wx, wy, ww, wh); // (the hole: the city behind)
    A(g, wx, wy, ww, wh, '#1a0a2a', 0.18); // (the glass's tint)
    for (let k = 0; k < 3; k++) { const sx = wx + ri(r, 2, Math.max(3, ww - 8)); for (let i = 0; i < 6; i++) A(g, sx + i, wy + 3 + i, 1, 1, '#ffffff', 0.1); } // (reflections)
    R(g, wx + Math.floor(ww / 2), wy, 1, wh, '#1a1f24'); // (its bar)
    for (let c = 0; c < 3; c++) { // (cables hanging inside)
      const cx0 = wx + ri(r, 0, ww - 4);
      const cx1 = Math.min(wx + ww - 1, cx0 + ri(r, 6, 16));
      const sag = ri(r, 2, 6);
      for (let cx = cx0; cx <= cx1; cx++) { const t = (cx - cx0) / Math.max(1, cx1 - cx0); R(g, cx, wy + Math.round(sag * 4 * t * (1 - t)), 1, 1, '#05040a'); }
    }
    if (ww > 20) {
      const n = Math.min(5, Math.floor((wh - 4) / 7));
      sign({ kind: 'glyphs', glyphs: Array.from({ length: n }, () => glyph(r)), x: wx + ww - 9, y: wy + 3, w: 5, h: n * 7, col: rp(r, ['#ff5ec4', '#b14aed', '#05d9e8']), faulty: r() < 0.15 });
    }
    R(g, wx - 3, wy + wh + 2, ww + 6, 1, '#3a3f4e'); // (the sill)
    R(g, x + 3, ch - 4, w - 6, 1, '#1a1826');
    world.stops.push(x + Math.floor(w / 2));
  }
  // A FOOD STALL: its canopy, a string of bulbs, the counter, a pot steaming, its menu lit
  function stall(g, x, w, ch, yG, r) {
    const can = rp(r, [['#a8203a', '#5a1020'], ['#206a6a', '#103434'], ['#a86a20', '#583410']]);
    for (let cx = x + 1; cx < x + w - 1; cx++) R(g, cx, yG + 4, 1, 4, can[Math.floor(cx / 3) % 2]);
    R(g, x + 1, yG + 8, w - 2, 1, '#1a0a10');
    for (let bx = x + 3; bx < x + w - 2; bx += 4) sign({ kind: 'lantern', x: bx, y: yG + 9, w: 1, h: 1, col: '#fff2b0', faulty: r() < 0.05 });
    R(g, x + 3, yG + 8, 1, ch - yG - 8, '#2a1a14');
    R(g, x + w - 4, yG + 8, 1, ch - yG - 8, '#2a1a14');
    A(g, x + 4, yG + 9, w - 8, ch - yG - 18, '#ffb347', 0.18); // (warm light under the canopy)
    R(g, x + 6, ch - 9, w - 12, 9, '#4a2e20'); // (the counter)
    R(g, x + 6, ch - 9, w - 12, 1, '#7a5034');
    const pot = x + ri(r, 9, w - 16);
    R(g, pot, ch - 13, 6, 4, '#5a5e6a'); R(g, pot - 1, ch - 13, 8, 1, '#7a7e8a');
    world.grates.push({ x: pot + 3, y: 13, pot: true });
    const mx = x + w - 16;
    R(g, mx, yG + 11, 11, 9, '#0a0608');
    sign({ kind: 'screen', mode: 'menu', x: mx + 1, y: yG + 12, w: 9, h: 7, col: '#ffc46b' });
    world.spills.push({ x: x + 4, w: w - 8, col: '#ffb347' });
    world.stops.push(x + Math.floor(w / 2));
  }
  // A LOW building: its rooftop (railing, a rooftop sign), the city plain over it
  function lowLot(g, x, w, ch, yG, r, top) {
    R(g, x + 1, top - 3, w - 2, 1, '#3a3f4e');
    for (let k = x + 1; k < x + w - 1; k += 3) R(g, k, top - 2, 1, 2, '#3a3f4e');
    if (r() < 0.6) {
      const word = rp(r, WORDS.filter((s) => textW(s, 2) <= w - 6)) || 'BAR';
      const k = textW(word, 2) <= w - 6 ? 2 : 1;
      const sx = x + Math.floor((w - textW(word, k)) / 2);
      const sy = top - 6 - 5 * k;
      if (sy < 2) return (r() < 0.5 ? shop : shutter)(g, x, w, ch, yG, r); // (no room over it for the sign)
      R(g, sx - 2, sy - 2, textW(word, k) + 4, 5 * k + 4, '#07060d');
      R(g, sx + 2, sy + 5 * k + 2, 1, top - (sy + 5 * k + 2), '#2a2d38');
      R(g, sx + textW(word, k) - 3, sy + 5 * k + 2, 1, top - (sy + 5 * k + 2), '#2a2d38');
      sign({ kind: 'text', s: word, x: sx, y: sy, w: textW(word, k), h: 5 * k, k, col: rp(r, NEON), faulty: r() < 0.2 });
    }
    // the shop under it: shuttered or lit, as the shops are
    (r() < 0.5 ? shop : shutter)(g, x, w, ch, yG, r);
  }
  // AN ALLEY: the city down it (left open), its shadowed floor, a dumpster, boxes, a hanging sign
  function alley(g, x, w, ch, r) {
    for (let y = ch - 26; y < ch; y++) A(g, x, y, w, 1, '#05040c', 0.25 + 0.5 * ((y - (ch - 26)) / 26)); // (the dark down it)
    A(g, x + Math.floor(w / 2) - 2, ch - 22, 4, 6, '#ffc46b', 0.35); // (a door lit far down it)
    if (w >= 18) { R(g, x + 2, ch - 8, 11, 8, '#1d3a2e'); R(g, x + 2, ch - 8, 11, 1, '#2a5040'); R(g, x + 3, ch - 6, 9, 1, '#16302a'); } // (a dumpster)
    R(g, x + w - 6, ch - 5, 5, 5, '#5a4630'); R(g, x + w - 5, ch - 8, 4, 3, '#6a5238'); // (boxes)
    world.grates.push({ x: x + Math.floor(w / 2), y: 2, alley: true });
    if (r() < 0.7) { // (a sign hung off the wall on a bracket)
      const hy = ch - ri(r, 34, 50);
      R(g, x, hy, 4, 1, '#3a3f4e');
      R(g, x + 3, hy + 1, 1, 2, '#3a3f4e');
      R(g, x + 1, hy + 3, 7, 13, '#07060d');
      sign({ kind: 'glyphs', glyphs: [glyph(r), glyph(r)], x: x + 2, y: hy + 4, w: 5, h: 12, col: rp(r, NEON), box: r() < 0.5, faulty: r() < 0.2 });
    }
    for (let c = 0; c < 2; c++) { // (cables across it)
      const y0 = ch - ri(r, 40, 70);
      for (let cx = x; cx < x + w; cx++) { const t = (cx - x) / w; R(g, cx, y0 + Math.round(4 * t * (1 - t) * 4), 1, 1, '#05040a'); }
    }
  }

  // THE SIDEWALK: wet, the shops' light and the signs' colors spilled in it, puddles, its tiles
  function drawGround(g, cw, ch, r) {
    R(g, 0, 0, cw, ch, '#14121f');
    R(g, 0, 0, cw, 1, '#2a2540');
    g.fillStyle = '#1b1829';
    for (let x = Math.floor(r() * 7); x < cw; x += 7) g.fillRect(x, 1, 1, ch - 1);
    g.fillRect(0, 3, cw, 1);
    for (const s of world.spills) for (let y = 1; y < Math.min(ch, 5); y++) for (let x = s.x; x < s.x + s.w; x++) {
      if (r() < 0.6 - y * 0.1) A(g, x, y, 1, 1, s.col, 0.12 + r() * 0.22);
    }
    for (const s of world.signs) {
      if (s.kind !== 'text' && s.kind !== 'tube') continue;
      for (let y = 1; y < Math.min(ch, 5); y++) for (let x = s.x - 1; x <= s.x + s.w; x++) if (r() < 0.35 - y * 0.06) A(g, x, y, 1, 1, s.col, 0.15 + r() * 0.2);
    }
    for (let i = 0, n = Math.round(cw / 50); i < n; i++) { // (puddles: darker, a glint)
      const px = Math.floor(r() * cw);
      const pw = 6 + Math.floor(r() * 10);
      const py = 2 + Math.floor(r() * 2);
      R(g, px, py, pw, 1, '#0c0b16');
      R(g, px + 1, py + 1, pw - 2, 1, '#0c0b16');
      A(g, px + 2 + Math.floor(r() * (pw - 4)), py, 2, 1, rp(r, NEON), 0.5);
    }
  }
  // IN FRONT: bollards, grates, bags, a cone (low: the bots' feet show over them)
  function drawNear(g, cw, ch, r) {
    for (let x = Math.floor(r() * 30); x < cw; x += 26 + Math.floor(r() * 40)) {
      const t = r();
      if (t < 0.35) { R(g, x, ch - 5, 2, 5, '#2c2f3c'); R(g, x, ch - 6, 2, 1, rp(r, ['#05d9e8', '#ff2a6d', '#fffb6b'])); }
      else if (t < 0.6) { R(g, x, ch - 1, 6, 1, '#0b0a12'); for (let k = 0; k < 6; k += 2) R(g, x + k, ch - 1, 1, 1, '#3a3a48'); world.grates.push({ x: x + 3, y: -3 }); }
      else if (t < 0.8) { R(g, x, ch - 3, 4, 3, '#0d0d14'); R(g, x + 1, ch - 4, 2, 1, '#0d0d14'); R(g, x + 1, ch - 3, 1, 1, '#23232e'); }
      else { R(g, x + 1, ch - 4, 1, 1, '#ff6a1c'); R(g, x, ch - 3, 3, 2, '#ff6a1c'); R(g, x, ch - 2, 3, 1, '#f2f2f2'); R(g, x - 1, ch - 1, 5, 1, '#2a1a10'); }
    }
  }

  // ── What flickers and plays: the signs, the screens, the billboards, the blinking lights ──
  function bounds(s) { return [s.x - 2, s.y - 2, s.w + 4, s.h + 4]; }
  const meets = (a, b) => a[0] < b[0] + b[2] && b[0] < a[0] + a[2] && a[1] < b[1] + b[3] && b[1] < a[1] + a[3];
  function paintSign(g, s, now) {
    const [bx, by, bw, bh] = bounds(s);
    const on = s.on;
    const col = on ? s.col : '#3a2a3a';
    if (on && s.kind !== 'screen') A(g, bx + 1, by + 1, bw - 2, bh - 2, s.col, s.kind === 'lantern' ? 0.3 : 0.16); // (its glow)
    if (s.kind === 'text') text(g, s.s, s.x, s.y, col, s.k || 1);
    else if (s.kind === 'glyphs') {
      if (s.box && on) R(g, s.x - 1, s.y - 1, s.w + 2, s.h + 1, s.col);
      const gc = s.box ? (on ? '#1a0a14' : '#2a1a24') : col;
      s.glyphs.forEach((gl, i) => { for (const [gx, gy] of gl) R(g, s.x + (s.across ? i * 7 + gx : gx), s.y + (s.across ? gy : i * 7 + gy), 1, 1, gc); });
    } else if (s.kind === 'tube') {
      R(g, s.x, s.y, s.w, s.h, col);
      if (on) { A(g, s.x - 1, s.y, 1, s.h, s.col, 0.45); A(g, s.x + s.w, s.y, 1, s.h, s.col, 0.45); R(g, s.x, s.y, 1, s.h, '#ffe6f0'); }
    } else if (s.kind === 'rungs') {
      for (let i = 0; i < s.n; i++) R(g, s.x, s.y + i * 3, s.w, 1, col);
    } else if (s.kind === 'lantern') {
      R(g, s.x, s.y, s.w, s.h, col);
      if (on && s.w > 1) R(g, s.x + 1, s.y + 1, 1, Math.max(1, s.h - 2), '#fff4d0');
    } else if (s.kind === 'screen') paintScreen(g, s, now);
  }
  function paintScreen(g, s, now) {
    const t = (now || 0) / 1000;
    R(g, s.x, s.y, s.w, s.h, '#05080a');
    if (!s.on) return;
    if (s.mode === 'clock') { const d = new Date(); const hm = `${String(d.getHours()).padStart(2, '0')}${t % 2 < 1 ? ':' : ' '}${String(d.getMinutes()).padStart(2, '0')}`; text(g, hm, s.x, s.y, s.col); }
    else if (s.mode === 'radar') { // (a sweep round a ring, a blip)
      const cx = s.x + Math.floor(s.w / 2); const cy = s.y + Math.floor(s.h / 2);
      for (let a = 0; a < 6.28; a += 0.4) A(g, cx + Math.round(Math.cos(a) * 3.5), cy + Math.round(Math.sin(a) * 3), 1, 1, s.col, 0.5);
      const a = t * 2.4; for (let k = 0; k < 4; k++) A(g, cx + Math.round(Math.cos(a) * k), cy + Math.round(Math.sin(a) * k * 0.85), 1, 1, s.col, 0.9);
      if ((t % 3) < 1.5) R(g, cx + 2, cy - 1, 1, 1, '#ff2a6d');
    } else { // ('menu': lines of it, a cursor blinking)
      for (let ly = 0; ly < s.h; ly += 2) A(g, s.x + 1, s.y + ly, Math.max(2, s.w - 2 - ((ly * 7) % 5)), 1, s.col, 0.7);
      if (t % 1 < 0.5) R(g, s.x + s.w - 2, s.y + s.h - 1, 1, 1, s.col);
    }
  }
  function paintBoard(g, b, now) {
    const { x, y, w, h, col } = b;
    g.clearRect(x, y, w, h);
    const t = now / 1000 + b.t;
    const off = b.glitch > now ? Math.round(rand(-2, 2)) : 0;
    A(g, x, y, w, h, col, 0.16);
    g.fillStyle = col;
    if (b.mode === 'logo') {
      const s = Math.floor(t) % 6 < 4 ? 'BYTEFALL' : 'DECRYPT';
      if (textW(s) <= w - 2) text(g, s, x + Math.floor((w - textW(s)) / 2) + off, y + Math.floor((h - 5) / 2), col);
      else text(g, 'BYTE', x + Math.floor((w - textW('BYTE')) / 2) + off, y + Math.floor((h - 5) / 2), col);
    } else if (b.mode === 'bit') {
      const s = `[${1 + (Math.floor(t * 1.5) % 7)}]`;
      text(g, s, x + Math.floor((w - textW(s)) / 2) + off, y + Math.floor((h - 5) / 2), col);
    } else if (b.mode === 'eye') {
      const cx = x + Math.floor(w / 2) + off;
      const cy = y + Math.floor(h / 2);
      const blink = (t % 4) > 3.8;
      for (let dx = -7; dx <= 7; dx++) { const e = Math.round(Math.sqrt(Math.max(0, 1 - (dx / 7) ** 2)) * (blink ? 0 : 3)); g.fillRect(cx + dx, cy - e, 1, 1); g.fillRect(cx + dx, cy + e, 1, 1); }
      if (!blink) { const lx = Math.round(Math.sin(t * 0.9) * 3); g.fillRect(cx + lx - 1, cy - 1, 3, 3); g.fillStyle = '#05040c'; g.fillRect(cx + lx, cy, 1, 1); }
    } else if (b.mode === 'beat') {
      for (let i = 0; i < Math.floor((w - 2) / 3); i++) { const bh = Math.max(1, Math.round((h - 2) * (0.25 + 0.75 * Math.abs(Math.sin(t * 2.3 + i * 0.9) * Math.cos(t * 1.1 + i * 0.4))))); g.fillRect(x + 1 + i * 3 + off, y + h - 1 - bh, 2, bh); }
    } else {
      const s = 'NEON NEVER SLEEPS // DATA IS CURRENCY // 2099 // ';
      const sx = x + w - (Math.floor(t * 9) % (textW(s) + w));
      g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
      text(g, s, sx + off, y + Math.floor((h - 5) / 2), col);
      g.restore();
    }
    g.fillStyle = 'rgba(5, 4, 12, 0.45)'; // (its scanlines)
    for (let sy = y + 1; sy < y + h; sy += 2) g.fillRect(x, sy, w, 1);
  }
  function paintFx(now, all) {
    if (!world) return;
    const front = els['front-fx'].getContext('2d');
    const mid = els['mid-fx'].getContext('2d');
    const calm = lowFx();
    const dirty = [];
    for (const s of world.signs) {
      let changed = all || s.kind === 'screen';
      if (s.faulty && !calm && now >= s.next) { // (a faulty tube: off a moment, stuttering, back)
        s.on = !s.on;
        s.next = now + (s.on ? (Math.random() < 0.7 ? rand(40, 160) : rand(1500, 6000)) : rand(40, 220));
        changed = true;
      }
      if (changed) { const b = bounds(s); front.clearRect(...b); dirty.push(b); }
    }
    // (what changed drawn again, and the part of any sign it overlaps: only inside what was cleared, so
    // a glow is never laid over itself)
    if (dirty.length) {
      front.save();
      front.beginPath();
      for (const d of dirty) front.rect(...d);
      front.clip();
      for (const s of world.signs) { const b = bounds(s); if (dirty.some((d) => meets(b, d))) paintSign(front, s, calm ? 0 : now); }
      front.restore();
    }
    for (const b of world.boards) {
      if (!calm && Math.random() < 0.01) b.glitch = now + rand(80, 260);
      paintBoard(mid, b, calm ? 0 : now);
    }
    for (const L of world.lights) { // (the masts' and roofs' red lights, blinking)
      const g = els[L.layer].getContext('2d');
      const on = calm || Math.sin(now / 600 + L.ph) > 0.2;
      g.clearRect(L.x - 1, L.y - 1, 3, 3);
      if (on) { A(g, L.x - 1, L.y - 1, 3, 3, '#ff283c', 0.35); R(g, L.x, L.y, 1, 1, '#ff3a4a'); }
    }
  }

  // ── THE CROWD: pixel figures, the bots' own pixel size, taller than them (rows of palette letters;
  // two frames of legs for walking) ──
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
    const canopy = ['..........UUUU......', '.......UUuuuuuUU....', '.....UUuuuuuuuuuUU..', '....UuuuuuuuuuuuuuU.', '...UUUUUUUUUUUUUUUUU'];
    const rows = [...canopy.map((r) => r.slice(0, 20))];
    for (let i = 0; i < 2; i++) rows.push('............s.......'.slice(0, 20));
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
  function spawnWalker(kind, side) {
    if (!world) return;
    kind = kind && FIG[kind] ? kind : pick(FIG_KINDS);
    const f = FIG[kind];
    const dir = side ? (side === 'left' ? 1 : -1) : (Math.random() < 0.5 ? 1 : -1);
    // (stopping a while at a window, a stall, the metro's doors, part way across: the nearest one ahead)
    const ahead = world.stops.filter((s) => (dir > 0 ? s > cam + world.Wc * 0.15 : s < cam + world.Wc * 0.85) && s > cam && s < cam + world.Wc);
    crowd.push({
      kind, f, dir, t: 0,
      x: dir > 0 ? cam - f.w - 2 : cam + world.Wc + 2, // (along the whole street, in cells)
      v: kind === 'droid' ? rand(9, 14) : kind === 'drone' ? rand(10, 16) : rand(4.5, 7),
      eye: pick(['#05d9e8', '#ff2a6d', '#b14aed', '#fffb6b']),
      led: pick(['#05d9e8', '#ff2a6d', '#39ff88']),
      y: kind === 'drone' ? ri(Math.random, 50, 72) : 0,
      stop: !f.fly && ahead.length && Math.random() < 0.45 ? pick(ahead) : null,
      wait: 0,
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
      if (e.stop !== null && ((e.dir > 0 && e.x + e.f.w / 2 >= e.stop) || (e.dir < 0 && e.x + e.f.w / 2 <= e.stop))) { e.wait = rand(4, 10); e.stop = null; continue; }
      e.x += e.dir * e.v * dt;
    }
    for (let i = crowd.length - 1; i >= 0; i--) {
      const e = crowd[i];
      if (e.x < cam - e.f.w - 60 || e.x > cam + world.Wc + 60) crowd.splice(i, 1);
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
      const rows = [...f.rows, ...(f.legs[frame] || [])];
      const bob = f.hover ? Math.round(Math.sin(e.t * 3)) : f.fly ? Math.round(Math.sin(e.t * 5)) : 0;
      const x0 = Math.round(e.x - cam);
      const y0 = c.height - rows.length - (f.hover || 0) - e.y + bob;
      const blink = Math.sin(now / 300 + e.x) > 0;
      for (let ry = 0; ry < rows.length; ry++) {
        const row = rows[ry];
        for (let rx = 0; rx < row.length; rx++) {
          const ch = row[e.dir > 0 ? rx : row.length - 1 - rx];
          if (ch === '.') continue;
          let col = PAL[ch];
          if (ch === 'e' || ch === 'v' || ch === 'O') col = e.eye;
          else if (ch === 'L') col = e.led;
          else if (ch === 'U') col = '#05d9e8';
          else if (ch === 'u') col = 'rgba(5, 217, 232, 0.16)';
          else if (ch === 's') col = '#8ff2ff';
          else if (ch === 'o') col = '#16324a';
          else if (ch === 'g') col = Math.random() < 0.8 ? 'rgba(255, 94, 196, 0.7)' : 'rgba(255, 94, 196, 0.3)';
          else if (ch === 'r') col = blink ? '#ff3a4a' : '#40141a';
          else if (ch === 'p' && f.fly) col = frame ? '#5c6478' : 'rgba(92, 100, 120, 0.4)';
          g.fillStyle = col;
          g.fillRect(x0 + rx, y0 + ry, 1, 1);
        }
      }
      if (f.eyeRow !== undefined) { // (the eyes' glow in the hood)
        const ex = x0 + (e.dir > 0 || f.w === 12 ? 3 : f.w - 9);
        A(g, ex, y0 + f.eyeRow - 1, 6, 3, e.eye, 0.22);
      }
      if (e.kind === 'umbrella') A(g, x0 + (e.dir > 0 ? 3 : 0), y0 + 4, 17, 6, '#05d9e8', 0.06); // (the light off its rim)
    }
  }

  // ── THE STEAM (the grates, the alleys, a stall's pot), THE TRAIN and THE TRAFFIC ──
  function steamTick(dt) {
    if (!world || lowFx()) { steam.length = 0; return; }
    for (const gr of world.grates) {
      const sx = gr.x - cam;
      if (sx < -10 || sx > world.Wc + 10) continue;
      if (Math.random() < dt * (gr.pot ? 3 : gr.alley ? 1.4 : 2)) steam.push({ x: gr.x + rand(-1.5, 1.5), y: 3 + (gr.y || 0), vx: rand(-0.6, 0.6), vy: rand(2.2, 4), life: rand(2.5, 4.5), t: 0 });
    }
    for (const p of steam) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx += rand(-0.5, 0.5) * dt; }
    for (let i = steam.length - 1; i >= 0; i--) if (steam[i].t > steam[i].life) steam.splice(i, 1);
    const c = els.steam;
    const g = c.getContext('2d');
    g.clearRect(0, 0, c.width, c.height);
    for (const p of steam) {
      const a = 0.2 * (1 - p.t / p.life);
      const rr = 1 + Math.floor(p.t * 0.8);
      g.fillStyle = `rgba(200, 196, 230, ${a.toFixed(3)})`;
      g.fillRect(Math.round(p.x - cam) - rr, c.height - Math.round(p.y) - rr, rr * 2 + 1, rr * 2 + 1);
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
      const len = ri(Math.random, 70, 110);
      train = { dir, len, x: dir > 0 ? cam * k - len - 4 : cam * k + world.Wc + 4, v: rand(26, 40) };
    }
    g.clearRect(0, 0, c.width, c.height);
    if (!train) return;
    train.x += train.dir * train.v * dt;
    const sx = Math.round(train.x - cam * k);
    const ty = world.rail.y - 6; // (on top of the beam)
    R(g, sx, ty, train.len, 6, '#2a2f44');
    R(g, sx, ty, train.len, 1, '#4a5070');
    for (let wx = sx + 3; wx < sx + train.len - 3; wx += 4) { if ((wx - sx) % 26 < 2) continue; A(g, wx, ty + 2, 3, 2, '#ffe6a0', 0.8); }
    A(g, sx, ty + 5, train.len, 1, '#05d9e8', 0.6); // (its lit underside)
    const nose = train.dir > 0 ? sx + train.len : sx - 2;
    R(g, nose, ty + 2, 2, 3, '#fff6c8');
    if (sx > world.Wc + 20 || sx + train.len < -20) { if ((train.dir > 0 && sx > 0) || (train.dir < 0 && sx < 0)) train = null; }
  }
  function trafficTick(dt, now) {
    if (!world) return;
    const c = els.traffic;
    const g = c.getContext('2d');
    const k = speedOf.towers + 0.12;
    if (now > nextCar && cars.length < (lowFx() ? 1 : 4)) {
      nextCar = now + rand(2500, 7000);
      const dir = Math.random() < 0.5 ? 1 : -1;
      const lane = Math.floor(rand(world.hM + 4, Math.max(world.hM + 6, world.hT - 6)));
      cars.push({ x: dir > 0 ? cam * k - 10 : cam * k + world.Wc + 10, y: lane, dir, v: rand(10, 24), body: pick(['#2a2f44', '#3a2440', '#1f3a40']) });
    }
    g.clearRect(0, 0, c.width, c.height);
    for (const car of cars) {
      car.x += car.dir * car.v * dt;
      const sx = Math.round(car.x - cam * k);
      const sy = c.height - car.y;
      R(g, sx, sy, 5, 2, car.body);
      g.fillRect(sx + 1, sy - 1, 3, 1);
      const head = car.dir > 0 ? sx + 5 : sx - 1;
      const tail = car.dir > 0 ? sx - 1 : sx + 5;
      R(g, head, sy, 1, 1, '#fff6c8');
      A(g, car.dir > 0 ? head + 1 : head - 4, sy, 4, 1, '#fff6c8', 0.25);
      R(g, tail, sy + 1, 1, 1, '#ff2a4a');
      A(g, car.dir > 0 ? tail - 3 : tail + 1, sy + 1, 3, 1, '#ff2a4a', 0.3);
    }
    for (let i = cars.length - 1; i >= 0; i--) { const sx = cars[i].x - cam * k; if (sx < -30 || sx > world.Wc + 30) cars.splice(i, 1); }
  }

  // ── THE PAN ──
  function place() {
    if (!world) return;
    for (const [name, f, , wide] of LAYERS) {
      if (wide) continue;
      els[name].style.transform = `translate3d(${-Math.round(cam * f * P)}px, 0, 0)`;
    }
  }
  function startPan(dir) {
    if (!world) return false;
    const room = dir > 0 ? world.WW - world.Wc - cam : cam;
    if (room < 8) return false;
    const dist = Math.min(room, world.Wc * rand(0.35, 1));
    const speed = 3.2; // (cells a second: about 7px)
    pan = { from: cam, to: cam + dir * dist, t0: performance.now(), dur: (dist / speed) * 1000 };
    api.botEvent('scene-cyber-pan');
    return true;
  }
  function panTick(now) {
    if (!pan) {
      if (now > nextPan) {
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
      api.shift(-d * P); // (the bots on the street, carried with it)
      place();
    }
    if (k >= 1) pan = null;
  }

  function frame(now) {
    if (!world) return;
    lastNow = now;
    panTick(now);
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
  }

  return {
    els,
    draw: (full, seed) => { if (full || !world || world.Wc !== Math.ceil(api.laneW() / P)) build(seed); },
    frame,
    // (the sandbox's buttons: a pan, someone on the street, the train)
    cmd(c) {
      if (c === 'pan-left') return startPan(-1);
      if (c === 'pan-right') return startPan(1);
      if (c === 'train') { nextTrain = 0; train = null; return true; }
      if (c.startsWith('spawn-')) { spawnWalker(c.slice(6)); return true; }
      return false;
    },
  };
}
