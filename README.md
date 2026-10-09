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

## ByteFall Viz

The music player's visualizers as their own app, for whatever the phone plays (Pandora, Spotify, YouTube, ...), with the song from any app shown and played / paused / skipped: `visualizer/` (see `visualizer/README.md`), built by Actions → ByteFall Viz APK.

## Byterrium

The CPU bots' own world, with nothing of the game: https://emptyfishtank-jb.github.io/ByteFall/byterrium.html
(`byterrium.html`). It runs on ByteFall's very files (the bots and their minds, the visitors, the
weather, the places, the fishing), so the lanes in ByteFall are a preview of it, and a change to
either shows in both. Played sideways (made for a phone on its side): held upright it asks to be
turned, with a button that goes full screen and locks the screen sideways where the browser allows
(or STAY UPRIGHT), and installed from the browser (`byterrium.webmanifest`) it opens sideways.

- **TRAVEL** (the button, or T): the places (THE GRID, MEADOW, LAKE, BEACH, WOODLAND, FARM, CITY,
  DESERT, SNOWFIELD). The bots fade out and back in somewhere new and stay there till you pick
  another; each place keeps its look, and the bots keep their minds, between visits and reloads.
- The header says where they are, the time, the weather and (at night) the moon.
- In the world mode (`window.BYTERRIUM`) a place never runs out and the scheduled fog stays away
  (the weather still comes and goes); ByteFall's scenes still come now and then and pass.

## Repo layout

```
index.html              the game page (GitHub Pages serves it from the root)
byterrium.html          Byterrium, the bots' world (js/byterrium.js, css/byterrium.css, byterrium.webmanifest)
manifest.webmanifest    the installed app's name, colors and icons
css/style.css           all the styles and the themes
js/                     the game: script.js (the game itself), player.js (the music player), progress.js (levels, unlocks,
                        achievements, stats), unlocks.js, cpu.js (VS CPU), sfx.js, fx.js,
                        viz.js, grid-bg.js
js/data/                puzzles.js, daily-puzzles.js
js/music/               music.js (the player), one music-*.js per track, output.js (SOUND
                        OUTPUT, instrument channels), mixes.js (mix tables), archive/
assets/                 fonts/, icons/, audio/ (WAV renders of the tracks, not used by the game)
dev-tools/audio.html    the audio compendium (tracks-info.js: the track list for it and the mixer)
dev-tools/mixer.html    the mixer, one track at a time (?track=sleep-mode)
dev-tools/bots.html     the bot sandbox: the wanderers, visitors, seasons, fog and headphones on buttons
dev-tools/frames.html   the frame editor: the bots' animations drawn a frame at a time, exported as .json
js/data/bot-anims.js    the drawn animations, built in from the frame editor's files (the windmill)
js/pixel.js             PIXEL MODE (the sandbox's switch, for now): the bots on a screen at twice the
                        art's resolution: moves in whole pixels, turns redrawn, hair that flows
js/pixel-ui.js          PIXEL STYLE (SETTINGS): the icons redrawn in square pixels (the corners: style.css)
js/bot-svg.js           the bots' pixel art (shared by the game and the sandbox)
docs/achievements.csv   every achievement, grouped
tools/build-app.js      the Android app's copy of the game (www/): no dev page, no DEV link, build info baked in
tools/setup-android.js  the Android project made ByteFall's: full screen, portrait, back button, version, test key
tools/android/          its MainActivity, icon and splash images, and the test signing key
.github/workflows/      android-apk.yml: builds the test APK on GitHub (Actions → Android test APK)
```

## Android test APK

