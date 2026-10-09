// WANDERERS: the CPUs strolling along the bottom of a card (the start screen's, and the game
// card's with SETTINGS → WANDERING BOTS on). createWanderers(lane, active) runs them in `lane` (a
// strip along the card's bottom) for as long as active() says so, and returns { start, list,
// startle }: start() brings them back after active() turned false.
// (each bot's mind kept between visits: one of each bot, so it's the same one coming back; shared
// by the start screen's and the game card's lanes, kept in this browser)
const BOT_MINDS = (() => { try { return JSON.parse(localStorage.getItem('bytefall-bot-minds')) || {}; } catch (e) { return {}; } })();
function keepBotMind(bot, m) {
  BOT_MINDS[bot] = { energy: m.energy, social: m.social, fun: m.fun, temper: m.temper, at: Date.now() };
  try { localStorage.setItem('bytefall-bot-minds', JSON.stringify(BOT_MINDS)); } catch (e) {}
}
// suspended: while it's true the lane is covered (a card, the music player, the screen saver): every
// bot and visitor stays just as it is, nothing moves, and it all carries on from there once it shows
function createWanderers(lane, active = () => true, suspended = () => false) {
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
  // MINDS (not AI: the way life sims do it). Each bot has a PERSONALITY (fixed) and NEEDS that drift:
  // ENERGY (spent walking, back resting), SOCIAL (wanes alone, filled by meeting another), FUN (wanes,
  // filled by hops, snacks, music, fishing) and TEMPER (up when it's poked, scared or loses a fish,
  // down with good things, easing back to its own calm). Its TEMPER is its face: the difficulty faces
  // are its moods: calm, the EASY smile; even, NORMAL; cross, HARD's frown; fuming, INSANE's red eyes
  // (and a HARD or INSANE one snaps when poked: poke a calm one enough and it gets there). At each stop
  // it picks what to do by what it needs, weighed by who it is, not by a dice roll; and it NOTICES
  // things: a bot fishing (it wanders over to watch), one headbanging (it joins in, with headphones),
  // a visitor going by (it turns to look). One of each bot at most, as ever.
  //   BOT      curious and cheery: goes to see what's going on
  //   GRIFTER  social and greedy: seeks company, never says no to a snack
  //   BUNKER   lazy and cautious: tires fast, rests long, slow to anger, nods rather than headbangs
  //   GLITCH   impulsive and mischievous: hops, music, quick to anger, never calm (never EASY)
  const PERSONA = {
    bot: { curious: 0.9, social: 0.6, lazy: 0.4, impulsive: 0.4, greedy: 0.4, fuse: 0.5, music: 0.5, calm: 0.2 },
    grifter: { curious: 0.5, social: 0.95, lazy: 0.4, impulsive: 0.5, greedy: 0.95, fuse: 0.6, music: 0.5, calm: 0.3 },
    bunker: { curious: 0.3, social: 0.4, lazy: 0.95, impulsive: 0.2, greedy: 0.6, fuse: 0.35, music: 0.3, calm: 0.25 },
    glitch: { curious: 0.6, social: 0.4, lazy: 0.2, impulsive: 0.95, greedy: 0.5, fuse: 0.85, music: 0.95, calm: 0.45 },
  };
  const LEVEL_TEMPER = { easy: 0.12, normal: 0.4, hard: 0.67, insane: 0.9 };
  const temperLevel = (w, t) => {
    const l = t < 0.25 ? 'easy' : t < 0.55 ? 'normal' : t < 0.8 ? 'hard' : 'insane';
    return (NEVER_LEVEL[w.bot] || []).includes(l) ? 'normal' : l;
  };
  // (a bot back after time away: rested, its temper cooled toward its calm, its company and fun
  // drifted toward even; a little different each time)
  function cameBack(bot, k) {
    const min = Math.max(0, (Date.now() - (k.at || 0)) / 60000);
    const P = PERSONA[bot] || PERSONA.bot;
    const ease = (v, to, rate) => to + (v - to) * Math.exp(-min / rate);
    return {
      energy: Math.min(1, ease(k.energy, 1, 4)),
      social: ease(k.social, 0.5, 20),
      fun: ease(k.fun, 0.5, 20),
      temper: Math.max(0, Math.min(1, ease(k.temper, P.calm, 8) + rand(-0.05, 0.05))),
    };
  }
  function mindInit(w, kept) {
    w.mind = kept ? { ...kept, seenAt: 0 } : { energy: rand(0.55, 1), social: rand(0.3, 0.9), fun: rand(0.3, 0.9), temper: LEVEL_TEMPER[w.el.dataset.level] + rand(-0.04, 0.04), seenAt: 0 };
    w.feel = (k, amt) => feel(w, k, amt); // (for scenes.js and the rest: a need nudged)
  }
  const persona = (w) => PERSONA[w.bot] || PERSONA.bot;
  function feel(w, k, amt) {
    if (!w.mind) return;
    w.mind[k] = Math.max(0, Math.min(1, w.mind[k] + amt));
    if (k === 'temper') faceTemper(w, true);
  }
  // (its face follows its temper; a little huff as it crosses into cross or fuming)
  function faceTemper(w, now) {
    const l = temperLevel(w, w.mind.temper);
    const was = w.el.dataset.level;
    if (l === was) return;
    // (a band's edge crossed by a little: held, so it doesn't flicker back and forth)
    if (!now && Math.abs(w.mind.temper - LEVEL_TEMPER[was]) < 0.2) return;
    w.el.dataset.level = l;
    const rising = LEVEL_TEMPER[l] > LEVEL_TEMPER[was];
    if (rising && MAD.includes(l) && (w.state === 'idle' || w.state === 'walk')) mood(w, 'angry', l === 'insane' ? pick(['#@!', 'GRR']) : pick(['grr', 'hmph']));
  }
  function mindTick(w, dt, now) {
    const m = w.mind;
    if (!m) return;
    const P = persona(w);
    const walking = w.state === 'walk';
    m.energy = Math.max(0, Math.min(1, m.energy + dt * (walking ? -(0.01 + 0.012 * P.lazy) * (w.running ? 3 : 1) : w.state === 'held' ? 0.01 : 0.03)));
    m.social = Math.max(0, m.social - dt * 0.006 * (0.5 + P.social));
    m.fun = Math.max(0, Math.min(1, m.fun + dt * (w.phones && music() ? 0.03 : -0.008 * (0.5 + P.impulsive))));
    m.temper += (P.calm - m.temper) * Math.min(1, dt * 0.012); // (easing back to its own calm)
    if (now - (m.faceAt || 0) > 1000) { m.faceAt = now; faceTemper(w, false); }
  }
  // At a stop: what it does, by what it needs and who it is (weighed, then a pick among the best)
  function decide(w, now) {
    const m = w.mind;
    const P = persona(w);
    const opts = [
      ['rest', (1 - m.energy) * 1.6 * (0.5 + P.lazy)],
      ['hop', (1 - m.fun) * 0.9 * (0.3 + P.impulsive) * (m.energy > 0.3 ? 1 : 0.2)],
      ['snack', snackColors().length ? (1 - m.fun) * 0.5 + P.greedy * 0.4 : 0],
      ['phones', !w.phones && music() ? (1 - m.fun) * 0.6 + P.music * 0.5 : 0],
      ['company', (1 - m.social) * 1.2 * P.social * (walkers.some((o) => o !== w && inside(o) && !o.leaving && !o.claimed) ? 1 : 0)],
      ['fidget', (1 - m.fun) * 0.35],
      ['wander', 0.35],
    ].filter(([, s]) => s > 0.02);
    const best = Math.max(...opts.map(([, s]) => s));
    const near = opts.filter(([, s]) => s > best * 0.6); // (the best few: so it isn't always the same)
    let r = Math.random() * near.reduce((a, [, s]) => a + s, 0);
    let pickd = near[0][0];
    for (const [k, s] of near) if ((r -= s) <= 0) { pickd = k; break; }
    if (pickd === 'rest') {
      w.until = now + rand(3500, 7000) * (0.6 + P.lazy);
      if (m.energy < 0.35) mood(w, 'tired', pick(['phew', '...', 'huff']));
    } else if (pickd === 'hop') {
      const hops = Math.random() < 0.5 + P.impulsive * 0.3 ? 2 : 1;
      w.el.style.setProperty('--hops', hops);
      w.el.classList.add('hopping');
      setTimeout(() => w.el.classList.remove('hopping'), hops * HOP_MS + 50);
      w.until = Math.max(w.until, now + hops * HOP_MS + 400);
      feel(w, 'fun', 0.12);
    } else if (pickd === 'snack') { snack(w, now); feel(w, 'fun', 0.25); feel(w, 'temper', -0.12); }
    else if (pickd === 'phones') phonesOn(w, now);
    else if (pickd === 'company') { // (over to the nearest other one)
      const others = walkers.filter((o) => o !== w && inside(o) && !o.leaving && !o.claimed).sort((a, b) => Math.abs(a.x - w.x) - Math.abs(b.x - w.x));
      if (others.length) walkTo(w, Math.max(0, Math.min(laneW() - SIZE, others[0].x + (others[0].x > w.x ? -SIZE - 4 : SIZE + 4))));
    } else if (pickd === 'fidget') w.el.dataset.variant = pick(['bored', 'tapping']);
  }
  // Noticing: a bot fishing, one headbanging, a visitor going by; true if it went off to see
  function notice(w, now) {
    const m = w.mind;
    if (!m || now - m.seenAt < 4000) return false;
    m.seenAt = now;
    const P = persona(w);
    const fisher = walkers.find((o) => o !== w && o.claimed && o.el.querySelector('.fish-rod'));
    if (fisher && Math.random() < P.curious * 0.5) { // (to the shore to watch)
      const x = Math.max(0, Math.min(laneW() - SIZE, fisher.x + rand(-60, 60)));
      walkTo(w, x);
      mood(w, 'happy', pick(['ooh', '?', '']));
      return true;
    }
    const banger = walkers.find((o) => o !== w && o.pose && inside(o));
    if (banger && w.phones && music() && Math.random() < P.music * 0.6) { // (in beside it)
      walkTo(w, Math.max(0, Math.min(laneW() - SIZE, banger.x + (banger.x > w.x ? -SIZE - 2 : SIZE + 2))));
      return true;
    }
    if (visitors) { // (a visitor near: it turns to look)
      const v = visitors.list().find((o) => o.state !== 'fogtree' && o.state !== 'scenery' && Math.abs(o.x - w.x) < 90);
      if (v && Math.random() < P.curious) { w.look = v.x > w.x ? 1 : -1; if (Math.random() < 0.4) mood(w, 'surprised', '?'); }
    }
    return false;
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
      if (feeling) {
        for (const h of felt) {
          // (BUNKER, or a tired one: no windmill, a headbang instead)
          if (h.feel === 'blast' && (w.bot === 'bunker' || (w.mind && w.mind.energy < 0.3))) { if (h.beat) pose(w, 'bang', P); continue; }
          if (h.feel === 'blast') { const n = millBeats(P); if ((n === 1 ? h.beat : h.half) && !(w.pose && w.pose.kind === 'mill' && performance.now() - w.pose.start < P * (n - 0.2))) pose(w, 'mill', P); } // (a cycle every beat or two, as drawn, from the beats)
          else if (h.feel === 'gallop' || h.half) pose(w, h.feel === 'half' ? 'bang-heavy' : 'bang', P);
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
    if (pixelOn()) return pixelMove(w, how, P);
    if (how === 'spin') { // (the metalhead's helicopter: the head whirled round in a circle on the neck, tilting out as it goes)
      const d = w.look < 0 ? -1 : 1;
      const frames = [];
      for (let k = 0; k <= 8; k++) {
        const a = (k / 8) * Math.PI * 2;
        frames.push({ transform: `translate(${(d * 3 * Math.sin(a)).toFixed(2)}px, ${(1.5 - 1.5 * Math.cos(a)).toFixed(2)}px) rotate(${(d * 14 * Math.sin(a)).toFixed(1)}deg)` });
      }
      bot.animate(frames, { duration: P, easing: 'linear' });
    }
    else if (how === 'bang' || how === 'bang-heavy') {
      const heavy = how === 'bang-heavy';
      bot.animate([{ transform: `translateY(${heavy ? 3 : 2}px) scaleY(${heavy ? 0.86 : 0.92})` }, { transform: 'translateY(0) scaleY(1)' }], { duration: Math.min(heavy ? 420 : 260, P * (heavy ? 1.6 : 0.8)), easing: 'cubic-bezier(.2,.8,.3,1)' });
    } else if (how === 'nod') bot.animate([{ transform: 'translateY(1.5px)' }, { transform: 'translateY(0)' }], { duration: Math.min(280, P * 0.6), easing: 'ease-out' });
    else {
      bot.animate([{ transform: 'translateY(0.6px)' }, { transform: 'translateY(0)' }], { duration: Math.min(160, P * 0.35), easing: 'ease-out' });
      const leg = w.el.querySelector(w.look < 0 ? '.leg-b' : '.leg-a');
      if (leg && leg.animate) leg.animate([{ transform: 'translateY(-1px)' }, { transform: 'translateY(0)' }], { duration: Math.min(160, P * 0.35), easing: 'steps(1, end)' });
    }
  }
  // PIXEL MODE (pixel.js): each groove move a few frames of whole screen pixels, played by the frame
  // loop (pxPlay): the head dropping a pixel or two and back, the helicopter's turn redrawn sprite
  // pixel by sprite pixel each frame
  const PX = () => SIZE / 16 / (typeof Pixel !== 'undefined' ? Pixel.RES : 2); // (a screen pixel, on the page)
  const pixelOn = () => typeof Pixel !== 'undefined' && Pixel.on();
  function pixelMove(w, how, P) {
    const d = w.look < 0 ? -1 : 1;
    let frames;
    if (how === 'spin') {
      frames = [];
      for (let k = 0; k < 16; k++) {
        const a = (k / 16) * Math.PI * 2;
        frames.push({ at: (k / 16) * P, dx: d * 2 * Math.sin(a), dy: 1 - Math.cos(a), angle: d * 16 * Math.sin(a) });
      }
    } else if (how === 'bang' || how === 'bang-heavy') {
      const deep = how === 'bang-heavy' ? [2, 3, 3, 2.5, 2, 1.5, 1, 0.5, 0] : [1, 2, 1.5, 1, 0.5, 0];
      const span = Math.min(how === 'bang-heavy' ? 420 : 260, P * (how === 'bang-heavy' ? 1.6 : 0.8));
      frames = deep.map((dy, k) => ({ at: (k / deep.length) * span, dy, angle: 0 }));
    } else if (how === 'nod') {
      const span = Math.min(280, P * 0.6);
      frames = [1, 1, 0.5, 0].map((dy, k) => ({ at: (k / 4) * span, dy }));
    } else { // (a tap: the foot up a pixel, the head dipping half of one)
      const span = Math.min(160, P * 0.35);
      frames = [0.5, 0].map((dy, k) => ({ at: (k / 2) * span, dy }));
      const leg = w.el.querySelector(w.look < 0 ? '.leg-b' : '.leg-a');
      if (leg && leg.animate) leg.animate([{ transform: 'translateY(-1px)' }, { transform: 'translateY(0)' }], { duration: span, easing: 'steps(1, end)' });
    }
    w.prog = { start: performance.now(), frames, sprite: frames.some((f) => f.angle) ? Pixel.snapshot(w.el.querySelector('svg')) : null };
  }
  // (the frame playing now, applied: offsets by the bot's own transform, turns redrawn; and the
  // skaters' forward lean, redrawn too, its legs read again every few frames)
  function pxPlay(w, now) {
    if (w.pose) return; // (a pose is drawing it: posePlay)
    const svg = w.el.querySelector('svg');
    const bot = w.el.querySelector('.bot');
    let f = null;
    if (w.prog) {
      const t = now - w.prog.start;
      for (const fr of w.prog.frames) if (fr.at <= t) f = fr;
      const lastAt = w.prog.frames[w.prog.frames.length - 1].at;
      if (t > lastAt + 60) { w.prog = null; f = null; }
    }
    let lean = 0;
    if (!f && w.skating && w.state === 'walk') lean = w.dir * 9;
    const head = { dx: f ? f.dx || 0 : 0, dy: f ? f.dy || 0 : 0, angle: f ? f.angle || 0 : lean, pivot: [8, 11] };
    if (head.angle) {
      if (!f && (!w.leanSprite || now - (w.leanAt || 0) > 140)) { Pixel.clear(svg); bot.style.transform = ''; w.leanSprite = Pixel.snapshot(svg); w.leanAt = now; }
      Pixel.draw(svg, f ? w.prog.sprite : w.leanSprite, head);
      bot.style.transform = '';
    } else {
      Pixel.clear(svg);
      w.leanSprite = null;
      bot.style.transform = head.dx || head.dy ? `translate(${Pixel.snap(head.dx)}px, ${Pixel.snap(head.dy)}px)` : '';
    }
  }
  // CORE DUMP'S POSES (drawn as pixel sprites, pixel mode or not): the bot BENT OVER, the top of
  // its head to you (the headphones' band across it) and its hair hanging down in front to the
  // floor. A HEADBANG is four frames a beat: up, tilting forward (the hair falling over its face),
  // face down on the beat, tilting back. The WINDMILL stays bent over while the hair sweeps a full
  // circle round the crown each beat (eight frames, trailing strands behind), the head swaying.
  const HAIR = ['#2c2833', '#5f5670'];
  const lum = (c) => { const m = /(\d+),\s*(\d+),\s*(\d+)/.exec(c); return m ? 0.3 * m[1] + 0.59 * m[2] + 0.11 * m[3] : 128; };
  const shade = (c) => { const m = /(\d+),\s*(\d+),\s*(\d+)/.exec(c); return m ? `rgb(${m.slice(1).map((v) => Math.round(v * 0.62)).join(', ')})` : c; };
  // (how many beats a drawn cycle spans: its drawn length to the nearest whole beat, 1 or 2)
  const drawnBeats = (name, P) => {
    const A = typeof BOT_ANIMS !== 'undefined' && BOT_ANIMS[name];
    if (!A || !A.ms) return 2;
    return Math.min(2, Math.max(1, Math.round(A.ms.reduce((t, v) => t + v, 0) / P)));
  };
  const millBeats = (P) => drawnBeats('windmill', P);
  // (a drawn animation's frames at their drawn pace, fitted to beats (1 or 2) of P, from its hit frame round)
  function drawnFrames(name, P, beats) {
    const A = BOT_ANIMS[name];
    const n = A.frames.length;
    const order = A.frames.map((_, k) => (k + (A.hit || 0)) % n);
    const ms = order.map((k) => (A.ms && A.ms[k]) || 40);
    const scale = (beats * P) / ms.reduce((t, v) => t + v, 0);
    let t = 0;
    return order.map((k, i) => { const f = { at: t, pose: 'drawn', anim: name, k }; t += ms[i] * scale; return f; });
  }
  function pose(w, kind, P) {
    let frames;
    const drawn = typeof BOT_ANIMS !== 'undefined';
    let cycle = 0; // (a drawn one's length: it ends when its cycle does)
    if (kind === 'mill' && drawn) { // (the drawn ones, bot-anims.js: at their drawn pace, fitted to the beat)
      cycle = millBeats(P) * P;
      frames = drawnFrames('windmill', P, millBeats(P));
    } else if ((kind === 'bang' || kind === 'bang-heavy') && drawn && BOT_ANIMS.headbang) { // (the heavy one at half the pace)
      const beats = kind === 'bang-heavy' ? 2 * drawnBeats('headbang', P) : drawnBeats('headbang', P);
      cycle = beats * P;
      frames = drawnFrames('headbang', P, beats);
    } else if (kind === 'mill') {
      frames = [];
      for (let k = 0; k < 8; k++) frames.push({ at: (k / 8) * P, pose: 'mill', a: (k / 8) * Math.PI * 2 * (w.look < 0 ? -1 : 1) });
    } else if (kind === 'bang-heavy') frames = [{ at: 0, pose: 'tilt' }, { at: P * 0.15, pose: 'down' }, { at: P * 1.0, pose: 'tilt' }, { at: P * 1.4, pose: 'up' }];
    else frames = [{ at: 0, pose: 'tilt' }, { at: P * 0.12, pose: 'down' }, { at: P * 0.42, pose: 'tilt' }, { at: P * 0.66, pose: 'up' }];
    const svg = w.el.querySelector('svg');
    if (!w.pose) w.poseBase = Pixel.snapshot(svg); // (its own pixels, upright: what the poses are made from)
    w.pose = { kind, start: performance.now(), frames, end: cycle || frames[frames.length - 1].at + (kind === 'mill' ? P / 8 : 60) };
  }
  function posePlay(w, now) {
    const svg = w.el.querySelector('svg');
    const t = now - w.pose.start;
    if (t > w.pose.end) { w.pose = null; w.poseKey = null; Pixel.clear(svg); svg.classList.remove('px-pose'); return; }
    let f = w.pose.frames[0];
    for (const fr of w.pose.frames) if (fr.at <= t) f = fr;
    const key = `${f.pose}${f.anim || ''}${f.a || 0}${f.k || 0}`;
    if (key === w.poseKey) return;
    w.poseKey = key;
    if (f.pose === 'up') { Pixel.clear(svg); svg.classList.remove('px-pose'); return; }
    svg.classList.add('px-pose');
    Pixel.draw(svg, poseCells(w, f));
  }
  function poseCells(w, f) {
    const base = w.poseBase;
    const cells = new Map();
    const set = (x, y, c) => cells.set(`${x},${y}`, c);
    // (the body's color: the one most of its pixels are)
    const count = {};
    for (const c of base.values()) count[c] = (count[c] || 0) + 1;
    const body = Object.keys(count).sort((a, b) => count[b] - count[a])[0];
    const LEGS = 13;
    if (f.pose === 'drawn') { // (a drawn animation's frame, bot-anims.js, in this bot's own colors; mirrored when it faces left)
      const A = BOT_ANIMS[f.anim];
      const face0 = Object.keys(count).filter((c) => c !== body).sort((a, b) => lum(a) - lum(b))[0] || '#01120a';
      const role = { b: body, f: face0, s: shade(body) };
      A.frames[f.k].forEach((row, j) => {
        for (let i = 0; i < row.length; i++) {
          const ch = row[i];
          if (ch === '.') continue;
          const x = A.x0 + i;
          set(w.look < 0 ? 15 - x : x, A.y0 + j, role[ch] || A.pal[ch]);
        }
      });
      return cells;
    }
    for (const [k, c] of base) { const [x, y] = k.split(',').map(Number); if (y >= LEGS) set(x, y, c); } // (the legs stay planted)
    // The metal salute: a fist raised beside the head, two fingers up (the horns), in the headbang
    const horns = (ax, from) => {
      for (let y = from; y >= from - 4; y--) set(ax, y, body); // (the arm, up)
      for (let x = ax - 1; x <= ax + 1; x++) { set(x, from - 5, body); set(x, from - 6, body); } // (the fist)
      set(ax - 1, from - 7, body); set(ax + 1, from - 7, body); set(ax - 1, from - 8, body); set(ax + 1, from - 8, body); // (the horns)
    };
    if (f.pose === 'tilt') { // (the head pitched forward and down two pixels, hair falling over its brow)
      horns(w.look < 0 ? 0 : 15, 9);
      for (const [k, c] of base) { const [x, y] = k.split(',').map(Number); if (y < LEGS && y + 2 <= LEGS) set(x, y + 2, c); }
      for (let x = 2; x <= 13; x++) for (let y = 3; y <= 5 + ((x * 7) % 3); y++) set(x, y, HAIR[(x + y) % 5 === 0 ? 1 : 0]);
      return cells;
    }
    // Bent over: the head hanging low, its top to you (the headphones' band across it) and its face
    // to the floor: a rounded lower edge, the rim in shadow, the dark face plate just showing
    // underneath. In the windmill it circles on its neck (round and up and down), narrowing as it
    // swings to the sides as if turning, the cups keeping to its edges.
    const face = [...count ? Object.keys(count) : []].filter((c) => c !== body).sort((a, b) => lum(a) - lum(b))[0] || '#020403';
    const a = f.pose === 'mill' ? f.a : 0;
    const cxh = 7.5 + (f.pose === 'mill' ? 2 * Math.sin(a) : 0);
    const top = 6 + (f.pose === 'mill' ? Math.round(1 - Math.cos(a)) : 0); // (its lower edge just over the legs)
    const half = f.pose === 'mill' ? 6.5 * (0.62 + 0.38 * Math.abs(Math.cos(a))) : 6.5;
    const L = Math.round(cxh - half);
    const R = Math.round(cxh + half);
    const rows = [[0, 1], [1, 0], [2, 0], [3, 0], [4, 0], [5, 1], [6, 2]]; // (row, how far in at each end: rounded)
    for (const [r, inset] of rows) for (let x = L + inset; x <= R - inset; x++) set(x, top + r, r >= 5 ? shade(body) : body);
    // (its face, aimed at the floor: the eyes and mouth just peeking at the bottom edge)
    const mid = Math.round(cxh);
    for (let x = L + 1; x <= R - 1; x++) set(x, top + 5, body);
    if (R - L >= 9) {
      set(mid - 3, top + 5, face); set(mid - 2, top + 5, face); set(mid + 1, top + 5, face); set(mid + 2, top + 5, face); // (eyes)
      set(mid - 1, top + 6, face); set(mid, top + 6, face); // (mouth)
    } else { set(mid, top + 5, face); set(mid + (cxh > 7.5 ? 1 : -1), top + 5, face); } // (turned: one eye showing)
    if (w.phones) {
      for (let x = L + 1; x <= R - 1; x++) set(x, top + 1, '#2b2f36');
      for (let y = top + 1; y <= top + 4; y++) { set(L - 1, y, '#e0455f'); set(R + 1, y, '#e0455f'); }
    }
    // The crown's hair over the top of the head, the body's color showing round it
    for (let y = top + 2; y <= top + 3; y++) for (let x = Math.round(cxh) - 3 + (y === top + 2 ? 1 : 0); x <= Math.round(cxh) + 2 - (y === top + 2 ? 1 : 0); x++) set(x, y, HAIR[(x * 3 + y) % 7 === 0 ? 1 : 0]); // (a patch at the crown, where it grows from)
    if (f.pose === 'down') { // (hanging straight down in front, ragged at the ends)
      horns(w.look < 0 ? L - 2 : R + 2, top + 3);
      for (let x = 2; x <= 13; x++) {
        const len = 2 + ((x * 5) % 3);
        if (Math.abs(x - mid) > 1) continue; // (a few strands hanging straight down off the face, between the legs)
        for (let y = top + 7; y < top + 7 + len; y++) set(x, y, HAIR[(x + y) % 6 === 0 ? 1 : 0]);
      }
      return cells;
    }
    // The windmill: the hair a blade sweeping round the crown, two fainter strands trailing it
    const cx = cxh;
    const cy = top + 4;
    [[0, 11, HAIR[0]], [-0.45, 9, HAIR[0]], [-0.9, 6, HAIR[1]]].forEach(([lag, len, c]) => {
      const a = f.a + lag * (w.look < 0 ? -1 : 1);
      for (let r = 1; r <= len; r += 0.5) {
        const x = Math.round(cx + Math.sin(a) * r);
        const y = Math.round(cy + Math.cos(a) * r);
        set(x, y, c);
        set(x + 1, y, c); // (as thick as a lock of hair)
      }
    });
    return cells;
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

  // (o, from the dev page's bot sandbox: { bot, level, enter: 'left' | 'right' | 'pop' | 'run' |
  // 'push', skate, phones, costume: false }; left out, chance decides as ever)
  // PUSHED BITs: now and then one arrives pushing a numbered BIT onto the card instead of the
  // season's scenery (any time of year). How often goes by personality: GRIFTER's mischief the
  // most, GLITCH and BOT now and then, lazy BUNKER hardly ever. EASY and NORMAL ones push a 1 to 7;
  // HARD and INSANE (from their 8x8 board) a 1 to 8, an 8 one time in twelve or so (8%)
  const BIT_ODDS = { grifter: 0.035, glitch: 0.03, bot: 0.025, bunker: 0.01 };
  let pushBit = null; // (decided once a spawn: whether this one pushes a BIT)
  const bitPush = (bot, o) => {
    if (pushBit === null) pushBit = o.enter === 'bit' || (!o.enter && Math.random() < (BIT_ODDS[bot] || 0.02));
    return pushBit;
  };
  const bitValue = (level) => (MAD.includes(level) && Math.random() < 0.08 ? 8 : 1 + Math.floor(Math.random() * 7));
  function spawn(now, o = {}) {
    pushBit = null;
    const free = BOTS.filter((b) => !walkers.some((w) => w.bot === b));
    if (!free.length && !o.bot) return;
    const bot = o.bot || pick(free);
    const fromLeft = o.enter === 'left' ? true : o.enter === 'right' ? false : Math.random() < 0.5;
    const kept = !o.level && BOT_MINDS[bot] ? cameBack(bot, BOT_MINDS[bot]) : null; // (back again: as it left, eased by the time away)
    const el = miniBot(bot, o.level || (kept ? temperLevel({ bot }, kept.temper) : pickLevel(bot)));
    el.classList.add('walker');
    if (o.costume !== false) dress(el, bot, !!o.costume);
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
    mindInit(w, kept);
    walkers.push(w);
    if (o.phones || (o.phones === undefined && music() && Math.random() < 0.1)) phonesOn(w, now, true); // (walks in wearing a pair)
    const how = o.enter === 'pop' ? 0 : o.enter === 'run' ? 0.2 : o.enter ? 0.5 : Math.random();
    if (o.enter === 'push') forcePush = true;
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
    } else if (visitors && !foggy() && (bitPush(bot, o) || forcePush || (!o.enter && Math.random() < 0.15))
      && (pushed = visitors.makeScenery(w.dir, (x) => !walkers.some((o) => o !== w && !o.leaving && Math.abs((o.state === 'walk' ? o.target : o.x) - x) < APART), bitPush(bot, o) ? bitValue(el.dataset.level) : 0))) {
      forcePush = false;
      pushBit = null;
      // It arrives pushing the season's scenery ahead of it (the scary tree, a snowman, the
      // evergreen, a menorah, a kinara, the new year's sign: visitors.js), slowly, straining, and
      // leaves it standing somewhere along the card (at a spot clear of any already there)
      const t = pushed;
      w.pushing = t;
      w.pushed = t; // (what it brought in: it minds if it's poked away later)
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
    if (o.skate || (o.skate === undefined && !w.running && !w.pushing && typeof Season !== 'undefined' && Season.is('winter') && Math.random() < 0.3)) {
      w.skating = true;
      w.speed *= 2;
      w.trail = 0;
      el.classList.add('skater');
      // (a blade under each foot, two pixels long toward the front, moving with its leg)
      el.querySelectorAll('svg rect.leg').forEach((leg) => {
        const blade = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        for (const [k, v] of [['x', leg.getAttribute('x')], ['y', 15], ['width', 2], ['height', 1], ['class', `${leg.getAttribute('class')} skate-blade`]]) blade.setAttribute(k, v);
        leg.after(blade);
      });
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
    if (w.possessed) return exorcise(w, now);
    if (w.claimed && w.onPoke) { botEvent('pokes'); w.onPoke(); return; } // (busy: the scene says how it takes it)
    const wasMad = MAD.includes(w.el.dataset.level); // (the face it had: a calm one shows it's cross first, then snaps)
    if (w.mind) feel(w, 'temper', 0.16 + 0.22 * persona(w).fuse); // (poked: crosser; enough and it's HARD's frown, then it snaps)
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
    if (wasMad) return rabid(w, now);
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

  // POSSESSED (OCTOBER, visitors.js): red eyes and a stiff, slow walk; the others it meets are scared
  // of it. Poked, it shakes and a little ghost shakes out of it and floats away; it comes to, dizzy
  function possess(w) {
    if (w.possessed || w.leaving) return;
    w.possessed = true;
    w.speed *= 0.6;
    w.el.classList.add('possessed');
    mood(w, 'idle', pick(['...', 'ooo']));
    botEvent('visit-possessed');
  }
  function exorcise(w, now) {
    letGo(w);
    w.state = 'poked';
    w.until = now + 2800;
    w.look = 0;
    w.el.classList.add('shaking');
    mood(w, 'surprised', '!!');
    place(w);
    setTimeout(() => {
      w.possessed = false;
      w.speed /= 0.6;
      w.el.classList.remove('possessed', 'shaking');
      if (visitors && !w.gone) visitors.spirit(w.x + SIZE / 2);
      mood(w, 'dizzy', '@_@');
    }, 800);
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
    const x = (pixelOn() ? Math.round(w.x / PX()) * PX() : w.x).toFixed(2); // (PIXEL MODE: on the screen's grid)
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
    if (w.mind) { feel(w, 'temper', 0.08 * persona(w).fuse); feel(w, 'energy', -0.12); } // (shaken)
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
    // (a visitor holding one where it stands: RANSOMWARE; and turning one to look: SPYWARE)
    hold: (w, ms) => { if (!w.leaving && (w.state === 'walk' || w.state === 'idle')) { w.state = 'idle'; w.until = performance.now() + ms; w.target = w.x; place(w); } },
    face: (w, x) => { w.look = x > w.x + SIZE / 2 ? 1 : -1; place(w); },
    // (LIGHTS OUT: one somewhere else when they come back on; and the POSSESSED bot)
    move: (w, x) => { w.x = Math.max(0, Math.min(laneW() - SIZE, x)); w.target = w.x; place(w); },
    possess: (w) => possess(w),
    // (a scene's errand, scenes.js: a bot taken for it (onPoke: how a poke lands while it's busy),
    // walked somewhere (onArrive when it's there), raised (onto the dock), and let go again)
    claim: (w, onPoke) => {
      if (w.claimed || w.leaving || !['walk', 'idle'].includes(w.state)) return false;
      if (w.partner) { w.partner.partner = null; w.partner = null; }
      w.claimed = true;
      w.onPoke = onPoke;
      return true;
    },
    go: (w, x, onArrive) => { if (!w.claimed) return; w.onArrive = onArrive; walkTo(w, x); },
    lift: (w, px) => { w.el.style.translate = px ? `0 ${(-px).toFixed(1)}px` : ''; },
    turn: (w, dir) => { w.look = dir; place(w); },
    release: (w) => {
      if (!w.claimed) return;
      w.claimed = false;
      w.onPoke = null;
      w.onArrive = null;
      w.el.style.translate = '';
      if (w.state === 'held') { w.state = 'idle'; w.until = performance.now() + rand(800, 1600); }
    },
    // (the BIT a bot was pushing, poked away from under its hands: it stops, put out)
    lostPush: (t) => {
      for (const w of walkers) {
        if ((w.pushing !== t && w.pushed !== t) || w.leaving || ['startled', 'vanish', 'poked'].includes(w.state)) continue;
        letGo(w);
        w.pushed = null;
        w.state = 'idle';
        w.target = w.x;
        w.until = performance.now() + rand(1400, 2000);
        w.look = t.x + t.w / 2 > w.x + SIZE / 2 ? 1 : -1; // (at it)
        if (w.partner) w.partner.partner = null;
        w.partner = null;
        mood(w, 'annoyed', pick(['-_-', 'hey!', '...']));
        place(w);
      }
    },
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
    if (suspended()) { // (held as it is, not cleared: on again from here)
      last = now;
      requestAnimationFrame(frame);
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
      const w = staying.find((x) => x.state !== 'meet' && x.state !== 'poked' && x.state !== 'snack' && !x.pushing && !x.claimed);
      if (w) {
        depart(w, now);
        nextDepart = now + rand(1200, 3000);
      }
    }
    const beat = music();
    for (const w of walkers) {
      mindTick(w, dt, now);
      if (w.phones) {
        if (!beat && !w.leaving) phonesOff(w);
        else if (beat && now - (w.beatSynced || 0) > 2000) syncBeat(w, beat); // (the tempo can move)
        w.el.classList.toggle('grooving', w.phones && !!beat && w.state === 'idle');
      }
      // (the lane got narrower, say on a turn of the phone: whoever stands past its end steps in)
      // (not one poked or startled half on the card: it reacts where it is, peeking in)
      if ((w.state === 'idle' || w.state === 'meet') && !w.leaving && w.x > laneW() - SIZE) w.x = Math.max(0, laneW() - SIZE);
      if (w.state === 'walk') {
        const pace = (w.running ? 3.4 : 1) * (foggy() && !w.running ? 0.7 : 1) * (w.mind ? 0.65 + 0.35 * w.mind.energy : 1); // (feeling its way in the fog; slower when tired)
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
          if (w.claimed) { // (a scene's errand, scenes.js: it waits there for what's next)
            w.running = false;
            w.state = 'held';
            place(w);
            const next = w.onArrive;
            w.onArrive = null;
            if (next) next();
            continue;
          }
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
            else if (w.phones && music()) { w.until = now + rand(4000, 8000); mood(w, 'happy', Math.random() < 0.4 ? '♪' : ''); feel(w, 'fun', 0.08); } // (vibing a while)
            else decide(w, now); // (what it needs, by who it is)
          }
        }
      } else if (w.state === 'startled') {
        if (now > w.until) { w.leaving = false; leave(w, true); }
      } else if (w.state === 'vanish') {
        // (decrypting away)
      } else if (w.state === 'held') {
        // (a scene has it: fishing off the dock, scenes.js)
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
        if (notice(w, now)) { /* (off to see) */ } else if (now - w.born > 9000 && Math.random() < 0.35 * (w.mind ? 0.5 + w.mind.social : 1)) depart(w, now); // (satisfied company: likelier to go)
        else walkTo(w, freeSpot(w));
      }
      place(w);
      if (w.pose) posePlay(w, now);
      if (pixelOn()) { w.pxDt = dt; pxPlay(w, now); } else if (!w.pose && (w.prog || w.el.querySelector('svg.px-drawn'))) { w.prog = null; Pixel.clear(w.el.querySelector('svg')); w.el.querySelector('.bot').style.transform = ''; }
    }
    // Two that meet may stop and make faces at each other (in the heavy fog, they don't see each
    // other coming: they bump, and now and then one gives the other a fright)
    if (foggy()) bumps(now);
    else for (let i = 0; i < walkers.length; i++) {
      for (let j = i + 1; j < walkers.length; j++) {
        const a = walkers[i];
        const b = walkers[j];
        const busyWith = (w) => w.claimed || w.state === 'held' || w.state === 'meet' || w.state === 'startled' || w.state === 'vanish' || w.state === 'poked' || w.state === 'snack' || w.pushing || w.leaving || w.winded
          || w.el.dataset.mood === 'tired' || w.el.dataset.mood === 'surprised';
        if (busyWith(a) || busyWith(b) || !inside(a) || !inside(b)) continue;
        if (Math.abs(a.x - b.x) > SIZE + 6 || now - a.metAt < 7000 || now - b.metAt < 7000) continue;
        a.metAt = b.metAt = now;
        // (as likely as they want company; a cross one isn't in the mood)
        const want = a.mind && b.mind ? ((1 - a.mind.social) * persona(a).social + (1 - b.mind.social) * persona(b).social) / 2 : 0.45;
        if (Math.random() > Math.min(0.85, 0.15 + want * 1.4)) continue;
        let pair = pick(MEETINGS);
        for (let k = 0; k < 12 && !pairFits(a, b, pair); k++) pair = pick(MEETINGS);
        if (!pairFits(a, b, pair)) pair = ['surprised', 'surprised'];
        if (a.possessed || b.possessed) pair = [a.possessed ? 'devious' : 'scared', b.possessed ? 'devious' : 'scared']; // (one of them isn't itself)
        if (a.mind && a.mind.temper > 0.6 && !a.possessed && !b.possessed) pair = ['annoyed', pair[1]]; // (a cross one's cross)
        if (b.mind && b.mind.temper > 0.6 && !a.possessed && !b.possessed) pair = [pair[0], 'annoyed'];
        for (const o of [a, b]) if (o.mind) { feel(o, 'social', 0.45); feel(o, 'fun', 0.08); }
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
      if (w.gone) { w.el.remove(); if (w.mind) keepBotMind(w.bot, w.mind); }
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
  return { start, poseFrames: (w, kind, P = 632) => { // (the dev page's animation editor: a pose's frames as pixels, and how long each shows)
    const svg = w.el.querySelector('svg');
    pose(w, kind, P);
    const fr = w.pose.frames;
    const out = fr.map((f, i) => ({ ms: Math.round((i + 1 < fr.length ? fr[i + 1].at : w.pose.end) - f.at), cells: f.pose === 'up' ? new Map(w.poseBase) : poseCells(w, f) }));
    w.pose = null; w.poseKey = null; Pixel.clear(svg); svg.classList.remove('px-pose');
    return out;
  }, poseAt: (w, kind, t, P = 316) => { pose(w, kind, P); w.pose.start = performance.now() - t; }, clearAll: () => { walkers.forEach((w) => w.el.remove()); walkers = []; want = 0; nextReroll = performance.now() + 1e9; if (visitors) visitors.clear(true); }, mood, fright: (w) => fright(w, performance.now()), rabid: (w) => rabid(w, performance.now()), spawn: (o) => spawn(performance.now(), o), poke: (w) => poke(w, performance.now()), depart: (w) => depart(w, performance.now()), phonesOff, phones: (w) => phonesOn(w, performance.now()), list: () => walkers, startle: (w) => startle(w, performance.now()), crowd: (n) => { want = n; nextReroll = performance.now() + 60000; }, dress, visit: (what) => visitors && visitors.visit(what), visitorList: () => (visitors ? visitors.list() : []), weather: () => (visitors && visitors.weather ? visitors.weather() : null), scene: () => (visitors && visitors.scene ? visitors.scene() : null), visitorArt: () => (visitors ? visitors.art() : null), snack: (w) => snack(w, performance.now()), push: () => { forcePush = true; nextSpawn = 0; } };

}
