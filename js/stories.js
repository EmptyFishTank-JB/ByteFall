// THE STORIES: STORY (CLASSIC's other side), in seasons (js/data/stories.js; GHOSTS' words from
// docs/STORY-V2.md, the first stories' plan in docs/STORIES.md). Each key cracked brings the next
// TRANSMISSION of the story being decrypted (a FILE, an IM or a CALL), typed out on the cracked card as
// the terminal would (a call rings first, ANSWER to hear it; a tap, or REDUCED EFFECTS, shows it
// whole). A chapter's transmissions only come from keys at least STORY_GATES deep: a key too shallow
// still pays its KEYS, and the card says what it would take. A story finished opens the next.
// WHAT GHOSTS INTRODUCES (introduced()): the exploits, BLACK BOXES and patches usable in STORY, and its
// stages ('infections', 'market', 'bring'), from the transmissions recovered so far (everything, once
// it's finished); the patches MOTH gifts go to STORY's own kit (Progress.storyKit).
// RULES & RECORDS → ARCHIVE: every season, its transmissions recovered so far to read again (new ones
// marked till they're read; GHOSTS' by sender too), the rest still ENCRYPTED with the key they need,
// and DECRYPT THIS STORY to pick one. In STORY the main menu's story button says which and how far.
// THE UNPROMPTED MESSAGES (GHOSTS' extras): once each, after a moment (traced, DISCONNECT, back after
// days away), a card on the main menu, kept in the ARCHIVE too.
const Stories = (() => {
  const byId = (id) => STORIES.find((s) => s.id === id);
  const st = () => Progress.stories();
  const count = (s) => s.items.length;
  const got = (s) => Math.min(count(s), st().got[s.id] || 0);
  const done = (s) => got(s) >= count(s);
  const isOpen = (s) => { const i = STORIES.indexOf(s); return i <= 0 || done(STORIES[i - 1]); };
  const fresh = (s) => got(s) - Math.min(got(s), st().seen[s.id] || 0); // (recovered, not yet read)
  // (the one being decrypted: the pick, if it's open; else the first open one not finished)
  function picked() {
    const p = byId(st().pick);
    if (p && isOpen(p)) return p;
    return STORIES.find((s) => isOpen(s) && !done(s)) || STORIES[0];
  }
  const ghosts = () => STORIES[0];
  const unit = (s) => (s.id === 'ghosts' ? 'TRANSMISSION' : 'FILE');
  const gateOf = (s, n) => STORY_GATES[Math.min(STORY_GATES.length - 1, Math.floor(n / s.perChapter))];
  const gateText = (bits) => (bits <= STORY_GATES[0] ? 'ANY KEY' : `${bits}-BIT OR DEEPER`);
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  // (encrypted lines: noise of a set length, the same each time for a transmission)
  function noise(seed, len = 30) {
    const r = seeded(hashString(`bytefall:story:${seed}`));
    const glyphs = '0123456789ABCDEF';
    let out = '';
    for (let i = 0; i < len; i++) out += i % 5 === 4 ? ' ' : r() < 0.18 ? '░▒▓'[Math.floor(r() * 3)] : glyphs[Math.floor(r() * 16)];
    return out;
  }
  const lowFx = () => document.documentElement.classList.contains('low-fx') || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);

  // WHAT'S INTRODUCED (GHOSTS'): every tool and stage, once it's finished
  const ALL = () => [...Object.keys(HACKS), ...Progress.boxIds(), ...Object.keys(BOOSTERS).filter((id) => !BOOSTERS[id].inGame), 'infections', 'market', 'bring'];
  function introduced() {
    const g = ghosts();
    if (done(g)) return new Set(ALL());
    const out = new Set();
    g.items.slice(0, got(g)).forEach((it) => (it.introduces || []).forEach((id) => out.add(id)));
    return out;
  }
  const introName = (id) => ({ market: 'THE BLACK MARKET', bring: 'BRING YOUR OWN', infections: 'INFECTED BITS' }[id] || (BOOSTERS[id] ? BOOSTERS[id].name : itemName(id)));
  const introLine = (it) => (it.introduces && it.introduces.length ? `INTRODUCED // ${it.introduces.map(introName).join(' / ')}` : '');
  const giftLine = (it) => (it.gifts ? Object.entries(it.gifts).map(([id, n]) => `+${n} ${BOOSTERS[id] ? BOOSTERS[id].name : itemName(id)}`).join(' / ') + ' IN YOUR KIT' : '');
  const footHtml = (it) => (introLine(it) ? `<p class="sf-reveal">${esc(introLine(it))}</p>` : '') + (giftLine(it) ? `<p class="sf-reveal sf-gift">${esc(giftLine(it))}</p>` : '');

  // A TRANSMISSION's lines, each by its look: an IM's handle (and time), a chat log's <handle>, a
  // call's ring, spoken lines and end, notes, gaps; the words of each in a .tl-t (what's typed)
  const LABEL = { moth: 'MOTH', toll: 'TOLL', unknown: 'UNKNOWN NUMBER', archive: 'THE ARCHIVE' };
  function lineHtml(l) {
    const t = `<span class="tl-t">${esc(l.t || '')}</span>`;
    if (l.k === 'gap') return '<p class="tl tl-gap"></p>';
    if (l.k === 'im' || l.k === 'you') return `<p class="tl tl-${l.k}"><span class="tl-who">${esc(l.who)}</span>${l.time ? `<span class="tl-time">${esc(l.time)}</span>` : ''}${t}</p>`;
    if (l.k === 'chat') return `<p class="tl tl-chat"><span class="tl-who">&lt;${esc(l.who)}&gt;</span> ${t}</p>`;
    return `<p class="tl tl-${l.k}">${t}</p>`;
  }
  const linesHtml = (it) => `<div class="sf-lines">${it.lines.map(lineHtml).join('')}</div>`;
  const kindLine = (it) => `${it.kind.toUpperCase()} // ${it.title}`;

  // THE TYPING: the lines from `from` on, one after another, two letters a tick, a caret on the newest
  let typing = null;
  function finish(t) {
    t.targets.forEach((x) => { x.p.classList.remove('tl-wait'); if (x.sp) x.sp.textContent = x.text; });
    const last = [...t.targets].reverse().find((x) => x.sp);
    if (last) last.sp.appendChild(t.caret);
  }
  function stop() {
    if (!typing) return;
    clearInterval(typing.timer);
    finish(typing);
    typing = null;
  }
  function typeLines(host, from = 0) {
    stop();
    const caret = document.createElement('span');
    caret.className = 'sf-caret';
    const targets = [...host.querySelectorAll('.tl')].slice(from).map((p) => { const sp = p.querySelector('.tl-t'); return { p, sp, text: sp ? sp.textContent : '' }; });
    const t = { targets, caret, timer: 0 };
    if (lowFx()) { finish(t); return; }
    targets.forEach((x) => { x.p.classList.add('tl-wait'); if (x.sp) x.sp.textContent = ''; });
    let i = 0;
    let at = 0;
    typing = t;
    t.timer = setInterval(() => {
      while (i < targets.length && !(targets[i].sp && targets[i].text)) targets[i++].p.classList.remove('tl-wait'); // (gaps: at once)
      if (i >= targets.length) { clearInterval(t.timer); if (typing === t) typing = null; return; }
      const x = targets[i];
      x.p.classList.remove('tl-wait');
      at = Math.min(x.text.length, at + 2);
      x.sp.textContent = x.text.slice(0, at);
      x.sp.appendChild(caret);
      const below = x.p.offsetTop + x.p.offsetHeight - host.clientHeight; // (the newest line in view)
      if (below > host.scrollTop) host.scrollTop = below;
      if (at >= x.text.length) { i++; at = 0; }
    }, 22);
  }
  // A call rings first: what comes before the ring and the ring at once, ANSWER on it, the rest once
  // it's answered (or at once, with no ring)
  function play(host, it) {
    const ring = it.lines.findIndex((l) => l.k === 'ring');
    if (ring < 0) { typeLines(host); return; }
    const ps = [...host.querySelectorAll('.tl')];
    ps.slice(ring + 1).forEach((p) => p.classList.add('tl-wait'));
    const ringEl = ps[ring];
    ringEl.classList.add('ringing');
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'sf-answer';
    b.textContent = 'ANSWER';
    b.addEventListener('click', (e) => {
      e.stopPropagation();
      b.remove();
      ringEl.classList.remove('ringing');
      SFX.play('click');
      typeLines(host, ring + 1);
    });
    ringEl.appendChild(b);
  }

  // THE CRACKED CARD: the transmission this key recovered, typed out (or what the next one needs)
  function onCrack(bits, host, card) {
    stop();
    host.hidden = true;
    host.textContent = '';
    host.classList.remove('locked');
    host.onclick = null;
    if (card) card.classList.remove('tight');
    const s = picked();
    if (!s || done(s)) return; // (every story read: the card as it was)
    const n = got(s);
    const gate = gateOf(s, n);
    host.hidden = false;
    if (bits < gate) { // (too shallow for the next one: what it would take)
      let k = 0;
      while (goalBits(k) < gate) k++;
      host.classList.add('locked');
      host.innerHTML = `<p class="sf-head">${esc(s.title)} // ${unit(s)} ${n + 1} OF ${count(s)} // ENCRYPTED DEEPER</p>`
        + `<p class="sf-noise">${noise(`${s.id}:${n}`)}</p>`
        + `<p class="sf-body">CHAPTER ${Math.floor(n / s.perChapter) + 1} is under ${gate}-BIT keys. GO DEEPER and crack ${gate}-BIT at ${fmt(goalTarget(k))} to recover it.</p>`;
      return;
    }
    Progress.storyRecover(s.id);
    const it = s.items[n];
    for (const [id, k] of Object.entries(it.gifts || {})) Progress.storyKitAdd(id, k); // (MOTH's gifts, to the kit)
    host.innerHTML = `<p class="sf-head">RECOVERED // ${esc(s.title)} // ${unit(s)} ${n + 1} OF ${count(s)}</p><p class="sf-doc">${esc(kindLine(it))}</p>${linesHtml(it)}${footHtml(it)}`;
    host.onclick = stop; // (a tap: the whole of it at once)
    if (card && host.scrollHeight > host.clientHeight + 1) card.classList.add('tight'); // (measured whole first)
    play(host, it);
    if (introLine(it)) {
      const market = it.introduces.includes('market');
      const bring = it.introduces.includes('bring');
      logNotice(`STORY // ${introLine(it)}`, false, market ? 'Open it in a STORY game from the PATCHES or EXPLOITS button beside your EXPLOIT button.'
        : bring ? 'Exploits and patches you own can come into STORY now, if the story has introduced them: STORY\'s main menu has PATCHES and EXPLOITS again.'
          : it.introduces.includes('infections') ? 'STORY games have INFECTED BITS from now on.'
            : `Usable in STORY from now on.${giftLine(it) ? ` ${giftLine(it)}.` : ''}`);
    }
    if (done(s)) { // (the last one: the next season opens, and is picked)
      const next = STORIES[STORIES.indexOf(s) + 1];
      logNotice(`STORY // ${s.title} COMPLETE`, false, next ? `SEASON ${next.season}, ${next.title}, is open in the ARCHIVE, and it's the one you're decrypting now.` : 'Every story is in the ARCHIVE.');
      if (next) Progress.storyPick(next.id);
    }
    marks();
  }

  // THE ARCHIVE (RULES & RECORDS' tab)
  let view = null; // (a story's id, or null for the list of them)
  let filter = 'all'; // (GHOSTS': whose transmissions show)
  const bodyEl = () => document.getElementById('archive-body');
  function render() {
    const el = bodyEl();
    if (!el) return;
    if (window.STORY_SOON) { // (the Play release, till the story's done)
      el.innerHTML = '<p class="archive-note"><b>STORY // COMING SOON.</b> A story to decrypt, one key at a time: every key you crack brings the next transmission, and they\'ll all be kept here.</p>';
      return;
    }
    const s = view && byId(view);
    if (!s || !isOpen(s)) { view = null; listView(el); } else storyView(el, s);
    marks();
  }
  function listView(el) {
    const pick = picked();
    el.innerHTML = '<p class="archive-note">Every key cracked in STORY (tap CLASSIC again on the main menu) brings the next transmission of the story you\'re decrypting. Deeper chapters need deeper keys.</p>'
      + '<button type="button" class="archive-back archive-intro" id="archive-intro">READ THE INTRO</button>'
      + STORIES.map((s, i) => {
        const open = isOpen(s);
        const state = !open ? `LOCKED // FINISH ${STORIES[i - 1].title}` : done(s) ? 'COMPLETE' : s === pick ? 'DECRYPTING' : `${got(s) ? 'PAUSED' : 'NOT STARTED'}`;
        const news = open && fresh(s) ? `<span class="archive-new">${fresh(s)} NEW</span>` : '';
        return `<button type="button" class="archive-story${open ? '' : ' locked'}${s === pick && open ? ' on' : ''}" data-story="${s.id}">`
          + `<span class="as-top"><span class="as-title">SEASON ${s.season} // ${esc(s.title)}</span>${news}</span>`
          + `<span class="as-blurb">${open ? esc(s.blurb) : 'Locked.'}</span>`
          + `<span class="as-state">${got(s)} / ${count(s)} ${unit(s)}S // ${state}</span></button>`;
      }).join('');
    document.getElementById('archive-intro').addEventListener('click', () => { SFX.play('click'); if (typeof openStoryIntro === 'function') openStoryIntro(); });
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
    const pickBtn = done(s) ? '<p class="archive-state">COMPLETE: EVERY TRANSMISSION RECOVERED</p>'
      : `<button type="button" class="archive-pick${s === pick ? ' on' : ''}" id="archive-pick"${s === pick ? ' aria-pressed="true"' : ''}>${s === pick ? 'DECRYPTING THIS STORY' : 'DECRYPT THIS STORY'}</button>`;
    const senders = [...new Set(s.items.flatMap((it) => it.from))];
    if (!senders.includes(filter)) filter = 'all';
    const chips = senders.length > 1 ? `<div class="archive-filter" role="group" aria-label="Whose">${['all', ...senders].map((f) => `<button type="button" data-from="${f}" class="${f === filter ? 'on' : ''}"${f === filter ? ' aria-pressed="true"' : ''}>${f === 'all' ? 'ALL' : LABEL[f] || f.toUpperCase()}</button>`).join('')}</div>` : '';
    let html = `<button type="button" class="archive-back" id="archive-back">&larr; ALL STORIES</button>`
      + `<h3 class="archive-title">SEASON ${s.season} // ${esc(s.title)}</h3><p class="archive-blurb">${esc(s.blurb)}</p>${pickBtn}${chips}`;
    s.chapters.forEach((name, c) => {
      html += '<div class="store-rule" aria-hidden="true">================================================================================</div>'
        + `<p class="archive-chapter">// CHAPTER ${c + 1}: ${esc(name)} <span>${gateText(STORY_GATES[c])}</span></p>`;
      for (let i = c * s.perChapter; i < Math.min(count(s), (c + 1) * s.perChapter); i++) {
        const it = s.items[i];
        if (filter !== 'all' && !it.from.includes(filter)) continue;
        html += i < n
          ? `<div class="archive-file${i >= seen ? ' new' : ''}"><p class="af-head">${unit(s)} ${i + 1} // ${esc(kindLine(it))}${i >= seen ? ' <b>NEW</b>' : ''}</p>${linesHtml(it)}${footHtml(it).replace(/sf-reveal/g, 'af-reveal')}</div>`
          : `<div class="archive-file locked"><p class="af-head">${unit(s)} ${i + 1} // ENCRYPTED // ${gateText(gateOf(s, i))}</p><p class="af-noise">${noise(`${s.id}:${i}`)}</p></div>`;
      }
    });
    const had = (s.extras || []).filter((x) => Progress.storyExtraHad(x.when) && (filter === 'all' || x.from === filter));
    if (had.length) {
      html += '<div class="store-rule" aria-hidden="true">================================================================================</div><p class="archive-chapter">// OFF THE RECORD</p>'
        + had.map((x) => `<div class="archive-file"><p class="af-head">${x.kind === 'call' ? 'VOICEMAIL' : 'IM'} // ${LABEL[x.from] || x.from.toUpperCase()}</p>${linesHtml(x)}</div>`).join('');
    }
    el.innerHTML = html;
    document.getElementById('archive-back').addEventListener('click', () => { SFX.play('click'); view = null; render(); top(); });
    el.querySelectorAll('.archive-filter button').forEach((b) => b.addEventListener('click', () => { SFX.play('click'); filter = b.dataset.from; render(); }));
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
    filter = 'all';
    render();
    top();
  }
  // (new transmissions: a dot on the ARCHIVE tab and the menu's story button)
  function marks() {
    if (window.STORY_SOON) return;
    const any = STORIES.some((s) => isOpen(s) && fresh(s) > 0);
    for (const el of document.querySelectorAll('.menu-tabs [data-pane="archive"], #story-row button')) el.classList.toggle('has-unread', any);
  }

  // THE UNPROMPTED MESSAGES: due (its moment, after its transmission, never before), it's kept as had
  // at once and waits for the main menu, where it shows as a card (showDue)
  let due = null;
  function moment(when) {
    const x = (ghosts().extras || []).find((e) => e.when === when);
    if (!x || window.STORY_SOON || got(ghosts()) < x.after || Progress.storyExtraHad(when)) return;
    Progress.storyExtraSet(when);
    due = x;
    logNotice(`STORY // ${x.kind === 'call' ? 'VOICEMAIL' : 'IM'} FROM ${LABEL[x.from] || x.from.toUpperCase()}`, false, x.lines.filter((l) => l.t && l.k !== 'ring').map((l) => l.t).join(' '));
  }
  function showDue() {
    if (!due) return false;
    const x = due;
    due = null;
    return showCard(`// ${x.kind === 'call' ? 'VOICEMAIL' : 'IM'} // ${LABEL[x.from] || x.from.toUpperCase()}`, x);
  }
  // (a card over everything, its lines typed out: an unprompted message, or a story's first transmission)
  function showCard(title, it) {
    const el = document.getElementById('story-msg');
    if (!el) return false;
    document.getElementById('story-msg-title').textContent = title;
    const body = document.getElementById('story-msg-body');
    body.innerHTML = linesHtml(it);
    el.classList.remove('hidden');
    play(body, it);
    SFX.play('click');
    return true;
  }
  // THE FIRST ONE (a transmission marked atStart: GHOSTS' 1, MOTH's IM): it pops up over the board as
  // the first STORY game starts, the files just landed, and is recovered then, not on a cracked card
  function atStart() {
    if (window.STORY_SOON) return false;
    const s = picked();
    if (!s || done(s)) return false;
    const it = s.items[got(s)];
    if (!it || !it.atStart) return false;
    Progress.storyRecover(s.id);
    showCard(`// ${kindLine(it)}`, it);
    marks();
    refreshRow();
    return true;
  }
  // (back after days away: on launch, three days or more since the last STORY game)
  const AWAY_MS = 3 * 24 * 3600 * 1000;
  const last = Progress.storyLastPlayed();
  if (last && Date.now() - last >= AWAY_MS) moment('away');

  // THE MAIN MENU's story button (in STORY): which story and how far; a tap opens it in the ARCHIVE
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
    b.innerHTML = `<span class="opt-text">${FOLDER_SVG}${esc(s.title)} // ${done(s) ? 'COMPLETE' : `${got(s)} / ${count(s)}`}</span>`;
    b.setAttribute('aria-label', `Story: ${s.title}, ${got(s)} of ${count(s)} recovered. Tap to read it in the archive`);
    b.addEventListener('click', () => { SFX.play('click'); view = s.id; filter = 'all'; setRecordsOpen(true, 'archive'); });
    row.appendChild(b);
    marks();
  }
  // (the ARCHIVE tab wears the folder too)
  const tab = document.querySelector('.menu-tabs [data-pane="archive"] svg');
  if (tab) tab.outerHTML = FOLDER_SVG.replace('class="story-ico" ', '');
  marks();
  refreshRow();

  return { onCrack, stop, render, refreshRow, openStory, introduced, introName, moment, showDue, atStart, toList: () => { view = null; }, picked: () => picked().id };
})();
