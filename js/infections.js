// INFECTIONS (a BLACK BOX's bad luck: script.js's runInfection). Each shows itself in its own little
// display, never the lane's pixel art: LED dot-matrix signs (lit dots on a dark grid, a soft glow) or
// ASCII, each kept within the borders of the bits it takes up:
//   ADWARE        an ad in its own frame over a column, below the overflow line: chasing bulbs round
//                 it, a CPU pulling faces and its claims marching up the sign (LED)
//   SPYWARE       a pair of eyes watching from where your next bit should be (ASCII)
//   RANSOMWARE    a padlock on each locked bit, its little screen fading between a grinning CPU (LED)
//                 and gibberish typing (ASCII)
//   MALWARE       every bit on the board a jumble of flickering characters (ASCII)
//   CRYPTOJACKER  a CPU stealing your resources, on a sign through the overflow row's own cells:
//                 pans, close-ups, and a gloat whenever it takes some (LED)
//   SCAREWARE     a fake system alert over the board, a scan bar crawling and a skull (ASCII), closed
//                 only by its tiny X
// Each has four looks, one picked at random each time it strikes (STYLES)
const Infections = (() => {
  const root = document.documentElement;
  const css = (name, fallback) => getComputedStyle(root).getPropertyValue(name).trim() || fallback;
  const reduced = () => root.classList.contains('low-fx') || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);

  // ── LED: a 5x7 font, the CPU's faces, a coin and a sack, as rows of dots ─────────────────────
  const FONT = {
    A: '01110,10001,10001,11111,10001,10001,10001', B: '11110,10001,10001,11110,10001,10001,11110', C: '01110,10001,10000,10000,10000,10001,01110',
    D: '11110,10001,10001,10001,10001,10001,11110', E: '11111,10000,10000,11110,10000,10000,11111', F: '11111,10000,10000,11110,10000,10000,10000',
    G: '01110,10001,10000,10111,10001,10001,01111', H: '10001,10001,10001,11111,10001,10001,10001', I: '01110,00100,00100,00100,00100,00100,01110',
    J: '00111,00010,00010,00010,00010,10010,01100', K: '10001,10010,10100,11000,10100,10010,10001', L: '10000,10000,10000,10000,10000,10000,11111',
    M: '10001,11011,10101,10101,10001,10001,10001', N: '10001,10001,11001,10101,10011,10001,10001', O: '01110,10001,10001,10001,10001,10001,01110',
    P: '11110,10001,10001,11110,10000,10000,10000', Q: '01110,10001,10001,10001,10101,10010,01101', R: '11110,10001,10001,11110,10100,10010,10001',
    S: '01111,10000,10000,01110,00001,00001,11110', T: '11111,00100,00100,00100,00100,00100,00100', U: '10001,10001,10001,10001,10001,10001,01110',
    V: '10001,10001,10001,10001,10001,01010,00100', W: '10001,10001,10001,10101,10101,10101,01010', X: '10001,10001,01010,00100,01010,10001,10001',
    Y: '10001,10001,01010,00100,00100,00100,00100', Z: '11111,00001,00010,00100,01000,10000,11111',
    0: '01110,10001,10011,10101,11001,10001,01110', 1: '00100,01100,00100,00100,00100,00100,01110', 2: '01110,10001,00001,00010,00100,01000,11111',
    3: '11111,00010,00100,00010,00001,10001,01110', 4: '00010,00110,01010,10010,11111,00010,00010', 5: '11111,10000,11110,00001,00001,10001,01110',
    6: '00110,01000,10000,11110,10001,10001,01110', 7: '11111,00001,00010,00100,01000,01000,01000', 8: '01110,10001,10001,01110,10001,10001,01110',
    9: '01110,10001,10001,01111,00001,00010,01100', '!': '00100,00100,00100,00100,00100,00000,00100', '?': '01110,10001,00001,00010,00100,00000,00100',
    '.': '00000,00000,00000,00000,00000,01100,01100', ',': '00000,00000,00000,00000,01100,00100,01000', ':': '00000,01100,01100,00000,01100,01100,00000',
    "'": '00100,00100,01000,00000,00000,00000,00000', '-': '00000,00000,00000,11111,00000,00000,00000', '+': '00000,00100,00100,11111,00100,00100,00000',
    '%': '11000,11001,00010,00100,01000,10011,00011', $: '00100,01111,10100,01110,00101,11110,00100', '/': '00000,00001,00010,00100,01000,10000,00000',
    '#': '01010,01010,11111,01010,11111,01010,01010', '*': '00000,00100,10101,01110,10101,00100,00000', ' ': '00000,00000,00000,00000,00000,00000,00000',
  };
  const glyph = (ch) => (FONT[ch] || FONT['?']).split(',');
  // The malicious CPU: its head, its eyes and mouth swapped for a face (x: lit, o: the second color)
  const EYES = {
    sly: ['x.oo...oo.x', 'x..o....o.x'], angry: ['x.o.....o.x', 'x..oo.oo..x'], wink: ['x.oo......x', 'x.oo..ooo.x'],
    side: ['x...oo..oox', 'x...oo..oox'], wide: ['x.ooo.ooo.x', 'x.ooo.ooo.x'], shut: ['x.........x', 'x.ooo.ooo.x'],
  };
  const MOUTHS = {
    grin: ['x.xxxxxxx.x', 'x..xxxxx..x'], laugh: ['x..xxxxx..x', 'x..x...x..x'], smug: ['x....xxxx.x', 'x.........x'],
    teeth: ['x.xxxxxxx.x', 'x.x.x.x.x.x'], oh: ['x....xx...x', 'x....xx...x'], flat: ['x.........x', 'x.xxxxxxx.x'],
  };
  const face = (eyes, mouth) => ['.x.......x.', 'xxxxxxxxxxx', 'x.........x', ...EYES[eyes], 'x.........x', ...MOUTHS[mouth], 'xxxxxxxxxxx'];
  const FACES = [['sly', 'grin'], ['wink', 'smug'], ['angry', 'teeth'], ['side', 'grin'], ['wide', 'oh'], ['shut', 'laugh']];
  const COIN = ['.ooo.', 'o.x.o', 'oxxxo', 'o.x.o', '.ooo.'];
  const SACK = ['..x..', '.xxx.', 'xx$xx', 'xxxxx', '.xxx.'];

  // A dot buffer: w x h, 0 off, 1 the main color, 2 the second
  function buffer(w, h) {
    const b = new Uint8Array(w * h);
    const set = (x, y, v) => { x = Math.round(x); y = Math.round(y); if (x >= 0 && x < w && y >= 0 && y < h) b[y * w + x] = v; };
    const sprite = (rows, x0, y0, k = 1) => rows.forEach((r, y) => [...r].forEach((ch, x) => {
      if (ch === '.') return;
      const v = ch === 'o' ? 2 : 1;
      for (let i = 0; i < k; i++) for (let j = 0; j < k; j++) set(x0 + x * k + i, y0 + y * k + j, v);
    }));
    const text = (str, x0, y0, v = 1) => [...str].forEach((ch, n) => glyph(ch).forEach((r, y) => [...r].forEach((bit, x) => { if (bit === '1') set(x0 + n * 6 + x, y0 + y, v); })));
    const textV = (str, x0, y0, v = 1) => [...str].forEach((ch, n) => glyph(ch).forEach((r, y) => [...r].forEach((bit, x) => { if (bit === '1') set(x0 + x, y0 + n * 9 + y, v); })));
    return { w, h, b, set, sprite, text, textV };
  }
  // Paint a dot buffer onto a canvas: lit dots glowing in their color, the rest faint; only inside
  // the windows given (the bits' own boxes), or everywhere
  function paint(cv, buf, colors, windows = null) {
    const g = cv.getContext('2d');
    const dpr = cv.width / Math.max(1, cv.clientWidth);
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, cv.clientWidth, cv.clientHeight);
    const px = cv.clientWidth / buf.w;
    const py = cv.clientHeight / buf.h;
    const r = Math.max(0.6, Math.min(px, py) * 0.36);
    g.save();
    if (windows) {
      g.beginPath();
      for (const wdw of windows) g.roundRect ? g.roundRect(wdw.x, wdw.y, wdw.w, wdw.h, 3) : g.rect(wdw.x, wdw.y, wdw.w, wdw.h);
      g.clip();
    }
    g.fillStyle = 'rgba(255, 255, 255, 0.06)';
    for (let y = 0; y < buf.h; y++) for (let x = 0; x < buf.w; x++) if (!buf.b[y * buf.w + x]) { g.beginPath(); g.arc((x + 0.5) * px, (y + 0.5) * py, r * 0.8, 0, 6.283); g.fill(); }
    for (const v of [1, 2]) {
      g.fillStyle = colors[v - 1];
      g.shadowColor = colors[v - 1];
      g.shadowBlur = reduced() ? 0 : r * 3;
      g.beginPath();
      for (let y = 0; y < buf.h; y++) for (let x = 0; x < buf.w; x++) if (buf.b[y * buf.w + x] === v) { g.moveTo((x + 0.5) * px + r, (y + 0.5) * py); g.arc((x + 0.5) * px, (y + 0.5) * py, r, 0, 6.283); }
      g.fill();
    }
    g.restore();
  }
  const sizeCanvas = (cv) => {
    const dpr = window.devicePixelRatio || 1;
    const w = Math.round(cv.clientWidth * dpr);
    const h = Math.round(cv.clientHeight * dpr);
    if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
  };

  // Each infection's four looks: one picked at random each time it strikes
  const style = { ad: 0, jack: 0, spy: 0, malware: 0, ransom: 0, scare: 0 };
  let forced = null; // (the dev page or a test: { kind: look } to show that look next)
  const LOOKS = { ad: 4, jack: 4, spy: 4, malware: 6, ransom: 5, scare: 4 }; // (how many looks each has)
  const pick = (kind) => {
    const f = forced && forced[kind] !== undefined ? forced[kind] : -1;
    style[kind] = f >= 0 && f < LOOKS[kind] ? f : Math.floor(Math.random() * LOOKS[kind]);
    if (kind === 'malware') mosaic = null; // (a new picture for the board, if it's to be one)
    return style[kind];
  };
  const ARROW_DOWN = ['..x..', '..x..', '..x..', 'xxxxx', '.xxx.', '..x..'];
  const SKULL_LED = ['.xxxxxxx.', 'xxxxxxxxx', 'xx..x..xx', 'xx..x..xx', 'xxxx.xxxx', '.xxx.xxx.', '..x.x.x..', '..xxxxx..'];
  const PICK = ['xxxx.', '.xx..', '.x.x.', 'x....', 'x....'];
  const ROCKET = ['..xx.....', '.xxxxx...', 'xxxxxxxo.', '.xxxxx...', '..xx.....'];
  const HAND = ['x.x.x', 'x.x.x', 'xxxxx', 'xxxxx', '.xxx.'];
  const SYMS = [['.ooo.', 'o...o', '..oo.', '..o..', '.....', '..o..'], ['ooooo', '...o.', '..o..', '.o...', '.o...', '.o...'], COIN, ['..x..', '.xxx.', 'xx$xx', '.xxx.', '..x..']];

  // ── The board's overlays: made once, laid over the bits after each redraw (place) ─────────────
  let wrap = null;
  let board = null;
  const els = {};
  function layer(name, html) {
    if (els[name]) return els[name];
    const el = document.createElement('div');
    el.className = `inf inf-${name}`;
    el.setAttribute('aria-hidden', 'true');
    el.hidden = true;
    el.innerHTML = html;
    wrap.appendChild(el);
    els[name] = el;
    return el;
  }
  // (a bit's box, against the board's wrap)
  function boxOf(r, c) {
    const cell = board.querySelector(`.cell[data-pos="${r},${c}"]`);
    if (!cell) return null;
    const a = cell.getBoundingClientRect();
    const o = wrap.getBoundingClientRect();
    return { x: a.left - o.left, y: a.top - o.top, w: a.width, h: a.height };
  }

  let state = { adCol: null, jack: false, rows: 7, maxRows: 8, cols: 7 };
  let frame = 0;
  let t0 = performance.now();
  // ADWARE: its frame over the column, from the overflow line down to the floor
  let adClaims = [];
  const CLAIMS = ['FREE KEYS', 'BITS NEAR YOU', 'DOWNLOAD RAM', '1 WEIRD TRICK', 'CPU APPROVED', '100% LEGIT', 'YOU WON!', 'BUY NOW', 'NO VIRUS', 'HOT BITS', 'CLICK ME', 'TRUST ME'];
  function drawAd(now) {
    const el = els.ad;
    const cv = el.querySelector('canvas');
    sizeCanvas(cv);
    const W = Math.max(11, Math.round(cv.clientWidth / 3.2));
    const H = Math.max(30, Math.round(cv.clientHeight / 3.2));
    const buf = buffer(W, H);
    const t = (now - t0) / 1000;
    // (the bulbs round its edge, chasing)
    const per = 2 * (W + H) - 4;
    for (let i = 0; i < per; i++) {
      if ((i + Math.floor(t * 8)) % 3) continue;
      let x; let y;
      if (i < W) { x = i; y = 0; } else if (i < W + H - 1) { x = W - 1; y = i - W + 1; } else if (i < 2 * W + H - 2) { x = W - 1 - (i - (W + H - 2)); y = H - 1; } else { x = 0; y = H - 1 - (i - (2 * W + H - 3)); }
      buf.set(x, y, 2);
    }
    const cx = Math.round((W - 11) / 2);
    if (style.ad === 1) { // (a SALE: the price tag flashing, its numbers falling, arrows pointing)
      const deals = ['-90%', 'FREE', '$0', 'SALE', '2X1'];
      const d = deals[Math.floor(t / 1.2) % deals.length];
      const on = Math.floor(t * 4) % 2;
      buf.textV(d, Math.round((W - 5) / 2), 3, on ? 1 : 2);
      for (let k = 0; k < 3; k++) buf.sprite(ARROW_DOWN, Math.round((W - 5) / 2), H - 9 - ((Math.floor(t * 10) + k * 6) % 18) - k * 6);
      buf.sprite(face('wink', 'grin'), cx, H - 12);
      paint(cv, buf, [css('--accent', '#ffd23f'), css('--danger', '#ff3b5c')]);
      return;
    }
    if (style.ad === 2) { // (a slot machine: three reels spinning down the column, JACKPOT)
      const spinning = (t % 4) < 2.6;
      for (let r = 0; r < 3; r++) {
        const y0 = 3 + r * Math.floor((H - 16) / 3);
        const sym = spinning ? SYMS[(Math.floor(t * 12) + r * 3) % SYMS.length] : SYMS[1];
        buf.sprite(sym, Math.round((W - 5) / 2), y0 + (spinning ? Math.floor(t * 24) % 3 : 0));
      }
      if (!spinning && Math.floor(t * 6) % 2) buf.textV('WIN', Math.round((W - 5) / 2), H - 30 > 0 ? H - 30 : 3, 2);
      paint(cv, buf, [css('--accent', '#ffd23f'), css('--danger', '#ff3b5c')]);
      return;
    }
    if (style.ad === 3) { // (the CPU bouncing down the sign, CLICK HERE blinking under it)
      const bounce = Math.abs(Math.sin(t * 2.4));
      const y = Math.round(2 + bounce * (H - 40));
      const f = FACES[Math.floor(t * 1.5) % FACES.length];
      buf.sprite(face(f[0], f[1]), cx, y);
      if (Math.floor(t * 3) % 2) buf.textV('CLICK', Math.round((W - 5) / 2), Math.min(H - 46, y + 12), 2);
      paint(cv, buf, [css('--accent', '#ffd23f'), css('--danger', '#ff3b5c')]);
      return;
    }
    // (the CPU at the top, a new face every second or so)
    const f = FACES[Math.floor(t * 0.9) % FACES.length];
    buf.sprite(face(f[0], f[1]), cx, 2);
    // (its claims marching up the sign, a letter under a letter)
    if (!adClaims.length) adClaims = [...CLAIMS].sort(() => Math.random() - 0.5);
    const msg = `${adClaims.join('  *  ')}  *  `;
    const top = 13;
    const span = msg.length * 9;
    const off = Math.floor(t * 14) % span;
    for (let rep = 0; rep < 2; rep++) {
      const y0 = top + (H - 2 - top) - off + rep * span;
      [...msg].forEach((ch, n) => {
        const y = y0 + n * 9 - (H - 2 - top);
        if (y < top - 6 || y > H - 2) return;
        glyph(ch).forEach((row, gy) => [...row].forEach((bit, gx) => { if (bit === '1' && y + gy >= top && y + gy < H - 1) buf.set(Math.round((W - 5) / 2) + gx, y + gy, 1); }));
      });
    }
    paint(cv, buf, [css('--accent', '#ffd23f'), css('--danger', '#ff3b5c')]);
  }
  // CRYPTOJACKER: a sign through the overflow row's cells
  let stolen = null; // { n, at }
  function drawJack(now) {
    const el = els.jack;
    const cv = el.querySelector('canvas');
    sizeCanvas(cv);
    const W = Math.max(40, Math.round(cv.clientWidth / 3));
    const H = Math.max(11, Math.round(cv.clientHeight / 3));
    const buf = buffer(W, H);
    const t = (now - t0) / 1000;
    const mid = Math.round((H - 9) / 2);
    if (stolen && now - stolen.at < 2400) { // (it got some: a gloat)
      const k = (now - stolen.at) / 2400;
      buf.sprite(face('shut', 'laugh'), 2, mid);
      buf.text(`+${stolen.n} ${['MINE!', 'YOINK!', 'HASHED', 'SEE YA'][style.jack]}`, 16, Math.round((H - 7) / 2));
      const cx = Math.round(W - 8 - k * (W - 22));
      buf.sprite(COIN, cx, Math.round((H - 5) / 2));
    } else if (style.jack === 1) { // (PICKPOCKET: a hand reaching in from the right, a coin at a time)
      const s = (t % 2.4) / 2.4;
      buf.sprite(face('side', 'smug'), 2, mid);
      const reach = Math.round(W - 6 - Math.sin(s * Math.PI) * (W - 30));
      for (let x = reach + 5; x < W; x++) buf.set(x, Math.round(H / 2), 1);
      buf.sprite(HAND, reach, Math.round((H - 5) / 2));
      if (s > 0.5) buf.sprite(COIN, reach + 6, Math.round((H - 5) / 2));
      else buf.sprite(COIN, 18 + Math.floor(t) % 3 * 6, Math.round((H - 5) / 2));
    } else if (style.jack === 2) { // (MINING RIG: its pickaxe on a coin, sparks, the hash rate climbing)
      const s = (t % 0.8) / 0.8;
      buf.sprite(face('angry', 'teeth'), 2, mid);
      const swing = s < 0.5;
      buf.sprite(PICK, 15, Math.round((H - 5) / 2) - (swing ? 2 : 0));
      buf.sprite(COIN, 20, Math.round((H - 5) / 2));
      if (!swing) for (let k = 0; k < 4; k++) buf.set(26 + k * 2, Math.round(H / 2) - 2 + (k % 2) * 3, 2);
      const pct = Math.floor((t * 7) % 100);
      buf.text(`${pct}%`, W - 26, Math.round((H - 7) / 2));
    } else if (style.jack === 3) { // (GETAWAY: off in a rocket, a trail of coins behind)
      const s = (t % 2.6) / 2.6;
      const x = Math.round(-20 + s * (W + 30));
      for (let k = 1; k < 5; k++) buf.sprite(COIN, x - k * 8, Math.round((H - 5) / 2) + (k % 2 ? 1 : -1));
      buf.sprite(ROCKET, x, Math.round((H - 5) / 2));
      buf.sprite(face('wink', 'grin'), x + 10, mid);
    } else {
      const scene = Math.floor(t / 3) % 4;
      const s = (t % 3) / 3;
      if (scene === 0) { // (a pan: it creeps across with its sack, coins hopping in)
        const x = Math.round(-14 + s * (W + 14));
        buf.sprite(face('side', 'smug'), x, mid);
        buf.sprite(SACK, x - 7, Math.round((H - 5) / 2));
        for (let i = 0; i < 3; i++) buf.sprite(COIN, x + 14 + i * 9, Math.round((H - 5) / 2) - (Math.floor(t * 6 + i) % 2));
      } else if (scene === 1) { // (a close-up: its eyes, big, the camera drifting across them)
        const k = Math.max(2, Math.floor(H / 7));
        const f = face('angry', 'teeth');
        const fw = 11 * k;
        const x = Math.round((W - fw) / 2 + Math.sin(s * Math.PI * 2) * (W / 6));
        buf.sprite(f, x, Math.round(-2.2 * k - s * 2 * k), k);
      } else if (scene === 2) { // (its words, marching past)
        const msg = 'MINING YOUR CRYPTO...   ';
        buf.text(msg, Math.round(W - s * (msg.length * 6 + W)), Math.round((H - 7) / 2), 1);
      } else { // (a zoom out: it, grinning, coins piling up behind it)
        buf.sprite(face(s < 0.5 ? 'sly' : 'wink', 'grin'), Math.round(W / 2 - 5), mid);
        const n = Math.floor(s * 8);
        for (let i = 0; i < n; i++) buf.sprite(COIN, 2 + i * 6 - (i % 2) * 0, Math.round((H - 5) / 2) + (i % 2 ? -1 : 1));
      }
    }
    const windows = [];
    for (let r = state.maxRows - 1; r >= state.rows; r--) for (let c = 0; c < state.cols; c++) {
      const b = boxOf(r, c);
      if (b) windows.push({ x: b.x - el.offsetLeft, y: b.y - el.offsetTop, w: b.w, h: b.h });
    }
    paint(cv, buf, [css('--danger', '#ff3b5c'), css('--accent', '#ffd23f')], windows);
  }
  function loop(now) {
    frame = 0;
    const busy = (els.ad && !els.ad.hidden) || (els.jack && !els.jack.hidden);
    if (!busy) return;
    if (els.ad && !els.ad.hidden) drawAd(now);
    if (els.jack && !els.jack.hidden) drawJack(now);
    frame = requestAnimationFrame(loop);
  }
  const spin = () => { if (!frame) frame = requestAnimationFrame(loop); };

  // ── ASCII: the corrupted bits, the spying eyes, the ransom screens' typing ────────────────────
  const JUNK = '#%&@$?!*<>/\\|~^=+;:{}[]';
  const junk = (n) => Array.from({ length: n }, () => JUNK[Math.floor(Math.random() * JUNK.length)]).join('');
  // MALWARE's six ways of spoiling a bit: junk, binary, error codes, a shade melting through it; and
  // the ASCII ART: one big picture in binary across the whole board, each bit showing its piece of
  // it (MOSAIC), or each bit a tiny picture of its own
  const ERRS = ['ERR', 'NaN', '0x?', 'NUL', '404', '???', 'EOF', '-0-'];
  const MELT = ['#', '=', '-', '.', ' ', '.', '-', '='];
  const corrupt = (n, r, c) => {
    if (style.malware === 4 && r !== undefined) return mosaicPiece(r, c);
    if (style.malware === 5 && r !== undefined) return binFill(MINIS[(r * 3 + c) % MINIS.length]);
    if (style.malware === 1) return Array.from({ length: n }, () => (Math.random() < 0.5 ? '0' : '1')).join('');
    if (style.malware === 2) return ERRS[Math.floor(Math.random() * ERRS.length)];
    if (style.malware === 3) { const k = Math.floor(performance.now() / 120); return Array.from({ length: n }, (_, i) => MELT[(k + i) % MELT.length]).join(''); }
    return junk(n);
  };
  const SPY = [
    ['(o_o)', '(o_o)', '(O_o)', '(o_O)', '(-_-)', '(o_o)', '(>_>)', '(<_<)'], // (eyes)
    ['REC *', 'REC  ', 'REC *', 'REC  '], // (a camera, recording)
    ['[oo]  ', ' [oo] ', '  [oo]', ' [oo] '], // (binoculars, sweeping)
    ['|o |', '| o|', '|o |', '|  |'], // (an eye at the keyhole)
  ];
  let ticker = 0;
  function tick() {
    let any = false;
    document.querySelectorAll('.inf-glitch').forEach((g) => {
      any = true;
      if (g.dataset.r !== undefined && style.malware >= 4) binFlicker(g); // (the pictures: their digits flicker, the shape holds)
      else g.textContent = corrupt(g.dataset.n ? +g.dataset.n : 3);
    });
    document.querySelectorAll('.inf-mini').forEach((m) => { any = true; binFlicker(m); });
    document.querySelectorAll('.inf-eyes').forEach((e) => { any = true; const f = SPY[style.spy]; e.textContent = f[Math.floor(performance.now() / 600) % f.length]; });
    for (const w of wins()) { const scan = w.querySelector('.inf-scan'); if (scan) { any = true; scareTick(w, scan); } }
    if (!any) { clearInterval(ticker); ticker = 0; }
  }
  const tickOn = () => { if (!ticker) ticker = setInterval(tick, 110); };

  // RANSOMWARE: a locked bit's insides: its little screen (a grinning CPU in LED, gibberish typing),
  // a padlock, the drops left
  const LOCK = '<svg class="inf-lock" viewBox="0 0 10 12" shape-rendering="crispEdges"><path d="M3 1h4v1h1v3H7V2H3v3H2V2h1zM1 5h8v6H1zM4 7v2h2V7z" fill="currentColor" fill-rule="evenodd"/></svg>';
  function ledSvg(rows) { // (a face as LED dots: an SVG, so it survives the board's redraws)
    let dots = '';
    rows.forEach((r, y) => [...r].forEach((ch, x) => { dots += `<circle cx="${x + 0.5}" cy="${y + 0.5}" r="0.38" class="${ch === '.' ? 'off' : ch === 'o' ? 'on2' : 'on'}"/>`; }));
    return `<svg class="inf-led" viewBox="0 0 ${rows[0].length} ${rows.length}">${dots}</svg>`;
  }
  // RANSOMWARE's four screens: an LED picture fading into ASCII and back
  const RANSOM_LED = [ledSvg(face('angry', 'grin')), ledSvg(SKULL_LED), ledSvg(['..xxx..', '.x...x.', '.x...x.', 'xxxxxxx', 'xxx.xxx', 'xxx.xxx', 'xxxxxxx']), ledSvg(face('shut', 'laugh'))];
  const TERMS = [
    () => Array.from({ length: 4 }, () => junk(5).replace(/[<>&]/g, '#')), // (gibberish typing)
    () => ['PAY', 'UP!', '$$$', '>:)'], // (the demand)
    () => ['LOCK', 'ED.', '0x7F', 'FF..'], // (a hex dump)
    () => ['KEYS', 'OR', 'BITS', 'BYE'], // (the threat)
    () => Array.from({ length: 4 }, () => Array.from({ length: 4 }, () => '0123456789ABCDEF'[Math.floor(Math.random() * 16)]).join('')), // (hex, streaming)
  ];
  const TERM = (k) => TERMS[k]().map((l) => `<span>${l}</span>`).join('');
  function ransomHtml(val, left, k = style.ransom) {
    const face = k === 4 ? `<pre class="inf-mini">${binFill(MINIS[(val + left) % MINIS.length])}</pre>` : RANSOM_LED[k]; // (the ASCII ART: a tiny picture in binary)
    return `<span class="inf-screen"><span class="inf-face">${face}</span><span class="inf-term">${TERM(k)}</span></span>`
      + `${LOCK}<span class="inf-ransom-val">${val}</span><span class="inf-ransom-left">${left}</span>`;
  }

  // SCAREWARE: the fake alert, its scan crawling, its tiny X the only way out
  const SCARES = [
    ['SYSTEM ALERT', '13 VIRUSES FOUND ON YOUR DEVICE!', 'CLEAN NOW'],
    ['WARNING', 'YOUR KEYS HAVE EXPIRED!', 'RENEW KEYS'],
    ['CONGRATULATIONS', 'YOU WON A FREE BIT!', 'CLAIM PRIZE'],
    ['CRITICAL ERROR', 'SYSTEM32 NOT FOUND', 'REPAIR'],
    ['SECURITY RISK', 'YOUR CPU IS OVERHEATING!', 'COOL IT'],
    ['UPDATE REQUIRED', 'YOUR BITS ARE OUT OF DATE', 'UPDATE ALL'],
  ];
  // BINARY ART: shapes filled with flickering 0s and 1s (the skull and crossbones; a cluster of
  // spiky viruses), their holes left dark
  const SKULL_BIN = [
    '........xxxxxxxxxx........',
    '......xxxxxxxxxxxxxx......',
    '.....xxxxxxxxxxxxxxxx.....',
    '.....xxxxxxxxxxxxxxxx.....',
    '.....xxx....xx....xxx.....',
    '.....xxx....xx....xxx.....',
    '.....xxxx..xxxx..xxxx.....',
    '......xxxxxx..xxxxxx......',
    '.......xxxxxxxxxxxx.......',
    '........x.x.xx.x.x........',
    '.........xxxxxxxx.........',
    'xxx....................xxx',
    'xxxxxx..............xxxxxx',
    '...xxxxxx........xxxxxx...',
    '......xxxxxx..xxxxxx......',
    '.........xxxxxxxx.........',
    '......xxxxxx..xxxxxx......',
    '...xxxxxx........xxxxxx...',
    'xxxxxx..............xxxxxx',
    'xxx....................xxx',
  ];
  // (the rest drawn in square pixels, each two characters wide: a character's about half as wide as tall)
  const wide = (rows) => rows.map((r) => [...r].map((c) => c + c).join(''));
  const PADLOCK_BIN = wide(['....xxxxxx....', '...xx....xx...', '..xx......xx..', '..xx......xx..', '..xx......xx..', '.xxxxxxxxxxxx.', '.xxxxxxxxxxxx.', '.xxxxx..xxxxx.', '.xxxxx..xxxxx.', '.xxxxxx.xxxxx.', '.xxxxxx.xxxxx.', '.xxxxxxxxxxxx.', '.xxxxxxxxxxxx.']);
  const BUG_BIN = wide(['...x.......x...', '....x.....x....', '.....xxxxx.....', 'x...xxxxxxx...x', '.x.xxxxxxxxx.x.', '..xxxx.x.xxxx..', '...xxxx.xxxx...', 'xxxxxxx.xxxxxxx', '...xxxx.xxxx...', '..xxxxx.xxxxx..', '.x.xxxx.xxxx.x.', 'x...xxx.xxx...x', '.....xxxxx.....']);
  const WARN_BIN = wide(['.......x.......', '......xxx......', '......xxx......', '.....xx.xx.....', '.....xx.xx.....', '....xxx.xxx....', '....xxx.xxx....', '...xxxx.xxxx...', '...xxxxxxxxx...', '..xxxxx.xxxxx..', '.xxxxxxxxxxxxx.', 'xxxxxxxxxxxxxxx']);
  const CPU_BIN = wide(['..x.x.x.x.x.x.', '.xxxxxxxxxxxx.', 'xxxxxxxxxxxxxx', 'xx...xxxx...xx', 'xxx...xx...xxx', 'xxxx.xxxx.xxxx', 'xxxxxxxxxxxxxx', 'xxx........xxx', 'xxx.x.x.x.xxxx', 'xxxxxxxxxxxxxx', '.xxxxxxxxxxxx.', '..x.x.x.x.x.x.']);
  // (the viruses, like the ones under a microscope: round, pocked, spiked all round, a knob on each
  // spike; worked out on square pixels, eight spikes so the lines step cleanly)
  function virusMask() {
    const W = 29;
    const H = 22;
    const bugs = [ // [x, y, body radius, spike length, holes [dx, dy, r]]
      [11, 11.5, 5.8, 3, [[-2.2, -2, 1.3], [2, -1, 1.6], [-0.8, 2.4, 1.1], [2.4, 2.8, 0.8], [-3.4, 1.2, 0.7]]],
      [24.5, 5, 2.4, 1.6, [[-0.6, -0.4, 0.7]]],
      [24, 16, 1.7, 1.4, []],
    ];
    const rows = [];
    for (let y = 0; y < H; y++) {
      let row = '';
      for (let x = 0; x < W; x++) {
        let on = false;
        for (const [cx, cy, r, len, holes] of bugs) {
          const dx = x + 0.5 - cx;
          const dy = y + 0.5 - cy;
          const d = Math.hypot(dx, dy);
          if (d < r) { on = !holes.some(([hx, hy, hr]) => Math.hypot(dx - hx, dy - hy) < hr); break; }
          for (let k = 0; k < 8 && !on; k++) {
            const a = (k * Math.PI) / 4;
            const ux = Math.cos(a);
            const uy = Math.sin(a);
            const along = dx * ux + dy * uy;
            if (along > r - 0.5 && along < r + len && Math.abs(dx * uy - dy * ux) < 0.55) on = true;
            if (Math.hypot(dx - ux * (r + len + 0.4), dy - uy * (r + len + 0.4)) < 0.95) on = true;
          }
          if (on) break;
        }
        row += on ? 'x' : '.';
      }
      rows.push(row);
    }
    return wide(rows);
  }
  const VIRUS_BIN = virusMask();
  // (tiny ones, for inside a bit: a skull, a padlock, a virus, an angry CPU)
  const MINIS = [
    ['.xxxxxx.', 'xxxxxxxx', 'x..xx..x', 'x..xx..x', 'xxx..xxx', '.xxxxxx.', '.x.xx.x.', '..xxxx..'],
    ['..xxxx..', '.x....x.', '.x....x.', 'xxxxxxxx', 'xxx..xxx', 'xxx..xxx', 'xxxx.xxx', 'xxxxxxxx'],
    ['x...x...x', '.x..x..x.', '..xxxxx..', '..x.xxx..', 'xxxxx.xxx', '..xxxxx..', '..xx.xx..', '.x..x..x.', 'x...x...x'],
    ['.x.x.x.x', 'xxxxxxxx', 'x..xx..x', 'xxxxxxxx', 'xx....xx', 'xxxxxxxx', '.x.x.x.x'],
  ].map(wide);
  // MOSAIC: one of the big pictures fitted to the whole board (CELL_W x CELL_H characters a bit),
  // kept to its shape, centred
  const CELL_W = 12;
  const CELL_H = 6;
  let mosaic = null;
  function mosaicPiece(r, c) {
    const cols = state.cols || 7;
    const rows = state.rows || 7; // (the playable rows: not the overflow row)
    if (!mosaic) {
      const pics = [SKULL_BIN, VIRUS_BIN, WARN_BIN]; // (the ones that read big, through the gaps between the bits)
      const art = pics[Math.floor(Math.random() * pics.length)];
      const W = cols * CELL_W;
      const H = rows * CELL_H;
      const k = Math.min(W / art[0].length, H / art.length); // (characters to characters: same shape)
      const w = Math.round(art[0].length * k);
      const h = Math.round(art.length * k);
      const x0 = Math.floor((W - w) / 2);
      const y0 = Math.floor((H - h) / 2);
      mosaic = Array.from({ length: H }, (_, y) => Array.from({ length: W }, (_, x) => {
        const sx = Math.floor((x - x0) / k);
        const sy = Math.floor((y - y0) / k);
        return x >= x0 && y >= y0 && sy < art.length && sx < art[0].length && art[sy][sx] !== '.';
      }));
    }
    if (r >= rows) return Array(CELL_H).fill('.'.repeat(CELL_W)).join('\n'); // (the overflow row: just the dots)
    const top = (rows - 1 - r) * CELL_H; // (row 0 is the bottom)
    const lines = [];
    for (let y = top; y < top + CELL_H; y++) {
      const row = mosaic[y] || [];
      lines.push(Array.from({ length: CELL_W }, (_, x) => (row[c * CELL_W + x] ? (Math.random() < 0.5 ? '0' : '1') : '.')).join('')); // (around it, dots: the picture's bright on them)
    }
    return lines.join('\n');
  }
  // (the pool, and what each is filled with: binary mostly, hex now and then)
  const ARTS = [SKULL_BIN, VIRUS_BIN, PADLOCK_BIN, BUG_BIN, WARN_BIN, CPU_BIN];
  const artHtml = (cls = '') => {
    const hex = Math.random() < 0.25;
    const art = ARTS[forced && forced.art !== undefined ? forced.art : Math.floor(Math.random() * ARTS.length)];
    return `<pre class="inf-bin ${cls}${art[0].length > 40 ? ' big' : ''}" data-set="${hex ? 'hex' : 'bin'}">${binFill(art, hex)}</pre>`;
  };
  const HEX = '0123456789ABCDEF';
  const digit = (hex) => (hex ? HEX[Math.floor(Math.random() * 16)] : Math.random() < 0.5 ? '0' : '1');
  const binFill = (mask, hex) => mask.map((r) => [...r].map((c) => (c === '.' ? ' ' : digit(hex))).join('')).join('\n');
  function binFlicker(pre) { // (a few digits change each tick)
    const hex = pre.dataset.set === 'hex';
    const t = [...pre.textContent];
    for (let i = 0; i < t.length / 12; i++) {
      const k = Math.floor(Math.random() * t.length);
      if (/[0-9A-F]/.test(t[k])) t[k] = digit(hex);
    }
    pre.textContent = t.join('');
  }
  const FILES = ['bits.dat', 'keys.bak', 'save.sav', 'cpu.ini', 'music.mp3', 'photos/', 'system32/'];
  function scareTick(win, scan) {
    const kind = scan.dataset.kind;
    let pct = win.pct || 0;
    if (kind === 'crash') { pct = Math.min(100, pct + (Math.random() < 0.3 ? 1 : 0)); scan.textContent = `${pct}% COMPLETE`; }
    else if (kind === 'delete') { pct = (pct + 1) % (FILES.length * 6); scan.textContent = `rm ${FILES[Math.floor(pct / 6)]} ... OK`; }
    else if (kind === 'wheel') {
      pct = (pct + 1) % 40;
      const wh = win.querySelector('.inf-wheel');
      if (wh) wh.textContent = pct < 30 ? WHEEL[pct % 3] : '[ 7 ][ 7 ][ 7 ]';
      scan.textContent = pct < 30 ? 'SPINNING...' : 'YOU WON! CLAIM NOW';
    } else {
      pct = Math.min(100, pct + 1 + Math.floor(Math.random() * 3));
      const n = Math.round(pct / 10);
      scan.textContent = `SCANNING [${'#'.repeat(n)}${'.'.repeat(10 - n)}] ${pct}%${pct >= 100 ? ' !!' : ''}`;
      if (pct >= 100 && Math.random() < 0.05) pct = 0;
      const sk = win.querySelector('.inf-skull');
      if (sk) sk.classList.toggle('lit', Math.floor(performance.now() / 400) % 2 === 0);
    }
    win.pct = pct;
    const bin = win.querySelector('.inf-bin');
    if (bin) binFlicker(bin);
  }
  // SCAREWARE's four alerts: the skull and its scan, a crash screen, files deleting, a prize wheel
  const SAD = [':(', '', 'YOUR DEVICE RAN INTO', 'A PROBLEM'];
  const WHEEL = ['[ $ ][ 7 ][ ? ]', '[ 7 ][ ? ][ $ ]', '[ ? ][ $ ][ 7 ]'];
  function scareBody(k, msg) {
    if (k === 1) return `<pre class="inf-skull inf-sad">${SAD.join('\n')}</pre><p class="inf-msg">${msg}</p><p class="inf-scan" data-kind="crash"></p>`;
    if (k === 2) return `${artHtml('inf-bin-alt')}<p class="inf-msg">${msg}</p><p class="inf-scan" data-kind="delete"></p>`;
    if (k === 3) return `<pre class="inf-skull inf-wheel">${WHEEL[0]}</pre><p class="inf-msg">${msg}</p><p class="inf-scan" data-kind="wheel"></p>`;
    return `${artHtml('inf-skull')}<p class="inf-msg">${msg}</p><p class="inf-scan"></p>`;
  }
  // While it runs (its drops counted by the game), the pop-ups come on their own clock, drop or no
  // drop: up to SCARE_MAX at once, each somewhere new in the grid, stacked over the last; never two
  // close together (SCARE_GAP after one appears, SCARE_AFTER_CLOSE after one's closed), and none while
  // the game's paused (canPop)
  const SCARE_MAX = 4;
  const SCARE_GAP = [6000, 11000]; // (ms: the wait after one appears, somewhere in this range)
  const SCARE_AFTER_CLOSE = 3000;
  const scareRun = { on: false, nextAt: 0, timer: 0, opts: {} };
  let scareZ = 0;
  const wins = () => (els.scare ? [...els.scare.querySelectorAll('.inf-win')] : []);
  const scareUp = () => wins().length > 0;
  function spot() { // (a fraction of the grid's free room, as far from the windows up as it can find)
    const taken = wins().map((w) => [w.fx, w.fy]);
    let best = null;
    for (let i = 0; i < 12; i++) {
      const p = [Math.random(), Math.random()];
      const d = taken.length ? Math.min(...taken.map(([x, y]) => Math.hypot(x - p[0], y - p[1]))) : 1;
      if (!best || d > best.d) best = { p, d };
    }
    return best.p;
  }
  function popWin() {
    if (wins().length >= SCARE_MAX) return false;
    const el = layer('scare', '');
    el.removeAttribute('aria-hidden');
    el.hidden = false;
    const k = pick('scare');
    const [title, msg, ok] = SCARES[Math.floor(Math.random() * SCARES.length)];
    const win = document.createElement('div');
    win.className = 'inf-win';
    win.setAttribute('role', 'alertdialog');
    win.setAttribute('aria-label', title);
    win.innerHTML = `<div class="inf-bar"><span>&#9888; ${title}</span><button type="button" class="inf-x" aria-label="Close">&times;</button></div>`
      + scareBody(k, msg)
      + `<button type="button" class="inf-ok">${ok}</button>`;
    [win.fx, win.fy] = spot();
    win.style.zIndex = ++scareZ;
    win.querySelector('.inf-x').addEventListener('click', (e) => { e.stopPropagation(); closeWin(win); });
    const okBtn = win.querySelector('.inf-ok');
    okBtn.addEventListener('click', (e) => { // (it does nothing: it dodges)
      e.stopPropagation();
      okBtn.style.transform = `translate(${Math.round((Math.random() - 0.5) * 60)}px, ${Math.round((Math.random() - 0.5) * 16)}px)`;
      if (typeof SFX !== 'undefined') SFX.play('denied');
    });
    win.addEventListener('pointerdown', (e) => { e.stopPropagation(); win.style.zIndex = ++scareZ; }); // (tapped: to the front)
    el.appendChild(win);
    scareRun.nextAt = performance.now() + SCARE_GAP[0] + Math.random() * (SCARE_GAP[1] - SCARE_GAP[0]);
    tickOn();
    place();
    if (scareRun.opts.onPop) scareRun.opts.onPop(wins().length);
    return true;
  }
  function closeWin(win) {
    if (!win || !win.isConnected) return;
    win.remove();
    if (!scareUp()) els.scare.hidden = true;
    scareRun.nextAt = Math.max(scareRun.nextAt, performance.now() + SCARE_AFTER_CLOSE);
    if (scareRun.opts.onClose) scareRun.opts.onClose(wins().length);
  }
  const closeScare = () => { const w = wins(); closeWin(w[w.length - 1]); }; // (the newest)
  // Each time, 1 pop-up (3 times in 4) or a burst of 2 to 4, never past SCARE_MAX on screen
  function burst() {
    const n = Math.min(Math.random() < 0.75 ? 1 : 2 + Math.floor(Math.random() * 3), SCARE_MAX - wins().length);
    if (n < 1) return;
    popWin();
    for (let i = 1; i < n; i++) setTimeout(() => { if (scareRun.on) popWin(); }, i * 160); // (one after another, quick)
  }
  function scareLoop() {
    if (!scareRun.on) { scareRun.timer = 0; return; }
    const now = performance.now();
    if (scareRun.opts.canPop && !scareRun.opts.canPop()) scareRun.nextAt = Math.max(scareRun.nextAt, now + 2000); // (paused: and a breath after)
    else if (now >= scareRun.nextAt) burst();
    scareRun.timer = setTimeout(scareLoop, 400);
  }
  // SCAREWARE struck (again, maybe): one pops up now, stacked over any up, and more come till scareEnd
  function scare(opts = {}) {
    scareRun.opts = opts;
    scareRun.on = true;
    burst();
    if (!scareRun.timer) scareRun.timer = setTimeout(scareLoop, 400);
  }
  function scareEnd() { // (its drops are up: no more come; the ones up stay till closed)
    scareRun.on = false;
    clearTimeout(scareRun.timer);
    scareRun.timer = 0;
  }

  // Lay the overlays over the bits (after each redraw of the board)
  function place(next = {}) {
    if (!wrap) return;
    state = { ...state, ...next };
    const ad = layer('ad', '<canvas></canvas><span class="inf-ad-tag">AD</span>');
    if (state.adCol !== null && state.adCol !== undefined) {
      if (ad.hidden) { pick('ad'); adClaims = []; }
      const top = boxOf(state.rows - 1, state.adCol);
      const bot = boxOf(0, state.adCol);
      if (top && bot) {
        const pad = 2;
        Object.assign(ad.style, { left: `${top.x - pad}px`, top: `${top.y - pad}px`, width: `${top.w + pad * 2}px`, height: `${bot.y + bot.h - top.y + pad * 2}px` });
        ad.hidden = false;
      }
    } else ad.hidden = true;
    const jack = layer('jack', '<canvas></canvas>');
    if (state.jack) {
      if (jack.hidden) pick('jack');
      const a = boxOf(state.maxRows - 1, 0);
      const b = boxOf(state.rows, state.cols - 1);
      if (a && b) {
        Object.assign(jack.style, { left: `${a.x}px`, top: `${a.y}px`, width: `${b.x + b.w - a.x}px`, height: `${b.y + b.h - a.y}px` });
        jack.hidden = false;
      }
    } else jack.hidden = true;
    if (els.scare && !els.scare.hidden) {
      const a = boxOf(state.rows - 1, 0);
      const b = boxOf(0, state.cols - 1);
      if (a && b) {
        const W = b.x + b.w - a.x;
        const H = b.y + b.h - a.y;
        Object.assign(els.scare.style, { left: `${a.x}px`, top: `${a.y}px`, width: `${W}px`, height: `${H}px` });
        for (const w of wins()) { // (each at its spot in the grid's free room)
          w.style.left = `${Math.round(Math.max(0, W - w.offsetWidth) * w.fx)}px`;
          w.style.top = `${Math.round(Math.max(0, H - w.offsetHeight) * w.fy)}px`;
        }
      }
    }
    if (document.querySelector('.inf-glitch, .inf-eyes')) tickOn();
    spin();
  }
  function init(boardEl, wrapEl) { board = boardEl; wrap = wrapEl; }
  function steal(n) { stolen = { n, at: performance.now() }; spin(); }
  function clear() {
    place({ adCol: null, jack: false });
    scareEnd();
    if (els.scare) { els.scare.innerHTML = ''; els.scare.hidden = true; }
  }
  return { init, place, steal, scare, scareEnd, closeScare, scareUp, scareCount: () => wins().length, ransomHtml, clear, pick, force: (f) => { forced = f; }, mosaicOn: () => style.malware === 4, glitch: (n = 3, r, c, empty = false) => (style.malware >= 4 && r !== undefined
    ? `<span class="inf-glitch ${style.malware === 4 ? 'mosaic' : 'mini'}${empty ? ' empty' : ''}" data-n="${n}" data-r="${r}" data-c="${c}">${corrupt(n, r, c)}</span>`
    : `<span class="inf-glitch" data-n="${n}">${corrupt(n)}</span>`), eyes: () => '<span class="inf-eyes">(o_o)</span>' };
})();
