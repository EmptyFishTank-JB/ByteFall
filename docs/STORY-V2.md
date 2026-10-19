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
board. Every key you crack brings the next **transmission**: a file from the archive, an IM, or a
call. The IMs bring the tools, one or two at a time, and the story moves through four stages:

| Stage | From | What you can use in a STORY game |
|---|---|---|
| **1. Nothing** | the start | Nothing. Chains score, but there's no chain meter yet. |
| **2. MOTH's kit** | transmission 3 | What MOTH has **introduced**: introduced exploits come from the chain meter (it appears with the first one); introduced patches come as gifts MOTH puts in your kit (2 of each when it's introduced, used from the PATCHES button). |
| **3. The BLACK MARKET** | transmission 12 | The kit, plus the BLACK MARKET: TOLL's stock of what's been introduced, bought with KEYS and resources, opened from the PATCHES or EXPLOITS button. |
| **4. Bring your own** | transmission 15 | All that, plus your own: exploits and patches you "compile" (buy in the STORE), but only the ones introduced so far. STORY's main menu gets its PATCHES and EXPLOITS rows back to bring up to 2 of each into a game. |

- **Introduced is the rule.** Owning something (bought in the STORE, or unlocked by level) doesn't
  make it usable in STORY. The story has to have introduced it first. Someone with everything
  unlocked starts STORY with nothing, like everyone else.
- **Introduced ones stay introduced.** Once MOTH or TOLL has told you about a tool, it's yours in
  STORY for good, in every STORY game after.
- **Limits.** Up to 2 patches and 2 exploits used per key (as now), back after GO DEEPER. The kit's
  gifts don't come back once used; from stage 3 on there's always the market, and from stage 4 the
  STORE.
- **Infections start when you're noticed.** No INFECTED BITS until the first call (transmission 8):
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

**Where each one shows up.** Transmission 1 pops up over the board as your first STORY game starts
(MOTH reaching you the moment the files land). Every one after it comes with a key cracked, on the
cracked card. The three unprompted messages (below) come between games, as a card on the main menu.
Each transmission's heading in the story says which: *pops up as your first STORY game starts*,
*on the cracked card*, or a JOB. Each comes in its own form:

- **FILE**: a document from the archive (memos, chat logs, records), as the files are now.
- **IM**: a thread on a phone screen that pops up over the game (always the same size, a phone's
  shape): each message in a bubble, its sender and time above it on its side (theirs left, yours
  right), each sender's own color, "..." in a bubble while they type, a beat between messages about
  as long as the reply would take. MOTH texts as a phone types (a capital at each sentence, full stops between them, none at the end of a message), TOLL in capitals; your replies are
  shown too, written for you. Only that transmission's messages are on it, and a long thread
  scrolls. The cracked card and the ARCHIVE show it as an inbox does (its last message, OPEN
  THREAD). A time written in the story (`**moth** 02:14 ·`) is kept; the rest get late-night
  times of their own. **MOTH is an UNKNOWN CONTACT** on your phone until transmission 12, where
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

The jobs, in the story: **4** SEALED FILE, **9** LIVE TRACE, **11** FIREWALL, **13** TOLL'S TEST,
**17** SEALED FILE, **19** LIVE TRACE, **22** FIREWALL, **24** THE CUSTODIAN (the finale). That's 8
of the 24; the other 16 come from keys.

