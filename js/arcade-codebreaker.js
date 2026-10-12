// CODE BREAKER (THE DAILY ARCADE's Monday game; the card around it is arcade.js): a code of CB_LEN
// bits, each [1] to [7] (repeats allowed), the same for everyone that Monday, to break in CB_TRIES
// tries. Each guess takes the next row up, from the bottom as bits stack, with CB_LEN pips at its
// right: lit, a bit in the right place; hollow, a right bit in the wrong place; dark, no match. The lit
// come first, then the hollow, so they say how many, not which. A code already tried isn't taken:
// the error buzz, and that try's row pulses red. Once it's over the code shows over the rows.
Arcade.register('codebreaker', (() => {
  const CB_LEN = 4;
  const CB_TRIES = 10;
  const CB_BITS = 7;
  const PIP_MS = 170; // (a guess's pips light one at a time)
  const el = (id) => document.getElementById(id);
  const boardEl = el('cb-board');
  const padEl = el('cb-pad');
  const actsEl = el('cb-acts');
  const kit = Arcade.kit;
  let s = null; // (the game shown: { code, g (the guesses) } and the frame's own)
  let typed = []; // (the guess being keyed in)
  let busy = false; // (a guess's pips lighting)

  // (a guess's pips: bits in the right place, and right bits in the wrong place, each bit of the
  // code matched once)
  function mark(guess, code) {
    let hit = 0;
    const gs = Array(CB_BITS + 1).fill(0);
    const cs = Array(CB_BITS + 1).fill(0);
    guess.forEach((v, i) => {
      if (v === code[i]) hit++;
      else { gs[v]++; cs[code[i]]++; }
    });
    let near = 0;
    for (let v = 1; v <= CB_BITS; v++) near += Math.min(gs[v], cs[v]);
    return { hit, near };
  }
  const broken = (x = s) => x.g.length > 0 && mark(x.g[x.g.length - 1], x.code).hit === CB_LEN;
  const over = (x = s) => broken(x) || x.g.length >= CB_TRIES;
  function make(rand, saved) {
    const code = Array.from({ length: CB_LEN }, () => 1 + Math.floor(rand() * CB_BITS));
    const ok = saved && Array.isArray(saved.g) && saved.g.length <= CB_TRIES && saved.g.every((r) => Array.isArray(r) && r.length === CB_LEN);
    return { code, g: ok ? saved.g : [] };
  }

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
    const code = row(`cb-code${done ? (broken() ? ' won' : ' lost') : ''}`, 'CODE');
    for (const v of s.code) {
      const c = cell(code, done ? v : 0, done ? '' : 'cb-hidden');
      if (!done) c.textContent = '?';
    }
    pips(code, null);
    code.querySelector('.cb-pips').style.visibility = 'hidden';
    const line = document.createElement('div');
    line.className = 'cb-rule';
    rows.push(line);
    const win = broken() ? s.g.length - 1 : -1;
    for (let i = CB_TRIES - 1; i >= 0; i--) {
      const no = String(i + 1).padStart(2, '0');
      const guess = s.g[i];
      if (guess) {
        const r = row(i === win && done ? 'won' : '', no);
        r.dataset.try = String(i);
        for (const v of guess) cell(r, v);
        pips(r, mark(guess, s.code), i === reveal ? lit : CB_LEN);
      } else if (i === s.g.length && !done) { // (the row being keyed in)
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
    padEl.querySelectorAll('button').forEach((b) => { b.disabled = typed.length >= CB_LEN; });
    el('cb-del').disabled = busy || !typed.length;
    el('cb-enter').classList.toggle('ready', typed.length === CB_LEN && !busy);
    kit.refresh();
  }
  // (the line over the board: the tries, or the result)
  function line(x) {
    const n = x.g.length - (busy && x === s ? 1 : 0); // (while a guess's pips light, it's still that try)
    if (broken(x) && !busy) return `CODE BROKEN IN ${n}/${CB_TRIES}${x.k ? ` // +${x.k} KEYS` : ''}`;
    if (over(x) && !busy) return "NOT BROKEN // THE CODE'S UP TOP";
    return n ? `TRY ${n + 1} OF ${CB_TRIES}` : `CRACK THE ${CB_LEN}-BIT CODE // ${CB_TRIES} TRIES`;
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
  function press(v) {
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
      kit.note(`ENTER ${CB_LEN} BITS FIRST`);
      const live = boardEl.querySelector('.cb-live');
      if (live) { live.classList.remove('shake'); void live.offsetWidth; live.classList.add('shake'); }
      return;
    }
    // (a code already tried: the error buzz, and that try's row pulses; what's keyed in stays, to change)
    const dupe = s.g.findIndex((gs) => gs.join('') === typed.join(''));
    if (dupe >= 0) {
      SFX.play('denied');
      kit.note(`ALREADY TRIED // TRY ${String(dupe + 1).padStart(2, '0')}`);
      const was = boardEl.querySelector(`.cb-row[data-try="${dupe}"]`);
      if (was) { was.classList.remove('tried'); void was.offsetWidth; was.classList.add('tried'); }
      return;
    }
    s.g.push(typed);
    typed = [];
    kit.moved();
    kit.save();
    SFX.play('enter');
    busy = true;
    const at = s.g.length - 1;
    const game = s;
    const m = mark(s.g[at], s.code);
    render(at, 0);
    for (let i = 1; i <= CB_LEN; i++) {
      setTimeout(() => {
        if (!kit.isOpen() || s !== game) return; // (closed meanwhile: show() on open draws it all)
        render(at, i);
        if (i <= m.hit + m.near) SFX.count(i <= m.hit ? 0.4 + i * 0.15 : 0.1 * i);
      }, PIP_MS * i);
    }
    setTimeout(() => {
      if (s !== game) return;
      busy = false;
      if (over()) {
        SFX.play(broken() ? 'burst' : 'alert');
        kit.finish();
      }
      if (kit.isOpen()) render();
    }, PIP_MS * (CB_LEN + 1));
  }

  padEl.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (b) press(Number(b.dataset.v));
  });
  el('cb-del').addEventListener('click', del);
  el('cb-enter').addEventListener('click', enter);

  return {
    name: 'CODE BREAKER',
    rule: () => `crack the ${CB_LEN}-bit code in ${CB_TRIES} tries.`,
    make,
    pack: (x) => ({ g: x.g }),
    over: (x) => over(x),
    timed: null,
    status(saved, day) {
      const x = make(seeded(hashString(`bytefall:${day}:codebreaker`)), saved);
      if (broken(x)) return { done: true, text: `BROKEN IN ${x.g.length}/${CB_TRIES}` };
      if (over(x)) return { done: true, text: `NOT BROKEN // ${CB_TRIES}/${CB_TRIES} TRIES USED` };
      return { done: false, text: x.g.length ? `${CB_TRIES - x.g.length} OF ${CB_TRIES} TRIES LEFT` : `ONE GAME TODAY // ${CB_TRIES} TRIES` };
    },
    line,
    show(x) {
      if (x !== s) { s = x; typed = []; busy = false; }
      buildPad(); // (the theme's bits: GLYPH's shapes, say)
      render();
    },
    key(e) {
      const v = Number(e.key);
      if (v >= 1 && v <= CB_BITS) press(v);
      else if (e.key === 'Backspace' || e.key === 'Delete') del();
      else if (e.key === 'Enter') enter();
      else return false;
      return true;
    },
    // (the rows sized to the room the board has: square cells, at most 44px)
    fit() {
      if (!s || boardEl.closest('.arcade-game').hidden) return;
      const cs = getComputedStyle(boardEl);
      const gap = 4;
      const side = 44; // (the number's column and the pips')
      const h = boardEl.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom) - 9; // (9: the ===== line)
      const w = boardEl.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) - 2 * side - 2 * gap;
      const rows = CB_TRIES + 1;
      const size = Math.floor(Math.min(44, (h - gap * (rows - 1)) / rows, (w - gap * (CB_LEN - 1)) / CB_LEN));
      boardEl.style.setProperty('--cb-cell', `${Math.max(14, size)}px`);
    },
    pay: (x) => Progress.codeBreaker(broken(x) ? x.g.length : 0),
    // SHARE: a line of squares per try, as the pips (green, yellow, black), under the result
    share(x) {
      const lines = x.g.map((guess) => {
        const m = mark(guess, x.code);
        return '\u{1F7E9}'.repeat(m.hit) + '\u{1F7E8}'.repeat(m.near) + '⬛'.repeat(CB_LEN - m.hit - m.near);
      });
      return [broken(x) ? `Broken in ${x.g.length}/${CB_TRIES}` : `Not broken // ${CB_TRIES}/${CB_TRIES} tries used`, ...lines];
    },
  };
})());
