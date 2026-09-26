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
  const viz = createVisualizer(document.getElementById('mp-viz'), Music.getAnalyser, { bars: 40 });
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
  function open() {
    if (typeof setSettingsOpen === 'function') setSettingsOpen(false);
    el.hidden = false;
    document.body.classList.add('player-open');
    Music.setFullMix(true);
    render();
    requestAnimationFrame(loop);
  }
  function close() {
    el.hidden = true;
    document.body.classList.remove('player-open');
    Music.setFullMix(false);
  }

  document.getElementById('open-player-btn').addEventListener('click', open);
  document.getElementById('mp-close').addEventListener('click', close);
  document.addEventListener('keydown', (e) => {
    if (el.hidden) return;
    if (e.key === 'Escape') close();
    else if (e.key === ' ') { e.preventDefault(); playBtn.click(); }
    else if (e.key === 'ArrowRight') { Music.skip(1); after(); }
    else if (e.key === 'ArrowLeft') { Music.skip(-1); after(); }
    e.stopPropagation();
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
  bgBtn.addEventListener('click', () => {
    Music.setBackgroundPlay(!Music.isBackgroundPlay());
    if (typeof updateBgPlayBtn === 'function') updateBgPlayBtn();
    render();
  });
  document.getElementById('mp-viz-btn').addEventListener('click', () => viz.toggle());
  // SEQUENCE / SHUFFLE moving on by themselves: the display follows
  let shown = '';
  setInterval(() => {
    if (el.hidden) return;
    const now = `${Music.currentTrack()}:${Music.isEnabled()}`;
    if (now !== shown) render();
    shown = now;
  }, 400);
})();
