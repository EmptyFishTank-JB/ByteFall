// Shared music visualizer for the game's playlist and the dev audio page.
// Styles, switched by clicking: 'bars' (retro LED spectrum with falling peak caps) and 'wave'
// (a line with auto-gain and a CRT trail) everywhere; the MUSIC PLAYER also has an
// oscilloscope, a radial spectrum, a particle blob, a stereo vectorscope, a particle orb and more.
// Each visualizer remembers its style.
// Theme color as an 'r, g, b' triplet from style.css (falls back where the page has no theme vars).
function vizRgb(name, fallback) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

// The styles, in the order a tap cycles them, with the names the MUSIC PLAYER shows
const VIZ_NAMES = {
  bars: 'SPECTRUM', wave: 'WAVE', scope: 'OSCILLOSCOPE', spectro: 'SPECTROGRAM', vu: 'LEVEL METERS', radial: 'RADIAL',
  fluid: 'PARTICLES', vector: 'VECTORSCOPE', vectorwide: 'STEREO FIELD', lissajous: 'LISSAJOUS', matrix: 'MATRIX RAIN', bitgrid: 'BIT GRID', terrain: 'SYNTHWAVE GRID',
  plasma: 'PLASMA', tunnel: 'TUNNEL', orb: 'ORB', ocean: 'OCEAN GRID', oceantri: 'OCEAN MESH', topo: 'TOPOGRAPHY',
  cloud: 'PARTICLE CLOUD',
};

