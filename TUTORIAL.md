# ByteFall tutorial: every card, for review

The TUTORIAL as it is in the game now (v540), all 57 cards and the welcome, recorded by playing it through:
what each card says (word for word), what it asks, what lights up, the board and bits it sets up, and
after a drop its explanation and the points it shows. Write anything you'd change on a card's
**Notes** line.

The tutorial lives in `js/tutorial.js` (`STEPS`).

## What changed this round

- **Long cards split** into short ones: 26 steps became 57, each a sentence or two.
- **Taps follow the card**: a tap before BOT has finished talking shows the rest of the words at once and
  gets BOT's -_- (the next tap does its job). Once it's said, anything the card didn't ask for (PAUSE,
  other buttons, other panels, the menus) gets -_- and does nothing. EXIT always works.
- **PAUSE is off** in the tutorial (its button, Esc and P) except on the card that asks for it.
- **8px between lines** of a card's words and of its points.
- **The dim fixed**: it cut its openings a banner's height too low in the app (with the ad banner up),
  half-darkening CURRENT on card 3. It measures from its own corner now.
- **Points in color, tighter**: `[2][5][2][5] 12+15+12+15 ×1 = 54`: the bits in the terminal color, what
  each is worth dimmer, the multiplier in the accent, the result bright; NIBBLE and TOTAL in the accent.
- **Cards 16 and 17** (the layer peels): columns 3, 4 or 5, beside the layer or on top of it.
- **New cards**: the bottom row (the slots, shown locked), the BLACK MARKET (a sample slot with a TROJAN
  for sale and its pips), more on CHAINS and the CHAIN METER, RECORDS (HISTORY, levels, RANK UP,
  NOTICES), the loadout (buying exploits), the STORE (three cards), SETTINGS (two), ENCRYPTION STRENGTH
  (a sample line and SCORE bar) and PATCHES / STARTERS on the main menu.
