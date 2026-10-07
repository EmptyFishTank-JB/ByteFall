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
const SCENE_KINDS = ['meadow', 'beach', 'city', 'woodland', 'snowfield', 'desert', 'farm'];
const SCENE_NAMES = { meadow: 'MEADOW', beach: 'BEACH', city: 'CITY', woodland: 'WOODLAND', snowfield: 'SNOWFIELD', desert: 'DESERT', farm: 'FARM' };
// (the weather each suits, which comes more while it's out; and what never comes with it)
const SCENE_FITS = {
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
  spring: [['meadow', 3], ['woodland', 2], ['city', 1.5]],
  summer: [['beach', 3], ['meadow', 2], ['desert', 1.5], ['city', 1]],
  autumn: [['woodland', 3], ['farm', 2.5], ['city', 1.5]],
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
    sc = { kind, at: now, until: now + (ms || rand(600000, 1200000)), seed: Math.floor(Math.random() * 1e9), els: { far: canvas('scene-far'), ground: canvas('scene-ground'), near: canvas('scene-near') }, drawnW: 0, wave: 0, night: night() };
    draw(true);
    requestAnimationFrame(() => requestAnimationFrame(() => { if (sc) Object.values(sc.els).forEach((e) => { e.style.opacity = '1'; }); }));
    api.botEvent(`scene-${kind}`);
    api.fitWeather(SCENE_FITS[kind].fits); // (and weather to suit, if none's out)
  }
  function end(now = false) {
    if (!sc) return;
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
    if (full || sc.drawnW !== W) {
      sc.drawnW = W;
      const r = rng(sc.seed);
      drawFar(prep(far, farCells, W), r, N, S);
      drawGround(prep(ground, 5, W), rng(sc.seed + 1), N, S);
      drawNear(prep(near, 6, W), rng(sc.seed + 2), N, S);
    } else if (sc.kind === 'beach') drawFar(prep(far, farCells, W), rng(sc.seed), N, S); // (the waves moving)
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
    if (k === 'meadow') { fill('#4f9a4a'); dots(['#3f8a3e', '#5fb85a'], 0.25); dots(['#ffe066', '#ffffff', '#f39ac0'], 0.03); }
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
    if (k === 'meadow') every(7, 16, (x) => { // (tufts of grass, now and then a flower in one)
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

  function frame(now) {
    if (!sc && now > nextCheck) {
      nextCheck = now + (often() ? rand(4000, 8000) : rand(360000, 720000));
      if (!api.foggy() && (often() || Math.random() < 0.4)) start(choose(), SCENE_KINDS.includes(sceneForced()) ? 1e9 : (often() ? rand(30000, 50000) : 0));
    }
    if (!sc) return;
    if (api.foggy() || now > sc.until) { end(); nextCheck = now + rand(300000, 600000); return; } // (the fog has its own; or its time's up)
    if (sc.night !== night()) { sc.night = night(); draw(true); }
    if (now - (sc.drawn || 0) > (sc.kind === 'beach' ? 350 : 1000)) { sc.drawn = now; draw(false); }
  }
  return { frame, clear: () => end(true), start: (k) => start(k), current: () => (sc ? sc.kind : null) };
}
