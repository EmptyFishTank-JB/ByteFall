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
// THE PHONE: every IM opens on a phone screen over everything (#story-msg as .phone, one size, a
// phone's 9:19.5): its status bar, the contact, the messages in bubbles coming in from the bottom
// (each with its sender and time above it, on its side), a message field. The cracked card and the
// ARCHIVE show a thread as an inbox does (its last message), OPEN THREAD to read it again. A contact
// whose name the story gives later (GHOSTS_RULES' names: MOTH, in transmission 12) is an UNKNOWN
// CONTACT till then (on that one still; CONTACT SAVED // MOTH on its card, MOTH from the next).
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
  const savedLine = (it) => (it.names && it.names.length ? `CONTACT SAVED // ${it.names.map((w) => w.toUpperCase()).join(' / ')}` : '');
  const footHtml = (it) => [introLine(it), giftLine(it), savedLine(it)].filter(Boolean).map((t, i) => `<p class="sf-reveal${i ? ' sf-gift' : ''}">${esc(t)}</p>`).join('');

  // THE CONTACTS: who an IM's from, as your phone shows them (its story's names: an UNKNOWN CONTACT
  // till the transmission naming them is behind you). One of the STORY TESTER's own: as written
  const storyOf = (it) => STORIES.find((x) => x.items.includes(it) || (x.extras || []).includes(it));
  const whereOf = (it) => it.n || (storyOf(it) ? got(storyOf(it)) : 0) + 0.5; // (an unprompted one: as far as you've got, when it comes)
  function knownAt(s, who, at) {
    const named = s && s.items.find((x) => (x.names || []).includes(who));
    return !named || named.n < at;
  }
  const known = (who, it) => knownAt(storyOf(it), who.toLowerCase(), whereOf(it));
  const contact = (who, it) => (who === 'you' ? 'YOU' : known(who, it) ? who.toUpperCase() : 'UNKNOWN CONTACT');
  const fromLabel = (id, it) => (known(id, it) ? LABEL[id] || id.toUpperCase() : 'UNKNOWN CONTACT');
  // (an IM's times: as written, else a late hour of the night, the same every time for a thread, a
  // minute passing now and then)
  function stamps(it) {
    const r = seeded(hashString(`bytefall:im:${it.n || it.when || ''}:${it.lines.map((l) => l.t || '').join('|').slice(0, 120)}`));
    let h = [23, 0, 1, 2, 3][Math.floor(r() * 5)];
    let m = Math.floor(r() * 50);
    const given = it.lines.find((l) => l.time); // (some written: the rest go from the first of them)
    if (given) [h, m] = given.time.split(':').map(Number);
    let first = true;
    const two = (x) => String(x).padStart(2, '0');
    return it.lines.map((l) => {
      if (l.k !== 'im' && l.k !== 'you') return null;
      if (l.time) { [h, m] = l.time.split(':').map(Number); first = false; return l.time; }
      if (!first && r() < 0.4) { m++; if (m > 59) { m = 0; h = (h + 1) % 24; } }
      first = false;
      return `${two(h)}:${two(m)}`;
    });
  }

  // A TRANSMISSION's lines, each by its look: an IM's handle (and time), a chat log's <handle>, a
  // call's ring, spoken lines and end, notes, gaps; the words of each in a .tl-t (what's typed)
  const LABEL = { moth: 'MOTH', toll: 'TOLL', unknown: 'UNKNOWN NUMBER', archive: 'THE ARCHIVE' };
  // (an IM's line: its sender and time above a bubble, on its side; "..." in it while they type)
  function lineHtml(l, it, time) {
    const t = `<span class="tl-t">${esc(l.t || '')}</span>`;
    if (l.k === 'gap') return '<p class="tl tl-gap"></p>';
    if (l.k === 'im' || l.k === 'you') {
      const who = l.k === 'you' ? 'you' : l.who.toLowerCase();
      return `<p class="tl tl-${l.k}" data-who="${esc(who)}"${time ? ` data-time="${time}"` : ''}><span class="tl-head"><span class="tl-who">${esc(contact(who, it))}</span>${time ? `<span class="tl-time">${time}</span>` : ''}</span>`
        + `<span class="tl-bubble">${t}<span class="tl-dots" aria-hidden="true"><i></i><i></i><i></i></span></span></p>`;
    }
    if (l.k === 'chat') return `<p class="tl tl-chat"><span class="tl-who">&lt;${esc(l.who)}&gt;</span> ${t}</p>`;
    return `<p class="tl tl-${l.k}">${t}</p>`;
  }
  function linesHtml(it, cls = '') {
    const times = stamps(it);
    return `<div class="sf-lines${it.kind === 'im' ? ' sf-chat' : ''}${cls ? ` ${cls}` : ''}">${it.lines.map((l, i) => lineHtml(l, it, times[i])).join('')}</div>`;
  }
  function kindLine(it) {
    let title = it.title;
    const s = storyOf(it);
    if (s) s.items.forEach((x) => (x.names || []).forEach((who) => { if (!known(who, it)) title = title.replace(new RegExp(`\\b${who.toUpperCase()}\\b`, 'g'), 'UNKNOWN CONTACT'); }));
    return `${it.kind.toUpperCase()} // ${title}`;
  }
  // (a thread as an inbox shows it: its last message, and OPEN THREAD)
  function threadHtml(it, cls) {
    const ims = it.lines.filter((l) => l.k === 'im' || l.k === 'you');
    const last = ims[ims.length - 1];
    return `<p class="${cls}-snippet"><span>${esc(contact(last.k === 'you' ? 'you' : last.who.toLowerCase(), it))}:</span> ${esc(last.t)}</p>`
      + `<button type="button" class="sf-open">OPEN THREAD // ${ims.length} MESSAGE${ims.length === 1 ? '' : 'S'}</button>`;
  }

  // (a CALL or FILE ending in IMs, GHOSTS' last: what comes before, played where it is, and the IMs,
  // a thread of their own on the phone after it)
  function splitIm(it) {
    if (it.kind === 'im') return null;
    const at = it.lines.findIndex((l) => l.k === 'im' || l.k === 'you');
    if (at < 0) return null;
    const before = it.lines.slice(0, at);
    while (before.length && before[before.length - 1].k === 'gap') before.pop();
    const first = it.lines[at];
    return { before: { ...it, lines: before }, thread: { ...it, kind: 'im', lines: it.lines.slice(at) }, title: `// IM // ${contact(first.k === 'you' ? 'you' : first.who.toLowerCase(), it)}` };
  }

  // THE PHONE (an IM's card): one size, a phone's shape; its clock the newest message's time
  const SIGNAL_SVG = '<svg viewBox="0 0 16 12" aria-hidden="true"><path d="M1 11h2V8H1zM5 11h2V6H5zM9 11h2V3H9zM13 11h2V0h-2z" fill="currentColor"/></svg>';
  const WIFI_SVG = '<svg viewBox="0 0 16 12" aria-hidden="true"><path d="M8 11.5 L1 3.5 A10 10 0 0 1 15 3.5 Z" fill="currentColor"/></svg>';
  const BATTERY_SVG = '<svg viewBox="0 0 22 12" aria-hidden="true"><rect x="0.5" y="0.5" width="18" height="11" rx="2" fill="none" stroke="currentColor"/><rect x="2" y="2" width="11" height="8" rx="1" fill="currentColor"/><rect x="19.5" y="4" width="2" height="4" rx="1" fill="currentColor"/></svg>';
  function phoneHtml(it) {
    const times = stamps(it).filter(Boolean);
    const other = it.lines.find((l) => l.k === 'im');
    const name = other ? contact(other.who.toLowerCase(), it) : 'UNKNOWN CONTACT';
    return '<div class="phone-screen">'
      + `<div class="ph-status"><span class="ph-clock">${times[0] || ''}</span><span class="ph-icons">${SIGNAL_SVG}${WIFI_SVG}${BATTERY_SVG}</span></div>`
      + `<div class="ph-bar"><button type="button" class="ph-back" aria-label="Close">&larr;</button><span class="ph-avatar" data-who="${esc(other ? other.who.toLowerCase() : '')}">${name === 'UNKNOWN CONTACT' ? '?' : esc(name[0])}</span><span class="ph-name">${esc(name)}</span></div>`
      + linesHtml(it, 'ph-msgs')
      + '<div class="ph-input"><span class="ph-plus" aria-hidden="true">+</span><span class="ph-field">Text message</span></div>'
      + '<div class="ph-home" aria-hidden="true"></div></div>';
  }

  // THE PLAYING: the lines from `from` on, one after another, each the way it would come in. A
  // file's lines print out, two letters a tick, a typewriter's keys under them; an IM's messages land
  // whole, a beat between them about as long as the other end would take to write the next (shorter
  // for a second message from the same hand; "..." while they type), a chime as each lands; a call's
  // words come at a speaking pace (about 150 a minute, a pause at each comma and stop), a low voice
  // down the line; its end, a note, after a beat, at once. A tap shows the rest at once
  let typing = null;
  let ringing = null; // (a call's ring, every few seconds till it's answered)
  const TICK = 22; // (a file's printing: two letters a tick)
  const imBeat = (x, prev) => { const same = prev && prev.who === x.who; return Math.min(2800, (same ? 450 : 900) + x.text.length * (same ? 14 : 20)); };
  const wordMs = (w) => 80 + w.replace(/[^A-Za-z0-9']/g, '').length * 52 + (/[.?!]["']?$/.test(w) ? 380 : /[,;:\u2014-]["']?$/.test(w) ? 200 : 0);
  const isIm = (x) => x.k === 'im' || x.k === 'you';
  // (an IM thread kept at its newest, at the bottom; the phone's clock its time)
  function toBottom(p, smooth) {
    const chat = p.closest('.sf-chat');
    if (!chat) return false;
    if (smooth && chat.dataset.held) return true; // (scrolled up to read: left there, as a phone does)
    if (smooth && chat.scrollTo) chat.scrollTo({ top: chat.scrollHeight, behavior: 'smooth' });
    else chat.scrollTop = chat.scrollHeight;
    const clock = p.dataset.time && chat.parentNode.querySelector('.ph-clock');
    if (clock) clock.textContent = p.dataset.time;
    return true;
  }
  function finish(t) {
    t.targets.forEach((x) => { x.p.classList.remove('tl-wait', 'tl-typing'); if (x.sp) x.sp.textContent = x.text; });
    const last = [...t.targets].reverse().find((x) => x.sp);
    if (last && !isIm(last)) last.sp.appendChild(t.caret); // (no caret on an IM)
    if (last) toBottom(last.p, false);
  }
  function skip() {
    if (!typing) return;
    clearTimeout(typing.timer);
    finish(typing);
    const done = typing.done;
    typing = null;
    if (done) done();
  }
  let phoneSeq = 0; // (a phone due to pop up over the cracked card: stop() calls it off)
  function stop() {
    phoneSeq++;
    if (ringing) { clearInterval(ringing); ringing = null; }
    skip();
  }
  function typeLines(host, from = 0, whole = false, done = null) {
    skip();
    const caret = document.createElement('span');
    caret.className = 'sf-caret';
    const targets = [...host.querySelectorAll('.tl')].slice(from).map((p) => { const sp = p.querySelector('.tl-t'); return { p, sp, k: p.classList[1].slice(3), who: p.dataset.who, text: sp ? sp.textContent : '' }; });
    const t = { targets, caret, timer: 0, done }; // (done: called once it's all out, typed or tapped)
    if (whole || lowFx()) { finish(t); if (done) done(); return; }
    targets.forEach((x) => { x.p.classList.add('tl-wait'); if (x.sp) x.sp.textContent = ''; });
    typing = t;
    const later = (ms, f) => { t.timer = setTimeout(() => { if (typing === t) f(); }, ms); };
    const show = (x) => {
      x.p.classList.remove('tl-wait');
      if (toBottom(x.p, true)) return;
      const below = x.p.offsetTop + x.p.offsetHeight - host.clientHeight; // (the newest line in view)
      if (below > host.scrollTop) host.scrollTop = below;
    };
    let first = true;
    let prev = null; // (the last IM, for the beat before the next)
    const next = (i) => {
      if (i >= targets.length) { finish(t); typing = null; if (done) done(); return; }
      const x = targets[i];
      const lead = first;
      first = false;
      if (!x.sp || !x.text) { show(x); next(i + 1); return; } // (a gap: at once)
      if (isIm(x)) { // (a message, whole, after its beat: theirs with "..." in its bubble while they type)
        const ms = lead ? 350 : imBeat(x, prev);
        const land = () => {
          x.p.classList.remove('tl-typing');
          x.sp.textContent = x.text;
          show(x);
          if (x.k === 'you') SFX.sent(); else SFX.incoming();
          prev = x;
          next(i + 1);
        };
        if (x.k === 'im' && ms > 700) later(350, () => { x.p.classList.add('tl-typing'); show(x); later(ms - 350, land); }); // (a moment to read, then typing)
        else later(ms, land);
        return;
      }
      if (x.k === 'voice') { // (spoken, a word at a time)
        const words = x.text.split(/(?<=\s)/);
        let w = 0;
        const say = () => {
          const ms = wordMs(words[w].trim());
          x.sp.textContent = words.slice(0, ++w).join('');
          x.sp.appendChild(caret);
          show(x);
          SFX.voice(Math.min(0.32, (ms - 40) / 1000 * 0.7));
          later(ms, w < words.length ? say : () => next(i + 1));
        };
        later(lead ? 300 : 450, say);
        return;
      }
      if (x.k === 'chat' || x.k === 'line') { // (printed out)
        let at = 0;
        const tick = () => {
          at = Math.min(x.text.length, at + 2);
          x.sp.textContent = x.text.slice(0, at);
          x.sp.appendChild(caret);
          show(x);
          if (/\S/.test(x.text.slice(at - 2, at)) && at % 4 < 2) SFX.typewriter();
          if (at < x.text.length) { later(TICK, tick); return; }
          const end = !targets.slice(i + 1).some((y) => y.text);
          SFX.typewriter(end ? 'bell' : 'return');
          later(TICK, () => next(i + 1));
        };
        tick();
        return;
      }
      later(lead ? 0 : 600, () => { // (a call's end, a note: at once, after a beat)
        x.sp.textContent = x.text;
        show(x);
        if (x.k === 'end') SFX.hangup();
        next(i + 1);
      });
    };
    next(0);
  }
  // A call rings first (a voicemail doesn't: it's waiting): what comes before the ring and the ring
  // at once, ANSWER on it, the rest once it's answered (or at once, with no ring)
  function play(host, it, whole = false, done = null) {
    stop();
    const ring = it.lines.findIndex((l) => l.k === 'ring');
    if (ring < 0 || whole) { typeLines(host, 0, whole, done); return; }
    const ps = [...host.querySelectorAll('.tl')];
    ps.slice(ring + 1).forEach((p) => p.classList.add('tl-wait'));
    const ringEl = ps[ring];
    ringEl.classList.add('ringing');
    if (!/^VOICEMAIL/.test(it.lines[ring].t)) {
      let rings = 0;
      SFX.ring();
      ringing = setInterval(() => { if (++rings >= 7 || !ringEl.isConnected) { clearInterval(ringing); ringing = null; } else SFX.ring(); }, 3000);
    }
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'sf-answer';
    b.textContent = 'ANSWER';
    b.addEventListener('click', (e) => {
      e.stopPropagation();
      b.remove();
      ringEl.classList.remove('ringing');
      if (ringing) { clearInterval(ringing); ringing = null; }
      SFX.play('click');
      typeLines(host, ring + 1, false, done);
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
    const head = `<p class="sf-head">RECOVERED // ${esc(s.title)} // ${unit(s)} ${n + 1} OF ${count(s)}</p><p class="sf-doc">${esc(kindLine(it))}</p>`;
    if (it.kind === 'im') { // (an IM: on the phone, a moment after the crack; the card keeps the thread)
      host.innerHTML = head + threadHtml(it, 'sf') + footHtml(it);
      host.onclick = () => showCard(`// ${kindLine(it)}`, it, false, true);
      const seq = phoneSeq;
      setTimeout(() => { if (seq === phoneSeq && !host.hidden && host.isConnected) showCard(`// ${kindLine(it)}`, it); }, 700);
    } else {
      const sp = splitIm(it); // (GHOSTS' last: the call here, then MOTH's IMs on the phone)
      host.innerHTML = head + linesHtml(sp ? sp.before : it) + (sp ? threadHtml(sp.thread, 'sf') : '') + footHtml(it);
      host.onclick = skip; // (a tap: the whole of it at once)
      if (sp) host.querySelector('.sf-open').addEventListener('click', (e) => { e.stopPropagation(); showCard(sp.title, sp.thread, false, true); });
      if (card && host.scrollHeight > host.clientHeight + 1) card.classList.add('tight'); // (measured whole first)
      let seq = -1;
      play(host, sp ? sp.before : it, false, sp ? () => setTimeout(() => { if (seq === phoneSeq && !host.hidden && host.isConnected) showCard(sp.title, sp.thread); }, 900) : null);
      seq = phoneSeq; // (after play's own stop(): a stop() from here on calls the phone off)
    }
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
    const chips = senders.length > 1 ? `<div class="archive-filter" role="group" aria-label="Whose">${['all', ...senders].map((f) => `<button type="button" data-from="${f}" class="${f === filter ? 'on' : ''}"${f === filter ? ' aria-pressed="true"' : ''}>${f === 'all' ? 'ALL' : knownAt(s, f, n + 0.5) ? LABEL[f] || f.toUpperCase() : 'UNKNOWN CONTACT'}</button>`).join('')}</div>` : '';
    let html = `<button type="button" class="archive-back" id="archive-back">&larr; ALL STORIES</button>`
      + `<h3 class="archive-title">SEASON ${s.season} // ${esc(s.title)}</h3><p class="archive-blurb">${esc(s.blurb)}</p>${pickBtn}${chips}`;
    s.chapters.forEach((name, c) => {
      html += '<div class="store-rule" aria-hidden="true">================================================================================</div>'
        + `<p class="archive-chapter">// CHAPTER ${c + 1}: ${esc(name)} <span>${gateText(STORY_GATES[c])}</span></p>`;
      for (let i = c * s.perChapter; i < Math.min(count(s), (c + 1) * s.perChapter); i++) {
        const it = s.items[i];
        if (filter !== 'all' && !it.from.includes(filter)) continue;
        html += i < n
          ? `<div class="archive-file${i >= seen ? ' new' : ''}" data-i="${i}"><p class="af-head">${unit(s)} ${i + 1} // ${esc(kindLine(it))}${i >= seen ? ' <b>NEW</b>' : ''}</p>${it.kind === 'im' ? threadHtml(it, 'af') : splitIm(it) ? linesHtml(splitIm(it).before) + threadHtml(splitIm(it).thread, 'af') : linesHtml(it)}${footHtml(it).replace(/sf-reveal/g, 'af-reveal')}</div>`
          : `<div class="archive-file locked"><p class="af-head">${unit(s)} ${i + 1} // ENCRYPTED // ${gateText(gateOf(s, i))}</p><p class="af-noise">${noise(`${s.id}:${i}`)}</p></div>`;
      }
    });
    const had = (s.extras || []).filter((x) => Progress.storyExtraHad(x.when) && (filter === 'all' || x.from === filter));
    if (had.length) {
      html += '<div class="store-rule" aria-hidden="true">================================================================================</div><p class="archive-chapter">// OFF THE RECORD</p>'
        + had.map((x) => `<div class="archive-file" data-x="${x.when}"><p class="af-head">${x.kind === 'call' ? 'VOICEMAIL' : 'IM'} // ${fromLabel(x.from, x)}</p>${x.kind === 'im' ? threadHtml(x, 'af') : linesHtml(x)}</div>`).join('');
    }
    el.innerHTML = html;
    document.getElementById('archive-back').addEventListener('click', () => { SFX.play('click'); view = null; render(); top(); });
    el.querySelectorAll('.archive-file .sf-open').forEach((b) => b.addEventListener('click', () => { // (an IM: on the phone, whole)
      const f = b.closest('.archive-file');
      const it = f.dataset.x ? s.extras.find((x) => x.when === f.dataset.x) : s.items[Number(f.dataset.i)];
      const sp = splitIm(it);
      if (sp) showCard(sp.title, sp.thread, false, true);
      else showCard(`// ${f.dataset.x ? `IM // ${fromLabel(it.from, it)}` : kindLine(it)}`, it, false, true);
    }));
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
    logNotice(`STORY // ${x.kind === 'call' ? 'VOICEMAIL' : 'IM'} FROM ${fromLabel(x.from, x)}`, false, x.lines.filter((l) => l.t && l.k !== 'ring').map((l) => l.t).join(' '));
  }
  function showDue() {
    if (!due) return false;
    const x = due;
    due = null;
    return showCard(`// ${x.kind === 'call' ? 'VOICEMAIL' : 'IM'} // ${fromLabel(x.from, x)}`, x);
  }
  // (a card over everything, its lines played: an IM on the phone, a voicemail typed out; foot: what
  // it introduces and gives under it, as on the cracked card (?storytest's review); whole: at once,
  // as when a thread's opened again)
  function showCard(title, it, foot = false, whole = false) {
    const el = document.getElementById('story-msg');
    if (!el) return false;
    const phone = it.kind === 'im';
    const sp = !whole && splitIm(it); // (a call ending in IMs: the call, then the phone)
    if (sp) it = sp.before;
    el.querySelector('.story-msg-box').classList.toggle('phone', phone);
    document.getElementById('story-msg-title').textContent = title;
    const body = document.getElementById('story-msg-body');
    body.innerHTML = (phone ? phoneHtml(it) : linesHtml(it)) + (foot ? footHtml(it) : '');
    const lines = phone ? body.querySelector('.ph-msgs') : body;
    lines.onclick = skip; // (a tap: the whole of it at once)
    if (phone) { // (it scrolls, as a phone's thread does: scrolled up, it stops following new ones till you're back down)
      const hold = () => { lines.dataset.held = '1'; };
      lines.addEventListener('wheel', hold, { passive: true });
      lines.addEventListener('touchmove', hold, { passive: true });
      lines.addEventListener('scroll', () => { if (lines.scrollHeight - lines.scrollTop - lines.clientHeight < 8) delete lines.dataset.held; }, { passive: true });
    }
    const back = body.querySelector('.ph-back');
    if (back) back.addEventListener('click', (e) => { e.stopPropagation(); document.getElementById('story-msg-close').click(); });
    el.classList.remove('hidden');
    let seq = -1;
    play(lines, it, whole, sp ? () => setTimeout(() => { if (seq === phoneSeq && !el.classList.contains('hidden')) showCard(sp.title, sp.thread, foot); }, 900) : null);
    seq = phoneSeq;
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
    row.hidden = mode !== 'classic' || daily || !goalWanted || !!window.STORY_SOON; // (coming soon: no story named)
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

  return { onCrack, stop, showCard, kindLine, render, refreshRow, openStory, introduced, introName, moment, showDue, atStart, toList: () => { view = null; }, picked: () => picked().id };
})();
