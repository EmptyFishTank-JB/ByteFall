// The soundtrack's tracks for the dev pages (audio.html's list, mixer.html): what each is, its
// file and engine function (js/music/), and its sections. The game's own list is music.js's.
const TRACK_INFO = [
  {
    id: 'bytefall-theme', num: '01', title: 'BYTEFALL THEME', fn: 'createBytefallTheme', file: 'music-bytefall-theme.js',
    meta: ['synthwave', '108 BPM', 'A minor', '32 bars', '~71s loop'],
    desc: 'An original 80s-style synthwave loop: gated-reverb snare, octave-pulsing bass, detuned saw pads, an echoing 16th-note arpeggio and a square/saw lead.',
    sections: [
      ['0:00', 'Intro', 'Am–F–C–G–Am–F–C–E. Pads, bass and arpeggio; drums hold back for 4 bars, then a snare roll.'],
      ['0:18', 'Melody 1', 'The lead melody enters over the full groove.'],
      ['0:36', 'Section B', 'New chords (F–G–Em–Am–F–G–E–E), a higher second melody, four-on-the-floor kick and 16th hats, ending in a snare roll.'],
      ['0:53', 'Climax', 'Melody 1 doubled an octave up over the driving drums, then back to the intro.'],
    ],
  },
  {
    id: 'sleep-mode', num: '02', title: 'SLEEP MODE', fn: 'createSleepMode', file: 'music-sleep-mode.js',
    meta: ['electronicore', '150 BPM', 'A minor', '32 bars', '~51s loop'],
    desc: 'Original trance-meets-metalcore built on the public-domain lullaby "Schlaf, Kindlein, schlaf": a music box, supersaws, and down-tuned distorted power chords through one shared amp.',
    sections: [
      ['0:00', 'Music box', 'The lullaby on a music box over a dark pad; ominous guitar hits from bar 5.'],
      ['0:13', 'Trance build', 'Four-on-the-floor kick, supersaw arpeggio, the lullaby on a supersaw lead, a noise riser and a snare roll.'],
      ['0:26', 'Drop', 'Chugging palm-muted guitars, double-kick, crashes, the lullaby on the trance lead.'],
      ['0:38', 'Breakdown', 'Half-time: syncopated chugs locked to the kick, the music box tinkling the lullaby above.'],
    ],
  },
  {
    id: 'brute-force', num: '03', title: 'BRUTE FORCE', fn: 'createBruteForce', file: 'music-brute-force.js',
    meta: ['chiptune', '140 BPM', 'E minor', '32 bars', '~55s loop'],
    desc: 'Original 8-bit game music in the NES style: pulse-wave leads at 12.5/25/50% duty, a stepped 4-bit triangle bass, sample-and-hold noise drums and fast arpeggios that fake the chords.',
    sections: [
      ['0:00', 'Boot', 'Em–C–D–B–Em–C–Am–B. Arpeggio and triangle bass; drums join halfway, ending in a snare fill.'],
      ['0:13', 'Level 1', 'Melody A on a thin 12.5% pulse over kick, snare and 8th-note hats.'],
      ['0:27', 'Level 2', 'New chords (C–D–Em–Em–C–D–B–B), melody B on a 25% pulse, a syncopated kick.'],
      ['0:41', 'Boss', 'Melody A as a duet (a third below), four-on-the-floor kick and 16th hats, then back to boot.'],
    ],
  },
  {
    id: 'deep-web', num: '04', title: 'DEEP WEB', fn: 'createDeepWeb', file: 'music-deep-web.js',
    meta: ['dark techno', '124 BPM', 'F minor', '32 bars', '~62s loop'],
    desc: 'Original dark ambient techno: a muffled four-on-the-floor kick and rolling 16th-note bass under a detuned drone, with modem bleeps and data chirps drifting through a dotted-8th echo.',
    sections: [
      ['0:00', 'Connect', 'Fm–Db–Eb. Drone and bleeps; the muffled kick and rolling bass join at bar 5.'],
      ['0:15', 'Tunnel', 'The full groove: kick, rolling bass, off-beat hats and a clap on 2 and 4.'],
      ['0:31', 'Deep', 'New chords (Bbm–Fm–Db–C) and a "data stream" square pluck on a 3-against-4 cross-rhythm.'],
      ['0:46', 'Surface', 'The kick drops out for 4 bars under the drone, then the groove returns into the loop.'],
    ],
  },
  {
    id: 'zero-day', num: '05', title: 'ZERO DAY', fn: 'createZeroDay', file: 'music-zero-day.js',
    meta: ['drum & bass', '172 BPM', 'D minor', '32 bars', '~45s loop'],
    desc: 'Original drum & bass: a two-step breakbeat with ghost snares, a detuned "reese" bass with a wobbling filter and sine sub, an urgent saw pad and square-wave lead stabs.',
    sections: [
      ['0:00', 'Infiltrate', 'Dm–Bb–C–Dm–Gm–A. Pad and hats with the reese entering; the break drops in at bar 5, ending in a snare roll.'],
      ['0:11', 'Payload', 'The full roller: two-step break with ghost snares, reese bassline and pad.'],
      ['0:22', 'Exploit', 'New chords (Bb–C–Dm–A) and a square-wave lead stab riff over the break.'],
      ['0:33', 'Escape', 'Drumless breakdown for 4 bars (pad and reese), then the break returns with a snare-roll build.'],
    ],
  },
  {
    id: 'system-restore', num: '06', title: 'SYSTEM RESTORE', fn: 'createSystemRestore', file: 'music-system-restore.js',
    meta: ['lo-fi / chill', '85 BPM', 'E♭ major', '32 bars', '~90s loop'],
    desc: 'Original lo-fi: Rhodes-style electric piano sevenths with a tape warble, a round upright-style bass, dusty swung boom-bap drums and vinyl crackle, with a breathy flute melody.',
    sections: [
      ['0:00', 'Standby', 'E♭maj7–Cm7–A♭maj7–B♭7. Piano and crackle; the bass and softer drums come in at bar 5.'],
      ['0:22', 'Restore', 'The full swung beat, with an extra piano comp on the "and" of 3.'],
      ['0:45', 'Recovery', 'New chords (Fm7–B♭7–E♭maj7–Cm7–A♭maj7–Gm7) and the flute melody.'],
      ['1:07', 'Reboot', 'A half-time dip for 4 bars, then the full beat returns into the loop.'],
    ],
  },
  {
    id: 'night-drive', num: '07', title: 'NIGHT DRIVE', fn: 'createNightDrive', file: 'music-night-drive.js',
    meta: ['synthwave / outrun', '100 BPM', 'F♯ minor', '32 bars', '~77s loop'],
    desc: 'Original synthwave: a pumping 16th-note octave bass that ducks under every kick, wide detuned saw pads, an 80s gated-reverb snare with tom fills, and a bright arpeggio and gliding lead through a dotted-8th echo.',
    sections: [
      ['0:00', 'Ignition', 'F♯m–D–A–E. Pads and a sparse arpeggio; the pumping bass and kick come in at bar 5, with a tom fill into the next section.'],
      ['0:19', 'Cruise', 'The full drive: gated snare on 2 and 4, 8th-note hats and the 16th arpeggio.'],
      ['0:38', 'Neon', 'New chords (D–E–C♯m–F♯m–D–E–A–E) and the gliding lead melody.'],
      ['0:58', 'Overdrive', 'The lead doubled an octave down and the arpeggio an octave up, then a tom fill back into the loop.'],
    ],
  },
  {
    id: 'standby-mode', num: '08', title: 'STANDBY MODE', fn: 'createStandbyMode', file: 'music-standby-mode.js',
    meta: ['soul ballad', '112 BPM', 'B♭ major', '32 bars', '~69s loop'],
    desc: 'Original early-60s soul ballad: a walking upright bass, finger snaps and a guiro scrape, a clean guitar picking the chords, and a breathy saxophone singing the melody through a warm room reverb.',
    sections: [
      ['0:00', 'Standby', 'B♭–Gm–E♭–F–B♭, two bars a chord. Bass and snaps alone, then the guitar and guiro join at bar 3.'],
      ['0:17', 'Signal', 'The saxophone takes the melody.'],
      ['0:34', 'Connected', 'The melody climbs an octave higher.'],
      ['0:51', 'Hold', 'The melody back down, with bluesy slides into each note, then round into the loop.'],
    ],
  },
  {
    id: 'core-dump', num: '09', title: 'CORE DUMP', fn: 'createCoreDump', file: 'music-core-dump.js',
    meta: ['8-bit tech-death', '190 BPM', 'A harmonic minor', '32 bars', '~40s loop'],
    desc: 'Original 8-bit tech-death: distorted pulse-wave guitars (tremolo riffs, palm-muted chugs, open notes diving an octave), a square bass, noise-channel blast beats and a china cymbal, and 32nd-note sweep arpeggios on a thin 12.5% pulse.',
    sections: [
      ['0:00', 'Segfault', 'A chromatic tremolo riff over blast beats. The first time through, the riff plays alone for two bars and a snare roll brings the blasts in; after that the breakdown\'s glitch runs straight into the blasts, so the loop never stops.'],
      ['0:10', 'Stack trace', 'Galloping chugs over 16th-note double kick, snare on 2 and 4, and a sliding alien lead.'],
      ['0:20', 'Overflow', 'Sweep arpeggios in 32nds, two octaves up and back (Am–B♭–G♯dim–Am–E), over blasts.'],
      ['0:30', 'Core dump', 'A half-time breakdown: chugs, china and pitch dives, then a stuttering glitch back into the loop.'],
    ],
  },
  {
    id: 'handshake', num: '10', title: 'HANDSHAKE', fn: 'createHandshake', file: 'music-handshake.js',
    meta: ['8-bit battle theme', '176 BPM', 'C minor', '32 bars', '~44s loop'],
    desc: 'Original 8-bit battle theme in the style of Game Boy-era handheld RPG battles: a lead pulse with delayed vibrato, a second pulse, a busy 4-bit wave-channel bass bouncing in octaves, and a light noise-channel kit.',
    sections: [
      ['0:00', 'Encounter', 'Two bars of groove (the first time through, a falling chromatic intro run instead), then the main theme over Cm–A♭–B♭–G.'],
      ['0:11', 'Battle', 'The answer: falling phrases, then the theme climbing higher.'],
      ['0:22', 'Bridge', 'Long notes with vibrato over a 16th-note arpeggio (E♭–B♭–Cm–A♭–Fm–B♭–E♭–G).'],
      ['0:33', 'Critical', 'A figure rising a semitone every bar, then a falling chromatic run back into the loop.'],
    ],
  },
  {
    id: 'stack-overflow', num: '11', title: 'STACK OVERFLOW', fn: 'createStackOverflow', file: 'music-stack-overflow.js',
    meta: ['folk techno', '140–160 BPM', 'D minor', '32 bars', '~55s loop at 140'],
    desc: 'An original folk-techno track: a bouncing minor-key dance tune in the Russian folk style, first on a balalaika-like pluck with a tremolo on its long notes, then on a big supersaw over four-on-the-floor techno. Its tempo climbs with the stack, from 140 BPM up to 160.',
    sections: [
      ['0:00', 'Intro', 'Dm–Dm–A–A–Dm–Gm–A–Dm. The tune on the balalaika pluck over an oom-pah bass and chord stabs; a soft kick joins at bar 5.'],
      ['0:14', 'Build', 'Four-on-the-floor, offbeat hats and the offbeat bass under the pluck, the pad opening up, a noise riser and a snare roll.'],
      ['0:27', 'Drop', 'A second, brighter tune (F–C–Gm–Dm–B♭–Gm–A–A) on the supersaw over the full groove, with claps and crashes.'],
      ['0:41', 'Breakdown', 'The first tune on a bell over the pad and long bass notes, then the drop comes back on the supersaw into the loop.'],
    ],
  },
  {
    id: 'firewall', num: '12', title: 'FIREWALL', fn: 'createFirewall', file: 'music-firewall.js',
    meta: ['16-bit console', '144 BPM', 'F major / F minor', '32 bars', '~53s loop'],
    desc: 'An original track in the style of early-90s Genesis platformers: two-operator FM synthesis (a slap FM bass, an FM electric piano, FM brass and bell leads) over crunchy, sample-style drums. A bright ZONE theme that turns into a BOSS FIGHT as the stack nears the line, and back when it falls.',
    sections: [
      ['0:00', 'Zone', 'F–Am–B♭–C–F–Am–Gm–C7. The slap bass groove, the piano on the offbeats and the bouncy FM lead.'],
      ['0:13', 'Zone again', 'The same tune over the full groove.'],
      ['0:27', 'Bridge', 'Dm–B♭–C–A twice: a longer-note tune climbing into a turnaround.'],
      ['0:40', 'Zone, up', 'The tune an octave higher, back into the loop.'],
      ['—', 'BOSS FIGHT', 'At stack 6+ (80%), on the next two-bar mark: a WARNING bar (a siren over a tom roll), then the boss theme in F minor (Fm–Fm–D♭–E♭–Fm–Fm–D♭–C: a driving 16th-note FM bass, harsh FM brass, pounding drums) until the stack falls to 4 rows (under 60%), when the zone returns on the next two-bar mark.'],
    ],
  },
];
