// MUSIC PLAYER (SETTINGS → PLAYLIST → OPEN MUSIC PLAYER): the soundtrack on its own, over the
// whole page, with every layer in (Music.setFullMix). A big visualizer (tap it for bars / wave),
// PREV / PLAY-PAUSE / NEXT, REPEAT / SEQUENCE / SHUFFLE, the track list and BACKGROUND PLAY.
// The game waits underneath (the VS CPU counts it as a panel and pauses).
(() => {
  const el = document.getElementById('music-player');
  const tracksEl = document.getElementById('mp-tracks');
  const trackEl = document.getElementById('mp-track');
  const stateEl = document.getElementById('mp-state');
  const playBtn = document.getElementById('mp-play');
  const bgBtn = document.getElementById('mp-bg-btn');
  const speedBtn = document.getElementById('mp-speed-btn');
  bgBtn.hidden = !!window.BYTEFALL_APP; // (the app: the player always plays on in the background)
  if (window.BYTEFALL_APP) document.querySelector('#music-player .mp-note').textContent = 'Every track plays with all its layers in. With the player open, the music keeps going with the screen off or in another app.';
  const viz = createVisualizer(document.getElementById('mp-viz'), Music.getAnalyser, {
    bars: 40, modes: ['bars', 'wave', 'scope', 'spectro', 'vu', 'radial', 'fluid', 'vector', 'matrix', 'bitgrid', 'terrain', 'plasma', 'tunnel'], key: 'bytefall-player-viz', getStereo: Music.getStereo,
  });
  const vizNameEl = document.getElementById('mp-viz-name');
  const showVizName = () => { vizNameEl.textContent = `// ${viz.name}`; };
  showVizName();
  const SLOTS = 16; // unmade tracks show as COMING SOON, as in the playlist

  const num = (n) => String(n + 1).padStart(2, '0');
  function render() {
    const tracks = Music.tracks();
    const current = tracks.findIndex((t) => t.id === Music.currentTrack());
    const playing = Music.isEnabled() && Music.isPlaying();
    trackEl.textContent = `${num(current)} ${tracks[current].title}`;
    stateEl.textContent = playing ? 'NOW PLAYING // FULL MIX' : 'PAUSED';
    playBtn.classList.toggle('playing', playing);
    playBtn.setAttribute('aria-label', playing ? 'Pause' : 'Play');
    document.querySelectorAll('#mp-modes button').forEach((b) => b.classList.toggle('active', b.dataset.mode === Music.getMode()));
    bgBtn.textContent = `BACKGROUND PLAY: ${Music.isBackgroundPlay() ? 'ON' : 'OFF'}`;
    bgBtn.classList.toggle('on', Music.isBackgroundPlay());
    // SPEED: for a track that speeds up as the stack climbs, held at its calm tempo or ramping up
    speedBtn.hidden = !Music.hasSpeed(Music.currentTrack());
    speedBtn.textContent = `SPEED: ${Music.getSpeed() === 'held' ? 'HELD' : 'RAMPING'}`;
    speedBtn.classList.toggle('on', Music.getSpeed() === 'ramp');
    tracksEl.innerHTML = '';
    for (let n = 0; n < Math.max(SLOTS, tracks.length); n++) {
      const t = tracks[n];
      const btn = document.createElement('button');
      btn.type = 'button';
      if (t && !t.locked) {
        btn.textContent = `${num(n)}  ${t.title}`;
        btn.classList.toggle('active', n === current);
        btn.classList.toggle('playing', n === current && playing);
        btn.addEventListener('click', () => {
          Music.play(t.id);
          after();
        });
      } else {
        btn.disabled = true;
        btn.textContent = `${num(n)}  ${t ? t.title : 'COMING SOON'}`;
        if (t) {
          btn.classList.add('locked');
          const need = document.createElement('span');
          need.className = 'need';
          need.textContent = `LV ${Progress.unlock(`track-${n + 1}`).goal}`;
          btn.appendChild(need);
        }
      }
      const li = document.createElement('li');
      li.appendChild(btn);
      tracksEl.appendChild(li);
    }
    updateMediaSession();
  }
  // Keeps the settings MUSIC button and achievements in step
  function after() {
    if (typeof updateMusicBtn === 'function') updateMusicBtn();
    if (typeof announce === 'function') announce(Progress.check());
    render();
  }

  // The phone's lock screen / notification controls, where the browser offers them
  function updateMediaSession() {
    if (!('mediaSession' in navigator)) return;
    try {
      const t = Music.tracks().find((x) => x.id === Music.currentTrack());
      navigator.mediaSession.metadata = new MediaMetadata({ title: t.title, artist: 'ByteFall', album: 'ByteFall OST' });
      navigator.mediaSession.playbackState = Music.isEnabled() ? 'playing' : 'paused';
    } catch (e) {}
  }
  if ('mediaSession' in navigator) {
    const on = (action, fn) => { try { navigator.mediaSession.setActionHandler(action, fn); } catch (e) {} };
    on('play', () => { if (!Music.isEnabled()) Music.toggle(); after(); });
    on('pause', () => { if (Music.isEnabled()) Music.toggle(); after(); });
    on('nexttrack', () => { Music.skip(1); after(); });
    on('previoustrack', () => { Music.skip(-1); after(); });
  }

  function loop() {
    if (el.hidden) return;
    viz.draw();
    requestAnimationFrame(loop);
  }
  // (the Android app: with the player open, the music keeps playing when the app is in the
  // background; tools/android/MainActivity.java)
  const toApp = (on) => { try { if (window.BytefallAndroid) window.BytefallAndroid.setPlayerOpen(on); } catch (e) {} };
  function open() {
    if (typeof setSettingsOpen === 'function') setSettingsOpen(false);
    el.hidden = false;
    document.body.classList.add('player-open');
    toApp(true);
    Music.setFullMix(true);
    render();
    requestAnimationFrame(loop);
  }
  // (X, Esc or the phone's back: back to SETTINGS, where it was opened from)
  function close() {
    el.hidden = true;
    document.body.classList.remove('player-open');
    toApp(false);
    Music.setFullMix(false);
    if (typeof setSettingsOpen === 'function') {
      setSettingsOpen(true);
      document.getElementById('open-player-btn').focus({ preventScroll: true });
    }
  }

  document.getElementById('open-player-btn').addEventListener('click', open);
  document.getElementById('mp-close').addEventListener('click', close);
  document.addEventListener('keydown', (e) => {
    if (el.hidden) return;
    if (e.key === 'Escape') close();
    else if (e.key === ' ') { e.preventDefault(); playBtn.click(); }
    else if (e.key === 'ArrowRight') { Music.skip(1); after(); }
    else if (e.key === 'ArrowLeft') { Music.skip(-1); after(); }
    e.stopImmediatePropagation(); // (not on to SETTINGS' own Esc, which would close it again)
  }, true);
  playBtn.addEventListener('click', () => {
    Music.toggle();
    after();
  });
  document.getElementById('mp-prev').addEventListener('click', () => { Music.skip(-1); after(); });
  document.getElementById('mp-next').addEventListener('click', () => { Music.skip(1); after(); });
  document.querySelectorAll('#mp-modes button').forEach((b) => b.addEventListener('click', () => {
    while (Music.getMode() !== b.dataset.mode) Music.cycleMode();
    if (typeof updateModeBtn === 'function') updateModeBtn();
    render();
  }));
  speedBtn.addEventListener('click', () => {
    Music.setSpeed(Music.getSpeed() === 'held' ? 'ramp' : 'held');
    render();
  });
  bgBtn.addEventListener('click', () => {
    Music.setBackgroundPlay(!Music.isBackgroundPlay());
    if (typeof updateBgPlayBtn === 'function') updateBgPlayBtn();
    render();
  });
  document.getElementById('mp-viz-btn').addEventListener('click', () => {
    viz.toggle();
    showVizName();
  });
  // SEQUENCE / SHUFFLE moving on by themselves: the display follows
  let shown = '';
  setInterval(() => {
    if (el.hidden) return;
    const now = `${Music.currentTrack()}:${Music.isEnabled()}`;
    if (now !== shown) render();
    shown = now;
  }, 400);
})();