// modes: the styles this one cycles through (the playlist's small one: bars and wave);
// key: where its pick is saved; getStereo(): [left, right] analysers for the vectorscope
function createVisualizer(canvas, getAnalyser, { bars = 28, modes = ['bars', 'wave'], key = 'bytefall-viz-mode', getStereo = () => null } = {}) {
  const MODE_KEY = key;
  const SEGMENT = 3; // css px per LED segment, plus a 1px gap
  const g = canvas.getContext('2d');
  const peaks = new Float32Array(bars);
  let freq = null;
  let wave = null;
  let loudness = 0.02; // rolling peak for the wave's auto-gain
  let mode = modes[0];
  try { if (modes.includes(localStorage.getItem(MODE_KEY))) mode = localStorage.getItem(MODE_KEY); } catch (e) {}

  // The signal's colors follow the theme: its bit color (hot parts in its accent), or under
  // SPECTRUM a rainbow cycling like the bits (f: 0-1 across the bars, spokes or particles)
  // K: how many 120Hz frames this frame stands for, so the fades, trails and movement run at the
  // same speed whatever the screen's refresh rate (tuned on a 120Hz phone); dec(x) a per-frame
  // multiplier, ease(a) a per-frame step toward a target, scaled to it
  let K = 1;
  let lastDraw = 0;
  const dec = (x) => Math.pow(x, K);
  const ease = (a) => 1 - Math.pow(1 - a, K);
  // CALM: with nothing playing, the styles that would otherwise sit empty show a quiet made-up
  // signal (as WAVE does): low levels drifting across the bands, a slow two-tone wave
  let T = 0; // (now, for the calm signal)
  const calm = (n) => Float32Array.from({ length: n }, (_, b) => Math.max(0, Math.min(1, 0.16 + 0.1 * Math.sin(T / 1100 + b * 0.55) + 0.06 * Math.sin(T / 590 - b * 0.9) - (b / n) * 0.06)));
  const calmWave = (out, side = 0) => { for (let i = 0; i < out.length; i++) out[i] = 0.2 * Math.sin(i * 0.021 + T / 700 + side * 0.7) + 0.08 * Math.sin(i * 0.053 - T / 430 + side * 1.9); return out; };
  let rainbow = false;
  let hue = 0;
  let fgNow = '57, 255, 143';
  let accentNow = '255, 209, 102';
  const paint = (f, a, hot = false) => (rainbow
    ? `hsla(${((hue + f * 360) % 360).toFixed(0)}, 100%, ${hot ? 72 : 62}%, ${a})`
    : `rgba(${hot ? accentNow : fgNow}, ${a})`);

  // (drawn at 2x at least: on a 1x screen the browser scales it down, smoothing the dots and
  // lines; a phone's 3x is left as it is)
  // (and at most about 3.5 million pixels: a big monitor in FULL SCREEN at 2x would be four
  // times that, every fade and fill with it; a phone's full screen stays under it)
  const MAX_PX = 3.5e6;
  function fit() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    const dpr = Math.max(1, Math.min(Math.max(2, window.devicePixelRatio || 1), Math.sqrt(MAX_PX / Math.max(1, w * h))));
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { w, h };
  }

  function drawBars(an, w, h) {
    const fg = vizRgb('--fg-rgb', '57, 255, 143');
    const accent = vizRgb('--accent-rgb', '255, 209, 102');
    g.clearRect(0, 0, w, h);
    if (an && (!freq || freq.length !== an.frequencyBinCount)) freq = new Uint8Array(an.frequencyBinCount);
    if (an) an.getByteFrequencyData(freq);
    const hzPerBin = an ? an.context.sampleRate / an.fftSize : 1;
    const segments = Math.floor((h + 1) / (SEGMENT + 1));
    const gap = 2;
    const barW = (w - gap * (bars - 1)) / bars;
    const calmBars = an ? null : calm(bars);
    for (let b = 0; b < bars; b++) {
      let level = 0;
      if (an) {
        // 40Hz–14kHz, log-spaced so the kick and bass get their own bars
        const lo = 40 * Math.pow(14000 / 40, b / bars);
        const hi = 40 * Math.pow(14000 / 40, (b + 1) / bars);
        const from = Math.max(1, Math.floor(lo / hzPerBin));
        const to = Math.max(from + 1, Math.ceil(hi / hzPerBin));
        let peak = 0;
        for (let i = from; i < to && i < freq.length; i++) peak = Math.max(peak, freq[i]);
        level = Math.min(1, (peak / 255) * (1 + 0.7 * (b / bars))); // lift the quieter treble end
      } else level = calmBars ? calmBars[b] : 0;
      peaks[b] = Math.max(level, peaks[b] - 0.025 * K);
      const lit = Math.round(level * segments);
      const cap = Math.min(segments - 1, Math.round(peaks[b] * segments));
      const x = b * (barW + gap);
      for (let seg = 0; seg < segments; seg++) {
        const y = h - (seg + 1) * (SEGMENT + 1) + 1;
        if (seg < lit) {
          const hot = seg / segments;
          g.fillStyle = hot > 0.8 ? paint(b / bars, 0.9, true) : paint(b / bars, (0.55 + hot * 0.45).toFixed(2));
        } else if (seg === cap && cap > 0) {
          g.fillStyle = paint(b / bars, 0.75, true);
        } else {
          g.fillStyle = `rgba(${fg}, 0.08)`;
        }
        g.fillRect(x, y, barW, SEGMENT);
      }
    }
  }

  function drawWave(an, w, h, now) {
    const fg = vizRgb('--fg-rgb', '57, 255, 143');
    // Fade the previous frame instead of clearing it: a short phosphor trail
    g.globalCompositeOperation = 'destination-out';
    g.fillStyle = an ? `rgba(0, 0, 0, ${ease(0.4).toFixed(3)})` : 'rgba(0, 0, 0, 1)';
    g.fillRect(0, 0, w, h);
    g.globalCompositeOperation = 'source-over';
    const mid = h / 2;
    g.lineWidth = 1.5;
    g.lineJoin = 'round';
    g.beginPath();
    if (an) {
      if (!wave || wave.length !== an.fftSize) wave = new Float32Array(an.fftSize);
      an.getFloatTimeDomainData(wave);
      let max = 0;
      for (let i = 0; i < wave.length; i++) max = Math.max(max, Math.abs(wave[i]));
      loudness = Math.max(max, loudness * dec(0.97), 0.004);
      const gain = Math.min(14, 0.9 / loudness);
      for (let i = 0; i < wave.length; i++) {
        const x = (i / (wave.length - 1)) * w;
        const y = mid - wave[i] * gain * mid;
        if (i) g.lineTo(x, y); else g.moveTo(x, y);
      }
      g.strokeStyle = paint(0, 0.95);
      g.shadowColor = paint(0, 0.8);
      g.shadowBlur = 6;
    } else {
      const t = now / 1000;
      for (let x = 0; x <= w; x += 3) {
        const p = x / w;
        const y = mid + Math.sin(p * 12 + t * 1.3) * h * 0.1 * Math.sin(p * 3 + 0.4) + Math.sin(p * 41 + t * 3) * h * 0.02;
        if (x) g.lineTo(x, y); else g.moveTo(x, y);
      }
      g.strokeStyle = `rgba(${fg}, 0.3)`;
      g.shadowBlur = 0;
    }
    g.stroke();
    g.shadowBlur = 0;
  }

  // Log-spaced band levels 0..1 (40Hz-14kHz), as the bars use; null with nothing playing
  function bands(an, n) {
    if (!an) return null;
    if (!freq || freq.length !== an.frequencyBinCount) freq = new Uint8Array(an.frequencyBinCount);
    an.getByteFrequencyData(freq);
    const hzPerBin = an.context.sampleRate / an.fftSize;
    const out = new Float32Array(n);
    for (let b = 0; b < n; b++) {
      const lo = 40 * Math.pow(14000 / 40, b / n);
      const hi = 40 * Math.pow(14000 / 40, (b + 1) / n);
      const from = Math.max(1, Math.floor(lo / hzPerBin));
      const to = Math.max(from + 1, Math.ceil(hi / hzPerBin));
      let peak = 0;
      for (let i = from; i < to && i < freq.length; i++) peak = Math.max(peak, freq[i]);
      out[b] = Math.min(1, (peak / 255) * (1 + 0.7 * (b / n)));
    }
    return out;
  }
  function timeData(an) {
    if (!wave || wave.length !== an.fftSize) wave = new Float32Array(an.fftSize);
    an.getFloatTimeDomainData(wave);
    return wave;
  }
  // A phosphor trail: fade the last frame instead of clearing it
  function fade(w, h, amount) {
    g.globalCompositeOperation = 'destination-out';
    g.fillStyle = `rgba(0, 0, 0, ${ease(amount).toFixed(3)})`;
    g.fillRect(0, 0, w, h);
    g.globalCompositeOperation = 'source-over';
  }

  // OSCILLOSCOPE: a few cycles of the waveform, held still by triggering on a rising zero
  // crossing, over a graticule
  function drawScope(an, w, h) {
    const fg = vizRgb('--fg-rgb', '57, 255, 143');
    g.clearRect(0, 0, w, h);
    g.lineWidth = 1;
    for (let k = 1; k < 10; k++) {
      g.strokeStyle = `rgba(${fg}, ${k === 5 ? 0.25 : 0.1})`;
      g.beginPath(); g.moveTo((w * k) / 10, 0); g.lineTo((w * k) / 10, h); g.stroke();
    }
    const rows = h < 60 ? 2 : 8; // (a short one: just the center line)
    for (let k = 1; k < rows; k++) {
      g.strokeStyle = `rgba(${fg}, ${k === rows / 2 ? 0.25 : 0.1})`;
      g.beginPath(); g.moveTo(0, (h * k) / rows); g.lineTo(w, (h * k) / rows); g.stroke();
    }
    const mid = h / 2;
    g.beginPath();
    if (an) {
      const d = timeData(an);
      const span = Math.floor(d.length / 2);
      let start = 0;
      for (let i = 1; i < d.length - span; i++) {
        if (d[i - 1] < 0 && d[i] >= 0) { start = i; break; }
      }
      let max = 0;
      for (let i = start; i < start + span; i++) max = Math.max(max, Math.abs(d[i]));
      loudness = Math.max(max, loudness * 0.97, 0.004);
      const gain = Math.min(14, 0.85 / loudness);
      for (let i = 0; i < span; i++) {
        const x = (i / (span - 1)) * w;
        const y = mid - d[start + i] * gain * mid;
        if (i) g.lineTo(x, y); else g.moveTo(x, y);
      }
    } else { // (calm: the slow made-up wave)
      for (let x = 0; x <= w; x += 2) {
        const p = x / w;
        const y = mid - (0.22 * Math.sin(p * 18 + T / 600) + 0.08 * Math.sin(p * 47 - T / 380)) * mid;
        if (x) g.lineTo(x, y); else g.moveTo(x, y);
      }
    }
    g.strokeStyle = paint(0, an ? 0.95 : 0.5);
    g.lineWidth = 1.6;
    g.shadowColor = paint(0, 0.8);
    g.shadowBlur = an ? 6 : 0;
    g.stroke();
    g.shadowBlur = 0;
  }

  // RADIAL: spectrum bars around a ring (bass in the middle of each side, mirrored), the ring
  // swelling with the bass
  const radialLevels = new Float32Array(48);
  function drawRadial(an, w, h, now) {
    const fg = vizRgb('--fg-rgb', '57, 255, 143');
    const accent = vizRgb('--accent-rgb', '255, 209, 102');
    fade(w, h, 0.55);
    const n = radialLevels.length;
    const lv = bands(an, n) || calm(n);
    for (let b = 0; b < n; b++) radialLevels[b] = lv ? Math.max(lv[b], radialLevels[b] * dec(0.86)) : radialLevels[b] * dec(0.9);
    const bass = (radialLevels[0] + radialLevels[1] + radialLevels[2]) / 3;
    const cx = w / 2;
    const cy = h / 2;
    const size = Math.min(w, h) / 2;
    const r0 = size * (0.34 + 0.08 * bass);
    const room = size - r0 - 4;
    const spokes = n * 2;
    const spin = now / 9000;
    g.lineCap = 'round';
    g.lineWidth = Math.max(2, ((Math.PI * 2 * r0) / spokes) * 0.55);
    for (let k = 0; k < spokes; k++) {
      const b = k < n ? k : spokes - 1 - k; // mirrored: the two halves meet at the treble
      const level = radialLevels[b];
      const a = spin + (k / spokes) * Math.PI * 2 - Math.PI / 2;
      const len = 3 + level * room;
      g.strokeStyle = paint(k / spokes, level > 0.8 ? 0.95 : (0.35 + level * 0.65).toFixed(2), level > 0.8);
      g.beginPath();
      g.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
      g.lineTo(cx + Math.cos(a) * (r0 + len), cy + Math.sin(a) * (r0 + len));
      g.stroke();
    }
    g.lineWidth = 1.5;
    g.strokeStyle = paint(0.5, 0.6);
    g.beginPath(); g.arc(cx, cy, r0 - 4, 0, Math.PI * 2); g.stroke();
    g.fillStyle = paint(0.5, (0.05 + bass * 0.25).toFixed(2));
    g.beginPath(); g.arc(cx, cy, (r0 - 6) * (0.6 + 0.4 * bass), 0, Math.PI * 2); g.fill();
    g.lineCap = 'butt';
  }

  // PARTICLES: a liquid blob that morphs with the spectrum, shedding particles as the music
  // gets louder
  const blobLevels = new Float32Array(24);
  const particles = [];
  function drawFluid(an, w, h, now) {
    const fg = vizRgb('--fg-rgb', '57, 255, 143');
    const accent = vizRgb('--accent-rgb', '255, 209, 102');
    fade(w, h, 0.22);
    const n = blobLevels.length;
    const lv = bands(an, n);
    for (let b = 0; b < n; b++) blobLevels[b] += ((lv ? lv[b] : 0) - blobLevels[b]) * ease(0.18);
    let energy = 0;
    for (let b = 0; b < n; b++) energy += blobLevels[b];
    energy /= n;
    const cx = w / 2;
    const cy = h / 2;
    const size = Math.min(w, h) / 2;
    const t = now / 1000;
    const radiusAt = (a) => {
      // the bands wrapped around the blob, smoothly between them, plus a slow wobble
      const p = ((a / (Math.PI * 2)) % 1 + 1) % 1 * n;
      const i = Math.floor(p);
      const f = p - i;
      const level = blobLevels[i % n] * (1 - f) + blobLevels[(i + 1) % n] * f;
      return size * (0.3 + 0.32 * level + 0.04 * Math.sin(a * 3 + t * 1.1) + 0.03 * Math.sin(a * 5 - t * 1.7));
    };
    const pts = 96;
    g.beginPath();
    for (let k = 0; k <= pts; k++) {
      const a = (k / pts) * Math.PI * 2 + t * 0.2;
      const r = radiusAt(a);
      const x = cx + Math.cos(a) * r;
      const y = cy + Math.sin(a) * r;
      if (k) g.lineTo(x, y); else g.moveTo(x, y);
    }
    const grad = g.createRadialGradient(cx, cy, 0, cx, cy, size * 0.7);
    grad.addColorStop(0, paint(0, (0.25 + energy * 0.5).toFixed(2)));
    grad.addColorStop(1, paint(0.35, 0.02));
    g.fillStyle = grad;
    g.fill();
    g.strokeStyle = paint(0, 0.7);
    g.lineWidth = 1.5;
    g.stroke();
    // New particles from the blob's edge, more and faster with more energy
    // (bigger screens: more of them and faster, so they still fly out to the edges)
    const scale = Math.max(1, Math.min(w, h) / 240);
    const cap = Math.round(260 * Math.min(4, scale * scale));
    const spawn = an ? Math.floor(energy * 10 * K * Math.min(4, scale) + (Math.random() < energy * 3 * K ? 1 : 0)) : 0;
    for (let k = 0; k < spawn && particles.length < cap; k++) {
      const a = Math.random() * Math.PI * 2;
      const r = radiusAt(a);
      const speed = (0.4 + energy * 3 + Math.random() * 1.2) * scale;
      particles.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, life: 1, hot: Math.random() < energy * 0.6, f: a / (Math.PI * 2) });
    }
    for (let k = particles.length - 1; k >= 0; k--) {
      const q = particles[k];
      q.x += q.vx * K; q.y += q.vy * K;
      q.vx *= dec(0.985); q.vy *= dec(0.985);
      // a slow swirl
      const dx = q.x - cx;
      const dy = q.y - cy;
      q.x += -dy * 0.004 * K; q.y += dx * 0.004 * K;
      q.life -= 0.012 * K;
      if (q.life <= 0 || q.x < -4 || q.y < -4 || q.x > w + 4 || q.y > h + 4) { particles.splice(k, 1); continue; }
      g.fillStyle = paint(q.f, q.life.toFixed(2), q.hot);
      const ps = Math.max(2, Math.min(w, h) / 200);
      g.fillRect(q.x - ps / 2, q.y - ps / 2, ps, ps);
    }
  }

  // VECTORSCOPE: left against right, turned 45 degrees (mono is a vertical line, wide stereo
  // spreads sideways, out of phase lies flat), with the phase correlation meter along the bottom
  let correlation = 1;
  // (kind: 'vector' the true vectorscope, mid up and side across at one scale; 'wide' the STEREO
  // FIELD, the side given its own scale so the quieter stereo parts fill the width, leaning to
  // whichever side plays; 'lissajous' left across, right up, each at its own scale, mono a
  // diagonal)
  function drawVector(w, h, kind = 'vector') {
    const fg = vizRgb('--fg-rgb', '57, 255, 143');
    const accent = vizRgb('--accent-rgb', '255, 209, 102');
    fade(w, h, 0.35);
    const meterH = 14;
    const cx = w / 2;
    const cy = (h - meterH) / 2;
    const r = Math.min(w / 2, (h - meterH) / 2) - 4;
    // the axes: M (vertical), S (flat), L and R (the diagonals)
    g.lineWidth = 1;
    g.strokeStyle = `rgba(${fg}, 0.12)`;
    g.beginPath();
    g.moveTo(cx, cy - r); g.lineTo(cx, cy + r);
    g.moveTo(cx - r, cy); g.lineTo(cx + r, cy);
    g.moveTo(cx - r * 0.7, cy - r * 0.7); g.lineTo(cx + r * 0.7, cy + r * 0.7);
    g.moveTo(cx + r * 0.7, cy - r * 0.7); g.lineTo(cx - r * 0.7, cy + r * 0.7);
    g.stroke();
    g.fillStyle = `rgba(${fg}, 0.35)`;
    g.font = `9px ${getComputedStyle(canvas).fontFamily}`;
    if (kind === 'lissajous') { g.fillText('L', cx + r - 8, cy - 3); g.fillText('R', cx + 3, cy - r + 9); } else {
      g.fillText('L', cx - r * 0.7 - 8, cy - r * 0.7 + 3);
      g.fillText('R', cx + r * 0.7 + 3, cy - r * 0.7 + 3);
    }
    const pair = getStereo();
    { // (with nothing playing: the calm made-up wave, a little apart on the two sides)
      const n = pair ? pair[0].fftSize : 1024;
      if (!wave || wave.length !== n) wave = new Float32Array(n);
      if (!vectorR || vectorR.length !== n) vectorR = new Float32Array(n);
      if (pair) { pair[0].getFloatTimeDomainData(wave); pair[1].getFloatTimeDomainData(vectorR); } else { calmWave(wave, 0); calmWave(vectorR, 1); }
      let max = 0;
      let lr = 0;
      let ll = 0;
      let rr = 0;
      for (let i = 0; i < wave.length; i++) {
        max = Math.max(max, Math.abs(wave[i]), Math.abs(vectorR[i]));
        lr += wave[i] * vectorR[i]; ll += wave[i] * wave[i]; rr += vectorR[i] * vectorR[i];
      }
      // scaled by the average level (not the peaks), so the shape fills the scope
      const rms = Math.sqrt((ll + rr) / (2 * wave.length));
      vectorLevel += (Math.max(rms, 0.002) - vectorLevel) * ease(0.08);
      const gain = Math.min(60, 0.22 / vectorLevel) * r;
      // (the side's own level, and the left's and right's, for the scales that stretch them)
      let ss = 0;
      for (let i = 0; i < wave.length; i++) { const sd = vectorR[i] - wave[i]; ss += sd * sd; }
      const sideRms = Math.sqrt(ss / (2 * wave.length));
      vectorSide += (Math.max(sideRms, 0.0005) - vectorSide) * ease(0.06);
      vectorL += (Math.max(Math.sqrt(ll / wave.length), 0.002) - vectorL) * ease(0.08);
      vectorRl += (Math.max(Math.sqrt(rr / wave.length), 0.002) - vectorRl) * ease(0.08);
      // (the side stretched to about the mid's spread, at most 10 times: near-silent stereo isn't blown up)
      const sideGain = kind === 'wide' ? Math.min(gain * 10, Math.max(gain, (0.17 / vectorSide) * r)) : gain;
      const gl = Math.min(60, 0.25 / vectorL) * r;
      const gr = Math.min(60, 0.25 / vectorRl) * r;
      g.fillStyle = paint(0, 0.7);
      for (let i = 0; i < wave.length; i += 2) {
        let x;
        let y;
        if (kind === 'lissajous') { x = wave[i] * gl * 0.7; y = -vectorR[i] * gr * 0.7; } else {
          x = (vectorR[i] - wave[i]) * sideGain * 0.7071;
          y = -(wave[i] + vectorR[i]) * gain * 0.7071;
        }
        const d = Math.hypot(x, y);
        if (d > r) { x *= r / d; y *= r / d; } // (loud peaks pinned to the edge)
        if (kind !== 'vector') g.fillStyle = paint((Math.atan2(y, x) / (Math.PI * 2) + 1) % 1, Math.min(1, 0.45 + (d / r) * 0.55).toFixed(2), d > r * 0.85);
        g.fillRect(cx + x, cy + y, 1.5, 1.5);
      }
      const now = ll > 1e-9 && rr > 1e-9 ? lr / Math.sqrt(ll * rr) : 1;
      correlation += (now - correlation) * ease(0.15);
    }
    // correlation: -1 (out of phase) to +1 (mono)
    const y = h - meterH + 4;
    g.clearRect(0, h - meterH, w, meterH);
    g.fillStyle = `rgba(${fg}, 0.12)`;
    g.fillRect(16, y, w - 32, 5);
    const x = 16 + ((correlation + 1) / 2) * (w - 32);
    g.fillStyle = paint((correlation + 1) / 2, 0.95, correlation < 0);
    g.fillRect(x - 2, y - 2, 4, 9);
    g.fillStyle = `rgba(${fg}, 0.45)`;
    g.fillText('-1', 0, y + 6);
    g.fillText('+1', w - 13, y + 6);
  }
  let vectorR = null;
  let vectorLevel = 0.02; // a running average of the level, for the scale
  let vectorSide = 0.005; // (and of the side, the left's and the right's: the STEREO FIELD's and LISSAJOUS's scales)
  let vectorL = 0.02;
  let vectorRl = 0.02;

  const rgbOf = (str) => str.split(',').map((n) => parseFloat(n));
  const hsl = (f, l, a) => `hsla(${((hue + f * 360) % 360).toFixed(0)}, 100%, ${l}%, ${a})`;
  // Moves what's drawn left by dx css px (the rest is cleared)
  function scrollLeft(w, h, dx) {
    const dpr = canvas.width / w;
    g.save();
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.globalCompositeOperation = 'copy';
    g.drawImage(canvas, -Math.round(dx * dpr), 0);
    g.restore();
  }

  // SPECTROGRAM: the spectrum as a heat-map scrolling left, low notes at the bottom
  let spectroAcc = 0;
  function drawSpectro(an, w, h) {
    const rows = Math.max(8, Math.min(64, Math.floor(h / 3)));
    spectroAcc += 2 * K; // (2px a 120Hz frame)
    const colW = Math.floor(spectroAcc);
    if (!colW) return;
    spectroAcc -= colW;
    scrollLeft(w, h, colW);
    const lv = bands(an, rows) || calm(rows).map((v) => Math.max(0, v - 0.1) * 0.9); // (calm: faint threads)
    const cellH = h / rows;
    for (let r = 0; r < rows; r++) {
      const level = lv ? lv[r] : 0;
      if (level < 0.04) continue;
      g.fillStyle = paint(r / rows, Math.min(1, level * 1.1).toFixed(2), level > 0.8);
      g.fillRect(w - colW, h - (r + 1) * cellH, colW, Math.ceil(cellH));
    }
  }

  // LEVEL METERS: left and right as LED ladders (-48 to 0 dB) with peak holds
  const vuLevel = [0, 0];
  const vuPeak = [0, 0];
  let vuBuf = null;
  function drawVu(an, w, h) {
    g.clearRect(0, 0, w, h);
    const pair = getStereo() || (an ? [an, an] : null);
    const calmVu = pair ? null : calm(2);
    const small = h < 60;
    const labelW = small ? 0 : 14;
    const gap = small ? 3 : 10;
    const top = small ? 0 : 16; // (under the player's style name)
    const barH = (h - top - gap * 3) / 2;
    const segW = small ? 3 : 5;
    const segs = Math.floor((w - labelW - gap * 2 + 1) / (segW + 1));
    for (let ch = 0; ch < 2; ch++) {
      let level = 0;
      if (pair) {
        const a = pair[ch];
        if (!vuBuf || vuBuf.length !== a.fftSize) vuBuf = new Float32Array(a.fftSize);
        a.getFloatTimeDomainData(vuBuf);
        let sq = 0;
        for (let i = 0; i < vuBuf.length; i++) sq += vuBuf[i] * vuBuf[i];
        const db = 20 * Math.log10(Math.sqrt(sq / vuBuf.length) + 1e-6) + 12; // (+12: the mix sits low)
        level = Math.max(0, Math.min(1, (db + 48) / 48));
      } else level = calmVu[ch] * 1.4;
      vuLevel[ch] = Math.max(level, vuLevel[ch] - 0.03 * K);
      vuPeak[ch] = Math.max(vuLevel[ch], vuPeak[ch] - 0.006 * K);
      const y = top + gap + ch * (barH + gap);
      if (!small) {
        g.fillStyle = paint(0, 0.6);
        g.font = `${Math.min(12, barH * 0.6)}px ${getComputedStyle(canvas).fontFamily}`;
        g.fillText(ch ? 'R' : 'L', 2, y + barH * 0.7);
      }
      const lit = Math.round(vuLevel[ch] * segs);
      const peak = Math.min(segs - 1, Math.round(vuPeak[ch] * segs));
      for (let k = 0; k < segs; k++) {
        const x = labelW + gap + k * (segW + 1);
        const f = k / segs;
        if (k < lit) g.fillStyle = f > 0.85 ? paint(f, 0.95, true) : paint(f, (0.5 + f * 0.5).toFixed(2));
        else if (k === peak && peak > 0) g.fillStyle = paint(f, 0.8, true);
        else g.fillStyle = paint(f, 0.08);
        g.fillRect(x, y, segW, barH);
      }
    }
  }

  // MATRIX RAIN: columns of 0s and 1s falling, each column a band of the spectrum (louder:
  // faster and brighter)
  let rain = [];
  function drawMatrix(an, w, h) {
    const size = 12;
    const cols = Math.max(4, Math.floor(w / size));
    if (rain.length !== cols) rain = Array.from({ length: cols }, () => ({ y: Math.random() * h, acc: 0 }));
    fade(w, h, 0.09);
    const lv = bands(an, cols);
    g.font = `${size}px ${getComputedStyle(canvas).fontFamily}`;
    g.textAlign = 'center';
    for (let c = 0; c < cols; c++) {
      const level = lv ? lv[(c * 7) % cols] : 0.08; // (bands scattered so the bass isn't all at the left)
      const drop = rain[c];
      drop.acc += (0.08 + level * 0.9) * K;
      while (drop.acc >= 1) {
        drop.acc -= 1;
        drop.y += size;
        if (drop.y > h + size) drop.y = -Math.random() * h * 0.5;
        g.fillStyle = paint(c / cols, (0.35 + level * 0.65).toFixed(2), level > 0.85);
        g.fillText(Math.random() < 0.5 ? '0' : '1', c * size + size / 2, drop.y);
      }
    }
    g.textAlign = 'start';
  }

  // BIT GRID: a 7x7 board, each column a band of the spectrum stacking bits as high as it's
  // loud, each bit showing its column's height; a full column flashes like a decrypt
  const gridLevels = new Float32Array(7);
  const gridFlash = new Float32Array(7);
  function drawBitGrid(an, w, h) {
    g.clearRect(0, 0, w, h);
    const lv = bands(an, 7) || calm(7).map((v) => v * 1.9); // (calm: a few bits stacking and settling)
    const cell = Math.min((w - 16) / 7, (h - 12) / 7);
    const x0 = (w - cell * 7) / 2;
    const y0 = (h - cell * 7) / 2;
    g.font = `${Math.floor(cell * 0.42)}px ${getComputedStyle(canvas).fontFamily}`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    for (let c = 0; c < 7; c++) {
      const level = lv ? lv[c] : 0;
      gridLevels[c] = Math.max(level, gridLevels[c] - 0.04 * K);
      const n = Math.round(gridLevels[c] * 7);
      if (n >= 7 && gridFlash[c] <= 0) gridFlash[c] = 1;
      gridFlash[c] = Math.max(0, gridFlash[c] - 0.06 * K);
      for (let r = 0; r < 7; r++) {
        const x = x0 + c * cell + 2;
        const y = y0 + (6 - r) * cell + 2;
        const s = cell - 4;
        if (r < n) {
          const hot = gridFlash[c] > 0;
          g.fillStyle = hot ? paint(c / 7, (0.25 + 0.5 * gridFlash[c]).toFixed(2), true) : paint(c / 7, 0.12);
          g.fillRect(x, y, s, s);
          g.strokeStyle = paint(c / 7, 0.9, hot);
          g.lineWidth = 1;
          g.strokeRect(x + 0.5, y + 0.5, s - 1, s - 1);
          g.fillStyle = paint(c / 7, 0.95, hot);
          g.fillText(String(n), x + s / 2, y + s / 2 + 1);
        } else {
          g.strokeStyle = paint(c / 7, 0.1);
          g.strokeRect(x + 0.5, y + 0.5, s - 1, s - 1);
        }
      }
    }
    g.textAlign = 'start';
    g.textBaseline = 'alphabetic';
  }

  // SYNTHWAVE GRID: a sun on the horizon pulsing with the bass, and one landscape rolling toward
  // you: a single wireframe mesh, flat down the middle (the road's grid) and rising at the sides
  // into jagged spikes, tallest at the lower outer edges and fading out toward the vanishing
  // point. The spikes are part of the mesh, so they travel with the grid; the music lifts them
  // (the bass nearest the road, the treble out at the edges).
  const T_COLS = 16; // (vertices each side of the middle, half a unit apart)
  const T_ROWS = 28; // (rows of the mesh, a unit apart, from near to far)
  const T_ROAD = 1; // (the flat road's half width)
  const T_CAM = 1; // (the camera's height over the road)
  const tLevels = new Float32Array(12);
  let tScroll = 0;
  let tRow = 0; // (the id of the nearest row: each row keeps its own spikes as it comes)
  let tLast = 0;
  let tBg = '#000';
  let tBgAt = -1e9;
  // A spike's height at a vertex, 0.15 to 1, the same every time for that vertex of that row
  const tSpike = (i, row) => {
    const n = Math.sin(i * 127.1 + row * 311.7) * 43758.5453;
    const f = n - Math.floor(n);
    return 0.15 + 0.85 * f * f;
  };
  function drawTerrain(an, w, h, now) {
    g.clearRect(0, 0, w, h);
    const lv = bands(an, 12);
    for (let b = 0; b < 12; b++) tLevels[b] = Math.max(lv ? lv[b] : 0, tLevels[b] * dec(0.9)); // (quick up, eased down)
    const bass = (tLevels[0] + tLevels[1] + tLevels[2]) / 3;
    const dt = tLast ? Math.min(0.1, (now - tLast) / 1000) : 0;
    tLast = now;
    tScroll += dt * (1.2 + bass * 2.5);
    while (tScroll >= 1) { tScroll -= 1; tRow++; }
    const horizon = h * 0.46;
    const cx = w / 2;
    const f = h * 0.9;
    // the sun, sitting on the mesh's far edge (no gap under it)
    const base = horizon + (T_CAM / (T_ROWS - 1)) * f;
    const sunR = Math.min(w, h) * (0.24 + bass * 0.04);
    g.save();
    g.beginPath(); g.rect(0, 0, w, base); g.clip();
    const glow = g.createRadialGradient(cx, base, sunR * 0.8, cx, base, sunR * 1.8);
    glow.addColorStop(0, rainbow ? hsl(0.1, 45, 0.35) : `rgba(${accentNow}, 0.3)`);
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    g.fillStyle = glow;
    g.fillRect(0, 0, w, base);
    const sunGrad = g.createLinearGradient(0, base - sunR, 0, base);
    sunGrad.addColorStop(0, rainbow ? hsl(0.1, 65, 0.95) : `rgba(${accentNow}, 0.95)`);
    sunGrad.addColorStop(1, rainbow ? hsl(0.8, 60, 0.9) : `rgba(${fgNow}, 0.9)`);
    g.fillStyle = sunGrad;
    g.beginPath(); g.arc(cx, base, sunR, Math.PI, 0); g.fill();
    g.restore();
    // The mesh: world x (across), y (up), z (away) to the screen
    const px = (x, z) => cx + (x / z) * f;
    const py = (y, z) => horizon + ((T_CAM - y) / z) * f;
    const pts = [];
    for (let k = 0; k <= T_ROWS; k++) {
      const z = k + 1 - tScroll;
      const row = [];
      for (let i = -T_COLS; i <= T_COLS; i++) {
        const x = i * 0.5;
        const side = Math.max(0, Math.abs(x) - T_ROAD);
        let y = 0;
        if (side > 0) {
          const lift = Math.min(1, side / 3) ** 1.3; // (rising toward the edges)
          const band = Math.min(11, Math.floor((side / (T_COLS * 0.5 - T_ROAD)) * 12));
          y = lift * 2.6 * tSpike(i, tRow + k) * (0.35 + 0.9 * tLevels[band]);
        }
        row.push([px(x, z), py(y, z), y]);
      }
      pts.push(row);
    }
    if (now - tBgAt > 1000) { // (the theme's background, re-read once a second: reading it is slow)
      tBgAt = now;
      tBg = getComputedStyle(document.documentElement).getPropertyValue('--bg-solid').trim() || '#000';
    }
    const bg = tBg;
    g.lineJoin = 'round';
    g.lineWidth = 1;
    // Far to near (each row hiding what's behind it), a row at a time: its faces filled, then
    // its edges stroked (the road's softer, the tallest peaks in the hot color). The far rows
    // fade out, faces and all, into the sun's glow.
    for (let k = T_ROWS - 1; k >= 0; k--) {
      const near = pts[k];
      const far = pts[k + 1];
      const z = k + 1 - tScroll;
      const fadeOut = Math.max(0, 1 - z / T_ROWS) ** 1.4; // (gone at the vanishing point)
      if (fadeOut <= 0.01) continue;
      const faces = new Path2D();
      const road = new Path2D();
      const hills = new Path2D();
      const peaks = new Path2D();
      const poly = (path, ...ps) => { path.moveTo(ps[0][0], ps[0][1]); for (let n = 1; n < ps.length; n++) path.lineTo(ps[n][0], ps[n][1]); path.closePath(); };
      for (let j = 0; j < 2 * T_COLS; j++) {
        const a = near[j]; const b = near[j + 1]; const c = far[j + 1]; const d = far[j];
        if (!a[2] && !b[2] && !c[2] && !d[2]) { // (the road: plain squares, flat, hiding nothing: not filled)
          poly(road, a, b, c, d);
        } else { // (the hills: two triangles)
          poly(faces, a, b, c, d);
          const edges = (a[2] + b[2] + c[2] + d[2]) / 4 > 1.5 ? peaks : hills;
          poly(edges, a, b, c);
          poly(edges, a, c, d);
        }
      }
      g.globalAlpha = Math.min(1, fadeOut * 4);
      g.fillStyle = bg;
      g.fill(faces);
      g.globalAlpha = 1;
      g.strokeStyle = paint(0.3, (fadeOut * 0.55).toFixed(3)); g.stroke(road);
      g.strokeStyle = paint(0.7, (fadeOut * 0.9).toFixed(3)); g.stroke(hills);
      g.strokeStyle = paint(0.9, (fadeOut * 0.95).toFixed(3), true); g.stroke(peaks);
    }
  }

  // PLASMA: a flowing field of color, warped by the bass and sped up by the treble
  const plasmaCanvas = document.createElement('canvas');
  const pg = plasmaCanvas.getContext('2d');
  let plasmaT = 0;
  function drawPlasma(an, w, h) {
    const lv = bands(an, 12);
    const bass = lv ? (lv[0] + lv[1] + lv[2]) / 3 : 0.1;
    const treble = lv ? (lv[8] + lv[9] + lv[10] + lv[11]) / 4 : 0.05;
    plasmaT += (0.02 + treble * 0.08) * K;
    const cw = Math.max(16, Math.round(w / 6));
    const chh = Math.max(4, Math.round(h / 6));
    if (plasmaCanvas.width !== cw || plasmaCanvas.height !== chh) { plasmaCanvas.width = cw; plasmaCanvas.height = chh; }
    const img = pg.createImageData(cw, chh);
    const fg = rgbOf(fgNow);
    const ac = rgbOf(accentNow);
    const warp = 1 + bass * 2.5;
    for (let y = 0; y < chh; y++) {
      for (let x = 0; x < cw; x++) {
        const u = x / cw * 6;
        const v = y / chh * 6 * (chh / cw) * 3;
        let val = Math.sin(u * warp + plasmaT) + Math.sin(v + plasmaT * 1.3)
          + Math.sin((u + v) * 0.7 + plasmaT * 0.7) + Math.sin(Math.hypot(u - 3, v - 3) * warp - plasmaT * 1.6);
        val = (val + 4) / 8; // 0..1
        const i = (y * cw + x) * 4;
        let r, gg, b;
        if (rainbow) {
          const hh = ((hue / 360 + val) % 1) * 6;
          const k = (n) => { const q = (n + hh) % 6; return 255 * (1 - Math.max(0, Math.min(1, Math.min(q, 4 - q)))); };
          r = k(5); gg = k(3); b = k(1);
        } else {
          r = fg[0] + (ac[0] - fg[0]) * val; gg = fg[1] + (ac[1] - fg[1]) * val; b = fg[2] + (ac[2] - fg[2]) * val;
        }
        img.data[i] = r; img.data[i + 1] = gg; img.data[i + 2] = b;
        img.data[i + 3] = 255 * (0.15 + 0.6 * Math.pow(val, 1.5) * (0.5 + bass));
      }
    }
    pg.putImageData(img, 0, 0);
    g.clearRect(0, 0, w, h);
    g.imageSmoothingEnabled = true;
    g.drawImage(plasmaCanvas, 0, 0, w, h);
  }

  // ORB: a sphere of particles in the middle, turning slowly clockwise (seen from above) on its
  // tilted axis. Each patch of it listens to its own part of the spectrum (the bass around its
  // foot, the treble at its crown, the bands wandering around it with the longitude): a patch
  // swells out and glows as its band plays, its hottest particles in the theme's accent
  const ORB_N = 720;
  const ORB_BANDS = 16;
  let orb = null;
  const orbLevels = new Float32Array(ORB_BANDS);
  function orbMake() {
    const pts = [];
    const golden = Math.PI * (3 - Math.sqrt(5)); // (a Fibonacci sphere: evenly spread)
    for (let i = 0; i < ORB_N; i++) {
      const y = 1 - (i / (ORB_N - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const a = i * golden;
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      const lon = (Math.atan2(z, x) / (Math.PI * 2) + 1) % 1;
      // (its band: up the sphere from bass to treble, shifted a little around it, so the areas
      // that light up are patches, not rings)
      const band = Math.max(0, Math.min(ORB_BANDS - 1, Math.floor(((1 - y) / 2) * ORB_BANDS * 0.85 + Math.sin(lon * Math.PI * 6) * 1.6 + 1)));
      pts.push({ x, y, z, band, jit: Math.random() * Math.PI * 2, f: lon });
    }
    return pts;
  }
  function drawOrb(an, w, h, now) {
    if (!orb) orb = orbMake();
    fade(w, h, 0.5);
    const lv = bands(an, ORB_BANDS);
    for (let b = 0; b < ORB_BANDS; b++) orbLevels[b] = lv ? Math.max(lv[b], orbLevels[b] * dec(0.88)) : orbLevels[b] * dec(0.92);
    const energy = orbLevels.reduce((t, v) => t + v, 0) / ORB_BANDS;
    const cx = w / 2;
    const cy = h / 2;
    const R = Math.min(w, h) * 0.32 * (1 + energy * 0.06);
    const spin = -now / 6000; // (clockwise from above: its front moving left)
    const tilt = 0.38; // (its axis leaning toward you a little, so the top shows)
    const cs = Math.cos(spin);
    const sn = Math.sin(spin);
    const ct = Math.cos(tilt);
    const st = Math.sin(tilt);
    const t = now / 1000;
    const shown = [];
    for (const p of orb) {
      const lvl = orbLevels[p.band];
      // (out from the middle as its band plays, with a shimmer so a loud patch fizzes)
      const push = 1 + lvl * 0.32 + (lvl > 0.5 ? Math.sin(t * 9 + p.jit) * 0.04 * lvl : 0);
      let x = p.x * cs + p.z * sn;
      let z = -p.x * sn + p.z * cs;
      let y = p.y;
      const y2 = y * ct - z * st;
      z = y * st + z * ct;
      y = y2;
      x *= push; y *= push; z *= push;
      shown.push({ x, y, z, lvl, f: p.f });
    }
    shown.sort((a, b) => a.z - b.z); // (the far side first, faint and small)
    const dot = Math.max(1.5, Math.min(w, h) / 160);
    for (const q of shown) {
      const depth = (q.z + 1.3) / 2.6; // (0 at the back, 1 at the front)
      const persp = 1 / (1.9 - q.z * 0.45);
      const px = cx + q.x * R * persp * 1.6;
      const py = cy + q.y * R * persp * 1.6;
      const size = dot * (0.5 + depth * 0.8) * (1 + q.lvl * 0.9);
      const hot = q.lvl > 0.72 && depth > 0.35;
      g.fillStyle = paint(q.f, Math.min(1, 0.12 + depth * 0.45 + q.lvl * 0.55).toFixed(2), hot);
      g.fillRect(px - size / 2, py - size / 2, size, size);
    }
  }

  // OCEAN (GRID or MESH): a sea of particles out to the horizon and past every edge of the screen,
  // each joined to its neighbors by a thin line (a square grid, or a triangle mesh), fading out
  // with the distance, and travelling: the view drifts over it in a slowly wandering direction
  // (always looking the same way). The sea is endless: its swell is one big square tile mirrored
  // on all four sides, so it carries on seamlessly however far it goes. The music rides on it:
  // across the screen the spectrum (the bass in the middle, the treble out at the sides), the
  // nearest row the music now and each row further out a moment older, so the swells roll away
  const SEA_COLS = 96;
  const SEA_ROWS = 22;
  const SEA_BANDS = 12;
  const SEA_TILE = 14; // (the swell's tile, in the sea's own units, mirrored at each edge)
  let seaHist = [];
  let seaAt = 0;
  const seaLv = new Float32Array(SEA_BANDS);
  const seaCam = { x: 0, z: 0, ang: Math.random() * Math.PI * 2, turn: 0, last: 0 };
  const mirror = (u) => { const m = ((u % (2 * SEA_TILE)) + 2 * SEA_TILE) % (2 * SEA_TILE); return m > SEA_TILE ? 2 * SEA_TILE - m : m; };
  function drawOcean(an, w, h, now, tri) {
    g.clearRect(0, 0, w, h);
    const lv = bands(an, SEA_BANDS);
    let energy = 0;
    for (let b = 0; b < SEA_BANDS; b++) { seaLv[b] = lv ? Math.max(lv[b], seaLv[b] * dec(0.86)) : seaLv[b] * dec(0.9); energy += seaLv[b] / SEA_BANDS; }
    if (!seaHist.length || now - seaAt > 45) { // (a row of the spectrum's history every 45ms)
      seaAt = now;
      seaHist.unshift(Float32Array.from(seaLv));
      if (seaHist.length > SEA_ROWS) seaHist.length = SEA_ROWS;
    }
    // (on the move: the heading wanders, a little faster with the music)
    const dt = seaCam.last ? Math.min(0.1, (now - seaCam.last) / 1000) : 0;
    seaCam.last = now;
    seaCam.turn = Math.max(-0.35, Math.min(0.35, seaCam.turn + (Math.random() - 0.5) * dt * 1.2));
    seaCam.ang += seaCam.turn * dt;
    const speed = 0.8 + energy * 1.2;
    seaCam.x += Math.sin(seaCam.ang) * speed * dt;
    seaCam.z += Math.cos(seaCam.ang) * speed * dt;
    const t = now / 1000;
    const cx = w / 2;
    const horizon = h * 0.3;
    const f = h * 0.95;
    const camH = 1.1;
    const zNear = 0.95; // (the nearest row just below the bottom edge)
    const dz = 0.6;
    const zFar = zNear + (SEA_ROWS - 1) * dz;
    const fx = f * 0.42;
    const halfW = ((w * 0.62) * zFar) / fx; // (wide enough that the farthest row runs past both sides)
    const dx = (2 * halfW) / (SEA_COLS - 1);
    // (from just in front of the camera, so the sea runs on past the bottom of the screen whatever
    // the rows' spacing as it travels: no cut-off along the bottom)
    const j0 = Math.ceil((seaCam.z + 0.3) / dz);
    const i0 = Math.floor((seaCam.x - halfW) / dx);
    const pts = [];
    const rows = SEA_ROWS + Math.ceil((zNear - 0.3) / dz);
    for (let r = 0; r <= rows; r++) {
      const j = j0 + r;
      const zv = j * dz - seaCam.z;
      const hist = seaHist[Math.max(0, Math.min(seaHist.length - 1, Math.floor((zv - zNear) / dz)))];
      const shift = tri && (j & 1) ? 0.5 : 0;
      const line = [];
      for (let k = 0; k <= SEA_COLS; k++) {
        const wx = (i0 + k + shift) * dx;
        const wz = j * dz;
        const xv = wx - seaCam.x;
        const sx = cx + (xv / zv) * fx;
        const band = Math.min(SEA_BANDS - 1, Math.floor(Math.min(1, Math.abs(sx - cx) / (w / 2)) * SEA_BANDS));
        const lvl = hist[band];
        const mx = mirror(wx);
        const mz = mirror(wz);
        const swell = 0.08 * Math.sin(mx * 0.9 + t * 0.8) + 0.06 * Math.sin(mz * 1.1 - t * 0.6 + mx * 0.4) + 0.05 * Math.sin((mx + mz) * 0.5 + t * 1.1);
        const y = swell + lvl * 0.6;
        line.push({ x: sx, y: horizon + ((camH - y) / zv) * f, lvl, f: (Math.sin(mx * 0.2) + 1) / 2, zv });
      }
      pts.push({ j, zv, line });
    }
    const fadeAt = (zv) => Math.pow(Math.min(1, Math.max(0, 1 - (zv - zNear) / (zFar - zNear))), 1.4); // (nearer, brighter; nothing at the far edge, so rows come in softly)
    const off = (p) => p.x < -30 || p.x > w + 30 || p.y > h + 30; // (out of sight: not drawn)
    g.lineWidth = 0.7;
    for (let r = rows - 1; r >= 0; r--) { // (the far rows first)
      const { j, zv, line: row } = pts[r];
      const a = fadeAt(zv);
      if (a <= 0.005) continue;
      g.strokeStyle = paint(0.5, (a * 0.45).toFixed(3));
      g.beginPath();
      const back = pts[r + 1].line;
      const link = (p, q) => { if (off(p) && off(q)) return; g.moveTo(p.x, p.y); g.lineTo(q.x, q.y); };
      for (let k = 0; k <= SEA_COLS; k++) {
        if (k) link(row[k - 1], row[k]);
        link(row[k], back[k]); // (to the row behind)
        if (tri) { // (a triangle lattice: the other nearest in the row behind too)
          const other = j & 1 ? k + 1 : k - 1;
          if (other >= 0 && other <= SEA_COLS) link(row[k], back[other]);
        }
      }
      g.stroke();
      const dot = 1 + Math.min(1, Math.max(0, 1 - (zv - zNear) / (zFar - zNear))) * 1.6;
      for (const p of row) {
        if (off(p)) continue;
        g.fillStyle = paint(p.f, Math.min(1, a * (0.5 + p.lvl * 0.7)).toFixed(3), p.lvl > 0.75 && zv < zFar * 0.5);
        g.fillRect(p.x - dot / 2, p.y - dot / 2, dot, dot);
      }
    }
  }

  // TOPOGRAPHY: a map's contour lines over a landscape the music raises: a hill for each band of
  // the spectrum (the bass broad, the treble small and sharp), drifting slowly about; the louder
  // a band, the higher its hill and the closer its rings; the highest rings in the accent
  const TOPO_BANDS = 12;
  const topoLv = new Float32Array(TOPO_BANDS);
  let topoField = null;
  function drawTopo(an, w, h, now) {
    g.clearRect(0, 0, w, h);
    const lv = bands(an, TOPO_BANDS);
    const cl = lv ? null : calm(TOPO_BANDS);
    for (let b = 0; b < TOPO_BANDS; b++) topoLv[b] += ((lv ? lv[b] : cl[b] * 2.2) - topoLv[b]) * ease(0.15);
    const t = now / 1000;
    const GX = Math.max(24, Math.min(64, Math.round(w / 9)));
    const GY = Math.max(14, Math.round(GX * (h / w)));
    if (!topoField || topoField.length !== (GX + 1) * (GY + 1)) topoField = new Float32Array((GX + 1) * (GY + 1));
    const hills = [];
    for (let b = 0; b < TOPO_BANDS; b++) {
      const k = b / (TOPO_BANDS - 1);
      hills.push({
        x: 0.5 + 0.38 * Math.sin(t * (0.05 + k * 0.04) + b * 2.4),
        y: 0.5 + 0.36 * Math.cos(t * (0.04 + k * 0.05) + b * 1.7),
        s2: Math.pow(0.24 - k * 0.15, 2),
        a: topoLv[b] * (1.1 - k * 0.3),
      });
    }
    for (let j = 0; j <= GY; j++) {
      for (let i = 0; i <= GX; i++) {
        const x = i / GX;
        const y = j / GY;
        let v = 0.18 * (Math.sin(x * 5 + t * 0.13) + Math.sin(y * 6 - t * 0.11) + Math.sin((x + y) * 4 + t * 0.07)) / 3; // (the land under it)
        for (const hl of hills) { const dx = (x - hl.x) * (w / h); const dy = y - hl.y; v += hl.a * Math.exp(-(dx * dx + dy * dy) / hl.s2); }
        topoField[j * (GX + 1) + i] = v;
      }
    }
    const cw = w / GX;
    const ch = h / GY;
    const LEVELS = 12;
    g.lineWidth = 1;
    for (let L = 0; L < LEVELS; L++) {
      const iso = -0.12 + L * 0.11;
      const frac = L / (LEVELS - 1);
      g.strokeStyle = paint(frac, (0.28 + frac * 0.62).toFixed(2), frac > 0.7);
      g.beginPath();
      for (let j = 0; j < GY; j++) {
        for (let i = 0; i < GX; i++) {
          const a = topoField[j * (GX + 1) + i];
          const b = topoField[j * (GX + 1) + i + 1];
          const c = topoField[(j + 1) * (GX + 1) + i + 1];
          const d = topoField[(j + 1) * (GX + 1) + i];
          const idx = (a > iso ? 8 : 0) | (b > iso ? 4 : 0) | (c > iso ? 2 : 0) | (d > iso ? 1 : 0);
          if (idx === 0 || idx === 15) continue;
          // (marching squares: where the level crosses each edge, joined)
          const x0 = i * cw;
          const y0 = j * ch;
          const top = [x0 + cw * ((iso - a) / (b - a)), y0];
          const right = [x0 + cw, y0 + ch * ((iso - b) / (c - b))];
          const bottom = [x0 + cw * ((iso - d) / (c - d)), y0 + ch];
          const left = [x0, y0 + ch * ((iso - a) / (d - a))];
          const seg = (p, q) => { g.moveTo(p[0], p[1]); g.lineTo(q[0], q[1]); };
          switch (idx) {
            case 1: case 14: seg(left, bottom); break;
            case 2: case 13: seg(bottom, right); break;
            case 3: case 12: seg(left, right); break;
            case 4: case 11: seg(top, right); break;
            case 5: seg(left, top); seg(bottom, right); break;
            case 6: case 9: seg(top, bottom); break;
            case 7: case 8: seg(left, top); break;
            case 10: seg(top, right); seg(left, bottom); break;
            default: break;
          }
        }
      }
      g.stroke();
    }
  }

  // PARTICLE CLOUD: a swarm inside an unseen cube that turns slowly like the ORB, its particles
  // free to fly anywhere in it (across, up and down, toward you and away). With no music it's a
  // murmuration: a few flocks, each following its own wandering leader, wheeling, merging and
  // splitting like starlings or gnats. The music stirs it: the bass bursts each flock outward,
  // every particle's own band of the spectrum kicks it about as it plays, and the louder it gets
  // the faster they fly; the loudest glow in the accent. Nearer particles bigger and brighter
  const SWARM_N = 420;
  const SWARM_FLOCKS = 3;
  const SWARM_BANDS = 12;
  let swarm = null;
  let swarmLast = 0;
  const swarmLv = new Float32Array(SWARM_BANDS);
  const swarmLead = Array.from({ length: SWARM_FLOCKS }, () => ({ ph: [0, 1, 2].map(() => Math.random() * 6.28), fr: [0, 1, 2].map(() => 0.18 + Math.random() * 0.22) }));
  function drawCloud(an, w, h, now) {
    if (!swarm) {
      swarm = Array.from({ length: SWARM_N }, (_, i) => ({
        x: (Math.random() - 0.5) * 1.4, y: (Math.random() - 0.5) * 1.4, z: (Math.random() - 0.5) * 1.4,
        vx: 0, vy: 0, vz: 0, flock: i % SWARM_FLOCKS, band: Math.floor(Math.random() * SWARM_BANDS), jit: Math.random() * 6.28,
      }));
    }
    fade(w, h, 0.38);
    const lv = bands(an, SWARM_BANDS);
    let energy = 0;
    for (let b = 0; b < SWARM_BANDS; b++) { swarmLv[b] = lv ? Math.max(lv[b], swarmLv[b] * dec(0.85)) : swarmLv[b] * dec(0.9); energy += swarmLv[b] / SWARM_BANDS; }
    const bass = (swarmLv[0] + swarmLv[1] + swarmLv[2]) / 3;
    const dt = swarmLast ? Math.min(0.05, (now - swarmLast) / 1000) : 0.016;
    swarmLast = now;
    const t = now / 1000;
    // (the leaders, wandering the cube; the flocks' middles)
    const leads = swarmLead.map((L) => {
      const p = L.fr.map((f, a) => 0.62 * Math.sin(t * f + L.ph[a]));
      const v = L.fr.map((f, a) => 0.62 * f * Math.cos(t * f + L.ph[a]));
      return { p, v, c: [0, 0, 0], n: 0 };
    });
    for (const q of swarm) { const c = leads[q.flock]; c.c[0] += q.x; c.c[1] += q.y; c.c[2] += q.z; c.n++; }
    for (const c of leads) if (c.n) { c.c[0] /= c.n; c.c[1] /= c.n; c.c[2] /= c.n; }
    const maxV = 0.55 + energy * 1.4;
    for (const q of swarm) {
      const L = leads[q.flock];
      const lvl = swarmLv[q.band];
      // (toward the leader and along with it; a little wander of its own)
      let ax = (L.p[0] - q.x) * 1.1 + (L.v[0] - q.vx) * 0.9 + Math.sin(t * 1.7 + q.jit) * 0.35;
      let ay = (L.p[1] - q.y) * 1.1 + (L.v[1] - q.vy) * 0.9 + Math.sin(t * 1.3 + q.jit * 1.7) * 0.35;
      let az = (L.p[2] - q.z) * 1.1 + (L.v[2] - q.vz) * 0.9 + Math.cos(t * 1.5 + q.jit * 2.3) * 0.35;
      // (not all on one spot: pushed off the flock's middle when crowded, and burst out by the bass)
      const dx = q.x - L.c[0];
      const dy = q.y - L.c[1];
      const dz = q.z - L.c[2];
      const d = Math.hypot(dx, dy, dz) + 1e-4;
      const push = (d < 0.22 ? (0.22 - d) * 9 : 0) + bass * bass * 7;
      ax += (dx / d) * push; ay += (dy / d) * push; az += (dz / d) * push;
      if (lvl > 0.2) { // (its own band playing: a kick about)
        const k = (lvl - 0.2) * 5;
        ax += (Math.random() - 0.5) * k; ay += (Math.random() - 0.5) * k; az += (Math.random() - 0.5) * k;
      }
      // (the cube's unseen walls turn them back)
      for (const [key, acc] of [['x', 0], ['y', 1], ['z', 2]]) {
        const over = Math.abs(q[key]) - 1;
        if (over > 0) { const pushIn = -Math.sign(q[key]) * over * 10; if (acc === 0) ax += pushIn; else if (acc === 1) ay += pushIn; else az += pushIn; }
      }
      q.vx += ax * dt; q.vy += ay * dt; q.vz += az * dt;
      const v = Math.hypot(q.vx, q.vy, q.vz);
      if (v > maxV) { q.vx *= maxV / v; q.vy *= maxV / v; q.vz *= maxV / v; }
      q.x += q.vx * dt; q.y += q.vy * dt; q.z += q.vz * dt;
    }
    // (the cube turning, as the ORB does: clockwise from above, tipped toward you)
    const spin = -now / 7000;
    const cs = Math.cos(spin);
    const sn = Math.sin(spin);
    const tilt = 0.4;
    const ct = Math.cos(tilt);
    const st = Math.sin(tilt);
    const cx = w / 2;
    const cy = h / 2;
    const R = Math.min(w, h) * 0.36;
    const dot = Math.max(1.4, Math.min(w, h) / 200);
    for (const q of swarm) {
      const x2 = q.x * cs + q.z * sn;
      let z2 = -q.x * sn + q.z * cs;
      const y2 = q.y * ct - z2 * st;
      z2 = q.y * st + z2 * ct;
      const persp = 1 / (2.4 - z2 * 0.7);
      const depth = Math.max(0, Math.min(1, (z2 + 1.3) / 2.6));
      const lvl = swarmLv[q.band];
      const size = dot * (0.55 + depth * 1.1) * (1 + lvl * 0.5);
      g.fillStyle = paint(q.flock / SWARM_FLOCKS + q.band / 60, Math.min(1, 0.18 + depth * 0.62 + lvl * 0.3).toFixed(2), lvl > 0.7 && depth > 0.3);
      g.fillRect(cx + x2 * R * persp * 2.4 - size / 2, cy - y2 * R * persp * 2.4 - size / 2, size, size);
    }
  }

  // TUNNEL: rings rushing toward you, thicker and brighter on the beat, the tunnel swaying
  let tunnelRings = [];
  function drawTunnel(an, w, h, now) {
    fade(w, h, 0.4);
    const lv = bands(an, 12);
    const bass = lv ? (lv[0] + lv[1] + lv[2]) / 3 : 0;
    const energy = lv ? lv.reduce((a, b) => a + b, 0) / 12 : 0;
    const speed = 0.006 + energy * 0.03;
    if (!tunnelRings.length || tunnelRings[tunnelRings.length - 1].z < 0.92) tunnelRings.push({ z: 1, beat: bass, f: (now / 3000) % 1 });
    const t = now / 1000;
    const cx = w / 2 + Math.sin(t * 0.7) * w * 0.06;
    const cy = h / 2 + Math.cos(t * 0.9) * h * 0.06;
    const sides = 8;
    for (const ring of tunnelRings) ring.z -= speed * (0.4 + (1 - ring.z)) * K;
    tunnelRings = tunnelRings.filter((ring) => ring.z > 0.02);
    for (const ring of tunnelRings) {
      const r = Math.min(w, h) * 0.06 / ring.z;
      if (r > Math.max(w, h)) continue;
      g.strokeStyle = paint(ring.f, Math.min(1, (1 - ring.z) * 1.2).toFixed(2), ring.beat > 0.75);
      g.lineWidth = 1 + ring.beat * 3 * (1 - ring.z);
      g.beginPath();
      for (let k = 0; k <= sides; k++) {
        const a = (k / sides) * Math.PI * 2 + t * 0.3;
        const x = cx + Math.cos(a) * r;
        const y = cy + Math.sin(a) * r;
        if (k) g.lineTo(x, y); else g.moveTo(x, y);
      }
      g.stroke();
    }
  }

  return {
    get mode() { return mode; },
    get name() { return VIZ_NAMES[mode]; },
    // (every style it has, with the names shown, for a picker)
    styles: () => modes.map((m) => ({ id: m, name: VIZ_NAMES[m] })),
    // (straight to one style)
    set(next) {
      if (!modes.includes(next) || next === mode) return mode;
      return this.toggle(modes.indexOf(next) - modes.indexOf(mode));
    },
    // The next style in this one's list
    // (step: +1 the next style, -1 the one before)
    toggle(step = 1) {
      mode = modes[(modes.indexOf(mode) + step + modes.length) % modes.length];
      try { localStorage.setItem(MODE_KEY, mode); } catch (e) {}
      const { w, h } = fit();
      g.clearRect(0, 0, w, h);
      particles.length = 0;
      return mode;
    },
    draw(now = performance.now()) {
      K = lastDraw ? Math.max(0.25, Math.min(6, (now - lastDraw) / (1000 / 120))) : 1;
      T = now;
      lastDraw = now;
      const { w, h } = fit();
      rainbow = document.documentElement.dataset.theme === 'spectrum';
      hue = (now / 40) % 360;
      fgNow = vizRgb('--fg-rgb', '57, 255, 143');
      accentNow = vizRgb('--accent-rgb', '255, 209, 102');
      const an = getAnalyser();
      if (mode === 'wave') drawWave(an, w, h, now);
      else if (mode === 'scope') drawScope(an, w, h);
      else if (mode === 'radial') drawRadial(an, w, h, now);
      else if (mode === 'fluid') drawFluid(an, w, h, now);
      else if (mode === 'vector') drawVector(w, h);
      else if (mode === 'vectorwide') drawVector(w, h, 'wide');
      else if (mode === 'lissajous') drawVector(w, h, 'lissajous');
      else if (mode === 'spectro') drawSpectro(an, w, h);
      else if (mode === 'vu') drawVu(an, w, h);
      else if (mode === 'matrix') drawMatrix(an, w, h);
      else if (mode === 'bitgrid') drawBitGrid(an, w, h);
      else if (mode === 'terrain') drawTerrain(an, w, h, now);
      else if (mode === 'plasma') drawPlasma(an, w, h);
      else if (mode === 'tunnel') drawTunnel(an, w, h, now);
      else if (mode === 'orb') drawOrb(an, w, h, now);
      else if (mode === 'ocean') drawOcean(an, w, h, now, false);
      else if (mode === 'oceantri') drawOcean(an, w, h, now, true);
      else if (mode === 'topo') drawTopo(an, w, h, now);
      else if (mode === 'cloud') drawCloud(an, w, h, now);
      else drawBars(an, w, h);
    },
  };
}
