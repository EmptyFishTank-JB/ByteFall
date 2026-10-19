# ByteFall tutorial: every card, for review

The TUTORIAL as it is in the game now (v641), and RULES' own lessons, recorded by playing each through:
what each card says (word for word), what it opens, what it asks, what lights up, the board and bits it
sets up, and after a drop its explanation and the points it shows. Write anything you'd change on a
card's **Notes** line.

The lessons live in `js/tutorial.js` (`LESSONS`). Everything from **Welcome** down is written by
`node tools/tutorial-doc.js`, which plays every lesson through in a headless browser: run it after
changing a card, and this page matches the game again (this intro is kept as it is).

## What changed this round

- **The TUTORIAL is only how the game is played**: the welcome, then the terminal and its bits through
  the WORM VIRUS, and MAIN MENU (26 cards, from 61). The bottom row, the menus, the STORE and SETTINGS
  are out of it.
- **RULES is a folder per section**, each opening its own page, and most pages have a **TUTORIAL** of
  their own: THE BASICS, SCORING, LAYERS AND THE LINE and EXPLOITS (the TUTORIAL's own parts, EXPLOITS
  going on to the loadout), and what came out of the TUTORIAL: THE BOTTOM ROW, RULES & RECORDS, THE STORE
  and SETTINGS. Each ends on a card whose RULES button goes back to its page. They're listed after the
  TUTORIAL's cards, under **RULES' own lessons**.
- **LAYERS AND THE LINE** on its own starts with the CHAIN METER at 3 bars, as the chain lesson leaves it,
  so the layer's two links still fill it.

## How every card works

- **The card**: `// TUTORIAL` (no card number or count in the game: the numbers here are for review only) and **EXIT** in its top row, BOT's face
  beside the words, its buttons under the frame. The words type out with a blip of BOT's voice.
- **BACK** (every card after the welcome): after a drop, the same card again; otherwise the card before,
  the board and score put back as they were. **NEXT / BEGIN** on cards that only explain.
- **A tap card** dims the screen but for what to tap, framed. **A drop card** dims the other columns; a drop in
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

> Welcome to BYTEFALL! This tutorial shows you how the game is played. Each card is short, and there’s no math needed as long as you can count to 7. Let’s begin!

- **Asks you to**: Tap BEGIN.
- **Lights up**: nothing
- **Notes**: 

---

## Card 1

- **Heading**: `// TUTORIAL`
- **Card sits**: under the board's middle; **BOT**: resting
- **Buttons**: EXIT, BACK, NEXT

**Says:**

> This grid is called the TERMINAL. You’ll be dropping encrypted bits into its columns.

- **Asks you to**: Tap NEXT.
- **Lights up**: nothing
- **Notes**: 

---

## Card 2

- **Heading**: `// TUTORIAL`
- **Card sits**: under the board's middle; **BOT**: resting
- **Buttons**: EXIT, BACK, NEXT

**Says:**

> Encrypted bits are the numbered blocks with brackets: [1] [2] [3] [4] [5] [6] [7]

- **Asks you to**: Tap NEXT.
- **Lights up**: nothing
- **Notes**: 

---

## Card 3

- **Heading**: `// TUTORIAL`
- **Card sits**: top of the board; **BOT**: resting
- **Buttons**: EXIT, BACK
- **Bits**: CURRENT [3], then [2]
- **Board**:

```
 .  .  .  . [3][5] . 
```

**Says:**

> This flashing panel with the bright border shows your CURRENT bit, [3]: the one your next drop puts into a column. Tap the CURRENT panel!

- **Asks you to**: Tap the CURRENT panel.
- **Lights up**: the CURRENT panel (in focus)
- **Notes**: 

---

## Card 4

- **Heading**: `// TUTORIAL`
- **Card sits**: top of the board; **BOT**: resting
- **Buttons**: EXIT, BACK, NEXT

**Says:**

> A bit clears when its number matches the exact number of bits in the row or column it sits in. Clearing bits is called DECRYPTING.

- **Asks you to**: Tap NEXT.
- **Lights up**: nothing
- **Notes**: 

---

## Card 5

- **Heading**: `// TUTORIAL`
- **Card sits**: top of the board; **BOT**: resting, then resting after the drop
- **Buttons**: EXIT, BACK

**Says:**

> Drop a bit by tapping a number button below, or the column itself. Drop the [3] into column 4 or 7, next to the [3] and [5].

- **Asks you to**: Drop into column 4 or 7.
- **Lights up**: the block in column 5, 1st from the bottom, the block in column 6, 1st from the bottom and the drop buttons for column 4 or 7

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

- **Heading**: `// TUTORIAL`
- **Card sits**: top of the board; **BOT**: resting, then resting after the drop
- **Buttons**: EXIT, BACK

**Says:**

> Now a column. Drop the [2] on top of the [5] in column 6.

- **Asks you to**: Drop into column 6.
- **Lights up**: the block in column 6, 1st from the bottom and the drop button for column 6

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

- **Heading**: `// TUTORIAL`
- **Card sits**: top of the board; **BOT**: resting
- **Buttons**: EXIT, BACK, NEXT

**Says:**

> Each decrypted bit scores 10 points plus its number: a [1] is worth 11, a [2] 12, and a [7] 17.

- **Asks you to**: Tap NEXT.
- **Lights up**: nothing
- **Notes**: 

---

## Card 8

- **Heading**: `// TUTORIAL`
- **Card sits**: top of the board; **BOT**: resting
- **Buttons**: EXIT, BACK

**Says:**

> Your SCORE is at the left of the panels up top, under your BEST. Tap SCORE!

- **Asks you to**: Tap SCORE.
- **Lights up**: SCORE (in focus)
- **Notes**: 

---

## Card 9

- **Heading**: `// TUTORIAL`
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

- **Heading**: `// TUTORIAL`
- **Card sits**: top of the board; **BOT**: resting, then happy after the drop
- **Buttons**: EXIT, BACK

