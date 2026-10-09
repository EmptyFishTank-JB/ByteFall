# ByteFall tutorial: every card, for review

Every card of the TUTORIAL as the game shows it today (v537), in order: what it says (word for word),
what it asks the player to do, what lights up, the board and bits it sets up, and after a drop what it
says next and the points it shows. Recorded by playing the tutorial through, so the boards and points
are the game's own. Revise anything in place (the words, the order, cards to add or cut) and hand it
back; the **Notes** line on each card is yours.

The tutorial lives in `js/tutorial.js` (`STEPS`). It's reached from the main menu's TUTORIAL button and
from RULES → TUTORIAL.

## How every card works

- **The card**: a framed banner with `// TUTORIAL n / 26` (the welcome has no number) and **EXIT** in its
  top row, BOT's face beside the words, and its buttons under the frame.
- **The words** type out quickly with a little blip of BOT's voice every other letter, pausing at
  punctuation. A tap on the card shows the rest at once. The lesson never waits on the typing.
- **EXIT** (every card): leaves the tutorial for the main menu.
- **BACK** (every card after the welcome): after a drop, the same card again from its start; otherwise
  the card before. The board, bits, score and chain go back to how they were.
- **NEXT / BEGIN**: on cards that only explain. Cards that ask for a tap or a drop have no NEXT until
  it's done; a drop's card shows NEXT once its explanation is up.
- **A tap card** dims the whole screen a little except what to tap (and the card). What it's about pulses.
- **A drop card** dims the columns that aren't the lesson's. A drop anywhere else gets a denied sound,
  BOT's -_- face for a moment and a nudge of the card.
- **After a drop** the card's words change to what happened; once said, the points line(s) show under them.
- **The game around it**: set boards and set bits, no rising layers, nothing earned (no XP, KEYS or
  resources). The CHAIN METER keeps its charge from card 6 to card 13 (the chain lesson, the layer peels
  filling it, and the exploit it earns). The PATCH and BLACK MARKET slots are hidden.
- **Where the card sits**: at the top of the board unless noted (under the board's middle; or floating at
  the bottom or the middle of the screen over an open menu).
- A refresh mid-tutorial picks up on the same card.

Columns are numbered 1 to 7 from the left, as on the drop buttons. Boards are drawn top row first;
`[=]` is an ENCRYPTION LAYER, `[-]` a cracked one.


---

## 0. Welcome

- **Heading**: `// TUTORIAL`
- **Card sits**: under the board's middle
- **BOT**: happy
- **Buttons**: EXIT, BEGIN

**Says:**

> Welcome to BYTEFALL! This tutorial will help you understand how the game is played, along with some other useful information. There are 26 steps! Don’t worry, they’re not too long, and despite all of the numbers, there’s really no math required as long as you can count to 7! Let’s begin!

- **Asks you to**: Tap BEGIN.
- **Lights up**: Nothing.
- **Check**: Says there are 26 steps; that stays true only if the count doesn't change.
- **Notes**: 

---

## 1. The TERMINAL and encrypted bits

- **Heading**: `// TUTORIAL 1 / 26`
- **Card sits**: under the board's middle
- **BOT**: resting
- **Buttons**: EXIT, BACK, NEXT

**Says:**

> This grid is called the TERMINAL. You’ll be dropping encrypted bits into the TERMINAL’s columns. Encrypted bits are the numbered blocks with brackets: [1] [2] [3] [4] [5] [6] [7]

- **Asks you to**: Tap NEXT.
- **Lights up**: Nothing.
- **Notes**: 

---

## 2. CURRENT

- **Heading**: `// TUTORIAL 2 / 26`
- **Card sits**: top of the board
- **BOT**: resting
- **Buttons**: EXIT, BACK
- **Bits**: CURRENT [3], then [2].
- **Board as it starts**:

```
 .  .  .  . [3][5] . 
```

**Says:**

> This flashing display panel in the middle, with the bright border, shows your CURRENT bit, [3], which is the one that will be dropped into a column on your next tap. Go ahead and tap the CURRENT display panel!

- **Asks you to**: Tap the CURRENT panel (anything else is dimmed).
- **Lights up**: The CURRENT panel.
- **Notes**: 

---

## 3. Decrypting: a row

- **Heading**: `// TUTORIAL 3 / 26`
- **Card sits**: top of the board
- **BOT**: resting; after the drop: resting
- **Buttons**: EXIT, BACK
- **Bits**: CURRENT [3], then [2].
- **Board as it starts**:

```
 .  .  .  . [3][5] . 
```

**Says:**

