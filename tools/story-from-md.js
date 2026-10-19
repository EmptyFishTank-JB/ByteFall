// STORY's text from its doc: reads docs/STORY-V2.md (GHOSTS) and writes js/data/story-ghosts.js, so the
// doc stays the one place the words are written. Edit the doc, then: node tools/story-from-md.js
// What it reads, under "## THE STORY":
//   ### Chapter N: NAME (gate)                       a chapter
//   **FILE N // SOURCE** · ... · **JOB: ...**         a file from the archive, its key's (a JOB noted)
//   **THEN // IM|CALL // WHO** · ...                  a message after the file before it: an IM, a call
//   **THEN // EMAIL // FROM: x // SUBJECT: y** · ...  an email after it
//   **INTRO // ...**                                  a message of the terminal intro's (before any file;
//                                                    "first STORY game starts": the phone, then)
//   **MAIL // FROM: x // SUBJECT: y** · *with file N* THE INBOX's ordinary emails ("there from the start": 0)
//   **TEXT // FROM: x** · *with file N*               and its ordinary texts, a thread on the phone
//   > lines                                           its lines, each read by its look:
//     **name** 02:14 · text   an IM line (time optional; **you** is the player)
//     `<handle>` text         a chat log line in a file
//     INCOMING CALL // ...    a call ringing;  "..." a line spoken;  CALL ENDED // ... its end
//     (...)                   a note;  > alone, a gap;  anything else, a plain line
// and, under "### Unprompted contact", the messages that come outside the cracks (traced, DISCONNECT,
// back after days away; "(after file N)")
// Everything else in the doc (the italic notes, the tables) is for people, not the game: what each
// file introduces lives in js/data/stories.js.
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'docs', 'STORY-V2.md');
const OUT = path.join(ROOT, 'js', 'data', 'story-ghosts.js');
const md = fs.readFileSync(SRC, 'utf8').split('\n');

