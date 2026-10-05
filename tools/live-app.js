// The LIVE test app (Actions → Android test APK → source: live): instead of its own copy of the
// game, the app loads the game from GitHub Pages each time it opens, so every push to main shows
// up on the phone without a new APK.
//   node tools/live-app.js config   (before `npx cap add android`: capacitor.config.json)
//   node tools/live-app.js android  (after tools/setup-android.js: the WebView's cache off)
// - server.url: the live site; its own copy (www/, tools/build-app.js) is the fallback when
//   there's no connection (errorPath)
// - the WebView's cache off, so it's the newest push (GitHub Pages' own 10 minute cache aside,
//   which the ?v= on every script already gets past)
// - the game knows it's in the app from the user agent's "ByteFallApp" (capacitor.config.json's
//   appendUserAgent, in every build), where the bundled copy has it baked in
// Not for the Play Store: those builds are BUNDLED (the default there), updating through the store.
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const LIVE = 'https://emptyfishtank-jb.github.io/ByteFall/';
const step = process.argv[2];
if (step === 'config') {
  const p = path.join(ROOT, 'capacitor.config.json');
  const cfg = JSON.parse(fs.readFileSync(p, 'utf8'));
  cfg.server = { ...(cfg.server || {}), url: LIVE, errorPath: 'index.html' };
  fs.writeFileSync(p, `${JSON.stringify(cfg, null, 2)}\n`);
  console.log(`live-app: the app loads ${LIVE} (its own copy when offline)`);
} else if (step === 'android') {
  const p = path.join(ROOT, 'android/app/src/main/java/com/emptyfishtank/bytefall/MainActivity.java');
  const s = fs.readFileSync(p, 'utf8');
  const at = 'web.getSettings().setMediaPlaybackRequiresUserGesture(false);';
  if (!s.includes(at)) throw new Error('live-app: MainActivity has changed: no place for the cache setting');
  fs.writeFileSync(p, s.replace(at, `${at}\n        web.getSettings().setCacheMode(android.webkit.WebSettings.LOAD_NO_CACHE); // (LIVE: the newest push each time)`));
  console.log('live-app: the WebView cache off');
} else throw new Error('live-app: config or android');
