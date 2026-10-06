// "GENERATED" — music that writes itself: a new song from a seed (SETTINGS: the SONG OF THE DAY,
// the same for everyone that day, or RANDOM, a new one each time it starts), in the style of the
// season (seasons.js). The seed picks the key, the tempo, a chord progression from the season's
// stock, a melody motif and its variations, the bass's walk, the arpeggio's shape and the drums'
// pattern; the season picks the instruments and the harmony:
//   HALLOWEEN  harmonic minor, diminished turns and a tritone or two; a church organ, a music box,
//              a theremin wailing the melody, a plucked bass, a timpani and a toll of bells
//   HARVEST    (November) dorian, warm and folky: a reed organ, plucked strings, a soft flute
//   WINTER     (December, the holidays) major, bright: celesta, sleigh bells, a choir pad
//   otherwise  a plain minor synth song in the game's own style
// Synthesized live with Web Audio, like the other tracks, and layered the same way: it builds as
// the stack climbs (schedule()'s intensity, 0 to 1).
function createGenerated(ctx, out, opts = {}) {
  const season = opts.season || 'default';
  // (a seeded random: the same seed, the same song)
  let s = (opts.seed >>> 0) || 1;
  const rnd = () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const pick = (a) => a[Math.floor(rnd() * a.length)];
  const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));

  const STYLE = {
    halloween: { bpm: [86, 104], scale: [0, 2, 3, 5, 7, 8, 11], key: [57, 50, 52, 55], progs: [[0, 5, 3, 4], [0, 3, 6, 4], [0, 5, 1, 4], [0, 6, 5, 4], [0, 3, 0, 4]], dim: true, swing: 0 },
    harvest: { bpm: [96, 112], scale: [0, 2, 3, 5, 7, 9, 10], key: [50, 52, 55, 57], progs: [[0, 3, 6, 0], [0, 6, 3, 4], [0, 3, 0, 6], [0, 4, 3, 0]], swing: 0.12 },
    winter: { bpm: [104, 124], scale: [0, 2, 4, 5, 7, 9, 11], key: [53, 55, 60, 62], progs: [[0, 5, 3, 4], [0, 3, 4, 0], [0, 4, 5, 3], [0, 1, 4, 0]], swing: 0 },
    default: { bpm: [100, 120], scale: [0, 2, 3, 5, 7, 8, 10], key: [57, 52, 50, 55], progs: [[0, 5, 2, 6], [0, 6, 5, 4], [0, 3, 5, 4]], swing: 0 },
  }[season] || null;
  const st = STYLE || { bpm: [100, 120], scale: [0, 2, 3, 5, 7, 8, 10], key: [57], progs: [[0, 5, 2, 6]], swing: 0 };
  const BPM = ri(st.bpm[0], st.bpm[1]);
  const STEP = 60 / BPM / 4;
  const KEY = pick(st.key);
  const SC = st.scale;
  const freq = (m) => 440 * Math.pow(2, (m - 69) / 12);
  // A note of the scale by degree (any whole number: wraps into the octaves)
  const deg = (d, base = KEY) => base + SC[((d % 7) + 7) % 7] + 12 * Math.floor(d / 7);
  // The chord on a degree: its triad (in HALLOWEEN, the fifth degree's a major chord, as harmonic
  // minor gives, and the seventh a diminished one)
  const chordOf = (d) => [deg(d), deg(d + 2), deg(d + 4)];
  const progA = pick(st.progs);
  let progB = pick(st.progs);
  if (progB === progA) progB = progA.map((d, i) => (i === 2 ? (d + 2) % 7 : d)); // (B: its own turn)
  // 32 bars: A A B A, each 8 bars of the progression's four chords, two bars each
  const chordAt = (bar) => { const sec = Math.floor(bar / 8) % 4; const p = sec === 2 ? progB : progA; return p[Math.floor((bar % 8) / 2)]; };

  // The motif: two bars of 16ths, notes as scale degrees above the chord's root (or rests),
  // varied each time through: moved up, its end changed, or answered an octave down
  const RHYTHMS = [
    [0, 3, 6, 8, 12, 14], [0, 4, 6, 10, 12], [0, 2, 4, 8, 11, 14], [0, 6, 8, 10, 12], [0, 3, 4, 8, 10, 12, 14],
  ];
  const r1 = pick(RHYTHMS);
  const r2 = pick(RHYTHMS);
  const contour = () => { const a = []; let d = ri(0, 4); for (let i = 0; i < 8; i++) { d += pick([-2, -1, -1, 1, 1, 2, 0, 3]); d = Math.max(-1, Math.min(7, d)); a.push(d); } return a; };
  const MOTIF = [contour(), contour()];
  const motifNote = (bar, s16) => {
    const half = bar % 2;
    const r = half ? r2 : r1;
    const idx = r.indexOf(s16);
    if (idx < 0) return null;
    const sec = Math.floor(bar / 8) % 4;
    const turn = Math.floor((bar % 8) / 2); // (0-3: the phrase's place)
    let d = MOTIF[half][idx % 8];
    if (turn === 1) d += 1;
    if (turn === 3 && idx === r.length - 1) d = 0; // (home at the phrase's end)
    if (sec === 2) d += 2; // (B: higher)
    return chordAt(bar) + d;
  };
  const ARP = pick([[0, 1, 2, 1], [0, 2, 1, 2], [0, 1, 2, 3], [2, 1, 0, 1]]);
  const KICKS = pick([[0, 8], [0, 6, 8], [0, 10], [0, 3, 8, 11]]);
  const BASS = pick([[0, 8], [0, 6, 8, 14], [0, 4, 8, 12], [0, 10]]);

  const LAYERS = [
    { id: 'bass', label: 'The bass, on the chords\' roots', from: 0, span: 0.15 },
    { id: 'arp', label: 'The arpeggio (a music box, plucked strings or a celesta)', from: 0.08, span: 0.25 },
    { id: 'drums', label: 'Drums', from: 0.25, span: 0.25 },
    { id: 'lead', label: 'The melody (a theremin, a flute or bells)', from: 0.42, span: 0.25 },
    { id: 'shimmer', label: 'Bells and hats, on top', from: 0.7, span: 0.25 },
  ];

  const bus = ctx.createGain();
  bus.gain.value = 0.2;
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -18;
  comp.ratio.value = 3.5;
  bus.connect(comp);
  comp.connect(out);
  // (a little room: a short echo the bells, the lead and the arpeggio share)
  const echo = ctx.createDelay(1);
  echo.delayTime.value = STEP * 3;
  const fb = ctx.createGain();
  fb.gain.value = 0.32;
  const wet = ctx.createGain();
  wet.gain.value = 0.35;
  echo.connect(fb); fb.connect(echo); echo.connect(wet); wet.connect(bus);
  const ch = createChannels(ctx, bus);
  const CH = {
    pad: ch('pad', season === 'halloween' ? 'Church organ' : season === 'winter' ? 'Choir pad' : 'Pad'),
    bass: ch('bass', 'Bass'), arp: ch('arp', 'Arpeggio', echo), lead: ch('lead', 'Melody', echo),
    kick: ch('kick', 'Kick / timpani'), snare: ch('snare', 'Snare'), hats: ch('hats', 'Hats / sleigh bells'), bell: ch('bell', 'Bells', echo),
  };
  const noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const nd = noise.getChannelData(0);
  for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
  const env = (t, peak, a, d, dest) => {
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0005, t + a + d);
    g.connect(dest);
    return g;
  };
  const osc = (type, f, t, dur, dest, detune = 0) => {
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(f, t);
    o.detune.value = detune;
    o.connect(dest);
    o.start(t); o.stop(t + dur + 0.05);
    return o;
  };
  const lp = (f, dest, q = 0.7) => { const b = ctx.createBiquadFilter(); b.type = 'lowpass'; b.frequency.value = f; b.Q.value = q; b.connect(dest); return b; };

  // INSTRUMENTS (by season)
  function pad(chord, t, dur, level) { // (the organ's drawbars, the choir's soft saws, the pad)
    for (const m of chord) {
      const n = m - 12;
      if (season === 'halloween') {
        const g = env(t, 0.05 * level, 0.08, dur, lp(2600, CH.pad.in));
        [1, 2, 3, 4].forEach((h, i) => osc('sine', freq(n) * h, t, dur, g, (i - 1.5) * 3));
      } else {
        const g = env(t, 0.045 * level, 0.6, dur, lp(season === 'winter' ? 2200 : 1500, CH.pad.in));
        osc('sawtooth', freq(n), t, dur, g, -7); osc('sawtooth', freq(n), t, dur, g, 7);
      }
    }
  }
  function bass(m, t, level) {
    if (season === 'halloween' || season === 'harvest') { // (plucked: a quick, round thump)
      const g = env(t, 0.32 * level, 0.005, 0.32, lp(700, CH.bass.in));
      osc('triangle', freq(m), t, 0.4, g);
    } else {
      const g = env(t, 0.26 * level, 0.01, STEP * 6, lp(900, CH.bass.in, 2));
      osc('sawtooth', freq(m), t, STEP * 6, g);
    }
  }
  function arp(m, t, level) {
    if (season === 'halloween' || season === 'winter') { // (a music box / celesta: a bell-like tine)
      const g = env(t, 0.09 * level, 0.002, season === 'winter' ? 0.9 : 0.6, CH.arp.in);
      osc('sine', freq(m + 12), t, 1, g); osc('sine', freq(m + 12) * 4.02, t, 0.3, env(t, 0.02 * level, 0.002, 0.15, CH.arp.in));
    } else { // (plucked strings)
      const g = env(t, 0.1 * level, 0.003, 0.35, lp(2400, CH.arp.in));
      osc('triangle', freq(m), t, 0.4, g); osc('square', freq(m), t, 0.12, env(t, 0.015 * level, 0.002, 0.08, CH.arp.in));
    }
  }
  function lead(m, t, dur, level) {
    if (season === 'halloween') { // (the theremin: a sine gliding into the note, wavering)
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.setValueAtTime(freq(m) * 0.94, t);
      o.frequency.exponentialRampToValueAtTime(freq(m), t + 0.09);
      const vib = ctx.createOscillator();
      vib.frequency.value = 6;
      const vg = ctx.createGain();
      vg.gain.value = freq(m) * 0.012;
      vib.connect(vg); vg.connect(o.frequency);
      const g = env(t, 0.11 * level, 0.06, dur, CH.lead.in);
      o.connect(g);
      o.start(t); o.stop(t + dur + 0.1); vib.start(t); vib.stop(t + dur + 0.1);
    } else if (season === 'winter') { // (bells: struck, ringing)
      const g = env(t, 0.08 * level, 0.002, 1.2, CH.lead.in);
      osc('sine', freq(m + 12), t, 1.3, g); osc('sine', freq(m + 12) * 2.76, t, 0.6, env(t, 0.03 * level, 0.002, 0.4, CH.lead.in));
    } else { // (a soft flute / a square lead)
      const g = env(t, 0.07 * level, 0.04, dur, lp(3000, CH.lead.in));
      osc(season === 'harvest' ? 'triangle' : 'square', freq(m), t, dur, g);
    }
  }
  function kick(t, level) {
    if (season === 'halloween') { // (a timpani: a tuned, booming drum)
      const o = ctx.createOscillator();
      o.frequency.setValueAtTime(freq(KEY - 24) * 1.3, t);
      o.frequency.exponentialRampToValueAtTime(freq(KEY - 24), t + 0.08);
      o.connect(env(t, 0.5 * level, 0.004, 0.6, CH.kick.in));
      o.start(t); o.stop(t + 0.7);
    } else {
      const o = ctx.createOscillator();
      o.frequency.setValueAtTime(150, t);
      o.frequency.exponentialRampToValueAtTime(46, t + 0.07);
      o.connect(env(t, 0.7 * level, 0.002, 0.22, CH.kick.in));
      o.start(t); o.stop(t + 0.25);
    }
  }
  function hit(t, level, f, q, decay, dest) {
    const src = ctx.createBufferSource();
    src.buffer = noise;
    const b = ctx.createBiquadFilter();
    b.type = 'bandpass'; b.frequency.value = f; b.Q.value = q;
    src.connect(b); b.connect(env(t, level, 0.002, decay, dest));
    src.start(t, Math.random() * 0.5); src.stop(t + decay + 0.02);
  }
  function snare(t, level) { hit(t, 0.22 * level, season === 'halloween' ? 900 : 1800, 0.8, season === 'halloween' ? 0.3 : 0.15, CH.snare.in); }
  function hats(t, level) {
    if (season === 'winter') { for (let i = 0; i < 3; i++) hit(t + i * 0.012, 0.05 * level, 7000 + i * 900, 6, 0.08, CH.hats.in); } // (sleigh bells: a jingle of little hits)
    else hit(t, 0.05 * level, 8000, 1.2, 0.04, CH.hats.in);
  }
  function bell(m, t, level) { // (a tolling bell: a struck tone and its inharmonic ring)
    const g = env(t, 0.08 * level, 0.002, 2.4, CH.bell.in);
    osc('sine', freq(m), t, 2.5, g);
    osc('sine', freq(m) * 2.4, t, 1.6, env(t, 0.03 * level, 0.002, 1.4, CH.bell.in));
    osc('sine', freq(m) * 3.9, t, 0.9, env(t, 0.015 * level, 0.002, 0.8, CH.bell.in));
  }

  const swing = (s16) => (s16 % 2 ? st.swing * STEP : 0);
  return {
    step: STEP,
    loopSteps: 32 * 16,
    layers: LAYERS,
    defaultMuted: [],
    channels: ch.list,
    record: ch.record,
    // (what it is, for the player's note: its key, its tempo, its seed)
    describe: () => ({ season, bpm: BPM, key: KEY }),
    schedule(step, t, intensity = 0, solo = null) {
      const L = {};
      for (const { id, from, span } of LAYERS) L[id] = solo ? Number(id === solo) : Math.max(0, Math.min(1, (intensity - from) / span));
      const bar = Math.floor(step / 16) % 32;
      const s16 = step % 16;
      const tt = t + swing(s16);
      const root = chordAt(bar);
      const chord = chordOf(root);
      if (!solo && s16 === 0 && bar % 2 === 0) pad(chord, t, STEP * 32 * 0.98, 1);
      if (L.bass && BASS.includes(s16)) bass(deg(root) - 24 + (s16 === 8 && bar % 4 === 3 ? 7 : 0), tt, L.bass);
      if (L.arp && s16 % 2 === 0) arp(chord[ARP[(s16 / 2) % 4] % 3] + (ARP[(s16 / 2) % 4] === 3 ? 12 : 0), tt, L.arp);
      if (L.drums) {
        if (KICKS.includes(s16)) kick(tt, L.drums);
        if (s16 === 4 || s16 === 12) snare(tt, L.drums * (season === 'halloween' && s16 === 4 ? 0 : 1));
      }
      if (L.lead) {
        const m = motifNote(bar, s16);
        if (m !== null) lead(deg(m) + 12, tt, STEP * 3, L.lead);
      }
      if (L.shimmer) {
        if (s16 % 2 === 0) hats(tt, L.shimmer);
        if (s16 === 0 && bar % 4 === 0) bell(deg(root) + (season === 'halloween' ? 0 : 12), t, L.shimmer);
      }
    },
  };
}
