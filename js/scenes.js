// SCENES: now and then the wanderers' lane becomes a place for a while (10-20 minutes), fitting the
// time of year, and the weather leans to suit it. A scene is drawn at three depths, never all of
// it in front: the FAR one behind everything (hills, the sea, a skyline), the GROUND the bots walk
// on (behind their feet: grass, sand, a sidewalk, a forest path, snow), and a few NEAR details in
// front of their feet (tufts, shells, a curb, ferns, drifts, pumpkins).
//   MEADOW     spring, summer   rolling hills and round trees; grass and flowers; tufts
//   BEACH      summer           the sea (its waves moving) and a parasol; sand; shells, a starfish
//   CITY       any time         a skyline (more windows lit at night); a sidewalk; the curb, a hydrant
//   WOODLAND   spring - autumn  leafy trees in the season's colors; a dirt path with leaf litter; ferns
//   SNOWFIELD  winter           snowy hills and pines; packed snow; drifts and twigs
//   DESERT     summer           dunes and a mesa; sand; a little cactus, pebbles
//   FARM       autumn           furrowed fields and a red barn; soil and straw; pumpkins
// Not while the fog or OCTOBER's HAUNTED FOREST is out (they have their own). Pixels in the bots'
// own size; darker at night. The dev page's SCENE (or ?scene=) brings them OFTEN or keeps one.
const SCENE_KINDS = ['meadow', 'beach', 'city', 'woodland', 'snowfield', 'desert', 'farm', 'lake'];
const SCENE_NAMES = { meadow: 'MEADOW', beach: 'BEACH', city: 'CITY', woodland: 'WOODLAND', snowfield: 'SNOWFIELD', desert: 'DESERT', farm: 'FARM', lake: 'LAKE' };
// (the weather each suits, which comes more while it's out; and what never comes with it)
const SCENE_FITS = {
  lake: { fits: ['sunny', 'sunrise', 'sunset', 'drizzle', 'overcast', 'fireflies', 'moon', 'wind', 'fluff', 'pollen', 'meteors'], never: ['duststorm', 'blizzard', 'thundersnow'] },
  meadow: { fits: ['sunny', 'pollen', 'fluff', 'wind', 'sunrise', 'sunset', 'drizzle', 'rain', 'sunshower', 'rainbow', 'fireflies', 'moon'], never: ['blizzard', 'duststorm', 'thundersnow'] },
  beach: { fits: ['sunny', 'heatwave', 'sunset', 'sunrise', 'sunshower', 'storm', 'meteors', 'moon'], never: ['snow', 'flurries', 'blizzard', 'sleet', 'thundersnow', 'diamonddust', 'duststorm'] },
  city: { fits: ['rain', 'drizzle', 'storm', 'overcast', 'snow', 'flurries', 'heatlightning', 'moon', 'sunset'], never: ['duststorm', 'pollen'] },
  woodland: { fits: ['wind', 'drizzle', 'rain', 'overcast', 'fireflies', 'flurries', 'sunrise'], never: ['duststorm', 'heatwave'] },
  snowfield: { fits: ['snow', 'flurries', 'blizzard', 'diamonddust', 'aurora', 'moon', 'sunny', 'sunrise'], never: ['pollen', 'fluff', 'heatwave', 'duststorm', 'fireflies', 'rain', 'storm'] },
  desert: { fits: ['duststorm', 'heatwave', 'sunny', 'meteors', 'sunset', 'wind'], never: ['snow', 'flurries', 'blizzard', 'sleet', 'thundersnow', 'diamonddust', 'pollen'] },
  farm: { fits: ['overcast', 'drizzle', 'wind', 'sunset', 'moon', 'rain', 'flurries'], never: ['duststorm', 'heatwave'] },
};
const SCENE_SEASONS = {
  winter: [['snowfield', 3], ['city', 2]],
  spring: [['meadow', 3], ['woodland', 2], ['lake', 2], ['city', 1.5]],
  summer: [['beach', 3], ['lake', 2.5], ['meadow', 2], ['desert', 1.5], ['city', 1]],
  autumn: [['woodland', 3], ['farm', 2.5], ['lake', 1.5], ['city', 1.5]],
};
function sceneForced() {
  let v = null;
  try { v = new URLSearchParams(location.search).get('scene') || localStorage.getItem('bytefall-dev-scene'); } catch (e) { v = null; }
  return v && v !== 'auto' ? v : null;
}

