// THE STORIES: STORY (CLASSIC's other side), in seasons (js/data/stories.js; GHOSTS' words from
// docs/STORY-V2.md, the first stories' plan in docs/STORIES.md). Each key cracked brings the next FILE
// of the story being decrypted, a document from the archive, printed on the cracked card as the
// terminal would; some files have messages THEN, after them: a CALL (on the card, ringing: ANSWER to
// hear it), an EMAIL (on the card, printed) or an IM (on the phone, a moment after). A tap, or REDUCED
// EFFECTS, shows it whole. A chapter's files only come from keys at least STORY_GATES deep: a key too
// shallow still pays its KEYS, and the card says only that the next file's key is deeper. A story
// finished opens the next.
// GHOSTS' INTRO: its email (the archive, attached: in the phone's MAIL) and MOTH's first IM (on the
// phone), with the terminal intro (script.js's storyTerminal), before any key.
// WHAT GHOSTS INTRODUCES (introduced()): the exploits, BLACK BOXES and patches usable in STORY, and its
// stages ('infections', 'market', 'bring'), from the files recovered so far (everything, once it's
// finished); the patches MOTH gifts go to STORY's own kit (Progress.storyKit).
// THE ARCHIVE (RULES & RECORDS' tab, and the phone's ARCHIVE app): every season, its files recovered so
// far to read again with their messages (new ones marked till they're read), the rest still
// ENCRYPTED, and DECRYPT THIS STORY to pick one. In STORY the main menu's story button opens it on the
// phone.
// THE UNPROMPTED MESSAGES (GHOSTS' extras): once each, after a moment (traced, DISCONNECT, back after
// days away), a card on the main menu (an IM on the phone), kept in the ARCHIVE too.
// THE PHONE (below): yours, with its apps: MESSAGES, MAIL, CALLS, ARCHIVE, GAMES and a few more. A
// contact whose name the story gives later (GHOSTS_RULES' names: MOTH, with file 9) is an UNKNOWN
// CONTACT till then (on that one still; CONTACT SAVED // MOTH under it, MOTH from the next).
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
  const unit = () => 'FILE';
  const gateOf = (s, n) => STORY_GATES[Math.min(STORY_GATES.length - 1, Math.floor(n / s.perChapter))];
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

  // (each message knows its story and its place: the file it comes after; the intro's, before them all)
  STORIES.forEach((s) => {
    (s.intro || []).forEach((m) => { m.of = s; m.n = 0.5; });
    s.items.forEach((f) => (f.then || []).forEach((m) => { m.of = s; m.n = f.n; }));
    [...(s.extras || []), ...(s.inbox || []), ...(s.texts || [])].forEach((m) => { m.of = s; });
  });
  // (a save from before the files: GHOSTS was 24 TRANSMISSIONS, MOTH's first IM the first of them; now
  // the INTRO and 18 FILES. How far it had got, in files: each file's place in the old order)
  const OLD_AT = [3, 5, 5, 7, 7, 8, 10, 10, 12, 13, 14, 16, 18, 19, 20, 21, 23, 24];
  if ((st().v || 0) < 2) Progress.storyUpdate((S) => {
    const files = (old) => { let k = 0; while (k < OLD_AT.length && OLD_AT[k] <= old) k++; return k; };
    if ((S.got.ghosts || 0) >= 1) S.extra['intro:ghosts'] = 1;
    S.got.ghosts = files(S.got.ghosts || 0);
    S.seen.ghosts = files(S.seen.ghosts || 0);
    Object.keys(S.known || {}).forEach((k) => { if (/^ghosts:/.test(k)) delete S.known[k]; });
    S.v = 2;
  });

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
  // till the file naming them is behind you). One of the STORY TESTER's own: as written
  const storyOf = (it) => it.of || STORIES.find((x) => x.items.includes(it) || (x.extras || []).includes(it));
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
    const r = seeded(hashString(`bytefall:im:${it.n || it.when || it.title || ''}:${it.lines.map((l) => l.t || '').join('|').slice(0, 120)}`));
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

  // A FILE's lines, and its messages', each by its look: an IM's handle (and time), a chat log's
  // <handle>, a call's ring, spoken lines and end, an email's head, notes, gaps; the words of each in a
  // .tl-t (what's typed)
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
  // (an email as it lands: its head, FROM and SUBJECT, then its words)
  const mailLines = (m) => [{ k: 'mail', t: `EMAIL // FROM: ${m.address} // SUBJECT: ${m.subject}` }, ...m.lines];
  // (a file and what comes after it, as the cracked card plays it: the file, then a call or an email
  // under it, then the IMs, a thread of their own for the phone (splitIm))
  function withThen(f) {
    const lines = [...f.lines];
    const after = f.then || [];
    after.filter((m) => m.kind !== 'im').forEach((m) => lines.push({ k: 'gap' }, ...(m.kind === 'email' ? mailLines(m) : m.lines)));
    after.filter((m) => m.kind === 'im').forEach((m) => lines.push(...m.lines));
    return { ...f, lines, of: storyOf(f) };
  }
  // (what comes before the IMs, played where it is, and the IMs, a thread of their own on the phone)
  function splitIm(it) {
    if (it.kind === 'im') return null;
    const at = it.lines.findIndex((l) => l.k === 'im' || l.k === 'you');
    if (at < 0) return null;
    const before = it.lines.slice(0, at);
    while (before.length && before[before.length - 1].k === 'gap') before.pop();
    const first = it.lines[at];
    return { before: { ...it, lines: before }, thread: { ...it, kind: 'im', lines: it.lines.slice(at) }, title: `// IM // ${contact(first.k === 'you' ? 'you' : first.who.toLowerCase(), it)}` };
  }

  // THE PLAYING: the lines from `from` on (to `to`), one after another, each the way it would come in. A
  // file's lines print out, two letters a tick, a typewriter's keys under them; an email's head lands
  // with a chime; an IM's messages land whole, a beat between them about as long as the other end would
  // take to write the next (shorter for a second message from the same hand; "..." while they type), a
  // chime as each lands; a call's words come at a speaking pace (about 150 a minute, a pause at each
  // comma and stop), a low voice down the line; its end, a note, after a beat, at once. A tap shows the
  // rest at once
  let typing = null;
  let ringing = null; // (a call's ring, every few seconds till it's answered)
  const TICK = 22; // (a file's printing: two letters a tick)
  const imBeat = (x, prev) => { const same = prev && prev.who === x.who; return Math.min(2800, (same ? 450 : 900) + x.text.length * (same ? 14 : 20)); };
  const wordMs = (w) => 80 + w.replace(/[^A-Za-z0-9']/g, '').length * 52 + (/[.?!]["']?$/.test(w) ? 380 : /[,;:—-]["']?$/.test(w) ? 200 : 0);
  const isIm = (x) => x.k === 'im' || x.k === 'you';
  // (an IM thread kept at its newest, at the bottom; the phone's clock its time)
  function toBottom(p, smooth) {
    const chat = p.closest('.sf-chat');
    if (!chat) return false;
    if (smooth && chat.dataset.held) return true; // (scrolled up to read: left there, as a phone does)
    if (smooth && chat.scrollTo) chat.scrollTo({ top: chat.scrollHeight, behavior: 'smooth' });
    else chat.scrollTop = chat.scrollHeight;
    const ph = p.dataset.time && chat.closest('.phone-screen');
    const clock = ph && ph.querySelector('.ph-clock');
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
  let phoneSeq = 0; // (a phone due to pop up over the cracked card, a ring due: stop() calls them off)
  function stop() {
    phoneSeq++;
    if (ringing) { clearInterval(ringing); ringing = null; }
    skip();
  }
  function typeLines(host, from = 0, whole = false, done = null, to = Infinity) {
    skip();
    const caret = document.createElement('span');
    caret.className = 'sf-caret';
    const targets = [...host.querySelectorAll('.tl')].slice(from, to).map((p) => { const sp = p.querySelector('.tl-t'); return { p, sp, k: p.classList[1].slice(3), who: p.dataset.who, text: sp ? sp.textContent : '' }; });
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
      later(lead ? 0 : 600, () => { // (an email's head, a call's end, a note: at once, after a beat)
        x.sp.textContent = x.text;
        show(x);
        if (x.k === 'end') SFX.hangup();
        if (x.k === 'mail') SFX.incoming();
        next(i + 1);
      });
    };
    next(0);
  }
  // A call rings (a voicemail doesn't: it's waiting): what comes before it printed first (its file),
  // then the ring, ANSWER on it, the rest once it's answered (or at once, with no ring)
  function play(host, it, whole = false, done = null) {
    stop();
    const ring = it.lines.findIndex((l) => l.k === 'ring');
    if (ring < 0 || whole) { typeLines(host, 0, whole, done); return; }
    const ps = [...host.querySelectorAll('.tl')];
    ps.slice(ring).forEach((p) => p.classList.add('tl-wait'));
    const seq = phoneSeq; // (after this play's stop(): a stop() from here on calls the ring off)
    const rang = () => {
      if (seq !== phoneSeq || !host.isConnected) return;
      const ringEl = ps[ring];
      ringEl.classList.remove('tl-wait');
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
    };
    if (ring > 0) typeLines(host, 0, false, rang, ring);
    else rang();
  }

  // THE CRACKED CARD: the file this key recovered, typed out, and what comes after it (or that the
  // next one's under a deeper key)
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
    if (bits < gate) { // (too shallow for the next one: a deeper key, how deep and how strong not given away)
      host.classList.add('locked');
      host.innerHTML = `<p class="sf-head">${esc(s.title)} // ${unit(s)} ${n + 1} OF ${count(s)} // ENCRYPTED DEEPER</p>`
        + `<p class="sf-noise">${noise(`${s.id}:${n}`)}</p>`
        + `<p class="sf-body">${unit(s)} ${n + 1} is under a deeper key than this one. GO DEEPER to recover it.</p>`;
      return;
    }
    Progress.storyRecover(s.id);
    const it = s.items[n];
    for (const [id, k] of Object.entries(it.gifts || {})) Progress.storyKitAdd(id, k); // (MOTH's gifts, to the kit)
    const c = withThen(it);
    const sp = splitIm(c); // (its IMs: on the phone after it)
    host.innerHTML = `<p class="sf-head">RECOVERED // ${esc(s.title)} // ${unit(s)} ${n + 1} OF ${count(s)}</p><p class="sf-doc">${esc(kindLine(it))}</p>`
      + linesHtml(sp ? sp.before : c) + (sp ? threadHtml(sp.thread, 'sf') : '') + footHtml(it);
    host.onclick = skip; // (a tap: the whole of it at once)
    if (sp) host.querySelector('.sf-open').addEventListener('click', (e) => { e.stopPropagation(); phoneThread(sp.thread, { whole: true }); });
    if (card && host.scrollHeight > host.clientHeight + 1) card.classList.add('tight'); // (measured whole first)
    let seq = -1;
    play(host, sp ? sp.before : c, false, sp ? () => setTimeout(() => { if (seq === phoneSeq && !host.hidden && host.isConnected) phoneThread(sp.thread); }, 900) : null);
    seq = phoneSeq; // (after play's own stop(): a stop() from here on calls the phone off)
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

  // THE ARCHIVE: RULES & RECORDS' tab (#archive-body), and the phone's ARCHIVE app (o.phone: a story
  // opened as the phone's next screen, its BACK the phone's)
  let view = null; // (the tab's: a story's id, or null for the list of them)
  const bodyEl = () => document.getElementById('archive-body');
  const RULE = '<div class="store-rule" aria-hidden="true">================================================================================</div>';
  function render(el = bodyEl(), o = {}) {
    if (!el) return;
    if (window.STORY_SOON) { // (the Play release, till the story's done)
      el.innerHTML = '<p class="archive-note"><b>STORY // COMING SOON.</b> A story to decrypt, one key at a time: every key you crack brings the next file, and they\'ll all be kept here.</p>';
      return;
    }
    const id = o.phone ? o.story : view;
    const s = id && byId(id);
    if (!s || !isOpen(s)) { if (!o.phone) view = null; listView(el, o); } else storyView(el, s, o);
    marks();
  }
  function listView(el, o) {
    const pick = picked();
    el.innerHTML = `<p class="archive-note">Every key cracked in STORY (tap CLASSIC again on the main menu) brings the next file of the story you're decrypting. Deeper chapters need deeper keys.</p>`
      + '<button type="button" class="archive-back archive-intro">READ THE INTRO</button>'
      + STORIES.map((s) => {
        if (!isOpen(s)) { // (a season still to come: every line ENCRYPTED, noise as long as what it covers: its name, what it's about, how far)
          const enc = (k, len) => `<span class="as-enc">${noise(`${s.id}:${k}`, len)}</span>`;
          return `<button type="button" class="archive-story locked" data-story="${s.id}" aria-label="Season ${s.season}: encrypted">`
            + `<span class="as-top"><span class="as-title">SEASON ${s.season} // ${enc('title', s.title.length)}</span></span>`
            + `<span class="as-blurb">${enc('blurb', s.blurb.length)}</span>`
            + `<span class="as-state">${enc('state', `0 / ${count(s)} ${unit(s)}S // NOT STARTED`.length)}</span></button>`;
        }
        const state = done(s) ? 'COMPLETE' : s === pick ? 'DECRYPTING' : `${got(s) ? 'PAUSED' : 'NOT STARTED'}`;
        const news = fresh(s) ? `<span class="archive-new">${fresh(s)} NEW</span>` : '';
        return `<button type="button" class="archive-story${s === pick ? ' on' : ''}" data-story="${s.id}">`
          + `<span class="as-top"><span class="as-title">SEASON ${s.season} // ${esc(s.title)}</span>${news}</span>`
          + `<span class="as-blurb">${esc(s.blurb)}</span>`
          + `<span class="as-state">${got(s)} / ${count(s)} ${unit(s)}S // ${state}</span></button>`;
      }).join('');
    el.querySelector('.archive-intro').addEventListener('click', () => {
      SFX.play('click');
      if (o.phone) document.getElementById('story-msg-close').click(); // (the phone put down first: the terminal's on the computer)
      if (typeof openStoryIntro === 'function') openStoryIntro();
    });
    el.querySelectorAll('.archive-story').forEach((b) => b.addEventListener('click', () => {
      const s = byId(b.dataset.story);
      if (!isOpen(s)) {
        SFX.play('denied');
        cardNotice('ENCRYPTED');
        return;
      }
      SFX.play('click');
      if (o.phone) go({ app: 'archive', story: s.id });
      else openStory(s.id);
    }));
  }
  function storyView(el, s, o) {
    const pick = picked();
    const n = got(s);
    const seen = Math.min(n, st().seen[s.id] || 0);
    const pickBtn = done(s) ? '<p class="archive-state">COMPLETE: EVERY FILE RECOVERED</p>'
      : `<button type="button" class="archive-pick${s === pick ? ' on' : ''}"${s === pick ? ' aria-pressed="true"' : ''}>${s === pick ? 'DECRYPTING THIS STORY' : 'DECRYPT THIS STORY'}</button>`;
    let html = (o.phone ? '' : '<button type="button" class="archive-back archive-all">&larr; ALL STORIES</button>')
      + `<h3 class="archive-title">SEASON ${s.season} // ${esc(s.title)}</h3><p class="archive-blurb">${esc(s.blurb)}</p>${pickBtn}`;
    // (each file recovered with what came after it; the rest ENCRYPTED, how deep their key not said;
    // a chapter's name and depth once one of its files is in)
    s.chapters.forEach((name, c) => {
      let files = '';
      for (let i = c * s.perChapter; i < Math.min(count(s), (c + 1) * s.perChapter); i++) {
        const it = s.items[i];
        if (i >= n) {
          files += `<div class="archive-file locked"><p class="af-head">${unit(s)} ${i + 1} // ENCRYPTED // <span class="af-enc">${noise(`${s.id}:gate:${i}`, 9)}</span></p><p class="af-noise">${noise(`${s.id}:${i}`)}</p></div>`;
          continue;
        }
        const w = withThen(it);
        const sp = splitIm(w);
        files += `<div class="archive-file${i >= seen ? ' new' : ''}" data-i="${i}"><p class="af-head">${unit(s)} ${i + 1} // ${esc(kindLine(it).replace(/^FILE \/\/ /, ''))}${i >= seen ? ' <b>NEW</b>' : ''}</p>`
          + `${sp ? linesHtml(sp.before) + threadHtml(sp.thread, 'af') : linesHtml(w)}${footHtml(it).replace(/sf-reveal/g, 'af-reveal')}</div>`;
      }
      html += RULE + `<p class="archive-chapter">// CHAPTER ${c + 1}: ${n > c * s.perChapter ? `${esc(name)} <span>${gateText(STORY_GATES[c])}</span>` : `ENCRYPTED <span class="af-enc">${noise(`${s.id}:chapter:${c}`, 9)}</span>`}</p>${files}`;
    });
    const had = (s.extras || []).filter((x) => Progress.storyExtraHad(x.when));
    if (had.length) {
      html += `${RULE}<p class="archive-chapter">// OFF THE RECORD</p>`
        + had.map((x) => `<div class="archive-file" data-x="${x.when}"><p class="af-head">${x.kind === 'call' ? 'VOICEMAIL' : 'IM'} // ${fromLabel(x.from, x)}</p>${x.kind === 'im' ? threadHtml(x, 'af') : linesHtml(x)}</div>`).join('');
    }
    el.innerHTML = html;
    const all = el.querySelector('.archive-all');
    if (all) all.addEventListener('click', () => { SFX.play('click'); view = null; render(); top(el, o); });
    el.querySelectorAll('.archive-file .sf-open').forEach((b) => b.addEventListener('click', () => { // (an IM: on the phone, whole)
      const f = b.closest('.archive-file');
      const it = f.dataset.x ? s.extras.find((x) => x.when === f.dataset.x) : splitIm(withThen(s.items[Number(f.dataset.i)])).thread;
      phoneThread(it, { whole: true });
    }));
    const pb = el.querySelector('.archive-pick');
    if (pb) pb.addEventListener('click', () => {
      if (s === pick) return;
      SFX.play('punct');
      Progress.storyPick(s.id);
      render(el, o);
      refreshRow();
    });
    Progress.storyRead(s.id); // (seen now: marked NEW this time, not the next)
  }
  function top(el, o) {
    if (o && o.phone) { el.scrollTop = 0; return; }
    const box = typeof menuScroller === 'function' && menuScroller();
    if (box) box.scrollTop = 0;
  }
  function openStory(id) {
    view = id;
    render();
    top();
  }
  // (new files: a dot on the ARCHIVE tab and the menu's story button)
  function marks() {
    if (window.STORY_SOON) return;
    const any = STORIES.some((s) => isOpen(s) && fresh(s) > 0);
    for (const el of document.querySelectorAll('.menu-tabs [data-pane="archive"], #story-row button')) el.classList.toggle('has-unread', any);
  }

  // THE UNPROMPTED MESSAGES: due (its moment, after its file, never before), it's kept as had at once
  // and waits for the main menu, where it shows (showDue)
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
  // (a card over everything, its lines played: an IM on the phone, the rest (a voicemail, the STORY
  // TESTER's files) typed out; foot: what it introduces and gives under it, as on the cracked card;
  // whole: at once)
  function showCard(title, it, foot = false, whole = false) {
    if (it.kind === 'im') return phoneThread(it, { whole, foot: foot ? footHtml(it) : '' });
    const el = document.getElementById('story-msg');
    if (!el) return false;
    leave();
    const sp = !whole && splitIm(it); // (a file or call ending in IMs: it here, then the phone)
    if (sp) it = sp.before;
    el.querySelector('.story-msg-box').classList.remove('phone');
    document.getElementById('story-msg-title').textContent = title;
    const body = document.getElementById('story-msg-body');
    body.innerHTML = linesHtml(it) + (foot ? footHtml(it) : '');
    body.onclick = skip; // (a tap: the whole of it at once)
    el.classList.remove('hidden');
    let seq = -1;
    play(body, it, whole, sp ? () => setTimeout(() => { if (seq === phoneSeq && !el.classList.contains('hidden')) phoneThread(sp.thread, { foot: foot ? footHtml(it) : '' }); }, 900) : null);
    seq = phoneSeq;
    SFX.play('click');
    return true;
  }
  // (the STORY TESTER's: anything of a story's, played as it comes in the game)
  function preview(it, title) {
    if (it.kind === 'file') return showCard(title, withThen(it), true);
    if (it.kind === 'email') return showCard(title, { kind: 'email', of: storyOf(it), lines: mailLines(it) }, true);
    return showCard(title, it, true);
  }

  // EACH FILE ITS OWN KEY (script.js's ENCRYPTION STRENGTH): a file's strength, the points its key takes,
  // staggered through its story, the same every time: mostly a little higher than the last (now and then
  // level, or a touch lower), now and then a jump of 250 to 600, the one after a jump 100 to 250 lower;
  // from 1,250 at the start to about 2,500 to 3,000 at the end.
  // nextKey: the key for the next file at this depth, null when the key's too shallow for the next
  // file's chapter or every story's read
  const strengthsOf = {};
  function strengths(s) {
    if (strengthsOf[s.id]) return strengthsOf[s.id];
    const r = seeded(hashString(`bytefall:keys:${s.id}`));
    const step = 900 / count(s);
    const out = [];
    let v = 1250;
    let jumped = false;
    for (let i = 0; i < count(s); i++) {
      if (jumped) { v -= 100 + r() * 150; jumped = false; } // (after a jump: a little lower)
      else if (i > 1 && r() < 0.2) { v += 250 + r() * 350; jumped = true; } // (now and then a jump)
      else if (i > 1) v += step * (-0.4 + r() * 2.4); // (mostly: a little higher)
      out.push(Math.round(v / 50) * 50);
    }
    strengthsOf[s.id] = out;
    return out;
  }
  function nextKey(bits) {
    if (window.STORY_SOON) return null;
    const s = picked();
    if (!s || done(s)) return null;
    const n = got(s);
    if (bits < gateOf(s, n)) return null;
    return { id: `${s.id}:${n}`, strength: strengths(s)[n] };
  }
  // THE INTRO (GHOSTS'): its email, the archive attached (in MAIL), and MOTH's first IM, popping up on
  // the phone as the first STORY game starts, the files just landed. (firstDue: still to come, so
  // STORY's PLAY plays the terminal intro before it, script.js's storyTerminal)
  const introHad = (s) => !(s.intro && s.intro.length) || Progress.storyExtraHad(`intro:${s.id}`);
  function firstDue() {
    if (window.STORY_SOON) return null;
    const s = picked();
    return s && !done(s) && !introHad(s) ? s : null;
  }
  function atStart() {
    const s = firstDue();
    if (!s) return false;
    Progress.storyExtraSet(`intro:${s.id}`);
    const im = s.intro.find((m) => m.kind === 'im');
    if (im) phoneThread(im);
    marks();
    refreshRow();
    if (typeof refreshPhoneBtn === 'function') refreshPhoneBtn(); // (the phone, yours now)
    return true;
  }

  // THE PHONE'S MESSAGES, MAIL AND CALLS: what's come so far, each at its place in the story (the
  // intro's, then the files' in order; the inbox's ordinary ones from the start or with their file)
  const started = () => STORIES.some((s) => s.intro && s.intro.length && introHad(s));
  function pieces(kind) {
    const out = [];
    STORIES.forEach((s) => {
      const on = s.intro && s.intro.length ? introHad(s) : got(s) > 0;
      if (!on) return;
      (s.intro || []).filter((m) => m.kind === kind).forEach((m) => out.push({ it: m, at: 0.5, s }));
      s.items.slice(0, got(s)).forEach((f) => (f.then || []).filter((m) => m.kind === kind).forEach((m) => out.push({ it: m, at: f.n, s })));
      (s.extras || []).forEach((x) => { if (x.kind === kind && Progress.storyExtraHad(x.when)) out.push({ it: x, at: x.after + 0.5, s }); });
      const own = kind === 'im' ? s.texts : kind === 'email' ? s.inbox : null;
      (own || []).forEach((x) => { if (x.at <= got(s)) out.push({ it: x, at: x.at ? x.at - 0.2 : 0, s }); });
    });
    return out.sort((a, b) => a.at - b.at);
  }
  const whoOf = (it) => { const l = it.lines.find((x) => x.k === 'im'); return l ? l.who.toLowerCase() : ''; };
  const hasPhone = () => !window.STORY_SOON && started();
  const asNow = (p) => ({ kind: 'im', lines: [], n: p.at, of: p.s }); // (names as you know them now: as of the newest)
  // (a contact's thread, every message from them so far, each at its own time)
  function threadOf(who) {
    const all = pieces('im').filter((p) => whoOf(p.it));
    const mine = all.filter((p) => whoOf(p.it) === who);
    if (!mine.length) return null;
    const lines = [];
    mine.forEach((p, i) => {
      const times = stamps(p.it);
      if (i) lines.push({ k: 'gap' });
      p.it.lines.forEach((l, j) => lines.push(times[j] ? { ...l, time: times[j] } : l));
    });
    return { ...asNow(all[all.length - 1]), lines };
  }
  // (the clock: the newest message's time; past midnight before any)
  function nowClock() {
    const all = pieces('im');
    const last = all.length ? stamps(all[all.length - 1].it).filter(Boolean).pop() : '';
    return last || '02:14';
  }
  // (an email's time: the intro's a minute before MOTH's first text; an ordinary one there from the
  // start, days old; the rest, late at night)
  const mailTime = (m) => {
    if (m.n === 0.5) return '02:13';
    const r = seeded(hashString(`bytefall:mail:${m.subject}`));
    if (m.from === 'inbox' && !m.at) return ['MON', 'TUE', 'WED', 'YESTERDAY'][Math.floor(r() * 4)];
    return `${String([23, 0, 1, 2, 3][Math.floor(r() * 5)]).padStart(2, '0')}:${String(Math.floor(r() * 60)).padStart(2, '0')}`;
  };
  const mailFrom = (m) => (m.from === 'moth' && /no address/i.test(m.address) ? '(NO ADDRESS)' : m.address);
  const callDur = (it) => { const e = it.lines.find((l) => l.k === 'end'); const m = e && /(\d+:\d{2})/.exec(e.t); return m ? m[1] : ''; };

  // THE PHONE: yours, over everything (#story-msg as .phone, one size, a phone's 9:19.5): its status bar,
  // a screen (an app), and its nav bar under it, always there and working: BACK (the screen before;
  // from the home screen, the phone put down), HOME (the home screen) and MENU (the apps used lately,
  // a tap going back to one). The home screen's apps: MESSAGES (the conversations, the newest first, a
  // tap opening one), MAIL (the inbox: the story's emails and ordinary ones), CALLS (every call and
  // voicemail, a tap reading it again), ARCHIVE (the stories' files, to read), GAMES (a folder of THE
  // ARCADE's games, each played on the phone: arcade.html?phone in a frame) and a few with nothing in
  // them yet (CAMERA, NOTES, MAPS, WEATHER). OK under it puts it down too
  const ICON = (paths) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
  const APPS = [
    { id: 'messages', name: 'MESSAGES', icon: '<path d="M4 5h16v11H9l-5 4z"/>' },
    { id: 'mail', name: 'MAIL', icon: '<rect x="3" y="6" width="18" height="12" rx="1.5"/><path d="M3.5 7l8.5 6 8.5-6"/>' },
    { id: 'calls', name: 'CALLS', icon: '<path d="M6.5 3.5h3l1.5 4.5-2 1.5a10 10 0 0 0 5.5 5.5l1.5-2 4.5 1.5v3a2 2 0 0 1-2 2A15.5 15.5 0 0 1 4.5 5.5a2 2 0 0 1 2-2z"/>' },
    { id: 'archive', name: 'ARCHIVE', icon: '<path d="M3 5h6.5l2 2.5H21V19H3z M3 10h18"/>' },
    { id: 'games', name: 'GAMES', folder: true },
    { id: 'camera', name: 'CAMERA', icon: '<rect x="3" y="7" width="18" height="12" rx="2"/><circle cx="12" cy="13" r="3.5"/><path d="M8.5 7l1.5-2.5h4L15.5 7"/>', note: ['LENS COVERED', 'A strip of tape over it. Good habit.'] },
    { id: 'notes', name: 'NOTES', icon: '<rect x="5" y="3" width="14" height="18" rx="1.5"/><path d="M8.5 8h7M8.5 12h7M8.5 16h4"/>', note: ['NO NOTES', 'Nothing written down. Nothing to find.'] },
    { id: 'maps', name: 'MAPS', icon: '<path d="M12 21s-6-6.2-6-11a6 6 0 0 1 12 0c0 4.8-6 11-6 11z"/><circle cx="12" cy="10" r="2.2"/>', note: ['LOCATION OFF', 'Safer that way.'] },
    { id: 'weather', name: 'WEATHER', icon: '<path d="M7 18h10a4 4 0 0 0 .5-8 5.5 5.5 0 0 0-10.6 1.5A3.3 3.3 0 0 0 7 18z"/>', note: ['NO CONNECTION', 'Try again later.'] },
  ];
  const appOf = (id) => APPS.find((a) => a.id === id);
  const GAMES = [['codebreaker', 'CODE BREAKER', 'CB'], ['trace', 'TRACE', 'TR'], ['merge', 'MERGE', 'MG'], ['checksum', 'CHECKSUM', 'CK'], ['defrag', 'DEFRAG', 'DF'], ['decode', 'DECODE', 'DC'], ['routing', 'ROUTING', 'RT']];
  const SIGNAL_SVG = '<svg viewBox="0 0 16 12" aria-hidden="true"><path d="M1 11h2V8H1zM5 11h2V6H5zM9 11h2V3H9zM13 11h2V0h-2z" fill="currentColor"/></svg>';
  const WIFI_SVG = '<svg viewBox="0 0 16 12" aria-hidden="true"><path d="M8 11.5 L1 3.5 A10 10 0 0 1 15 3.5 Z" fill="currentColor"/></svg>';
  const BATTERY_SVG = '<svg viewBox="0 0 22 12" aria-hidden="true"><rect x="0.5" y="0.5" width="18" height="11" rx="2" fill="none" stroke="currentColor"/><rect x="2" y="2" width="11" height="8" rx="1" fill="currentColor"/><rect x="19.5" y="4" width="2" height="4" rx="1" fill="currentColor"/></svg>';
  const avatarHtml = (who, name) => `<span class="ph-avatar" data-who="${esc(who)}">${name === 'UNKNOWN CONTACT' ? '?' : esc(name[0])}</span>`;
  const NAV = '<nav class="ph-nav" aria-label="Phone">'
    + `<button type="button" class="ph-nav-back" aria-label="Back">${ICON('<path d="M15.5 5.5 8 12l7.5 6.5z"/>')}</button>`
    + `<button type="button" class="ph-nav-home" aria-label="Home">${ICON('<circle cx="12" cy="12" r="6"/>')}</button>`
    + `<button type="button" class="ph-nav-menu" aria-label="Recent apps">${ICON('<rect x="6.5" y="6.5" width="11" height="11" rx="2"/>')}</button></nav>`;
  let route = null; // (the screen up: { app, and the app's own: who, i, story, game, it (a thread coming in) })
  let trail = []; // (the screens before it, for BACK)
  let recent = []; // (the apps used lately, the newest first: MENU's)
  const msgEl = () => document.getElementById('story-msg');
  // (the phone itself: built when it comes up, risen into view; kept while you move about it)
  function frame(foot = '') {
    const el = msgEl();
    const body = document.getElementById('story-msg-body');
    let ph = !el.classList.contains('hidden') && body.querySelector('.phone-screen.os');
    if (!ph) {
      body.innerHTML = `<div class="phone-screen os"><div class="ph-status"><span class="ph-clock">${nowClock()}</span><span class="ph-icons">${SIGNAL_SVG}${WIFI_SVG}${BATTERY_SVG}</span></div><div class="ph-app"></div>${NAV}</div>`;
      ph = body.querySelector('.phone-screen');
      ph.querySelector('.ph-nav-back').addEventListener('click', (e) => { e.stopPropagation(); SFX.play('click'); navBack(); });
      ph.querySelector('.ph-nav-home').addEventListener('click', (e) => { e.stopPropagation(); SFX.play('click'); trail = []; go({ app: 'home' }, false); });
      ph.querySelector('.ph-nav-menu').addEventListener('click', (e) => { e.stopPropagation(); SFX.play('click'); if (route && route.app !== 'recents') go({ app: 'recents' }); });
      body.onclick = null;
    }
    body.querySelectorAll(':scope > .sf-reveal').forEach((p) => p.remove());
    if (foot) ph.insertAdjacentHTML('afterend', foot);
    el.querySelector('.story-msg-box').classList.add('phone');
    el.classList.remove('hidden');
    return ph.querySelector('.ph-app');
  }
  // (to a screen: the one before kept for BACK, unless it's BACK or HOME going there)
  function go(r, push = true, foot = '') {
    stop(); // (a thread still coming in: all of it, now)
    if (push && route && route.app !== 'recents') trail.push(route);
    route = r;
    if (appOf(r.app)) recent = [r.app, ...recent.filter((a) => a !== r.app)].slice(0, 6);
    const screen = frame(foot);
    screen.className = `ph-app ph-app-${r.app}`;
    screen.scrollTop = 0;
    document.getElementById('story-msg-title').textContent = `// ${appOf(r.app) ? appOf(r.app).name : r.app.toUpperCase()}`;
    ({ home: drawHome, recents: drawRecents, messages: drawMessages, mail: drawMail, calls: drawCalls, archive: drawArchive, games: drawGames }[r.app] || drawNote)(screen, r);
    return true;
  }
  let leaving = 0; // (a game on the phone asked to go, saving: its answer awaited a moment)
  function navBack() {
    const f = route && route.app === 'games' && route.game && document.querySelector('#story-msg .ph-game');
    if (f && f.contentWindow && !leaving) { // (BACK in a game: the game's, which saves and says when)
      leaving = setTimeout(() => { leaving = 0; pop(); }, 400);
      f.contentWindow.postMessage({ arcade: 'back' }, '*');
      return;
    }
    pop();
  }
  function pop() {
    if (!trail.length) { document.getElementById('story-msg-close').click(); return; } // (from the first screen: put down)
    go(trail.pop(), false);
  }
  // (the phone up on a screen, with the screens a phone would have under it for BACK)
  function openTo(r, under, foot) {
    stop();
    trail = under;
    route = null;
    return go(r, false, foot);
  }
  const head = (title) => `<div class="ph-bar ph-bar-inbox"><span class="ph-title">${esc(title)}</span></div>`;
  const listHtml = (rows, empty) => `<div class="ph-list">${rows || `<span class="ph-empty">${esc(empty)}</span>`}</div>`;
  function drawHome(screen) {
    const folder = `<span class="ph-glyph ph-folder">${GAMES.slice(1, 5).map((g) => `<i>${g[2]}</i>`).join('')}</span>`;
    screen.innerHTML = `<div class="ph-home-grid">${APPS.map((a) => `<button type="button" class="ph-icon" data-app="${a.id}">${a.folder ? folder : `<span class="ph-glyph">${ICON(a.icon)}</span>`}<span class="ph-label">${a.name}</span></button>`).join('')}</div>`;
    screen.querySelectorAll('.ph-icon').forEach((b) => b.addEventListener('click', (e) => { e.stopPropagation(); SFX.play('click'); go({ app: b.dataset.app }); }));
  }
  function drawRecents(screen) {
    const rows = recent.map((id) => `<button type="button" class="ph-convo ph-recent" data-app="${id}"><span class="ph-glyph">${appOf(id).folder ? ICON('<path d="M3 5h6.5l2 2.5H21V19H3z"/>') : ICON(appOf(id).icon)}</span><span class="ph-convo-text"><span class="ph-name">${appOf(id).name}</span></span></button>`).join('');
    screen.innerHTML = head('RECENT') + listHtml(rows, 'No recent apps.');
    screen.querySelectorAll('.ph-recent').forEach((b) => b.addEventListener('click', (e) => { e.stopPropagation(); SFX.play('click'); go({ app: b.dataset.app }); }));
  }
  function drawNote(screen, r) {
    const a = appOf(r.app);
    screen.innerHTML = head(a.name) + `<div class="ph-note"><span class="ph-glyph">${ICON(a.icon)}</span><b>${esc(a.note[0])}</b><span>${esc(a.note[1])}</span></div>`;
  }
  // MESSAGES: the conversations, newest first; a thread (one coming in, or a contact's whole)
  function drawMessages(screen, r) {
    if (r.it || r.who) { drawThread(screen, r); return; }
    const all = pieces('im').filter((p) => whoOf(p.it));
    const now = all.length ? asNow(all[all.length - 1]) : null;
    const convos = [];
    [...all].reverse().forEach((p) => { const who = whoOf(p.it); if (!convos.some((c) => c.who === who)) convos.push({ who, p }); });
    const rows = convos.map(({ who, p }) => {
      const said = p.it.lines.filter((l) => l.k === 'im' || l.k === 'you');
      const last = said[said.length - 1];
      const name = contact(who, now);
      return `<button type="button" class="ph-convo" data-who="${esc(who)}">${avatarHtml(who, name)}`
        + `<span class="ph-convo-text"><span class="ph-convo-top"><span class="ph-name">${esc(name)}</span><span class="ph-convo-time">${stamps(p.it).filter(Boolean).pop() || ''}</span></span>`
        + `<span class="ph-convo-last">${last.k === 'you' ? 'You: ' : ''}${esc(last.t)}</span></span></button>`;
    }).join('');
    screen.innerHTML = head('MESSAGES') + listHtml(rows, 'No messages.');
    screen.querySelectorAll('.ph-convo').forEach((b) => b.addEventListener('click', (e) => { e.stopPropagation(); SFX.play('click'); go({ app: 'messages', who: b.dataset.who }); }));
  }
  function drawThread(screen, r) {
    const it = r.it || threadOf(r.who);
    if (!it) { screen.innerHTML = head('MESSAGES') + listHtml('', 'No messages.'); return; }
    const other = it.lines.find((l) => l.k === 'im');
    const who = other ? other.who.toLowerCase() : '';
    const name = other ? contact(who, it) : 'UNKNOWN CONTACT';
    screen.innerHTML = `<div class="ph-bar">${avatarHtml(who, name)}<span class="ph-name">${esc(name)}</span></div>`
      + linesHtml(it, 'ph-msgs')
      + '<div class="ph-input"><span class="ph-plus" aria-hidden="true">+</span><span class="ph-field">Text message</span></div>';
    const lines = screen.querySelector('.ph-msgs');
    lines.onclick = skip; // (a tap: the whole of it at once)
    // (it scrolls, as a phone's thread does: scrolled up, it stops following new ones till you're back down)
    const hold = () => { lines.dataset.held = '1'; };
    lines.addEventListener('wheel', hold, { passive: true });
    lines.addEventListener('touchmove', hold, { passive: true });
    lines.addEventListener('scroll', () => { if (lines.scrollHeight - lines.scrollTop - lines.clientHeight < 8) delete lines.dataset.held; }, { passive: true });
    play(lines, it, !r.it || r.whole);
  }
  // (an IM thread on the phone: one coming in (played), or one opened again (whole))
  function phoneThread(it, o = {}) {
    SFX.play('click');
    return openTo({ app: 'messages', it, whole: !!o.whole }, [{ app: 'home' }, { app: 'messages' }], o.foot || '');
  }
  // MAIL: the inbox, newest first; an email opened
  function drawMail(screen, r) {
    const all = pieces('email').reverse();
    if (r.i != null && all[r.i]) {
      const m = all[r.i].it;
      screen.innerHTML = head('MAIL') + `<div class="ph-mail"><p class="ph-mail-from">FROM: ${esc(mailFrom(m))}</p><p class="ph-mail-subject">${esc(m.subject)}</p>${linesHtml({ ...m, kind: 'email' }, 'ph-mail-body')}</div>`;
      return;
    }
    const rows = all.map((p, i) => `<button type="button" class="ph-convo ph-mail-row" data-i="${i}"><span class="ph-convo-text"><span class="ph-convo-top"><span class="ph-name">${esc(mailFrom(p.it))}</span><span class="ph-convo-time">${mailTime(p.it)}</span></span>`
      + `<span class="ph-mail-subj">${esc(p.it.subject)}</span><span class="ph-convo-last">${esc((p.it.lines[0] || {}).t || '')}</span></span></button>`).join('');
    screen.innerHTML = head('MAIL') + listHtml(rows, 'No mail.');
    screen.querySelectorAll('.ph-mail-row').forEach((b) => b.addEventListener('click', (e) => { e.stopPropagation(); SFX.play('click'); go({ app: 'mail', i: Number(b.dataset.i) }); }));
  }
  // CALLS: every call and voicemail, newest first; one read again
  function drawCalls(screen, r) {
    const all = pieces('call').reverse();
    if (r.i != null && all[r.i]) {
      const it = all[r.i].it;
      screen.innerHTML = head('CALLS') + linesHtml(it, 'ph-call');
      play(screen.querySelector('.ph-call'), it, true);
      return;
    }
    const rows = all.map((p, i) => `<button type="button" class="ph-convo ph-call-row" data-i="${i}">${avatarHtml('unknown', 'UNKNOWN CONTACT')}<span class="ph-convo-text"><span class="ph-convo-top"><span class="ph-name">${esc(fromLabel(p.it.from, p.it))}</span><span class="ph-convo-time">${callDur(p.it)}</span></span>`
      + `<span class="ph-convo-last">${p.it.when ? 'VOICEMAIL' : 'INCOMING CALL'}</span></span></button>`).join('');
    screen.innerHTML = head('CALLS') + listHtml(rows, 'No calls.');
    screen.querySelectorAll('.ph-call-row').forEach((b) => b.addEventListener('click', (e) => { e.stopPropagation(); SFX.play('click'); go({ app: 'calls', i: Number(b.dataset.i) }); }));
  }
  // ARCHIVE: the seasons; a story's files (the RULES & RECORDS tab's, on the phone)
  function drawArchive(screen, r) {
    screen.innerHTML = `${head(r.story && byId(r.story) ? `ARCHIVE // ${byId(r.story).title}` : 'ARCHIVE')}<div class="ph-archive"></div>`;
    render(screen.querySelector('.ph-archive'), { phone: true, story: r.story });
  }
  // GAMES: THE ARCADE's games, a folder of them; one played on the phone (arcade.html?phone, in a frame
  // drawn at a phone's width and scaled to the screen; its BACK, the phone's)
  function drawGames(screen, r) {
    if (r.game) {
      screen.innerHTML = '';
      const w = screen.clientWidth || 280;
      const h = screen.clientHeight || 520;
      const W = 360;
      const f = document.createElement('iframe');
      f.className = 'ph-game';
      f.title = (GAMES.find((g) => g[0] === r.game) || [0, 'GAME'])[1];
      f.src = `arcade.html?phone&game=${r.game}`;
      f.style.width = `${W}px`;
      f.style.height = `${Math.round((h * W) / w)}px`;
      f.style.transform = `scale(${w / W})`;
      screen.appendChild(f);
      return;
    }
    screen.innerHTML = head('GAMES') + `<div class="ph-home-grid ph-games">${GAMES.map((g) => `<button type="button" class="ph-icon" data-game="${g[0]}"><span class="ph-glyph ph-tile">${g[2]}</span><span class="ph-label">${g[1]}</span></button>`).join('')}</div>`;
    screen.querySelectorAll('.ph-icon').forEach((b) => b.addEventListener('click', (e) => { e.stopPropagation(); SFX.play('click'); go({ app: 'games', game: b.dataset.game }); }));
  }
  // (a game on the phone left: its frame says when (arcade.js, ?phone: BACK in the game))
  window.addEventListener('message', (e) => {
    if (!e.data || e.data.arcade !== 'exit' || !route || route.app !== 'games' || !route.game) return;
    clearTimeout(leaving);
    leaving = 0;
    pop();
  });
  // (the phone put down: script.js's closeStoryMsg; what was on it gone, a game's frame with it)
  function leave() {
    stop();
    route = null;
    trail = [];
    const body = document.getElementById('story-msg-body');
    if (body) body.innerHTML = '';
  }
  // (the phone button, in a STORY game: the home screen; the main menu's story button: the ARCHIVE)
  const openPhone = (app = null, o = {}) => (hasPhone() ? openTo({ app: app || 'home', ...o }, !app ? [] : o.story ? [{ app: 'home' }, { app }] : [{ app: 'home' }]) : false);

  // (back after days away: on launch, three days or more since the last STORY game)
  const AWAY_MS = 3 * 24 * 3600 * 1000;
  const last = Progress.storyLastPlayed();
  if (last && Date.now() - last >= AWAY_MS) moment('away');

  // THE MAIN MENU's story button (in STORY): which story and how far; a tap opens it in the ARCHIVE
  // (the phone's, once it's yours; RULES & RECORDS' till then)
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
    b.addEventListener('click', () => {
      SFX.play('click');
      view = s.id; // (RULES & RECORDS' ARCHIVE: the phone only comes out in a STORY game)
      setRecordsOpen(true, 'archive');
    });
    row.appendChild(b);
    marks();
  }
  // (the ARCHIVE tab wears the folder too)
  const tab = document.querySelector('.menu-tabs [data-pane="archive"] svg');
  if (tab) tab.outerHTML = FOLDER_SVG.replace('class="story-ico" ', '');
  marks();
  refreshRow();

  return { onCrack, stop, showCard, preview, kindLine, render, refreshRow, openStory, introduced, introName, moment, showDue, firstDue: () => !!firstDue(), atStart, nextKey, hasPhone, openPhone, phoneDown: leave, toList: () => { view = null; }, picked: () => picked().id };
})();
// (the game was set up at launch, before this: its first key, the next file's, now it can be told)
if (typeof refreshGoalKey === 'function') refreshGoalKey();
