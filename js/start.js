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

  // WANDERERS: one to three of the CPUs (never the same one twice at once) stroll along the bottom
  // of the card, in from either side and back out again. Now and then one stops to idle, and
  // two that meet may stop, face each other and pull faces (a mood each, a little emote).
  const BOTS = ['bot', 'grifter', 'bunker', 'glitch'];
  const LEVELS = ['easy', 'normal', 'normal', 'hard', 'insane'];
  const MEETINGS = [['happy', 'happy'], ['smug', 'annoyed'], ['devious', 'worried'], ['hit', 'happy'], ['annoyed', 'annoyed'], ['happy', 'smug'], ['devious', 'devious']];
  const EMOTES = ['!', '?', '!!', '...', '^^', '?!'];
  const SIZE = 34;
  const card = screen.querySelector('.start-card');
  const lane = document.createElement('div');
  lane.className = 'start-walkers';
  card.appendChild(lane);
  const pick = (list) => list[Math.floor(Math.random() * list.length)];
  const rand = (a, b) => a + Math.random() * (b - a);
  let walkers = [];
  let want = 1 + Math.floor(Math.random() * 3);
  let nextSpawn = performance.now() + 400;
  let nextReroll = performance.now() + rand(8000, 15000);
  const laneW = () => lane.clientWidth;

  function spawn(now) {
    const free = BOTS.filter((b) => !walkers.some((w) => w.bot === b));
    if (!free.length) return;
    const bot = pick(free);
    const fromLeft = Math.random() < 0.5;
    const el = miniBot(bot, pick(LEVELS));
    el.classList.add('walker');
    const emote = document.createElement('span');
    emote.className = 'walker-emote';
    el.appendChild(emote);
    lane.appendChild(el);
    const w = {
      bot, el, emote, x: fromLeft ? -SIZE - 4 : laneW() + 4, dir: fromLeft ? 1 : -1,
      speed: (bot === 'glitch' ? rand(30, 48) : bot === 'bunker' ? rand(14, 22) : rand(20, 32)),
      state: 'walk', target: rand(12, laneW() - SIZE - 12), until: 0, leaving: false, born: now, metAt: 0,
    };
    walkers.push(w);
    place(w);
  }
  function place(w) {
    w.el.style.transform = `translateX(${w.x.toFixed(1)}px)`;
    w.el.firstChild.style.transform = w.dir < 0 ? 'scaleX(-1)' : '';
    w.el.classList.toggle('walking', w.state === 'walk');
  }
  function walkTo(w, target) {
    w.target = target;
    w.dir = target > w.x ? 1 : -1;
    w.state = 'walk';
    w.el.dataset.mood = 'idle';
    delete w.el.dataset.variant;
  }
  function leave(w) {
    w.leaving = true;
    walkTo(w, w.x < laneW() / 2 ? -SIZE - 8 : laneW() + 8); // (out the nearer side)
  }

  let last = performance.now();
  function frame(now) {
    if (screen.hidden) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (now > nextReroll) {
      want = 1 + Math.floor(Math.random() * 3);
      nextReroll = now + rand(8000, 15000);
    }
    const staying = walkers.filter((w) => !w.leaving);
    if (staying.length < want && now > nextSpawn) {
      spawn(now);
      nextSpawn = now + rand(1500, 4500);
    } else if (staying.length > want) {
      const w = staying.find((x) => x.state !== 'meet');
      if (w) leave(w);
    }
    for (const w of walkers) {
      if (w.state === 'walk') {
        const step = w.speed * dt * (w.bot === 'glitch' && Math.random() < 0.08 ? 3 : 1); // (GLITCH lurches)
        w.x += w.dir * step;
        if ((w.dir > 0 && w.x >= w.target) || (w.dir < 0 && w.x <= w.target)) {
          w.x = w.target;
          if (w.leaving) { w.gone = true; continue; }
          w.state = 'idle';
          w.until = now + rand(900, 3200);
          if (Math.random() < 0.35) w.el.dataset.variant = pick(['bored', 'tapping']);
        }
      } else if (now > w.until) {
        w.emote.classList.remove('show');
        // Wander on, or (after a while) head off
        if (now - w.born > 9000 && Math.random() < 0.35) leave(w);
        else walkTo(w, rand(12, laneW() - SIZE - 12));
      }
      place(w);
    }
    // Two that meet may stop and make faces at each other
    for (let i = 0; i < walkers.length; i++) {
      for (let j = i + 1; j < walkers.length; j++) {
        const a = walkers[i];
        const b = walkers[j];
        if (a.state === 'meet' || b.state === 'meet' || a.leaving || b.leaving) continue;
        const inside = (w) => w.x >= 0 && w.x <= laneW() - SIZE; // (both in the card, not still walking in)
        if (!inside(a) || !inside(b)) continue;
        if (Math.abs(a.x - b.x) > SIZE + 6 || now - a.metAt < 7000 || now - b.metAt < 7000) continue;
        a.metAt = b.metAt = now;
        if (Math.random() > 0.55) continue; // (not every time)
        const [ma, mb] = pick(MEETINGS);
        for (const [w, other, mood] of [[a, b, ma], [b, a, mb]]) {
          w.state = 'meet';
          w.until = now + rand(1400, 2200);
          w.dir = other.x > w.x ? 1 : -1;
          delete w.el.dataset.variant;
          w.el.dataset.mood = mood;
          w.emote.textContent = pick(EMOTES);
          w.emote.classList.add('show');
          place(w);
        }
      }
    }
    walkers = walkers.filter((w) => {
      if (w.gone) w.el.remove();
      return !w.gone;
    });
    requestAnimationFrame(frame);
  }
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) requestAnimationFrame(frame);

  screen.addEventListener('click', start);
  // While it's up, keys don't reach the game; Enter and Space start
  document.addEventListener('keydown', (e) => {
    if (screen.hidden) return;
    e.stopPropagation();
    e.preventDefault();
    if (e.key === 'Enter' || e.key === ' ') start();
  }, true);
  screen.focus();
})();
