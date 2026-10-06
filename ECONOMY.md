# ByteFall economy

What the player earns, where and how, what it buys, and the BLACK BOX odds. The numbers live in
`js/progress.js` (`RES_PER`, `resRate`, `PRICES`, `BOX_ODDS`, `KEY_PAY`, `KEY_BITS`) and
`js/script.js` (`MARKET_EVERY`, `MARKET_BOX_ODDS`, `ANTI`, `ANTI_DROPS`). Change them there and here
together.

## Resources

| Resource | Icon | Rarity | Earned by | Rate |
|---|---|---|---|---|
| **KEYS** | key, the theme's accent | money | bits decrypted (any way), chains of 5 and 7, levels, achievements, first puzzle solves, the day's first daily game, the DAILY DROP | 1 per 10 bits; +2 at a 5-link chain, +5 at 7; 10 a level; 10 an achievement; 5 the first daily game; 5 the DAILY DROP; first puzzle solves 2 / 4 / 6 (EASY / NORMAL / HARD) |
| **BUGS** | bug, roach brown `#b5824a` | common | bits decrypted **down a column** | 1 per 5 |
| **CACHE** | stacked disks, light grey `#c8ccd0` | common | bits decrypted **across a row** | 1 per 5 |
| **CRYPTO** | the game's coin: a hexagon with a C struck through twice, Bitcoin orange `#f7931a` | common | **chain links** from the 3rd on | 1 per link |
| **ROOTKITS** | `#`, red `#ff3b4e` | uncommon | a bit decrypted **across and down at once**; **layers broken** down to their bit; **BYTES** (HARD) | 1 per 2 cross decrypts; 1 per 20 layers broken; 1 per BYTE |
| **MASTER KEYS** | a heavier key whose head is the currency sign, deep gold `#e8b10e` with a glow | rare | **every 5th level**; the **day's first daily game**; the **day's first VS win** | 1 each |

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
never an anti-exploit.

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
rolled. An exploit then waits in the slot to be armed when you like; an anti-exploit goes off at
once. A box can land on any exploit of its tier, **unlocked or not** (not BLACK BOX itself).

| Box | KEYS | CRYPTO | ROOTKITS | Tier 1 | Tier 2 | Tier 3 | Anti-exploit |
|---|---|---|---|---|---|---|---|
| **BLACK BOX I** | 5 | 3 | | 65% | 20% | 3% | 12% |
| **BLACK BOX II** | 12 | 5 | 1 | 35% | 45% | 12% | 8% |
| **BLACK BOX III** | 20 | 8 | 2 | 10% | 45% | 42% | 3% |

### Odds per pull, by result

Each tier's share split evenly over its exploits (5 in tiers 1 and 2, 4 in tier 3), and the
anti-exploit share over the 3 anti-exploits.

| Result | BLACK BOX I | BLACK BOX II | BLACK BOX III |
|---|---|---|---|
| RNG, BITFLIP, BUFFER OVERFLOW, TROJAN, PIVOT (each) | 13% | 7% | 2% |
| SWAP, WORM VIRUS, KEYLOGGER, PACKET SNIFFER, BACKDOOR (each) | 4% | 9% | 9% |
| LOGIC BOMB, HONEYPOT, DICTIONARY ATTACK, RAINBOW TABLE (each) | 0.75% | 3% | 10.5% |
| ADWARE, SPYWARE, RANSOMWARE (each) | 4% | 2.67% | 1% |

### Is a box worth it?

Counting only the KEYS part of a price (tier 1 is 10, tier 2 is 20, tier 3 is 30), the average pull
is worth about 11 KEYS from BLACK BOX I (which costs 5), 16 from II (costs 12) and 23 from III (costs 20),
before the resources. A box is the cheaper bet; buying the exploit you want is the safe one.

## Anti-exploits

Mild and short. None can end a game by itself.

| Anti-exploit | What it does | For |
|---|---|---|
| **ADWARE** | a pop-up covers one drop button (`AD`); drops by touching the grid or the number keys still work | 3 drops |
| **SPYWARE** | CURRENT, the NEXT preview and the bit over the grid show `?` until each lands | the next 3 bits |
| **RANSOMWARE** | 3 random bits on the board go under a one-peel layer (one decrypt beside each frees it, the same bit) | until peeled |

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
