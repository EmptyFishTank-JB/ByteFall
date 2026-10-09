// THE SEASON'S LIGHTS (the SEASONAL theme in December, October and Valentine's): a string of old
// filament bulbs down each side of the screen, top to bottom, a bulb at either end. Fine pixel art (a
// 1px grid, finer than the bots'), built here to the screen's height: the wire in the screen's 8px
// margin, the bulbs about 48px apart, each turned its own way about its socket but always in toward the
// middle of the screen, never off its edge (hanging, leaning in, sideways, a few pointing up off the
// wire; turned pixel by pixel so they stay crisp), a stepped 1-pixel wire between them, and a soft glow
// on each. Over everything, but never in the way of a tap (style.css: no pointer events; it twinkles
// the glows in turn and hides it all on EFFECTS: REDUCED).
// FROST (January and February) has no lights: ice instead, in the same strips, a crust along each
// side of the screen (thicker toward the corners, where frost gathers), frost ferns branching in off
// it and a few glints catching the light in turn.
(() => {
  const box = document.querySelector('.card-lights');
  if (!box) return;
  const strings = [...box.querySelectorAll('i')];
  const W = 40; // (the string's strip: room for a bulb turned sideways, in toward the middle)
  const XS = [5, 10]; // (where the wire swings to, bulb by bulb: in the screen's margin)
  const GAP = 48; // (about this far between bulbs)
  const SPR = {
    c9: ['..ssss..', '..sSSs..', '..ssss..', '..cccc..', '.cchccc.', 'cchhcccc', 'chhccccc', 'chcccccc', 'cccccccC',
      'ccccccCC', '.cccccC.', '.ccccCC.', '..ccCC..', '...CC...'],
    jack: ['....g.....', '...gg.....', '..oooooo..', '.ooooooooO', 'ooyyooyyoO', 'oooyoooyoO', 'oooooooooO', 'oyyyyyyyoO',
      'ooyoyoyooO', '.ooooooOO.', '..ooOOOO..'],
    corn: ['..ssss..', '..sSSs..', '..ssss..', 'yyyyyyyY', 'yyyyyyyY', '.yyyyyY.', '.ooooOO.', '.ooooOO.', '..oooO..',
      '..wwww..', '...ww...', '...w....'],
    heart: ['...ssss...', '...sSSs...', '...ssss...', '.ccc..ccc.', 'chhcccccCC', 'chccccccCC', 'cccccccccC', '.ccccccCC.',
      '..ccccCC..', '...cccC...', '....cC....'],
  };
  const BASE = { s: '#3a4a3e', S: '#5a6a5e', g: '#3f7a2a', o: '#ff8a1f', O: '#c8600f', y: '#ffd23f', Y: '#d9a81c', w: '#fff6e8', h: '#fff8e8' };
  // (each bulb: its kind, its color, its glow; the angles go round with them, so no two neighbors match)
  const c9 = (c, glow) => ({ kind: 'c9', c, glow });
  const SETS = {
    'season-winter': { wire: '#1d3a26', bulbs: [c9('#ffe2a8', '255, 214, 150'), c9('#ffae45', '255, 170, 70'), c9('#ff5e4a', '255, 96, 72'), c9('#7ee08a', '110, 224, 130'), c9('#8ab8ff', '128, 178, 255')] },
    'season-halloween': { wire: '#1a1a1a', bulbs: [c9('#ff8a1f', '255, 138, 31'), c9('#b36bff', '179, 107, 255'), { kind: 'jack', glow: '255, 138, 31' }, c9('#7dff5a', '125, 255, 90'), { kind: 'corn', glow: '255, 190, 60' }] },
    'season-valentine': { wire: '#3a1424', bulbs: [c9('#ff8ac0', '255, 138, 192'), { kind: 'heart', c: '#ff3b5c', glow: '255, 59, 92' }, c9('#fff0f5', '255, 230, 240'), { kind: 'heart', c: '#ff8ac0', glow: '255, 138, 192' }, c9('#ff3b5c', '255, 59, 92')] },
  };
  // (degrees from hanging straight down, every one turned in toward the middle: a negative angle swings
  // the bulb away from the screen's edge on both sides, the right string being the left one mirrored)
  const ANGLES = [-18, -42, -8, -75, -95, -30, -150, -20, -52, -120, -10, -60, -38];
  const shade = (hex, k) => `#${[1, 3, 5].map((i) => Math.floor(parseInt(hex.slice(i, i + 2), 16) * k).toString(16).padStart(2, '0')).join('')}`;
  // A sprite turned about its socket's top middle, pixel by pixel: [dx, dy, letter] from that point
  const turned = new Map();
  function turn(kind, deg) {
    const key = `${kind}${deg}`;
    if (turned.has(key)) return turned.get(key);
    const rows = SPR[kind];
    const w = rows[0].length;
    const h = rows.length;
    const a = (deg * Math.PI) / 180;
    const ca = Math.cos(a);
    const sa = Math.sin(a);
    const R = Math.ceil(Math.hypot(w, h)) + 2;
    const out = [];
    for (let ty = -R; ty <= R; ty++) {
      for (let tx = -R; tx <= R; tx++) {
        const cx = tx + 0.5;
        const cy = ty + 0.5;
        const sx = Math.floor(cx * ca + cy * sa + w / 2);
        const sy = Math.floor(-cx * sa + cy * ca);
        if (sx >= 0 && sx < w && sy >= 0 && sy < h && rows[sy][sx] !== '.') out.push([tx, ty, rows[sy][sx]]);
      }
    }
    const mid = h * 0.6; // (its glow's middle)
    const res = { px: out, gx: -mid * sa, gy: mid * ca };
    turned.set(key, res);
    return res;
  }
  // One string, `len` px long, its pattern started `from` bulbs in (the two sides differ)
  function build(set, len, from) {
    const n = Math.max(2, Math.round((len - 16) / GAP) + 1);
    const sp = (len - 16) / (n - 1);
    // (the top socket 2px under the screen's top edge, the bottom bulb's tip at its foot)
    const pts = Array.from({ length: n }, (_, k) => [XS[k % 2], 2 + Math.round(k * sp)]);
    const cells = new Set();
    for (let k = 0; k < n - 1; k++) { // (the wire: a sagging curve from socket to socket, stepped)
      const [x0, y0] = pts[k];
      const [x2, y2] = pts[k + 1];
      const x1 = x0 + 2;
      const y1 = y0 + sp / 2;
      for (let i = 0; i <= 200; i++) {
        const t = i / 200;
        const x = (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * x1 + t * t * x2;
        const y = (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * y1 + t * t * y2;
        cells.add(`${Math.floor(x)},${Math.floor(y)}`);
      }
    }
    let rects = '';
    for (const c of cells) { const [x, y] = c.split(','); rects += `<rect x="${x}" y="${y}" width="1" height="1" fill="${set.wire}"/>`; }
    const glows = [[], []];
    pts.forEach(([x, y], k) => {
      const b = set.bulbs[(k + from) % set.bulbs.length];
      const pal = { ...BASE, ...(b.kind === 'jack' ? { y: '#ffe68a' } : {}), ...(b.c ? { c: b.c, C: shade(b.c, 0.72) } : {}) };
      const end = k === 0 || k === n - 1; // (the end bulbs hang, leaning in a little: one pointing up would leave the screen)
      const t = turn(b.kind, end ? (k ? (from ? -10 : -14) : (from ? -22 : -16)) : ANGLES[(k + from * 3) % ANGLES.length]);
      for (const [dx, dy, ch] of t.px) rects += `<rect x="${x + dx}" y="${y + dy}" width="1" height="1" fill="${pal[ch]}"/>`;
      glows[k % 2].push(`radial-gradient(circle at ${(x + t.gx + 14).toFixed(1)}px ${(y + t.gy + 14).toFixed(1)}px, rgba(${b.glow}, 0.8) 0, rgba(${b.glow}, 0.32) 6px, transparent 14px)`);
    });
    return { svg: `<svg width="${W}" height="${len}" viewBox="0 0 ${W} ${len}" shape-rendering="crispEdges" aria-hidden="true">${rects}</svg>`, glows };
  }
  // FROST's ice: the same strip, `len` high, the screen's edge at x = 0. seed: the side, so the two differ
  const ICE = { crust: '#b4e2ff', rim: '#f4fbff', fern: '#e8f8ff' };
  function rng(seed) {
    let h = 2166136261;
    for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
    return () => {
      h = (h + 0x6d2b79f5) | 0;
      let t = Math.imul(h ^ (h >>> 15), 1 | h);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function buildFrost(len, seed) {
    const r = rng(`frost:${seed}:${len}`);
    const px = new Map(); // ("x,y" -> [color, opacity]; the strongest kept)
    const put = (x, y, c, o) => {
      if (x < 0 || x >= W || y < 0 || y >= len) return;
      const k = `${x},${y}`;
      const was = px.get(k);
      if (!was || was[1] < o) px.set(k, [c, o]);
    };
    // (the crust: 2-4px along the edge, swelling to 9 or so at either corner, its inner edge a bright rim)
    const corner = (y) => Math.max(0, 1 - Math.min(y, len - 1 - y) / 70);
    let wob = 0;
    const edge = [];
    for (let y = 0; y < len; y++) {
      if (y % 3 === 0) wob = Math.max(-1, Math.min(1, wob + (r() < 0.5 ? -1 : 1)));
      edge[y] = Math.round(3 + wob + corner(y) ** 1.6 * 8);
    }
    let rects = '';
    for (let y = 0; y < len; y++) {
      rects += `<rect x="0" y="${y}" width="${edge[y]}" height="1" fill="${ICE.crust}" fill-opacity="0.5"/>`;
      put(edge[y], y, ICE.rim, 1);
    }
    // (a frost fern: a stem in off the crust, side branches every couple of pixels, fading out)
    const glints = [[], []];
    const line = (x0, y0, ang, n, o, fade) => {
      let x = x0;
      let y = y0;
      const dx = Math.cos(ang);
      const dy = Math.sin(ang);
      for (let i = 0; i < n; i++) {
        put(Math.round(x), Math.round(y), ICE.fern, o * (1 - (fade * i) / n));
        x += dx;
        y += dy;
      }
      return [Math.round(x), Math.round(y)];
    };
    const fern = (y, ang, n) => {
      const x0 = edge[Math.max(0, Math.min(len - 1, y))];
      const [tx, ty] = line(x0, y, ang, n, 1, 0.55);
      for (let i = 2; i < n - 1; i += 2) {
        const bx = x0 + Math.cos(ang) * i;
        const by = y + Math.sin(ang) * i;
        const m = Math.max(1, Math.round((n - i) * 0.45));
        line(bx, by, ang - 1.05, m, 0.9 * (1 - (0.6 * i) / n), 0.5);
        line(bx, by, ang + 1.05, m, 0.9 * (1 - (0.6 * i) / n), 0.5);
      }
      return [tx, ty];
    };
    // (along the side, every 30-55px; bigger toward the corners; a fan of them at each corner)
    let k = 0;
    for (let y = 18 + Math.floor(r() * 20); y < len - 18; y += 30 + Math.floor(r() * 26)) {
      const n = Math.round(8 + r() * 8 + corner(y) * 12);
      const tip = fern(y, (r() - 0.5) * 0.9, n);
      if (r() < 0.6) glints[k++ % 2].push(tip);
    }
    for (const [y, dir] of [[4, 1], [len - 5, -1]]) {
      [0.25, 0.75, 1.2].forEach((a, i) => {
        const tip = fern(y + dir * i * 6, dir * a, 12 + Math.round(r() * 6) - i * 2);
        glints[i % 2].push(tip);
      });
    }
    for (const [k2, [c, o]] of px) { const [x, y] = k2.split(','); rects += `<rect x="${x}" y="${y}" width="1" height="1" fill="${c}" fill-opacity="${o.toFixed(2)}"/>`; }
    const glow = ([x, y]) => `radial-gradient(circle at ${x + 14.5}px ${y + 14.5}px, rgba(240, 250, 255, 0.95) 0, rgba(170, 220, 255, 0.35) 2px, transparent 6px)`;
    return { svg: `<svg width="${W}" height="${len}" viewBox="0 0 ${W} ${len}" shape-rendering="crispEdges" aria-hidden="true">${rects}</svg>`, glows: glints.map((g) => g.map(glow)) };
  }
  let last = '';
  function draw() {
    if (document.documentElement.dataset.theme === 'season-frost') {
      if (!box.offsetParent) { last = ''; return; }
      const len = Math.round(box.getBoundingClientRect().height);
      const key = `season-frost/${len}`;
      if (key === last || len < 40) return;
      last = key;
      strings.forEach((el, side) => {
        const { svg, glows } = buildFrost(len, side);
        el.innerHTML = svg;
        el.style.setProperty('--glow-a', glows[0].join(', ') || 'none');
        el.style.setProperty('--glow-b', glows[1].join(', ') || 'none');
      });
      return;
    }
    const set = SETS[document.documentElement.dataset.theme];
    if (!set || !box.offsetParent) { last = ''; return; }
    const len = Math.round(box.getBoundingClientRect().height);
    const key = `${document.documentElement.dataset.theme}/${len}`;
    if (key === last || len < 40) return;
    last = key;
    strings.forEach((el, side) => {
      const { svg, glows } = build(set, len, side ? 2 : 0);
      el.innerHTML = svg;
      el.style.setProperty('--glow-a', glows[0].join(', ') || 'none');
      el.style.setProperty('--glow-b', glows[1].join(', ') || 'none');
    });
  }
  addEventListener('resize', draw);
  if (window.ResizeObserver) new ResizeObserver(draw).observe(box.parentElement);
  new MutationObserver(draw).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class'] });
  requestAnimationFrame(draw);
  window.drawCardLights = draw;
})();
