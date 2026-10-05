// OTHER SOURCES for the music player's visualizer (player.js): music from somewhere other than
// ByteFall. In the Android app, whatever the phone is playing, from any app (Pandora, Spotify,
// ...), through Android's Visualizer (tools/android/MainActivity.java; it asks once for the audio
// permission; phones that send some apps' music by a low-power path the Visualizer can't hear
// show silence there); and the microphone, in the app and on the web (a page can't hear other
// apps), which hears whatever plays out loud. Either way it's handed to the visualizers as an
// analyser like the game's own (the same calls viz.js makes). info(): what's coming in, shown in
// the visualizer's corner while it listens
const ExtSource = (() => {
  const app = () => !!(window.BytefallAndroid && window.BytefallAndroid.extStart);
  const kinds = () => (app() ? ['apps', 'mic'] : ['mic']); // (the sources besides ByteFall's own)
  const NAMES = { apps: 'OTHER APPS', mic: 'MICROPHONE' };
  let kind = 'apps';
  const label = () => NAMES[kind];
  let on = false;
  let frames = 0;
  let lastLoud = 0; // (the loudest raw level in the last frame)
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
    const [r, a, b] = f.split(',');
    const bytes = (s) => { const bin = atob(s); const out = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i); return out; };
    rate = (Number(r) || 44100000) / 1000;
    fft = bytes(a);
    wave = bytes(b);
    frames++;
    let loud = 0;
    for (let i = 0; i < wave.length; i++) loud = Math.max(loud, Math.abs(wave[i] - 128));
    lastLoud = loud;
  }
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
      // (levelled by itself: phones hand over the sound at different strengths, so the top of the
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
    state: () => state,
    kinds,
    nameOf: (k) => NAMES[k],
    kind: () => kind,
    // (what's coming in, for the visualizer's corner)
    info() {
      if (!on) return '';
      if (kind === 'apps') return frames ? `IN: ${lastLoud ? `LEVEL ${lastLoud}` : 'SILENT'}` : 'IN: NO DATA';
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
        for (let i = 0; i < 200 && state === 'asking'; i++) { // (waiting on the permission prompt)
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
      frames = 0; lastLoud = 0;
      if (mic) { mic.stream.getTracks().forEach((tr) => tr.stop()); mic.ctx.close().catch(() => {}); mic = null; }
      fft = null; wave = null; smooth = null; peakDb = 20;
    },
    analyser: () => (!on ? null : kind === 'apps' ? appAnalyser : mic ? mic.an : null),
  };
})();
