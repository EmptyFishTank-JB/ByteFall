// Track 16, "GENERATED": music that writes itself. A seed (SETTINGS / the MUSIC PLAYER: the SONG OF
// THE DAY, the same for everyone that day, or RANDOM, a new one each time) picks a style from the
// season's (seasons.js) and then everything else: the key and mode, the tempo, the song's form,
// its chord progressions, the hook and how it's answered, the bass line, the arpeggio, the drum
// groove and the instruments, and its title.
//   all year   SYNTHWAVE, CHIPTUNE, DRUM & BASS, LO-FI, TECHNO, DREAMWAVE
//   HALLOWEEN  HAUNTED WALTZ, MONSTER SURF, HORROR SYNTH, GRAVEYARD MARCH, MUSIC BOX
//   HARVEST    (November) HARVEST JIG (6/8), CAMPFIRE, HOEDOWN, AUTUMN LO-FI
//   WINTER     (December, the holidays) SLEIGH RIDE, SNOW WALTZ, CAROL, COZY LO-FI
// It's variety inside rules that keep it music: chords from a hand-picked stock of progressions,
// voiced close together; a two-bar hook that lands on the chord's own notes on the beat and moves
// by step between, said, answered, said again and brought home to the key; a form (INTRO, A, B, a
// bridge or a breakdown) where the parts come and go; and each style's own groove and instruments.
// Synthesized live with Web Audio like the other tracks, and layered the same way (it builds as the
// stack climbs). composeGenerated() is the song as data (no sound), for its title and details.