> A bit clears only when its value matches the exact number of bits in the row or column that it sits in. Clearing bits is called DECRYPTING. Any bit can be dropped into any column by tapping a number button below or by tapping the column itself. Go ahead and drop the CURRENT bit, [3], into either column 4 or 7, next to the [3] and [5] bits.

- **Asks you to**: Drop the [3] into column 4 or column 7 (by its button or the column). Other columns are dimmed; a wrong one gets a denied sound, BOT's -_- face and a nudge of the card.
- **Lights up**: The [3] and [5] at the bottom, and the buttons for columns 4 and 7.

**After the drop, says:**

> BOOM! Both [3] bits were DECRYPTED, since the row was made 3 bits long. The [5] bit remains, since it was in neither a row nor a column 5 bits long, before or after the drop.

**Points shown:**

```
[3] [3]  (13 + 13) ×1 = 26
```

- **Board after**:

```
 .  .  .  .  . [5] . 
```
- **Score after**: 26, CHAIN 1x
- **Notes**: 

---

## 4. Decrypting: a column

- **Heading**: `// TUTORIAL 4 / 26`
- **Card sits**: top of the board
- **BOT**: resting; after the drop: resting
- **Buttons**: EXIT, BACK
- **Bits**: CURRENT [2].
- **Board as it starts**:

```
 .  .  .  .  . [5] . 
```

**Says:**

> Let’s try a column. Drop the CURRENT bit, [2], on top of the [5] bit in column 6.

- **Asks you to**: Drop the [2] into column 6.
- **Lights up**: The [5] in column 6 and column 6's button.

**After the drop, says:**

> Nice! Since dropping the [2] bit made the column 2 bits tall, the [2] bit was DECRYPTED.

**Points shown:**

```
[2]  (12) ×1 = 12
```

- **Board after**:

```
 .  .  .  .  . [5] . 
```
- **Score after**: 38, CHAIN 1x
- **Notes**: 

---

## 5. SCORE

- **Heading**: `// TUTORIAL 5 / 26`
- **Card sits**: top of the board
- **BOT**: resting
- **Buttons**: EXIT, BACK
- **Bits**: none.
- **Board as it starts**:

```
 .  .  .  .  . [5] . 
```

**Says:**

> Now for the scoring! Each decrypted bit earns you 10 points plus the number it displays. A [1] bit is worth 11 points, a [2] bit is worth 12 points, and a [7] bit is worth 17 points. Get the idea? Your SCORE sits at the left of the panels up top, under your BEST. Tap SCORE now!

- **Asks you to**: Tap the SCORE panel.
- **Lights up**: SCORE.
- **Check**: Says SCORE is 'under your BEST': true in the current HUD (BEST top left, SCORE under it).
- **Notes**: 

---

## 6. CHAINS

- **Heading**: `// TUTORIAL 6 / 26`
- **Card sits**: top of the board
- **BOT**: resting; after the drop: happy
- **Buttons**: EXIT, BACK
- **Bits**: CURRENT [2].
- **Board as it starts**:

```
 .  .  . [7] .  .  . 
 .  .  . [2] .  .  . 
 .  . [6][5][4] . [5]
 .  . [6][7][3][2][6]
```

**Says:**

> Any time a bit decrypts, any bits that were above it will fall, and they can cause more bits to DECRYPT. This is called a CHAIN, and each wave of bits that clears is a link. The first link scores normal points, the second link’s points are doubled (2x), the third link’s are tripled (3x), and so on. Let’s drop the [2] into column 6.

- **Asks you to**: Drop the [2] into column 6.
- **Lights up**: The [2] at the foot of column 6, the [5] in column 4's second row and the [5] in column 7's second row, and column 6's button.

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

- **Board after**:

```
 .  . [6][7] .  .  . 
 .  . [6][7][4] . [6]
```
- **Score after**: 170, CHAIN 3x
- **Notes**: 

---

## 7. CHAIN and the CHAIN METER

- **Heading**: `// TUTORIAL 7 / 26`
- **Card sits**: top of the board
- **BOT**: resting
- **Buttons**: EXIT, BACK
- **Bits**: none.
- **Board as it starts**:

```
 .  . [6][7] .  .  . 
 .  . [6][7][4] . [6]
```

**Says:**

> CHAIN, at the right of the panels up top, shows you how long your last decrypted bit chain was. The bars on each side of the grid are the CHAIN METER. Each decrypted link lights up a bar on the meter, and the meter stays charged from one drop to the next. Fill all 5 bars to earn an EXPLOIT. A drop that clears nothing ends the streak, and the meter resets. Tap CHAIN.

