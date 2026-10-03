// Synthesized one-shot effects ported from the ECHOES terminal audio compendium
// (echoes-boardgame/dev-tools/artifacts/terminal-audio-compendium.html).
const SFX = (() => {
  const VOL = 0.18;
  const STORAGE_KEY = 'bytefall-sound';
  let ctx = null;
  let muted = false;
  try { muted = localStorage.getItem(STORAGE_KEY) === 'off'; } catch (e) {}

  // Everything plays through SETTINGS → SOUND OUTPUT's chain (output.js), as the music does
  let outChain = null;
  let outputId = typeof savedSoundOutput === 'function' ? savedSoundOutput() : 'headphones';
  const dest = (c) => {
    if (typeof createSoundOutput !== 'function') return c.destination;
    if (!outChain) {
      outChain = createSoundOutput(c, outputId);
      outChain.output.connect(c.destination);
    }
    return outChain.input;
  };

  function getCtx() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state !== 'running') ctx.resume(); // (iOS can also leave it 'interrupted')
    return ctx;
  }

  function noiseBuffer(c, dur, shape) {
    const buf = c.createBuffer(1, Math.floor(c.sampleRate * dur), c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * shape(i, d.length);
    const src = c.createBufferSource();
    src.buffer = buf;
    return src;
  }

  function envelope(c, vol, t, dur) {
    const gn = c.createGain();
    gn.gain.setValueAtTime(vol, t);
    gn.gain.exponentialRampToValueAtTime(0.001, t + dur);
    gn.connect(dest(c));
    return gn;
  }

  function filter(c, type, freq, q) {
    const f = c.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    if (q !== undefined) f.Q.value = q;
    return f;
  }

  const sounds = {
    click(c) {
      const dur = 0.025, t = c.currentTime;
      const src = noiseBuffer(c, dur, (i, n) => 1 - i / n);
      const flt = filter(c, 'bandpass', 3000 + Math.random() * 1000, 0.8);
      src.connect(flt); flt.connect(envelope(c, VOL, t, dur));
      src.start(); src.stop(t + dur);
    },
    punct(c) {
      const t = c.currentTime;
      const osc = c.createOscillator();
      osc.type = 'triangle'; osc.frequency.value = 200;
      osc.connect(envelope(c, VOL * 0.55, t, 0.04));
      osc.start(); osc.stop(t + 0.04);
    },
    enter(c) {
      const dur = 0.055, t = c.currentTime;
      const src = noiseBuffer(c, dur, (i, n) => Math.exp(-i / (n * 0.25)));
      const flt = filter(c, 'lowpass', 800);
      src.connect(flt); flt.connect(envelope(c, VOL * 1.2, t, dur));
      src.start(); src.stop(t + dur);
    },
    backspace(c) {
      const dur = 0.032, t = c.currentTime;
      const src = noiseBuffer(c, dur, (i, n) => Math.pow(1 - i / n, 1.4));
      const f1 = filter(c, 'bandpass', 900 + Math.random() * 300, 1.2);
      const f2 = filter(c, 'lowpass', 1800);
      src.connect(f1); f1.connect(f2); f2.connect(envelope(c, VOL, t, dur));
      src.start(); src.stop(t + dur);
    },
    alert(c) {
      const gn = c.createGain();
      gn.connect(dest(c));
      [440, 330].forEach((freq, idx) => {
        const osc = c.createOscillator();
        osc.type = 'sawtooth'; osc.frequency.value = freq; osc.connect(gn);
        const t = c.currentTime + idx * 0.12;
        gn.gain.setValueAtTime(VOL * 0.4, t);
        gn.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
        osc.start(t); osc.stop(t + 0.1);
      });
    },
    denied(c) {
      [0, 0.08, 0.18].forEach((delay, i) => {
        const t = c.currentTime + delay;
        const vol = VOL * [0.9, 0.35, 0.12][i];
        const body = noiseBuffer(c, 0.07, (j, n) => Math.pow(1 - j / n, 1.8));
        const lo = filter(c, 'bandpass', 320, 0.9);
        body.connect(lo); lo.connect(envelope(c, vol, t, 0.07));
        body.start(t); body.stop(t + 0.07);
        const tick = noiseBuffer(c, 0.008, (j, n) => 1 - j / n);
        const hi = filter(c, 'bandpass', 3500, 1.2);
        tick.connect(hi); hi.connect(envelope(c, vol * 0.6, t, 0.008));
        tick.start(t); tick.stop(t + 0.008);
      });
    },
    static(c) {
      const dur = 0.035, t = c.currentTime;
      const src = noiseBuffer(c, dur, (i, n) => 1 - i / n);
      const flt = filter(c, 'highpass', 2000);
      src.connect(flt); flt.connect(envelope(c, VOL * 0.75, t, dur));
      src.start(); src.stop(t + dur);
    },
    egg(c) {
      [660, 880].forEach((f, i) => {
        const t = c.currentTime + i * 0.09;
        const osc = c.createOscillator();
        osc.type = 'sine'; osc.frequency.value = f;
        osc.connect(envelope(c, VOL * 0.25, t, 0.08));
        osc.start(t); osc.stop(t + 0.08);
      });
    },
    // Retro 8-bit explosion: sample-and-hold noise (lo-fi crunch) under a falling
    // lowpass, plus a quick square-wave pitch drop. Pitch varies a little per call.
    burst(c) {
      const dur = 0.28, t = c.currentTime;
      const hold = 5 + Math.floor(Math.random() * 4);
      const len = Math.floor(c.sampleRate * dur);
      const buf = c.createBuffer(1, len, c.sampleRate);
      const d = buf.getChannelData(0);
      let v = 0;
      for (let i = 0; i < len; i++) {
        if (i % hold === 0) v = Math.random() * 2 - 1;
        d[i] = v * Math.pow(1 - i / len, 1.6);
      }
      const src = c.createBufferSource();
      src.buffer = buf;
      const lp = filter(c, 'lowpass', 3200, 0.7);
      lp.frequency.setValueAtTime(3200, t);
      lp.frequency.exponentialRampToValueAtTime(260, t + dur);
      src.connect(lp); lp.connect(envelope(c, VOL * 0.2, t, dur));
      src.start(t); src.stop(t + dur);

      const osc = c.createOscillator();
      osc.type = 'square';
      const f0 = 520 + Math.random() * 140;
      osc.frequency.setValueAtTime(f0, t);
      osc.frequency.exponentialRampToValueAtTime(70, t + 0.12);
      osc.connect(envelope(c, VOL * 0.07, t, 0.12));
      osc.start(t); osc.stop(t + 0.13);
    },
    // A button pressed: a short, clear square-wave tick (louder than the keyboard click, so every
    // button is heard)
    button(c) {
      const t = c.currentTime;
      const osc = c.createOscillator();
      osc.type = 'square';
      osc.frequency.setValueAtTime(1250, t);
      osc.frequency.exponentialRampToValueAtTime(900, t + 0.03);
      const lp = filter(c, 'lowpass', 3000);
      osc.connect(lp); lp.connect(envelope(c, VOL * 0.22, t, 0.035));
      osc.start(t); osc.stop(t + 0.04);
    },
    // RESTORE PURCHASES: a little dial-up modem: the number dialed (touch tones), then the
    // handshake's carrier warbling against bursts of static (about a second)
    dialup(c) {
      const t0 = c.currentTime;
      const gn = c.createGain();
      gn.gain.value = VOL * 0.35;
      const lp = filter(c, 'lowpass', 3400);
      gn.connect(lp); lp.connect(dest(c));
      const tone = (f, t, dur, type = 'sine', vol = 1) => {
        const o = c.createOscillator();
        const g = c.createGain();
        o.type = type; o.frequency.value = f;
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(vol, t + 0.005);
        g.gain.setValueAtTime(vol, t + dur - 0.01);
        g.gain.linearRampToValueAtTime(0, t + dur);
        o.connect(g); g.connect(gn);
        o.start(t); o.stop(t + dur);
        return o;
      };
      // (touch tones: each digit two tones at once)
      [[697, 1209], [770, 1336], [852, 1477], [697, 1336], [941, 1336]].forEach(([lo, hi], i) => {
        const t = t0 + i * 0.075;
        tone(lo, t, 0.06, 'sine', 0.5);
        tone(hi, t, 0.06, 'sine', 0.5);
      });
      // (the answer tone, then the carrier warbling between 1650 and 2100 Hz with static over it)
      const t1 = t0 + 0.42;
      tone(2100, t1, 0.16, 'sine', 0.6);
      const car = tone(1650, t1 + 0.18, 0.55, 'square', 0.25);
      for (let k = 0; k < 11; k++) car.frequency.setValueAtTime(k % 2 ? 2100 : 1650, t1 + 0.18 + k * 0.05);
      const hiss = noiseBuffer(c, 0.5, (i, n) => (Math.floor(i / 400) % 3 ? 0.5 : 0.1) * (1 - i / n));
      const bp = filter(c, 'bandpass', 2400, 0.7);
      hiss.connect(bp); bp.connect(gn);
      hiss.start(t1 + 0.24); hiss.stop(t1 + 0.74);
    },
  };

  return {
    play(name) {
      if (muted) return;
      try { sounds[name](getCtx()); } catch (e) {}
    },
    // Plays even when muted (used by the dev audio compendium).
    preview(name) {
      try { sounds[name](getCtx()); } catch (e) {}
    },
    // One short square-wave blip of a voice (the tutorial's BOT talking), at freq Hz
    blip(freq) {
      if (muted) return;
      try {
        const c = getCtx();
        const t = c.currentTime;
        const osc = c.createOscillator();
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, t);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.82, t + 0.045);
        const lp = filter(c, 'lowpass', 2600);
        osc.connect(lp);
        lp.connect(envelope(c, VOL * 0.22, t, 0.05));
        osc.start(t); osc.stop(t + 0.055);
      } catch (e) {}
    },
    isMuted: () => muted,
    setOutput(id) {
      outputId = id;
      if (outChain) outChain.set(id);
    },
    toggle() {
      muted = !muted;
      try { localStorage.setItem(STORAGE_KEY, muted ? 'off' : 'on'); } catch (e) {}
      return muted;
    },
  };
})();
