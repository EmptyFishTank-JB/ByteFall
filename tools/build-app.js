// Builds the Android app's copy of the game (www/, for Capacitor): the game as players get it,
// without the dev page or anything that only the dev page uses.
//   node tools/build-app.js
// - only what the game loads: index.html, the manifest, css/, js/, the fonts and icons (not the
//   dev tools, the docs, the soundtrack's .wav archive or the screenshots)
// - the settings' DEV link taken out
// - the build, commit and date baked in (the web version asks GitHub for them on each load)
// - any dev switches left in storage cleared on launch (VIRUSES: OFTEN, ...), but for UNLOCK
//   EVERYTHING: the app's padlock in SETTINGS switches it, for testing
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
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
};

const devLink = /\s*<a class="dev-link"[^>]*>[\s\S]*?<\/a>/;
if (!devLink.test(html)) throw new Error('build-app: the DEV link was not found in index.html');
html = html.replace(devLink, '');

const boot = `<script>
  // (the app build: tools/build-app.js)
  window.BYTEFALL_APP = ${JSON.stringify(app)};
  // (UNLOCK EVERYTHING stays: the app's own padlock switch, for testing; TODO before the Play Store: take it out)
  try { Object.keys(localStorage).forEach(function (k) { if (k.indexOf('bytefall-dev-') === 0 && k !== 'bytefall-dev-unlockall') localStorage.removeItem(k); }); } catch (e) {}
</script>
`;
const first = html.indexOf('<script>');
if (first < 0) throw new Error('build-app: no inline script in index.html to boot before');
html = html.slice(0, first) + boot + html.slice(first);
fs.writeFileSync(path.join(OUT, 'index.html'), html);

if (fs.existsSync(path.join(OUT, 'dev-tools'))) throw new Error('build-app: dev-tools got into www/');
console.log(`www/ built: build ${app.build}, commit ${app.commit}, ${app.date}`);
