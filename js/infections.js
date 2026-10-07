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
    // (the CPU at the top, a new face every second or so)
    const f = FACES[Math.floor(t * 0.9) % FACES.length];
    buf.sprite(face(f[0], f[1]), Math.round((W - 11) / 2), 2);
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
      buf.text(`+${stolen.n} MINE!`, 16, Math.round((H - 7) / 2));
      const cx = Math.round(W - 8 - k * (W - 22));
      buf.sprite(COIN, cx, Math.round((H - 5) / 2));
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
  const EYES_ASCII = ['(o_o)', '(o_o)', '(O_o)', '(o_O)', '(-_-)', '(o_o)', '(>_>)', '(<_<)'];
  let ticker = 0;
  function tick() {
    let any = false;
    document.querySelectorAll('.inf-glitch').forEach((g) => { any = true; g.textContent = junk(g.dataset.n ? +g.dataset.n : 3); });
    document.querySelectorAll('.inf-eyes').forEach((e) => { any = true; e.textContent = EYES_ASCII[Math.floor(performance.now() / 600) % EYES_ASCII.length]; });
    const scan = els.scare && !els.scare.hidden && els.scare.querySelector('.inf-scan');
    if (scan) { any = true; scareTick(scan); }
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
  const RANSOM_FACE = ledSvg(face('angry', 'grin'));
  const TERM = () => Array.from({ length: 4 }, () => `<span>${junk(5).replace(/[<>&]/g, '#')}</span>`).join('');
  function ransomHtml(val, left) {
    return `<span class="inf-screen"><span class="inf-face">${RANSOM_FACE}</span><span class="inf-term">${TERM()}</span></span>`
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
  const SKULL = [' .-"""-. ', '/  _ _  \\', '| (o)(o) |', ' \\  ^  / ', '  |vvv|  ', "  '---'  "];
  let scarePct = 0;
  function scareTick(scan) {
    scarePct = Math.min(100, scarePct + 1 + Math.floor(Math.random() * 3));
    const n = Math.round(scarePct / 10);
    scan.textContent = `SCANNING [${'#'.repeat(n)}${'.'.repeat(10 - n)}] ${scarePct}%${scarePct >= 100 ? ' !!' : ''}`;
    if (scarePct >= 100 && Math.random() < 0.05) scarePct = 0;
    const sk = els.scare.querySelector('.inf-skull');
    if (sk) sk.classList.toggle('lit', Math.floor(performance.now() / 400) % 2 === 0);
  }
  let scareDone = null;
  function scare(onClose) {
    const el = layer('scare', '');
    const [title, msg, ok] = SCARES[Math.floor(Math.random() * SCARES.length)];
    el.innerHTML = `<div class="inf-win" role="alertdialog" aria-label="${title}">`
      + `<div class="inf-bar"><span>&#9888; ${title}</span><button type="button" class="inf-x" aria-label="Close">&times;</button></div>`
      + `<pre class="inf-skull">${SKULL.join('\n').replace(/</g, '&lt;')}</pre>`
      + `<p class="inf-msg">${msg}</p><p class="inf-scan"></p>`
      + `<button type="button" class="inf-ok">${ok}</button></div>`;
    el.removeAttribute('aria-hidden');
    el.hidden = false;
    scarePct = 0;
    scareDone = onClose;
    el.querySelector('.inf-x').addEventListener('click', (e) => { e.stopPropagation(); closeScare(); });
    const okBtn = el.querySelector('.inf-ok');
    okBtn.addEventListener('click', (e) => { // (it does nothing: it dodges)
      e.stopPropagation();
      okBtn.style.transform = `translate(${Math.round((Math.random() - 0.5) * 60)}px, ${Math.round((Math.random() - 0.5) * 16)}px)`;
      if (typeof SFX !== 'undefined') SFX.play('denied');
    });
    el.addEventListener('pointerdown', (e) => e.stopPropagation());
    tickOn();
    place();
  }
  function closeScare() {
    if (!els.scare || els.scare.hidden) return;
    els.scare.hidden = true;
    const done = scareDone;
    scareDone = null;
    if (done) done();
  }
  const scareUp = () => !!(els.scare && !els.scare.hidden);

  // Lay the overlays over the bits (after each redraw of the board)
  function place(next = {}) {
    if (!wrap) return;
    state = { ...state, ...next };
    const ad = layer('ad', '<canvas></canvas><span class="inf-ad-tag">AD</span>');
    if (state.adCol !== null && state.adCol !== undefined) {
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
      if (a && b) Object.assign(els.scare.style, { left: `${a.x}px`, top: `${a.y}px`, width: `${b.x + b.w - a.x}px`, height: `${b.y + b.h - a.y}px` });
    }
    if (document.querySelector('.inf-glitch, .inf-eyes')) tickOn();
    spin();
  }
  function init(boardEl, wrapEl) { board = boardEl; wrap = wrapEl; }
  function steal(n) { stolen = { n, at: performance.now() }; spin(); }
  function clear() {
    place({ adCol: null, jack: false });
    if (els.scare) { els.scare.hidden = true; scareDone = null; }
  }
  return { init, place, steal, scare, closeScare, scareUp, ransomHtml, clear, glitch: (n = 3) => `<span class="inf-glitch" data-n="${n}">${junk(n)}</span>`, eyes: () => '<span class="inf-eyes">(o_o)</span>' };
})();