- **Asks you to**: Tap the CHAIN panel.
- **Lights up**: CHAIN, and the CHAIN METER bars on both sides of the grid.
- **Notes**: 

---

## 8. ENCRYPTION LAYERS: the first peel

- **Heading**: `// TUTORIAL 8 / 26`
- **Card sits**: top of the board
- **BOT**: resting; after the drop: resting
- **Buttons**: EXIT, BACK
- **Bits**: CURRENT [2], then [2].
- **Board as it starts**:

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

- **Board after**:

```
 .  .  . [-] .  .  . 
```
- **Score after**: 182, CHAIN 1x
- **Notes**: 

---

## 9. ENCRYPTION LAYERS: the second peel

- **Heading**: `// TUTORIAL 9 / 26`
- **Card sits**: top of the board
- **BOT**: resting; after the drop: happy
- **Buttons**: EXIT, BACK
- **Bits**: CURRENT [2].
- **Board as it starts**:

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

- **Board after**:

```
(empty)
```
- **Score after**: 216, CHAIN 2x
- **Notes**: 

---

## 10. The ======== line

- **Heading**: `// TUTORIAL 10 / 26`
- **Card sits**: under the board's middle
- **BOT**: worried
- **Buttons**: EXIT, BACK, NEXT

**Says:**

> Keep every column below this ======== line. If anything is still above it once the decrypting stops, the trace completes and the game is over.

- **Asks you to**: Tap NEXT.
- **Lights up**: The ======== line over the grid.
- **Notes**: 

---

## 11. ENCRYPT IN

- **Heading**: `// TUTORIAL 11 / 26`
- **Card sits**: top of the board
- **BOT**: resting
- **Buttons**: EXIT, BACK

**Says:**

> A new row of layers rises from the bottom every 8 drops, pushing everything up. ENCRYPT IN, at the right just above CHAIN, counts down the drops until the next one. Tap it.

- **Asks you to**: Tap the ENCRYPT IN panel.
- **Lights up**: ENCRYPT IN.
- **Check**: Layers don't actually rise in the tutorial; it's only described.
- **Notes**: 

---

## 12. EXPLOITS: arming one

- **Heading**: `// TUTORIAL 12 / 26`
- **Card sits**: top of the board
- **BOT**: devious grin
- **Buttons**: EXIT, BACK
- **Bits**: none. Held in the EXPLOIT button: WORM VIRUS.
- **Board as it starts**:

```
 .  . [3] .  .  .  . 
 .  . [7] .  .  .  . 
 .  . [2] .  .  .  . 
 .  . [6] .  .  .  . 
```

**Says:**

> When the CHAIN METER fills up, you earn an EXPLOIT. Different exploits change the board depending on where you drop them. When you earn an exploit, the CHAIN METER will pulse until you decide to use it. Tap the EXPLOIT button to use the one you have available. It’s a WORM VIRUS!

- **Asks you to**: Tap the EXPLOIT button (it really arms the WORM VIRUS).
- **Lights up**: The EXPLOIT button.
- **Check**: The bottom row now also has PATCH and BLACK MARKET slots either side of EXPLOIT; the tutorial hides them and doesn't mention them.
- **Notes**: 

---

## 13. EXPLOITS: the WORM VIRUS

- **Heading**: `// TUTORIAL 13 / 26`
- **Card sits**: top of the board
- **BOT**: devious grin; after the drop: happy
- **Buttons**: EXIT, BACK
- **Bits**: CURRENT is the armed WORM VIRUS.
- **Board as it starts**:

```
 .  . [3] .  .  .  . 
 .  . [7] .  .  .  . 
 .  . [2] .  .  .  . 
 .  . [6] .  .  .  . 
```

**Says:**

> The WORM VIRUS is armed and is now your CURRENT. It drops like a bit. Drop it into column 3, the tall one: it wipes out every block in that column.

- **Asks you to**: Drop the armed WORM VIRUS into column 3.
- **Lights up**: Every block in column 3 and column 3's button.

**After the drop, says:**

> The WORM VIRUS wiped out the whole column. Blocks wiped out by an exploit score a flat 10 each. Other exploits wipe an area, peel layers or change bits: each has its card in the EXPLOITS tab.

**Points shown:**

```
+40
```

- **Board after**:

```
(empty)
```
- **Score after**: 256, CHAIN 0x
- **Notes**: 

---

## 14. PAUSE

- **Heading**: `// TUTORIAL 14 / 26`
- **Card sits**: top of the board
- **BOT**: resting
- **Buttons**: EXIT, BACK

**Says:**

> The button at the top left PAUSES the game. Tap it now!

