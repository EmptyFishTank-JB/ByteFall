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
    if (sc.sky) { const sky = sc.sky; sc.sky = null; sky.forEach((d) => { d.style.opacity = '0'; }); setTimeout(() => sky.forEach((d) => d.remove()), now ? 0 : 5000); }
    if (fish) fishEnd(true); // (packed up: the place is going)
    lifeEnd();
    nearEnd();
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
    sc.FH = farCells * P; // (for the life in it: where the water and the sky are)
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
    // (the one that most wants something to do: least fun, and the curious more often)
    const w = free.sort((a, b) => (a.mind ? a.mind.fun : 0.5) - (b.mind ? b.mind.fun : 0.5))[Math.random() < 0.7 ? 0 : Math.floor(Math.random() * free.length)];
    if (!api.claim(w, () => fishPoked())) return;
    fish = { w, phase: 'out', side: d.side, casts: 0 };
    if (w.feel) w.feel('fun', 0.15);
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
    if (w.feel) w.feel('temper', 0.3); // (cross about it: its face shows it)
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
  // (a RESOURCE: its own icon, glowing, from the STORE's table; master keys the rarest)
  const RES_ODDS = [['bugs', 3], ['cache', 3], ['crypto', 2.5], ['rootkits', 1.2], ['master', 0.6]];
  function pickRes() {
    let r = Math.random() * RES_ODDS.reduce((a, [, w]) => a + w, 0);
    for (const [id, w] of RES_ODDS) if ((r -= w) <= 0) return id;
    return 'bugs';
  }
  function showRes(id) {
    const c = document.createElement('div');
    c.className = `fish-catch fish-res res-${id}`;
    c.setAttribute('aria-hidden', 'true');
    c.innerHTML = typeof RES_INFO !== 'undefined' && RES_INFO[id] ? RES_INFO[id].svg : '';
    api.lane.appendChild(c);
    fish.catch = c;
    fish.catchKind = 'res';
  }
  function placeCatch(x, y) {
    if (!fish.catch) return;
    const a = fish.catchKind === 'res' ? { w: 6, h: 6 } : FISH_ART[fish.catchKind];
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
        // (1 in 10: a RESOURCE off the bottom, kept; master keys the rarest of them)
        let forced = false; // (testing: every catch a resource)
        try { forced = localStorage.getItem('bytefall-dev-fishres') === 'on'; } catch (e) {}
        const kind = (r < 0.1 || forced) && typeof Progress !== 'undefined' ? 'res' : r < 0.21 ? 'boot' : r < 0.28 ? 'gold' : 'fish';
        if (kind === 'res') {
          const id = pickRes();
          showRes(id);
          Progress.addRes(id, 1);
          if (typeof showToast === 'function') showToast(`GONE FISHING // +1 ${typeof RES_INFO !== 'undefined' && RES_INFO[id] ? RES_INFO[id].name : id.toUpperCase()}`);
          api.say(w, id === 'master' ? 'love' : 'happy', id === 'master' ? pick(['!!!', 'WOW', '<3']) : pick(['ooh!', 'loot!', '!!']));
          api.botEvent(`fish-res-${id}`);
        } else showCatch(kind);
        if (w.feel) { w.feel('fun', kind === 'boot' ? 0.05 : 0.35); w.feel('temper', kind === 'boot' ? 0.05 : -0.2); }
        fish.phase = 'show';
        fish.at = now;
        if (kind === 'boot') api.say(w, 'annoyed', pick(['...', 'a boot?', 'ugh']));
        else if (kind !== 'res') { api.say(w, kind === 'gold' ? 'love' : 'happy', kind === 'gold' ? pick(['WOW', '<3', 'GOLD!']) : pick(['yay!', '!!', 'got one!'])); api.botEvent(kind === 'gold' ? 'fish-gold' : 'fish-caught'); }
      }
    } else if (fish.phase === 'show') { // (held up on the line a moment)
      bx = t.x;
      by = t.y - 6 * U;
      sag = 0;
      placeCatch(bx, by);
      if (age > 2600 && fish.catchKind === 'res') { // (kept: it's pocketed, and the line goes out again)
        if (fish.catch) fish.catch.remove();
        fish.catch = null;
        api.say(w, 'idle', '');
        if (fish.casts < 3 && Math.random() < 0.6) cast(); else fishEnd();
        return;
      }
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


  // BITS OF LIFE: small things going on in each place. The LAKE: a fish jumping (rings where it
  // goes in), rings on still water, a duck paddling across, a dragonfly darting over the reeds. The
  // BEACH: a fish jumping, gulls gliding over, a crab scuttling along the sand. And a bug here and
  // there: butterflies and a bee over the MEADOW, a beetle or a ladybug on the WOODLAND, FARM and
  // DESERT ground, a moth in the woods at night, pigeons pecking along the CITY's sidewalk. Fewer at
  // night (the day ones keep in). On their own canvas, behind the bots, in the bots' own pixels.
  let life = [];
  let lifeCanvas = null;
  let lifeLast = 0;
  let lifeDrawn = 0;
  let lifeNext = {};
  const isDay = () => { const h = new Date().getHours(); return h >= 7 && h < 19; };
  const LIFE = { // [kind, every (seconds, about), at most, only by day]
    lake: [['jump', 9, 1], ['ripple', 4, 3], ['duck', 35, 1, true], ['dragonfly', 18, 1, true]],
    beach: [['jump', 12, 1], ['gull', 12, 2, true], ['crab', 22, 1]],
    meadow: [['butterfly', 9, 3, true], ['bee', 13, 2, true]],
    woodland: [['beetle', 18, 1], ['butterfly', 28, 1, true], ['moth', 16, 1, 'night']],
    farm: [['ladybug', 20, 1], ['butterfly', 30, 1, true]],
    desert: [['beetle', 22, 1]],
    city: [['pigeon', 14, 2, true]],
    snowfield: [],
  };
  const waterBand = () => { // (from the floor: where the water shows, above the shore)
    const FH = sc.FH || 80;
    return sc.kind === 'lake' ? [6 * P, 0.48 * FH] : [6 * P, 0.38 * FH];
  };
  function lifeSpawn(kind, W) {
    const d = Math.random() < 0.5 ? 1 : -1;
    const edge = d > 0 ? -10 : W + 10;
    const [wl, wh] = sc.kind === 'lake' || sc.kind === 'beach' ? waterBand() : [0, 0];
    const FH = sc.FH || 80;
    const e = { kind, t: 0, dir: d };
    if (kind === 'jump') Object.assign(e, { x: rand(W * 0.08, W * 0.92), y: rand(wl + 4, wh - 4), dur: rand(0.7, 1.1), h: rand(8, 16) });
    else if (kind === 'ripple') Object.assign(e, { x: rand(W * 0.05, W * 0.95), y: rand(wl + 3, wh - 3), life: rand(0.8, 1.3) });
    else if (kind === 'duck') Object.assign(e, { x: edge, y: rand(wl + 2, wl + (wh - wl) * 0.5), v: rand(7, 11) });
    else if (kind === 'dragonfly') Object.assign(e, { x: edge, y: rand(wh - 6, wh + 22), tx: rand(W * 0.2, W * 0.8), ty: rand(wh - 6, wh + 22), hop: 0, life: rand(14, 22) });
    else if (kind === 'gull') Object.assign(e, { x: edge, y: rand(FH * 1.05, FH * (game() ? 1.5 : 2.6)), v: rand(28, 46) });
    else if (kind === 'crab') Object.assign(e, { x: edge, y: P, v: rand(14, 22), stop: rand(1, 3) });
    else if (kind === 'butterfly' || kind === 'moth') Object.assign(e, { x: edge, y: rand(8 * P, 30 * P), v: rand(14, 22), ph: rand(0, 6.28), c: kind === 'moth' ? '#d8cfb8' : pick(['#ffb347', '#ffffff', '#8fb8ff', '#ffe066']) });
    else if (kind === 'bee') Object.assign(e, { x: edge, y: rand(6 * P, 20 * P), v: rand(30, 45), ph: rand(0, 6.28) });
    else if (kind === 'beetle' || kind === 'ladybug') Object.assign(e, { x: edge, y: P * 1.5, v: rand(4, 7), stop: rand(2, 5) });
    else if (kind === 'pigeon') Object.assign(e, { x: edge, y: P, v: rand(10, 16), peck: 0, stop: rand(1, 3), life: rand(14, 24) });
    life.push(e);
  }
  function lifeTick(now) {
    if (!sc) return;
    const dt = Math.min(0.1, (now - (lifeLast || now)) / 1000);
    lifeLast = now;
    const W = api.laneW();
    const H = api.lane.clientHeight;
    if (!W || !H) return;
    const day = isDay();
    for (const [kind, every, most, when] of LIFE[sc.kind] || []) {
      if (when === true && !day) continue;
      if (when === 'night' && day) continue;
      const key = `${sc.kind}-${kind}`;
      if (!lifeNext[key]) lifeNext[key] = now + rand(1000, every * 1000);
      if (now > lifeNext[key]) {
        lifeNext[key] = now + rand(every * 500, every * 1500);
        if (life.filter((e) => e.kind === kind).length < most) lifeSpawn(kind, W);
      }
    }
    for (const e of life) {
      e.t += dt;
      if (e.kind === 'jump') {
        if (e.t > e.dur) { e.gone = true; life.push({ kind: 'ripple', x: e.x + e.dir * 6, y: e.y, t: 0, life: 1 }); }
        if (!e.rung) { e.rung = true; life.push({ kind: 'ripple', x: e.x, y: e.y, t: 0, life: 0.9 }); }
      } else if (e.kind === 'ripple') { if (e.t > e.life) e.gone = true; }
      else if (e.kind === 'duck' || e.kind === 'gull') e.x += e.dir * e.v * dt;
      else if (e.kind === 'dragonfly') { // (hovers, then darts somewhere else)
        e.hop -= dt;
        if (e.hop <= 0) { e.hop = rand(0.8, 2.2); e.tx = e.t > e.life ? (e.dir > 0 ? W + 20 : -20) : rand(W * 0.1, W * 0.9); e.ty = e.y + rand(-10, 10); }
        e.x += (e.tx - e.x) * Math.min(1, dt * 5);
        e.y += (e.ty - e.y) * Math.min(1, dt * 5) + Math.sin(e.t * 9) * 0.3;
        if (e.t > e.life + 3) e.gone = true;
      } else if (e.kind === 'crab' || e.kind === 'beetle' || e.kind === 'ladybug' || e.kind === 'pigeon') { // (along the ground, stopping now and then)
        e.stop -= dt;
        if (e.stop < 0) { e.x += e.dir * e.v * dt; if (e.stop < -rand(1.5, 4)) e.stop = rand(0.8, 3); }
        if (e.kind === 'pigeon') { e.peck = e.stop > 0 ? (Math.sin(e.t * 12) > 0 ? 1 : 0) : 0; if (e.t > e.life && !e.fly) { e.fly = true; e.vy = 30; } if (e.fly) { e.y += e.vy * dt; e.x += e.dir * 40 * dt; } }
      } else if (e.kind === 'butterfly' || e.kind === 'moth') { e.x += e.dir * e.v * dt; e.y += Math.sin(e.t * 2 + e.ph) * 12 * dt; }
      else if (e.kind === 'bee') { e.x += e.dir * e.v * dt; e.y += Math.sin(e.t * 9 + e.ph) * 30 * dt; }
      if (e.x < -40 || e.x > W + 40 || e.y > H + 20) e.gone = true;
    }
    life = life.filter((e) => !e.gone);
    if (!life.length) { if (lifeCanvas) lifeCanvas.getContext('2d').clearRect(0, 0, lifeCanvas.width, lifeCanvas.height); return; }
    if (now - lifeDrawn < 33) return;
    lifeDrawn = now;
    if (!lifeCanvas) {
      lifeCanvas = document.createElement('canvas');
      lifeCanvas.className = 'scene-life';
      lifeCanvas.setAttribute('aria-hidden', 'true');
      api.lane.appendChild(lifeCanvas);
    }
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    if (lifeCanvas.width !== Math.round(W * dpr) || lifeCanvas.height !== Math.round(H * dpr)) { lifeCanvas.width = Math.round(W * dpr); lifeCanvas.height = Math.round(H * dpr); }
    const g = lifeCanvas.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, W, H);
    const dimN = sc.night ? 0.55 : 1;
    const dot = (x, y, c, w = 1, h = 1, a = 1) => { g.globalAlpha = a * dimN; g.fillStyle = c; g.fillRect(Math.round(x / P) * P, Math.round((H - y) / P) * P - (h - 1) * P, w * P, h * P); };
    for (const e of life) {
      const f = Math.floor(e.t * 8) % 2; // (a flap, a step)
      if (e.kind === 'jump') {
        const k = e.t / e.dur;
        const x = e.x + e.dir * k * 12;
        const y = e.y + Math.sin(k * Math.PI) * e.h;
        dot(x, y, '#9fb8c8', 2, 1); dot(x + e.dir * 2 * P, y + (k < 0.5 ? -P : P), '#7f98a8');
      } else if (e.kind === 'ripple') {
        const r = 1 + (e.t / e.life) * 5;
        const a = 1 - e.t / e.life;
        dot(e.x - r * P, e.y, '#9cc8dc', 1, 1, a); dot(e.x + r * P, e.y, '#9cc8dc', 1, 1, a); dot(e.x - r * P * 0.6, e.y + P * 0.5, '#9cc8dc', 1, 1, a * 0.6); dot(e.x + r * P * 0.6, e.y + P * 0.5, '#9cc8dc', 1, 1, a * 0.6);
      } else if (e.kind === 'duck') {
        dot(e.x, e.y, '#8a6a4a', 4, 2); dot(e.x + (e.dir > 0 ? 3 : 0) * P, e.y + 2 * P, '#2f7a33'); dot(e.x + (e.dir > 0 ? 4 : -1) * P, e.y + 2 * P, '#ffb000');
        dot(e.x - e.dir * 2 * P, e.y, '#9cc8dc', 1, 1, 0.6); dot(e.x - e.dir * 4 * P, e.y, '#9cc8dc', 1, 1, 0.35); // (its wake)
      } else if (e.kind === 'dragonfly') {
        dot(e.x, e.y, '#3ab0c8', 3, 1); dot(e.x + P, e.y + P, f ? '#e8f4ff' : '#9cc8dc', 1, 1, 0.7); dot(e.x + P * (f ? 0 : 2), e.y + P, '#e8f4ff', 1, 1, 0.5);
      } else if (e.kind === 'gull') {
        dot(e.x, e.y, '#f2f2f2'); dot(e.x - P, e.y + (f ? P : 0), '#e8e8e8'); dot(e.x + P, e.y + (f ? P : 0), '#e8e8e8'); dot(e.x - 2 * P, e.y + (f ? 2 * P : -P), '#d8d8d8'); dot(e.x + 2 * P, e.y + (f ? 2 * P : -P), '#d8d8d8');
      } else if (e.kind === 'crab') {
        const step = e.stop < 0 ? f : 0;
        dot(e.x, e.y + P, '#d8462f', 3, 1); dot(e.x - P, e.y + 2 * P, '#e8603f'); dot(e.x + 3 * P, e.y + 2 * P, '#e8603f');
        dot(e.x + (step ? 0 : P), e.y, '#a8321f'); dot(e.x + (step ? 2 : P) * P, e.y, '#a8321f');
      } else if (e.kind === 'butterfly' || e.kind === 'moth') {
        dot(e.x, e.y, '#3a2a1a'); dot(e.x - P, e.y + (f ? P : 0), e.c); dot(e.x + P, e.y + (f ? P : 0), e.c);
      } else if (e.kind === 'bee') { dot(e.x, e.y, '#ffd23f'); dot(e.x + e.dir * P, e.y, '#2a2a2a'); dot(e.x, e.y + P, '#e8f4ff', 1, 1, f ? 0.7 : 0.3); }
      else if (e.kind === 'beetle') dot(e.x, e.y, '#2a3a2a', 2, 1);
      else if (e.kind === 'ladybug') { dot(e.x, e.y, '#d0342c', 2, 1); dot(e.x + (e.dir > 0 ? P : 0), e.y, '#1a1a1a'); }
      else if (e.kind === 'pigeon') {
        if (e.fly) { dot(e.x, e.y, '#8a909a'); dot(e.x - P, e.y + (f ? P : 0), '#a0a6b0'); dot(e.x + P, e.y + (f ? P : 0), '#a0a6b0'); }
        else { dot(e.x, e.y + P, '#8a909a', 3, 1); dot(e.x + (e.dir > 0 ? 2 : 0) * P, e.y + (e.peck ? P : 2 * P), '#6a707a'); dot(e.x + P, e.y, '#c86a50'); }
      }
    }
    g.globalAlpha = 1;
  }
  function lifeEnd() {
    life = [];
    lifeNext = {};
    if (lifeCanvas) { lifeCanvas.remove(); lifeCanvas = null; }
  }


  // THE NEAR CRITTERS: bigger ones, close by on the bots' own floor (in front of them, nearer the
  // camera), that the bots notice as they pass: a frog hopping along the shore (ribbit? a curious
  // look), a crab (a start, and now and then a pinch: ow!), a butterfly (a smile, a heart), a bee
  // (BUNKER's scared of it, GLITCH laughs), a squirrel (a start), a rabbit in the snow (aww), a
  // pigeon (GRIFTER eyes it), a lizard, a chicken (a laugh). Each nudges the bot's mood (its temper,
  // its fun: bots.js's minds), a little.
  const NEAR_ART = { // (pixel maps facing right: one letter a pixel, '.' empty; b: a second frame)
    frog: { pal: { g: '#5aa84a', G: '#3f8a3e', k: '#1a2a1a', y: '#e8e070' }, a: ['.k..k.', 'gggggg', 'gyyyyg', 'gg..gg'], b: ['......', '.k..k.', 'gggggg', 'g.yy.g', 'g....g'] },
    crab: { pal: { r: '#d8462f', R: '#a8321f', k: '#1a1a1a' }, a: ['.k...k.', 'rr...rr', '.rrrrr.', 'R.rrr.R', '.R...R.'], b: ['.k...k.', 'rr...rr', '.rrrrr.', '.RrrrR.', 'R.....R'] },
    butterfly: { pal: { w: '#ffb347', W: '#ff8a3c', k: '#2a1a0a' }, a: ['ww.ww', 'WwkwW', '.wkw.', 'w...w'], b: ['..k..', '.wkw.', '.wkw.', '..k..'] },
    bee: { pal: { y: '#ffd23f', k: '#2a2a2a', w: '#e8f4ff' }, a: ['.ww.', 'ykyk', 'ykyk'], b: ['....', 'ykyk', 'ykyk'] },
    squirrel: { pal: { b: '#9a5a2a', t: '#c8803a', k: '#1a1a1a' }, a: ['t....', 'tt.bk', '.tbbb', '.bbb.', '.b.b.'], b: ['t....', 'tt.bk', '.tbbb', '.bbb.', 'b...b'] },
    rabbit: { pal: { w: '#f2f4f8', p: '#f0a0b0', k: '#1a1a1a', W: '#c8d4e2' }, a: ['...w.w', '...wpw', '.wwwwk', 'wwwww.', '.W.W..'], b: ['...w.w', '...wpw', '.wwwwk', 'wwwww.', 'W...W.'] },
    pigeon: { pal: { g: '#8a909a', G: '#6a707a', p: '#7a6aa0', o: '#c86a50', k: '#1a1a1a' }, a: ['...Gk', '..gpg', 'ggggg', '.o.o.'], b: ['.....', '...Gk', 'ggggp', '.o.o.'] },
    lizard: { pal: { g: '#7aa84a', G: '#5a8a3a', k: '#1a1a1a' }, a: ['.......k', 'gggggggg', '.G.G..G.'], b: ['.......k', 'gggggggg', 'G.G..G..'] },
    chicken: { pal: { w: '#f2f2f2', r: '#e0455f', y: '#ffb000', k: '#1a1a1a' }, a: ['..r.', '.wwky', 'wwww.', '.ww..', '.y.y.'], b: ['..r.', '.wwky', 'wwww.', '.ww..', 'y...y'] },
  };
  const NEAR = { // [critter, every (seconds, about), only by day]
    lake: [['frog', 22], ['butterfly', 30, true]],
    beach: [['crab', 18]],
    meadow: [['butterfly', 14, true], ['bee', 20, true], ['rabbit', 40, true]],
    woodland: [['squirrel', 20, true], ['butterfly', 34, true]],
    farm: [['chicken', 18, true]],
    desert: [['lizard', 20]],
    city: [['pigeon', 16, true]],
    snowfield: [['rabbit', 24, true]],
  };
  // How each bot takes each: [mood, emotes, temper, fun] (by bot where they differ)
  const NEAR_FEEL = {
    frog: { any: ['happy', ['ribbit?', '?', 'ooh'], -0.04, 0.06], glitch: ['laugh', ['ribbit!', 'haha'], -0.02, 0.08] },
    crab: { any: ['surprised', ['!', '!?'], 0.02, 0.04], bunker: ['scared', ['eek', '!'], 0.06, 0], pinch: ['annoyed', ['ow!', 'OW', 'hey!'], 0.14, 0] },
    butterfly: { any: ['love', ['<3', '^^'], -0.1, 0.08], glitch: ['happy', ['ooh', '^^'], -0.06, 0.08] },
    bee: { any: ['worried', ['!', 'bzz?'], 0.04, 0], bunker: ['scared', ['EEK', '!!'], 0.08, 0], glitch: ['laugh', ['haha', 'bzz'], -0.02, 0.06] },
    squirrel: { any: ['surprised', ['!?', '!'], 0, 0.05], bot: ['happy', ['ooh', '!'], -0.04, 0.08] },
    rabbit: { any: ['love', ['aww', '<3'], -0.12, 0.08] },
    pigeon: { any: ['happy', ['coo?', '^^'], -0.04, 0.04], grifter: ['devious', ['hm', '...'], 0, 0.06] },
    lizard: { any: ['surprised', ['!', '?'], 0.02, 0.04], bot: ['happy', ['ooh'], -0.04, 0.06] },
    chicken: { any: ['laugh', ['haha', 'bawk?'], -0.06, 0.08], bunker: ['skeptic', ['...', 'hm'], 0, 0.02] },
  };
  let near = [];
  let nearCanvas = null;
  let nearNext = {};
  let nearLast = 0;
  const FLIES = ['butterfly', 'bee'];
  function nearSpawn(kind, W) {
    const d = Math.random() < 0.5 ? 1 : -1;
    const fly = FLIES.includes(kind);
    near.push({ kind, dir: d, x: d > 0 ? -16 : W + 16, y: fly ? rand(14 * P, 26 * P) : 0, t: 0, v: { frog: 0, crab: rand(16, 24), butterfly: rand(16, 22), bee: rand(32, 44), squirrel: rand(40, 55), rabbit: 0, pigeon: rand(10, 14), lizard: rand(26, 36), chicken: rand(9, 13) }[kind], stop: rand(1, 2), hop: 0, ph: rand(0, 6.28), met: new Set() });
  }
  function nearTick(now) {
    if (!sc) return;
    const dt = Math.min(0.1, (now - (nearLast || now)) / 1000);
    nearLast = now;
    const W = api.laneW();
    const H = api.lane.clientHeight;
    if (!W || !H) return;
    const day = isDay();
    for (const [kind, every, dayOnly] of NEAR[sc.kind] || []) {
      if (dayOnly && !day) continue;
      const key = `${sc.kind}-${kind}`;
      if (!nearNext[key]) nearNext[key] = now + rand(3000, every * 1000);
      if (now > nearNext[key]) { nearNext[key] = now + rand(every * 600, every * 1500); if (!near.some((e) => e.kind === kind)) nearSpawn(kind, W); }
    }
    for (const e of near) {
      e.t += dt;
      if (e.kind === 'frog' || e.kind === 'rabbit') { // (hops: a pause, a leap)
        e.hop -= dt;
        if (e.hop <= -0.45) e.hop = rand(0.6, 1.8);
        const leaping = e.hop < 0;
        if (leaping) { e.x += e.dir * (e.kind === 'rabbit' ? 60 : 44) * dt; e.y = Math.sin((-e.hop / 0.45) * Math.PI) * 9; } else e.y = 0;
        e.frame = leaping ? 'b' : 'a';
      } else if (FLIES.includes(e.kind)) {
        e.x += e.dir * e.v * dt;
        e.y += Math.sin(e.t * (e.kind === 'bee' ? 9 : 2.4) + e.ph) * (e.kind === 'bee' ? 26 : 14) * dt;
        e.frame = Math.floor(e.t * (e.kind === 'bee' ? 14 : 5)) % 2 ? 'b' : 'a';
      } else { // (scuttling, scampering, strutting: a stop now and then)
        e.stop -= dt;
        if (e.stop < 0) { e.x += e.dir * e.v * dt; if (e.stop < -rand(1.2, 3)) e.stop = rand(0.6, 2.2); }
        e.frame = e.stop < 0 && Math.floor(e.t * 8) % 2 ? 'b' : 'a';
      }
      if (e.x < -30 || e.x > W + 30) e.gone = true;
      // (the bots it passes: each notices it once)
      for (const w of api.walkers()) {
        if (e.met.has(w) || w.claimed || w.leaving || !['walk', 'idle'].includes(w.state)) continue;
        const gap = Math.abs(w.x + 17 - e.x);
        if (gap > 30) continue;
        e.met.add(w);
        const F = NEAR_FEEL[e.kind];
        const pinch = e.kind === 'crab' && gap < 12 && Math.random() < 0.35;
        const [m, says, temper, fun] = pinch ? F.pinch : F[w.bot] || F.any;
        api.say(w, m, pick(says));
        if (w.feel) { w.feel('temper', temper); w.feel('fun', fun); }
        if (api.turn) w.look = e.x > w.x + 17 ? 1 : -1;
        api.botEvent(`critter-${e.kind}`);
      }
    }
    near = near.filter((e) => !e.gone);
    if (!nearCanvas) {
      if (!near.length) return;
      nearCanvas = document.createElement('canvas');
      nearCanvas.className = 'scene-life scene-near-life';
      nearCanvas.setAttribute('aria-hidden', 'true');
      api.lane.appendChild(nearCanvas);
    }
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    if (nearCanvas.width !== Math.round(W * dpr) || nearCanvas.height !== Math.round(H * dpr)) { nearCanvas.width = Math.round(W * dpr); nearCanvas.height = Math.round(H * dpr); }
    const g = nearCanvas.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, W, H);
    g.globalAlpha = sc.night ? 0.7 : 1;
    for (const e of near) {
      const art = NEAR_ART[e.kind];
      const rows = (e.frame === 'b' && art.b) || art.a;
      const h = rows.length;
      const w = rows[0].length;
      const x0 = Math.round((e.x - (w * P) / 2) / P) * P;
      const y0 = Math.round((H - e.y - h * P) / P) * P;
      rows.forEach((row, ry) => [...row].forEach((c, rx) => {
        if (c === '.') return;
        g.fillStyle = art.pal[c];
        g.fillRect(x0 + (e.dir > 0 ? rx : w - 1 - rx) * P, y0 + ry * P, P, P);
      }));
    }
    g.globalAlpha = 1;
  }
  function nearEnd() {
    near = [];
    nearNext = {};
    if (nearCanvas) { nearCanvas.remove(); nearCanvas = null; }
  }


  // THE SKY behind a scene: the time of day's (night navy, a dawn's peach, a day's blue, a dusk's
  // orange and violet), turned by the weather (greyed by cloud and rain, darker in a storm, paler in
  // the snow, brown in a dust storm, warmer in a heatwave), fading out up top into the card. Two
  // layers, so a change crossfades.
  const SKY_TIME = { night: ['#0b1026', '#1d2547'], dawn: ['#33457e', '#f2a07a'], day: ['#4a8ed0', '#a8d4f0'], dusk: ['#3a2f6b', '#f08a4b'] };
  const SKY_WX = { // [toward (top, horizon), how far]
    overcast: [['#6b7480', '#9aa2ae'], 0.55], drizzle: [['#5f6874', '#8a929e'], 0.6], rain: [['#525a66', '#7a828e'], 0.7],
    storm: [['#2a2f3a', '#454c58'], 0.85], hail: [['#3a404c', '#5a606c'], 0.8], sleet: [['#6a7482', '#9aa4b2'], 0.7],
    snow: [['#9aa4b2', '#c8d0dc'], 0.6], flurries: [['#9aa4b2', '#c8d0dc'], 0.45], blizzard: [['#b8c0cc', '#dde3ea'], 0.85],
    thundersnow: [['#4a5260', '#7a8492'], 0.85], duststorm: [['#8a6a40', '#d8b078'], 0.75], heatwave: [['#5a8ac0', '#f0c080'], 0.35],
    sunshower: [['#6a90c0', '#c8d8e8'], 0.3],
  };
  const hexRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const mix = (a, b, k) => { const A = hexRgb(a); const B = hexRgb(b); return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * k)).join(', ')})`; };
  function skyNow() {
    const h = new Date().getHours();
    const wxk = api.weatherNow ? api.weatherNow() : null;
    let time = h >= 20 || h < 5 ? 'night' : h < 8 ? 'dawn' : h < 17 ? 'day' : 'dusk';
    if (wxk === 'sunrise') time = 'dawn';
    else if (wxk === 'sunset') time = 'dusk';
    let [top, low] = SKY_TIME[time];
    const w = SKY_WX[wxk];
    if (w) { const k = w[1] * (time === 'night' ? 0.4 : 1); top = mix(top, w[0][0], k); low = mix(low, w[0][1], k); }
    else { top = mix(top, top, 0); low = mix(low, low, 0); }
    return `linear-gradient(to top, ${low}, ${top} 75%)`;
  }
  function skyTick(now) {
    if (!sc) return;
    if (!sc.sky) {
      sc.sky = [0, 1].map(() => { const d = document.createElement('div'); d.className = 'scene-sky'; d.setAttribute('aria-hidden', 'true'); api.lane.insertBefore(d, api.lane.firstChild); return d; });
      sc.skyOn = 0;
      sc.skyKey = skyNow();
      sc.sky[0].style.background = sc.skyKey;
      requestAnimationFrame(() => requestAnimationFrame(() => { if (sc && sc.sky) sc.sky[0].style.opacity = '1'; }));
      sc.skyAt = now;
      return;
    }
    if (now - sc.skyAt < 2500) return;
    sc.skyAt = now;
    const key = skyNow();
    if (key === sc.skyKey) return;
    sc.skyKey = key;
    const next = 1 - sc.skyOn;
    sc.sky[next].style.background = key;
    sc.sky[next].style.opacity = '1';
    sc.sky[sc.skyOn].style.opacity = '0';
    sc.skyOn = next;
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
    if (sc) { fishTick(now); lifeTick(now); nearTick(now); skyTick(now); }
  }
  return { frame, clear: () => end(true), start: (k) => start(k), current: () => (sc ? sc.kind : null), fish: () => { if (sc && sc.dock && !fish) fishStart(); return !!fish; } };
}
