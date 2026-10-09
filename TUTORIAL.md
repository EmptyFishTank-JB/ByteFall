# ByteFall tutorial: the revised script, for review

The TUTORIAL as I propose it, card by card. Each card is marked:

- **KEPT**: as it is in the game today (v538), word for word.
- **REWORDED**: the same card with new words; *Was* shows what changed.
- **NEW**: a card the tutorial doesn't have yet; *To build* says what the game needs for it.

Nothing here is in the game yet: once you've gone over it (change anything: words, order, cards to add
or cut, in place, using each card's **Notes** line), I'll make the tutorial match. The tutorial lives in
`js/tutorial.js` (`STEPS`).

## What changed, in short

- **32 steps**, up from 26.
- **New**: THE BOTTOM ROW (PATCH SLOTS and SIDE SLOTS), THE BLACK MARKET, the STORE (three cards:
  open it, what's in it, close it) and ENCRYPTION STRENGTH.
- **Reworded**: the welcome (the count), PAUSE (top right, not top left), RECORDS (HISTORY, levels,
  RANK UP, NOTICES), EXPLOITS (the STORE aside dropped), the loadout (buying exploits to keep),
  SETTINGS (PIXEL STYLE, CRT DISPLAY) and the last card (PATCHES and STARTERS on the main menu).
- **Left to RULES on purpose** (too much for a first run): the other modes (DAILY, PUZZLE, BLITZ, VS,
  ZEN), HARD's 8x8 board and BYTES, each INFECTION, the LOGIN STREAK, RESTORE POINT's free ad and the
  STORE's price details.

## How every card works (unchanged)

- **The card**: a framed banner with `// TUTORIAL n / 32` (the welcome has no number) and **EXIT** in its
  top row, BOT's face beside the words, and its buttons under the frame.
- **The words** type out quickly with a blip of BOT's voice every other letter; a tap on the card shows
  the rest at once. The lesson never waits on the typing.
- **EXIT** (every card) leaves for the main menu. **BACK** (every card after the welcome): after a drop,
  the same card again; otherwise the card before, the board and score put back as they were.
- **NEXT / BEGIN** on cards that only explain. A tap card dims the screen but for what to tap; a drop
  card dims the other columns, and a wrong drop gets a denied sound, BOT's -_- and a nudge.
- **After a drop** the words change to what happened, then the points show under them.
- Set boards and bits, no rising layers, nothing earned. The CHAIN METER keeps its charge from card 6 to
  card 13.

Columns are numbered 1 to 7 from the left. Boards are drawn top row first; `[=]` is an ENCRYPTION LAYER,
`[-]` a cracked one.


---

## 0. Welcome (REWORDED)

- **Heading**: `// TUTORIAL`
- **Card sits**: under the board's middle; **BOT**: happy

**Says:**

> Welcome to BYTEFALL! This tutorial walks you through how the game is played, and where everything is. There are 32 steps! Don’t worry, they’re short, and despite all of the numbers, there’s no math required as long as you can count to 7! Let’s begin!

*Was:* Welcome to BYTEFALL! This tutorial will help you understand how the game is played, along with some other useful information. There are 26 steps! Don’t worry, they’re not too long, and despite all of the numbers, there’s really no math required as long as you can count to 7! Let’s begin!

*Why:* The step count (26 → 32).

- **Asks you to**: Tap BEGIN.
- **Lights up**: Nothing.
- **Notes**: 

---

## 1. The TERMINAL and encrypted bits (KEPT)

- **Heading**: `// TUTORIAL 1 / 32`
- **Card sits**: under the board's middle; **BOT**: resting

**Says:**

> This grid is called the TERMINAL. You’ll be dropping encrypted bits into the TERMINAL’s columns. Encrypted bits are the numbered blocks with brackets: [1] [2] [3] [4] [5] [6] [7]

- **Asks you to**: Tap NEXT.
- **Lights up**: Nothing.
- **Notes**: 

---

## 2. CURRENT (KEPT)

- **Heading**: `// TUTORIAL 2 / 32`
- **Card sits**: top of the board; **BOT**: resting
- **Bits**: CURRENT [3], then [2]
- **Board**:

```
 .  .  .  . [3][5] . 
```

**Says:**

> This flashing display panel in the middle, with the bright border, shows your CURRENT bit, [3], which is the one that will be dropped into a column on your next tap. Go ahead and tap the CURRENT display panel!

- **Asks you to**: Tap the CURRENT panel.
- **Lights up**: The CURRENT panel.
- **Notes**: 

---

## 3. Decrypting: a row (KEPT)

- **Heading**: `// TUTORIAL 3 / 32`
- **Card sits**: top of the board; **BOT**: resting
- **Bits**: CURRENT [3], then [2]
- **Board**:

```
 .  .  .  . [3][5] . 
```

**Says:**

> A bit clears only when its value matches the exact number of bits in the row or column that it sits in. Clearing bits is called DECRYPTING. Any bit can be dropped into any column by tapping a number button below or by tapping the column itself. Go ahead and drop the CURRENT bit, [3], into either column 4 or 7, next to the [3] and [5] bits.

- **Asks you to**: Drop the [3] into column 4 or 7.
- **Lights up**: The [3] and [5], and the buttons for columns 4 and 7.

**After the drop, says:**

> BOOM! Both [3] bits were DECRYPTED, since the row was made 3 bits long. The [5] bit remains, since it was in neither a row nor a column 5 bits long, before or after the drop.

**Points shown:**

```
[3] [3]  (13 + 13) ×1 = 26
```
- **Score after**: 26
- **Notes**: 

---

## 4. Decrypting: a column (KEPT)

- **Heading**: `// TUTORIAL 4 / 32`
- **Card sits**: top of the board; **BOT**: resting
- **Bits**: CURRENT [2]
- **Board**:

```
 .  .  .  .  . [5] . 
```

**Says:**

> Let’s try a column. Drop the CURRENT bit, [2], on top of the [5] bit in column 6.

- **Asks you to**: Drop the [2] into column 6.
- **Lights up**: The [5] in column 6 and its button.

**After the drop, says:**

> Nice! Since dropping the [2] bit made the column 2 bits tall, the [2] bit was DECRYPTED.

**Points shown:**

```
[2]  (12) ×1 = 12
```
- **Score after**: 38
- **Notes**: 

---

## 5. SCORE (KEPT)

- **Heading**: `// TUTORIAL 5 / 32`
- **Card sits**: top of the board; **BOT**: resting
- **Bits**: CURRENT none
- **Board**:

```
 .  .  .  .  . [5] . 
```

**Says:**

> Now for the scoring! Each decrypted bit earns you 10 points plus the number it displays. A [1] bit is worth 11 points, a [2] bit is worth 12 points, and a [7] bit is worth 17 points. Get the idea? Your SCORE sits at the left of the panels up top, under your BEST. Tap SCORE now!

- **Asks you to**: Tap the SCORE panel.
- **Lights up**: SCORE.
- **Notes**: 

---

## 6. CHAINS (KEPT)

- **Heading**: `// TUTORIAL 6 / 32`
- **Card sits**: top of the board; **BOT**: resting
- **Bits**: CURRENT [2]
- **Board**:

```
 .  .  . [7] .  .  . 
 .  .  . [2] .  .  . 
 .  . [6][5][4] . [5]
 .  . [6][7][3][2][6]
```

**Says:**

> Any time a bit decrypts, any bits that were above it will fall, and they can cause more bits to DECRYPT. This is called a CHAIN, and each wave of bits that clears is a link. The first link scores normal points, the second link’s points are doubled (2x), the third link’s are tripled (3x), and so on. Let’s drop the [2] into column 6.

- **Asks you to**: Drop the [2] into column 6.
- **Lights up**: The [2] at the foot of column 6, the [5]s in the second row of columns 4 and 7, and column 6's button.

**After the drop, says:**

> Nice one! That was a 3x CHAIN:
> 1. The [2]s cleared in a column of 2, and the [5]s in a row of 5.
> 2. The [3] cleared in a row of 3.
> 3. The [2] cleared in a row of 2.
> 
> Decrypting 4 bits in one drop is a NIBBLE, worth 16 bonus points.

**Points shown:**

```
[2] [5] [2] [5]  (12 + 15 + 12 + 15) ×1 = 54
[3]  (13) ×2 = 26
[2]  (12) ×3 = 36
NIBBLE +16
TOTAL +132
```
- **Score after**: 170
- **Notes**: 

---

## 7. CHAIN and the CHAIN METER (KEPT)

- **Heading**: `// TUTORIAL 7 / 32`
- **Card sits**: top of the board; **BOT**: resting
- **Bits**: CURRENT none
- **Board**:

```
 .  . [6][7] .  .  . 
 .  . [6][7][4] . [6]
```

**Says:**

> CHAIN, at the right of the panels up top, shows you how long your last decrypted bit chain was. The bars on each side of the grid are the CHAIN METER. Each decrypted link lights up a bar on the meter, and the meter stays charged from one drop to the next. Fill all 5 bars to earn an EXPLOIT. A drop that clears nothing ends the streak, and the meter resets. Tap CHAIN.

- **Asks you to**: Tap the CHAIN panel.
- **Lights up**: CHAIN and the CHAIN METER.
- **Notes**: 

---

## 8. ENCRYPTION LAYERS: the first peel (KEPT)

- **Heading**: `// TUTORIAL 8 / 32`
- **Card sits**: top of the board; **BOT**: resting
- **Bits**: CURRENT [2], then [2]
- **Board**:

```
 .  .  . [=] .  .  . 
```

**Says:**

> This [=] is an ENCRYPTION LAYER. Decrypt a bit right beside it to peel it. Drop the [2] into column 5, next to the layer: the two of them make a line of 2.

- **Asks you to**: Drop the [2] into column 5.
- **Lights up**: The layer in column 4 and column 5's button.

**After the drop, says:**

> The [2] decrypted and peeled the layer once: [=] is now cracked, [-]. That was one more link for the CHAIN METER: 4 bars lit.

**Points shown:**

```
[2]  (12) ×1 = 12
```
- **Score after**: 182
- **Notes**: 

---

## 9. ENCRYPTION LAYERS: the second peel (KEPT)

- **Heading**: `// TUTORIAL 9 / 32`
- **Card sits**: top of the board; **BOT**: resting
- **Bits**: CURRENT [2]
- **Board**:

```
 .  .  . [-] .  .  . 
```

**Says:**

> Drop the next [2] into column 5 to peel the layer a second time.

- **Asks you to**: Drop the next [2] into column 5.
- **Lights up**: The cracked layer and column 5's button.

**After the drop, says:**

> The second peel broke the layer open and revealed the bit hidden under it: a [1], alone in a line of 1, so it decrypted too, as the chain’s second link. Those 2 links filled the CHAIN METER (3 + 1 + 2 = 6), so you earned an EXPLOIT!

**Points shown:**

```
[2]  (12) ×1 = 12
[1]  (11) ×2 = 22
TOTAL +34
```
- **Score after**: 216
- **Notes**: 

---

## 10. The ======== line (KEPT)

- **Heading**: `// TUTORIAL 10 / 32`
- **Card sits**: under the board's middle; **BOT**: worried

**Says:**

> Keep every column below this ======== line. If anything is still above it once the decrypting stops, the trace completes and the game is over.

- **Asks you to**: Tap NEXT.
- **Lights up**: The ======== line.
- **Notes**: 

---

## 11. ENCRYPT IN (KEPT)

- **Heading**: `// TUTORIAL 11 / 32`
- **Card sits**: top of the board; **BOT**: resting

**Says:**

> A new row of layers rises from the bottom every 8 drops, pushing everything up. ENCRYPT IN, at the right just above CHAIN, counts down the drops until the next one. Tap it.

- **Asks you to**: Tap the ENCRYPT IN panel.
- **Lights up**: ENCRYPT IN.
- **Notes**: 

---

## 12. EXPLOITS: arming one (KEPT)

- **Heading**: `// TUTORIAL 12 / 32`
- **Card sits**: top of the board; **BOT**: devious grin
- **Bits**: CURRENT none; held in EXPLOIT: WORM VIRUS
- **Board**:

```
 .  . [3] .  .  .  . 
 .  . [7] .  .  .  . 
 .  . [2] .  .  .  . 
 .  . [6] .  .  .  . 
```

**Says:**

> When the CHAIN METER fills up, you earn an EXPLOIT. Different exploits change the board depending on where you drop them. When you earn an exploit, the CHAIN METER will pulse until you decide to use it. Tap the EXPLOIT button to use the one you have available. It’s a WORM VIRUS!

- **Asks you to**: Tap the EXPLOIT button (it arms the WORM VIRUS).
- **Lights up**: The EXPLOIT button.
- **Notes**: 

---

## 13. EXPLOITS: the WORM VIRUS (KEPT)

- **Heading**: `// TUTORIAL 13 / 32`
- **Card sits**: top of the board; **BOT**: devious grin
- **Bits**: CURRENT the armed WORM VIRUS
- **Board**:

```
 .  . [3] .  .  .  . 
 .  . [7] .  .  .  . 
 .  . [2] .  .  .  . 
 .  . [6] .  .  .  . 
```

**Says:**

> The WORM VIRUS is armed and is now your CURRENT. It drops like a bit. Drop it into column 3, the tall one: it wipes out every block in that column.

- **Asks you to**: Drop the WORM VIRUS into column 3.
- **Lights up**: Every block in column 3 and its button.

**After the drop, says:**

> The WORM VIRUS wiped out the whole column. Blocks wiped out by an exploit score a flat 10 each. Other exploits wipe an area, peel layers or change bits: each has its card in the EXPLOITS tab.

**Points shown:**

```
+40
```
- **Score after**: 256
- **Notes**: 

---

## 14. THE BOTTOM ROW (NEW)

- **Heading**: `// TUTORIAL 14 / 32`
- **Card sits**: top of the board; **BOT**: resting

**Says:**

> The row under the drop buttons holds more than the EXPLOIT button. Beside it are the two SIDE SLOTS, and at each end a PATCH SLOT. They open as you level up: until then each one shows a padlock and the level it opens at. A PATCH SLOT sells a patch during a game, for KEYS and resources, and the patch works the moment you buy it.

- **Asks you to**: Tap NEXT.
- **Lights up**: The two PATCH SLOTS and the two SIDE SLOTS.
- **To build**: The tutorial hides these slots today: show them, locked (padlock and level), for this card and the next.
- **Notes**: 

---

## 15. THE BLACK MARKET (NEW)

- **Heading**: `// TUTORIAL 15 / 32`
- **Card sits**: top of the board; **BOT**: devious grin

**Says:**

> The SIDE SLOTS hold STARTER EXPLOITS that you bring into a game. An empty one becomes the BLACK MARKET once the first layer rises: an exploit or a BLACK BOX for sale, swapped for another every 4 drops. The pips under it count the drops left, and the last one blinks. BLACK BOXES are cheap, but some of them are INFECTED!

- **Asks you to**: Tap NEXT.
- **Lights up**: The two SIDE SLOTS.
- **To build**: Show a sample BLACK MARKET slot (an item, its price and the 4 pips) in one side slot for this card.
- **Notes**: 

---

## 16. PAUSE (REWORDED)

- **Heading**: `// TUTORIAL 16 / 32`
- **Card sits**: top of the board; **BOT**: resting

**Says:**

> The button at the top right PAUSES the game. Tap it now!

*Was:* The button at the top left PAUSES the game. Tap it now!

*Why:* It said top left; PAUSE is at the top right.

- **Asks you to**: Tap PAUSE (it opens the pause screen).
- **Lights up**: The PAUSE button.
- **Notes**: 

---

## 17. The pause screen (KEPT)

- **Heading**: `// TUTORIAL 17 / 32`
- **Card sits**: bottom of the screen; **BOT**: resting

**Says:**

> The pause screen has RESUME, RESTART, RULES & RECORDS, SETTINGS, EXPLOITS, the STORE and the MAIN MENU (and EXIT, in VS). All but RESUME and RESTART are on the MAIN MENU too. Tap RULES & RECORDS.

- **Asks you to**: Tap RULES & RECORDS.
- **Lights up**: RULES & RECORDS.
- **Notes**: 

---

## 18. RULES (KEPT)

- **Heading**: `// TUTORIAL 18 / 32`
- **Card sits**: middle of the screen; **BOT**: resting

**Says:**

> RULES & RECORDS opens as a card over the game, with its tabs along the top. The RULES tab has everything you just learned, written down, with the TUTORIAL button to come back here any time.

- **Asks you to**: Tap NEXT.
- **Lights up**: The RULES tab.
- **Notes**: 

---

## 19. RECORDS (REWORDED)

- **Heading**: `// TUTORIAL 19 / 32`
- **Card sits**: middle of the screen; **BOT**: resting

**Says:**

> The RECORDS tab shows your level and DECRYPTOR rank, every unlock with the level it opens at, your achievements, HISTORY (your last 10 games) and your lifetime stats. Every bit you decrypt is XP, 100 bits a level. At Lv 80 you can RANK UP: everything locks again to unlock once more, and each rank earns a little more. NOTICES, the next tab, keeps every notice the game has shown you.

*Was:* The RECORDS tab shows your level and DECRYPTOR rank, every unlock with the level it opens at, every achievement with its progress, and your lifetime stats.

*Why:* Adds HISTORY, how levels and RANK UP work, and NOTICES.

- **Asks you to**: Tap NEXT.
- **Lights up**: The RECORDS tab.
- **Notes**: 

---

## 20. Closing a card (KEPT)

- **Heading**: `// TUTORIAL 20 / 32`
- **Card sits**: middle of the screen; **BOT**: resting

**Says:**

> Tapping outside a card won’t close it: tap ← BACK, at the top left of the card.

- **Asks you to**: Tap ← BACK.
- **Lights up**: ← BACK.
- **Notes**: 

---

## 21. EXPLOITS (the button) (REWORDED)

- **Heading**: `// TUTORIAL 21 / 32`
- **Card sits**: bottom of the screen; **BOT**: resting

**Says:**

> Now tap EXPLOITS.

*Was:* Now tap EXPLOITS. (The STORE beside it has REMOVE ADS and FULL ACCESS.)

*Why:* The STORE gets its own cards (below), so the note about it is gone.

- **Asks you to**: Tap EXPLOITS on the pause screen.
- **Lights up**: EXPLOITS.
- **Notes**: 

---

## 22. The loadout (REWORDED)

- **Heading**: `// TUTORIAL 22 / 32`
- **Card sits**: bottom of the screen; **BOT**: resting

**Says:**

> EXPLOITS is your loadout. You can only earn exploits that are in a slot: SLOTS, at the top, counts the slots you’ve filled and the ones you have. Tap a card to put it in a free slot, or tap it again to take it out. The first three exploits are yours as they unlock; the rest are bought once with resources and kept until you RANK UP. The loadout locks from a game’s first drop until it ends.

*Was:* EXPLOITS is your loadout. You can only earn exploits that are in a slot: SLOTS, at the top, counts the slots you’ve filled and the ones you have. Tap an unlocked card to put it in a free slot, or tap it again to take it out. More slots and exploits unlock as you level up, and the loadout is locked from a session’s first drop until it ends.

*Why:* Adds buying exploits to keep them.

- **Asks you to**: Tap NEXT.
- **Lights up**: SLOTS and every exploit card.
- **Notes**: 

---

## 23. Closing EXPLOITS (KEPT)

- **Heading**: `// TUTORIAL 23 / 32`
- **Card sits**: middle of the screen; **BOT**: resting

**Says:**

> Tap ← BACK to close it.

- **Asks you to**: Tap ← BACK.
- **Lights up**: ← BACK.
- **Notes**: 

---

## 24. STORE (the button) (NEW)

- **Heading**: `// TUTORIAL 24 / 32`
- **Card sits**: bottom of the screen; **BOT**: resting

**Says:**

> Now tap the STORE.

- **Asks you to**: Tap STORE on the pause screen.
- **Lights up**: STORE.
- **Notes**: 

---

## 25. STORE (what’s in it) (NEW)

- **Heading**: `// TUTORIAL 25 / 32`
- **Card sits**: bottom of the screen; **BOT**: happy

**Says:**

> The STORE shows YOUR RESOURCES at the top: KEYS, BUGS, CACHE, CRYPTO, ROOTKITS and MASTER KEYS, all earned by playing (tap the [i] to see how). Under them, PRICES TODAY: sales, holidays and busy days move prices up and down. Below that: the DAILY DROP (free once a day), PATCHES, STARTER EXPLOITS, BLACK BOXES, and REMOVE ADS and FULL ACCESS.

- **Asks you to**: Tap NEXT.
- **Lights up**: YOUR RESOURCES and the PRICES TODAY gauge.
- **Notes**: 

---

## 26. Closing the STORE (NEW)

- **Heading**: `// TUTORIAL 26 / 32`
- **Card sits**: middle of the screen; **BOT**: resting

**Says:**

> Tap ← BACK to close the STORE.

- **Asks you to**: Tap ← BACK.
- **Lights up**: ← BACK.
- **Notes**: 

---

## 27. SETTINGS (the button) (KEPT)

- **Heading**: `// TUTORIAL 27 / 32`
- **Card sits**: bottom of the screen; **BOT**: resting

**Says:**

> Now tap SETTINGS.

- **Asks you to**: Tap SETTINGS.
- **Lights up**: SETTINGS.
- **Notes**: 

---

## 28. What's in SETTINGS (REWORDED)

- **Heading**: `// TUTORIAL 28 / 32`
- **Card sits**: middle of the screen; **BOT**: resting

**Says:**

> SETTINGS has SOUND (sound and music, the sound effects, SOUND OUTPUT for what you’re listening on), the PLAYLIST and the MUSIC PLAYER, CONTROLS (where the drop buttons sit, vibration on phones), DISPLAY (THEMES and FONTS, which unlock as you level up; PIXEL STYLE; the CRT DISPLAY; text size; REDUCED EFFECTS for slower phones) and EXTRAS (the wandering bots, the screen saver).

*Was:* SETTINGS has SOUND (sound and music, the sound effects, SOUND OUTPUT for what you’re listening on), the PLAYLIST to change tracks (with the MUSIC PLAYER for listening on its own), CONTROLS (where the drop buttons sit, vibration on phones), DISPLAY (color THEMES and FONTS, more unlocking as you level up; text size; REDUCED EFFECTS for slower phones) and EXTRAS (the wandering bots, the screen saver).

*Why:* Adds PIXEL STYLE and the CRT DISPLAY.

- **Asks you to**: Tap NEXT.
- **Lights up**: Nothing (SETTINGS is open behind the card).
- **Notes**: 

---

## 29. Closing SETTINGS (KEPT)

- **Heading**: `// TUTORIAL 29 / 32`
- **Card sits**: middle of the screen; **BOT**: resting

**Says:**

> Tap ← BACK to close SETTINGS.

- **Asks you to**: Tap ← BACK.
- **Lights up**: ← BACK.
- **Notes**: 

---

## 30. RESUME (KEPT)

- **Heading**: `// TUTORIAL 30 / 32`
- **Card sits**: bottom of the screen; **BOT**: resting

**Says:**

> And RESUME to get back to the game.

- **Asks you to**: Tap RESUME.
- **Lights up**: RESUME.
- **Notes**: 

---

## 31. ENCRYPTION STRENGTH (NEW)

- **Heading**: `// TUTORIAL 31 / 32`
- **Card sits**: top of the board; **BOT**: happy

**Says:**

> In CLASSIC, every game has a key to crack: its ENCRYPTION STRENGTH, shown under BYTEFALL. It starts at 128-BIT, cracked at 1,500 points on NORMAL, and the bar along the bottom of SCORE fills toward it. Crack it for KEYS, then GO DEEPER for a stronger key and more KEYS, or DISCONNECT and end the game on a win.

- **Asks you to**: Tap NEXT.
- **Lights up**: The line under BYTEFALL and the bar along SCORE.
- **To build**: The tutorial isn't CLASSIC, so show a sample line (// CLASSIC // NORMAL // 128-BIT: 1,500) and a part-filled SCORE bar for this card.
- **Notes**: 

---

## 32. The end (REWORDED)

- **Heading**: `// TUTORIAL 32 / 32`
- **Card sits**: top of the board; **BOT**: happy

**Says:**

> That’s everything you need to know! Before a game, the main menu’s PATCHES and STARTERS let you bring an edge in, once you have some. Good luck, decryptor.

*Was:* That’s everything you need to know. Good luck, decryptor.

*Why:* Adds PATCHES and STARTERS on the main menu.

- **Asks you to**: Tap PLAY CLASSIC or RULES.
- **Lights up**: Nothing.
- **Notes**: 
