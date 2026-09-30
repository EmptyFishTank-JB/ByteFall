// "STACK OVERFLOW" — an original folk-techno track: a bouncing minor-key dance tune in the
// Russian folk style (D minor with the raised seventh, C#), first on a plucked, balalaika-like
// synth with a tremolo on its long notes, then on a big supersaw over four-on-the-floor techno
// with a pumping offbeat bass. The melody is written for ByteFall (not a folk song).
// 32-bar loop: pluck intro (oom-pah), techno build, the drop (a second, brighter tune), and a
// bell breakdown back into the drop.
// Its tempo follows the danger, like the falling-block games whose music speeds up as the
// stack climbs: 140 BPM calm, up to 160 at the top of the intensity (the `tempo` layer; the
// engine's `step` reads the current one, so the scheduler speeds up with it).
// schedule() takes an intensity from 0 to 1 for the near-the-line layers.
function createStackOverflow(ctx, out) {
  const BPM_CALM = 140;
  const BPM_MAX = 160;
  const stepAt = (bpm) => 60 / bpm / 4; // one 16th note
  let STEP = stepAt(BPM_CALM);
  const freq = (m) => 440 * Math.pow(2, (m - 69) / 12);

  // Two chord rows: A (bars of the intro, build and breakdown) and B (the drop)
  const SECTION_A = {
    chords: [[62, 65, 69], [62, 65, 69], [61, 64, 69], [61, 64, 69], [62, 65, 69], [55, 58, 62], [61, 64, 69], [62, 65, 69]],
    roots: [38, 38, 33, 33, 38, 43, 33, 38], // Dm Dm A A Dm Gm A Dm
  };
  const SECTION_B = {
    chords: [[65, 69, 72], [60, 64, 67], [55, 58, 62], [62, 65, 69], [58, 62, 65], [55, 58, 62], [61, 64, 69], [61, 64, 69]],
    roots: [41, 36, 43, 38, 34, 43, 33, 33], // F C Gm Dm Bb Gm A A
  };
  // The dance tune: [step, midi, length in 16ths] per bar. Hops, repeated notes and leaps.
  const TUNE_A = [
    [[0, 74, 2], [2, 74, 2], [4, 69, 2], [6, 74, 2], [8, 77, 2], [10, 76, 2], [12, 74, 4]],
    [[0, 81, 2], [2, 81, 2], [4, 79, 2], [6, 77, 2], [8, 76, 2], [10, 77, 2], [12, 74, 4]],
    [[0, 73, 2], [2, 76, 2], [4, 81, 2], [6, 76, 2], [8, 79, 2], [10, 77, 2], [12, 76, 4]],
    [[0, 69, 2], [2, 73, 2], [4, 76, 2], [6, 73, 2], [8, 69, 8]],
    [[0, 74, 2], [2, 77, 2], [4, 81, 2], [6, 86, 2], [8, 84, 2], [10, 82, 2], [12, 81, 4]],
    [[0, 79, 2], [2, 82, 2], [4, 86, 2], [6, 82, 2], [8, 81, 2], [10, 79, 2], [12, 77, 4]],
    [[0, 76, 2], [2, 77, 2], [4, 79, 2], [6, 81, 2], [8, 73, 4], [12, 76, 4]],
    [[0, 74, 12], [12, 69, 4]],
  ];
  const TUNE_B = [
    [[0, 84, 2], [2, 84, 2], [4, 81, 2], [6, 77, 2], [8, 81, 2], [10, 84, 2], [12, 89, 4]],
    [[0, 88, 2], [2, 86, 2], [4, 84, 2], [6, 79, 2], [8, 76, 2], [10, 79, 2], [12, 84, 4]],
    [[0, 86, 2], [2, 86, 2], [4, 82, 2], [6, 79, 2], [8, 82, 2], [10, 86, 2], [12, 91, 4]],
    [[0, 89, 2], [2, 88, 2], [4, 86, 2], [6, 81, 2], [8, 77, 2], [10, 81, 2], [12, 86, 4]],
    [[0, 86, 2], [2, 84, 2], [4, 82, 2], [6, 77, 2], [8, 74, 2], [10, 77, 2], [12, 82, 4]],
    [[0, 82, 2], [2, 81, 2], [4, 79, 2], [6, 74, 2], [8, 70, 2], [10, 74, 2], [12, 79, 4]],
    [[0, 81, 2], [2, 79, 2], [4, 77, 2], [6, 76, 2], [8, 73, 2], [10, 76, 2], [12, 79, 2], [14, 81, 2]],
    [[0, 85, 8], [8, 81, 4], [12, 76, 4]],
  ];

  // Intensity layers: each fades in over `span` starting at `from` (0–1).
  // The game's stack heights settle at 33% (4), 67% (5) and 100% (6+).
  const LAYERS = [
    { id: 'tempo', label: 'The tempo climbs with the stack: 140 BPM calm, 160 at the top', from: 0, span: 1 },
    { id: 'hats', label: '16th-note hi-hats', from: 0.05, span: 0.25 },
    { id: 'roll', label: 'A rolling bass filling the 16ths between the offbeats', from: 0.4, span: 0.25 },
    { id: 'octave', label: 'The tune doubled an octave up on a square wave', from: 0.4, span: 0.25 },
    { id: 'alarm', label: 'An overflow alarm: a two-tone square stab on the offbeats', from: 0.72, span: 0.25 },
  ];

  const bus = ctx.createGain();
  bus.gain.value = 0.2;
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -18;
  comp.ratio.value = 3.5;
  bus.connect(comp);
  comp.connect(out);
  // Stereo: kick, clap, bass and the lead's middle stay centered; the supersaw and pad fan out,
  // the pluck sits a little left with its echo coming back right, hats right, the octave double
  // left and the alarm right
  // (+3 dB in front: a panner halves a mono sound's power, so one in the middle is exactly as
  // loud as the sound was plugged straight in, and one to a side keeps the same loudness)
  const panner = (v, dest = bus) => {
    const lift = ctx.createGain();
    lift.gain.value = Math.SQRT2;
    const p = ctx.createStereoPanner();
    p.pan.value = v;
    lift.connect(p);
    p.connect(dest);
    return lift;
  };

  // Sidechain pump: the bass, pad and lead duck under every kick
  const duck = ctx.createGain();
  duck.connect(bus);
  function pump(t) {
    duck.gain.cancelScheduledValues(t);
    duck.gain.setValueAtTime(0.4, t);
    duck.gain.linearRampToValueAtTime(1, t + STEP * 2.4);
  }

  // Dotted-8th echo for the pluck, the bell and the lead (its time follows the tempo)
  const delay = ctx.createDelay(1);
  delay.delayTime.value = STEP * 3;
  const feedback = ctx.createGain();
  feedback.gain.value = 0.32;
  const delayTone = ctx.createBiquadFilter();
  delayTone.type = 'lowpass';
  delayTone.frequency.value = 3000;
  const wet = ctx.createGain();
  wet.gain.value = 0.4;
  delay.connect(delayTone);
  delayTone.connect(feedback);
  feedback.connect(delay);
  delayTone.connect(wet);

  // Instrument channels (output.js): the mixer's strips. The bass, roll, pad and lead go
  // through the kick's duck.
  const ch = createChannels(ctx, bus);
  const CH = {
    kick: ch('kick', 'Kick'), clap: ch('clap', 'Clap'), snare: ch('snare', 'Snare roll'), hats: ch('hats', 'Hi-hats'),
    crash: ch('crash', 'Crash'), riser: ch('riser', 'Noise riser'),
    bass: ch('bass', 'Bass (oom-pah, then the offbeat techno bass; ducked)', null, duck),
    roll: ch('roll', 'Rolling bass (ducked)', null, duck), stab: ch('stab', 'Chord stabs (the oom-pah\'s "pah")'),
    pad: ch('pad', 'Pad (ducked)', null, duck), pluck: ch('pluck', 'Balalaika pluck', delay),
    lead: ch('lead', 'Supersaw lead (ducked)', delay, duck), bell: ch('bell', 'Bell (the breakdown)', delay),
    octave: ch('octave', 'Square octave double'), alarm: ch('alarm', 'Overflow alarm'), echo: ch('echo', 'Echo (the delay return)'),
  };
  wet.connect(panner(0.45, CH.echo.in));

  const noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const nd = noise.getChannelData(0);
  for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;

  function filter(type, f, q) {
    const node = ctx.createBiquadFilter();
    node.type = type;
    node.frequency.value = f;
    if (q !== undefined) node.Q.value = q;
    return node;
  }
  function envGain(t, peak, decay, dest) {
    const g = ctx.createGain();
    g.gain.setValueAtTime(peak, t);
    g.gain.exponentialRampToValueAtTime(0.0005, t + decay);
    g.connect(dest);
    return g;
  }
  function noiseHit(t, level, decay, type, f, q, dest) {
    const src = ctx.createBufferSource();
    src.buffer = noise;
    const flt = filter(type, f, q);
    src.connect(flt); flt.connect(envGain(t, level, decay, dest));
    src.start(t, Math.random() * 0.5); src.stop(t + decay);
  }

  function kick(t, level = 1) {
    const osc = ctx.createOscillator();
    osc.frequency.setValueAtTime(155, t);
    osc.frequency.exponentialRampToValueAtTime(46, t + 0.09);
    osc.connect(envGain(t, 0.95 * level, 0.28, CH.kick.in));
    osc.start(t); osc.stop(t + 0.3);
    noiseHit(t, 0.1 * level, 0.012, 'highpass', 2800, undefined, CH.kick.in);
    pump(t);
  }
  function clap(t, level = 1) {
    for (const d of [0, 0.011, 0.022]) noiseHit(t + d, 0.2 * level, 0.13, 'bandpass', 1500, 1.1, CH.clap.in);
  }
  function snare(t, level) {
    noiseHit(t, 0.22 * level, 0.1, 'bandpass', 2200, 0.8, CH.snare.in);
    const body = ctx.createOscillator();
    body.type = 'triangle';
    body.frequency.value = 210;
    body.connect(envGain(t, 0.18 * level, 0.06, CH.snare.in));
    body.start(t); body.stop(t + 0.07);
  }
  const hat = (t, level = 1, open = false) => noiseHit(t, (open ? 0.05 : 0.032) * level, open ? 0.12 : 0.03, 'highpass', 8200, undefined, panner(0.35, CH.hats.in));
  function crash(t) {
    for (const side of [-0.5, 0.5]) noiseHit(t, 0.07, 1.3, 'highpass', 5000, undefined, panner(side, CH.crash.in));
  }
  function riser(t, dur) {
    const src = ctx.createBufferSource();
    src.buffer = noise;
    src.loop = true;
    const bp = filter('bandpass', 400, 3);
    bp.frequency.setValueAtTime(400, t);
    bp.frequency.exponentialRampToValueAtTime(8000, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0005, t);
    g.gain.exponentialRampToValueAtTime(0.13, t + dur - 0.02);
    g.gain.linearRampToValueAtTime(0, t + dur);
    src.connect(bp); bp.connect(g); g.connect(CH.riser.in);
    src.start(t); src.stop(t + dur);
  }

  // Bass: a saw and a square an octave up through a lowpass (it keeps some bite for small
  // speakers), short and punchy
  function bass(t, m, dur, level = 1, chan = CH.bass) {
    const lp = filter('lowpass', 900, 3);
    lp.frequency.setValueAtTime(1400, t);
    lp.frequency.exponentialRampToValueAtTime(350, t + dur);
    const g = envGain(t, 0.13 * level, dur, chan.in);
    lp.connect(g);
    for (const [type, octave, amt] of [['sawtooth', 0, 1], ['square', 12, 0.35]]) {
      const osc = ctx.createOscillator();
      osc.type = type;
      osc.frequency.value = freq(m + octave);
      const a = ctx.createGain();
      a.gain.value = amt;
      osc.connect(a); a.connect(lp);
      osc.start(t); osc.stop(t + dur + 0.02);
    }
  }
  // The oom-pah's "pah": a short, bright chord on the offbeat
  function stab(t, chord, level = 1) {
    const g = envGain(t, 0.085 * level, 0.11, CH.stab.in);
    const lp = filter('lowpass', 3200);
    lp.connect(g);
    chord.forEach((m, k) => {
      const osc = ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.value = freq(m);
      osc.connect(panner((k - 1) * 0.4, lp));
      osc.start(t); osc.stop(t + 0.12);
    });
  }
  function pad(t, chord, dur, level, open) {
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(level, t + 0.3);
    g.gain.setValueAtTime(level, t + dur - 0.2);
    g.gain.linearRampToValueAtTime(0, t + dur);
    g.connect(CH.pad.in);
    const sides = [-0.6, 0.6].map((v) => {
      const lp = filter('lowpass', 600 + 2400 * open, 0.8);
      lp.connect(panner(v, g));
      return lp;
    });
    for (const m of chord) {
      for (const cents of [-10, 10]) {
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.value = freq(m);
        osc.detune.value = cents;
        osc.connect(sides[cents < 0 ? 0 : 1]);
        osc.start(t); osc.stop(t + dur);
      }
    }
  }
  // Balalaika-like pluck: a bright triangle-and-square pick with a quick decay; long notes are
  // played as a tremolo (repicked every 16th), as a balalaika holds a note
  function pluck(t, m, len) {
    const picks = len > 2 ? len : 1;
    for (let k = 0; k < picks; k++) {
      const at = t + k * STEP;
      const lp = filter('lowpass', 3600, 1);
      const g = envGain(at, (k ? 0.07 : 0.1), STEP * (picks > 1 ? 1.1 : len * 0.9), panner(-0.2, CH.pluck.in));
      g.connect(CH.pluck.send);
      lp.connect(g);
      for (const [type, cents] of [['triangle', -6], ['square', 6]]) {
        const osc = ctx.createOscillator();
        osc.type = type;
        osc.frequency.value = freq(m);
        osc.detune.value = cents;
        osc.connect(lp);
        osc.start(at); osc.stop(at + STEP * len + 0.05);
      }
    }
  }
  function supersaw(t, m, dur, level) {
    const lp = filter('lowpass', 4200);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(level, t + 0.01);
    g.gain.setValueAtTime(level, t + Math.max(0.01, dur - 0.04));
    g.gain.linearRampToValueAtTime(0, t + dur + 0.05);
    lp.connect(g); g.connect(CH.lead.in); g.connect(CH.lead.send);
    for (const cents of [-16, -8, 0, 8, 16]) {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = freq(m);
      osc.detune.value = cents;
      osc.connect(panner((cents / 16) * 0.7, lp));
      osc.start(t); osc.stop(t + dur + 0.08);
    }
  }
  function bell(t, m) {
    for (const [ratio, amp, decay] of [[1, 1, 1.2], [2.76, 0.35, 0.5], [5.4, 0.12, 0.2]]) {
      const osc = ctx.createOscillator();
      osc.frequency.value = freq(m) * ratio;
      const g = envGain(t, 0.1 * amp, decay, panner(0.15, CH.bell.in));
      g.connect(CH.bell.send);
      osc.connect(g);
      osc.start(t); osc.stop(t + decay + 0.05);
    }
  }
  function square(t, m, dur, level, pan, chan) {
    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.value = freq(m);
    const lp = filter('lowpass', 3800);
    const g = ctx.createGain();
    g.gain.setValueAtTime(level, t);
    g.gain.linearRampToValueAtTime(level * 0.6, t + Math.max(0.01, dur * 0.8));
    g.gain.linearRampToValueAtTime(0, t + dur);
    osc.connect(lp); lp.connect(g); g.connect(panner(pan, chan.in));
    osc.start(t); osc.stop(t + dur + 0.01);
  }

  return {
    // (the current 16th: it shortens as the tempo climbs, and the player reads it every step)
    get step() { return STEP; },
    loopSteps: 32 * 16,
    layers: LAYERS,
    channels: ch.list,
    record: ch.record,
    // solo: a layer id to hear that layer alone at full strength; muted: layer ids to leave out
    // (both from the dev pages)
    schedule(step, t, intensity = 0, solo = null, muted = null) {
      const L = {};
      for (const { id, from, span } of LAYERS) {
        L[id] = solo ? Number(id === solo) : Math.max(0, Math.min(1, (intensity - from) / span));
      }
      if (muted && !solo) for (const id of muted) L[id] = 0;
      const base = !solo;
      // The tempo (soloing it: the track at full speed)
      const tempo = solo ? (solo === 'tempo' ? 1 : 0) : L.tempo;
      STEP = stepAt(BPM_CALM + (BPM_MAX - BPM_CALM) * tempo);
      delay.delayTime.setTargetAtTime(STEP * 3, t, 0.5);
      if (solo === 'tempo') L.tempo = 1;
      const full = base || solo === 'tempo'; // (the tempo layer is the whole track, faster)

      const bar = Math.floor(step / 16) % 32;
      const section = Math.floor(bar / 8); // 0 intro, 1 build, 2 drop, 3 breakdown
      const i = bar % 8;
      const s = step % 16;
      const { chords, roots } = section === 2 ? SECTION_B : SECTION_A;
      const chord = chords[i];
      const root = roots[i];
      const drums = section === 2 || (section === 1) || (section === 3 && i >= 4) || (section === 0 && i >= 4);
      const breakdown = section === 3 && i < 4;

      if (full) {
        // Kick: four on the floor (soft in the intro's second half, out in the breakdown)
        if (drums && s % 4 === 0) kick(t, section === 0 ? 0.55 : 1);
        if ((section === 2 || section === 3) && drums && (s === 4 || s === 12)) clap(t);
        // Offbeat hats from the build
        if (section >= 1 && drums && s % 4 === 2) hat(t, 1, true);
        // Snare roll into the drop and back into the loop
        if ((section === 1 || section === 3) && i === 7 && s >= 8) snare(t, 0.3 + 0.7 * ((s - 8) / 7));
        if (s === 0 && ((section === 2 && i % 4 === 0) || (section === 3 && i === 4))) crash(t);
        if (section === 1 && i === 6 && s === 0) riser(t, STEP * 32);

        // Bass: oom-pah in the intro (root on the beat, chord on the offbeat), then the offbeat
        // techno bass; the breakdown holds long roots
        if (section === 0) {
          if (s % 4 === 0) bass(t, root + (s % 8 === 4 ? 7 : 0), STEP * 1.6, 0.9);
          if (s % 4 === 2) stab(t, chord, i < 4 ? 0.8 : 1);
        } else if (breakdown) {
          if (s === 0) bass(t, root, STEP * 14, 1.1);
        } else if (s % 4 === 2) bass(t, root + 12, STEP * 1.5);

        // Pad under the build, drop and breakdown, opening up through the build
        if (s === 0 && section >= 1) pad(t, chord, STEP * 16, section === 3 ? 0.035 : 0.025, section === 1 ? i / 7 : 1);

        // The tune: pluck (intro, build), supersaw (drop, and the breakdown's return), bell (breakdown)
        const tune = section === 2 ? TUNE_B : TUNE_A;
        for (const [start, m, len] of tune[i]) {
          if (start !== s) continue;
          if (section <= 1) pluck(t, m, len);
          else if (breakdown) bell(t, m + 12);
          else supersaw(t, m, len * STEP, section === 2 ? 0.032 : 0.03);
        }
      }

      // Intensity layers
      if (L.hats > 0 && s % 2 === 1 && (drums || section === 0)) hat(t, 0.8 * L.hats);
      if (L.roll > 0 && !breakdown && section > 0 && s % 4 !== 2 && s % 4 !== 0) bass(t, root + (s % 4 === 3 ? 12 : 0), STEP * 0.8, 0.6 * L.roll, CH.roll);
      if (L.octave > 0) {
        const tune = section === 2 ? TUNE_B : TUNE_A;
        for (const [start, m, len] of tune[i]) if (start === s) square(t, m + 12, len * STEP * 0.9, 0.035 * L.octave, -0.4, CH.octave);
      }
      if (L.alarm > 0 && s % 4 === 2) square(t, s % 8 === 2 ? 93 : 89, STEP * 0.8, 0.045 * L.alarm, 0.4, CH.alarm);
    },
  };
}
