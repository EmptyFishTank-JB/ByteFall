// OTHER SOURCES for the music player's visualizer (player.js): music from somewhere other than
// ByteFall. In the Android app, whatever the phone is playing, from any app (Pandora, Spotify,
// ...), through Android's Visualizer (tools/android/MainActivity.java; it asks once for the audio
// permission); on the web, the microphone (a page can't hear other apps). Either way it's handed
// to the visualizers as an analyser like the game's own (the same calls viz.js makes).
const ExtSource = (() => {
  const app = () => !!(window.BytefallAndroid && window.BytefallAndroid.extStart);
  const label = () => (app() ? 'OTHER APPS' : 'MICROPHONE');
  let on = false;
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
        db[k] = 20 * Math.log10(Math.hypot(re, im) + 0.05);
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
    // (start listening: resolves 'on', or 'denied' / 'error')
    async start() {
      on = true;
      if (app()) {
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
      if (mic) { mic.stream.getTracks().forEach((tr) => tr.stop()); mic.ctx.close().catch(() => {}); mic = null; }
      fft = null; wave = null; smooth = null; peakDb = 20;
    },
    analyser: () => (!on ? null : app() ? appAnalyser : mic ? mic.an : null),
  };
})();
