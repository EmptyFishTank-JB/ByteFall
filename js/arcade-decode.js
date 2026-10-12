// DECODE (THE ARCADE's Saturday game; the card around it is arcade.js): Picross's rules on the bots and the
// visitors. A grid of squares with a picture hidden in it; the numbers at each row's left and over each
// column are the runs of filled squares in that line, in order (3 1: three filled, then a gap of one or
// more, then one). Fill the squares they call for (a tap; a drag fills along its row or column), and
// mark the ones that can't be (a hold, or TAP: MARK, an X). Every row and column as its numbers say and
// the picture's decoded: in its own colors, with its name. Every picture has one answer only, found a
// line at a time with no guessing (the line solver below says so of each: test it after any change to
// the pictures). The day's picture is the same for everyone that Saturday; the clock runs from the first
// square.
Arcade.register('decode', (() => {
  // THE PICTURES: the bots (bot-svg.js's art, a face each) and the visitors (visitors.js's sprites, their
  // first frame): a letter a pixel, its color in pal ('.' empty); holes: the letters left empty in the
  // puzzle (eyes, mouths, a belly), colored with the rest once it's decoded
  const PICS = [
    { id: 'bot', name: 'BOT', holes: 'e', pal: { b: 'var(--fg)', e: 'var(--board-bg)' },
      rows: ['.....b....b.....', '.....b....b.....', '..bbbbbbbbbbbb..', '..bbbbbbbbbbbb..', '..bbbbbbbbbbbb..', 'bbbbbbebbebbbbbb', '..bbbebeebebbb..', '..bbbbbbbbbbbb..', 'bbbbebbbbbbebbbb', '..bbbeeeeeebbb..', '..bbbbbbbbbbbb..', '..bbbbbbbbbbbb..', '....b.b..b.b....', '....b.b..b.b....'] },
    { id: 'grifter', name: 'GRIFTER', holes: 'e', pal: { b: 'var(--accent)', e: 'var(--board-bg)' },
      rows: ['..b..........b..', '..bb........bb..', '..bbbbbbbbbbbb..', '..bbbbbbbbbebb..', '..bbeeebbbebbb..', '..bbbbbbbbbbbb..', 'bbbbbeebbeebbbbb', 'bbbbbbbbbbbbbbbb', '..bbbbbbbbbbbb..', '..bbbbbbeeebbb..', '..bbbbbbbbbbbb..', '..bbbbbbbbbbbb..', '....b.b..b.b....', '....b.b..b.b....'] },
    { id: 'bunker', name: 'BUNKER', holes: 'e', pal: { b: 'var(--layer-text)', e: 'var(--board-bg)' },
      rows: ['...bbbbbbbbbb...', '...bbbbbbbbbb...', '.bbbbbbbbbbbbbb.', '.bbbbbbbbbbbbbb.', '.bbbbbbbbbbbbbb.', '.bbbeeebbeeebbb.', 'bbbbbbbbbbbbbbbb', 'bbbbbbbbbbbbbbbb', 'bbbbbbeeeebbbbbb', '.bbbbbbbbbbbbbb.', '.bbbbbbbbbbbbbb.', '....b.b..b.b....', '....b.b..b.b....'] },
    { id: 'glitch', name: 'GLITCH', holes: 'e', pal: { b: 'var(--danger)', e: 'var(--board-bg)' },
      rows: ['........b.......', '........b.......', '..bbbbbbbbbbbb..', '..bbbbbbbbbbbb..', 'bbbbbebebebebb..', '..bbbbebbbebbb..', '..bbbebebebebb..', '..bbbbbbbbbbbb..', '..bbbbbbbbbbbb..', '..bbbbebebebbbbb', '..bbbebebebbbb..', '..bbbbbbbbbbbb..', '....b.b..b.b....', '....b.b..b.b....'] },
    { id: 'ghost', name: 'THE GHOST', holes: 'e', pal: { w: '#f2f6ff', e: '#1b1d2a' },
      rows: ['...wwww...', '.wwwwwwww.', 'wwwwwwwwww', 'wweewweeww', 'wweewweeww', 'wwwwwwwwww', 'wwwweewwww', 'wwwweewwww', 'wwwwwwwwww', 'wwwwwwwwww', 'w.ww.ww.ww'] },
    { id: 'frank', name: 'FRANKENSTEIN', holes: 'em', pal: { h: '#1d1d1d', g: '#7fb069', G: '#5e8f4c', e: '#111111', b: '#a0a4aa', m: '#2a2a2a', s: '#2c3140', S: '#1e222d', p: '#3a3226', k: '#0d0d0d' },
      rows: ['..hhhhhhhh..', '..hhhhhhhh..', '..gggggggg..', '..geeggeeg..', '..gggggggg..', '..gGmmmmGg..', '.b.gggggg.b.', '..SSssssSS..', '..sssssssggg', '..sssssssss.', '..SsssssssS.', '..ssssssss..', '..pppppppp..', '..ppp..ppp..', '..ppp..ppp..', '..ppp..ppp..', '.kkkk..kkkk.'] },
    { id: 'mummy', name: 'THE MUMMY', holes: 'xy', pal: { w: '#e6dfc3', d: '#b3a88a', x: '#2a2418', y: '#ffd23f' },
      rows: ['...wwwwww...', '..wwdwwwdw..', '..wxywwxyw..', '..wdwwwwdw..', '...wwddww...', '..dwwwwwwd..', '..wwwwwwwwww', '..wdwwwwdddw', '.dwwwdwwww..', '.d.wwwwdww..', 'd..wdwwwww..', '...wwwwdw...', '...ww..ww...', '...wd..dw...', '...ww..ww...', '..www..www..'] },
    { id: 'creature', name: 'THE CREATURE', holes: 'el', pal: { c: '#3f8f6b', l: '#6fcf9f', f: '#2a6b52', e: '#ffe066', k: '#10231a' },
      rows: ['f.f.cccc.f.f', '.fffccccfff.', '..cccccccc..', '..cekccekc..', '..cccccccc..', '..ckkkkkkc..', '...cccccc...', '.cccllllccc.', 'cc.cllllc.cc', 'c..cllllc..c', 'k..cllllc..k', '...cllllc...', '...cc..cc...', '...cc..cc...', '..ccc..ccc..', '.ffff..ffff.'] },
    { id: 'nosferatu', name: 'NOSFERATU', holes: 'et', pal: { p: '#d6d9c8', b: '#34324a', e: '#ff3b3b', t: '#ffffff', n: '#d6d9c8' },
      rows: ['...pppp...', '..pppppp..', 'p.pppppp.p', '.ppeppepp.', '..pppppp..', '..ptpptp..', '...pppp...', '..bbbbbb..', '.bbbbbbbb.', '.bbbbbbbpn', '.bbbbbbb.n', '.bbbbbbb..', '.bbbbbbb..', '.bbbbbbb..', '.bbbbbbb..', '.bbbbbbb..', '..bbbbbb..', '..bb..bb..', '..bb..bb..', '.bbb..bbb.'] },
    { id: 'gremlin', name: 'THE GREMLIN', holes: 'ek', pal: { g: '#5aa64a', G: '#3d7a32', e: '#ff3030', k: '#111111', w: '#ffffff', b: '#a8d08d' },
      rows: ['g..........g', 'gg........gg', '.ggg.gg.ggg.', '..gGggggGg..', '..ggeggegg..', '..gggggggg..', '..gkwkwkwg..', '...gbbbbg...', '..g.bbbb.g..', '....g..g....', '...gg..gg...'] },
    { id: 'jacklantern', name: "JACK O' LANTERN", holes: 'yY', pal: { o: '#ff8a1f', O: '#c4580a', s: '#3f8f3a', l: '#6cc24a', y: '#ffd23f', Y: '#ff9d00' },
      rows: ['......ss......', '.....ssl......', '...OOOsOOO....', '..OooOoOooO...', '.OoyyoOoyyoO..', '.OoyyoOoyyoO..', 'OooooOyOoooOO.', 'OooooYYYooooO.', 'OoyoooooooyoO.', 'OoyyYyYyYyyoO.', '.OoyyyyyyyoO..', '..OooOoOooO...', '...OOOOOOO....'] },
    { id: 'wraith', name: 'THE FOG WANDERER', holes: 'he', pal: { c: '#b8c0cc', C: '#8a94a2', h: '#262c36', e: '#e8fbff' },
      rows: ['...cccc...', '..cCCCCc..', '.cChhhhCc.', '.cCehheCc.', '.cChhhhCc.', '..cChhCc..', '.cccCCccc.', 'ccCcccCccc', 'cCccccccCc', 'cccccccccc', 'cCcccccCcc', 'cccccccccc', 'ccCccccCcc', 'cccccccccc', '.ccCcccccc', '.cccccCcc.', '.c.cc.cc.c', 'c..c..c..c'] },
    { id: 'zombie', name: 'A ZOMBIE', holes: 'em', pal: { h: '#2b2420', k: '#8aa279', e: '#f4f1b0', m: '#2a1a1a', c: '#5a4a6e', C: '#3e3350', K: '#6d8560', p: '#3b3a33', s: '#1b1b1b' },
      rows: ['...hhhhh....', '..hkkkkkh...', '..kkekkek...', '..kkkkkkk...', '..kkmmmkk...', '...kkkkk....', '..CcccccC...', '.CcccccccKKK', '.ccccccc....', '.Ccccc.cKKK.', '..ccccc.....', '..pppppp....', '..pp..pp....', '..pp..pp....', '..pp..pp....', '.sss..sss...'] },
    { id: 'werewolf', name: 'THE WEREWOLF', holes: 'ent', pal: { F: '#4a3426', f: '#8a6a4e', e: '#ffd23f', n: '#111111', t: '#f2f2f2', s: '#3b4560', S: '#2a3146', p: '#4a3d30', c: '#e3dccb' },
      rows: ['.F........F.', '.FF......FF.', '.FFFFFFFFFF.', '.FFFffffFFF.', '.FFffffffFF.', '.FfeffffefF.', '.FffffffffF.', '.FFffnnffFF.', '..FftfftfF..', '...FFFFFF...', '..sssSSsss..', '.ssssSSssss.', '.ssssssssss.', '.ssssssssss.', '.f.ssssss.f.', '.c.pppppp.c.', '...pp..pp...', '...pp..pp...', '..FFF..FFF..'] },
    { id: 'bug', name: 'THE BUG', holes: 'wk', pal: { v: '#ff3b6b', s: '#c41f4a', o: '#ffd23f', w: '#ffffff', k: '#111111', m: '#3a0a14', l: '#c41f4a' },
      rows: ['.....o.....', '..o..s..o..', '...svvvs...', '..vvvvvvv..', 'osvwkvwkvso', '..vvvvvvv..', '..vvmmmvv..', '...svvvs...', '..o.l.l.o..', '....l.l....'] },
    { id: 'trojan', name: 'THE TROJAN', holes: 'rg', pal: { w: '#9a6a35', W: '#5e3a18', r: '#ff2a2a', k: '#8a8a8a', g: '#d8d8d8' },
      rows: ['......WW......', '.....WwwWW....', '....WwwwwwW...', '...WwwwrwwwW..', '...WwwwwwwwwWW', '...WwwwwWWwwww', '..WwwwwW..WWWW', '..WwwwwW......', '.WwwwwwwW.....', '.WwwwwwwwWWW..', 'WwwwwwwwwwwwW.', 'WwwwwwwwwwwwW.', 'WWWWWWWWWWWWW.', '.kk.......kk..', 'kggk.....kggk.', '.kk.......kk..'] },
    { id: 'ransomware', name: 'RANSOMWARE', holes: 'kr', pal: { s: '#c0c6cf', S: '#7d848f', b: '#e8b923', B: '#a57f12', k: '#111111', r: '#ff3030', l: '#5a4a12' },
      rows: ['...ssssss...', '..sS....Ss..', '..s......s..', '..s......s..', '.bbbbbbbbbb.', '.bBbbbbbbBb.', '.bbrbbbbrbb.', '.bbbbkkbbbb.', '.bbbbkkbbbb.', '.bbbbbkbbbb.', '.bBbbbbbbBb.', '.bbbbbbbbbb.', '..l......l..', '.l........l.'] },
    { id: 'spyware', name: 'SPYWARE', holes: 'i', pal: { W: '#c9ccd6', w: '#f2f2f2', i: '#2f7de0', k: '#111111', v: '#c92a3a' },
      rows: ['..WWWWW..', '.WwwwvwW.', 'WwwiiiwwW', 'WwikkkiwW', 'WwikkkivW', 'WwikkkiwW', 'WwwiiiwwW', '.WwvwwwW.', '..WWWWW..'] },
    { id: 'logicbomb', name: 'THE LOGIC BOMB', holes: 'wK', pal: { k: '#1b1b22', K: '#4a4a5c', f: '#b88a4a', s: '#ffd23f', S: '#ff7a1f', w: '#ffffff' },
      rows: ['........s..', '.......sSs.', '......f.s..', '.....f.....', '....kkk....', '..kkkkkkk..', '.kKkkkkkkk.', 'kKkkkkkkkkk', 'kkkwkkkwkkk', 'kkkkkkkkkkk', '.kkkkkkkkk.', '..kkkkkkk..', '..k.....k..'] },
    { id: 'turkey', name: 'A TURKEY', holes: 'e', pal: { o: '#c96a2b', r: '#a8322a', t: '#d9a35a', b: '#6b4226', h: '#8fa9c0', e: '#111111', y: '#f2b632', w: '#d62f2f' },
      rows: ['..ooo.......', '.orrro...hh.', 'orttto...hey', 'orttto...hw.', '.orttbbb.h..', '..obbbbbbh..', '..bbbbbbbb..', '...bbbbbbb..', '....bbbbb...', '.....y.y....', '.....y.y....', '....yy.yy...'] },
    { id: 'penguin', name: 'A PENGUIN', holes: 'w', pal: { k: '#1b1f27', w: '#f2f4f8', o: '#ff9a1f' },
      rows: ['...kkkk....', '..kkkkkk...', '..kkkkwwk..', '..kkkkwkwoo', '..kkkkwwk..', '.kkkkwwwwk.', 'kkkkwwwwwk.', 'kkkkwwwwwk.', '.kkkwwwwwk.', '.kkkwwwwwk.', '..kkwwwwk..', '...oo..oo..'] },
    { id: 'reindeer', name: 'A REINDEER', holes: 'k', pal: { b: '#8a5a2b', w: '#c8a27a', a: '#d9c49a', k: '#1a120b', n: '#2a1a10' },
      rows: ['.........a...a..', '.........aa.aa..', '..........aaa...', '...........bbb..', '...........bkbb.', '...........bbbbn', '.w........bbb...', '.bbbbbbbbbbbb...', '.bbbbbbbbbbbb...', '..bwwwwwwwwb....', '..b.b....b.b....', '..b.b....b.b....', '..k.k....k.k....'] },
    { id: 'snowman', name: 'A SNOWMAN', holes: 'k', pal: { w: '#f2f4f8', s: '#b8c4d6', k: '#1b1f27', o: '#ff8a1f', h: '#1b1f27', r: '#d23a3a', b: '#6b4a2b' },
      rows: ['....hhhhh....', '....hhhhh....', '...hhhhhhh...', '....wwwws....', '...wwkwkws...', '...wwwwwoooo.', '...wwkkkws...', '....wwwws....', '...rrrrrrr...', 'b.wwwwwrrws.b', '.bwwwkwrrwsb.', '..wwwwwwwss..', '..wwwkwwwss..', '...wwwwwss...', '..wwwwwwwss..', '.wwwwwwwwwss.', 'wwwwwwwwwwwss', 'wwwwwwwwwwwss', 'wwwwwwwwwwwss', '.wwwwwwwwwss.', '..wwwwwwwss..'] },
  ];
  const HOLD_MS = 380; // (a press this long marks)
  const el = (id) => document.getElementById(id);
  const boardEl = el('dc-board');
  const actsEl = el('dc-acts');
  const modeBtn = el('dc-mode');
  const nameEl = el('dc-name');
  const kit = Arcade.kit;
  let s = null; // (the game shown: { pic, W, H, sol, rc, cc, g, solved } and the frame's own)
  let view = null;
  let markMode = false;
  let drag = null; // (a finger down: { i0, r0, c0, axis, to, from, timer, last })

  // (a line's runs of filled squares: its numbers)
  function runs(line) {
    const out = [];
    let n = 0;
    for (const v of line) {
      if (v) n++;
      else if (n) { out.push(n); n = 0; }
    }
    if (n) out.push(n);
    return out;
  }
  const rowOf = (x, r, a) => Array.from({ length: x.W }, (_, c) => a[r * x.W + c]);
  const colOf = (x, c, a) => Array.from({ length: x.H }, (_, r) => a[r * x.W + c]);
  // (a picture as a puzzle: its size, its answer and its numbers)
  function puzzle(pic) {
    const H = pic.rows.length;
    const W = pic.rows[0].length;
    const sol = new Uint8Array(W * H);
    pic.rows.forEach((row, r) => [...row].forEach((ch, c) => { sol[r * W + c] = ch !== '.' && !pic.holes.includes(ch) ? 1 : 0; }));
    const x = { pic, W, H, sol };
    x.rc = Array.from({ length: H }, (_, r) => runs(rowOf(x, r, sol)));
    x.cc = Array.from({ length: W }, (_, c) => runs(colOf(x, c, sol)));
    return x;
  }

  // THE LINE SOLVER: what's sure of one line, given its numbers and what's known of it (0 not known, 1
  // filled, 2 empty): every way the runs can lie that fits what's known, and a square filled in all of
  // them is filled, empty in all of them is empty. null: no way fits
  function solveLine(clue, known) {
    const n = known.length;
    const m = clue.length;
    const memo = new Map();
    const fits = (i, L) => { if (i + L > n) return false; for (let c = i; c < i + L; c++) if (known[c] === 2) return false; return i + L === n || known[i + L] !== 1; };
    const f = (i, k) => { // (can squares i on take runs k on?)
      if (i >= n) return k === m;
      const key = i * (m + 1) + k;
      if (memo.has(key)) return memo.get(key);
      const ok = (known[i] !== 1 && f(i + 1, k)) || (k < m && fits(i, clue[k]) && f(Math.min(n, i + clue[k] + 1), k + 1));
      memo.set(key, ok);
      return ok;
    };
    if (!f(0, 0)) return null;
    const canFill = new Uint8Array(n);
    const canEmpty = new Uint8Array(n);
    const seen = new Set();
    (function walk(i, k) {
      const key = i * (m + 1) + k;
      if (i >= n || seen.has(key)) return;
      seen.add(key);
      if (known[i] !== 1 && f(i + 1, k)) { canEmpty[i] = 1; walk(i + 1, k); }
      if (k < m && fits(i, clue[k])) {
        const j = Math.min(n, i + clue[k] + 1);
        if (f(j, k + 1)) {
          for (let c = i; c < i + clue[k]; c++) canFill[c] = 1;
          if (i + clue[k] < n) canEmpty[i + clue[k]] = 1;
          walk(j, k + 1);
        }
      }
    })(0, 0);
    return known.map((v, i) => v || (canFill[i] && !canEmpty[i] ? 1 : canEmpty[i] && !canFill[i] ? 2 : 0));
  }
  // (the whole grid solved a line at a time: each line that taught something, in order, as
  // [row or column, index, what it learned]; and whether that's every square)
  function solveAll(x) {
    const k = new Uint8Array(x.W * x.H);
    const steps = [];
    for (let changed = true; changed;) {
      changed = false;
      for (const [axis, count] of [['r', x.H], ['c', x.W]]) {
        for (let i = 0; i < count; i++) {
          const known = axis === 'r' ? rowOf(x, i, k) : colOf(x, i, k);
          const out = solveLine(axis === 'r' ? x.rc[i] : x.cc[i], known);
          if (!out) return { steps, done: false };
          const learned = [];
          out.forEach((v, j) => {
            if (v === known[j]) return;
            const at = axis === 'r' ? i * x.W + j : j * x.W + i;
            k[at] = v;
            learned.push([at, v]);
          });
          if (learned.length) { steps.push(learned); changed = true; }
        }
      }
    }
    return { steps, done: k.every((v) => v) };
  }

  function make(rand, saved) {
    const pic = PICS[Math.floor(rand() * PICS.length)];
    const x = Object.assign(puzzle(pic), { g: new Uint8Array(pic.rows.length * pic.rows[0].length), solved: false });
    if (saved && saved.p === pic.id && typeof saved.g === 'string' && saved.g.length === x.g.length && /^[012]+$/.test(saved.g)) {
      [...saved.g].forEach((v, i) => { x.g[i] = +v; });
      x.solved = !!saved.s && won(x);
    }
    return x;
  }
  const won = (x) => x.sol.every((v, i) => (x.g[i] === 1) === !!v);
  const rowDone = (x, r) => runs(rowOf(x, r, x.g).map((v) => v === 1)).join() === x.rc[r].join();
  const colDone = (x, c) => runs(colOf(x, c, x.g).map((v) => v === 1)).join() === x.cc[c].join();

  // THE GRID: the numbers over each column and at each row's left, then the squares (a brighter line
  // every 5); once decoded, the picture in its colors (MONOCHROME: grays). The game's, or a preview's
  function gridView(board, x) {
    const cells = [];
    const rcEls = [];
    const ccEls = [];
    const corner = document.createElement('span');
    corner.className = 'dc-corner';
    const kids = [corner];
    const clueEl = (cls, nums) => {
      const e = document.createElement('span');
      e.className = cls;
      for (const n of nums.length ? nums : [0]) { const i = document.createElement('i'); i.textContent = String(n); e.appendChild(i); }
      return e;
    };
    x.cc.forEach((nums) => { const e = clueEl('dc-cc', nums); ccEls.push(e); kids.push(e); });
    for (let r = 0; r < x.H; r++) {
      const e = clueEl('dc-rc', x.rc[r]);
      rcEls.push(e);
      kids.push(e);
      for (let c = 0; c < x.W; c++) {
        const cell = document.createElement('span');
        cell.className = 'dc-cell';
        cell.dataset.i = String(r * x.W + c);
        if (c % 5 === 4 && c < x.W - 1) cell.classList.add('c5');
        if (c % 5 === 0 && c > 0) cell.classList.add('c0');
        if (r % 5 === 4 && r < x.H - 1) cell.classList.add('r5');
        if (r % 5 === 0 && r > 0) cell.classList.add('r0');
        cells.push(cell);
        kids.push(cell);
      }
    }
    // (the numbers' room, in squares: the widest row's, the tallest column's)
    const rcw = Math.max(...x.rc.map((nums) => (nums.length ? nums : [0]).reduce((w, n) => w + String(n).length * 0.3, 0) + ((nums.length || 1) - 1) * 0.28)) + 0.35;
    const cch = Math.max(...x.cc.map((nums) => Math.max(1, nums.length))) * 0.52 + 0.3;
    board.style.setProperty('--dc-w', x.W);
    board.style.setProperty('--dc-h', x.H);
    board.style.setProperty('--dc-rcw', rcw.toFixed(2));
    board.style.setProperty('--dc-cch', cch.toFixed(2));
    board.classList.remove('dc-done');
    board.replaceChildren(...kids);
    const v = {
      cells, rcw, cch,
      paint(i) {
        const c = cells[i];
        c.classList.toggle('on', x.g[i] === 1);
        c.classList.toggle('x', x.g[i] === 2);
      },
      clues(r, c) {
        if (r !== undefined) rcEls[r].classList.toggle('done', rowDone(x, r));
        if (c !== undefined) ccEls[c].classList.toggle('done', colDone(x, c));
      },
      all() {
        cells.forEach((_, i) => v.paint(i));
        for (let r = 0; r < x.H; r++) v.clues(r);
        for (let c = 0; c < x.W; c++) v.clues(undefined, c);
      },
      lit(r, c) { rcEls.forEach((e, k) => e.classList.toggle('hl', k === r)); ccEls.forEach((e, k) => e.classList.toggle('hl', k === c)); },
      // (decoded: every pixel of the picture in its color, eyes and all, coming in corner to corner)
      reveal(animate) {
        board.classList.add('dc-done');
        v.lit(-1, -1);
        x.pic.rows.forEach((row, r) => [...row].forEach((ch, c) => {
          const cell = cells[r * x.W + c];
          cell.classList.remove('x');
          if (ch === '.') return;
          cell.classList.add('px');
          cell.style.setProperty('--px', x.pic.pal[ch]);
          if (animate) cell.style.animationDelay = `${(r + c) * 25}ms`;
          else cell.classList.add('still');
        }));
      },
    };
    v.all();
    return v;
  }

  function line(x) {
    const time = kit.fmtTime(x.t);
    if (x.solved) return `DECODED IN ${time}${x.k ? ` // +${x.k} KEYS` : ''}`;
    if (!x.moved) return `DECODE THE PICTURE // ${x.W}x${x.H}`;
    let rows = 0;
    let cols = 0;
    for (let r = 0; r < x.H; r++) rows += rowDone(x, r) ? 1 : 0;
    for (let c = 0; c < x.W; c++) cols += colDone(x, c) ? 1 : 0;
    return `TIME ${time} // ROWS ${rows}/${x.H} // COLUMNS ${cols}/${x.W}`;
  }
  function render() {
    actsEl.hidden = s.solved;
    nameEl.hidden = !s.solved;
    nameEl.textContent = `IT'S ${s.pic.name}`;
    modeBtn.textContent = markMode ? 'TAP: MARK' : 'TAP: FILL';
    modeBtn.classList.toggle('on', markMode);
    modeBtn.setAttribute('aria-pressed', String(markMode));
    kit.refresh();
  }
  function solved() {
    s.solved = true;
    view.reveal(true);
    SFX.play('burst');
    const stamp = document.createElement('p');
    stamp.className = 'ck-stamp good show';
    stamp.textContent = 'DECODED';
    boardEl.appendChild(stamp);
    kit.finish();
    render();
  }

  // TAPS, DRAGS AND HOLDS: a tap fills a square (or empties a filled one; with TAP: MARK, marks it); a
  // drag does the same along the row or column it sets off in (to the squares as the first one was:
  // filling empty ones, or emptying ones like it); a hold marks instead (and a drag after it marks on);
  // a right click marks too
  const cellAt = (e) => {
    const t = document.elementFromPoint(e.clientX, e.clientY);
    const c = t && t.closest && t.closest('#dc-board .dc-cell');
    return c ? Number(c.dataset.i) : -1;
  };
  function begin(d, to) {
    const was = s.g[d.i0];
    d.from = was;
    d.to = was === to ? 0 : to;
    put(d, d.i0);
  }
  function put(d, i) {
    if (s.solved) return;
    const was = s.g[i];
    if (i !== d.i0 && (d.to ? was !== 0 : was !== d.from)) return;
    if (was === d.to) return;
    if (!s.moved) kit.moved();
    s.g[i] = d.to;
    view.paint(i);
    view.clues(Math.floor(i / s.W), i % s.W);
    SFX.play(d.to === 1 ? 'click' : d.to === 2 ? 'punct' : 'backspace');
    kit.refresh();
  }
  function along(d, i) {
    const r = Math.floor(i / s.W);
    const c = i % s.W;
    if (!d.axis) d.axis = r === d.r0 ? 'row' : c === d.c0 ? 'col' : Math.abs(r - d.r0) > Math.abs(c - d.c0) ? 'col' : 'row';
    const [a, b] = d.axis === 'row' ? [d.c0, c] : [d.r0, r];
    for (let k = Math.min(a, b); k <= Math.max(a, b); k++) put(d, d.axis === 'row' ? d.r0 * s.W + k : k * s.W + d.c0);
  }
  function end() {
    if (!drag) return;
    clearTimeout(drag.timer);
    if (drag.to === undefined) begin(drag, markMode ? 2 : 1); // (a tap)
    drag = null;
    view.lit(-1, -1);
    if (s.moved) kit.save();
    if (!s.solved && won(s)) solved();
  }
  boardEl.addEventListener('pointerdown', (e) => {
    if (!s || s.solved || drag) return;
    const i = cellAt(e);
    if (i < 0) return;
    try { boardEl.setPointerCapture(e.pointerId); } catch (err) {}
    drag = { i0: i, r0: Math.floor(i / s.W), c0: i % s.W, axis: null, last: i };
    view.lit(drag.r0, drag.c0);
    if (e.button === 2) { begin(drag, 2); return; }
    drag.timer = setTimeout(() => { if (drag && drag.to === undefined) begin(drag, 2); }, HOLD_MS);
  });
  boardEl.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const i = cellAt(e);
    if (i < 0 || i === drag.last) return;
    drag.last = i;
    if (drag.to === undefined) { clearTimeout(drag.timer); begin(drag, markMode ? 2 : 1); }
    along(drag, i);
  });
  boardEl.addEventListener('pointerup', end);
  boardEl.addEventListener('pointercancel', end);
  boardEl.addEventListener('contextmenu', (e) => e.preventDefault()); // (a hold isn't the phone's menu)
  modeBtn.addEventListener('click', () => {
    markMode = !markMode;
    SFX.play('button');
    render();
  });

  // THE ARCADE MENU's preview (arcade.js plays it): a picture decoded as the line solver goes, a line at a
  // time (its squares filled and marked), then its colors
  function demo(host) {
    const x = Object.assign(puzzle(PICS[Math.floor(Math.random() * PICS.length)]), { solved: false });
    x.g = new Uint8Array(x.W * x.H);
    const board = document.createElement('div');
    board.className = 'dc-board';
    host.replaceChildren(board);
    const v = gridView(board, x);
    const { steps } = solveAll(x);
    let k = 0;
    return {
      step() {
        if (x.solved) return null;
        if (k >= steps.length) { x.solved = true; v.reveal(true); return 1200; }
        const learned = steps[k++];
        learned.forEach(([i, val]) => { x.g[i] = val; v.paint(i); v.clues(Math.floor(i / x.W), i % x.W); });
        return 200;
      },
    };
  }

  return {
    name: 'DECODE',
    rule: () => 'fill the squares the numbers call for; a picture appears.',
    make,
    pack: (x) => ({ p: x.pic.id, g: [...x.g].join(''), s: x.solved ? 1 : 0 }),
    over: (x) => x.solved,
    timed: 'move',
    status(saved, day) {
      const x = make(seeded(hashString(`bytefall:${day}:decode`)), saved);
      const t = kit.fmtTime((saved && saved.t) || 0);
      if (x.solved) return { done: true, text: `DECODED IN ${t}` };
      return { done: false, text: saved && saved.m ? `UNDER WAY // ${t}` : `ONE GAME TODAY // ${x.W}x${x.H}` };
    },
    line,
    show(x) {
      if (x !== s) { s = x; markMode = false; }
      drag = null;
      view = gridView(boardEl, s);
      if (s.solved) view.reveal(false);
      render();
    },
    key: () => false,
    leave() { if (drag) clearTimeout(drag.timer); drag = null; },
    // (square squares as big as the room allows, 40px at most, the numbers beside and over them)
    fit() {
      if (!s || !view || boardEl.closest('.arcade-game').hidden) return;
      const host = boardEl.parentElement;
      const below = (s.solved ? nameEl.offsetHeight : actsEl.offsetHeight) + 8;
      const pad = 14; // (the board's padding and border)
      const size = Math.floor(Math.min(40, (host.clientWidth - pad - 2 * s.W) / (s.W + view.rcw), (host.clientHeight - below - pad - 2 * s.H) / (s.H + view.cch)));
      boardEl.style.setProperty('--dc-cell', `${Math.max(12, size)}px`);
    },
    pay: (x) => Progress.arcadeResult('decode', true, Math.floor(x.t / 1000)),
    best: (x) => Math.floor(x.t / 1000),
    bestText: (v) => kit.fmtTime(v * 1000),
    low: true,
    demo,
    // SHARE: the time and the picture's size (not what it is: that's for each to find)
    share: (x) => [`Decoded in ${kit.fmtTime(x.t)}`, `A ${x.W}x${x.H} picture`],
    pictures: PICS, puzzle, solveAll, // (for testing)
  };
})());
