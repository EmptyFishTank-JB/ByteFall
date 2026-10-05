package com.emptyfishtank.bytefall;

import android.Manifest;
import android.content.Intent;
import android.content.pm.ActivityInfo;
import android.media.projection.MediaProjectionConfig;
import android.media.projection.MediaProjectionManager;
import android.os.Build;
import android.content.pm.PackageManager;
import android.media.audiofx.Visualizer;
import android.util.Base64;
import android.graphics.Color;
import android.os.Bundle;
import android.webkit.JavascriptInterface;
import android.view.WindowManager;
import android.webkit.WebView;
import androidx.activity.OnBackPressedCallback;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

// ByteFall's Android app (copied over Capacitor's own by tools/setup-android.js):
// - full screen, as the installed web app is (the system bars come back with a swipe, then hide),
//   on black, so the strip a bar leaves (or the camera's notch) is black, not grey
// - the music starts as the app opens (no tap needed first)
// - in the background everything rests: the game's timers and animation stop, and the music with
//   them (music.js), until it's opened again; except with the MUSIC PLAYER open, when the music
//   plays on (player.js tells this through window.BytefallAndroid)
// - the back button works the game (window.bytefallBack, in script.js): closes what's open, pauses
//   or resumes a game, goes from the main menu to the start screen; on the start screen, the app
//   goes to the background
public class MainActivity extends BridgeActivity {
    private volatile boolean playerOpen = false;
    // OTHER APPS (the music player's SOURCE): what the phone is playing, from any app (Pandora,
    // Spotify, ...). From Android 10 on, by audio playback capture (CaptureService: Android asks
    // each time, as for a screen recording, and shows a notification while it listens); before
    // that, through Android's Visualizer on the output mix (session 0). Either needs the
    // RECORD_AUDIO permission (asked for once; nothing is recorded or kept)
    private static final int ASK_AUDIO = 7301;
    private static final int ASK_CAPTURE = 7302;
    private static boolean capture() { return Build.VERSION.SDK_INT >= 29; }

    // (Android's "start recording or casting?" question; the answer goes to CaptureService. The
    // whole screen's sound, not one app's: from Android 14 the question can offer just one app)
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
        if (!capture()) return;
        try { startService(new Intent(this, CaptureService.class).setAction(CaptureService.STOP)); } catch (Throwable e) {}
        CaptureService.state = "off";
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
    private Visualizer outputViz = null;
    private volatile String extState = "off"; // (off, asking, on, denied, error)
    private byte[] fftBuf = null;
    private byte[] waveBuf = null;

    private void startOutputViz() {
        try {
            if (outputViz != null) { extState = "on"; return; }
            Visualizer v = new Visualizer(0);
            v.setEnabled(false);
            int[] range = Visualizer.getCaptureSizeRange();
            v.setCaptureSize(Math.min(1024, range[1]));
            v.setEnabled(true);
            fftBuf = new byte[v.getCaptureSize()];
            waveBuf = new byte[v.getCaptureSize()];
            outputViz = v;
            extState = "on";
        } catch (Throwable e) {
            extState = "error";
        }
    }
    private void stopOutputViz() {
        if (outputViz != null) { try { outputViz.setEnabled(false); outputViz.release(); } catch (Throwable e) {} }
        outputViz = null;
        extState = "off";
    }

    @Override
    public void onDestroy() {
        stopOutputViz();
        stopCapture();
        super.onDestroy();
    }

    @Override
    public void onRequestPermissionsResult(int code, String[] perms, int[] results) {
        super.onRequestPermissionsResult(code, perms, results);
        if (code != ASK_AUDIO) return;
        if (results.length > 0 && results[0] == PackageManager.PERMISSION_GRANTED) {
            if (capture()) askCapture(); else startOutputViz();
        }
        else extState = "denied";
    }

    // (what the page can tell the app: window.BytefallAndroid)
    public class AppBridge {
        @JavascriptInterface
        public void setPlayerOpen(boolean open) { playerOpen = open; }
        // (OTHER APPS: start listening (asking for the permission first if it's not given yet),
        // stop, how it's going (off, asking, on, ended, denied, error), and a frame: by capture,
        // "pcm,rate,base64" (the last 2048 stereo frames, 16-bit), or by the Visualizer,
        // "rate,fftBase64,waveBase64" (the FFT as Android gives it, real and imaginary bytes, and
        // the wave as unsigned bytes))
        @JavascriptInterface
        public String extStart() {
            extState = "asking";
            runOnUiThread(() -> {
                if (checkSelfPermission(Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED)
                    requestPermissions(new String[] { Manifest.permission.RECORD_AUDIO }, ASK_AUDIO);
                else if (capture()) askCapture();
                else startOutputViz();
            });
            return extState;
        }
        @JavascriptInterface
        public void extStop() { runOnUiThread(() -> { stopOutputViz(); stopCapture(); }); }
        @JavascriptInterface
        public String extState() {
            if (!"capture".equals(extState)) return extState;
            String st = CaptureService.state; // (the service's: off until it's going, then on, ended or error)
            return "off".equals(st) ? "asking" : st;
        }
        @JavascriptInterface
        public String extFrame() {
            if ("capture".equals(extState)) {
                if (!"on".equals(CaptureService.state) || CaptureService.chunks == 0) return "";
                return "pcm," + CaptureService.RATE + "," + Base64.encodeToString(CaptureService.frame(), Base64.NO_WRAP);
            }
            Visualizer v = outputViz;
            if (v == null) return "";
            try {
                v.getFft(fftBuf);
                v.getWaveForm(waveBuf);
                return v.getSamplingRate() + "," + Base64.encodeToString(fftBuf, Base64.NO_WRAP) + "," + Base64.encodeToString(waveBuf, Base64.NO_WRAP);
            } catch (Throwable e) {
                return "";
            }
        }
        // (the music player's FULL SCREEN visualizer: it turns with the phone by its sensor, even
        // with the phone's rotation locked, and the screen stays on while it's up; everywhere else
        // the game stays portrait and the screen sleeps as usual)
        @JavascriptInterface
        public void setVizFullscreen(boolean on) {
            runOnUiThread(() -> {
                setRequestedOrientation(on ? ActivityInfo.SCREEN_ORIENTATION_FULL_SENSOR : ActivityInfo.SCREEN_ORIENTATION_PORTRAIT);
                if (on) getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
                else getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
            });
        }
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().getDecorView().setBackgroundColor(Color.BLACK);
        WebView web = bridge.getWebView();
        web.setBackgroundColor(Color.BLACK);
        web.getSettings().setMediaPlaybackRequiresUserGesture(false);
        web.addJavascriptInterface(new AppBridge(), "BytefallAndroid");
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                bridge.getWebView().evaluateJavascript(
                    "window.bytefallBack ? window.bytefallBack() : false",
                    (handled) -> { if (!"true".equals(handled)) moveTaskToBack(true); });
            }
        });
    }

    @Override
    public void onPause() {
        super.onPause();
        if (playerOpen) return; // (the music plays on: only the page's drawing stops, as Android does)
        WebView web = bridge.getWebView();
        web.onPause(); // (the page is told it's hidden: the game and the music rest)
        web.pauseTimers(); // (and its timers stop)
    }

    @Override
    public void onResume() {
        super.onResume();
        WebView web = bridge.getWebView();
        web.resumeTimers();
        web.onResume();
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