GitHub builds the game as an Android app (Capacitor) when you ask it to: **Actions →
Android test APK → Run workflow** (pushes don't build it). It's the TEST edition, **ByteFall
Test** (`com.emptyfishtank.bytefall.test`): its own app, so it installs beside the Google Play
version and keeps its own progress. When the run is
done, its page has the APK under **Artifacts** (a zip; unzip it on the phone and open the
`.apk`, allowing installs from that app if Android asks). It's the game as players
would get it: no dev page or DEV link, dev switches cleared, full screen, portrait.
Its text keeps the game's own sizes whatever the phone's FONT SIZE and BOLD TEXT settings
(`tools/android/MainActivity.java`: the WebView's text zoom pinned to 100%, the activity's font
scale to 1 and its extra weight to 0), as games do: the layout is built around them.
Every test build is signed with the same test key (`tools/android/test.keystore`, not a
secret and not for the Play Store), so a new one installs over the last and keeps the
progress.

**SOURCE** (asked when you run it): **live**, the default, is the testing build: it loads the game
from GitHub Pages each time it opens (its cache off), so every push to main shows up on the phone
with no new APK; offline it falls back to the copy it was built with (`tools/live-app.js`). It
has the DEV link, as the site does. **bundled** has its own copy, as players would get it, and is
what the Play Store builds will be (updated through the store). Either one installs over the other;
only a change to the Android side itself (`tools/android/`, the Capacitor setup) needs a new APK.
The game knows it's in the app from its user agent (`ByteFallApp`, `capacitor.config.json`).
In the TEST app, SETTINGS' footer has a padlock where the web has the DEV link: **UNLOCK EVERYTHING**
(the dev page's switch, the same `bytefall-dev-unlockall` flag; the game reloads with it). It's
for testing, kept through launches. The RELEASE edition (below) has no padlock.

To build it locally instead: `npm ci && node tools/build-app.js && npx cap add
android && node tools/setup-android.js`, then open `android/` in Android Studio (the debug build
is ByteFall Test; `node tools/build-app.js release` for the release edition's copy).

### Releasing to Google Play

The Play Store gets the **RELEASE edition**: **ByteFall** (`com.emptyfishtank.bytefall`, the
package name in the Play Console), built by **Actions → Android release bundle → Run workflow** as
an Android App Bundle (`.aab`, under the run's Artifacts) to upload in the Play Console (Testing →
Internal testing, or another track → Create new release). It's the game with every dev piece out
(`tools/build-app.js release`): no UNLOCK EVERYTHING padlock (nor the dev unlocks, whatever's in
storage or the URL: `js/unlocks.js`), every dev switch cleared, no infection tester or archived
tracks. Nor the music player's other sources, OTHER APPS and MICROPHONE: its visualizer shows
ByteFall's own music only, with no SOURCE button (`js/extsource.js`), and its own manifest
(`android/app/src/release/`, written by `tools/setup-android.js`) takes out the capture service,
its foreground service permissions and the microphone's (RECORD_AUDIO, MODIFY_AUDIO_SETTINGS), so
the Play Console's foreground service declaration isn't needed and the app never asks for the
microphone (MainActivity refuses OTHER APPS without the service, too). The TEST edition, the web
and ByteFall Viz keep them. Its privacy policy, for
the Play listing, is on the studio's site: https://emptyfishtank-jb.github.io/bytefall/privacy.html
(the `EmptyFishTank-JB.github.io` repo, with `app-ads.txt`; this repo's `privacy.html` sends the
old address there). Its version code is the build number (`?v=`), so each upload needs a push after the last.
While `js/ads-config.js` says `testing: true` the run warns that the bundle shows test ads (fine
for a testing track, not for production).

It's signed with ByteFall's **upload key**, kept out of the repo in four repository secrets
(GitHub: the repo's Settings → Secrets and variables → Actions → New repository secret). Made
once, on your own computer:

1. Make the key (keytool comes with any Java JDK, and with Android Studio, in its `jbr\bin`):
   `keytool -genkeypair -v -keystore bytefall-upload.jks -alias upload -keyalg RSA -keysize 2048 -validity 10000`
   (it asks for a password and your name; the key's password can be the same one).
2. The file as text: on Windows (PowerShell)
   `[Convert]::ToBase64String([IO.File]::ReadAllBytes("bytefall-upload.jks")) | Set-Clipboard`;
   on a Mac `base64 -i bytefall-upload.jks | pbcopy`.
3. The secrets: `UPLOAD_KEYSTORE_BASE64` (that text), `UPLOAD_KEYSTORE_PASSWORD`,
   `UPLOAD_KEY_ALIAS` (`upload`) and `UPLOAD_KEY_PASSWORD`.
4. Keep `bytefall-upload.jks` and its password somewhere safe (a password manager), never in the
   repo. Google Play keeps the app's real signing key (Play App Signing) and re-signs each upload,
   so a lost upload key can be replaced through the Play Console, but it takes a few days.

**The STORE's purchases** (`js/billing.js`, MainActivity's PURCHASES; Google Play's billing
library, added by `tools/setup-android.js`, which brings the BILLING permission the release
checks look for). Set up once in the Play Console:

1. A **payments profile** (Monetize with Play → Products asks for it: bank account and tax
   details). Google verifies it, which can take a few days.
2. A bundle with billing uploaded to a testing track (the Play Console only lets products be made
   after one is).
3. **Monetize with Play → Products → One-time products**, three, each made active. The IDs are for
   good (never changed or reused) and must be exactly these:

   | Product ID | Name | Price (US) |
   |---|---|---|
   | `remove_ads` | REMOVE ADS | $1.99 |
   | `full_access` | FULL ACCESS | $4.99 |
   | `full_access_upgrade` | FULL ACCESS (upgrade) | $2.99 |

   The upgrade is offered only to those who own REMOVE ADS (the STORE picks it), at the
   difference, so nobody pays more than $4.99 in all. Google Play sets each country's price from
   the US one.
4. **Settings → License testing**: your Google account (the one on the phone's Play Store), so
   your purchases go through Google's test cards and charge nothing. Refund one from **Order
   management** to see the game take it back at the next launch.

## Keys, resources and patches

**[ECONOMY.md](ECONOMY.md) has the whole economy in tables**: every resource, how and where it's
earned, every price, the BLACK BOX odds and the infections.

KEYS are the game's currency, earned by playing and kept on the device
(progress.js): 1 for every 10 bits decrypted, +2 when a chain reaches 5 links and +5 at 7,
a first puzzle solve (EASY 2, NORMAL 4, HARD 6), 10 for each achievement and each level,
5 for the day's first daily game, and 25 with the DAILY DROP (plus 3 each of BUGS, CACHE and CRYPTO, and every 7th day in a row you open the game, 3 MASTER KEYS: the LOGIN STREAK, its days and a pip for each day of the run of 7 shown under the DAILY DROP; a day missed starts it over) (claimed once a day in the
STORE, with a free exploit for the next game) (the STORE buttons, on the main menu and the pause screen, carry the game's currency sign in their corner: unlit, a dark tube, and lit like a HOT NOW sign, glowing with a slow hum and a flicker now and then, while the DAILY DROP waits). Beside them, the RESOURCES, earned by how bits are
decrypted: **BUGS** (down a column, 1 per 5), **CACHE** (across a row, 1 per 5), **CRYPTO** (each chain
link from the 3rd on), **ROOTKITS** (a bit decrypted across and down at once, layers broken, BYTES)
and **MASTER KEYS** (every 5th level, the day's first daily game, the day's first VS win). CLASSIC and
DAILY earn them all, BLITZ and ZEN at half the rate, VS only CRYPTO, ROOTKITS and MASTER KEYS, PUZZLE
none. Each holds at most 999 (KEYS have no cap). Each has its own color in every theme (BUGS roach brown, CACHE light gray, CRYPTO Bitcoin orange,
ROOTKITS red, MASTER KEYS gold with a glow; KEYS the theme's accent; PAPER darker, MONOCHROME in grays).
The main menu shows them in a line under the level bar, the STORE too (its **[i]** by the title, or a tap on that line, opens a card of each resource and how it's earned; each STORE section, PATCHES, STARTER EXPLOITS and BLACK BOXES, has its own [i] saying what that kind of thing is, its note kept to a line); a drop that earns some
floats them up off the board, and the result screen lists the game's haul. PATCHES (boosters, `BOOSTERS` in the code) cost KEYS;
STARTER EXPLOITS and BLACK BOXES cost KEYS and resources (a MASTER KEY buys any exploit outright):

| Patch | Keys | Does |
|---|---|---|
| HEAD START | 15 | the CHAIN METER starts half full |
| FIREWALL DELAY | 20 | the first encryption layer rises 4 drops later |
| LOOKAHEAD | 15 | the next bit shown for the first 60 seconds of play |
| OVERTIME | 20 | +15 seconds in BLITZ |
| ANTIVIRUS | 25 | the next infection a BLACK BOX lets out is quarantined (the box's slot shows the virus, grayed, and passes); bought in a game with infections running, it clears them all at once instead (RANSOMWARE's freed bits settle at the next drop; KEYS demanded, dropped) |
| RESTORE POINT | 40 | when the trace completes, the system rolls back: everything above the bottom 3 rows is wiped and the game goes on (once a game); also free for a rewarded ad, once a day (below) |
| HINT | 10 | PUZZLE: lights the column the next bit goes in (worked out by js/puzzle-sim.js) |
| UNDO | 8 | PUZZLE: takes back the last drop, even after running out of bits |

The first six are switched on from the main menu's PATCHES button (laid out as VS's settings: PATCHES:
NONE ON, or the patch's name, filled while one's on; one patch per game), which opens a card of the ones owned for the
mode, each with its icon, how many and ON / OFF (switching one on switches the other off), and GET PATCHES (the STORE's); per mode, for the modes they fit and paid for at
a game's first drop (RESTORE POINT only when it saves you); HINT and UNDO sit under a
puzzle's drop buttons, and with none owned a second tap buys one. Never in DAILY or VS. A
patched game says so on its result screen (PATCHED: and their names).

**WATCH AD** (the Android app only; `adPerDay` on a patch, store.js, ads.js's `RewardAd`): RESTORE
POINT's STORE card has a WATCH AD button over BUY: a rewarded ad, the player's choice, that gives one
RESTORE POINT once it's watched through (closed early, nothing; Google's word decides), once a day
(the UTC day, as the dailies; `bytefall-ad-rewards`), so its 40 KEYS still mean something. It says
FREE // 1 TODAY, LOADING... while the ad's fetched, then TOMORROW. Offered with or without REMOVE
ADS (that takes the banner away; nobody has to watch one), behind the same consent check as the
banner. Its ad unit is `rewardedId` in `js/ads-config.js` (Google's sample rewarded unit till
ByteFall's is made).

**THE SIDE SLOTS**: one each side of the exploit button (CLASSIC, BLITZ and ZEN only), opened by level: the left at Lv 4, the right at Lv 12 (`SIDE_SLOT_LEVELS` in progress.js; before then the main menu's STARTER L / STARTER R show LV 4 / LV 12 behind a padlock, a tap saying so in the card's title and in a game the slot shows a padlock over its level, so the BLACK MARKET comes a slot at a time).
**THE PATCH SLOTS** (script.js `patchSlots`; `PATCH_SLOT_LEVELS` in progress.js): the exploit row's
two ends, so the row reads PATCH 1, BLACK MARKET L, the earned EXPLOIT, BLACK MARKET R, PATCH 2. The
left opens at Lv 8, the right at Lv 20 (a padlock over the level till then; FULL ACCESS both). Each
sells a patch that fits the mode and would do something now (no HEAD START while an exploit waits or
the meter's half full, no LOOKAHEAD while one runs or on EASY, no RESTORE POINT while one's waiting),
at KEYS and a resource or two (`PATCH_PRICES`, ECONOMY.md), shown as the BLACK MARKET's are (dashed,
the currency sign in its corner, the pips), opening and turning over with it. A tap opens the BLACK
MARKET's window for it (PATCH // APPLIED AT ONCE and what it does now; no MASTER KEYS; NOT NEEDED NOW
if it would do nothing); bought, it's applied at once (HEAD START: the meter to half; FIREWALL DELAY:
the next layer 4 drops later; LOOKAHEAD: the next 60 seconds; OVERTIME: +15 seconds; ANTIVIRUS:
every infection running cleared, or with none, waiting, pulsing, for the next one; RESTORE POINT:
waiting, pulsing, till it saves you) and the slot's done for the game, lit with a tick. With the one
switched on before the game, three patches a game at most; the result screen's PATCHED: lists them.
Paused, the whole row (and PUZZLE's HINT and UNDO) dims to the drop buttons' 25% and takes no taps.
**STARTER EXPLOITS** (STORE) are exploits of your own, any you've unlocked by level, by tier: tier 1
(RNG, BITFLIP, BUFFER OVERFLOW, TROJAN, PIVOT) 10 KEYS and about 12 BUGS, CACHE or CRYPTO; tier 2
(SWAP, WORM VIRUS, KEYLOGGER, PACKET SNIFFER, BACKDOOR) 20 KEYS, about 17 of those and a ROOTKIT;
tier 3 (LOGIC BOMB, HONEYPOT, DICTIONARY ATTACK, RAINBOW TABLE) 30 KEYS, about 22 and 2 or 3
ROOTKITS (ECONOMY.md has each). The STORE shows each with its icon, its price in chips, what's still
short of it (its amount pulses red; a BUY tapped without enough flashes it), and USE A MASTER KEY when it's short and there's one. BLACK BOX itself isn't
sold; **BLACK BOXES** I, II and III are (5 KEYS and 3 CRYPTO; 12, 5 and a ROOTKIT; 20, 8 and 2), a
random pull each, their odds on them: an exploit of tier 1, 2 or 3 (any of the tier, unlocked or not)
or an **INFECTION** (I: 65 / 20 / 3 / 12%; II: 35 / 45 / 12 / 8%; III: 10 / 45 / 42 / 3%).
Pick 2 on the main menu to take into a game, one in each slot (marked S): two of one kind
(if you have two) or one each of two. The menu shows the two slots as VS's settings are laid out, two across under PATCHES: STARTER L and STARTER R and what's in each (EMPTY, or its name, trailing off when long), filled while one's in it.
A tap on a slot opens its card: every starter and box you own and how many, to put in that slot, EMPTY
THIS SLOT, and BUY EXPLOITS (the STORE's starters); each is used once in the game. In
the game, a tap arms an exploit as your next drop, as an earned one, and it's used up (the ones not
used stay yours). A box waits sealed (pulsing); a tap opens it: the slot spins like a slot machine's
reel for about 1.5 seconds and lands on an exploit, which waits there (a tick in its corner) to be
armed when you like, or comes up INFECTED, which glitches red and goes off at once, each infection in its own
little LED sign or ASCII display within the bits it takes up (js/infections.js; ECONOMY.md has the table):
**ADWARE** (an ad in its own frame blocks a column below the overflow line for 3 drops, a CPU pulling faces and
its claims marching up it), **SPYWARE** (the next 3 bits hidden, eyes watching from CURRENT), **RANSOMWARE**
(up to 3 bits padlocked where they are for 5 drops: they can't decrypt or fall, their little screens fading between
a grinning CPU and typing gibberish, each showing its value in brackets and its ransom by a key, 8 to 24 KEYS: every
tap on it pays 1 to 8, at random, a -KEYS floating up off it; paid off, the bit's free at once, and if its lock runs out first
what was paid on it is lost), **MALWARE** (the board's bits shown as flickering junk for 3 drops), a **CRYPTOJACKER**
(5 drops' resources stolen, a CPU making off with them on a sign through the overflow row) or **SCAREWARE**
(fake alerts over the board for 8 drops, popping up on their own clock with a cooldown between, now and then a burst of 2 to 4, up to 4 stacked at random spots in the grid, each closed only by its tiny X). Each has four looks, one picked at random each time. Infections stack (two infected boxes, two infections); ADWARE, the CRYPTOJACKER and SCAREWARE quietly demand KEYS (10 to 20, never shown; RANSOMWARE's are on its bits), stealing a few on every tap until paid off (then they go) or until their clock runs out, and the STORE's BLACK BOXES section warns of all six. While any's on, a little bot at its laptop types away at a virus in CURRENT's corner. The UNLOCKED / ACHIEVEMENT banners are LED signs of small lights in the game's font (js/led-banner.js; the dev page's BANNER LOOK: DOTS, PIXELS, MARQUEE, CHASE or the CLASSIC box), and ADWARE's AD tag is pixels in the game's font too. A menu over the board (pause, game over) hides the infections' displays. SETTINGS' CRT DISPLAY (OFF / SOFT / FULL, bytefall-crt) lays an old tube over the whole screen: scanlines and a vignette darkening toward rounded corners; FULL adds phosphor stripes, a faint flicker, a slow rolling band and a touch of glow (still on REDUCED effects or reduced motion). SETTINGS' PIXEL STYLE (OFF / ON, bytefall-pixel-ui; html.px-ui) gives every rounded box and button a stepped pixel corner (CSS corner-shape: notch, so the border, the clip and the neon glow all follow the step: the STORE stays a lit sign, a neon pixel one; round buttons become a stepped circle; a browser without corner-shape gets square corners) and redraws the smooth icons in square pixels (js/pixel-ui.js: each icon drawn small onto a 12-cell grid at the grid offset that splits the fewest lines, each mostly-inked cell a pixel in the icon's own colors, the text color kept as the text color; icons already pixel art are left alone, the lightning is drawn by hand, the lock and play arrow drawn in CSS get pixel versions; the redraws are kept in bytefall-pixel-icons-1 so a launch shows them from the first frame). A slot taken in empty, or once its starter is used, is the **BLACK MARKET** (so it's there
whether you take starters in or not):
a random exploit you've unlocked or, a quarter of the time, a BLACK BOX, marked for sale with the
game's own currency sign in its corner (a 0 struck through twice, as a dollar sign is: no one
country's), changing every 4 drops (once the market's open, 4 pips under its icon count the drops left, going dark one a drop; on the last drop what's left of them and the icon blink, and at the turnover the icon rolls through a few others like a reel, ticking once for the whole row, and lands on the new offer; REDUCED effects: it just changes). A tap opens the BLACK MARKET's window: a neon sign of a border in
the accent, a tilted, flickering sign-sign-sign in its corner and scan lines over it; the item's icon
in brackets and its name (a box's odds under it), then each part of its price as the resource's icon
over what you have / what it costs (red and pulsing where you're short), and BUY in the middle
(USE A MASTER KEY under it when short of an exploit's price with one). A tap off it, the X, Esc or back
closes it; drops wait while it's open. A buy waits in the slot until you tap it to arm (or open) it,
then the slot sells again: buy as often as you like. Buying opens once the game's first encryption layer
rises (ZEN, with no layers: after 8 drops, when the first would); till then the slots show their offers
dimmed, and the window shows OPENS IN n DROPS in place of BUY. A game that used them says so on its result screen (STARTERS: ... // BLACK MARKET: ...).

How far KEYS go (a simulation of CLASSIC games on the CPU's own board code: node tools/keysim.js): a game
decrypts about 90 to 110 bits, so it earns about 14 to 18 KEYS, or 20 to 23 all in with the levels,
achievements, first puzzle solves and the daily 10. That's about one patch, or with the resources a game also earns (ECONOMY.md), two tier 1
exploits or one tier 2, or a few saved up for a game with everything on.

## Exploits

Filling the CHAIN METER earns a random exploit from the equipped slots: every
link of every chain charges it, and the charge carries over from drop to drop (5
links; 3 on Easy). The exploit waits in the exploit button (under the grid), which glows
green and shows the exploit's icon (with a count if more are waiting). Tap it
(or press E) to arm the exploit: the button pulses amber and the exploit is
your next drop, with no taking it back. Drop it into a column like a bit and it
runs where it lands. With nothing to arm, the button opens the menu's EXPLOITS tab:

| Exploit | Easy chain | Effect |
|---|---|---|
| Worm Virus `[§]` | 5x | Wipes out every block in the column it lands in |
| Buffer Overflow `[+]` | 4x | Adds 1 to every bit; the top number (7, or 8 on Hard) is re-encrypted under two layers (RANSOMWARE's locked bits sit it out) |
| Trojan `[◈]` | 4x | Wipes out every block touching the spot where it lands |
| RNG `[?]` | 3x | Scrambles every bit to a random number: the bits flicker through random values in place (the squares don't move) for about half a second before the new numbers land (RANSOMWARE's locked bits sit it out: no flicker, same numbers, still locked) |
| Bitflip `[↕]` (drawn as an arrow icon) | 3x | Turns every column upside down |
| Dictionary Attack `[#]` * | 4x | Every encryption layer on the board loses one level at once |
| Keylogger `[@]` * | 3x | Shows your next 3 bits for the next 10 drops |
| Backdoor `[_]` * | 4x | Deletes the entire bottom row, layers included; everything drops by one |
| Rainbow Table `[*]` * | 5x | Decrypts every bit showing the most common number on the board |
| Pivot `[⇆]` * | 3x | Swaps the column it lands in with a neighbor: pick the column, then tap ← or → (or press the arrow keys), with no backing out once picked; edge columns swap with their only neighbor |
| Packet Sniffer `[~]` * | 3x | For your next 3 bits, tap CURRENT (or press ↑ / ↓) to pick each one's number |
| Logic Bomb `[!]` * | 4x | Lands as a `[!3]` block counting down each drop; at zero it wipes out the 5×5 around it |
| Honeypot `[◎]` * | 4x | Lands as a trap; when a bit next to it decrypts, every bit of that number within 2 cells decrypts too |
| Swap (two arrows) * | 3x | Any two bits trade places: armed, tap a bit on the grid, then another (the first again puts it back; the bits it can pick glow faintly); the second pick drops it, and any match they make decrypts. A column tap first is refused (with fewer than two bits on the board it drops and does nothing). Touch or mouse |
| Black Box (a box with a ?) * | 5x | Opens, as it's armed, into a random exploit, any of them, equipped or not (the button flicks through their icons first); the last exploit to unlock. Opening it counts toward FULL TOOLKIT |

Every exploit is unlocked by level and has to be equipped in a slot (see below).

A drop earns at most one exploit, picked from the longest chain it set off.

## Modes

| Mode | What changes |
|---|---|
| CLASSIC | The main game, on EASY / NORMAL / HARD |
| DAILY | Four daily games, picked on DAILY's setup on the main menu's panel: the daily streak and the time to the next set, then what counts (your first play of each game today; PUZZLE gives you 4 tries; after that it's practice), over a card for each game (its rules in a line and how today stands: OFFICIAL RUN READY, the official score with PRACTICE after it, or the puzzle's tries left / the try it was solved on), in a row that slides sideways and loops (past BREACH comes DECRYPT again, and the other way round): one card in the middle, each snapping softly to the center, the cards beside it peeking in at the panel's sides, softly dimmed, and four pips under the row lighting where it is. The card reaching the middle comes into focus at once and is the pick right then (a swipe, a tap on a card beside it or on a pip); with a game under way it waits for the row to settle and asks CONFIRM? first, a tap on it to switch, sliding back if left unanswered. PLAY plays it. Each is the same for everyone that UTC day, and each keeps a daily streak. **DECRYPT**: a fixed stack of 40 bits dealt from a seed of the date (Normal rules, the five standard exploits); it ends when the stack runs out. **PUZZLE**: a new puzzle every day (from `js/data/daily-puzzles.js`), harder through the week: Monday is 1 bit, Sunday 4 bits with layers; you get 4 tries a day (a try counts from its first drop); once it's solved or the tries are used up, later runs are practice. **BLITZ**: the same bits for everyone against a 60-second clock. **BREACH** (daily only): the board starts with a 3-row firewall of level 1 and 2 layers and you get 30 bits to break through; each layer broken is +25 and clearing the whole board is +1,000. For DECRYPT, BLITZ and BREACH your first run each day is the official score and later runs are practice. SHARE on the results screen (every daily game, win or lose; the puzzle shares one square per try) sends or copies your result |
| BLITZ | Normal rules against a 2-minute clock that starts on your first drop (paused while the tab is hidden) |
| ZEN | Normal rules with no encryption layers and no clock |
| VS | VS CPU (`js/cpu.js`): you against a computer opponent at EASY / NORMAL / HARD / INSANE (faster and smarter up the levels; HARD unlocks at Lv 14, INSANE at Lv 46), played by one of four bots with their own look, lines and play style: BOT (balanced), GRIFTER (greedy: chases big chains, takes risks; Lv 6), BUNKER (defensive: low and flat, a little slower; Lv 17) and GLITCH (fast and erratic; Lv 33). The level sets the bot's resting face (EASY happy, NORMAL confident, HARD angry, INSANE red-eyed with bared teeth); switching bots pixelates one out and the next in. EXPLOITS: ON / OFF (setup screen) lets both sides use exploits: yours as in the other modes, and the CPU earns one by filling its own chain meter, a streak on its level's rules (WORM VIRUS on its tallest column, DICTIONARY ATTACK peeling every layer), wearing a devious grin while it holds one. Before START, a see-through card over the CPU's board describes the picked bot's play style. Toggling a setting gets a -_- from the bot; a locked bot or level shows a notice in the setup title's place. Both sides get the same bits in the same order: on NORMAL's 7x7 board against EASY and NORMAL, and on HARD's 8x8 board (bits up to 8, 8 decrypted in one drop making a BYTE and 4 more a NIBBLE) against HARD and INSANE, the CPU's board matching yours (its little board keeps one box either way, the 8x8's squares a little smaller, so changing the level never moves or resizes a thing). Layers rise every 8 drops on both boards whatever the size. A setup card in your board's place, laid out as the main menu's mode card (the screen's width, 8px in from its edges, only as tall as what it holds, its words and buttons at the menu's sizes, START under them; on a short screen its options scroll inside it), picks the game mode (two by two), the target, the bot and the level (four across) and LAYERS: ON / OFF (the usual layer row every 8 drops, on both boards) beside EXPLOITS: ON / OFF. The game mode's description keeps the room of the longest one's, so picking a mode never moves the buttons under it. The drop buttons and EXPLOIT wait until START, which bursts the card apart, brings in your board, its buttons and EXPLOIT, and starts the CPU's clock; the card comes back after the win / loss screen. A drop clock runs under CURRENT (9 / 7 / 5.5 / 4.5 seconds on EASY / NORMAL / HARD / INSANE, red for the last 2): a bit left too long drops by itself into a random column that won't overflow, so waiting out the CPU is no way to win. Attacks charge before they cross: the blocks a chain sends (after canceling what's headed your way, landing or still charging) build up while the chains keep coming and go over once 1.5 seconds pass with nothing added (shown as +n by the CPU's score; the CPU's charging attack shows as hollow pips and +n in the INCOMING banner). CURRENT shows the whole bit in its box, as in the other modes. The CPU's face reacts on the setup screen: a new level shows just that level's own face (no reaction), a new game mode or target a raised eyebrow or grin, a new bot its hello (BOT happy, GRIFTER smug, BUNKER skeptical, GLITCH devious). Tap its face and it reacts as the start screen's bots do: EEK!, or HEY! with a shake-off and a raised eyebrow; on HARD it shakes its head and growls, and on INSANE it shakes its head, snarls and SNAPs at you. The waiting faces (ZZZ, YOUR MOVE) come only on the setup screen, 8 seconds after the last setting was touched, and only for BOT, GRIFTER and BUNKER on EASY or NORMAL; HARD says HURRY UP... instead, and GLITCH and INSANE just wait. INSANE's resting line is MAX CPU. Your board is the same size in all four game types (the score bar's room is kept in CLASSIC too, and the level and layers line has one fixed height), so switching between them never moves or resizes anything. In ATTRITION and DEATHMATCH a score bar runs above your grid, two halves filling from the middle outward toward the target (yours to the left in your color, the CPU's to the right in amber); in TUG OF WAR it's one bar split where the points stand, a | marker sliding left or right as they change hands. Every 30 points a drop scores sends one encrypted block (a one-peel layer hiding a random bit) onto the other board, falling from the top into random columns, one at a time, after its next move; your chains cancel blocks headed your way first, and only the rest go to the other side. At most 8 / 16 / 24 / 32 blocks (EASY / NORMAL / HARD / INSANE) can wait to land on either board; any sent past that are lost. Four game modes (setup screen, top row): CLASSIC (the first to overflow loses); ATTRITION (both start at 0, and the points from chain links 2x and up and NIBBLE bonuses also come off the other side's score; first to the target wins); DEATHMATCH (a straight race to the target score); TUG OF WAR (both start with the same points, and every point scored is taken from the other side; whoever runs out loses). The target (500 to 10,000, default 2,000) or starting points (500 to 5,000, default 1,000) are set with − / + in steps of 500 (in CLASSIC the row reads NO TARGET, as bright as the rest, and − / + just answer DENIED, as they do at either end of the range). Blocks fly and overflowing loses in every mode. The incoming banner shows a small pip per block (groups of 8). In VS the header is every game's: BYTEFALL level with the top icons and VS. CPU // the game mode under it; under that the target line (TARGET 2,000, START 1,000 in TUG OF WAR, NO TARGET in CLASSIC) over your stats in a 2x2 grid of squares (SCORE, CHAIN / ENCRYPT IN, CURRENT, each value centered with its label centered above; a KEYLOGGER's preview splits the CURRENT square) and BOT (the CPU's face: a pixel chip with legs that idles, blinks and glances to the sides and up now and then, looks around before each move (waiting and planning each have two variants now and then: BORED / TAPPING, SCAN / PONDER), grins when it scores, flinches when your blocks land, sweats with a tall stack, and ends on X eyes or a smug GG), the CPU's board (with its numbers, playing each move back: bits falling, decrypting and layers peeling; press and hold it to see it full size over yours with all your board's effects), laid out so your board keeps its regular size and place; PAUSE (the top-right icon, or Esc / P; see PAUSE below) in a match covers your board as the setup screen does and stops the CPU's clock (the bot waits, -_-, tapping a foot), with EXIT (back to the setup screen) beside RESTART. On the setup screen the top-left icon is ← BACK (like the cards' BACK), to the main menu. CURRENT shows [?] until START. The CPU pauses while a panel is open. RECORDS → STATS keeps wins and losses per level |
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

## Notices

Every notice has one spot on every screen: **the notice line**, the line under BYTEFALL (a game's
// CLASSIC // NORMAL, the main menu's // MAIN MENU). An achievement, an unlock, a LEVEL UP, a DECRYPTOR
rank, a reward or EXPLOIT READY fades in there over the line's own words, in the ENCRYPTION warning's
style (plain glowing words, nothing boxed), holds a few seconds and bursts into pixels; one at a time,
the next waiting. Nothing covers the board or the menu. They wait while a card is open, while the title
screen or the screen saver is up, and through a game (see the level meter below: what a game earns waits
for its result screen's EARNED list). **NOTICES**, RULES & RECORDS' third tab, keeps every one with when it
came, newest first (it says so under its head), the unread ones lit; while some are unread, a dot sits on RULES & RECORDS (the main
menu's and the pause screen's) and on the tab. The DAILY DROP never pops up: a new day's is in NOTICES and
lights the STORE buttons, and claimed, the STORE's DAILY DROP card shows what it gave right under CLAIM. A
"can't do that" shows in the title of the card it happened on, the title stepping aside while it pulses,
then bursts, as VS's setup has it: HARD still locked or a starter slot not open yet where the main menu's
// CLASSIC is, LOADOUT LOCKED or SLOTS FULL where the card's // EXPLOITS is. What a drop earns in RESOURCES shows in the SCORE box along
its foot (as far up from its bottom border as SCORE is down from its top), every resource on one line at
once, shrinking to fit if it must.

## Levels, DECRYPTOR ranks and unlocks

**The level meter.** Through a game the level stays as it was, and nothing earned is announced
(LEVEL UP, UNLOCKED, achievements): a game stays clean. Then the result screen's score racks up from 0 (well under a second and
a half, ticking higher as it nears the total), and its meter fills with the game's bits, a rising tone
as it fills, a little fanfare and a flash at each LEVEL UP (about 1.2 seconds a level, the whole fill
over in about 4), and under it an EARNED list of everything the game held back (achievements,
unlocks, level ups), each kept in NOTICES too; left another way (MAIN MENU from PAUSE), they show on the
notice line instead. A tap on the meter skips to the end. PUZZLE too: its bits count toward the level and KEYS as in any mode, but a puzzle already
solved, played again, pays them once a day (its first solve, or a replay's solve, marks the day;
another replay that day pays nothing, and the result says so).

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

Also: **SWAP** at Lv 26 and **BLACK BOX** at Lv 76, the last exploit.

**DECRYPTOR ranks** (the game's prestige). With Lv 80 full, RANK UP TO
DECRYPTOR (in RECORDS → UNLOCKS, four presses) starts you again at Lv 0 one
rank higher, and **everything locks again** to be unlocked by level once more.
The one thing kept for good: DECRYPTOR N keeps N exploit slots (up to 6) from
Lv 0, and the slots still to earn take the table's earliest slot levels (Lv 5,
15, 30 ...). A theme, font, track or
difficulty picked but locked again falls back to the default until it reopens.

**Exploit slots (loadout).** Only exploits equipped in a slot are awarded. A new
unlock drops into a free slot by itself; tap an exploit card to remove or equip
it. **Exploits to keep** (`Progress.isOwned` / `buyToOwn`): the first three (RNG,
BITFLIP, BUFFER OVERFLOW; `FREE_EXPLOITS`) are yours to equip as soon as they
unlock; from TROJAN on, an unlocked exploit is bought once with resources (three
times its STARTER price in resources, no KEYS; BLACK BOX the exploit 30 CRYPTO + 6
ROOTKITS) and is then yours until the next RANK UP, which gives the bought ones up
(its warnings say so: BOUGHT EXPLOITS ARE LOST). The EXPLOITS list splits its tiers
with a ----- line (one section: ===== lines split sections). Its EXPLOITS card shows the
price as have / cost (red where short); a first tap lights it, a second buys it
(into a free slot when the loadout can change); short, what's short pulses red
and the card's title says NOT ENOUGH. Its UNLOCKED notice adds // BUY IT IN
EXPLOITS. FULL ACCESS (and the dev page's UNLOCK EVERYTHING) owns them all while
it lasts. Saves from before this kept what they could already use: every exploit
their level had reached or that was equipped (`ownedSeed`, `OWN_SEED`). The BLACK MARKET, STARTERS and BLACK BOXES still deal in any
unlocked exploit (or any at all, a box), owned or not: a one-off taste. The loadout is locked during a session: change it before the first drop or
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

Tracks 12-15 are still to come (16 is GENERATED). COLLECTOR, DJ and AUDIOPHILE need all 16
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

**Daily streaks follow the dailies' own clock (UTC).** DAILY DRIVER, STREAK and
CENTURY show your current daily streak, not your best: each new set of dailies
(at 00:00 UTC, the same moment everywhere) is a day, and the streak drops to 0
once a whole set passes with no Daily game played. DAILY SWEEP shows the current
set's daily games and starts over when they change. (The LOGIN STREAK and the
DAILY DROP go by your own date.) Achievements for a run in a row (SURGICAL, PICKPOCKET) show your best
run so far. Unearned rows in RECORDS say which kind of count they show.

RULES & RECORDS (main menu and pause screen) opens a card with two tabs, **RULES** and
**RECORDS**; **EXPLOITS** and **STORE** have buttons of their own beside it (main menu and pause
screen), each opening the same card on its own, under its own title and with no tabs. RECORDS has level and DECRYPTOR rank,
every unlock and achievement with a progress tracker, and lifetime stats
(UNLOCKS / ACHIEVEMENTS / STATS / HISTORY). HISTORY (`Progress.logGame`, `history`) lists the
last 10 games, newest first (not PUZZLE or the tutorial; VS matches too): the game (mode and
difficulty, or the daily, or VS and the bot), how it ended (TRACED, TIME'S UP, DONE, BREACHED, WON,
LOST), when, its score, drops, time (from the first drop), best chain, the KEYS and resources it
earned as chips and the patches it used, under a line of the average and the best. Each is also
marked, unseen, as a real game or not (`LEGIT`: 20 drops or more, 45 seconds or more, no more than
40 drops a minute, and at least a bit decrypted for every 4 drops): only real ones count toward
the STORE's prices for you (below), so bits thrown in fast to lose don't. New unlocks, level-ups
and achievements pop up as they happen (achievements stay up about 5.5 seconds, like a console's, before crumbling; the rest about 2). Progress is saved in the browser
(`bytefall-progress`).

**STORE** (`js/store.js`, the cart tab): two purchases, **REMOVE ADS** (no ads,
nothing unlocked) and **FULL ACCESS** (everything that unlocks by level, and no
ads), each with its price and BUY (OWNED once bought), and **RESTORE PURCHASES**
for another device or a reinstall. For a REMOVE ADS owner, FULL ACCESS is the
**upgrade** at the difference (UPGRADE, and a line saying so), so nobody pays
more than FULL ACCESS's price. In the app's RELEASE edition they're Google
Play's (`js/billing.js`, with MainActivity's PURCHASES): its prices, in the
player's currency; its purchase sheet; what the account owns checked as the game
opens, whenever the app comes back to the front, and with RESTORE PURCHASES (a
refund takes it back; a pending payment unlocks once it's paid); each purchase
acknowledged, or Google Play refunds it after 3 days. What Google Play last said
is kept (`bytefall-purchases`, not erased by RESET PROGRESS) so an owner's game
opens without a banner flashing up first. Everywhere else (the website, ByteFall
Test) it's a preview: BUY and RESTORE say the store isn't open and charge
nothing, at the preview prices ($1.99 REMOVE ADS, $4.99 FULL ACCESS, $2.99 the
upgrade; set the same in Play Console). While
there are ads, a **REMOVE ADS** link (cart icon) sits at the foot of the menu's
other tabs and opens the STORE with REMOVE ADS lit up. Buying either one earns
**INDIE SUPPORTER** (THANK YOU group): a real purchase only, not the dev page's
previews (UNLOCK EVERYTHING owns FULL ACCESS; OWN REMOVE ADS owns REMOVE ADS).

**ADS** (`js/ads.js`, the Android app only): the free version's banner, from
Google AdMob through the Capacitor plugin `@capacitor-community/admob` (pinned to
8.1.0). Never on the web, and never once REMOVE ADS or FULL ACCESS is owned. On
launch it starts the ads SDK, shows Google's consent form where the law asks for
one (the EU, the UK, Switzerland...), then puts an adaptive banner (the screen's
width, its height to suit) at the TOP of the screen, well away from the drop
buttons. Android draws it over the page, so its height, as it reports it, goes
to the AD STRIP (`setAdStrip` in `js/script.js`, the same room the dev page's AD
BANNER PREVIEW keeps), and the whole game fits below it; until a banner has
loaded (or if one fails, tried again a minute later) the strip is 0, so there's
never an empty gap. On Android 15 and later the ads plugin moves the banner down
by the status bar's room (though the game hides the bars and the page already
starts below that room), which put it over the title; `MainActivity` puts its top
back level with the page's after every layout, so it sits in the strip. Buying
either purchase takes the banner and the strip away at once. Where consent applies, SETTINGS gets an **// ADS** section with AD
PRIVACY OPTIONS, to change the choice made (Google requires it there). While
`testing` is on, SETTINGS also gets **// TEST ADS**: a line on what the ads are
doing (started or not, the consent answer, a banner showing, or Google's error
code and reason there's none, or off because a purchase or UNLOCK EVERYTHING
counts as owned), to see on a phone why a banner isn't there; and a consent
check that fails outright (an AdMob account or its privacy message still being
set up) doesn't hold the test banner back. With `testing: false` a failed check
holds the ads till it works.
The IDs live in `js/ads-config.js`: ByteFall's own App ID, and for now Google's
sample banner with `testing: true`, which only ever shows test ads.
`tools/setup-android.js` writes the app ID from there into the Android manifest
(the SDK won't start without it). For the release: put in ByteFall's banner ad
unit ID from the AdMob console and set `testing` to false. (The ByteFall Viz app leaves the
plugin out: `includePlugins: []` in `visualizer/capacitor.config.json`.)

`js/progress.js` holds the stats, levels, unlocks and achievements; `js/script.js`
reports each drop, decrypt, peel, byte, exploit and point to it.

**Dev switches.** The `</>` dev page has UNLOCK EVERYTHING (like owning Full
Access, for this browser; the game shows a DEV badge, a label only, level with the corner buttons and behind the wanderers, while it's on), JUMP TO
LV 80 and +10 LEVELS for testing DECRYPTOR ranks, slots and exploit unlocks. With UNLOCK EVERYTHING on,
press and hold any exploit card for 2 seconds to make it your next drop.
AD BANNER PREVIEW (off by default; tap to step through 50, 60 and 90px, or add
`?adpreview=60` to the URL) holds a gray strip at the top of the screen (AD
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

The game has one text size, set large enough to read on a phone (there's no TEXT SIZE setting):
every piece of text has its own size written in, nothing scaled on top. BYTEFALL is one size in one
place everywhere: the main menu, every game (VS too) and the PUZZLES card, where // PUZZLES sits under it
as a game's mode line does (every one centered across the top, its capitals level with the middle of
the corner buttons; the main menu's isn't scaled up with the menu on a bigger screen). In VS with LAYERS: OFF, ENCRYPT IN keeps its place at full brightness, its
count a -. The main menu holds still:
its title is one line at the top (BYTEFALL // DECRYPTION TERMINAL, 8px under the screen's top edge; just
BYTEFALL where the whole line won't fit), with **←** in the top left corner back to the title screen,
then the level, the resources and the six modes; the mode's panel is only as tall as what the mode
puts in it, PLAY 8px under its last piece and the rows under the panel right after, and what the mode shows in it (its description,
DAILY's cards, the options) scrolls inside it on a short screen, fading out at its foot while
there's more. The wanderers' lane at the card's foot is one fixed height (192px), the same on the
main menu and in every game, whatever else is on the card; the defrag backgrounds (the grid's card,
the mode card, VS's setup) are a little see-through (92%), so the lane's trees show faintly behind
them, and the HAUNTED FOREST's two big trees in front (drawn in the frame editor at half the bots' pixels, finer than the rest: one for each edge, their crowns arching in) stand
on trunks that run down to the card's foot, inside its border (the card frames the scene), the bots passing
behind them; about one forest in three, the HOLLOW stands between them, as big, a dead tree in the same
finer pixels: a twisting trunk with a scowl carved into it, red pinpoints glowing deep in its eye hollows, a
gaping mouth of splintered fangs you can see the fog through, clawed twigs, a long arm reaching out with
hooked fingers and roots gripping the ground. The two edge trees never match: each is drawn for its own edge. The forest has a floor: a silhouetted ground along the lane's foot down to the
card's edge, earth with grass tufts in front of the bots' feet, stones, fallen twigs and dead leaves,
laid out afresh each time the forest comes. The big trees' canopies arch in over the lane toward the middle (the
HOLLOW's both ways). October also brings the HEADLESS HORSEMAN (a black horse at a gallop, its
cloaked rider holding up a flaming jack o' lantern; HAHAHA, and poked, every bot near it jumps) and
ZOMBIE HORDES (three to seven, shuffling in, out of the trees in the forest, some clawing up out of
the ground; now and then they all break into the THRILLER for four bars, on the music's beat, then
shuffle on). THE OVERCAST (OCTOBER and NOVEMBER, now and then, and over the
HAUNTED FOREST most of the time it stands): three layers of pixel cloud roll in across the game
card's sky, the far one darkest and slowest, the near one lightest and patchiest, each in masses
with lit tops and dark undersides, so you see them stack and how thick they are; the birds and bats
fly at one of three depths among them (behind the middle layer, between, or in front) and now and
then climb or dip a layer, flying in and out of the cloud. October's is purple-gray with lightning
flickering inside it, lighting it from within; November's is plain gray. It lifts after a few
minutes (over the forest, it stays). The game card's sky (the clouds, the overcast's and the fog's dark, the
night, the moon's sky) is feathered at the top: it reaches 56px past the lane's top edge and fades
out there, into the UI above.

**WEATHER** (`js/weather.js`): over the wanderers on the game card and the start screen, all year.
Every few minutes a spell may come, from the time of year's and the time of day's, and the date
gives each day a lean (a wet day, a dry one, a stormy one, a calm one: the same for everyone).
WINTER (Dec-Feb): SNOW that settles on the floor, a BLIZZARD (sideways, a whiteout), SLEET, a
crisp SUNNY day, the AURORA on clear nights. SPRING (Mar-May): DRIZZLE, RAIN (puddles that drops
ring, the bots' umbrellas up), a THUNDERSTORM (bolts, flashes, the bots flinching at the thunder),
a SUNSHOWER, WIND full of green leaves and blossom petals, HAIL that bounces (an "ow"), SUNNY, a misty morning
(the fog). SUMMER (Jun-Aug): SUNNY (a heat haze, the bots puffing), THUNDERSTORMS, a SUNSHOWER, a
WIND of green leaves, FIREFLIES in the evening, a METEOR SHOWER at night (the most in
August). AUTUMN (Sep-Nov): WIND full of red and gold leaves (blown in along the whole height of the side, settling across the floor), DRIZZLE, RAIN, a THUNDERSTORM, HAIL, a
foggy morning, SUNNY. After the rain, now and then, a RAINBOW. And through the year: OVERCAST days (the clouds alone),
FLURRIES (winter, autumn's first snow, a late one in spring), THUNDERSNOW (rare: lightning in the
snow), DIAMOND DUST (a bitter winter morning: ice crystals glittering), POLLEN and DANDELION FLUFF
(spring and summer; a bot sneezes), a HEATWAVE (glare, a heavy haze), a DUST STORM (summer: a brown
sky, dust streaming, a tumbleweed), HEAT LIGHTNING (summer nights: far flickers in the clouds), SUNRISE and SUNSET
(the sky pink or orange, a big low sun rising or sinking), and THE MOON on clear nights in its real
phase for the player's date (lit on the right as it waxes, the left as it wanes, the rest faint;
none at the new moon), now and then over the other night skies too; in September and October its
full moon is the orange HARVEST MOON. October's own moons (the werewolf's, the blood moon) stay as
they are. The game card's lane gets its clouds
for the rain, the snow and the storms (dark for a storm, pale for snow). Achievements: STORM
CHASER (a thunderstorm, a blizzard and hail) and STARGAZER (the aurora, a meteor shower and
fireflies). The dev page's WEATHER brings it OFTEN, in a chosen season, or one kind to stay; the
BOT SANDBOX has a button for each.

**SCENES** (`js/scenes.js`): now and then (a few times an hour, 10-20 minutes each) the lane
becomes a place, by the time of year: MEADOW (spring, summer), BEACH (summer: the sea's waves
moving, a parasol), CITY (any time: a skyline, more windows lit at night, a sidewalk, a hydrant),
WOODLAND (spring to autumn: the trees and the path's litter in the season's colors), SNOWFIELD
(winter), DESERT (summer), FARM (autumn: a red barn, pumpkins) and LAKE (spring to autumn: a woodsy lake,
reeds and lily pads). The LAKE and the BEACH have a pier: now and then a bot walks out on it (up its
steps), casts, and waits; the bobber bobs, nibbles and goes under, and it reels in a fish (held up,
pleased, thrown back), now and then a golden one (heart eyes), or an old boot (put out), and 1 time
in 10 a RESOURCE off the bottom, kept and yours (BUGS, CACHE, CRYPTO, ROOTKITS, or rarest, a MASTER
KEY; the notice line says which); then it
casts again or heads back. TAP THE BOBBER and the fish is gone: the bot's upset (hey! my fish!).
BITS OF LIFE in each place, behind the bots: at the LAKE a fish jumping (rings where it goes in),
rings on the still water, a duck paddling across, a dragonfly darting over the reeds; at the BEACH a
fish jumping, gulls gliding over, a crab scuttling along the sand; and a bug here and there:
butterflies and a bee over the MEADOW, a beetle or a ladybug on the WOODLAND, FARM and DESERT ground,
a moth in the woods at night, pigeons pecking along the CITY's sidewalk (the day ones keep in at
night). And NEAR CRITTERS, bigger, close by on the bots' own floor (in front of them): a frog hopping
along the lake's shore, a crab on the beach, butterflies, a bee and a rabbit in the meadow, a
squirrel in the woods, a chicken on the farm, a lizard in the desert, a pigeon in the city, a rabbit
in the snow. The bots notice one as it passes and it sways their mood: a butterfly a heart, the
rabbit an "aww", a frog a curious "ribbit?", a crab a start (now and then a pinch: ow!), the bee
worries them (BUNKER: EEK; GLITCH laughs), GRIFTER eyes the pigeon; each nudges their temper and fun.
Behind each scene, its SKY: the time of day's (a night navy, a dawn's peach, a day's blue, a dusk's
orange and violet), turned by the weather (gray in cloud and rain, dark in a storm, pale in the
snow, brown in a dust storm, warm in a heatwave), crossfading as it changes and fading out up top
into the card; on the start screen the sun and moon come down into it. Poke the bot and it shushes you. Achievements: GONE FISHING, THE ONE THAT GOT AWAY. No numbered BITs are
pushed in while the pier's out (one would stand in front of the bot fishing off it). Each is drawn at three depths,
never all in front: a far layer behind everything, the ground behind the bots' feet, and a few
details in front of them. The weather leans to suit it (a beach's sunsets and storms, a city's rain,
a snowfield's snow; never snow on the beach), and half the time it brings a spell of its own. Not
with the fog or October's HAUNTED FOREST. The dev page's SCENE brings them OFTEN or keeps one; the
BOT SANDBOX has a button for each.

A button's tick (and buzz) comes on a successful tap, released on it, not
on a touch that slides off. The buttons are one size in every mode and font, their words centered; a word that
won't fit on a button shrinks, never under 10px. Through the game the font never changes a
button's size or moves the HUD, the board or its buttons.

- **Add to Home Screen** (Chrome's menu on Android, Share on iPhone) installs
  ByteFall with its own icon, and it opens full screen like an app, without
  browser bars. `manifest.webmanifest` and `assets/icons/` (the icon's source is
  `icons/icon.svg`) set that up.

## Daily bonus, vibration and resetting

- **Daily bonus:** each day (local date), one free exploit (claimed in the
  STORE's DAILY DROP) waits loaded in the exploit button. The new day's drop
  (and the LOGIN STREAK's count) comes when the game opens, or when it's brought
  back from the background after the date has turned, or within a minute of
  midnight while it's open; a claimed one waiting in a game under way stays for
  that game.
  Arming it makes one of the first five exploits (RNG, BITFLIP, BUFFER OVERFLOW, TROJAN, WORM VIRUS) your next drop, even if you haven't unlocked it yet, so new players get to try them. It doesn't stack
  if unused, and it's hidden in DAILY and PUZZLE so those stay equal for
  everyone. Its notice (like every notification but achievements) waits until
  you're past the start screen.
- **Vibration:** on devices that support it (Android), drops, decrypts,
  exploits, new layers and game over give a short buzz. VIBRATION in
  settings turns it off; the option only appears where it works.
- **Reset progress:** at the bottom of RECORDS → STATS, with a two-press
  confirm. It clears stats, unlocks, achievements, puzzles, best scores, the
  LOGIN STREAK and the DAILY DROP (today's comes back to claim); settings stay.
- **A save that can't be read** (cut off mid-write, say) starts the game fresh,
  but it's kept aside first as `bytefall-progress-unreadable`, so nothing more
  can overwrite it and it can still be recovered by hand.

## Full Access

The Android app is free with a banner ad, plus two purchases (the STORE): **REMOVE
ADS**, and **Full Access**: no ads, and every unlock straight away. Nothing needs
it; everything can also be earned. `js/unlocks.js` holds that check (never owned
on the website; the RELEASE edition's set from Google Play, `js/billing.js`). Add
`?unlockall` to the URL to preview everything unlocked.

## Playing

The game fills the screen with no card or frame around it (the phone's own edges are its frame):
everything sits 8px in from the screen's edges, the room going to the board, the HUD and the main
menu's panels (the DAILY cards included). VS sits its board a little narrower when the screen's
height is what limits it. The title screen and the music player have no card either. (The game in
a bordered card, as it was before: commit 318ba34.)


Open `index.html` in a browser. Tap a numbered drop button (under the grid by
default), or press `1`-`7` (`1`-`8` on Hard), to drop the current bit shown in the HUD.
Or touch the grid itself: touch (or click) and hold, and the bit appears in the top
row over that column, following your thumb (or the cursor) from column to column;
let go to drop it there (let go well off the grid to call it off). A quick tap on
a column drops straight in. PIVOT's choice of side shows as arrows in the top row
too, and the button over the aimed column lights up. Both ways always work.
RESTART (two taps) is on the pause screen; there's no corner button for it.

The HUD (not VS): BEST over SCORE on the left, CURRENT large in the middle (on Easy, NEXT in a
short dim panel under it; TIME or BITS LEFT under it in the timed and counted modes), ENCRYPT IN
over CHAIN on the right (CHAIN the whole column in ZEN).

THE CHAIN METER, a streak: a 5-segment bar up each side of the grid, exactly as tall as
the grid's squares (the top row's top to the bottom of row 1), set off from the grid by the
same 3px gap as between its squares (both ==== lines run on under it). Every link of every
chain lights one, from the bottom; fill it and an exploit is earned, and the meter starts
over, empty. How it keeps its charge by level: EASY and NORMAL carry it from
drop to drop (as long as a drop clears a bit), a drop that decrypts nothing taking one
segment off on EASY and emptying it on NORMAL; HARD and INSANE empty it as soon as each
chain ends, so the 5 links have to come in one chain. Only one exploit at a time: while one
waits (earned, the daily free one, or armed) chains don't charge the meter at all; it waits
empty, pulsing amber, until the exploit is used. ZEN and the tutorial play NORMAL's rules, BLITZ its difficulty's, VS the
CPU's level's; the CPU's exploits come from the same streak on the same rules, one at a
time. While an exploit is ready, the bars pulse amber (and the exploit button pulses), and an earned one also shows
EXPLOIT READY // its name on the notice line for a few seconds. ENCRYPT IN has a ===== under its count
(the layer it counts down to, as a bit is [n]), flashing with the line under the
board when the next drop brings one.

The tutorial opens on a welcome (no step number, BEGIN), then 26 steps; on a step that asks
for a tap, the screen dims a little but for what to tap and the banner (a 0.25s fade); a step can take its
drop in more than one column (step 3: column 4 or 7). The tutorial's banner: BOT sits in the top-left corner of its frame with its words
wrapping around it and on under it; BACK and NEXT sit under the frame, outside it. The
chain lesson (steps 6 and 7) explains the meter, and it keeps its charge on through
step 13: step 6's 3 links, step 8's 1 and step 9's 2 fill it (3 + 1 + 2 = 6), earning the
WORM VIRUS the exploit steps then use. While an exploit
waits, the meter pulses amber. The MENU and SETTINGS buttons light up full while pulsing;
the EXPLOITS step pulses SLOTS and the cards; the menu steps' banners sit mid-screen
(the EXPLOITS one low, clear of what it points at).

THE EXPLOIT BUTTON: under the grid in its own row, below the drop buttons with a gap
between (it's not one of them), a square the size of a grid square with the exploit's
symbol in the middle (the daily free exploit just loaded in it, unmarked). With nothing held, tapping it just buzzes: the EXPLOITS
card (the loadout) opens only from its EXPLOITS button. The HUD's labels (SCORE ... CURRENT) are brighter.

The gear/speaker icon in the corner opens the settings: sound and music on or
off, whether the drop buttons sit under or above the grid, the color theme
and the playlist.

Themes (picked from the swatch grid in settings; a locked theme or font shows its unlock level in its corner, LV 12, as the playlist's tracks do; the page fades to the new one over 1 second, 1.25 into or out of PAPER):

| Theme | Bits | Layers | Cracks & exploits | Trace |
|---|---|---|---|---|
| TERMINAL (default) | green | gray | amber | red |
| CIPHER | cyan | magenta | yellow | orange-red |
| AMBER CRT | amber (a yellow amber) | gray | cyan | red |
| MONOCHROME | light gray | striped gray | white | white |
| ANAGLYPH | off-white with red/cyan 3D fringes | red | cyan | red |
| SYNTHWAVE | pink | purple | orange | cyan |
| DOT MATRIX | olive green | dark green | pale green | red |
| PAPER | near-black ink on paper | gray | dark amber (gold) | red |
| GLYPH | shapes on blueprint blue | slate | amber | red |
| SPECTRUM | each bit cycles the rainbow on its own | gray (still) | near-white (still) | cycles |
| SEASONAL | the time of year's: OCTOBER pumpkin orange, NOVEMBER gold, December evergreen, FROST (Jan 7 – Feb) ice blue, VALENTINE'S (Feb 7 – 14) rose pink, SPRING (Mar – May) fresh green, SUMMER (Jun – Aug) sea aqua, SEPTEMBER school-bus yellow | each season's | OCTOBER purple, NOVEMBER rust, December red, FROST silver, VALENTINE'S rose red, SPRING blossom pink, SUMMER sunshine, SEPTEMBER apple red | its season's |

GLYPH draws each bit as a shape with one corner per point of its number (1 is
a teardrop pointing up, 2 a lens, 3 a triangle... 8 an octagon), with a small
number in the corner. SPECTRUM gives every bit its own random hue speed,
direction and phase, slowly hue-rotates the rest of the page, and turns the
background grid into dimmed rainbow blocks; it holds still under reduced motion. SEASONAL (free, the
full-width button under the other themes) follows the calendar: in OCTOBER the title flickers now and then like a failing light; in DECEMBER
(to Jan 6) the background's blocks are bulbs of every filament color, twinkling, the board catches
the lights' warm glow and the scroll bars are candy canes. **THE SEASON'S LIGHTS**: strings of old
filament bulbs in fine pixel art (finer than the bots', each turned its own way: hanging, leaning, sideways, a few pointing up off the wire) run down both sides of the screen, top to bottom, a bulb at either end (js/lights.js builds them to the screen's height), the wire in the screen's 8px margin and every bulb turned in toward the middle, so none is cut off at the edge; over everything, but never in the way of a tap (their glows end at the screen's edges, so the page never scrolls for them), glowing and twinkling in turn,
the CHAIN METER's segments in their colors: December's C9s of every color, October's orange,
purple and green with jack o' lanterns and candy corn among them, Valentine's pinks, red and white
with hearts. EFFECTS: REDUCED takes them (and December's warm glow) away.

Every color in `css/style.css` is a named role in `:root`; a theme is a
`[data-theme="…"]` block that overrides those values, plus an entry in
`THEMES` in `js/script.js` and in the small theme script in `index.html`'s
head. All but TERMINAL are unlocked by playing (see below).

**The corners.** RESTART is the arrows icon in the game card's lower-left
corner, grayed out until a session's first bit drops (QUIT in VS); the exploit
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

## Font sizes

One scale for every menu card (RULES & RECORDS, EXPLOITS, the STORE, SETTINGS, the info cards); the
full rules head css/style.css, so they're the first thing seen when changing styles. In short:
17px card titles and item names, 15.5px section heads and banners, 14.5px body text and the =====
lines, 13px notes and sub-heads, 12px buttons, 11.5px small tags, 10.5px HUD labels, 9px the floor.
Sections are parted by ===== lines, never dashes.

## Files

`index.html` (and `byterrium.html`, `dev-tools/audio.html`, `dev-tools/mixer.html`) load their CSS and JS with a `?v=N`
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
  drifting hex/binary glyphs (skipped under reduced motion). The game never waits on a burst: its
  pieces hold the bits' place until they fly, while the board collapses, the chain carries on and the
  next drop is open (a single link frees it in about a third of a second, a second or so before)
- `js/viz.js` — the shared music visualizer (LED bars or auto-gained
  oscilloscope wave with a CRT trail) used by the playlist and the dev page;
  the chosen style is remembered for both
- `js/grid-bg.js` — the dim "defragmenting" micro-grid animated behind the board (performance: only the blocks whose brightness changed are redrawn each frame, in batches by shade, with the theme's color read once per theme change; the board's and HUD boxes' rest under the main menu;
  static when the OS asks for reduced motion)
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
- `js/music/music-stack-overflow.js` — track 11, STACK OVERFLOW: an original folk-techno
  track in D minor (with the raised seventh, C#, for its Russian folk color): a bouncing
  dance tune written for the game, on a balalaika-like pluck (long notes as a tremolo) over
  an oom-pah bass, then a four-on-the-floor build and a drop with a second, brighter tune on
  a supersaw over a pumping offbeat bass, and a bell breakdown. Its tempo climbs with the
  stack, like a falling-block game's music: 140 BPM calm, up to 160 at the top of the
  intensity (the engine's `step` follows it, and the player and mixer read it every 16th);
  then 16th hats, a rolling bass, the tune an octave up and an overflow alarm. Unlocked at
  Lv 44 (TRACK 11).
- `js/music/music-firewall.js` — FIREWALL (not in the game, and not loaded by any page: kept as code only): an original 16-bit console track in
  the style of early-90s Genesis platformers, in two-operator FM synthesis like the console's
  sound chip (a slap FM bass, an FM electric piano with a tine, FM brass and bell leads) over
  crunchy sample-style drums (rounded to 64 levels). A bright ZONE theme in F major at 144 BPM
  (zone, zone again, a bridge, the tune an octave up) that turns into a BOSS FIGHT as the stack
  nears the line: at 6+ rows (80%) it finishes its two bars, plays a WARNING bar (a siren over
  a tom roll) and switches to the boss theme in F minor (a driving 16th-note FM bass ostinato,
  harsh FM brass, pounding drums) until the stack falls to 4 rows (under 60%: the gap keeps it
  from flipping between 5 and 6), when the zone returns on the next two-bar mark. Layers: the
  FM brightening, 16th hats, a pushing bass and extra kick, an FM bell counter-melody; the
  BOSS layer's MUTE (dev pages) keeps the zone theme, its SOLO plays the boss theme.
- `dev-tools/audio.html` — the audio compendium, opened by the `</>` icon in
  the footer: every sound effect with a play button and where each is used in the
  game, and the track list, each track opening in the mixer
- `dev-tools/mixer.html?track=<id>` — the MIXER, one track per page (only that
  track's file loads): PLAY with a seekable position line and a visualizer; SOUND
  OUTPUT (PHONE / HEADPHONES / SPEAKERS, as in the game); the intensity slider and
  STACK ≤3 / 4 / 5 / 6+ buttons (what the game sends, eased as it does); a TIMELINE
  with a lane per instrument channel marking every 16th note it plays across the
  loop at the picked stack height (read from a dry run of the track's own code),
  with the playhead (tap to jump); a strip per channel with its label, a live
  meter, a small spectrum shading what a phone speaker can't play (under ~250Hz,
  a line at PHONE's 170Hz cut), four level sliders (dB at stack ≤3, 4, 5, 6+,
  LINK moving them together), MUTE and SOLO; EXPORT (the track's levels as text
  for `js/music/mixes.js`), REVERT TO THE GAME'S, ALL 0 dB. Levels are kept per
  track and output in the browser (`bytefall-mix-<track>`) until pasted in. The
  intensity layers (when each comes in, MUTE / PLAY and SOLO; ARCHIVED and TRIAL
  layers start muted), the sections and how the music intensifies are below

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
each track kept its loudness (within about 0.3 dB of its mono mix).

## Tutorial

MAIN MENU → **TUTORIAL**, or RULES → **TUTORIAL** (beside the title), starts a guided lesson on set boards
with set bits (`js/tutorial.js`). BOT narrates it: its face sits in the banner's corner, and each line types out fast with a blip of square-wave "voice" every other letter (Animalese-style, following SOUND), pausing at punctuation; a tap on the text finishes the line, and the lesson never waits on the typing. BOT's mood follows along (happy at the welcome and the chain, worried at the ======== line, devious with the WORM VIRUS, -_- at a wrong column). A banner over the board explains each rule
and asks you to tap what it names; whatever it's talking about pulses, and only
the lesson's drop column can be pressed (the others dim). No lesson drops a bit
into the column of its own number, so it never looks like it has to. After each
drop it says what happened and shows the points: each link's bits, (10 +
number) × the chain, NIBBLE bonuses and the total. Twenty-six steps: the terminal,
CURRENT (the bordered middle panel), a line across, a line down, SCORE, a chain with a NIBBLE, CHAIN,
peeling a layer twice until it reveals its bit, the ======== line, ENCRYPT IN (the HUD: BEST over SCORE left, CURRENT middle, ENCRYPT IN over CHAIN right),
an exploit (arm the WORM VIRUS waiting in the EXPLOIT button, then drop it on a
tall column), PAUSE (the top-left button, as in a game) and the pause screen (in the tutorial: RESUME, RULES &
RECORDS, SETTINGS, EXPLOITS and STORE; no RESTART or MAIN MENU, the banner's EXIT leaves), RULES &
RECORDS with its RULES and RECORDS tabs, closing the card with ← BACK (a tap outside does
nothing), EXPLOITS (the loadout) and ← BACK, SETTINGS and what's in it, ← BACK and RESUME, then PLAY CLASSIC or RULES. Over an
open menu the banner moves to the bottom of the screen. BACK (from step 2 on)
redoes the step just played, or before a drop goes to the step before, putting
the board, bits, score, chain and exploit back as they were. EXIT leaves at any
point. It counts toward nothing (no XP, stats, achievements or best score). Notices (a poke's achievement, say) show on the notice line under BYTEFALL, clear of the banner.

## Startup

A fresh launch (the app or tab opened anew) opens on the START SCREEN (the studio,
EMPTYFISHTANK PRESENTS, across the top; the copyright above the wanderers): a card
filling the screen with the starlight twinkling across it, the BYTEFALL title
in the middle and a glowing START button below it, as far under the tagline as
the tagline is under the title (measured letter to letter, in every font; `js/start.js`). A tap anywhere
else lets the music begin (browsers need one) and leaves you on the screen.
START (or Enter / Space) fades the start card's contents out, its border staying (the start card is laid exactly over the game card: the same size and place, on a phone or in a browser), and the MAIN MENU fades in inside the same border. The very first time the game is opened, it fades into the
TUTORIAL instead (EXIT skips it, to the main menu). A refresh puts you back where you were: on the start screen until START is
pressed, then on the main menu or in the game, with whatever was open still open (the MENU on its tab
and sub-tab, scrolled where it was; SETTINGS; the MUSIC PLAYER) or the TUTORIAL
at the step it was on, BACK still working (`js/place.js`). Coming back to the app
or tab carries on where you were.

**MAIN MENU** (`#home`, script.js's `showHome`): between the start screen and a game.
The title and level bar, the six modes in a 3x2 grid (DAILY, CLASSIC, PUZZLE over BLITZ, VS, ZEN:
CLASSIC top center), and the picked mode's panel: its name, what it is, its options (CLASSIC's difficulty,
DAILY's game, PUZZLE's puzzle), your best (DAILY: today's official score once played) and
PLAY. With a game of that mode under way (a drop made; paused) PLAY reads RESUME and carries
on; picking another mode then asks first (CONFIRM?), as a restart does, and resets without the
melt (the board is hidden). Under the panel, RULES & RECORDS and SETTINGS, then EXPLOITS and STORE buttons open those
panels, and TUTORIAL under them (as wide as one of them, centered; a game under way asks
first), each panel a card of its own covering the game card: ← BACK (or Esc) closes it, a tap
beside it doesn't, and the corner icons hide while one is open. In a game (not the tutorial) the game screen is the title, the mode's
name under it (`// CLASSIC // NORMAL`, `// BLITZ`, `// PUZZLE 3`, `// DAILY DECRYPT // PRACTICE`),
the HUD and the board: the top-right icon is PAUSE (← BACK, top left, to the menu, when there's
nothing to pause: VS's setup screen), and SETTINGS waits on the pause screen.

**PAUSE** (every mode but the tutorial; the top-right icon, or Esc / P): the board is covered
as on VS's setup screen and the clocks stop (BLITZ's, the CPU's): RESUME, RESTART (VS: a new
match with the same options) and, in VS, EXIT (back to its setup screen), the last two taking
a second tap; RULES & RECORDS, SETTINGS, EXPLOITS and STORE open over it (every button under RESUME one size, two to a row, as on the main menu); MAIN MENU goes to the menu with the
game still paused. A pause pressed mid-drop opens once the drop finishes. The game over box
has MAIN MENU under NEW SESSION.

**BACK** (the phone's back button, or the browser's): an open panel (MENU, SETTINGS, the
MUSIC PLAYER) closes first; in a game it goes to the main menu (a game under way pauses, for
RESUME); on the main menu it goes back to the start screen (through black, as it went in);
from the start screen it leaves as usual. The tutorial stays put (it has its own EXIT)
(`js/start.js`).

**SCREEN SAVER** (`js/saver.js`; SETTINGS → SCREEN SAVER, on by default): after 90
seconds without a touch or a key (never while a timed game runs: a BLITZ clock or
a VS match), a quick pixelated fade (black blocks filling in, in a random order)
to a black screen with the wanderers doing their thing, visitors, seasons and all,
at a height that moves every minute (no burn-in). To save battery everything
behind it rests: the background animations stop, the card's wanderers go, the
menus and the player close; the music plays on. A bot can be poked as ever; a tap
anywhere else, or a key, wakes it (the blocks breaking up, quicker), and that tap
goes no further. On the start screen one to four of the CPUs (BOT, GRIFTER, BUNKER, GLITCH;
never two of the same; each arriving with a face, mostly EASY (35%) and NORMAL (45%),
the angry HARD (14%) and red-eyed INSANE (6%) now and then) wander along the bottom of the card. They have
MINDS (`js/wanderers.js`): each a personality (BOT curious and cheery, GRIFTER social and greedy, BUNKER
lazy and cautious, GLITCH impulsive and mischievous) and needs that drift (ENERGY, spent walking; SOCIAL,
wanting company; FUN; and TEMPER). Its TEMPER is its face, the difficulty faces as moods: calm EASY,
even NORMAL, cross HARD, fuming INSANE. Poked, scared or robbed of a fish it gets crosser (a "grr" as
it turns HARD), and a HARD or INSANE one snaps when poked, so poke a calm one a few times and watch it
climb, then snap; good things (a snack, company, a catch) and time calm it back to its own calm. At each
stop it does what it needs, weighed by who it is: rests when tired (BUNKER most), hops, snacks (GRIFTER
most), puts on headphones (GLITCH most), goes over to another when lonely, fidgets when bored. It
notices things: it wanders over to watch a bot fishing, joins a headbanging bot (with headphones), turns
to look at a visitor going by. A tired one walks slower, and BUNKER or a tired bot headbangs where the
others windmill. Meetings come as often as they want company, and a cross one is annoyed in them. The
BOT SANDBOX's MINDS panel shows each one's face and needs, live. They keep their minds between
visits (one of each bot: the same one comes back), as they left, eased by the time away: rested, its
temper cooled toward its own calm, so a bot you made cross comes back still a little cross a while
(kept in this browser). Looking the way
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
switch, or `?season=halloween`, forces one or turns them OFF). They STACK: when
several are on at once (Hanukkah during winter, Christmas and Kwanzaa
overlapping), each adds its touches, a bot picks its costume from any of them and
the visitors and scenery come from all of them. The windows: HALLOWEEN Oct 1 to
31, NOVEMBER the month, WINTER Dec 1 to Jan 6 (the base under the December
holidays), HANUKKAH its eight nights (a table of first nights, 2025 to 2035),
CHRISTMAS Dec 18 to 26, KWANZAA Dec 26 to Jan 1, NEW YEAR'S EVE Dec 31 and NEW
YEAR Jan 1 and 2. Forcing a holiday brings WINTER along with it. **HALLOWEEN**
(October 1 to 31): most wanderers (80%) arrive in costume, drawn in their own
pixel grid over the body and under the face, so every face, hop and snap still
shows: BUNKER is a pumpkin (its face the carved one), BOT a see-through bedsheet
ghost (80% opaque; it still walks, its legs showing under the hem),
GRIFTER wears a witch's hat and GLITCH devil horns and a tail. All four
dressed up on screen at once earns the hidden COSTUME PARTY. A wanderer that
stops sometimes has a snack (30%): one to three gummy drops (2x2 pixels, a
random bright color), each pulled from its side and tossed in an arc over its
head into its mouth (hopping pixel to pixel), a munch and a chew; SWEET TOOTH
(hidden) for 100 of them.

**Winter and the holidays** (costumes for any bot, mixed across the seasons on;
a hat hides the antennas and ear tips under it). WINTER: a striped knit BEANIE
with a pompom, EARMUFFS, a SCARF (blue or green); cookie bites as the snack.
HANUKKAH: a blue-and-white beanie or scarf; gelt (gold) as the snack.
CHRISTMAS: a SANTA HAT, an ELF HAT with a bell, or ANTLERS and a red nose;
candy-cane bits as the snack. KWANZAA: a red-and-green scarf. NEW YEAR'S EVE and
NEW YEAR: striped PARTY HATS. Snow falls all winter: pixel flakes drifting down
the lane to the floor, a moment there and gone. At the new year, FIREWORKS go
up now and then (a rocket, then a burst of pixel sparks that fall away). At the
player's own midnight on New Year's Eve, every bot on the card counts down from
ten, one says HAPPY NEW YEAR (the rest WOOO!, YAY! or the year) and the sky
fills with fireworks (MIDNIGHT, hidden).

**Visitors** (`js/visitors.js`) pass through the same lane, one visit at a time
every 20 to 45 seconds, in from either side. HALLOWEEN: FRANKENSTEIN'S MONSTER
(lumbering, arm out), a MUMMY (shambling, a loose bandage swinging), the CREATURE
from the black lagoon (waddling, dripping water), NOSFERATU (gliding), a
see-through GHOST (floating), a flock of BATS (flapping across), a CROW or two
(hopping in, pecking, then flying off, wings open and flapping) and a SPIDER (down on its silk thread
somewhere along the card, a dangle, back up). NOVEMBER (the whole month; nothing
holiday-specific): a TURKEY struts in, pecks a while and struts on (and the
crows), and MIGRATING BIRDS fly over: geese in a V (honking now and then), ducks in a
line, a loose flock of songbirds (robins, bluebirds, goldfinches or cardinals) or
swallows swooping fast. About a third of the time one drops out, lands, pecks about and
calls (HONK! QUACK! TWEET! CHIRP!) to the nearest bot, which reacts, then flies off after
the others; poked, the whole flock bolts up and away. Any time of year, with music playing, a bot may walk in wearing HEADPHONES (1 in 10) or stop and
put a pair on (15% of its stops): then it vibes, eyes closed (♪). Standing, it moves to the drums: a nodder (6 in 10) nods
on the kicks, at most every half beat, and a tapper taps its foot on the hi-hats, at most every
eighth (the music engine logs each drum hit as it schedules it, kicks, hats and snares, and the
bots move as each is heard); with nothing to follow (a breakdown) they keep time anyway, a nod each
bar, a tap each beat. Walking, its steps fall two to a beat (kept in sync as the tempo moves). CORE DUMP (track 09) tells its feel, and to it the headphone bots go metal, in poses drawn
as pixel sprites: they grow long hair, and in the gallop they HEADBANG, four frames a beat (up,
tilting forward with the hair falling over the brow, bent face-down on the beat with the top of the
head to you, the headphones' band across it, the eyes and mouth just peeking at its lower edge and a
few strands hanging off the face, tilting back), a fist raised beside the head with the metal
horns up; the
half-time breakdown's bang holds face-down longer, on 1 and 3. In the blast beats they WINDMILL (drawn in the
dev page's FRAME EDITOR, `js/data/bot-anims.js`): eight frames over two beats, starting on the even
beats, the hair flung straight up, swept over to the right as the head pitches down, covering it at
the bottom of the swing, round the left and flung up again as the head comes back up; in each bot's
own colors, mirrored when it faces left. The hair is near-black with a cool sheen. The hair goes when the track does. It keeps them on until it leaves; if the music's switched off, it
goes -_- and puts them away. Besides the scary tree, a bot may push in a JACK O' LANTERN: a carved grin lit from inside, its
candle flickering; poked, it flares up and cackles (HAHAHA!), the bots near it jumping. HALLOWEEN also sends the GREMLIN: a little green creature with big
ears, red eyes and a toothy grin that scurries up to one bot after another to prank it (hehehe; the
bot jumps), then runs off; poked, it screeches (SKREE!) and bolts. Now and then (15% of NOVEMBER's visits, and HALLOWEEN's) a FOG
rolls in instead (on HALLOWEEN, scarier: it becomes the HAUNTED FOREST, below, and out of the fog comes either the
wanderer, its eyes glowing red as it moans ooOOoo, or (60%) one of the monsters, Frankenstein, the
mummy, the creature, Nosferatu or the ghost, fading in by a tree near one side, crossing, and
fading back into the mist before the other; most bots it nears bolt): a heavy bank of coarse-pixel mist drifts in from one side and fills the lane
(rising a little above it and thinning out; on the start screen only its lower part, clear of the
title; the twinkling background behind it fading to black as it thickens). The fog is fog alone;
THE WOODS are a backdrop that comes with it only late in the year (October's HAUNTED FOREST,
November, the winter): pines and bare trees fading in through it one by one as the bank reaches
each, dark against the mist, the far ones fainter. The spring and summer mornings' mists
(WEATHER) come without them. It comes to the screen saver too (its lane 90px tall for it, the mist fading out at its ends).
Once it's built, the FOG WANDERER (a pale hooded figure with glowing eyes and a trailing hem) may
come: every October fog has it (or a monster), November's half the time, the winter's now and then,
the rest of the year's never (a quiet mist that hangs heavy a while, then thins). It
fades out of the mist, drifts from spot to spot (a bot it nears jumps, or bolts) and fades back
into the mist (poked, it's gone at once). The fog then thins to a light mist (the trees, if any,
standing in it) for two minutes, and lifts. While it's heavy nothing else
comes by and the bots keep to themselves, walking slower (no meetings, snacks, hops or pushed
scenery; now and then a worried ? or ...); two that walk into each other jump apart (!?), and now
and then one bolts. The dev page's FOG: OFTEN brings it at the next visit, in any season, its light
mist lifting after 20 seconds (or ?fog=1).

**OCTOBER's scares.** On HALLOWEEN (the whole of October) the fog is the HAUNTED FOREST, and once it's
come it STAYS, on every card (the start screen, the game card, the screen saver) for the rest of the
month while the game's open (not kept once it's closed); till it's come, a visit that comes due in
October is the forest's fog 45% of the time (15% in November): pines and bare, twisted trees, bigger than November's and a shade lighter so they show
against the dark, and two big gnarled trees in front of everything at either edge, the path the
bots walk between them. The mist never lifts; it breathes, thinning and thickening a little, and
now and then swells heavy again for its wanderer (or a monster) to come out of. In the forest:
GLOWING EYES blink between the trees (yellow, red or green, a pair or three, edging after the
bots; poked, they shut); and rarely the BLOOD FOG: the mist thickens and turns from white to red as a blood moon
rises behind the trees, and the red-eyed wanderer comes out of it after a bot, which runs for it;
then the red drains away and the moon sinks. Anywhere in October: the WEREWOLF (the old movie kind, a man gone to fur: pointed ears, yellow eyes,
fangs, his work shirt and trousers, clawed hands; night falls on the
card and a pale full moon rises; he walks in, stops and howls AWOOOOOO (eyes shut, mouth wide), the bots near him bolting
and the rest jumping, then runs off; poked, a growl and off), LIGHTS OUT (the card goes dark,
flickering, nothing but the bots' eyes blinking in it; when the lights come back on one of the bots
has moved, or a monster stands among them, red eyes showing in the dark first), the HAND (the floor
rumbles under a bot and a hand comes up and grabs it; it struggles, breaks free and runs; poked, the
hand lets go) and the POSSESSED bot (red, glowing eyes and a stiff, slow walk; the others it meets
are scared of it; poked, it shakes, a little ghost shakes out of it and floats away, ooOOoo, and it
comes to, dizzy). The bot sandbox has each on a button (OCTOBER SCARES).

Any time of year, rarely (6% of the times a visit comes due, about
one every ten minutes): a VIRUS, one of three. The PHAGE, a bacteriophage taller than the bots (a
hexagonal blue head with its pink DNA coiled inside, a striped tail, and four kinked tail fibers it
walks on, stepping in turn); the BUG, a spiky little red one that scuttles fast; and the TROJAN, which walks about as one
of the bots (any of them) and scares no one, until it's poked: the disguise pixelates off, a
wooden horse on wheels with a red eye pixelates in, laughs (HEHE) and bolts, the bots near it
jumping. Each walks in from a side or pixelates in right on the card, scuttles from spot to spot
with the odd lurch and glitch (0xBAD, >:), hehe) and walks off; a bot it comes near jumps. Poked
(a TROJAN: once it's unmasked), it's DELETED: it either bursts into its own pixels, each a fragment
in its own color (as a bit bursts, finer), or deteriorates, its pixels dropping out in a random
order, in steps, as the screen does going into the screen saver. The dev page's VIRUSES: OFTEN
brings one every few seconds, the three in turn (or ?virus=1). They're pixel sprites in the bots' pixel size and sway and bob in whole
pixels, on the same floor as the bots (their feet two pixels of the grid above the lane's edge); they walk behind the bots, bats and crows over them. A monster passing a
bot may give it a fright. Poke one: the monster roars and stomps (bots near it
jump), the mummy groans and slows, the creature splashes, Nosferatu hisses and
turns into three bats, the ghost says BOO (every bot near it jumps) and fades
away, the bats scatter, the crow caws and takes off, the spider scurries back
up (bots near it jump) and the turkey gobbles and runs. MONSTER MASH (hidden):
meet all eight Halloween visitors; GOBBLE GOBBLE (hidden): meet the turkey.
WINTER: now and then (3 in 10) a bot skates in instead of walking: blades under its feet, leaning into
long pushes and glides, kicking up a trail of powdered ice that melts away over a few seconds (a
spray of it when it skids to a stop; fewer flecks on REDUCED EFFECTS). It skates around a bit and
out like any other. A PENGUIN waddles by (poked: SQUAWK and a belly slide off; BELLY SLIDE,
hidden). CHRISTMAS: a REINDEER trots past, now and then (25%) the one with the
glowing red nose (RED NOSE, hidden); poked, it snorts and prances off.
HANUKKAH: a DREIDEL spins in, wobbles to a stop and lands on a letter (NUN,
GIMEL, HEY or SHIN; GIMEL, hidden, for seeing it land on GIMEL), then spins on
its way; poked while it's down, it spins again to land on another.

**Scenery.** HALLOWEEN: now and then (15% of arrivals, one at a time) a
wanderer comes in pushing a SCARY TREE (a dead, gnarled tree with black eyes and a frown)
ahead of it, slowly and straining, sweating; it leaves it standing somewhere
along the card, says "phew" and wanders on. The tree stays for the visit, behind
every bot and visitor but in front of the start card's copyright line. Poked or
startled mid-push, the pusher lets go (the tree stays where it stopped) and
reacts as usual. Poke the tree: it creaks and a bat flies out.
UPROOTED (hidden): see a tree pushed in. The other seasons push theirs in the
same way: WINTER a SNOWMAN (poked: brrr! and a shiver; SNOW DAY, hidden) or the
CHRISTMAS TREE, CHRISTMAS that decorated EVERGREEN with warm filament bulbs (warm white, amber and red) glowing and blinking in turn, a twinkling star and
presents under it (poked: jingle!, its lights flash), HANUKKAH a MENORAH with
that night's candles lit and the shamash (the flames flicker; EIGHT NIGHTS,
hidden), KWANZAA a KINARA (three red, the black, three green) with that day's
candles lit, the black first and then from the outside in (SEVEN CANDLES,
hidden), and NEW YEAR'S EVE and NEW YEAR a SIGN with the new year on it (poked:
HAPPY NEW YEAR! and a firework). Up to two pieces stand at once, one of each,
each at a spot clear of the other (and of the path to it: nothing is pushed
through anything). Menorah, kinara and sign are never mirrored.

The same wanderers stroll along the bottom of the game card too, between the
corner buttons (walking out from behind them), with everything above: meetings,
frights, pop-ins, decrypts and pokes. On the game card their lane reaches up to the bottom edge of the grid's card, and the whole game (the HUD, the grid's card, the drop buttons, the exploit button and its side slots, the message) stays on top of it: what flies there passes behind them, and LIGHTS OUT, the night and the fog fill the lane under them. SETTINGS → WANDERING BOTS turns them off
(on by default). The engine is `js/wanderers.js`, shared by both cards. On the start card the lane is the whole card: the bots walk along its bottom, and what flies, falls or hangs uses all of it (bats anywhere up the card, the spider dropping from the top edge behind the title, crows climbing off across it, snow falling from the top, fireworks bursting high). In the game the lane is the card's full width along the bottom, with the heights as before. They
pass under the drop buttons and the message line below the grid (bats, crows
and the spider's thread included), and a poke leaves no tap box around them.

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

Its top is a game's: **←** BACK in the corner, BYTEFALL in the same place and size as everywhere else,
and // MUSIC PLAYER under it as a game's mode line; the visualizer, the controls and the tracks scroll
under that, with no scroll bar.

**GENERATED** (track 16, free all year, ahead of tracks 12-15; `js/music/music-generated.js`) writes
itself. It's seeded: the SONG OF THE DAY is the date's, a new song each day that everyone hears the
same; tapping track 16 while it plays switches to RANDOM (a new song each time it starts) and back.
SHUFFLE plays the official tracks only. The play mode RADIO (after REPEAT, SEQUENCE and SHUFFLE) is mostly new RANDOM songs, with the SONG
OF THE DAY and the unlocked tracks now and then (about 3 in 4 new songs), each played twice through;
NEXT is its next pick. The seed picks a style from the
season's: all year SYNTHWAVE, CHIPTUNE, DRUM & BASS, LO-FI, TECHNO and DREAMWAVE; Halloween HAUNTED
WALTZ (3/4), MONSTER SURF, HORROR SYNTH, GRAVEYARD MARCH and MUSIC BOX (a warped 3/4 lullaby);
November HARVEST JIG (6/8), CAMPFIRE, HOEDOWN and AUTUMN LO-FI; December SLEIGH RIDE, SNOW WALTZ
(3/4), CAROL and COZY LO-FI; FROST (Jan 7 – Feb) AURORA, ICE CAVE, SNOW DAY and FIRESIDE LO-FI;
VALENTINE'S (Feb 7 – 14) LOVE BALLAD, SLOW JAM, SWEETHEART WALTZ (3/4) and SYNTH CRUSH; SPRING
(Mar – May) MEADOW FOLK, APRIL SHOWERS, GARDEN WALTZ (3/4) and BLOOM; SUMMER (Jun – Aug) BEACH
SURF, ISLAND BREEZE, SUNSET HOUSE and ARCADE SUMMER; SEPTEMBER BACK TO SCHOOL, GOLDEN HOUR, EQUINOX
LO-FI and PORCH SWING (the all-year styles come back with the SONG CODES' D). Then everything else: the key and mode, the tempo (in the style's
range), the form (INTRO, A, B, a bridge with the beat dropped out or a breakdown, sometimes the last
part a step up), the progressions (a hand-picked stock, only true major and minor chords in the
mode; the V made major in the minor ones), the hook (a two-bar rhythm built a beat at a time,
landing on the chord's notes on the beat and moving by step between, said, answered, said again
and brought home), the bass line (root, octaves, walking, oom-pah, acid...), the arpeggio or
strumming, the groove and its fills, the instruments (organ, choir, strings, Rhodes, music box,
theremin, fiddle, flute, pulse waves, a reese bass...) and a title. The MUSIC PLAYER shows the
song's title and style; SETTINGS, under the playlist, today's. Every song has a SONG CODE (H1-0KUP3YT:
its season, H Halloween, N November, W winter, F frost, V Valentine's, S spring, U summer, A September, D the all-year styles; the generator's version;
its seed). The MUSIC PLAYER shows the playing song's (tap it: copied), SHARE copies its name, style and code
("PUMPKIN LULLABY" (MUSIC BOX) on ByteFall // song code H1-0KUP3YT), and ENTER SONG CODE plays
the song a code names on track 16 (any case, the dash optional), so a RANDOM song can be heard
again or shared. A code from a newer ByteFall says to update. When a change to the generator would
alter the songs already written, the old generator is frozen as its own file (how, at the top of
`music-generated.js`) and loaded only when one of its codes is entered, so old codes keep playing
their songs. Layered like the others, building
with the stack.

**The SEASONAL theme's audio**: picking the SEASONAL theme puts on GENERATED and the season's sound
effects (October: HAUNTED, also a SOUND EFFECTS choice of its own all year: creaks and knocks, a cold
wind, a music box, glass chimes and a church bell, in A harmonic minor; FROST: ICICLE; VALENTINE'S:
SWEETHEART; SPRING: BIRDSONG; SUMMER: ISLAND; SEPTEMBER: SCHOOLYARD), as a starting point: either
can be changed after. Picking another theme puts back the track and sounds from before (if they're
still the seasonal ones).

SETTINGS → **GAME MUSIC**: LAYERED (the default: the music builds with your stack, more layers
coming in as the danger climbs) or FULL (every layer in the whole game long, as in the music
player; STACK OVERFLOW then runs at its top speed). SETTINGS → PLAYLIST → **OPEN MUSIC PLAYER** opens the soundtrack on its own,
over the whole page (its ×, Esc or the phone's back return to SETTINGS): every track plays as its full mix (all layers in,
whatever the game was doing), with a big visualizer: tap it to cycle SPECTRUM (LED bars), WAVE, OSCILLOSCOPE (a few cycles held still on a rising zero crossing, over a graticule), RADIAL (spectrum bars around a ring that swells with the bass), PARTICLES (a liquid blob morphing with the spectrum, shedding particles as it gets louder) and VECTORSCOPE (left against right turned 45°, with a phase-correlation meter; every track is in stereo; a mono sound shows as a vertical line at +1), STEREO FIELD (the vectorscope with the side given its own scale, so the quieter stereo parts fill the width and the cloud leans to whichever side plays; the meter still reads the real stereo), LISSAJOUS (left across, right up, each at its own scale; a mono sound is a diagonal), its name shown top left. The visualizers follow the theme (its bit and accent colors; a cycling rainbow in SPECTRUM). Also: SPECTROGRAM (the spectrum as a heat-map scrolling left), LEVEL METERS (L / R LED ladders with peak holds), MATRIX RAIN (0s and 1s falling, each column a band), BIT GRID (an 8x8 board, HARD's, stacking bits per band, a full column flashing), SYNTHWAVE GRID (a sun on the horizon, and one wireframe landscape rolling toward you: flat down the middle like a road, rising at the sides into jagged spikes that travel with the grid, tallest at the lower outer edges and fading out toward the vanishing point; the music lifts them, the bass nearest the road and the treble at the edges), PLASMA (a color field warped by the bass), TUNNEL (rings rushing toward you on the beat) and ORB (a sphere of particles in the middle turning slowly clockwise on its tilted axis, each patch of it swelling out and glowing with its own part of the spectrum: the bass around its foot, the treble at its crown; in the theme's colors), OCEAN TOPO (the same traveling sea drawn as a map's contour lines over hills of its own, fixed on the sea so the rings flow by as it travels and turns, the music raising them; a ring for each height: as the sea rises its higher rings appear, as it falls they shrink away; the highest in the accent), OCEAN DEPTHS (the same traveling sea as its points alone, each with a thin line hanging straight down from it into the depths, fading to black the deeper it goes; the points on OCEAN HEX's honeycomb, which leaves the fewest open lanes between them), OCEAN GRID, OCEAN MESH and OCEAN HEX (a sea of particles out to the horizon and past every edge, each joined to its neighbors by a thin line, a square grid, a triangle mesh or, in OCEAN HEX, a honeycomb, fading with the distance; traveling over it in a slowly wandering direction, the view slowly turning about as it goes (now one way, now the other; mostly looking where it's going), and endless: its swell is one big square tile mirrored on all four sides; the music swims in it as soft round swells under the surface, each one band of the spectrum (the bass broad, the treble small), drifting and wandering about the sea, coming up ahead and fading as they pass, easing off right in front of the view), TOPOGRAPHY (contour lines over hills the music raises, one per band, drifting; the highest rings in the accent) STAR FIELD (flying through a galaxy as a galaxy map does: star systems all around in open space, near ones bigger and brighter, far ones fading into the dark, the view sailing on through them on a slowly wandering course, turning and rising and dipping, a little faster with the music; each star listens to a narrow band of its own picked at random anywhere from 20Hz to 20kHz (evenly by pitch, so lows, mids and highs alike; a sixth of an octave to most of one wide) and swells and brightens as its band rises above what it's been doing lately (its own floor and peak, so the stars move each their own way), at its own pace, some quick to flare, some slow to rise and settle, and twinkles at its own rate; in the SPECTRUM theme each is colored by its pitch; a few are of the accent's color, and the big ones glow) and PARTICLE CLOUD (a swarm loose in open, endless 3D space, the view following it as it drifts and circling it slowly like the ORB turns, the far particles fading into the dark; with no music a murmuration, a few flocks following wandering leaders, wheeling, merging and splitting; the music stirs it: the bass puffs the flocks outward (they gather back), each particle's own band kicks it about, louder is faster, the loudest glow in the accent). Under the visualizer hang two tabs: STYLES (lower left) pulls out a drawer over the controls with every style by name, in groups (CLASSIC: SPECTRUM, WAVE, OSCILLOSCOPE, SPECTROGRAM, LEVEL METERS; STEREO: the VECTORSCOPE, STEREO FIELD, LISSAJOUS; SHAPES: RADIAL, PARTICLES, ORB, PLASMA, TUNNEL; RETRO: MATRIX RAIN, BIT GRID, SYNTHWAVE GRID; OCEANS: GRID, MESH, HEX, DEPTHS, TOPO; LAND & SPACE: TOPOGRAPHY, PARTICLE CLOUD, STAR FIELD; a tap on the visualizer cycles them in this order too; a tap on a name goes straight to it; a tap elsewhere puts it away); under the styles, the style showing's own SETTINGS, saved per style, in real units where there are any: SPECTRUM bars, peak fall (heights/s), treble lift; WAVE height, line and glow (px); OSCILLOSCOPE time shown (ms), height, line; SPECTROGRAM bands and scroll (px/s); LEVEL METERS range and peak fall (dB, dB/s); RADIAL spokes, ring size, spin (RPM); PARTICLES amount, blob size, trail; the VECTORSCOPE three dots (px), zoom, trail; MATRIX RAIN character size (px), speed, trail; BIT GRID board size and drop (boards/s); SYNTHWAVE GRID speed, peak height, the sun on or off; PLASMA speed and pixel size; TUNNEL sides, speed, sway; ORB particles, spin (RPM), size; the oceans' DENSITY (how many points are in view at once, on screen out to where they fade away, the same on any screen, with the count drawn just now beside it; defaults GRID 1,250, MESH 740, HEX 520, DEPTHS 1,100, at most 3,000 for DEPTHS), speed and turning (°/s at most), DEPTHS' line depth, OCEAN TOPO's contours; TOPOGRAPHY contours and drift; PARTICLE CLOUD particles, flocks, spin; STAR FIELD stars, speed (light years/s), turning, star size (a trail is a half-life in ms: how long a mark takes to fade to half); DEFAULT puts this style's back, ALL DEFAULTS every style's, and FULL SCREEN (lower right) puts the visualizer edge to edge (the browser's full screen too, and the screen kept awake; it turns with the phone, landscape or portrait, even with the phone's rotation locked in the app): a tap on the outer quarter at either side switches styles (left the one before, right the next) and a tap anywhere between plays or pauses the music (a sign flashing in the middle), the name and the way out fade after a few seconds untouched, and the corner button, Esc or back come out. Between the tabs, SOURCE picks what the visualizer shows: BYTEFALL (its own music) or, in the Android app, OTHER APPS (whatever the phone is playing, Pandora, Spotify and all: from Android 10 on by audio playback capture, the way a screen recorder hears it, the sound itself in stereo, analyzed as the game's own music is; Android asks once for the audio permission, called record audio, then each time OTHER APPS starts it asks to start recording or casting (the whole screen), though nothing is recorded or kept; a notification shows while it listens, with STOP (the corner then says STOPPED: TAP SOURCE, and a tap listens again); it listens on with the player shut, so Android needn't ask again, until another source or the app closes; apps can refuse to be heard, and a few do; before Android 10, through Android's Visualizer on the output mix; `js/extsource.js`, `tools/android/CaptureService.java`, `tools/android/MainActivity.java`), and MICROPHONE (whatever plays out loud), or on the web MICROPHONE only (a page can't hear other apps); a tap moves on to the next, and while one listens the corner shows what's coming in (IN: LEVEL n, or by capture its loudest in DB (0 the loudest a sound can be, -20 loud, -60 faint), SILENT (nothing but silence coming over: the app playing won't be heard) or NO DATA). Switching to it pauses ByteFall's music; in FULL SCREEN the middle tap does nothing then (the other app plays and pauses its own music). The SCREEN SAVER never comes on over the MUSIC PLAYER. With nothing playing, every style keeps moving gently: the ones that would sit empty (SPECTRUM, OSCILLOSCOPE, SPECTROGRAM, LEVEL METERS, RADIAL, the VECTORSCOPE three, BIT GRID, TOPOGRAPHY) show a calm made-up signal, as WAVE always has. The small one in SETTINGS has the ones that read at its height: SPECTRUM, WAVE, OSCILLOSCOPE, SPECTROGRAM, LEVEL METERS and PLASMA;
PREVIOUS / PLAY-PAUSE / NEXT, REPEAT / SEQUENCE / SHUFFLE, the 16-slot track
list (locked tracks show the level they open at; tapping the track playing switches STACK OVERFLOW
to STACK OVERFLOW - FULL SPEED, held at its top tempo, and GENERATED to RANDOM, and back) and BACKGROUND PLAY, so it can
run on a phone with the screen off. Keys: Space plays / pauses, ← / → skip,
Esc closes. Where the browser offers them, the lock screen's media controls
work too. The game waits underneath (a VS match pauses). Code: `js/player.js`.

## Sound effects themes

SETTINGS → **SOUND EFFECTS** picks the game's whole set of sound effects, each in the style of one of
the tracks (js/sfx.js). **TERMINAL**, the first and free: the keyboard's clicks and keys, line static
and an 8-bit crunch. **HANDSHAKE**, opening with the HANDSHAKE track (TRACK 10, Lv 40): a handheld
console's, as in that Game Boy battle theme, tuned to its C minor: pulse-wave blips for the cursor and
buttons, a wave-channel thud as a bit lands, the noise channel's metallic crunch as one decrypts (with
a note of the scale each time, so a chain plays a little tune), an item-get arpeggio for a chain or a
reward, the battle's low-HP alarm for a warning and a low buzz for no. The dial-up and the narrator's
voice are the same in every theme. The seasons' (the SEASONAL theme puts each on in its time, and
each is a choice of its own all year): **HAUNTED** (October), **ICICLE** (January and February: glass
pings, ice cracking, a cold wind and bells, in D lydian), **SWEETHEART** (Valentine's: a harp, a
heartbeat and a kiss, in F major), **BIRDSONG** (spring: birds, raindrops, a woodblock and a marimba,
in G major), **ISLAND** (summer: a steel pan, a shaker, bongos and the waves, in C major) and
**SCHOOLYARD** (September: pencil taps, a xylophone, chalk, lockers and the school bell, in A major).
The dev page's ONE-SHOT EFFECTS plays every theme's take. In every theme, a bit falling through the
grid (or settling after a clear) ticks a row at a time, each tick a little higher or lower than the last,
wandering as the tutorial BOT's voice does.

## Effects

SETTINGS → **EFFECTS: FULL / REDUCED**, for slower phones: REDUCED holds the twinkling grid
backgrounds still (the board's, the HUD boxes', the start card's), drops the glows (text and
box shadows, repainted with every change) and bursts bits into fewer, bigger pieces.

## Sound output and instrument channels

SETTINGS → **SOUND OUTPUT** (`js/music/output.js`) picks what the music and sound effects
pass through last: **HEADPHONES** (the mix as written: headphones, earbuds and good
speakers), **SPEAKERS** (laptop and tablet speakers: the deep bass played as harmonics, the
level evened out, about 3 dB louder above 250Hz) or **PHONE** (a phone's own speaker: the
lows it can't play cut and put back as harmonics it can, folded to mono, 1–4kHz lifted, the
hiss softened, about 7 dB louder above 250Hz). A page can't tell whether earbuds are in, so
phones start on PHONE and everything else on HEADPHONES; the note under the button says to
pick HEADPHONES with earbuds.

Every track routes each instrument through its own channel (kick, snare, hats, bass, lead,
pads, echo returns...; echo and reverb sends follow their instrument), which change nothing
at their default level: the split was checked by rendering each track's whole loop before
and after with the same random seed and comparing sample by sample (NIGHT DRIVE with its
ping-pong feedback off: with it on, even the original renders a little differently from run
to run). The originals are kept in `js/music/archive/`. **Mix tables** in `js/music/mixes.js`
(from the dev mixer's EXPORT) set each channel's level per track and output, at the four
stack heights the game settles on, eased between as the intensity moves.

## To-do

- **CORE DUMP (track 09)**: its trial layers still wait for picks.
- **Sound effect themes**: more in the style of the tracks (TERMINAL and HANDSHAKE so far: SETTINGS → SOUND EFFECTS).
- **Future games** (separate from ByteFall): BYTERRIUM, a Tamagotchi-style spin-off for the CPU
  bots (its first piece is live: [Byterrium](#byterrium)), a Jumanji / Zathura-style board game of events the players survive together, and three Halo
  game types to rebuild in Halo Infinite (AVALANCHE, WARTHOG ARENA, PAC-MAN ARENA FIESTA). See
  [TODO.md](TODO.md#future-games-separate-from-bytefall).

### Seasonal stuff (ideas, by the player's own date)

Done: **HALLOWEEN** (costumes, candy snacks, nine visitors with the gremlin, the scary tree and the jack o' lantern, the HAUNTED FOREST and October's scares),
**NOVEMBER** (the turkey, the crows, migrating birds), and the stacked December and new year
seasons: **WINTER**, **HANUKKAH**, **CHRISTMAS**, **KWANZAA**, **NEW YEAR'S
EVE** and **NEW YEAR**. Each new season plugs into the same
pieces: a date window in `js/seasons.js`, costumes (`wanderers.js`), visitors
and scenery (`visitors.js`), a snack, a step on the dev page's SEASON switch,
and a hidden achievement or two.

- **NEW YEAR, more**: noisemakers ("toot!") and confetti.
- **KWANZAA, more**: a visitor or a harvest snack (fruit), if wanted.
- **LUNAR NEW YEAR** (a week from its date, which moves each year: a small table
  of dates): a dragon dance crossing the card (a long, segmented dragon), red
  lanterns pushed in as scenery, strings of firecrackers popping, red envelopes
  as the snack, and the year's zodiac animal as a visitor.
- **WINTER, more**: hot cocoa as a snack (a mug, steam), a snowball tossed
  between two bots, a sleigh crossing the start card's sky.
- **SPRING** (Mar 20 to Apr 30): a RABBIT hopping through, butterflies
  fluttering across (like the bats), flower pots pushed in, spring showers (a
  rain shower and a bot with an umbrella), chicks peeping after a hen.
- **SUMMER** (Jun 21 to Aug 31): sunglasses and sun hats, ice cream as the snack
  (it drips), a beach ball bouncing across, a crab scuttling sideways,
  fireflies in the evening (the player's local time).
- **AUTUMN / HARVEST** (Sep 22 to Oct 14): a SCARECROW as scenery (it stands on
  its post, so pushed in like the tree; the crows land on it and fly off when a
  bot comes by), falling leaves drifting down, pumpkins and hay bales.
- **Small days** (the game already has achievements for some): FRIDAY THE 13TH
  (a black cat crossing the card), PI DAY (the bots share a pie), the game's
  birthday (party hats), leap day.
- **HALLOWEEN, more**: a second costume per bot (skeleton, vampire cape, mummy
  wraps, a black cat), more candy kinds (lollipops, wrapped candies).
