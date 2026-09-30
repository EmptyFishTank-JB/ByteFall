// SOUND OUTPUT and INSTRUMENT CHANNELS: shared by the game (music.js, sfx.js) and the dev
// mixer (dev-tools/mixer.html).
//
// Channels: each track routes every instrument through its own gain (createChannels), between
// the instrument's notes and the track's bus; echo sends are taken from a second gain that
// follows it, so muting an instrument mutes its echo too. At 1 (the default) they change nothing.
//
// Outputs: what the music and sound effects pass through last, picked in SETTINGS → SOUND OUTPUT.
// HEADPHONES is the mix as written. SPEAKERS and PHONE are made for small speakers, which can't
// play the low end: they cut what can't be heard (freeing the headroom for the rest), put the
// bass back as harmonics the speaker can play (the ear fills in the missing low note), and even
// out the level. PHONE also folds to mono (a phone plays mostly from one speaker) and lifts
// the 1–4kHz range phones are loudest in, and takes the edge off the hiss above it.
//
// Mix tables (MUSIC_MIXES, js/music/mixes.js, exported from the mixer): per track and output,
// each channel's level in dB at the four stack heights the game settles on (intensity 0, 33,
// 67 and 100%), eased between as the intensity moves.

function createChannels(ctx, bus) {
  const list = [];
  let rec = null;
  // id: short name (the mixer's strip); label: what it is; sendTo: an echo / delay input, or
  // several by name ({ left, right }: a ping-pong echo); to: where it goes (the bus, or a shared
  // chain on the way, like a sidechain duck)
  function channel(id, label, sendTo = null, to = bus) {
    const node = ctx.createGain();
    node.connect(to);
    const sends = {};
    const targets = !sendTo ? {} : sendTo instanceof AudioNode ? { main: sendTo } : sendTo;
    for (const [key, target] of Object.entries(targets)) {
      sends[key] = ctx.createGain();
      sends[key].connect(target);
    }
    list.push({ id, label, node, sends: Object.values(sends) });
    // (read while notes are scheduled: the mixer's timeline records which channels play when)
    return {
      get in() { if (rec) rec(id); return node; },
      get send() { if (rec) rec(id); return sends.main; },
      sendTo(key) { if (rec) rec(id); return sends[key]; },
      mark() { if (rec) rec(id); }, // (for notes routed through a shared chain on the way in)
    };
  }
  channel.list = list;
  channel.record = (fn) => { rec = fn; };
  return channel;
}

const SOUND_OUTPUTS = [
  { id: 'phone', label: 'PHONE', note: 'Made for a phone\'s own speaker: mono, the bass played as harmonics the speaker can reach, the hiss softened.' },
  { id: 'headphones', label: 'HEADPHONES', note: 'The full mix as written: for headphones, earbuds and good speakers.' },
  { id: 'speakers', label: 'SPEAKERS', note: 'For laptop and tablet speakers: the deep bass played as harmonics, the level evened out.' },
];
// (a page can't tell whether earbuds are in: phones start on PHONE, everything else on HEADPHONES)
function defaultSoundOutput() {
  try {
    const coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    return coarse && Math.max(screen.width, screen.height) < 1100 ? 'phone' : 'headphones';
  } catch (e) {
    return 'headphones';
  }
}
function savedSoundOutput() {
  try {
    const v = localStorage.getItem('bytefall-sound-output');
    if (SOUND_OUTPUTS.some((o) => o.id === v)) return v;
  } catch (e) {}
  return defaultSoundOutput();
}

