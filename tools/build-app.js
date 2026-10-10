// Builds the Android app's copy of the game (www/, for Capacitor): the game as players get it,
// without the dev page or anything that only the dev page uses. Two editions:
//   node tools/build-app.js [test]   the TEST edition (Actions → Android test APK): ByteFall Test,
//                                    its own app beside the Play one, with UNLOCK EVERYTHING
//   node tools/build-app.js release  the RELEASE edition (Actions → Android release bundle), for
//                                    Google Play: no UNLOCK EVERYTHING, every dev switch off for good
// - only what the game loads: index.html, the manifest, css/, js/, the fonts and icons (not the
//   dev tools, the docs or the screenshots)
// - the settings' DEV link taken out
// - the build, commit and date baked in (the web version asks GitHub for them on each load)
// - any dev switches left in storage cleared on launch (VIRUSES: OFTEN, ...): in TEST all but
//   UNLOCK EVERYTHING (the app's padlock in SETTINGS switches it, for testing); in RELEASE every one,
//   the padlock taken out of the page, the game told it's the release (BYTEFALL_APP.release: dev
//   unlocks ignored, js/unlocks.js), and the infection tester and the archived tracks left out
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const EDITION = process.argv[2] || 'test';
if (!['test', 'release'].includes(EDITION)) throw new Error(`build-app: edition test or release, not ${EDITION}`);
const RELEASE = EDITION === 'release';
const OUT = path.join(ROOT, 'www');
const COPY = ['index.html', 'manifest.webmanifest', 'css', 'js', 'assets/fonts', 'assets/icons'];

fs.rmSync(OUT, { recursive: true, force: true });
for (const p of COPY) fs.cpSync(path.join(ROOT, p), path.join(OUT, p), { recursive: true });

const git = (cmd, fallback) => { try { return execSync(`git ${cmd}`, { cwd: ROOT }).toString().trim(); } catch (e) { return fallback; } };
let html = fs.readFileSync(path.join(OUT, 'index.html'), 'utf8');
const app = {
  build: (/\?v=(\d+)/.exec(html) || [])[1] || '',
  commit: (process.env.GITHUB_SHA || git('rev-parse HEAD', '')).slice(0, 7),
  date: git('log -1 --format=%cI', new Date().toISOString()),
  ...(RELEASE ? { release: true } : {}),
};

const devLink = /\s*<a class="dev-link"[^>]*>[\s\S]*?<\/a>/;
if (!devLink.test(html)) throw new Error('build-app: the DEV link was not found in index.html');
html = html.replace(devLink, '');

const boot = `<script>
  // (the app build: tools/build-app.js, the ${EDITION.toUpperCase()} edition)
  window.BYTEFALL_APP = ${JSON.stringify(app)};
  ${RELEASE ? "// (every dev switch off, UNLOCK EVERYTHING too: players never get them)" : "// (UNLOCK EVERYTHING stays: the test app's own padlock switch)"}
  try { Object.keys(localStorage).forEach(function (k) { if (k.indexOf('bytefall-dev-') === 0${RELEASE ? '' : " && k !== 'bytefall-dev-unlockall'"}) localStorage.removeItem(k); }); } catch (e) {}
</script>
`;
const first = html.indexOf('<script>');
if (first < 0) throw new Error('build-app: no inline script in index.html to boot before');
html = html.slice(0, first) + boot + html.slice(first);
if (RELEASE) {
  // (the padlock, its note and all; and the infection and sound testers, which only ?inftest and
  // ?sfxtest wake)
  const padlock = /\s*<!-- \(the Android test app: UNLOCK EVERYTHING[^>]*-->\s*<button type="button" class="dev-link dev-unlock-btn"[\s\S]*?<\/button>/;
  if (!padlock.test(html)) throw new Error('build-app: the UNLOCK EVERYTHING padlock was not found in index.html');
  html = html.replace(padlock, '');
  for (const file of ['inf-test', 'sfx-test']) {
    const tester = new RegExp(`\\s*<script src="js\\/${file}\\.js[^"]*"><\\/script>`);
    if (!tester.test(html)) throw new Error(`build-app: ${file}.js's script tag was not found in index.html`);
    html = html.replace(tester, '');
    fs.rmSync(path.join(OUT, 'js', `${file}.js`));
  }
  fs.rmSync(path.join(OUT, 'js', 'music', 'archive'), { recursive: true, force: true }); // (old versions of tracks: the game never loads them)
  if (html.includes('dev-unlock-btn') || html.includes('inf-test.js') || html.includes('sfx-test.js')) throw new Error('build-app: dev pieces left in the RELEASE page');
}
fs.writeFileSync(path.join(OUT, 'index.html'), html);

if (fs.existsSync(path.join(OUT, 'dev-tools'))) throw new Error('build-app: dev-tools got into www/');
// (the ads: test ads only while ads-config.js says testing, which the Play Store's production release mustn't)
const ads = fs.readFileSync(path.join(ROOT, 'js', 'ads-config.js'), 'utf8');
const testAds = /testing:\s*true/.test(ads);
console.log(`www/ built: the ${EDITION.toUpperCase()} edition, build ${app.build}, commit ${app.commit}, ${app.date}${testAds ? '; ADS: test ads (js/ads-config.js testing: true)' : '; ADS: real'}`);
