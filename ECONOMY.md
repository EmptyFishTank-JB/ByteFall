# ByteFall economy

What the player earns, where and how, what it buys, and the BLACK BOX odds. The numbers live in
`js/progress.js` (`RES_PER`, `resRate`, `PRICES`, `BOX_ODDS`, `KEY_PAY`, `KEY_BITS`) and
`js/script.js` (`MARKET_EVERY`, `MARKET_BOX_ODDS`, `ANTI`, `ANTI_DROPS`). Change them there and here
together.

## Resources

| Resource | Icon | Rarity | Earned by | Rate |
|---|---|---|---|---|
| **KEYS** | key, the theme's accent | money | bits decrypted (any way), chains of 5 and 7, levels, achievements, first puzzle solves, the day's first daily game, the DAILY DROP | 1 per 10 bits; +2 at a 5-link chain, +5 at 7; 10 a level; 10 an achievement; 5 the first daily game; 25 the DAILY DROP; first puzzle solves 2 / 4 / 6 (EASY / NORMAL / HARD) |
| **BUGS** | bug with two antennae, roach brown `#b5824a` | common | bits decrypted **down a column** | 1 per 5 |
| **CACHE** | stacked disks, light grey `#c8ccd0` | common | bits decrypted **across a row** | 1 per 5 |
| **CRYPTO** | the game's coin: a hexagon with a C struck through twice, Bitcoin orange `#f7931a` | common | **chain links** from the 3rd on | 1 per link |
| **ROOTKITS** | `#`, red `#ff3b4e` | uncommon | a bit decrypted **across and down at once**; **layers broken** down to their bit; **BYTES** (HARD) | 1 per 2 cross decrypts; 1 per 20 layers broken; 1 per BYTE |
| **MASTER KEYS** | the heavier key, its head carrying the currency sign's two lines, deep gold `#e8b10e` with a glow | rare | **every 5th level**; the **day's first daily game**; the **day's first VS win**; every **7th day in a row** (LOGIN STREAK, with the DAILY DROP) | 1 each; 3 for the streak |

GONE FISHING (the LAKE and BEACH scenes, `js/scenes.js`): 1 catch in 10 off the pier is a resource, kept: weighted BUGS 3, CACHE 3, CRYPTO 2.5, ROOTKITS 1.2, MASTER KEYS 0.6 (about 1 in 17 of those, so roughly 1 master key per 170 catches); 1 each.

