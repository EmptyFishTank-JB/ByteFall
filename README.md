# ByteFall

A browser number puzzle about cracking encrypted data, inspired by
**Blockchain**, the hacker-themed arcade cabinet game in *Arcade Paradise*.

- **Play:** https://emptyfishtank-jb.github.io/ByteFall/
- **Studio:** Empty Fish Tank
- **Born:** September 23, 2026, 8:13 PM CST

Mechanically it's a Drop7-style puzzle:

- Encrypted bits numbered 1-7 fall into a 7×7 terminal, one column at a time
  (Hard: 1-8 on an 8×8 grid, a full byte).
- A bit decrypts (clears) when its number matches the length of the unbroken
  line it sits in, across or down (e.g. a `[5]` decrypts when it's part of an
  unbroken run of exactly 5 filled cells in its row or column).
- A decrypted bit scores 10 plus its number (a `[4]` is 14, a `[7]` is 17).
  Blocks wiped out by exploits score a flat 10.
- Decrypts chain: bits above fall into the gap and may make new matches.
  Chains multiply the points.
- Every 8 drops a row of encryption layers (`[=]`) rises from the bottom.
  Decrypting a bit beside one peels it down to `[-]`, and a second peel
  reveals the bit underneath.
- Columns can spill into an overflow row above the `========` line. Decrypts
  still resolve there (a lone `[1]` decrypts itself), but anything left above
  the line afterwards completes the trace and ends the run.

## Repo layout

```
index.html              the game page (GitHub Pages serves it from the root)
manifest.webmanifest    the installed app's name, colors and icons
css/style.css           all the styles and the themes
js/                     the game: script.js (the game itself), player.js (the music player), progress.js (levels, unlocks,
                        achievements, stats), unlocks.js, cpu.js (VS CPU), sfx.js, fx.js,
                        viz.js, grid-bg.js
js/data/                puzzles.js, daily-puzzles.js
js/music/               music.js (the player) and one music-*.js per track
assets/                 fonts/, icons/, audio/ (WAV renders of the tracks, not used by the game)
dev-tools/audio.html    the audio compendium
docs/achievements.csv   every achievement, grouped
```

## Exploits

