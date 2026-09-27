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
  // of the card, in from either side and back out again, looking the way they go. Now and then
  // one stops to idle; two that meet may stop a body's width apart (arms may overlap, nothing
  // more), face each other and pull faces. Sometimes one is spooked and bolts off the card, or
  // one arrives at a run and has to stop and catch its breath.
  const BOTS = ['bot', 'grifter', 'bunker', 'glitch'];
  const LEVELS = ['easy', 'normal', 'normal', 'hard', 'insane'];
  const MEETINGS = [['happy', 'happy'], ['smug', 'annoyed'], ['devious', 'worried'], ['hit', 'happy'], ['annoyed', 'annoyed'],
    ['happy', 'smug'], ['devious', 'devious'], ['love', 'surprised'], ['laugh', 'annoyed'], ['surprised', 'surprised'],
    ['laugh', 'laugh'], ['scared', 'devious'], ['dizzy', 'laugh'], ['love', 'love']];
  const EMOTES = ['!', '?', '!!', '...', '^^', '?!', '<3', 'haha', 'hm'];
  const SIZE = 34;
  const ARM = Math.round(SIZE * 2 / 16); // (the arms: 2 of the face's 16 units each side)
  const APART = SIZE - ARM; // two side by side overlap by an arm's width at most
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
  let nextFright = performance.now() + rand(12000, 25000);
  const laneW = () => lane.clientWidth;
  const inside = (w) => w.x >= 0 && w.x <= laneW() - SIZE;

  function mood(w, m, emote = '') {
    w.el.dataset.mood = m;
    delete w.el.dataset.variant;
    w.emote.textContent = emote;
    w.emote.classList.toggle('show', !!emote);
  }
  // A spot to stand that isn't on top of anyone standing still
  function freeSpot(w) {
    for (let k = 0; k < 8; k++) {
      const x = rand(12, laneW() - SIZE - 12);
      if (!walkers.some((o) => o !== w && o.state !== 'walk' && Math.abs(o.x - x) < APART)) return x;
    }
    return rand(12, laneW() - SIZE - 12);
  }

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
      bot, el, emote, x: fromLeft ? -SIZE - 4 : laneW() + 4, dir: fromLeft ? 1 : -1, look: fromLeft ? 1 : -1,
      speed: (bot === 'glitch' ? rand(30, 48) : bot === 'bunker' ? rand(14, 22) : rand(20, 32)),
      state: 'walk', target: 0, until: 0, leaving: false, running: false, born: now, metAt: 0, partner: null,
    };
    w.target = freeSpot(w);
    walkers.push(w);
    // Some arrive at a run, then stop to catch their breath
    if (Math.random() < 0.22) {
      w.running = true;
      w.winded = true;
    }
    place(w);
  }
  function place(w) {
    w.el.style.transform = `translateX(${w.x.toFixed(1)}px)`;
    w.el.dataset.look = w.look > 0 ? 'right' : 'left';
    w.el.classList.toggle('walking', w.state === 'walk');
    w.el.classList.toggle('running', w.state === 'walk' && w.running);
  }
  function walkTo(w, target, running = false) {
    w.target = target;
    w.dir = w.look = target > w.x ? 1 : -1;
    w.state = 'walk';
    w.running = running;
    w.partner = null;
  }
  function leave(w, running = false) {
    w.leaving = true;
    walkTo(w, w.x < laneW() / 2 ? -SIZE - 8 : laneW() + 8, running); // (out the nearer side)
  }
  // Spooked: a start (and a !), then off the card at a sprint; anyone near flinches
  function fright(w, now) {
    mood(w, 'scared', pick(['!', '!!', '!?']));
    w.state = 'startled';
    w.until = now + 450;
    for (const o of walkers) {
      if (o !== w && !o.leaving && Math.abs(o.x - w.x) < 110 && o.state !== 'meet') {
        mood(o, 'surprised', '?');
        o.state = 'idle';
        o.look = w.x > o.x ? 1 : -1;
        o.until = now + rand(1200, 1800);
      }
    }
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
    // Now and then one of them is spooked
    if (now > nextFright) {
      nextFright = now + rand(15000, 30000);
      const calm = walkers.filter((w) => !w.leaving && inside(w) && w.state !== 'meet');
      if (calm.length) fright(pick(calm), now);
    }
    for (const w of walkers) {
      if (w.state === 'walk') {
        const pace = w.running ? 3.4 : 1;
        const step = w.speed * pace * dt * (w.bot === 'glitch' && Math.random() < 0.08 ? 3 : 1); // (GLITCH lurches)
        w.x += w.dir * step;
        if ((w.dir > 0 && w.x >= w.target) || (w.dir < 0 && w.x <= w.target)) {
          w.x = w.target;
          if (w.leaving) { w.gone = true; continue; }
          if (w.winded) { // (arrived at a run: out of breath)
            w.winded = false;
            w.running = false;
            w.state = 'idle';
            w.until = now + rand(2400, 3600);
            mood(w, 'tired', pick(['...', 'phew', 'huff']));
          } else {
            w.running = false;
            w.state = 'idle';
            w.until = now + rand(900, 3200);
            mood(w, 'idle');
            if (Math.random() < 0.35) w.el.dataset.variant = pick(['bored', 'tapping']);
          }
        }
      } else if (w.state === 'startled') {
        if (now > w.until) leave(w, true);
      } else if (w.state === 'meet') {
        // Shuffle to a body's width apart, facing each other
        const o = w.partner;
        if (o) {
          const want = o.x + (w.x < o.x ? -APART : APART);
          const gap = want - w.x;
          if (Math.abs(gap) > 0.5) w.x += Math.sign(gap) * Math.min(Math.abs(gap), 30 * dt);
          w.look = o.x > w.x ? 1 : -1;
        }
        if (now > w.until) {
          mood(w, 'idle');
          if (now - w.born > 9000 && Math.random() < 0.35) leave(w);
          else walkTo(w, freeSpot(w));
        }
      } else if (now > w.until) {
        mood(w, 'idle');
        if (now - w.born > 9000 && Math.random() < 0.35) leave(w);
        else walkTo(w, freeSpot(w));
      }
      place(w);
    }
    // Two that meet may stop and make faces at each other
    for (let i = 0; i < walkers.length; i++) {
      for (let j = i + 1; j < walkers.length; j++) {
        const a = walkers[i];
        const b = walkers[j];
        const busyWith = (w) => w.state === 'meet' || w.state === 'startled' || w.leaving || w.winded || w.el.dataset.mood === 'tired';
        if (busyWith(a) || busyWith(b) || !inside(a) || !inside(b)) continue;
        if (Math.abs(a.x - b.x) > SIZE + 6 || now - a.metAt < 7000 || now - b.metAt < 7000) continue;
        a.metAt = b.metAt = now;
        if (Math.random() > 0.55) continue; // (not every time)
        const [ma, mb] = pick(MEETINGS);
        const until = now + rand(1500, 2300);
        for (const [w, other, m] of [[a, b, ma], [b, a, mb]]) {
          w.state = 'meet';
          w.partner = other;
          w.until = until;
          w.look = other.x > w.x ? 1 : -1;
          mood(w, m, pick(EMOTES));
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