const GEN_SCALES = {
  minor: { name: 'MINOR', s: [0, 2, 3, 5, 7, 8, 10] },
  dorian: { name: 'DORIAN', s: [0, 2, 3, 5, 7, 9, 10] },
  phrygian: { name: 'PHRYGIAN', s: [0, 1, 3, 5, 7, 8, 10] },
  major: { name: 'MAJOR', s: [0, 2, 4, 5, 7, 9, 11] },
  mixolydian: { name: 'MIXOLYDIAN', s: [0, 2, 4, 5, 7, 9, 10] },
  lydian: { name: 'LYDIAN', s: [0, 2, 4, 6, 7, 9, 11] },
};
// The progressions: four chords each, as scale degrees (0: the key's own chord). The well-worn ones,
// on purpose: they're well worn because they work.
const GEN_PROGS = {
  minor: [[0, 5, 2, 6], [0, 6, 5, 6], [0, 5, 3, 4], [0, 3, 5, 4], [0, 6, 5, 4], [0, 3, 0, 4], [0, 5, 6, 4], [0, 2, 5, 6], [5, 6, 0, 0], [0, 3, 6, 2]],
  dorian: [[0, 3, 0, 3], [0, 3, 6, 0], [0, 6, 3, 0], [0, 4, 3, 0], [0, 3, 5, 6]],
  phrygian: [[0, 1, 0, 6], [0, 1, 6, 0], [0, 5, 1, 0], [0, 6, 5, 1]],
  major: [[0, 4, 5, 3], [0, 5, 3, 4], [5, 3, 0, 4], [0, 3, 4, 0], [0, 1, 4, 0], [0, 5, 1, 4], [3, 4, 0, 5], [0, 2, 3, 4], [0, 3, 1, 4], [0, 4, 3, 4]],
  mixolydian: [[0, 6, 3, 0], [0, 6, 0, 3], [0, 3, 6, 0], [0, 4, 6, 3]],
  lydian: [[0, 1, 0, 1], [0, 1, 5, 4], [0, 1, 3, 4]],
};
const GEN_BRIDGES = { minor: [[3, 4, 5, 4], [5, 3, 0, 4], [3, 0, 5, 4], [5, 6, 3, 4], [3, 3, 4, 4]], major: [[3, 4, 5, 4], [5, 3, 1, 4], [3, 0, 1, 4], [5, 2, 3, 4], [3, 3, 4, 4]] };
const GEN_FORMS = [
  ['intro', 'A', 'A', 'B', 'A'],
  ['intro', 'A', 'B', 'A', 'B'],
  ['intro', 'A', 'B', 'C', 'B'],
  ['A', 'B', 'A', 'C', 'B'],
  ['intro', 'A', 'B', 'break', 'B'],
];
// The drum grooves: the 16ths of a bar each part plays on (k kick, s snare, g ghost snare, c clap,
// h hats, o open hat, t tambourine / shaker). 3/4 and 6/8 bars are 12 16ths.
const GEN_GROOVES = {
  backbeat: { k: [[0, 8], [0, 8, 10], [0, 6, 8], [0, 8, 14]], s: [4, 12], h: 8 },
  four: { k: [[0, 4, 8, 12]], c: [4, 12], h: 16, o: [2, 6, 10, 14] },
  dnb: { k: [[0, 10], [0, 10, 11]], s: [4, 12], g: [7, 15], h: 8 },
  boombap: { k: [[0, 7, 10], [0, 10, 11], [0, 3, 10]], s: [4, 12], h: 8 },
  chip: { k: [[0, 8], [0, 8, 10], [0, 6, 8]], s: [4, 12], h: 8 },
  surf: { k: [[0, 6, 8], [0, 8, 10]], s: [4, 12], h: 8, t: [4, 12] },
  march: { k: [[0, 8]], s: [4, 12], g: [10, 11, 14, 15], h: 0 },
  halftime: { k: [[0, 10], [0, 6, 10]], s: [8], h: 8 },
  gallop: { k: [[0, 8], [0, 8, 10]], s: [4, 12], h: 16 },
  boomchick: { k: [[0, 8]], s: [4, 12], t: [2, 6, 10, 14], h: 0 },
  brushes: { k: [[0, 8]], s: [4, 12], g: [2, 6, 10, 14], h: 0 },
  heartbeat: { k: [[0, 3]], h: 0 },
  waltz: { k: [[0]], s: [4, 8], h: 4 }, // (3/4)
  lullaby: { k: [[0, 3]], h: 0 }, // (3/4: a slow heartbeat)
  jig: { k: [[0, 6]], g: [4, 10], t: [0, 2, 4, 6, 8, 10], h: 0 }, // (6/8)
  carol: { k: [[0]], h: 0, sparse: true }, // (a timpani at the top of each part, no more)
};
const GEN_STYLES = {
  synthwave: { name: 'SYNTHWAVE', bpm: [92, 112], scales: ['minor', 'dorian'], sevenths: 0.2, hold: [2, 1], drums: ['backbeat'], kit: 'gated', bass: ['octave', 'pulse8'], bassInst: ['saw'], arp: ['up', 'updown', 'broken'], arpRate: [1, 2], arpInst: ['pluck'], arpOct: 1, pad: ['saw', 'strings'], lead: ['saw', 'square'], dens: [0.4, 0.55], lift: 0.3, harmony: 0.4, fill: ['toms', 'snare'] },
  chiptune: { name: 'CHIPTUNE', bpm: [128, 150], scales: ['minor', 'major', 'dorian'], hold: [1, 2], drums: ['chip'], kit: 'chip', bass: ['chip8', 'octave'], bassInst: ['chip'], arp: ['chip'], arpRate: [1], arpInst: ['chip'], arpOct: 1, pad: ['none'], lead: ['pulse', 'pulse12'], leadOct: 1, dens: [0.45, 0.6], lift: 0.5, harmony: 0.3, fill: ['snare'] },
  dnb: { name: 'DRUM & BASS', bpm: [168, 176], scales: ['minor', 'dorian', 'phrygian'], sevenths: 0.4, hold: [2], drums: ['dnb'], kit: 'break', bass: ['reese'], bassInst: ['reese'], arp: ['pedal', 'up'], arpRate: [2], arpInst: ['bell'], arpOct: 1, pad: ['strings'], lead: ['saw', 'whistle'], dens: [0.2, 0.28], fill: ['snare'] },
  lofi: { name: 'LO-FI', bpm: [70, 86], swing: [0.16, 0.26], scales: ['dorian', 'major', 'minor'], sevenths: 1, hold: [1, 2], drums: ['boombap'], kit: 'lofi', bass: ['walk', 'root'], bassInst: ['upright', 'sub'], arp: ['none'], pad: ['rhodes'], lead: ['fm', 'whistle', 'flute'], dens: [0.25, 0.35], crackle: true, fill: ['none'] },
  techno: { name: 'TECHNO', bpm: [122, 130], scales: ['phrygian', 'minor'], sevenths: 0.2, hold: [2], drums: ['four'], kit: '909', bass: ['acid'], bassInst: ['acid'], arp: ['offstab'], arpInst: ['stab'], pad: ['saw'], lead: ['square', 'fm'], dens: [0.2, 0.3], fill: ['snare'] },
  dreamwave: { name: 'DREAMWAVE', bpm: [76, 90], scales: ['major', 'lydian', 'dorian'], sevenths: 0.8, hold: [2], drums: ['halftime'], kit: 'gated', bass: ['root'], bassInst: ['sub'], arp: ['updown'], arpRate: [2], arpInst: ['bell'], arpOct: 1, pad: ['strings', 'choir'], lead: ['fm', 'whistle'], dens: [0.22, 0.32], lift: 0.2, fill: ['toms'] },

  'haunted-waltz': { name: 'HAUNTED WALTZ', meter: 3, bpm: [132, 156], scales: ['minor'], harm: true, sevenths: 0.15, hold: [2, 1], drums: ['waltz'], kit: 'orchestral', bass: ['oompah'], bassInst: ['pluck'], arp: ['updown'], arpRate: [2], arpInst: ['musicbox'], arpOct: 1, pad: ['organ', 'choir'], lead: ['theremin', 'fiddle'], dens: [0.35, 0.5], bells: true, fill: ['timp'] },
  'monster-surf': { name: 'MONSTER SURF', bpm: [148, 166], scales: ['minor'], harm: true, hold: [2], drums: ['surf'], kit: 'garage', bass: ['walk'], bassInst: ['pluck'], arp: ['broken', 'up'], arpRate: [2], arpInst: ['twang'], pad: ['organ'], lead: ['twang', 'square'], dens: [0.4, 0.55], fill: ['toms'] },
  'horror-synth': { name: 'HORROR SYNTH', bpm: [100, 118], scales: ['minor', 'phrygian'], hold: [2], drums: ['halftime', 'four'], kit: 'gated', bass: ['pulse8'], bassInst: ['saw'], arp: ['pedal', 'up'], arpRate: [1], arpInst: ['pluck'], arpOct: 1, pad: ['strings', 'choir'], lead: ['saw', 'fm'], dens: [0.2, 0.3], bells: true, fill: ['toms'] },
  'graveyard-march': { name: 'GRAVEYARD MARCH', bpm: [84, 98], scales: ['minor'], harm: true, hold: [2, 1], drums: ['march'], kit: 'orchestral', bass: ['oompah'], bassInst: ['tuba'], arp: ['up', 'broken'], arpRate: [2], arpInst: ['musicbox'], arpOct: 1, pad: ['choir', 'organ'], lead: ['theremin', 'bells'], dens: [0.35, 0.5], bells: true, fill: ['snare'] },
  'music-box': { name: 'MUSIC BOX', meter: 3, bpm: [96, 112], scales: ['minor'], harm: true, hold: [2], drums: ['lullaby'], kit: 'orchestral', bass: ['root'], bassInst: ['sub'], arp: ['updown'], arpRate: [2], arpInst: ['musicbox'], arpOct: 1, pad: ['choir'], lead: ['musicbox', 'whistle'], dens: [0.35, 0.45], bells: true, wobble: true, fill: ['none'] },

  'harvest-jig': { name: 'HARVEST JIG', meter: 6, bpm: [100, 114], scales: ['dorian', 'mixolydian', 'major'], hold: [2, 1], drums: ['jig'], kit: 'folk', bass: ['jig'], bassInst: ['pluck'], arp: ['strum'], arpInst: ['guitar'], pad: ['reed', 'none'], lead: ['fiddle', 'flute'], dens: [0.78, 0.9], fill: ['none'] },
  campfire: { name: 'CAMPFIRE', bpm: [80, 94], swing: [0.06, 0.14], scales: ['major', 'mixolydian'], sevenths: 0.3, hold: [2], drums: ['brushes'], kit: 'folk', bass: ['root'], bassInst: ['upright'], arp: ['broken'], arpRate: [2], arpInst: ['guitar'], pad: ['reed', 'none'], lead: ['flute', 'whistle'], dens: [0.3, 0.42], fill: ['none'] },
  hoedown: { name: 'HOEDOWN', bpm: [118, 134], scales: ['major', 'mixolydian'], hold: [1, 2], drums: ['boomchick'], kit: 'folk', bass: ['boomchick'], bassInst: ['upright'], arp: ['roll'], arpRate: [1], arpInst: ['banjo'], pad: ['none'], lead: ['fiddle'], dens: [0.5, 0.65], lift: 0.3, fill: ['snare'] },
  'autumn-lofi': { name: 'AUTUMN LO-FI', bpm: [72, 84], swing: [0.16, 0.24], scales: ['dorian', 'minor'], sevenths: 1, hold: [1, 2], drums: ['boombap'], kit: 'lofi', bass: ['walk', 'root'], bassInst: ['upright'], arp: ['none'], pad: ['rhodes'], lead: ['flute'], dens: [0.25, 0.35], crackle: true, fill: ['none'] },

  'sleigh-ride': { name: 'SLEIGH RIDE', bpm: [124, 138], scales: ['major'], sevenths: 0.3, hold: [1, 2], drums: ['gallop'], kit: 'sleigh', bass: ['walk'], bassInst: ['upright'], arp: ['up'], arpRate: [2], arpInst: ['celesta'], arpOct: 1, pad: ['strings'], lead: ['bells', 'flute', 'brass'], dens: [0.4, 0.55], lift: 0.5, harmony: 0.4, bells: true, fill: ['snare'] },
  'snow-waltz': { name: 'SNOW WALTZ', meter: 3, bpm: [132, 152], scales: ['major', 'lydian'], sevenths: 0.3, hold: [2], drums: ['waltz'], kit: 'soft', bass: ['oompah'], bassInst: ['pluck'], arp: ['updown'], arpRate: [2], arpInst: ['celesta', 'harp'], arpOct: 1, pad: ['strings'], lead: ['flute', 'fiddle'], dens: [0.35, 0.5], lift: 0.3, bells: true, fill: ['none'] },
  carol: { name: 'CAROL', bpm: [70, 84], scales: ['major'], sevenths: 0.1, hold: [1, 2], drums: ['carol'], kit: 'orchestral', bass: ['root'], bassInst: ['tuba', 'sub'], arp: ['up'], arpRate: [2], arpInst: ['harp'], pad: ['choir', 'organ'], lead: ['bells', 'brass'], dens: [0.35, 0.45], harmony: 0.7, bells: true, fill: ['none'] },
  'cozy-lofi': { name: 'COZY LO-FI', bpm: [70, 84], swing: [0.16, 0.24], scales: ['major', 'dorian'], sevenths: 1, hold: [1, 2], drums: ['boombap'], kit: 'lofi', bass: ['walk', 'root'], bassInst: ['upright', 'sub'], arp: ['up'], arpRate: [4], arpInst: ['celesta'], arpOct: 1, pad: ['rhodes'], lead: ['bells', 'whistle'], dens: [0.25, 0.35], crackle: true, sleighHats: true, fill: ['none'] },
};
const GEN_POOLS = {
  default: ['synthwave', 'chiptune', 'dnb', 'lofi', 'techno', 'dreamwave'],
  halloween: ['haunted-waltz', 'monster-surf', 'horror-synth', 'graveyard-march', 'music-box'],
  harvest: ['harvest-jig', 'campfire', 'hoedown', 'autumn-lofi'],
  winter: ['sleigh-ride', 'snow-waltz', 'carol', 'cozy-lofi'],
};
const GEN_WORDS = {
  default: [['NULL', 'STATIC', 'NEON', 'CHROME', 'SILENT', 'BROKEN', 'MIDNIGHT', 'BINARY', 'ELECTRIC', 'LOST', 'QUANTUM', 'CRIMSON', 'ZERO', 'ANALOG', 'LUCID', 'RADIANT', 'FADING', 'HIDDEN', 'COLD', 'VELVET'],
    ['PROTOCOL', 'SIGNAL', 'DRIVE', 'CACHE', 'LOOP', 'HORIZON', 'KERNEL', 'DAEMON', 'CIRCUIT', 'SECTOR', 'TRACE', 'RUNTIME', 'SKYLINE', 'PULSE', 'MEMORY', 'GRID', 'PACKET', 'CIPHER', 'FIREWALL', 'CITY']],
  halloween: [['HOLLOW', 'CRYPT', 'GRAVE', 'PHANTOM', 'WICKED', 'BONE', 'WITCHING', 'HAUNTED', 'CURSED', 'MIDNIGHT', 'RAVEN', 'SPECTRAL', 'GHOUL', 'SHADOW', 'BLOOD', 'PUMPKIN', 'CANDLELIT', 'FORSAKEN'],
    ['WALTZ', 'MASQUERADE', 'PROCESSION', 'HOUR', 'LULLABY', 'MANOR', 'CARNIVAL', 'SEANCE', 'MOON', 'CHAPEL', 'PARADE', 'RITUAL', 'CELLAR', 'LANTERN', 'WALK', 'BALLROOM', 'ORGAN', 'WOODS']],
  harvest: [['AMBER', 'RUSSET', 'GOLDEN', 'HARVEST', 'COPPER', 'CIDER', 'ORCHARD', 'MAPLE', 'HEARTH', 'BRAMBLE', 'WILLOW', 'OAKEN', 'HAZEL', 'BARLEY'],
    ['MOON', 'JIG', 'REEL', 'FIELDS', 'LANE', 'FIRE', 'ROAD', 'MILL', 'BARN', 'DANCE', 'RIDGE', 'GROVE', 'TABLE', 'HOMECOMING']],
  winter: [['SILVER', 'FROSTED', 'SNOWBOUND', 'MIDWINTER', 'STARLIT', 'GLASS', 'NORTHERN', 'CANDLE', 'EVERGREEN', 'HOLLY', 'WHITE', 'CRYSTAL', 'SLEIGHBELL', 'COCOA'],
    ['NIGHT', 'MORNING', 'WALTZ', 'LIGHTS', 'CAROL', 'EVE', 'PINES', 'RIDE', 'HEARTH', 'SKY', 'SNOWFALL', 'LANTERN', 'WREATH', 'STAR']],
};
const GEN_NOTE_NAMES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];

