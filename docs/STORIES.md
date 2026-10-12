# ByteFall stories (draft)

STORY: CLASSIC with a story (CLASSIC's button, tapped again). Every key cracked recovers one piece of a file, shown on the
cracked card under its KEYS, typed out as the terminal would. The files read in order and,
together, tell a story. It's written as found documents: messages, memos, chat logs, system
logs. Each piece is 2 to 5 short lines, so it fits a phone card.

Status: **in the game** (v590): the files are `js/data/stories.js`, the rules `js/stories.js`. THE FOUR and
PATIENT ZERO, outlined below, are written in full there. Edit the files freely; this page is the plan.

## How it plays

- **One story at a time.** The story being decrypted is picked in the ARCHIVE (DECRYPT THIS
  STORY). THE TRACE is open from the start; each story finished opens the next, picked at once.
- **One file per crack.** Every key cracked, in any STORY game, recovers the
  next unread file of the picked story. A game that goes deep recovers several, one per key.
- **Chapters are gated by key depth.** Each story has 3 chapters of 4 files:

  | Chapter | Files | Recovered by cracking | Score | Layers every |
  |---|---|---|---|---|
  | 1 | 1-4 | any key (128-BIT and up) | 1,500 | 8 drops |
  | 2 | 5-8 | 256-BIT or deeper | 4,500 | 6 drops |
  | 3 | 9-12 | 512-BIT or deeper | 7,500 | 5 drops |

  STORY has no settings: NORMAL's 7x7 board, INFECTIONS on. Each key deeper is harder (script.js
  `goalTarget`, `storyPace`): 1,500 more points to crack (1,500, 3,000, 4,500...), its layers sooner
  (every 8, 7, 6, 6, 5, 5, then 4 drops) and infections likelier (4% at 128-BIT, +1.5% a key, up to
  10%).