**Says:**

> The first link scores normal points, the second link doubles (2x), the third triples (3x), and so on. Drop the [2] into column 6.

- **Asks you to**: Drop into column 6.
- **Lights up**: the block in column 6, 1st from the bottom, the block in column 4, 2nd from the bottom, the block in column 7, 2nd from the bottom and the drop button for column 6

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

- **Heading**: `// TUTORIAL`
- **Card sits**: top of the board; **BOT**: happy
- **Buttons**: EXIT, BACK, NEXT

**Says:**

> Decrypting 4 bits in one drop is a NIBBLE, worth 16 bonus points. You just made one!

- **Asks you to**: Tap NEXT.
- **Lights up**: nothing
- **Notes**: 

---

## Card 12

- **Heading**: `// TUTORIAL`
- **Card sits**: top of the board; **BOT**: resting
- **Buttons**: EXIT, BACK

**Says:**

> CHAIN, at the right of the panels up top, shows how long your last chain was. Tap CHAIN.

- **Asks you to**: Tap CHAIN.
- **Lights up**: CHAIN (in focus)
- **Notes**: 

---

## Card 13

- **Heading**: `// TUTORIAL`
- **Card sits**: top of the board; **BOT**: resting
- **Buttons**: EXIT, BACK, NEXT

**Says:**

> The bars on each side of the grid are the CHAIN METER. Each link lights a bar, and the meter stays charged from one drop to the next.

- **Asks you to**: Tap NEXT.
- **Lights up**: the CHAIN METER
- **Notes**: 

---

## Card 14

- **Heading**: `// TUTORIAL`
- **Card sits**: top of the board; **BOT**: resting
- **Buttons**: EXIT, BACK, NEXT

**Says:**

> Fill all 5 bars to earn an EXPLOIT. A drop that clears nothing ends the streak, and the meter resets.

- **Asks you to**: Tap NEXT.
- **Lights up**: the CHAIN METER
- **Notes**: 

---

## Card 15

- **Heading**: `// TUTORIAL`
- **Card sits**: top of the board; **BOT**: resting
- **Buttons**: EXIT, BACK, NEXT
- **Bits**: CURRENT [2], then [2]
- **CHAIN METER**: 3 bars lit as it begins
- **Board**:

```
 .  .  . [=] .  .  . 
```

**Says:**

> This [=] is an ENCRYPTION LAYER. Decrypt a bit right next to it to peel it.

- **Asks you to**: Tap NEXT.
- **Lights up**: the block in column 4, 1st from the bottom
- **Notes**: 

---

## Card 16

- **Heading**: `// TUTORIAL`
- **Card sits**: top of the board; **BOT**: resting, then resting after the drop
- **Buttons**: EXIT, BACK

**Says:**

> Drop the [2] into column 3, 4 or 5: beside the layer or on top of it, the two of them make a line of 2.

- **Asks you to**: Drop into column 3 or 4 or 5.
- **Lights up**: the block in column 4, 1st from the bottom and the drop buttons for column 3 or 4 or 5

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

- **Heading**: `// TUTORIAL`
- **Card sits**: top of the board; **BOT**: resting, then happy after the drop
- **Buttons**: EXIT, BACK

**Says:**

> Drop the next [2] into column 3, 4 or 5 to peel the layer a second time.

- **Asks you to**: Drop into column 3 or 4 or 5.
- **Lights up**: the block in column 4, 1st from the bottom and the drop buttons for column 3 or 4 or 5

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

- **Heading**: `// TUTORIAL`
- **Card sits**: top of the board; **BOT**: happy
- **Buttons**: EXIT, BACK, NEXT

**Says:**

> Those 2 links filled the CHAIN METER (3 + 1 + 2 = 6), so you earned an EXPLOIT!

- **Asks you to**: Tap NEXT.
- **Lights up**: nothing
- **Notes**: 

---

## Card 19

- **Heading**: `// TUTORIAL`
- **Card sits**: under the board's middle; **BOT**: worried
- **Buttons**: EXIT, BACK, NEXT

**Says:**

> Keep every column below this ======== line. If anything is still above it once the decrypting stops, the trace completes and the game is over.

- **Asks you to**: Tap NEXT.
- **Lights up**: the ======== line
- **Notes**: 

---

## Card 20

- **Heading**: `// TUTORIAL`
- **Card sits**: top of the board; **BOT**: resting
- **Buttons**: EXIT, BACK

**Says:**

> A new row of layers rises from the bottom every 8 drops, pushing everything up. ENCRYPT IN, just above CHAIN, counts down the drops to the next one. Tap it.

- **Asks you to**: Tap ENCRYPT IN.
- **Lights up**: ENCRYPT IN (in focus)
- **Notes**: 

---

## Card 21

- **Heading**: `// TUTORIAL`
- **Card sits**: top of the board; **BOT**: devious
- **Buttons**: EXIT, BACK, NEXT
- **Waiting in the EXPLOIT button**: WORM VIRUS
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

- **Heading**: `// TUTORIAL`
- **Card sits**: top of the board; **BOT**: devious
- **Buttons**: EXIT, BACK

**Says:**

> Tap the EXPLOIT button to use yours. It’s a WORM VIRUS!

- **Asks you to**: Tap the EXPLOIT button.
- **Lights up**: the EXPLOIT button (in focus)
- **Notes**: 

---

## Card 23

- **Heading**: `// TUTORIAL`
- **Card sits**: top of the board; **BOT**: devious, then happy after the drop
- **Buttons**: EXIT, BACK

**Says:**

> The WORM VIRUS is armed as your CURRENT, and it drops like a bit. Drop it into column 3, the tall one: it wipes out every block in that column.

- **Asks you to**: Drop into column 3.
- **Lights up**: the block in column 3, 1st from the bottom, the block in column 3, 2nd from the bottom, the block in column 3, 3rd from the bottom, the block in column 3, 4th from the bottom and the drop button for column 3

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

