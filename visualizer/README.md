# ByteFall Viz

ByteFall's music visualizers on their own, for whatever the phone plays: all 22 styles from the
game's MUSIC PLAYER (`js/viz.js`, shared with the game), edge to edge, turning with the phone.

- **Web:** `visualizer/index.html`, live on GitHub Pages at
  <https://emptyfishtank-jb.github.io/ByteFall/visualizer/> (linked from ByteFall's DEV page). On a
  computer, SOURCE: SCREEN AUDIO (the default) hears what the browser's screen share carries: pick the
  tab playing the music (Pandora, YouTube, ...) or, on Windows and ChromeOS, the entire screen for the
  whole computer's sound, with SHARE AUDIO on (the picture is asked for too, as browsers require, but
  never used); stopping the share shows ENDED: TAP SOURCE, and a tap asks again. MICROPHONE: the
  room. Phones' browsers: the microphone only. Keys: ← → styles, F full screen, H hides the controls;
  the mouse brings them back.
- **Android app:** `com.emptyfishtank.bytefallviz`, built by Actions → **ByteFall Viz APK**
  (`.github/workflows/visualizer-apk.yml`; LIVE loads the page from GitHub Pages, so pushes show up
  without a new APK; bundled has its own copy).

## In the app

- **START**: listening needs a tap first. Android asks for the audio permission (once), then to
  start recording or sharing the screen (each time): that is how an app hears the other apps
  (audio playback capture). Only the sound is used, nothing is recorded or kept; a notification
  shows while it listens, with STOP (the corner then says STOPPED: TAP SOURCE).
- **SOURCE**: AUTO (the default) hears the other apps directly where they allow it and switches to
  the microphone where they don't (after 2 seconds of silence directly while a song plays), back
  again on its own when the direct sound returns; the corner shows which (DIRECT or MIC) and the
  level in dB. OTHER APPS: directly only. MICROPHONE: the microphone only. Pandora refuses to be
  heard directly (Android hands over silence), so AUTO uses the microphone for it; YouTube and most
  others allow it.
- **NOW PLAYING**: the song from any app, Pandora included (title, artist, app, its art, how far
  along), with previous / play-pause / next, from Android's media sessions, as the lock screen
  shows them. Android gives them only to an app with **notification access**; ALLOW opens that
  page. An app installed outside a store (a test APK) has the switch greyed out until App info →
  ⋮ → Allow restricted settings (the card links there). SONG hides or shows the card.
- **COLOR**: ALBUM ART (the default: the two strongest colors of the song's art, brightened),
  MATRIX, CIPHER, AMBER, NEON, MONO, SPECTRUM (a cycling rainbow).
- **Taps**: the left or right quarter changes the style; the middle shows or hides the controls,
  which fade after 5 seconds untouched. STYLES lists every style.
- **MORE**: PICTURE IN PICTURE (on: leaving the app for another shrinks it to a little window over
  it, still moving), CALM WHEN PAUSED (on: the calm made-up signal while the song is paused, not the
  room's hum through the microphone), NOTIFICATION ACCESS.

## Files

- `index.html`, `viz.css`, `app.js`: the page (it loads `../js/viz.js` and `../js/extsource.js`
  from the game; bump the `?v=` on all of them here when either changes, as the game does).
- `native/MainActivity.java`: the app (full screen, kept on, picture in picture, the page's bridge
  `window.BytefallAndroid`); `native/NowPlayingService.java`: now playing; the capture is the
  game's `tools/android/CaptureService.java`, moved to this package at build.
- `build.js` (www/ and the Capacitor config), `setup-android.js` (the generated Android project made
  this app's): run by the workflow; they overwrite the root `capacitor.config.json` in the build's
  checkout only, so never commit after running them by hand.
