// Shared music visualizer for the game's playlist and the dev audio page.
// Styles, switched by clicking: 'bars' (retro LED spectrum with falling peak caps) and 'wave'
// (a line with auto-gain and a CRT trail) everywhere; the MUSIC PLAYER also has an
// oscilloscope, a radial spectrum, a particle blob and a stereo vectorscope.
// Each visualizer remembers its style.
// Theme color as an 'r, g, b' triplet from style.css (falls back where the page has no theme vars).
function vizRgb(name, fallback) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

// The styles, in the order a tap cycles them, with the names the MUSIC PLAYER shows
const VIZ_NAMES = {
  bars: 'SPECTRUM', wave: 'WAVE', scope: 'OSCILLOSCOPE', radial: 'RADIAL', fluid: 'PARTICLES', vector: 'VECTORSCOPE',
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
  let rainbow = false;
  let hue = 0;
  let fgNow = '57, 255, 143';
  let accentNow = '255, 209, 102';
  const paint = (f, a, hot = false) => (rainbow
    ? `hsla(${((hue + f * 360) % 360).toFixed(0)}, 100%, ${hot ? 72 : 62}%, ${a})`
    : `rgba(${hot ? accentNow : fgNow}, ${a})`);

  function fit() {
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
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
      }
      peaks[b] = Math.max(level, peaks[b] - 0.025);
      const lit = Math.round(level * segments);
      const cap = Math.min(segments - 1, Math.round(peaks[b] * segments));
      const x = b * (barW + gap);
      for (let seg = 0; seg < segments; seg++) {
        const y = h - (seg + 1) * (SEGMENT + 1) + 1;
        if (seg < lit) {
          const hot = seg / segments;
          g.fillStyle = hot > 0.8 ? paint(b / bars, 0.9, true) : paint(b / bars, (0.55 + hot * 0.45).toFixed(2));
        } else if (an && seg === cap && cap > 0) {
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
    g.fillStyle = an ? 'rgba(0, 0, 0, 0.4)' : 'rgba(0, 0, 0, 1)';
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
      loudness = Math.max(max, loudness * 0.97, 0.004);
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
    g.fillStyle = `rgba(0, 0, 0, ${amount})`;
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
    } else {
      g.moveTo(0, mid); g.lineTo(w, mid);
    }
    g.strokeStyle = paint(0, an ? 0.95 : 0.4);
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
    const lv = bands(an, n);
    for (let b = 0; b < n; b++) radialLevels[b] = lv ? Math.max(lv[b], radialLevels[b] * 0.86) : radialLevels[b] * 0.9;
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
    for (let b = 0; b < n; b++) blobLevels[b] += ((lv ? lv[b] : 0) - blobLevels[b]) * 0.18;
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
    const spawn = an ? Math.floor(energy * 10 + (Math.random() < energy * 3 ? 1 : 0)) : 0;
    for (let k = 0; k < spawn && particles.length < 260; k++) {
      const a = Math.random() * Math.PI * 2;
      const r = radiusAt(a);
      const speed = 0.4 + energy * 3 + Math.random() * 1.2;
      particles.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, life: 1, hot: Math.random() < energy * 0.6, f: a / (Math.PI * 2) });
    }
    for (let k = particles.length - 1; k >= 0; k--) {
      const q = particles[k];
      q.x += q.vx; q.y += q.vy;
      q.vx *= 0.985; q.vy *= 0.985;
      // a slow swirl
      const dx = q.x - cx;
      const dy = q.y - cy;
      q.x += -dy * 0.004; q.y += dx * 0.004;
      q.life -= 0.012;
      if (q.life <= 0 || q.x < -4 || q.y < -4 || q.x > w + 4 || q.y > h + 4) { particles.splice(k, 1); continue; }
      g.fillStyle = paint(q.f, q.life.toFixed(2), q.hot);
      g.fillRect(q.x - 1, q.y - 1, 2, 2);
    }
  }

  // VECTORSCOPE: left against right, turned 45 degrees (mono is a vertical line, wide stereo
  // spreads sideways, out of phase lies flat), with the phase correlation meter along the bottom
  let correlation = 1;
  function drawVector(w, h) {
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
    g.fillText('L', cx - r * 0.7 - 8, cy - r * 0.7 + 3);
    g.fillText('R', cx + r * 0.7 + 3, cy - r * 0.7 + 3);
    const pair = getStereo();
    if (pair) {
      if (!wave || wave.length !== pair[0].fftSize) wave = new Float32Array(pair[0].fftSize);
      if (!vectorR || vectorR.length !== pair[1].fftSize) vectorR = new Float32Array(pair[1].fftSize);
      pair[0].getFloatTimeDomainData(wave);
      pair[1].getFloatTimeDomainData(vectorR);
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
      vectorLevel += (Math.max(rms, 0.002) - vectorLevel) * 0.08;
      const gain = Math.min(60, 0.22 / vectorLevel) * r;
      g.fillStyle = paint(0, 0.7);
      for (let i = 0; i < wave.length; i += 2) {
        let x = (vectorR[i] - wave[i]) * gain * 0.7071;
        let y = -(wave[i] + vectorR[i]) * gain * 0.7071;
        const d = Math.hypot(x, y);
        if (d > r) { x *= r / d; y *= r / d; } // (loud peaks pinned to the edge)
        g.fillRect(cx + x, cy + y, 1.5, 1.5);
      }
      const now = ll > 1e-9 && rr > 1e-9 ? lr / Math.sqrt(ll * rr) : 1;
      correlation += (now - correlation) * 0.15;
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

  return {
    get mode() { return mode; },
    get name() { return VIZ_NAMES[mode]; },
    // The next style in this one's list
    toggle() {
      mode = modes[(modes.indexOf(mode) + 1) % modes.length];
      try { localStorage.setItem(MODE_KEY, mode); } catch (e) {}
      const { w, h } = fit();
      g.clearRect(0, 0, w, h);
      particles.length = 0;
      return mode;
    },
    draw(now = performance.now()) {
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
      else drawBars(an, w, h);
    },
  };
}
