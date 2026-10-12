// START SCREEN: a fresh launch (see the inline script in bytefall.html) opens on the title over the
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
  const INTRO_KEY = 'bytefall-intro-done'; // (the first START ever: the tutorial next; not the title's intro)
  const FADE_MS = 600;
  let starting = false;
  let introSkip = null; // (the title's intro, while it plays: below)
  let introAlign = null;
  const firstTime = () => {
    try { return !localStorage.getItem(INTRO_KEY); } catch (e) { return false; }
  };

  function start() {
    if (starting) return;
    starting = true;
    if (introSkip) introSkip(); // (START, or Enter, before the intro's done)
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
    if (introAlign) introAlign();
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

  // START under the tagline (bytefall.html's placeStartBtn, run first as the page loads, so it's in
  // its place from the first paint): again as the card's fitted and the fonts load
  const card = screen.querySelector('.start-card');
  function placeStart() {
    if (!screen.hidden) window.placeStartBtn();
  }
  fitStart();
  window.addEventListener('resize', fitStart);
  if (window.ResizeObserver && crt) new ResizeObserver(fitStart).observe(crt);
  if (document.fonts) {
    document.fonts.ready.then(placeStart);
    document.fonts.addEventListener('loadingdone', placeStart);
  }
  // THE TITLE's INTRO, on a launch (bytefall.html marks the card intro-wait before the first paint, so
  // the title and START are never seen in place first): one of a few, never the same one twice
  // running (?intro=drop and the like picks one). It plays on a copy of the title laid over the
  // real one, which never moves (START is placed by it), then the tagline types in and START
  // flickers on like a neon sign. A tap, or a key, skips to the end. (No sounds: a browser plays
  // none before the first tap.)
  //   DROP     the title falls from the top, gathering speed, and lands hard: a squash, a jolt, and
  //            an amber band under it bursting into pixels and binary dust
  //   BIT      the title falls as a bit does on the board, a row at a time, ticking down, a fading
  //            ghost of it left at each row it passes, and lands with a bit's little bump, a puff and
  //            a ghost swelling out from where it landed
  //   RAIN     its letters fall one by one, like bits down their columns, each landing in a puff
  //   DECRYPT  scrambled glyphs, locking into its letters one by one
  //   POWER    an old CRT switching on: a bright line opening out into the title
  const INTROS = ['drop', 'bit', 'rain', 'decrypt', 'power'];
  const INTRO_LAST = 'bytefall-intro-last';
  const FALL_STEP = 46; // (px a step: about a row of the board)
  const FALL_MS = 40; // (a step's time: about a falling bit's)
  function intro() {
    if (!card.classList.contains('intro-wait')) return;
    if (screen.hidden) { card.classList.remove('intro-wait'); return; }
    const asked = new URLSearchParams(location.search).get('intro');
    let last = null;
    try { last = localStorage.getItem(INTRO_LAST); } catch (e) {}
    const pool = INTROS.filter((k) => k !== last);
    const kind = INTROS.includes(asked) ? asked : pool[Math.floor(Math.random() * pool.length)];
    try { localStorage.setItem(INTRO_LAST, kind); } catch (e) {}
    // (the copy, exactly over the real title)
    const real = card.querySelector('.start-title');
    const ov = real.cloneNode(true);
    ov.classList.add('start-intro');
    ov.setAttribute('aria-hidden', 'true');
    introAlign = () => { // (to the fraction of a pixel, so the hand-back at the end can't be seen)
      const r = real.getBoundingClientRect();
      const c = card.getBoundingClientRect();
      Object.assign(ov.style, { left: `${r.left - c.left - card.clientLeft}px`, top: `${r.top - c.top - card.clientTop}px`, width: `${r.width}px` });
    };
    introAlign();
    real.after(ov);
    card.classList.replace('intro-wait', 'intro-run');
    const h = ov.querySelector('h1');
    const tag = ov.querySelector('.start-tagline');
    const words = tag.textContent;
    tag.textContent = '';
    const range = document.createRange();
    range.selectNodeContents(h);
    const ink = range.getBoundingClientRect(); // (the title's words, before anything moves)
    const above = ov.offsetTop + h.offsetTop + h.offsetHeight + 8; // (from just over the card's top)
    const timers = [];
    const anims = [];
    let ended = false;
    const later = (ms, fn) => timers.push(setTimeout(() => { if (!ended) fn(); }, ms));
    const play = (el, frames, opts) => { const a = el.animate(frames, opts); anims.push(a); return a; };
    const landed = (a, fn) => a.finished.then(() => { if (!ended) fn(); }).catch(() => {});
    const fx = (targets) => { if (typeof FX !== 'undefined') FX.burst(targets); };
    // The end: the real title back where the copy was; START lit (flickering on, unless skipped)
    function end(skipped) {
      if (ended) return;
      ended = true;
      timers.forEach((t) => { clearTimeout(t); clearInterval(t); });
      anims.forEach((a) => a.cancel());
      ov.remove();
      card.classList.remove('intro-run');
      if (!skipped) startBtn.classList.add('neon');
      screen.removeEventListener('pointerdown', skip, true);
      document.removeEventListener('keydown', skip, true);
      introSkip = introAlign = null;
    }
    const skip = () => end(true);
    introSkip = skip;
    screen.addEventListener('pointerdown', skip, true);
    document.addEventListener('keydown', skip, true);

    // (the title's letters, each a box of its own: BYTE's in the title's color, FALL's in the accent)
    function letters() {
      const out = [];
      (function split(node) {
        for (const ch of [...node.childNodes]) {
          if (ch.nodeType !== 3) { split(ch); continue; }
          const frag = document.createDocumentFragment();
          for (const c of ch.textContent) {
            const l = document.createElement('span');
            l.className = 'intro-l';
            l.textContent = c;
            frag.appendChild(l);
            out.push(l);
          }
          ch.replaceWith(frag);
        }
      })(h);
      return out;
    }
    const amber = (l) => l.parentNode !== h; // (FALL's)
    // The tagline typing in, a block cursor on the next letter (the rest held, unseen, so nothing shifts)
    function typeTag(then) {
      let i = 0;
      (function step() {
        if (i >= words.length) { tag.textContent = words; then(); return; }
        const typed = document.createElement('span');
        typed.textContent = words.slice(0, i);
        const cur = document.createElement('span');
        cur.className = 'intro-cursor';
        cur.textContent = words[i];
        const rest = document.createElement('span');
        rest.className = 'intro-rest';
        rest.textContent = words.slice(i + 1);
        tag.replaceChildren(typed, cur, rest);
        i++;
        later(30, step);
      })();
    }

    const KINDS = {
      drop(then) {
        h.style.transformOrigin = '50% 90%';
        const fall = play(h, [{ transform: `translateY(${-above}px)` }, { transform: 'none' }], { duration: 560, delay: 250, easing: 'cubic-bezier(0.55, 0, 0.9, 0.5)', fill: 'backwards' });
        landed(fall, () => {
          play(h, [{ transform: 'scale(1.1, 0.78)', filter: 'brightness(1.8)' }, { transform: 'scale(0.96, 1.05)', offset: 0.45 }, { transform: 'none', filter: 'none' }], { duration: 320, easing: 'ease-out' });
          play(card, [{ transform: 'translateY(4px)' }, { transform: 'translateY(-2px)', offset: 0.4 }, { transform: 'none' }], { duration: 220, easing: 'ease-out' });
          // (the amber band: out from the middle under the title, then bursting)
          const o = ov.getBoundingClientRect();
          const band = document.createElement('i');
          band.className = 'intro-band';
          Object.assign(band.style, { left: `${ink.left - o.left}px`, top: `${ink.bottom - o.top - 4}px`, width: `${ink.width}px` });
          ov.appendChild(band);
          const open = play(band, [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: 150, easing: 'ease-out', fill: 'forwards' });
          landed(open, () => {
            fx([{ rect: band.getBoundingClientRect(), type: 'warning' }]);
            play(band, [{ opacity: 1 }, { opacity: 0 }], { duration: 220, fill: 'forwards' });
          });
          later(450, then);
        });
      },
      bit(then) {
        const n = Math.max(6, Math.round(above / FALL_STEP));
        const step = FALL_MS * 1.5;
        // (its ghosts: a copy left at each row it falls past, fading as it goes on down, and one where
        // it lands, swelling out as it fades; placed from where it sits before it moves)
        const o = ov.getBoundingClientRect();
        const r = h.getBoundingClientRect();
        const fall = play(h, [{ transform: `translateY(${-above}px)` }, { transform: 'none' }], { duration: n * step, delay: 250, easing: `steps(${n}, end)`, fill: 'backwards' });
        const ghost = (y) => {
          const gh = h.cloneNode(true);
          gh.className = 'intro-ghost';
          Object.assign(gh.style, { left: `${r.left - o.left}px`, top: `${r.top - o.top}px`, width: `${r.width}px`, transform: `translateY(${y}px)` });
          ov.appendChild(gh);
          return gh;
        };
        for (let k = 0; k < n; k++) {
          const y = -above * (1 - k / n); // (where it stood that step)
          play(ghost(y), [{ opacity: 0.5 }, { opacity: 0 }], { duration: 340, delay: 250 + (k + 1) * step, easing: 'ease-out' });
        }
        landed(fall, () => {
          play(h, [{ transform: 'translateY(-8px) scale(0.94)' }, { transform: 'none' }], { duration: 150, easing: 'ease' }); // (a bit's landing: style.css's land)
          play(ghost(0), [{ opacity: 0.6, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(1.18, 1.35)' }], { duration: 520, easing: 'ease-out' });
          fx([{ rect: { left: ink.left, top: ink.bottom - 6, width: ink.width, height: 6 }, type: 'number' }]);
          later(350, then);
        });
      },
      rain(then) {
        const ls = letters();
        const at = ls.map((l) => l.getBoundingClientRect()); // (before they move)
        const order = ls.map((_, i) => i).sort(() => Math.random() - 0.5);
        const n = Math.max(5, Math.round(above / FALL_STEP));
        let left = ls.length;
        order.forEach((i, k) => {
          const l = ls[i];
          const fall = play(l, [{ transform: `translateY(${-above}px)` }, { transform: 'none' }], { duration: n * FALL_MS * 0.8, delay: 200 + k * 140, easing: `steps(${n}, end)`, fill: 'backwards' });
          landed(fall, () => {
            play(l, [{ transform: 'scale(1.15, 0.8)', filter: 'brightness(1.8)' }, { transform: 'none', filter: 'none' }], { duration: 200, easing: 'ease-out' });
            const r = at[i];
            fx([{ rect: { left: r.left, top: r.bottom - 8, width: r.width, height: 6 }, type: amber(l) ? 'warning' : 'number' }]);
            if (--left === 0) later(300, then);
          });
        });
      },
      decrypt(then) {
        const ls = letters();
        const real = ls.map((l) => l.textContent);
        ls.forEach((l) => { l.style.width = `${l.getBoundingClientRect().width}px`; l.classList.add('scrambled'); });
        const GLYPHS = '0101010101ABCDEF';
        const tick = setInterval(() => ls.forEach((l) => { if (l.classList.contains('scrambled')) l.textContent = GLYPHS[Math.floor(Math.random() * GLYPHS.length)]; }), 55);
        timers.push(tick);
        let left = ls.length;
        ls.forEach((l, i) => later(450 + i * 130 + Math.random() * 60, () => {
          l.classList.remove('scrambled');
          l.textContent = real[i];
          play(l, [{ transform: 'scale(1.18)', filter: 'brightness(2.4)' }, { transform: 'none', filter: 'none' }], { duration: 260, easing: 'ease-out' });
          if (--left === 0) { clearInterval(tick); later(300, then); }
        }));
      },
      power(then) {
        h.style.transformOrigin = '50% 50%';
        play(h, [
          { transform: 'scale(0, 0.04)', filter: 'brightness(3)' },
          { transform: 'scale(1.06, 0.04)', filter: 'brightness(3)', offset: 0.35 },
          { transform: 'scale(1, 1.2)', filter: 'brightness(1.8)', offset: 0.62 },
          { transform: 'scale(1, 0.95)', filter: 'brightness(1.2)', offset: 0.8 },
          { transform: 'none', filter: 'none' },
        ], { duration: 800, delay: 250, easing: 'ease-out', fill: 'backwards' });
        later(1100, () => play(h, [{ opacity: 1 }, { opacity: 0.35, offset: 0.25 }, { opacity: 1, offset: 0.5 }, { opacity: 0.6, offset: 0.75 }, { opacity: 1 }], { duration: 260, easing: 'steps(1, end)' }));
        later(1450, then);
      },
    };
    KINDS[kind](() => typeTag(() => end(false)));
  }
  requestAnimationFrame(intro);

  // While it's up, keys don't reach the game; Enter and Space start
  document.addEventListener('keydown', (e) => {
    if (screen.hidden) return;
    e.stopPropagation();
    e.preventDefault();
    if (e.key === 'Enter' || e.key === ' ') start();
  }, true);
  startBtn.focus({ preventScroll: true });
})();