// The chain for an output: { input, output, set(id) }. Rebuilt on a switch (a quick dip, no click).
function createSoundOutput(ctx, id = 'headphones') {
  const input = ctx.createGain();
  const output = ctx.createGain();
  let nodes = [];
  let current = null;

  const biquad = (type, f, q = 0.707, gain = 0) => {
    const n = ctx.createBiquadFilter();
    n.type = type;
    n.frequency.value = f;
    n.Q.value = q;
    n.gain.value = gain;
    nodes.push(n);
    return n;
  };
  const gain = (v) => {
    const n = ctx.createGain();
    n.gain.value = v;
    nodes.push(n);
    return n;
  };
  const chain = (...list) => {
    for (let i = 0; i < list.length - 1; i++) list[i].connect(list[i + 1]);
    return list[list.length - 1];
  };
  const shaper = () => {
    const n = ctx.createWaveShaper();
    const curve = new Float32Array(1024);
    for (let i = 0; i < curve.length; i++) {
      const x = (i / (curve.length - 1)) * 2 - 1;
      curve[i] = Math.tanh(3 * x);
    }
    n.curve = curve;
    n.oversample = '2x';
    nodes.push(n);
    return n;
  };
  const compressor = (threshold, ratio, knee, attack, release) => {
    const n = ctx.createDynamicsCompressor();
    n.threshold.value = threshold;
    n.ratio.value = ratio;
    n.knee.value = knee;
    n.attack.value = attack;
    n.release.value = release;
    nodes.push(n);
    return n;
  };

  // A small speaker's chain: the lows cut below `cut`, and the band under it copied, driven into
  // harmonics, and mixed back in above it (`harm`: how much)
  function smallSpeaker({ cut, harm, mono, presence, air, comp, makeup }) {
    const sum = gain(1);
    chain(input, biquad('highpass', cut), biquad('highpass', cut), sum);
    chain(input, biquad('lowpass', cut * 1.2), biquad('lowpass', cut * 1.2), gain(4), shaper(),
      biquad('highpass', cut), biquad('lowpass', cut * 8), gain(harm), sum);
    let tail = sum;
    if (mono) {
      const fold = gain(1);
      fold.channelCount = 1;
      fold.channelCountMode = 'explicit';
      fold.channelInterpretation = 'speakers';
      tail = chain(tail, fold);
    }
    if (presence) tail = chain(tail, biquad('peaking', 2500, 0.8, presence));
    if (air) tail = chain(tail, biquad('highshelf', 7000, 0.707, air));
    tail = chain(tail, compressor(comp[0], comp[1], 10, 0.005, 0.18), gain(makeup),
      compressor(-2, 20, 0, 0.001, 0.08)); // (and a limiter: never past full scale)
    tail.connect(output);
  }

  function set(next) {
    if (next === current) return;
    current = next;
    input.disconnect();
    for (const n of nodes) n.disconnect();
    nodes = [];
    // (the compressor adds its own make-up gain as it squeezes, so `makeup` is mostly a trim;
    // levels set against HEADPHONES: SPEAKERS ~3 dB and PHONE ~7 dB louder above 250Hz, what
    // those speakers actually play)
    if (next === 'phone') smallSpeaker({ cut: 170, harm: 0.4, mono: true, presence: 3, air: -5, comp: [-20, 2.5], makeup: 0.5 });
    else if (next === 'speakers') smallSpeaker({ cut: 70, harm: 0.07, mono: false, presence: 1.5, air: -1.5, comp: [-14, 1.8], makeup: 0.8 });
    else input.connect(output);
  }
  set(id);
  return { input, output, set, get id() { return current; } };
}

// The level (as a gain) a mix table gives a channel at an intensity: its four points in dB,
// straight lines between
const MIX_POINTS = [0, 1 / 3, 2 / 3, 1];
function mixGain(points, intensity) {
  if (!points) return 1;
  const x = Math.max(0, Math.min(1, intensity)) * 3;
  const i = Math.min(2, Math.floor(x));
  const db = points[i] + (points[i + 1] - points[i]) * (x - i);
  return db <= -60 ? 0 : Math.pow(10, db / 20);
}
// Sets an engine's channels from a table ({ channel id: [dB at 0, 33, 67, 100%] }) at an intensity
function applyMix(engine, table, intensity, t) {
  if (!engine || !engine.channels) return;
  for (const ch of engine.channels) {
    const g = mixGain(table && table[ch.id], intensity);
    if (ch.applied === g) continue;
    ch.applied = g;
    setChannelGain(ch, g, t);
  }
}
// One channel's level (a gain; 1 = as written), and its sends with it
function setChannelGain(ch, g, t, smooth = 0.05) {
  ch.node.gain.setTargetAtTime(g, t, smooth);
  for (const send of ch.sends) send.gain.setTargetAtTime(g, t, smooth);
}
const trackMix = (trackId, outputId) => {
  const mixes = typeof MUSIC_MIXES !== 'undefined' ? MUSIC_MIXES : {};
  return (mixes[trackId] && mixes[trackId][outputId]) || null;
};
