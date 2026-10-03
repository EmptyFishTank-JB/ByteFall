# Wanderers by season

What the wandering bots (`js/wanderers.js`) and their visitors (`js/visitors.js`) do through the
year: what's **in the game** now, what's **planned** (see [TODO.md](TODO.md)), and the **ideas** list to
pick from as we go. Seasons are set in `js/seasons.js` by the player's own date and can stack (WINTER
sits under the December holidays).

Legend: ✅ in the game · 🛠️ planned (TODO.md) · 💡 idea. Everything as one list: [docs/wanderers-everything.csv](docs/wanderers-everything.csv).

## Seasons in the game

| Season | Dates | Costumes | Snacks | Visitors | Scenery (pushed in) | Weather / other |
|---|---|---|---|---|---|---|
| **All year** | ✅ HEADPHONES (with music playing: worn in, or put on; eyes closed, nodding and stepping on the beat; -_- and put away if the music stops) | — | — | ✅ VIRUSES (rare; walk or pixelate in, scuttle about, bots near them jump; poked, DELETED: they burst into their pixels or deteriorate): PHAGE (a bacteriophage, taller than the bots), BUG (spiky, fast), TROJAN (disguised as a bot; poked, the disguise peels off pixel by pixel: a wooden horse that bolts) · 🛠️ WORM, RANSOMWARE, SPYWARE, ADWARE, LOGIC BOMB | 🛠️ numbered BITs 1–8 (8 only from HARD / INSANE; EASY / NORMAL fear it) | — |
| **HALLOWEEN** | Oct 15 – 31 | ✅ pumpkin, ghost sheet, witch hat, devil horns & tail | ✅ gummy drops | ✅ Frankenstein, mummy, creature from the black lagoon, Nosferatu, ghost, bats, crows, spider, GREMLIN (pranks the bots one after another) · 🛠️ big SPIDER (walks and jumps about) | ✅ scary tree (a bat flies out when poked) · ✅ jack o' lantern (glows, its candle flickering; poked, it flares and cackles, the bots near it jump) | ✅ the FOG, scarier: bare trees only; out of it comes the red-eyed wanderer or one of the monsters (Frankenstein, the mummy, the creature, Nosferatu, the ghost), fading back into the mist; most bots bolt |
| **NOVEMBER** | all month | — | — | ✅ turkey, crows · ✅ migrating birds (geese in a V, ducks in a line, songbirds — robins, bluebirds, goldfinches, cardinals — and swallows; now and then one lands, pecks and calls to a bot; poked, the flock bolts) · ✅ FOG WANDERER (a pale hooded figure out of the fog; scares bots it nears) | ✅ foggy trees (fade in with the fog, stay in the light mist after) | ✅ heavy fog rolls in (pauses other events; bots bump and startle), then a light mist stays a couple of minutes and lifts |
| **WINTER** | Dec 1 – Jan 6 | ✅ beanie, earmuffs, scarves | ✅ cookie bites | ✅ penguin (belly slide) · ✅ bots skating in with a powder trail, a blade under each foot | ✅ snowman · ✅ snowman sneaks off hopping (1 in 10 trips or loses its head and slumps into a pile of snow) | ✅ falling snow |
| **HANUKKAH** | its 8 nights | ✅ blue beanie, scarf | ✅ gelt | ✅ dreidel (lands on a letter) | ✅ menorah (that night's candles) | — |
| **CHRISTMAS** | Dec 18 – 26 | ✅ santa hat, elf hat, antlers | ✅ candy cane bits | ✅ reindeer (sometimes the red-nosed one) | ✅ evergreen with blinking lights | — |
| **KWANZAA** | Dec 26 – Jan 1 | ✅ red / green scarves | — | — | ✅ kinara (that day's candles) | — |
| **NEW YEAR'S EVE** | Dec 31 | ✅ party hats | — | — | ✅ sign with the year | ✅ fireworks · countdown from 10 at midnight |
| **NEW YEAR** | Jan 1 – 2 | ✅ party hats | — | — | ✅ sign with the year | ✅ fireworks |

## The whole year: ideas by month

Built seasons are listed with each month for reference; every 💡 is from the idea list, not built.

| Month | In the game | Ideas |
|---|---|---|
| **January** | WINTER (to Jan 6), NEW YEAR (Jan 1 – 2), KWANZAA (to Jan 1) | 💡 resolution runner · 💡 soup cart vendor · 💡 firewood gatherer |
| **February** | — | 💡 warm letter carrier · 💡 snow sculptor · 💡 cozy librarian |
| **March** | — | 💡 raincoat wanderer · 💡 puddle jumper · 💡 kite flyer |
| **April** | — | 💡 flower planter · 💡 bee caretaker · 💡 umbrella dancer |
| **May** | — | 💡 picnic wanderer · 💡 garden gnome inspector · 💡 wind chime tuner |
| **June** | — | 💡 firefly chaser · 💡 lemonade vendor · 💡 sunhat traveler |
| **July** | — | 💡 sprinkler runner · 💡 ice cream wanderer · 💡 beachcomber |
| **August** | — | 💡 back-to-school shopper · 💡 heatwave napper · 💡 cicada listener |
| **September** | — | 💡 apple picker · 💡 backpack hiker · 💡 lantern carrier |
| **October** | HALLOWEEN (Oct 15 – 31) | 💡 pumpkin carver · 💡 mischief sprite · 💡 foggy morning jogger |
| **November** | NOVEMBER | ✅ migrating birds (one may land and interact) · 💡 windblown leaf collector (net or basket) · 💡 sweater weather (scarves, warm drinks) · 💡 candle maker · ✅ fog wanderer (appears / disappears in mist) · 💡 leaf raker · 💡 chilly breeze wanderer · 💡 early winter prepper |
| **December** | WINTER, HANUKKAH, CHRISTMAS, KWANZAA, NEW YEAR'S EVE | 💡 gift courier · 💡 snow globe collector · 💡 icicle engineer |
| **Winter (any of Dec – Feb)** | WINTER | 💡 frost spirits (shimmering, slow, icy footprints) · 💡 snow shoveler (tidies paths) · 💡 hot cocoa vendor (steam puffs from the mug) · 💡 aurora watcher (looks up, reacts to sky colors) · 💡 hibernating critter (yawns, waddles slowly) |

## A game of its own (someday)

The wanderers could get their own game, sharing their assets with BYTEFALL through a small shared
library (the bots, their moods and animations, seasons, costumes, visitors, viruses and effects:
`wanderers.js`, `visitors.js`, `seasons.js`, `minibot.js` and their styles), so whatever's drawn for
one shows up in both. Two directions, maybe both eventually:

- **A side-scroller starring one bot** (the favorite): pick BOT, GRIFTER, BUNKER or GLITCH, each with
  its own ability (GLITCH teleport-lurches, BUNKER tanks hits, GRIFTER grabs bonuses), through
  seasonal levels (a Halloween forest in the fog, a snowy skating rink, migrating flocks overhead),
  the viruses and monsters as the enemies.
- **A virtual pet / terrarium**: look after a little colony of bots; they wander, meet, make
  friends and rivals, the seasons and visitors come by, and viruses turn up to be poked away
  before they infect anyone (a defend-the-lane mode inside it).
