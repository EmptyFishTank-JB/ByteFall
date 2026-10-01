// Ambient "defragmenting" micro-grid drawn behind the board. Data blocks are
// shuffled toward the top-left one move at a time while a few shimmer. Before
// a pass finishes, a freshly scattered pass starts and the two crossfade, so
// the cycle reads as one continuous process instead of snapping back.
// { defrag: false } draws only the starlight: the scattered blocks shimmering, never moving
// (the HUD boxes). active(), if given, pauses it while it returns false (a hidden layer).
// The theme's color, read once per theme change rather than on every draw (reading it each
// frame made the browser recompute styles for every canvas, 25 times a second)
const gridTheme = { fg: '57, 255, 143', rainbow: false, anaglyph: false, n: 0 };
function readGridTheme() {
  const root = document.documentElement;
  gridTheme.fg = getComputedStyle(root).getPropertyValue('--fg-rgb').trim() || '57, 255, 143';
  gridTheme.rainbow = root.dataset.theme === 'spectrum';
  gridTheme.anaglyph = root.dataset.theme === 'anaglyph';
  gridTheme.n++; // (each canvas rebuilds its colors when this changes)
}
readGridTheme();
new MutationObserver(readGridTheme).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class', 'style'] });

function startGridBackground(canvas, { defrag = true, active } = {}) {
  const BLOCK = 5; // css px
  const GAP = 2;
  const PITCH = BLOCK + GAP;
  const TICK_MS = 40;
  const FILL = 0.42; // share of blocks that hold "data"
  const OVERLAP_MS = 5000;
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ctx = canvas.getContext('2d');

  let cols = 0;
  let rows = 0;
  let size = 0;
  let layers = []; // [{ pass, weight }] — oldest first
  let fadeStart = 0; // when the newest layer began fading in; 0 = no crossfade running

  function createPass() {
    const data = new Uint8Array(size);
    const glow = new Float32Array(size);
    let count = 0;
    for (let i = 0; i < size; i++) {
      if (Math.random() < FILL) {
        data[i] = 1;
        count++;
      }
    }
    // Blocks sitting past the packed region; each move fixes exactly one.
    let misplaced = 0;
    for (let i = count; i < size; i++) misplaced += data[i];
    return { data, glow, writePtr: 0, readPtr: size - 1, misplaced };
  }

  // One defrag move: pull the last data block into the first free slot.
  function step(pass) {
    if (!pass.misplaced) return;
    const { data, glow } = pass;
    while (data[pass.writePtr]) pass.writePtr++;
    while (!data[pass.readPtr]) pass.readPtr--;
    data[pass.readPtr] = 0;
    data[pass.writePtr] = 1;
    glow[pass.readPtr] = 0.6;
    glow[pass.writePtr] = 1;
    pass.misplaced--;
  }

  let cssW = 0;
  let cssH = 0;
  function resize() {
    // (its layout size: a pop-in animation's scale mustn't count)
    const rect = { width: canvas.clientWidth, height: canvas.clientHeight };
    cssW = rect.width;
    cssH = rect.height;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cols = Math.max(1, Math.floor(rect.width / PITCH));
    rows = Math.max(1, Math.floor(rect.height / PITCH));
    size = rect.width && rect.height ? cols * rows : 0; // (hidden: nothing to draw)
    layers = [{ pass: createPass(), weight: 1 }];
    fadeStart = 0;
    shown = new Uint8Array(0); // (the resize cleared it)
    draw();
  }

  // SPECTRUM: every block cycles through the hues like the bits do, at its own speed and phase
  const hash = (i, k) => {
    const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453;
    return x - Math.floor(x);
  };

  const ANA_CYCLE = [[70, 76, 84], [255, 40, 80], [205, 211, 217], [0, 220, 255]]; // dark grey, red, light grey, cyan

  // The plain themes: each block's brightness rounded to one of SHADES steps (too fine to see),
  // and only the blocks whose step changed since the last frame redrawn (most sit still: only
  // the twinkles and the defrag's moves change), every block of a step in one go
  const SHADES = 48;
  const MAX_ALPHA = 0.3;
  let shadeStyles = [];
  let shadeFor = -1;
  let shown = new Uint8Array(0); // each block's step as drawn (255: not drawn yet)
  const CLEAR_PAD = 0.5; // (a block's anti-aliased edge goes too; the 2px gap keeps its neighbors)
  const buckets = Array.from({ length: SHADES + 1 }, () => []);
  function drawPlain(offX, offY) {
    if (shadeFor !== gridTheme.n || shown.length !== size) { // (a new theme or size: all of it)
      shadeFor = gridTheme.n;
      shadeStyles = buckets.map((_, k) => `rgba(${gridTheme.fg}, ${(k / SHADES * MAX_ALPHA).toFixed(4)})`);
      shown = new Uint8Array(size).fill(255);
      ctx.clearRect(0, 0, cssW, cssH);
    }
    for (const b of buckets) b.length = 0;
    for (let i = 0; i < size; i++) {
      let alpha = 0;
      for (const { pass, weight } of layers) alpha += weight * ((pass.data[i] ? 0.06 : 0.018) + pass.glow[i] * 0.22);
      const k = Math.min(SHADES, Math.round(alpha / MAX_ALPHA * SHADES));
      if (k === shown[i]) continue;
      if (shown[i] !== 255) ctx.clearRect(offX + (i % cols) * PITCH - CLEAR_PAD, offY + Math.floor(i / cols) * PITCH - CLEAR_PAD, BLOCK + 2 * CLEAR_PAD, BLOCK + 2 * CLEAR_PAD);
      shown[i] = k;
      if (k > 0) buckets[k].push(i);
    }
    for (let k = 1; k <= SHADES; k++) {
      const list = buckets[k];
      if (!list.length) continue;
      ctx.fillStyle = shadeStyles[k];
      ctx.beginPath();
      for (const i of list) ctx.rect(offX + (i % cols) * PITCH, offY + Math.floor(i / cols) * PITCH, BLOCK, BLOCK);
      ctx.fill();
    }
  }

  function draw() {
    if (!size) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }
    const { rainbow, anaglyph } = gridTheme;
    if (!rainbow && !anaglyph) {
      // (on whole device pixels, so a block cleared leaves no faint edge)
      const dpr = window.devicePixelRatio || 1;
      drawPlain(Math.round((cssW - cols * PITCH + GAP) / 2 * dpr) / dpr, Math.round((cssH - rows * PITCH + GAP) / 2 * dpr) / dpr);
      return;
    }
    shown = new Uint8Array(0); // (back to a plain theme: a full redraw)
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const offX = (cssW - cols * PITCH + GAP) / 2;
    const offY = (cssH - rows * PITCH + GAP) / 2;
    const { fg } = gridTheme;
    // ANAGLYPH: each block cycles dark grey, red, light grey, cyan at its own speed and phase
    // (like SPECTRUM's hues), over a red fringe on its left and a cyan one on its right, like the bits
    const secs = performance.now() / 1000;
    for (let i = 0; i < size; i++) {
      let alpha = 0;
      for (const { pass, weight } of layers) {
        alpha += weight * ((pass.data[i] ? 0.06 : 0.018) + pass.glow[i] * 0.22);
      }
      const x = offX + (i % cols) * PITCH;
      const y = offY + Math.floor(i / cols) * PITCH;
      if (anaglyph) {
        const fringe = (alpha * 1.2).toFixed(3);
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = `rgba(255, 40, 80, ${fringe})`;
        ctx.fillRect(x - 1, y, BLOCK, BLOCK);
        ctx.fillStyle = `rgba(0, 220, 255, ${fringe})`;
        ctx.fillRect(x + 1, y, BLOCK, BLOCK);
        ctx.globalCompositeOperation = 'source-over';
        const pos = (secs * (0.25 + hash(i, 2) * 0.75) + hash(i, 1) * ANA_CYCLE.length) % ANA_CYCLE.length;
        const from = ANA_CYCLE[Math.floor(pos)];
        const to = ANA_CYCLE[(Math.floor(pos) + 1) % ANA_CYCLE.length];
        const t = pos % 1;
        const mix = (k) => Math.round(from[k] + (to[k] - from[k]) * t);
        ctx.fillStyle = `rgba(${mix(0)}, ${mix(1)}, ${mix(2)}, ${(alpha * 1.3).toFixed(3)})`;
        ctx.fillRect(x, y, BLOCK, BLOCK);
        continue;
      }
      ctx.fillStyle = rainbow
        ? `hsla(${((hash(i, 1) * 360 + secs * (36 + hash(i, 2) * 84)) % 360).toFixed(0)}, 100%, 60%, ${alpha.toFixed(3)})`
        : `rgba(${fg}, ${alpha.toFixed(3)})`;
      ctx.fillRect(x, y, BLOCK, BLOCK);
    }
  }

  function tick(now) {
    if (!size) return;
    const newest = layers[layers.length - 1].pass;
    if (defrag && !fadeStart && newest.misplaced <= OVERLAP_MS / TICK_MS) {
      layers.push({ pass: createPass(), weight: 0 });
      fadeStart = now;
    }
    if (fadeStart) {
      const t = Math.min(1, (now - fadeStart) / OVERLAP_MS);
      layers[0].weight = 1 - t;
      layers[1].weight = t;
      if (t >= 1) {
        layers.shift();
        fadeStart = 0;
      }
    }
    for (const { pass } of layers) {
      if (defrag) step(pass);
      for (let i = 0; i < size; i++) pass.glow[i] *= 0.9;
      for (let k = 0; k < 3; k++) {
        const i = Math.floor(Math.random() * size);
        if (pass.data[i]) pass.glow[i] = Math.max(pass.glow[i], 0.35);
      }
    }
    draw();
  }

  let last = 0;
  function frame(now) {
    if (now - last >= TICK_MS && !document.documentElement.classList.contains('saver-on') && (!active || active())) { // (resting under the screen saver)
      last = now;
      tick(now);
    }
    requestAnimationFrame(frame);
  }

  resize();
  if (window.ResizeObserver) new ResizeObserver(resize).observe(canvas);
  if (!reduceMotion) requestAnimationFrame(frame);
}