- **PAUSE** is named at the top right now.
- **The last card**: MAIN MENU only.
- **No STORE on the pause screen** (it's on the main menu): card 32 names QUIT in its place, and card
  44 opens the STORE itself instead of asking for a tap.
- **RULES** (in RULES & RECORDS) is in sections now, each under a ===== line: SCORING, LAYERS AND THE
  LINE, EXPLOITS, THE BOTTOM ROW, CLASSIC'S GOAL, DIFFICULTY, RESOURCES AND LEVELS.

## How every card works

- **The card**: `// TUTORIAL n / 57` (the welcome has no number) and **EXIT** in its top row, BOT's face
  beside the words, its buttons under the frame. The words type out with a blip of BOT's voice.
- **BACK** (every card after the welcome): after a drop, the same card again; otherwise the card before,
  the board and score put back as they were. **NEXT / BEGIN** on cards that only explain.
- **A tap card** dims the screen but for what to tap. **A drop card** dims the other columns; a drop in
  one of them gets a denied sound, -_- and a nudge of the card.
- **After a drop**: the words change to what happened, then the points show under them, then NEXT.
- Set boards and bits, no rising layers, nothing earned (no XP, KEYS or resources). The CHAIN METER keeps
  its charge from the chain lesson through the WORM VIRUS.

Columns are numbered 1 to 7 from the left. Boards are drawn top row first; `[=]` is an ENCRYPTION LAYER,
`[-]` a cracked one.


---

## Welcome

- **Heading**: `// TUTORIAL`
- **Card sits**: under the board's middle; **BOT**: happy
- **Buttons**: EXIT, BEGIN

**Says:**

> Welcome to BYTEFALL! This tutorial shows you how the game is played and where everything is. Each card is short, and there’s no math needed as long as you can count to 7. Let’s begin!

- **Asks you to**: Tap BEGIN.
- **Lights up**: nothing
- **Notes**: 

---

## Card 1

- **Heading**: `// TUTORIAL 1 / 57`
- **Card sits**: under the board's middle; **BOT**: resting
- **Buttons**: EXIT, BACK, NEXT

**Says:**

> This grid is called the TERMINAL. You’ll be dropping encrypted bits into its columns.

- **Asks you to**: Tap NEXT.
- **Lights up**: nothing
- **Notes**: 

---

## Card 2

- **Heading**: `// TUTORIAL 2 / 57`
- **Card sits**: under the board's middle; **BOT**: resting
- **Buttons**: EXIT, BACK, NEXT

**Says:**

> Encrypted bits are the numbered blocks with brackets: [1] [2] [3] [4] [5] [6] [7]

- **Asks you to**: Tap NEXT.
- **Lights up**: nothing
- **Notes**: 

---

## Card 3

- **Heading**: `// TUTORIAL 3 / 57`
- **Card sits**: top of the board; **BOT**: resting
- **Buttons**: EXIT, BACK
- **Bits**: CURRENT [3], then [2]
- **Board**:

```
 .  .  .  . [3][5] . 
```

**Says:**

> This flashing panel with the bright border shows your CURRENT bit, [3]: the one your next drop puts into a column. Tap the CURRENT panel!

- **Asks you to**: Tap ← BACK.
- **Lights up**: the CURRENT panel
- **Notes**: 

---

## Card 4

- **Heading**: `// TUTORIAL 4 / 57`
- **Card sits**: top of the board; **BOT**: resting
- **Buttons**: EXIT, BACK, NEXT

**Says:**

> A bit clears when its number matches the exact number of bits in the row or column it sits in. Clearing bits is called DECRYPTING.

- **Asks you to**: Tap NEXT.
- **Lights up**: nothing
- **Notes**: 

---

## Card 5

- **Heading**: `// TUTORIAL 5 / 57`
- **Card sits**: top of the board; **BOT**: resting, then resting after the drop
- **Buttons**: EXIT, BACK

**Says:**

> Drop a bit by tapping a number button below, or the column itself. Drop the [3] into column 4 or 7, next to the [3] and [5].

- **Asks you to**: Drop the bit into column 4 or 7.
- **Lights up**: the block in column 5, row 1 from the bottom, the block in column 6, row 1 from the bottom, the drop button(s) for the allowed column(s)

**After the drop, says:**

> BOOM! Both [3]s were DECRYPTED: the row was made 3 bits long. The [5] stays, since it isn’t in a row or column 5 bits long.

**Points shown:**

```
[3][3] 13+13 ×1 = 26
```
- **Score after**: 26
- **Notes**: 

---

## Card 6

- **Heading**: `// TUTORIAL 6 / 57`
- **Card sits**: top of the board; **BOT**: resting, then resting after the drop
- **Buttons**: EXIT, BACK
- **Bits**: CURRENT [2]
- **Board**:

```
 .  .  .  .  . [5] . 
```

**Says:**

> Now a column. Drop the [2] on top of the [5] in column 6.

- **Asks you to**: Drop the bit into column 6.
- **Lights up**: the block in column 6, row 1 from the bottom, the drop button(s) for the allowed column(s)

**After the drop, says:**

> Nice! The column was made 2 bits tall, so the [2] was DECRYPTED.

**Points shown:**

```
[2] 12 ×1 = 12
```
- **Score after**: 38
- **Notes**: 

---

## Card 7

- **Heading**: `// TUTORIAL 7 / 57`
- **Card sits**: top of the board; **BOT**: resting
- **Buttons**: EXIT, BACK, NEXT
- **Bits**: CURRENT none
- **Board**:

```
 .  .  .  .  . [5] . 
```

**Says:**

> Each decrypted bit scores 10 points plus its number: a [1] is worth 11, a [2] 12, and a [7] 17.

- **Asks you to**: Tap NEXT.
- **Lights up**: nothing
- **Notes**: 

---

## Card 8

- **Heading**: `// TUTORIAL 8 / 57`
- **Card sits**: top of the board; **BOT**: resting
- **Buttons**: EXIT, BACK

**Says:**

> Your SCORE is at the left of the panels up top, under your BEST. Tap SCORE!

- **Asks you to**: Tap the SCORE panel.
- **Lights up**: the SCORE panel
- **Notes**: 

---

## Card 9

- **Heading**: `// TUTORIAL 9 / 57`
- **Card sits**: top of the board; **BOT**: resting
- **Buttons**: EXIT, BACK, NEXT
- **Bits**: CURRENT [2]
- **Board**:

```
 .  .  . [7] .  .  . 
 .  .  . [2] .  .  . 
 .  . [6][5][4] . [5]
 .  . [6][7][3][2][6]
```

**Says:**

> When a bit decrypts, any bits above it fall, and they can decrypt too. That’s a CHAIN, and each wave of bits that clears is a link.

- **Asks you to**: Tap NEXT.
- **Lights up**: nothing
- **Notes**: 

---

## Card 10

- **Heading**: `// TUTORIAL 10 / 57`
- **Card sits**: top of the board; **BOT**: resting, then happy after the drop
- **Buttons**: EXIT, BACK

**Says:**

> The first link scores normal points, the second link doubles (2x), the third triples (3x), and so on. Drop the [2] into column 6.

- **Asks you to**: Drop the bit into column 6.
- **Lights up**: the block in column 4, row 2 from the bottom, the block in column 7, row 2 from the bottom, the block in column 6, row 1 from the bottom, the drop button(s) for the allowed column(s)

**After the drop, says:**

> Nice one! That was a 3x CHAIN:
> 1. The [2]s cleared in a column of 2, and the [5]s in a row of 5.
> 2. The [3] cleared in a row of 3.
> 3. The [2] cleared in a row of 2.

**Points shown:**

```
[2][5][2][5] 12+15+12+15 ×1 = 54
[3] 13 ×2 = 26
[2] 12 ×3 = 36
NIBBLE +16
TOTAL +132
```
- **Score after**: 170
- **Notes**: 

---

## Card 11

- **Heading**: `// TUTORIAL 11 / 57`
- **Card sits**: top of the board; **BOT**: happy
- **Buttons**: EXIT, BACK, NEXT
- **Bits**: CURRENT none
- **Board**:

```
 .  . [6][7] .  .  . 
 .  . [6][7][4] . [6]
```

**Says:**

> Decrypting 4 bits in one drop is a NIBBLE, worth 16 bonus points. You just made one!

- **Asks you to**: Tap NEXT.
- **Lights up**: nothing
- **Notes**: 

---

## Card 12

- **Heading**: `// TUTORIAL 12 / 57`
- **Card sits**: top of the board; **BOT**: resting
- **Buttons**: EXIT, BACK

**Says:**

> CHAIN, at the right of the panels up top, shows how long your last chain was. Tap CHAIN.

- **Asks you to**: Tap the CHAIN panel.
- **Lights up**: the CHAIN panel
- **Notes**: 

---

## Card 13

- **Heading**: `// TUTORIAL 13 / 57`
- **Card sits**: top of the board; **BOT**: resting
- **Buttons**: EXIT, BACK, NEXT

**Says:**

> The bars on each side of the grid are the CHAIN METER. Each link lights a bar, and the meter stays charged from one drop to the next.

- **Asks you to**: Tap NEXT.
- **Lights up**: the CHAIN METER
- **Notes**: 

---

## Card 14

- **Heading**: `// TUTORIAL 14 / 57`
- **Card sits**: top of the board; **BOT**: resting
- **Buttons**: EXIT, BACK, NEXT

**Says:**

> Fill all 5 bars to earn an EXPLOIT. A drop that clears nothing ends the streak, and the meter resets.

- **Asks you to**: Tap NEXT.
- **Lights up**: the CHAIN METER
- **Notes**: 

---

## Card 15

- **Heading**: `// TUTORIAL 15 / 57`
- **Card sits**: top of the board; **BOT**: resting
- **Buttons**: EXIT, BACK, NEXT
- **Bits**: CURRENT [2], then [2]
- **Board**:

```
 .  .  . [=] .  .  . 
```

**Says:**

> This [=] is an ENCRYPTION LAYER. Decrypt a bit right next to it to peel it.

- **Asks you to**: Tap NEXT.
- **Lights up**: the block in column 4, row 1 from the bottom
- **Notes**: 

---

## Card 16

- **Heading**: `// TUTORIAL 16 / 57`
- **Card sits**: top of the board; **BOT**: resting, then resting after the drop
- **Buttons**: EXIT, BACK

**Says:**

> Drop the [2] into column 3, 4 or 5: beside the layer or on top of it, the two of them make a line of 2.

- **Asks you to**: Drop the bit into column 3 or 4 or 5.
- **Lights up**: the block in column 4, row 1 from the bottom, the drop button(s) for the allowed column(s)

**After the drop, says:**

> The [2] decrypted and peeled the layer once: [=] is cracked now, [-]. That was one more link for the CHAIN METER: 4 bars lit.

**Points shown:**

```
[2] 12 ×1 = 12
```
- **Score after**: 182
- **Notes**: 

---

## Card 17

- **Heading**: `// TUTORIAL 17 / 57`
- **Card sits**: top of the board; **BOT**: resting, then happy after the drop
- **Buttons**: EXIT, BACK
- **Bits**: CURRENT [2]
- **Board**:

```
 .  .  . [-] .  .  . 
```

**Says:**

> Drop the next [2] into column 3, 4 or 5 to peel the layer a second time.

- **Asks you to**: Drop the bit into column 3 or 4 or 5.
- **Lights up**: the block in column 4, row 1 from the bottom, the drop button(s) for the allowed column(s)

**After the drop, says:**

> The second peel broke the layer open and revealed the bit under it: a [1], alone in a line of 1, so it decrypted too, as the chain’s second link.

**Points shown:**

```
[2] 12 ×1 = 12
[1] 11 ×2 = 22
TOTAL +34
```
- **Score after**: 216
- **Notes**: 

---

## Card 18

- **Heading**: `// TUTORIAL 18 / 57`
- **Card sits**: top of the board; **BOT**: happy
- **Buttons**: EXIT, BACK, NEXT

**Says:**

> Those 2 links filled the CHAIN METER (3 + 1 + 2 = 6), so you earned an EXPLOIT!

- **Asks you to**: Tap NEXT.
- **Lights up**: nothing
- **Notes**: 

---

## Card 19

- **Heading**: `// TUTORIAL 19 / 57`
- **Card sits**: under the board's middle; **BOT**: worried
- **Buttons**: EXIT, BACK, NEXT

**Says:**

> Keep every column below this ======== line. If anything is still above it once the decrypting stops, the trace completes and the game is over.

- **Asks you to**: Tap NEXT.
- **Lights up**: the ======== line
- **Notes**: 

---

## Card 20

- **Heading**: `// TUTORIAL 20 / 57`
- **Card sits**: top of the board; **BOT**: resting
- **Buttons**: EXIT, BACK

**Says:**

> A new row of layers rises from the bottom every 8 drops, pushing everything up. ENCRYPT IN, just above CHAIN, counts down the drops to the next one. Tap it.

- **Asks you to**: Tap the ENCRYPT IN panel.
- **Lights up**: the ENCRYPT IN panel
- **Notes**: 

---

## Card 21

- **Heading**: `// TUTORIAL 21 / 57`
- **Card sits**: top of the board; **BOT**: devious grin
- **Buttons**: EXIT, BACK, NEXT
- **Bits**: CURRENT none; held in EXPLOIT: WORM VIRUS
- **Board**:

```
 .  . [3] .  .  .  . 
 .  . [7] .  .  .  . 
 .  . [2] .  .  .  . 
 .  . [6] .  .  .  . 
```

**Says:**

> EXPLOITS change the board in different ways, depending on where you drop them. While you have one waiting, the CHAIN METER pulses.

- **Asks you to**: Tap NEXT.
- **Lights up**: nothing
- **Notes**: 

---

## Card 22

- **Heading**: `// TUTORIAL 22 / 57`
- **Card sits**: top of the board; **BOT**: devious grin
- **Buttons**: EXIT, BACK

**Says:**

> Tap the EXPLOIT button to use yours. It’s a WORM VIRUS!

- **Asks you to**: Tap the EXPLOIT button (it arms the WORM VIRUS).
- **Lights up**: the EXPLOIT button
- **Notes**: 

---

## Card 23

- **Heading**: `// TUTORIAL 23 / 57`
- **Card sits**: top of the board; **BOT**: devious grin, then happy after the drop
- **Buttons**: EXIT, BACK
- **Bits**: CURRENT the armed WORM VIRUS
- **Board**:

```
 .  . [3] .  .  .  . 
 .  . [7] .  .  .  . 
 .  . [2] .  .  .  . 
 .  . [6] .  .  .  . 
```

**Says:**

> The WORM VIRUS is armed as your CURRENT, and it drops like a bit. Drop it into column 3, the tall one: it wipes out every block in that column.

- **Asks you to**: Drop the bit into column 3.
- **Lights up**: the block in column 3, row 4 from the bottom, the block in column 3, row 3 from the bottom, the block in column 3, row 2 from the bottom, the block in column 3, row 1 from the bottom, the drop button(s) for the allowed column(s)

**After the drop, says:**

> The WORM VIRUS wiped out the whole column. Blocks wiped out by an exploit score a flat 10 each.

**Points shown:**

```
+40
```
- **Score after**: 256
- **Notes**: 

---

## Card 24

- **Heading**: `// TUTORIAL 24 / 57`
- **Card sits**: top of the board; **BOT**: resting
- **Buttons**: EXIT, BACK, NEXT

**Says:**

> Other exploits wipe an area, peel layers or change bits. Each one has its card in EXPLOITS.

- **Asks you to**: Tap NEXT.
- **Lights up**: nothing
- **Notes**: 

---

## Card 25

- **Heading**: `// TUTORIAL 25 / 57`
- **Card sits**: top of the board; **BOT**: resting
- **Buttons**: EXIT, BACK, NEXT
- **Shows for the lesson**: the bottom row's slots (locked: padlock and level)

**Says:**

> The row under the drop buttons holds more than the EXPLOIT button: a SIDE SLOT on each side of it, and a PATCH SLOT at each end.

- **Asks you to**: Tap NEXT.
- **Lights up**: nothing
- **Notes**: 

---

## Card 26

- **Heading**: `// TUTORIAL 26 / 57`
- **Card sits**: top of the board; **BOT**: resting
- **Buttons**: EXIT, BACK, NEXT
- **Shows for the lesson**: the bottom row's slots (locked: padlock and level)

**Says:**

> They open as you level up. Until then, each one shows a padlock and the level it opens at.

- **Asks you to**: Tap NEXT.
- **Lights up**: nothing
- **Notes**: 

---

## Card 27

- **Heading**: `// TUTORIAL 27 / 57`
- **Card sits**: top of the board; **BOT**: resting
- **Buttons**: EXIT, BACK, NEXT
- **Shows for the lesson**: the bottom row's slots (locked: padlock and level)

**Says:**

> A PATCH SLOT sells a patch during a game, for KEYS and resources, and the patch works the moment you buy it.

- **Asks you to**: Tap NEXT.
- **Lights up**: nothing
- **Notes**: 

---

## Card 28

- **Heading**: `// TUTORIAL 28 / 57`
- **Card sits**: top of the board; **BOT**: resting
- **Buttons**: EXIT, BACK, NEXT
- **Shows for the lesson**: the bottom row's slots (the left SIDE SLOT a BLACK MARKET selling a TROJAN, 3 pips left)

**Says:**

> The SIDE SLOTS hold STARTER EXPLOITS that you bring into a game. An empty one becomes the BLACK MARKET once the first layer rises.

- **Asks you to**: Tap NEXT.
- **Lights up**: nothing
- **Notes**: 

---

## Card 29

- **Heading**: `// TUTORIAL 29 / 57`
- **Card sits**: top of the board; **BOT**: resting
- **Buttons**: EXIT, BACK, NEXT
- **Shows for the lesson**: the bottom row's slots (the left SIDE SLOT a BLACK MARKET selling a TROJAN, 3 pips left)

**Says:**

> It sells an exploit or a BLACK BOX, swapped for another every 4 drops. The pips under it count the drops left, and the last one blinks.

- **Asks you to**: Tap NEXT.
- **Lights up**: nothing
- **Notes**: 

---

## Card 30

- **Heading**: `// TUTORIAL 30 / 57`
- **Card sits**: top of the board; **BOT**: devious grin
- **Buttons**: EXIT, BACK, NEXT
- **Shows for the lesson**: the bottom row's slots (the left SIDE SLOT a BLACK MARKET selling a TROJAN, 3 pips left)

**Says:**

> BLACK BOXES are cheap, but some of them are INFECTED!

- **Asks you to**: Tap NEXT.
- **Lights up**: nothing
- **Notes**: 

---

## Card 31

- **Heading**: `// TUTORIAL 31 / 57`
- **Card sits**: top of the board; **BOT**: resting
- **Buttons**: EXIT, BACK

**Says:**

> The button at the top right PAUSES the game. Tap it now!

- **Asks you to**: Tap PAUSE, at the top right (it opens the pause screen).
- **Lights up**: PAUSE, at the top right
- **Notes**: 

---

## Card 32

- **Heading**: `// TUTORIAL 32 / 57`
- **Card sits**: bottom of the screen; **BOT**: resting
- **Buttons**: EXIT, BACK

**Says:**

> The pause screen has RESUME, RESTART, RULES & RECORDS, SETTINGS, EXPLOITS and QUIT. Tap RULES & RECORDS.

- **Asks you to**: Tap RULES & RECORDS on the pause screen.
- **Lights up**: RULES & RECORDS on the pause screen
- **Notes**: 

---

## Card 33

- **Heading**: `// TUTORIAL 33 / 57`
- **Card sits**: middle of the screen; **BOT**: resting
- **Buttons**: EXIT, BACK, NEXT

**Says:**

> RULES & RECORDS opens as a card over the game, with its tabs along the top.

- **Asks you to**: Tap NEXT.
- **Lights up**: nothing
- **Notes**: 

---

## Card 34

- **Heading**: `// TUTORIAL 34 / 57`
- **Card sits**: middle of the screen; **BOT**: resting
- **Buttons**: EXIT, BACK, NEXT

**Says:**

> The RULES tab has everything you’re learning here, written down, with the TUTORIAL button to come back any time.

- **Asks you to**: Tap NEXT.
- **Lights up**: the drop button(s) for the allowed column(s)
- **Notes**: 

---

## Card 35

- **Heading**: `// TUTORIAL 35 / 57`
- **Card sits**: middle of the screen; **BOT**: resting
- **Buttons**: EXIT, BACK, NEXT

**Says:**

> The RECORDS tab shows your level and DECRYPTOR rank, every unlock and its level, your achievements, HISTORY (your last 10 games) and your lifetime stats.

- **Asks you to**: Tap NEXT.
- **Lights up**: the drop button(s) for the allowed column(s)
- **Notes**: 

---

## Card 36

- **Heading**: `// TUTORIAL 36 / 57`
- **Card sits**: middle of the screen; **BOT**: resting
- **Buttons**: EXIT, BACK, NEXT

**Says:**

> Every bit you decrypt is XP: 100 bits a level. At Lv 80 you can RANK UP: everything locks again to unlock once more, and each rank earns a little more.

- **Asks you to**: Tap NEXT.
- **Lights up**: nothing
- **Notes**: 

---

## Card 37

- **Heading**: `// TUTORIAL 37 / 57`
- **Card sits**: middle of the screen; **BOT**: resting
- **Buttons**: EXIT, BACK, NEXT

**Says:**

> NOTICES, the next tab, keeps every notice the game has shown you.

- **Asks you to**: Tap NEXT.
- **Lights up**: has-unread
- **Notes**: 

---

## Card 38

- **Heading**: `// TUTORIAL 38 / 57`
- **Card sits**: middle of the screen; **BOT**: resting
- **Buttons**: EXIT, BACK

**Says:**

> Tapping outside a card won’t close it: tap ← BACK, at the top left of the card.

- **Asks you to**: Tap ← BACK.
- **Lights up**: ← BACK
- **Notes**: 

---

## Card 39

- **Heading**: `// TUTORIAL 39 / 57`
- **Card sits**: bottom of the screen; **BOT**: resting
- **Buttons**: EXIT, BACK

**Says:**

> Now tap EXPLOITS.

- **Asks you to**: Tap EXPLOITS on the pause screen.
- **Lights up**: EXPLOITS on the pause screen
- **Notes**: 

---

## Card 40

- **Heading**: `// TUTORIAL 40 / 57`
- **Card sits**: bottom of the screen; **BOT**: resting
- **Buttons**: EXIT, BACK, NEXT

**Says:**

> EXPLOITS is your loadout. You can only earn exploits that are in a slot: SLOTS, at the top, counts the slots you’ve filled and the ones you have.

- **Asks you to**: Tap NEXT.
- **Lights up**: SLOTS
- **Notes**: 

---

## Card 41

- **Heading**: `// TUTORIAL 41 / 57`
- **Card sits**: bottom of the screen; **BOT**: resting
- **Buttons**: EXIT, BACK, NEXT

**Says:**

> Tap a card to put it in a free slot, or tap it again to take it out. The loadout locks from a game’s first drop until it ends.

- **Asks you to**: Tap NEXT.
- **Lights up**: the exploit cards
- **Notes**: 

---

## Card 42

- **Heading**: `// TUTORIAL 42 / 57`
- **Card sits**: bottom of the screen; **BOT**: resting
- **Buttons**: EXIT, BACK, NEXT

**Says:**

> The first three exploits are yours as they unlock. The rest are bought once with resources and kept until you RANK UP.

- **Asks you to**: Tap NEXT.
- **Lights up**: nothing
- **Notes**: 

---

## Card 43

- **Heading**: `// TUTORIAL 43 / 57`
- **Card sits**: middle of the screen; **BOT**: resting
- **Buttons**: EXIT, BACK

**Says:**

> Tap ← BACK to close it.

- **Asks you to**: Tap ← BACK.
- **Lights up**: ← BACK
- **Notes**: 

---

## Card 44

- **Heading**: `// TUTORIAL 44 / 57`
- **Card sits**: bottom of the screen; **BOT**: resting
- **Buttons**: EXIT, BACK, NEXT

**Says:**

> The STORE isn’t on the pause screen: it’s on the MAIN MENU. Here’s a look inside.

- **Asks you to**: Tap NEXT.
- **Opens**: the STORE, on its own (the pause screen has no STORE button)
- **Notes**: 

---

## Card 45

- **Heading**: `// TUTORIAL 45 / 57`
- **Card sits**: bottom of the screen; **BOT**: resting
- **Buttons**: EXIT, BACK, NEXT

**Says:**

> YOUR RESOURCES are at the top: KEYS, BUGS, CACHE, CRYPTO, ROOTKITS and MASTER KEYS, all earned by playing. The [i] shows how.

- **Asks you to**: Tap NEXT.
- **Lights up**: YOUR RESOURCES
- **Notes**: 

---

## Card 46

- **Heading**: `// TUTORIAL 46 / 57`
- **Card sits**: bottom of the screen; **BOT**: resting
- **Buttons**: EXIT, BACK, NEXT

**Says:**

> Under them, PRICES TODAY: sales, holidays and busy days move the prices up and down.

- **Asks you to**: Tap NEXT.
- **Lights up**: the PRICES TODAY gauge
- **Notes**: 

---

## Card 47

- **Heading**: `// TUTORIAL 47 / 57`
- **Card sits**: bottom of the screen; **BOT**: resting
- **Buttons**: EXIT, BACK, NEXT

**Says:**

> Below that: the DAILY DROP (free once a day), PATCHES, STARTER EXPLOITS, BLACK BOXES, and REMOVE ADS and FULL ACCESS.

- **Asks you to**: Tap NEXT.
- **Lights up**: nothing
- **Notes**: 

---

## Card 48

- **Heading**: `// TUTORIAL 48 / 57`
- **Card sits**: middle of the screen; **BOT**: resting
- **Buttons**: EXIT, BACK

**Says:**

> Tap ← BACK to close the STORE.

- **Asks you to**: Tap ← BACK.
- **Lights up**: ← BACK
- **Notes**: 

---

## Card 49

- **Heading**: `// TUTORIAL 49 / 57`
- **Card sits**: bottom of the screen; **BOT**: resting
- **Buttons**: EXIT, BACK

**Says:**

> Now tap SETTINGS.

- **Asks you to**: Tap SETTINGS on the pause screen.
- **Lights up**: SETTINGS on the pause screen
- **Notes**: 

---

## Card 50

- **Heading**: `// TUTORIAL 50 / 57`
- **Card sits**: middle of the screen; **BOT**: resting
- **Buttons**: EXIT, BACK, NEXT

**Says:**

> SETTINGS has SOUND (sound and music, the sound effects, what you’re listening on), the PLAYLIST and MUSIC PLAYER, and CONTROLS (where the drop buttons sit, vibration).

- **Asks you to**: Tap NEXT.
- **Lights up**: nothing
- **Notes**: 

---

## Card 51

- **Heading**: `// TUTORIAL 51 / 57`
- **Card sits**: middle of the screen; **BOT**: resting
- **Buttons**: EXIT, BACK, NEXT

**Says:**

> DISPLAY has THEMES and FONTS (more unlock as you level up), the CRT DISPLAY, text size and REDUCED EFFECTS. EXTRAS has the wandering bots and the screen saver.

- **Asks you to**: Tap NEXT.
- **Lights up**: nothing
- **Notes**: 

---

## Card 52

- **Heading**: `// TUTORIAL 52 / 57`
- **Card sits**: middle of the screen; **BOT**: resting
- **Buttons**: EXIT, BACK

**Says:**

> Tap ← BACK to close SETTINGS.

- **Asks you to**: Tap ← BACK.
- **Lights up**: ← BACK
- **Notes**: 

---

## Card 53

- **Heading**: `// TUTORIAL 53 / 57`
- **Card sits**: bottom of the screen; **BOT**: resting
- **Buttons**: EXIT, BACK

**Says:**

> And RESUME to get back to the game.

- **Asks you to**: Tap RESUME on the pause screen.
- **Lights up**: RESUME on the pause screen
- **Notes**: 

---

## Card 54

- **Heading**: `// TUTORIAL 54 / 57`
- **Card sits**: top of the board; **BOT**: resting
- **Buttons**: EXIT, BACK, NEXT

**Says:**

> In CLASSIC, every game has a key to crack: its ENCRYPTION STRENGTH, shown under BYTEFALL. It starts at 128-BIT, cracked at 1,500 points on NORMAL.

- **Asks you to**: Tap NEXT.
- **Lights up**: the line under BYTEFALL
- **Notes**: 

---

## Card 55

- **Heading**: `// TUTORIAL 55 / 57`
- **Card sits**: top of the board; **BOT**: happy
- **Buttons**: EXIT, BACK, NEXT

**Says:**

> The bar along the bottom of SCORE fills toward it. Crack it for KEYS, then GO DEEPER for a stronger key and more KEYS, or DISCONNECT and end the game on a win.

- **Asks you to**: Tap NEXT.
- **Lights up**: the bar along SCORE
- **Notes**: 

---

## Card 56

- **Heading**: `// TUTORIAL 56 / 57`
- **Card sits**: top of the board; **BOT**: resting
- **Buttons**: EXIT, BACK, NEXT

**Says:**

> Before a game, PATCHES and STARTERS on the main menu let you bring an edge in, once you have some.

- **Asks you to**: Tap NEXT.
- **Lights up**: nothing
- **Notes**: 

---

## Card 57

- **Heading**: `// TUTORIAL 57 / 57`
- **Card sits**: top of the board; **BOT**: happy
- **Buttons**: EXIT, BACK, MAIN MENU

**Says:**

> That’s everything you need to know. Good luck, decryptor.

- **Asks you to**: Tap MAIN MENU (out to the main menu).
- **Lights up**: nothing
- **Notes**: 