- **Heading**: `// TUTORIAL`
- **Card sits**: top of the board; **BOT**: resting
- **Buttons**: EXIT, BACK, NEXT

**Says:**

> Other exploits do different things. Each one has a card in the EXPLOITS menu.

- **Asks you to**: Tap NEXT.
- **Lights up**: nothing
- **Notes**: 

---

## Card 25

- **Heading**: `// TUTORIAL`
- **Card sits**: top of the board; **BOT**: happy
- **Buttons**: EXIT, BACK, MAIN MENU

**Says:**

> That’s how BYTEFALL is played. RULES has a page for everything else, most with a short TUTORIAL of their own. Good luck, decryptor.

- **Asks you to**: Tap MAIN MENU (out to the main menu).
- **Lights up**: nothing
- **Notes**: MAIN MENU ends the lesson and earns HELLO, WORLD (an achievement, +10 KEYS).

---

# RULES' own lessons

Each section's page in RULES has its own TUTORIAL button (where it has one): the lesson below, then RULES back to that page.

## THE BASICS

### Card 1

- **Heading**: `// TUTORIAL`
- **Card sits**: under the board's middle; **BOT**: resting
- **Buttons**: EXIT, NEXT

**Says:**

> This grid is called the TERMINAL. You’ll be dropping encrypted bits into its columns.

- **Asks you to**: Tap NEXT.
- **Lights up**: nothing
- **Notes**: 

---

### Card 2

- **Heading**: `// TUTORIAL`
- **Card sits**: under the board's middle; **BOT**: resting
- **Buttons**: EXIT, BACK, NEXT

**Says:**

> Encrypted bits are the numbered blocks with brackets: [1] [2] [3] [4] [5] [6] [7]

- **Asks you to**: Tap NEXT.
- **Lights up**: nothing
- **Notes**: 

---

### Card 3

- **Heading**: `// TUTORIAL`
- **Card sits**: top of the board; **BOT**: resting
- **Buttons**: EXIT, BACK
- **Bits**: CURRENT [3], then [2]
- **Board**:

```
 .  .  .  . [3][5] . 
```

**Says:**

> This flashing panel with the bright border shows your CURRENT bit, [3]: the one your next drop puts into a column. Tap the CURRENT panel!

- **Asks you to**: Tap the CURRENT panel.
- **Lights up**: the CURRENT panel (in focus)
- **Notes**: 

---

### Card 4

- **Heading**: `// TUTORIAL`
- **Card sits**: top of the board; **BOT**: resting
- **Buttons**: EXIT, BACK, NEXT

**Says:**

> A bit clears when its number matches the exact number of bits in the row or column it sits in. Clearing bits is called DECRYPTING.

- **Asks you to**: Tap NEXT.
- **Lights up**: nothing
- **Notes**: 

---

### Card 5

- **Heading**: `// TUTORIAL`
- **Card sits**: top of the board; **BOT**: resting, then resting after the drop
- **Buttons**: EXIT, BACK

**Says:**

> Drop a bit by tapping a number button below, or the column itself. Drop the [3] into column 4 or 7, next to the [3] and [5].

- **Asks you to**: Drop into column 4 or 7.
- **Lights up**: the block in column 5, 1st from the bottom, the block in column 6, 1st from the bottom and the drop buttons for column 4 or 7

**After the drop, says:**

> BOOM! Both [3]s were DECRYPTED: the row was made 3 bits long. The [5] stays, since it isn’t in a row or column 5 bits long.

**Points shown:**

```
[3][3] 13+13 ×1 = 26
```
- **Score after**: 26
- **Notes**: 

---

### Card 6

- **Heading**: `// TUTORIAL`
- **Card sits**: top of the board; **BOT**: resting, then resting after the drop
- **Buttons**: EXIT, BACK

**Says:**

> Now a column. Drop the [2] on top of the [5] in column 6.

- **Asks you to**: Drop into column 6.
- **Lights up**: the block in column 6, 1st from the bottom and the drop button for column 6

**After the drop, says:**

> Nice! The column was made 2 bits tall, so the [2] was DECRYPTED.

**Points shown:**

```
[2] 12 ×1 = 12
```
- **Score after**: 38
- **Notes**: 

---

### Card 7

- **Heading**: `// TUTORIAL`
- **Card sits**: top of the board; **BOT**: happy
- **Buttons**: EXIT, BACK, RULES

**Says:**

> That’s THE BASICS. Its page in RULES has it all written down.

- **Asks you to**: Tap RULES (back to its page in RULES).
- **Lights up**: nothing
- **Notes**: RULES ends the lesson and opens its section's page in RULES (EXIT does too).

---

## SCORING

### Card 1

- **Heading**: `// TUTORIAL`
- **Card sits**: top of the board; **BOT**: resting
- **Buttons**: EXIT, NEXT

**Says:**

> Each decrypted bit scores 10 points plus its number: a [1] is worth 11, a [2] 12, and a [7] 17.

- **Asks you to**: Tap NEXT.
- **Lights up**: nothing
- **Notes**: 

---

### Card 2

- **Heading**: `// TUTORIAL`
- **Card sits**: top of the board; **BOT**: resting
- **Buttons**: EXIT, BACK

**Says:**

> Your SCORE is at the left of the panels up top, under your BEST. Tap SCORE!

- **Asks you to**: Tap SCORE.
- **Lights up**: SCORE (in focus)
- **Notes**: 

---

### Card 3

- **Heading**: `// TUTORIAL`
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

### Card 4

- **Heading**: `// TUTORIAL`
- **Card sits**: top of the board; **BOT**: resting, then happy after the drop
- **Buttons**: EXIT, BACK

**Says:**

> The first link scores normal points, the second link doubles (2x), the third triples (3x), and so on. Drop the [2] into column 6.