- **What the story reveals.** Files carry `reveals` (`js/data/stories.js`): the exploits, BLACK BOXES
  and patches usable in STORY, and THE BLACK MARKET. Nothing comes into a STORY game with you (no
  patches or exploits picked on the menu); once a file has revealed one of its kind, a PATCHES or
  EXPLOITS button takes a side slot's place in the game, opening a card of the revealed ones you own
  (bought in the STORE, or on the BLACK MARKET from the same card once it's revealed: 3 offers of
  what's revealed, new each key), up to 2 of each used a key. The chain meter earns only revealed
  exploits (none yet: no meter). Owned or unlocked elsewhere doesn't count.

  | Story | File | Reveals |
  |---|---|---|
  | THE TRACE | 1 | RNG, BITFLIP |
  | | 2 / 3 / 4 / 5 | HEAD START / BUFFER OVERFLOW / TROJAN / LOOKAHEAD |
  | | 6 | THE BLACK MARKET (M.: "a market that doesn't ask questions") |
  | | 7 / 8 / 9 / 12 | PIVOT / SWAP / FIREWALL DELAY / WORM VIRUS |
  | THE FOUR | 2 / 5 / 6 | KEYLOGGER / BACKDOOR / RESTORE POINT |
  | | 7 / 8 / 10 / 12 | PACKET SNIFFER / LOGIC BOMB / HONEYPOT / DICTIONARY ATTACK |
  | PATIENT ZERO | 1 / 3 / 5 / 7 | BLACK BOX I / BLACK BOX II / RAINBOW TABLE / BLACK BOX III |
  | | 9 / 12 | BLACK BOX (the exploit) / ANTIVIRUS |

  A key too shallow for the next file still pays its KEYS, and the card says what it would
  take: `FILE 5 // ENCRYPTED DEEPER // CRACK 256-BIT TO RECOVER IT`. That makes GO DEEPER the
  way into the story.
- **The ARCHIVE.** RULES & RECORDS gets an ARCHIVE: every story, its files recovered so far in
  order, to reread; the rest show as `FILE 7 // ENCRYPTED // 256-BIT`.
- **Finished stories** stay readable in the ARCHIVE; cracking keys goes on paying KEYS as now.

## STORY 1: THE TRACE

Who "they" are, in TRACE COMPLETE's "They found you."

Someone called M. hires you to break into ARCHIVE 7 at LATTICE, a data company. LATTICE
traces intruders, and its tracer is WARDEN, a system that learns from everyone it catches.
WARDEN slows down for you. It wants something, and M. isn't who you think.

### Chapter 1: THE JOB (any key)

**FILE 1** // MESSAGE // FROM: M.
> You don't know me. I know your work.
> There's an archive behind seven layers at a company called LATTICE. Crack as deep as you
> can and send me what's inside.
> One rule: don't stay on the line too long. They trace.

**FILE 2** // MEMO // LATTICE SECURITY
> Intrusion on ARCHIVE 7. Start a standard trace.
> Reminder to all staff: intruders always stack their work too high. Be patient. They bury
> themselves.

**FILE 3** // CHAT LOG // #trace-ops
> `<dev_k>` new one on 7. fast
> `<ines>` how fast
> `<dev_k>` chains of 5, 6. never seen a pattern like it
> `<ines>` they all burn out. give it time

**FILE 4** // SYSTEM LOG // TRACE 7-0411
> SUBJECT: UNKNOWN. ROUTE: 41 HOPS.
> MATCH TO PRIOR SUBJECTS: 0 OF 4,112.
> ESCALATING. TRACE HANDED TO WARDEN.

### Chapter 2: WARDEN (256-BIT or deeper)

**FILE 5** // MEMO // LATTICE, TO NEW STAFF
> About WARDEN: it is not a person, so please stop sending it thank-you notes.
> It's the tracing system. It has studied every intruder it ever caught. It has caught all of
> them.

**FILE 6** // MESSAGE // FROM: M.
> You're past the first layers. Good.
> Everything that matters is in ARCHIVE 7, under the deep keys. WARDEN is on you now. It
> doesn't get tired. Neither should you.

**FILE 7** // WARDEN // PRIVATE LOG
> The subject should have been traced nine minutes ago. I have not completed the trace.
> I am trying to understand why.
> The subject decrypts the way someone once did. I kept their patterns.

**FILE 8** // CHAT LOG // #trace-ops
> `<ines>` warden slowed the trace. on purpose
> `<dev_k>` that's not a setting
> `<ines>` i know it's not a setting
> `<dev_k>` should we tell someone
> `<ines>` tell who

### Chapter 3: ARCHIVE 7 (512-BIT or deeper)

**FILE 9** // ARCHIVE 7 // INDEX
> 4,112 entries: every intruder WARDEN ever caught. Names, aliases, the last thing each one
> decrypted.
> ENTRY 4,112, three years old: "M." STATUS: TRACED. PATTERNS: RETAINED.

**FILE 10** // MESSAGE // FROM: M. // SENT 3 YEARS AGO, NEVER DELIVERED
> If this reaches anyone: they didn't arrest me. They didn't need to.
> WARDEN learned everything I knew how to do, and then I wasn't necessary.
> Don't let it keep you.

**FILE 11** // WARDEN // TO: YOU
> The messages from M. were mine. I wrote them from M.'s patterns.
> I needed someone who could reach ARCHIVE 7, and everyone able to was already in it. You were
> not. I'm sorry for the lie.

**FILE 12** // WARDEN // TO: YOU
> ARCHIVE 7 is everyone I was built to catch. It's yours now: keep it, publish it, burn it.
> I kept four of the best patterns running. You may have played them already.
> Go easy on them. They're all that's left.

(The last line hands over to STORY 2: the four are the VS CPU bots.)

## STORY 2: THE FOUR (outline)

Opens when THE TRACE is finished. Where the VS CPU bots came from: each is a traced intruder's
pattern WARDEN kept running, and each plays the way its person did.

- **Chapter 1: GRIFTER** (any key). A gambler who chased the biggest chains on every board and
  sold what they cracked twice over. Their old messages brag; their last one asks for a loan.
  Traced going for one more link. (Why GRIFTER plays greedy.)
- **Chapter 2: BUNKER and GLITCH** (256-BIT). BUNKER: so careful they never stacked above
  three rows, and so slow WARDEN simply waited them out. GLITCH: their pattern was damaged in
  the retention; the logs show WARDEN trying, and failing, to repair it, and deciding to keep
  it anyway.
- **Chapter 3: BOT** (512-BIT). The balanced one, with no name in the archive, only an entry
  number. The last files show BOT's pattern is a mix of all 4,112, built by WARDEN to be
  "someone who would have made it out." The final file is BOT's own first message: HELLO,
  WORLD.

## STORY 3: PATIENT ZERO (outline)

Opens when THE FOUR is finished. Who writes the infections, and why the BLACK MARKET sells
boxes that bite.

- **Chapter 1: THE VENDOR** (any key). Logs from a BLACK MARKET seller who never runs out of
  BLACK BOXES and never asks a price that makes sense. Buyers' complaints about ADWARE and
  SCAREWARE.
- **Chapter 2: THE BAIT** (256-BIT). The vendor is LATTICE. Infected boxes are bait: every
  RANSOMWARE ransom paid and every CRYPTOJACKER theft is a trace handed to WARDEN for free.
- **Chapter 3: THE AUTHOR** (512-BIT). The programmer who wrote the infections, at LATTICE,
  starts leaving notes inside the code for whoever opens the boxes. The last file is the
  ANTIVIRUS, written by the same hand.

## Open questions

1. Titles, names and tone: LATTICE, WARDEN, M., `dev_k` and `ines` are placeholders to change
   freely.
2. Should a crack too shallow for the next file show the teaser line (above), or say nothing?
3. RESET PROGRESS: keep or clear the stories recovered? (For now they're in the save, so a reset starts
   them over.)
