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
  bars: 'SPECTRUM', wave: 'WAVE', scope: 'OSCILLOSCOPE', spectro: 'SPECTROGRAM', vu: 'LEVEL METERS', radial: 'RADIAL',
  fluid: 'PARTICLES', vector: 'VECTORSCOPE', matrix: 'MATRIX RAIN', bitgrid: 'BIT GRID', terrain: 'SYNTHWAVE GRID',
  plasma: 'PLASMA', tunnel: 'TUNNEL',
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
  function drawSpectro(an, w, h) {
    const rows = Math.max(8, Math.min(64, Math.floor(h / 3)));
    const colW = 2;
    scrollLeft(w, h, colW);
    const lv = bands(an, rows);
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
      }
      vuLevel[ch] = Math.max(level, vuLevel[ch] - 0.03);
      vuPeak[ch] = Math.max(vuLevel[ch], vuPeak[ch] - 0.006);
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
      drop.acc += 0.08 + level * 0.9;
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
    const lv = bands(an, 7);
    const cell = Math.min((w - 16) / 7, (h - 12) / 7);
    const x0 = (w - cell * 7) / 2;
    const y0 = (h - cell * 7) / 2;
    g.font = `${Math.floor(cell * 0.42)}px ${getComputedStyle(canvas).fontFamily}`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    for (let c = 0; c < 7; c++) {
      const level = lv ? lv[c] : 0;
      gridLevels[c] = Math.max(level, gridLevels[c] - 0.04);
      const n = Math.round(gridLevels[c] * 7);
      if (n >= 7 && gridFlash[c] <= 0) gridFlash[c] = 1;
      gridFlash[c] = Math.max(0, gridFlash[c] - 0.06);
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
    for (let b = 0; b < 12; b++) tLevels[b] = Math.max(lv ? lv[b] : 0, tLevels[b] * 0.9); // (quick up, eased down)
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
        if (!a[2] && !b[2] && !c[2] && !d[2]) { // (the road: plain squares)
          poly(faces, a, b, c, d);
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
    plasmaT += 0.02 + treble * 0.08;
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
    for (const ring of tunnelRings) ring.z -= speed * (0.4 + (1 - ring.z));
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
      else if (mode === 'spectro') drawSpectro(an, w, h);
      else if (mode === 'vu') drawVu(an, w, h);
      else if (mode === 'matrix') drawMatrix(an, w, h);
      else if (mode === 'bitgrid') drawBitGrid(an, w, h);
      else if (mode === 'terrain') drawTerrain(an, w, h, now);
      else if (mode === 'plasma') drawPlasma(an, w, h);
      else if (mode === 'tunnel') drawTunnel(an, w, h, now);
      else drawBars(an, w, h);
    },
  };
}
