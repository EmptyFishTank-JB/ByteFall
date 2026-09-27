// START SCREEN: a fresh launch (see the inline script in index.html) opens on the title over the
// twinkling starlight with TAP TO START blinking. A tap (or Enter / Space) fades it to black; the
// first time the game is ever opened the black fades into the TUTORIAL (tutorial.js), after that
// into the game itself. The tap also counts as the gesture that lets the music start.
(() => {
  const screen = document.getElementById('start-screen');
  const black = document.getElementById('start-black');
  if (!screen || document.documentElement.classList.contains('no-start')) {
    if (screen) screen.hidden = true;
    return;
  }
  const INTRO_KEY = 'bytefall-intro-done';
  const FADE_MS = 600;
  let starting = false;
  const firstTime = () => {
    try { return !localStorage.getItem(INTRO_KEY); } catch (e) { return false; }
  };

  function start() {
    if (starting) return;
    starting = true;
    screen.classList.add('starting');
    SFX.play('static');
    setTimeout(() => {
      black.classList.add('on');
      setTimeout(() => {
        screen.hidden = true;
        if (firstTime()) {
          try { localStorage.setItem(INTRO_KEY, '1'); } catch (e) {}
          // The first open: straight into the tutorial (it can be left any time with EXIT)
          mode = 'tutorial';
          daily = false;
          resetNow();
        }
        requestAnimationFrame(() => {
          fitBoard();
          black.classList.remove('on');
        });
      }, FADE_MS);
    }, 350); // (a quick flicker of TAP TO START first)
  }

  // WANDERERS (wanderers.js) along the bottom of the card while it's up
  const lane = document.createElement('div');
  lane.className = 'start-walkers';
  screen.querySelector('.start-card').appendChild(lane);
  window.startWalkers = createWanderers(lane, () => !screen.hidden);

  const startBtn = document.getElementById('start-btn');
  startBtn.addEventListener('click', start);
  // While it's up, keys don't reach the game; Enter and Space start
  document.addEventListener('keydown', (e) => {
    if (screen.hidden) return;
    e.stopPropagation();
    e.preventDefault();
    if (e.key === 'Enter' || e.key === ' ') start();
  }, true);
  startBtn.focus({ preventScroll: true });
})();
