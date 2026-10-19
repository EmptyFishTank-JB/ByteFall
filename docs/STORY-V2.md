# ByteFall STORY v2: GHOSTS (draft for review)

A rework of STORY, for review. `docs/STORIES.md` is the preliminary version (three stories, files
that reveal tools), kept as it was, to compare.

**Status: in the game** (the website and the test app; the Google Play release says COMING SOON).
The words below are what the game shows: after an edit here, `node tools/story-from-md.js` puts them
in (it reads the transmissions under THE STORY and the unprompted messages). Not in yet: the eight
jobs in other game modes and THE CUSTODIAN's VS bot (those transmissions come from keys for now), and
the STORE's marks for what STORY has introduced.

**The idea in one line:** you're a hacker cracking an encrypted archive one key at a time, and the
tools you crack it with come from people: an informant who teaches you exploits and patches over
IMs, a black market you're pointed to, and a voice on the phone who knows what you're doing and
wants you to stop.

## How it plays

### The progression

You start with nothing: no exploits, no patches, no chain meter, no BLACK MARKET. Just you and the
board. Every key you crack brings the next **file** from the archive, and some files bring a message
after them (an IM, a call or an email). The messages bring the tools, one or two at a time, and the
story moves through four stages:

| Stage | From | What you can use in a STORY game |
|---|---|---|
| **1. Nothing** | the start | Nothing. Chains score, but there's no chain meter yet. |
| **2. MOTH's kit** | file 1 | What MOTH has **introduced**: introduced exploits come from the chain meter (it appears with the first one); introduced patches come as gifts MOTH puts in your kit (2 of each when it's introduced, used from the PATCHES button). |
| **3. The BLACK MARKET** | file 9 | The kit, plus the BLACK MARKET: TOLL's stock of what's been introduced, bought with KEYS and resources, opened from the PATCHES or EXPLOITS button. |
| **4. Bring your own** | file 12 | All that, plus your own: exploits and patches you "compile" (buy in the STORE), but only the ones introduced so far. STORY's main menu gets its PATCHES and EXPLOITS rows back to bring up to 2 of each into a game. |

- **Introduced is the rule.** Owning something (bought in the STORE, or unlocked by level) doesn't
  make it usable in STORY. The story has to have introduced it first. Someone with everything
  unlocked starts STORY with nothing, like everyone else.
- **Introduced ones stay introduced.** Once MOTH or TOLL has told you about a tool, it's yours in
  STORY for good, in every STORY game after.
- **Limits.** Up to 2 patches and 2 exploits used per key (as now), back after GO DEEPER. The kit's
  gifts don't come back once used; from stage 3 on there's always the market, and from stage 4 the
  STORE.
- **Infections start when you're noticed.** No INFECTED BITS until the first call (after file 6):
  from then on, every STORY game has them. The Custodian's people are pushing back.
- **Each file has its own key.** The key being cracked is for the next file, its strength (the points
  it takes) that file's: staggered through the story, mostly a little higher than the last, now and
  then a jump, the one after a jump a little lower (GHOSTS: 1,250 to about 3,000). Deeper keys still
  bring layers sooner and infections likelier (v599); a key too shallow for the next file's chapter is
  a filler, 1,500 strong.