- **Asks you to**: Drop into column 6.
- **Lights up**: the block in column 6, 1st from the bottom, the block in column 4, 2nd from the bottom, the block in column 7, 2nd from the bottom and the drop button for column 6

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
- **Score after**: 132
- **Notes**: 

---

### Card 5

- **Heading**: `// TUTORIAL`
- **Card sits**: top of the board; **BOT**: happy
- **Buttons**: EXIT, BACK, NEXT

**Says:**

> Decrypting 4 bits in one drop is a NIBBLE, worth 16 bonus points. You just made one!

- **Asks you to**: Tap NEXT.
- **Lights up**: nothing
- **Notes**: 

---

### Card 6

- **Heading**: `// TUTORIAL`
- **Card sits**: top of the board; **BOT**: resting
- **Buttons**: EXIT, BACK

**Says:**

> CHAIN, at the right of the panels up top, shows how long your last chain was. Tap CHAIN.

- **Asks you to**: Tap CHAIN.
- **Lights up**: CHAIN (in focus)
- **Notes**: 

---

### Card 7

- **Heading**: `// TUTORIAL`
- **Card sits**: top of the board; **BOT**: resting
- **Buttons**: EXIT, BACK, NEXT

**Says:**

> The bars on each side of the grid are the CHAIN METER. Each link lights a bar, and the meter stays charged from one drop to the next.

- **Asks you to**: Tap NEXT.
- **Lights up**: the CHAIN METER
- **Notes**: 

---

### Card 8

- **Heading**: `// TUTORIAL`
- **Card sits**: top of the board; **BOT**: resting
- **Buttons**: EXIT, BACK, NEXT

**Says:**

> Fill all 5 bars to earn an EXPLOIT. A drop that clears nothing ends the streak, and the meter resets.

- **Asks you to**: Tap NEXT.
- **Lights up**: the CHAIN METER
- **Notes**: 

---

### Card 9

- **Heading**: `// TUTORIAL`
- **Card sits**: top of the board; **BOT**: happy
- **Buttons**: EXIT, BACK, RULES

**Says:**

> That’s SCORING. Its page in RULES has it all written down.

- **Asks you to**: Tap RULES (back to its page in RULES).
- **Lights up**: nothing
- **Notes**: RULES ends the lesson and opens its section's page in RULES (EXIT does too).

---

## LAYERS AND THE LINE

### Card 1

- **Heading**: `// TUTORIAL`
- **Card sits**: top of the board; **BOT**: resting
- **Buttons**: EXIT, NEXT
- **Bits**: CURRENT [2], then [2]
- **CHAIN METER**: 3 bars lit as it begins
- **Board**:

```
 .  .  . [=] .  .  . 
```

**Says:**

> This [=] is an ENCRYPTION LAYER. Decrypt a bit right next to it to peel it.

- **Asks you to**: Tap NEXT.
- **Lights up**: the block in column 4, 1st from the bottom
- **Notes**: 

---

### Card 2

- **Heading**: `// TUTORIAL`
- **Card sits**: top of the board; **BOT**: resting, then resting after the drop
- **Buttons**: EXIT, BACK

**Says:**

> Drop the [2] into column 3, 4 or 5: beside the layer or on top of it, the two of them make a line of 2.

- **Asks you to**: Drop into column 3 or 4 or 5.
- **Lights up**: the block in column 4, 1st from the bottom and the drop buttons for column 3 or 4 or 5

**After the drop, says:**

> The [2] decrypted and peeled the layer once: [=] is cracked now, [-]. That was one more link for the CHAIN METER: 4 bars lit.

**Points shown:**

```
[2] 12 ×1 = 12
```
- **Score after**: 12
- **Notes**: 

---

### Card 3

- **Heading**: `// TUTORIAL`
- **Card sits**: top of the board; **BOT**: resting, then happy after the drop
- **Buttons**: EXIT, BACK

**Says:**

> Drop the next [2] into column 3, 4 or 5 to peel the layer a second time.

- **Asks you to**: Drop into column 3 or 4 or 5.
- **Lights up**: the block in column 4, 1st from the bottom and the drop buttons for column 3 or 4 or 5

**After the drop, says:**

> The second peel broke the layer open and revealed the bit under it: a [1], alone in a line of 1, so it decrypted too, as the chain’s second link.

**Points shown:**

```
[2] 12 ×1 = 12
[1] 11 ×2 = 22
TOTAL +34
```
- **Score after**: 46
- **Notes**: 

---

### Card 4

- **Heading**: `// TUTORIAL`
- **Card sits**: top of the board; **BOT**: happy
- **Buttons**: EXIT, BACK, NEXT

**Says:**

> Those 2 links filled the CHAIN METER (3 + 1 + 2 = 6), so you earned an EXPLOIT!

- **Asks you to**: Tap NEXT.
- **Lights up**: nothing
- **Notes**: 

---

### Card 5

- **Heading**: `// TUTORIAL`
- **Card sits**: under the board's middle; **BOT**: worried
- **Buttons**: EXIT, BACK, NEXT

**Says:**

> Keep every column below this ======== line. If anything is still above it once the decrypting stops, the trace completes and the game is over.

- **Asks you to**: Tap NEXT.
- **Lights up**: the ======== line
- **Notes**: 

---

### Card 6

- **Heading**: `// TUTORIAL`
- **Card sits**: top of the board; **BOT**: resting
- **Buttons**: EXIT, BACK

**Says:**

> A new row of layers rises from the bottom every 8 drops, pushing everything up. ENCRYPT IN, just above CHAIN, counts down the drops to the next one. Tap it.

- **Asks you to**: Tap ENCRYPT IN.
- **Lights up**: ENCRYPT IN (in focus)
- **Notes**: 

---

### Card 7

- **Heading**: `// TUTORIAL`
- **Card sits**: top of the board; **BOT**: happy
- **Buttons**: EXIT, BACK, RULES

