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
  // (the visualizer's SOURCE: ByteFall's own music, or another source's, js/extsource.js)
  const vizAnalyser = () => (ExtSource.isOn() ? ExtSource.analyser() : Music.getAnalyser());
  const vizStereo = () => (ExtSource.isOn() ? ExtSource.stereo() : Music.getStereo());
  const viz = createVisualizer(document.getElementById('mp-viz'), vizAnalyser, {
    bars: 40, modes: ['bars', 'wave', 'scope', 'spectro', 'vu', 'radial', 'fluid', 'vector', 'vectorwide', 'lissajous', 'matrix', 'bitgrid', 'terrain', 'plasma', 'tunnel', 'orb', 'ocean', 'oceantri', 'oceanhex', 'oceantopo', 'oceandepth', 'topo', 'cloud'], key: 'bytefall-player-viz', getStereo: vizStereo,
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
    if (window.playerSource) window.playerSource.resume(); // (OTHER APPS picked last time: listening again)
    requestAnimationFrame(loop);
  }
  // (X, Esc or the phone's back: back to SETTINGS, where it was opened from)
  function close() {
    setFull(false);
    if (window.playerSource) window.playerSource.rest(); // (the microphone off with the player shut, back on when it opens; OTHER APPS listens on, so Android needn't ask again; its notification stops it)
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
    if (e.target.closest && e.target.closest('input')) { e.stopImmediatePropagation(); return; } // (typing a DENSITY: the keys are the box's)
    if (e.key === 'Escape' && isFull()) setFull(false);
    else if (e.key === 'Escape') close();
    else if (e.key === ' ') { e.preventDefault(); playBtn.click(); }
    else if (e.key === 'ArrowRight') { Music.skip(1); after(); }
    else if (e.key === 'ArrowLeft') { Music.skip(-1); after(); }
    e.stopImmediatePropagation(); // (not on to SETTINGS' own Esc, which would close it again)
  }, true);
  playBtn.addEventListener('click', () => {
    if (!Music.isEnabled() && ExtSource.isOn() && window.playerSource) window.playerSource.toBytefall(); // (ByteFall's music again: its source too)
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
  // (a tap on its left half: the style before; on its right half: the next one)
  // (FULL SCREEN: the outer quarter on either side switches styles, left the one before, right the
  // next; anywhere between plays or pauses the music, a sign flashing in the middle)
  const flashEl = document.getElementById('mp-viz-flash');
  document.getElementById('mp-viz-btn').addEventListener('click', (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const at = e.clientX ? (e.clientX - r.left) / r.width : 0.9;
    if (el.classList.contains('viz-full') && at > 0.25 && at < 0.75) {
      if (ExtSource.isOn()) return; // (another app's music: its own player plays and pauses it)
      playBtn.click();
      flashEl.classList.toggle('paused', !Music.isEnabled());
      flashEl.classList.remove('show');
      void flashEl.offsetWidth; // (the flash again)
      flashEl.classList.add('show');
      return;
    }
    viz.toggle(at < 0.5 ? -1 : 1);
    showVizName();
    markStyle();
  });
  // FULL SCREEN: the visualizer edge to edge (and the browser's own full screen where there is
  // one; the app always is), the screen kept awake; a tap still switches styles; the corner button,
  // Esc or back comes out. Its name and the way out fade after a few seconds untouched
  const fullBtn = document.getElementById('mp-viz-full-btn');
  const exitBtn = document.getElementById('mp-viz-exit');
  let wake = null;
  let calmTimer = 0;
  const isFull = () => el.classList.contains('viz-full');
  function stir() {
    el.classList.remove('viz-calm');
    clearTimeout(calmTimer);
    calmTimer = setTimeout(() => { if (isFull()) el.classList.add('viz-calm'); }, 2500);
  }
  async function keepAwake(on) {
    try {
      if (on && !wake && navigator.wakeLock) wake = await navigator.wakeLock.request('screen');
      if (!on && wake) { await wake.release(); wake = null; }
    } catch (e) { wake = null; }
  }
  // (it turns with the phone: the app's portrait lock let go while it's up, tools/android/
  // MainActivity.java; a browser in its own full screen turns anyway, an installed web app's
  // portrait lock let go too)
  function freeRotation(on) {
    try { if (window.BytefallAndroid && window.BytefallAndroid.setVizFullscreen) window.BytefallAndroid.setVizFullscreen(on); } catch (e) {} // (and the screen kept on)
    try {
      if (!window.BYTEFALL_APP && screen.orientation) {
        if (on && screen.orientation.unlock) screen.orientation.unlock();
        else if (!on && screen.orientation.lock) screen.orientation.lock('portrait').catch(() => {});
      }
    } catch (e) {}
  }
  function setFull(on) {
    if (on === isFull()) return;
    if (on) setDrawer(false);
    el.classList.toggle('viz-full', on);
    exitBtn.hidden = !on;
    keepAwake(on);
    freeRotation(on);
    if (on) {
      stir();
      if (!window.BYTEFALL_APP && document.documentElement.requestFullscreen && !document.fullscreenElement) {
        document.documentElement.requestFullscreen({ navigationUI: 'hide' })
          .then(() => { try { if (screen.orientation && screen.orientation.lock) screen.orientation.lock('any').catch(() => {}); } catch (e) {} }) // (turning with the phone)
          .catch(() => {});
      }
    } else {
      el.classList.remove('viz-calm');
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    }
  }
  window.playerFullscreen = { on: isFull, exit: () => setFull(false) };
  fullBtn.addEventListener('click', () => setFull(true));
  exitBtn.addEventListener('click', () => setFull(false));
  el.addEventListener('pointerdown', () => { if (isFull()) stir(); }, true);
  document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement && isFull()) setFull(false); }); // (the browser's own way out)
  document.addEventListener('visibilitychange', () => { if (!document.hidden && isFull()) { wake = null; keepAwake(true); } });

  // SOURCE: BYTEFALL, then (the app) OTHER APPS (whatever the phone is playing, Pandora and all) and
  // MICROPHONE, or (the web) MICROPHONE; a tap moves on to the next. Another source pauses
  // ByteFall's music, so the two don't mix; while one listens, the corner shows what's coming in
  const sourceBtn = document.getElementById('mp-viz-source-btn');
  const hintEl = document.querySelector('#mp-viz-btn .mp-viz-hint');
  let want = null; // (the source picked: kept for when the player opens again)
  function showSource(note) {
    const other = ExtSource.isOn();
    sourceBtn.textContent = note || (other ? ExtSource.label() : 'BYTEFALL');
    sourceBtn.classList.toggle('other', other);
    if (!other) hintEl.textContent = 'TAP TO SWITCH';
  }
  async function useSource(kind) {
    want = kind;
    ExtSource.stop();
    if (!kind) { showSource(); return; }
    if (Music.isEnabled()) { Music.toggle(); after(); }
    showSource('ASKING...');
    const st = await ExtSource.start(kind);
    if (st === 'on') { showSource(); return; }
    want = null;
    showSource(st === 'denied' ? 'NO ACCESS' : 'UNAVAILABLE');
    setTimeout(() => showSource(), 2200);
  }
  sourceBtn.addEventListener('click', () => {
    const list = [null, ...ExtSource.kinds()];
    if (ExtSource.ended()) { useSource('apps'); return; } // (stopped from the notification: listening again)
    const at = ExtSource.isOn() ? list.indexOf(ExtSource.kind()) : 0;
    useSource(list[(at + 1) % list.length]);
  });
  setInterval(() => { if (!el.hidden && ExtSource.isOn()) hintEl.textContent = ExtSource.info(); }, 300);
  window.playerSource = { toBytefall: () => useSource(null), resume: () => { if (want && !ExtSource.isOn()) useSource(want); }, rest: () => { if (ExtSource.isOn() && ExtSource.kind() !== 'apps') { const keep = want; ExtSource.stop(); showSource(); want = keep; } } };

  // The STYLES drawer: every style by name, the one showing lit; a tap goes straight to it
  const drawerBtn = document.getElementById('mp-viz-drawer-btn');
  const drawer = document.getElementById('mp-viz-drawer');
  drawer.innerHTML = viz.styles().map((st) => `<button type="button" data-style="${st.id}">${st.name}</button>`).join('')
    + '<div class="mp-density" hidden><label for="mp-density-in">DENSITY</label><input id="mp-density-in" type="number" inputmode="numeric" min="100" max="6000" step="50"><span>POINTS IN VIEW</span><span class="mp-density-now"></span><span class="mp-density-btns"><button type="button" class="mp-density-reset">DEFAULT</button><button type="button" class="mp-density-all">ALL DEFAULTS</button></span></div>';
  // DENSITY: for the oceans with points, how many points are in view at once (saved per style); the
  // count drawn just now beside it; DEFAULT puts this style's back, ALL DEFAULTS every ocean's
  const densityEl = drawer.querySelector('.mp-density');
  const densityIn = densityEl.querySelector('input');
  function showDensity() {
    const d = viz.density;
    densityEl.hidden = !d;
    if (!d) return;
    if (document.activeElement !== densityIn) densityIn.value = d.value;
    densityEl.querySelector('.mp-density-now').textContent = d.inView ? `NOW ${d.inView.toLocaleString('en-US')}` : '';
    densityEl.querySelector('.mp-density-reset').disabled = d.value === d.def;
    densityEl.querySelector('.mp-density-all').disabled = !viz.densitiesChanged;
  }
  densityIn.addEventListener('change', () => { viz.setDensity(Number(densityIn.value)); showDensity(); });
  densityIn.addEventListener('keydown', (e) => { if (e.key === 'Enter') densityIn.blur(); });
  densityEl.querySelector('.mp-density-reset').addEventListener('click', () => { const d = viz.density; if (d) viz.setDensity(d.def); showDensity(); });
  densityEl.querySelector('.mp-density-all').addEventListener('click', () => { viz.resetDensities(); showDensity(); }); // (every ocean's)
  setInterval(() => { if (!drawer.hidden) showDensity(); }, 400);
  function markStyle() { drawer.querySelectorAll('[data-style]').forEach((b) => b.classList.toggle('active', b.dataset.style === viz.mode)); showDensity(); }
  markStyle();
  const setDrawer = (open) => { drawer.hidden = !open; drawerBtn.setAttribute('aria-expanded', String(open)); };
  drawerBtn.addEventListener('click', () => setDrawer(drawer.hidden));
  // (it lies over the controls: a tap anywhere else puts it away)
  document.addEventListener('pointerdown', (e) => { if (!drawer.hidden && !e.target.closest('#mp-viz-drawer, #mp-viz-drawer-btn')) setDrawer(false); }, true);
  drawer.addEventListener('click', (e) => {
    const b = e.target.closest('[data-style]');
    if (!b) return;
    viz.set(b.dataset.style);
    showVizName();
    markStyle();
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
