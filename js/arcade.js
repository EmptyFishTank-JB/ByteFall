// THE DAILY ARCADE: a game of its own on the DAILY menu's ARCADE card, played on a card over the game
// card instead of ByteFall's board. MONDAY: CODE BREAKER; the other days' games are still to come
// (till then the card says when CODE BREAKER is back). Loaded before script.js: what it uses of it
// (storage, todayKey, seeded, hashString, fillBit, homeNotice, syncPanelOpen ...) it reaches only
// once the page is running.
const Arcade = (() => {
  // CODE BREAKER: a code of CB_LEN bits, each [1] to [7] (repeats allowed), the same for everyone
  // that Monday (seeded by the date, UTC), to break in CB_TRIES tries. Each guess takes the next row
  // up, from the bottom as bits stack, with CB_LEN pips at its right: lit, a bit in the right place;
  // hollow, a right bit in the wrong place; dark, no match. The lit come first, then the hollow, so
  // they say how many, not which. One game a Monday, saved after every guess (BACK keeps it); once
  // it's over the card shows the board, the code over it, and SHARE, till the next Monday's.
  const CB_LEN = 4;
  const CB_TRIES = 10;
  const CB_BITS = 7;
  const PIP_MS = 170; // (a guess's pips light one at a time)
  const el = (id) => document.getElementById(id);
  const card = el('arcade');
  const boardEl = el('cb-board');
  const lineEl = el('cb-line');
  const padEl = el('cb-pad');
  const actsEl = el('cb-acts');
  const overEl = el('cb-over');
  const shareBtn = el('cb-share');
  const nextEl = el('cb-next');

  const monday = () => utcWeekday() === 0;
  const saveKey = (day) => `bytefall-arcade-codebreaker-${day}`;
  const codeFor = (day) => {
    const rand = seeded(hashString(`bytefall:${day}:codebreaker`));
    return Array.from({ length: CB_LEN }, () => 1 + Math.floor(rand() * CB_BITS));
  };
  // (a guess's pips: bits in the right place, and right bits in the wrong place, each bit of the
  // code matched once)
  function mark(guess, code) {
    let hit = 0;
    const g = Array(CB_BITS + 1).fill(0);
    const c = Array(CB_BITS + 1).fill(0);
    guess.forEach((v, i) => {
      if (v === code[i]) hit++;
      else { g[v]++; c[code[i]]++; }
    });
    let near = 0;
    for (let v = 1; v <= CB_BITS; v++) near += Math.min(g[v], c[v]);
    return { hit, near };
  }
  // A game: its day and code, the guesses (g), and the official one's flags: played (the day's
  // daily game counted), paid (its result counted and its KEYS paid: k)
  function load(day) {
    let s = null;
    try { s = JSON.parse(storage.get(saveKey(day))); } catch (e) {}
    const ok = s && Array.isArray(s.g) && s.g.every((r) => Array.isArray(r) && r.length === CB_LEN);
    return { day, code: codeFor(day), g: ok ? s.g : [], played: ok && !!s.played, paid: ok && !!s.paid, k: ok ? s.k || 0 : 0 };
  }
  const save = () => {
    if (!game.practice) storage.set(saveKey(game.day), JSON.stringify({ g: game.g, played: game.played ? 1 : 0, paid: game.paid ? 1 : 0, k: game.k }));
  };
  const broken = (g = game) => g.g.length > 0 && mark(g.g[g.g.length - 1], g.code).hit === CB_LEN;
  const over = (g = game) => broken(g) || g.g.length >= CB_TRIES;

  // (to the next Monday, 00:00 UTC)
  function untilMonday() {
    const now = new Date();
    const next = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + (7 - utcWeekday()));
    const mins = Math.max(1, Math.ceil((next - now) / 60000));
    const h = Math.floor(mins / 60);
    return h >= 24 ? `${Math.floor(h / 24)}D ${h % 24}H` : h ? `${h}H ${mins % 60}M` : `${mins}M`;
  }
  // THE DAILY menu's ARCADE card: the day's game in a line, and how it stands
  const rule = () => (monday() ? `CODE BREAKER: crack the ${CB_LEN}-bit code in ${CB_TRIES} tries.` : 'CODE BREAKER is on Mondays. More games are on the way.');
  function status() {
    if (!monday()) return { done: false, text: `CODE BREAKER IN ${untilMonday()}` };
    const g = load(todayKey());
    if (broken(g)) return { done: true, text: `BROKEN IN ${g.g.length}/${CB_TRIES}` };
    if (over(g)) return { done: true, text: `NOT BROKEN // ${CB_TRIES}/${CB_TRIES} TRIES USED` };
    return { done: false, text: g.g.length ? `${CB_TRIES - g.g.length} OF ${CB_TRIES} TRIES LEFT` : `ONE GAME TODAY // ${CB_TRIES} TRIES` };
  }

  let game = null;
  let typed = []; // (the guess being keyed in)
  let busy = false; // (a guess's pips lighting)
  let noteTimer = 0;

  // THE BOARD: the code (? till it's over), a ===== line, then the tries, the 10th at the top and the
  // 1st at the bottom; each row its number at the left and its pips at the right. reveal: the row
  // whose pips are still lighting, lit of them so far
  function render(reveal = -1, lit = 0) {
    const done = over() && reveal < 0;
    const rows = [];
    const row = (cls, no) => {
      const r = document.createElement('div');
      r.className = `cb-row${cls ? ` ${cls}` : ''}`;
      const n = document.createElement('span');
      n.className = 'cb-no';
      n.textContent = no;
      r.appendChild(n);
      rows.push(r);
      return r;
    };
    const cell = (r, val, cls = '') => {
      const c = document.createElement('span');
      c.className = `cell${cls ? ` ${cls}` : ''}`;
      if (val) { c.classList.add('disc'); fillBit(c, val); }
      r.appendChild(c);
      return c;
    };
    const pips = (r, m, shown = CB_LEN) => {
      const p = document.createElement('span');
      p.className = 'cb-pips';
      if (m) {
        p.setAttribute('role', 'img');
        p.setAttribute('aria-label', `${m.hit} in the right place, ${m.near} in the wrong place`);
      }
      for (let i = 0; i < CB_LEN; i++) {
        const pip = document.createElement('i');
        if (m && i < shown) pip.className = i < m.hit ? 'hit' : i < m.hit + m.near ? 'near' : 'miss';
        p.appendChild(pip);
      }
      r.appendChild(p);
    };
    const code = row(`cb-code${done ? (broken() ? ' won' : ' lost') : ''}`, '');
    code.querySelector('.cb-no').textContent = 'CODE';
    for (const v of game.code) {
      const c = cell(code, done ? v : 0, done ? '' : 'cb-hidden');
      if (!done) c.textContent = '?';
    }
    pips(code, null);
    code.querySelector('.cb-pips').style.visibility = 'hidden';
    const line = document.createElement('div');
    line.className = 'cb-rule';
    rows.push(line);
    const win = broken() ? game.g.length - 1 : -1;
    for (let i = CB_TRIES - 1; i >= 0; i--) {
      const no = String(i + 1).padStart(2, '0');
      const guess = game.g[i];
      if (guess) {
        const r = row(i === win && done ? 'won' : '', no);
        for (const v of guess) cell(r, v);
        pips(r, mark(guess, game.code), i === reveal ? lit : CB_LEN);
      } else if (i === game.g.length && !done) { // (the row being keyed in)
        const r = row('cb-live', no);
        for (let n = 0; n < CB_LEN; n++) cell(r, typed[n] || 0, typed[n] ? '' : n === typed.length ? 'cb-slot next' : 'cb-slot');
        pips(r, null);
      } else {
        const r = row('cb-empty', no);
        for (let n = 0; n < CB_LEN; n++) cell(r, 0);
        pips(r, null);
      }
    }
    boardEl.replaceChildren(...rows);
    padEl.hidden = actsEl.hidden = done;
    overEl.hidden = !done;
    showLine();
    if (done) {
      shareBtn.textContent = game.practice ? 'NEW CODE' : 'SHARE';
      nextEl.textContent = game.practice ? 'DEV PRACTICE // NOTHING SAVED' : `NEXT CODE IN ${untilMonday()}`;
    }
    padEl.querySelectorAll('button').forEach((b) => { b.disabled = typed.length >= CB_LEN; });
    el('cb-del').disabled = busy || !typed.length;
    el('cb-enter').classList.toggle('ready', typed.length === CB_LEN && !busy);
  }
  // The line over the board: the tries, the result, or a passing note (ENTER 4 BITS ...)
  function showLine(note) {
    clearTimeout(noteTimer);
    lineEl.classList.toggle('note', !!note);
    if (note) {
      lineEl.textContent = note;
      noteTimer = setTimeout(() => showLine(), 1600);
      return;
    }
    const n = game.g.length - (busy ? 1 : 0); // (while a guess's pips light, it's still that try)
    const tag = game.practice ? 'DEV PRACTICE // ' : '';
    if (broken() && !busy) lineEl.textContent = `${tag}CODE BROKEN IN ${n}/${CB_TRIES}${game.k ? ` // +${game.k} KEYS` : ''}`;
    else if (over() && !busy) lineEl.textContent = `${tag}NOT BROKEN // THE CODE'S UP TOP`;
    else lineEl.textContent = `${tag}${n ? `TRY ${n + 1} OF ${CB_TRIES}` : `CRACK THE ${CB_LEN}-BIT CODE // ${CB_TRIES} TRIES`}`;
  }

  // THE KEYPAD: the seven bits (as the theme draws them), DELETE and ENTER; the keys 1 to 7,
  // Backspace and Enter too
  function buildPad() {
    padEl.replaceChildren(...Array.from({ length: CB_BITS }, (_, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.dataset.v = String(i + 1);
      b.setAttribute('aria-label', `Bit ${i + 1}`);
      const face = document.createElement('span');
      face.className = 'cb-face';
      fillBit(face, i + 1);
      b.appendChild(face);
      return b;
    }));
  }
  function key(v) {
    if (busy || over() || typed.length >= CB_LEN) return;
    typed.push(v);
    SFX.play('click');
    render();
  }
  function del() {
    if (busy || over() || !typed.length) return;
    typed.pop();
    SFX.play('backspace');
    render();
  }
  function enter() {
    if (busy || over()) return;
    if (typed.length < CB_LEN) {
      SFX.play('denied');
      showLine(`ENTER ${CB_LEN} BITS FIRST`);
      const live = boardEl.querySelector('.cb-live');
      if (live) { live.classList.remove('shake'); void live.offsetWidth; live.classList.add('shake'); }
      return;
    }
    game.g.push(typed);
    typed = [];
    if (!game.practice && !game.played) { // (the first guess: the day's daily game)
      game.played = true;
      save();
      Progress.arcadePlayed('arcade');
      earned();
    }
    save();
    SFX.play('enter');
    busy = true;
    const at = game.g.length - 1;
    const m = mark(game.g[at], game.code);
    render(at, 0);
    for (let i = 1; i <= CB_LEN; i++) {
      setTimeout(() => {
        if (card.hidden || game.g.length - 1 !== at) return; // (closed meanwhile: render() on open shows it all)
        render(at, i);
        if (i <= m.hit + m.near) SFX.count(i <= m.hit ? 0.4 + i * 0.15 : 0.1 * i);
      }, PIP_MS * i);
    }
    setTimeout(() => {
      busy = false;
      if (over()) finish();
      if (!card.hidden) render();
    }, PIP_MS * (CB_LEN + 1));
  }
  // Over: the official game's result counted and paid once (CODE BREAKER's KEYS, the achievements)
  function finish() {
    SFX.play(broken() ? 'burst' : 'alert');
    if (game.practice || game.paid) return;
    game.k = Progress.codeBreaker(broken() ? game.g.length : 0);
    game.paid = true;
    save();
    earned();
  }
  // (what it earned: on the notice line once the card's closed. At the menu nothing's held for a
  // result screen, so what initGame set to wait for one is let go)
  function earned() {
    flushEarned();
    announce(Progress.check());
  }

  // SHARE: a line of squares per try, as the pips (green, yellow, black), and the result
  function shareText() {
    const lines = game.g.map((guess) => {
      const m = mark(guess, game.code);
      return '\u{1F7E9}'.repeat(m.hit) + '\u{1F7E8}'.repeat(m.near) + '⬛'.repeat(CB_LEN - m.hit - m.near);
    });
    const result = broken() ? `Broken in ${game.g.length}/${CB_TRIES}` : `Not broken // ${CB_TRIES}/${CB_TRIES} tries used`;
    return [`BYTEFALL // CODE BREAKER ${game.day}`, result, ...lines, location.href.split(/[?#]/)[0]].join('\n');
  }
  shareBtn.addEventListener('click', async () => {
    if (game.practice) { // (the dev's practice: another code)
      game = practiceGame();
      typed = [];
      render();
      return;
    }
    const text = shareText();
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

  // (any day but Monday, with UNLOCK EVERYTHING on (the dev page): a practice game, a random code,
  // saved nowhere, paying nothing)
  const practiceGame = () => ({ day: todayKey(), code: Array.from({ length: CB_LEN }, () => 1 + Math.floor(Math.random() * CB_BITS)), g: [], practice: true, k: 0 });
  function open() {
    const dev = typeof Unlocks !== 'undefined' && Unlocks.isDevUnlock();
    if (!monday() && !dev) {
      SFX.play('denied');
      homeNotice(`CODE BREAKER // BACK MONDAY, IN ${untilMonday()}`);
      return;
    }
    if (!game || game.day !== todayKey() || game.practice === monday()) {
      game = monday() ? load(todayKey()) : practiceGame();
      typed = [];
      busy = false;
    }
    buildPad(); // (the theme's bits: GLYPH's shapes, say)
    card.hidden = false;
    syncPanelOpen();
    SFX.play('static');
    if (over() && !game.practice && !game.paid) finish(); // (one that ended before its result was saved)
    render();
    fit();
  }
  function close() {
    if (card.hidden) return;
    card.hidden = true;
    syncPanelOpen();
    applyModeUi(); // (the DAILY panel: the streak, and the ARCADE card's result)
    showKeys();
  }

  // (the rows sized to the room the board has: square cells, at most 44px)
  function fit() {
    if (card.hidden) return;
    const cs = getComputedStyle(boardEl);
    const gap = 4;
    const side = 44; // (the number's column and the pips')
    const h = boardEl.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom) - 9; // (9: the ===== line)
    const w = boardEl.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) - 2 * side - 2 * gap;
    const rows = CB_TRIES + 1;
    const size = Math.floor(Math.min(44, (h - gap * (rows - 1)) / rows, (w - gap * (CB_LEN - 1)) / CB_LEN));
    boardEl.style.setProperty('--cb-cell', `${Math.max(14, size)}px`);
  }
  if (window.ResizeObserver) new ResizeObserver(() => fit()).observe(card);

  padEl.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (b) key(Number(b.dataset.v));
  });
  el('cb-del').addEventListener('click', del);
  el('cb-enter').addEventListener('click', enter);
  card.querySelector('.card-back').addEventListener('click', close);
  // (first, ahead of the game's own keys: the board behind takes none of them while this is open)
  document.addEventListener('keydown', (e) => {
    if (card.hidden) return;
    const v = Number(e.key);
    if (e.key === 'Escape') close();
    else if (v >= 1 && v <= CB_BITS) key(v);
    else if (e.key === 'Backspace' || e.key === 'Delete') del();
    else if (e.key === 'Enter') enter();
    else return;
    e.preventDefault(); // (Enter mustn't also press the button last tapped)
    e.stopImmediatePropagation();
  }, true);

  return { open, close, rule, status, isOpen: () => !card.hidden, mark, CB_LEN, CB_TRIES };
})();