// (the board's and the HUD boxes' rest while the main menu covers them)
// (REDUCED EFFECTS: they all hold still)
const lowFx = () => document.documentElement.classList.contains('low-fx');
const gameShown = () => !document.body.classList.contains('at-home') && !lowFx();
startGridBackground(document.getElementById('board-bg'), { active: gameShown });
// VS setup: the defrag behind its options (the board's cells are covered)
startGridBackground(document.getElementById('vs-setup-bg'), { active: () => !lowFx() });
// START SCREEN: the starlight only, twinkling across the whole card
if (document.getElementById('start-bg')) startGridBackground(document.getElementById('start-bg'), { defrag: false, active: () => !lowFx() });
// The HUD boxes (SCORE, CHAIN, NEW LAYER IN, CURRENT...): the starlight only
document.querySelectorAll('.hud .stat:not(.cpu-stat):not(.cpu-face)').forEach((stat) => {
  const canvas = document.createElement('canvas');
  canvas.className = 'stat-bg';
  canvas.setAttribute('aria-hidden', 'true');
  stat.prepend(canvas);
  startGridBackground(canvas, { defrag: false, active: gameShown });
});

// Dev: TWINKLE BACKGROUND (dev tools, or ?twinkle): the starlight across the whole screen behind
// the game card, in place of the plain gradient. Re-read on coming back from the dev page.
const pageBg = document.getElementById('page-bg');
if (pageBg) {
  const twinkleOn = () => {
    let flag = null;
    try { flag = localStorage.getItem('bytefall-dev-twinkle'); } catch (e) {}
    return new URLSearchParams(location.search).has('twinkle') || flag === 'on';
  };
  const applyTwinkle = () => document.documentElement.classList.toggle('page-twinkle', twinkleOn());
  applyTwinkle();
  window.addEventListener('pageshow', applyTwinkle);
  window.addEventListener('focus', applyTwinkle);
  startGridBackground(pageBg, { defrag: false, active: () => document.documentElement.classList.contains('page-twinkle') });
}
