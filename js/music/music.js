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
  // free: always playable; track N (from 02) is unlocked by progress.js's track-N.
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
  ];
  let enabled = true;
  let backgroundPlay = false;
  let trackId = TRACKS[0].id; // the last track picked or played (saved), else track 01
  let mode = 'repeat';
  try {
    if (MODES.includes(localStorage.getItem(MODE_KEY))) mode = localStorage.getItem(MODE_KEY);
    enabled = localStorage.getItem(STORAGE_KEY) !== 'off';
    backgroundPlay = localStorage.getItem(BG_KEY) === 'on';
  } catch (e) {}
  const unlockId = (track) => `track-${TRACKS.indexOf(track) + 1}`;
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
  function advance() {
    if (mode === 'repeat') return;
    const end = loopsToPlay * engine.loopSteps;
    if (!fadeStarted && step >= end - Math.ceil(FADE_OUT / engine.step)) {
      fadeStarted = true;
      session.gain.setValueAtTime(1, nextTime);
      session.gain.linearRampToValueAtTime(0, nextTime + (end - step) * engine.step);
    }
    if (step >= end) {
      const old = session;
      setTimeout(() => old.disconnect(), (nextTime - ctx.currentTime + 1) * 1000);
      setTrack(nextTrackId());
      openSession(0.8);
      if (onTrackChange) onTrackChange(trackId);
    }
  }

  // Which channels count as which drum: the low hits (kick), the high ones (hats, ticks, shakers)
  const DRUM_KIND = { kick: 'low', sub: 'low', toms: 'low', hats: 'high', tick: 'high', shaker: 'high', tambourine: 'high', snare: 'snare', clap: 'snare' };
  let drumLog = [];
  function tick() {
    if (nextTime < ctx.currentTime) nextTime = ctx.currentTime + 0.02;
    const ahead = document.hidden ? HIDDEN_LOOKAHEAD : LOOKAHEAD;
    while (nextTime < ctx.currentTime + ahead) {
      advance();
      intensity += (targetIntensity - intensity) * INTENSITY_EASE;
      applyMix(engine, trackMix(trackId, outputId), intensity, nextTime);
      // (the drums as they're scheduled, for whatever moves to them: the wanderers' headphones)
      let hit = step % 4 === 0 ? { time: nextTime, beat: true, bar: step % 16 === 0 } : null;
      if (engine.record) engine.record((id) => { const k = DRUM_KIND[id]; if (k) { hit = hit || { time: nextTime }; hit[k] = true; } });
      engine.schedule(step, nextTime, intensity);
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

  document.addEventListener('visibilitychange', () => {
    if (!ctx || !timer) return;
    if (document.hidden && !backgroundPlay) ctx.suspend();
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
      title: t.title,
      locked: isLocked(t),
      need: t.free ? '' : Progress.unlock(unlockId(t)).need,
    })),
    currentTrack: () => trackId,
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