function createScenes(api) {
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (list) => list[Math.floor(Math.random() * list.length)];
  const P = 34 / 16; // (the bots' own pixel)
  const game = () => api.lane.classList.contains('game-walkers');
  const night = () => { const h = new Date().getHours(); return h >= 20 || h < 6; };
  const season = () => (typeof weatherSeason === 'function' ? weatherSeason() : 'autumn');
  let sc = null; // { kind, at, until, els, seed, drawnW }
  const often = () => !!sceneForced();
  let nextCheck = performance.now() + (often() ? rand(1500, 3000) : rand(90000, 240000));

  function choose() {
    const f = sceneForced();
    if (SCENE_KINDS.includes(f)) return f;
    const opts = SCENE_SEASONS[season()] || SCENE_SEASONS.autumn;
    let r = Math.random() * opts.reduce((a, [, w]) => a + w, 0);
    for (const [k, w] of opts) if ((r -= w) <= 0) return k;
    return opts[0][0];
  }
  function canvas(cls) {
    const c = document.createElement('canvas');
    c.className = `scene-layer ${cls}`;
    c.setAttribute('aria-hidden', 'true');
    api.lane.appendChild(c);
    return c;
  }
  function start(kind, ms) {
    if (sc) end(true);
    if (!SCENE_KINDS.includes(kind)) return;
    const now = performance.now();
    sc = { dockSide: Math.random() < 0.5 ? 1 : -1, kind, at: now, until: now + (ms || rand(600000, 1200000)), seed: Math.floor(Math.random() * 1e9), els: { far: canvas('scene-far'), ground: canvas('scene-ground'), near: canvas('scene-near') }, drawnW: 0, wave: 0, night: night() };
    draw(true);
    requestAnimationFrame(() => requestAnimationFrame(() => { if (sc) Object.values(sc.els).forEach((e) => { e.style.opacity = '1'; }); }));
    api.botEvent(`scene-${kind}`);
    api.fitWeather(SCENE_FITS[kind].fits); // (and weather to suit, if none's out)
  }
  function end(now = false) {
    if (!sc) return;
    if (fish) fishEnd(true); // (packed up: the place is going)
    const els = Object.values(sc.els);
    sc = null;
    if (now) { els.forEach((e) => e.remove()); return; }
    els.forEach((e) => { e.style.opacity = '0'; });
    setTimeout(() => els.forEach((e) => e.remove()), 5000);
  }

  // (a seeded random for a scene's layout: the same as it redraws)
  function rng(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function prep(c, hCells, W) {
    const cw = Math.ceil(W / P);
    const ch = hCells;
    if (c.width !== cw || c.height !== ch) { c.width = cw; c.height = ch; }
    c.style.height = `${ch * P}px`;
    const g = c.getContext('2d');
    g.clearRect(0, 0, cw, ch);
    return { g, cw, ch };
  }
  // (a color darkened for the night)
  const dim = (hex, k) => {
    if (!k) return hex;
    const n = parseInt(hex.slice(1), 16);
    const f = 1 - k;
    return `rgb(${Math.round(((n >> 16) & 255) * f)}, ${Math.round(((n >> 8) & 255) * f)}, ${Math.round((n & 255) * f)})`;
  };

  function draw(full) {
    const W = api.laneW();
    if (!W || !sc) return;
    const H = api.laneH();
    const farCells = Math.round((game() ? H * 0.42 : Math.min(H * 0.17, 140)) / P);
    const N = sc.night ? 0.45 : 0;
    const S = season();
    const { far, ground, near } = sc.els;
    if (DOCK[sc.kind]) { // (the pier, in the lane's own pixels: the fishing walks it)
      const D = DOCK[sc.kind];
      const FH = farCells * P;
      const side = sc.dockSide;
      const x0 = W * (side > 0 ? 0.4 : 0.6);
      sc.dock = { side, x0, x1: x0 + side * 9 * P, x2: W * (side > 0 ? 0.82 : 0.18), top: (1 - D.top) * FH, water: (1 - D.top) * FH - 3 * P, W };
    }
    if (full || sc.drawnW !== W) {
      sc.drawnW = W;
      const r = rng(sc.seed);
      drawFar(prep(far, farCells, W), r, N, S);
      drawGround(prep(ground, 5, W), rng(sc.seed + 1), N, S);
      drawNear(prep(near, 6, W), rng(sc.seed + 2), N, S);
    } else if (sc.kind === 'beach' || sc.kind === 'lake') drawFar(prep(far, farCells, W), rng(sc.seed), N, S); // (the waves moving)
  }

  // THE PIER (the lake's and the beach's): out over the water from steps up off the shore; top: where
  // its boards are, down the far layer (0 its top, 1 the floor)
  const DOCK = { lake: { top: 0.66 }, beach: { top: 0.7 } };
  function pier(o, N) {
    const { g, cw, ch } = o;
    const d = sc.dock;
    if (!d) return;
    const c = (px) => Math.round(px / P);
    const pr = Math.round(ch * DOCK[sc.kind].top);
    const a = Math.min(c(d.x1), c(d.x2));
    const b = Math.max(c(d.x1), c(d.x2));
    for (let x = a; x <= b; x += 6) { g.fillStyle = dim('#5a4028', N); g.fillRect(x, pr + 2, 1, ch - pr - 2); } // (its posts)
    g.fillStyle = dim('#8a6440', N);
    g.fillRect(a, pr, b - a + 1, 2);
    g.fillStyle = dim('#a87c50', N);
    g.fillRect(a, pr, b - a + 1, 1);
    g.fillStyle = dim('#6b4a2e', N);
    for (let x = a + 2; x < b; x += 3) g.fillRect(x, pr + 1, 1, 1); // (the boards' joints)
    const steps = 4; // (steps up from the shore)
    const s0 = c(d.x0);
    const s1 = c(d.x1);
    for (let j = 0; j < steps; j++) {
      const xa = Math.round(s0 + ((s1 - s0) * j) / steps);
      const xb = Math.round(s0 + ((s1 - s0) * (j + 1)) / steps);
      const y = Math.round(ch - 5 - ((ch - 5 - pr) * (j + 1)) / steps);
      g.fillStyle = dim('#8a6440', N);
      g.fillRect(Math.min(xa, xb), y, Math.abs(xb - xa) + 1, 1);
      g.fillStyle = dim('#5a4028', N);
      g.fillRect(Math.min(xa, xb), y + 1, Math.abs(xb - xa) + 1, ch - y - 1);
    }
  }
  const rp = (r, list) => list[Math.floor(r() * list.length)]; // (a seeded pick: the same as it redraws)
  // THE FAR LAYER: behind everything
  function hills(o, r, base, amp, col, freq) {
    const { g, cw, ch } = o;
    const ph = r() * 10;
    g.fillStyle = col;
    for (let x = 0; x < cw; x++) {
      const y = Math.round(ch - base - amp * (0.5 + 0.5 * Math.sin(x * freq + ph)) - amp * 0.35 * Math.sin(x * freq * 2.7 + ph * 2));
      g.fillRect(x, y, 1, ch - y);
    }
  }
  function blob(g, cx, cy, rad, col) {
    g.fillStyle = col;
    for (let y = -rad; y <= rad; y++) for (let x = -rad; x <= rad; x++) if (x * x + y * y <= rad * rad + rad * 0.5) g.fillRect(cx + x, cy + y, 1, 1);
  }
  function pine(g, x, base, h, col, snow) {
    for (let i = 0; i < h; i++) {
      const w = Math.max(0, Math.floor((i / h) * (h * 0.45)));
      g.fillStyle = snow && i % 3 === 0 ? snow : col;
      g.fillRect(x - w, base - h + i, w * 2 + 1, 1);
    }
    g.fillStyle = '#3a2c1e';
    g.fillRect(x, base, 1, 1);
  }
  function drawFar(o, r, N, S) {
    const { g, cw, ch } = o;
    const k = sc.kind;
    if (k === 'meadow') {
      hills(o, r, ch * 0.25, ch * 0.35, dim('#2f5d46', N + 0.15), 0.035);
      hills(o, r, ch * 0.08, ch * 0.22, dim('#3f7d45', N), 0.06);
      for (let i = 0, n = Math.round(cw / 26); i < n; i++) { // (round trees on the near hill)
        const x = Math.round(r() * cw);
        const base = ch - Math.round(ch * 0.12 + r() * ch * 0.1);
        g.fillStyle = dim('#4a3524', N);
        g.fillRect(x, base - 2, 1, 3);
        blob(g, x, base - 4, 2 + Math.round(r()), dim(S === 'summer' ? '#2f7a33' : '#5aa84a', N));
      }
    } else if (k === 'beach') {
      const sea = Math.round(ch * 0.4);
      for (let y = ch - sea; y < ch; y++) {
        g.fillStyle = dim(y < ch - sea + 2 ? '#3a86b4' : '#2a6f9a', N);
        g.fillRect(0, y, cw, 1);
      }
      sc.wave = (sc.wave + 1) % 1000;
      g.fillStyle = dim('#8fc6e4', N);
      for (let y = ch - sea + 3; y < ch; y += 3) for (let x = (y * 7 + sc.wave) % 11; x < cw; x += 11) g.fillRect(x, y, 3, 1);
      g.fillStyle = dim('#f2f2f2', N); // (a sail far out)
      const sx = Math.round(cw * (0.2 + r() * 0.6));
      for (let i = 0; i < 4; i++) g.fillRect(sx, ch - sea - 4 + i, Math.max(1, i), 1);
      // a parasol, standing in the sand at the foot of the far layer
      const px = Math.round(cw * (0.15 + r() * 0.7));
      const cols = [['#e0455f', '#f7f2e8'], ['#3a7bd5', '#f7f2e8'], ['#ffd23f', '#e08a1e']][Math.floor(r() * 3)];
      g.fillStyle = dim('#6b5a3e', N);
      g.fillRect(px, ch - 9, 1, 9);
      for (let i = 0; i < 4; i++) for (let x = -i * 2 - 1; x <= i * 2 + 1; x++) { g.fillStyle = dim(cols[Math.floor((x + 9) / 2) % 2], N); g.fillRect(px + x, ch - 13 + i, 1, 1); }
      pier(o, N);
    } else if (k === 'lake') { // (a woodsy lake: the trees on the far shore, the still water, reeds, lily pads)
      const C = { spring: ['#6fbf4f', '#5aa84a'], summer: ['#2f7a33', '#3f8f3a'], autumn: ['#c9661e', '#e8a33c', '#b8401f'], winter: ['#6f6250', '#8a7a62'] }[S] || ['#3f8f3a'];
      const shore = Math.round(ch * 0.5);
      for (let x = Math.round(r() * 4); x < cw; x += 4 + Math.round(r() * 4)) {
        const h = Math.round(ch * (0.12 + r() * 0.2));
        g.fillStyle = dim('#3d2b1c', N + 0.2);
        g.fillRect(x, shore - h + 2, 1, h - 2);
        blob(g, x, shore - h + 2, 2 + Math.round(r() * 2), dim(rp(r, C), N + 0.2));
      }
      for (let y = shore; y < ch; y++) { g.fillStyle = dim(y < shore + 1 ? '#3f7f95' : '#2f6f86', N); g.fillRect(0, y, cw, 1); }
      sc.wave = (sc.wave + 1) % 1000;
      g.fillStyle = dim('#6fa8bc', N);
      for (let y = shore + 3; y < ch; y += 4) for (let x = (y * 5 + Math.floor(sc.wave / 2)) % 13; x < cw; x += 13) g.fillRect(x, y, 2, 1);
      const rr = rng(sc.seed + 9); // (the reeds and lily pads stay put while the water moves)
      for (let i = 0, n = Math.round(cw / 30); i < n; i++) { const x = Math.round(rr() * cw); for (let j = 0; j < 4; j++) { g.fillStyle = dim('#4a7a3a', N); g.fillRect(x + j * 2, shore - 2 - Math.round(rr() * 3), 1, 5); } }
      for (let i = 0, n = Math.round(cw / 40); i < n; i++) { const x = Math.round(rr() * cw); const y = shore + 3 + Math.round(rr() * (ch - shore - 8)); g.fillStyle = dim('#3f8a3e', N); g.fillRect(x, y, 3, 1); g.fillRect(x + 1, y - 1, 1, 1); }
      pier(o, N);
    } else if (k === 'city') {
      let x = 0;
      while (x < cw) { // (a skyline of blocks, windows lit: most at night)
        const w = 6 + Math.round(r() * 10);
        const h = Math.round(ch * (0.35 + r() * 0.6));
        g.fillStyle = dim(r() < 0.5 ? '#1c2230' : '#262e40', N * 0.5);
        g.fillRect(x, ch - h, w, h);
        for (let wy = ch - h + 2; wy < ch - 2; wy += 3) for (let wx = x + 1; wx < x + w - 1; wx += 2) {
          if (r() < (sc.night ? 0.45 : 0.12)) { g.fillStyle = sc.night ? '#f2d36b' : '#4a5570'; g.fillRect(wx, wy, 1, 1); }
        }
        x += w + Math.round(r() * 2);
      }
    } else if (k === 'woodland') {
      const C = { spring: ['#6fbf4f', '#5aa84a', '#8fd16a'], summer: ['#2f7a33', '#3f8f3a', '#4fa845'], autumn: ['#c9661e', '#e8a33c', '#b8401f', '#8c5a2b'], winter: ['#6f6250', '#8a7a62'] }[S] || ['#3f8f3a'];
      for (const [depth, dk] of [[0.55, 0.35], [0.3, 0.15], [0.1, 0]]) { // (rows of trees, the far ones darker and higher)
        for (let x = Math.round(r() * 6); x < cw; x += 7 + Math.round(r() * 6)) {
          const base = ch - Math.round(ch * depth * 0.5);
          const h = Math.round(ch * (0.3 + r() * 0.25));
          g.fillStyle = dim('#3d2b1c', N + dk);
          g.fillRect(x, base - h + 3, 1, h - 3);
          blob(g, x, base - h + 2, 3 + Math.round(r() * 2), dim(rp(r, C), N + dk));
        }
      }
    } else if (k === 'snowfield') {
      hills(o, r, ch * 0.2, ch * 0.3, dim('#b9c6d6', N), 0.03);
      hills(o, r, ch * 0.05, ch * 0.2, dim('#dfe7f0', N), 0.05);
      for (let i = 0, n = Math.round(cw / 14); i < n; i++) pine(g, Math.round(r() * cw), ch - Math.round(ch * (0.08 + r() * 0.15)), 7 + Math.round(r() * 6), dim('#2c4a3a', N), dim('#e8eef5', N));
    } else if (k === 'desert') {
      const mx = Math.round(cw * (0.15 + r() * 0.6)); // (a mesa, flat-topped)
      const mw = 14 + Math.round(r() * 14);
      const mh = Math.round(ch * 0.5);
      g.fillStyle = dim('#a8643a', N);
      g.fillRect(mx, ch - mh, mw, mh);
      g.fillRect(mx - 3, ch - mh + 4, mw + 6, mh - 4);
      hills(o, r, ch * 0.1, ch * 0.2, dim('#c48a48', N), 0.045);
      hills(o, r, 0, ch * 0.14, dim('#d9a35f', N), 0.07);
    } else if (k === 'farm') {
      for (let y = Math.round(ch * 0.6); y < ch; y++) { g.fillStyle = dim(y % 2 ? '#6b5a2e' : '#5a4a25', N); g.fillRect(0, y, cw, 1); }
      const bx = Math.round(cw * (0.1 + r() * 0.7)); // (the barn: red, its roof, a white X on the door)
      const by = Math.round(ch * 0.6);
      g.fillStyle = dim('#8a2f24', N);
      g.fillRect(bx, by - 10, 14, 10);
      for (let i = 0; i < 5; i++) g.fillRect(bx + 2 + i, by - 15 + i, 10 - i * 2 + (i ? 0 : 0), 1);
      g.fillStyle = dim('#4a2a20', N);
      for (let i = 0; i < 5; i++) { g.fillRect(bx + i - 1, by - 11 - (4 - i), 1, 1); g.fillRect(bx + 14 - i, by - 11 - (4 - i), 1, 1); }
      g.fillStyle = dim('#e8e0d0', N);
      for (let i = 0; i < 5; i++) { g.fillRect(bx + 5 + i, by - 5 + i, 1, 1); g.fillRect(bx + 9 - i, by - 5 + i, 1, 1); }
      g.fillStyle = dim('#7a5c3a', N); // (a fence along the field's edge)
      for (let x = 0; x < cw; x += 5) g.fillRect(x, by - 2, 1, 3);
      g.fillRect(0, by - 1, cw, 1);
    }
  }

  // THE GROUND: the strip the bots stand on (behind their feet)
  function drawGround(o, r, N, S) {
    const { g, cw, ch } = o;
    const k = sc.kind;
    const fill = (col) => { g.fillStyle = dim(col, N); g.fillRect(0, 0, cw, ch); };
    const dots = (cols, density) => { for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) if (r() < density) { g.fillStyle = dim(rp(r, cols), N); g.fillRect(x, y, 1, 1); } };
    if (k === 'lake') { fill('#4f8a4a'); dots(['#3f7a3e', '#6b5a3e', '#5a9a52'], 0.3); dots(['#9a9a9a', '#b0a898'], 0.03); }
    else if (k === 'meadow') { fill('#4f9a4a'); dots(['#3f8a3e', '#5fb85a'], 0.25); dots(['#ffe066', '#ffffff', '#f39ac0'], 0.03); }
    else if (k === 'beach') { fill('#d9c08a'); g.fillStyle = dim('#b89b6a', N); g.fillRect(0, 0, cw, 1); dots(['#c4a873', '#e6d3a2'], 0.2); }
    else if (k === 'city') {
      fill('#5b6170');
      g.fillStyle = dim('#7a808e', N);
      g.fillRect(0, 0, cw, 1);
      g.fillStyle = dim('#474c59', N);
      for (let x = Math.round(r() * 8); x < cw; x += 9) g.fillRect(x, 1, 1, ch - 1);
      dots(['#525866'], 0.08);
    } else if (k === 'woodland') {
      fill('#6b4f35');
      dots(['#5a4230', '#7a5c3e'], 0.25);
      const C = { spring: ['#6fbf4f', '#8fd16a'], summer: ['#2f7a33', '#4fa845'], autumn: ['#d2691e', '#e8a33c', '#b8401f', '#c9a227'], winter: ['#8a7a62', '#a39276'] }[S] || ['#4fa845'];
      dots(C, 0.12);
    } else if (k === 'snowfield') { fill('#eef3f8'); dots(['#c8d4e2', '#dfe7f0'], 0.18); }
    else if (k === 'desert') { fill('#e0b070'); dots(['#cf9c5c', '#ecc488'], 0.22); }
    else if (k === 'farm') { fill('#5a3f28'); dots(['#4a3220', '#6b4f35'], 0.25); dots(['#d9c27a', '#e8d590'], 0.06); }
  }

  // THE NEAR DETAILS: a few, in front of the bots' feet
  function drawNear(o, r, N, S) {
    const { g, cw, ch } = o;
    const k = sc.kind;
    const put = (x, y, col) => { if (x >= 0 && x < cw && y >= 0 && y < ch) { g.fillStyle = dim(col, N); g.fillRect(x, y, 1, 1); } };
    const every = (lo, hi, fn) => { for (let x = Math.round(r() * hi); x < cw; x += lo + Math.round(r() * (hi - lo))) fn(x); };
    if (k === 'lake') every(9, 20, (x) => { // (cattails and stones at the water's edge)
      if (r() < 0.6) { for (let i = 0; i < 5; i++) put(x, ch - 1 - i, '#5a8a3a'); put(x, ch - 6, '#6b4428'); put(x, ch - 7, '#6b4428'); put(x + 2, ch - 1, '#5a8a3a'); put(x + 2, ch - 2, '#5a8a3a'); put(x + 2, ch - 3, '#5a8a3a'); }
      else { put(x, ch - 1, '#8a8a8a'); put(x + 1, ch - 1, '#a0a0a0'); put(x + 1, ch - 2, '#8a8a8a'); }
    });
    else if (k === 'meadow') every(7, 16, (x) => { // (tufts of grass, now and then a flower in one)
      for (const [dx, h] of [[0, 3], [1, 4], [2, 2]]) for (let i = 0; i < h; i++) put(x + dx, ch - 1 - i, i === h - 1 ? '#7fd06a' : '#5fb85a');
      if (r() < 0.35) put(x + 1, ch - 5, rp(r, ['#ffe066', '#f39ac0', '#ffffff']));
    });
    else if (k === 'beach') every(10, 24, (x) => {
      if (r() < 0.15) { for (const [dx, dy] of [[1, 0], [0, 1], [1, 1], [2, 1], [0, 2], [2, 2]]) put(x + dx, ch - 3 + dy, '#e8774a'); } // (a starfish)
      else { put(x, ch - 1, '#f2e3d0'); put(x + 1, ch - 1, '#e0c8b0'); put(x, ch - 2, '#f2e3d0'); } // (a shell)
    });
    else if (k === 'city') {
      for (let x = 0; x < cw; x++) put(x, ch - 1, '#8a8f9a'); // (the curb)
      if (r() < 0.8) { // (a hydrant)
        const x = Math.round(cw * (0.1 + r() * 0.8));
        for (let i = 1; i < 5; i++) { put(x, ch - 1 - i, '#c8402f'); put(x + 1, ch - 1 - i, '#a8321f'); }
        put(x - 1, ch - 3, '#c8402f'); put(x + 2, ch - 3, '#a8321f'); put(x, ch - 6, '#c8402f');
      }
    } else if (k === 'woodland') every(9, 20, (x) => {
      if (r() < 0.25) { for (const dx of [0, 1, 2]) put(x + dx, ch - 3, '#d0342c'); put(x + 1, ch - 3, '#ffffff'); put(x + 1, ch - 2, '#efe6d8'); put(x + 1, ch - 1, '#efe6d8'); } // (a mushroom)
      else for (let i = 0; i < 4; i++) { put(x + i, ch - 1 - Math.round(Math.sin((i / 3) * Math.PI) * 3), '#3f8a3e'); put(x + i, ch - 1, '#2f6a2e'); } // (a fern)
    });
    else if (k === 'snowfield') every(8, 18, (x) => {
      if (r() < 0.3) { put(x, ch - 2, '#5a4632'); put(x + 1, ch - 3, '#5a4632'); put(x + 2, ch - 2, '#5a4632'); } // (a twig)
      else for (let i = -2; i <= 2; i++) for (let j = 0; j < 2 - Math.abs(i) / 2; j++) put(x + i, ch - 1 - j, '#f6f9fc'); // (a drift)
    });
    else if (k === 'desert') every(14, 30, (x) => {
      if (r() < 0.45) { for (let i = 0; i < 5; i++) put(x, ch - 1 - i, '#4f8a3a'); put(x - 1, ch - 3, '#4f8a3a'); put(x - 1, ch - 4, '#4f8a3a'); put(x + 1, ch - 2, '#4f8a3a'); put(x + 1, ch - 3, '#4f8a3a'); } // (a little cactus)
      else { put(x, ch - 1, '#9a7a5a'); put(x + 1, ch - 1, '#8a6a4a'); }
    });
    else if (k === 'farm') every(12, 28, (x) => {
      if (r() < 0.5) { for (let dx = 0; dx < 3; dx++) for (let dy = 0; dy < 2; dy++) put(x + dx, ch - 1 - dy, dx === 1 && dy === 0 ? '#c9661e' : '#e8822a'); put(x + 1, ch - 3, '#4f8a3a'); } // (a pumpkin)
      else { put(x, ch - 1, '#d9c27a'); put(x + 1, ch - 2, '#d9c27a'); put(x + 2, ch - 1, '#e8d590'); } // (straw)
    });
  }


  // GONE FISHING (the LAKE and the BEACH): now and then a bot walks out along the pier, casts, and
  // waits; the bobber bobs, nibbles, and goes under; it reels in a fish (held up, pleased, tossed
  // back) or now and then an old boot (put out), and casts again or heads back. Tap the BOBBER and
  // the fish is gone: the bot's upset. Poke the bot and it shushes you.
  const U = 34 / 16; // (a pixel of the bot's own grid)
  const SVGNS = 'http://www.w3.org/2000/svg';
  let fish = null;
  let nextFish = performance.now() + rand(4000, 9000);
  const FISH_ART = { // (what comes up on the line: a fish, or a boot)
    fish: { w: 7, h: 4, px: [[1, 0, '#9fb8c8'], [2, 0, '#9fb8c8'], [3, 0, '#9fb8c8'], [0, 1, '#9fb8c8'], [1, 1, '#22303a'], [2, 1, '#9fb8c8'], [3, 1, '#9fb8c8'], [4, 1, '#9fb8c8'], [5, 1, '#7f98a8'], [6, 0, '#7f98a8'], [6, 2, '#7f98a8'], [1, 2, '#dfe8ee'], [2, 2, '#dfe8ee'], [3, 2, '#dfe8ee'], [4, 2, '#9fb8c8'], [5, 2, '#7f98a8'], [2, 3, '#7f98a8']] },
    gold: { w: 7, h: 4, px: [[1, 0, '#ffb000'], [2, 0, '#ffb000'], [3, 0, '#ffb000'], [0, 1, '#ffb000'], [1, 1, '#22303a'], [2, 1, '#ffd23f'], [3, 1, '#ffd23f'], [4, 1, '#ffb000'], [5, 1, '#e08a1e'], [6, 0, '#e08a1e'], [6, 2, '#e08a1e'], [1, 2, '#fff3a0'], [2, 2, '#fff3a0'], [3, 2, '#ffd23f'], [4, 2, '#ffb000'], [5, 2, '#e08a1e'], [2, 3, '#e08a1e']] },
    boot: { w: 5, h: 5, px: [[1, 0, '#5a4028'], [2, 0, '#5a4028'], [1, 1, '#6b4a2e'], [2, 1, '#6b4a2e'], [1, 2, '#6b4a2e'], [2, 2, '#6b4a2e'], [0, 3, '#6b4a2e'], [1, 3, '#6b4a2e'], [2, 3, '#6b4a2e'], [3, 3, '#6b4a2e'], [4, 3, '#6b4a2e'], [0, 4, '#3a2a1a'], [1, 4, '#3a2a1a'], [2, 4, '#3a2a1a'], [3, 4, '#3a2a1a'], [4, 4, '#3a2a1a']] },
  };
  const artSvg = (a, k = 1) => `<svg viewBox="0 0 ${a.w} ${a.h}" width="${a.w * U * k}" height="${a.h * U * k}" shape-rendering="crispEdges">${a.px.map(([x, y, c]) => `<rect x="${x}" y="${y}" width="1" height="1" fill="${c}"/>`).join('')}</svg>`;
  // (the rod in the bot's own pixels, out over the water the way it faces)
  function rodSvg(side) {
    const cells = [];
    for (let i = 0; i < 9; i++) cells.push([13 + i, 10 - i, i < 3 ? '#4a3422' : '#6b4a2a']);
    cells.push([12, 10, '#9aa3ae'], [12, 11, '#9aa3ae']);
    return `<g class="fish-rod">${cells.map(([x, y, c]) => `<rect x="${side > 0 ? x : 15 - x}" y="${y}" width="1" height="1" fill="${c}"/>`).join('')}</g>`;
  }
  const lanePx = () => ({ W: api.laneW(), H: api.lane.clientHeight });
  // (the dock's rise under a bot: up the steps, then the boards' height)
  function liftAt(w) {
    const d = sc && sc.dock;
    if (!d) return 0;
    const cx = w.x + 17;
    const t = (cx - d.x0) / (d.x1 - d.x0);
    return Math.max(0, Math.min(1, t)) * d.top;
  }
  function fishStart() {
    const d = sc.dock;
    const { W } = lanePx();
    const free = api.walkers().filter((w) => !w.claimed && !w.leaving && w.x > 0 && w.x < W - 34 && (w.state === 'idle' || w.state === 'walk'));
    if (!free.length) return;
    const w = pick(free);
    if (!api.claim(w, () => fishPoked())) return;
    fish = { w, phase: 'out', side: d.side, casts: 0 };
    api.say(w, 'happy', pick(['fishing!', '♪', '']));
    api.go(w, d.x0 - 17, () => api.go(w, d.side > 0 ? d.x2 - 36 : d.x2 + 2, cast));
    api.botEvent('fishing');
  }
  function tip() { // (the rod's tip, in the lane: x across, y up from the floor)
    const { w, side } = fish;
    return { x: w.x + (side > 0 ? 21.5 : -5.5) * U, y: liftAt(w) + (17 - 2.5) * U };
  }
  function overlay() {
    if (fish.svg) return;
    const svg = document.createElementNS(SVGNS, 'svg');
    svg.setAttribute('class', 'fish-line');
    svg.setAttribute('aria-hidden', 'true');
    svg.innerHTML = '<path fill="none" stroke="rgba(230, 236, 240, 0.7)" stroke-width="1"/>';
    api.lane.appendChild(svg);
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'fish-bobber';
    b.setAttribute('aria-label', 'The bobber');
    b.innerHTML = '<span></span>';
    b.addEventListener('pointerdown', (e) => { e.stopPropagation(); bobberTapped(); });
    api.lane.appendChild(b);
    fish.svg = svg;
    fish.bob = b;
  }
  function cast() {
    if (!fish) return;
    const { w, side } = fish;
    const d = sc.dock;
    const { W } = lanePx();
    api.turn(w, side);
    if (!w.el.querySelector('.fish-rod')) w.el.querySelector('svg').insertAdjacentHTML('beforeend', rodSvg(side));
    overlay();
    const lo = side > 0 ? Math.min(W - 16, d.x2 + 14) : 16;
    const hi = side > 0 ? W - 16 : Math.max(16, d.x2 - 14);
    fish.target = { x: rand(lo, hi), y: d.water };
    fish.from = tip();
    fish.phase = 'cast';
    fish.at = performance.now();
    fish.casts++;
    api.say(w, 'idle', '');
  }
  function splash(x, y) {
    const sp = document.createElement('span');
    sp.className = 'fish-splash';
    sp.setAttribute('aria-hidden', 'true');
    sp.style.left = `${x.toFixed(0)}px`;
    sp.style.bottom = `${y.toFixed(0)}px`;
    api.lane.appendChild(sp);
    setTimeout(() => sp.remove(), 700);
  }
  function bobberTapped() { // (scared off: the fish is gone, and the bot's upset with you)
    if (!fish || !['wait', 'nibble', 'bite', 'reel'].includes(fish.phase)) return;
    const { w } = fish;
    splash(fish.bx, fish.by);
    fish.phase = 'lost';
    fish.at = performance.now();
    fish.from = { x: fish.bx, y: fish.by };
    api.say(w, 'annoyed', pick(['hey!', 'aw!', 'my fish!', '>:(', 'NOOO']));
    w.el.classList.add('headshaking');
    setTimeout(() => w.el.classList.remove('headshaking'), 900);
    api.botEvent('fish-lost');
  }
  function fishPoked() { if (fish) api.say(fish.w, 'annoyed', pick(['shh!', 'shhh', '...!'])); }
  function showCatch(kind) {
    const c = document.createElement('div');
    c.className = `fish-catch${kind === 'boot' ? '' : ' wiggle'}`;
    c.setAttribute('aria-hidden', 'true');
    c.innerHTML = artSvg(FISH_ART[kind]);
    api.lane.appendChild(c);
    fish.catch = c;
    fish.catchKind = kind;
  }
  function placeCatch(x, y) {
    if (!fish.catch) return;
    const a = FISH_ART[fish.catchKind];
    fish.catch.style.left = `${(x - (a.w * U) / 2).toFixed(0)}px`;
    fish.catch.style.bottom = `${(y - a.h * U).toFixed(0)}px`;
  }
  function packUp(then) { // (rod away, line in, back down off the dock)
    if (!fish) return;
    const { w } = fish;
    if (fish.svg) fish.svg.remove();
    if (fish.bob) fish.bob.remove();
    if (fish.catch) fish.catch.remove();
    fish.svg = fish.bob = fish.catch = null;
    const rod = w.el.querySelector('.fish-rod');
    if (rod) rod.remove();
    if (then) then();
  }
  function fishEnd(now) {
    if (!fish) return;
    const f = fish;
    packUp();
    if (now || !sc || !sc.dock) { api.release(f.w); fish = null; return; }
    f.phase = 'back';
    api.go(f.w, sc.dock.x0 - 17 - sc.dock.side * 20, () => { api.release(f.w); if (fish === f) fish = null; });
  }
  function fishTick(now) {
    const d = sc && sc.dock;
    if (!d) { if (fish) fishEnd(true); return; }
    if (!fish) {
      if (now > nextFish) { nextFish = now + (often() ? rand(2000, 4000) : rand(15000, 40000)); if (often() || Math.random() < 0.75) fishStart(); }
      return;
    }
    const { w } = fish;
    // (taken away from it: startled off, or gone)
    if (!w.claimed || w.leaving || !['walk', 'held'].includes(w.state) || !api.walkers().includes(w)) { const f = fish; packUp(); api.release(f.w); fish = null; return; }
    api.lift(w, liftAt(w));
    if (!fish.svg) return;
    const { H } = lanePx();
    const age = now - fish.at;
    const t = tip();
    let bx = fish.target.x;
    let by = fish.target.y;
    let sag = 6;
    if (fish.phase === 'cast') { // (the line flies out in an arc)
      const k = Math.min(1, age / 700);
      bx = fish.from.x + (fish.target.x - fish.from.x) * k;
      by = fish.from.y + (fish.target.y - fish.from.y) * k + Math.sin(k * Math.PI) * 26;
      sag = 0;
      if (k >= 1) { splash(bx, by); fish.phase = 'wait'; fish.at = now; fish.waitFor = rand(5000, 14000); }
    } else if (fish.phase === 'wait') {
      by += Math.sin(now / 420) * 1;
      if (age > fish.waitFor) { fish.phase = 'nibble'; fish.at = now; }
    } else if (fish.phase === 'nibble') { // (two quick dips)
      by -= (Math.sin(age / 90) > 0.6 ? 2 * U : 0);
      if (age > 1600) { fish.phase = Math.random() < 0.8 ? 'bite' : 'wait'; fish.at = now; fish.waitFor = rand(3000, 7000); if (fish.phase === 'bite') api.say(w, 'surprised', '!'); }
    } else if (fish.phase === 'bite') { // (under: it's on!)
      by -= 3 * U;
      sag = -2;
      if (age > 900) { fish.phase = 'reel'; fish.at = now; fish.from = { x: bx, y: by }; }
    } else if (fish.phase === 'reel') { // (reeled in, toward the tip)
      const k = Math.min(1, age / 1100);
      bx = fish.from.x + (t.x - fish.from.x) * k;
      by = fish.from.y + (t.y - 6 * U - fish.from.y) * k;
      sag = -1;
      if (k >= 1) {
        const r = Math.random();
        const kind = r < 0.12 ? 'boot' : r < 0.2 ? 'gold' : 'fish';
        showCatch(kind);
        fish.phase = 'show';
        fish.at = now;
        if (kind === 'boot') api.say(w, 'annoyed', pick(['...', 'a boot?', 'ugh']));
        else { api.say(w, kind === 'gold' ? 'love' : 'happy', kind === 'gold' ? pick(['WOW', '<3', 'GOLD!']) : pick(['yay!', '!!', 'got one!'])); api.botEvent(kind === 'gold' ? 'fish-gold' : 'fish-caught'); }
      }
    } else if (fish.phase === 'show') { // (held up on the line a moment)
      bx = t.x;
      by = t.y - 6 * U;
      sag = 0;
      placeCatch(bx, by);
      if (age > 2600) { fish.phase = 'toss'; fish.at = now; fish.from = { x: bx, y: by }; }
    } else if (fish.phase === 'toss') { // (thrown back: an arc into the water)
      const k = Math.min(1, age / 700);
      const tx = fish.target.x;
      const ty = fish.target.y;
      bx = t.x;
      by = t.y - 6 * U;
      placeCatch(fish.from.x + (tx - fish.from.x) * k, fish.from.y + (ty - fish.from.y) * k + Math.sin(k * Math.PI) * 20);
      if (k >= 1) {
        splash(tx, ty);
        if (fish.catch) fish.catch.remove();
        fish.catch = null;
        api.say(w, 'idle', '');
        if (fish.casts < 3 && Math.random() < 0.6) cast(); else fishEnd();
        return;
      }
    } else if (fish.phase === 'lost') { // (the line snaps back, empty; a sulk, then try again or give up)
      const k = Math.min(1, age / 500);
      bx = fish.from.x + (t.x - 6 * U * 0 - fish.from.x) * k;
      by = fish.from.y + (t.y - 8 * U - fish.from.y) * k;
      if (age > 2600) { api.say(w, 'idle', ''); if (fish.casts < 3 && Math.random() < 0.5) cast(); else fishEnd(); return; }
    }
    fish.bx = bx;
    fish.by = by;
    // the line: from the tip to the bobber, sagging a little (in the svg's own top-down y)
    const x1 = t.x;
    const y1 = H - t.y;
    const x2 = bx;
    const y2 = H - by;
    fish.svg.firstChild.setAttribute('d', `M${x1.toFixed(1)} ${y1.toFixed(1)} Q${((x1 + x2) / 2).toFixed(1)} ${(Math.max(y1, y2) + sag).toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`);
    fish.bob.style.left = `${bx.toFixed(1)}px`;
    fish.bob.style.bottom = `${by.toFixed(1)}px`;
    fish.bob.classList.toggle('under', fish.phase === 'bite' || fish.phase === 'show' || fish.phase === 'toss');
  }

  function frame(now) {
    if (!sc && now > nextCheck) {
      nextCheck = now + (often() ? rand(4000, 8000) : rand(360000, 720000));
      if (!api.foggy() && (often() || Math.random() < 0.4)) start(choose(), SCENE_KINDS.includes(sceneForced()) ? 1e9 : (often() ? rand(30000, 50000) : 0));
    }
    if (!sc) return;
    if (api.foggy() || now > sc.until) { end(); nextCheck = now + rand(300000, 600000); return; } // (the fog has its own; or its time's up)
    if (sc.night !== night()) { sc.night = night(); draw(true); }
    if (now - (sc.drawn || 0) > (sc.kind === 'beach' || sc.kind === 'lake' ? 350 : 1000)) { sc.drawn = now; draw(false); }
    if (sc) fishTick(now);
  }
  return { frame, clear: () => end(true), start: (k) => start(k), current: () => (sc ? sc.kind : null), fish: () => { if (sc && sc.dock && !fish) fishStart(); return !!fish; } };
}