**Says:**

> That’s LAYERS AND THE LINE. Its page in RULES has it all written down.

- **Asks you to**: Tap RULES (back to its page in RULES).
- **Lights up**: nothing
- **Notes**: RULES ends the lesson and opens its section's page in RULES (EXIT does too).

---

## EXPLOITS

### Card 1

- **Heading**: `// TUTORIAL`
- **Card sits**: top of the board; **BOT**: devious
- **Buttons**: EXIT, NEXT
- **Waiting in the EXPLOIT button**: WORM VIRUS
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

### Card 2

- **Heading**: `// TUTORIAL`
- **Card sits**: top of the board; **BOT**: devious
- **Buttons**: EXIT, BACK

**Says:**

> Tap the EXPLOIT button to use yours. It’s a WORM VIRUS!

- **Asks you to**: Tap the EXPLOIT button.
- **Lights up**: the EXPLOIT button (in focus)
- **Notes**: 

---

### Card 3

- **Heading**: `// TUTORIAL`
- **Card sits**: top of the board; **BOT**: devious, then happy after the drop
- **Buttons**: EXIT, BACK

**Says:**

> The WORM VIRUS is armed as your CURRENT, and it drops like a bit. Drop it into column 3, the tall one: it wipes out every block in that column.

- **Asks you to**: Drop into column 3.
- **Lights up**: the block in column 3, 1st from the bottom, the block in column 3, 2nd from the bottom, the block in column 3, 3rd from the bottom, the block in column 3, 4th from the bottom and the drop button for column 3

**After the drop, says:**

> The WORM VIRUS wiped out the whole column. Blocks wiped out by an exploit score a flat 10 each.

**Points shown:**

```
+40
```
- **Score after**: 40
- **Notes**: 

---

### Card 4

- **Heading**: `// TUTORIAL`
- **Card sits**: top of the board; **BOT**: resting
- **Buttons**: EXIT, BACK, NEXT

**Says:**

> Other exploits do different things. Each one has a card in the EXPLOITS menu.

- **Asks you to**: Tap NEXT.
- **Lights up**: nothing
- **Notes**: 

---

### Card 5

- **Heading**: `// TUTORIAL`
- **Card sits**: top of the board; **BOT**: resting
- **Buttons**: EXIT, BACK

**Says:**

> The button at the top right PAUSES the game. Tap it now!

- **Asks you to**: Tap PAUSE, at the top right.
- **Lights up**: PAUSE, at the top right (in focus)
- **Notes**: 

---

### Card 6

- **Heading**: `// TUTORIAL`
- **Card sits**: the bottom of the screen, over the open page; **BOT**: resting
- **Buttons**: EXIT, BACK
- **Opens**: the pause screen

**Says:**

> The pause screen has various buttons. Tap EXPLOITS.

- **Asks you to**: Tap EXPLOITS on the pause screen.
- **Lights up**: EXPLOITS on the pause screen (in focus)
- **Notes**: 

---

### Card 7

- **Heading**: `// TUTORIAL`
- **Card sits**: the middle of the screen, over the open page; **BOT**: resting
- **Buttons**: EXIT, BACK, NEXT
- **Opens**: EXPLOITS (the loadout)

**Says:**

> Here’s your EXPLOITS loadout. You can only earn exploits that are in an active slot during a game.

- **Asks you to**: Tap NEXT.
- **Lights up**: the loadout slots (in focus)
- **Notes**: 

---

### Card 8

- **Heading**: `// TUTORIAL`
- **Card sits**: the bottom of the screen, over the open page; **BOT**: resting
- **Buttons**: EXIT, BACK, NEXT
- **Opens**: EXPLOITS (the loadout)

**Says:**

> Tap a card to put it in a free slot, or tap it again to take it out. The loadout locks from a game’s first drop until it ends.

- **Asks you to**: Tap NEXT.
- **Lights up**: the exploit cards
- **Notes**: 

---

### Card 9

- **Heading**: `// TUTORIAL`
- **Card sits**: the bottom of the screen, over the open page; **BOT**: resting
- **Buttons**: EXIT, BACK, NEXT
- **Opens**: EXPLOITS (the loadout)

**Says:**

> The first three exploits are yours as they unlock. The rest are bought once with resources and kept until you RANK UP.

- **Asks you to**: Tap NEXT.
- **Lights up**: nothing
- **Notes**: 

---

### Card 10

- **Heading**: `// TUTORIAL`
- **Card sits**: the middle of the screen, over the open page; **BOT**: resting
- **Buttons**: EXIT, BACK
- **Opens**: EXPLOITS (the loadout)

**Says:**

> Tap ← BACK.

- **Asks you to**: Tap ← BACK.
- **Lights up**: ← BACK (in focus)
- **Notes**: 

---

### Card 11

- **Heading**: `// TUTORIAL`
- **Card sits**: the bottom of the screen, over the open page; **BOT**: resting
- **Buttons**: EXIT, BACK
- **Opens**: the pause screen

**Says:**

> Tap RESUME to get back to the game.

- **Asks you to**: Tap RESUME on the pause screen.
- **Lights up**: RESUME on the pause screen (in focus)
- **Notes**: 

---

### Card 12

- **Heading**: `// TUTORIAL`
- **Card sits**: top of the board; **BOT**: happy
- **Buttons**: EXIT, BACK, RULES

**Says:**

> That’s EXPLOITS. Its page in RULES has it all written down.

- **Asks you to**: Tap RULES (back to its page in RULES).
- **Lights up**: nothing
- **Notes**: RULES ends the lesson and opens its section's page in RULES (EXIT does too).

---

## THE BOTTOM ROW

### Card 1

- **Heading**: `// TUTORIAL`
- **Card sits**: top of the board; **BOT**: resting
- **Buttons**: EXIT, NEXT

**Says:**

