// PIXEL MODE: the bots as true sprites on an invisible low-resolution screen, at twice the art's
// resolution (each pixel of the 16x17 art is 2x2 of the screen's: Pixel.RES). Every pixel sits on
// that grid; anything that moves, moves by whole screen pixels, and anything that turns is
// redrawn pixel by pixel (the sprite rotated, not a picture tilted). On while <html> has the
// pixel-mode class (the bot sandbox's PIXEL MODE switch, for now). Used by wanderers.js:
//   Pixel.on()                      whether it's on
//   Pixel.snapshot(svg)             the pixels a bot is showing right now: Map 'x,y' → color
//   Pixel.draw(svg, map, o)         draws them over the bot (its own art hidden meanwhile), moved
//                                   by whole pixels (o.dx, o.dy) and turned o.angle degrees about
//                                   o.pivot ([x, y]), each target pixel taking its nearest source
//   Pixel.clear(svg)                back to the bot's own art
//   Pixel.hair(svg, look)           long hair as strands with momentum and gravity (a chain of
//                                   points each), drawn as whole pixels behind the body; .step(dt,
//                                   head) moves it with the head (dx, dy, angle, pivot, worldX)
const Pixel = (() => {
  const on = () => document.documentElement.classList.contains('pixel-mode');
  // The screen's resolution: RES of its pixels to a pixel of the art each way (2: each art pixel is
  // 2x2 screen pixels, so things can move by half an art pixel and turn and flow in finer steps)
  const RES = 2;
  const snap = (v) => Math.round(v * RES) / RES; // (a length in art pixels, onto the screen's grid)
  const NS = 'http://www.w3.org/2000/svg';

  // The layers a sprite needs: drawn pixels over the bot, hair behind it
  function layer(svg, cls, behind = false) {
    let g = svg.querySelector(`:scope > g.${cls}`);
    if (!g) {
      g = document.createElementNS(NS, 'g');
      g.setAttribute('class', `px-layer ${cls}`);
      if (behind) svg.insertBefore(g, svg.querySelector(':scope > .bot-swap') || svg.firstChild);
      else svg.appendChild(g);
    }
    return g;
  }

  function visible(el, stop) {
    for (; el && el !== stop; el = el.parentNode) {
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) === 0) return false;
    }
    return true;
  }
  // (each rect's place on the bot's own grid, its moving parts' transforms included: the legs mid-
  // step, the eyes glancing; but not the whole bot's own offset, which the drawing adds back)
  function snapshot(svg) {
    const bot = svg.querySelector('.bot');
    const map = new Map();
    if (!bot) return map;
    // (read from its own art, even mid-move while that's hidden under the redrawn pixels)
    const drawn = svg.classList.contains('px-drawn');
    if (drawn) svg.classList.remove('px-drawn');
    try { return read(bot, map); } finally { if (drawn) svg.classList.add('px-drawn'); }
  }
  function read(bot, map) {
    const base = bot.getScreenCTM();
    if (!base) return map;
    const inv = base.inverse();
    for (const r of bot.querySelectorAll('rect')) {
      if (!visible(r, bot)) continue;
      const fill = getComputedStyle(r).fill;
      if (!fill || fill === 'none') continue;
      const m = inv.multiply(r.getScreenCTM());
      const x = Number(r.getAttribute('x')) || 0;
      const y = Number(r.getAttribute('y')) || 0;
      const w = Number(r.getAttribute('width')) || 1;
      const h = Number(r.getAttribute('height')) || 1;
      for (let j = 0; j < h; j++) {
        for (let i = 0; i < w; i++) {
          const px = Math.round(m.a * (x + i + 0.5) + m.c * (y + j + 0.5) + m.e - 0.5);
          const py = Math.round(m.b * (x + i + 0.5) + m.d * (y + j + 0.5) + m.f - 0.5);
          map.set(`${px},${py}`, fill); // (later ones paint over earlier, as in the art)
        }
      }
    }
    return map;
  }

  // Rows of same-colored runs as rects (few elements, crisp edges)
  // (cells keyed in screen pixels, 'x,y' with x and y in RES-ths of an art pixel)
  function rectsFrom(cells) {
    const rows = new Map();
    for (const [k, c] of cells) {
      const [x, y] = k.split(',').map(Number);
      if (!rows.has(y)) rows.set(y, []);
      rows.get(y).push([x, c]);
    }
    let out = '';
    for (const [y, list] of rows) {
      list.sort((a, b) => a[0] - b[0]);
      for (let i = 0; i < list.length;) {
        let n = 1;
        while (i + n < list.length && list[i + n][0] === list[i][0] + n && list[i + n][1] === list[i][1]) n++;
        out += `<rect x="${list[i][0] / RES}" y="${y / RES}" width="${n / RES}" height="${1 / RES}" fill="${list[i][1]}"/>`;
        i += n;
      }
    }
    return out;
  }

  // The art's pixels (art cells) moved and turned onto the screen's finer grid: every screen pixel
  // asks which art pixel lands on it (no holes, no blur); dx and dy snap to the screen's pixels
  function transform(map, { dx = 0, dy = 0, angle = 0, pivot = [8, 9] } = {}) {
    dx = snap(dx);
    dy = snap(dy);
    const out = new Map();
    if (!angle) {
      for (const [k, c] of map) {
        const [x, y] = k.split(',').map(Number);
        for (let j = 0; j < RES; j++) for (let i = 0; i < RES; i++) out.set(`${(x + dx) * RES + i},${(y + dy) * RES + j}`, c);
      }
      return out;
    }
    const a = (angle * Math.PI) / 180;
    const cos = Math.cos(a);
    const sin = Math.sin(a);
    const [px, py] = pivot;
    for (let y = -8 * RES; y < 26 * RES; y++) {
      for (let x = -8 * RES; x < 24 * RES; x++) {
        const cx = (x + 0.5) / RES - dx - px;
        const cy = (y + 0.5) / RES - dy - py;
        const sx = Math.floor(cos * cx + sin * cy + px);
        const sy = Math.floor(-sin * cx + cos * cy + py);
        const c = map.get(`${sx},${sy}`);
        if (c) out.set(`${x},${y}`, c);
      }
    }
    return out;
  }

  function draw(svg, map, o = {}) {
    const g = layer(svg, 'px-body');
    g.innerHTML = rectsFrom(transform(map, o));
    svg.classList.add('px-drawn');
  }
  function clear(svg) {
    const g = svg.querySelector(':scope > g.px-body');
    if (g) g.innerHTML = '';
    svg.classList.remove('px-drawn');
  }

  // HAIR: strands hanging from the head's crown and sides, each a chain of points carried along
  // with the head (and the bot's walk, in world pixels) with momentum and gravity, so they trail,
  // swing out, overshoot and settle; drawn as whole pixels with a line between each two points
  function hair(svg, top = 3, colors = ['#7a5236', '#a2774f']) {
    const g = layer(svg, 'px-hair', true);
    // (a full head of it: across the crown, and down each side of the head)
    const ROOTS = [[3, top], [4, top - 1], [5, top - 1], [6, top - 1], [7, top - 1], [8, top - 1], [9, top - 1], [10, top - 1], [11, top - 1], [12, top], [2, top + 1], [13, top + 1], [1, top + 2], [14, top + 2]];
    const LEN = [10, 11, 10, 9, 8, 8, 9, 10, 11, 10, 12, 12, 11, 11];
    const SEG = 1.25;
    let strands = null;
    let last = null;
    const head = (h, [x, y]) => { // (a root's place with the head moved and turned)
      const a = ((h.angle || 0) * Math.PI) / 180;
      const [px, py] = h.pivot || [8, 9];
      const cx = x - px;
      const cy = y - py;
      return [Math.cos(a) * cx - Math.sin(a) * cy + px + (h.dx || 0) + (h.worldX || 0), Math.sin(a) * cx + Math.cos(a) * cy + py + (h.dy || 0)];
    };
    function step(dt, h) {
      dt = Math.min(0.05, dt);
      if (!strands) {
        strands = ROOTS.map((r, i) => {
          const [x, y] = head(h, r);
          const side = r[0] < 8 ? -1 : 1;
          return Array.from({ length: Math.round(LEN[i] / SEG) }, (_, k) => ({ x: x + side * Math.min(k, 2) * 0.4, y: y + k * SEG, ox: x, oy: y + k * SEG }));
        });
      }
      strands.forEach((s, i) => {
        const [rx, ry] = head(h, ROOTS[i]);
        s[0].x = rx; s[0].y = ry;
        for (let k = 1; k < s.length; k++) { // (verlet: carry on as they were going, a little damped, and fall)
          const p = s[k];
          const vx = (p.x - p.ox) * 0.9;
          const vy = (p.y - p.oy) * 0.9;
          p.ox = p.x; p.oy = p.y;
          p.x += vx;
          p.y += vy + 60 * dt * dt;
        }
        for (let it = 0; it < 3; it++) { // (each link keeps its length)
          for (let k = 1; k < s.length; k++) {
            const a = s[k - 1];
            const b = s[k];
            const ddx = b.x - a.x;
            const ddy = b.y - a.y;
            const d = Math.hypot(ddx, ddy) || 1;
            const f = (d - SEG) / d;
            if (k === 1) { b.x -= ddx * f; b.y -= ddy * f; } else { a.x += ddx * f * 0.5; a.y += ddy * f * 0.5; b.x -= ddx * f * 0.5; b.y -= ddy * f * 0.5; }
          }
          s[0].x = rx; s[0].y = ry;
        }
        // (the head and body are solid: hair drapes over and around them, each strand down its own
        // side, never through; so it hangs where it shows, past the body's edges)
        const side = ROOTS[i][0] < 8 ? -1 : 1;
        const ox = (h.worldX || 0) + (h.dx || 0);
        const oy = h.dy || 0;
        for (let k = 1; k < s.length; k++) {
          const p = s[k];
          const lx = p.x - ox;
          const ly = p.y - oy;
          if (lx > 0.6 && lx < 15.4 && ly > top - 0.4 && ly < 16) p.x = ox + (side < 0 ? 0.6 - 0.2 * (k % 2) : 15.4 + 0.2 * (k % 2));
        }
        for (const p of s) if (p.y > 17.4) p.y = 17.4; // (the floor)
      });
      // Drawn: each point to the next as a line of whole pixels, in the bot's own grid
      const cells = new Map();
      const wx = h.worldX || 0;
      strands.forEach((s, i) => {
        for (let k = 1; k < s.length; k++) { // (on the screen's finer grid: thin strands)
          let x0 = Math.round((s[k - 1].x - wx) * RES);
          let y0 = Math.round(s[k - 1].y * RES);
          const x1 = Math.round((s[k].x - wx) * RES);
          const y1 = Math.round(s[k].y * RES);
          const sx = x0 < x1 ? 1 : -1;
          const sy = y0 < y1 ? 1 : -1;
          const ax = Math.abs(x1 - x0);
          const ay = Math.abs(y1 - y0);
          let err = ax - ay;
          for (;;) {
            const c = (i + k) % 5 === 0 ? colors[1] : colors[0];
            cells.set(`${x0},${y0}`, c);
            if (!cells.has(`${x0 + 1},${y0}`)) cells.set(`${x0 + 1},${y0}`, c); // (a strand an art pixel thick)
            if (x0 === x1 && y0 === y1) break;
            const e2 = 2 * err;
            if (e2 > -ay) { err -= ay; x0 += sx; }
            if (e2 < ax) { err += ax; y0 += sy; }
          }
        }
      });
      const html = rectsFrom(cells);
      if (html !== last) { g.innerHTML = html; last = html; }
    }
    return { step, remove: () => g.remove() };
  }

  return { on, RES, snap, snapshot, draw, clear, hair };
})();
