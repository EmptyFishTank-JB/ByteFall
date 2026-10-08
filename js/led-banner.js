// LED BANNERS: once the UNLOCKED / ACHIEVEMENT pop-ups as a sign of small lights (the notices are the
// notice line's plain words now, script.js's showToast; what's still used here is the icons: tag, iconSvg). The text is drawn in
// the game's own font (the FONT setting) at a small size, then read back a pixel at a time, and
// each pixel becomes a light. Its looks (the dev page's BANNER LOOK, bytefall-banner-look):
//   DOTS    round LEDs, the unlit ones faint behind
//   PIXELS  small square pixels, finer, no unlit grid
//   MARQUEE round LEDs, one line, the words running across
//   CHASE   round LEDs, a border of bulbs chasing round the sign
//   CLASSIC the plain box it was (the default, till a sign's settled on)
const LedBanner = (() => {
  const LOOKS = ['dots', 'pixels', 'marquee', 'chase', 'classic'];
  const look = () => {
    let v = null;
    try { v = localStorage.getItem('bytefall-banner-look'); } catch (e) {}
    return LOOKS.includes(v) ? v : 'classic';
  };
  const css = (name, fb) => getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fb;
  const reduced = () => document.documentElement.classList.contains('low-fx') || matchMedia('(prefers-reduced-motion: reduce)').matches;
  // The text as lit pixels: { w, h, on(x, y) }
  function raster(text, px) {
    const family = getComputedStyle(document.body).fontFamily || 'monospace';
    const cv = document.createElement('canvas');
    const g = cv.getContext('2d');
    g.font = `bold ${px}px ${family}`;
    const w = Math.max(1, Math.ceil(g.measureText(text).width) + 2);
    const h = Math.ceil(px * 1.3);
    cv.width = w;
    cv.height = h;
    g.font = `bold ${px}px ${family}`;
    g.textBaseline = 'middle';
    g.fillStyle = '#fff';
    g.fillText(text, 1, h / 2 + 0.5);
    const d = g.getImageData(0, 0, w, h).data;
    return { w, h, on: (x, y) => x >= 0 && y >= 0 && x < w && y < h && d[(y * w + x) * 4 + 3] > 120 };
  }
  // Words onto lines that fit `cells` across
  function lines(text, px, cells) {
    const family = getComputedStyle(document.body).fontFamily || 'monospace';
    const g = document.createElement('canvas').getContext('2d');
    g.font = `bold ${px}px ${family}`;
    const out = [];
    let cur = '';
    for (const word of text.split(' ')) {
      const next = cur ? `${cur} ${word}` : word;
      if (cur && g.measureText(next).width + 2 > cells) { out.push(cur); cur = word; } else cur = next;
    }
    if (cur) out.push(cur);
    return out;
  }
  let token = 0;
  // Draw `text` into the pop-up `el` (its look picked now); maxW: the room across, in CSS pixels
  function show(el, text, maxW) {
    const kind = look();
    const my = ++token;
    el.classList.remove('led', 'led-dots', 'led-pixels', 'led-marquee', 'led-chase');
    if (kind === 'classic') { el.textContent = text; return false; }
    el.classList.add('led', `led-${kind}`);
    const cell = kind === 'pixels' ? 1.7 : 2.3; // (CSS px a light)
    const px = kind === 'pixels' ? 12 : 10; // (the font size the text's drawn at)
    const pad = kind === 'chase' ? 3 : 1; // (lights round the edge)
    const across = Math.floor(maxW / cell) - pad * 2;
    let rows;
    let W;
    if (kind === 'marquee') {
      const r = raster(`${text}   *   `, px);
      rows = [r];
      W = across;
    } else {
      rows = lines(text, px, across).map((l) => raster(l, px));
      W = Math.min(across, Math.max(...rows.map((r) => r.w)));
    }
    const lineH = rows[0].h;
    const H = rows.length * lineH;
    const GW = W + pad * 2;
    const GH = H + pad * 2;
    el.innerHTML = `<canvas aria-hidden="true"></canvas><span class="led-text">${text.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</span>`;
    const cv = el.firstChild;
    const dpr = window.devicePixelRatio || 1;
    cv.style.width = `${GW * cell}px`;
    cv.style.height = `${GH * cell}px`;
    cv.width = Math.round(GW * cell * dpr);
    cv.height = Math.round(GH * cell * dpr);
    const g = cv.getContext('2d');
    const lit = css('--accent', '#ffd166');
    const t0 = performance.now();
    const frame = (now) => {
      if (my !== token || el.hidden) return;
      const t = (now - t0) / 1000;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, GW * cell, GH * cell);
      const wipe = reduced() ? GW : Math.floor(t * 520 / cell); // (the lights come on left to right)
      const shift = kind === 'marquee' && !reduced() ? Math.floor(t * 28) % rows[0].w : 0;
      const isOn = (x, y) => {
        const yy = y - pad;
        const xx = x - pad;
        if (xx < 0 || yy < 0 || xx >= W || yy >= H) return false;
        const r = rows[Math.floor(yy / lineH)];
        if (kind === 'marquee') return r.on((xx + shift) % r.w, yy % lineH);
        const off = Math.floor((W - r.w) / 2); // (each line centered)
        return r.on(xx - off, yy % lineH);
      };
      const R = cell * (kind === 'pixels' ? 0.5 : 0.4);
      // the unlit lights, faint (not on PIXELS)
      if (kind !== 'pixels') {
        g.fillStyle = 'rgba(255, 255, 255, 0.07)';
        g.beginPath();
        for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) { g.moveTo((x + 0.5) * cell + R, (y + 0.5) * cell); g.arc((x + 0.5) * cell, (y + 0.5) * cell, R * 0.75, 0, 6.283); }
        g.fill();
      }
      g.fillStyle = lit;
      g.shadowColor = lit;
      g.shadowBlur = reduced() ? 0 : cell * 1.6;
      g.beginPath();
      for (let y = 0; y < GH; y++) {
        for (let x = 0; x < GW; x++) {
          let on = x <= wipe && isOn(x, y);
          if (kind === 'chase' && (x === 0 || y === 0 || x === GW - 1 || y === GH - 1)) { // (the bulbs round the edge, chasing)
            const k = y === 0 ? x : x === GW - 1 ? GW + y : y === GH - 1 ? GW + GH + (GW - x) : 2 * GW + GH + (GH - y);
            on = k % 2 === 0 && (Math.floor(k / 2) + Math.floor(t * 8)) % 3 === 0;
          }
          if (!on) continue;
          if (kind === 'pixels') g.rect(x * cell, y * cell, cell - 0.4, cell - 0.4);
          else { g.moveTo((x + 0.5) * cell + R, (y + 0.5) * cell); g.arc((x + 0.5) * cell, (y + 0.5) * cell, R, 0, 6.283); }
        }
      }
      g.fill();
      if (kind === 'marquee' || kind === 'chase' || wipe < GW) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
    if (kind !== 'marquee' && kind !== 'chase') setTimeout(() => requestAnimationFrame(frame), 1500); // (all lit by then, even if frames were held back)
    return true;
  }
  // A little tag in pixels (ADWARE's AD): the text in the game's font, dark pixels on a lit plate
  // with stepped corners; cell: CSS px a pixel
  // A megaphone in pixels: ADWARE's mark, read the same in any language (no letters to translate)
  const MEGAPHONE = ['.......xx', '.....xxxx', 'xxx.xxxxx', 'xxxxxxxxx', 'xxx.xxxxx', '.x...xxxx', '.x.....xx'];
  const fromRows = (rows) => ({ w: rows[0].length, h: rows.length, on: (x, y) => y >= 0 && x >= 0 && y < rows.length && x < rows[0].length && rows[y][x] !== '.' });
  // The same, as an SVG in the text's own color (for a button)
  const iconSvg = (rows = MEGAPHONE) => `<svg class="px-icon" viewBox="0 0 ${rows[0].length} ${rows.length}" shape-rendering="crispEdges" aria-hidden="true">${rows.map((r, y) => [...r].map((ch, x) => (ch === '.' ? '' : `<rect x="${x}" y="${y}" width="1" height="1"/>`)).join('')).join('')}</svg>`;
  // text: words (drawn in the game's font) or pixel rows (an icon)
  function tag(text, { px = 9, cell = 1.5, fg = '#111', bg = css('--accent', '#ffd166') } = {}) {
    const r = Array.isArray(text) ? fromRows(text) : raster(text, px);
    let x0 = r.w;
    let x1 = 0;
    let y0 = r.h;
    let y1 = 0;
    for (let y = 0; y < r.h; y++) for (let x = 0; x < r.w; x++) if (r.on(x, y)) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    if (x1 < x0) { x0 = 0; x1 = r.w - 1; y0 = 0; y1 = r.h - 1; }
    const W = x1 - x0 + 5; // (2 pixels of plate each side, 1 more on the right for the shadow's look)
    const H = y1 - y0 + 5;
    const cv = document.createElement('canvas');
    const dpr = window.devicePixelRatio || 1;
    cv.width = Math.round(W * cell * dpr);
    cv.height = Math.round(H * cell * dpr);
    cv.style.width = `${W * cell}px`;
    cv.style.height = `${H * cell}px`;
    cv.className = 'px-tag';
    const g = cv.getContext('2d');
    g.setTransform(dpr * cell, 0, 0, dpr * cell, 0, 0);
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const corner = (x === 0 || x === W - 1) && (y === 0 || y === H - 1); // (stepped corners)
        if (corner) continue;
        g.fillStyle = r.on(x - 2 + x0, y - 2 + y0) ? fg : bg;
        g.fillRect(x, y, 1, 1);
      }
    }
    return cv;
  }
  return { show, tag, iconSvg, MEGAPHONE, looks: () => [...LOOKS], look };
})();