> The row under the drop buttons holds more than the EXPLOIT button: an EXPLOIT SLOT on each side of it, and a PATCH SLOT at each end.

- **Asks you to**: Tap NEXT.
- **Lights up**: the row under the drop buttons (in focus) and the bottom row's slots, shown locked (for the lesson)
- **Notes**: 

---

### Card 2

- **Heading**: `// TUTORIAL`
- **Card sits**: top of the board; **BOT**: resting
- **Buttons**: EXIT, BACK, NEXT

**Says:**

> They open as you level up. Until then, each one shows a padlock and the level it opens at.

- **Asks you to**: Tap NEXT.
- **Lights up**: the slots and the bottom row's slots, shown locked (for the lesson)
- **Notes**: 

---

### Card 3

- **Heading**: `// TUTORIAL`
- **Card sits**: top of the board; **BOT**: resting
- **Buttons**: EXIT, BACK, NEXT

**Says:**

> A PATCH SLOT sells a patch during a game, for KEYS and a resource or two, and the patch works the moment you buy it.

- **Asks you to**: Tap NEXT.
- **Lights up**: the PATCH SLOTS (in focus) and the bottom row's slots, shown locked (for the lesson)
- **Notes**: 

---

### Card 4

- **Heading**: `// TUTORIAL`
- **Card sits**: top of the board; **BOT**: resting
- **Buttons**: EXIT, BACK, NEXT

**Says:**

> The left and right EXPLOIT SLOTS can bring in a purchased EXPLOIT from the STORE. An empty slot becomes the BLACK MARKET once the first layer rises.

- **Asks you to**: Tap NEXT.
- **Lights up**: the EXPLOIT SLOTS (in focus) and a sample BLACK MARKET slot (for the lesson)
- **Notes**: 

---

### Card 5

- **Heading**: `// TUTORIAL`
- **Card sits**: top of the board; **BOT**: resting
- **Buttons**: EXIT, BACK, NEXT

**Says:**

> There, you can buy an EXPLOIT or a BLACK BOX. Each one is swapped for another every 4 drops. The pips in each button count down how many drops until the next one.

- **Asks you to**: Tap NEXT.
- **Lights up**: the BLACK MARKET slot and a sample BLACK MARKET slot (for the lesson)
- **Notes**: 

---

### Card 6

- **Heading**: `// TUTORIAL`
- **Card sits**: top of the board; **BOT**: devious
- **Buttons**: EXIT, BACK, NEXT

**Says:**

> BLACK BOXES are cheap, but some of them are INFECTED!

- **Asks you to**: Tap NEXT.
- **Lights up**: a sample BLACK MARKET slot (for the lesson)
- **Notes**: 

---

### Card 7

- **Heading**: `// TUTORIAL`
- **Card sits**: top of the board; **BOT**: happy
- **Buttons**: EXIT, BACK, RULES

**Says:**

> That’s THE BOTTOM ROW. Its page in RULES has it all written down.

- **Asks you to**: Tap RULES (back to its page in RULES).
- **Lights up**: nothing
- **Notes**: RULES ends the lesson and opens its section's page in RULES (EXIT does too).

---

## RULES & RECORDS

### Card 1

- **Heading**: `// TUTORIAL`
- **Card sits**: top of the board; **BOT**: resting
- **Buttons**: EXIT

**Says:**

> The button at the top right PAUSES the game. Tap it now!

- **Asks you to**: Tap PAUSE, at the top right.
- **Lights up**: PAUSE, at the top right (in focus)
- **Notes**: 

---

### Card 2

- **Heading**: `// TUTORIAL`
- **Card sits**: the bottom of the screen, over the open page; **BOT**: resting
- **Buttons**: EXIT, BACK
- **Opens**: the pause screen

**Says:**

> The pause screen has various buttons. Tap RULES & RECORDS.

- **Asks you to**: Tap RULES & RECORDS on the pause screen.
- **Lights up**: RULES & RECORDS on the pause screen (in focus)
- **Notes**: 

---

### Card 3

- **Heading**: `// TUTORIAL`
- **Card sits**: the middle of the screen, over the open page; **BOT**: resting
- **Buttons**: EXIT, BACK, NEXT
- **Opens**: RULES & RECORDS, on its RULES tab

**Says:**

> RULES & RECORDS opens this page with its tabs along the top.

- **Asks you to**: Tap NEXT.
- **Lights up**: nothing
- **Notes**: 

---

### Card 4

- **Heading**: `// TUTORIAL`
- **Card sits**: the middle of the screen, over the open page; **BOT**: resting
- **Buttons**: EXIT, BACK, NEXT
- **Opens**: RULES & RECORDS, on its RULES tab

**Says:**

> The RULES tab has a page for each part of the game, written down. Most have a short TUTORIAL of their own.

- **Asks you to**: Tap NEXT.
- **Lights up**: the RULES tab (in focus)
- **Notes**: 

---

### Card 5

- **Heading**: `// TUTORIAL`
- **Card sits**: the bottom of the screen, over the open page; **BOT**: resting
- **Buttons**: EXIT, BACK, NEXT
- **Opens**: RULES & RECORDS, on its RECORDS tab (UNLOCKS)

**Says:**

> The RECORDS tab has its own tabs: UNLOCKS (your level and every unlock), ACHIEVEMENTS, STATS (your lifetime numbers) and HISTORY (your last 10 games).

- **Asks you to**: Tap NEXT.
- **Lights up**: the RECORDS tab (in focus) and RECORDS' own tabs (UNLOCKS, ACHIEVEMENTS, STATS, HISTORY) (in focus)
- **Notes**: 

---

### Card 6

- **Heading**: `// TUTORIAL`
- **Card sits**: the bottom of the screen, over the open page; **BOT**: resting
- **Buttons**: EXIT, BACK, NEXT
- **Opens**: RULES & RECORDS, on its RECORDS tab (UNLOCKS)

