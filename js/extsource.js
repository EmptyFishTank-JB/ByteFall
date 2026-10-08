// OTHER SOURCES for the music player's visualizer (player.js): music from somewhere other than
// ByteFall. In the Android app, whatever the phone is playing, from any app (Pandora, Spotify,
// ...): from Android 10 on by audio playback capture (tools/android/CaptureService.java: Android
// asks each time, as for a screen recording; the sound itself comes over, in stereo, and is
// analyzed here as Web Audio's analyser would), before that through Android's Visualizer
// (MainActivity.java; phones that send some apps' music by a low-power path it can't hear show
// silence there); and the microphone, in the app and on the web (a page can't hear other
// apps), which hears whatever plays out loud. Either way it's handed to the visualizers as an
// analyser like the game's own (the same calls viz.js makes). info(): what's coming in, shown in
// the visualizer's corner while it listens
const ExtSource = (() => {
  // (none in ByteFall's Google Play RELEASE edition, which leaves out OTHER APPS (CaptureService and
  // all) and the MICROPHONE (its permissions too): there the visualizer shows ByteFall's own music
  // only, and the SOURCE button's hidden. The TEST edition, the web and ByteFall Viz keep them)
  const release = () => !!(window.BYTEFALL_APP && window.BYTEFALL_APP.release);
  const app = () => !!(window.BytefallAndroid && window.BytefallAndroid.extStart) && !release();
  const kinds = () => (release() ? [] : app() ? ['apps', 'mic'] : ['mic']); // (the sources besides ByteFall's own)
  const NAMES = { apps: 'OTHER APPS', mic: 'MICROPHONE' };
  let kind = 'apps';
  const label = () => NAMES[kind];
  let on = false;
  let frames = 0;
  let lastLoud = 0; // (the loudest raw level in the last frame)
  let lastPeak = 0; // (by capture: the loudest sample, 0 to 1, for the readout in dB: even a faint sound shows)
  let state = 'off'; // (off, asking, on, denied, error)
  // (the app's: frames from Android, as an analyser)
  let fft = null;
  let wave = null;
  let rate = 44100;
  let fetchedAt = 0;
  let smooth = null;
  let peakDb = 20;
  function fetchFrame() {
    const now = performance.now();
    if (now - fetchedAt < 12) return;
    fetchedAt = now;
    let f = '';
    try { f = window.BytefallAndroid.extFrame(); } catch (e) { f = ''; }
    if (!f) return;
    const bytes = (s) => { const bin = atob(s); const out = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i); return out; };
    if (f.startsWith('pcm,')) { takePcm(f, bytes); return; }
    pcm = null;
    const [r, a, b] = f.split(',');
    rate = (Number(r) || 44100000) / 1000;
    fft = bytes(a);
    wave = bytes(b);
    frames++;
    let loud = 0;
    for (let i = 0; i < wave.length; i++) loud = Math.max(loud, Math.abs(wave[i] - 128));
    lastLoud = loud;
  }
  // (by capture: the sound itself, the last 2048 frames of left and right, made into analysers
  // as Web Audio's are: a Blackman window, an FFT, 0.8 smoothing, -100 to -30 dB)
  const N = 2048;
  let pcm = null; // ({ rate, ch: [left, right, mid] Float32Arrays, gen })
  function takePcm(f, bytes) {
    const [, r, b] = f.split(',');
    const raw = bytes(b);
    const v = new DataView(raw.buffer);
    const n = Math.min(N, raw.length / 4);
    if (!pcm) pcm = { rate: 48000, ch: [new Float32Array(N), new Float32Array(N), new Float32Array(N)], gen: 0 };
    pcm.rate = Number(r) || 48000;
    let loud = 0;
    for (let i = 0; i < n; i++) {
      const l = v.getInt16(i * 4, true) / 32768;
      const rr = v.getInt16(i * 4 + 2, true) / 32768;
      pcm.ch[0][i] = l; pcm.ch[1][i] = rr; pcm.ch[2][i] = (l + rr) / 2;
      loud = Math.max(loud, Math.abs(l), Math.abs(rr));
    }
    pcm.gen++;
    rate = pcm.rate;
    frames++;
    lastLoud = Math.round(loud * 128);
    lastPeak = loud;
  }
  const win = new Float32Array(N);
  for (let i = 0; i < N; i++) win[i] = 0.42 - 0.5 * Math.cos((2 * Math.PI * i) / N) + 0.08 * Math.cos((4 * Math.PI * i) / N);
  const rev = new Uint32Array(N);
  for (let i = 0, bits = Math.log2(N); i < N; i++) { let x = i; let y = 0; for (let b = 0; b < bits; b++) { y = (y << 1) | (x & 1); x >>= 1; } rev[i] = y; }
  const re = new Float32Array(N);
  const im = new Float32Array(N);
  function fftMag(src, out) { // (|X[k]| / N for k below N/2)
    for (let i = 0; i < N; i++) { re[rev[i]] = src[i] * win[i]; im[rev[i]] = 0; }
    for (let size = 2; size <= N; size <<= 1) {
      const half = size >> 1;
      const step = (-2 * Math.PI) / size;
      for (let k = 0; k < half; k++) {
        const wr = Math.cos(step * k);
        const wi = Math.sin(step * k);
        for (let j = k; j < N; j += size) {
          const t = j + half;
          const tr = wr * re[t] - wi * im[t];
          const ti = wr * im[t] + wi * re[t];
          re[t] = re[j] - tr; im[t] = im[j] - ti;
          re[j] += tr; im[j] += ti;
        }
      }
    }
    for (let k = 0; k < N / 2; k++) out[k] = Math.hypot(re[k], im[k]) / N;
  }
  const pcmAnalyser = (c) => {
    const mag = new Float32Array(N / 2);
    const smoothed = new Float32Array(N / 2);
    let doneGen = -1;
    return {
      fftSize: N,
      frequencyBinCount: N / 2,
      context: { get sampleRate() { return pcm ? pcm.rate : 48000; } },
      getByteFrequencyData(out) {
        fetchFrame();
        if (!pcm) { out.fill(0); return; }
        if (doneGen !== pcm.gen) {
          doneGen = pcm.gen;
          fftMag(pcm.ch[c], mag);
          for (let k = 0; k < N / 2; k++) smoothed[k] = 0.8 * smoothed[k] + 0.2 * mag[k];
        }
        for (let k = 0; k < out.length && k < N / 2; k++) {
          const db = 20 * Math.log10(smoothed[k] + 1e-12);
          out[k] = Math.max(0, Math.min(255, ((db + 100) / 70) * 255));
        }
      },
      getFloatTimeDomainData(out) {
        fetchFrame();
        if (!pcm) { out.fill(0); return; }
        const src = pcm.ch[c];
        for (let i = 0; i < out.length; i++) out[i] = src[Math.floor((i * N) / out.length)];
      },
    };
  };
  const pcmMid = pcmAnalyser(2);
  const pcmPair = [pcmAnalyser(0), pcmAnalyser(1)];
  const appAnalyser = {
    get fftSize() { return wave ? wave.length : 1024; },
    get frequencyBinCount() { return fft ? fft.length / 2 : 512; },
    context: { get sampleRate() { return rate; } },
    getByteFrequencyData(out) {
      fetchFrame();
      out.fill(0);
      if (!fft) return;
      const n = fft.length / 2;
      if (!smooth || smooth.length !== n) smooth = new Float32Array(n);
      // (leveled by itself: phones hand over the sound at different strengths, so the top of the
      // range follows the loudest of late, as a meter's range would, and 54dB below it is silence)
      const db = new Float32Array(n);
      let top = -99;
      for (let k = 1; k < n; k++) {
        const re = (fft[2 * k] << 24) >> 24; // (signed bytes)
        const im = (fft[2 * k + 1] << 24) >> 24;
        const mag = Math.hypot(re, im);
        db[k] = mag < 0.5 ? -99 : 20 * Math.log10(mag); // (nothing there: silence, not a floor)
        if (db[k] > top) top = db[k];
      }
      peakDb = Math.max(top, peakDb - 0.04, 6);
      for (let k = 1; k < n && k < out.length; k++) {
        const v = Math.max(0, Math.min(255, ((db[k] - (peakDb - 54)) / 54) * 255 * 0.92));
        smooth[k] = Math.max(v, smooth[k] * 0.86); // (quick up, eased down, as the game's analyser)
        out[k] = smooth[k];
      }
    },
    getFloatTimeDomainData(out) {
      fetchFrame();
      if (!wave) { out.fill(0); return; }
      for (let i = 0; i < out.length; i++) out[i] = (wave[Math.floor((i * wave.length) / out.length)] - 128) / 128;
    },
  };
  // (the web's: the microphone through Web Audio)
  let mic = null;
  async function startMic() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const an = ctx.createAnalyser();
    an.fftSize = 2048;
    an.smoothingTimeConstant = 0.8;
    ctx.createMediaStreamSource(stream).connect(an);
    mic = { stream, ctx, an };
  }
  return {
    label,
    isOn: () => on,
    // (by capture: how many frames have come, and the loudest sample of the last, 0 to 1)
    level: () => ({ frames, peak: lastPeak }),
    // (OTHER APPS stopped from outside: the notification's STOP, or Android)
    ended() { if (!on || kind !== 'apps') return false; try { return window.BytefallAndroid.extState() === 'ended'; } catch (e) { return false; } },
    state: () => state,
    kinds,
    nameOf: (k) => NAMES[k],
    kind: () => kind,
    // (what's coming in, for the visualizer's corner)
    info() {
      if (!on) return '';
      if (kind === 'apps') {
        let st = 'on';
        try { st = window.BytefallAndroid.extState(); } catch (e) {}
        if (st === 'ended') return 'STOPPED: TAP SOURCE';
        if (!frames) return 'IN: NO DATA';
        if (pcm) return `IN: ${lastPeak > 0 ? `${Math.round(20 * Math.log10(lastPeak))} DB` : 'SILENT'}`; // (SILENT: only zeros come over)
        return `IN: ${lastLoud ? `LEVEL ${lastLoud}` : 'SILENT'}`;
      }
      if (!mic) return '';
      const d = new Uint8Array(mic.an.fftSize);
      mic.an.getByteTimeDomainData(d);
      let loud = 0;
      for (let i = 0; i < d.length; i++) loud = Math.max(loud, Math.abs(d[i] - 128));
      return `IN: ${loud > 1 ? `LEVEL ${loud}` : 'SILENT'}`;
    },
    // (start listening to a source, 'apps' or 'mic': resolves 'on', or 'denied' / 'error')
    async start(which = kinds()[0]) {
      kind = which;
      on = true;
      frames = 0;
      if (kind === 'apps') {
        state = window.BytefallAndroid.extStart();
        for (let i = 0; i < 400 && state === 'asking'; i++) { // (waiting on Android's questions)
          await new Promise((res) => setTimeout(res, 150));
          state = window.BytefallAndroid.extState();
        }
      } else {
        try { if (!mic) await startMic(); state = 'on'; } catch (e) { state = e && e.name === 'NotAllowedError' ? 'denied' : 'error'; }
      }
      if (state !== 'on') on = false;
      return state;
    },
    stop() {
      on = false;
      state = 'off';
      if (app()) { try { window.BytefallAndroid.extStop(); } catch (e) {} }
      frames = 0; lastLoud = 0; lastPeak = 0;
      if (mic) { mic.stream.getTracks().forEach((tr) => tr.stop()); mic.ctx.close().catch(() => {}); mic = null; }
      fft = null; wave = null; smooth = null; peakDb = 20; pcm = null;
    },
    analyser: () => (!on ? null : kind === 'apps' ? (fetchFrame(), pcm ? pcmMid : appAnalyser) : mic ? mic.an : null),
    // (left and right, for the vectorscopes and VU: only by capture, which hears in stereo)
    stereo: () => (on && kind === 'apps' && pcm ? pcmPair : null),
  };
})();