On Normal and Hard, a 5x chain unlocks a random exploit. On Easy, each exploit
has its own chain length, so shorter chains unlock the weaker ones. The exploit
waits in the exploit button (the game card's lower-right corner), which glows
green and shows the exploit's icon (with a count if more are waiting). Tap it
(or press E) to arm the exploit: the button pulses amber and the exploit is
your next drop, with no taking it back. Drop it into a column like a bit and it
runs where it lands. With nothing to arm, the button opens the menu's EXPLOITS tab:

| Exploit | Easy chain | Effect |
|---|---|---|
| Worm Virus `[§]` | 5x | Wipes out every block in the column it lands in |
| Buffer Overflow `[+]` | 4x | Adds 1 to every bit; the top number (7, or 8 on Hard) is re-encrypted under two layers |
| Trojan `[◈]` | 4x | Wipes out every block touching the spot where it lands |
| RNG `[?]` | 3x | Scrambles every bit to a random number |
| Bitflip `[↕]` (drawn as an arrow icon) | 3x | Turns every column upside down |
| Dictionary Attack `[#]` * | 4x | Every encryption layer on the board loses one level at once |
| Keylogger `[@]` * | 3x | Shows your next 3 bits for the next 10 drops |
| Backdoor `[_]` * | 4x | Deletes the entire bottom row, layers included; everything drops by one |
| Rainbow Table `[*]` * | 5x | Decrypts every bit showing the most common number on the board |
| Pivot `[⇆]` * | 3x | Swaps the column it lands in with a neighbor: pick the column, then tap ← or → (or press the arrow keys), with no backing out once picked; edge columns swap with their only neighbor |
| Packet Sniffer `[~]` * | 3x | For your next 3 bits, tap CURRENT (or press ↑ / ↓) to pick each one's number |
| Logic Bomb `[!]` * | 4x | Lands as a `[!3]` block counting down each drop; at zero it wipes out the 5×5 around it |
| Honeypot `[◎]` * | 4x | Lands as a trap; when a bit next to it decrypts, every bit of that number within 2 cells decrypts too |

Every exploit is unlocked by level and has to be equipped in a slot (see below).

A drop earns at most one exploit, picked from the longest chain it set off.

## Modes

| Mode | What changes |
|---|---|
| CLASSIC | The main game, on EASY / NORMAL / HARD |
| DAILY | Four daily games, picked on a second row under the modes. Each is the same for everyone that UTC day, and each keeps a daily streak. **DECRYPT**: a fixed stack of 40 bits dealt from a seed of the date (Normal rules, the five standard exploits); it ends when the stack runs out. **PUZZLE**: a new puzzle every day (from `js/data/daily-puzzles.js`), harder through the week: Monday is 1 bit, Sunday 4 bits with layers; you get 4 tries a day (a try counts from its first drop); once it's solved or the tries are used up, later runs are practice. **BLITZ**: the same bits for everyone against a 60-second clock. **BREACH** (daily only): the board starts with a 3-row firewall of level 1 and 2 layers and you get 30 bits to break through; each layer broken is +25 and clearing the whole board is +1,000. For DECRYPT, BLITZ and BREACH your first run each day is the official score and later runs are practice. SHARE on the results screen (every daily game, win or lose; the puzzle shares one square per try) sends or copies your result |
| BLITZ | Normal rules against a 2-minute clock that starts on your first drop (paused while the tab is hidden) |
| ZEN | Normal rules with no encryption layers and no clock |
| VS | VS CPU (`js/cpu.js`): you against a computer opponent at EASY / NORMAL / HARD / INSANE (faster and smarter up the levels; HARD unlocks at Lv 14, INSANE at Lv 46), played by one of four bots with their own look, lines and play style: BOT (balanced), GRIFTER (greedy: chases big chains, takes risks; Lv 6), BUNKER (defensive: low and flat, a little slower; Lv 17) and GLITCH (fast and erratic; Lv 33). The level sets the bot's resting face (EASY happy, NORMAL confident, HARD angry, INSANE red-eyed with bared teeth); switching bots pixelates one out and the next in. EXPLOITS: ON / OFF (setup screen) lets both sides use exploits: yours as in the other modes, and the CPU earns one with a chain of 3+ (WORM VIRUS on its tallest column, DICTIONARY ATTACK peeling every layer), wearing a devious grin while it holds one. Before START, a see-through card over the CPU's board describes the picked bot's play style. Toggling a setting gets a -_- from the bot; a locked bot or level shows a notice above the setup title, on Normal rules with the same bits in the same order. A setup screen over your board picks the level and, below it, LAYERS: ON / OFF (the usual layer row every 8 drops, on both boards); START bursts it apart and starts the CPU's clock, and it comes back after the win / loss screen. A drop clock runs under CURRENT (9 / 7 / 5.5 / 4.5 seconds on EASY / NORMAL / HARD / INSANE, red for the last 2): a bit left too long drops by itself into a random column that won't overflow, so waiting out the CPU is no way to win. Attacks charge before they cross: the blocks a chain sends (after cancelling what's headed your way, landing or still charging) build up while the chains keep coming and go over once 1.5 seconds pass with nothing added (shown as +n by the CPU's score; the CPU's charging attack shows as hollow pips and +n in the INCOMING banner). CURRENT shows the whole bit in its box, as in the other modes. The CPU's face reacts on the setup screen ahead of its waiting faces: a harder level gets a devious grin, an easier one a smug look, a new game mode or target a raised eyebrow or grin, a new bot its hello (BOT happy, GRIFTER smug, BUNKER skeptical, GLITCH devious). Tap its face and it reacts as the start screen's bots do: EEK!, or HEY! with a shake-off and a raised eyebrow. Every 30 points a drop scores sends one encrypted block (a one-peel layer hiding a random bit) onto the other board, falling from the top into random columns, one at a time, after its next move; your chains cancel blocks headed your way first, and only the rest go to the other side. At most 8 / 16 / 24 / 32 blocks (EASY / NORMAL / HARD / INSANE) can wait to land on either board; any sent past that are lost. Four game modes (setup screen, top row): CLASSIC (the first to overflow loses); ATTRITION (both start at 0, and the points from chain links 2x and up and NIBBLE bonuses also come off the other side's score; first to the target wins); DEATHMATCH (a straight race to the target score); TUG OF WAR (both start with the same points, and every point scored is taken from the other side; whoever runs out loses). The target (500 to 10,000, default 2,000) or starting points (500 to 5,000, default 1,000) are set with − / + in steps of 500. Blocks fly and overflowing loses in every mode. The incoming banner shows a small pip per block (groups of 8). In a match the header gives way to a VS. CPU title between the top icons (green VS., amber CPU), the level and layers line, your stats in a 2x2 grid of squares (SCORE, CHAIN / ENCRYPT IN, CURRENT, each value centered with its label centered above; a KEYLOGGER's preview splits the CURRENT square) and BOT (the CPU's face: a pixel chip with legs that idles, blinks and glances to the sides and up now and then, looks around before each move (waiting and planning each have two variants now and then: BORED / TAPPING, SCAN / PONDER), grins when it scores, flinches when your blocks land, sweats with a tall stack, and ends on X eyes or a smug GG), the CPU's board (with its numbers, playing each move back: bits falling, decrypting and layers peeling; press and hold it to see it full size over yours with all your board's effects), laid out so your board keeps its regular size and place; PAUSE (the lower-left corner, or Esc / P) in a match covers your board as the setup screen does and stops the CPU's clock (the bot waits, -_-, tapping a foot): RESUME, RESTART (a new match with the same options) and EXIT (back to the setup screen), the last two taking a second tap to confirm; a pause pressed mid-drop opens once the drop finishes. On the setup screen the corner is QUIT, and one press goes back to your previous mode (dragging off the button before letting go cancels a press). CURRENT shows [?] until START. The CPU pauses while a panel is open. RECORDS → STATS keeps wins and losses per level |
| PUZZLE | 60 set boards (in `js/data/puzzles.js`): decrypt every block using exactly the bits given, in order. Solving one opens the next; the arrow buttons move between them. No new layers rise and no exploits drop; puzzle layers hide a fixed bit |

Switching modes mid-run asks to confirm, like RESTART. Each mode keeps its
own best score.

## Difficulty

| Setting | Effect |
|---|---|
| Easy | Shows the next bit, and exploits unlock at 3x–5x depending on the exploit; NIBBLE bonus |
| Normal | New encryption layer every 8 drops; NIBBLE bonus |
| Hard | A full byte: 8×8 grid with bits 1-8; new layer every 8 drops, minus one per 700 points, down to every 4; BYTE bonus |

On Hard, every 8 bits a single drop decrypts, chains included, make a byte:
**BYTE DECRYPTED** adds a 256-point (2^8) bonus per byte. On Easy and Normal
(and the modes that play Normal rules, all but PUZZLE), every 4 bits make a
nibble: **NIBBLE DECRYPTED** adds a 16-point (2^4) bonus per nibble.

High scores are saved in your browser, one per difficulty (Hard's started
fresh when it moved to 8×8).

## Levels, DECRYPTOR ranks and unlocks

**Levels.** Every bit you decrypt is XP: **100 bits (12.5 bytes) per level**,
from Lv 0 to **Lv 80**. Lv 80 comes at 8,000 bits, so a full DECRYPTOR rank
is exactly **1 kilobyte**. The level bar sits under the title.

**Everything unlocks by level, within a rank.** Exploits, exploit slots, Hard
mode, the VS CPU's levels and bots, tracks, themes and fonts each open at a
level between Lv 2 and Lv 80, spread so a level or two always brings something:

| Lv | Unlock | Lv | Unlock | Lv | Unlock |
|---|---|---|---|---|---|
| 2 | TRACK 02 | 20 | TRACK 06 | 46 | INSANE CPU |
| 3 | RNG | 21 | PRESS START | 47 | BACKDOOR |
| 4 | CIPHER | 23 | PIVOT | 50 | TRACK 12 |
| 5 | SLOT 1 | 25 | TRACK 07 | 52 | PAPER |
| 6 | BOT: GRIFTER | 27 | ANAGLYPH | 53 | LOGIC BOMB |
| 7 | TRACK 03 | 29 | WORM VIRUS | 55 | TRACK 13 |
| 8 | BITFLIP | 30 | SLOT 3 | 57 | BYTESIZED |
| 9 | SHARE TECH MONO | 31 | TRACK 08 | 59 | HONEYPOT |
| 10 | HARD MODE | 33 | BOT: GLITCH | 60 | SLOT 5 |
| 11 | TRACK 04 | 34 | SYNTHWAVE | 62 | TRACK 14 |
| 12 | AMBER CRT | 35 | KEYLOGGER | 63 | GLYPH |
| 13 | BUFFER OVERFLOW | 36 | TRACK 09 | 65 | DICTIONARY ATTACK |
| 14 | HARD CPU | 39 | BITCOUNT | 66 | ORBITRON |
| 15 | SLOT 2 | 40 | TRACK 10 | 68 | TRACK 15 |
| 16 | TRACK 05 | 41 | PACKET SNIFFER | 70 | RAINBOW TABLE |
| 17 | BOT: BUNKER | 43 | DOT MATRIX | 72 | SPECTRUM |
| 18 | TROJAN | 44 | TRACK 11 | 75 | SLOT 6 |
| 19 | MONOCHROME | 45 | SLOT 4 | 77 | TRACK 16 |

**DECRYPTOR ranks** (the game's prestige). With Lv 80 full, RANK UP TO
DECRYPTOR (in RECORDS → UNLOCKS, four presses) starts you again at Lv 0 one
rank higher, and **everything locks again** to be unlocked by level once more.
The one thing kept for good: DECRYPTOR N keeps N exploit slots (up to 6) from
Lv 0, and the slots still to earn take the table's earliest slot levels (Lv 5,
15, 30 ...). A theme, font, track or
difficulty picked but locked again falls back to the default until it reopens.

**Exploit slots (loadout).** Only exploits equipped in a slot are awarded. A new
unlock drops into a free slot by itself; tap an exploit card to remove or equip
it. The loadout is locked during a session: change it before the first drop or
after the game ends. The daily games always use the five standard exploits, so
they're the same for everyone.

**Fonts** (SETTINGS → FONT): COURIER is the default; SHARE TECH MONO, PRESS
START, BITCOUNT, BYTESIZED and ORBITRON (Matt McInerney's wide geometric
capitals, bold for the numbers) unlock by level. Each has an achievement for
playing a full session in it (TECH SUPPORT, INSERT COIN, BIT BY BIT,
BITE-SIZED, IN ORBIT). The font changes all the game's text (the particles and the dev
page too) but never the layout: every button and display keeps the size and
place it has in Courier. The fonts are bundled in `assets/fonts/` and set up by
`js/fonts.js`, which measures the device's own Courier (Courier New, Liberation
Mono, Droid Sans Mono... it varies) and scales each font so its capitals are the
same height, sitting in the same place in a line as tall as Courier's (every
line of text uses Courier's line height). The buttons sized by their label are
measured in Courier and locked to that size (`lockButtons` in `js/script.js`),
and so are the notes and descriptions above buttons. A label or note too wide
for its space in a wider font (PRESS START, ORBITRON) closes up its letter
spacing, then shrinks, until it fits. The FONT and THEME notes keep room for
their longest text, so picking one never moves what's below.

