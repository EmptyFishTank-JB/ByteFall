// THE ARCADE's shell (arcade.html): what the arcade and its games use that ByteFall's script.js had given
// them while they lived in ByteFall, copied from there so the arcade needs nothing of ByteFall's game.
// The two can drift apart from here on (the arcade is on its way to an app of its own); the bits'
// looks (fillBit, the GLYPH shapes, SPECTRUM's spin) are the ones worth keeping in step with ByteFall.
const storage = {
  get(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  },
  set(key, value) {
    try { localStorage.setItem(key, value); } catch (e) {}
  },
};
// (a seed's numbers, the same every time: mulberry32)
function seeded(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const fmt = (n) => Number(n).toLocaleString('en-US'); // 12,345

// THE BITS as the theme draws them: [n], or in GLYPH a shape with one corner per point of its number
// and the number small in its corner
const GLYPHS = {
  1: '<path d="M50 12 L72.21 48.48 A26 26 0 1 1 27.79 48.48 Z"/>',
  2: '<path d="M50 12 Q90 52 50 92 Q10 52 50 12 Z"/>',
  3: '<polygon points="50.0,14.0 84.6,74.0 15.4,74.0"/>',
  4: '<polygon points="78.3,25.7 78.3,82.3 21.7,82.3 21.7,25.7"/>',
  5: '<polygon points="50.0,14.0 88.0,41.6 73.5,86.4 26.5,86.4 12.0,41.6"/>',
  6: '<polygon points="50.0,14.0 84.6,34.0 84.6,74.0 50.0,94.0 15.4,74.0 15.4,34.0"/>',
  7: '<polygon points="50.0,14.0 81.3,29.1 89.0,62.9 67.4,90.0 32.6,90.0 11.0,62.9 18.7,29.1"/>',
  8: '<polygon points="65.3,17.0 87.0,38.7 87.0,69.3 65.3,91.0 34.7,91.0 13.0,69.3 13.0,38.7 34.7,17.0"/>',
  9: '<polygon points="50.0,14.0 75.7,23.4 89.4,47.1 84.6,74.0 63.7,91.6 36.3,91.6 15.4,74.0 10.6,47.1 24.3,23.4"/>',
};
const themeIs = (id) => document.documentElement.dataset.theme === id;
const glyphSvg = (n) => `<svg class="glyph" viewBox="0 0 100 100" aria-hidden="true">${GLYPHS[n]}</svg>`;
function fillBit(el, val) {
  if (themeIs('glyph')) {
    el.innerHTML = `${glyphSvg(val)}<span class="glyph-num">${val}</span>`;
    el.classList.add('has-glyph');
    el.setAttribute('aria-label', String(val));
  } else {
    el.textContent = `[${val}]`;
    el.classList.remove('has-glyph');
    el.removeAttribute('aria-label');
  }
}
// SPECTRUM: each bit keeps its own random hue speed, direction and phase across redraws, measured from
// a shared clock so the cycle carries on smoothly
function spinBit(el, cell) {
  if (!themeIs('spectrum')) return;
  if (!cell.spin) cell.spin = { dur: 3 + Math.random() * 7, phase: Math.random(), reverse: Math.random() < 0.5 };
  const { dur, phase, reverse } = cell.spin;
  const t = performance.now() / 1000 / dur + phase;
  el.style.setProperty('--spin', `${dur.toFixed(2)}s`);
  el.style.setProperty('--spin-delay', `${(-(t % 1) * dur).toFixed(2)}s`);
  el.style.setProperty('--spin-dir', reverse ? 'reverse' : 'normal');
  el.style.setProperty('--bit-h', String(Math.round(phase * 360))); // still hue under reduced motion
}
const VIRUS_SVG = '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="5"/><path d="M12 7V3M12 21v-4M7 12H3M21 12h-4M8.5 8.5 5.5 5.5M18.5 18.5l-3-3M8.5 15.5l-3 3M18.5 5.5l-3 3"/></svg>';
