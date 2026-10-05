// BYTEFALL VIZ's Android app, step one (the CI's Actions → ByteFall Viz APK, or by hand from the
// repo's root):
//   node visualizer/build.js [live]
// - www/: the app's copy of the page (visualizer/'s index.html, viz.css, app.js), with what it
//   loads from the game (js/viz.js, js/extsource.js, the font), its ../ paths made local
// - capacitor.config.json: the Viz app's (visualizer/capacitor.config.json) put where Capacitor
//   looks, in place of the game's (only in the build's own checkout: this is for CI, not to commit)
// - live: the app loads the page from GitHub Pages each time it opens, so pushes show up without a
//   new APK (its own copy when offline), as ByteFall's LIVE test app does
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'www');
const LIVE = 'https://emptyfishtank-jb.github.io/ByteFall/visualizer/';
const live = process.argv[2] === 'live';

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(path.join(OUT, 'js'), { recursive: true });
fs.mkdirSync(path.join(OUT, 'assets/fonts'), { recursive: true });
fs.mkdirSync(path.join(OUT, 'assets/icons'), { recursive: true });
const local = (s) => s.replace(/\.\.\//g, '');
for (const f of ['index.html', 'viz.css']) fs.writeFileSync(path.join(OUT, f), local(fs.readFileSync(path.join(__dirname, f), 'utf8')));
fs.copyFileSync(path.join(__dirname, 'app.js'), path.join(OUT, 'app.js'));
for (const f of ['js/viz.js', 'js/extsource.js', 'assets/fonts/share-tech-mono.woff2', 'assets/icons/icon-192.png']) fs.copyFileSync(path.join(ROOT, f), path.join(OUT, f));

const cfg = JSON.parse(fs.readFileSync(path.join(__dirname, 'capacitor.config.json'), 'utf8'));
if (live) cfg.server = { url: LIVE, errorPath: 'index.html' };
fs.writeFileSync(path.join(ROOT, 'capacitor.config.json'), `${JSON.stringify(cfg, null, 2)}\n`);
const build = (/\?v=(\d+)/.exec(fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8')) || [])[1] || '1';
console.log(`ByteFall Viz: www/ built (build ${build})${live ? `, loading ${LIVE}` : ''}`);
