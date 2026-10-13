// STORY's text from its doc: reads docs/STORY-V2.md (GHOSTS) and writes js/data/story-ghosts.js, so the
// doc stays the one place the words are written. Edit the doc, then: node tools/story-from-md.js
// What it reads, under "## THE STORY":
//   ### Chapter N: NAME (gate)                     a chapter
//   **N // KIND // SOURCE** · ... · **JOB: ...**    a transmission (KIND: FILE, IM or CALL; a JOB noted)
//   > lines                                         its lines, each read by its look:
//     **name** 02:14 · text   an IM line (time optional; **you** is the player)
//     `<handle>` text         a chat log line in a file
//     INCOMING CALL // ...    a call ringing;  "..." a line spoken;  CALL ENDED // ... its end
//     (...)                   a note;  > alone, a gap;  anything else, a plain line
// and, under "### Unprompted contact", the messages that come outside the cracks (traced, DISCONNECT,
// back after days away)
// Everything else in the doc (the italic notes, the tables) is for people, not the game: what each
// transmission introduces lives in js/data/stories.js.
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
for (let i = start + 1; i < md.length; i++) {
  const l = md[i];
  if (/^## /.test(l)) break; // (the story's over: the tables after it are for people)
  let m = /^### Chapter (\d+): (.+?) \((.+)\)\s*$/.exec(l);
  if (m) { chapters.push({ name: m[2].trim(), gate: m[3].trim() }); continue; }
  m = /^\*\*(\d+) \/\/ ([^*]+)\*\*(.*)$/.exec(l);
  if (m) {
    const head = m[2].trim();
    const kind = head.split(' // ')[0].trim().toLowerCase();
    if (!['file', 'im', 'call'].includes(kind)) throw new Error(`story-from-md: transmission ${m[1]}: no FILE, IM or CALL in "${head}"`);
    const from = [];
    for (const [, k, who] of head.matchAll(/\b(IM|CALL|FILE) \/\/ ([A-Z][A-Z ]*[A-Z])/g)) {
      const id = k === 'FILE' ? 'archive' : k === 'CALL' ? 'unknown' : SENDER[who] || who.toLowerCase();
      if (!from.includes(id)) from.push(id);
    }
    const job = /\*\*JOB: ([^*(]+?)\s*\(([^)]+)\)\*\*/.exec(m[3]);
    cur = { n: Number(m[1]), chapter: chapters.length - 1, kind, from, title: head.slice(head.indexOf(' // ') + 4), lines: [], ...(job ? { job: { name: job[1].trim(), mode: job[2].trim() } } : {}) };
    items.push(cur);
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
  const m = /^- \*\*(.+?)\*\* \(after transmission (\d+)\)\. (IM|Voicemail) from ([A-Z ]+):/.exec(md[i]);
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
items.forEach((it, k) => {
  if (it.n !== k + 1) throw new Error(`story-from-md: transmission ${it.n} out of order (expected ${k + 1})`);
  if (!it.lines.length) throw new Error(`story-from-md: transmission ${it.n} has no lines`);
  while (it.lines.length && it.lines[it.lines.length - 1].k === 'gap') it.lines.pop();
});
const out = `// GENERATED by tools/story-from-md.js from docs/STORY-V2.md: don't edit here. Edit the doc, then run
// node tools/story-from-md.js. (What each transmission introduces: js/data/stories.js's GHOSTS_RULES)
const GHOSTS_TEXT = ${JSON.stringify({ chapters, items, extras }, null, 1).replace(/\n\s*/g, ' ').replace(/\{ "n"/g, '\n  { "n"').replace(/\] \}$/, '\n] }')};
`;
fs.writeFileSync(OUT, out);
console.log(`story-from-md: ${items.length} transmissions in ${chapters.length} chapters, ${extras.length} unprompted messages -> js/data/story-ghosts.js`);