Tracks 11-16 are still to come. COLLECTOR, DJ and AUDIOPHILE need all 16
tracks, so they open up once the last one is made.

**VS matches aren't sessions.** The SESSIONS achievements, the "in one
session" ones (SCORE, NO TOOLS, ZERO-DAY, SECOND WIND, CHAINED EXPLOITS, the
full-session theme / font / track ones and the finish-on-a-score secrets) and
RAGE QUIT count only the solo modes. VS has its own achievements: VS CPU (wins,
levels, COUNTERSTRIKE, DDOS, FLAWLESS, and the hidden TILTED and AFK), VS BOTS
(beat each bot, all of them, all of them on INSANE) and VS MODES AND SETTINGS
(a win in each mode and all four, 10,000-point and 5,000-point wins, BANKRUPT,
KNOCKOUT, BARE METAL, ARMS RACE, ZERO MERCY). Bits, chains, nibbles, layers and
exploits run in VS still count toward everything else.

**Streaks follow your local clock.** DAILY DRIVER, STREAK and CENTURY show your
current daily streak, not your best: it lasts through the next local day and
drops to 0 once a whole day passes with no Daily game (after midnight on the
day you missed). DAILY SWEEP shows today's daily games and starts over at local
midnight. Achievements for a run in a row (SURGICAL, PICKPOCKET) show your best
run so far. Unearned rows in RECORDS say which kind of count they show.

