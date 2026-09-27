// FONTS: the five bundled fonts (SIL OFL, assets/fonts/), fitted to the device's own COURIER so
// that switching fonts never moves or resizes anything. Loaded in <head>, before first paint.
// Each font's capitals are scaled to one height (size-adjust), and its line box is given
// Courier's height with the capitals centered where Courier's sit (ascent / descent overrides).
// So every line of text, button and display keeps the same height and place in every font, and
// the space between the letters and a button's border is the same. Courier itself differs by
// device (Courier New, Liberation Mono, Droid Sans Mono...), so it's measured here, not assumed.
(() => {
  // Each file's own metrics, in ems (measured once from the files): ascent and descent, and the
  // capitals' ink from its bottom to its top (above the baseline)
  const FONTS = [
    { family: 'Press Start 2P', file: 'press-start-2p', asc: 1.00, desc: 0.00, inkBottom: 0.13, inkTop: 1.00 },
    { family: 'Share Tech Mono', file: 'share-tech-mono', asc: 0.89, desc: 0.24, inkBottom: 0, inkTop: 0.70 },
    { family: 'Bitcount Single', file: 'bitcount-single', asc: 0.84, desc: 0.36, inkBottom: 0, inkTop: 0.60 },
    { family: 'Bytesized', file: 'bytesized', asc: 0.75, desc: 0.50, inkBottom: -0.12, inkTop: 0.38 },
    { family: 'Orbitron', file: 'orbitron', weight: '400', asc: 1.01, desc: 0.24, inkBottom: 0, inkTop: 0.72 },
    { family: 'Orbitron', file: 'orbitron-bold', weight: '700', asc: 1.01, desc: 0.24, inkBottom: 0, inkTop: 0.72 },
  ];
  // The capitals' height: Courier's own, kept between these (past them the wide fonts, PRESS START
  // and ORBITRON, would run too wide for the button rows)
  const CAP_MIN = 0.56;
  const CAP_MAX = 0.66;
  const base = document.currentScript ? document.currentScript.src : location.href;

  // Courier as this device draws it (a big size, for precision)
  const SIZE = 1000;
  const ctx = document.createElement('canvas').getContext('2d');
  ctx.font = `${SIZE}px "Courier New", Courier, monospace`;
  const m = ctx.measureText('H');
  const ok = m && 'fontBoundingBoxAscent' in m;
  const cAsc = ok ? m.fontBoundingBoxAscent / SIZE : 0.833;
  const cDesc = ok ? m.fontBoundingBoxDescent / SIZE : 0.300;
  const cCapTop = ok ? m.actualBoundingBoxAscent / SIZE : 0.571;
  const cCapBottom = ok ? -m.actualBoundingBoxDescent / SIZE : 0;
  const cap = Math.min(CAP_MAX, Math.max(CAP_MIN, cCapTop - cCapBottom));
  const center = cAsc - (cCapTop + cCapBottom) / 2; // (Courier's capitals' middle, from the line's top)

  // Every line of text gets Courier's own line height, set as a number (style.css): a line box is
  // then the same height in every font (left to the font, browsers round each font's ascent and
  // descent to whole pixels on their own, a pixel apart here and there, adding up down the card)
  document.documentElement.style.setProperty('--line', (cAsc + cDesc).toFixed(4));

  const pct = (v) => `${(v * 100).toFixed(3)}%`;
  for (const f of FONTS) {
    const s = cap / (f.inkTop - f.inkBottom); // (scaled: every font's capitals this tall)
    const asc = center + s * (f.inkTop + f.inkBottom) / 2; // (their middle where Courier's is)
    const desc = Math.max(0, cAsc + cDesc - asc); // (and the line as tall as Courier's)
    // (the overrides are in the font's own ems: size-adjust scales them too)
    const face = new FontFace(f.family, `url(${new URL(`../assets/fonts/${f.file}.woff2`, base)}) format('woff2')`, {
      weight: f.weight || 'normal', display: 'swap',
      sizeAdjust: pct(s), ascentOverride: pct(asc / s), descentOverride: pct(desc / s), lineGapOverride: '0%',
    });
    document.fonts.add(face);
  }
})();