// The song as data: the same seed, the same song
function composeGenerated(opts = {}) {
  const season = GEN_POOLS[opts.season] ? opts.season : 'default';
  let seed = (opts.seed >>> 0) || 1;
  const rnd = () => { seed = (seed + 0x6D2B79F5) >>> 0; let t = seed; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const pick = (a) => a[Math.floor(rnd() * a.length)];
  const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
  const rf = (a, b) => a + rnd() * (b - a);
  const chance = (p) => rnd() < p;

  const styleId = opts.style && GEN_STYLES[opts.style] ? opts.style : pick(GEN_POOLS[season]);
  const S = GEN_STYLES[styleId];
  const meter = S.meter || 4;
  const BS = meter === 4 ? 16 : 12; // (16ths in a bar)
  const BEAT = meter === 6 ? 6 : 4; // (16ths in a beat: in 6/8, a dotted quarter)
  const bpm = ri(S.bpm[0], S.bpm[1]);
  const scaleId = pick(S.scales);
  const SC = GEN_SCALES[scaleId].s;
  const minorish = SC[2] === 3;
  const KEY = pick([50, 52, 53, 55, 57]); // (D E F G A, the chords' octave)
  // (only chords with a true fifth: no diminished chord in this mode, whichever stock it's from)
  const trueFifth = (d) => (SC[(d + 4) % 7] + (d + 4 >= 7 ? 12 : 0)) - SC[d % 7] === 7;
  const usable = (list) => list.filter((p) => p.every(trueFifth));
  const own = usable(GEN_PROGS[scaleId] || []);
  const wide = usable([...(GEN_PROGS[scaleId] || []), ...GEN_PROGS[minorish ? 'minor' : 'major']]);
  const progA = pick(own.length ? own : wide);
  let progB = pick(wide);
  for (let i = 0; i < 6 && progB.join() === progA.join(); i++) progB = pick(wide);
  const bridges = usable(GEN_BRIDGES[minorish ? 'minor' : 'major']);
  const progC = bridges.length ? pick(bridges) : progB;
  const holdA = pick(S.hold);
  const holdB = pick(S.hold);
  const sevenths = chance(S.sevenths || 0);
  const form = pick(GEN_FORMS);
  const lift = chance(S.lift || 0) ? 2 : 0; // (the last part a whole step up)
  const swing = S.swing ? rf(S.swing[0], S.swing[1]) : 0;

  // The bars: each its part, its chord, and whether that chord starts there
  const bars = [];
  form.forEach((role, sec) => {
    const len = role === 'intro' || role === 'break' ? 4 : 8;
    const prog = role === 'B' ? progB : role === 'C' ? progC : progA;
    const hold = len === 4 ? 1 : role === 'B' ? holdB : holdA;
    for (let i = 0; i < len; i++) {
      const chord = prog[Math.floor(i / hold) % prog.length];
      bars.push({
        role, sec, i, len, chord, hold,
        start: i % hold === 0, first: i === 0, last: i === len - 1,
        // (the fifth degree's chord made major, as harmonic minor has it: always in the spooky
        // styles, and at the end of a part in any minor one, to lead home)
        raise: chord === 4 && (scaleId === 'minor' || scaleId === 'dorian') && (S.harm || i >= len - hold),
        lift: lift && sec === form.length - 1 && role !== 'intro' ? lift : 0,
      });
    }
  });
  const N = bars.length;
  // (a scale degree, any whole number, as a note: wrapped into the octaves, in a bar's own key)
  const dm = (d, b) => {
    const k = ((d % 7) + 7) % 7;
    return KEY + b.lift + SC[k] + 12 * Math.floor(d / 7) + (b.raise && k === 6 ? 1 : 0);
  };
  const chordTones = (b) => [0, 2, 4, ...(sevenths ? [6] : [])].map((x) => b.chord + x);
  for (const b of bars) {
    b.notes = chordTones(b).map((d) => dm(d, b));
    b.root = b.notes[0];
  }

  // THE HOOK. A rhythm a beat at a time (from patterns that sit well), the second bar often the
  // first's again; then moves mostly by step, rising then falling, a leap answered by a step back
  const BEATS = BEAT === 6
    ? [[[0], 3], [[0, 2, 4], 3], [[0, 4], 2], [[0, 3], 1], [[], 1]]
    : [[[0], 3], [[0, 2], 4], [[], 1.2], [[0, 3], 1.5], [[2], 1], [[0, 2, 3], 1], [[0, 1, 2, 3], bpm < 120 ? 0.8 : 0]];
  const beatPick = (dens) => {
    // (the busier the style, the fewer rests and the more the busy patterns weigh: a LO-FI line
    // breathes, a jig runs)
    if (rnd() < Math.max(0.05, Math.min(0.55, 0.75 - dens * 1.1))) return [];
    const busy = (n) => (n === 1 ? 1.3 - dens : n === 2 ? dens * dens * 4 : Math.max(0, dens - 0.35) * 6);
    const opts = BEATS.filter(([p]) => p.length);
    const w = opts.map(([p, x]) => x * busy(p.length));
    let r = rnd() * w.reduce((a, c) => a + c, 0);
    for (let i = 0; i < w.length; i++) if ((r -= w[i]) <= 0) return opts[i][0];
    return opts[0][0];
  };
  const beatsInBar = BS / BEAT;
  function makeCell(dens) {
    for (let tries = 0; tries < 20; tries++) {
      const bar1 = [];
      for (let bt = 0; bt < beatsInBar; bt++) bar1.push(beatPick(dens));
      bar1[0] = bar1[0].length && bar1[0][0] === 0 ? bar1[0] : [0]; // (the hook starts on the one)
      const bar2 = chance(0.5) ? bar1.slice(0, -1).concat([beatPick(dens * 0.6)]) : Array.from({ length: beatsInBar }, () => beatPick(dens));
      bar2[beatsInBar - 1] = chance(0.6) ? [] : [0]; // (a breath at the end)
      const on = [];
      [bar1, bar2].forEach((bar, bi) => bar.forEach((p, bt) => p.forEach((x) => on.push(bi * BS + bt * BEAT + x))));
      if (on.length < 4 || on.length > BS * 1.2) continue;
      let up = 0;
      const notes = on.map((s, i) => {
        const bias = i < on.length / 2 ? 0.65 : 0.35; // (an arch: up, then down)
        const size = up ? 1 : pick([1, 1, 1, 1, 2, 2, 0, 3, 4]);
        const dir = up ? -Math.sign(up) : (rnd() < bias ? 1 : -1);
        up = size >= 3 ? dir : 0;
        return { s, mv: size * dir, strong: s % BEAT === 0 };
      });
      return { notes, start: pick([0, 2, 4, 2]) };
    }
    return { notes: [{ s: 0, mv: 0, strong: true }, { s: BEAT, mv: 1, strong: true }, { s: BS, mv: -1, strong: true }, { s: BS + BEAT, mv: -1, strong: true }], start: 2 };
  }
  const dens = rf(S.dens[0], S.dens[1]);
  const cells = { A: makeCell(dens), B: makeCell(Math.min(0.85, dens * 1.25)), C: makeCell(dens * 0.6) };
  const nearest = (cands, x) => cands.reduce((a, c) => (Math.abs(c - x) < Math.abs(a - x) || (Math.abs(c - x) === Math.abs(a - x) && c < a) ? c : a));
  const toneNear = (b, x, only) => {
    const tones = (only || [0, 2, 4]).map((o) => b.chord + o);
    const cands = [];
    for (const d of tones) for (let o = -2; o <= 3; o++) cands.push(d + 7 * o);
    return nearest(cands, x);
  };
  // A phrase of two bars from bar b0: 0 the hook, 1 its answer (its end turned), 3 the cadence (cut
  // short, home to the key's chord's root and held)
  function realize(cell, b0, centre, variant) {
    const lo = centre - 4;
    const hi = centre + 5;
    const list = variant === 3 ? cell.notes.filter((n) => n.s <= BS + (BEAT === 6 ? 0 : BEAT)) : cell.notes;
    const out = [];
    let d = toneNear(bars[b0], centre + cell.start - 2);
    list.forEach((n, i) => {
      const b = bars[(b0 + Math.floor(n.s / BS)) % N];
      if (i > 0) {
        let mv = n.mv;
        if (variant === 1 && i >= list.length - 3) mv = -mv;
        d += mv;
        if (d > hi) d -= Math.abs(mv) * 2 || 2;
        if (d < lo) d += Math.abs(mv) * 2 || 2;
        if (n.strong) d = toneNear(b, d);
      }
      if (i === list.length - 1 && variant === 3) d = toneNear(b, d, [0]);
      else if (i === list.length - 1 && variant === 1) d = toneNear(b, d, [2, 4]);
      out.push({ s: n.s, d, b0 });
    });
    out.forEach((n, i) => {
      const next = out[i + 1] ? out[i + 1].s : BS * 2;
      const cap = i === out.length - 1 ? (variant === 3 ? BS + BEAT : BEAT * 2) : BEAT * 2;
      n.dur = Math.max(1, Math.min(next - n.s, cap));
    });
    return out;
  }
  for (const b of bars) { b.lead = {}; b.harm = {}; }
  let at = 0;
  form.forEach((role) => {
    const len = role === 'intro' || role === 'break' ? 4 : 8;
    if (len === 8) {
      const cell = cells[role] || cells.A;
      const centre = 7 + (role === 'B' ? 2 : role === 'C' ? -1 : 0);
      [0, 1, 0, 3].forEach((variant, p) => {
        for (const n of realize(cell, at + p * 2, centre, variant)) {
          const b = bars[(at + p * 2 + Math.floor(n.s / BS)) % N];
          b.lead[n.s % BS] = { m: dm(n.d, b), dur: n.dur };
          b.harm[n.s % BS] = { m: dm(n.d - 2, b), dur: n.dur };
        }
      });
    }
    at += len;
  });

  // The bass and arpeggio shapes, the groove, the fill, the acid line's 16 steps
  const grooveId = pick(S.drums);
  const G = GEN_GROOVES[grooveId];
  const acid = Array.from({ length: 16 }, (_, i) => ({ on: i === 0 || chance(0.62), oct: chance(0.22), acc: chance(0.3), slide: chance(0.2), five: chance(0.1) }));
  const words = GEN_WORDS[Object.keys(GEN_POOLS).find((k) => GEN_POOLS[k].includes(styleId)) || season];
  let w1 = pick(words[0]);
  let w2 = pick(words[1]);
  if (w1 === w2) w2 = words[1][(words[1].indexOf(w2) + 1) % words[1].length];
  const title = chance(0.2) ? `THE ${w1} ${w2}` : `${w1} ${w2}`;
  const P = {
    season, styleId, style: S, title, meter, BS, BEAT, bpm, step: 60 / bpm / BEAT, KEY, SC, scaleId, minorish, swing, sevenths, form, bars, lift,
    groove: { ...G, k: pick(G.k) }, fill: pick(S.fill || ['snare']),
    bass: pick(S.bass), bassInst: pick(S.bassInst), arp: pick(S.arp), arpRate: pick(S.arpRate || [2]), arpInst: pick(S.arpInst || ['pluck']), arpOct: S.arpOct || 0,
    pad: pick(S.pad), lead: pick(S.lead), leadOct: S.leadOct || 0, harmony: chance(S.harmony || 0), acid,
    comp: pick(meter === 4 ? [[0, 6], [0, 10], [0, 7], [0, 6, 10]] : [[0], [0, 6]]),
  };
  P.describe = () => ({
    title, style: S.name, season, bpm, meter: meter === 4 ? '4/4' : meter === 3 ? '3/4' : '6/8',
    key: `${GEN_NOTE_NAMES[KEY % 12]} ${GEN_SCALES[scaleId].name}`, form: form.join(' '), seconds: Math.round(N * BS * P.step),
  });
  return P;
}

function createGenerated(ctx, out, opts = {}) {
  const P = composeGenerated(opts);
  const { BS, BEAT, bars, groove: G } = P;
  const STEP = P.step;
  const N = bars.length;
  const halloween = P.season === 'halloween';
  const freq = (m) => 440 * Math.pow(2, (m - 69) / 12);
  const fold = (m, lo) => { while (m < lo) m += 12; while (m >= lo + 12) m -= 12; return m; };

  const LAYERS = [
    { id: 'bass', label: 'The bass', from: 0, span: 0.15 },
    { id: 'arp', label: 'The arpeggio / the strummed or picked chords', from: 0.08, span: 0.25 },
    { id: 'drums', label: 'Kick, snare and fills', from: 0.25, span: 0.25 },
    { id: 'lead', label: 'The melody (and its harmony in the B parts)', from: 0.42, span: 0.25 },
    { id: 'shimmer', label: 'Hats, tambourine, bells, the crackle', from: 0.7, span: 0.25 },
  ];
  // (the parts: what plays in each, on top of how far the layers have built)
  const MASK = {
    intro: { bass: 0, arp: 1, drums: 0, lead: 0, shimmer: 0.6 },
    A: { bass: 1, arp: 1, drums: 1, lead: 1, shimmer: 0.8 },
    B: { bass: 1, arp: 1, drums: 1, lead: 1, shimmer: 1 },
    C: { bass: 0.8, arp: 1, drums: 0.7, lead: 0.85, shimmer: 0.5 },
    break: { bass: 0, arp: 1, drums: 0, lead: 0, shimmer: 0.4 },
  };

  const bus = ctx.createGain();
  bus.gain.value = 0.2;
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -18;
  comp.ratio.value = 3.5;
  bus.connect(comp);
  comp.connect(out);
  // (a room: an echo the melody, the arpeggio and the bells share; longer and wetter for the surf
  // guitar's spring, the music box and the dreamier styles)
  const echo = ctx.createDelay(1.5);
  echo.delayTime.value = STEP * (P.meter === 4 ? 3 : 2);
  const echoTone = ctx.createBiquadFilter();
  echoTone.type = 'lowpass';
  echoTone.frequency.value = 2800;
  const fb = ctx.createGain();
  fb.gain.value = ['dreamwave', 'monster-surf', 'music-box', 'carol', 'dnb'].includes(P.styleId) ? 0.42 : 0.3;
  const wet = ctx.createGain();
  wet.gain.value = 0.3;
  echo.connect(echoTone); echoTone.connect(fb); fb.connect(echo); echoTone.connect(wet); wet.connect(bus);
  const ch = createChannels(ctx, bus);
  const CH = {
    pad: ch('pad', 'Pad / organ / choir / keys'), bass: ch('bass', 'Bass'), arp: ch('arp', 'Arpeggio', echo), lead: ch('lead', 'Melody', echo),
    kick: ch('kick', 'Kick / timpani / bodhran'), snare: ch('snare', 'Snare'), clap: ch('clap', 'Clap'), toms: ch('toms', 'Toms / fills'),
    hats: ch('hats', 'Hats / shaker / sleigh bells'), tambourine: ch('tambourine', 'Tambourine'), bell: ch('bell', 'Bells', echo),
  };
  const both = (c) => [c.in, c.send];
  const noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const nd = noise.getChannelData(0);
  for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
  const pulseWave = (duty) => {
    const n = 40;
    const re = new Float32Array(n);
    const im = new Float32Array(n);
    for (let k = 1; k < n; k++) re[k] = (2 / (k * Math.PI)) * Math.sin(k * Math.PI * duty);
    return ctx.createPeriodicWave(re, im);
  };
  const PULSE = { 25: pulseWave(0.25), 12: pulseWave(0.125) };

  // (a struck note: up in a, dying away over d)
  const env = (t, peak, a, d, ...dests) => {
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0005, t + a + d);
    for (const x of dests.flat()) g.connect(x);
    return g;
  };
  // (a held note: up in a, settling, held to t + dur, released over r)
  const held = (t, peak, a, dur, r, ...dests) => {
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + a);
    g.gain.setTargetAtTime(peak * 0.75, t + a, Math.max(0.05, dur * 0.4));
    g.gain.setTargetAtTime(0.0001, t + Math.max(dur, a + 0.01), r / 4);
    for (const x of dests.flat()) g.connect(x);
    return g;
  };
  const osc = (type, f, t, end, dest, detune = 0) => {
    const o = ctx.createOscillator();
    if (typeof type === 'string') o.type = type;
    else o.setPeriodicWave(type);
    o.frequency.setValueAtTime(f, t);
    if (detune) o.detune.value = detune;
    o.connect(dest);
    o.start(t); o.stop(end);
    return o;
  };
  // (dest: a node, or several: a channel's dry and echo)
  const filt = (type, f, q, dest) => { const b = ctx.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q; for (const x of [dest].flat()) b.connect(x); return b; };
  const gain = (v, dest) => { const g = ctx.createGain(); g.gain.value = v; for (const x of [dest].flat()) g.connect(x); return g; };
  const vibrato = (o, t, end, rate, cents, delay) => {
    const l = ctx.createOscillator();
    l.frequency.value = rate;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.setValueAtTime(0, t + delay);
    g.gain.linearRampToValueAtTime(cents, t + delay + 0.25);
    l.connect(g); g.connect(o.detune);
    l.start(t); l.stop(end);
  };
  const wobble = () => (P.style.wobble ? (Math.random() - 0.5) * 22 : 0); // (the old music box's warp)

  // PADS: the chord, held (or, for LO-FI, a Rhodes comping)
  function pad(notes, t, dur, lvl) {
    const kind = P.pad;
    const end = t + dur + 1.5;
    for (const m of notes) {
      const f = freq(m);
      if (kind === 'organ') {
        const g = held(t, 0.028 * lvl, 0.04, dur, 0.3, filt('lowpass', 3000, 0.7, CH.pad.in));
        [[1, 1], [2, 0.5], [3, 0.28], [4, 0.2]].forEach(([h, a], i) => osc('sine', f * h, t, end, gain(a, g), (i - 1.5) * 2));
      } else if (kind === 'choir') {
        const g = held(t, 0.05 * lvl, 0.5, dur, 0.9, CH.pad.in);
        const f1 = filt('bandpass', 700, 1.4, g);
        const f2 = filt('bandpass', 1150, 2.5, g);
        for (const det of [-9, 9]) { const o = osc('sawtooth', f, t, end, f1, det); o.connect(f2); vibrato(o, t, end, 5, 9, 0.3); }
      } else if (kind === 'strings') {
        const g = held(t, 0.02 * lvl, 0.45, dur, 0.9, filt('lowpass', 2100, 0.7, CH.pad.in));
        for (const det of [-10, 0, 10]) osc('sawtooth', f, t, end, g, det);
      } else if (kind === 'reed') { // (an accordion: two reeds a little apart)
        const g = held(t, 0.014 * lvl, 0.05, dur, 0.15, filt('lowpass', 2400, 0.7, CH.pad.in));
        osc('square', f, t, end, g, -7); osc('sawtooth', f, t, end, g, 7);
      } else if (kind === 'saw') {
        const g = held(t, 0.024 * lvl, 0.35, dur, 0.7, filt('lowpass', 1300, 1, CH.pad.in));
        osc('sawtooth', f, t, end, g, -7); osc('sawtooth', f, t, end, g, 7);
      }
    }
  }
  function keys(notes, t, dur, lvl) { // (an electric piano: a bell-ish tine over a soft body)
    notes.forEach((m, i) => {
      const f = freq(m);
      const tt = t + i * 0.008;
      const body = env(tt, 0.045 * lvl, 0.006, Math.min(2.2, dur + 0.6), filt('lowpass', 2200, 0.7, CH.pad.in));
      osc('sine', f, tt, tt + dur + 0.9, body); osc('triangle', f * 2, tt, tt + dur + 0.9, gain(0.12, body));
      osc('sine', f * 7, tt, tt + 0.2, env(tt, 0.006 * lvl, 0.002, 0.12, CH.pad.in));
    });
  }

  // BASS
  let lastBassF = 0;
  function bass(m, t, dur, lvl, o = {}) {
    const f = freq(m);
    const end = t + dur + 0.3;
    const kind = P.bassInst;
    if (kind === 'saw') {
      const lp = filt('lowpass', 1500, 3, held(t, 0.2 * lvl, 0.005, dur, 0.06, CH.bass.in));
      lp.frequency.setValueAtTime(1500, t); lp.frequency.exponentialRampToValueAtTime(260, t + 0.14);
      osc('sawtooth', f, t, end, lp);
    } else if (kind === 'reese') {
      const g = held(t, 0.12 * lvl, 0.03, dur, 0.12, CH.bass.in);
      const lp = filt('lowpass', 520, 1.5, g);
      osc('sawtooth', f, t, end, lp, -16); osc('sawtooth', f, t, end, lp, 16);
      osc('sine', f, t, end, held(t, 0.16 * lvl, 0.03, dur, 0.12, CH.bass.in));
    } else if (kind === 'pluck') {
      const g = env(t, 0.3 * lvl, 0.005, Math.min(0.5, dur + 0.2), filt('lowpass', 900, 0.7, CH.bass.in));
      osc('triangle', f, t, end, g); osc('sine', f, t, end, gain(0.6, g));
    } else if (kind === 'sub') {
      const g = held(t, 0.28 * lvl, 0.01, dur, 0.08, CH.bass.in);
      osc('sine', f, t, end, g); osc('triangle', f, t, end, gain(0.25, g));
    } else if (kind === 'acid') {
      const g = held(t, (o.acc ? 0.15 : 0.1) * lvl, 0.003, dur, 0.03, CH.bass.in);
      const lp = filt('lowpass', 1200, 13, g);
      lp.frequency.setValueAtTime(o.acc ? 2800 : 1300, t); lp.frequency.exponentialRampToValueAtTime(240, t + STEP * 1.6);
      const x = osc('sawtooth', o.slide && lastBassF ? lastBassF : f, t, end, lp);
      if (o.slide && lastBassF) x.frequency.exponentialRampToValueAtTime(f, t + STEP * 0.6);
    } else if (kind === 'chip') {
      osc('triangle', f, t, end, held(t, 0.3 * lvl, 0.002, dur * 0.9, 0.02, CH.bass.in));
    } else if (kind === 'upright') {
      const g = env(t, 0.32 * lvl, 0.006, Math.min(0.7, dur + 0.25), filt('lowpass', 700, 0.7, CH.bass.in));
      const x = osc('sine', f * 1.03, t, end, g);
      x.frequency.exponentialRampToValueAtTime(f, t + 0.03);
      osc('triangle', f, t, end, gain(0.4, g));
    } else if (kind === 'tuba') {
      const g = held(t, 0.18 * lvl, 0.04, dur, 0.1, filt('lowpass', 440, 1, CH.bass.in));
      osc('sawtooth', f, t, end, g); osc('sine', f, t, end, gain(0.7, g));
    }
    lastBassF = f;
  }

  // ARPEGGIO / PICKED and STRUMMED CHORDS
  function pluck(m, t, lvl, kind = P.arpInst) {
    const f = freq(m);
    if (kind === 'pluck') {
      const lp = filt('lowpass', 3200, 2, env(t, 0.055 * lvl, 0.003, 0.22, both(CH.arp)));
      lp.frequency.setValueAtTime(3200, t); lp.frequency.exponentialRampToValueAtTime(450, t + 0.16);
      osc('sawtooth', f, t, t + 0.35, lp);
    } else if (kind === 'bell') {
      osc('sine', f, t, t + 1.4, env(t, 0.045 * lvl, 0.002, 1.2, both(CH.arp)));
      osc('sine', f * 3.01, t, t + 0.4, env(t, 0.012 * lvl, 0.002, 0.3, both(CH.arp)));
    } else if (kind === 'musicbox') {
      const w = wobble();
      osc('sine', f * 2, t, t + 0.9, env(t, 0.065 * lvl, 0.002, 0.7, both(CH.arp)), w);
      osc('sine', f * 8.04, t, t + 0.25, env(t, 0.012 * lvl, 0.002, 0.18, both(CH.arp)), w);
    } else if (kind === 'celesta') {
      osc('sine', f * 2, t, t + 1.1, env(t, 0.055 * lvl, 0.002, 1, both(CH.arp)));
      osc('sine', f * 8, t, t + 0.2, env(t, 0.008 * lvl, 0.002, 0.15, both(CH.arp)));
    } else if (kind === 'chip') {
      osc(PULSE[25], f, t, t + STEP + 0.05, held(t, 0.03 * lvl, 0.002, STEP * 0.8, 0.02, both(CH.arp)));
    } else if (kind === 'guitar') {
      const g = env(t, 0.045 * lvl, 0.003, 0.7, filt('lowpass', 1900, 0.8, CH.arp.in));
      osc('triangle', f, t, t + 0.8, g); osc('sawtooth', f, t, t + 0.8, gain(0.35, g));
    } else if (kind === 'banjo') {
      const g = env(t, 0.04 * lvl, 0.002, 0.18, filt('lowpass', 3400, 1, CH.arp.in));
      osc('square', f, t, t + 0.3, g); osc('sine', f, t, t + 0.4, env(t, 0.03 * lvl, 0.002, 0.3, CH.arp.in));
    } else if (kind === 'harp') {
      osc('triangle', f, t, t + 1.6, env(t, 0.06 * lvl, 0.003, 1.4, both(CH.arp)));
      osc('sine', f * 2, t, t + 0.5, env(t, 0.012 * lvl, 0.003, 0.4, both(CH.arp)));
    } else if (kind === 'twang') {
      const lp = filt('lowpass', 2600, 2, env(t, 0.05 * lvl, 0.003, 0.45, both(CH.arp)));
      lp.frequency.setValueAtTime(2600, t); lp.frequency.exponentialRampToValueAtTime(1100, t + 0.3);
      osc('sawtooth', f, t, t + 0.55, lp); osc('square', f, t, t + 0.55, gain(0.4, lp));
    } else if (kind === 'stab') {
      const lp = filt('lowpass', 1600, 3, env(t, 0.03 * lvl, 0.003, 0.15, both(CH.arp)));
      lp.frequency.setValueAtTime(1600, t); lp.frequency.exponentialRampToValueAtTime(500, t + 0.12);
      osc('sawtooth', f, t, t + 0.25, lp);
    }
  }

  // LEAD
  function lead(m, t, dur, lvl) {
    const f = freq(m);
    const end = t + dur + 0.4;
    const kind = P.lead;
    if (kind === 'saw') {
      const g = held(t, 0.034 * lvl, 0.02, dur, 0.2, filt('lowpass', 2800, 1, both(CH.lead)));
      for (const det of [-6, 6]) vibrato(osc('sawtooth', f, t, end, g, det), t, end, 5.5, 10, 0.25);
    } else if (kind === 'square') {
      vibrato(osc('square', f, t, end, held(t, 0.03 * lvl, 0.01, dur, 0.08, filt('lowpass', 3200, 0.7, both(CH.lead)))), t, end, 6, 10, 0.2);
    } else if (kind === 'pulse' || kind === 'pulse12') {
      vibrato(osc(PULSE[kind === 'pulse' ? 25 : 12], f, t, end, held(t, 0.038 * lvl, 0.004, dur, 0.03, both(CH.lead))), t, end, 6, 16, 0.18);
    } else if (kind === 'theremin') {
      const o = osc('sine', f * 0.94, t, end, held(t, 0.085 * lvl, 0.06, dur, 0.15, both(CH.lead)));
      o.frequency.exponentialRampToValueAtTime(f, t + 0.09);
      vibrato(o, t, end, 6, 20, 0.05);
    } else if (kind === 'bells') {
      osc('sine', f * 2, t, t + 1.4, env(t, 0.07 * lvl, 0.002, 1.2, both(CH.lead)));
      osc('sine', f * 2 * 2.76, t, t + 0.6, env(t, 0.025 * lvl, 0.002, 0.4, both(CH.lead)));
    } else if (kind === 'flute') {
      const g = held(t, 0.065 * lvl, 0.06, dur, 0.12, filt('lowpass', 3500, 0.7, both(CH.lead)));
      vibrato(osc('triangle', f, t, end, g), t, end, 5, 10, 0.15);
      osc('sine', f * 2, t, end, gain(0.12, g));
      const n = ctx.createBufferSource();
      n.buffer = noise;
      n.connect(filt('bandpass', f * 2, 2, env(t, 0.012 * lvl, 0.02, 0.12, CH.lead.in)));
      n.start(t, Math.random() * 0.5); n.stop(t + 0.2);
    } else if (kind === 'fiddle') {
      const g = held(t, 0.06 * lvl, 0.035, dur, 0.12, filt('lowpass', 4500, 0.7, both(CH.lead)));
      vibrato(osc('sawtooth', f, t, end, filt('peaking', 1800, 1, g)), t, end, 6, 14, 0.12);
    } else if (kind === 'whistle') {
      const o = osc('sine', f * 0.97, t, end, held(t, 0.055 * lvl, 0.03, dur, 0.1, both(CH.lead)));
      o.frequency.exponentialRampToValueAtTime(f, t + 0.05);
      vibrato(o, t, end, 5.5, 12, 0.15);
    } else if (kind === 'fm') { // (an FM bell-piano: the modulator's brightness dies away)
      const g = env(t, 0.055 * lvl, 0.004, Math.max(0.5, dur * 1.4), both(CH.lead));
      const c = osc('sine', f, t, end + 0.6, g);
      const mg = ctx.createGain();
      mg.gain.setValueAtTime(f * 1.6, t); mg.gain.exponentialRampToValueAtTime(f * 0.05, t + 0.6);
      mg.connect(c.frequency);
      osc('sine', f * 2, t, end + 0.6, mg);
    } else if (kind === 'brass') {
      const g = held(t, 0.045 * lvl, 0.04, dur, 0.12, both(CH.lead));
      const lp = filt('lowpass', 500, 1.2, g);
      lp.frequency.setValueAtTime(500, t); lp.frequency.linearRampToValueAtTime(2600, t + 0.08); lp.frequency.setTargetAtTime(1600, t + 0.08, 0.2);
      vibrato(osc('sawtooth', f, t, end, lp), t, end, 5, 10, 0.3);
    } else if (kind === 'twang') {
      pluck(m, t, lvl * 1.25, 'twang');
    } else if (kind === 'musicbox') {
      pluck(m, t, lvl * 1.1, 'musicbox');
    }
  }

  // DRUMS
  const KITS = {
    gated: { kick: [150, 46, 0.3, 0.7], snare: [1700, 0.8, 0.24, 185, 0.26], hat: [9000, 0.035, 0.045] },
    chip: { chip: true, kick: [130, 40, 0.12, 0.45], snare: [2600, 0.6, 0.11, 0, 0.2], hat: [11000, 0.025, 0.035] },
    break: { kick: [165, 50, 0.22, 0.7], snare: [2100, 0.9, 0.17, 210, 0.28], hat: [8500, 0.03, 0.04] },
    lofi: { kick: [115, 45, 0.28, 0.55], snare: [1400, 0.8, 0.2, 180, 0.17], hat: [6500, 0.05, 0.028], dull: true },
    909: { kick: [170, 44, 0.42, 0.75], snare: [1300, 1.2, 0.2, 0, 0.2], hat: [9500, 0.035, 0.035], open: 0.18 },
    orchestral: { timp: true, snare: [900, 0.7, 0.28, 160, 0.17], hat: [7000, 0.05, 0.02] },
    garage: { kick: [120, 55, 0.25, 0.6], snare: [1600, 0.8, 0.2, 200, 0.22], hat: [7500, 0.05, 0.035] },
    folk: { bodhran: true, snare: [3000, 0.7, 0.08, 0, 0.11], hat: [6000, 0.06, 0.03] },
    sleigh: { kick: [110, 50, 0.25, 0.45], snare: [2500, 0.6, 0.18, 0, 0.13], hat: [8000, 0.04, 0.03], sleigh: true },
    soft: { kick: [100, 50, 0.3, 0.42], snare: [2800, 0.5, 0.22, 0, 0.09], hat: [8000, 0.04, 0.02] },
  };
  const K = KITS[P.style.kit] || KITS.gated;
  function noiseHit(t, peak, type, f, q, decay, dest, a = 0.002) {
    const src = ctx.createBufferSource();
    src.buffer = noise;
    src.connect(filt(type, f, q, env(t, peak, a, decay, dest)));
    src.start(t, Math.random() * 0.5); src.stop(t + a + decay + 0.02);
  }
  function kick(t, lvl) {
    if (K.timp) { // (a timpani, tuned to the key)
      const f = freq(fold(P.KEY, 36));
      const o = osc('sine', f * 1.25, t, t + 0.9, env(t, 0.48 * lvl, 0.004, 0.75, CH.kick.in));
      o.frequency.exponentialRampToValueAtTime(f, t + 0.08);
      return;
    }
    if (K.bodhran) { // (a frame drum: a low thud and the slap of the skin)
      const o = osc('sine', 98, t, t + 0.4, env(t, 0.45 * lvl, 0.003, 0.3, CH.kick.in));
      o.frequency.exponentialRampToValueAtTime(70, t + 0.12);
      noiseHit(t, 0.05 * lvl, 'lowpass', 1400, 0.7, 0.05, CH.kick.in);
      return;
    }
    const [f0, f1, d, pk] = K.kick;
    const o = osc(K.chip ? 'square' : 'sine', f0, t, t + d + 0.05, env(t, pk * lvl * (K.chip ? 0.35 : 1), 0.002, d, K.dull ? filt('lowpass', 1800, 0.7, CH.kick.in) : CH.kick.in));
    o.frequency.exponentialRampToValueAtTime(f1, t + (K.chip ? 0.05 : 0.07));
  }
  function snare(t, lvl) {
    const [f, q, d, tone, pk] = K.snare;
    const dest = K.dull ? filt('lowpass', 3500, 0.7, CH.snare.in) : CH.snare.in;
    noiseHit(t, pk * lvl, 'bandpass', f, q, d, dest);
    if (tone) osc('sine', tone, t, t + 0.12, env(t, pk * 0.6 * lvl, 0.002, 0.08, dest));
  }
  function clap(t, lvl) {
    for (let i = 0; i < 3; i++) noiseHit(t + i * 0.011, 0.12 * lvl, 'bandpass', 1300, 1.2, 0.03, CH.clap.in);
    noiseHit(t + 0.033, 0.1 * lvl, 'bandpass', 1300, 1.2, 0.14, CH.clap.in);
  }
  function hat(t, lvl, open) {
    if (K.sleigh || P.style.sleighHats) { for (let i = 0; i < 3; i++) noiseHit(t + i * 0.012, 0.04 * lvl, 'bandpass', 7000 + i * 900, 6, 0.08, CH.hats.in); return; }
    const [f, d, pk] = K.hat;
    noiseHit(t, pk * lvl * (open ? 0.8 : 1), 'highpass', f * 0.8, 0.8, open ? (K.open || 0.2) : d, CH.hats.in);
  }
  function tamb(t, lvl) {
    noiseHit(t, 0.035 * lvl, 'bandpass', 9500, 3, 0.07, CH.tambourine.in);
    noiseHit(t + 0.018, 0.025 * lvl, 'bandpass', 9500, 3, 0.06, CH.tambourine.in);
  }
  function tom(t, lvl, i) { // (i: 0 high to 3 low; the orchestral kit's are timpani on the chord)
    const f = K.timp ? freq(fold(P.KEY + [7, 5, 3, 0][i % 4], 38)) : [220, 175, 140, 110][i % 4] * (K.chip ? 1.4 : 1);
    const o = osc(K.chip ? 'square' : 'sine', f * 1.4, t, t + 0.4, env(t, (K.chip ? 0.12 : 0.32) * lvl, 0.003, K.timp ? 0.5 : 0.28, CH.toms.in));
    o.frequency.exponentialRampToValueAtTime(f, t + 0.06);
  }
  function crash(t, lvl) { noiseHit(t, 0.05 * lvl, 'highpass', 5500, 0.7, 1.4, CH.hats.in); }
  function bell(m, t, lvl) { // (a struck bell and its inharmonic ring)
    osc('sine', freq(m), t, t + 2.6, env(t, 0.07 * lvl, 0.002, 2.4, both(CH.bell)));
    osc('sine', freq(m) * 2.4, t, t + 1.7, env(t, 0.025 * lvl, 0.002, 1.4, both(CH.bell)));
    osc('sine', freq(m) * 3.9, t, t + 1, env(t, 0.012 * lvl, 0.002, 0.8, both(CH.bell)));
  }
  function crackle(t, lvl) { if (Math.random() < 0.35) noiseHit(t + Math.random() * STEP, 0.014 * lvl, 'highpass', 3000, 0.7, 0.004, CH.hats.in, 0.001); }

  // The bass line, a bar at a time
  function bassAt(b, s, nb) {
    const R = fold(b.root, 33);
    const fifth = fold(b.notes[2], R);
    const nextR = fold(nb.root, 33);
    switch (P.bass) {
      case 'root': { const k = G.k.includes(s) ? G.k : (s === 0 ? [0] : null); if (!k) return null; const nx = k.find((x) => x > s); return { m: R, dur: (nx || BS) - s }; }
      case 'pulse8': return s % 2 === 0 ? { m: R, dur: 1.6 } : null;
      case 'octave': return s % 2 === 0 ? { m: R + ((s / 2) % 2 ? 12 : 0), dur: 1.6 } : null;
      case 'chip8': return s % 2 === 0 ? { m: s === 12 ? fifth : s === 14 ? R + 12 : R, dur: 1.8 } : null;
      case 'walk': {
        if (s % BEAT) return null;
        const beat = s / BEAT;
        const third = fold(b.notes[1], R);
        const approach = nextR + (nextR > R ? -1 : 1);
        return { m: [R, third, fifth, nb.root === b.root ? fifth + 2 > R + 12 ? third : fifth : approach][beat % 4], dur: BEAT * 0.9 };
      }
      case 'acid': { const a = P.acid[s % 16]; return a.on ? { m: (a.five ? fifth : R) + (a.oct ? 12 : 0), dur: a.slide ? 2 : 1, acc: a.acc, slide: a.slide } : null; }
      case 'reese': return b.start && s === 0 ? { m: R, dur: b.hold * BS - 1 } : null;
      case 'oompah': {
        if (P.meter === 3) return s === 0 ? { m: b.i % 2 ? fifth - 12 < 33 ? fifth : fifth - 12 : R, dur: BEAT * 0.9 } : null;
        return s === 0 ? { m: R, dur: BEAT * 1.5 } : s === 8 ? { m: fifth - 12 < 33 ? fifth : fifth - 12, dur: BEAT * 1.5 } : null;
      }
      case 'jig': return s === 0 ? { m: R, dur: 5 } : s === 6 ? { m: fifth - 12 < 33 ? fifth : fifth - 12, dur: 5 } : null;
      case 'boomchick': return s === 0 ? { m: R, dur: 3 } : s === 8 ? { m: fifth - 12 < 33 ? fifth : fifth - 12, dur: 3 } : null;
      default: return null;
    }
  }
  // The arpeggio's notes: the chord's close above its octave, and again an octave up
  const ARPS = { up: [0, 1, 2, 3], updown: [0, 1, 2, 3, 2, 1], broken: [0, 2, 1, 3], pedal: [3, 0, 3, 1, 3, 2, 3, 1], chip: [0, 1, 2], roll: [0, 2, 4, 0, 2, 4, 1, 3] };
  function arpNotes(b) {
    const base = P.KEY + b.lift + 12 * P.arpOct;
    const tones = b.notes.slice(0, P.arpInst === 'chip' ? 3 : 4).map((m) => fold(m, base)).sort((x, y) => x - y);
    return [...tones, ...tones.map((m) => m + 12)];
  }
  // The pad's voicing: the chord's notes in one octave around the key (close, so it moves smoothly)
  const padNotes = (b) => b.notes.map((m) => fold(m, P.KEY + b.lift - 3));

  const swingAt = (s) => (s % 2 ? P.swing * STEP : 0);
  return {
    step: STEP,
    loopSteps: N * BS,
    layers: LAYERS,
    defaultMuted: [],
    channels: ch.list,
    record: ch.record,
    describe: P.describe,
    schedule(step, t, intensity = 0, solo = null) {
      const pos = step % (N * BS);
      const bi = Math.floor(pos / BS);
      const b = bars[bi];
      const nb = bars[(bi + 1) % N];
      const s = pos % BS;
      const M = MASK[b.role];
      const L = {};
      for (const { id, from, span } of LAYERS) L[id] = solo ? Number(id === solo) : Math.max(0, Math.min(1, (intensity - from) / span)) * M[id];
      const tt = t + swingAt(s);

      // the chords
      if (!solo) {
        if (P.pad === 'rhodes') { if (P.comp.includes(s)) { const nx = P.comp.find((x) => x > s); keys(padNotes(b), tt, ((nx || BS) - s) * STEP * 0.95, 1); } }
        else if (P.pad !== 'none' && b.start && s === 0) pad(padNotes(b), t, b.hold * BS * STEP * 0.98, 1);
      }
      if (L.bass) { const n = bassAt(b, s, nb); if (n) bass(n.m, tt, n.dur * STEP, L.bass, n); }
      if (L.arp && P.arp !== 'none') {
        const X = arpNotes(b);
        if (P.arp === 'strum') { // (down on the beat, up between)
          const at = P.meter === 6 ? [0, 4, 6, 10] : [0, 6, 8, 12];
          const k = at.indexOf(s);
          if (k >= 0) X.slice(0, 4).forEach((m, i, a) => pluck(k % 2 ? a[a.length - 1 - i] : m, tt + i * 0.014, L.arp * (k % 2 ? 0.7 : 1)));
        } else if (P.arp === 'offstab') {
          if (s % 4 === 2) X.slice(0, 3).forEach((m) => pluck(m, tt, L.arp));
        } else if (s % P.arpRate === 0) {
          const pat = ARPS[P.arp] || ARPS.up;
          pluck(X[pat[(s / P.arpRate) % pat.length] % X.length], tt, L.arp);
        }
      }
      if (L.drums) {
        const fill = b.last && P.fill !== 'none' && b.role !== 'intro' && b.role !== 'break' && nb.role !== 'break' && s >= BS / 2;
        if (fill && P.fill === 'timp') { if (s % 2 === 0) tom(tt, L.drums * (0.5 + (s - BS / 2) / BS), (s / 2) % 4); }
        else if (fill && P.fill === 'toms') { if (s % 2 === 0) tom(tt, L.drums, Math.floor((s - BS / 2) / 2)); }
        else if (fill && P.fill === 'snare') { snare(tt, L.drums * (0.45 + 0.55 * (s - BS / 2) / (BS / 2))); }
        else if (G.sparse) { if (s === 0 && b.first) kick(tt, L.drums); }
        else if (b.role === 'C') { if (s === 0) kick(tt, L.drums); } // (the bridge: the beat drops out)
        else {
          if (G.k.includes(s)) kick(tt, L.drums);
          if (G.s && G.s.includes(s)) snare(tt, L.drums);
          if (G.g && G.g.includes(s)) snare(tt, L.drums * 0.3);
          if (G.c && G.c.includes(s)) clap(tt, L.drums);
        }
        if (s === 0 && b.first && (b.role === 'B' || (bars[(bi + N - 1) % N].role !== b.role && b.role === 'A' && bi > 0))) crash(t, L.drums);
      }
      if (L.lead) {
        const n = b.lead[s];
        if (n) {
          const m = n.m + 12 * P.leadOct;
          lead(m, tt, n.dur * STEP, L.lead);
          if (P.harmony && b.role === 'B') lead(b.harm[s].m + 12 * P.leadOct, tt, n.dur * STEP, L.lead * 0.5);
        }
      }
      if (L.shimmer) {
        const h = G.h;
        if (h && s % (h === 16 ? 1 : h === 8 ? 2 : 4) === 0) hat(tt, L.shimmer * (h === 16 && s % 2 ? 0.55 : 1), false);
        if (G.o && G.o.includes(s)) hat(tt, L.shimmer, true);
        if (G.t && G.t.includes(s)) tamb(tt, L.shimmer);
        if (P.style.bells && s === 0 && (b.first || b.i % 4 === 0) && b.role !== 'intro') bell(fold(b.root, halloween ? 50 : 72), t, L.shimmer);
        if (P.style.crackle) crackle(t, L.shimmer);
      }
    },
  };
}
