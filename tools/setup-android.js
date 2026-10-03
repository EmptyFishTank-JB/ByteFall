// After `npx cap add android`: makes the generated Android project ByteFall's.
//   node tools/setup-android.js
// - MainActivity: full screen, and the back button working the game (tools/android/MainActivity.java)
// - portrait only, as the web app's manifest asks
// - the version: the game's build number (index.html's ?v=), so each build installs over the last
// - TEST builds signed with the repo's own test key (tools/android/test.keystore, password
//   "android": not a secret, and not for the Play Store), so a new test APK installs over the
//   old one and keeps your progress, where a fresh debug key each build would make you uninstall
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const APP = path.join(ROOT, 'android', 'app');
const edit = (file, fn) => {
  const p = path.join(APP, file);
  const before = fs.readFileSync(p, 'utf8');
  const after = fn(before);
  if (after === before) throw new Error(`setup-android: nothing changed in ${file}`);
  fs.writeFileSync(p, after);
};

fs.copyFileSync(path.join(__dirname, 'android', 'MainActivity.java'), path.join(APP, 'src/main/java/com/emptyfishtank/bytefall/MainActivity.java'));

edit('src/main/AndroidManifest.xml', (s) => s.replace('android:name=".MainActivity"', 'android:name=".MainActivity"\n            android:screenOrientation="portrait"'));

const build = Number((/\?v=(\d+)/.exec(fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8')) || [])[1] || 1);
edit('build.gradle', (s) => s
  .replace(/versionCode \d+/, `versionCode ${build}`)
  .replace(/versionName "[^"]*"/, `versionName "0.${build}"`)
  .replace('    buildTypes {', `    signingConfigs {
        test {
            storeFile file('../../tools/android/test.keystore')
            storePassword 'android'
            keyAlias 'bytefall-test'
            keyPassword 'android'
        }
    }
    buildTypes {
        debug {
            signingConfig signingConfigs.test
        }`));
console.log(`android/ set up: version 0.${build} (code ${build}), portrait, full screen, test-signed`);
