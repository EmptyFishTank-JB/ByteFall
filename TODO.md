# TODO

Ideas queued for later (not built yet).

- **Exploit loadouts**: 3 saved loadouts, picked on the game setup (before a run). A 3rd or 4th
  loadout would be BLACK BOX only.
- **New tracks**, in the spirit of (not copies of): Cutting Crew's *(I Just) Died in Your Arms*,
  a-ha's *Take On Me*, Starship's *We Built This City*, Duran Duran's *Hungry Like the Wolf*, Paula
  Abdul's *Straight Up* (its funky bass line, not the tapping intro), Sonic Spinball's *Toxic Caves*
  (that super funky bass line too), and an upbeat synthwave track.
- **Sound themes**: more unlockable sets of game sound effects (like the color themes and fonts).
- **CPU customization**: simple things for the bots to wear, e.g. retro-futuristic glasses.
- **SOUND PROFILES section in SETTINGS**: pick a set of game sound effects; the current one is the
  first, already unlocked (more to unlock: see Sound themes).
- **PIXEL MODE, pass 2**: the visitors and viruses on the same pixel grid (their sways, glitches,
  floats and pokes in whole screen pixels); then turn PIXEL MODE on in the game.

See [WANDERERS.md](WANDERERS.md) for the season-by-season chart and the full ideas list.

## Future games (separate from ByteFall)

Ideas for games of their own, written down so they're not lost; nothing here is for ByteFall.

- **BYTERRIUM** (working title; a ByteFall spin-off): a Tamagotchi-style pet game with a
  Terraria look, in a closed little world (a terrarium) where you raise the CPU bots, your
  "cache critters". Ideas: a BIT GARDEN to plant and tend; check-ins through the day; the full
  animation depth left out of ByteFall on purpose (every reaction, costume and effect as drawn,
  editable frames: costumes, skating, poke reactions, snacks, sweat, pixelating in and out, hair,
  and the visitors' floats, flights and effects). Carries over: the bots' pixel art
  (js/bot-svg.js), the visitor sprites (js/visitors.js), the motion code and the frame editor
  (dev-tools/frames.html) with any exported animations. Check the name on the Play Store, Steam
  and a trademark search before settling on it.
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
- **PAC-MAN ARENA FIESTA**: everyone spawns in a huge Pac-Man maze in the game's iconography, with
  random weapons; at a full lobby, super hectic. Ideas: pellets that score, power pellets for a
  short buff (overshield, speed, sword), four AI ghosts hunting everyone, teleporters as the wrap
  tunnels, a PAC-MAN JUGGERNAUT variant, a lights-out maze. (As a game for sale it would need its
  own maze theme: Pac-Man is Bandai Namco's.)
