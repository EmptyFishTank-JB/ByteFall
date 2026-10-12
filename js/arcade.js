// THE DAILY ARCADE: a game of its own each day on the DAILY menu's ARCADE card, played on a card over
// the game card instead of ByteFall's board: MONDAY CODE BREAKER (arcade-codebreaker.js), TUESDAY
// TRACE (arcade-trace.js), THURSDAY CHECKSUM (arcade-checksum.js); the other days' are still to come
// (till then the card says which is next, and when). This is the frame they share: the card, its
// title and line (the clock, what's left, the result, a passing note), the game's own part under
// them, and SHARE once it's over. One game a day, the same for everyone (seeded by the date, UTC),
// saved as it goes (BACK keeps it); its first move is the day's daily game (the streak, the day's KEYS
// and MASTER KEY), and its result pays KEYS. Loaded before script.js: what it uses of it (storage,
// todayKey, seeded, hashString, fillBit, homeNotice, syncPanelOpen ...) it reaches only once the page
// is running. PRACTICE, saved nowhere and paying nothing: ?arcade=trace (or any game's id) on the
// page's address plays that one any day, and with UNLOCK EVERYTHING on, the card's DEV row does too
// (and PLAY on a day with no game plays the next one).
//
// A game (Arcade.register(id, game)): name, rule() (the DAILY card's line), make(rand, saved) (its
// state from the day's seed, with what was saved), pack(s) (what to save), over(s), status(saved)
// (the DAILY card's: { done, text }), line(s), show(s) (its part drawn, for s), key(e) (a key: true
// if taken), fit(), pay(s) (its result counted: the KEYS paid), share(s) (SHARE's lines), leave()
// (the card closing, or another game on it), and timed (a clock: 'open', running whenever the card's
// up, or 'move', from the first move).
const Arcade = (() => {
  const el = (id) => document.getElementById(id);
  const card = el('arcade');
  const titleEl = el('arcade-title');
  const lineEl = el('arcade-line');
  const overEl = el('arcade-over');
  const shareBtn = el('arcade-share');
  const nextEl = el('arcade-next');
  const devEl = el('arcade-dev');
  const GAMES = {};
  const DAYS = ['codebreaker', 'trace', null, 'checksum', null, null, null]; // (UTC weekdays, Monday first)
  let g = null; // the game on the card: { id, day, practice, played, paid, k (KEYS paid), t (ms on the clock), moved, ...its own }
  let noteUntil = 0;
  let noteTimer = 0;
  let clockTimer = 0;
  let clockAt = 0;

  const today = () => DAYS[utcWeekday()];
  const saveKey = (id, day) => `bytefall-arcade-${id}-${day}`;
  function saved(id, day) {
    try {
      const s = JSON.parse(storage.get(saveKey(id, day)));
      return s && typeof s === 'object' ? s : null;
    } catch (e) { return null; }
  }
  // (the day's game, as far as it's gone)
  function load(id, day) {
    const s = saved(id, day);
    const st = GAMES[id].make(seeded(hashString(`bytefall:${day}:${id}`)), s);
    return Object.assign(st, { id, day, practice: false, played: !!(s && s.played), paid: !!(s && s.paid), k: (s && s.k) || 0, t: (s && s.t) || 0, moved: !!(s && (s.played || s.m)) });
  }
  const practice = (id) => Object.assign(GAMES[id].make(Math.random, null), { id, day: todayKey(), practice: true, played: false, paid: false, k: 0, t: 0, moved: false });
  function save() {
    if (!g || g.practice) return;
    storage.set(saveKey(g.id, g.day), JSON.stringify({ ...GAMES[g.id].pack(g), played: g.played ? 1 : 0, paid: g.paid ? 1 : 0, k: g.k, t: Math.round(g.t), m: g.moved ? 1 : 0 }));
  }
  const over = () => !!g && GAMES[g.id].over(g);

  // (the next day with a game, k days from today, and the time till it starts, 00:00 UTC)
  function nextGame() {
    for (let k = 1; k <= 7; k++) {
      const id = DAYS[(utcWeekday() + k) % 7];
      if (id) return { id, k };
    }
    return null;
  }
  function until(k) {
    const now = new Date();
    const at = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + k);
    const mins = Math.max(1, Math.ceil((at - now) / 60000));
    const h = Math.floor(mins / 60);
    return h >= 24 ? `${Math.floor(h / 24)}D ${h % 24}H` : h ? `${h}H ${mins % 60}M` : `${mins}M`;
  }
  const fmtTime = (ms) => {
    const secs = Math.floor(ms / 1000);
    return `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
  };

  // THE DAILY menu's ARCADE card: today's game in a line, and how it stands (or the next one's day)
  function rule() {
    const id = today();
    if (id) return `${GAMES[id].name}: ${GAMES[id].rule()}`;
    const n = nextGame();
    return `More games are on the way. Next: ${GAMES[n.id].name} on ${WEEKDAYS[(utcWeekday() + n.k) % 7]}.`;
  }
  function status() {
    const id = today();
    if (!id) {
      const n = nextGame();
      return { done: false, text: `${GAMES[n.id].name} IN ${until(n.k)}` };
    }
    return GAMES[id].status(saved(id, todayKey()), todayKey());
  }

  // THE LINE over the game: its own (the clock, what's left, the result), or a passing note
  function showLine() {
    if (!g || Date.now() < noteUntil) return;
    lineEl.classList.remove('note');
    lineEl.textContent = `${g.practice ? 'PRACTICE // ' : ''}${GAMES[g.id].line(g)}`;
  }
  function note(text, ms = 1600) {
    clearTimeout(noteTimer);
    noteUntil = Date.now() + ms;
    lineEl.classList.add('note');
    lineEl.textContent = text;
    noteTimer = setTimeout(() => { noteUntil = 0; showLine(); }, ms);
  }
  // THE CLOCK: a timed game's, while the card's up and the page in view (and, for 'move', from the
  // first move), till it's over
  function clock() {
    clearInterval(clockTimer);
    clockTimer = 0;
    const timed = g && GAMES[g.id].timed;
    if (!timed || card.hidden || over() || (timed === 'move' && !g.moved)) return;
    clockAt = performance.now();
    clockTimer = setInterval(() => {
      const now = performance.now();
      if (!document.hidden) g.t += now - clockAt;
      clockAt = now;
      showLine();
    }, 250);
  }
  // (how it stands, after any change: the line, SHARE once it's over, the clock)
  function refresh() {
    const done = over();
    overEl.hidden = !done;
    if (done) {
      shareBtn.textContent = g.practice ? 'NEW GAME' : 'SHARE';
      const n = nextGame();
      nextEl.textContent = g.practice ? 'PRACTICE // NOTHING SAVED' : n ? `NEXT: ${GAMES[n.id].name} IN ${until(n.k)}` : '';
    }
    showLine();
    clock();
  }
  // A move (a passing note gone with it): the first makes it the day's daily game (and starts a
  // 'move' clock)
  function moved() {
    if (!g) return;
    clearTimeout(noteTimer);
    noteUntil = 0;
    const first = !g.moved;
    g.moved = true;
    if (!g.practice && !g.played) {
      g.played = true;
      save();
      Progress.arcadePlayed('arcade');
      earned();
    }
    if (first) clock();
  }
  // Over: the official game's result counted and paid once
  function finish() {
    clearInterval(clockTimer);
    clockTimer = 0;
    if (!g.practice && !g.paid) {
      g.k = GAMES[g.id].pay(g);
      g.paid = true;
      save();
      earned();
    }
    refresh();
  }
  // (what it earned: on the notice line once the card's closed. At the menu nothing's held for a
  // result screen, so what initGame set to wait for one is let go)
  function earned() {
    flushEarned();
    announce(Progress.check());
  }

  // SHARE: the game's lines under its name and the day (a practice game's button starts another)
  shareBtn.addEventListener('click', async () => {
    if (g.practice) { play(g.id, true); return; }
    const text = [`BYTEFALL // ${GAMES[g.id].name} ${g.day}`, ...GAMES[g.id].share(g), location.href.split(/[?#]/)[0]].join('\n');
    try {
      if (navigator.share) {
        await navigator.share({ text });
        return;
      }
      await copyText(text);
      shareBtn.textContent = 'COPIED';
    } catch (e) {
      if (e && e.name === 'AbortError') return; // (the share sheet closed)
      shareBtn.textContent = 'COPY FAILED';
    }
  });

  // (a game on the card: its part shown, the others hidden; fresh: a new practice game of it)
  function play(id, fresh) {
    if (fresh) {
      if (g) { save(); if (GAMES[g.id].leave) GAMES[g.id].leave(); }
      g = practice(id);
    }
    card.querySelectorAll('.arcade-game').forEach((sec) => { sec.hidden = sec.dataset.game !== g.id; });
    titleEl.textContent = `// ${GAMES[g.id].name}`;
    card.setAttribute('aria-label', `Daily arcade: ${GAMES[g.id].name}`);
    noteUntil = 0;
    GAMES[g.id].show(g);
    if (over() && !g.practice && !g.paid) finish(); // (one that ended before its result was saved)
    refresh();
    GAMES[g.id].fit();
  }
  // PLAY on the ARCADE card: today's game (practice, from ?arcade= or, with UNLOCK EVERYTHING, on a
  // day with none)
  function open() {
    const dev = typeof Unlocks !== 'undefined' && Unlocks.isDevUnlock();
    const asked = new URLSearchParams(location.search).get('arcade');
    let id = today();
    let trial = false;
    if (GAMES[asked]) { id = asked; trial = true; }
    else if (!id) {
      const n = nextGame();
      if (!dev) {
        SFX.play('denied');
        homeNotice(`${GAMES[n.id].name} // ${WEEKDAYS[(utcWeekday() + n.k) % 7]}, IN ${until(n.k)}`);
        return;
      }
      id = n.id;
      trial = true;
    }
    const day = todayKey();
    if (!(g && g.id === id && g.day === day && g.practice === trial)) {
      if (g) { save(); if (GAMES[g.id].leave) GAMES[g.id].leave(); }
      g = trial ? practice(id) : load(id, day);
    }
    devEl.hidden = !dev;
    card.hidden = false;
    syncPanelOpen();
    SFX.play('static');
    play(id, false);
  }
  function close() {
    if (card.hidden) return;
    clearInterval(clockTimer);
    clockTimer = 0;
    save();
    if (g && GAMES[g.id].leave) GAMES[g.id].leave();
    card.hidden = true;
    syncPanelOpen();
    applyModeUi(); // (the DAILY panel: the streak, and the ARCADE card's result)
    showKeys();
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden) save(); });

  if (window.ResizeObserver) new ResizeObserver(() => { if (!card.hidden && g) GAMES[g.id].fit(); }).observe(card);
  card.querySelector('.card-back').addEventListener('click', close);
  // (first, ahead of the game's own keys: the board behind takes none of them while this is open)
  document.addEventListener('keydown', (e) => {
    if (card.hidden || !g) return;
    if (e.key === 'Escape') close();
    else if (!GAMES[g.id].key(e)) return;
    e.preventDefault(); // (Enter mustn't also press the button last tapped)
    e.stopImmediatePropagation();
  }, true);

  function register(id, game) {
    GAMES[id] = game;
    const b = document.createElement('button'); // (the DEV row: any game as practice)
    b.type = 'button';
    b.textContent = game.name;
    b.addEventListener('click', () => play(id, true));
    devEl.appendChild(b);
  }
  // (what the games use of the frame)
  const kit = { save, moved, finish, refresh, note, fmtTime, game: () => g, isOpen: () => !card.hidden };
  return { register, open, close, rule, status, isOpen: () => !card.hidden, kit, games: GAMES };
})();
