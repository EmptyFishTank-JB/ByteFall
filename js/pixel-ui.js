// PIXEL STYLE (SETTINGS; <html class="px-ui">, saved as bytefall-pixel-ui): the boxes and buttons
// get stepped pixel corners in style.css (corner-shape: notch, so the border and its neon glow
// follow the step), and here every smooth icon is redrawn in square pixels:
//   - the icon is drawn small onto a grid (12 cells across its shorter side), at the two grid
//     offsets each way, and the offset where the cells come out most clearly inked or empty is
//     kept (so a line isn't split between two rows of half-lit cells)
//   - each cell that's mostly inked becomes a pixel in the icon's own color; the text color stays
//     the text color (currentColor), so a hover, a lit button or a new theme still recolors it
//   - icons that are pixel art already (straight edges only: rects, or paths with no slants or
//     curves), the bit glyphs and the bots are left alone
// Off again, each icon gets its own drawing back. New icons (a panel filled in, a button's icon
// swapped) are caught as they're added.
const PixelUi = (() => {
  const KEY = 'bytefall-pixel-ui';
  const root = document.documentElement;
  const on = () => root.classList.contains('px-ui');
  const CELLS = 12; // (grid cells across an icon's shorter side)
  const SS = 8; // (each cell drawn as SS x SS, to read how much of it is inked)
  const INK = 0.4; // (how much of a cell must be inked to light it)
  const SENTINEL = 'rgb(255, 0, 255)'; // (the text color, drawn as this to know it again)
  const SHAPES = 'path, circle, ellipse, rect, line, polyline, polygon';
  const PROPS = ['fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'stroke-miterlimit', 'fill-rule', 'opacity', 'fill-opacity', 'stroke-opacity', 'stroke-dasharray', 'display', 'visibility'];
  const SKIP = '.svg-defs, .glyph, .px-icon, .cpu-bot, [shape-rendering="crispEdges"], .walker svg, .cpu-face svg';
  // Drawn by hand where the redraw doesn't read (too thin and slanted for the grid): rows of the
  // 12 x 12 grid, keyed by the icon's own path
  const DRAWN = {
    // (the exploit button's lightning)
    'M13 2 4 14h7l-1 8 10-13h-7z': [
      '......xxx...',
      '.....xxx....',
      '....xxx.....',
      '...xxx......',
      '..xxxxxxxx..',
      '..xxxxxxx...',
      '......xxx...',
      '.....xxx....',
      '....xxx.....',
      '....xx......',
      '...xx.......',
      '...x........',
    ],
  };
  const orig = new WeakMap(); // (svg → its own drawing: { html, sr })
  const cache = new Map(); // (an icon's drawing and colors → its pixels, or the promise of them)
  // (and kept between launches, so the icons are pixels from the first frame: a short hash of the
  // drawing and colors → its pixels; the name's number goes up when the redraw changes)
  const SAVED = 'bytefall-pixel-icons-2';
  try { localStorage.removeItem('bytefall-pixel-icons-1'); } catch (e) {} // (an older round's, some drawn blank)
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(SAVED)) || {}; } catch (e) {}
  let saveTimer = 0;
  const keep = (h, html) => {
    if (Object.keys(saved).length > 400) saved = {}; // (old icons pile up: start over)
    saved[h] = html;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => { try { localStorage.setItem(SAVED, JSON.stringify(saved)); } catch (e) {} }, 1000);
  };
  const hash = (str) => {
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193); }
    return `${(h >>> 0).toString(36)}${str.length.toString(36)}`;
  };

  // Pixel art already: only straight, upright edges (a path's moves and its across and down
  // lines; a move with more numbers draws lines from there, maybe slanted)
  const NUM = /-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/gi;
  const upright = (d) => (d.match(/[a-z][^a-z]*/gi) || []).every((c) => 'HhVvZz'.includes(c[0]) || ('Mm'.includes(c[0]) && (c.slice(1).match(NUM) || []).length <= 2));
  function isPixelArt(svg) {
    const shapes = svg.querySelectorAll(SHAPES);
    if (!shapes.length) return true;
    for (const s of shapes) {
      const tag = s.tagName.toLowerCase();
      if (tag === 'rect') { if (Number(s.getAttribute('rx')) || Number(s.getAttribute('ry'))) return false; continue; }
      if (tag === 'path') { if (!upright(s.getAttribute('d') || '')) return false; continue; }
      return false;
    }
    return true;
  }
  const wanted = (svg) => svg instanceof SVGSVGElement && svg.getAttribute('viewBox') && !svg.matches(SKIP) && !isPixelArt(svg);

  // The icon as a picture to read back: its shapes with their computed looks written in (the
  // page's CSS isn't there when it's drawn on its own), the text color as the SENTINEL
  function snapshot(svg) {
    const own = getComputedStyle(svg);
    const cur = own.color;
    const clone = svg.cloneNode(true);
    const from = svg.querySelectorAll(SHAPES);
    const to = clone.querySelectorAll(SHAPES);
    const looks = [];
    from.forEach((s, i) => {
      const cs = getComputedStyle(s);
      const style = PROPS.filter((p) => !(p === 'visibility' && cs.visibility === own.visibility)).map((p) => {
        // (hidden only when the shape is, not because the whole icon is hidden just now: a game's
        // PAUSE icon, say, on the main menu)
        let v = cs.getPropertyValue(p);
        if ((p === 'fill' || p === 'stroke') && v === cur) v = SENTINEL;
        return `${p}:${v}`;
      }).join(';');
      to[i].setAttribute('style', style);
      looks.push(style);
    });
    clone.removeAttribute('class');
    clone.removeAttribute('style');
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    return { clone, key: `${svg.getAttribute('viewBox')}|${svg.innerHTML}|${looks.join('/')}` };
  }

  const rgb = (s) => (s.match(/[\d.]+/g) || [0, 0, 0]).slice(0, 3).map(Number);
  // (its pixels: at once if they're known, or the promise of them)
  function pixelsOf(svg) {
    const [vx, vy, vw, vh] = svg.getAttribute('viewBox').split(/[\s,]+/).map(Number);
    const cell = Math.min(vw, vh) / CELLS;
    const W = Math.ceil(vw / cell);
    const H = Math.ceil(vh / cell);
    const shapes = svg.querySelectorAll(SHAPES);
    const rows = shapes.length === 1 && DRAWN[shapes[0].getAttribute('d')];
    if (rows) {
      const c = vw / rows[0].length;
      const r3 = (v) => Math.round(v * 1000) / 1000;
      let dd = '';
      rows.forEach((row, j) => row.replace(/x+/g, (run, i) => { dd += `M${r3(vx + i * c)} ${r3(vy + j * c)}h${r3(run.length * c)}v${r3(c)}h${r3(-run.length * c)}z`; return run; }));
      return `<path class="px-ink" d="${dd}" style="fill:currentColor;stroke:none"/>`;
    }
    const { clone, key } = snapshot(svg);
    if (cache.has(key)) return cache.get(key);
    const h = hash(key);
    if (saved[h]) { cache.set(key, saved[h]); return saved[h]; }
    const job = (async () => {
      // (drawn with half a cell of margin all round, so both grid offsets can be read)
      const cw = (W + 1) * SS;
      const ch = (H + 1) * SS;
      clone.setAttribute('viewBox', `${vx - cell / 2} ${vy - cell / 2} ${(W + 1) * cell} ${(H + 1) * cell}`);
      clone.setAttribute('width', cw);
      clone.setAttribute('height', ch);
      clone.setAttribute('overflow', 'visible');
      const img = new Image();
      img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(clone))}`;
      await img.decode();
      const cv = document.createElement('canvas');
      cv.width = cw;
      cv.height = ch;
      const g = cv.getContext('2d', { willReadFrequently: true });
      g.drawImage(img, 0, 0, cw, ch);
      const d = g.getImageData(0, 0, cw, ch).data;
      // a cell's ink (0..1) and its color, the cell's top left at (x, y) in the drawing's pixels
      const read = (x0, y0) => {
        let a = 0;
        let r = 0;
        let gg = 0;
        let b = 0;
        for (let y = y0; y < y0 + SS; y++) {
          if (y < 0 || y >= ch) continue;
          for (let x = x0; x < x0 + SS; x++) {
            if (x < 0 || x >= cw) continue;
            const i = (y * cw + x) * 4;
            const al = d[i + 3] / 255;
            a += al;
            r += d[i] * al;
            gg += d[i + 1] * al;
            b += d[i + 2] * al;
          }
        }
        return { ink: a / (SS * SS), col: a ? [r / a, gg / a, b / a] : null };
      };
      // the grid offset (none, or half a cell, each way) that leaves the fewest half-inked cells
      let best = null;
      for (const ox of [0, 1]) {
        for (const oy of [0, 1]) {
          const cells = [];
          let doubt = 0;
          for (let j = 0; j < H + oy; j++) {
            for (let i = 0; i < W + ox; i++) {
              const c = read((ox ? 0 : SS / 2) + i * SS, (oy ? 0 : SS / 2) + j * SS);
              doubt += Math.min(c.ink, 1 - c.ink);
              if (c.ink >= INK) cells.push({ i, j, col: c.col });
            }
          }
          if (!best || doubt < best.doubt - 1e-6) best = { doubt, cells, ox, oy };
        }
      }
      // each lit cell's color: the nearest of the icon's own (the SENTINEL meaning the text color)
      const palette = [...new Set([...clone.querySelectorAll(SHAPES)].flatMap((s) => [s.style.fill, s.style.stroke]).filter((c) => c && c.startsWith('rgb')))];
      const name = (col) => {
        let pick = palette[0] || SENTINEL;
        let far = Infinity;
        for (const p of palette) {
          const q = rgb(p);
          const dist = (q[0] - col[0]) ** 2 + (q[1] - col[1]) ** 2 + (q[2] - col[2]) ** 2;
          if (dist < far) { far = dist; pick = p; }
        }
        return pick === SENTINEL ? 'currentColor' : pick;
      };
      // runs of same-colored cells along each row, one path a color
      const x0 = vx - (best.ox ? cell / 2 : 0);
      const y0 = vy - (best.oy ? cell / 2 : 0);
      const paths = new Map();
      const lit = new Map(best.cells.map((c) => [`${c.i},${c.j}`, name(c.col)]));
      const r3 = (v) => Math.round(v * 1000) / 1000;
      for (let j = 0; j < H + best.oy; j++) {
        for (let i = 0; i < W + best.ox;) {
          const col = lit.get(`${i},${j}`);
          if (!col) { i++; continue; }
          let n = 1;
          while (lit.get(`${i + n},${j}`) === col) n++;
          paths.set(col, `${paths.get(col) || ''}M${r3(x0 + i * cell)} ${r3(y0 + j * cell)}h${r3(n * cell)}v${r3(cell)}h${r3(-n * cell)}z`);
          i += n;
        }
      }
      return [...paths].map(([col, dd]) => `<path class="px-ink" d="${dd}" style="fill:${col};stroke:none"/>`).join('');
    })();
    cache.set(key, job);
    job.then((html) => { cache.set(key, html); if (html) keep(h, html); }, () => cache.delete(key));
    return job;
  }

  function pixelize(svg) {
    if (!on() || orig.has(svg) || !svg.isConnected || !wanted(svg)) return;
    const own = { html: svg.innerHTML, sr: svg.getAttribute('shape-rendering') };
    const put = (html) => {
      if (!html || !on() || orig.has(svg) || svg.innerHTML !== own.html) return; // (changed meanwhile: it comes round again; nothing drawn: left as it is)
      orig.set(svg, own);
      svg.innerHTML = html;
      svg.setAttribute('shape-rendering', 'crispEdges');
      svg.classList.add('px-drawn-ui');
    };
    let got;
    try { got = pixelsOf(svg); } catch (e) { return; }
    if (typeof got === 'string') put(got); else got.then(put, () => {});
  }
  // (back to its own drawing; drop: the game has put a new drawing in, so only its marks go)
  function restore(svg, drop = false) {
    const own = orig.get(svg);
    if (!own) return;
    orig.delete(svg);
    if (!drop) svg.innerHTML = own.html;
    if (own.sr == null) svg.removeAttribute('shape-rendering'); else svg.setAttribute('shape-rendering', own.sr);
    svg.classList.remove('px-drawn-ui');
  }

  // (new icons, and icons whose drawing was swapped by the game, done as they come: before the
  // screen is next drawn, where their pixels are known)
  const queue = new Set();
  let queued = false;
  const flush = () => {
    queued = false;
    const list = [...queue];
    queue.clear();
    for (const svg of list) pixelize(svg);
  };
  const add = (svg) => {
    queue.add(svg);
    if (!queued) { queued = true; queueMicrotask(flush); }
  };
  const scan = (node) => {
    if (node.nodeType !== 1) return;
    if (node instanceof SVGSVGElement) add(node);
    else if (node.ownerSVGElement) add(node.ownerSVGElement);
    else node.querySelectorAll('svg').forEach(add);
  };
  const watcher = new MutationObserver((list) => {
    if (!on()) return;
    for (const m of list) {
      const svg = m.target instanceof SVGSVGElement ? m.target : m.target.ownerSVGElement;
      if (svg && orig.has(svg)) {
        // (still our pixels, whatever the change was on the way: or its own drawing swapped in by
        // the game, then it's done again)
        const ours = [...svg.children].every((n) => n.classList.contains('px-ink'));
        if (!ours) { restore(svg, true); add(svg); }
        continue;
      }
      m.addedNodes.forEach(scan);
      if (svg) add(svg);
    }
  });

  // TWO-STEP CORNERS: every rounded box's corners stepped twice, 2px a step (style.css keeps
  // corner-shape: notch at 4px on them, which clips the background and the glow to the steps' outer
  // edge). A box with a border has it drawn as a small picture (border-image) of the stepped outline
  // in its own border color, width and style (dashes on a dashed one), with its fill's color in each
  // step's inner corner (the notch cuts the fill square there; the steps don't). A box with no border
  // is clipped to the steps (px-clip). Round things (a % radius: the play buttons, the sale badge)
  // keep their own shape. Boxes are done as they come, and again when a class or a state changes on
  // them or around them (a lit button, a press, a new theme), and when their colors finish fading
  const STEP = 2; // (px a step; two steps)
  const FRAME_SKIP = '.start-walkers, .game-walkers, .page-bg, .crt-fx, .card-lights, svg, canvas, .walker, .visitor';
  const frameCache = new Map();
  const framed = new Set();
  // (any CSS color as [r, g, b, a]: drawn on a pixel and read back)
  const colorCache = new Map();
  let colorCtx = null;
  function rgbaOf(c) {
    if (colorCache.has(c)) return colorCache.get(c);
    if (!colorCtx) { const cv = document.createElement('canvas'); cv.width = cv.height = 1; colorCtx = cv.getContext('2d', { willReadFrequently: true }); }
    colorCtx.clearRect(0, 0, 1, 1);
    colorCtx.fillStyle = '#000';
    colorCtx.fillStyle = c;
    colorCtx.fillRect(0, 0, 1, 1);
    const d = colorCtx.getImageData(0, 0, 1, 1).data;
    const v = [d[0], d[1], d[2], d[3] / 255];
    colorCache.set(c, v);
    return v;
  }
  const alphaOf = (c) => rgbaOf(c)[3];
  // (one color over another)
  const over = (a, b) => {
    const o = a[3] + b[3] * (1 - a[3]);
    if (!o) return [0, 0, 0, 0];
    return [0, 1, 2].map((i) => (a[i] * a[3] + b[i] * b[3] * (1 - a[3])) / o).concat(o);
  };
  const css = (v) => `rgba(${v.slice(0, 3).map(Math.round).join(',')},${+v[3].toFixed(3)})`;
  const COLOR_RE = /(?:rgba?|color|hsla?|oklch|oklab|lab|lch)\([^()]*\)|#[0-9a-f]{3,8}\b|\btransparent\b/gi;
  // (a box's fill at its top corners and at its bottom ones: its color, and its gradients' first and
  // last colors over it (a gradient running across or round: its last); '' where it has none)
  function fillColors(cs) {
    let top = rgbaOf(cs.backgroundColor);
    let bottom = top;
    const layers = cs.backgroundImage === 'none' ? [] : cs.backgroundImage.split(/,(?![^(]*\))(?=\s*(?:none|url|[a-z-]*gradient))/i);
    for (const layer of layers.reverse()) {
      if (!/gradient\(/.test(layer)) continue;
      const cols = layer.match(COLOR_RE);
      if (!cols || !cols.length) continue;
      const first = rgbaOf(cols[0]);
      const last = rgbaOf(cols[cols.length - 1]);
      const down = /^\s*linear-gradient\(\s*(?:rgb|color|hsl|okl|lab|lch|#|transparent|to bottom\b|180deg)/i.test(layer);
      const up = /^\s*linear-gradient\(\s*(?:to top\b|0deg)/i.test(layer);
      top = over(down ? first : last, top);
      bottom = over(up ? first : last, bottom);
    }
    return { top: top[3] > 0.01 ? css(top) : '', bottom: bottom[3] > 0.01 ? css(bottom) : '' };
  }
  // (a W x H box's outline with stepped corners: row r (STEP high) of each corner set in by ins[r]
  // steps, o in from the edge for a stroke's half)
  function steppedPath(W, H, p, ins, o) {
    const n = ins.length;
    const pts = [];
    const L = o;
    const T = o;
    const R = W - o;
    const B = H - o;
    pts.push([L + ins[0] * p, T], [R - ins[0] * p, T]);
    for (let r = 0; r < n; r++) { pts.push([R - ins[r] * p, T + (r + 1) * p]); if (r + 1 < n) pts.push([R - ins[r + 1] * p, T + (r + 1) * p]); }
    pts.push([R, T + n * p], [R, B - n * p]);
    for (let r = n - 1; r >= 0; r--) pts.push([R - ins[r] * p, B - (r + 1) * p], [R - ins[r] * p, B - r * p]);
    pts.push([L + ins[0] * p, B]);
    for (let r = 0; r < n; r++) { pts.push([L + ins[r] * p, B - (r + 1) * p]); if (r + 1 < n) pts.push([L + ins[r + 1] * p, B - (r + 1) * p]); }
    pts.push([L, B - n * p], [L, T + n * p]);
    for (let r = n - 1; r >= 0; r--) pts.push([L + ins[r] * p, T + (r + 1) * p], [L + ins[r] * p, T + r * p]);
    return `M${pts.filter((q, i) => !i || q[0] !== pts[i - 1][0] || q[1] !== pts[i - 1][1]).map((q) => q.join(' ')).join('L')}Z`;
  }
  function frameImage(w, color, dashed, fill) {
    const key = `${w}|${color}|${dashed}|${fill.top}|${fill.bottom}`;
    if (frameCache.has(key)) return frameCache.get(key);
    const S = 2 * STEP + w + 2; // (a corner's slice: the steps and the line, with room)
    const N = 3 * S;
    const d = steppedPath(N, N, STEP, [2, 1], w / 2);
    const dash = dashed ? ` stroke-dasharray="3 3"` : '';
    // (each step's inner corner, where the notch has cut the fill away: the fill's color, under the line)
    // (a pixel more, into the fill, so the two meet with no seam however the screen's pixels fall)
    const a = STEP;
    const z = N - 2 * STEP - 1;
    const k = STEP + 1;
    const corner = (c, ys) => (c ? ys.map((y) => `<rect x="${a}" y="${y}" width="${k}" height="${k}" fill="${c}"/><rect x="${z}" y="${y}" width="${k}" height="${k}" fill="${c}"/>`).join('') : '');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${N}" height="${N}" viewBox="0 0 ${N} ${N}" shape-rendering="crispEdges">`
      + corner(fill.top, [a]) + corner(fill.bottom, [z])
      + `<path d="${d}" fill="none" stroke="${color}" stroke-width="${w}"${dash}/></svg>`;
    const out = { url: `url("data:image/svg+xml,${encodeURIComponent(svg)}")`, S };
    frameCache.set(key, out);
    return out;
  }
  function unframe(el) {
    if (!framed.has(el)) return;
    framed.delete(el);
    el.classList.remove('px-frame', 'px-clip');
    el.style.removeProperty('border-image');
    delete el.dataset.pxFrame;
  }
  function frame(el) {
    if (!(el instanceof HTMLElement) || el.closest(FRAME_SKIP)) return;
    const had = framed.has(el);
    // (read as it is without our frame: its own radius and border)
    if (had) { el.classList.remove('px-frame', 'px-clip'); el.style.removeProperty('border-image'); }
    const cs = getComputedStyle(el);
    const rad = cs.borderTopLeftRadius;
    if (!rad || rad === '0px' || rad.includes('%') || cs.display === 'inline') { if (had) { framed.delete(el); delete el.dataset.pxFrame; } return; }
    const w = parseFloat(cs.borderTopWidth) || 0;
    const color = cs.borderTopColor;
    framed.add(el);
    if (!w || cs.borderTopStyle === 'none' || alphaOf(color) === 0) {
      const bg = cs.backgroundColor;
      if (alphaOf(bg) > 0 || cs.backgroundImage !== 'none') el.classList.add('px-clip');
      else framed.delete(el);
      return;
    }
    const img = frameImage(Math.max(1, Math.round(w)), color, cs.borderTopStyle === 'dashed' || cs.borderTopStyle === 'dotted', fillColors(cs));
    el.style.setProperty('border-image', `${img.url} ${img.S} / ${img.S}px / 0 ${cs.borderTopStyle === 'solid' ? 'stretch' : 'round'}`);
    el.classList.add('px-frame');
    el.dataset.pxFrame = '1';
  }
  const frameRoots = new Set();
  let frameQueued = false;
  const frameFlush = () => {
    frameQueued = false;
    const roots = [...frameRoots];
    frameRoots.clear();
    if (!on()) return;
    for (const r of roots) {
      if (!r.isConnected) continue;
      frame(r);
      r.querySelectorAll('*').forEach(frame);
    }
  };
  const frameLater = (el) => {
    if (!on() || !(el instanceof HTMLElement)) return;
    frameRoots.add(el);
    if (!frameQueued) { frameQueued = true; requestAnimationFrame(frameFlush); }
  };
  // (a class change: its box done again, and the boxes inside it unless there are a great many, as
  // the page's own classes (a theme changing is a refresh of its own); changes that are only ours,
  // px-frame and px-clip, pass)
  const ourOnly = (v) => (v || '').split(/\s+/).filter((c) => c && c !== 'px-frame' && c !== 'px-clip').sort().join(' ');
  const frameWatcher = new MutationObserver((list) => {
    if (!on()) return;
    for (const m of list) {
      if (m.type === 'attributes') {
        const el = m.target;
        if (m.attributeName === 'class' && ourOnly(m.oldValue) === ourOnly(el.getAttribute('class'))) continue;
        if (el === document.body || el === root || el.getElementsByTagName('*').length > 200) { frame(el); continue; }
        frameLater(el);
      } else m.addedNodes.forEach((n) => { if (n.nodeType === 1) frameLater(n); });
    }
  });
  // (a state the class doesn't show: hovered, pressed, focused, or colors done fading; the boxes it's
  // in done again, next frame)
  const STATE_EVENTS = ['pointerover', 'pointerout', 'pointerdown', 'pointerup', 'pointercancel', 'focusin', 'focusout'];
  const stateQueue = new Set();
  let stateQueued = false;
  const stateFlush = () => {
    stateQueued = false;
    const els = [...stateQueue];
    stateQueue.clear();
    if (on()) els.forEach((el) => el.isConnected && frame(el));
  };
  function stateChanged(t) {
    if (!on() || !framed.size) return;
    for (let el = t instanceof Element ? t : null, n = 0; el && n < 6; el = el.parentElement, n++) if (framed.has(el)) stateQueue.add(el);
    if (stateQueue.size && !stateQueued) { stateQueued = true; requestAnimationFrame(stateFlush); }
  }
  STATE_EVENTS.forEach((ev) => document.addEventListener(ev, (e) => stateChanged(e.target), { passive: true, capture: true }));
  document.addEventListener('transitionend', (e) => { if (/color|background|border|^all$/.test(e.propertyName) && framed.has(e.target)) stateChanged(e.target); }, { passive: true });
  function frameAll() {
    framed.forEach((el) => unframe(el));
    if (on()) frameLater(document.body);
  }

  function set(v) {
    root.classList.toggle('px-ui', v);
    try { localStorage.setItem(KEY, v ? 'on' : 'off'); } catch (e) {}
    refresh();
  }
  // Every icon done again (after a theme change: the colors that aren't the text color are read in),
  // and every box's corners
  function refresh() {
    document.querySelectorAll('svg.px-drawn-ui').forEach((svg) => restore(svg));
    if (on()) document.querySelectorAll('svg').forEach(add);
    frameAll();
  }
  watcher.observe(document.body, { childList: true, subtree: true });
  frameWatcher.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'disabled', 'aria-pressed', 'aria-selected', 'aria-checked', 'aria-disabled'], attributeOldValue: true });
  if (on()) refresh();
  return { on, set, refresh };
})();
