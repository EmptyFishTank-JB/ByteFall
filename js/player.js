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
  bgBtn.hidden = !!window.BYTEFALL_APP; // (the app: the player always plays on in the background)
  if (window.BYTEFALL_APP) document.querySelector('#music-player .mp-note').textContent = 'Every track plays with all its layers in. With the player open, the music keeps going with the screen off or in another app.';
  // (the visualizer's SOURCE: ByteFall's own music, or another source's, js/extsource.js)
  const vizAnalyser = () => (ExtSource.isOn() ? ExtSource.analyser() : Music.getAnalyser());
  const vizStereo = () => (ExtSource.isOn() ? ExtSource.stereo() : Music.getStereo());
  const viz = createVisualizer(document.getElementById('mp-viz'), vizAnalyser, {
    bars: 40, modes: VIZ_ALL, key: 'bytefall-player-viz', getStereo: vizStereo,
  });
  const vizNameEl = document.getElementById('mp-viz-name');
  const showVizName = () => { vizNameEl.textContent = `// ${viz.name}`; };
  showVizName();
  const SLOTS = 16; // unmade tracks show as COMING SOON, as in the playlist
  // SONG CODES: the one playing (tap: copied, to play again later or share), or one typed in
  const codeCopy = document.getElementById('mp-code-copy');
  const codeEnter = document.getElementById('mp-code-enter');
  const codeForm = document.getElementById('mp-code-form');
  const codeInput = document.getElementById('mp-code-input');
  const codeMsg = document.getElementById('mp-code-msg');
  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(text).then(() => true, () => copyOld(text));
    return Promise.resolve(copyOld(text));
  }
  function copyOld(text) { // (where the clipboard API isn't offered: a hidden box, selected and copied)
    const t = document.createElement('textarea');
    t.value = text;
    t.style.cssText = 'position:fixed;opacity:0;';
    document.body.appendChild(t);
    t.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch (e) {}
    t.remove();
    return ok;
  }
  codeCopy.addEventListener('click', () => {
    const code = Music.genCode();
    if (!code) return;
    copyText(code).then((ok) => {
      codeCopy.dataset.copied = '1';
      codeCopy.textContent = ok ? 'COPIED' : code;
      setTimeout(() => { delete codeCopy.dataset.copied; render(); }, 1400);
    });
  });
  function codeEntry(on) {
    codeForm.hidden = !on;
    codeEnter.hidden = on;
    codeMsg.textContent = '';
    if (on) { codeInput.value = ''; codeInput.focus(); }
    render();
  }
  codeEnter.addEventListener('click', () => codeEntry(true));
  document.getElementById('mp-code-cancel').addEventListener('click', () => codeEntry(false));
  codeInput.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.preventDefault(); codeEntry(false); } });
  codeForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const why = await Music.playCode(codeInput.value);
    if (why) { codeMsg.textContent = why; codeInput.select(); return; }
    codeEntry(false);
    after();
  });

  const num = (n) => String(n + 1).padStart(2, '0');
  function render() {
    const tracks = Music.slots(SLOTS); // (by number: an unmade one is a gap)
    const current = tracks.findIndex((t) => t && t.id === Music.currentTrack());
    const playing = Music.isEnabled() && Music.isPlaying();
    trackEl.textContent = `${num(current)} ${tracks[current].title}`;
    // (GENERATED: the song it wrote)
    const song = tracks[current].id === 'generated' && Music.genSong();
    stateEl.textContent = !playing ? 'PAUSED' : song ? `NOW PLAYING // ${song.title}` : 'NOW PLAYING // FULL MIX';
    // (its SONG CODE, to copy: on track 16, once it's written one)
    codeCopy.hidden = !song || !codeForm.hidden;
    if (song && !codeCopy.dataset.copied) codeCopy.textContent = `CODE ${song.code}`;
    codeCopy.classList.add('code');
    playBtn.classList.toggle('playing', playing);
    playBtn.setAttribute('aria-label', playing ? 'Pause' : 'Play');
    document.querySelectorAll('#mp-modes button').forEach((b) => b.classList.toggle('active', b.dataset.mode === Music.getMode()));
    bgBtn.textContent = `BACKGROUND PLAY: ${Music.isBackgroundPlay() ? 'ON' : 'OFF'}`;
    bgBtn.classList.toggle('on', Music.isBackgroundPlay());
    tracksEl.innerHTML = '';
    for (let n = 0; n < tracks.length; n++) {
      const t = tracks[n];
      const btn = document.createElement('button');
      btn.type = 'button';
      // (the number, then the title: a long one wraps under itself)
      btn.innerHTML = '<span class="mp-n"></span><span class="mp-t"></span>';
      btn.firstChild.textContent = num(n);
      if (t && !t.locked) {
        btn.lastChild.textContent = t.name;
        if (t.variant) { const v = document.createElement('span'); v.className = 'mp-v'; v.textContent = `- ${t.variant}`; btn.lastChild.appendChild(v); }
        btn.classList.toggle('active', n === current);
        btn.classList.toggle('playing', n === current && playing);
        btn.addEventListener('click', () => {
          // (the one playing, tapped again: its other way, if it has one)
          if (n === current && playing && Music.hasVariant(t.id)) Music.toggleVariant(t.id);
          else Music.play(t.id);
          after();
        });
      } else {
        btn.disabled = true;
        btn.lastChild.textContent = t ? t.title : 'COMING SOON';
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
    if (e.target.closest && e.target.closest('input')) { e.stopImmediatePropagation(); return; } // (typing a setting: the keys are the box's)
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
  drawer.innerHTML = viz.styles().map((st, i, all) => `${!i || all[i - 1].group !== st.group ? `<div class="mp-viz-group">${st.group}</div>` : ''}<button type="button" data-style="${st.id}">${st.name}</button>`).join('') + '<div class="viz-set mp-viz-set" hidden></div>'; // (under each group's heading)
  // SETTINGS: the style showing's own (vizSettingsPanel, viz.js), under the styles
  const setPanel = vizSettingsPanel(drawer.querySelector('.viz-set'), viz);
  setInterval(() => { if (!drawer.hidden) setPanel.refresh(); }, 400);
  function markStyle() { drawer.querySelectorAll('[data-style]').forEach((b) => b.classList.toggle('active', b.dataset.style === viz.mode)); setPanel.refresh(); }
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
