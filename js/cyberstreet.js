// THE CYBERPUNK STREET (scenes.js's CYBER; the bot sandbox's for now, not in the game's own picks yet):
// a long street at night that the wanderers walk along, far longer than the card, the view panning
// slowly along it now and then to show more of it. Always night: neon and rain weather.
//   THE TOWERS   megatowers far off, black against the haze, a few windows lit, red lights blinking on
//                their masts (the slowest to pan: far away)
//   THE MIDDLE   tall blocks nearer, window grids, and HOLO BILLBOARDS playing (BYTEFALL, a bit, an
//                eye, a beat, scrolling words), scanlined, glitching now and then
//   THE STREET   the street's own fronts behind the sidewalk: shops (lit windows, doors, awnings, a
//                neon sign over each), floors above (windows, AC units, fire escapes, drain pipes),
//                neon banners hanging off them, cables and lanterns strung between the roofs, alleys.
//                A few signs are faulty and flicker
//   THE SIDEWALK wet: the signs' colors reflected in it, puddles; in front, bollards, grates (steam
//                rising), bags, a cone
//   THE CROWD    the street's own people, behind the bots (smaller, darker: the four CPUs stay the ones
//                you see): HOODED figures (eyes glowing in the hood), one under a neon UMBRELLA,
//                ROBOTS (boxy, chrome, a visor), DROIDS (hovering), tall ANDROIDS (an LED strip down
//                the front), and DRONES flying over carrying parcels. They come in, cross, now and then
//                stop under a sign a while, and go
//   THE TRAFFIC  flying cars crossing between the towers, headlights and tail lights
// THE PAN: every minute or two the view drifts along the street (left or right, as far as the street
// goes), slowly; everything on the street pans with it, the bots too (one carried off the card walks
// off it), the far layers less (parallax). The sandbox's PAN buttons start one.
// Static layers are drawn once (whole street, wider than the card) and slid; only what changes is
// redrawn (a sign flickering, a billboard's frame, the blinking lights); the crowd, the steam and the
// traffic on card-wide canvases, at about 30 frames a second. REDUCED EFFECTS: no flicker, no steam.
function createCyberStreet(api) {
  const P = api.P; // (the bots' own pixel)
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (list) => list[Math.floor(Math.random() * list.length)];
  const rng = (seed) => { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  const rp = (r, list) => list[Math.floor(r() * list.length)];
  const NEON = ['#ff2a6d', '#05d9e8', '#ff9f1c', '#b14aed', '#39ff88', '#fffb6b', '#ff5ec4'];
  const lowFx = () => document.documentElement.classList.contains('low-fx') || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);

  // ── The layers: [name, how fast it pans (1: the street), z-index, card-wide (redrawn) or the whole street] ──
  const LAYERS = [
    ['towers', 0.22, -5], ['towers-fx', 0.22, -5], ['traffic', 0, -4, true], ['mid', 0.55, -3], ['mid-fx', 0.55, -3],
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

  let world = null; // { Wc, WW (the street's length, in cells), heights, signs, boards, lights, grates, seed }
  let cam = 0; // (the view's left edge along the street, in cells)
  let pan = null; // { from, to, t0, dur }
  let nextPan = performance.now() + rand(25000, 60000);
  const crowd = [];
  let nextWalker = performance.now() + rand(600, 2500);
  const steam = [];
  const cars = [];
  let nextCar = performance.now() + rand(1000, 4000);
  let lastFx = 0;
  let lastDyn = 0;
  let lastNow = 0;

  // ── A 3x5 font for the signs ──
  const FONT = {
    A: '###,#.#,###,#.#,#.#', B: '##.,#.#,##.,#.#,##.', C: '###,#..,#..,#..,###', D: '##.,#.#,#.#,#.#,##.', E: '###,#..,##.,#..,###',
    F: '###,#..,##.,#..,#..', G: '###,#..,#.#,#.#,###', H: '#.#,#.#,###,#.#,#.#', I: '###,.#.,.#.,.#.,###', K: '#.#,#.#,##.,#.#,#.#',
    L: '#..,#..,#..,#..,###', M: '#.#,###,###,#.#,#.#', N: '##.,#.#,#.#,#.#,#.#', O: '###,#.#,#.#,#.#,###', P: '###,#.#,###,#..,#..',
    Q: '###,#.#,#.#,###,..#', R: '##.,#.#,##.,#.#,#.#', S: '###,#..,###,..#,###', T: '###,.#.,.#.,.#.,.#.', U: '#.#,#.#,#.#,#.#,###',
    V: '#.#,#.#,#.#,#.#,.#.', W: '#.#,#.#,###,###,#.#', X: '#.#,#.#,.#.,#.#,#.#', Y: '#.#,#.#,.#.,.#.,.#.', Z: '###,..#,.#.,#..,###',
    0: '###,#.#,#.#,#.#,###', 1: '.#.,##.,.#.,.#.,###', 2: '###,..#,###,#..,###', 3: '###,..#,.##,..#,###', 4: '#.#,#.#,###,..#,..#',
    5: '###,#..,###,..#,###', 6: '###,#..,###,#.#,###', 7: '###,..#,.#.,.#.,.#.', 8: '###,#.#,###,#.#,###', 9: '###,#.#,###,..#,###',
    '[': '##.,#..,#..,#..,##.', ']': '.##,..#,..#,..#,.##', ' ': '...,...,...,...,...', '/': '..#,..#,.#.,#..,#..',
  };
  const textW = (s) => s.length * 4 - 1;
  function text(g, s, x, y, col) {
    g.fillStyle = col;
    for (let i = 0; i < s.length; i++) {
      const rows = (FONT[s[i]] || FONT[' ']).split(',');
      for (let ry = 0; ry < 5; ry++) for (let rx = 0; rx < 3; rx++) if (rows[ry][rx] === '#') g.fillRect(x + i * 4 + rx, y + ry, 1, 1);
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
  // (a sign's glow: its color, dimmed, one cell round what's lit)
  const glowCol = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`; };

  function size(c, cw, ch) {
    if (c.width !== cw || c.height !== ch) { c.width = cw; c.height = ch; }
    c.style.width = `${cw * P}px`;
    c.style.height = `${ch * P}px`;
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
    const WW = Math.max(Wc * 4, 640);
    const hT = Math.round((game ? H * 0.95 : Math.min(H * 0.5, 430)) / P);
    const hM = Math.round((game ? H * 0.8 : Math.min(H * 0.38, 330)) / P);
    const hF = Math.max(40, Math.round((game ? H * 0.62 : Math.min(H * 0.28, 240)) / P));
    world = { Wc, WW, hT, hM, hF, seed, signs: [], boards: [], lights: [], grates: [], fronts: [] };
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
    // (the card-wide ones: the crowd a little smaller, further back; the steam; the traffic in the sky)
    world.CP = P * 0.8;
    size(els.crowd, Math.ceil(W / world.CP) + 1, 30);
    els.crowd.style.width = `${(Math.ceil(W / world.CP) + 1) * world.CP}px`;
    els.crowd.style.height = `${30 * world.CP}px`;
    els.crowd.style.bottom = `${3 * P}px`;
    size(els.steam, Wc + 1, 40);
    size(els.traffic, Wc + 1, hT);
    for (const s of world.signs) s.on = true;
    paintFx(performance.now(), true);
    place();
  }

  // THE TOWERS: tall, black against the haze, a few windows, a light strip, masts with red lights
  function drawTowers(g, cw, ch, r) {
    let x = Math.floor(r() * 6);
    while (x < cw) {
      const w = 14 + Math.floor(r() * 22);
      const h = Math.floor(ch * (0.45 + r() * 0.55));
      const top = ch - h;
      g.fillStyle = rp(r, ['#0c0a1a', '#100d22', '#0e0c1e']);
      g.fillRect(x, top, w, h);
      if (r() < 0.5) { g.fillRect(x + 2, top - 4, w - 4, 4); g.fillRect(x + 4, top - 7, w - 8, 3); } // (a stepped crown)
      if (r() < 0.45) { g.fillStyle = glowCol(rp(r, ['#05d9e8', '#ff2a6d', '#b14aed']), 0.35); g.fillRect(x + Math.floor(w / 2), top + 2, 1, h - 2); } // (a light strip up its face)
      for (let wy = top + 3; wy < ch - 2; wy += 3) for (let wx = x + 2; wx < x + w - 2; wx += 3) {
        if (r() < 0.07) { g.fillStyle = rp(r, ['#ffcf6b', '#6fe3ff', '#ff8fb8', '#d9d4ff']); g.globalAlpha = 0.55; g.fillRect(wx, wy, 1, 1); g.globalAlpha = 1; }
      }
      const mx = x + Math.floor(w / 2);
      const mh = 4 + Math.floor(r() * 10);
      g.fillStyle = '#16132a';
      g.fillRect(mx, top - mh - (top < 8 ? 0 : 7), 1, mh + 7);
      world.lights.push({ x: mx, y: Math.max(0, top - mh - 7), ph: r() * 6.28, layer: 'towers-fx' });
      x += w + Math.floor(r() * 4);
    }
  }

  // THE MIDDLE: nearer blocks, window grids, the HOLO BILLBOARDS
  function drawMid(g, cw, ch, r) {
    let x = Math.floor(r() * 4);
    while (x < cw) {
      const w = 16 + Math.floor(r() * 20);
      const h = Math.floor(ch * (0.4 + r() * 0.6));
      const top = ch - h;
      const body = rp(r, ['#1a1631', '#1e1a38', '#171a30', '#22183a']);
      g.fillStyle = body;
      g.fillRect(x, top, w, h);
      g.fillStyle = '#2a2448';
      g.fillRect(x, top, w, 1); // (its roofline catching the glow)
      const lit = rp(r, ['#ffcf6b', '#7fd8ff', '#ff9fd0']);
      for (let wy = top + 3; wy < ch - 1; wy += 4) for (let wx = x + 2; wx < x + w - 3; wx += 4) {
        const on = r() < 0.32;
        g.fillStyle = on ? lit : '#120f22';
        g.globalAlpha = on ? 0.5 + r() * 0.4 : 1;
        g.fillRect(wx, wy, 2, 2);
        g.globalAlpha = 1;
      }
      if (w >= 26 && h > 24 && r() < 0.6) { // (a holo billboard on its face)
        const bw = Math.min(w - 4, 30 + Math.floor(r() * 6));
        const bh = 13 + Math.floor(r() * 4);
        const bx = x + Math.floor((w - bw) / 2);
        const by = top + 4 + Math.floor(r() * Math.max(1, h * 0.4 - bh));
        g.fillStyle = '#05040c';
        g.fillRect(bx - 1, by - 1, bw + 2, bh + 2);
        world.boards.push({ x: bx, y: by, w: bw, h: bh, mode: rp(r, ['logo', 'bit', 'eye', 'beat', 'words']), col: rp(r, ['#05d9e8', '#ff2a6d', '#b14aed', '#39ff88']), t: r() * 10, glitch: 0 });
      }
      if (r() < 0.4) { // (a red light on its roof)
        world.lights.push({ x: x + 2 + Math.floor(r() * (w - 4)), y: top - 1, ph: r() * 6.28, layer: 'mid-fx' });
        g.fillStyle = '#2a2448';
        g.fillRect(world.lights[world.lights.length - 1].x, top - 1, 1, 1);
      }
      x += w + Math.floor(r() * 3);
    }
  }

  // THE STREET's own fronts: shops, the floors above, banners, fire escapes, cables, alleys
  const WORDS = ['RAMEN', 'BAR', 'HOTEL', '24H', 'CYBER', 'NOODLE', 'DATA', 'BYTE', 'OPEN', 'CLINIC', 'ARCADE', 'SUSHI', 'NEON', 'LIQUOR', 'PAWN', 'REPAIR', 'VR', 'DINER', 'CHROME', 'PHARMA', 'BITS', 'HACK', 'NODE', 'DECRYPT', 'SOBA', 'CAFE', 'KEYS'];
  function drawFront(g, cw, ch, r) {
    let x = 0;
    const roofs = [];
    while (x < cw) {
      if (r() < 0.16) { // (an alley: dark, a dumpster, steam from a vent)
        const aw = 4 + Math.floor(r() * 5);
        g.fillStyle = '#07060d';
        g.fillRect(x, ch - 20, aw, 20);
        if (aw >= 6) { g.fillStyle = '#1d3a2e'; g.fillRect(x + 1, ch - 4, aw - 2, 4); g.fillStyle = '#2a5040'; g.fillRect(x + 1, ch - 4, aw - 2, 1); }
        world.grates.push({ x: x + Math.floor(aw / 2), alley: true });
        x += aw;
        continue;
      }
      const w = 20 + Math.floor(r() * 22);
      const h = Math.min(ch - 1, 22 + Math.floor(r() * (ch - 22)));
      const top = ch - h;
      const wall = rp(r, ['#1b1a2e', '#221d33', '#1a2433', '#2a1f2f', '#1e2a2a', '#262033']);
      const trim = rp(r, ['#2c2a45', '#33284a', '#28354a', '#3a2a40']);
      g.fillStyle = wall;
      g.fillRect(x, top, w, h);
      g.fillStyle = trim;
      g.fillRect(x, top, w, 1);
      g.fillRect(x, ch - 17, w, 1); // (the line over the shop)
      // the shop: its window lit inside, a door, an awning now and then, a neon sign over it
      const inside = rp(r, [['#3a2614', '#ffb347'], ['#0f3540', '#6fe3ff'], ['#33122a', '#ff8fb8'], ['#1a3320', '#8dffb0']]);
      const door = r() < 0.5 ? x + 2 : x + w - 7;
      g.fillStyle = inside[0];
      g.fillRect(x + 2, ch - 12, w - 4, 10);
      g.fillStyle = inside[1];
      g.globalAlpha = 0.35;
      for (let sx = x + 3; sx < x + w - 3; sx += 3) g.fillRect(sx, ch - 9 + (sx % 2), 2, 1); // (what's on its shelves)
      g.globalAlpha = 1;
      g.fillStyle = '#0a0912';
      g.fillRect(door, ch - 11, 5, 11);
      g.fillStyle = inside[1];
      g.fillRect(door + 2, ch - 11, 1, 1); // (a light over the door)
      g.fillStyle = trim;
      g.fillRect(x + 1, ch - 13, w - 2, 1);
      if (r() < 0.4) { // (an awning, striped)
        const a = rp(r, [['#5a1a33', '#2a0f1c'], ['#14404a', '#0a2026'], ['#4a3a12', '#241c08']]);
        for (let ax = x + 1; ax < x + w - 1; ax++) { g.fillStyle = a[Math.floor(ax / 2) % 2]; g.fillRect(ax, ch - 14, 1, 2); }
      }
      const word = rp(r, WORDS.filter((s) => textW(s) <= w - 6));
      if (word) {
        const col = rp(r, NEON);
        const sx = x + Math.floor((w - textW(word)) / 2);
        world.signs.push({ kind: 'word', word, x: sx, y: ch - 22, w: textW(word), h: 5, col, faulty: r() < 0.22, on: true, next: 0 });
        g.fillStyle = '#0a0912';
        g.fillRect(sx - 2, ch - 24, textW(word) + 4, 9); // (its backing)
      }
      // the floors above: windows, AC units, a fire escape, a drain pipe
      const lit = rp(r, ['#ffcf6b', '#7fd8ff', '#ff9fd0', '#c8b8ff']);
      for (let wy = ch - 30; wy > top + 2; wy -= 6) {
        for (let wx = x + 3; wx < x + w - 4; wx += 5) {
          const on = r() < 0.4;
          g.fillStyle = on ? lit : '#0e0c18';
          g.globalAlpha = on ? 0.45 + r() * 0.4 : 1;
          g.fillRect(wx, wy, 3, 3);
          g.globalAlpha = 1;
          if (on && r() < 0.3) { g.fillStyle = '#0e0c18'; g.fillRect(wx, wy + 1, 3, 1); } // (blinds)
          if (r() < 0.12) { g.fillStyle = '#4a4e5c'; g.fillRect(wx, wy + 4, 3, 2); g.fillStyle = '#2c2f3a'; g.fillRect(wx + 1, wy + 5, 1, 1); } // (an AC unit)
        }
      }
      if (h > 34 && r() < 0.4) { // (a fire escape: its landings and the stairs between)
        const fx = x + 2 + Math.floor(r() * Math.max(1, w - 14));
        g.fillStyle = '#3a3f4e';
        for (let fy = ch - 30; fy > top + 4; fy -= 6) {
          g.fillRect(fx, fy + 4, 11, 1);
          for (let k = 0; k < 11; k += 2) g.fillRect(fx + k, fy + 2, 1, 2);
          for (let k = 0; k < 5; k++) g.fillRect(fx + 2 + k * 2 - (fy / 6) % 2, fy + 4 - k, 1, 1);
        }
      }
      g.fillStyle = '#2a2d38';
      g.fillRect(x + w - 1, top + 2, 1, h - 4); // (a drain pipe)
      if (h > 30 && r() < 0.45) { // (a neon banner hanging off it: glyphs down a tall box)
        const n = 3 + Math.floor(r() * 3);
        const bx = r() < 0.5 ? x - 3 : x + w - 4;
        const by = Math.max(top + 3, ch - 28 - n * 6);
        const col = rp(r, NEON);
        g.fillStyle = '#0a0912';
        g.fillRect(bx, by, 7, n * 6 + 2);
        g.fillStyle = '#3a3f4e';
        g.fillRect(bx + 3, by - 2, 1, 2);
        world.signs.push({ kind: 'banner', glyphs: Array.from({ length: n }, () => glyph(r)), x: bx + 1, y: by + 1, w: 5, h: n * 6, col, faulty: r() < 0.18, on: true, next: 0 });
      }
      // (on the roof: a water tank, an antenna or a dish)
      const roof = r();
      g.fillStyle = '#23263a';
      if (roof < 0.3) { g.fillRect(x + 3, top - 5, 6, 5); g.fillRect(x + 4, top - 6, 4, 1); g.fillStyle = '#16182a'; g.fillRect(x + 4, top - 2, 1, 2); g.fillRect(x + 7, top - 2, 1, 2); }
      else if (roof < 0.55) { g.fillRect(x + w - 5, top - 9, 1, 9); g.fillRect(x + w - 7, top - 7, 5, 1); }
      else if (roof < 0.75) { g.fillRect(x + 4, top - 3, 4, 1); g.fillRect(x + 3, top - 4, 1, 1); g.fillRect(x + 8, top - 4, 1, 1); g.fillRect(x + 6, top - 2, 1, 2); }
      roofs.push({ x, w, top });
      world.fronts.push({ x, w, top, door });
      x += w;
    }
    // cables strung between the roofs, sagging, lanterns hung on some
    for (let i = 0; i + 1 < roofs.length; i++) {
      if (r() < 0.45) continue;
      const a = roofs[i];
      const b = roofs[i + 1];
      const x0 = a.x + a.w - 3;
      const x1 = b.x + 3;
      const y0 = a.top + 3;
      const y1 = b.top + 3;
      const sag = 3 + r() * 5;
      const lantern = r() < 0.5 ? rp(r, ['#ff2a6d', '#ff9f1c', '#fffb6b']) : null;
      for (let cx = x0; cx <= x1; cx++) {
        const t = (cx - x0) / Math.max(1, x1 - x0);
        const cy = Math.round(y0 + (y1 - y0) * t + sag * 4 * t * (1 - t));
        g.fillStyle = '#0a0912';
        g.fillRect(cx, cy, 1, 1);
        if (lantern && (cx - x0) % 4 === 2) { g.fillStyle = lantern; g.fillRect(cx, cy + 1, 1, 2); g.fillStyle = glowCol(lantern, 0.3); g.fillRect(cx - 1, cy + 1, 3, 3); }
      }
    }
  }

  // THE SIDEWALK: wet, the signs reflected, puddles, its tiles
  function drawGround(g, cw, ch, r) {
    g.fillStyle = '#14121f';
    g.fillRect(0, 0, cw, ch);
    g.fillStyle = '#2a2540';
    g.fillRect(0, 0, cw, 1);
    g.fillStyle = '#1b1829';
    for (let x = Math.floor(r() * 7); x < cw; x += 7) g.fillRect(x, 1, 1, ch - 1);
    g.fillRect(0, 3, cw, 1);
    for (const s of world.signs) { // (each sign's color, broken in the wet)
      if (s.kind !== 'word') continue;
      for (let y = 1; y < Math.min(ch, 5); y++) for (let x = s.x - 1; x <= s.x + s.w; x++) {
        if (r() < 0.55 - y * 0.08) { g.fillStyle = glowCol(s.col, 0.18 + r() * 0.2); g.fillRect(x, y, 1, 1); }
      }
    }
    for (let i = 0, n = Math.round(cw / 60); i < n; i++) { // (puddles: darker, a glint)
      const px = Math.floor(r() * cw);
      const pw = 6 + Math.floor(r() * 8);
      const py = 2 + Math.floor(r() * 2);
      g.fillStyle = '#0c0b16';
      g.fillRect(px, py, pw, 1);
      g.fillRect(px + 1, py + 1, pw - 2, 1);
      g.fillStyle = glowCol(rp(r, NEON), 0.5);
      g.fillRect(px + 2 + Math.floor(r() * (pw - 4)), py, 2, 1);
    }
  }
  // IN FRONT: bollards, grates, bags, a cone (low: the bots' feet show over them)
  function drawNear(g, cw, ch, r) {
    for (let x = Math.floor(r() * 30); x < cw; x += 26 + Math.floor(r() * 40)) {
      const t = r();
      if (t < 0.35) { // (a bollard, its cap lit)
        g.fillStyle = '#2c2f3c'; g.fillRect(x, ch - 5, 2, 5);
        g.fillStyle = rp(r, ['#05d9e8', '#ff2a6d', '#fffb6b']); g.fillRect(x, ch - 6, 2, 1);
      } else if (t < 0.6) { // (a grate: steam comes up from it)
        g.fillStyle = '#0b0a12'; g.fillRect(x, ch - 1, 6, 1);
        g.fillStyle = '#3a3a48'; for (let k = 0; k < 6; k += 2) g.fillRect(x + k, ch - 1, 1, 1);
        world.grates.push({ x: x + 3 });
      } else if (t < 0.8) { // (a bag of rubbish)
        g.fillStyle = '#0d0d14'; g.fillRect(x, ch - 3, 4, 3); g.fillRect(x + 1, ch - 4, 2, 1);
        g.fillStyle = '#23232e'; g.fillRect(x + 1, ch - 3, 1, 1);
      } else { // (a cone)
        g.fillStyle = '#ff6a1c'; g.fillRect(x + 1, ch - 4, 1, 1); g.fillRect(x, ch - 3, 3, 2);
        g.fillStyle = '#f2f2f2'; g.fillRect(x, ch - 2, 3, 1);
        g.fillStyle = '#2a1a10'; g.fillRect(x - 1, ch - 1, 5, 1);
      }
    }
  }

  // ── What flickers and plays: the signs, the billboards, the blinking lights ──
  function paintSign(g, s) {
    g.clearRect(s.x - 1, s.y - 1, s.w + 2, s.h + 2);
    if (!s.on) { // (off: the dead glass, just made out)
      g.globalAlpha = 0.25;
    }
    if (s.on) { g.fillStyle = glowCol(s.col, 0.28); g.fillRect(s.x - 1, s.y - 1, s.w + 2, s.h + 2); }
    if (s.kind === 'word') text(g, s.word, s.x, s.y, s.on ? s.col : '#3a2a3a');
    else {
      g.fillStyle = s.on ? s.col : '#3a2a3a';
      s.glyphs.forEach((gl, i) => { for (const [gx, gy] of gl) g.fillRect(s.x + gx, s.y + i * 6 + gy, 1, 1); });
    }
    if (s.on) { g.fillStyle = 'rgba(255, 255, 255, 0.35)'; g.fillRect(s.x, s.y + (s.kind === 'word' ? 2 : 0), 1, 1); } // (a hot spot on the tube)
    g.globalAlpha = 1;
  }
  function paintBoard(g, b, now) {
    const { x, y, w, h, col } = b;
    g.clearRect(x, y, w, h);
    const t = now / 1000 + b.t;
    const off = b.glitch > now ? Math.round(rand(-2, 2)) : 0;
    g.fillStyle = glowCol(col, 0.16);
    g.fillRect(x, y, w, h);
    g.fillStyle = col;
    if (b.mode === 'logo') { // (BYTEFALL, a cursor blinking after it)
      const s = Math.floor(t) % 6 < 4 ? 'BYTEFALL' : 'DECRYPT';
      const tw = textW(s);
      if (tw <= w - 2) text(g, s, x + Math.floor((w - tw) / 2) + off, y + Math.floor((h - 5) / 2), col);
      else text(g, 'BYTE', x + Math.floor((w - textW('BYTE')) / 2) + off, y + Math.floor((h - 5) / 2), col);
    } else if (b.mode === 'bit') { // ([n], counting)
      const s = `[${1 + (Math.floor(t * 1.5) % 7)}]`;
      text(g, s, x + Math.floor((w - textW(s)) / 2) + off, y + Math.floor((h - 5) / 2), col);
    } else if (b.mode === 'eye') { // (an eye, looking about, blinking)
      const cx = x + Math.floor(w / 2) + off;
      const cy = y + Math.floor(h / 2);
      const blink = (t % 4) > 3.8;
      for (let dx = -7; dx <= 7; dx++) { const e = Math.round(Math.sqrt(Math.max(0, 1 - (dx / 7) ** 2)) * (blink ? 0 : 3)); g.fillRect(cx + dx, cy - e, 1, 1); g.fillRect(cx + dx, cy + e, 1, 1); }
      if (!blink) { const lx = Math.round(Math.sin(t * 0.9) * 3); g.fillRect(cx + lx - 1, cy - 1, 3, 3); g.fillStyle = '#05040c'; g.fillRect(cx + lx, cy, 1, 1); }
    } else if (b.mode === 'beat') { // (a beat: bars rising and falling)
      for (let i = 0; i < Math.floor((w - 2) / 3); i++) { const bh = Math.max(1, Math.round((h - 2) * (0.25 + 0.75 * Math.abs(Math.sin(t * 2.3 + i * 0.9) * Math.cos(t * 1.1 + i * 0.4))))); g.fillRect(x + 1 + i * 3 + off, y + h - 1 - bh, 2, bh); }
    } else { // (words scrolling by)
      const s = 'NEON NEVER SLEEPS // DATA IS CURRENCY // 2099 // ';
      const tw = textW(s);
      const sx = x + w - (Math.floor(t * 9) % (tw + w));
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
    for (const s of world.signs) {
      let changed = all;
      if (s.faulty && !calm && now >= s.next) { // (a faulty tube: off a moment, stuttering, back)
        s.on = !s.on;
        s.next = now + (s.on ? (Math.random() < 0.7 ? rand(40, 160) : rand(1500, 6000)) : rand(40, 220));
        changed = true;
      }
      if (changed) paintSign(front, s);
    }
    for (const b of world.boards) {
      if (!calm && Math.random() < 0.01) b.glitch = now + rand(80, 260);
      paintBoard(mid, b, calm ? 0 : now);
    }
    for (const L of world.lights) { // (the masts' red lights, blinking)
      const g = els[L.layer].getContext('2d');
      const on = calm || Math.sin(now / 600 + L.ph) > 0.2;
      g.clearRect(L.x - 1, L.y - 1, 3, 3);
      if (on) { g.fillStyle = 'rgba(255, 40, 60, 0.35)'; g.fillRect(L.x - 1, L.y - 1, 3, 3); g.fillStyle = '#ff3a4a'; g.fillRect(L.x, L.y, 1, 1); }
    }
  }

  // ── THE CROWD: pixel figures (rows of palette letters; frames for walking) ──
  const PAL = {
    K: '#06050b', h: '#1d1a2e', H: '#2a2540', B: '#000000', C: '#231f36', c: '#17142a', G: '#141220', b: '#0b0a12',
    M: '#6c7488', m: '#9aa2b6', Q: '#4a5266', q: '#5c6478', a: '#3a3f4e', D: '#3c4458', d: '#2a3042', S: '#1c1c26', J: '#191826', P: '#121220',
    X: '#6b4a2a', x: '#8a6440', p: '#5c6478',
  };
  // (e: eyes, L: an LED, v: a visor, U: the umbrella's neon, u: its canopy, s: its shaft, g: a hover glow, r: a red light, O: a droid's eye)
  const FIG = {
    hood: { w: 9, rows: ['..hhhhh..', '.hHHHHHh.', 'hHHBBBHHh', 'hHBBBBBHh', 'hHBeBeBHh', 'hHBBBBBHh', '.hHBBBHh.', 'hCCCCCCCh', 'hCCcLcCCh', 'hCCcLcCCh', 'hCCcccCCh', '.hCCCCCh.', '.hCCCCCh.'], legs: [['..G...G..', '.bb...bb.'], ['...G.G...', '...bbb...']] },
    umbrella: { w: 13, rows: ['....UUUUU....', '..UUuuuuuUU..', '.UuuuuuuuuuU.', 'UUUUUUUUUUUUU', '......s......', '......s......', '....hhhhh....', '...hHHHHHh...', '..hHHBBBHHh..', '..hHBeBeBHh..', '..hHBBBBBHh..', '...hHBBBHh...', '..hCCCCCCsh..', '..hCCcLcCCh..', '..hCCcLcCCh..', '...hCCCCCh...', '...hCCCCCh...'], legs: [['....G...G....', '...bb...bb...'], ['.....G.G.....', '.....bbb.....']] },
    robot: { w: 10, rows: ['....r.....', '....a.....', '..MMMMMM..', '.MmmmmmmM.', '.MvvvvvvM.', '.MmmmmmmM.', '..MMMMMM..', 'MMQQQQQQMM', 'M.QqqqqQ.M', 'M.QqLqqQ.M', 'p.QQQQQQ.p', '..QQ..QQ..', '..QQ..QQ..'], legs: [['.QQ....QQ.', '.KK....KK.'], ['..QQ..QQ..', '..KK..KK..']] },
    android: { w: 7, rows: ['..SSS..', '.SvvvS.', '.SSSSS.', '..SSS..', '.JJJJJ.', 'JJJLJJJ', 'J.JLJ.J', 'J.JLJ.J', 'S.JJJ.S', '..JJJ..', '..P.P..', '..P.P..', '..P.P..'], legs: [['.P...P.', 'bb...bb'], ['..P.P..', '..bbb..']] },
    droid: { w: 9, rows: ['...ddd...', '.dDDDDDd.', 'dDDDDDDDd', 'dDDoOoDDd', 'dDDDDDDDd', '.dDDDDDd.', '...ddd...'], legs: [['..g.g.g..', '...ggg...'], ['.g.g.g.g.', '..ggggg..']], hover: 3 },
    drone: { w: 9, rows: ['pp.....pp', '.aDDDDDa.', '...DrD...', '...XxX...', '...XXX...'], legs: [[], []], fly: true },
  };
  const FIG_KINDS = ['hood', 'hood', 'umbrella', 'robot', 'android', 'droid', 'drone'];
  function spawnWalker(kind, side) {
    if (!world) return;
    const f = FIG[kind = kind && FIG[kind] ? kind : pick(FIG_KINDS)];
    const dir = side ? (side === 'left' ? 1 : -1) : (Math.random() < 0.5 ? 1 : -1);
    const viewC = world.Wc * (P / world.CP); // (the view's width in the crowd's own cells)
    const camC = cam * (P / world.CP);
    const e = {
      kind, f, dir, t: 0,
      x: dir > 0 ? camC - f.w - 2 : camC + viewC + 2, // (in the crowd's cells, along the whole street)
      v: kind === 'droid' ? rand(9, 14) : kind === 'drone' ? rand(10, 16) : rand(3.2, 5.5),
      eye: pick(['#05d9e8', '#ff2a6d', '#b14aed', '#fffb6b']),
      led: pick(['#05d9e8', '#ff2a6d', '#39ff88']),
      y: kind === 'drone' ? 16 + Math.floor(rand(0, 8)) : 0,
      stop: Math.random() < 0.35 ? rand(0.25, 0.75) : null, // (stopping under a sign a while, part way across)
      wait: 0,
    };
    crowd.push(e);
  }
  function crowdTick(dt, now) {
    if (!world) return;
    const viewC = world.Wc * (P / world.CP);
    const camC = cam * (P / world.CP);
    if (now > nextWalker) {
      nextWalker = now + rand(3500, 9000);
      if (crowd.length < 5) spawnWalker();
    }
    for (const e of crowd) {
      e.t += dt;
      if (e.wait > 0) { e.wait -= dt; continue; }
      if (e.stop !== null) {
        const at = e.dir > 0 ? camC + viewC * e.stop : camC + viewC * (1 - e.stop);
        if ((e.dir > 0 && e.x >= at) || (e.dir < 0 && e.x <= at)) { e.wait = rand(3, 9); e.stop = null; continue; }
      }
      e.x += e.dir * e.v * dt;
    }
    for (let i = crowd.length - 1; i >= 0; i--) {
      const e = crowd[i];
      if (e.x < camC - e.f.w - 40 || e.x > camC + viewC + 40) crowd.splice(i, 1);
    }
  }
  function drawCrowd(now) {
    const c = els.crowd;
    const g = c.getContext('2d');
    g.clearRect(0, 0, c.width, c.height);
    const camC = cam * (P / world.CP);
    for (const e of crowd) {
      const f = e.f;
      const walking = e.wait <= 0;
      const frame = walking ? Math.floor(e.t * (e.kind === 'droid' ? 8 : 4)) % 2 : 0;
      const rows = [...f.rows, ...(f.legs[frame] || [])];
      const bob = f.hover ? Math.round(Math.sin(e.t * 3) * 1) : f.fly ? Math.round(Math.sin(e.t * 5)) : 0;
      const x0 = Math.round(e.x - camC);
      const y0 = c.height - rows.length - (f.hover || 0) - e.y + bob;
      const blink = Math.sin(now / 300 + e.x) > 0;
      for (let ry = 0; ry < rows.length; ry++) {
        const row = rows[ry];
        for (let rx = 0; rx < row.length; rx++) {
          let ch = row[e.dir > 0 ? rx : row.length - 1 - rx];
          if (ch === '.') continue;
          let col = PAL[ch];
          if (ch === 'e' || ch === 'v' || ch === 'O') col = e.eye;
          else if (ch === 'L') col = e.led;
          else if (ch === 'U') col = '#05d9e8';
          else if (ch === 'u') col = 'rgba(5, 217, 232, 0.18)';
          else if (ch === 's') col = '#8ff2ff';
          else if (ch === 'o') col = '#16324a';
          else if (ch === 'g') col = Math.random() < 0.8 ? 'rgba(255, 94, 196, 0.7)' : 'rgba(255, 94, 196, 0.3)';
          else if (ch === 'r') col = blink ? '#ff3a4a' : '#40141a';
          else if (ch === 'p' && f.fly) col = frame ? '#5c6478' : 'rgba(92, 100, 120, 0.4)';
          g.fillStyle = col;
          g.fillRect(x0 + rx, y0 + ry, 1, 1);
        }
      }
      if (e.kind === 'hood' || e.kind === 'umbrella') { // (the eyes' glow, a touch round them)
        const ey = y0 + (e.kind === 'umbrella' ? 9 : 4);
        const ex = x0 + (e.kind === 'umbrella' ? 4 : 2);
        g.fillStyle = glowCol(e.eye, 0.25);
        g.fillRect(ex, ey - 1, 5, 3);
      }
    }
  }

  // ── THE STEAM from the grates, and THE TRAFFIC in the sky ──
  function steamTick(dt, now) {
    if (!world || lowFx()) { steam.length = 0; return; }
    for (const gr of world.grates) {
      const sx = gr.x - cam;
      if (sx < -10 || sx > world.Wc + 10) continue;
      if (Math.random() < dt * (gr.alley ? 1.2 : 2.2)) steam.push({ x: gr.x + rand(-1.5, 1.5), y: gr.alley ? 4 : 1, vx: rand(-0.6, 0.6), vy: rand(2.2, 4), life: rand(2.5, 4.5), t: 0 });
    }
    for (const p of steam) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx += rand(-0.5, 0.5) * dt; }
    for (let i = steam.length - 1; i >= 0; i--) if (steam[i].t > steam[i].life) steam.splice(i, 1);
    const c = els.steam;
    const g = c.getContext('2d');
    g.clearRect(0, 0, c.width, c.height);
    for (const p of steam) {
      const a = 0.22 * (1 - p.t / p.life);
      const r = 1 + Math.floor(p.t * 0.8);
      g.fillStyle = `rgba(200, 196, 230, ${a.toFixed(3)})`;
      g.fillRect(Math.round(p.x - cam) - r, c.height - Math.round(p.y) - r, r * 2 + 1, r * 2 + 1);
    }
  }
  function trafficTick(dt, now) {
    if (!world) return;
    const c = els.traffic;
    const g = c.getContext('2d');
    const k = speedOf.towers + 0.15; // (they fly between the towers and the middle: panning a little faster than the towers)
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
      g.fillStyle = car.body;
      g.fillRect(sx, sy, 5, 2);
      g.fillRect(sx + 1, sy - 1, 3, 1);
      const head = car.dir > 0 ? sx + 5 : sx - 1;
      const tail = car.dir > 0 ? sx - 1 : sx + 5;
      g.fillStyle = '#fff6c8'; g.fillRect(head, sy, 1, 1);
      g.fillStyle = 'rgba(255, 246, 200, 0.25)'; g.fillRect(car.dir > 0 ? head + 1 : head - 4, sy, 4, 1);
      g.fillStyle = '#ff2a4a'; g.fillRect(tail, sy + 1, 1, 1);
      g.fillStyle = 'rgba(255, 42, 74, 0.3)'; g.fillRect(car.dir > 0 ? tail - 3 : tail + 1, sy + 1, 3, 1);
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
    const dt = Math.min(0.1, (now - (lastNow || now)) / 1000);
    lastNow = now;
    panTick(now);
    if (now - lastFx > 110) { lastFx = now; paintFx(now, false); }
    if (now - lastDyn > 33) {
      const ddt = Math.min(0.1, (now - (lastDyn || now)) / 1000);
      lastDyn = now;
      crowdTick(ddt, now);
      drawCrowd(now);
      steamTick(ddt, now);
      trafficTick(ddt, now);
    }
  }

  return {
    els,
    draw: (full, seed) => { if (full || !world || world.Wc !== Math.ceil(api.laneW() / P)) build(seed); },
    frame,
    // (the sandbox's buttons: a pan, someone on the street)
    cmd(c) {
      if (c === 'pan-left') return startPan(-1);
      if (c === 'pan-right') return startPan(1);
      if (c.startsWith('spawn-')) { spawnWalker(c.slice(6)); return true; }
      return false;
    },
  };
}