The DAILY DROP (claimed in the STORE once a day) also gives 3 each of BUGS, CACHE and CRYPTO, with its 25 KEYS and free exploit. The **LOGIN STREAK** counts the days in a row the game is opened (by the player's own date; a day missed starts it over): every 7th day in a row, the DAILY DROP also holds **3 MASTER KEYS**.

Each resource holds at most **999** (KEYS have no cap); what's earned past that is lost. A bit decrypted both ways counts as a cross decrypt only, not also as BUGS and CACHE. Bits cleared
by exploits earn no resources. Resources come whole once enough
events add up; the part toward the next one is kept between games. The colors are the same in
every theme (`--res-*` in `css/style.css`), but PAPER uses darker ones and MONOCHROME greys.

## Where each mode earns

| Mode | KEYS | BUGS | CACHE | CRYPTO | ROOTKITS | MASTER KEYS |
|---|---|---|---|---|---|---|
| CLASSIC | yes | full | full | full | full | levels |
| DAILY (all four) | yes | full | full | full | full | levels, the day's first daily game |
| BLITZ | yes | half | half | half | half | levels |
| ZEN | yes | half | half | half | half (no layers in ZEN) | levels |
| VS | yes | no | no | full | cross decrypts and BYTES only (not layers) | levels, the day's first win |
| PUZZLE | first solves | no | no | no | no | levels |
| Tutorial | no | no | no | no | no | no |

## A typical game

From 400 simulated CLASSIC games on NORMAL (a fair player: about 78 drops, 100 bits). Real games
by newer players run shorter.

| | Per game |
|---|---|
| Bits decrypted down / across / both | 50 / 52 / 2 |
| Chain links from the 3rd on | 8.6 |
| Layers broken | 37 |
| NIBBLES | 5.6 |
| **KEYS** | about 20 (10 from bits, 10 from the level up a game brings) |
| **BUGS** | about 10 |
| **CACHE** | about 10 |
| **CRYPTO** | about 8 |
| **ROOTKITS** | about 3 |
| **MASTER KEYS** | about 1 every 5 games, plus the daily ones |

So a game pays for about two tier 1 exploits, or one tier 2, and a tier 3 takes two or three.

## What they're spent on

| Where | What | Paid with |
|---|---|---|
| STORE, BOOSTERS | HEAD START 15, FIREWALL DELAY 20, LOOKAHEAD 15, OVERTIME 20, SECOND CHANCE 40, HINT 10, UNDO 8 | KEYS only |
| STORE, STARTER EXPLOITS | an exploit to take into a game (below) | KEYS + resources, or 1 MASTER KEY |
| STORE, BLACK BOXES | a random pull to take into a game (below) | KEYS + resources (no MASTER KEYS) |
| BLACK MARKET (in a game) | an exploit or BLACK BOX, the STORE's price | the same |

Starter exploits and boxes go into the two STARTER slots on the main menu (two of one kind, or one
each of two) and are used once in a game. A slot left empty is the BLACK MARKET from the start, and
a slot whose starter is used becomes one.

## Exploit prices

Tiers follow the unlock order, five to a tier. A MASTER KEY pays the whole price of any exploit.
BLACK BOX (the exploit) isn't sold; the chain meter's BLACK BOX still opens into any exploit and
never an infection.

| Tier | Exploit | Unlocks | KEYS | BUGS | CACHE | CRYPTO | ROOTKITS |
|---|---|---|---|---|---|---|---|
| 1 | RNG | Lv 3 | 10 | 6 | 6 | | |
| 1 | BITFLIP | Lv 8 | 10 | | 8 | 4 | |
| 1 | BUFFER OVERFLOW | Lv 13 | 10 | 8 | | 4 | |
| 1 | TROJAN | Lv 18 | 10 | 7 | | 5 | |
| 1 | PIVOT | Lv 23 | 10 | 5 | 7 | | |
| 2 | SWAP | Lv 26 | 20 | | 10 | 6 | 1 |
| 2 | WORM VIRUS | Lv 29 | 20 | 12 | | 5 | 1 |
| 2 | KEYLOGGER | Lv 35 | 20 | | 9 | 8 | 1 |
| 2 | PACKET SNIFFER | Lv 41 | 20 | 8 | 8 | | 1 |
| 2 | BACKDOOR | Lv 47 | 20 | 10 | | 6 | 1 |
| 3 | LOGIC BOMB | Lv 53 | 30 | 14 | | 8 | 2 |
| 3 | HONEYPOT | Lv 59 | 30 | | 12 | 10 | 2 |
| 3 | DICTIONARY ATTACK | Lv 65 | 30 | 6 | 12 | | 3 |
| 3 | RAINBOW TABLE | Lv 70 | 30 | | 8 | 12 | 2 |
| — | BLACK BOX | Lv 76 | not sold | | | | |

Only exploits unlocked by level can be bought (in the STORE and on the BLACK MARKET).

## BLACK BOXES

Bought in the STORE (or found on the BLACK MARKET), taken into a game sealed. A tap in the game
opens it: the slot spins like a slot machine's reel for about 1.5 seconds and lands on what it
rolled. An exploit then waits in the slot to be armed when you like; an infection goes off at
once. A box can land on any exploit of its tier, **unlocked or not** (not BLACK BOX itself).

| Box | KEYS | CRYPTO | ROOTKITS | Tier 1 | Tier 2 | Tier 3 | Infection |
|---|---|---|---|---|---|---|---|
| **BLACK BOX I** | 5 | 3 | | 65% | 20% | 3% | 12% |
| **BLACK BOX II** | 12 | 5 | 1 | 35% | 45% | 12% | 8% |
| **BLACK BOX III** | 20 | 8 | 2 | 10% | 45% | 42% | 3% |

### Odds per pull, by result

Each tier's share split evenly over its exploits (5 in tiers 1 and 2, 4 in tier 3), and the
infection share over the 6 infections.

| Result | BLACK BOX I | BLACK BOX II | BLACK BOX III |
|---|---|---|---|
| RNG, BITFLIP, BUFFER OVERFLOW, TROJAN, PIVOT (each) | 13% | 7% | 2% |
| SWAP, WORM VIRUS, KEYLOGGER, PACKET SNIFFER, BACKDOOR (each) | 4% | 9% | 9% |
| LOGIC BOMB, HONEYPOT, DICTIONARY ATTACK, RAINBOW TABLE (each) | 0.75% | 3% | 10.5% |
| ADWARE, SPYWARE, RANSOMWARE, MALWARE, CRYPTOJACKER, SCAREWARE (each) | 2% | 1.33% | 0.5% |

### Is a box worth it?

Counting only the KEYS part of a price (tier 1 is 10, tier 2 is 20, tier 3 is 30), the average pull
is worth about 11 KEYS from BLACK BOX I (which costs 5), 16 from II (costs 12) and 23 from III (costs 20),
before the resources. A box is the cheaper bet; buying the exploit you want is the safe one.

## Infections

A BLACK BOX's bad luck: it comes up INFECTED. Mild and short; none can end a game by itself. They stack:
two infected boxes, two infections at once. The same one again starts its count over (ADWARE keeps its
column), a second RANSOMWARE locks 3 more bits (never ones already locked), and a second SCAREWARE stacks another
pop-up over the ones up (its 8 drops start over). Where two meet, the later one shows: MALWARE after
a RANSOMWARE lock covers that bit, a lock after MALWARE shows over it; ADWARE's frame and the
CRYPTOJACKER's sign are solid, covering whatever's under them, and the pop-ups go over everything. The STORE's BLACK BOXES section warns of all six (BUYER BEWARE). The dev page's
BLACK BOX INFECTION makes every box opened come up one (ANY or one kind), and INFECTION LOOK forces look
1 to 4 (localStorage bytefall-dev-infection / bytefall-dev-infection-look). While any's on, a little bot
at its laptop types away at a virus in CURRENT's corner (xN past one; its name(s) on hover). The
scareware alerts' ASCII art is pictures made of flickering binary (now and then hex): a skull and
crossbones, a cluster of spiky viruses, a padlock, a bug, a warning sign, an angry CPU. RANSOMWARE has a 5th look (its screens a tiny picture in
binary: a skull, a padlock, a virus or a CPU, with hex streaming) and MALWARE a 5th and 6th (one big
picture in binary across the playable rows (the overflow row just its dots), each corrupted bit showing its piece of it, the empty spots too, in the grid's own see-through green
over the background; or each bit a
tiny picture of its own). Each shows
itself in its own little LED sign or ASCII display, kept within the bits it takes up (js/infections.js), in
one of four looks picked at random each time (below, the first of each; the others: ADWARE a flashing SALE
with arrows, a slot machine, the CPU bouncing over CLICK; SPYWARE a REC light, binoculars, an eye at a
keyhole; RANSOMWARE's screens a skull and PAY UP!, a padlock and a hex dump, a laughing CPU and KEYS OR
BITS; MALWARE binary, error codes, a shade melting through; the CRYPTOJACKER a pickpocket's hand, a
mining pickaxe, a getaway rocket; SCAREWARE a crash screen, files deleting, a prize wheel).

| Infection | What it does | For | Its display |
|---|---|---|---|
| **ADWARE** | an ad in its own frame over one column, below the overflow line: nothing drops there by the button, the grid or the number keys (it gives way if every other column is full); its drop button reads `AD` | 3 drops | LED: chasing bulbs round the frame, a CPU pulling faces, its claims (FREE KEYS, DOWNLOAD RAM...) marching up the sign |
| **SPYWARE** | CURRENT, the NEXT preview and the bit over the grid are hidden until each lands | the next 3 bits | ASCII: a pair of eyes watching from CURRENT |
| **RANSOMWARE** | up to 3 bits on the board are padlocked where they are: they can't decrypt or fall (they still count in lines; bits dropped on them rest on them, gaps stay open under them), and settle once it lifts | 5 drops | LED and ASCII: each locked bit's little screen fading between a grinning CPU and typing gibberish, a padlock, its value and the drops left |
| **MALWARE** | every bit on the board shows as junk | 3 drops | ASCII: flickering characters in each bit |
| **CRYPTOJACKER** | the resources each drop earns are taken back | 5 drops | LED: a CPU stealing them, on a sign through the overflow row's own cells: a pan with its sack, a close-up of its eyes, MINING YOUR CRYPTO, and a gloat (+N MINE!) when it takes some |
| **SCAREWARE** | fake system alerts over the board, coming on their own clock (not the drops'): each time 1 (3 in 4) or a burst of 2 to 4 (1 in 4), never past 4 at once, each at its own random spot in the grid, stacked; never two close together (6 to 11 s after one appears, 3 s after one's closed; none while paused). Only each one's tiny X closes it (its big button dodges) | 8 drops (the ones up stay till closed) | ASCII: a blinking skull and a scan crawling to 100% |

## BLACK MARKET

| Rule | |
|---|---|
| Where | a side slot taken in empty (from the start), or one whose starter has been used |
| Modes | CLASSIC, BLITZ and ZEN (not DAILY, PUZZLE, VS or the tutorial) |
| What's offered | a random unlocked exploit, or (a quarter of the time) a BLACK BOX: I 60%, II 30%, III 10% |
| Turnover | a new offer every 4 drops (a price shown and not taken goes too) |
| Buying | a tap opens the BLACK MARKET's window: each part of the price as have / cost under its icon, BUY (and USE A MASTER KEY when short of an exploit's price with one) |
| Marked | the game's own currency sign (a 0 struck through twice) in the slot's corner |
| Opens | once the game's first encryption layer rises (ZEN, with no layers: after 8 drops); till then the offers can be looked at |
| Limit | none: once a buy is used, the slot sells again |
| After | a bought exploit waits in the slot to be armed; a bought box waits sealed to be opened |

## Not sold for money

Nothing in SUPPORT THE GAME gives KEYS, resources or boxes. If that ever changes, the BLACK BOXES
become paid loot boxes: their odds already show in the STORE (as Google Play requires), and some
countries, Belgium among them, ban paid loot boxes outright.