**Says:**

> Every bit you decrypt is XP: 100 bits a level. At Lv 80 you can RANK UP: everything locks again to unlock once more, and each rank earns a little more.

- **Asks you to**: Tap NEXT.
- **Lights up**: the level and DECRYPTOR rank box (in focus)
- **Notes**: 

---

### Card 7

- **Heading**: `// TUTORIAL`
- **Card sits**: the bottom of the screen, over the open page; **BOT**: resting
- **Buttons**: EXIT, BACK, NEXT
- **Opens**: RULES & RECORDS, on its NOTICES tab

**Says:**

> NOTICES keeps a history of each notification the game has shown, newest at the top.

- **Asks you to**: Tap NEXT.
- **Lights up**: the NOTICES tab (in focus)
- **Notes**: 

---

### Card 8

- **Heading**: `// TUTORIAL`
- **Card sits**: the middle of the screen, over the open page; **BOT**: resting
- **Buttons**: EXIT, BACK
- **Opens**: RULES & RECORDS, on its NOTICES tab

**Says:**

> Tap ← BACK, at the top left of the page.

- **Asks you to**: Tap ← BACK.
- **Lights up**: ← BACK (in focus)
- **Notes**: 

---

### Card 9

- **Heading**: `// TUTORIAL`
- **Card sits**: the bottom of the screen, over the open page; **BOT**: resting
- **Buttons**: EXIT, BACK
- **Opens**: the pause screen

**Says:**

> Tap RESUME to get back to the game.

- **Asks you to**: Tap RESUME on the pause screen.
- **Lights up**: RESUME on the pause screen (in focus)
- **Notes**: 

---

### Card 10

- **Heading**: `// TUTORIAL`
- **Card sits**: top of the board; **BOT**: happy
- **Buttons**: EXIT, BACK, RULES

**Says:**

> That’s RULES & RECORDS. Its page in RULES has it all written down.

- **Asks you to**: Tap RULES (back to its page in RULES).
- **Lights up**: nothing
- **Notes**: RULES ends the lesson and opens its section's page in RULES (EXIT does too).

---

## THE STORE

### Card 1

- **Heading**: `// TUTORIAL`
- **Card sits**: the middle of the screen, over the open page; **BOT**: resting
- **Buttons**: EXIT, NEXT
- **Opens**: the STORE

**Says:**

> The STORE isn’t on the pause screen: it’s on the MAIN MENU. Here’s a look inside.

- **Asks you to**: Tap NEXT.
- **Lights up**: nothing
- **Notes**: 

---

### Card 2

- **Heading**: `// TUTORIAL`
- **Card sits**: the middle of the screen, over the open page; **BOT**: resting
- **Buttons**: EXIT, BACK, NEXT
- **Opens**: the STORE

**Says:**

> YOUR RESOURCES are at the top: KEYS, BUGS, CACHE, CRYPTO, ROOTKITS and MASTER KEYS, all earned by playing. The [i] shows how.

- **Asks you to**: Tap NEXT.
- **Lights up**: YOUR RESOURCES (in focus)
- **Notes**: 

---

### Card 3

- **Heading**: `// TUTORIAL`
- **Card sits**: the middle of the screen, over the open page; **BOT**: resting
- **Buttons**: EXIT, BACK, NEXT
- **Opens**: the STORE

**Says:**

> Under them, PRICES TODAY: sales, holidays and busy days move the prices up and down.

- **Asks you to**: Tap NEXT.
- **Lights up**: PRICES TODAY (in focus)
- **Notes**: 

---

### Card 4

- **Heading**: `// TUTORIAL`
- **Card sits**: the bottom of the screen, over the open page; **BOT**: resting
- **Buttons**: EXIT, BACK, NEXT
- **Opens**: the STORE, scrolled to the DAILY DROP

**Says:**

> The DAILY DROP: a free exploit, KEYS and resources, once a day. Every 7th day in a row you play, MASTER KEYS too.

- **Asks you to**: Tap NEXT.
- **Lights up**: the DAILY DROP (in focus)
- **Notes**: 

---

### Card 5

- **Heading**: `// TUTORIAL`
- **Card sits**: the bottom of the screen, over the open page; **BOT**: resting
- **Buttons**: EXIT, BACK, NEXT
- **Opens**: the STORE, scrolled to PATCHES

**Says:**

> PATCHES, bought with KEYS, give a game an edge. Switch on up to two from the main menu before a game.

- **Asks you to**: Tap NEXT.
- **Lights up**: PATCHES (in focus)
- **Notes**: 

---

### Card 6

- **Heading**: `// TUTORIAL`
- **Card sits**: the bottom of the screen, over the open page; **BOT**: resting
- **Buttons**: EXIT, BACK, NEXT
- **Opens**: the STORE, scrolled to TIER I EXPLOITS

**Says:**

> EXPLOITS of your own, in TIER I, II and III, to bring into a game from the main menu, up to two.

- **Asks you to**: Tap NEXT.
- **Lights up**: TIER I EXPLOITS (in focus)
- **Notes**: 

---

### Card 7

- **Heading**: `// TUTORIAL`
- **Card sits**: the bottom of the screen, over the open page; **BOT**: devious
- **Buttons**: EXIT, BACK, NEXT
- **Opens**: the STORE, scrolled to BLACK BOXES

**Says:**

> BLACK BOXES hold a random exploit for less, but some are INFECTED. The warning under them says what each infection does.

- **Asks you to**: Tap NEXT.
- **Lights up**: BLACK BOXES (in focus)
- **Notes**: 

---

### Card 8

- **Heading**: `// TUTORIAL`
- **Card sits**: the bottom of the screen, over the open page; **BOT**: resting
- **Buttons**: EXIT, BACK, NEXT
- **Opens**: the STORE, scrolled to SUPPORT THE GAME (REMOVE ADS, FULL ACCESS)

**Says:**

