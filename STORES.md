# ByteFall on Steam, the Microsoft Store and in cars

A plan for taking ByteFall to PC stores, written ahead of time so the game can be shaped for it as
it goes. Nothing here is built yet: the desktop edition starts once the game is finalized on
Android. Cars (Android Automotive OS) come after it; the Apple App Store is left for later.

## Decisions (made: the recommended way for all three)

1. **How it's sold on PC.** Decided: a one-time price (around $4.99), no ads and no purchases
   inside. Everything is earned by playing, as on the website. PC players expect to pay once, and
   Steam players dislike paying to skip progress, so FULL ACCESS and REMOVE ADS wouldn't exist there.
   (The other way is free with an optional FULL ACCESS DLC on Steam. It works, but it means wiring up
   Steam's purchase API and the Microsoft Store's, two more billing systems to test.)
2. **How it's packaged.** Decided: one desktop app built with **Electron** (the game in its own
   Chromium window), packaged for both stores. One build, one save format, and Steam's features
   (achievements, cloud saves, the overlay) work in it through `steamworks.js`. The Microsoft Store
   could also take the website as a PWA (wrapped by Microsoft's PWABuilder), which is quicker, but it
   would be a second thing to maintain.
3. **Which platforms on Steam.** Decided: Windows at launch. Linux (and the Steam Deck) comes almost free with
   Electron and is worth it if controller support goes in (below). macOS on Steam needs Apple
   signing and notarizing: leave it for the App Store step.

## What the game needs

- **A DESKTOP edition** in `tools/build-app.js`, beside TEST and RELEASE: `BYTEFALL_APP.platform`
  set to `steam` or `msstore`. In it:
  - no ads (no AdMob, no banner strip, no WATCH AD);
  - no SUPPORT THE GAME section, REMOVE ADS link, RESTORE PURCHASES or TEST PURCHASES;
  - no OTHER APPS source in the music player (that's Android's audio capture); MICROPHONE stays.
- **The window.** The game is laid out for a portrait phone (384 x 823). On a PC it opens as a tall,
  resizable window, scaled up, and full screen it keeps that column in the middle with the scene
  filling the sides. Things to check:
  - the Steam Deck's 1280 x 800 (landscape): the column is 800px tall there, so text sizes need a
    look;
  - mouse hover states, the cursor over the grid, and right-click (nothing should need it).
- **Controls.**
  - Keyboard already works in a game: 1 to 7 drop, Esc / P pause, the arrows for PIVOT and PACKET
    SNIFFER.
  - Still to add: a key for EXPLOIT, and keyboard focus through the menus.
  - **Controller support** (the browser's Gamepad API): a column cursor on the D-pad or stick, A to
    drop, X for EXPLOIT, Start to pause, B for back, and focus moving through the menus and cards.
    It's what Steam's "Deck Verified" badge asks for, and Steam players expect it. It's the biggest
    piece of work here.
- **Saves.**
  - Progress lives in localStorage now, which Electron keeps in its own folder. For Steam Cloud, the
    desktop app writes the save to a plain file as well (`save.json`, on every change).
  - Steam's Auto-Cloud syncs that file across PCs and the Deck; the game reads it back at launch.
- **Achievements.**
  - The game has about 157. On Steam each one becomes a Steam achievement: the game calls
    `Platform.achieve(id)` where it now announces them, and the Steam adapter passes it on.
  - Each needs two 256 x 256 icons (earned and locked). They can be drawn by a script from a pixel
    template, as the in-game icons are.
  - The Microsoft Store has no achievements for a game like this (Xbox achievements need the
    ID@Xbox program).
- **Small things.**
  - SHARE and outside links open the system browser.
  - Vibration is off.
  - The screen saver stays.
  - The build stamp says DESKTOP.
  - The privacy policy gets a line for the desktop builds (no ads, nothing collected).

## Steam: accounts and paperwork

- **Steamworks partner account** (partner.steamgames.com): company or personal details, tax
  interview, bank account, identity check. Steam Direct charges a fee per game (it was $100,
  returned once the game earns $1,000; check the current terms).
- **Store page assets** (Steam's current sizes; check the Steamworks docs before making them):

  | Asset | Size |
  |---|---|
  | header capsule | 920 x 430 |
  | small capsule | 462 x 174 |
  | main capsule | 1232 x 706 |
  | vertical capsule | 748 x 896 |
  | library capsule | 600 x 900 |
  | library hero | 3840 x 1240 |
  | library logo | 1280 x 720 |
  | page background | 1438 x 810 |

  Also: at least 5 screenshots at 1920 x 1080, and a trailer (recommended).
- **Timeline:**
  - The "Coming Soon" page must be up for at least two weeks before release; wishlists gather there.
  - Steam reviews the store page and the build (a few days each).
  - Steam's content survey sets the ratings.
- **Pricing**, with Steam's suggested prices for other countries.

## Microsoft Store: accounts and paperwork

- **Partner Center** developer account (individual accounts were made free in 2024; check the
  current terms).
- **The package:** an MSIX, built from the same Electron app (electron-builder's `appx` target),
  signed with the publisher identity Partner Center gives the app.
- **The listing:** the age rating through the IARC questionnaire (the same one Google Play uses),
  the privacy policy URL, screenshots, the logos and the price.

## Ratings

Mild cartoon content: bits, bots and computer viruses as a theme (RANSOMWARE, SPYWARE), no
violence, no real money gambling (BLACK BOXES are bought with KEYS earned in play, never real
money, in the PC builds). Expect E / PEGI 3 or close. A paid loot-box question may come up in the
surveys: on PC nothing is sold for real money, so the answer is no.

## The website (decided)

- **Until the stores launch** the game stays on GitHub Pages as it is, with no ads. GitHub Pages
  isn't meant for commercial sites, and AdSense wants a domain you own, so ads on it are out.
- **At launch** the game's page gives way to a landing page on the studio's site (the
  `EmptyFishTank-JB.github.io` repo, which already has the privacy policy): screenshots or the
  trailer, the store badges, and maybe a short demo (the tutorial and a few CLASSIC games).
- **This repo's Pages site can't just be switched off**: the TEST app's live source loads the game
  from it (`tools/live-app.js`). At launch, `index.html` sends ordinary browsers to the landing page
  and runs the game only inside the app (its `ByteFallApp` user agent) or for the developer.
- **Making this repo private** hides the code and its history; the Actions builds keep working.
  Pages from a private repo needs a paid plan (GitHub Pro), and the site it serves is still public,
  so the browser gate above is needed either way. Any web version's scripts can be read in a
  browser; going private stops anyone from copying the whole project in one go.
- **A web version that earns** would go on Poki, CrazyGames or itch.io (they run the ads and share
  the revenue), never ads on our own site.

## In cars (later, after the desktop edition)

- **Not Android Auto.** Android Auto (the phone's screen on the car's display) is for driving: media,
  messaging, navigation and the like. Games haven't been among the kinds of app it takes.
- **Android Automotive OS instead.** Cars with Google built-in (some Volvo, Polestar, GM and Honda
  models) run Android itself and have their own Play Store. That store carries games to play while
  parked, and that's the way in for ByteFall.
- **What it would need:**
  - **A landscape layout.** Car screens are wide, and ByteFall is portrait only. The desktop
    edition's layout (the portrait column in the middle of a wide screen) is most of this work, which
    is why cars come after it.
  - **Parked only.** The car blocks a parked-only app once it moves. The game has to pause cleanly
    then and pick up where it was; it already pauses and resumes.
  - **Touch.** Car screens are touchscreens, so play needs no change.
  - **Ads.** Google's ad rules for cars need checking. A one-price car build without ads, like the PC
    one, avoids the question.
- **Shipping it:** a car build of the same Android app, submitted for the car form factor in the
  Play Console. Google's car app programs and their rules change often: read the current
  requirements when it's time.

## Order of work

1. **The DESKTOP edition and an Electron shell**, with a GitHub Actions workflow building a Windows
   `.exe` (unsigned) to try on a PC. Steam isn't needed for this step.
2. **The window and layout** on PC screens and the Steam Deck's.
3. **Controller support and keyboard menus.**
4. **Steamworks:** achievements, the save file and Steam Cloud, and the overlay, behind
   `Platform` so the other builds don't change.
5. **The MSIX** for the Microsoft Store.
6. **Store assets:** capsules, screenshots, the trailer and the achievement icons.
7. **Accounts and pages:** Steamworks and Partner Center, the Coming Soon page, then the reviews.
8. **Cars (later):** the landscape layout carried over to a car build for Android Automotive OS,
   parked only.
