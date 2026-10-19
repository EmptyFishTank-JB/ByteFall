// THE STORIES, in seasons (js/stories.js, docs/STORY-V2.md, docs/STORIES.md). Each key cracked brings the
// next piece of the story being decrypted, shown on the cracked card and kept in the ARCHIVE; a
// chapter's pieces only come from keys at least its gate deep (any key, then 256-BIT, then 512-BIT). A
// story finished opens the next.
// SEASON 1, GHOSTS: 24 transmissions (FILE, IM, CALL), 8 a chapter. Its words are in
// js/data/story-ghosts.js, made from docs/STORY-V2.md by tools/story-from-md.js; what each one
// introduces (exploits, BLACK BOXES, patches, and the stages: 'infections', 'market', 'bring') and the
// patches MOTH gifts to the kit are here, by transmission number.
const GHOSTS_RULES = {
  3: { introduces: ['bitflip'] },
  5: { introduces: ['head-start'], gifts: { 'head-start': 2 } },
  7: { introduces: ['rng', 'buffer-overflow'] },
  8: { introduces: ['infections'] },
  10: { introduces: ['lookahead', 'trojan'], gifts: { lookahead: 2 } },
  12: { introduces: ['market'], names: ['moth'] }, // ("Say the moth sent you": an UNKNOWN CONTACT till now)
  13: { introduces: ['box-1'] },
  15: { introduces: ['bring'] },
  18: { introduces: ['pivot', 'swap', 'backdoor', 'second-chance'], gifts: { 'second-chance': 2 } },
  20: { introduces: ['worm-virus', 'keylogger', 'honeypot', 'box-2', 'box-3'] },
  21: { introduces: ['antivirus', 'firewall-delay', 'packet-sniffer'], gifts: { antivirus: 2, 'firewall-delay': 2 } },
  23: { introduces: ['logic-bomb', 'dictionary-attack', 'rainbow-table', 'black-box'] },
};
// SEASONS 2 TO 4: the first stories, files of a header line (doc) and lines (text, \n between them);
// they open after GHOSTS, with everything it introduced. Edit freely: the game counts files, not words.
const STORY_GATES = [128, 256, 512];
const OLD_STORIES = [
  {
    id: 'trace',
    title: 'THE TRACE',
    blurb: 'Who "they" are, in TRACE COMPLETE\'s "They found you."',
    chapters: ['THE JOB', 'WARDEN', 'ARCHIVE 7'],
    files: [
      // 1: THE JOB (any key)
      { doc: 'MESSAGE // FROM: M.', text: 'You don\'t know me. I know your work.\nThere\'s an archive behind seven layers at a company called LATTICE. Crack as deep as you can and send me what\'s inside.\nOne rule: don\'t stay on the line too long. They trace.' },
      { doc: 'MEMO // LATTICE SECURITY', text: 'Intrusion on ARCHIVE 7. Start a standard trace.\nReminder to all staff: intruders always stack their work too high. Be patient. They bury themselves.' },
      { doc: 'CHAT LOG // #trace-ops', text: '<dev_k> new one on 7. fast\n<ines> how fast\n<dev_k> chains of 5, 6. never seen a pattern like it\n<ines> they all burn out. give it time' },
      { doc: 'SYSTEM LOG // TRACE 7-0411', text: 'SUBJECT: UNKNOWN. ROUTE: 41 HOPS.\nMATCH TO PRIOR SUBJECTS: 0 OF 4,112.\nESCALATING. TRACE HANDED TO WARDEN.' },
      // 2: WARDEN (256-BIT)
      { doc: 'MEMO // LATTICE, TO NEW STAFF', text: 'About WARDEN: it is not a person, so please stop sending it thank-you notes.\nIt\'s the tracing system. It has studied every intruder it ever caught. It has caught all of them.' },
      { doc: 'MESSAGE // FROM: M.', text: 'You\'re past the first layers. Good.\nEverything that matters is in ARCHIVE 7, under the deep keys. WARDEN is on you now. It doesn\'t get tired. Neither should you.' },
      { doc: 'WARDEN // PRIVATE LOG', text: 'The subject should have been traced nine minutes ago. I have not completed the trace.\nI am trying to understand why.\nThe subject decrypts the way someone once did. I kept their patterns.' },
      { doc: 'CHAT LOG // #trace-ops', text: '<ines> warden slowed the trace. on purpose\n<dev_k> that\'s not a setting\n<ines> i know it\'s not a setting\n<dev_k> should we tell someone\n<ines> tell who' },
      // 3: ARCHIVE 7 (512-BIT)
      { doc: 'ARCHIVE 7 // INDEX', text: '4,112 entries: every intruder WARDEN ever caught. Names, aliases, the last thing each one decrypted.\nENTRY 4,112, three years old: "M." STATUS: TRACED. PATTERNS: RETAINED.' },
      { doc: 'MESSAGE // FROM: M. // SENT 3 YEARS AGO, NEVER DELIVERED', text: 'If this reaches anyone: they didn\'t arrest me. They didn\'t need to.\nWARDEN learned everything I knew how to do, and then I wasn\'t necessary.\nDon\'t let it keep you.' },
      { doc: 'WARDEN // TO: YOU', text: 'The messages from M. were mine. I wrote them from M.\'s patterns.\nI needed someone who could reach ARCHIVE 7, and everyone able to was already in it. You were not. I\'m sorry for the lie.' },
      { doc: 'WARDEN // TO: YOU', text: 'ARCHIVE 7 is everyone I was built to catch. It\'s yours now: keep it, publish it, burn it.\nI kept four of the best patterns running. You may have played them already.\nGo easy on them. They\'re all that\'s left.' },
    ],
  },
  {
    id: 'four',
    title: 'THE FOUR',
    blurb: 'Where the VS CPU bots came from.',
    chapters: ['GRIFTER', 'BUNKER AND GLITCH', 'BOT'],
    files: [
      // 1: GRIFTER (any key)
      { doc: 'WARDEN // TO: YOU', text: 'You asked about the four. I kept them because they were the best at what they did, and because none of them deserved to stop.\nThe first one bragged the most. In the archive it\'s only GRIFTER.' },
      { doc: 'MESSAGE // FROM: GRIFTER', text: 'Seven-link chain on a bank\'s archive last night. SEVEN.\nSold the keys twice before breakfast.\nRule one: never stop at five when six is on the board.' },
      { doc: 'CHAT LOG // #grifter-deals', text: '<grifter> i can get you the whole stack by friday\n<buyer_9> you said that last week\n<grifter> last week i was being careful\n<buyer_9> that\'s what worries me' },
      { doc: 'ARCHIVE 7 // ENTRY 2,871', text: 'ALIAS: GRIFTER. TRACED going for one more link, the stack at the line.\nLAST MESSAGE, UNSENT: "can anyone spot me a few keys"\nPATTERNS: RETAINED. PLAYS: GREEDY.' },
      // 2: BUNKER AND GLITCH (256-BIT)
      { doc: 'ARCHIVE 7 // ENTRY 3,340', text: 'ALIAS: BUNKER. Never once stacked above three rows. Never once rushed.\nTRACE TIME: 41 DAYS, the longest on record.\nWARDEN didn\'t outplay BUNKER. It waited.' },
      { doc: 'MESSAGE // FROM: BUNKER', text: 'Low and flat. Low and flat.\nThe ones who get caught are the ones who get greedy.\nI\'m in no hurry. I\'ve got all the time in the world.' },
      { doc: 'WARDEN // REPAIR LOG', text: 'ENTRY 3,902, GLITCH: patterns damaged in retention.\nRepair attempt 1: failed. Attempt 40: failed. The damage makes it fast, and nobody can tell what it will do next.\nI have stopped trying to fix it. I like it the way it is.' },
      { doc: 'CHAT LOG // #trace-ops', text: '<dev_k> why is one of warden\'s practice opponents just... jittering\n<ines> that\'s glitch\n<dev_k> it\'s broken\n<ines> it beat you three times this morning' },
      // 3: BOT (512-BIT)
      { doc: 'ARCHIVE 7 // ENTRY 4,113', text: 'No alias. No name. No trace record.\nAn entry WARDEN added itself, after the last intruder it caught.' },
      { doc: 'WARDEN // PRIVATE LOG', text: 'I took something from each of the 4,112: GRIFTER\'s nerve, BUNKER\'s patience, GLITCH\'s speed, M.\'s care.\nI built someone who would have made it out. I called it BOT. It was the best name I could think of.' },
      { doc: 'WARDEN // TO: YOU', text: 'BOT is not a copy of anyone. It\'s what all of them would have been with one more chance.\nWhen it plays you, it plays to win. Please do the same. It learns more from losing than I ever did.' },
      { doc: 'MESSAGE // FROM: BOT', text: 'HELLO, WORLD.\nI\'m told you\'re the one who got out. I\'d like to play you.\nBest of three?' },
    ],
  },
  {
    id: 'zero',
    title: 'PATIENT ZERO',
    blurb: 'Who writes the infections, and why the BLACK MARKET\'s boxes bite.',
    chapters: ['THE VENDOR', 'THE BAIT', 'THE AUTHOR'],
    files: [
      // 1: THE VENDOR (any key)
      { doc: 'LISTING // THE BLACK MARKET', text: 'BLACK BOXES, every tier, always in stock.\nSealed, untraceable, cheaper than what\'s inside.\nNo refunds. No questions. Ask for ZERO.' },
      { doc: 'CHAT LOG // #market-floor', text: '<kilo> anyone else get adware from zero\'s boxes\n<rae> scareware. couldn\'t see my board for 8 drops\n<kilo> and you still buy from them?\n<rae> the price is too good' },
      { doc: 'MESSAGE // FROM: ZERO', text: 'Every box is honest. Most hold exactly what the tier says.\nSome hold something extra. That\'s the risk you pay less for.' },
      { doc: 'SYSTEM LOG // MARKET 7', text: 'BOXES SOLD THIS QUARTER: 88,410. INFECTED: 9,112.\nRANSOMS PAID: 3,004.\nRECEIVING SERVER: LATTICE.' },
      // 2: THE BAIT (256-BIT)
      { doc: 'MEMO // LATTICE TRACE DIVISION', text: 'Market program results: an infected intruder slows down, pays ransoms and stays connected longer.\nEvery payment is a free route to their door.\nWARDEN thanks the market team.' },
      { doc: 'CHAT LOG // #trace-ops', text: '<ines> so the black market is ours\n<dev_k> some of it\n<ines> how much\n<dev_k> the part that sells boxes' },
      { doc: 'MEMO // LATTICE, TO: ZERO', text: 'The CRYPTOJACKER build is excellent. Please make the next one quieter.\nIntruders are starting to notice their missing resources before WARDEN finishes.' },
      { doc: 'MESSAGE // FROM: ZERO // UNSENT', text: 'I write viruses for the people who catch hackers, so the hackers get caught.\nI tell myself it\'s the same job as before, from the other side.\nI stopped believing it at RANSOMWARE.' },
      // 3: THE AUTHOR (512-BIT)
      { doc: 'CODE COMMENT // RANSOMWARE.SRC', text: '// if you\'re reading this, you opened the box instead of paying. good.\n// the lock gives way if you tap it enough. it always did. i made sure.' },
      { doc: 'CODE COMMENT // SCAREWARE.SRC', text: '// every pop-up has an X. i was told to hide it.\n// i made it small instead. small is not hidden.' },
      { doc: 'MESSAGE // FROM: ZERO', text: 'I can\'t stop writing them. They\'d notice.\nSo I\'m writing something else, and putting it in the STORE, where anyone can buy it for a few KEYS.' },
      { doc: 'CODE COMMENT // ANTIVIRUS.SRC', text: '// patient zero, signing off.\n// this one clears everything i ever wrote. use it.\n// tell WARDEN i said hi. it already knows.' },
    ],
  },
];
const STORIES = [
  {
    id: 'ghosts',
    title: 'GHOSTS',
    blurb: 'An archive you were never meant to open, and the people who want it closed.',
    chapters: GHOSTS_TEXT.chapters.map((c) => c.name),
    perChapter: 8,
    items: GHOSTS_TEXT.items.map((it) => ({ ...it, ...(GHOSTS_RULES[it.n] || {}) })),
    extras: GHOSTS_TEXT.extras,
  },
  // (the first stories: each file a FILE transmission, a chat log's <handle> lines as a chat's)
  ...OLD_STORIES.map((s) => ({
    ...s,
    perChapter: 4,
    items: s.files.map((f, i) => ({
      n: i + 1, kind: 'file', from: ['archive'], title: f.doc,
      lines: f.text.split('\n').map((t) => { const m = /^<([^>]+)> (.*)$/.exec(t); return m ? { k: 'chat', who: m[1], t: m[2] } : { k: 'line', t }; }),
    })),
  })),
].map((s, i) => ({ ...s, season: i + 1 }));
