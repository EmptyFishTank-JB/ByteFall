package com.emptyfishtank.bytefall;

import android.graphics.Color;
import android.os.Bundle;
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
//   them (music.js), until it's opened again
// - the back button works the game (window.bytefallBack, in script.js): closes what's open, pauses
//   or resumes a game, goes from the main menu to the start screen; on the start screen, the app
//   goes to the background
public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().getDecorView().setBackgroundColor(Color.BLACK);
        WebView web = bridge.getWebView();
        web.setBackgroundColor(Color.BLACK);
        web.getSettings().setMediaPlaybackRequiresUserGesture(false);
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