> And at the bottom, REMOVE ADS and FULL ACCESS. Everything else can be earned by playing.

- **Asks you to**: Tap NEXT.
- **Lights up**: SUPPORT THE GAME (REMOVE ADS, FULL ACCESS) (in focus)
- **Notes**: 

---

### Card 9

- **Heading**: `// TUTORIAL`
- **Card sits**: the middle of the screen, over the open page; **BOT**: resting
- **Buttons**: EXIT, BACK
- **Opens**: the STORE

**Says:**

> Tap ← BACK to close the STORE.

- **Asks you to**: Tap ← BACK.
- **Lights up**: ← BACK (in focus)
- **Notes**: 

---

### Card 10

- **Heading**: `// TUTORIAL`
- **Card sits**: the bottom of the screen, over the open page; **BOT**: resting
- **Buttons**: EXIT, BACK
- **Opens**: the pause screen

**Says:**

> Tap RESUME to get back to the game.

- **Asks you to**: Tap RESUME on the pause screen.
- **Lights up**: RESUME on the pause screen (in focus)
- **Notes**: 

---

### Card 11

- **Heading**: `// TUTORIAL`
- **Card sits**: over the main menu, from the top of the EXPLOITS / STORE row down; **BOT**: resting
- **Buttons**: EXIT, NEXT
- **Opens**: the main menu (CLASSIC's panel)

**Says:**

> Before a game, PATCHES and EXPLOITS on the main menu let you bring an edge in (up to two of each), once you have some.

- **Asks you to**: Tap NEXT.
- **Lights up**: PATCHES on the main menu (in focus) and EXPLOITS on the main menu (in focus)
- **Notes**: No BACK on this card: the lesson's board is gone.

---

### Card 12

- **Heading**: `// TUTORIAL`
- **Card sits**: over the main menu, from the top of the EXPLOITS / STORE row down; **BOT**: happy
- **Buttons**: EXIT, BACK, RULES
- **Opens**: the main menu (CLASSIC's panel)

**Says:**

> That’s THE STORE. Its page in RULES has it all written down.

- **Asks you to**: Tap RULES (back to its page in RULES).
- **Lights up**: nothing
- **Notes**: RULES ends the lesson and opens its section's page in RULES (EXIT does too).

---

## SETTINGS

### Card 1

- **Heading**: `// TUTORIAL`
- **Card sits**: top of the board; **BOT**: resting
- **Buttons**: EXIT

**Says:**

> The button at the top right PAUSES the game. Tap it now!

- **Asks you to**: Tap PAUSE, at the top right.
- **Lights up**: PAUSE, at the top right (in focus)
- **Notes**: 

---

### Card 2

- **Heading**: `// TUTORIAL`
- **Card sits**: the bottom of the screen, over the open page; **BOT**: resting
- **Buttons**: EXIT, BACK
- **Opens**: the pause screen

**Says:**

> The pause screen has various buttons. Tap SETTINGS.

- **Asks you to**: Tap SETTINGS on the pause screen.
- **Lights up**: SETTINGS on the pause screen (in focus)
- **Notes**: 

---

### Card 3

- **Heading**: `// TUTORIAL`
- **Card sits**: the middle of the screen, over the open page; **BOT**: resting
- **Buttons**: EXIT, BACK, NEXT
- **Opens**: SETTINGS, scrolled to the top of SETTINGS

**Says:**

> SETTINGS has SOUND (sound and music, the sound effects, what you’re listening on), the PLAYLIST and MUSIC PLAYER, and CONTROLS (where the drop buttons sit, vibration).

- **Asks you to**: Tap NEXT.
- **Lights up**: nothing
- **Notes**: 

---

### Card 4

- **Heading**: `// TUTORIAL`
- **Card sits**: the bottom of the screen, over the open page; **BOT**: resting
- **Buttons**: EXIT, BACK, NEXT
- **Opens**: SETTINGS, scrolled to DISPLAY

**Says:**

> DISPLAY has THEMES and FONTS (more unlock as you level up), the CRT DISPLAY, text size and REDUCED EFFECTS.

- **Asks you to**: Tap NEXT.
- **Lights up**: DISPLAY (in focus)
- **Notes**: 

---

### Card 5

- **Heading**: `// TUTORIAL`
- **Card sits**: the bottom of the screen, over the open page; **BOT**: resting
- **Buttons**: EXIT, BACK, NEXT
- **Opens**: SETTINGS, scrolled to EXTRAS

**Says:**

> EXTRAS has the wandering bots and the screen saver.

- **Asks you to**: Tap NEXT.
- **Lights up**: EXTRAS (in focus)
- **Notes**: 

---

### Card 6

- **Heading**: `// TUTORIAL`
- **Card sits**: the middle of the screen, over the open page; **BOT**: resting
- **Buttons**: EXIT, BACK
- **Opens**: SETTINGS

**Says:**

> Tap ← BACK to close SETTINGS.

- **Asks you to**: Tap ← BACK.
- **Lights up**: ← BACK (in focus)
- **Notes**: 

---

### Card 7

- **Heading**: `// TUTORIAL`
- **Card sits**: the bottom of the screen, over the open page; **BOT**: resting
- **Buttons**: EXIT, BACK
- **Opens**: the pause screen

**Says:**

> Tap RESUME to get back to the game.

- **Asks you to**: Tap RESUME on the pause screen.
- **Lights up**: RESUME on the pause screen (in focus)
- **Notes**: 

---

### Card 8

- **Heading**: `// TUTORIAL`
- **Card sits**: top of the board; **BOT**: happy
- **Buttons**: EXIT, BACK, RULES

**Says:**

> That’s SETTINGS. Its page in RULES has it all written down.

- **Asks you to**: Tap RULES (back to its page in RULES).
- **Lights up**: nothing
- **Notes**: RULES ends the lesson and opens its section's page in RULES (EXIT does too).

