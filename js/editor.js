// LAYOUT EDITOR (dev): turned on from SETTINGS' footer (EDIT LAYOUT) or with ?edit in the address.
// Tap any piece of the page to pick it, then change its text (size, spacing, line height, weight,
// alignment), its box (width, height, padding, hidden), its layout (gap, justify, align), where it
// sits (the space to the pieces beside it or its parent's edge, a nudge, its order in its row) as
// you watch. A change goes to THIS piece only or to ALL LIKE IT (the same kind of piece in the same
// part of the game). Edits are kept on this device (localStorage), always applied, even with the
// editor off, and EXPORT gives them as CSS to bake into css/style.css.
(() => {
  const KEY = 'bytefall-layout-edits';
  const ON_KEY = 'bytefall-layout-editor';
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
  };
  let edits = {};
  try { edits = JSON.parse(store.get(KEY)) || {}; } catch (e) {}
  // (the edits as a stylesheet, last in the page and !important, so they win over the game's own
  // rules and the sizes its scripts set)
  const sheet = document.createElement('style');
  sheet.id = 'layout-edits';
  document.head.appendChild(sheet);
  const cssOf = (important) => Object.entries(edits)
    .filter(([, p]) => Object.keys(p).length)
    .map(([sel, p]) => `${sel} { ${Object.entries(p).map(([k, v]) => `${k}: ${v}${important ? ' !important' : ''};`).join(' ')} }`)
    .join('\n');
  // LOCKED pieces: no dragging or editing them until they're unlocked (kept on the device)
  const LOCK_KEY = 'bytefall-layout-locks';
  let locks = [];
  try { locks = JSON.parse(store.get(LOCK_KEY)) || []; } catch (e) {}
  const saveLocks = () => store.set(LOCK_KEY, JSON.stringify(locks));
  let showEdits = true;
  const writeSheet = () => { sheet.textContent = showEdits ? cssOf(true) : ''; };
  const save = () => { store.set(KEY, JSON.stringify(edits)); writeSheet(); };
  writeSheet();

  let built = false;
  // SETTINGS' footer: EDIT LAYOUT turns it on (and closes SETTINGS, to the game under it)
  const openBtn = document.getElementById('edit-layout-btn');
  if (openBtn) openBtn.addEventListener('click', () => { if (typeof setSettingsOpen === 'function') setSettingsOpen(false); window.LayoutEditor.open(); });
  window.LayoutEditor = { open: () => { store.set(ON_KEY, 'on'); build(); ui.hidden = false; } };

  let ui; let overlay; let picked = null; let scope = 'this'; let selecting = true; let undo = [];

  // Classes that come and go with a piece's state, left out of the selectors an edit is saved under
  const STATE = /^(active|on|off|hidden|locked|unlocked|short|afford|done|danger|armed|ready|held|equipped|owned|flash|pulse|more|closing|current|next|selected|open|paused|shown|lit|has-drop|wrap|on-board|leveled|maxed|warn|alarm|byte|ref-font|scrambling|dev-holding|ed-drag|is-.*)$/;
  const stable = (el) => [...el.classList].filter((c) => !STATE.test(c));
  const esc = (s) => (window.CSS && CSS.escape ? CSS.escape(s) : s);
  // THIS: a path that finds just this piece (from the nearest piece with an id)
  function pathOf(el) {
    if (el.id) return `#${esc(el.id)}`;
    const parts = [];
    let cur = el;
    while (cur && cur !== document.body && cur !== document.documentElement) {
      if (cur.id) { parts.unshift(`#${esc(cur.id)}`); break; }
      const c = stable(cur)[0];
      const i = [...cur.parentElement.children].indexOf(cur) + 1;
      parts.unshift(`${cur.tagName.toLowerCase()}${c ? `.${esc(c)}` : ''}:nth-child(${i})`);
      cur = cur.parentElement;
    }
    return parts.join(' > ');
  }
  // ALL LIKE IT: its kind (its classes, or its parent's and its tag) in the same part of the game
  function kindOf(el) {
    const ctxEl = el.parentElement && el.parentElement.closest('[id]');
    const ctx = ctxEl && ctxEl !== document.body ? `#${esc(ctxEl.id)} ` : '';
    const cls = stable(el);
    const tag = el.tagName.toLowerCase();
    if (cls.length) return `${ctx}${tag}.${cls.map(esc).join('.')}`;
    const pc = el.parentElement ? stable(el.parentElement) : [];
    if (pc.length) return `${ctx}.${pc.map(esc).join('.')} > ${tag}`;
    return pathOf(el);
  }
  const isLocked = (el) => !!el && locks.includes(pathOf(el));
  const selOf = (el) => (scope === 'all' ? kindOf(el) : pathOf(el));
  const count = (sel) => { try { return document.querySelectorAll(sel).length; } catch (e) { return 0; } };

  const snapshot = () => { undo.push(JSON.stringify(edits)); if (undo.length > 60) undo.shift(); };
  function setProp(prop, value, el = picked, sel = selOf(el)) {
    if (isLocked(el)) return;
    snapshot();
    (edits[sel] = edits[sel] || {})[prop] = value;
    save();
    refresh();
  }
  function clearProp(prop, sel = selOf(picked)) {
    if (isLocked(picked) || !edits[sel] || !(prop in edits[sel])) return;
    snapshot();
    delete edits[sel][prop];
    if (prop === 'z-index') delete edits[sel].position;
    if (!Object.keys(edits[sel]).length) delete edits[sel];
    save();
    refresh();
  }

  // The space between a piece and what's beside it: the nearest piece in its parent on that side
  // (overlapping it across), else its parent's inside edge
  const shown = (el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden'; };
  function gap(el, side) {
    const r = el.getBoundingClientRect();
    const sibs = el.parentElement ? [...el.parentElement.children].filter((s) => s !== el && shown(s) && !s.closest('.ed-ui')) : [];
    const across = (q) => (side === 'top' || side === 'bottom' ? q.right > r.left + 1 && q.left < r.right - 1 : q.bottom > r.top + 1 && q.top < r.bottom - 1);
    let best = null;
    for (const s of sibs) {
      const q = s.getBoundingClientRect();
      if (!across(q)) continue;
      const d = side === 'top' ? r.top - q.bottom : side === 'bottom' ? q.top - r.bottom : side === 'left' ? r.left - q.right : q.left - r.right;
      if (d >= -1 && (!best || d < best.d)) best = { d, q, to: 'piece' };
    }
    if (best) return best;
    const p = el.parentElement;
    if (!p) return { d: 0, to: 'edge' };
    const q = p.getBoundingClientRect();
    const pcs = getComputedStyle(p);
    const b = (s) => parseFloat(pcs[`border${s}Width`]) || 0;
    const d = side === 'top' ? r.top - (q.top + b('Top')) : side === 'bottom' ? (q.bottom - b('Bottom')) - r.bottom
      : side === 'left' ? r.left - (q.left + b('Left')) : (q.right - b('Right')) - r.right;
    return { d, q, to: 'edge' };
  }
  function setGap(side, want) {
    const g = gap(picked, side);
    const prop = `margin-${side}`;
    const m = parseFloat(getComputedStyle(picked)[`margin${side[0].toUpperCase()}${side.slice(1)}`]) || 0;
    setProp(prop, `${round(m + want - g.d)}px`);
  }
  const round = (v) => Math.round(v * 2) / 2;

  // ORDER: earlier or later in its row or column (a flex or grid parent), every piece in it numbered
  function move(dir) {
    const p = picked.parentElement;
    if (!p || !/flex|grid/.test(getComputedStyle(p).display)) return;
    const kids = [...p.children].filter((k) => !k.closest('.ed-ui'));
    const sorted = kids.map((k, i) => ({ k, o: parseFloat(getComputedStyle(k).order) || 0, i })).sort((a, b) => a.o - b.o || a.i - b.i).map((x) => x.k);
    const at = sorted.indexOf(picked);
    const to = at + dir;
    if (to < 0 || to >= sorted.length) return;
    [sorted[at], sorted[to]] = [sorted[to], sorted[at]];
    snapshot();
    sorted.forEach((k, i) => { const sel = pathOf(k); (edits[sel] = edits[sel] || {}).order = String(i); });
    save();
    refresh();
  }

  // ---- the inspector ----
  const FIELDS = [
    { h: 'TEXT' },
    { prop: 'font-size', label: 'SIZE', step: 0.5 },
    { prop: 'letter-spacing', label: 'SPACING', step: 0.5 },
    { prop: 'line-height', label: 'LINE', step: 1 },
    { prop: 'font-weight', label: 'WEIGHT', choices: [['400', 'NORMAL'], ['700', 'BOLD']] },
    { prop: 'text-align', label: 'ALIGN', choices: [['left', 'LEFT'], ['center', 'CENTER'], ['right', 'RIGHT']] },
    { h: 'BOX' },
    { prop: 'width', label: 'WIDTH', step: 1, auto: true },
    { prop: 'height', label: 'HEIGHT', step: 1, auto: true },
    { prop: 'padding-top', label: 'PAD TOP', step: 1 },
    { prop: 'padding-bottom', label: 'PAD BOTTOM', step: 1 },
    { prop: 'padding-left', label: 'PAD LEFT', step: 1 },
    { prop: 'padding-right', label: 'PAD RIGHT', step: 1 },
    { prop: 'display', label: 'SHOW', choices: [['', 'SHOWN'], ['none', 'HIDDEN']] },
    { h: 'SPACE TO WHAT\'S BESIDE IT' },
    { gap: 'top', label: 'ABOVE' },
    { gap: 'bottom', label: 'BELOW' },
    { gap: 'left', label: 'LEFT' },
    { gap: 'right', label: 'RIGHT' },
    { h: 'MOVE' },
    { nudge: 0, label: 'NUDGE X' },
    { nudge: 1, label: 'NUDGE Y' },
    { order: true, label: 'ORDER' },
    { h: 'LAYER (WHAT\'S IN FRONT)' },
    { prop: 'z-index', label: 'LAYER', step: 1, plain: true },
    { prop: 'overflow', label: 'OVERFLOW', choices: [['visible', 'SHOW ALL'], ['hidden', 'CUT OFF'], ['auto', 'SCROLL']] },
    { h: 'ITS CONTENTS (A ROW OR COLUMN)' },
    { prop: 'gap', label: 'GAP', step: 1 },
    { prop: 'justify-content', label: 'JUSTIFY', choices: [['flex-start', 'START'], ['center', 'CENTER'], ['flex-end', 'END'], ['space-between', 'SPREAD']] },
    { prop: 'align-items', label: 'ALIGN', choices: [['flex-start', 'START'], ['center', 'CENTER'], ['flex-end', 'END'], ['stretch', 'FILL']] },
  ];

  // WHERE THE PANEL SITS: docked at the foot or the top (its height dragged by its grip), or floating
  // (moved by its grip, sized by its corner); kept on the device
  const GEO_KEY = 'bytefall-layout-editor-panel';
  const MIN_H = 90;
  const MIN_W = 230;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  let geo = { place: 'bottom', h: Math.round(innerHeight * 0.42), x: 12, y: 70, w: Math.min(380, innerWidth - 24), fh: Math.round(innerHeight * 0.5) };
  try { geo = { ...geo, ...JSON.parse(store.get(GEO_KEY)) }; } catch (e) {}
  const saveGeo = () => store.set(GEO_KEY, JSON.stringify(geo));
  function applyGeo() {
    if (!ui) return;
    const float = geo.place === 'float';
    ui.classList.toggle('top', geo.place === 'top');
    ui.classList.toggle('float', float);
    geo.h = clamp(geo.h, MIN_H, innerHeight - 20);
    if (float) {
      geo.w = clamp(geo.w, MIN_W, innerWidth);
      geo.x = clamp(geo.x, 0, Math.max(0, innerWidth - 80));
      geo.y = clamp(geo.y, 0, Math.max(0, innerHeight - 40));
      geo.fh = clamp(geo.fh, MIN_H, Math.max(MIN_H, innerHeight - geo.y));
      Object.assign(ui.style, { left: `${geo.x}px`, top: `${geo.y}px`, width: `${geo.w}px`, height: `${geo.fh}px`, right: 'auto', bottom: 'auto' });
    } else {
      Object.assign(ui.style, { left: '', top: '', width: '', right: '', bottom: '', height: `${geo.h}px` });
    }
    const b = ui.querySelector('[data-ed="dock"]');
    if (b) b.textContent = { bottom: '▁ FOOT', top: '▔ TOP', float: '❐ FLOAT' }[geo.place];
  }
  // A drag on a grip: fn(the panel's box when it started, dx, dy), then the place is kept
  function drag(handle, fn) {
    handle.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      handle.setPointerCapture(e.pointerId);
      const x0 = e.clientX;
      const y0 = e.clientY;
      const r = ui.getBoundingClientRect();
      const move = (ev) => { fn(r, ev.clientX - x0, ev.clientY - y0); applyGeo(); };
      const end = () => {
        handle.removeEventListener('pointermove', move);
        handle.removeEventListener('pointerup', end);
        handle.removeEventListener('pointercancel', end);
        saveGeo();
      };
      handle.addEventListener('pointermove', move);
      handle.addEventListener('pointerup', end);
      handle.addEventListener('pointercancel', end);
    });
  }

  function build() {
    if (built) return;
    built = true;
    const css = document.createElement('style');
    css.textContent = `
.ed-ui, .ed-ui * { box-sizing: border-box; font-family: var(--font, monospace); }
.ed-panel { position: fixed; left: 0; right: 0; bottom: 0; z-index: 100000; height: 42vh; display: flex; flex-direction: column;
  background: var(--bg-solid, #000); color: var(--fg, #3f8); border-top: 2px solid var(--accent, #fd6); font-size: 12px; letter-spacing: 0.5px; }
.ed-panel.top { bottom: auto; top: 0; border-top: 0; border-bottom: 2px solid var(--accent, #fd6); }
.ed-panel[hidden] { display: none; }
.ed-panel.min .ed-body { display: none; }
.ed-panel.min { height: auto !important; }
.ed-panel.float { border: 2px solid var(--accent, #fd6); border-radius: 8px; box-shadow: 0 8px 28px rgba(0, 0, 0, 0.7); }
.ed-grip { flex: none; height: 20px; display: flex; align-items: center; justify-content: center; gap: 8px; touch-action: none; cursor: ns-resize; user-select: none; -webkit-user-select: none; }
.ed-grip::before { content: ''; width: 48px; height: 4px; border-radius: 2px; background: var(--accent, #fd6); opacity: 0.75; }
.ed-panel.top .ed-grip { order: 99; }
.ed-panel.float .ed-grip { cursor: move; border-bottom: 1px dashed rgba(var(--accent-rgb, 255,209,102), 0.5); }
.ed-panel.float .ed-grip::after { content: 'DRAG TO MOVE'; color: var(--fg-dim, #888); font-size: 9px; letter-spacing: 1px; }
.ed-panel.min:not(.float) .ed-grip { display: none; }
.ed-corner { display: none; position: absolute; right: 0; bottom: 0; width: 26px; height: 26px; touch-action: none; cursor: nwse-resize; border-bottom-right-radius: 6px;
  background: linear-gradient(135deg, transparent 0 55%, var(--accent, #fd6) 55% 62%, transparent 62% 72%, var(--accent, #fd6) 72% 79%, transparent 79%); }
.ed-panel.float:not(.min) .ed-corner { display: block; }
.ed-panel.min .ed-head button:not([data-ed="mode"]):not([data-ed="exit"]):not([data-ed="dock"]):not([data-ed="min"]) { display: none; }
.ed-head { display: flex; flex-wrap: wrap; gap: 4px; padding: 6px; border-bottom: 1px dashed rgba(var(--accent-rgb, 255,209,102), 0.5); }
.ed-sel { width: 100%; color: var(--accent, #fd6); font-size: 11px; overflow-wrap: anywhere; }
.ed-sel small { color: var(--fg-dim, #888); }
.ed-body { flex: 1 1 auto; min-height: 0; overflow-y: auto; padding: 4px 6px 10px; overscroll-behavior: contain; }
.ed-ui button { min-height: 30px; padding: 0 8px; background: transparent; border: 1px solid var(--fg-dim, #555); border-radius: 4px; color: var(--fg, #3f8); font-size: 11px; letter-spacing: 0.5px; cursor: pointer; }
.ed-ui button.on { border-color: var(--accent, #fd6); color: var(--accent, #fd6); }
.ed-h { margin: 10px 0 4px; color: var(--accent, #fd6); font-size: 11px; letter-spacing: 2px; }
.ed-row { display: flex; align-items: center; gap: 4px; margin: 3px 0; }
.ed-l { flex: 0 0 86px; color: var(--fg-dim, #888); font-size: 11px; }
.ed-row input { width: 64px; min-height: 30px; padding: 0 4px; background: transparent; border: 1px solid var(--grid-line, #333); border-radius: 4px; color: var(--fg, #3f8); font-size: 13px; text-align: center; }
.ed-row .ed-u { color: var(--fg-dim, #888); font-size: 10px; min-width: 52px; }
.ed-row button.ed-x { margin-left: auto; min-width: 30px; padding: 0; color: var(--fg-dim, #888); }
.ed-row button.ed-x.set { color: var(--accent, #fd6); border-color: var(--accent, #fd6); }
.ed-row .ed-c { display: flex; flex-wrap: wrap; gap: 4px; flex: 1; }
.ed-list { margin: 4px 0; font-size: 11px; }
.ed-list div { display: flex; align-items: center; gap: 6px; padding: 3px 0; border-bottom: 1px dashed var(--grid-line, #333); overflow-wrap: anywhere; }
.ed-list span { flex: 1; }
.ed-export { width: 100%; height: 120px; margin-top: 6px; background: transparent; border: 1px solid var(--grid-line, #333); color: var(--fg, #3f8); font-size: 10px; }
.ed-box.locked { border-color: #9aa; border-style: dashed; }
.ed-tag.locked { background: #9aa; }
.ed-drag { touch-action: none !important; cursor: grab; }
.ed-overlay { position: fixed; inset: 0; z-index: 99999; pointer-events: none; }
.ed-box { position: fixed; border: 2px solid var(--accent, #fd6); box-shadow: 0 0 0 1px #000; }
.ed-parent { position: fixed; border: 1px dashed rgba(var(--fg-rgb, 57,255,143), 0.7); }
.ed-tag { position: fixed; padding: 1px 4px; background: var(--accent, #fd6); color: #000; font: bold 10px var(--font, monospace); white-space: nowrap; }
.ed-line { position: fixed; background: #ff4fd8; }
.ed-gap { position: fixed; padding: 0 3px; background: #ff4fd8; color: #000; font: bold 10px var(--font, monospace); white-space: nowrap; transform: translate(-50%, -50%); }
`;
    document.head.appendChild(css);

    overlay = document.createElement('div');
    overlay.className = 'ed-ui ed-overlay';
    document.body.appendChild(overlay);


    ui = document.createElement('div');
    ui.className = 'ed-ui ed-panel';
    ui.innerHTML = `
      <div class="ed-grip" title="Drag to size it (docked) or move it (floating)"></div>
      <div class="ed-head">
        <div class="ed-sel" id="ed-sel">TAP ANY PIECE OF THE GAME TO PICK IT</div>
        <button type="button" data-ed="mode" class="on">PICKING</button>
        <button type="button" data-ed="parent">▲ PARENT</button>
        <button type="button" data-ed="child">▼ INSIDE</button>
        <button type="button" data-ed="this" class="on">THIS ONE</button>
        <button type="button" data-ed="all">ALL LIKE IT</button>
        <button type="button" data-ed="lock">LOCK</button>
        <button type="button" data-ed="clear">CLEAR</button>
        <button type="button" data-ed="undo">UNDO</button>
        <button type="button" data-ed="min">—</button>
        <button type="button" data-ed="dock">▁ FOOT</button>
        <button type="button" data-ed="exit">✕</button>
      </div>
      <div class="ed-body" id="ed-body"></div>
      <div class="ed-corner" title="Drag to size it"></div>`;
    document.body.appendChild(ui);
    applyGeo();
    // Docked, the grip on its inner edge drags its height; floating, it moves it, and the corner sizes it
    drag(ui.querySelector('.ed-grip'), (r, dx, dy) => {
      if (geo.place === 'float') { geo.x = clamp(r.left + dx, 0, innerWidth - 80); geo.y = clamp(r.top + dy, 0, innerHeight - 40); }
      else geo.h = clamp(r.height + (geo.place === 'bottom' ? -dy : dy), MIN_H, innerHeight - 20);
    });
    drag(ui.querySelector('.ed-corner'), (r, dx, dy) => {
      geo.w = clamp(r.width + dx, MIN_W, innerWidth - geo.x);
      geo.fh = clamp(r.height + dy, MIN_H, innerHeight - geo.y);
    });
    window.addEventListener('resize', () => applyGeo());
    ui.querySelector('.ed-head').addEventListener('click', onHead);
    ui.querySelector('#ed-body').addEventListener('click', onBody);
    ui.querySelector('#ed-body').addEventListener('change', onInput);

    // PICKING: a tap picks what's under it instead of pressing it (the game never sees it). The
    // editor's own buttons work as usual, and so do the game's while USING
    // DRAGGING: the picked piece (unless LOCKED) follows a finger or the mouse, as a nudge, the space
    // to what's beside it shown as it goes; a tap still picks
    let dragging = null;
    let noClick = false;
    let down = null;
    const swallow = (e) => {
      if (!selecting || ui.hidden || e.target.closest('.ed-ui')) return;
      e.stopImmediatePropagation();
      if (!e.type.startsWith('touch')) e.preventDefault(); // (touches still scroll, and still make the tap's click)
      if (e.type === 'pointerdown') down = [e.clientX, e.clientY];
      if (e.type === 'pointerdown' && picked && picked.contains(e.target) && !isLocked(picked)) {
        dragging = { id: e.pointerId, x0: e.clientX, y0: e.clientY, n: nudgeOf(), moved: false, sel: selOf(picked) };
      }
      if (e.type === 'pointermove' && dragging && e.pointerId === dragging.id) {
        const dx = Math.round(e.clientX - dragging.x0);
        const dy = Math.round(e.clientY - dragging.y0);
        if (!dragging.moved && Math.abs(dx) + Math.abs(dy) < 5) return;
        if (!dragging.moved) { dragging.moved = true; snapshot(); }
        (edits[dragging.sel] = edits[dragging.sel] || {}).translate = `${dragging.n[0] + dx}px ${dragging.n[1] + dy}px`;
        writeSheet();
        drawOverlay();
      }
      if ((e.type === 'pointerup' || e.type === 'pointercancel') && dragging && e.pointerId === dragging.id) {
        if (dragging.moved) { save(); noClick = true; refresh(); }
        dragging = null;
      }
      if (e.type === 'click') {
        if (noClick) { noClick = false; return; } // (the end of a drag, not a tap)
        if (down && Math.abs(e.clientX - down[0]) + Math.abs(e.clientY - down[1]) > 8) return; // (nor any other drag)
        pick(e.target);
      }
    };
    for (const t of ['pointerdown', 'pointermove', 'pointerup', 'pointercancel', 'mousedown', 'mouseup', 'touchstart', 'touchend', 'click', 'dblclick', 'contextmenu']) window.addEventListener(t, swallow, { capture: true, passive: false });
    // (typing in the editor doesn't drop bits or pause the game)
    window.addEventListener('keydown', (e) => { if (e.target.closest && e.target.closest('.ed-ui')) e.stopImmediatePropagation(); }, true);
    setInterval(() => { if (!ui.hidden) drawOverlay(); }, 120); // (the outlines follow a scroll or an animation)
    renderBody();
  }

  function pick(t) {
    let el = t;
    while (el && (el instanceof SVGElement)) el = el.parentElement; // (an icon's drawing: its holder)
    if (!el || el === document.body || el === document.documentElement) return;
    if (picked) picked.classList.remove('ed-drag');
    picked = el;
    picked.classList.add('ed-drag'); // (a finger drags it instead of scrolling the page)
    // (the panel out of its way: at the top for a piece low on the screen, at the foot for one high up)
    const r = el.getBoundingClientRect();
    if (geo.place !== 'float') { geo.place = r.top + r.height / 2 > innerHeight / 2 ? 'top' : 'bottom'; applyGeo(); }
    ui.classList.remove('min');
    ui.querySelector('[data-ed="min"]').textContent = '—';
    renderBody();
  }

  function onHead(e) {
    const b = e.target.closest('button');
    if (!b) return;
    const a = b.dataset.ed;
    if (a === 'mode') { selecting = !selecting; b.classList.toggle('on', selecting); b.textContent = selecting ? 'PICKING' : 'USING THE GAME'; }
    if (a === 'parent' && picked && picked.parentElement && picked.parentElement !== document.body) { picked = picked.parentElement; renderBody(); }
    if (a === 'child' && picked) { const c = [...picked.children].find((k) => shown(k) && !(k instanceof SVGElement)); if (c) { picked = c; renderBody(); } }
    if (a === 'this' || a === 'all') {
      scope = a;
      ui.querySelector('[data-ed="this"]').classList.toggle('on', scope === 'this');
      ui.querySelector('[data-ed="all"]').classList.toggle('on', scope === 'all');
      renderBody();
    }
    if (a === 'clear' && picked) { picked.classList.remove('ed-drag'); picked = null; renderBody(); drawOverlay(); } // (nothing picked)
    if (a === 'lock' && picked) {
      const p = pathOf(picked);
      locks = locks.includes(p) ? locks.filter((x) => x !== p) : [...locks, p];
      saveLocks();
      renderBody();
    }
    if (a === 'undo' && undo.length) { edits = JSON.parse(undo.pop()); save(); refresh(); }
    if (a === 'dock') { geo.place = { bottom: 'top', top: 'float', float: 'bottom' }[geo.place]; applyGeo(); saveGeo(); } // (FOOT, TOP, FLOAT in turn)
    if (a === 'min') { ui.classList.toggle('min'); b.textContent = ui.classList.contains('min') ? '+' : '—'; } // (one line; picking goes on)
    if (a === 'exit') { store.set(ON_KEY, 'off'); ui.hidden = true; picked = null; overlay.innerHTML = ''; }
  }

  // A number: px, but LAYER a plain number, and a piece laid out in place gets position: relative
  // (a layer only takes in a positioned piece, or one in a row or column)
  function setNum(prop, v) {
    if (prop !== 'z-index') { setProp(prop, `${v}px`); return; }
    const sel = selOf(picked);
    snapshot();
    const e = (edits[sel] = edits[sel] || {});
    e['z-index'] = String(Math.round(v));
    if (getComputedStyle(picked).position === 'static' && !e.position) e.position = 'relative';
    save();
    refresh();
  }
  const fmt = (v) => (Number.isFinite(v) ? String(round(v)) : '');
  function current(prop) {
    const cs = getComputedStyle(picked);
    if (prop === 'line-height') return cs.lineHeight === 'normal' ? NaN : parseFloat(cs.lineHeight);
    if (prop === 'letter-spacing') return cs.letterSpacing === 'normal' ? 0 : parseFloat(cs.letterSpacing);
    if (prop === 'gap') return parseFloat(cs.rowGap) || parseFloat(cs.columnGap) || 0;
    if (prop === 'z-index') return cs.zIndex === 'auto' ? 0 : parseFloat(cs.zIndex);
    return parseFloat(cs.getPropertyValue(prop));
  }
  const nudgeOf = () => {
    const t = getComputedStyle(picked).translate;
    if (!t || t === 'none') return [0, 0];
    const [x, y] = t.split(' ').map(parseFloat);
    return [x || 0, y || 0];
  };
  const isSet = (prop) => { const e = edits[selOf(picked)]; return !!(e && prop in e); };

  function renderBody() {
    const body = ui.querySelector('#ed-body');
    const head = ui.querySelector('#ed-sel');
    if (!picked) {
      head.textContent = 'TAP ANY PIECE OF THE GAME TO PICK IT';
      body.innerHTML = editedList();
      return;
    }
    const sel = selOf(picked);
    const r = picked.getBoundingClientRect();
    const lockBtn = ui.querySelector('[data-ed="lock"]');
    lockBtn.textContent = isLocked(picked) ? 'UNLOCK' : 'LOCK';
    lockBtn.classList.toggle('on', isLocked(picked));
    if (isLocked(picked)) {
      head.innerHTML = `${pathOf(picked).replace(/</g, '&lt;')} <small>// LOCKED // ${Math.round(r.width)} \u00d7 ${Math.round(r.height)}</small>`;
      body.innerHTML = `<div class="ed-h">LOCKED</div><div class="ed-row"><span class="ed-u">This piece stays as it is: no dragging or editing it. UNLOCK (above) to change it again; ▲ PARENT and ▼ INSIDE still pick around it.</span></div>${editedList()}`;
      return;
    }
    head.innerHTML = `${sel.replace(/</g, '&lt;')} <small>// ${count(sel)} ${scope === 'all' ? 'LIKE IT' : 'PIECE'} // ${Math.round(r.width)} × ${Math.round(r.height)}</small>`;
    let h = '';
    const flexParent = picked.parentElement && /flex|grid/.test(getComputedStyle(picked.parentElement).display);
    for (const f of FIELDS) {
      if (f.h) { h += `<div class="ed-h">${f.h}</div>`; continue; }
      if (f.choices) {
        const cv = getComputedStyle(picked).getPropertyValue(f.prop);
        h += `<div class="ed-row"><span class="ed-l">${f.label}</span><span class="ed-c">${f.choices.map(([v, l]) => `<button type="button" data-set="${f.prop}" data-v="${v}" class="${(v === '' ? cv !== 'none' : cv === v || (f.prop === 'font-weight' && v === '700' && parseFloat(cv) >= 600) || (f.prop === 'justify-content' && cv === v.replace('flex-', '')) || (f.prop === 'align-items' && cv === v.replace('flex-', ''))) ? 'on' : ''}">${l}</button>`).join('')}</span><button type="button" class="ed-x${isSet(f.prop) ? ' set' : ''}" data-clear="${f.prop}" title="Back to the game's own">↺</button></div>`;
        continue;
      }
      if (f.gap) {
        const g = gap(picked, f.gap);
        h += `<div class="ed-row"><span class="ed-l">${f.label}</span><button type="button" data-gap="${f.gap}" data-d="-1">−</button><input type="number" inputmode="decimal" step="1" data-gapin="${f.gap}" value="${fmt(g.d)}"><button type="button" data-gap="${f.gap}" data-d="1">+</button><span class="ed-u">PX TO ${g.to === 'edge' ? 'PARENT EDGE' : 'NEXT PIECE'}</span><button type="button" class="ed-x${isSet(`margin-${f.gap}`) ? ' set' : ''}" data-clear="margin-${f.gap}" title="Back to the game's own">↺</button></div>`;
        continue;
      }
      if (f.nudge !== undefined) {
        const n = nudgeOf()[f.nudge];
        h += `<div class="ed-row"><span class="ed-l">${f.label}</span><button type="button" data-nudge="${f.nudge}" data-d="-1">−</button><input type="number" inputmode="decimal" step="1" data-nudgein="${f.nudge}" value="${fmt(n)}"><button type="button" data-nudge="${f.nudge}" data-d="1">+</button><span class="ed-u">PX</span><button type="button" class="ed-x${isSet('translate') ? ' set' : ''}" data-clear="translate" title="Back to the game's own">↺</button></div>`;
        continue;
      }
      if (f.order) {
        h += `<div class="ed-row"><span class="ed-l">${f.label}</span>${flexParent ? '<button type="button" data-move="-1">◀ EARLIER</button><button type="button" data-move="1">LATER ▶</button>' : '<span class="ed-u">ONLY IN A ROW OR COLUMN</span>'}<button type="button" class="ed-x${isSet('order') ? ' set' : ''}" data-clear="order" title="Back to the game's own">↺</button></div>`;
        continue;
      }
      const v = current(f.prop);
      h += `<div class="ed-row"><span class="ed-l">${f.label}</span><button type="button" data-step="${f.prop}" data-d="-${f.step}">−</button><input type="number" inputmode="decimal" step="${f.step}" data-prop="${f.prop}" value="${fmt(v)}"><button type="button" data-step="${f.prop}" data-d="${f.step}">+</button><span class="ed-u">${f.plain ? 'HIGHER IS IN FRONT' : 'PX'}${f.auto ? ' <button type="button" data-auto="' + f.prop + '">AUTO</button>' : ''}</span><button type="button" class="ed-x${isSet(f.prop) ? ' set' : ''}" data-clear="${f.prop}" title="Back to the game's own">↺</button></div>`;
      if (f.prop === 'z-index') h += `<div class="ed-row"><span class="ed-u">A GLOW CUT OFF: pick the piece around it (▲ PARENT) and set OVERFLOW to SHOW ALL, or raise the glowing piece's LAYER. Something covering a button: raise the button's LAYER, or lower what covers it.</span></div>`;
    }
    body.innerHTML = h + editedList();
  }

  function editedList() {
    const rows = Object.entries(edits).map(([sel, p]) => `<div><span>${sel.replace(/</g, '&lt;')} <small>{ ${Object.entries(p).map(([k, v]) => `${k}: ${v}`).join('; ')} }</small></span><button type="button" data-pick="${encodeURIComponent(sel)}">PICK</button><button type="button" data-drop="${encodeURIComponent(sel)}">✕</button></div>`).join('');
    return `<div class="ed-h">YOUR EDITS (${Object.keys(edits).length}) // KEPT ON THIS DEVICE</div>
      <div class="ed-list">${rows || '<div><span>None yet.</span></div>'}</div>
      <div class="ed-row"><button type="button" data-ed2="compare">${showEdits ? 'SHOWING EDITS' : 'SHOWING THE ORIGINAL'}</button><button type="button" data-ed2="export">EXPORT CSS</button><button type="button" data-ed2="reset">RESET ALL</button></div>
      <textarea class="ed-export" id="ed-export" readonly hidden></textarea>`;
  }

  function onBody(e) {
    const b = e.target.closest('button');
    if (!b) return;
    const d = parseFloat(b.dataset.d);
    if (b.dataset.step) { const v = current(b.dataset.step); setNum(b.dataset.step, round((Number.isFinite(v) ? v : 0) + d)); }
    if (b.dataset.auto) setProp(b.dataset.auto, 'auto');
    if (b.dataset.set) { if (b.dataset.v === '' && b.dataset.set === 'display') clearProp('display'); else setProp(b.dataset.set, b.dataset.v); }
    if (b.dataset.clear) clearProp(b.dataset.clear);
    if (b.dataset.gap) setGap(b.dataset.gap, round(gap(picked, b.dataset.gap).d + d));
    if (b.dataset.nudge !== undefined) { const n = nudgeOf(); n[+b.dataset.nudge] += d; setProp('translate', `${n[0]}px ${n[1]}px`); }
    if (b.dataset.move) move(+b.dataset.move);
    if (b.dataset.pick) { const el = document.querySelector(decodeURIComponent(b.dataset.pick)); if (el) { picked = el; renderBody(); } }
    if (b.dataset.drop) { snapshot(); delete edits[decodeURIComponent(b.dataset.drop)]; save(); refresh(); }
    const a = b.dataset.ed2;
    if (a === 'compare') { showEdits = !showEdits; writeSheet(); refresh(); }
    if (a === 'export') {
      const text = `/* LAYOUT EDITS (the in-game editor, ${new Date().toISOString().slice(0, 10)}) */\n${cssOf(false)}\n`;
      const ta = ui.querySelector('#ed-export');
      ta.hidden = false;
      ta.value = text;
      ta.select();
      const done = () => { b.textContent = 'COPIED ✓'; setTimeout(() => { b.textContent = 'EXPORT CSS'; }, 1500); };
      if (navigator.clipboard) navigator.clipboard.writeText(text).then(done, () => {});
    }
    if (a === 'reset') {
      if (b.dataset.armed) { snapshot(); edits = {}; save(); refresh(); } else { b.dataset.armed = '1'; b.textContent = 'TAP AGAIN TO RESET ALL'; }
    }
  }

  function onInput(e) {
    const t = e.target;
    const v = parseFloat(t.value);
    if (!Number.isFinite(v)) return;
    if (t.dataset.prop) setNum(t.dataset.prop, v);
    if (t.dataset.gapin) setGap(t.dataset.gapin, v);
    if (t.dataset.nudgein !== undefined) { const n = nudgeOf(); n[+t.dataset.nudgein] = v; setProp('translate', `${n[0]}px ${n[1]}px`); }
  }

  // (after an edit: the panel's numbers again, once the page has laid out with it)
  function refresh() { requestAnimationFrame(() => { renderBody(); drawOverlay(); }); }

  // The picked piece outlined with its size, its parent dashed, and the space to what's beside it
  function drawOverlay() {
    if (!overlay) return;
    if (!picked || !picked.isConnected || ui.hidden) { overlay.innerHTML = ''; return; }
    const r = picked.getBoundingClientRect();
    let h = '';
    const box = (q, cls) => `<div class="${cls}" style="left:${q.left}px;top:${q.top}px;width:${q.width}px;height:${q.height}px"></div>`;
    if (picked.parentElement) h += box(picked.parentElement.getBoundingClientRect(), 'ed-parent');
    const lk = isLocked(picked);
    h += box(r, lk ? 'ed-box locked' : 'ed-box');
    h += `<div class="ed-tag${lk ? ' locked' : ''}" style="left:${r.left}px;top:${Math.max(0, r.top - 15)}px">${lk ? 'LOCKED // ' : ''}${Math.round(r.width)} × ${Math.round(r.height)}</div>`;
    for (const side of ['top', 'bottom', 'left', 'right']) {
      const g = gap(picked, side);
      if (!(g.d > 0.5)) continue;
      const v = side === 'top' || side === 'bottom';
      const x = v ? r.left + r.width / 2 : side === 'left' ? r.left - g.d : r.right;
      const y = v ? (side === 'top' ? r.top - g.d : r.bottom) : r.top + r.height / 2;
      h += `<div class="ed-line" style="left:${x}px;top:${y}px;width:${v ? 1 : g.d}px;height:${v ? g.d : 1}px"></div>`;
      h += `<div class="ed-gap" style="left:${v ? x : x + g.d / 2}px;top:${v ? y + g.d / 2 : y}px">${round(g.d)}</div>`;
    }
    overlay.innerHTML = h;
  }

  // (on at load if it was left on, once everything above is set up)
  if (store.get(ON_KEY) === 'on' || new URLSearchParams(location.search).has('edit')) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => window.LayoutEditor.open());
    else window.LayoutEditor.open();
  }
})();
