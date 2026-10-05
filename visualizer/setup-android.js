// BYTEFALL VIZ's Android app, step two: after `npx cap add android` (with visualizer/build.js's
// capacitor.config.json), makes the generated project the Viz app's.
//   node visualizer/setup-android.js [live]
// - its own code (visualizer/native/): MainActivity (full screen, turning with the phone, kept on,
//   picture in picture, the page's bridge), NowPlayingService (the song from any app), and
//   ByteFall's CaptureService (tools/android/, the other apps' sound) moved to its package
// - permissions: RECORD_AUDIO (the capture and the microphone), FOREGROUND_SERVICE and
//   FOREGROUND_SERVICE_MEDIA_PROJECTION (the capture's service), and the services themselves
// - the version: visualizer/index.html's ?v=, so each build installs over the last
// - TEST builds signed with ByteFall's test key (tools/android/test.keystore, not a secret)
// - live: the WebView's cache off (the newest push each time)
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const APP = path.join(ROOT, 'android', 'app');
const PKG = 'com/emptyfishtank/bytefallviz';
const live = process.argv[2] === 'live';
const edit = (file, fn) => {
  const p = path.join(APP, file);
  const before = fs.readFileSync(p, 'utf8');
  const after = fn(before);
  if (after === before) throw new Error(`setup-android (viz): nothing changed in ${file}`);
  fs.writeFileSync(p, after);
};

const src = path.join(APP, 'src/main/java', PKG);
let main = fs.readFileSync(path.join(__dirname, 'native/MainActivity.java'), 'utf8');
const at = 'web.getSettings().setMediaPlaybackRequiresUserGesture(false);';
if (!main.includes(at)) throw new Error('setup-android (viz): no place in MainActivity for the cache setting');
if (live) main = main.replace(at, `${at}\n        web.getSettings().setCacheMode(android.webkit.WebSettings.LOAD_NO_CACHE); // (LIVE: the newest push each time)`);
fs.writeFileSync(path.join(src, 'MainActivity.java'), main);
fs.copyFileSync(path.join(__dirname, 'native/NowPlayingService.java'), path.join(src, 'NowPlayingService.java'));
const capture = fs.readFileSync(path.join(ROOT, 'tools/android/CaptureService.java'), 'utf8')
  .replace('package com.emptyfishtank.bytefall;', 'package com.emptyfishtank.bytefallviz;')
  .replace('"com.emptyfishtank.bytefall.STOP_CAPTURE"', '"com.emptyfishtank.bytefallviz.STOP_CAPTURE"')
  .replace('"ByteFall visualizer"', '"ByteFall Viz"');
if (!capture.includes('package com.emptyfishtank.bytefallviz;')) throw new Error('setup-android (viz): CaptureService has changed');
fs.writeFileSync(path.join(src, 'CaptureService.java'), capture);

edit('src/main/AndroidManifest.xml', (s) => s
  .replace('android:name=".MainActivity"', 'android:name=".MainActivity"\n            android:screenOrientation="fullSensor"\n            android:supportsPictureInPicture="true"\n            android:resizeableActivity="true"')
  .replace('<uses-permission android:name="android.permission.INTERNET" />', '<uses-permission android:name="android.permission.INTERNET" />\n    <uses-permission android:name="android.permission.RECORD_AUDIO" />\n    <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />\n    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />\n    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_MEDIA_PROJECTION" />')
  .replace('</activity>', `</activity>

        <service android:name=".CaptureService" android:exported="false" android:foregroundServiceType="mediaProjection" />
        <service android:name=".NowPlayingService" android:exported="true" android:label="ByteFall Viz: now playing"
            android:permission="android.permission.BIND_NOTIFICATION_LISTENER_SERVICE">
            <intent-filter>
                <action android:name="android.service.notification.NotificationListenerService" />
            </intent-filter>
        </service>`));
edit('src/main/res/values/styles.xml', (s) => s.replace('<item name="android:background">@null</item>', '<item name="android:background">@null</item>\n        <item name="android:windowBackground">@android:color/black</item>\n        <item name="android:statusBarColor">@android:color/black</item>\n        <item name="android:navigationBarColor">@android:color/black</item>'));

const build = Number((/\?v=(\d+)/.exec(fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8')) || [])[1] || 1);
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
console.log(`android/ set up as ByteFall Viz: version 0.${build} (code ${build})${live ? ', live' : ''}`);
