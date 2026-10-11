# TODO

Ideas queued for later (not built yet).

- **New tracks**, in the spirit of (not copies of): Cutting Crew's *(I Just) Died in Your Arms*,
  a-ha's *Take On Me*, Starship's *We Built This City*, Duran Duran's *Hungry Like the Wolf*, Paula
  Abdul's *Straight Up* (its funky bass line, not the tapping intro), Sonic Spinball's *Toxic Caves*
  (that super funky bass line too), and an upbeat synthwave track.
- **Sound themes**: more unlockable sets of game sound effects (like the color themes and fonts), each
  in the style of one of the tracks. Done: TERMINAL (the first, free) and HANDSHAKE (with TRACK 10).
- **CPU customization**: simple things for the bots to wear, e.g. retro-futuristic glasses.
- **The walking tree** (October's haunted forest, and the pushed scary tree): to come back once its
  walking frames are drawn (the frame editor's TREE-, BARETREE- and PINE-WALKING are a start).

See [WANDERERS.md](WANDERERS.md) for the season-by-season chart and the full ideas list.

## The ARCADE (after the Android launch)

Two more puzzle games in ByteFall's world, as updates after launch: an **ARCADE** section on the
main menu holding ByteFall's own game (DECRYPT), DEFRAG and PURGE, sharing KEYS, the bots, the
themes, the sounds, achievements and RECORDS. Either could become an app of its own later if it
takes off. DEFRAG first (the smaller job: the board and its bits as they are), then PURGE (new
controls). Their own names and art throughout: the rules are fair to rebuild, the originals' names
and characters aren't.

### DEFRAG (a swap-and-match game)

- The 7x7 board **full of bits**, dealt so nothing matches yet and at least one swap works.
- **Swipe a bit into a neighbor** (or tap one, then the neighbor: mouse and controller) to swap
  them; a swap that makes no match snaps back.
- **4 or more of the same number touching** (up, down, left, right, any shape: a line, an L, a T, a
  square) decrypt. ByteFall's own rule (a bit's number = its row's or column's length) can't work
  on a full board, so here the numbers are colors.
- The bits above fall and **new ones drop in from the top**; a match made by the fall is a chain
  link (the CHAIN METER and chain scoring as they are).
- **How many numbers**: about 4 on EASY, 5 on NORMAL, 6 on HARD (all 7 would rarely make groups of
  4); to be tuned.
- **ByteFall's twists**: encrypted bits that can't be swapped and crack when a match decrypts beside
  them; infected bits that spread every few swaps till a match next to them clears them.
- **A game**: 30 swaps for the best score (RECORDS keeps it); no swap left, the board reshuffles
  free; idle a few seconds, a hint pulses.
- **Later**: DEFRAG puzzles (clear every encrypted bit in N swaps), a daily DEFRAG.

### PURGE (a falling-pieces game after Pac-Attack)

- **The well**: about 7 wide and 11 tall (squares a little smaller than ByteFall's).
- **Pieces of three squares** (straight or bent) fall: **encryption layers** [=] and **viruses**
  (the infected bit's little virus). Move, rotate and drop them: drag to move, tap to rotate, swipe
  down to drop on touch; keys and a controller on PC.
- **A full row of layers clears**; viruses don't clear with rows.
- **A CPU bot** comes now and then (BOT, GRIFTER, BUNKER or GLITCH, picked before the game, each with
  a quirk: GLITCH skips a square now and then). Landed, it walks the way it faces (rotating the
  piece flips it), **eating every virus in its path**, dropping into gaps and turning at walls and
  layers; boxed in with nothing to eat, it's gone. Its faces react as it goes.
- **The meter** (the CHAIN METER's look) fills with viruses eaten; full, an **ANTIVIRUS** piece
  drops and wipes the viruses in the rows under where it lands (what's above falls).
- **Game over** when the stack reaches the top.
- **VS**: viruses you eat go to the CPU opponent's well (ByteFall's VS as it is). **PUZZLE**: set
  wells to clear of viruses with N bots (ByteFall's puzzle setup).

## Future games (separate from ByteFall)

Ideas for games of their own, written down so they're not lost; nothing here is for ByteFall.

### BYTERRIUM (working title; the ByteFall spin-off)

**Live** (`byterrium.html`, sideways): the bots in a place you pick from TRAVEL that stays, on
ByteFall's own files. The rest below is still to come.

A Tamagotchi-style pet game with a Terraria look, in a closed little world (a terrarium) where you
raise the CPU bots, your "cache critters". ByteFall stays a puzzle game; the deeper wanderer ideas
below are kept for this one (any could still come back to ByteFall as an update). Check the name on
the Play Store, Steam and a trademark search before settling on it.

- **The frame**: the CPUs' world is the game, and ByteFall is the arcade cabinet in their room:
  playing it earns the KEYS that build and decorate everything. The bits you decrypt power their
  world (they cheer after a good run); never a chore, nothing lost for skipping a day.
- **The world as a strip of places, the lane a camera following the bots**: HOME (your room,
  decorated with keys), THE STORE (the bots browse the shelves, try on what you're looking at, queue
  at the till when the store page is open), THE ARCADE, and seasonal places (THE WOODS: the haunted
  forest in October; a frozen pond in winter). Bots walk out of frame to other places and come back
  carrying things (a snack, a pumpkin).
- **Decorating**: placeables the bots use: a bench (two sit and pull faces at each other), a vending
  machine (snacks), an arcade cabinet (a bot plays, rage-quits now and then), a jukebox (bots near it
  put on headphones), a lamp post (glows at night and in the fog); lures that bring visitors (a bird
  feeder, a pumpkin patch, a fog machine). Spots along the room, more of them as an upgrade.
- **The crew**: outfits bought with keys (retro-futuristic glasses, hats); choose who visits most;
  each bot's own stats.
- **The BIT GARDEN**: plant bits, they grow and pay out keys or snacks.
- **The full animation depth** left out of ByteFall on purpose: every reaction, costume and effect as
  drawn, editable frames (costumes, skating, poke reactions, snacks, sweat, pixelating in and out,
  hair, and the visitors' floats, flights and effects).
- **Day and night by the player's clock**: stars at night, the bots yawning and slower late, a
  sunrise glow; **real moon phases** (a full moon on the real nights, the werewolf likeliest then in
  October); **weather mixed by season** (rain now and then in summer, a late snow in spring).
- **Seasons filling the year** (ByteFall's lane is empty from Jan 7 to Sep 30, viruses aside):

  | Season | Dates | Costume | Snack | Visitors | Scenery / weather |
  |---|---|---|---|---|---|
  | DEEP WINTER | Jan 7 – Feb | winter's | hot cocoa | cocoa vendor, frost spirit (icy footprints) | light snow, a frozen pond they slide on, an aurora some nights |
  | SPRING | Mar 20 – May | raincoats, umbrellas | jelly beans | ducklings in a line, frogs, bees, a kite flyer | showers and puddles they splash in, flowers sprouting after rain |
  | SUMMER | Jun 21 – Aug | sunglasses, sun hats | popsicles | an ice-cream truck (they queue), fireflies at dusk | heat shimmer, a beach ball kicked around, a sandcastle |
  | AUTUMN | Sep 22 – 30 | scarves | apple slices | an apple picker, squirrels | falling leaves, leaf piles they jump into |

- **Bots that seem to think** (not AI: the way life sims do it). Today a bot's choices are dice
  rolls (at a stop: 35% a hop, 30% a snack...). Instead, in steps:
  1. **Needs**: each bot carries a few meters that drift (energy, hunger, social, fun, curiosity,
     comfort), and picks what to do by scoring the options against them (hungry: a snack; lonely: a
     friend; bored: fishing, or poking at a BIT; tired: a sit-down). The biggest single step.
  2. **Personalities**: fixed traits that weigh those scores (GLITCH impulsive and mischievous,
     BUNKER cautious and lazy, GRIFTER social and greedy, BOT curious and cheery), so the same
     moment plays out differently for each.
  3. **Noticing**: they react to what's around them (a visitor passing, rain starting, a bobber
     dipping, a sad bot nearby): look, react, or go see. The events already exist; they'd listen.
  4. **Memory and relationships**: who scared it, who it's met, who it loves, kept per bot between
     visits; friends drift together, a bot keeps clear of one that startled it, a bot poked too
     much grows wary of the player's taps.
  5. **Moods with causes**: moods that come from what happened and fade slowly (a fish caught keeps
     it happy a while; the rain makes it a little glum).
  6. **Little plans**: a few steps strung together ("hungry: go to the vending machine, eat, sit on
     the bench") that read as intent; ByteFall's fishing trip already works this way.
  Steps 1-3 are a few focused sessions in the bots' code and give most of the feel; 4-6 are the
  bigger job, growing with the places and things to do. Tuning (lively, not chaotic) is the real
  work: the BOT SANDBOX is where to do it. A little of 1-3 could come to ByteFall with its bot
  customization, as the testbed for this.
- **Bits of life** (the cozy fishing-game feel, after Cast n Chill): a fish jumping and its rings,
  a dragonfly over the reeds, birds crossing, ripples where the bobber lands, steam off the water
  on cold mornings, mist on the lake at dawn; and the look: skies graded by the time of day, the
  far layers paler and bluer with distance, the water reflecting the sky, the trees, the pier and
  the bot (broken by ripples), softer warmer palettes, lit lamps and windows at night.
- **Backdrops with the weather** (ByteFall has the first: THE WOODS, trees that come with the fog
  from October to the winter; the fog itself is weather on its own): a backdrop for each part of the
  year, brought in by the weather that suits it, standing for the spell and fading with it.
  WINTER: a frozen pond and bare birches (with SNOW; the bots slide on the ice), snow-capped pines
  (BLIZZARD), a log cabin with a lit window (clear nights, the AURORA over it). SPRING: a meadow
  with flowers that open after RAIN, cherry trees shedding their petals (WIND), a pond with lily
  pads the rain rings and frogs (DRIZZLE). SUMMER: a beach with a parasol and the sea (SUNNY, a heat
  haze over the sand), a cornfield at dusk (FIREFLIES), a hill with a telescope (METEORS), a desert
  with a cactus (dry WIND and the tumbleweed). AUTUMN: an orchard and leaf piles (WIND, falling
  leaves), a pumpkin patch and scarecrow (DRIZZLE), THE WOODS (FOG). Any time: a city skyline under
  a THUNDERSTORM, its windows going dark when lightning hits. The FOG WANDERER only in the fog and not
  every fog (ByteFall: every October fog, half of November's, a few in winter, none the rest of the
  year); each backdrop could have its own such visitor (a snow spirit in the blizzard, a scarecrow
  that turns its head in the drizzle).
- **Holidays and days**: LUNAR NEW YEAR (red lanterns, firecrackers, a dragon dance the bots join, red
  envelopes); VALENTINE'S (Feb 7 – 14: a cupid whose arrows make two bots fall for each other, heart
  balloons, chocolate); PI DAY (Mar 14: pie, the bots lining up as 3.14); ST PATRICK'S (Mar 14 – 17:
  green hats, a leprechaun's pot of gold, a few keys when poked); APRIL FOOLS (Apr 1: costumes and
  faces swapped, one walking upside down, a fake virus that's a bot in a mask, a whoopee cushion on
  the bench); EASTER (eggs hidden along the lane for the bots to hunt, a bunny); PROGRAMMERS' DAY
  (the 256th day, Sep 13: glasses, a 0x100 sign, binary confetti); FRIDAY THE 13TH (a black cat
  whose path they won't cross, a ladder they won't walk under).
- **From the monthly ideas list** (WANDERERS.md): resolution runner, snow sculptor, puddle jumper,
  flower planter, picnic wanderer, lemonade vendor, beachcomber, back-to-school shopper, backpack
  hiker, pumpkin carver, leaf raker, gift courier and the rest.
- **Carries over from ByteFall**: the bots' pixel art (js/bot-svg.js), the visitor sprites
  (js/visitors.js), seasons (js/seasons.js), the motion code, and the frame editor
  (dev-tools/frames.html) with any exported animations.

### Other games

- **The board game** (title open: ideas DON'T ROLL, BOARDBOUND, HOUSE RULES, THE LAST TURN, FATE
  BOARD; in the spirit of Jumanji and Zathura, but its own): a board game where each player's
  roll sets off an event the whole table has to survive to keep going. Top-down (the board in
  the middle of a room, the house turned arena; a side-scroller for a few special events).
  Competitive on the board, cooperative in the events (30-90 seconds of real-time play each):
  creatures (monkeys in the kitchen, a stampede, a lion), nature (grabbing vines, quicksand, a
  flood), sci-fi (a haywire robot, zero gravity, meteors, raiders), curses (shrunk, gravity
  flipped, bodies swapped); the house escalating as the game goes (vines stay, the water rises).
  A downed player can be rescued at a cost; cheating (moving your piece by hand, quitting
  mid-event) brings a penalty event; fate cards aim the next event at the leader; solo with an
  AI companion. First prototype: one room, a 20-square board, 6-8 events, 2 players.

### Halo game types (to rebuild in Halo Infinite's Forge; any could become a game of its own)

- **AVALANCHE**: 2-8 teams, up to 16 players, lined up on a platform at the top of a hill like the
  start of a race. Everyone races down to the ball on the bottom platform and carries it back up to
  a circular goal in the middle of the top platform (just behind one of the launchers, so players
  sometimes launch themselves back down). The hill: three big staircases wide, a 3x4 grid of them
  seen from above. Anyone who dies respawns at the top; a dropped ball rolls back down; a pass can
  go off the side. At the top: Warthogs and Mongooses, and three launchers that throw players about
  a third of the way down (jumping keeps the momentum, bouncing on down) and send a dropped ball
  flying back down. Random weapons on spawn. Ideas: shuffled hill layouts, ice and boost pads, a
  "hot potato" ball. Prototype as a game: one hill, 2 teams of 2-3, launchers, ball and respawns.
- **WARTHOG ARENA**: 15 Warthogs with things welded on, Robot Wars style, and TIMMY (maybe): a
  Mongoose with the little whale welded on as its body, a whale on wheels. A floating arena of roads
  and moving parts, all of it usable to push others off. Leaving the Warthog kills you; you can only
  swap to the passenger seat to use your random spawn weapon, with no one driving. In Infinite:
  scripting kills on exit and hands out random weapons; moving parts on timers; a kill zone under
  the arena (check whether objects can be welded to vehicles). As a game: a build screen of rams,
  wedges and spinners, Timmy as a secret vehicle, the arena falling away as the match goes on.
  **A first look is live: `arena/` (ARENA TEST)**: a floating arena in three.js with cannon-es
  physics, a low-poly buggy to drive (keys, touch stick, a controller), four CPU drivers with their
  own front ends (a ram, a spinner, a wedge, spikes) and TIMMY, the sweeper turning in the middle,
  ramps, a road out to a far pad with a boost strip, knockouts and falls counted.
- **WHALE HUNTING** (started late in Halo 5, never finished): an Infection variant. The hunters are
  the infected, two to start (a driver and a gunner) in a Warthog with pieces welded on, colored and
  textured as wood to make it a boat. The hunted are the uninfected, made to ride TIMMY: a whale
  fused to a Mongoose. The giant grid sits just under the water line in a map, so both drive on the
  water. As a game: a sea of low waves over a hidden floor, the hunters' boat (driver and gunner),
  a pod of TIMMYs to get away in, a whale caught joining the hunt; the ARENA TEST's TIMMY and its
  physics are a start, with water in place of the arena floor.
- **PAC-MAN ARENA FIESTA**: everyone spawns in a huge Pac-Man maze in the game's iconography, with
  random weapons; at a full lobby, super hectic. Ideas: pellets that score, power pellets for a
  short buff (overshield, speed, sword), four AI ghosts hunting everyone, teleporters as the wrap
  tunnels, a PAC-MAN JUGGERNAUT variant, a lights-out maze. (As a game for sale it would need its
  own maze theme: Pac-Man is Bandai Namco's.)

- Before the Play Store build: take out the app's UNLOCK EVERYTHING padlock (SETTINGS footer; `js/script.js`, `index.html` `#dev-unlock-btn`, `tools/build-app.js` keeps its flag).