- **Asks you to**: Tap the PAUSE button (it really opens the pause screen).
- **Lights up**: The PAUSE button.
- **Check**: OUT OF DATE: says 'the button at the top left'; PAUSE sits at the top RIGHT now.
- **Notes**: 

---

## 15. The pause screen

- **Heading**: `// TUTORIAL 15 / 26`
- **Card sits**: bottom of the screen
- **BOT**: resting
- **Buttons**: EXIT, BACK

**Says:**

> The pause screen has RESUME, RESTART, RULES & RECORDS, SETTINGS, EXPLOITS, the STORE and the MAIN MENU (and EXIT, in VS). All but RESUME and RESTART are on the MAIN MENU too. Tap RULES & RECORDS.

- **Asks you to**: Tap RULES & RECORDS on the pause screen.
- **Lights up**: RULES & RECORDS.
- **Check**: The card floats at the bottom of the screen, over the pause screen.
- **Notes**: 

---

## 16. RULES

- **Heading**: `// TUTORIAL 16 / 26`
- **Card sits**: middle of the screen
- **BOT**: resting
- **Buttons**: EXIT, BACK, NEXT

**Says:**

> RULES & RECORDS opens as a card over the game, with its tabs along the top. The RULES tab has everything you just learned, written down, with the TUTORIAL button to come back here any time.

- **Asks you to**: Tap NEXT.
- **Lights up**: The RULES tab.
- **Check**: The card floats in the middle of the screen, over RULES & RECORDS. The menu also has NOTICES, EXPLOITS and STORE tabs now; none are named here.
- **Notes**: 

---

## 17. RECORDS

- **Heading**: `// TUTORIAL 17 / 26`
- **Card sits**: middle of the screen
- **BOT**: resting
- **Buttons**: EXIT, BACK, NEXT

**Says:**

> The RECORDS tab shows your level and DECRYPTOR rank, every unlock with the level it opens at, every achievement with its progress, and your lifetime stats.

- **Asks you to**: Tap NEXT.
- **Lights up**: The RECORDS tab.
- **Check**: RECORDS has more now (HISTORY of the last 10 games, among others); not mentioned.
- **Notes**: 

---

## 18. Closing a card

- **Heading**: `// TUTORIAL 18 / 26`
- **Card sits**: middle of the screen
- **BOT**: resting
- **Buttons**: EXIT, BACK

**Says:**

> Tapping outside a card won’t close it: tap ← BACK, at the top left of the card.

- **Asks you to**: Tap ← BACK at the top left of the card.
- **Lights up**: ← BACK.
- **Notes**: 

---

## 19. EXPLOITS (the menu)

- **Heading**: `// TUTORIAL 19 / 26`
- **Card sits**: bottom of the screen
- **BOT**: resting
- **Buttons**: EXIT, BACK

**Says:**

> Now tap EXPLOITS. (The STORE beside it has REMOVE ADS and FULL ACCESS.)

- **Asks you to**: Tap EXPLOITS on the pause screen.
- **Lights up**: EXPLOITS.
- **Check**: OUT OF DATE: '(The STORE beside it has REMOVE ADS and FULL ACCESS.)' The STORE now has the DAILY DROP, PATCHES, STARTER EXPLOITS, BLACK BOXES and SUPPORT THE GAME.
- **Notes**: 

---

## 20. The loadout

- **Heading**: `// TUTORIAL 20 / 26`
- **Card sits**: bottom of the screen
- **BOT**: resting
- **Buttons**: EXIT, BACK, NEXT

**Says:**

> EXPLOITS is your loadout. You can only earn exploits that are in a slot: SLOTS, at the top, counts the slots you’ve filled and the ones you have. Tap an unlocked card to put it in a free slot, or tap it again to take it out. More slots and exploits unlock as you level up, and the loadout is locked from a session’s first drop until it ends.

- **Asks you to**: Tap NEXT.
- **Lights up**: SLOTS at the top, and every exploit card.
- **Check**: OUT OF DATE: doesn't say that exploits past the first three are bought once with resources to keep (until RANK UP).
- **Notes**: 

---

## 21. Closing EXPLOITS

- **Heading**: `// TUTORIAL 21 / 26`
- **Card sits**: middle of the screen
- **BOT**: resting
- **Buttons**: EXIT, BACK

**Says:**

> Tap ← BACK to close it.

- **Asks you to**: Tap ← BACK.
- **Lights up**: ← BACK.
- **Notes**: 

---

## 22. SETTINGS

