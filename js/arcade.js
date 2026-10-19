// THE ARCADE (arcade.html; its own page, on its way to its own app): games of their own on the bits:
// CODE BREAKER (arcade-codebreaker.js), TRACE (arcade-trace.js), MERGE (arcade-merge.js), CHECKSUM
// (arcade-checksum.js), DEFRAG (arcade-defrag.js), DECODE (arcade-decode.js) and ROUTING
// (arcade-routing.js), on a card that opens on the ARCADE MENU: every game in a row that slides
// sideways; PLAY plays the one in the middle, FREE PLAY: a new game each time (its own random seed), as
// many as you like, the one under way kept (BACK, or closing the page, keeps it), your best kept
// (bytefall-arcade-free-stats). No daily game: the base games only.
// BACK in a game goes back to the menu; in the menu, back to the landing page. This is the frame the
// games share: the card, its title and line (the clock, what's left, the result, a passing note), the
// game's own part under them, and NEW GAME once it's over. What it needs of ByteFall's (storage,
// seeded, fillBit ...) is arcade-shell.js; SFX, FX and the themes are ByteFall's own files. ?game=trace
// puts that one in the middle of the menu.
// ?phone: on STORY's phone (bytefall.html, the phone's GAMES, in a frame): straight into the game (?game,
// FREE PLAY), no menu and no BACK of its own: the phone's BACK (a message, 'back') leaves it, saved, and
// the phone's told ('exit').
//
// A game (Arcade.register(id, game)): name, rule() (its line on the cards), make(rand, saved) (its
// state from a seed, with what was saved), pack(s) (what to save), over(s), line(s), show(s) (its part
// drawn, for s), key(e) (a key: true if taken), fit(), leave() (the card closing, or another game on
// it), best(s) (a finished
// game's result for FREE PLAY's best, or null), bestText(v), low (a lower best is better), timed (a
// clock: 'open', running whenever the card's up, or 'move', from the first move), and demo(host) (the
// menu card's preview: a game playing itself, drawn into host; its step() plays the next bit of it and
// says how long till the one after, in ms, or null once it's over).
const Arcade = (() => {
  const el = (id) => document.getElementById(id);
  const card = el('arcade');
  const titleEl = el('arcade-title');
  const lineEl = el('arcade-line');
  const overEl = el('arcade-over');
  const newBtn = el('arcade-share'); // (NEW GAME, once one's over)
  const nextEl = el('arcade-next');
  const menuEl = el('arcade-menu');
  const cardsEl = el('arcade-cards');
  const pipsEl = el('arcade-pips');
  const menuPlay = el('arcade-play');
  const menuNew = el('arcade-new');
  const GAMES = {};
  const ORDER = []; // (as registered)
  const PICK_KEY = 'bytefall-arcade-pick';
  const STATS_KEY = 'bytefall-arcade-free-stats';
  let g = null; // the game on the card: { id, seed, paid (counted), t (ms on the clock), moved, ...its own }
  let view = 'game'; // ('menu': the ARCADE menu's cards)
  let pick = null; // (the ARCADE menu's card in the middle)
  let noteUntil = 0;
  let noteTimer = 0;
  let clockTimer = 0;
  let clockAt = 0;
  let demos = []; // (the ARCADE menu's previews: { id, card, el, run, phase, due, seen })
  let demoTimer = 0;

  const PHONE = new URLSearchParams(location.search).has('phone');
  if (PHONE) document.body.classList.add('in-phone');
  const read = (key) => {
    try {
      const s = JSON.parse(storage.get(key));
      return s && typeof s === 'object' ? s : null;
    } catch (e) { return null; }
  };
  const freeKey = (id) => `bytefall-arcade-free-${id}`;
  // (FREE PLAY: the one under way, or a new one, from a seed of its own)
  function free(id, fresh) {
    const s = fresh ? null : read(freeKey(id));
    const seed = s && Number.isInteger(s.seed) ? s.seed : Math.floor(Math.random() * 2 ** 31);
    const st = GAMES[id].make(seeded(seed), s);
    return Object.assign(st, { id, free: true, seed, paid: !!(s && s.paid), k: 0, t: (s && s.t) || 0, moved: !!(s && s.m) });
  }
  function save() {
    if (!g) return;
    const data = { ...GAMES[g.id].pack(g), paid: g.paid ? 1 : 0, t: Math.round(g.t), m: g.moved ? 1 : 0 };
    storage.set(freeKey(g.id), JSON.stringify({ ...data, seed: g.seed }));
  }
  const over = () => !!g && GAMES[g.id].over(g);
  const stats = () => read(STATS_KEY) || {};
  const underWay = (id) => { const s = read(freeKey(id)); return !!(s && s.m && !s.paid); };

  const fmtTime = (ms) => {
    const secs = Math.floor(ms / 1000);
    return `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
  };

  // THE LINE over the game: its own (the clock, what's left, the result), or a passing note
  function showLine() {
    if (Date.now() < noteUntil) return;
    lineEl.classList.remove('note');
    lineEl.textContent = view === 'menu' ? 'EVERY GAME, ANY TIME // YOUR BEST KEPT' : g ? GAMES[g.id].line(g) : '';
  }
  function note(text, ms = 1600) {
    clearTimeout(noteTimer);
    noteUntil = Date.now() + ms;
    lineEl.classList.add('note');
    lineEl.textContent = text;
    noteTimer = setTimeout(() => { noteUntil = 0; showLine(); }, ms);
  }
  // THE CLOCK: a timed game's, while the card's up and the page in view (and, for 'move', from the
  // first move), till it's over. Running, it's left running (a redraw doesn't start it over); stopped,
  // the time since its last tick counted first
  function tick() {
    const now = performance.now();
    if (!document.hidden) g.t += now - clockAt;
    clockAt = now;
    showLine();
  }
  function stopClock() {
    if (!clockTimer) return;
    tick();
    clearInterval(clockTimer);
    clockTimer = 0;
  }
  function clock() {
    const timed = g && GAMES[g.id].timed;
    const run = !!timed && view === 'game' && !card.hidden && !over() && !(timed === 'move' && !g.moved);
    if (!run) { stopClock(); return; }
    if (clockTimer) return;
    clockAt = performance.now();
    clockTimer = setInterval(tick, 250);
  }
  // (how it stands, after any change: the line, NEW GAME once it's over, the clock)
  function refresh() {
    const done = over() && view === 'game';
    if (overEl.hidden === done && g) requestAnimationFrame(() => { if (!card.hidden && view === 'game') GAMES[g.id].fit(); }); // (NEW GAME showing or going: the board sized to the room it leaves)
    overEl.hidden = !done;
    if (done) {
      newBtn.textContent = 'NEW GAME';
      const st = stats()[g.id];
      nextEl.textContent = `${g.newBest ? 'NEW BEST! ' : ''}${st && st.best != null ? `BEST ${GAMES[g.id].bestText(st.best)} // ` : ''}FREE PLAY`;
    }
    showLine();
    clock();
  }
  // A move (a passing note gone with it): the first starts a 'move' clock
  function moved() {
    if (!g) return;
    clearTimeout(noteTimer);
    noteUntil = 0;
    const first = !g.moved;
    g.moved = true;
    if (first) clock();
  }
  // Over: counted once, toward its best
  function finish() {
    stopClock();
    if (!g.paid) {
      const all = stats();
      const st = all[g.id] || { games: 0, best: null };
      const v = GAMES[g.id].best(g);
      st.games++;
      if (v != null && (st.best == null || (GAMES[g.id].low ? v < st.best : v > st.best))) { st.best = v; g.newBest = true; }
      all[g.id] = st;
      storage.set(STATS_KEY, JSON.stringify(all));
      g.paid = true;
      save();
    }
    refresh();
  }
  // NEW GAME: another of the same
  newBtn.addEventListener('click', () => play(g.id, true));

  function leaveGame() {
    stopClock();
    if (!g || view !== 'game') return;
    save();
    if (GAMES[g.id].leave) GAMES[g.id].leave();
  }
  // A game on the card: its part shown, the others hidden. fresh given: true, a new one; false, the one
  // under way, or a new one; not given: g as it is
  function play(id, fresh) {
    if (fresh !== undefined) {
      leaveGame();
      g = free(id, fresh);
    }
    view = 'game';
    menuEl.hidden = true;
    demoTick();
    card.querySelectorAll('.arcade-game').forEach((sec) => { sec.hidden = sec.dataset.game !== g.id; });
    titleEl.textContent = `// ${GAMES[g.id].name}`;
    card.setAttribute('aria-label', `Arcade: ${GAMES[g.id].name}`);
    noteUntil = 0;
    GAMES[g.id].show(g);
    if (over() && !g.paid) finish(); // (one that ended before it was counted)
    refresh();
    GAMES[g.id].fit();
  }
  function showCard() {
    if (!card.hidden) return;
    card.hidden = false;
    SFX.play('static');
  }
  // THE ARCADE MENU: a card for each game (its name, its rule, your best or a game under way), in a row
  // that slides sideways; the one in the middle in focus, the pips under the row
  // lighting it. PLAY plays it (RESUME, with NEW GAME beside it, when one's under way); a tap on a card
  // beside the middle slides it in, on the one in the middle plays it
  function menuCards() {
    const all = stats();
    if (seenIO) seenIO.disconnect();
    demos = [];
    cardsEl.replaceChildren(...ORDER.map((id) => {
      const G = GAMES[id];
      const st = all[id];
      const b = document.createElement('button');
      b.type = 'button';
      b.dataset.game = id;
      const rule = G.rule();
      b.innerHTML = `<span class="dc-name">${G.name}</span><span class="dc-rule">${rule[0].toUpperCase()}${rule.slice(1)}</span>`
        + `<span class="dc-status">${underWay(id) ? 'A GAME UNDER WAY' : st && st.best != null ? `BEST ${G.bestText(st.best)}` : 'NOT PLAYED YET'}</span>`;
      const pre = document.createElement('span');
      pre.className = 'ac-demo';
      pre.setAttribute('aria-hidden', 'true');
      b.prepend(pre);
      if (G.demo) demos.push({ id, card: b, el: pre, run: G.demo(pre), phase: 'play', due: performance.now() + DEMO_START, seen: !seenIO });
      return b;
    }));
    pipsEl.replaceChildren(...ORDER.map((id) => { const i = document.createElement('i'); i.dataset.game = id; return i; }));
    if (still()) for (const d of demos) while (d.run.step() != null); // (each shown finished, still)
    if (seenIO) for (const d of demos) seenIO.observe(d.card);
  }

  // THE PREVIEWS: on each card of the ARCADE menu, its game playing itself, over and over (a pause on
  // the finished board, a fade, a new game). Only the cards on screen play (the one in the middle and
  // the two peeking in at its sides), and only while the menu's up and the page in view: one slid away
  // holds where it was till it's back. REDUCED EFFECTS (or reduced motion): each a finished board, still
  const DEMO_START = 600; // (a new one's first move, after it shows)
  const DEMO_HOLD = 2600; // (the finished board, before it fades)
  const DEMO_FADE = 350; // (style.css: .ac-demo.out)
  const still = () => document.documentElement.classList.contains('low-fx') || matchMedia('(prefers-reduced-motion: reduce)').matches;
  const seenIO = window.IntersectionObserver ? new IntersectionObserver((entries) => {
    for (const e of entries) {
      const d = demos.find((x) => x.card === e.target);
      if (d) d.seen = e.isIntersecting;
    }
    demoTick();
  }, { root: cardsEl }) : null;
  function demoStep(d, now) {
    if (d.phase === 'play') {
      const ms = d.run.step();
      if (ms != null) d.due = now + ms;
      else { d.phase = 'hold'; d.due = now + DEMO_HOLD; }
    } else if (d.phase === 'hold') {
      d.el.classList.add('out');
      d.phase = 'fade';
      d.due = now + DEMO_FADE;
    } else {
      d.run = GAMES[d.id].demo(d.el);
      d.el.classList.remove('out');
      d.phase = 'play';
      d.due = now + DEMO_START;
    }
  }
  // (each one seen whose time's come played on, then a timer for the soonest next)
  function demoTick() {
    clearTimeout(demoTimer);
    demoTimer = 0;
    if (view !== 'menu' || card.hidden || document.hidden || still()) return;
    const now = performance.now();
    let next = Infinity;
    for (const d of demos) {
      if (!d.seen) continue;
      if (d.due <= now + 4) demoStep(d, now);
      next = Math.min(next, d.due);
    }
    if (next < Infinity) demoTimer = setTimeout(demoTick, Math.max(16, next - performance.now()));
  }
  // (SPECTRUM: a bit cycling on its own, as the game's bits do (script.js's spinBit). owner keeps its
  // cycle through redraws that make the square anew; a square kept is given its cycle once, as setting it
  // again would jump its hue)
  function spin(el, owner = el) {
    if (owner === el && el.style.getPropertyValue('--spin')) return;
    spinBit(el, owner);
  }
  // (a game's preview as a list of [what to do, ms till the next]: its step())
  const steps = (q) => ({ step() { const a = q.shift(); if (!a) return null; a[0](); return a[1]; } });
  const cardOf = (id) => cardsEl.querySelector(`[data-game="${id}"]`);
  function nearest() {
    const mid = cardsEl.scrollLeft + cardsEl.clientWidth / 2;
    let best = null;
    let dist = Infinity;
    for (const b of cardsEl.children) {
      const d = Math.abs(b.offsetLeft + b.offsetWidth / 2 - mid);
      if (d < dist) { dist = d; best = b; }
    }
    return best;
  }
  function focusMenu() {
    const near = nearest();
    if (!near) return;
    pick = near.dataset.game;
    storage.set(PICK_KEY, pick);
    for (const b of cardsEl.children) b.classList.toggle('focus', b === near);
    for (const i of pipsEl.children) i.classList.toggle('on', i.dataset.game === pick);
    const going = underWay(pick);
    menuPlay.textContent = going ? 'RESUME' : 'PLAY';
    menuNew.hidden = !going;
  }
  function slideTo(id, smooth) {
    const b = cardOf(id);
    if (!b) return;
    const slow = smooth && !matchMedia('(prefers-reduced-motion: reduce)').matches;
    cardsEl.scrollTo({ left: b.offsetLeft + b.offsetWidth / 2 - cardsEl.clientWidth / 2, behavior: slow ? 'smooth' : 'instant' });
    focusMenu();
  }
  function showMenu() {
    leaveGame();
    view = 'menu';
    card.querySelectorAll('.arcade-game').forEach((sec) => { sec.hidden = true; });
    overEl.hidden = true;
    menuEl.hidden = false;
    titleEl.textContent = '// ARCADE';
    card.setAttribute('aria-label', 'Arcade');
    menuCards();
    showLine();
    const at = GAMES[pick] ? pick : ORDER[0];
    slideTo(at, false);
    requestAnimationFrame(() => slideTo(at, false)); // (again once it's laid out)
    demoTick();
  }
  // The page opening: the menu
  function openMenu() {
    const asked = new URLSearchParams(location.search).get('game');
    const saved = storage.get(PICK_KEY);
    pick = GAMES[asked] ? asked : GAMES[saved] ? saved : ORDER[0];
    showCard();
    showMenu();
  }
  window.addEventListener('load', () => setTimeout(() => {
    const q = new URLSearchParams(location.search);
    if (PHONE && GAMES[q.get('game')]) { // (on the phone: the game at once)
      showCard();
      play(q.get('game'), false);
      return;
    }
    openMenu();
  }, 0));
  let scrollFrame = 0;
  cardsEl.addEventListener('scroll', () => {
    if (scrollFrame) return;
    scrollFrame = requestAnimationFrame(() => { scrollFrame = 0; focusMenu(); });
  });
  cardsEl.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.classList.contains('focus')) play(b.dataset.game, false);
    else { SFX.play('button'); slideTo(b.dataset.game, true); }
  });
  pipsEl.addEventListener('click', (e) => { const i = e.target.closest('i'); if (i) slideTo(i.dataset.game, true); });
  menuPlay.addEventListener('click', () => { if (pick) play(pick, false); });
  menuNew.addEventListener('click', () => { if (pick) play(pick, true); });

  // BACK (or Esc): from a game to the menu; from the menu out, to the landing page
  function back() {
    if (PHONE) { if (view === 'game') save(); window.parent.postMessage({ arcade: 'exit' }, '*'); return; } // (the phone's to leave)
    if (view === 'game') { SFX.play('button'); showMenu(); return; }
    close();
  }
  window.addEventListener('message', (e) => { if (PHONE && e.data && e.data.arcade === 'back') back(); });
  function close() {
    leaveGame();
    location.href = './';
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && view === 'game') save();
    demoTick();
  });

  if (window.ResizeObserver) new ResizeObserver(() => { if (!card.hidden && g && view === 'game') GAMES[g.id].fit(); }).observe(card);
  card.querySelector('.card-back').addEventListener('click', back);
  // (first, ahead of the game's own keys: the board behind takes none of them while this is open)
  document.addEventListener('keydown', (e) => {
    if (card.hidden) return;
    if (e.key === 'Escape') back();
    else if (view === 'menu') {
      const i = ORDER.indexOf(pick);
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') slideTo(ORDER[(i + (e.key === 'ArrowLeft' ? -1 : 1) + ORDER.length) % ORDER.length], true);
      else if (e.key === 'Enter') play(pick, false);
      else return;
    } else if (!g || !GAMES[g.id].key(e)) return;
    e.preventDefault(); // (Enter mustn't also press the button last tapped)
    e.stopImmediatePropagation();
  }, true);

  function register(id, game) {
    GAMES[id] = game;
    ORDER.push(id);
  }
  // (what the games use of the frame)
  const kit = { save, moved, finish, refresh, note, fmtTime, steps, spin, game: () => g, isOpen: () => !card.hidden };
  return { register, openMenu, close, back, isOpen: () => !card.hidden, kit, games: GAMES };
})();