The menu icon (lines / trophy, top left) opens four tabs, each its own card:
**RULES**, **RECORDS**, **EXPLOITS** and **STORE**. RECORDS has level and DECRYPTOR rank,
every unlock and achievement with a progress tracker, and lifetime stats
(UNLOCKS / ACHIEVEMENTS / STATS). New unlocks, level-ups
and achievements pop up as they happen (achievements stay up about 5.5 seconds, like a console's, before crumbling; the rest about 2). Progress is saved in the browser
(`bytefall-progress`).

**STORE** (`js/store.js`, the cart tab): two purchases, **REMOVE ADS** (no ads,
nothing unlocked) and **FULL ACCESS** (everything that unlocks by level, and no
ads), each with its price and BUY (OWNED once bought), and **RESTORE PURCHASES**
for another device or a reinstall. It's a preview for now: BUY and RESTORE say
the store isn't open and charge nothing, at placeholder prices ($2.99 and $4.99;
the store will set the real ones). The app will swap `buy()` and `restore()` for
Google Play's billing and tell `Unlocks` what's owned (`set` / `setNoAds`). While
there are ads, a **REMOVE ADS** link (cart icon) sits at the foot of the menu's
other tabs and opens the STORE with REMOVE ADS lit up. Buying either one earns
**INDIE SUPPORTER** (THANK YOU group): a real purchase only, not the dev page's
previews (UNLOCK EVERYTHING owns FULL ACCESS; OWN REMOVE ADS owns REMOVE ADS).

`js/progress.js` holds the stats, levels, unlocks and achievements; `js/script.js`
reports each drop, decrypt, peel, byte, exploit and point to it.