- **Heading**: `// TUTORIAL 22 / 26`
- **Card sits**: bottom of the screen
- **BOT**: resting
- **Buttons**: EXIT, BACK

**Says:**

> Now tap SETTINGS.

- **Asks you to**: Tap SETTINGS on the pause screen.
- **Lights up**: SETTINGS.
- **Notes**: 

---

## 23. What's in SETTINGS

- **Heading**: `// TUTORIAL 23 / 26`
- **Card sits**: middle of the screen
- **BOT**: resting
- **Buttons**: EXIT, BACK, NEXT

**Says:**

> SETTINGS has SOUND (sound and music, the sound effects, SOUND OUTPUT for what you’re listening on), the PLAYLIST to change tracks (with the MUSIC PLAYER for listening on its own), CONTROLS (where the drop buttons sit, vibration on phones), DISPLAY (color THEMES and FONTS, more unlocking as you level up; text size; REDUCED EFFECTS for slower phones) and EXTRAS (the wandering bots, the screen saver).

- **Asks you to**: Tap NEXT.
- **Lights up**: Nothing (SETTINGS is open behind the card).
- **Check**: Missing: PIXEL STYLE and CRT DISPLAY (DISPLAY), GAME MUSIC: LAYERED, BACKGROUND PLAY, AD PRIVACY OPTIONS.
- **Notes**: 

---

## 24. Closing SETTINGS

- **Heading**: `// TUTORIAL 24 / 26`
- **Card sits**: middle of the screen
- **BOT**: resting
- **Buttons**: EXIT, BACK

**Says:**

> Tap ← BACK to close SETTINGS.

- **Asks you to**: Tap ← BACK.
- **Lights up**: ← BACK.
- **Notes**: 

---

## 25. RESUME

- **Heading**: `// TUTORIAL 25 / 26`
- **Card sits**: bottom of the screen
- **BOT**: resting
- **Buttons**: EXIT, BACK

**Says:**

> And RESUME to get back to the game.

- **Asks you to**: Tap RESUME on the pause screen.
- **Lights up**: RESUME.
- **Notes**: 

---

## 26. The end

- **Heading**: `// TUTORIAL 26 / 26`
- **Card sits**: top of the board
- **BOT**: happy
- **Buttons**: EXIT, BACK, PLAY CLASSIC, RULES

**Says:**

> That’s everything you need to know. Good luck, decryptor.

- **Asks you to**: Tap PLAY CLASSIC (out to the main menu on CLASSIC) or RULES (out to the main menu with RULES & RECORDS open on RULES).
- **Lights up**: Nothing.
- **Check**: Doesn't mention ENCRYPTION STRENGTH, patches, the BLACK MARKET, the STORE or levels and unlocks.
- **Notes**: 

---

## Not in the tutorial yet

What the game has now that no card covers (for deciding what to add, cut or point to RULES instead):

- **ENCRYPTION STRENGTH** (CLASSIC's goal): the key to crack (128-BIT at 1,500 on NORMAL), the bar on
  SCORE, the CRACKED card, GO DEEPER and DISCONNECT. (And the endless toggle to come.)
- **The bottom row**: PATCH 1, BLACK MARKET L, EXPLOIT, BLACK MARKET R, PATCH 2. The PATCH SLOTS (Lv 5 and
  Lv 12) sell a patch mid-game; the BLACK MARKET opens with the first layer and turns over every 4 drops
  (the pips count it down, the last drop warns).
- **PATCHES** before a game (the main menu's PATCHES button), RESTORE POINT (also free for a rewarded ad
  once a day) and ANTIVIRUS.
- **STARTER EXPLOITS** in the side slots (Lv 3 and Lv 9) and **BLACK BOXES** (a random exploit, maybe an
  infection), and the **INFECTIONS** themselves.
- **Owning exploits**: the first three are free; the rest are bought once with resources and kept until
  RANK UP.
- **Resources and KEYS**: what each is earned by (the STORE's [i] explains them), the DAILY DROP and the
  LOGIN STREAK.
- **The STORE**: prices that move (sales, HIGH DEMAND, holiday sales, YOUR DEAL) and the gauge.
- **Levels, unlocks and DECRYPTOR ranks**: everything unlocks by level within a rank (exploits and slots by
  Lv 50, the rest by Lv 60); RANK UP at Lv 80.
- **The other modes**: DAILY, PUZZLE, BLITZ, VS and ZEN (only CLASSIC is played here).
- **HARD**: the 8x8 board, BYTES, layers speeding up.
- **NOTICES** and **HISTORY** in RULES & RECORDS.
- **PIXEL STYLE** and **CRT DISPLAY** in SETTINGS.

