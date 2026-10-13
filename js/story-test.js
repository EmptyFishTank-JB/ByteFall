// ?storytest: a bar at the bottom to review STORY's messages one by one, each played in the
// message card as the game plays it (its timing and sounds; what it introduces and gives under it).
// Nothing's recovered or saved: the stories' progress stays as it is. Every season's transmissions,
// each story's unprompted messages and the intro card are on its list. ?storytest=8 opens on GHOSTS 8.
// WRITE: a message of your own, typed in and played as the real thing, as a FILE, an IM or a CALL. Its
// lines are written as in docs/STORY-V2.md (pasted from it as they are, the "> " or not):
//   **moth** 02:14 · text   an IM line (**you** the player); in an IM, moth: text does too
//   `<handle>` text         a chat log line;  "..." a line spoken;  (...) a note;  a blank line, a gap
//   INCOMING CALL // ...    a call ringing (a CALL without one rings anyway);  CALL ENDED // ... its end
(() => {
  const q = new URLSearchParams(location.search);
  if (!q.has('storytest') || typeof STORIES === 'undefined' || typeof Stories === 'undefined') return;
  if (window.STORY_SOON) { // (STORY still locked on this device: the tester too, till it's let in from the main menu)
    const note = document.createElement('div');
    note.id = 'story-test';
    note.innerHTML = '<p class="st-count">STORY TESTER // LOCKED: STORY is COMING SOON on this device. Let it in from the main menu first.</p>';
    document.body.appendChild(note);
    return;
  }
  const pad = (n) => String(n).padStart(2, '0');
  const LABEL = { moth: 'MOTH', toll: 'TOLL', unknown: 'UNKNOWN NUMBER', archive: 'THE ARCHIVE' };
  const list = [{ label: 'THE INTRO CARD', intro: true }];
  STORIES.forEach((s) => {
    s.items.forEach((it, i) => list.push({ label: `S${s.season} ${s.title} ${pad(i + 1)} // ${Stories.kindLine(it)}`, it, title: `${s.title} // ${pad(i + 1)} OF ${s.items.length}`, shows: it.atStart ? 'pops up as the first STORY game starts' : it.job ? `a JOB later (${it.job.mode}), the cracked card for now` : 'on the cracked card' }));
    (s.extras || []).forEach((x) => list.push({ label: `S${s.season} ${s.title} OFF THE RECORD // ${x.title}`, it: x, title: `// ${x.kind === 'call' ? 'VOICEMAIL' : 'IM'} // ${LABEL[x.from] || x.from.toUpperCase()}`, shows: `unprompted, on the main menu (after transmission ${x.after})` }));
  });

  const bar = document.createElement('div');
  bar.id = 'story-test';
  bar.innerHTML = '<select aria-label="Message"></select><button type="button" data-go="-1">&lt; PREV</button><button type="button" data-go="0">PLAY</button><button type="button" data-go="1">NEXT &gt;</button><button type="button" class="st-write-btn">WRITE</button><p class="st-count"></p>'
    + '<div class="st-write" hidden><div class="st-kinds"><button type="button" data-kind="file">FILE</button><button type="button" data-kind="im">IM</button><button type="button" data-kind="call">CALL</button></div>'
    + '<input class="st-title" type="text" placeholder="TITLE (e.g. MOTH)" aria-label="Title" autocomplete="off">'
    + '<textarea class="st-text" rows="8" aria-label="Message" spellcheck="false"></textarea><button type="button" class="st-play">PLAY IT</button></div>';
  document.body.appendChild(bar);
  document.body.classList.add('storytest'); // (the cards kept clear of the bar)
  const sel = bar.querySelector('select');
  sel.innerHTML = list.map((x, i) => `<option value="${i}">${x.label.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]))}</option>`).join('');
  const count = bar.querySelector('.st-count');

  let at = 0;
  const n = Number(q.get('storytest'));
  if (n >= 1 && n <= STORIES[0].items.length) at = n; // (GHOSTS n: the list's n-th, after the intro card)
  else try { at = Math.min(list.length - 1, Number(localStorage.getItem('bytefall-storytest')) || 0); } catch (e) {}

  function show() {
    const ss = document.getElementById('start-screen'); // (the title screen out of the way: the card's under it)
    if (ss) ss.hidden = true;
    const x = list[at];
    sel.value = String(at);
    try { localStorage.setItem('bytefall-storytest', String(at)); } catch (e) {}
    Stories.stop();
    document.getElementById('story-msg').classList.add('hidden');
    document.getElementById('story-intro').classList.add('hidden');
    if (x.intro) {
      count.textContent = `${at + 1} OF ${list.length} // shows once, the first time STORY is picked`;
      if (typeof openStoryIntro === 'function') openStoryIntro();
      return;
    }
    const chars = x.it.lines.reduce((a, l) => a + (l.t || '').length, 0);
    count.textContent = `${at + 1} OF ${list.length} // ${x.it.lines.length} lines, ${chars} characters // ${x.shows}`;
    Stories.showCard(x.title, x.it, true);
  }
  bar.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-go]'); // (PREV, PLAY, NEXT; not WRITE's)
    if (!b) return;
    const go = Number(b.dataset.go);
    at = (at + go + list.length) % list.length;
    show();
  });
  // WRITE: the message typed in, read line by line as tools/story-from-md.js reads the doc's
  const DRAFT = 'bytefall-storytest-draft';
  const write = bar.querySelector('.st-write');
  const text = bar.querySelector('.st-text');
  const title = bar.querySelector('.st-title');
  let kind = 'im';
  const SAMPLE = { file: '`<dir.vance>` this stays in the room.\n`<ops.reyes>` understood.\nRECORD SEALED // HALCYON', im: '**moth** · you there, ghost?\n**you** · here.\n**moth** · good. listen.', call: '"Good evening. Please don\'t hang up."\n"I\'ll be brief."\nCALL ENDED // 0:12' };
  try { const d = JSON.parse(localStorage.getItem(DRAFT) || 'null'); if (d) { kind = d.kind; text.value = d.text; title.value = d.title; } } catch (e) {}
  if (!text.value) text.value = SAMPLE[kind];
  const kinds = () => bar.querySelectorAll('.st-kinds button').forEach((b) => b.classList.toggle('on', b.dataset.kind === kind));
  kinds();
  const save = () => { try { localStorage.setItem(DRAFT, JSON.stringify({ kind, text: text.value, title: title.value })); } catch (e) {} };
  text.addEventListener('input', save);
  title.addEventListener('input', save);
  bar.querySelector('.st-kinds').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    const was = text.value.trim() === SAMPLE[kind].trim();
    kind = b.dataset.kind;
    if (was || !text.value.trim()) text.value = SAMPLE[kind]; // (an untouched sample: this kind's)
    kinds();
    save();
  });
  function line(raw) {
    const t = raw.replace(/^>\s?/, '').trim();
    if (!t) return { k: 'gap' };
    let m = /^\*\*([^*]+)\*\*\s*(\d{1,2}:\d{2})?\s*·\s*(.*)$/.exec(t);
    if (!m && kind === 'im') m = /^([A-Za-z][\w. ]{0,15}):\s*()(.*)$/.exec(t);
    if (m) return { k: m[1].trim().toLowerCase() === 'you' ? 'you' : 'im', who: m[1].trim(), ...(m[2] ? { time: m[2] } : {}), t: m[3] };
    m = /^`?<([^>]+)>`?\s*(.*)$/.exec(t);
    if (m) return { k: 'chat', who: m[1], t: m[2] };
    if (/^(INCOMING CALL|VOICEMAIL)\b/.test(t)) return { k: 'ring', t };
    if (/^CALL ENDED\b/.test(t)) return { k: 'end', t };
    if (/^".*"$/.test(t)) return { k: 'voice', t };
    if (/^\(.*\)$/.test(t)) return { k: 'note', t };
    return { k: 'line', t };
  }
  bar.querySelector('.st-write-btn').addEventListener('click', () => { write.hidden = !write.hidden; });
  bar.querySelector('.st-play').addEventListener('click', () => {
    const lines = text.value.replace(/\s+$/, '').split('\n').map(line);
    while (lines.length && lines[0].k === 'gap') lines.shift();
    if (!lines.length) return;
    write.hidden = true; // (folded away, the card in view; WRITE opens it again, the text kept)
    const name = title.value.trim().toUpperCase() || ({ file: 'THE ARCHIVE', im: 'MOTH', call: 'UNKNOWN NUMBER' })[kind];
    if (kind === 'call' && !lines.some((l) => l.k === 'ring')) lines.unshift({ k: 'ring', t: `INCOMING CALL // ${name}` });
    const ss = document.getElementById('start-screen');
    if (ss) ss.hidden = true;
    document.getElementById('story-intro').classList.add('hidden');
    count.textContent = `YOURS // ${lines.length} lines, ${lines.reduce((a, l) => a + (l.t || '').length, 0)} characters`;
    Stories.showCard(`${kind.toUpperCase()} // ${name}`, { kind, lines });
  });
  sel.addEventListener('change', () => { at = Number(sel.value); show(); });
  setTimeout(show, 600); // (the page settled first)
})();
