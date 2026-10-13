# Prompt for the official storyline

For working on GHOSTS (`docs/STORY-V2.md`) with another assistant (Copilot, Gemini). Copy the prompt
below, then paste the whole of `docs/STORY-V2.md` after it where it says so.

```text
You're helping write the official storyline for STORY, the story mode of ByteFall, a mobile puzzle
game with a green-on-black hacker terminal look. I'll paste the current draft (GHOSTS) at the end.
Improve the writing and the story within the rules below. Don't change the game mechanics; if you
want to, put the idea under "Suggestions" at the end instead of in the story.

THE GAME, BRIEFLY
- Numbered bits (1 to 7) fall into a 7x7 grid. A bit decrypts (clears) when its number equals the
  length of the run it's in, across or down. Encrypted layers rise from the bottom every few drops
  (ENCRYPT IN counts down to the next). Chains of decrypts score more. If a column stacks above the
  line, the trace completes and the game is over ("TRACE COMPLETE. They found you.").
- In STORY, every game has a key to crack, its ENCRYPTION STRENGTH: 128-BIT at 1,500 points, then
  192-BIT at 3,000, 256-BIT at 4,500, 384-BIT at 6,000, 512-BIT at 7,500. After each crack the
  player picks GO DEEPER (the next key, harder) or DISCONNECT (end the game on a win).
- Each key cracked delivers the next TRANSMISSION of the story. 24 transmissions, in 3 chapters of 8.
  Chapter 1's come from any key, chapter 2's from 256-BIT keys or deeper, chapter 3's from 512-BIT
  or deeper. Eight transmissions come from a JOB instead: a challenge played as another game mode
  (PUZZLE, BLITZ, BREACH, DECRYPT or VS). The jobs in the draft are a starting point.

THE TOOLS (use these names and effects exactly; don't invent new ones)
Exploits:
- BITFLIP: turns every column upside down.
- RNG: scrambles every bit on the board to a random number.
- BUFFER OVERFLOW: adds 1 to every bit; the top number is re-encrypted under two layers.
- TROJAN: wipes out every block touching the spot where it lands.
- PIVOT: swaps the column it lands in with a neighbor.
- SWAP: any two bits on the board trade places.
- BACKDOOR: deletes the bottom row, layers included; everything drops by one.
- WORM VIRUS: wipes out every block in the column it lands in.
- KEYLOGGER: shows your next 3 bits for the next 10 drops.
- HONEYPOT: a trap; when a bit beside it decrypts, every bit of that number within 2 cells does too.
- PACKET SNIFFER: for your next 3 bits, you pick each one's number.
- LOGIC BOMB: lands as a 3-drop countdown, then wipes out the 5x5 around it.
- DICTIONARY ATTACK: every encryption layer on the board loses one level.
- RAINBOW TABLE: decrypts every bit showing the most common number on the board.
- BLACK BOX: opens into a random exploit.
Patches:
- HEAD START: the chain meter starts half full, and holds until your first decrypt.
- LOOKAHEAD: see your next bit for 60 seconds.
- FIREWALL DELAY: the next encryption layer rises 4 drops later.
- RESTORE POINT: if the trace completes, everything above the bottom 3 rows is wiped and you keep
  playing. Once a game.
- ANTIVIRUS: clears every infection running, or quarantines the next one.
Other things in the world: BLACK BOXES I, II and III (sealed, sold on the black market, sometimes
infected), INFECTIONS (ADWARE blocks a column, SPYWARE hides your next bits, RANSOMWARE locks bits
for KEYS, MALWARE corrupts the board, the CRYPTOJACKER steals resources, SCAREWARE throws fake
alerts), KEYS (the game's currency), the STORE.

THE STRUCTURE TO KEEP
- The player starts with no tools at all. Tools are introduced by characters, mostly MOTH over IM,
  some by TOLL. Keep the order and the transmission each one comes in (the table "Everything
  introduced, in order" in the draft). Infections start at transmission 8 (the first call); the
  BLACK MARKET opens at 12; "bring your own" (buying tools in the STORE) comes at 15.
- An introducing transmission should make the tool's effect clear in the character's own voice, in
  one line, the way the draft does.
- Three kinds of transmission: FILE (a document from the archive: chat logs, memos, records), IM (a
  chat thread with handles; the player's replies are written for them, short), CALL (a transcript,
  the caller's lines in quotes, ending with CALL ENDED and its length).
- They're read on a phone card about 380px wide: 3 to 6 lines each, each line under about 90
  characters, a whole transmission under about 450 characters. Short and punchy beats long.
- The ending stays: the finale is a VS match against THE CUSTODIAN's program, then MOTH's last IM.

THE VOICES
- The player: a small-time hacker with no name. MOTH calls them "ghost".
- MOTH: the informant. IM only, all lowercase, terse, dry, warm underneath, knows too much.
- TOLL: runs the black market. ALL CAPITALS, transactional, sells to anyone.
- THE CUSTODIAN (UNKNOWN NUMBER): HALCYON's fixer. Calls, never writes. Polite full sentences, never
  raises his voice, threatens by implication. He doesn't hurt people; he "corrects" them.
- HALCYON's people in the files (dir.vance, ops.reyes, sec.hale, eng.okafor): corporate chat,
  each with their own way of typing.

TONE AND LIMITS
- A grounded techno-thriller, tense and a little sad, PG-13. Menace through what's implied: no
  gore, no slurs, nothing sexual. No real companies, people, products or places. No real hacking
  instructions. American spelling. Avoid cliches ("I'm in", "enhance", "hack the mainframe").
- Seasons 2 to 4 of STORY already exist (THE TRACE: a tracing system called WARDEN at a company
  called LATTICE; THE FOUR: where the VS bots came from; PATIENT ZERO: who writes the infections and
  why the black market's boxes bite). Don't contradict them. A light hook into season 2 at the very
  end is welcome, not required.

WHAT TO SEND BACK
1. The full story, all 24 transmissions, in the draft's markdown format:
   **N // TYPE // SOURCE** · *introduces ...* · **JOB: ...** (when it is one), then the lines as a
   blockquote.
2. THE CUSTODIAN's VS bot: a one-line style card ("PATIENT // ..."), a description of his face and
   look for the pixel artist, and his face lines, each in capitals and 11 characters or fewer: at
   rest, hello, thinking, happy (he scored), hit, worried, dead (he lost), smug (he won), annoyed,
   devious. (The other bots' lines, for scale: BUNKER says STEADY, HOLD, BRACE, BREACH, SECURE.)
3. Job ideas for the 8 job transmissions (which mode, what it is in the story, how it's won), as
   proposals.
4. Three alternatives for each placeholder name (MOTH, TOLL, THE CUSTODIAN, HALCYON, Adaeze Okafor).
5. A short list of what you changed and why, and any Suggestions about mechanics, kept separate.

THE CURRENT DRAFT
[paste docs/STORY-V2.md here]
```

## For a second, branching story (notes, not part of the prompt)

If a Telltale-style story with choices and several endings comes later, it would need the game to
add a few things, so the writing can count on them:

- **Choices.** In an IM, two or three replies to pick from instead of one written for you; on a
  call, ANSWER or DECLINE, and maybe a reply mid-call. A choice is made on the cracked card, before
  GO DEEPER.
- **Flags.** Each choice sets a flag the story remembers (`trusted_moth`, `paid_toll`, `hung_up`);
  later transmissions have variants that depend on them, and the endings on the flags you've built.
- **Endings.** A few (3 or 4 is plenty), each with its own last transmission and a line in the
  ARCHIVE saying which you reached; a way to replay from a chapter to try another path.
- **The writing format.** Each transmission written once per variant, with the flags it needs
  noted in its header (`**12 // IM // MOTH** · *if trusted_moth*`).

Ask for a prompt for that one when you're ready; it would include these rules for the writers.