- **A key's strength is ENCRYPTED** till you find it out: noise under BYTEFALL and an empty meter,
  till a 5-chain from one drop decrypts it (the meter then fills to where the score's got to), or
  you crack the key anyway. Found out, it stays known. The ARCHIVE doesn't say how deep an encrypted
  file's key is, nor the cracked card how deep or strong the next one is.

### Transmissions

**Where each one shows up.** The INTRO's email (the archive, attached) is in your inbox when the
terminal intro ends, and its IM pops up on the phone. Every FILE after that comes with a key cracked,
printed on the cracked card, and its messages THEN: a call or an email on the card after it, an IM
on the phone. The three unprompted messages (below) come between games, as a card on the main menu.
Each comes in its own form:

- **FILE**: a document from the archive (memos, chat logs, records). Every key brings one.
- **EMAIL**: mail on your computer: FROM, SUBJECT and its words, printed on the cracked card after
  its file; kept in the phone's MAIL with the inbox's ordinary emails (### The inbox).
- **IM**: a thread on a phone screen that pops up over the game (always the same size, a phone's
  shape): each message in a bubble, its sender and time above it on its side (theirs left, yours
  right), each sender's own color, "..." in a bubble while they type, a beat between messages about
  as long as the reply would take. MOTH texts as a phone types (a capital at each sentence, full stops between them, none at the end of a message), TOLL in capitals; your replies are
  shown too, written for you. Only that transmission's messages are on it, and a long thread
  scrolls. The cracked card and the ARCHIVE show it as an inbox does (its last message, OPEN
  THREAD). A time written in the story (`**moth** 02:14 ·`) is kept; the rest get late-night
  times of their own. **MOTH is an UNKNOWN CONTACT** on your phone until the message after file 9, where
  they name themselves ("Say the moth sent you"); that card says `CONTACT SAVED // MOTH`, and
  every IM after it is from MOTH (`names` in `js/data/stories.js`'s GHOSTS_RULES).
- **CALL**: the card rings first, `INCOMING CALL // UNKNOWN NUMBER`, with ANSWER. The call plays as
  a transcript at a speaking pace, a low murmur down the line for each word, then
  `CALL ENDED // 0:41`. (Transmission 24's IMs after its call come on the phone once it's over.)

A transmission that introduces something ends with what it gave you, and so does a NOTICE:
`INTRODUCED // BITFLIP: from the chain meter in STORY`.

**Chapters are gated by key depth** as now: chapter 1's transmissions come from any key, chapter
2's from 256-BIT keys or deeper, chapter 3's from 512-BIT or deeper. A key too shallow for the next
transmission pays its KEYS and the card says what it would take.

**The ARCHIVE** keeps everything, sorted by who sent it: MOTH, TOLL, UNKNOWN NUMBER and THE ARCHIVE
(the files), so a conversation reads as one thread.

### Jobs: other game modes

Most transmissions come from keys cracked in STORY's usual game (CLASSIC with keys to crack). Some
come from a **job** instead: the archive, HALCYON or TOLL puts something in your way that's played
as another game mode. When the next transmission is a job, keys cracked still pay their KEYS but
the cracked card says `NEXT TRANSMISSION: A JOB`, and the main menu's story row turns into it
(`JOB // SEALED FILE // PUZZLE`): PLAY starts it. Win it and the transmission comes in, with
KEYS (15 in chapter 1, 30 in chapter 2, 45 in chapter 3); lose and try again, nothing lost. Jobs
skip the key-depth gate (they get harder by chapter instead), keep STORY's tool rules (introduced
ones only) and never touch BEST.

| Job | Mode | In the story | How it's won |
|---|---|---|---|
| **SEALED FILE** | PUZZLE | a document locked under a fixed board | clear the board in its drops (a PUZZLE board, its tier rising each chapter); MOTH puts 1 HINT and 1 UNDO in the kit before the first |
| **LIVE TRACE** | BLITZ | HALCYON tracing you while you work | reach the score before the clock runs out (2:00 in chapter 2, 1:30 in chapter 3) |
| **FIREWALL** | BREACH | breaking into HALCYON's servers | break through the firewall with the bits you're given |
| **TOLL'S TEST** | DECRYPT | TOLL won't sell to just anyone | reach the score with a fixed set of 40 bits |
| **THE CUSTODIAN** | VS | his tracing program, head to head | beat it in VS CLASSIC: first to overflow loses (a STORY-only bot, THE CUSTODIAN: patient, never greedy, faster each chapter) |

The jobs, in the story (by file): **3** SEALED FILE, **7** LIVE TRACE, **9** FIREWALL, **10** TOLL'S
TEST, **13** SEALED FILE, **14** LIVE TRACE, **17** FIREWALL, **18** THE CUSTODIAN (the finale). That's 8
of the 18; the other 10 come from keys.

**Side jobs (optional, later).** The ARCADE's games fit as extra jobs that pay KEYS and resources
but aren't needed to finish: CODE BREAKER (the lock on one of TOLL's boxes), TRACE (tracing the
unknown number back), ROUTING (bouncing your line so the trace loses you), DEFRAG (piecing together
Luna's damaged files) and DECODE (a picture hidden in the archive).

### Unprompted contact

A few short messages come outside the cracks, once each, when something happens:

- **Traced in STORY for the first time** (after file 1). IM from MOTH:
  `They nearly had you. You stack too high when you're nervous`
- **DISCONNECT after a crack** (after file 10). IM from TOLL:
  `NICE HAUL. MARKET'S OPEN WHEN YOU ARE.`
- **Back after 3 days or more** (after file 6). Voicemail from UNKNOWN NUMBER:
  `"You stopped. Good. Stay stopped."`

## The intro: a terminal

Played on the first STORY game's PLAY (transmission 1 still to come), not when STORY is switched on;
again from the ARCHIVE's READ THE INTRO (without the phone after it). Its words are in
`bytefall.html`'s `#story-term-text`, not made from this doc:

1. The screen fades slowly to black (the music fades out with it); the game is set up underneath.
2. A few seconds of black, then a terminal cursor pops in top left and blinks a few times.
3. The message types out: the terminal's own line at a terminal's pace, then the message at a
   speaking pace (about 150 words a minute, a breath after each sentence), a key click for each
   letter (the key sounds of ECHOES' SHIP SYSTEM TERMINAL 426; the tutorial BOT's blips stay for
   narration). A tap shows the rest at once.
4. `PRESS ENTER TO CONTINUE`, plain text with the cursor after it: the player hits ENTER (the key, or a tap anywhere), and the cursor drops a line. A second later the terminal
   goes dark; a second more and the phone lights up with transmission 1, its messages coming in.
5. The phone put down, the black lifts off the board: KEY_01, the first game.

> INCOMING // ENCRYPTED // SOURCE UNKNOWN
>
> If you're reading this, good, it got through.
>
> I've sent you something. Check your inbox for an archive. You'll find memos, chat logs, and call records. Every file is locked under a key, and each one is harder to crack than the one before.
>
> The people responsible for these files think they've deleted them. They're wrong.
>
> Open the files one at a time. Back up whatever you manage to crack.
>
> I'll contact you soon.
>
> KEY_01 is waiting.

It's MOTH's note, unsigned; "I'll contact you soon" is kept a moment later, when the phone lights up.

**The phone button.** In a STORY game, once a message has come in, a button top left (across from
PAUSE, its size and shape, a little phone in it) brings the phone up to read your messages again: the
newest contact's thread, everything from them so far, as a phone keeps it. The phone's back arrow
(wherever the phone's up) opens MESSAGES, the list of conversations, the newest first: MOTH's alone
till TOLL writes (13). A tap opens one.

**The ARCHIVE gives nothing away.** Its buttons for one sender's transmissions only name senders
you've heard from; one sender's shows only what's come in (no ENCRYPTED ones saying which are
theirs), and a chapter's name stays ENCRYPTED till one of its transmissions is in.

## The characters

- **You.** A small-time hacker. No name in the story; MOTH calls you **ghost**, because you never
  stay on a line long enough to be traced.
- **MOTH.** The informant. IM only, typed as a phone types (a capital at each sentence, no full stop to end a message), dry, careful. Sent you the archive, teaches you
  your tools, knows far too much about HALCYON. "You only see a moth when there's a light on."
- **TOLL.** Runs the BLACK MARKET. All capitals, all business. Sells to anyone, including the
  people looking for you.
- **UNKNOWN NUMBER (the Custodian).** HALCYON's fixer. Calls, never writes. Calm, polite, never
  raises his voice. He doesn't hurt people; he *corrects* them. Warns you first, then doesn't.
- **HALCYON SYSTEMS.** The company in the archive. It keeps a city's records (identity, credit,
  leases, phones) and quietly sells "corrections": a debt or a conviction erased for a price, and,
  for the right client, a whole person erased (a "full correction"). In the files: `dir.vance`
  (director), `ops.reyes` (operations), `sec.hale` (security) and `eng.luna` (the engineer who
  built the eraser).

## THE STORY: GHOSTS

18 files in 3 chapters of 6. Each key cracked recovers the next **FILE**, a document from the archive.
Some files have messages that come **THEN**, after it's read, reacting to it: an **IM** (on the
phone), a **CALL** (on the cracked card, ringing), or an **EMAIL** (on the cracked card, then in the
phone's MAIL). The **INTRO** ones come with the terminal intro, before any key.

**INTRO // EMAIL // FROM: (no address) // SUBJECT: (no subject)** · *in your inbox when the terminal intro ends*
> ATTACHED: archive.enc (4.1 GB)

**INTRO // IM // MOTH** · *pops up as your first STORY game starts*
> **moth** 02:14 · Hey, it's me
> **moth** 02:14 · You're not a hard person to find you know?
> **moth** 02:15 · Anyway, that archive I sent you is around four gigs, all encrypted, about two dozen to go through
> **moth** 02:15 · Don't try to brute force it. Crack each key a few bits at a time
> **you** 02:15 · Who is this?
> **moth** 02:16 · Don't worry about that right now
> **moth** 02:16 · Start with that first file. I'll message you again later

### Chapter 1: THE DROP (any key)

**FILE 1 // HALCYON SYSTEMS // #corrections**
> `<ops.reyes>` queue's at 41 tonight. 38 standard, 3 full
> `<dir.vance>` Fulls go first. The clients are waiting.
> `<eng.luna>` what's a "full"?
> `<dir.vance>` Not your department.

**THEN // IM // MOTH** · *introduces BITFLIP (exploit)*
> **moth** · Watched you crack that last key. You fight the board too much
> **moth** · Here. BITFLIP. It turns every column upside down. What was buried comes up top
> **moth** · Chain your decrypts and the meter beside the board fills. Full, it's yours to use
> **you** · Why are you helping me?
> **moth** · Because they'll notice you soon. You should be faster by then

*The chain meter appears; it earns BITFLIP.*

**FILE 2 // HALCYON SYSTEMS // CLIENT BROCHURE**
> HALCYON SYSTEMS. THE CITY'S RECORDS, KEPT CLEAN.
> A debt you paid twice. A conviction that should have been sealed. A lease in a name you don't use anymore.
> We correct the record, quietly and permanently.
> Ask your advisor about our FULL service.

**THEN // IM // MOTH** · *introduces HEAD START (patch)*
> **moth** · You start every key cold. Stop doing that
> **moth** · HEAD START: your chain meter starts half full and holds until your first decrypt
> **moth** · I put two in your kit. PATCHES, beside your EXPLOIT button
> **moth** · When they're gone they're gone. For now, ghost

*The PATCHES button appears, with 2 HEAD STARTs.*

**FILE 3 // HALCYON // THE LEDGER: PRICE SHEET** · **JOB: SEALED FILE (PUZZLE)**
> STANDARD CORRECTION (one debt, one record, one conviction): 40,000.
> FULL CORRECTION: on request.
> All corrections are permanent. HALCYON keeps no copies.

**FILE 4 // HALCYON // ENGINEERING: ERASER v0.9 (eng.luna)**
> eraser v0.9. one request takes a record out of every registry at once: civil, credit, lease, carrier, court.
> no backups. no audit trail. vance's spec: "nothing to find, nothing to restore."
> tested on synthetic records. 40 for 40.
> note to self: ask what a "full" is before v1.0.

**THEN // IM // MOTH** · *introduces RNG and BUFFER OVERFLOW (exploits)*
> **moth** · Two more. They're messy. That's the point
> **moth** · RNG scrambles every bit on the board to a random number. Use it when there's nothing left to lose
> **moth** · BUFFER OVERFLOW adds 1 to every bit. The top number spills over and gets re-encrypted, so watch your 7s
> **moth** · The meter picks which one you get. You don't

**FILE 5 // HALCYON // #corrections**
> `<eng.luna>` pulled a "full" out of the queue to test the eraser. it's a person.
> `<eng.luna>` name, birth record, bank, lease, phone. all of it. gone.
> `<dir.vance>` It's a correction. The client asked for it.
> `<eng.luna>` the person didn't.
> `<dir.vance>` Log off, Luna.

**FILE 6 // HALCYON // ACCESS LOG: ARCHIVE NODE 7**
> 02:14:07 // READ // luna_archive/key_01 // SOURCE: UNRESOLVED
> 02:51:33 // READ // luna_archive/key_02 // SOURCE: UNRESOLVED
> 03:09:12 // READ // luna_archive/key_03 // SOURCE: UNRESOLVED
> FLAG RAISED // PATTERN: ONE KEY AT A TIME
> ROUTED TO: SECURITY (sec.hale)

**THEN // CALL // UNKNOWN NUMBER** · *the first warning; INFECTIONS begin*
> INCOMING CALL // UNKNOWN NUMBER
> "Good evening. Please don't hang up. This is a courtesy."
> "You've opened something that doesn't belong to you. You haven't read much of it. That's good. It means this can still end."
> "Delete it, and we never speak again."
> "I'll know if you don't."
> CALL ENDED // 0:41

*From now on, STORY games have INFECTED BITS.*

### Chapter 2: THE LIST (256-BIT or deeper)

**FILE 7 // HALCYON // #security** · **JOB: LIVE TRACE (BLITZ, 2:00)**
> `<sec.hale>` someone's reading the luna archive. slow. one key at a time.
> `<dir.vance>` Trace them.
> `<sec.hale>` tried. they drop the line every time we get close.
> `<dir.vance>` Then call the Custodian.

**THEN // IM // MOTH** · *introduces LOOKAHEAD (patch) and TROJAN (exploit)*
> **moth** · He called you. Calm voice. Very polite
> **moth** · That's the Custodian. He doesn't hurt people. He corrects them. It's worse
> **moth** · LOOKAHEAD: see your next bit for a minute. Two in your kit
> **moth** · TROJAN wipes out every block touching where it lands. For when it's piled up
> **moth** · You'll want to see them coming

**FILE 8 // HALCYON // CLIENT REQUEST: FULL**
> CLIENT: [REDACTED]. SERVICE: FULL CORRECTION.
> SUBJECT: one person. Name, history, and everyone who'd notice.
> REASON GIVEN: "She knows where the money went."
> BUDGET: no limit.
> APPROVED: dir.vance

**THEN // EMAIL // FROM: noreply@halcyon.sys // SUBJECT: A review of your record**
> Dear resident,
> A routine review of your public record has been opened.
> No action is required. You don't need to do anything at all.
> HALCYON SYSTEMS. The city's records, kept clean.

**FILE 9 // HALCYON // THE LIST (excerpt)** · **JOB: FIREWALL (BREACH)**
> 0117 // MARSH, D. // STANDARD // DEBT // CORRECTED
> 0118 // FLORES, I. // FULL // CORRECTED
> 0119 // NAKASHIMA, R. // FULL // CORRECTED
> 0120 // [ENCRYPTED DEEPER] // FULL // CORRECTED
> 2,947 ENTRIES. 309 FULL.

**THEN // IM // MOTH** · *introduces the BLACK MARKET*
> **moth** · I can't keep sending you tools. Every package I send is a door they can follow back
> **moth** · There's a market. No names, no questions, everything has a price
> **moth** · Ask for Toll. Say the moth sent you
> **moth** · And ghost. Don't trust the boxes

*Up to here MOTH's IMs come from an UNKNOWN CONTACT; this one says CONTACT SAVED // MOTH, and every IM
after it is from MOTH.*

*The BLACK MARKET opens from the PATCHES and EXPLOITS buttons. It sells what's been introduced.*

**FILE 10 // HALCYON // #corrections** · **JOB: TOLL'S TEST (DECRYPT)**
> `<ops.reyes>` the custodian's been in all week. what does he even do
> `<dir.vance>` He tidies up after the fulls. Family. Friends. Anyone who remembers.
> `<ops.reyes>` remembers what
> `<dir.vance>` Exactly.

**THEN // IM // TOLL** · *introduces BLACK BOX I*
> **TOLL** · THE MOTH'S FRIEND. YOU PASSED. BARELY.
> **TOLL** · STOCK TURNS OVER EVERY KEY YOU CRACK. PRICES ARE PRICES.
> **TOLL** · NEW IN: BLACK BOX I. COULD BE ANYTHING. COULD BE SOMETHING THAT BITES.
> **TOLL** · NO REFUNDS. NO NAMES. NO EXCEPTIONS.

**FILE 11 // HALCYON // eng.luna: PERSONAL NOTES (not for the server)**
> they've used it on 309 people. i built it. there's no undo. that was the spec.
> i'm writing one anyway. at night, off the network.
> if they find it, they'll run the eraser on me.
> so it goes where they won't look: under the last key.

**THEN // CALL // UNKNOWN NUMBER** · *the second call: a threat*
> INCOMING CALL // UNKNOWN NUMBER
> "You bought from Toll. Toll sells to everyone. Including us."
> "I asked nicely. I won't again."
> "Your router is in the hall closet. Second shelf. The light blinks green while you're on the line."
> "It's blinking now."
> CALL ENDED // 0:22

**FILE 12 // HALCYON // #corrections**
> `<eng.luna>` i'm taking the list out. all of it. every name. every "full."
> `<dir.vance>` You built the eraser, Elena. You know what it can do.
> `<eng.luna>` i know. that's why it has to be me.
> USER eng.luna HAS LEFT THE CHANNEL

**THEN // IM // MOTH** · *bring your own*
> **moth** · You're still on. Good. Stubborn
> **moth** · Stop waiting on me and Toll. You can write your own tools
> **moth** · Compile them at home, bring them in. Anything you've seen work in here
> **moth** · Only what you've seen. Untested code gets people traced

*From now on, exploits and patches you own (the STORE's) can be brought into STORY, if they've been
introduced: STORY's main menu gets PATCHES and EXPLOITS rows, and what you own shows in the in-game
cards too. The STORE marks what STORY has introduced.*

### Chapter 3: CORRECTIONS (512-BIT or deeper)

**FILE 13 // HALCYON // CORRECTION ORDER 0120** · **JOB: SEALED FILE (PUZZLE)**
> SUBJECT: LUNA, ELENA. ENGINEER, HALCYON SYSTEMS.
> TYPE: FULL.
> REQUESTED BY: HALCYON SYSTEMS.
> STATUS: CORRECTED.
> NOTE: the archive she took was never recovered.

**THEN // IM // MOTH** · *introduces PIVOT, SWAP, BACKDOOR (exploits) and RESTORE POINT (patch)*
> **moth** · You read 0120
> **moth** · Don't. Not yet. Finish it first
> **moth** · PIVOT swaps a column with its neighbor. SWAP trades any two bits. BACKDOOR deletes the bottom row, layers and all
> **moth** · And RESTORE POINT. If they finish the trace, the system rolls back and you keep going. Once
> **moth** · You're going to need once

**FILE 14 // HALCYON // #security** · **JOB: LIVE TRACE (BLITZ, 1:30)**
> `<sec.hale>` the reader goes through 41 hops. same hours every night.
> `<sec.hale>` faster now. three keys a night.
> `<dir.vance>` How far in?
> `<sec.hale>` far enough to read 0120.
> `<dir.vance>` Give the Custodian the order.

**THEN // CALL // UNKNOWN NUMBER** · *your name on an order*
> INCOMING CALL // UNKNOWN NUMBER
> "You got away from that trace. You won't twice."
> "I've been patient."
> "There's an order on my desk with your name on it. Your real one."
> "Disconnect, and it stays on my desk. Keep reading, and I sign it."
> "No one will remember to miss you. That isn't a threat. It's what the job is."
> CALL ENDED // 0:35

**FILE 15 // HALCYON // CASE FILE: THE READER**
> SUBJECT: UNKNOWN. CALLED "GHOST" BY THEIR CONTACT.
> HABITS: works after midnight. Never stays on a line long. Stacks too high when nervous.
> CONTACTS: one. Writes in short sentences. Thinks she's careful.
> RECOMMENDATION: FULL CORRECTION. Before they reach the last key.

**THEN // EMAIL // FROM: TOLL // SUBJECT: NEW IN** · *introduces WORM VIRUS, KEYLOGGER, HONEYPOT (exploits), BLACK BOX II and III*
> WORD IS YOU'RE ON A LIST.
> NOT MY BUSINESS. MONEY'S STILL MONEY.
> NEW IN: WORM VIRUS. KEYLOGGER. HONEYPOT, FOR WHOEVER'S FOLLOWING YOU. BOXES II AND III IF YOU FEEL LUCKY.
> PAY UP FRONT. CORRECTED PEOPLE DON'T PAY THEIR DEBTS.

**FILE 16 // HALCYON // eng.luna: LAST LOG**
> 0119 done tonight. nakashima. i watched the registries empty one by one.
> 0120 is on the queue. i know whose name is on it.
> the undo's finished. 309 restores, queued, waiting for a key.
> i'm putting everything in one archive and giving it to someone who isn't me.
> if you're reading this: thank you. keep going.

**THEN // EMAIL // FROM: noreply@halcyon.sys // SUBJECT: Your correction has been scheduled**
> Dear resident,
> A correction to your record has been scheduled.
> You may notice changes to your accounts, your lease and your phone service. This is normal.
> Thank you for choosing HALCYON.

**THEN // IM // MOTH** · *introduces ANTIVIRUS, FIREWALL DELAY (patches) and PACKET SNIFFER (exploit)*
> **moth** · Toll's boxes bite. You knew that
> **moth** · ANTIVIRUS clears whatever's running and catches the next one. FIREWALL DELAY holds the next layer back four drops
> **moth** · PACKET SNIFFER lets you pick your next three bits. Careful. It's addictive
> **moth** · They're the last clean tools I wrote. Before

**FILE 17 // HALCYON // THE LIST (complete)** · **JOB: FIREWALL (BREACH)**
> 2,948 ENTRIES. 310 FULL.
> 2,947 CORRECTED.
> 1 PENDING. SUBJECT: [YOU].
> REQUESTED BY: THE CUSTODIAN.

**THEN // IM // MOTH** · *introduces LOGIC BOMB, DICTIONARY ATTACK, RAINBOW TABLE, BLACK BOX (exploits)*
> **moth** · It was me. 0120
> **moth** · I built the eraser. When I tried to undo it, they ran it on me
> **moth** · No name. No records. A moth. You only see one when there's a light on
> **moth** · Here's everything I have left. LOGIC BOMB, DICTIONARY ATTACK, RAINBOW TABLE, BLACK BOX
> **moth** · The eraser has an undo. It's under the last key. Crack it

**FILE 18 // THE ERASER // UNDO (eng.luna)** · **JOB: THE CUSTODIAN (VS)** · *the end*
> UNDO // WRITTEN BY eng.luna // RUN ONCE
> RESTORE QUEUE // 309 FULL CORRECTIONS // REVERSING...
> 0118 // FLORES, I. // RESTORED
> 0119 // NAKASHIMA, R. // RESTORED
> 0120 // LUNA, E. // RESTORED
> ORDER // [YOU] // VOID

**THEN // CALL // UNKNOWN NUMBER**
> INCOMING CALL // UNKNOWN NUMBER
> "You can't put people back."
> CALL ENDED // 0:04 (you hung up)

**THEN // EMAIL // FROM: noreply@halcyon.sys // SUBJECT: Your correction has been cancelled**
> Dear resident,
> The correction scheduled to your record has been cancelled.
> We apologize for any inconvenience.

**THEN // IM // MOTH**
> **moth** · My name is Elena Luna
> **moth** · Say it once. So it's written down somewhere

*STORY complete. Every file stays in the ARCHIVE, every message on the phone. STORY games go on (keys
still pay KEYS), with everything introduced.*

### The inbox

The phone isn't only the story's: a few ordinary emails sit in its MAIL, and a few ordinary texts in
its MESSAGES, from people and places with nothing to do with any of this, some there from the start,
some coming in with a file. Short, and never mentioned again.

**MAIL // FROM: Dana Whitfield // SUBJECT: Re: Saturday?** · *there from the start*
> Still on for Saturday? Bring the good chips this time. Not the sad ones.

**MAIL // FROM: Building Management // SUBJECT: Water shut-off Thursday** · *there from the start*
> The water will be off Thursday from 9 to 2 for pipe work. Sorry for the short notice.

**MAIL // FROM: PIXEL & PINT // SUBJECT: Two-for-one wings, Thursdays only** · *with file 4*
> Thursdays are wing night at PIXEL & PINT. Two-for-one on every flavor, 5 to close.
> Show this email at the bar. Arcade cabinets on the house till 7.

**MAIL // FROM: Rosa Imani // SUBJECT: book club** · *with file 10*
> We're doing the long one next month. Sorry in advance. Snacks at mine.

**MAIL // FROM: Marcus Bell // SUBJECT: your hoodie** · *with file 14*
> You left your hoodie at mine. It's hostage until you come get it.

**TEXT // FROM: JULES** · *there from the start*
> **jules** · are you alive
> **jules** · you've been "busy" for three weeks
> **you** · Alive. Busy
> **jules** · ok. brunch sunday?? say yes
> **you** · Maybe
> **jules** · that's a yes

**TEXT // FROM: CITY ALERTS** · *with file 2*
> **CITY ALERTS** · RECYCLE RIGHT WEEK! Rinse it, sort it, bin it. Your city thanks you. Reply STOP to opt out.

**TEXT // FROM: MOM** · *with file 5*
> **mom** · Did you eat today
> **you** · Yes
> **mom** · Real food?
> **you** · Define real

**TEXT // FROM: FIRST HARBOR BANK** · *with file 11*
> **FIRST HARBOR BANK** · Did you make a purchase of $249.99 at NIGHTSHADE ELECTRONICS? Reply YES or NO.
> **you** · NO
> **FIRST HARBOR BANK** · Thank you. Your card has been locked. A new card will arrive in 7 to 10 business days.

**TEXT // FROM: +1 (555) 014-2290** · *with file 15*
> **+1 (555) 014-2290** · hey is this still Derek's number?
> **you** · No
> **+1 (555) 014-2290** · oh sorry!!

## Everything introduced, in order

| # | From | Introduces | Kind |
|---|---|---|---|
| 3 | MOTH | BITFLIP | exploit (the chain meter appears) |
| 5 | MOTH | HEAD START | patch (2 in the kit; the PATCHES button appears) |
| 7 | MOTH | RNG, BUFFER OVERFLOW | exploits |
| 8 | UNKNOWN NUMBER | INFECTED BITS begin | |
| 10 | MOTH | LOOKAHEAD; TROJAN | patch (2 in the kit); exploit |
| 12 | MOTH | THE BLACK MARKET | |
| 13 | TOLL | BLACK BOX I | box |
| 15 | MOTH | BRING YOUR OWN | the STORE's, introduced ones only |
| 18 | MOTH | PIVOT, SWAP, BACKDOOR; RESTORE POINT | exploits; patch (2 in the kit) |
| 20 | TOLL | WORM VIRUS, KEYLOGGER, HONEYPOT; BLACK BOX II, III | exploits; boxes |
| 21 | MOTH | ANTIVIRUS, FIREWALL DELAY; PACKET SNIFFER | patches (2 each in the kit); exploit |
| 23 | MOTH | LOGIC BOMB, DICTIONARY ATTACK, RAINBOW TABLE, BLACK BOX | exploits |

All 15 exploits, the 5 STORY patches (OVERTIME is BLITZ's), the 3 BLACK BOXES and the BLACK MARKET.

## What changes from the game now (v599)

- **One story of 24 transmissions** (8 a chapter) in place of three stories of 12 files.
- **Tools are introduced by people, not files.** IMs and calls, as well as files, on the cracked card.
- **Owned tools wait for stage 4.** Today a revealed tool you own is usable straight away; in v2,
  what you own only comes in after transmission 15. Before that it's MOTH's kit (the chain meter and
  gifted patches) and, from 12, the market.
- **The menu's PATCHES and EXPLOITS rows come back** in STORY at stage 4 (introduced ones only), so
  you can bring your own into a game, as in CLASSIC.
- **Infections begin at transmission 8**, not from the first game.
- **Jobs in other modes.** 8 transmissions come from a job played as PUZZLE, BLITZ, BREACH,
  DECRYPT or VS (a new STORY-only bot, THE CUSTODIAN), started from the story row on the menu.
- **The ARCHIVE** is sorted by sender.

## Decided

- **The old stories stay, as later seasons.** GHOSTS is season 1; THE TRACE, THE FOUR and PATIENT
  ZERO (`docs/STORIES.md`) open after it, with everything GHOSTS introduced usable from their start.
- **Kit gifts: 2 of each patch** when it's introduced, none after.
- **Jobs are worked out together.** The 8 above are a starting point, not settled.
- **THE CUSTODIAN gets his own VS bot**, STORY only, with his own face, look and lines (calm, polite,
  never raises his voice), not one of the four in disguise.
- **The ending's key.** No 1024-BIT gate: chapter 3 stays at 512-BIT, and the finale is THE
  CUSTODIAN's VS job, which is climb enough.

## Open questions

1. **The STORE.** Mark items STORY has introduced (and those it hasn't), or leave the STORE as it is?
2. **Calls.** ANSWER only, or also DECLINE (which leaves the same words as a voicemail)?
3. **Names.** MOTH, TOLL, the Custodian, HALCYON, Elena Luna, `dir.vance`, `ops.reyes` and
   `sec.hale` are all placeholders to change freely.
4. **A second story, branching.** A Telltale-style story with choices and several endings, as its
   own season or its own mode (`docs/STORY-PROMPT.md` notes what it would need from the game).
