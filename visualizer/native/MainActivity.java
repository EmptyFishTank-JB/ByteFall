package com.emptyfishtank.bytefallviz;

import android.Manifest;
import android.app.PictureInPictureParams;
import android.content.ComponentName;
import android.content.res.Configuration;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.media.projection.MediaProjectionConfig;
import android.media.projection.MediaProjectionManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings;
import android.util.Base64;
import android.util.Rational;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import androidx.activity.OnBackPressedCallback;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

// BYTEFALL VIZ, the app (copied over Capacitor's own by visualizer/setup-android.js):
// - full screen on black, turning with the phone, the screen kept on while it's open
// - OTHER APPS: what the other apps play, by Android's audio playback capture (CaptureService:
//   Android asks each time, as for a screen recording; a notification shows while it listens)
// - NOW PLAYING: the song from any app, its art, and play / pause / skip (NowPlayingService:
//   needs NOTIFICATION ACCESS, which the page sends the person to Android's settings to give)
// - the page talks to it through window.BytefallAndroid (the name js/extsource.js knows)
// - PICTURE IN PICTURE: leaving it for another app (the home button, or a swipe up) shrinks it to
//   a little window over that app, still moving to the music (the page can switch it off)
// - back: the page's first (window.vizBack: closes what's open), then out to the home screen
public class MainActivity extends BridgeActivity {
    private static final int ASK_AUDIO = 7301;
    private static final int ASK_CAPTURE = 7302;
    private volatile boolean pipOn = true;
    private volatile String extState = "off"; // (off, asking, capture (CaptureService's state then), denied, error)

    private void askCapture() {
        extState = "asking";
        CaptureService.state = "off";
        MediaProjectionManager mpm = getSystemService(MediaProjectionManager.class);
        Intent ask = Build.VERSION.SDK_INT >= 34
            ? mpm.createScreenCaptureIntent(MediaProjectionConfig.createConfigForDefaultDisplay())
            : mpm.createScreenCaptureIntent();
        startActivityForResult(ask, ASK_CAPTURE);
    }
    private void stopCapture() {
        try { startService(new Intent(this, CaptureService.class).setAction(CaptureService.STOP)); } catch (Throwable e) {}
        CaptureService.state = "off";
        extState = "off";
    }

    @Override
    protected void onActivityResult(int code, int result, Intent data) {
        super.onActivityResult(code, result, data);
        if (code != ASK_CAPTURE) return;
        if (result != RESULT_OK || data == null) { extState = "denied"; return; }
        try {
            startForegroundService(new Intent(this, CaptureService.class).putExtra("code", result).putExtra("data", data));
            extState = "capture";
        } catch (Throwable e) {
            extState = "error";
        }
    }

    @Override
    public void onRequestPermissionsResult(int code, String[] perms, int[] results) {
        super.onRequestPermissionsResult(code, perms, results);
        if (code != ASK_AUDIO) return;
        if (results.length > 0 && results[0] == PackageManager.PERMISSION_GRANTED) askCapture();
        else extState = "denied";
    }

    @Override
    public void onDestroy() {
        stopCapture();
        super.onDestroy();
    }

    public class AppBridge {
        // OTHER APPS (as in ByteFall's app: js/extsource.js): start (the audio permission first,
        // then Android's capture question), stop, its state, and a frame "pcm,rate,base64"
        @JavascriptInterface
        public String extStart() {
            extState = "asking";
            runOnUiThread(() -> {
                if (checkSelfPermission(Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED)
                    requestPermissions(new String[] { Manifest.permission.RECORD_AUDIO }, ASK_AUDIO);
                else askCapture();
            });
            return extState;
        }
        @JavascriptInterface
        public void extStop() { runOnUiThread(() -> stopCapture()); }
        @JavascriptInterface
        public String extState() {
            if (!"capture".equals(extState)) return extState;
            String st = CaptureService.state;
            return "off".equals(st) ? "asking" : st;
        }
        @JavascriptInterface
        public String extFrame() {
            if (!"capture".equals(extState) || !"on".equals(CaptureService.state) || CaptureService.chunks == 0) return "";
            return "pcm," + CaptureService.RATE + "," + Base64.encodeToString(CaptureService.frame(), Base64.NO_WRAP);
        }
        // (the microphone's permission, for AUTO's fallback: the page's getUserMedia asks too, but
        // Android's own question has to have been answered first)
        @JavascriptInterface
        public boolean hasMic() { return checkSelfPermission(Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED; }

        // NOW PLAYING: what's playing (JSON), its art (a data: URL), play / pause / toggle / next /
        // prev, and Android's notification access page to allow it
        @JavascriptInterface
        public String npInfo() { return NowPlayingService.info(MainActivity.this); }
        @JavascriptInterface
        public String npArt() { return NowPlayingService.art(MainActivity.this); }
        @JavascriptInterface
        public boolean npControl(String what) { return NowPlayingService.control(MainActivity.this, what); }
        @JavascriptInterface
        public void npAllow() {
            runOnUiThread(() -> {
                Intent i;
                if (Build.VERSION.SDK_INT >= 30) {
                    i = new Intent(Settings.ACTION_NOTIFICATION_LISTENER_DETAIL_SETTINGS)
                        .putExtra(Settings.EXTRA_NOTIFICATION_LISTENER_COMPONENT_NAME, new ComponentName(MainActivity.this, NowPlayingService.class).flattenToString());
                } else i = new Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS);
                try { startActivity(i); } catch (Throwable e) {
                    try { startActivity(new Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS)); } catch (Throwable e2) {}
                }
            });
        }
        // (the app's own page in Android's settings: where "Allow restricted settings" is, which an
        // app installed from outside a store needs before it can be given notification access)
        @JavascriptInterface
        public void openAppInfo() {
            runOnUiThread(() -> {
                try { startActivity(new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.fromParts("package", getPackageName(), null))); } catch (Throwable e) {}
            });
        }
        @JavascriptInterface
        public int sdk() { return Build.VERSION.SDK_INT; }
        @JavascriptInterface
        public void setPip(boolean on) { pipOn = on; }
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().getDecorView().setBackgroundColor(Color.BLACK);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        WebView web = bridge.getWebView();
        web.setBackgroundColor(Color.BLACK);
        web.getSettings().setMediaPlaybackRequiresUserGesture(false);
        web.addJavascriptInterface(new AppBridge(), "BytefallAndroid");
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                bridge.getWebView().evaluateJavascript(
                    "window.vizBack ? window.vizBack() : false",
                    (handled) -> { if (!"true".equals(handled)) moveTaskToBack(true); });
            }
        });
    }

    @Override
    protected void onUserLeaveHint() {
        super.onUserLeaveHint();
        if (!pipOn) return;
        try { enterPictureInPictureMode(new PictureInPictureParams.Builder().setAspectRatio(new Rational(1, 1)).build()); } catch (Throwable e) {}
    }

    @Override
    public void onPictureInPictureModeChanged(boolean inPip, Configuration cfg) {
        super.onPictureInPictureModeChanged(inPip, cfg);
        bridge.getWebView().evaluateJavascript("window.vizPip && window.vizPip(" + inPip + ")", null);
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (!hasFocus) return;
        WindowInsetsControllerCompat bars = WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
        bars.hide(WindowInsetsCompat.Type.systemBars());
        bars.setSystemBarsBehavior(WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
    }
}
