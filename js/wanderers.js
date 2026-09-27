// WANDERERS: the CPUs strolling along the bottom of a card (the start screen's, and the game
// card's with SETTINGS → WANDERING BOTS on). createWanderers(lane, active) runs them in `lane` (a
// strip along the card's bottom) for as long as active() says so, and returns { start, list,
// startle }: start() brings them back after active() turned false.
function createWanderers(lane, active = () => true) {
  // One to four of the CPUs (never the same one twice at once) stroll along the bottom
  // of the card, in from either side and back out again, looking the way they go. Now and then
  // one stops to idle; two that meet may stop a body's width apart (arms may overlap, nothing
  // more), face each other and pull faces. Sometimes one is spooked and bolts off the card, or
  // one arrives at a run and has to stop and catch its breath.
  const BOTS = ['bot', 'grifter', 'bunker', 'glitch'];
  const LEVELS = ['easy', 'normal', 'normal', 'hard', 'insane'];
  const MEETINGS = [['happy', 'happy'], ['smug', 'annoyed'], ['devious', 'worried'], ['hit', 'happy'], ['annoyed', 'annoyed'],
    ['happy', 'smug'], ['devious', 'devious'], ['love', 'surprised'], ['laugh', 'annoyed'], ['surprised', 'surprised'],
    ['laugh', 'laugh'], ['scared', 'devious'], ['dizzy', 'laugh'], ['love', 'love']];
  // Each face's emotes: they fit the mood (no <3 on a -_-)
  const MOOD_EMOTES = {
    happy: ['^^', '!'], hit: ['!', '?!'], worried: ['?', '...', '!'], smug: ['hm', '^^'], annoyed: ['...', 'hm', '-_-'],
    devious: ['hm', '...'], love: ['<3', '!'], surprised: ['!', '?', '?!'], laugh: ['haha', '^^'], scared: ['!', '!!'],
    dizzy: ['?', '...'], tired: ['...', 'phew', 'huff'], skeptic: ['?', 'hm', '...'],
    angry: ['grr', '!!', '#@!'], snarl: ['GRRR', 'grr'], munch: ['nom', 'mmm', '*crunch*'],
  };
  // Faces each bot won't make, and what it makes instead (GLITCH is never happy or smitten)
  const NEVER = { glitch: { happy: 'smug', love: 'devious', laugh: 'smug' } };
  const NEVER_LEVEL = { glitch: ['easy'] }; // (EASY's resting face is a smile)
  // The mad ones (HARD's angry and INSANE's red-eyed resting faces) and GLITCH: never cheery
  const MAD = ['hard', 'insane'];
  const CHEERY = ['<3', '^^', 'haha'];
  const cheerless = (w) => w.bot === 'glitch' || MAD.includes(w.el.dataset.level);
  // Love only from the happy or normal resting faces (EASY, NORMAL), and never toward a worried,
  // scared or put-out partner
  const LOVE_LEVELS = ['easy', 'normal'];
  const LOVE_PARTNERS = ['love', 'happy', 'surprised', 'laugh'];
  const canFeel = (w, m) => !(NEVER[w.bot] && NEVER[w.bot][m]) && !(m === 'love' && !LOVE_LEVELS.includes(w.el.dataset.level));
  const pairFits = (a, b, [ma, mb]) => canFeel(a, ma) && canFeel(b, mb)
    && (ma !== 'love' || LOVE_PARTNERS.includes(mb)) && (mb !== 'love' || LOVE_PARTNERS.includes(ma));
  // SEASONAL COSTUMES (seasons.js says when): drawn in the bot's own 16x17 pixel grid, over its
  // body and under its face (so the face shows through: the pumpkin's carved face; the ghost's
  // sheet is see-through). Most arrive dressed up (80%). Colors in style.css ([data-costume]).
  const px = (cells, cls) => cells.map(([x, y, w = 1, h = 1]) => `<rect class="${cls}" x="${x}" y="${y}" width="${w}" height="${h}"/>`).join('');
  const COSTUMES = {
    halloween: {
      // BUNKER: a pumpkin (its body turns orange), darker ribs, a stem and a leaf
      bunker: { id: 'pumpkin', svg: px([[3, 4, 1, 8], [12, 4, 1, 8], [8, 2, 1, 2], [8, 12]], 'c-rib') + px([[7, 0, 2, 2]], 'c-stem') + px([[9, 1, 2, 1]], 'c-leaf') },
      // BOT: a see-through bedsheet ghost with a wavy hem (BOT shows under it, its face on top)
      bot: { id: 'ghost', svg: px([[5, 0, 6, 1], [3, 1, 10, 1], [2, 2, 12, 1], [1, 3, 14, 11], [1, 14, 2, 1], [5, 14, 2, 1], [9, 14, 2, 1], [13, 14, 2, 1]], 'c-sheet') },
      // GRIFTER: a witch's hat with an orange band and a bent tip
      grifter: { id: 'witch', svg: px([[0, 2, 16, 1], [5, 0, 6, 1], [6, -1, 4, 1], [7, -2, 3, 1], [8, -3, 2, 1], [9, -4, 2, 1], [10, -5, 2, 1]], 'c-hat') + px([[5, 1, 6, 1]], 'c-band') },
      // GLITCH: devil horns and a pointed tail
      glitch: { id: 'devil', svg: px([[3, 2, 2, 1], [3, 1], [2, 0], [11, 2, 2, 1], [12, 1], [13, 0], [14, 12], [15, 11], [16, 10], [16, 9], [15, 8, 3, 1], [16, 7]], 'c-horn') },
    },
  };
  function dress(el, bot, always = false) {
    const season = typeof Season !== 'undefined' && Season.current();
    const costume = season && COSTUMES[season] && COSTUMES[season][bot];
    if (!costume || (!always && Math.random() >= 0.8)) return;
    el.dataset.costume = costume.id;
    el.querySelector('.bot-body').insertAdjacentHTML('afterend', `<g class="costume">${costume.svg}</g>`);
  }
  let partySeen = false;
  const RADIUS = 110; // how near a pop, a decrypt or a bolt startles the others
  const HOP_MS = 360;
  const SIZE = 34;
  const ARM = Math.round(SIZE * 2 / 16); // (the arms: 2 of the face's 16 units each side)
  const APART = SIZE - ARM; // two side by side overlap by an arm's width at most
  const pick = (list) => list[Math.floor(Math.random() * list.length)];
  // (the bot achievements: counted, and any earned pop up)
  const botEvent = (id) => {
    Progress.botEvent(id);
    if (typeof announce === 'function') announce(Progress.check());
  };
  let crewSeen = false;
  const rand = (a, b) => a + Math.random() * (b - a);
  let walkers = [];
  let want = 1 + Math.floor(Math.random() * 4);
  let nextSpawn = performance.now() + 400;
  let nextReroll = performance.now() + rand(8000, 15000);
  let nextDepart = 0; // (too many: they go one at a time, not all at once)
  let width = lane.clientWidth; // (read once a frame: reading it between moves forces a layout)
  const laneW = () => width;
  const inside = (w) => w.x >= 0 && w.x <= laneW() - SIZE;

  // emote: text to show, or true to pick one that fits the face (and the bot)
  function mood(w, m, emote = '') {
    if (!canFeel(w, m)) m = (NEVER[w.bot] && NEVER[w.bot][m]) || 'smug';
    const allowed = (e) => !(cheerless(w) && CHEERY.includes(e));
    if (emote === true) emote = pick((MOOD_EMOTES[m] || ['!']).filter(allowed)) || '!';
    else if (emote && !allowed(emote)) emote = '!';
    w.el.dataset.mood = m;
    delete w.el.dataset.variant;
    w.emote.textContent = emote;
    w.emote.classList.toggle('show', !!emote);
  }
  // A spot to stand that isn't on top of anyone standing still or already headed somewhere (the
  // first clear one of a few tries; in a crowd, the one with the most room)
  function freeSpot(w) {
    const taken = walkers.filter((o) => o !== w && !o.leaving).map((o) => (o.state === 'walk' ? o.target : o.x));
    const hi = Math.max(12, laneW() - SIZE - 12);
    let best = rand(12, hi);
    let room = -1;
    const roomAt = (x) => Math.min(Infinity, ...taken.map((t) => Math.abs(t - x)));
    for (let k = 0; k < 16; k++) {
      const x = rand(12, hi);
      const r = roomAt(x);
      if (r >= APART) return x;
      if (r > room) { room = r; best = x; }
    }
    // (a crowd on a narrow card: the spots just beside the others, then either end)
    for (const x of [...taken.flatMap((t) => [t - APART, t + APART]), 12, hi]) {
      if (x < 12 || x > hi) continue;
      const r = roomAt(x);
      if (r > room) { room = r; best = x; }
    }
    return best;
  }

  function spawn(now) {
    const free = BOTS.filter((b) => !walkers.some((w) => w.bot === b));
    if (!free.length) return;
    const bot = pick(free);
    const fromLeft = Math.random() < 0.5;
    const el = miniBot(bot, pick(LEVELS.filter((l) => !(NEVER_LEVEL[bot] || []).includes(l))));
    el.classList.add('walker');
    dress(el, bot);
    const emote = document.createElement('span');
    emote.className = 'walker-emote';
    el.appendChild(emote);
    lane.appendChild(el);
    el.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      poke(w, performance.now());
    });
    const w = {
      bot, el, emote, x: fromLeft ? -SIZE - 4 : laneW() + 4, dir: fromLeft ? 1 : -1, look: fromLeft ? 1 : -1,
      speed: (bot === 'glitch' ? rand(30, 48) : bot === 'bunker' ? rand(14, 22) : rand(20, 32)),
      state: 'walk', target: 0, until: 0, leaving: false, running: false, born: now, metAt: 0, partner: null,
    };
    w.target = freeSpot(w);
    walkers.push(w);
    const how = Math.random();
    if (how < 0.10) { // (10%) pops into view, pixelating in; those near turn to it, startled
      w.x = w.target;
      w.state = 'idle';
      w.until = now + rand(900, 1500);
      el.classList.add('pop-in');
      setTimeout(() => el.classList.remove('pop-in'), 500);
      place(w);
      if (startle(w, now)) botEvent('jump-scare');
      return;
    }
    if (how < 0.25) { // (15%) arrives at a run, then stops to catch its breath
      w.running = true;
      w.winded = true;
    }
    place(w);
  }
  // Those near a sudden pop, decrypt or bolt face it, startled (cutting any meeting short)
  // A meeting cut short leaves the partner out of range put out: -_-
  function startle(src, now, radius = RADIUS) {
    // (only those on the card: one still walking in doesn't freeze out of sight)
    const near = (o) => o !== src && !o.leaving && o.state !== 'vanish' && o.state !== 'startled' && inside(o) && Math.abs(o.x - src.x) <= radius;
    let startled = 0;
    for (const o of walkers) {
      if (!near(o)) continue;
      startled++;
      const p = o.partner;
      if (p) {
        o.partner = null;
        p.partner = null;
        if (!near(p)) { // (not startled itself: just annoyed its meeting was interrupted)
          mood(p, 'annoyed', '-_-');
          p.state = 'idle';
          p.look = o.x > p.x ? 1 : -1;
          p.until = now + rand(1200, 1700);
          place(p);
        }
      }
      mood(o, 'surprised', pick(['!', '!?', '?!']));
      o.state = 'idle';
      o.winded = o.running = false; // (a start stops a run: no catching its breath after)
      o.look = src.x > o.x ? 1 : -1;
      o.until = now + rand(1100, 1700);
      o.el.classList.remove('hopping', 'shaking', 'headshaking', 'snapping', 'chewing');
      place(o);
    }
    return startled;
  }
  // Poked by the player: 40% bolt off, startled; otherwise put out (-_-), it shakes itself off as
  // if the touch left it dirty, then gives you a raised eyebrow before wandering on. The mad ones
  // (HARD and INSANE) never bolt: they go rabid (rabid()).
  function poke(w, now) {
    if (w.leaving || ['vanish', 'startled', 'poked'].includes(w.state)) return;
    botEvent('pokes');
    if (w.partner) {
      botEvent('third-wheel');
      const p = w.partner;
      w.partner = null;
      p.partner = null;
      mood(p, 'annoyed', true);
      p.state = 'idle';
      p.until = now + rand(1200, 1700);
    }
    if (MAD.includes(w.el.dataset.level)) return rabid(w, now);
    if (Math.random() < 0.4) {
      botEvent('bolts');
      return fright(w, now);
    }
    const id = (w.pokeId = (w.pokeId || 0) + 1);
    const still = () => w.pokeId === id && w.state === 'poked' && !w.gone;
    w.state = 'poked';
    w.winded = w.running = false;
    w.look = 0;
    w.until = now + 3000;
    mood(w, 'annoyed', pick(['hey!', '-_-', '!!']));
    place(w);
    setTimeout(() => {
      if (!still()) return;
      mood(w, 'annoyed');
      w.el.classList.add('shaking');
      for (let k = 0; k < 8; k++) { // (a puff of dust)
        const d = document.createElement('i');
        d.className = 'walker-dust';
        d.style.setProperty('--dx', `${rand(-18, 18).toFixed(0)}px`);
        d.style.setProperty('--dy', `${rand(-16, 4).toFixed(0)}px`);
        d.style.animationDelay = `${(k * 60).toFixed(0)}ms`;
        w.el.appendChild(d);
        setTimeout(() => d.remove(), 800 + k * 60);
      }
    }, 600);
    setTimeout(() => {
      if (!still()) return;
      w.el.classList.remove('shaking');
      mood(w, 'skeptic', true); // (the raised eyebrow, at you)
      botEvent(`eyebrow-${w.bot}`);
    }, 1400);
  }

  // A mad one poked: it shakes its head, bares its teeth and snaps at you like a rabid dog, three
  // lunges; then 35% it stomps off at a run, still angry, or glares a moment and wanders on
  function rabid(w, now) {
    const id = (w.pokeId = (w.pokeId || 0) + 1);
    const still = () => w.pokeId === id && w.state === 'poked' && !w.gone;
    w.state = 'poked';
    w.winded = w.running = false;
    w.look = 0; // (at you)
    w.until = now + 3000;
    mood(w, 'angry', 'grr');
    w.el.classList.remove('hopping', 'shaking');
    w.el.classList.add('headshaking');
    place(w);
    setTimeout(() => {
      if (!still()) return;
      w.el.classList.remove('headshaking');
      mood(w, 'snarl', true);
    }, 650);
    setTimeout(() => {
      if (!still()) return;
      w.el.classList.add('snapping');
      mood(w, 'snarl', pick(['SNAP!', 'CHOMP!']));
      botEvent('bitten');
    }, 1050);
    setTimeout(() => {
      if (!still()) return;
      w.el.classList.remove('snapping');
      if (Math.random() < 0.35) { // (storms off)
        mood(w, 'angry', pick(['hmph', '#@!']));
        w.state = 'idle';
        leave(w, true);
        place(w);
      } else {
        mood(w, 'angry');
        w.until = performance.now() + 700; // (a glare, then on its way)
      }
    }, 1650);
  }

  // HALLOWEEN: a snack. One to three gummy drops, each pulled from its side, tossed up and
  // caught in its mouth, a quick chew, then on its way
  const CANDY = ['#ff3b5c', '#ffb000', '#7cff6b', '#b36bff', '#3bd1ff', '#ff7ad9'];
  function snack(w, now) {
    const id = (w.snackId = (w.snackId || 0) + 1);
    const still = () => w.snackId === id && w.state === 'snack' && !w.gone;
    const n = 1 + Math.floor(Math.random() * 3);
    w.state = 'snack';
    w.look = 0;
    w.until = now + n * 1250 + 400;
    place(w);
    for (let k = 0; k < n; k++) {
      setTimeout(() => {
        if (!still()) return;
        const side = Math.random() < 0.5 ? -1 : 1;
        const c = document.createElement('i');
        c.className = 'walker-candy';
        c.style.setProperty('--c', pick(CANDY));
        w.el.appendChild(c);
        // (in the walker's pixels: out at its side, then an arc up over its head and down into its
        // mouth, hopping from pixel to pixel of its grid like everything else)
        const U = 34 / 16;
        const snap = (v) => Math.round(v / U) * U;
        const hand = side > 0 ? 13 * U : 1 * U;
        const mouth = [7 * U, 10 * U];
        const frames = [
          { transform: `translate(${hand}px, ${11 * U}px) scale(0)`, offset: 0 },
          { transform: `translate(${hand}px, ${9 * U}px)`, offset: 0.2 },
        ];
        const N = 12;
        for (let i = 1; i <= N; i++) { // (a curve through a point well over its head)
          const t = i / N;
          const x = hand + (mouth[0] - hand) * t;
          const y = (1 - t) * (1 - t) * 9 * U + 2 * (1 - t) * t * (-9 * U) + t * t * mouth[1];
          frames.push({ transform: `translate(${snap(x)}px, ${snap(y)}px)`, offset: 0.2 + 0.8 * t });
        }
        frames.forEach((f) => { f.easing = 'steps(1, end)'; });
        const toss = c.animate(frames, { duration: 820, fill: 'forwards' });
        toss.onfinish = () => {
          c.remove();
          if (!still()) return;
          mood(w, 'munch', k === n - 1 ? true : '');
          w.el.classList.add('chewing');
          botEvent('candy');
          setTimeout(() => {
            w.el.classList.remove('chewing');
            if (still()) mood(w, 'idle');
          }, 380);
        };
      }, k * 1250);
    }
  }

  // Time to go: mostly a walk off the card; 15% a spooked bolt; 5% a pixelated decrypt
  function depart(w, now) {
    const r = Math.random();
    if (r < 0.05) {
      w.leaving = true;
      w.state = 'vanish';
      mood(w, 'idle');
      w.el.classList.add('pix-out');
      if (typeof FX !== 'undefined') setTimeout(() => FX.burst([{ el: w.el, type: 'warning' }]), 200);
      setTimeout(() => { w.gone = true; }, 480);
      startle(w, now);
      botEvent('vanish');
    } else if (r < 0.20) fright(w, now);
    else leave(w);
  }
  function place(w) {
    w.el.style.transform = `translateX(${w.x.toFixed(1)}px)`;
    w.el.dataset.look = w.look > 0 ? 'right' : w.look < 0 ? 'left' : 'front'; // (front: at you)
    w.el.classList.toggle('walking', w.state === 'walk');
    w.el.classList.toggle('running', w.state === 'walk' && w.running);
  }
  function walkTo(w, target, running = false) {
    w.el.classList.remove('headshaking', 'snapping');
    w.target = target;
    w.dir = w.look = target > w.x ? 1 : -1;
    w.state = 'walk';
    w.running = running;
    w.winded = false; // (only an arrival at a run ends out of breath)
    w.partner = null;
    w.el.classList.remove('shaking');
  }
  function leave(w, running = false) {
    w.leaving = true;
    walkTo(w, w.x < laneW() / 2 ? -SIZE - 8 : laneW() + 8, running); // (out the nearer side)
  }
  // Spooked: a start (and a !), then off the card at a sprint; anyone near flinches
  function fright(w, now) {
    mood(w, 'scared', pick(['!', '!!', '!?']));
    w.el.classList.remove('shaking', 'hopping', 'headshaking', 'snapping');
    w.state = 'startled';
    w.leaving = true; // (off it goes once the start is over)
    w.until = now + 450;
    startle(w, now);
  }

  // Seasonal visitors (visitors.js) share the lane
  const visitors = typeof createVisitors === 'function' ? createVisitors({
    lane, laneW: () => width, walkers: () => walkers, botEvent,
    startle: (src, radius) => startle(src, performance.now(), radius),
  }) : null;

  let last = performance.now();
  let running = false;
  function frame(now) {
    if (!active()) { // (switched off, or its screen gone: everyone goes)
      running = false;
      walkers.forEach((w) => w.el.remove());
      walkers = [];
      if (visitors) visitors.clear();
      return;
    }
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    width = lane.clientWidth;
    if (!width) { // (its card is out of sight: wait, rather than walk to spots on a 0px lane)
      requestAnimationFrame(frame);
      return;
    }
    if (now > nextReroll) {
      want = 1 + Math.floor(Math.random() * 4);
      nextReroll = now + rand(8000, 15000);
    }
    const staying = walkers.filter((w) => !w.leaving);
    if (!crewSeen && walkers.filter(inside).length >= 4) { // (all four at once)
      crewSeen = true;
      botEvent('crew');
    }
    if (!partySeen && walkers.filter((w) => inside(w) && w.el.dataset.costume).length >= 4) { // (all four dressed up)
      partySeen = true;
      botEvent('costume-party');
    }
    if (staying.length < want && now > nextSpawn) {
      spawn(now);
      nextSpawn = now + rand(1500, 4500);
    } else if (staying.length > want && now > nextDepart) {
      const w = staying.find((x) => x.state !== 'meet' && x.state !== 'poked' && x.state !== 'snack');
      if (w) {
        depart(w, now);
        nextDepart = now + rand(1200, 3000);
      }
    }
    for (const w of walkers) {
      // (the lane got narrower, say on a turn of the phone: whoever stands past its end steps in)
      // (not one poked or startled half on the card: it reacts where it is, peeking in)
      if ((w.state === 'idle' || w.state === 'meet') && !w.leaving && w.x > laneW() - SIZE) w.x = Math.max(0, laneW() - SIZE);
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
            if (typeof Season !== 'undefined' && Season.is('halloween') && Math.random() < 0.3) snack(w, now); // (candy!)
            else if (Math.random() < 0.35) { // a hop or two, then on
              const hops = Math.random() < 0.5 ? 1 : 2;
              w.el.style.setProperty('--hops', hops);
              w.el.classList.add('hopping');
              setTimeout(() => w.el.classList.remove('hopping'), hops * HOP_MS + 50);
              w.until = Math.max(w.until, now + hops * HOP_MS + 400);
            } else if (Math.random() < 0.35) w.el.dataset.variant = pick(['bored', 'tapping']);
          }
        }
      } else if (w.state === 'startled') {
        if (now > w.until) { w.leaving = false; leave(w, true); }
      } else if (w.state === 'vanish') {
        // (decrypting away)
      } else if (w.state === 'meet') {
        // Shuffle to a body's width apart, facing each other
        const o = w.partner;
        if (o) {
          const spot = Math.min(laneW() - SIZE, Math.max(0, o.x + (w.x < o.x ? -APART : APART))); // (never off the card)
          const gap = spot - w.x;
          if (Math.abs(gap) > 0.5) w.x += Math.sign(gap) * Math.min(Math.abs(gap), 30 * dt);
          w.look = o.x > w.x ? 1 : -1;
        }
        if (now > w.until) {
          mood(w, 'idle');
          if (now - w.born > 9000 && Math.random() < 0.35) depart(w, now);
          else walkTo(w, freeSpot(w));
        }
      } else if (now > w.until) {
        mood(w, 'idle');
        if (now - w.born > 9000 && Math.random() < 0.35) depart(w, now);
        else walkTo(w, freeSpot(w));
      }
      place(w);
    }
    // Two that meet may stop and make faces at each other
    for (let i = 0; i < walkers.length; i++) {
      for (let j = i + 1; j < walkers.length; j++) {
        const a = walkers[i];
        const b = walkers[j];
        const busyWith = (w) => w.state === 'meet' || w.state === 'startled' || w.state === 'vanish' || w.state === 'poked' || w.state === 'snack' || w.leaving || w.winded
          || w.el.dataset.mood === 'tired' || w.el.dataset.mood === 'surprised';
        if (busyWith(a) || busyWith(b) || !inside(a) || !inside(b)) continue;
        if (Math.abs(a.x - b.x) > SIZE + 6 || now - a.metAt < 7000 || now - b.metAt < 7000) continue;
        a.metAt = b.metAt = now;
        if (Math.random() > 0.55) continue; // (not every time)
        let pair = pick(MEETINGS);
        for (let k = 0; k < 12 && !pairFits(a, b, pair); k++) pair = pick(MEETINGS);
        if (!pairFits(a, b, pair)) pair = ['surprised', 'surprised'];
        const [ma, mb] = pair;
        if (ma === 'love' && mb === 'love') botEvent('love-pair');
        const until = now + rand(1500, 2300);
        for (const [w, other, m] of [[a, b, ma], [b, a, mb]]) {
          w.state = 'meet';
          w.partner = other;
          w.until = until;
          w.look = other.x > w.x ? 1 : -1;
          mood(w, m, true);
          place(w);
        }
      }
    }
    walkers = walkers.filter((w) => {
      if (w.gone) w.el.remove();
      return !w.gone;
    });
    if (visitors) visitors.frame(now, dt);
    requestAnimationFrame(frame);
  }
  function start() {
    if (running || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    running = true;
    last = performance.now();
    width = lane.clientWidth;
    nextSpawn = last + 400;
    requestAnimationFrame(frame);
  }
  start();
  // (start: after being switched back on; list / startle / crowd / dress / visit / snack: for the dev tests)
  return { start, list: () => walkers, startle: (w) => startle(w, performance.now()), crowd: (n) => { want = n; nextReroll = performance.now() + 60000; }, dress, visit: (what) => visitors && visitors.visit(what), snack: (w) => snack(w, performance.now()) };

}