**Dev switches.** The `</>` dev page has UNLOCK EVERYTHING (like owning Full
Access, for this browser; the game shows a DEV badge, a label only, level with the corner buttons and behind the wanderers, while it's on), JUMP TO
LV 80 and +10 LEVELS for testing DECRYPTOR ranks, slots and exploit unlocks. With UNLOCK EVERYTHING on,
press and hold any exploit card for 2 seconds to make it your next drop.
AD BANNER PREVIEW (off by default; tap to step through 50, 60 and 90px, or add
`?adpreview=60` to the URL) holds a grey strip at the top of the screen (AD
BANNER SPOT switches it to the bottom, or add `?adpos=bottom`) where a phone's
banner ad would go. The
game's height leaves the strip out, so the card, start screen, menus and music
player all fit beside it, the way they would with a real banner that resizes the
page. When less than about 650px is left beside the strip (a 360×640 phone, say),
the board is at its smallest and the drop buttons start to crowd it.
BACKGROUND (PLAIN by default, or `?twinkle`) switches what's behind the game
card between the plain gradient and TWINKLE: the start screen's starlight
twinkling across the whole screen. Both dev switches take effect as soon as you
go back to the game, no reload needed.

## App view on a phone

- **FULLSCREEN** in settings hides the browser bars (Android Chrome and
  desktop browsers; iPhones don't allow it for web pages, so it's hidden there).
- **Add to Home Screen** (Chrome's menu on Android, Share on iPhone) installs
  ByteFall with its own icon, and it opens full screen like an app, without
  browser bars. `manifest.webmanifest` and `assets/icons/` (the icon's source is
  `icons/icon.svg`) set that up.

## Daily bonus, vibration and resetting

- **Daily bonus:** the first time the game opens each day (local date), one
  free exploit waits in the exploit button, marked FREE!.
  Arming it makes one of the first five exploits (RNG, BITFLIP, BUFFER OVERFLOW, TROJAN, WORM VIRUS) your next drop, even if you haven't unlocked it yet, so new players get to try them. It doesn't stack
  if unused, and it's hidden in DAILY and PUZZLE so those stay equal for
  everyone. Its notice (like every notification but achievements) waits until
  you're past the start screen.
- **Vibration:** on devices that support it (Android), drops, decrypts,
  exploits, new layers and game over give a short buzz. VIBRATION in
  settings turns it off; the option only appears where it works.
- **Reset progress:** at the bottom of RECORDS → STATS, with a two-press
  confirm. It clears stats, unlocks, achievements, puzzles and best scores;
  settings stay.

## Full Access

The Android app is planned as free with a banner ad, plus one purchase,
**Full Access**: no ads, and every unlock straight away. Nothing needs it;
everything can also be earned. `js/unlocks.js` holds that check (never owned on
the website; the app will set it from Google Play). Add `?unlockall` to the
URL to preview everything unlocked.

## Playing

Open `index.html` in a browser. Tap a numbered drop button (under the grid by
default), or press `1`-`7` (`1`-`8` on Hard), to drop the current bit shown in the HUD.

The gear/speaker icon in the corner opens the settings: sound and music on or
off, whether the drop buttons sit under or above the grid, the color theme
and the playlist.

Themes (picked from the swatch grid in settings; the page fades to the new one over 1 second, 1.25 into or out of PAPER):

| Theme | Bits | Layers | Cracks & exploits | Trace |
|---|---|---|---|---|
| TERMINAL (default) | green | grey | amber | red |
| CIPHER | cyan | magenta | yellow | orange-red |
| AMBER CRT | amber | grey | white | red |
| MONOCHROME | light grey | striped grey | white | white |
| ANAGLYPH | off-white with red/cyan 3D fringes | red | cyan | red |
| SYNTHWAVE | pink | purple | orange | cyan |
| DOT MATRIX | olive green | dark green | pale green | red |
| PAPER | near-black ink on paper | grey | dark amber (gold) | red |
| GLYPH | shapes on blueprint blue | slate | amber | red |
| SPECTRUM | each bit cycles the rainbow on its own | grey (still) | near-white (still) | cycles |

GLYPH draws each bit as a shape with one corner per point of its number (1 is
a teardrop pointing up, 2 a lens, 3 a triangle... 8 an octagon), with a small
number in the corner. SPECTRUM gives every bit its own random hue speed,
direction and phase, slowly hue-rotates the rest of the page, and turns the
background grid into dimmed rainbow blocks; it holds still under reduced motion.

Every color in `css/style.css` is a named role in `:root`; a theme is a
`[data-theme="…"]` block that overrides those values, plus an entry in
`THEMES` in `js/script.js` and in the small theme script in `index.html`'s
head. All but TERMINAL are unlocked by playing (see below).

**The corners.** RESTART is the arrows icon in the game card's lower-left
corner, greyed out until a session's first bit drops (QUIT in VS); the exploit
button is in the lower-right.

**The layer line.** A ==== line under every board (and the CPU's) marks where encryption layers rise from; it flashes amber when the next drop brings one.

**No scrolling.** On every screen (phones, the app and desktop) the footer sits
inside SETTINGS and the game card fills the screen height, so the game page never
scrolls. The footer (it stays in the live app) has the copyright, then the build
number (the page's own version), when it was last updated and the commit. The header sits at the top of the card, level with the icons; the
board stays centered.

RESTART and the difficulty buttons ask for a second press mid-run (RESTART
turns red, like the other confirms; the text buttons read CONFIRM?; either cancels itself
after a few seconds), then the board melts down like a traced run before the
new one starts. Once a run is over, or before the first drop, they act straight
away.

## Files

`index.html` (and `dev-tools/audio.html`) load their CSS and JS with a `?v=N`
tag. Bump `N` on all of those links whenever any of those files change, so browsers don't pair a fresh page
with a cached older script (GitHub Pages lets browsers cache for 10 minutes).

- `index.html` — page structure, HUD, rules and exploits panels
- `css/style.css` — terminal/hacker visual theme
- `js/script.js` — game state, rendering, chain resolution and exploits
- `js/unlocks.js` — the Full Access check (never owned on the website; `?unlockall` previews it)
- `assets/fonts/` — the unlockable fonts, Share Tech Mono (Carrois Type Design), Press Start 2P (CodeMan38), Bitcount Single (Petr van Blokland) and Bytesized (Baltdev), from Google Fonts, with their SIL Open Font License files
- `js/cpu.js` — VS CPU: the computer opponent (a copy of the board rules with no animation, and a player that tries every column)
- `js/progress.js` — lifetime stats, earnable unlocks and achievements
- `docs/achievements.csv` — every achievement grouped by what it's about (category, name, description, goal, and whether it's standard, hidden or impossible)
- `manifest.webmanifest`, `assets/icons/` — the home-screen app view and icons
- `js/data/puzzles.js` — the PUZZLE boards, generated and verified by brute force (1-3 solutions each, none solvable in fewer drops)
- `js/data/daily-puzzles.js` — the DAILY PUZZLE boards, one per UTC day for about three years (then they loop), generated and verified the same way (1-3 solutions each)
- `js/fx.js` — particle overlay: cleared cells dissolve into pixel fragments and
  drifting hex/binary glyphs (skipped under reduced motion)
- `js/viz.js` — the shared music visualizer (LED bars or auto-gained
  oscilloscope wave with a CRT trail) used by the playlist and the dev page;
  the chosen style is remembered for both
- `js/grid-bg.js` — the dim "defragmenting" micro-grid animated behind the board
  (static when the OS asks for reduced motion)
- `js/sfx.js` — synthesized sound effects, mostly ported from the ECHOES terminal
  audio compendium, plus a retro 8-bit "data burst" for clears; toggle with
  the SOUND button in settings
- `js/music/music.js` — the music player: scheduler, playlist and intensity input.
  Music starts on your first click or key press, on the track you last picked or played (track 01 at first) (toggle with the
  MUSIC button in settings) and intensifies as your tallest stack nears the
  red line (from height 4, full at 6; one higher on Hard's 8×8). The settings panel holds the playlist,
  which also has
  a small visualizer of the live music (click it to switch between LED bars
  and an oscilloscope wave), a MODE button (REPEAT, or SEQUENCE / SHUFFLE,
  which play each track 4 times and then fade into the next), and the
  BACKGROUND PLAY toggle (keep playing or pause when you switch tabs or
  apps). New tracks go in the `TRACKS` list here, with their engine in a
  `music-*.js` file
- `js/music/music-bytefall-theme.js` — track 01, BYTEFALL THEME: an original synthwave loop
  (intro, melody 1, section B with melody 2, octave-doubled climax)
- `js/music/music-sleep-mode.js` — track 02, SLEEP MODE: original electronicore
  (music box, trance synths, chugging distorted guitars, double-kick) at
  150 BPM, built on the public-domain lullaby "Schlaf, Kindlein, schlaf".
  Unlocked at 125 bits.
- `js/music/music-brute-force.js` — track 03, BRUTE FORCE: original NES-style
  chiptune at 140 BPM (pulse-wave leads, stepped triangle bass, noise drums,
  arpeggiated chords; boot, level 1, level 2, boss duet).
- `js/music/music-deep-web.js` — track 04, DEEP WEB: original dark ambient techno at
  124 BPM (muffled kick, rolling bass, drone, modem bleeps; connect, tunnel,
  deep, surface).
- `js/music/music-zero-day.js` — track 05, ZERO DAY: original drum & bass at 172 BPM
  (two-step break, reese bass, saw pad; infiltrate, payload, exploit,
  escape).
- `js/music/music-system-restore.js` — track 06, SYSTEM RESTORE: original lo-fi at
  85 BPM (electric piano sevenths with tape warble, upright bass, swung
  drums, vinyl crackle, flute; standby, restore, recovery, reboot).
  Each track lists its intensity layers (`LAYERS`) with the level each fades
  in at: hi-hats from 5% (stack 4), heavier drums/guitars from 40% (stack 5),
  the alarm layer from 72% (stack 6+); the brightening grows the whole way
- `js/music/music-night-drive.js` — track 07, NIGHT DRIVE: original synthwave / outrun
  at 100 BPM in F♯ minor (pumping octave bass ducking under the kick, detuned
  saw pads, gated-reverb snare and tom fills, arpeggio and gliding lead through
  a dotted-8th echo; ignition, cruise, neon, overdrive). Unlocked at 5,000 bits.
- `js/music/music-standby-mode.js` — track 08, STANDBY MODE: an original early-60s
  soul ballad at 112 BPM in B♭ major (walking upright bass, finger snaps and
  guiro, clean guitar, a breathy saxophone melody in a warm room reverb;
  standby, signal, connected, hold). Unlocked at 7,500 bits.
- `js/music/music-core-dump.js` — track 09, CORE DUMP: original 8-bit tech-death at
  190 BPM in A harmonic minor (distorted pulse-wave guitars: tremolo riffs,
  gallop chugs and octave dives; square bass; noise-channel blast beats (mixed lower than the other drums) and a
  china cymbal; 32nd-note sweep arpeggios; segfault, stack trace, overflow,
  core dump). Unlocked at 11,000 bits.
- `js/music/music-handshake.js` — track 10, HANDSHAKE: an original 8-bit battle theme
  in the style of Game Boy-era handheld RPG battles, at 176 BPM in C minor
  (lead pulse with delayed vibrato, a second pulse, a 4-bit wave-channel bass,
  a noise-channel kit; a falling intro run the first time through; encounter,
  battle, bridge, critical; a low-HP alarm at the top of the stack). Unlocked
  at 15,000 bits.
- `dev-tools/audio.html` — the audio compendium, opened by the `</>` icon in
  the footer: every sound effect and track with a play button, where each is
  used in the game, a seekable progress line and a live intensity slider for
  each track, a MUTE / PLAY button per intensity layer to hear the mix without
  it, and a SOLO button to hear just what it adds. ARCHIVED layers are sounds
  that were taken out of a track (NIGHT DRIVE's wailing siren, DEEP WEB's
  dial-up modem, ZERO DAY's air-raid siren): the game never plays them, and
  here they start muted so they can still be heard
- `assets/audio/` — offline WAV renders of the music for reference (not loaded by
  the game). `01-bytefall-theme.wav` through `10-handshake.wav` are one full
  loop of each track at full intensity (stack 6+, every layer the game plays,
  archived layers left out). Older versions: `bytefall-theme-v1.wav` is the
  original 16-bar theme loop, `bytefall-theme-v2.wav` the first 32-bar
  version, `sleep-mode-v1.wav` the first SLEEP MODE

## Stereo

Every track is mixed in stereo. Drums, bass and the lead stay centered; the rest
is placed the way each style would be mixed:

- **01 BYTEFALL THEME, 02 SLEEP MODE:** pads and detuned voices spread left and
  right, arps alternate sides, hats sit right, the tension saw / alarm left,
  echoes come back from the right; SLEEP MODE's guitars are double-tracked hard
  left and right.
- **03 BRUTE FORCE** (an NES stereo mix): the arpeggio alternates sides (its
  32nd-note doubling on the other), hats right, the octave double left, the boss
  duet right, the low-battery beep left.
- **04 DEEP WEB:** the drone's detuned pairs split wide, bleeps land on either
  side with their echo from the right, hats right and shaker left, plucks
  alternate, dub stabs lean left, the modem left.
- **05 ZERO DAY:** the reese's two saws a little apart (the sub centered), the
  pad split wide, hats right, the rave stab's square left and saw right, the
  siren sweeping left to right and back.
- **06 SYSTEM RESTORE:** the piano spread low-left to high-right, the vinyl on
  both sides, hats right, the flute just right of center, the stutter
  ping-ponging, the strings split wide, the error chime's two notes either side.
- **07 NIGHT DRIVE** (a wide 80s mix): the pad's three saws left, center and
  right, the arpeggio alternating with a ping-pong echo (each note's echo starts
  on the other side), hats right, tambourine left, the tom fill rolling left to
  right, brass and choir spread out, a wide crash, the riser drifting across.
- **08 STANDBY MODE** (a combo on a small stage): guitar left, harmony sax right,
  guiro and shaker right, tambourine left, the strings spread out, in a stereo
  room.
- **09 CORE DUMP:** the guitars double-tracked through two amps, hard left and
  right; ride right, china left; the harmonies either side, the sweeps
  alternating.
- **10 HANDSHAKE** (Game Boy style): pulse 2 left, the lead's echo right, hats
  and the fake-chord arps right, the low-HP alarm's two tones trading sides.

Panned sounds get +3 dB ahead of the panner (it halves a mono sound's power), so
each track kept its loudness (within about 0.3 dB of its mono mix). The WAV
renders in `assets/audio/` are still the older mono mixdowns.

## Tutorial

RULES → **TUTORIAL** (beside the title) starts a guided lesson on set boards
with set bits (`js/tutorial.js`). BOT narrates it: its face sits in the banner's corner, and each line types out fast with a blip of square-wave "voice" every other letter (Animalese-style, following SOUND), pausing at punctuation; a tap on the text finishes the line, and the lesson never waits on the typing. BOT's mood follows along (happy at the welcome and the chain, worried at the ======== line, devious with the WORM VIRUS, -_- at a wrong column). A banner over the board explains each rule
and asks you to tap what it names; whatever it's talking about pulses, and only
the lesson's drop column can be pressed (the others dim). No lesson drops a bit
into the column of its own number, so it never looks like it has to. After each
drop it says what happened and shows the points: each link's bits, (10 +
number) × the chain, NIBBLE bonuses and the total. Twenty steps: the terminal,
CURRENT, a line across, a line down, SCORE, a chain with a NIBBLE, CHAIN,
peeling a layer twice until it reveals its bit, the ======== line, ENCRYPT IN,
an exploit (arm the WORM VIRUS waiting in the EXPLOIT button, then drop it on a
tall column), the MENU button with its RULES, RECORDS and EXPLOITS (loadout)
tabs, the SETTINGS button and what's in it, then PLAY CLASSIC or RULES. Over an
open menu the banner moves to the bottom of the screen. BACK (from step 2 on)
redoes the step just played, or before a drop goes to the step before, putting
the board, bits, score, chain and exploit back as they were. EXIT leaves at any
point. It counts toward nothing (no XP, stats, achievements or best score). Pop-ups (a poke's achievement, say) show at the top of the screen during it, clear of the banner.

## Startup

A fresh launch (the app or tab opened anew) opens on the START SCREEN (the studio,
EMPTYFISHTANK PRESENTS, across the top; the copyright above the wanderers): a card
filling the screen with the starlight twinkling across it, the BYTEFALL title
in the middle and a glowing START button below it, as far under the tagline as
the tagline is under the title (measured letter to letter, in every font; `js/start.js`). A tap anywhere
else lets the music begin (browsers need one) and leaves you on the screen.
START (or Enter / Space) fades it to black, then fades into the game, which always starts on
CLASSIC, Normal. The very first time the game is opened, it fades into the
TUTORIAL instead (EXIT skips it). A refresh puts you back where you were: on the start screen until START is
pressed, then in the game with whatever was open still open (the MENU on its tab
and sub-tab, scrolled where it was; SETTINGS; the MUSIC PLAYER) or the TUTORIAL
at the step it was on, BACK still working (`js/place.js`). Coming back to the app
or tab carries on where you were. On the start screen one to four of the CPUs (BOT, GRIFTER, BUNKER, GLITCH;
never two of the same) wander along the bottom of the card, looking the way
they walk (eyes and mouth a pixel that way): in from either side, idling (now
and then bored or tapping a foot), finding a free spot and heading back out.
Two that meet may stop no closer than an arm's overlap, face each other and
pull faces (a mood each and a little emote); a stop can bring a hop or two.
Arrivals: 10% pop into view pixelated, 15% come in at a run and stop, tired, to
catch their breath, the rest walk in. Departures: 5% decrypt away in a burst
of pixels, 15% get spooked (scared, "!") and bolt, the rest walk off. A pop, a
decrypt or a bolt startles every bot within 110px (surprised, facing it),
cutting short any meeting there; a partner out of range is left -_- (only bots
on the card react: one still walking in keeps coming). Each picks a spot clear of
the others standing or already headed somewhere, so even four at once on a
narrow card stand apart; too many on the card leave one at a time. The game
card's wanderers wait while the start screen covers it. Each bot
keeps to its character: GLITCH is never happy, heart-eyed or laughing (nor
shows EASY's smiling rest face); emotes fit the face (no <3 on a -_-), and the
mad ones (HARD's angry and INSANE's red-eyed rest faces) and GLITCH never show
the cheery ones (<3, ^^, haha); love comes only from the EASY and NORMAL faces,
and never toward a worried, scared or put-out partner. Tap a wanderer and it
reacts: 40% of the time it's startled and bolts; otherwise it's put out (-_-,
"hey!"), shakes itself off in a puff of dust as if the touch left it dirty, then
turns to you with a raised eyebrow (the SKEPTIC face) before wandering on. The
mad ones (HARD's angry and INSANE's red-eyed faces) never bolt: they shake their
head in whole pixels, no tilt ("grr"), bare their teeth (SNARL) and snap at you like a rabid dog, three
lunges with the jaw chomping ("SNAP!" / "CHOMP!"), then 35% of the time stomp
off at a run, still angry, or glare a moment and wander on. One poked while half
on the card reacts right there, peeking in.

**Seasons** (`js/seasons.js`, by the player's own date; the dev page's SEASON
switch, or `?season=halloween`, forces one or turns them OFF). **HALLOWEEN**
(October 15 to 31): most wanderers (80%) arrive in costume, drawn in their own
pixel grid over the body and under the face, so every face, hop and snap still
shows: BUNKER is a pumpkin (its face the carved one), BOT a see-through bedsheet
ghost (80% opaque, floating two or three pixels off the ground and bobbing),
GRIFTER wears a witch's hat and GLITCH devil horns and a tail. All four
dressed up on screen at once earns the hidden COSTUME PARTY. A wanderer that
stops sometimes has a snack (30%): one to three gummy drops (2x2 pixels, a
random bright color), each pulled from its side and tossed in an arc over its
head into its mouth (hopping pixel to pixel), a munch and a chew; SWEET TOOTH
(hidden) for 100 of them.

**Visitors** (`js/visitors.js`) pass through the same lane, one visit at a time
every 20 to 45 seconds, in from either side. HALLOWEEN: FRANKENSTEIN'S MONSTER
(lumbering, arm out), a MUMMY (shambling, a loose bandage swinging), the CREATURE
from the black lagoon (waddling, dripping water), NOSFERATU (gliding), a
see-through GHOST (floating), a flock of BATS (flapping across), a CROW or two
(hopping in, pecking, then flying off) and a SPIDER (down on its silk thread
somewhere along the card, a dangle, back up). NOVEMBER (the whole month; nothing
holiday-specific): a TURKEY struts in, pecks a while and struts on (and the
crows). They're pixel sprites in the bots' pixel size and sway and bob in whole
pixels, on the same floor as the bots (their feet a pixel of the grid above the lane's edge); they walk behind the bots, bats and crows over them. A monster passing a
bot may give it a fright. Poke one: the monster roars and stomps (bots near it
jump), the mummy groans and slows, the creature splashes, Nosferatu hisses and
turns into three bats, the ghost says BOO (every bot near it jumps) and fades
away, the bats scatter, the crow caws and takes off, the spider scurries back
up (bots near it jump) and the turkey gobbles and runs. MONSTER MASH (hidden):
meet all eight Halloween visitors; GOBBLE GOBBLE (hidden): meet the turkey.

**Scenery.** HALLOWEEN: now and then (15% of arrivals, one at a time) a
wanderer comes in pushing a SCARY TREE (a dead, gnarled tree with black eyes and a frown)
ahead of it, slowly and straining, sweating; it leaves it standing somewhere
along the card, says "phew" and wanders on. The tree stays for the visit, behind
every bot and visitor but in front of the start card's copyright line. Poked or
startled mid-push, the pusher lets go (the tree stays where it stopped) and
reacts as usual. Poke the tree: it creaks and a bat flies out.
UPROOTED (hidden): see a tree pushed in.

The same wanderers stroll along the bottom of the game card too, between the
corner buttons (walking out from behind them), with everything above: meetings,
frights, pop-ins, decrypts and pokes. SETTINGS → WANDERING BOTS turns them off
(on by default). The engine is `js/wanderers.js`, shared by both cards.

**Bot achievements** (RECORDS, the BOTS group): POKE, BOO! (poke one so hard it
runs), THE EYEBROW (a raised eyebrow from all four bots), THIRD WHEEL (poke one
mid-conversation), MATCHMAKER (two fall for each other), JUMP SCARE (a pop-in
startles another), NOW YOU SEE ME (one decrypts away), FULL CREW (all four on
screen at once), and hidden: PERSONAL SPACE (100 pokes), HR WANTS A WORD
(200), RABID (get snapped at by a mad one) and DEVELOPER OPTIONS (tap the VS CPU seven times in a row: "YOU ARE 3
TAPS AWAY FROM BEING A DEVELOPER" ... "NO NEED. THERE IS NO DEV MODE HERE."). The faces include the CPU's moods plus SCARED, TIRED (panting),
SURPRISED, LOVE (red heart eyes), DIZZY and LAUGH. The small faces come from
`js/minibot.js`, a copy of the CPU's face for use anywhere.

## Music player

SETTINGS → PLAYLIST → **OPEN MUSIC PLAYER** opens the soundtrack on its own,
over the whole page: every track plays as its full mix (all layers in,
whatever the game was doing), with a big visualizer: tap it to cycle SPECTRUM (LED bars), WAVE, OSCILLOSCOPE (a few cycles held still on a rising zero crossing, over a graticule), RADIAL (spectrum bars around a ring that swells with the bass), PARTICLES (a liquid blob morphing with the spectrum, shedding particles as it gets louder) and VECTORSCOPE (left against right turned 45°, with a phase-correlation meter; every track is in stereo; a mono sound shows as a vertical line at +1), its name shown top left. The visualizers follow the theme (its bit and accent colors; a cycling rainbow in SPECTRUM). Also: SPECTROGRAM (the spectrum as a heat-map scrolling left), LEVEL METERS (L / R LED ladders with peak holds), MATRIX RAIN (0s and 1s falling, each column a band), BIT GRID (a 7x7 board stacking bits per band, a full column flashing), SYNTHWAVE GRID (a sun and a wireframe landscape of the spectrum's recent past over a scrolling floor), PLASMA (a color field warped by the bass) and TUNNEL (rings rushing toward you on the beat). The small one in SETTINGS has the ones that read at its height: SPECTRUM, WAVE, OSCILLOSCOPE, SPECTROGRAM, LEVEL METERS and PLASMA;
PREVIOUS / PLAY-PAUSE / NEXT, REPEAT / SEQUENCE / SHUFFLE, the 16-slot track
list (locked tracks show the level they open at) and BACKGROUND PLAY, so it can
run on a phone with the screen off. Keys: Space plays / pauses, ← / → skip,
Esc closes. Where the browser offers them, the lock screen's media controls
work too. The game waits underneath (a VS match pauses). Code: `js/player.js`.

## To-do

- **CPU exploit loadouts** (maybe): each bot with its own preferred exploits in VS.
- **CORE DUMP (track 09)**: its trial layers still wait for picks.
- **Sound effect themes**: on hold.