const start = md.findIndex((l) => /^## THE STORY/.test(l));
if (start < 0) throw new Error('story-from-md: no "## THE STORY" section in docs/STORY-V2.md');
const chapters = [];
const items = [];
let cur = null;
const SENDER = { MOTH: 'moth', TOLL: 'toll' };
function line(raw) {
  const t = raw.replace(/^>\s?/, '').trim();
  if (!t) return { k: 'gap' };
  let m = /^\*\*([^*]+)\*\*\s*(\d{1,2}:\d{2})?\s*·\s*(.*)$/.exec(t);
  if (m) return { k: m[1].trim().toLowerCase() === 'you' ? 'you' : 'im', who: m[1].trim(), ...(m[2] ? { time: m[2] } : {}), t: m[3] };
  m = /^`<([^>]+)>`\s*(.*)$/.exec(t);
  if (m) return { k: 'chat', who: m[1], t: m[2] };
  if (/^INCOMING CALL\b/.test(t)) return { k: 'ring', t };
  if (/^CALL ENDED\b/.test(t)) return { k: 'end', t };
  if (/^".*"$/.test(t)) return { k: 'voice', t };
  if (/^\(.*\)$/.test(t)) return { k: 'note', t };
  return { k: 'line', t };
}
// (a message's head, KIND // the rest: an IM's or a CALL's sender, an EMAIL's FROM and SUBJECT)
function message(head, rest) {
  const kind = head.split(' // ')[0].trim().toLowerCase();
  if (!['im', 'call', 'email'].includes(kind)) throw new Error(`story-from-md: no IM, CALL or EMAIL in "${head}"`);
  const body = head.slice(head.indexOf(' // ') + 4).trim();
  const msg = { kind, lines: [] };
  if (kind === 'email') {
    const m = /^FROM: (.+?) \/\/ SUBJECT: (.+)$/.exec(body);
    if (!m) throw new Error(`story-from-md: an EMAIL with no FROM: and SUBJECT: in "${head}"`);
    msg.address = m[1].trim();
    msg.subject = m[2].trim();
    msg.from = /halcyon/i.test(msg.address) ? 'halcyon' : SENDER[msg.address] || (/no address/i.test(msg.address) ? 'moth' : msg.address.toLowerCase());
    msg.title = `${msg.address} // ${msg.subject}`;
  } else {
    msg.from = kind === 'call' ? 'unknown' : SENDER[body] || body.toLowerCase();
    msg.title = body;
  }
  if (/first STORY game starts/i.test(rest)) msg.atStart = true; // (it pops up as the first STORY game starts)
  return msg;
}
const intro = [];
const inbox = [];
const texts = [];
for (let i = start + 1; i < md.length; i++) {
  const l = md[i];
  if (/^## /.test(l)) break; // (the story's over: the tables after it are for people)
  let m = /^### Chapter (\d+): (.+?) \((.+)\)\s*$/.exec(l);
  if (m) { chapters.push({ name: m[2].trim(), gate: m[3].trim() }); continue; }
  m = /^\*\*FILE (\d+) \/\/ ([^*]+)\*\*(.*)$/.exec(l);
  if (m) { // (a FILE: a document from the archive, its key's)
    const job = /\*\*JOB: ([^*(]+?)\s*\(([^)]+)\)\*\*/.exec(m[3]);
    cur = { n: Number(m[1]), chapter: chapters.length - 1, kind: 'file', from: ['archive'], title: m[2].trim(), lines: [], then: [], ...(job ? { job: { name: job[1].trim(), mode: job[2].trim() } } : {}) };
    items.push(cur);
    continue;
  }
  m = /^\*\*(INTRO|THEN) \/\/ ([^*]+)\*\*(.*)$/.exec(l);
  if (m) { // (a message: the INTRO's, or THEN, after the file before it)
    const msg = message(m[2].trim(), m[3]);
    if (m[1] === 'INTRO') intro.push(msg);
    else if (items.length) items[items.length - 1].then.push(msg);
    else throw new Error(`story-from-md: a THEN message before any FILE: "${m[2]}"`);
    cur = msg;
    continue;
  }
  m = /^\*\*TEXT \/\/ FROM: ([^*]+)\*\*(.*)$/.exec(l);
  if (m) { // (THE INBOX's ordinary texts: a thread on the phone, there from the start or with a file)
    const at = /with file (\d+)/i.exec(m[2]);
    cur = { kind: 'im', from: m[1].trim().toLowerCase(), title: m[1].trim(), at: at ? Number(at[1]) : 0, lines: [] };
    texts.push(cur);
    continue;
  }
  m = /^\*\*MAIL \/\/ FROM: (.+?) \/\/ SUBJECT: ([^*]+)\*\*(.*)$/.exec(l);
  if (m) { // (THE INBOX: an ordinary email, there from the start or with a file)
    const at = /with file (\d+)/i.exec(m[3]);
    cur = { kind: 'email', from: 'inbox', address: m[1].trim(), subject: m[2].trim(), title: `${m[1].trim()} // ${m[2].trim()}`, at: at ? Number(at[1]) : 0, lines: [] };
    inbox.push(cur);
    continue;
  }
  if (cur && /^>/.test(l)) cur.lines.push(line(l));
  else if (cur && l.trim() && !/^>/.test(l)) cur = cur.lines.length ? null : cur; // (a note for people ends it)
}
// THE UNPROMPTED MESSAGES ("### Unprompted contact"): each a bullet, its moment in bold, (after
// transmission N), who from, and its words in backticks on the next line
const extras = [];
const ex = md.findIndex((l) => /^### Unprompted contact/.test(l));
for (let i = ex + 1; ex >= 0 && i < md.length && !/^##/.test(md[i]); i++) {
  const m = /^- \*\*(.+?)\*\* \(after file (\d+)\)\. (IM|Voicemail) from ([A-Z ]+):/.exec(md[i]);
  if (!m) continue;
  const words = /`(.+)`/.exec(md[i + 1] || '');
  if (!words) throw new Error(`story-from-md: no words in backticks under "${m[1]}"`);
  const when = /traced/i.test(m[1]) ? 'traced' : /disconnect/i.test(m[1]) ? 'disconnect' : /back after/i.test(m[1]) ? 'away' : null;
  if (!when) throw new Error(`story-from-md: an unprompted message the game has no moment for: "${m[1]}"`);
  const from = m[3] === 'Voicemail' ? 'unknown' : SENDER[m[4].trim()] || m[4].trim().toLowerCase();
  extras.push({ when, title: m[1], after: Number(m[2]), kind: m[3] === 'Voicemail' ? 'call' : 'im', from, lines: m[3] === 'Voicemail'
    ? [{ k: 'ring', t: `VOICEMAIL // ${m[4].trim()}` }, line(`> ${words[1]}`)]
    : [{ k: from === 'you' ? 'you' : 'im', who: m[4].trim() === 'TOLL' ? 'TOLL' : m[4].trim().toLowerCase(), t: words[1] }] });
}
const tidy = (x, what) => {
  if (!x.lines.length) throw new Error(`story-from-md: ${what} has no lines`);
  while (x.lines.length && x.lines[x.lines.length - 1].k === 'gap') x.lines.pop();
};
items.forEach((it, k) => {
  if (it.n !== k + 1) throw new Error(`story-from-md: file ${it.n} out of order (expected ${k + 1})`);
  tidy(it, `file ${it.n}`);
  it.then.forEach((x) => tidy(x, `a message after file ${it.n}`));
});
intro.forEach((x) => tidy(x, 'an INTRO message'));
inbox.forEach((x) => tidy(x, `the inbox's "${x.subject}"`));
texts.forEach((x) => tidy(x, `the texts from ${x.title}`));
const out = `// GENERATED by tools/story-from-md.js from docs/STORY-V2.md: don't edit here. Edit the doc, then run
// node tools/story-from-md.js. (What each file introduces: js/data/stories.js's GHOSTS_RULES)
const GHOSTS_TEXT = ${JSON.stringify({ chapters, intro, items, extras, inbox, texts }, null, 1).replace(/\n\s*/g, ' ').replace(/\{ "n"/g, '\n  { "n"').replace(/\] \}$/, '\n] }')};
`;
fs.writeFileSync(OUT, out);
console.log(`story-from-md: ${items.length} files in ${chapters.length} chapters, ${items.reduce((n, it) => n + it.then.length, 0)} messages after them, ${intro.length} intro, ${extras.length} unprompted, ${inbox.length} emails and ${texts.length} texts in the inbox -> js/data/story-ghosts.js`);
