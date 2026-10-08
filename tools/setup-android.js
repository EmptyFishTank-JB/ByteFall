// After `npx cap add android`: makes the generated Android project ByteFall's.
//   node tools/setup-android.js
// - MainActivity: full screen on black, the music on at launch, everything resting in the
//   background, and the back button working the game (tools/android/MainActivity.java)
// - VIBRATE permission (the game's haptics); RECORD_AUDIO and MODIFY_AUDIO_SETTINGS for the music
//   player's MICROPHONE and OTHER APPS sources, and FOREGROUND_SERVICE(_MEDIA_PROJECTION) with
//   CaptureService (what the other apps play, by Android's audio playback capture;
//   tools/android/CaptureService.java). Those are the TEST edition's only: the RELEASE one's own
//   manifest (src/release/) takes the service and all those permissions out (its music player shows
//   ByteFall's own music only), so Google Play's foreground service declaration isn't needed and
//   the app never asks for the microphone
// - ADS: the AdMob app ID (js/ads-config.js) in the manifest, which Google's ads SDK needs before
//   anything (the banner itself is js/ads.js, through @capacitor-community/admob)
// - portrait only, as the web app's manifest asks
// - the version: the game's build number (index.html's ?v=), so each build installs over the last
// - two editions from the one project, by build type:
//   TEST (debug, Actions → Android test APK): ByteFall Test, its own app (com.emptyfishtank.bytefall
//   .test) beside the Play one, signed with the repo's own test key (tools/android/test.keystore,
//   password "android": not a secret, and not for the Play Store), so a new test APK installs over
//   the old one and keeps your progress, where a fresh debug key each build would make you uninstall
//   RELEASE (Actions → Android release bundle): ByteFall (com.emptyfishtank.bytefall), for Google
//   Play, signed with the upload key from the environment (BYTEFALL_UPLOAD_KEYSTORE, the keystore
//   file, and BYTEFALL_UPLOAD_STORE_PASSWORD, _KEY_ALIAS, _KEY_PASSWORD: the release workflow's
//   secrets); without them it isn't signed
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

// (the AdMob app ID, from the one place the game keeps its ad IDs)
const adsCfg = fs.readFileSync(path.join(ROOT, 'js', 'ads-config.js'), 'utf8');
const adAppId = (/appId:\s*'(ca-app-pub-\d+~\d+)'/.exec(adsCfg) || [])[1];
if (!adAppId) throw new Error('setup-android: no AdMob appId (ca-app-pub-...~...) in js/ads-config.js');

for (const f of ['MainActivity.java', 'CaptureService.java']) fs.copyFileSync(path.join(__dirname, 'android', f), path.join(APP, 'src/main/java/com/emptyfishtank/bytefall', f));

edit('src/main/AndroidManifest.xml', (s) => s
  .replace('android:label="@string/app_name"', 'android:label="${appLabel}"') // (ByteFall, or ByteFall Test: build.gradle, below)
  .replace('android:label="@string/title_activity_main"', 'android:label="${appLabel}"')
  .replace('android:name=".MainActivity"', 'android:name=".MainActivity"\n            android:screenOrientation="portrait"')
  .replace('<uses-permission android:name="android.permission.INTERNET" />', '<uses-permission android:name="android.permission.INTERNET" />\n    <uses-permission android:name="android.permission.VIBRATE" />\n    <uses-permission android:name="android.permission.RECORD_AUDIO" />\n    <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />\n    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />\n    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_MEDIA_PROJECTION" />')
  .replace('</activity>', '</activity>\n\n        <service android:name=".CaptureService" android:exported="false" android:foregroundServiceType="mediaProjection" />')
  .replace('</application>', `    <meta-data android:name="com.google.android.gms.ads.APPLICATION_ID" android:value="${adAppId}" />\n    </application>`)); // (VIBRATION: navigator.vibrate needs it)
// (the RELEASE edition without OTHER APPS or the MICROPHONE: the capture service, its foreground
// service permissions and the microphone's removed from its manifest, merged over the main one)
fs.mkdirSync(path.join(APP, 'src', 'release'), { recursive: true });
fs.writeFileSync(path.join(APP, 'src', 'release', 'AndroidManifest.xml'), `<?xml version="1.0" encoding="utf-8"?>
<!-- (the RELEASE edition, Google Play: no OTHER APPS or MICROPHONE source, so no capture service and
     no microphone: tools/setup-android.js) -->
<manifest xmlns:android="http://schemas.android.com/apk/res/android" xmlns:tools="http://schemas.android.com/tools">
    <uses-permission android:name="android.permission.RECORD_AUDIO" tools:node="remove" />
    <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" tools:node="remove" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" tools:node="remove" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_MEDIA_PROJECTION" tools:node="remove" />
    <application>
        <service android:name="com.emptyfishtank.bytefall.CaptureService" tools:node="remove" />
    </application>
</manifest>
`);
// (black behind everything: the strip a system bar leaves, the notch, the splash's edges)
edit('src/main/res/values/styles.xml', (s) => s.replace('<item name="android:background">@null</item>', '<item name="android:background">@null</item>\n        <item name="android:windowBackground">@android:color/black</item>\n        <item name="android:statusBarColor">@android:color/black</item>\n        <item name="android:navigationBarColor">@android:color/black</item>'));

const build = Number((/\?v=(\d+)/.exec(fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8')) || [])[1] || 1);
edit('build.gradle', (s) => s
  .replace(/versionCode \d+/, `versionCode ${build}`)
  .replace(/versionName "[^"]*"/, `versionName "0.${build}"\n        manifestPlaceholders = [appLabel: "ByteFall"]`)
  .replace('    buildTypes {', `    signingConfigs {
        test {
            storeFile file('../../tools/android/test.keystore')
            storePassword 'android'
            keyAlias 'bytefall-test'
            keyPassword 'android'
        }
        release {
            if (System.getenv('BYTEFALL_UPLOAD_KEYSTORE')) {
                storeFile file(System.getenv('BYTEFALL_UPLOAD_KEYSTORE'))
                storePassword System.getenv('BYTEFALL_UPLOAD_STORE_PASSWORD')
                keyAlias System.getenv('BYTEFALL_UPLOAD_KEY_ALIAS')
                keyPassword System.getenv('BYTEFALL_UPLOAD_KEY_PASSWORD')
            }
        }
    }
    buildTypes {
        debug {
            signingConfig signingConfigs.test
            applicationIdSuffix ".test"
            manifestPlaceholders = [appLabel: "ByteFall Test"]
        }`)
  .replace('            minifyEnabled false', `            minifyEnabled false
            if (System.getenv('BYTEFALL_UPLOAD_KEYSTORE')) signingConfig signingConfigs.release`));
console.log(`android/ set up: version 0.${build} (code ${build}), portrait, full screen; TEST (debug) as ByteFall Test, test-signed; RELEASE signed when BYTEFALL_UPLOAD_KEYSTORE is set at build time; AdMob app ${adAppId}`);
