// "FIREWALL" — an original 16-bit console track in the style of early-90s Genesis platformers:
// two-operator FM synthesis like the console's sound chip (a slap FM bass, an FM electric
// piano, FM brass and bell leads) over crunchy, sample-style drums. The melodies are written
// for ByteFall.
// A bright, bouncy ZONE theme (F major, 144 BPM) that turns into a BOSS FIGHT as the stack nears
// the line: at 6+ rows (intensity 80%) it finishes its two bars, plays one WARNING bar (a siren
// over a tom roll) and switches to the boss theme (F minor: a driving 16th-note bass, harsh FM
// brass stabs, pounding drums), looping until the stack falls to 4 rows or lower (under 60%),
// when the zone theme returns at the next two-bar mark (the gap between 80 and 60 keeps it
// from flipping as the stack goes between 5 and 6 rows).
// schedule() takes an intensity from 0 to 1.
function createFirewall(ctx, out) {
  const BPM = 144;
  const STEP = 60 / BPM / 4; // one 16th note
  const freq = (m) => 440 * Math.pow(2, (m - 69) / 12);
  const BOSS_IN = 0.8;
  const BOSS_OUT = 0.6;

  // ZONE: A rows (sections 1, 2 and 4) and the B row (section 3)
  const ZONE_A = {
    chords: [[65, 69, 72], [64, 69, 72], [65, 70, 74], [64, 67, 72], [65, 69, 72], [64, 69, 72], [67, 70, 74], [64, 67, 70]],
    roots: [41, 45, 46, 48, 41, 45, 43, 48], // F Am Bb C F Am Gm C7
  };
  const ZONE_B = {
    chords: [[62, 65, 69], [62, 65, 70], [64, 67, 72], [61, 64, 69], [62, 65, 69], [62, 65, 70], [64, 67, 72], [61, 64, 69]],
    roots: [38, 46, 48, 45, 38, 46, 48, 45], // Dm Bb C A, twice
  };
  // [step, midi, length in 16ths] per bar
  const TUNE_A = [
    [[0, 72, 3], [3, 74, 3], [6, 77, 2], [8, 76, 2], [10, 77, 2], [12, 81, 4]],
    [[0, 79, 2], [2, 77, 2], [4, 76, 2], [6, 72, 4], [10, 69, 2], [12, 72, 4]],
    [[0, 74, 3], [3, 77, 3], [6, 81, 2], [8, 82, 4], [12, 81, 2], [14, 77, 2]],
    [[0, 79, 6], [6, 76, 2], [8, 72, 8]],
    [[0, 72, 3], [3, 74, 3], [6, 77, 2], [8, 76, 2], [10, 77, 2], [12, 84, 4]],
    [[0, 83, 2], [2, 81, 2], [4, 79, 2], [6, 76, 4], [10, 79, 2], [12, 81, 4]],
    [[0, 82, 3], [3, 81, 3], [6, 79, 2], [8, 77, 2], [10, 79, 2], [12, 74, 4]],
    [[0, 76, 4], [4, 77, 2], [6, 79, 2], [8, 84, 8]],
  ];
  const TUNE_B = [
    [[0, 81, 4], [4, 77, 4], [8, 74, 4], [12, 77, 4]],
    [[0, 82, 4], [4, 81, 2], [6, 79, 2], [8, 77, 8]],
    [[0, 79, 4], [4, 76, 4], [8, 72, 4], [12, 76, 4]],
    [[0, 73, 4], [4, 76, 4], [8, 81, 6], [14, 79, 2]],
    [[0, 81, 2], [2, 84, 2], [4, 86, 4], [8, 84, 2], [10, 81, 2], [12, 77, 4]],
    [[0, 82, 2], [2, 86, 2], [4, 89, 4], [8, 86, 4], [12, 82, 4]],
    [[0, 84, 4], [4, 81, 2], [6, 79, 2], [8, 76, 4], [12, 79, 4]],
    [[0, 81, 8], [8, 85, 4], [12, 88, 4]],
  ];
  // The zone's slap bass: [step, semitones over the root]
  const GROOVE = [[0, 0], [3, 0], [6, 12], [8, 0], [11, 7], [14, 12]];
  // BOSS: F minor, an 8-bar loop
  const BOSS = {
    chords: [[65, 68, 72], [65, 68, 72], [61, 65, 68], [63, 67, 70], [65, 68, 72], [65, 68, 72], [61, 65, 68], [60, 64, 67]],
    roots: [41, 41, 37, 39, 41, 41, 37, 36], // Fm Fm Db Eb Fm Fm Db C
  };
  const OSTINATO = [0, 0, 12, 0, 10, 0, 8, 0, 7, 0, 8, 0, 10, 0, 12, 10]; // the boss bass, per 16th
  const BOSS_TUNE = [
    [[0, 77, 2], [2, 80, 2], [4, 79, 2], [6, 77, 2], [8, 84, 4], [12, 80, 4]],
    [[0, 79, 2], [2, 77, 2], [4, 76, 2], [6, 77, 2], [8, 72, 8]],
    [[0, 77, 2], [2, 80, 2], [4, 82, 2], [6, 80, 2], [8, 85, 4], [12, 84, 4]],
    [[0, 82, 4], [4, 79, 2], [6, 82, 2], [8, 87, 8]],
    [[0, 89, 2], [2, 88, 2], [4, 89, 2], [6, 84, 2], [8, 80, 2], [10, 84, 2], [12, 77, 4]],
    [[0, 79, 2], [2, 80, 2], [4, 82, 2], [6, 84, 2], [8, 85, 2], [10, 84, 2], [12, 80, 4]],
    [[0, 85, 4], [4, 84, 2], [6, 82, 2], [8, 80, 4], [12, 77, 4]],
    [[0, 76, 2], [2, 77, 2], [4, 79, 2], [6, 80, 2], [8, 82, 2], [10, 83, 2], [12, 84, 4]],
  ];

  // Intensity layers: each fades in over `span` starting at `from` (0–1).
  // The game's stack heights settle at 33% (4), 67% (5) and 100% (6+).
  const LAYERS = [
    { id: 'bright', label: 'The FM lead and piano brighten (more modulation: a harder, brassier edge)', from: 0, span: 1 },
    { id: 'hats', label: '16th-note hi-hats', from: 0.05, span: 0.25 },
    { id: 'drive', label: 'The bass pushes: extra 16th-note slaps and a second kick', from: 0.4, span: 0.25 },
    { id: 'counter', label: 'A counter-melody on FM bells, an octave up', from: 0.4, span: 0.25 },
    { id: 'boss', label: 'THE BOSS FIGHT: from 80% (stack 6+) the zone gives way, after a WARNING bar, to the boss theme; back under 60% (stack 4)', from: 0.72, span: 0.25 },
  ];

  const bus = ctx.createGain();
  bus.gain.value = 0.25; // (level-matched: the zone about -30 dB, the boss a little louder, as other tracks get at full intensity)
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -18;
  comp.ratio.value = 3;
  bus.connect(comp);
  comp.connect(out);
  // Stereo, like a Genesis mix: the bass, kick and snare in the middle; the piano and the
  // counter-melody apart, hats right, the siren sweeping
  // (+3 dB in front: a panner halves a mono sound's power, so one in the middle is exactly as
  // loud as the sound was plugged straight in, and one to a side keeps the same loudness)
  const panner = (v, dest = bus) => {
    const lift = ctx.createGain();
    lift.gain.value = Math.SQRT2;
    const p = ctx.createStereoPanner();
    p.pan.value = v;
    lift.connect(p);
    p.connect(dest);
    lift.pan = p.pan;
    return lift;
  };

  // The drums' crunch: rounded to 64 levels, like the console's 8-bit drum samples
  const crunch = ctx.createWaveShaper();
  const steps = new Float32Array(2048);
  for (let i = 0; i < steps.length; i++) {
    const x = (i / (steps.length - 1)) * 2 - 1;
    steps[i] = Math.round(x * 32) / 32;
  }
  crunch.curve = steps;
  const drumBus = ctx.createGain();
  drumBus.connect(crunch);
  crunch.connect(bus);

  // A short echo for the leads
  const delay = ctx.createDelay(1);
  delay.delayTime.value = STEP * 3;
  const feedback = ctx.createGain();
  feedback.gain.value = 0.25;
  const delayTone = ctx.createBiquadFilter();
  delayTone.type = 'lowpass';
  delayTone.frequency.value = 3200;
  const wet = ctx.createGain();
  wet.gain.value = 0.35;
  delay.connect(delayTone);
  delayTone.connect(feedback);
  feedback.connect(delay);
  delayTone.connect(wet);

  // Instrument channels (output.js): the mixer's strips. The drums go through the crunch.
  const ch = createChannels(ctx, bus);
  const CH = {
    kick: ch('kick', 'Kick', null, drumBus), snare: ch('snare', 'Snare', null, drumBus), toms: ch('toms', 'Toms', null, drumBus),
    hats: ch('hats', 'Hi-hats', null, drumBus), crash: ch('crash', 'Crash', null, drumBus),
    bass: ch('bass', 'FM slap bass (the zone)'), ostinato: ch('ostinato', 'FM bass ostinato (the boss)'),
    piano: ch('piano', 'FM electric piano'), lead: ch('lead', 'FM lead (the zone)', delay),
    counter: ch('counter', 'FM bell counter-melody', delay), brass: ch('brass', 'FM brass (the boss)', delay),
    siren: ch('siren', 'Warning siren'), echo: ch('echo', 'Echo (the delay return)'),
  };
  wet.connect(panner(0.35, CH.echo.in));

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

  // Two-operator FM: a sine modulator (at `ratio` times the note) swinging a sine carrier's
  // pitch by `index` times the note; the index moves from `index` to `indexEnd` over `sweep`
  // seconds (a falling index is a pluck or slap, a rising one a brass swell)
  function fm(t, m, dur, { ratio = 1, index = 1, indexEnd = index, sweep = 0.1, level, attack = 0.005, release = 0.05, decay = null, detune = 0, vibrato = 0, dest }) {
    const f = freq(m);
    const car = ctx.createOscillator();
    car.frequency.value = f;
    car.detune.value = detune;
    const mod = ctx.createOscillator();
    mod.frequency.value = f * ratio;
    const depth = ctx.createGain();
    depth.gain.setValueAtTime(Math.max(0.001, index * f), t);
    depth.gain.exponentialRampToValueAtTime(Math.max(0.001, indexEnd * f), t + sweep);
    mod.connect(depth); depth.connect(car.frequency);
    if (vibrato) {
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 5.8;
      const vd = ctx.createGain();
      vd.gain.setValueAtTime(0, t);
      vd.gain.linearRampToValueAtTime(f * vibrato, t + Math.min(0.3, dur));
      lfo.connect(vd); vd.connect(car.frequency);
      lfo.start(t); lfo.stop(t + dur + release + 0.02);
    }
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(level, t + attack);
    if (decay) g.gain.exponentialRampToValueAtTime(0.0005, t + decay);
    else {
      g.gain.setValueAtTime(level, t + Math.max(attack, dur - release));
      g.gain.linearRampToValueAtTime(0, t + dur);
    }
    car.connect(g); g.connect(dest);
    car.start(t); car.stop(t + dur + 0.02);
    mod.start(t); mod.stop(t + dur + 0.02);
    return g;
  }

  // Drums
  function kick(t, level = 1) {
    const osc = ctx.createOscillator();
    osc.frequency.setValueAtTime(170, t);
    osc.frequency.exponentialRampToValueAtTime(48, t + 0.07);
    osc.connect(envGain(t, 0.9 * level, 0.2, CH.kick.in));
    osc.start(t); osc.stop(t + 0.22);
    noiseHit(t, 0.14 * level, 0.015, 'highpass', 2000, undefined, CH.kick.in);
  }
  function snare(t, level = 1) {
    noiseHit(t, 0.3 * level, 0.14, 'bandpass', 2400, 0.7, CH.snare.in);
    const body = ctx.createOscillator();
    body.type = 'triangle';
    body.frequency.setValueAtTime(240, t);
    body.frequency.exponentialRampToValueAtTime(170, t + 0.05);
    body.connect(envGain(t, 0.28 * level, 0.07, CH.snare.in));
    body.start(t); body.stop(t + 0.08);
  }
  function tom(t, hz, pan = 0) {
    const osc = ctx.createOscillator();
    osc.frequency.setValueAtTime(hz, t);
    osc.frequency.exponentialRampToValueAtTime(hz * 0.6, t + 0.14);
    osc.connect(envGain(t, 0.45, 0.16, panner(pan, CH.toms.in)));
    osc.start(t); osc.stop(t + 0.17);
  }
  const hat = (t, level = 1, open = false) => noiseHit(t, (open ? 0.05 : 0.035) * level, open ? 0.12 : 0.03, 'highpass', 8000, undefined, panner(0.35, CH.hats.in));
  function crash(t) {
    for (const side of [-0.5, 0.5]) noiseHit(t, 0.08, 1.2, 'highpass', 4500, undefined, panner(side, CH.crash.in));
  }

  // Instruments
  const slap = (t, m, dur, level = 1, chan = CH.bass) => fm(t, m, dur, { ratio: 1, index: 3.2, indexEnd: 0.4, sweep: 0.09, level: 0.17 * level, decay: Math.max(0.08, dur), dest: chan.in });
  function piano(t, chord, bright) {
    chord.forEach((m, k) => {
      const dest = panner((k - 1) * 0.35, CH.piano.in);
      fm(t, m, 0.4, { ratio: 1, index: 1.1 + bright, indexEnd: 0.15, sweep: 0.3, level: 0.028, decay: 0.38, dest });
      fm(t, m, 0.1, { ratio: 14, index: 0.8, indexEnd: 0.1, sweep: 0.05, level: 0.008, decay: 0.08, dest }); // (the tine)
    });
  }
  function lead(t, m, dur, bright) {
    const opts = { ratio: 1, index: 0.6, indexEnd: 1.6 + 1.4 * bright, sweep: 0.06, level: 0.05, attack: 0.012, release: 0.04, vibrato: 0.006 };
    const g = fm(t, m, dur, { ...opts, dest: CH.lead.in });
    g.connect(CH.lead.send);
    fm(t, m, dur, { ...opts, detune: 8, level: 0.02, dest: panner(0.3, CH.lead.in) }); // (a second voice, slightly apart)
  }
  function counter(t, m, level) {
    const g = fm(t, m, 0.5, { ratio: 3.5, index: 2, indexEnd: 0.2, sweep: 0.3, level: 0.03 * level, decay: 0.45, dest: panner(-0.4, CH.counter.in) });
    g.connect(CH.counter.send);
  }
  function brass(t, m, dur) {
    const g = fm(t, m, dur, { ratio: 1, index: 1.5, indexEnd: 3.5, sweep: 0.05, level: 0.055, attack: 0.008, release: 0.03, vibrato: 0.004, dest: CH.brass.in });
    g.connect(CH.brass.send);
    fm(t, m - 12, dur, { ratio: 2, index: 1, indexEnd: 2.5, sweep: 0.05, level: 0.025, attack: 0.008, release: 0.03, dest: panner(-0.25, CH.brass.in) });
  }
  // WARNING: a siren wailing up and down across the bar, sweeping side to side
  function siren(t) {
    const dur = STEP * 16;
    const car = ctx.createOscillator();
    car.type = 'square';
    for (let k = 0; k < 4; k++) {
      car.frequency.setValueAtTime(freq(84), t + k * dur / 4);
      car.frequency.linearRampToValueAtTime(freq(91), t + (k + 0.5) * dur / 4);
      car.frequency.linearRampToValueAtTime(freq(84), t + (k + 1) * dur / 4);
    }
    const lp = filter('lowpass', 2600);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.05, t + 0.05);
    g.gain.setValueAtTime(0.05, t + dur - 0.1);
    g.gain.linearRampToValueAtTime(0, t + dur);
    const sweep = panner(-0.5, CH.siren.in);
    sweep.pan.setValueAtTime(-0.5, t);
    sweep.pan.linearRampToValueAtTime(0.5, t + dur / 2);
    sweep.pan.linearRampToValueAtTime(-0.5, t + dur);
    car.connect(lp); lp.connect(g); g.connect(sweep);
    car.start(t); car.stop(t + dur);
  }

  // The boss state (the switch happens only on a two-bar mark)
  let boss = false;
  let warning = 0; // 16ths of the WARNING bar left
  let bossStep = 0; // 16ths into the boss loop

  return {
    step: STEP,
    loopSteps: 32 * 16,
    layers: LAYERS,
    channels: ch.list,
    record: ch.record,
    // solo: a layer id to hear that layer alone at full strength (BOSS: the boss theme itself);
    // muted: layer ids to leave out (BOSS muted: no boss fight)
    schedule(step, t, intensity = 0, solo = null, muted = null) {
      const L = {};
      for (const { id, from, span } of LAYERS) {
        L[id] = solo ? Number(id === solo) : Math.max(0, Math.min(1, (intensity - from) / span));
      }
      if (muted && !solo) for (const id of muted) L[id] = 0;
      const base = !solo || solo === 'boss';
      const bar = Math.floor(step / 16) % 32;
      const s = step % 16;

      // The switch, on a two-bar mark: into the boss fight (a WARNING bar first), or back out
      if (s === 0 && bar % 2 === 0) {
        const bossOff = muted && !solo && [...muted].includes('boss');
        const danger = solo === 'boss' || (!solo && !bossOff && intensity >= (boss ? BOSS_OUT : BOSS_IN));
        if (danger && !boss) { boss = true; warning = 16; bossStep = 0; }
        else if (!danger && boss) { boss = false; warning = 0; if (base) crash(t); }
      }

      if (boss && warning > 0) {
        // WARNING: the siren, a tom roll down, and the bass hammering the boss's root
        const w = 16 - warning;
        warning--;
        if (base) {
          if (w === 0) { siren(t); crash(t); }
          if (w % 2 === 0) slap(t, 41 + (w % 4 === 2 ? 12 : 0), STEP * 1.8, 1.1, CH.ostinato);
          if (w >= 8) tom(t, 260 - (w - 8) * 22, 0.5 - (w - 8) / 7);
          if (w % 4 === 0) kick(t);
        }
        return;
      }

      if (boss) {
        const bb = Math.floor(bossStep / 16) % 8;
        const bs = bossStep % 16;
        bossStep++;
        const root = BOSS.roots[bb];
        if (base) {
          if (bs % 4 === 0 || bs === 14) kick(t);
          if (bs === 4 || bs === 12) snare(t);
          if (bb === 7 && bs >= 12) snare(t, 0.5 + (bs - 12) * 0.15);
          if (bs % 2 === 0) hat(t, 1, bs % 8 === 6);
          if (bs === 0 && bb % 4 === 0) crash(t);
          slap(t, root + OSTINATO[bs], STEP * 0.9, 1, CH.ostinato);
          if (bs === 0 || bs === 6 || bs === 10) piano(t, BOSS.chords[bb], 1);
          for (const [start, m, len] of BOSS_TUNE[bb]) if (start === bs) brass(t, m, len * STEP);
        }
        if (L.hats > 0 && bs % 2 === 1) hat(t, 0.8 * L.hats);
        if (L.counter > 0 && bs % 4 === 2) counter(t, BOSS.chords[bb][(bs / 4) % 3 | 0] + 24, L.counter);
        return;
      }

      // ZONE
      const section = Math.floor(bar / 8); // 0 zone, 1 zone again (fuller), 2 bridge, 3 zone to the loop
      const i = bar % 8;
      const { chords, roots } = section === 2 ? ZONE_B : ZONE_A;
      const root = roots[i];
      const tune = section === 2 ? TUNE_B : TUNE_A;
      if (base) {
        // Drums: kick on 1 and the "and" of 3 (plus beat 3 every other bar), snare on 2 and 4
        if (s === 0 || s === 10 || (s === 8 && bar % 2 === 1)) kick(t);
        if (s === 4 || s === 12) snare(t);
        if (i === 7 && s >= 12) snare(t, 0.4 + (s - 12) * 0.2);
        if (s % 2 === 0) hat(t, 1, s === 6 || s === 14);
        if (s === 0 && i === 0) crash(t);
        // The slap bass groove and the piano on the offbeats
        for (const [at, up] of GROOVE) if (at === s) slap(t, root + up, STEP * (at === 6 || at === 14 ? 1.5 : 2.5));
        if (s % 4 === 2) piano(t, chords[i], L.bright);
        // The lead (an octave up in the last section, over the counter-melody's line)
        for (const [start, m, len] of tune[i]) if (start === s) lead(t, m + (section === 3 ? 12 : 0), len * STEP * 0.95, L.bright);
      }
      if (L.hats > 0 && s % 2 === 1) hat(t, 0.8 * L.hats);
      if (L.drive > 0 && (s === 5 || s === 13)) slap(t, root + 12, STEP * 0.8, 0.7 * L.drive);
      if (L.drive > 0 && s === 7) kick(t, 0.7 * L.drive);
      if (L.counter > 0) for (const [start, m] of tune[i]) if (start === s && start % 4 === 0) counter(t, m + 12, L.counter);
    },
  };
}
