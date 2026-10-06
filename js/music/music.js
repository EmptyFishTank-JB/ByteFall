// Music player: owns the AudioContext, the lookahead scheduler, the playlist
// and the intensity input. Track engines live in their own music-*.js files.

const Music = (() => {
  const STORAGE_KEY = 'bytefall-music';
  const BG_KEY = 'bytefall-music-bg';
  const MODE_KEY = 'bytefall-music-mode';
  const TRACK_KEY = 'bytefall-music-track';
  const MODES = ['repeat', 'sequence', 'shuffle'];
  const FADE_OUT = 3; // seconds of fade at the end of a track's last loop
  const LOOPS_PER_TRACK = 4; // sequence/shuffle: plays before moving to the next track
  const LOOKAHEAD = 0.12;
  // Hidden tabs get their timers throttled to ~1/s, so queue more notes ahead while in the background.
  const HIDDEN_LOOKAHEAD = 1.5;
  const INTENSITY_EASE = 0.06; // per 16th step, ~2.5s to settle
  // Add future tracks here: each entry's create(ctx, out) returns an engine like createBytefallTheme's.
  // free: always playable; track N (from 02) is unlocked by progress.js's track-N. no: its number
  // in the playlist when that isn't its place in this list (GENERATED is track 16; 12-15 are to come)
  const TRACKS = [
    { id: 'bytefall-theme', title: 'BYTEFALL THEME', create: createBytefallTheme, free: true },
    { id: 'sleep-mode', title: 'SLEEP MODE', create: createSleepMode },
    { id: 'brute-force', title: 'BRUTE FORCE', create: createBruteForce },
    { id: 'deep-web', title: 'DEEP WEB', create: createDeepWeb },
    { id: 'zero-day', title: 'ZERO DAY', create: createZeroDay },
    { id: 'system-restore', title: 'SYSTEM RESTORE', create: createSystemRestore },
    { id: 'night-drive', title: 'NIGHT DRIVE', create: createNightDrive },
    { id: 'standby-mode', title: 'STANDBY MODE', create: createStandbyMode },
    { id: 'core-dump', title: 'CORE DUMP', create: createCoreDump },
    { id: 'handshake', title: 'HANDSHAKE', create: createHandshake },
    { id: 'stack-overflow', title: 'STACK OVERFLOW', create: createStackOverflow },
    // (music-generated.js: a new song from a seed, in the season's style; free, all year)
    { id: 'generated', title: 'GENERATED', create: (c, o) => createGenerated(c, o, generatedOptions()), free: true, no: 16 },
  ];
  TRACKS.forEach((t, i) => { t.no = t.no || i + 1; });
  // GENERATED's seed: the SONG OF THE DAY (the date's, the same for everyone that day) or RANDOM (a
  // new song each time it starts); its season, the time of year's
  const GEN_KEY = 'bytefall-gen-seed';
  let genMode = (() => { try { return localStorage.getItem(GEN_KEY) === 'random' ? 'random' : 'day'; } catch (e) { return 'day'; } })();
  function generatedSeason() {
    const S = typeof Season !== 'undefined' ? Season : null;
    if (!S) return 'default';
    if (S.is('halloween')) return 'halloween';
    if (S.is('november')) return 'harvest';
    if (['winter', 'christmas', 'hanukkah', 'kwanzaa', 'nye', 'newyear'].some((id) => S.is(id))) return 'winter';
    return 'default';
  }
  let lastGen = null;
  function daySeed(season) {
    const d = new Date();
    const key = `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}-${d.getUTCDate()}-${season}`;
    let seed = 2166136261;
    for (let i = 0; i < key.length; i++) { seed ^= key.charCodeAt(i); seed = Math.imul(seed, 16777619) >>> 0; }
    return seed;
  }
  function generatedOptions() {
    const season = generatedSeason();
    const seed = genMode === 'day' ? daySeed(season) : Math.floor(Math.random() * 4294967295);
    lastGen = { season, seed, mode: genMode };
    return lastGen;
  }
  // (the song it plays: the day's, or on RANDOM the last one written; null before the first)
  function genSong() {
    const season = generatedSeason();
    if (genMode === 'day') return composeGenerated({ season, seed: daySeed(season) }).describe();
    return lastGen && lastGen.mode === 'random' ? composeGenerated(lastGen).describe() : null;
  }
  let enabled = true;
  let backgroundPlay = false;
  let trackId = TRACKS[0].id; // the last track picked or played (saved), else track 01
  let mode = 'repeat';
  try {
    if (MODES.includes(localStorage.getItem(MODE_KEY))) mode = localStorage.getItem(MODE_KEY);
    enabled = localStorage.getItem(STORAGE_KEY) !== 'off';
    backgroundPlay = localStorage.getItem(BG_KEY) === 'on';
  } catch (e) {}
  const unlockId = (track) => `track-${track.no}`;
  const isLocked = (track) => !track.free && !Progress.isUnlocked(unlockId(track));
  function setTrack(id) {
    trackId = id;
    try { localStorage.setItem(TRACK_KEY, id); } catch (e) {}
  }
  try {
    const saved = TRACKS.find((t) => t.id === localStorage.getItem(TRACK_KEY));
    if (saved && !isLocked(saved)) trackId = saved.id; // a refresh carries on with the same track
  } catch (e) {}
  let intensity = 0;
  let targetIntensity = 0;
  let gameIntensity = 0; // what the game asks for; the MUSIC PLAYER's full mix overrides it
  let fullMix = false;
  // The MUSIC PLAYER's speed, for the tracks whose tempo climbs with the stack (a `tempo` layer:
  // STACK OVERFLOW): RAMPING up across each time through the track (the track as it is), or FULL
  // SPEED, held at its top tempo (tapping the track while it plays switches)
  const SPEED_KEY = 'bytefall-player-speed';
  let speedMode = 'ramp';
  try { if (localStorage.getItem(SPEED_KEY) === 'full') speedMode = 'full'; } catch (e) {}
  const RAMPING_TRACKS = new Set(['stack-overflow']);
  // SETTINGS → GAME MUSIC: FULL plays every layer in during the game too (LAYERED: they build with the stack)
  let alwaysFull = (() => { try { return localStorage.getItem('bytefall-music-full') === 'on'; } catch (e) { return false; } })();
  let ctx = null;
  let analyser = null;
  let stereo = null; // [left, right] analysers
  // SETTINGS → SOUND OUTPUT (output.js): the chain everything passes through last, and the mix
  // tables (mixes.js) each track plays with on it
  let outputId = savedSoundOutput();
  let outChain = null;
  let session = null; // per-play gain so stopped notes can't bleed into the next start
  let engine = null;
  let timer = null;
  let step = 0;
  let nextTime = 0;
  let loopsToPlay = LOOPS_PER_TRACK;
  let fadeStarted = false;
  let onTrackChange = null;

  function openSession(fadeIn) {
    session = ctx.createGain();
    session.gain.setValueAtTime(0, ctx.currentTime);
    session.gain.linearRampToValueAtTime(1, ctx.currentTime + fadeIn);
    session.connect(outChain.input);
    engine = TRACKS.find((t) => t.id === trackId).create(ctx, session);
    step = 0;
    loopsToPlay = LOOPS_PER_TRACK;
    fadeStarted = false;
  }

  // Sequence and shuffle only move between tracks the player can play.
  function nextTrackId() {
    const open = TRACKS.filter((t) => !isLocked(t));
    const i = open.findIndex((t) => t.id === trackId);
    if (mode === 'sequence') return open[(i + 1) % open.length].id;
    const others = open.filter((t) => t.id !== trackId); // shuffle never repeats back to back
    return others.length ? others[Math.floor(Math.random() * others.length)].id : trackId;
  }

  // Sequence/shuffle: fade out over the end of the last loop, then start the next track.
  // (GENERATED on RANDOM, repeating: a radio, a new song after each has played twice)
  const genRadio = () => mode === 'repeat' && trackId === 'generated' && genMode === 'random';
  function advance() {
    if (mode === 'repeat' && !genRadio()) return;
    const end = (genRadio() ? 2 : loopsToPlay) * engine.loopSteps;
    if (!fadeStarted && step >= end - Math.ceil(FADE_OUT / engine.step)) {
      fadeStarted = true;
      session.gain.setValueAtTime(1, nextTime);
      session.gain.linearRampToValueAtTime(0, nextTime + (end - step) * engine.step);
    }
    if (step >= end) {
      const old = session;
      setTimeout(() => old.disconnect(), (nextTime - ctx.currentTime + 1) * 1000);
      setTrack(genRadio() ? 'generated' : nextTrackId());
      openSession(0.8);
      if (onTrackChange) onTrackChange(trackId);
    }
  }

  // Which channels count as which drum: the low hits (kick), the high ones (hats, ticks, shakers)
  const DRUM_KIND = { kick: 'low', sub: 'low', toms: 'low', hats: 'high', tick: 'high', shaker: 'high', tambourine: 'high', snare: 'snare', clap: 'snare' };
  let drumLog = [];
  let hit = null; // (the step being scheduled's drum hits, as the engine plays them)
  const recordHit = (id) => { const k = DRUM_KIND[id]; if (k) { hit = hit || { time: nextTime }; hit[k] = true; } };
  function tick() {
    if (nextTime < ctx.currentTime) nextTime = ctx.currentTime + 0.02;
    const ahead = document.hidden ? HIDDEN_LOOKAHEAD : LOOKAHEAD;
    while (nextTime < ctx.currentTime + ahead) {
      advance();
      intensity += (targetIntensity - intensity) * INTENSITY_EASE;
      applyMix(engine, trackMix(trackId, outputId), intensity, nextTime);
      // (the drums as they're scheduled, for whatever moves to them: the wanderers' headphones)
      hit = step % 4 === 0 ? { time: nextTime, beat: true, bar: step % 16 === 0, half: step % 8 === 0, feel: engine.feel ? engine.feel(step) : null } : null;
      if (engine.record) engine.record(recordHit);
      // (the player: the tempo held or ramping, not the full mix's top speed)
      const tempo = fullMix && RAMPING_TRACKS.has(trackId) ? (speedMode === 'full' ? 1 : (step % engine.loopSteps) / engine.loopSteps) : null;
      engine.schedule(step, nextTime, intensity, null, null, tempo);
      if (engine.record) engine.record(null);
      if (hit) { drumLog.push(hit); if (drumLog.length > 96) drumLog.shift(); }
      nextTime += engine.step;
      step++;
    }
  }

  function start() {
    if (timer) return;
    try {
      if (!ctx) {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
        analyser = ctx.createAnalyser();
        analyser.fftSize = 2048;
        analyser.smoothingTimeConstant = 0.72;
        analyser.minDecibels = -90;
        analyser.maxDecibels = -34;
        analyser.connect(ctx.destination);
        outChain = createSoundOutput(ctx, outputId);
        outChain.output.connect(analyser);
        // Left and right on their own, for the vectorscope (a mono signal is copied to both
        // sides, as the speakers play it)
        const tap = ctx.createGain();
        tap.channelCount = 2;
        tap.channelCountMode = 'explicit';
        tap.channelInterpretation = 'speakers';
        const split = ctx.createChannelSplitter(2);
        stereo = [ctx.createAnalyser(), ctx.createAnalyser()];
        stereo.forEach((a, ch) => { a.fftSize = 1024; split.connect(a, ch); });
        analyser.connect(tap);
        tap.connect(split);
      }
      ctx.resume();
      openSession(1.5);
      nextTime = ctx.currentTime + 0.05;
      timer = setInterval(tick, 25);
    } catch (e) {}
  }

  function stop() {
    if (!timer) return;
    clearInterval(timer);
    timer = null;
    const old = session;
    old.gain.cancelScheduledValues(ctx.currentTime);
    old.gain.setTargetAtTime(0, ctx.currentTime, 0.08);
    setTimeout(() => old.disconnect(), 600);
  }

  // Browsers only let sound start from a tap, click or key press, and iPadOS / iOS only count a
  // finished tap (not the press), and can pause the audio again (another app, the lock screen).
  // So every tap, click and key press makes sure the music is actually running.
  // (Safari 17+: 'playback' keeps it playing with the device set to silent, like a music app.)
  try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) {}
  function unlock() {
    if (!enabled || document.hidden) return;
    if (!timer) start();
    else if (ctx && ctx.state !== 'running') ctx.resume();
  }
  for (const type of ['pointerdown', 'touchend', 'click', 'keydown']) document.addEventListener(type, unlock, true);
  // (the Android app lets sound start without a tap: the music plays as it opens)
  if (window.BYTEFALL_APP) unlock();

  document.addEventListener('visibilitychange', () => {
    if (!ctx || !timer) return;
    // (the Android app: it plays on in the background only from the MUSIC PLAYER)
    const playOn = window.BYTEFALL_APP ? document.body.classList.contains('player-open') : backgroundPlay;
    if (document.hidden && !playOn) ctx.suspend();
    else ctx.resume();
  });

  function setEnabled(on) {
    enabled = on;
    try { localStorage.setItem(STORAGE_KEY, enabled ? 'on' : 'off'); } catch (e) {}
    if (enabled) start();
    else stop();
  }

  return {
    isEnabled: () => enabled,
    toggle() {
      setEnabled(!enabled);
      return enabled;
    },
    tracks: () => TRACKS.map((t) => ({
      id: t.id,
      no: t.no, // (its number in the playlist: 01-16)
      free: !!t.free,
      name: t.title,
      // (its way of playing, when it isn't the track as it is, and the title with it)
      variant: RAMPING_TRACKS.has(t.id) && speedMode === 'full' ? 'FULL SPEED' : t.id === 'generated' && genMode === 'random' ? 'RANDOM' : '',
      get title() { return this.variant ? `${this.name} - ${this.variant}` : this.name; },
      locked: isLocked(t),
      need: t.free ? '' : Progress.unlock(unlockId(t)).need,
    })),
    // The playlist's 16 slots in order, each its track or null (not made yet)
    slots(n = 16) { const list = this.tracks(); return Array.from({ length: Math.max(n, ...list.map((t) => t.no)) }, (_, i) => list.find((t) => t.no === i + 1) || null); },
    currentTrack: () => trackId,
    // GENERATED: its seed (SONG OF THE DAY or RANDOM; a new one starts the song again if it's on)
    genMode: () => genMode,
    setGenMode(m) {
      genMode = m === 'random' ? 'random' : 'day';
      try { localStorage.setItem(GEN_KEY, genMode); } catch (e) {}
      if (timer && trackId === 'generated') this.play('generated');
    },
    // (GENERATED's song: its title, style, key, tempo and the rest)
    genSong,
    // A track for now, without starting the music if it's off (the SEASONAL theme's audio)
    useTrack(id) {
      const track = TRACKS.find((t) => t.id === id);
      if (!track || isLocked(track) || id === trackId) return;
      if (timer) this.play(id);
      else setTrack(id);
    },
    // The beat, for whatever moves to the music (the wandering bots' headphones): a quarter note's
    // length in seconds and how far into the current one the music is (0-1); null when silent
    // The drum hits as they're heard: { now (the audio clock, less the output's delay), hits: [{
    // time, low, high, snare, beat, bar }] } (the recent ones and the few scheduled just ahead)
    drums() {
      if (!timer || !enabled) return null;
      return { now: ctx.currentTime - (ctx.outputLatency || ctx.baseLatency || 0), hits: drumLog };
    },
    beat() {
      if (!timer || !engine || !enabled) return null;
      const at = step - (nextTime - ctx.currentTime) / engine.step; // (the 16th playing now)
      return { period: engine.step * 4, phase: (((at / 4) % 1) + 1) % 1 };
    },
    // The music's output analyser for the playlist visualizer; null when nothing is playing.
    getAnalyser: () => (timer ? analyser : null),
    getStereo: () => (timer ? stereo : null),
    // Selecting a track always starts it, restarting playback if another was playing.
    play(id) {
      const track = TRACKS.find((t) => t.id === id);
      if (!track || isLocked(track)) return;
      setTrack(id);
      stop();
      setEnabled(true);
      Progress.heardTrack(id);
    },
    getMode: () => mode,
    // Cycles repeat → sequence → shuffle. Switching mid-track keeps the current track going.
    cycleMode() {
      mode = MODES[(MODES.indexOf(mode) + 1) % MODES.length];
      try { localStorage.setItem(MODE_KEY, mode); } catch (e) {}
      if (timer) {
        if (fadeStarted) {
          session.gain.cancelScheduledValues(ctx.currentTime);
          session.gain.setTargetAtTime(1, ctx.currentTime, 0.3);
          fadeStarted = false;
        }
        loopsToPlay = Math.max(LOOPS_PER_TRACK, Math.floor(step / engine.loopSteps) + 1);
      }
      return mode;
    },
    onTrackChange(fn) {
      onTrackChange = fn;
    },
    // SOUND OUTPUT: PHONE, HEADPHONES or SPEAKERS (the sound effects follow it too)
    getOutput: () => outputId,
    setOutput(id) {
      if (!SOUND_OUTPUTS.some((o) => o.id === id)) return;
      outputId = id;
      try { localStorage.setItem('bytefall-sound-output', id); } catch (e) {}
      if (outChain) outChain.set(id);
      if (engine) for (const ch of engine.channels || []) ch.applied = undefined; // (its table now)
      if (typeof SFX !== 'undefined' && SFX.setOutput) SFX.setOutput(id);
    },
    isBackgroundPlay: () => backgroundPlay,
    setBackgroundPlay(on) {
      backgroundPlay = on;
      try { localStorage.setItem(BG_KEY, on ? 'on' : 'off'); } catch (e) {}
    },
    // After Full Access changes: a locked track that is current falls back to track 01.
    refreshUnlocks() {
      if (!isLocked(TRACKS.find((t) => t.id === trackId))) return;
      if (timer) this.play(TRACKS[0].id);
      else setTrack(TRACKS[0].id);
    },
    setIntensity(value) {
      gameIntensity = Math.max(0, Math.min(1, value));
      targetIntensity = fullMix || alwaysFull ? 1 : gameIntensity;
    },
    // MUSIC PLAYER: every layer in, whatever the game is doing
    hasSpeed: (id = trackId) => RAMPING_TRACKS.has(id),
    getSpeed: () => speedMode,
    setSpeed(m) {
      speedMode = m === 'full' ? 'full' : 'ramp';
      try { localStorage.setItem(SPEED_KEY, speedMode); } catch (e) {}
    },
    // The tracks with two ways to play, switched by tapping the track while it's the one on:
    // STACK OVERFLOW (ramping / FULL SPEED) and GENERATED (the SONG OF THE DAY / RANDOM: a new song)
    hasVariant: (id) => RAMPING_TRACKS.has(id) || id === 'generated',
    toggleVariant(id) {
      if (RAMPING_TRACKS.has(id)) this.setSpeed(speedMode === 'full' ? 'ramp' : 'full');
      else if (id === 'generated') this.setGenMode(genMode === 'day' ? 'random' : 'day');
    },
    setFullMix(on) {
      fullMix = on;
      targetIntensity = on || alwaysFull ? 1 : gameIntensity;
    },
    isFullInGame: () => alwaysFull,
    setFullInGame(on) {
      alwaysFull = on;
      try { localStorage.setItem('bytefall-music-full', on ? 'on' : 'off'); } catch (e) {}
      targetIntensity = fullMix || alwaysFull ? 1 : gameIntensity;
    },
    isPlaying: () => !!timer,
    // The next (dir 1) or previous (-1) playable track; NEXT in SHUFFLE picks one at random
    skip(dir) {
      const open = TRACKS.filter((t) => !isLocked(t));
      if (!open.length) return;
      const i = open.findIndex((t) => t.id === trackId);
      const id = dir > 0 && mode === 'shuffle' ? nextTrackId() : open[(i + dir + open.length) % open.length].id;
      this.play(id);
      if (onTrackChange) onTrackChange(trackId);
    },
  };
})();