**Side jobs (optional, later).** The ARCADE's games fit as extra jobs that pay KEYS and resources
but aren't needed to finish: CODE BREAKER (the lock on one of TOLL's boxes), TRACE (tracing the
unknown number back), ROUTING (bouncing your line so the trace loses you), DEFRAG (piecing together
Luna's damaged files) and DECODE (a picture hidden in the archive).

### Unprompted contact

A few short messages come outside the cracks, once each, when something happens:

- **Traced in STORY for the first time** (after transmission 3). IM from MOTH:
  `They nearly had you. You stack too high when you're nervous`
- **DISCONNECT after a crack** (after transmission 13). IM from TOLL:
  `NICE HAUL. MARKET'S OPEN WHEN YOU ARE.`
- **Back after 3 days or more** (after transmission 8). Voicemail from UNKNOWN NUMBER:
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

### Chapter 1: THE DROP (any key)

**1 // IM // MOTH** · *pops up as your first STORY game starts*
> **moth** 02:14 · Hey, it's me
> **moth** 02:14 · You're not a hard person to find you know?
> **moth** 02:15 · Anyway, that archive I sent you is around four gigs, all encrypted, about two dozen to go through
> **moth** 02:15 · Don't try to brute force it. Crack each key a few bits at a time
> **you** 02:15 · Who is this?
> **moth** 02:16 · Don't worry about that right now
> **moth** 02:16 · Start with that first file. I'll message you again later

**2 // FILE // HALCYON SYSTEMS // #corrections** · *on the cracked card*
> `<ops.reyes>` queue's at 41 tonight. 38 standard, 3 full
> `<dir.vance>` Fulls go first. The clients are waiting.
> `<eng.luna>` what's a "full"?
> `<dir.vance>` Not your department.

**3 // IM // MOTH** · *introduces BITFLIP (exploit)* · *on the cracked card*
> **moth** · Watched you crack that last key. You fight the board too much
> **moth** · Here. BITFLIP. It turns every column upside down. What was buried comes up top
> **moth** · Chain your decrypts and the meter beside the board fills. Full, it's yours to use
> **you** · Why are you helping me?
> **moth** · Because they'll notice you soon. You should be faster by then

*The chain meter appears; it earns BITFLIP.*

**4 // FILE // HALCYON // THE LEDGER: PRICE SHEET** · **JOB: SEALED FILE (PUZZLE)** · *on the cracked card for now (a JOB later)*
> STANDARD CORRECTION (one debt, one record, one conviction): 40,000.
> FULL CORRECTION: on request.
> All corrections are permanent. HALCYON keeps no copies.

**5 // IM // MOTH** · *introduces HEAD START (patch)* · *on the cracked card*
> **moth** · You start every key cold. Stop doing that
> **moth** · HEAD START: your chain meter starts half full and holds until your first decrypt
> **moth** · I put two in your kit. PATCHES, beside your EXPLOIT button
> **moth** · When they're gone they're gone. For now, ghost

*The PATCHES button appears, with 2 HEAD STARTs.*

**6 // FILE // HALCYON // #corrections** · *on the cracked card*
> `<eng.luna>` pulled a "full" out of the queue to test the eraser. it's a person.
> `<eng.luna>` name, birth record, bank, lease, phone. all of it. gone.
> `<dir.vance>` It's a correction. The client asked for it.
> `<eng.luna>` the person didn't.
> `<dir.vance>` Log off, Luna.

**7 // IM // MOTH** · *introduces RNG and BUFFER OVERFLOW (exploits)* · *on the cracked card*
> **moth** · Two more. They're messy. That's the point
> **moth** · RNG scrambles every bit on the board to a random number. Use it when there's nothing left to lose
> **moth** · BUFFER OVERFLOW adds 1 to every bit. The top number spills over and gets re-encrypted, so watch your 7s
> **moth** · The meter picks which one you get. You don't

**8 // CALL // UNKNOWN NUMBER** · *the first warning; INFECTIONS begin* · *on the cracked card*
> INCOMING CALL // UNKNOWN NUMBER
> "Good evening. Please don't hang up. This is a courtesy."
> "You've opened something that doesn't belong to you. You haven't read much of it. That's good. It means this can still end."
> "Delete it, and we never speak again."
> "I'll know if you don't."
> CALL ENDED // 0:41

*From now on, STORY games have INFECTED BITS.*

### Chapter 2: THE LIST (256-BIT or deeper)

**9 // FILE // HALCYON // #security** · **JOB: LIVE TRACE (BLITZ, 2:00)** · *on the cracked card for now (a JOB later)*
> `<sec.hale>` someone's reading the luna archive. slow. one key at a time.
> `<dir.vance>` Trace them.
> `<sec.hale>` tried. they drop the line every time we get close.
> `<dir.vance>` Then call the Custodian.

**10 // IM // MOTH** · *introduces LOOKAHEAD (patch) and TROJAN (exploit)* · *on the cracked card*
> **moth** · He called you. Calm voice. Very polite
> **moth** · That's the Custodian. He doesn't hurt people. He corrects them. It's worse
> **moth** · LOOKAHEAD: see your next bit for a minute. Two in your kit
> **moth** · TROJAN wipes out every block touching where it lands. For when it's piled up
> **moth** · You'll want to see them coming

**11 // FILE // HALCYON // THE LIST (excerpt)** · **JOB: FIREWALL (BREACH)** · *on the cracked card for now (a JOB later)*
> 0117 // MARSH, D. // STANDARD // DEBT // CORRECTED
> 0118 // FLORES, I. // FULL // CORRECTED
> 0119 // NAKASHIMA, R. // FULL // CORRECTED
> 0120 // [ENCRYPTED DEEPER] // FULL // CORRECTED
> 2,947 ENTRIES. 309 FULL.

**12 // IM // MOTH** · *introduces the BLACK MARKET* · *on the cracked card*
> **moth** · I can't keep sending you tools. Every package I send is a door they can follow back
> **moth** · There's a market. No names, no questions, everything has a price
> **moth** · Ask for Toll. Say the moth sent you
> **moth** · And ghost. Don't trust the boxes

*Up to here MOTH's IMs come from an UNKNOWN CONTACT; this card says CONTACT SAVED // MOTH, and every
IM after it is from MOTH.*

*The BLACK MARKET opens from the PATCHES and EXPLOITS buttons. It sells what's been introduced.*

**13 // IM // TOLL** · *introduces BLACK BOX I* · **JOB: TOLL'S TEST (DECRYPT)** · *on the cracked card for now (a JOB later)*
> **TOLL** · THE MOTH'S FRIEND. YOU PASSED. BARELY.
> **TOLL** · STOCK TURNS OVER EVERY KEY YOU CRACK. PRICES ARE PRICES.
> **TOLL** · NEW IN: BLACK BOX I. COULD BE ANYTHING. COULD BE SOMETHING THAT BITES.
> **TOLL** · NO REFUNDS. NO NAMES. NO EXCEPTIONS.

**14 // CALL // UNKNOWN NUMBER** · *the second call: a threat* · *on the cracked card*
> INCOMING CALL // UNKNOWN NUMBER
> "You bought from TOLL. TOLL sells to everyone. Including us."
> "I asked nicely. I won't again."
> "Your router is in the hall closet. Second shelf. The light blinks green while you're on the line."
> "It's blinking now."
> CALL ENDED // 0:22

**15 // IM // MOTH** · *bring your own* · *on the cracked card*
> **moth** · You're still on. Good. Stubborn
> **moth** · Stop waiting on me and Toll. You can write your own tools
> **moth** · Compile them at home, bring them in. Anything you've seen work in here
> **moth** · Only what you've seen. Untested code gets people traced

*From now on, exploits and patches you own (the STORE's) can be brought into STORY, if they've been
introduced: STORY's main menu gets PATCHES and EXPLOITS rows, and what you own shows in the in-game
cards too. The STORE marks what STORY has introduced.*

**16 // FILE // HALCYON // #corrections** · *on the cracked card*
> `<eng.luna>` i'm taking the list out. all of it. every name. every "full."
> `<dir.vance>` You built the eraser, Elena. You know what it can do.
> `<eng.luna>` i know. that's why it has to be me.
> USER eng.luna HAS LEFT THE CHANNEL

### Chapter 3: CORRECTIONS (512-BIT or deeper)

**17 // FILE // HALCYON // CORRECTION ORDER 0120** · **JOB: SEALED FILE (PUZZLE)** · *on the cracked card for now (a JOB later)*
> SUBJECT: LUNA, ELENA. ENGINEER, HALCYON SYSTEMS.
> TYPE: FULL.
> REQUESTED BY: HALCYON SYSTEMS.
> STATUS: CORRECTED.
> NOTE: the archive she took was never recovered.

**18 // IM // MOTH** · *introduces PIVOT, SWAP, BACKDOOR (exploits) and RESTORE POINT (patch)* · *on the cracked card*
> **moth** · You read 0120
> **moth** · Don't. Not yet. Finish it first
> **moth** · PIVOT swaps a column with its neighbor. SWAP trades any two bits. BACKDOOR deletes the bottom row, layers and all
> **moth** · And RESTORE POINT. If they finish the trace, the system rolls back and you keep going. Once
> **moth** · You're going to need once

**19 // CALL // UNKNOWN NUMBER** · *your name on an order* · **JOB: LIVE TRACE (BLITZ, 1:30)** · *on the cracked card for now (a JOB later)*
> INCOMING CALL // UNKNOWN NUMBER
> "You got away from that trace. You won't twice."
> "I've been patient."
> "There's an order on my desk with your name on it. Your real one."
> "Disconnect, and it stays on my desk. Keep reading, and I sign it."
> "No one will remember to miss you. That isn't a threat. It's what the job is."
> CALL ENDED // 0:35

**20 // IM // TOLL** · *introduces WORM VIRUS, KEYLOGGER, HONEYPOT (exploits), BLACK BOX II and III* · *on the cracked card*
> **TOLL** · WORD IS YOU'RE ON A LIST.
> **TOLL** · NOT MY BUSINESS. MONEY'S STILL MONEY.
> **TOLL** · NEW IN: WORM VIRUS. KEYLOGGER. HONEYPOT, FOR WHOEVER'S FOLLOWING YOU. BOXES II AND III IF YOU FEEL LUCKY.
> **TOLL** · PAY UP FRONT. CORRECTED PEOPLE DON'T PAY THEIR DEBTS.

**21 // IM // MOTH** · *introduces ANTIVIRUS, FIREWALL DELAY (patches) and PACKET SNIFFER (exploit)* · *on the cracked card*
> **moth** · Toll's boxes bite. You knew that
> **moth** · ANTIVIRUS clears whatever's running and catches the next one. FIREWALL DELAY holds the next layer back four drops
> **moth** · PACKET SNIFFER lets you pick your next three bits. Careful. It's addictive
> **moth** · They're the last clean tools I wrote. Before

**22 // FILE // HALCYON // THE LIST (complete)** · **JOB: FIREWALL (BREACH)** · *on the cracked card for now (a JOB later)*
> 2,948 ENTRIES. 310 FULL.
> 2,947 CORRECTED.
> 1 PENDING. SUBJECT: [YOU].
> REQUESTED BY: THE CUSTODIAN.

**23 // IM // MOTH** · *introduces LOGIC BOMB, DICTIONARY ATTACK, RAINBOW TABLE, BLACK BOX (exploits)* · *on the cracked card*
> **moth** · It was me. 0120
> **moth** · I built the eraser. When I tried to undo it, they ran it on me
> **moth** · No name. No records. A moth. You only see one when there's a light on
> **moth** · Here's everything I have left. LOGIC BOMB, DICTIONARY ATTACK, RAINBOW TABLE, BLACK BOX
> **moth** · The eraser has an undo. It's under the last key. Crack it

**24 // CALL // UNKNOWN NUMBER, then IM // MOTH** · *the end* · **JOB: THE CUSTODIAN (VS)** · *on the cracked card for now (a JOB later)*
> (his program, beaten: THE CUSTODIAN // OVERFLOWED)
> INCOMING CALL // UNKNOWN NUMBER
> "You can't put people back."
> CALL ENDED // 0:04 (you hung up)
>
> RESTORE QUEUE // 309 FULL CORRECTIONS // REVERSING...
> ORDER // [YOU] // VOID
>
> **moth** · My name is Elena Luna
> **moth** · Say it once. So it's written down somewhere

*STORY complete. Every transmission stays in the ARCHIVE. STORY games go on (keys still pay KEYS),
with everything introduced.*

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
