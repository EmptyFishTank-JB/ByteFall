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
    // RESTORE PURCHASES: a little dial-up modem: a number dialed (touch tones), the answer tone,
    // the handshake's carrier warbling against bursts of static, and the line opening up (the
    // kshhht). Never quite the same twice, like the narrator's voice: its number, its pace, the
    // carrier's pitch and warble, the static's pattern and how long each part goes on all vary
    dialup(c) {
      const r = (a, b) => a + Math.random() * (b - a);
      const t0 = c.currentTime;
      const gn = c.createGain();
      gn.gain.value = VOL * r(0.3, 0.38);
      const lp = filter(c, 'lowpass', r(3000, 3800));
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
      // (touch tones: 4 to 7 digits, each two tones at once, dialed at its own pace)
      const ROWS = [697, 770, 852, 941];
      const COLS = [1209, 1336, 1477];
      const digits = 4 + Math.floor(Math.random() * 4);
      const gap = r(0.062, 0.09);
      let t = t0;
      for (let i = 0; i < digits; i++) {
        const lo = ROWS[Math.floor(Math.random() * ROWS.length)];
        const hi = COLS[Math.floor(Math.random() * COLS.length)];
        const len = gap * r(0.65, 0.85);
        tone(lo, t, len, 'sine', 0.5);
        tone(hi, t, len, 'sine', 0.5);
        t += gap * r(0.9, 1.15);
      }
      // (the answer tone)
      t += r(0.08, 0.18);
      const answer = r(0.12, 0.22);
      tone(r(2080, 2120), t, answer, 'sine', 0.6);
      t += answer + 0.02;
      // (the carrier warbling between two pitches, with static over it)
      const loF = r(1550, 1700);
      const hiF = loF + r(380, 500);
      const warble = r(0.04, 0.065);
      const carLen = r(0.45, 0.7);
      const car = tone(loF, t, carLen, 'square', 0.25);
      for (let k = 0; k * warble < carLen; k++) car.frequency.setValueAtTime(k % 2 ? hiF : loF, t + k * warble);
      const chunk = 300 + Math.floor(Math.random() * 300);
      const hiss = noiseBuffer(c, carLen, (i, n) => (Math.floor(i / chunk) % 3 ? 0.5 : 0.1) * (1 - i / n));
      const bp = filter(c, 'bandpass', r(2100, 2700), 0.7);
      hiss.connect(bp); bp.connect(gn);
      hiss.start(t + 0.05); hiss.stop(t + carLen);
      t += carLen;
      // (kshhht: the line opening up, a wash of static that swells, holds and fades out)
      const ksh = r(0.35, 0.55);
      const wash = noiseBuffer(c, ksh, (i, n) => { const x = i / n; return Math.min(1, x * 8) * Math.pow(1 - x, 0.6); });
      const hp = filter(c, 'highpass', r(700, 1100));
      const top = filter(c, 'lowpass', r(5000, 7000));
      const wg = c.createGain(); // (its own level, past the modem's lowpass: brighter)
      wg.gain.value = VOL * r(0.3, 0.42);
      wash.connect(hp); hp.connect(top); top.connect(wg); wg.connect(dest(c));
      wash.start(t); wash.stop(t + ksh);
    },
  };

  // ── SOUND THEMES (SETTINGS → SOUND EFFECTS): the whole set of effects in one style. TERMINAL (the
  // keyboard, static and crunch above) is free; HANDSHAKE, the sound of the HANDSHAKE track (a Game
  // Boy battle theme: pulse-wave blips at its duty cycles, the 4-bit wave channel's bass and the
  // noise channel's hiss and metallic crunch, tuned to its C minor), unlocks with that track (TRACK
  // 10). A theme leaves out what it has no take on (the dial-up modem, the narrator's voice): those
  // stay as they are.
  const THEMES = [
    { id: 'terminal', name: 'TERMINAL', desc: 'The keyboard: clicks, keys, static and an 8-bit crunch.' },
    { id: 'handshake', name: 'HANDSHAKE', desc: 'A handheld game console, as in the HANDSHAKE track: pulse-wave blips, a wave-channel thud and noise-channel crunch.', unlock: 'track-10', track: 'HANDSHAKE' },
    { id: 'haunted', name: 'HAUNTED', desc: 'Halloween\'s (the SEASONAL theme puts it on in October): creaks and knocks, a cold wind, a music box, glass chimes and a church bell, in A harmonic minor.' },
    { id: 'icicle', name: 'ICICLE', desc: 'January and February\'s (the SEASONAL theme puts it on then): glass pings, ice cracking, a cold wind and bells, in D lydian.' },
    { id: 'sweetheart', name: 'SWEETHEART', desc: 'Valentine\'s (February 7 to 14, with the SEASONAL theme): a harp, a heartbeat and a kiss, in F major.' },
    { id: 'birdsong', name: 'BIRDSONG', desc: 'Spring\'s (March to May, with the SEASONAL theme): birds, raindrops, a woodblock and a marimba, in G major.' },
    { id: 'island', name: 'ISLAND', desc: 'Summer\'s (June to August, with the SEASONAL theme): a steel pan, a shaker, bongos and the waves, in C major.' },
    { id: 'schoolyard', name: 'SCHOOLYARD', desc: 'September\'s (with the SEASONAL theme): pencil taps, a xylophone, chalk, lockers and the school bell, in A major.' },
  ];
  const THEME_KEY = 'bytefall-sfx-theme';
  let themeId = 'terminal';
  try { if (THEMES.some((t) => t.id === localStorage.getItem(THEME_KEY))) themeId = localStorage.getItem(THEME_KEY); } catch (e) {}
  const themeOpen = (t) => !t.unlock || (typeof Progress !== 'undefined' && Progress.isUnlocked(t.unlock));

  // HANDSHAKE's instruments (made once, on the first sound)
  let chip = null;
  function chipKit(c) {
    if (chip) return chip;
    const pulseWave = (duty) => {
      const n = 48;
      const real = new Float32Array(n);
      const imag = new Float32Array(n);
      for (let k = 1; k < n; k++) real[k] = (2 / (k * Math.PI)) * Math.sin(k * Math.PI * duty);
      return c.createPeriodicWave(real, imag);
    };
    const wave = (() => { // (the wave channel: a 32-step, 4-bit rounded saw)
      const N = 32;
      const table = Array.from({ length: N }, (_, k) => Math.round(15 * Math.pow(k / (N - 1), 0.8)) / 7.5 - 1);
      const real = new Float32Array(16);
      const imag = new Float32Array(16);
      for (let h = 1; h < 16; h++) {
        for (let k = 0; k < N; k++) {
          real[h] += (table[k] * Math.cos((2 * Math.PI * h * k) / N)) / N;
          imag[h] += (table[k] * Math.sin((2 * Math.PI * h * k) / N)) / N;
        }
      }
      return c.createPeriodicWave(real, imag);
    })();
    const lfsr = (short) => { // (the noise channel: long, hissy; short, metallic)
      const buf = c.createBuffer(1, c.sampleRate, c.sampleRate);
      const d = buf.getChannelData(0);
      let reg = 0x7fff;
      let v = 0;
      for (let i = 0; i < d.length; i++) {
        if (i % 4 === 0) {
          const bit = (reg ^ (reg >> 1)) & 1;
          reg = (reg >> 1) | (bit << 14);
          if (short) reg = (reg & ~0x40) | (bit << 6);
          v = reg & 1 ? -1 : 1;
        }
        d[i] = v;
      }
      return buf;
    };
    chip = { duty: { 12: pulseWave(0.125), 25: pulseWave(0.25), 50: pulseWave(0.5) }, wave, long: lfsr(false), short: lfsr(true) };
    return chip;
  }
  const midi = (m) => 440 * Math.pow(2, (m - 69) / 12);
  // (its volume falls in steps, as the console's envelopes do)
  function steps(c, t, vol, dur, n = 4) {
    const g = c.createGain();
    for (let i = 0; i < n; i++) g.gain.setValueAtTime(vol * (1 - i / n), t + (dur * i) / n);
    g.gain.setValueAtTime(0, t + dur);
    g.connect(dest(c));
    return g;
  }
  function sq(c, t, m, dur, vol, duty = 50, to = null) { // (a pulse channel note; to: slid to that note)
    const o = c.createOscillator();
    o.setPeriodicWave(chipKit(c).duty[duty]);
    o.frequency.setValueAtTime(midi(m), t);
    if (to !== null) o.frequency.exponentialRampToValueAtTime(midi(to), t + dur);
    o.connect(steps(c, t, VOL * vol, dur));
    o.start(t); o.stop(t + dur + 0.01);
  }
  function wv(c, t, m, dur, vol, to = null) { // (the wave channel)
    const o = c.createOscillator();
    o.setPeriodicWave(chipKit(c).wave);
    o.frequency.setValueAtTime(midi(m), t);
    if (to !== null) o.frequency.exponentialRampToValueAtTime(midi(to), t + dur);
    o.connect(steps(c, t, VOL * vol, dur, 3));
    o.start(t); o.stop(t + dur + 0.01);
  }
  function nz(c, t, dur, vol, short = false, rate = 1, rateTo = null) { // (the noise channel; rate: its pitch)
    const src = c.createBufferSource();
    src.buffer = short ? chipKit(c).short : chipKit(c).long;
    src.playbackRate.setValueAtTime(rate, t);
    if (rateTo !== null) src.playbackRate.exponentialRampToValueAtTime(rateTo, t + dur);
    src.connect(steps(c, t, VOL * vol, dur));
    src.start(t, Math.random() * 0.5); src.stop(t + dur + 0.01);
  }
  // (C minor, as the track: C Eb F G Bb)
  const SCALE = [72, 75, 77, 79, 82, 84];
  const handshake = {
    // (the cursor: a thin, high tick)
    click(c) { sq(c, c.currentTime, 96, 0.025, 0.26, 12); },
    // (a button: the menu's select blip, two quick notes)
    button(c) { const t = c.currentTime; sq(c, t, 91, 0.03, 0.24, 50); sq(c, t + 0.03, 96, 0.04, 0.24, 50); },
    // (a firewall layer showing, a hint: a little rising chirp)
    punct(c) { sq(c, c.currentTime, 87, 0.06, 0.26, 25, 91); },
    // (a bit landing: a wave-channel thud and a tick of noise)
    enter(c) { const t = c.currentTime; wv(c, t, 45, 0.09, 0.5, 33); nz(c, t, 0.03, 0.18, false, 0.5); },
    // (a layer cracked, an undo: a scrape and a falling blip)
    backspace(c) { const t = c.currentTime; nz(c, t, 0.05, 0.16, false, 0.7, 0.35); sq(c, t, 79, 0.06, 0.12, 25, 67); },
    // (a screen changing: a falling whoosh of noise)
    static(c) { nz(c, c.currentTime, 0.16, 0.4, false, 1, 0.2); },
    // (a warning: the battle's low-HP alarm, four quick beeps)
    alert(c) { const t = c.currentTime; [91, 84, 91, 84].forEach((m, i) => sq(c, t + i * 0.07, m, 0.06, 0.24, 50)); },
    // (no: a low buzz, bumping down)
    denied(c) { const t = c.currentTime; sq(c, t, 43, 0.06, 0.22, 12); sq(c, t + 0.07, 42, 0.09, 0.22, 12); nz(c, t, 0.02, 0.12, true, 0.6); },
    // (a chain, a reward: the item-get arpeggio up C minor, a quieter echo just behind)
    egg(c) {
      const t = c.currentTime;
      [72, 75, 79, 84].forEach((m, i) => {
        sq(c, t + i * 0.045, m, 0.05, 0.2, 25);
        sq(c, t + i * 0.045 + 0.022, m + 12, 0.04, 0.05, 12);
      });
    },
    // (a bit decrypting: the noise channel's metallic crunch, falling, and a blip on a note of the
    // scale, a different one each time, so a chain plays a little tune)
    burst(c) {
      const t = c.currentTime;
      nz(c, t, 0.2, 0.18, true, 1.2, 0.25);
      const m = SCALE[Math.floor(Math.random() * SCALE.length)];
      sq(c, t, m, 0.09, 0.1, 50, m - 24);
    },
  };
  // HAUNTED (OCTOBER; the SEASONAL theme's): wood and wind, a music box and bells, in A harmonic minor
  const tone = (c, t, f, type, vol, a, d, to = null) => {
    const o = c.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(f, t);
    if (to) o.frequency.exponentialRampToValueAtTime(to, t + a + d);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(VOL * vol, t + a);
    g.gain.exponentialRampToValueAtTime(0.0005, t + a + d);
    g.connect(dest(c));
    o.connect(g);
    o.start(t); o.stop(t + a + d + 0.05);
  };
  const air = (c, t, dur, vol, type, f0, f1, q = 1) => { // (filtered noise, its pitch swept)
    const src = noiseBuffer(c, dur, (i, n) => Math.sin((Math.PI * i) / n));
    const flt = filter(c, type, f0, q);
    flt.frequency.exponentialRampToValueAtTime(f1, t + dur);
    src.connect(flt); flt.connect(envelope(c, VOL * vol, t, dur));
    src.start(t); src.stop(t + dur);
  };
  const bellTone = (c, t, m, vol) => { // (struck: the tone and its inharmonic ring)
    tone(c, t, midi(m), 'sine', vol, 0.002, 1.6);
    tone(c, t, midi(m) * 2.4, 'sine', vol * 0.4, 0.002, 1.0);
    tone(c, t, midi(m) * 3.9, 'sine', vol * 0.2, 0.002, 0.6);
  };
  const HARMONIC = [81, 83, 84, 86, 88, 89, 92, 93]; // (A harmonic minor, high)
  const haunted = {
    // (the cursor: a dry wooden tick)
    click(c) { const t = c.currentTime; air(c, t, 0.03, 0.8, 'bandpass', 1100, 700, 4); tone(c, t, 240, 'sine', 0.3, 0.001, 0.04); },
    // (a button: a hollow knock)
    button(c) { const t = c.currentTime; tone(c, t, 190, 'sine', 0.9, 0.002, 0.09, 120); air(c, t, 0.02, 0.5, 'bandpass', 1800, 1200, 3); },
    // (a layer showing, a hint: a cold glass ping, a tritone over it)
    punct(c) { const t = c.currentTime; tone(c, t, 1320, 'sine', 0.35, 0.002, 0.5); tone(c, t + 0.02, 1320 * 1.414, 'sine', 0.12, 0.002, 0.4); },
    // (a bit landing: a low thud and a creak)
    enter(c) { const t = c.currentTime; tone(c, t, 95, 'sine', 1.2, 0.003, 0.2, 52); tone(c, t + 0.02, 150, 'sawtooth', 0.12, 0.01, 0.12, 118); },
    // (a layer cracked, an undo: a scrape)
    backspace(c) { air(c, c.currentTime, 0.14, 1, 'bandpass', 2600, 500, 2); },
    // (a screen changing: a gust of cold wind)
    static(c) { const t = c.currentTime; air(c, t, 0.45, 1.6, 'bandpass', 320, 1400, 3); air(c, t + 0.12, 0.35, 0.8, 'bandpass', 1400, 400, 4); },
    // (a warning: the church bell tolls twice)
    alert(c) { const t = c.currentTime; bellTone(c, t, 55, 0.9); bellTone(c, t + 0.5, 55, 0.7); },
    // (no: a dissonant organ chord, cut short)
    denied(c) { const t = c.currentTime; [110, 116.5, 155.6].forEach((f) => tone(c, t, f, 'triangle', 0.45, 0.01, 0.28)); },
    // (a chain, a reward: the music box, up the harmonic minor)
    egg(c) { const t = c.currentTime; [69, 72, 76, 80, 81].forEach((m, i) => { tone(c, t + i * 0.07, midi(m + 12), 'sine', 0.5, 0.002, 0.5); tone(c, t + i * 0.07, midi(m + 12) * 4.02, 'sine', 0.08, 0.002, 0.12); }); },
    // (a bit decrypting: a ghostly whoosh and a glass chime, a different note each time: a chain
    // plays an eerie little tune)
    burst(c) {
      const t = c.currentTime;
      air(c, t, 0.22, 0.9, 'bandpass', 1800, 500, 3);
      const m = HARMONIC[Math.floor(Math.random() * HARMONIC.length)];
      tone(c, t, midi(m), 'sine', 0.3, 0.002, 0.45);
      tone(c, t, midi(m) * 2.76, 'sine', 0.08, 0.002, 0.25);
    },
  };
  // THE REST OF THE YEAR's (the SEASONAL theme puts each on in its season)
  const pickOf = (list) => list[Math.floor(Math.random() * list.length)];
  // (a struck bar: the tone and a bright partial over it, quick to fade: a xylophone, a marimba)
  const bar = (c, t, m, vol, ring = 0.35, partial = 4) => { tone(c, t, midi(m), 'sine', vol, 0.002, ring); tone(c, t, midi(m) * partial, 'sine', vol * 0.18, 0.002, ring * 0.25); };
  // (a plucked string: a triangle with a quick fall and a little brightness)
  const pluck = (c, t, m, vol, ring = 0.4) => { tone(c, t, midi(m), 'triangle', vol, 0.003, ring); tone(c, t, midi(m) * 2, 'sine', vol * 0.25, 0.002, ring * 0.4); };
  // (a steel pan: the note, its octave and twelfth, a soft attack)
  const pan = (c, t, m, vol, ring = 0.5) => { tone(c, t, midi(m), 'sine', vol, 0.006, ring); tone(c, t, midi(m) * 2, 'sine', vol * 0.45, 0.006, ring * 0.7); tone(c, t, midi(m) * 3, 'sine', vol * 0.18, 0.004, ring * 0.4); };
  // FROST (January and February): ice and glass, a cold wind, in D lydian, high
  const LYDIAN = [86, 88, 90, 93, 95, 98];
  const icicle = {
    click(c) { tone(c, c.currentTime, 3520, 'sine', 0.14, 0.001, 0.05); },
    button(c) { const t = c.currentTime; tone(c, t, 2349, 'sine', 0.28, 0.001, 0.18); tone(c, t + 0.03, 3136, 'sine', 0.16, 0.001, 0.16); },
    punct(c) { const t = c.currentTime; tone(c, t, 1760, 'sine', 0.3, 0.002, 0.6); tone(c, t, 1760 * 2.98, 'sine', 0.08, 0.002, 0.3); },
    enter(c) { const t = c.currentTime; tone(c, t, 140, 'sine', 0.9, 0.003, 0.14, 80); air(c, t, 0.06, 0.5, 'highpass', 5000, 9000, 1); }, // (a soft thud in the snow, a puff of powder)
    backspace(c) { air(c, c.currentTime, 0.16, 0.9, 'bandpass', 6000, 2500, 3); }, // (ice cracking)
    static(c) { const t = c.currentTime; air(c, t, 0.5, 1.4, 'bandpass', 600, 1800, 2.5); air(c, t + 0.15, 0.4, 0.6, 'bandpass', 2200, 900, 4); },
    alert(c) { const t = c.currentTime; [93, 90, 93, 90].forEach((m, i) => bellTone(c, t + i * 0.13, m - 12, 0.3)); },
    denied(c) { const t = c.currentTime; tone(c, t, 330, 'triangle', 0.4, 0.005, 0.2, 247); air(c, t, 0.12, 0.4, 'bandpass', 3000, 1500, 2); },
    egg(c) { const t = c.currentTime; [74, 78, 81, 86, 90].forEach((m, i) => bar(c, t + i * 0.06, m + 12, 0.32, 0.5, 2.76)); },
    burst(c) { const t = c.currentTime; air(c, t, 0.18, 0.6, 'highpass', 7000, 4000, 1); const m = pickOf(LYDIAN); tone(c, t, midi(m), 'sine', 0.28, 0.001, 0.5); tone(c, t, midi(m) * 2.76, 'sine', 0.07, 0.001, 0.25); },
  };
  // VALENTINE'S: a harp, a heartbeat and a kiss, in F major
  const SWEET = [77, 79, 81, 84, 86, 89];
  const sweetheart = {
    click(c) { pluck(c, c.currentTime, 96, 0.14, 0.06); },
    button(c) { const t = c.currentTime; pluck(c, t, 84, 0.3, 0.3); pluck(c, t + 0.05, 89, 0.24, 0.3); },
    punct(c) { const t = c.currentTime; tone(c, t, 1400, 'sine', 0.18, 0.004, 0.08, 2600); air(c, t, 0.05, 0.3, 'bandpass', 2500, 4000, 2); }, // (a kiss)
    enter(c) { const t = c.currentTime; tone(c, t, 70, 'sine', 1, 0.004, 0.12, 50); tone(c, t + 0.16, 66, 'sine', 0.7, 0.004, 0.12, 48); }, // (lub-dub)
    backspace(c) { air(c, c.currentTime, 0.12, 0.6, 'bandpass', 1200, 3000, 2); },
    static(c) { const t = c.currentTime; [65, 69, 72, 76, 77, 81].forEach((m, i) => pluck(c, t + i * 0.025, m + 12, 0.14, 0.4)); }, // (a harp glissando)
    alert(c) { const t = c.currentTime; for (let i = 0; i < 2; i++) { tone(c, t + i * 0.42, 75, 'sine', 1.1, 0.004, 0.13, 50); tone(c, t + i * 0.42 + 0.17, 70, 'sine', 0.8, 0.004, 0.13, 48); } }, // (a racing heart)
    denied(c) { const t = c.currentTime; tone(c, t, 466, 'sine', 0.35, 0.01, 0.35, 330); tone(c, t, 554, 'sine', 0.2, 0.01, 0.35, 392); }, // (aww)
    egg(c) { const t = c.currentTime; [77, 81, 84, 88, 89].forEach((m, i) => pluck(c, t + i * 0.07, m + 12, 0.3, 0.6)); },
    burst(c) { const t = c.currentTime; const m = pickOf(SWEET); pluck(c, t, m + 12, 0.28, 0.5); tone(c, t, 2200, 'sine', 0.06, 0.002, 0.08, 3200); },
  };
  // SPRING: birdsong, raindrops and a marimba, in G major
  const SPRINGS = [79, 81, 83, 86, 88, 91];
  const chirp = (c, t, f, vol) => { tone(c, t, f, 'sine', vol, 0.004, 0.05, f * 1.5); tone(c, t + 0.06, f * 1.2, 'sine', vol * 0.8, 0.004, 0.05, f * 1.8); };
  const birdsong = {
    click(c) { const t = c.currentTime; tone(c, t, 1900, 'sine', 0.14, 0.001, 0.03, 1200); }, // (a raindrop)
    button(c) { const t = c.currentTime; air(c, t, 0.03, 0.6, 'bandpass', 1800, 1400, 6); tone(c, t, 880, 'sine', 0.3, 0.002, 0.08); }, // (a woodblock)
    punct(c) { chirp(c, c.currentTime, 2600, 0.18); },
    enter(c) { const t = c.currentTime; bar(c, t, 55, 0.6, 0.22, 4); tone(c, t, 1500, 'sine', 0.08, 0.001, 0.06, 700); }, // (a low marimba note and a drop)
    backspace(c) { air(c, c.currentTime, 0.14, 0.7, 'bandpass', 2400, 900, 2); }, // (a rustle)
    static(c) { const t = c.currentTime; air(c, t, 0.5, 1, 'bandpass', 900, 2600, 1.5); chirp(c, t + 0.2, 3000, 0.1); }, // (a spring breeze)
    alert(c) { const t = c.currentTime; for (let i = 0; i < 3; i++) chirp(c, t + i * 0.16, 3200, 0.22); }, // (a bird alarmed)
    denied(c) { const t = c.currentTime; bar(c, t, 50, 0.5, 0.2, 4); bar(c, t + 0.1, 49, 0.45, 0.25, 4); },
    egg(c) { const t = c.currentTime; [67, 71, 74, 79, 83].forEach((m, i) => bar(c, t + i * 0.06, m + 12, 0.32, 0.35, 4)); chirp(c, t + 0.34, 3400, 0.12); },
    burst(c) { const t = c.currentTime; const m = pickOf(SPRINGS); bar(c, t, m, 0.3, 0.3, 4); tone(c, t, 2200, 'sine', 0.07, 0.001, 0.05, 1100); },
  };
  // SUMMER: a steel pan, a shaker, the waves, in C major
  const ISLAND = [72, 74, 76, 79, 81, 84];
  const island = {
    click(c) { air(c, c.currentTime, 0.04, 0.5, 'highpass', 6000, 8000, 1); }, // (a shaker)
    button(c) { const t = c.currentTime; pan(c, t, 79, 0.28, 0.25); pan(c, t + 0.06, 84, 0.24, 0.3); },
    punct(c) { pan(c, c.currentTime, 88, 0.22, 0.35); },
    enter(c) { const t = c.currentTime; tone(c, t, 110, 'sine', 0.8, 0.004, 0.12, 70); air(c, t, 0.04, 0.4, 'highpass', 5000, 7000, 1); }, // (a bongo)
    backspace(c) { air(c, c.currentTime, 0.18, 0.7, 'lowpass', 2500, 600, 1); }, // (a splash)
    static(c) { const t = c.currentTime; air(c, t, 0.7, 1.5, 'lowpass', 500, 2200, 0.8); }, // (a wave rolling in)
    alert(c) { const t = c.currentTime; [84, 79, 84, 79].forEach((m, i) => pan(c, t + i * 0.1, m, 0.3, 0.2)); },
    denied(c) { const t = c.currentTime; pan(c, t, 62, 0.35, 0.2); pan(c, t + 0.1, 61, 0.3, 0.3); },
    egg(c) { const t = c.currentTime; [72, 76, 79, 84, 88].forEach((m, i) => pan(c, t + i * 0.07, m, 0.3, 0.45)); },
    burst(c) { const t = c.currentTime; air(c, t, 0.12, 0.4, 'highpass', 5000, 8000, 1); pan(c, t, pickOf(ISLAND), 0.28, 0.4); },
  };
  // AUTUMN (September, back to school): pencil taps, a xylophone, chalk and the school bell, in A major
  const SCHOOL = [81, 83, 85, 88, 90, 93];
  const schoolyard = {
    click(c) { const t = c.currentTime; air(c, t, 0.02, 0.6, 'bandpass', 3200, 2800, 5); }, // (a pencil tap)
    button(c) { const t = c.currentTime; bar(c, t, 81, 0.3, 0.2, 3.9); bar(c, t + 0.05, 88, 0.26, 0.2, 3.9); },
    punct(c) { bar(c, c.currentTime, 93, 0.24, 0.3, 3.9); },
    enter(c) { const t = c.currentTime; tone(c, t, 160, 'square', 0.12, 0.002, 0.08, 90); tone(c, t, 95, 'sine', 0.8, 0.003, 0.12, 60); }, // (a locker thunk)
    backspace(c) { air(c, c.currentTime, 0.16, 0.8, 'bandpass', 4200, 3000, 8); }, // (chalk)
    static(c) { const t = c.currentTime; air(c, t, 0.35, 1, 'bandpass', 1500, 600, 1.5); air(c, t + 0.1, 0.2, 0.4, 'bandpass', 3000, 2000, 3); }, // (pages turning)
    alert(c) { const t = c.currentTime; for (let i = 0; i < 6; i++) tone(c, t + i * 0.05, 1200, 'square', 0.1, 0.002, 0.045); bellTone(c, t, 76, 0.4); }, // (the school bell)
    denied(c) { const t = c.currentTime; bar(c, t, 57, 0.45, 0.2, 3.9); bar(c, t + 0.1, 56, 0.4, 0.25, 3.9); },
    egg(c) { const t = c.currentTime; [69, 73, 76, 81, 85].forEach((m, i) => bar(c, t + i * 0.06, m + 12, 0.3, 0.35, 3.9)); },
    burst(c) { const t = c.currentTime; air(c, t, 0.08, 0.4, 'bandpass', 3500, 2000, 3); bar(c, t, pickOf(SCHOOL), 0.28, 0.3, 3.9); },
  };
  const SETS = { terminal: sounds, handshake, haunted, icicle, sweetheart, birdsong, island, schoolyard };
  const current = () => {
    const t = THEMES.find((x) => x.id === themeId);
    return t && themeOpen(t) ? SETS[themeId] : sounds;
  };
  const playIn = (set, name) => (set[name] || sounds[name])(getCtx());

  return {
    play(name) {
      if (muted) return;
      try { playIn(current(), name); } catch (e) {}
    },
    // Plays even when muted (used by the dev audio compendium); theme: a sound theme's take on it
    preview(name, theme) {
      try { playIn(theme ? SETS[theme] || sounds : current(), name); } catch (e) {}
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
    // THE LEVEL METER after a game: a rising square tone while it fills (from f0 to f1 of the level,
    // 0-1, over dur seconds), and a little fanfare at each LEVEL UP
    xpFill(f0, f1, dur) {
      if (muted || dur <= 0) return;
      try {
        const c = getCtx();
        const t = c.currentTime;
        const o = c.createOscillator();
        o.type = 'square';
        o.frequency.setValueAtTime(320 + 900 * f0, t);
        o.frequency.linearRampToValueAtTime(320 + 900 * f1, t + dur);
        const lp = filter(c, 'lowpass', 2600);
        const g = c.createGain();
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(VOL * 0.1, t + 0.02);
        g.gain.setValueAtTime(VOL * 0.1, t + Math.max(0.02, dur - 0.03));
        g.gain.linearRampToValueAtTime(0, t + dur);
        o.connect(lp); lp.connect(g); g.connect(dest(c));
        o.start(t); o.stop(t + dur + 0.01);
      } catch (e) {}
    },
    // (the score racking up on the result screen: a tick, higher as it nears the total, p 0-1)
    count(p = 0) {
      if (muted) return;
      try {
        const c = getCtx();
        const t = c.currentTime;
        const o = c.createOscillator();
        o.type = 'square';
        o.frequency.value = 880 + 700 * p;
        const lp = filter(c, 'lowpass', 3000);
        o.connect(lp); lp.connect(envelope(c, VOL * 0.09, t, 0.028));
        o.start(t); o.stop(t + 0.03);
      } catch (e) {}
    },
    levelUp() {
      if (muted) return;
      try {
        const c = getCtx();
        const t0 = c.currentTime;
        const note = (m, t, dur, vol, vib = false) => {
          const o = c.createOscillator();
          o.type = 'square';
          o.frequency.value = 440 * Math.pow(2, (m - 69) / 12);
          if (vib) { // (the held note's vibrato)
            const lfo = c.createOscillator();
            const depth = c.createGain();
            lfo.frequency.value = 7;
            depth.gain.value = o.frequency.value * 0.012;
            lfo.connect(depth); depth.connect(o.frequency);
            lfo.start(t + 0.08); lfo.stop(t + dur);
          }
          const lp = filter(c, 'lowpass', 3200);
          const g = c.createGain();
          g.gain.setValueAtTime(VOL * vol, t);
          g.gain.setValueAtTime(VOL * vol, t + dur * 0.7);
          g.gain.linearRampToValueAtTime(0.0001, t + dur);
          o.connect(lp); lp.connect(g); g.connect(dest(c));
          o.start(t); o.stop(t + dur + 0.01);
        };
        // (a quick climb, then a held top note over a third below)
        [67, 72, 76, 79].forEach((m, i) => note(m, t0 + i * 0.075, 0.07, 0.16));
        note(84, t0 + 0.3, 0.5, 0.18, true);
        note(79, t0 + 0.3, 0.5, 0.07);
      } catch (e) {}
    },
    isMuted: () => muted,
    // (the sound themes: every one, whether it's open, the one picked)
    themes: () => THEMES.map((t) => ({ ...t, open: themeOpen(t) })),
    theme: () => themeId,
    setTheme(id) {
      if (!THEMES.some((t) => t.id === id)) return;
      themeId = id;
      try { localStorage.setItem(THEME_KEY, id); } catch (e) {}
    },
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
