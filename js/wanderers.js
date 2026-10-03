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
  // Each one's level (its resting face), weighted: mostly EASY and NORMAL, the angry HARD and the
  // red-eyed INSANE now and then (14% and 6%)
  const LEVEL_ODDS = { easy: 35, normal: 45, hard: 14, insane: 6 };
  function pickLevel(bot) {
    const ok = Object.entries(LEVEL_ODDS).filter(([l]) => !(NEVER_LEVEL[bot] || []).includes(l));
    let r = Math.random() * ok.reduce((a, [, n]) => a + n, 0);
    for (const [l, n] of ok) if ((r -= n) < 0) return l;
    return 'normal';
  }
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
  // SEASONAL COSTUMES (seasons.js says when; stacked seasons all offer theirs): drawn in the bot's
  // own 16x17 pixel grid, over its body and under its face (so the face shows through: the
  // pumpkin's carved face; the ghost's sheet is see-through). Most arrive dressed up (80%).
  // Halloween's colors are in style.css ([data-costume]); the others carry their own. A hat
  // (data-hat) hides the antennas and ear tips under it.
  const px = (cells, cls) => cells.map(([x, y, w = 1, h = 1]) => `<rect class="${cls}" x="${x}" y="${y}" width="${w}" height="${h}"/>`).join('');
  const pxc = (cells, fill) => cells.map(([x, y, w = 1, h = 1]) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"/>`).join('');
  const TOP = { bot: 3, grifter: 3, bunker: 2, glitch: 3 }; // (where each one's head starts)
  // Hats and the like, for any bot (t: the top of its head)
  const WEAR = {
    beanie: (t, a, b) => pxc([[3, t - 1, 10, 1]], a) + pxc([[4, t - 2, 8, 1], [5, t - 3, 6, 1]], b) + pxc([[4, t - 2], [7, t - 2], [10, t - 2], [6, t - 3], [9, t - 3]], a) + pxc([[7, t - 4, 2, 1]], '#ffffff'),
    santa: (t) => pxc([[2, t - 1, 12, 1]], '#ffffff') + pxc([[3, t - 2, 9, 1], [4, t - 3, 7, 1], [6, t - 4, 6, 1], [9, t - 5, 4, 1], [12, t - 4, 1, 1]], '#e02b3a') + pxc([[13, t - 4, 2, 2]], '#ffffff'),
    elf: (t) => pxc([[2, t - 1, 12, 1]], '#c8102e') + pxc([[3, t - 2, 9, 1], [4, t - 3, 7, 1], [6, t - 4, 5, 1], [9, t - 5, 3, 1], [11, t - 6, 2, 1], [13, t - 7, 1, 2]], '#1f9d4c') + pxc([[13, t - 5, 2, 2]], '#ffd23f'),
    party: (t, a, b) => pxc([[5, t - 1, 6, 1], [6, t - 3, 4, 1], [7, t - 5, 2, 1]], a) + pxc([[6, t - 2, 4, 1], [7, t - 4, 2, 1]], b) + pxc([[7, t - 6, 2, 1]], '#ffffff'),
    earmuffs: (t, a) => pxc([[4, t - 1, 8, 1]], '#4a4f5a') + pxc([[0, 5, 2, 3], [14, 5, 2, 3]], a),
    scarf: (t, a, b) => pxc([[1, 12, 14, 2]], a) + pxc([[3, 12, 1, 2], [7, 12, 1, 2], [11, 12, 1, 2]], b) + pxc([[10, 14, 2, 2]], a) + pxc([[10, 15, 2, 1]], b),
    antlers: (t) => pxc([[4, t - 1], [3, t - 2], [2, t - 3], [4, t - 3], [1, t - 4], [11, t - 1], [12, t - 2], [13, t - 3], [11, t - 3], [14, t - 4]], '#8a5a2b') + pxc([[7, 8, 2, 1]], '#ff3b3b'),
  };
  const PARTY = [['#ff3b5c', '#ffd23f'], ['#3bd1ff', '#ffffff'], ['#7cff6b', '#b36bff'], ['#ffb000', '#ff7ad9']];
  const hat = (kind, ...colors) => ({ id: kind, hat: true, svg: (bot) => WEAR[kind](TOP[bot], ...colors) });
  const wear = (kind, ...colors) => ({ id: kind, svg: (bot) => WEAR[kind](TOP[bot], ...colors) });
  const COSTUMES = {
    halloween: {
      // BUNKER: a pumpkin (its body turns orange), darker ribs, a stem and a leaf
      bunker: { id: 'pumpkin', svg: px([[3, 4, 1, 8], [12, 4, 1, 8], [8, 2, 1, 2], [8, 12]], 'c-rib') + px([[7, 0, 2, 2]], 'c-stem') + px([[9, 1, 2, 1]], 'c-leaf') },
      // BOT: a see-through bedsheet ghost with a wavy hem (BOT shows under it, its face on top)
      bot: { id: 'ghost', svg: px([[5, 0, 6, 1], [3, 1, 10, 1], [2, 2, 12, 1], [1, 3, 14, 10], [1, 13, 2, 1], [5, 13, 2, 1], [9, 13, 2, 1], [13, 13, 2, 1]], 'c-sheet') }, // (the hem a pixel up: its feet walk under it)
      // GRIFTER: a witch's hat with an orange band and a bent tip
      grifter: { id: 'witch', svg: px([[0, 2, 16, 1], [5, 0, 6, 1], [6, -1, 4, 1], [7, -2, 3, 1], [8, -3, 2, 1], [9, -4, 2, 1], [10, -5, 2, 1]], 'c-hat') + px([[5, 1, 6, 1]], 'c-band') },
      // GLITCH: devil horns and a pointed tail
      glitch: { id: 'devil', svg: px([[3, 2, 2, 1], [3, 1], [2, 0], [11, 2, 2, 1], [12, 1], [13, 0], [14, 12], [15, 11], [16, 10], [16, 9], [15, 8, 3, 1], [16, 7]], 'c-horn') },
    },
    // (the others: a few choices each, for any bot)
    winter: [hat('beanie', '#d23a3a', '#f2f2f2'), wear('earmuffs', '#e05a8a'), wear('scarf', '#3a7bd5', '#f2f2f2'), wear('scarf', '#2f9e5a', '#f2f2f2')],
    hanukkah: [hat('beanie', '#1f5fbf', '#ffffff'), wear('scarf', '#1f5fbf', '#ffffff')],
    christmas: [hat('santa'), hat('elf'), wear('antlers')],
    kwanzaa: [wear('scarf', '#d23a3a', '#1f9d4c'), wear('scarf', '#1f9d4c', '#d23a3a')],
    nye: PARTY.map((c) => hat('party', ...c)),
    newyear: PARTY.map((c) => hat('party', ...c)),
  };
  function dress(el, bot, always = false) {
    const seasons = typeof Season !== 'undefined' ? Season.active() : [];
    const offers = seasons.flatMap((id) => {
      const c = COSTUMES[id];
      if (!c) return [];
      if (Array.isArray(c)) return c;
      return c[bot] ? [c[bot]] : [];
    });
    if (!offers.length || (!always && Math.random() >= 0.8)) return;
    const costume = pick(offers);
    el.dataset.costume = costume.id;
    if (costume.hat) el.dataset.hat = '';
    const svg = typeof costume.svg === 'function' ? costume.svg(bot) : costume.svg;
    el.querySelector('.bot-body').insertAdjacentHTML('afterend', `<g class="costume">${svg}</g>`);
  }
  // HEADPHONES: with music playing, a bot may arrive wearing a pair or pull them out and put them
  // on, then vibe: eyes closed, nodding on the beat while it stands, its steps on the beat as it
  // walks. It keeps them on until it leaves; if the music stops, -_- and they're put away.
  const music = () => (typeof Music !== 'undefined' && Music.beat ? Music.beat() : null);
  function phonesSvg(bot) {
    const t = TOP[bot] || 3;
    return pxc([[3, t - 1, 10, 1], [2, t, 1, 2], [13, t, 1, 2]], '#2b2f36') + pxc([[0, t + 2, 2, 4], [14, t + 2, 2, 4]], '#e0455f') + pxc([[0, t + 3, 1, 2], [15, t + 3, 1, 2]], '#ff8aa0');
  }
  // CORE DUMP's metalheads: long hair (dark, behind the head, hanging past the body on both sides) while its feel lasts
  function hairSvg(bot) {
    const t = TOP[bot] || 3;
    const c = '#7a5236';
    const h = '#a2774f'; // (a lighter strand or two)
    return pxc([[3, t - 1, 10, 1], [2, t, 12, 1], [1, t + 1, 2, 11], [13, t + 1, 2, 11], [0, t + 4, 1, 9], [15, t + 4, 1, 9], [2, t + 12, 1, 2], [13, t + 12, 1, 2]], c)
      + pxc([[5, t, 1, 1], [10, t, 1, 1], [1, t + 6, 1, 4], [14, t + 6, 1, 4]], h);
  }
  function hairOn(w) {
    if (w.hair) return;
    w.hair = true;
    // (behind the body: it flies out around the head's edges, never across the face)
    w.el.querySelector('.bot-body').insertAdjacentHTML('beforebegin', `<g class="metal-hair">${hairSvg(w.bot)}</g>`);
  }
  function hairOff(w) {
    if (!w.hair) return;
    w.hair = false;
    const g = w.el.querySelector('.metal-hair');
    if (g) g.remove();
  }
  function phonesOn(w, now, arriving = false) {
    if (w.phones) return;
    w.phones = true;
    const body = w.el.querySelector('.costume') || w.el.querySelector('.bot-body');
    body.insertAdjacentHTML('afterend', `<g class="headphones">${phonesSvg(w.bot)}</g>`);
    w.el.classList.add('vibing');
    w.groove = Math.random() < 0.6 ? 'kick' : 'hats'; // (what it moves to: the kicks, or the hats)
    syncBeat(w, music());
    if (!arriving) {
      w.state = 'idle';
      w.until = now + rand(6000, 11000);
      mood(w, 'happy', '♪');
      botEvent('headphones');
    }
  }
  function phonesOff(w) { // (the music stopped: -_-, and away they go)
    if (!w.phones) return;
    w.phones = false;
    hairOff(w);
    w.el.classList.remove('grooving');
    mood(w, 'annoyed', '-_-');
    setTimeout(() => {
      const g = w.el.querySelector('.headphones');
      if (g) g.remove();
      w.el.classList.remove('vibing');
    }, 700);
  }
  // (the nod and the steps on the beat: its length and where in it the music is)
  function syncBeat(w, b) {
    if (!b) return;
    w.el.style.setProperty('--beat', `${b.period.toFixed(3)}s`);
    w.el.style.setProperty('--beat-at', `${(-b.phase * b.period).toFixed(3)}s`);
    w.beatSynced = performance.now();
  }
  // Moving to the drums: each groover nods on the kicks (or taps its foot on the hats), never faster
  // than the beat allows (a nod at most every half beat, a tap every eighth), and with none to
  // follow (a breakdown) it keeps time anyway: a nod each bar, a tap each beat
  let heardUpTo = 0;
  let feeling = false; // (the track playing tells its feel: its moves, not the kicks and hats)
  function groove(now, beat) {
    const d = typeof Music !== 'undefined' && Music.drums ? Music.drums() : null;
    if (!d || !beat) return;
    if (now - (groove.at || 0) > 500) heardUpTo = Math.max(heardUpTo, d.now - 0.05); // (back after a gap: not the old hits all at once)
    groove.at = now;
    const fresh = d.hits.filter((h) => h.time > heardUpTo && h.time <= d.now);
    if (fresh.length) heardUpTo = fresh[fresh.length - 1].time;
    if (!fresh.length) return;
    const P = beat.period * 1000;
    // (a track that tells its feel, CORE DUMP: in the blasts the helicopter, the head whirling round
    // on the neck, a turn a beat; in the gallop a headbang every beat; in the half-time breakdown a heavy one on 1 and 3)
    const felt = fresh.filter((h) => h.feel);
    const marks = fresh.filter((h) => h.beat);
    if (marks.length) feeling = !!marks[marks.length - 1].feel; // (held between the beats)
    for (const w of walkers) {
      if (!w.el.classList.contains('grooving')) continue;
      if (feeling) hairOn(w);
      else hairOff(w);
      if (feeling) {
        for (const h of felt) {
          if (h.feel === 'blast') move(w, 'spin', P);
          else if (h.feel === 'gallop' || h.half) move(w, h.feel === 'half' ? 'bang-heavy' : 'bang', P);
        }
        continue;
      }
      for (const h of fresh) {
        if (w.groove === 'kick') {
          if ((h.low && now - (w.nodAt || 0) > P * 0.45) || (h.bar && now - (w.nodAt || 0) > P * 3.5)) { w.nodAt = now; move(w, 'nod', P); }
        } else if ((h.high && now - (w.tapAt || 0) > P * 0.45) || (h.beat && now - (w.tapAt || 0) > P * 1.5)) {
          w.tapAt = now;
          move(w, 'tap', P);
        }
      }
    }
  }
  function move(w, how, P) {
    const bot = w.el.querySelector('.bot');
    if (!bot || !bot.animate) return;
    if (how === 'spin') { // (the metalhead's helicopter: the head whirled round in a circle on the neck, tilting out as it goes)
      const d = w.look < 0 ? -1 : 1;
      const frames = [];
      for (let k = 0; k <= 8; k++) {
        const a = (k / 8) * Math.PI * 2;
        frames.push({ transform: `translate(${(d * 3 * Math.sin(a)).toFixed(2)}px, ${(1.5 - 1.5 * Math.cos(a)).toFixed(2)}px) rotate(${(d * 14 * Math.sin(a)).toFixed(1)}deg)` });
      }
      bot.animate(frames, { duration: P, easing: 'linear' });
      const hair = w.el.querySelector('.metal-hair');
      if (hair) hair.animate(frames.map((f, k) => ({ transform: `rotate(${(d * 34 * Math.sin((k / 8) * Math.PI * 2 - 0.6)).toFixed(1)}deg)` })), { duration: P, easing: 'linear' }); // (whipping round wider, a little behind)
    }
    else if (how === 'bang' || how === 'bang-heavy') {
      const heavy = how === 'bang-heavy';
      bot.animate([{ transform: `translateY(${heavy ? 3 : 2}px) scaleY(${heavy ? 0.86 : 0.92})` }, { transform: 'translateY(0) scaleY(1)' }], { duration: Math.min(heavy ? 420 : 260, P * (heavy ? 1.6 : 0.8)), easing: 'cubic-bezier(.2,.8,.3,1)' });
      const hair = w.el.querySelector('.metal-hair');
      if (hair) hair.animate([{ transform: 'translateY(0) scaleY(1)' }, { transform: `translateY(${heavy ? 2 : 1}px) scaleY(${heavy ? 1.25 : 1.12})`, offset: 0.25 }, { transform: 'translateY(0) scaleY(1)' }], { duration: Math.min(heavy ? 480 : 300, P * (heavy ? 1.7 : 0.9)), easing: 'ease-out' }); // (flung down, then settling)
    } else if (how === 'nod') bot.animate([{ transform: 'translateY(1.5px)' }, { transform: 'translateY(0)' }], { duration: Math.min(280, P * 0.6), easing: 'ease-out' });
    else {
      bot.animate([{ transform: 'translateY(0.6px)' }, { transform: 'translateY(0)' }], { duration: Math.min(160, P * 0.35), easing: 'ease-out' });
      const leg = w.el.querySelector(w.look < 0 ? '.leg-b' : '.leg-a');
      if (leg && leg.animate) leg.animate([{ transform: 'translateY(-1px)' }, { transform: 'translateY(0)' }], { duration: Math.min(160, P * 0.35), easing: 'steps(1, end)' });
    }
  }
  let partySeen = false;
  let forcePush = false; // (the dev tests: the next arrival pushes the tree)
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
    const el = miniBot(bot, pickLevel(bot));
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
    if (music() && Math.random() < 0.1) phonesOn(w, now, true); // (walks in wearing a pair)
    const how = Math.random();
    let pushed = null;
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
    } else if (visitors && !foggy() && (forcePush || Math.random() < 0.15) && (pushed = visitors.makeScenery(w.dir, (x) => !walkers.some((o) => o !== w && !o.leaving && Math.abs((o.state === 'walk' ? o.target : o.x) - x) < APART)))) {
      forcePush = false;
      // It arrives pushing the season's scenery ahead of it (the scary tree, a snowman, the
      // evergreen, a menorah, a kinara, the new year's sign: visitors.js), slowly, straining, and
      // leaves it standing somewhere along the card (at a spot clear of any already there)
      const t = pushed;
      w.pushing = t;
      w.speed *= 0.6;
      const W = laneW();
      const treeX = t.spot;
      w.x = w.dir > 0 ? -t.w - 4 - (SIZE - 6) : W + 4 + t.w - 6; // (the tree just off the card)
      w.target = w.dir > 0 ? treeX - (SIZE - 6) : treeX + t.w - 6;
      pushTree(w);
      mood(w, 'strain');
      botEvent(`push-${t.kind}`);
    }
    // WINTER: now and then one skates in instead, gliding in long pushes and leaving a trail of
    // powdered ice that melts away; it skates around a bit and out like any other
    if (!w.running && !w.pushing && typeof Season !== 'undefined' && Season.is('winter') && Math.random() < 0.3) {
      w.skating = true;
      w.speed *= 2;
      w.trail = 0;
      el.classList.add('skater');
    }
    place(w);
  }
  // A skater's powder: a fleck kicked off its blades every few pixels (fewer on REDUCED EFFECTS),
  // or a spray of them when it stops
  const lowFx = () => document.documentElement.classList.contains('low-fx');
  function powder(w, n = 1) {
    for (let k = 0; k < n; k++) {
      const d = document.createElement('i');
      d.className = 'skate-powder';
      const x = w.x + SIZE / 2 - w.dir * (n > 1 ? -6 : 8) + rand(-3, 3);
      d.style.transform = `translate(${x.toFixed(1)}px, ${(-rand(0, n > 1 ? 4 : 2)).toFixed(1)}px)`;
      const ms = rand(2200, 3800);
      d.style.animationDuration = `${ms.toFixed(0)}ms`;
      lane.appendChild(d);
      setTimeout(() => d.remove(), ms + 50);
    }
  }
  // The tree just ahead of its pusher; letting go leaves it where it is
  function pushTree(w) {
    const t = w.pushing;
    visitors.moveTree(t, w.dir > 0 ? w.x + SIZE - 6 : w.x - t.w + 6);
  }
  function letGo(w) {
    if (!w.pushing) return;
    w.pushing = null;
    w.speed /= 0.6;
    if (w.el.dataset.mood === 'strain') mood(w, 'idle');
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
      letGo(o);
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
    letGo(w);
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
  // (what's snacked on, by season: its colors)
  const SNACKS = {
    halloween: ['#ff3b5c', '#ffb000', '#7cff6b', '#b36bff', '#3bd1ff', '#ff7ad9'], // (gummy drops)
    winter: ['#c8894a', '#a86a34'], // (cookie bites)
    hanukkah: ['#ffcf3a', '#e6b422'], // (gelt)
    christmas: ['#ff3b3b', '#ffffff'], // (candy cane bits)
  };
  const snackColors = () => (typeof Season !== 'undefined' ? Season.active().flatMap((id) => SNACKS[id] || []) : []);
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
        c.style.setProperty('--c', pick(snackColors().length ? snackColors() : SNACKS.halloween));
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
          botEvent(Season.is('halloween') ? 'candy' : 'treat');
          setTimeout(() => {
            w.el.classList.remove('chewing');
            if (still()) mood(w, 'idle');
          }, 380);
        };
      }, k * 1250);
    }
  }

  // Whether an element can be seen where it stands: what's on top at its middle is it
  function inSight(el) {
    const r = el.getBoundingClientRect();
    if (!r.width) return false;
    const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return !!top && el.contains(top);
  }
  // Time to go: mostly a walk off the card; 15% a spooked bolt; 5% a pixelated decrypt
  function depart(w, now) {
    const r = Math.random();
    if (r < 0.05) {
      w.leaving = true;
      w.state = 'vanish';
      mood(w, 'idle');
      w.el.classList.add('pix-out');
      // (its burst is drawn over the whole page: only when it's in sight, not under a card or menu)
      if (typeof FX !== 'undefined') setTimeout(() => { if (inSight(w.el)) FX.burst([{ el: w.el, type: 'warning' }]); }, 200);
      setTimeout(() => { w.gone = true; }, 480);
      startle(w, now);
      botEvent('vanish');
    } else if (r < 0.20) fright(w, now);
    else leave(w);
  }
  // (only what changed is written: every write makes the browser re-check the styles)
  function place(w) {
    const x = w.x.toFixed(1);
    if (w.placedX !== x) {
      w.placedX = x;
      w.el.style.transform = `translateX(${x}px)`;
    }
    const look = w.look > 0 ? 'right' : w.look < 0 ? 'left' : 'front'; // (front: at you)
    if (w.el.dataset.look !== look) w.el.dataset.look = look;
    const walking = w.state === 'walk';
    const running = walking && w.running;
    if (w.placedWalk !== walking) { w.placedWalk = walking; w.el.classList.toggle('walking', walking); }
    if (w.placedRun !== running) { w.placedRun = running; w.el.classList.toggle('running', running); }
  }
  function walkTo(w, target, running = false) {
    letGo(w);
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
    letGo(w);
    mood(w, 'scared', pick(['!', '!!', '!?']));
    w.el.classList.remove('shaking', 'hopping', 'headshaking', 'snapping');
    w.state = 'startled';
    w.leaving = true; // (off it goes once the start is over)
    w.until = now + 450;
    startle(w, now);
  }

  // In the fog: two that walk into each other jump (and knock apart); now and then one bolts
  function bumps(now) {
    for (let i = 0; i < walkers.length; i++) {
      for (let j = i + 1; j < walkers.length; j++) {
        const a = walkers[i];
        const b = walkers[j];
        const free = (w) => !w.leaving && inside(w) && !['startled', 'vanish', 'poked'].includes(w.state) && now - (w.bumpAt || 0) > 4000;
        if (!free(a) || !free(b) || (a.state !== 'walk' && b.state !== 'walk') || Math.abs(a.x - b.x) > SIZE - 10) continue;
        a.bumpAt = b.bumpAt = now;
        if (Math.random() > 0.6) continue; // (passed by, just)
        botEvent('fog-bump');
        for (const [w, o] of [[a, b], [b, a]]) {
          w.state = 'idle';
          w.until = now + rand(900, 1500);
          w.look = o.x > w.x ? 1 : -1;
          w.x = Math.max(0, Math.min(laneW() - SIZE, w.x - w.look * 6)); // (knocked apart)
          mood(w, 'surprised', pick(['!?', '!', '?!']));
          place(w);
        }
        if (Math.random() < 0.3) fright(pick([a, b]), now);
      }
    }
  }
  // Seasonal visitors (visitors.js) share the lane
  const visitors = typeof createVisitors === 'function' ? createVisitors({
    lane, laneW: () => width, laneH: () => lane.clientHeight, walkers: () => walkers.filter((w) => inside(w) && !w.leaving), botEvent,
    say: (w, m, text) => mood(w, m, text),
    startle: (src, radius) => startle(src, performance.now(), radius),
    fright: (w) => { if (!w.leaving && w.state !== 'vanish' && w.state !== 'startled') fright(w, performance.now()); },
  }) : null;
  const foggy = () => !!visitors && visitors.foggy();

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
    if (!partySeen && walkers.filter((w) => inside(w) && ['pumpkin', 'ghost', 'witch', 'devil'].includes(w.el.dataset.costume)).length >= 4) { // (all four dressed up for Halloween)
      partySeen = true;
      botEvent('costume-party');
    }
    if (staying.length < want && now > nextSpawn) {
      spawn(now);
      nextSpawn = now + rand(1500, 4500);
    } else if (staying.length > want && now > nextDepart) {
      const w = staying.find((x) => x.state !== 'meet' && x.state !== 'poked' && x.state !== 'snack' && !x.pushing);
      if (w) {
        depart(w, now);
        nextDepart = now + rand(1200, 3000);
      }
    }
    const beat = music();
    for (const w of walkers) {
      if (w.phones) {
        if (!beat && !w.leaving) phonesOff(w);
        else if (beat && now - (w.beatSynced || 0) > 2000) syncBeat(w, beat); // (the tempo can move)
        w.el.classList.toggle('grooving', w.phones && !!beat && w.state === 'idle');
      }
      // (the lane got narrower, say on a turn of the phone: whoever stands past its end steps in)
      // (not one poked or startled half on the card: it reacts where it is, peeking in)
      if ((w.state === 'idle' || w.state === 'meet') && !w.leaving && w.x > laneW() - SIZE) w.x = Math.max(0, laneW() - SIZE);
      if (w.state === 'walk') {
        const pace = (w.running ? 3.4 : 1) * (foggy() && !w.running ? 0.7 : 1); // (feeling its way in the fog)
        // (a skater surges with each push, then glides; GLITCH lurches)
        const surge = w.skating && !w.running ? 0.55 + 0.9 * Math.abs(Math.sin(now / 380)) : 1;
        const step = w.speed * pace * surge * dt * (w.bot === 'glitch' && Math.random() < 0.08 ? 3 : 1);
        w.x += w.dir * step;
        if (w.skating && w.x > -SIZE && w.x < laneW() && (w.trail += step) > (lowFx() ? 14 : 6)) {
          w.trail = 0;
          powder(w);
        }
        if (w.pushing) pushTree(w);
        if ((w.dir > 0 && w.x >= w.target) || (w.dir < 0 && w.x <= w.target)) {
          w.x = w.target;
          if (w.leaving) { w.gone = true; continue; }
          if (w.pushing) { // (the tree's in place: a breather, then on its way)
            pushTree(w);
            letGo(w);
            w.state = 'idle';
            w.until = now + rand(1800, 2600);
            mood(w, 'tired', 'phew');
            place(w);
            continue;
          }
          if (w.winded) { // (arrived at a run: out of breath)
            w.winded = false;
            w.running = false;
            w.state = 'idle';
            w.until = now + rand(2400, 3600);
            mood(w, 'tired', pick(['...', 'phew', 'huff']));
          } else if (w.skating) { // (a skid to a stop, a spray of powder, a moment, then off again)
            w.running = false;
            w.state = 'idle';
            w.until = now + rand(700, 2000);
            mood(w, 'idle');
            powder(w, lowFx() ? 3 : 6);
          } else {
            w.running = false;
            w.state = 'idle';
            w.until = now + rand(900, 3200);
            mood(w, 'idle');
            if (foggy()) { if (Math.random() < 0.35) mood(w, 'worried', pick(['?', '...'])); } // (in the fog: keeping to itself, uneasy)
            else if (w.phones && music()) { w.until = now + rand(4000, 8000); mood(w, 'happy', Math.random() < 0.4 ? '♪' : ''); } // (vibing a while)
            else if (!w.phones && music() && Math.random() < 0.15) phonesOn(w, now);
            else if (snackColors().length && Math.random() < 0.3) snack(w, now); // (a seasonal snack)
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
    // Two that meet may stop and make faces at each other (in the heavy fog, they don't see each
    // other coming: they bump, and now and then one gives the other a fright)
    if (foggy()) bumps(now);
    else for (let i = 0; i < walkers.length; i++) {
      for (let j = i + 1; j < walkers.length; j++) {
        const a = walkers[i];
        const b = walkers[j];
        const busyWith = (w) => w.state === 'meet' || w.state === 'startled' || w.state === 'vanish' || w.state === 'poked' || w.state === 'snack' || w.pushing || w.leaving || w.winded
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
    if (beat && walkers.some((w) => w.phones)) groove(now, beat);
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
  // (start: after being switched back on; list / startle / crowd / dress / visit / snack / push: for the dev tests)
  return { start, phones: (w) => phonesOn(w, performance.now()), list: () => walkers, startle: (w) => startle(w, performance.now()), crowd: (n) => { want = n; nextReroll = performance.now() + 60000; }, dress, visit: (what) => visitors && visitors.visit(what), snack: (w) => snack(w, performance.now()), push: () => { forcePush = true; nextSpawn = 0; } };

}
