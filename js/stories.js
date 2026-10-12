// THE STORIES: STORY (CLASSIC's other side) and its story (the files: js/data/stories.js; the plan: docs/STORIES.md).
// Each key cracked recovers the next FILE of the story being decrypted, typed out on the cracked
// card as the terminal would (a tap on it, or REDUCED EFFECTS, shows it whole). A chapter's files
// only come from keys at least STORY_GATES deep: a key too shallow still pays its KEYS, and the
// card says what it would take. A story finished opens the next, picked at once.
// RULES & RECORDS → ARCHIVE: every story, its files recovered so far to read again (new ones marked
// till they're read), the rest still ENCRYPTED with the key they need, and DECRYPT THIS STORY to
// pick it. In STORY the main menu's story button says which and how far, and opens it.
const Stories = (() => {
  const PER_CHAPTER = 4;
  const byId = (id) => STORIES.find((s) => s.id === id);
  const st = () => Progress.stories();
  const got = (s) => Math.min(s.files.length, st().got[s.id] || 0);
  const done = (s) => got(s) >= s.files.length;
  const isOpen = (s) => { const i = STORIES.indexOf(s); return i <= 0 || done(STORIES[i - 1]); };
  const fresh = (s) => got(s) - Math.min(got(s), st().seen[s.id] || 0); // (recovered, not yet read)
  // (the one being decrypted: the pick, if it's open; else the first open one not finished)
  function picked() {
    const p = byId(st().pick);
    if (p && isOpen(p)) return p;
    return STORIES.find((s) => isOpen(s) && !done(s)) || STORIES[0];
  }
  const gateOf = (n) => STORY_GATES[Math.min(STORY_GATES.length - 1, Math.floor(n / PER_CHAPTER))];
  const gateText = (bits) => (bits <= STORY_GATES[0] ? 'ANY KEY' : `${bits}-BIT OR DEEPER`);
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  // (encrypted lines: noise of a set length, the same each time for a file)
  function noise(seed, len = 30) {
    const r = seeded(hashString(`bytefall:story:${seed}`));
    const glyphs = '0123456789ABCDEF';
    let out = '';
    for (let i = 0; i < len; i++) out += i % 5 === 4 ? ' ' : r() < 0.18 ? '░▒▓'[Math.floor(r() * 3)] : glyphs[Math.floor(r() * 16)];
    return out;
  }
  const lowFx = () => document.documentElement.classList.contains('low-fx') || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);

  // THE CRACKED CARD: the file this key recovered, typed out (or what the next one needs)
  let typing = null;
  function stop() {
    if (!typing) return;
    clearInterval(typing.timer);
    typing.body.textContent = typing.text;
    typing.body.appendChild(typing.caret);
    typing = null;
  }
  function typeOut(body, text, host) {
    const caret = document.createElement('span');
    caret.className = 'sf-caret';
    if (lowFx()) { body.textContent = text; body.appendChild(caret); return; }
    let at = 0;
    typing = { body, text, caret, timer: 0 };
    typing.timer = setInterval(() => {
      at = Math.min(text.length, at + 2);
      body.textContent = text.slice(0, at);
      body.appendChild(caret);
      host.scrollTop = host.scrollHeight; // (a long file on a short screen: the newest line in view)
      if (at >= text.length) { clearInterval(typing.timer); typing = null; }
    }, 22);
  }
  // A key cracked, `bits` deep: host is the card's story box, card the cracked card (tight: the file
  // won't fit whole, so the card's note on the next key steps aside for it; GO DEEPER says it too)
  function onCrack(bits, host, card) {
    stop();
    host.hidden = true;
    host.textContent = '';
    host.classList.remove('locked');
    if (card) card.classList.remove('tight');
    const s = picked();
    if (!s || done(s)) return; // (every story read: the card as it was)
    const n = got(s);
    const gate = gateOf(n);
    host.hidden = false;
    if (bits < gate) { // (too shallow for the next file: what it would take)
      let k = 0;
      while (goalBits(k) < gate) k++;
      host.classList.add('locked');
      host.innerHTML = `<p class="sf-head">${esc(s.title)} // FILE ${n + 1} OF ${s.files.length} // ENCRYPTED DEEPER</p>`
        + `<p class="sf-noise">${noise(`${s.id}:${n}`)}</p>`
        + `<p class="sf-body">CHAPTER ${Math.floor(n / PER_CHAPTER) + 1} is under ${gate}-BIT keys. GO DEEPER and crack ${gate}-BIT at ${fmt(goalTarget(k))} to recover it.</p>`;
      return;
    }
    Progress.storyRecover(s.id);
    const f = s.files[n];
    host.innerHTML = `<p class="sf-head">RECOVERED // ${esc(s.title)} // FILE ${n + 1} OF ${s.files.length}</p><p class="sf-doc">${esc(f.doc)}</p><p class="sf-body"></p>`;
    host.onclick = stop; // (a tap: the whole file at once)
    const body = host.querySelector('.sf-body');
    body.textContent = f.text; // (measured whole first)
    if (card && host.scrollHeight > host.clientHeight + 1) card.classList.add('tight');
    body.textContent = '';
    typeOut(body, f.text, host);
    if (done(s)) { // (the last file: the next story opens, and is picked)
      const next = STORIES[STORIES.indexOf(s) + 1];
      logNotice(`STORY // ${s.title} COMPLETE`, false, next ? `${next.title} is open in the ARCHIVE, and it's the one you're decrypting now.` : 'Every story is in the ARCHIVE.');
      if (next) Progress.storyPick(next.id);
    }
    marks();
  }

  // THE ARCHIVE (RULES & RECORDS' tab)
  let view = null; // (a story's id, or null for the list of them)
  const bodyEl = () => document.getElementById('archive-body');
  function render() {
    const el = bodyEl();
    if (!el) return;
    const s = view && byId(view);
    if (!s || !isOpen(s)) { view = null; listView(el); } else storyView(el, s);
    marks();
  }
  function listView(el) {
    const pick = picked();
    el.innerHTML = '<p class="archive-note">Every key cracked in STORY (tap CLASSIC again on the main menu) recovers the next file of the story you\'re decrypting. Deeper chapters need deeper keys.</p>'
      + STORIES.map((s, i) => {
        const open = isOpen(s);
        const state = !open ? `LOCKED // FINISH ${STORIES[i - 1].title}` : done(s) ? 'COMPLETE' : s === pick ? 'DECRYPTING' : `${got(s) ? 'PAUSED' : 'NOT STARTED'}`;
        const news = open && fresh(s) ? `<span class="archive-new">${fresh(s)} NEW</span>` : '';
        return `<button type="button" class="archive-story${open ? '' : ' locked'}${s === pick && open ? ' on' : ''}" data-story="${s.id}">`
          + `<span class="as-top"><span class="as-title">${esc(s.title)}</span>${news}</span>`
          + `<span class="as-blurb">${open ? esc(s.blurb) : 'Locked.'}</span>`
          + `<span class="as-state">${got(s)} / ${s.files.length} FILES // ${state}</span></button>`;
      }).join('');
    el.querySelectorAll('.archive-story').forEach((b) => b.addEventListener('click', () => {
      const s = byId(b.dataset.story);
      if (!isOpen(s)) {
        SFX.play('denied');
        cardNotice(`LOCKED // FINISH ${STORIES[STORIES.indexOf(s) - 1].title}`);
        return;
      }
      SFX.play('click');
      openStory(s.id);
    }));
  }
  function storyView(el, s) {
    const pick = picked();
    const n = got(s);
    const seen = Math.min(n, st().seen[s.id] || 0);
    const pickBtn = done(s) ? '<p class="archive-state">COMPLETE: EVERY FILE RECOVERED</p>'
      : `<button type="button" class="archive-pick${s === pick ? ' on' : ''}" id="archive-pick"${s === pick ? ' aria-pressed="true"' : ''}>${s === pick ? 'DECRYPTING THIS STORY' : 'DECRYPT THIS STORY'}</button>`;
    let html = `<button type="button" class="archive-back" id="archive-back">&larr; ALL STORIES</button>`
      + `<h3 class="archive-title">${esc(s.title)}</h3><p class="archive-blurb">${esc(s.blurb)}</p>${pickBtn}`;
    s.chapters.forEach((name, c) => {
      html += '<div class="store-rule" aria-hidden="true">================================================================================</div>'
        + `<p class="archive-chapter">// CHAPTER ${c + 1}: ${esc(name)} <span>${gateText(STORY_GATES[c])}</span></p>`;
      for (let i = c * PER_CHAPTER; i < Math.min(s.files.length, (c + 1) * PER_CHAPTER); i++) {
        const f = s.files[i];
        html += i < n
          ? `<div class="archive-file${i >= seen ? ' new' : ''}"><p class="af-head">FILE ${i + 1} // ${esc(f.doc)}${i >= seen ? ' <b>NEW</b>' : ''}</p><p class="af-body">${esc(f.text)}</p></div>`
          : `<div class="archive-file locked"><p class="af-head">FILE ${i + 1} // ENCRYPTED // ${gateText(gateOf(i))}</p><p class="af-noise">${noise(`${s.id}:${i}`)}</p></div>`;
      }
    });
    el.innerHTML = html;
    document.getElementById('archive-back').addEventListener('click', () => { SFX.play('click'); view = null; render(); top(); });
    const pb = document.getElementById('archive-pick');
    if (pb) pb.addEventListener('click', () => {
      if (s === pick) return;
      SFX.play('punct');
      Progress.storyPick(s.id);
      render();
      refreshRow();
    });
    Progress.storyRead(s.id); // (seen now: marked NEW this time, not the next)
  }
  const top = () => { const box = typeof menuScroller === 'function' && menuScroller(); if (box) box.scrollTop = 0; };
  function openStory(id) {
    view = id;
    render();
    top();
  }
  // (new files: a dot on the ARCHIVE tab and the menu's STORY button)
  function marks() {
    const any = STORIES.some((s) => isOpen(s) && fresh(s) > 0);
    for (const el of document.querySelectorAll('.menu-tabs [data-pane="archive"], #story-row button')) el.classList.toggle('has-unread', any);
  }

  // THE MAIN MENU's story button (in STORY): which story and how far; a tap opens it in
  // the ARCHIVE
  const FOLDER_SVG = '<svg class="story-ico" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3 5 H9.5 L11.5 7.5 H21 V19 H3 Z M3 10 H21" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>';
  function refreshRow() {
    const row = document.getElementById('story-row');
    if (!row) return;
    row.hidden = mode !== 'classic' || daily || !goalWanted;
    if (row.hidden) return;
    const s = picked();
    row.innerHTML = '';
    const b = document.createElement('button');
    b.type = 'button';
    b.innerHTML = `<span class="opt-text">${FOLDER_SVG}${esc(s.title)} // ${done(s) ? 'COMPLETE' : `${got(s)} / ${s.files.length}`}</span>`;
    b.setAttribute('aria-label', `Story: ${s.title}, ${got(s)} of ${s.files.length} files. Tap to read it in the archive`);
    b.addEventListener('click', () => { SFX.play('click'); view = s.id; setRecordsOpen(true, 'archive'); });
    row.appendChild(b);
    marks();
  }
  // (the ARCHIVE tab wears the folder too)
  const tab = document.querySelector('.menu-tabs [data-pane="archive"] svg');
  if (tab) tab.outerHTML = FOLDER_SVG.replace('class="story-ico" ', '');
  marks();
  refreshRow();

  return { onCrack, stop, render, refreshRow, openStory, toList: () => { view = null; }, picked: () => picked().id };
})();
