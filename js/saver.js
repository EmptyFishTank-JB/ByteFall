// SCREEN SAVER: after 90 seconds without a touch (or a key), the screen goes black but for the
// wanderers doing their thing (wanderers.js, visitors and seasons and all), to save battery. Not
// while a timed game runs (a BLITZ clock, a VS match). Everything behind it rests: the background
// animations stop (grid-bg.js), the other wanderers go, the menus and the player close; the music
// plays on. A bot can be poked as ever; a tap anywhere else (or a key) wakes the screen, and that
// tap goes no further. It comes on with a quick pixelated fade: black blocks filling the screen
// in a random order (and breaks up the same way, quicker, on waking). Every minute the wanderers
// move to another height (no burn-in).
// SETTINGS → SCREEN SAVER turns it off.
(() => {
  const IDLE_MS = 90000;
  const root = document.documentElement;
  const saver = document.createElement('div');
  saver.className = 'saver';
  saver.hidden = true;
  const lane = document.createElement('div');
  lane.className = 'start-walkers saver-lane';
  saver.appendChild(lane);
  const pixels = document.createElement('canvas');
  pixels.className = 'saver-pixels';
  saver.appendChild(pixels);

  // The pixelated fade: blocks of black filling in (or clearing) in a random order, in steps
  const BLOCK = 24;
  let fading = 0;
  function pixelFade(into, ms, done) {
    cancelAnimationFrame(fading);
    const w = Math.ceil(innerWidth / BLOCK);
    const h = Math.ceil(innerHeight / BLOCK);
    pixels.width = w;
    pixels.height = h;
    const ctx = pixels.getContext('2d');
    ctx.fillStyle = '#000';
    if (into) ctx.clearRect(0, 0, w, h); else ctx.fillRect(0, 0, w, h);
    const cells = Array.from({ length: w * h }, (_, i) => i);
    for (let i = cells.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [cells[i], cells[j]] = [cells[j], cells[i]]; }
    const STEPS = 8;
    const t0 = performance.now();
    let drawn = 0;
    const step = (now) => {
      const upTo = Math.min(cells.length, Math.ceil((Math.min(1, (now - t0) / ms) * STEPS) / STEPS * cells.length) || 0);
      for (; drawn < upTo; drawn++) {
        const c = cells[drawn];
        if (into) ctx.fillRect(c % w, Math.floor(c / w), 1, 1);
        else ctx.clearRect(c % w, Math.floor(c / w), 1, 1);
      }
      if (drawn < cells.length) fading = requestAnimationFrame(step);
      else done();
    };
    fading = requestAnimationFrame(step);
  }
  document.body.appendChild(saver);
  const walkers = createWanderers(lane, () => root.classList.contains('saver-on'));

  const btn = document.getElementById('saver-btn');
  let enabled = storage.get('bytefall-saver') !== 'off';
  const showBtn = () => {
    btn.textContent = `SCREEN SAVER: ${enabled ? 'ON' : 'OFF'}`;
    btn.classList.toggle('on', enabled);
  };
  btn.addEventListener('click', () => {
    enabled = !enabled;
    storage.set('bytefall-saver', enabled ? 'on' : 'off');
    showBtn();
  });
  showBtn();

  let lastActive = performance.now();
  let moveTimer = 0;
  const moveLane = () => { lane.style.setProperty('--y', `${Math.round(20 + Math.random() * 60)}%`); };
  function show() {
    const player = document.getElementById('music-player');
    if (!player.hidden) document.getElementById('mp-close').click();
    setRecordsOpen(false);
    setSettingsOpen(false);
    saver.hidden = false;
    saver.classList.add('fading');
    pixelFade(true, 480, () => { // (then black, and the wanderers)
      saver.classList.remove('fading');
      root.classList.add('saver-on');
      moveLane();
      moveTimer = setInterval(moveLane, 60000);
      walkers.start();
    });
  }
  function hide() {
    if (saver.classList.contains('fading')) return;
    root.classList.remove('saver-on'); // (the wanderers go at once; the game wakes under the blocks)
    clearInterval(moveTimer);
    lastActive = performance.now();
    gameWalkers.start();
    if (window.startWalkers) window.startWalkers.start();
    saver.classList.add('fading');
    pixelFade(false, 300, () => {
      saver.classList.remove('fading');
      saver.hidden = true;
    });
  }
  // Anything the player does keeps it away
  for (const type of ['pointerdown', 'keydown', 'wheel', 'touchstart']) {
    document.addEventListener(type, () => { if (saver.hidden) lastActive = performance.now(); }, { capture: true, passive: true });
  }
  setInterval(() => {
    if (!saver.hidden || !enabled || document.hidden) return; // (up, fading, or off)
    if (performance.now() - lastActive > IDLE_MS && !timedRunning()) show();
  }, 2000);
  // Waking it: a tap on the black (a bot's poke stays a poke), or any key; neither goes further
  saver.addEventListener('pointerdown', (e) => e.stopPropagation());
  saver.addEventListener('click', (e) => {
    e.stopPropagation();
    if (e.target.closest('.walker, .visitor')) return;
    hide();
  });
  document.addEventListener('keydown', (e) => {
    if (saver.hidden) return;
    if (saver.classList.contains('fading') && !root.classList.contains('saver-on')) return;
    e.stopPropagation();
    e.preventDefault();
    hide();
  }, true);
  // (for the dev tests)
  window.screenSaver = { show, hide, walkers };
})();
