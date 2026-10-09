// START SCREEN: a fresh launch (see the inline script in index.html) opens on the title over the
// twinkling starlight with TAP TO START blinking, on a card the game card's own size and place (laid
// over it: fitStart). A tap (or Enter / Space) fades what's on the card out, its border staying, and
// the game card's contents in, within the same border: the first time the game is ever opened the
// TUTORIAL (tutorial.js), after that the main menu. The tap also counts as the gesture that lets the music start.
// BACK (the phone's back button, or the browser's) outside a game comes back here (showStart).
(() => {
  const screen = document.getElementById('start-screen');
  const black = document.getElementById('start-black');
  if (!screen) return;
  // (a refresh after START: the game straight away, the screen kept for BACK)
  if (document.documentElement.classList.contains('no-start')) screen.hidden = true;
  const INTRO_KEY = 'bytefall-intro-done';
  const FADE_MS = 600;
  let starting = false;
  const firstTime = () => {
    try { return !localStorage.getItem(INTRO_KEY); } catch (e) { return false; }
  };

  function start() {
    if (starting) return;
    starting = true;
    try { sessionStorage.setItem('bytefall-started', '1'); } catch (e) {} // (a refresh now skips this screen)
    inGameHistory();
    screen.classList.add('starting');
    SFX.play('static');
    setTimeout(() => {
      card.classList.add('leaving'); // (its contents fade; the border stays, the game card's under it)
      setTimeout(() => {
        screen.hidden = true;
        card.classList.remove('leaving');
        cardIn();
        if (typeof gameWalkers !== 'undefined') gameWalkers.start(); // (the game card's, held while this was up)
        if (firstTime()) {
          try { localStorage.setItem(INTRO_KEY, '1'); } catch (e) {}
          // The first open: straight into the tutorial (it can be left any time with EXIT)
          mode = 'tutorial';
          daily = false;
          resetNow();
        } else showHome(); // (the main menu)
        requestAnimationFrame(() => fitBoard());
      }, FADE_MS);
    }, 350); // (a quick flicker of TAP TO START first)
  }
  // The game card's contents fading in (or out) inside its border, which stays
  const crt = document.querySelector('.crt');
  function cardIn() {
    crt.classList.remove('card-out', 'card-in');
    void crt.offsetWidth;
    crt.classList.add('card-in');
    setTimeout(() => crt.classList.remove('card-in'), FADE_MS + 50);
  }
  // The start card laid exactly over the game card: the same size and place (and so the season's
  // lights, strung down the game card's sides, run down this one's too)
  function fitStart() {
    if (screen.hidden || !crt) return;
    const r = crt.getBoundingClientRect();
    if (r.width < 60 || r.height < 60) return;
    // (from the screen's own corner, not the window's: with the ad banner at the top, the screen
    // already starts under it, and the window's numbers would count the banner twice)
    const o = screen.getBoundingClientRect();
    Object.assign(card.style, { position: 'absolute', flex: 'none', left: `${r.left - o.left}px`, top: `${r.top - o.top}px`, width: `${r.width}px`, height: `${r.height}px` });
    placeStart();
  }

  // Back to this screen (BACK outside a game): through black, as it went
  function showStart() {
    if (!screen.hidden) return;
    crt.classList.add('card-out'); // (the game card's contents fade; then this card's fade in over it, in the same border)
    setTimeout(() => {
      setRecordsOpen(false);
      setSettingsOpen(false);
      document.documentElement.classList.remove('no-start');
      screen.classList.remove('starting');
      starting = false;
      screen.hidden = false;
      try { sessionStorage.removeItem('bytefall-started'); } catch (e) {}
      window.startWalkers.start();
      fitStart();
      card.classList.add('entering');
      void card.offsetWidth;
      card.classList.remove('entering');
      crt.classList.remove('card-out');
      startBtn.focus({ preventScroll: true });
    }, FADE_MS);
  }
  window.showStartScreen = showStart;
  // BACK: the start screen is the history entry under the game's, so the phone's back button
  // comes back from the game to it (and from it, out of the app as usual)
  function inGameHistory() {
    if (!history.state || !history.state.bytefall) history.pushState({ bytefall: 'game' }, '');
  }
  if (screen.hidden) inGameHistory();
  window.addEventListener('popstate', () => {
    if (!screen.hidden) return; // (on this screen: the next back leaves)
    // An open panel closes first; a game goes back to the main menu (paused, for RESUME); the
    // tutorial stays (it has its own EXIT); the main menu goes back to this screen
    const player = document.getElementById('music-player');
    const panel = !recordsEl.hidden || !settingsEl.hidden || !player.hidden;
    if (!player.hidden && window.playerFullscreen && window.playerFullscreen.on()) { // (its full screen visualizer: out of it)
      window.playerFullscreen.exit();
      history.pushState({ bytefall: 'game' }, '');
      return;
    }
    if (!player.hidden) { // (the music player: back to SETTINGS)
      document.getElementById('mp-close').click();
      history.pushState({ bytefall: 'game' }, '');
      return;
    }
    if (panel || !homeOpen) {
      setRecordsOpen(false);
      setSettingsOpen(false);
      if (!panel) showHome();
      history.pushState({ bytefall: 'game' }, '');
      return;
    }
    showStart();
  });

  // WANDERERS (wanderers.js) along the bottom of the card while it's up
  const lane = document.createElement('div');
  lane.className = 'start-walkers';
  screen.querySelector('.start-card').appendChild(lane);
  window.startWalkers = createWanderers(lane, () => !screen.hidden && !document.documentElement.classList.contains('saver-on'));

  const startBtn = document.getElementById('start-btn');
  startBtn.addEventListener('click', start);

  // START sits under the tagline as far as the tagline sits under the title, measured letter to
  // letter (the drawn letters, not their line boxes, which differ from font to font)
  const card = screen.querySelector('.start-card');
  const title = screen.querySelector('.start-title h1');
  const tagline = screen.querySelector('.start-tagline');
  const measure = document.createElement('canvas').getContext('2d');
  function ink(el) {
    const cs = getComputedStyle(el);
    measure.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    const m = measure.measureText(el.textContent);
    const range = document.createRange();
    range.selectNodeContents(el);
    const baseline = range.getBoundingClientRect().top + m.fontBoundingBoxAscent;
    return { top: baseline - m.actualBoundingBoxAscent, bottom: baseline + m.actualBoundingBoxDescent };
  }
  function placeStart() {
    if (screen.hidden || !measure || !('fontBoundingBoxAscent' in TextMetrics.prototype)) return;
    const head = ink(title);
    const tag = ink(tagline);
    const top = tag.bottom + (tag.top - head.bottom) - card.getBoundingClientRect().top - card.clientTop;
    startBtn.style.top = `${Math.round(top)}px`;
    startBtn.style.bottom = 'auto';
  }
  fitStart();
  window.addEventListener('resize', fitStart);
  if (window.ResizeObserver && crt) new ResizeObserver(fitStart).observe(crt);
  if (document.fonts) {
    document.fonts.ready.then(placeStart);
    document.fonts.addEventListener('loadingdone', placeStart);
  }
  // While it's up, keys don't reach the game; Enter and Space start
  document.addEventListener('keydown', (e) => {
    if (screen.hidden) return;
    e.stopPropagation();
    e.preventDefault();
    if (e.key === 'Enter' || e.key === ' ') start();
  }, true);
  startBtn.focus({ preventScroll: true });
})();
