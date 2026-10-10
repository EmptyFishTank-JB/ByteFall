package com.emptyfishtank.bytefall;

import android.Manifest;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ActivityInfo;
import android.content.res.Configuration;
import android.media.projection.MediaProjectionConfig;
import android.media.projection.MediaProjectionManager;
import android.os.Build;
import android.content.pm.PackageManager;
import android.media.audiofx.Visualizer;
import android.util.Base64;
import android.graphics.Color;
import android.os.Bundle;
import android.webkit.JavascriptInterface;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowManager;
import android.webkit.WebView;
import androidx.activity.OnBackPressedCallback;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.android.billingclient.api.AcknowledgePurchaseParams;
import com.android.billingclient.api.BillingClient;
import com.android.billingclient.api.BillingClientStateListener;
import com.android.billingclient.api.BillingFlowParams;
import com.android.billingclient.api.BillingResult;
import com.android.billingclient.api.ConsumeParams;
import com.android.billingclient.api.PendingPurchasesParams;
import com.android.billingclient.api.ProductDetails;
import com.android.billingclient.api.Purchase;
import com.android.billingclient.api.QueryProductDetailsParams;
import com.android.billingclient.api.QueryPurchasesParams;
import com.android.billingclient.api.UnfetchedProduct;
import com.getcapacitor.BridgeActivity;
import com.google.android.play.core.appupdate.AppUpdateManager;
import com.google.android.play.core.appupdate.AppUpdateManagerFactory;
import com.google.android.play.core.appupdate.AppUpdateOptions;
import com.google.android.play.core.install.InstallStateUpdatedListener;
import com.google.android.play.core.install.model.AppUpdateType;
import com.google.android.play.core.install.model.InstallStatus;
import com.google.android.play.core.install.model.UpdateAvailability;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.json.JSONObject;

// ByteFall's Android app (copied over Capacitor's own by tools/setup-android.js):
// - full screen, as the installed web app is (the system bars come back with a swipe, then hide),
//   on black, so the strip a bar leaves (or the camera's notch) is black, not gray
// - the music starts as the app opens (no tap needed first)
// - in the background everything rests: the game's timers and animation stop, and the music with
//   them (music.js), until it's opened again; except with the MUSIC PLAYER open, when the music
//   plays on (player.js tells this through window.BytefallAndroid)
// - the back button works the game (window.bytefallBack, in script.js): closes what's open, pauses
//   or resumes a game, goes from the main menu to the start screen; on the start screen, the app
//   goes to the background
// - the game's own text sizes, whatever the phone's FONT SIZE and BOLD TEXT settings (as games do):
//   the layout is built around them (buttons locked to their size, titles fitted), so the phone's
//   bigger or bolder text only crowds and breaks it
// - the STORE's purchases, by Google Play's billing (the RELEASE edition's: js/billing.js)
public class MainActivity extends BridgeActivity {
    // (the phone's text settings left out of the app's own: font scale 1, no extra weight. Android
    // starts the activity over when they change, so this holds; and the page's text zoom pinned to
    // 100% as well, below, as the WebView otherwise takes it from the phone's FONT SIZE)
    @Override
    protected void attachBaseContext(Context base) {
        Configuration own = new Configuration(base.getResources().getConfiguration());
        own.fontScale = 1f;
        if (Build.VERSION.SDK_INT >= 31) own.fontWeightAdjustment = 0;
        super.attachBaseContext(base.createConfigurationContext(own));
    }

    private volatile boolean playerOpen = false;
    // OTHER APPS (the music player's SOURCE): what the phone is playing, from any app (Pandora,
    // Spotify, ...). From Android 10 on, by audio playback capture (CaptureService: Android asks
    // each time, as for a screen recording, and shows a notification while it listens); before
    // that, through Android's Visualizer on the output mix (session 0). Either needs the
    // RECORD_AUDIO permission (asked for once; nothing is recorded or kept)
    private static final int ASK_AUDIO = 7301;
    private static final int ASK_CAPTURE = 7302;
    private static boolean capture() { return Build.VERSION.SDK_INT >= 29; }
    // (OTHER APPS only where the app declares CaptureService: the TEST edition. The RELEASE edition, for
    // Google Play, leaves it out (its own manifest, tools/setup-android.js), and so refuses here too)
    private boolean otherAppsOn() {
        try {
            getPackageManager().getServiceInfo(new ComponentName(this, CaptureService.class), 0);
            return true;
        } catch (PackageManager.NameNotFoundException e) {
            return false;
        }
    }

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

    // PURCHASES (the STORE's REMOVE ADS and FULL ACCESS, js/billing.js): Google Play's billing. The
    // page asks through window.BytefallAndroid (billingStart, billingBuy, billingRestore; only the
    // RELEASE edition's page does) and hears back through window.bytefallBilling(event): the prices,
    // what the account owns, how a purchase went. Each purchase is acknowledged (Google Play refunds
    // one that isn't, after 3 days); a pending one (paid later, as with cash) unlocks nothing till
    // it's paid; and what's owned is asked again whenever the app comes back to the front, so a
    // pending purchase paid meanwhile unlocks, and a refunded one is taken back. All on the UI thread
    private static final List<String> PRODUCTS = Arrays.asList("remove_ads", "full_access", "full_access_upgrade");
    private BillingClient billing = null;
    private boolean billingSetUp = false; // (connected once: the library reconnects by itself after)
    private boolean billingConnecting = false;
    private final List<Runnable> billingWaiting = new ArrayList<>();
    private final Map<String, ProductDetails> products = new HashMap<>();

    // (an event for the page, as JSON)
    private void tellPage(String json) {
        runOnUiThread(() -> bridge.getWebView().evaluateJavascript("window.bytefallBilling && window.bytefallBilling(" + json + ")", null));
    }
    private void tellFailed(String reason) {
        tellPage("{\"type\":\"failed\",\"reason\":" + JSONObject.quote(reason) + "}");
    }
    private static String jsonList(List<String> ids) {
        StringBuilder s = new StringBuilder("[");
        for (int i = 0; i < ids.size(); i++) s.append(i > 0 ? "," : "").append(JSONObject.quote(ids.get(i)));
        return s.append("]").toString();
    }

    // (runs then once connected to Google Play, connecting first if it hasn't yet)
    private void withBilling(Runnable then) {
        if (billing == null) {
            billing = BillingClient.newBuilder(this)
                .setListener(this::onPurchasesUpdated)
                .enablePendingPurchases(PendingPurchasesParams.newBuilder().enableOneTimeProducts().build())
                .enableAutoServiceReconnection()
                .build();
        }
        if (billingSetUp) { then.run(); return; }
        billingWaiting.add(then);
        if (billingConnecting) return;
        billingConnecting = true;
        billing.startConnection(new BillingClientStateListener() {
            @Override
            public void onBillingSetupFinished(BillingResult result) {
                runOnUiThread(() -> connected(result.getResponseCode() == BillingClient.BillingResponseCode.OK));
            }
            @Override
            public void onBillingServiceDisconnected() {
                runOnUiThread(() -> { if (billingConnecting) connected(false); });
            }
        });
    }
    private void connected(boolean ok) {
        billingConnecting = false;
        billingSetUp = ok;
        List<Runnable> waiting = new ArrayList<>(billingWaiting);
        billingWaiting.clear();
        if (ok) for (Runnable r : waiting) r.run();
        else if (!waiting.isEmpty()) tellFailed("unavailable"); // (no Play Store, or not signed in)
    }

    // (the one-time product's offer: there's one, its price set in Play Console)
    private static ProductDetails.OneTimePurchaseOfferDetails offerOf(ProductDetails d) {
        ProductDetails.OneTimePurchaseOfferDetails offer = d.getOneTimePurchaseOfferDetails();
        List<ProductDetails.OneTimePurchaseOfferDetails> all = d.getOneTimePurchaseOfferDetailsList();
        if (offer == null && all != null && !all.isEmpty()) offer = all.get(0);
        return offer;
    }

    // (why products didn't come back, Google Play's own word for each: TEST PURCHASES shows it, js/store.js)
    private String productsWhy = "";

    // (the products and their prices, in the player's currency)
    private void queryProducts(Runnable then) {
        List<QueryProductDetailsParams.Product> list = new ArrayList<>();
        for (String id : PRODUCTS) list.add(QueryProductDetailsParams.Product.newBuilder().setProductId(id).setProductType(BillingClient.ProductType.INAPP).build());
        billing.queryProductDetailsAsync(QueryProductDetailsParams.newBuilder().setProductList(list).build(), (result, found) -> runOnUiThread(() -> {
            StringBuilder why = new StringBuilder();
            if (result.getResponseCode() == BillingClient.BillingResponseCode.OK) {
                StringBuilder prices = new StringBuilder();
                for (ProductDetails d : found.getProductDetailsList()) {
                    ProductDetails.OneTimePurchaseOfferDetails offer = offerOf(d);
                    if (offer == null) { why.append(why.length() > 0 ? ", " : "").append(d.getProductId()).append(": no price (purchase option)"); continue; }
                    products.put(d.getProductId(), d);
                    prices.append(prices.length() > 0 ? "," : "").append(JSONObject.quote(d.getProductId())).append(':').append(JSONObject.quote(offer.getFormattedPrice()));
                }
                for (UnfetchedProduct u : found.getUnfetchedProductList()) why.append(why.length() > 0 ? ", " : "").append(u.getProductId()).append(": status ").append(u.getStatusCode());
                for (String id : PRODUCTS) if (!products.containsKey(id) && why.indexOf(id) < 0) why.append(why.length() > 0 ? ", " : "").append(id).append(": not returned");
                productsWhy = why.toString();
                tellPage("{\"type\":\"products\",\"prices\":{" + prices + "},\"why\":" + JSONObject.quote(productsWhy) + "}");
            } else {
                productsWhy = "query failed: code " + result.getResponseCode() + (result.getDebugMessage().isEmpty() ? "" : " (" + result.getDebugMessage() + ")");
                tellPage("{\"type\":\"products\",\"prices\":{},\"why\":" + JSONObject.quote(productsWhy) + "}");
            }
            if (then != null) then.run();
        }));
    }

    // (everything the account owns; restore: for RESTORE PURCHASES, which says how it went)
    private void queryOwned(boolean restore) {
        billing.queryPurchasesAsync(QueryPurchasesParams.newBuilder().setProductType(BillingClient.ProductType.INAPP).build(), (result, purchases) -> runOnUiThread(() -> {
            if (result.getResponseCode() == BillingClient.BillingResponseCode.OK) tellPurchases("owned", purchases, restore);
            else if (restore) tellFailed("unavailable");
        }));
    }

    // (what's paid for, acknowledged if it wasn't yet, and what's still pending)
    private void tellPurchases(String type, List<Purchase> purchases, boolean restore) {
        List<String> owned = new ArrayList<>();
        List<String> pending = new ArrayList<>();
        for (Purchase p : purchases) {
            if (p.getPurchaseState() == Purchase.PurchaseState.PURCHASED) {
                owned.addAll(p.getProducts());
                if (!p.isAcknowledged()) {
                    billing.acknowledgePurchase(AcknowledgePurchaseParams.newBuilder().setPurchaseToken(p.getPurchaseToken()).build(), (r) -> {}); // (one that fails is acknowledged at the next check)
                }
            } else if (p.getPurchaseState() == Purchase.PurchaseState.PENDING) {
                pending.addAll(p.getProducts());
            }
        }
        tellPage("{\"type\":" + JSONObject.quote(type) + ",\"owned\":" + jsonList(owned) + ",\"pending\":" + jsonList(pending) + ",\"restore\":" + restore + "}");
    }

    // TEST PURCHASES (SETTINGS, builds with test ads only: js/store.js): everything the account owns
    // used up, so Google Play forgets it and a license tester can buy it again with the test card;
    // then what's owned (nothing) told to the page as RESTORE PURCHASES would
    private void consumeOwned() {
        billing.queryPurchasesAsync(QueryPurchasesParams.newBuilder().setProductType(BillingClient.ProductType.INAPP).build(), (result, purchases) -> runOnUiThread(() -> {
            if (result.getResponseCode() != BillingClient.BillingResponseCode.OK) { tellFailed("unavailable"); return; }
            if (purchases.isEmpty()) { queryOwned(true); return; }
            final int[] left = { purchases.size() };
            for (Purchase p : purchases) {
                billing.consumeAsync(ConsumeParams.newBuilder().setPurchaseToken(p.getPurchaseToken()).build(), (r, token) -> runOnUiThread(() -> {
                    if (--left[0] == 0) queryOwned(true);
                }));
            }
        }));
    }

    // (a purchase made, or paid at last; or canceled, or failed)
    private void onPurchasesUpdated(BillingResult result, List<Purchase> purchases) {
        runOnUiThread(() -> {
            int code = result.getResponseCode();
            if (code == BillingClient.BillingResponseCode.OK && purchases != null) tellPurchases("bought", purchases, false);
            else if (code == BillingClient.BillingResponseCode.USER_CANCELED) tellFailed("canceled");
            else if (code == BillingClient.BillingResponseCode.ITEM_ALREADY_OWNED) queryOwned(true);
            else tellFailed("error");
        });
    }

    // (Google Play's purchase sheet, over the game)
    private void launchPurchase(String id) {
        ProductDetails d = products.get(id);
        if (d == null) { tellPage("{\"type\":\"failed\",\"reason\":\"missing\",\"why\":" + JSONObject.quote(productsWhy) + "}"); return; } // (not set up in Play Console, or not active)
        BillingFlowParams.ProductDetailsParams.Builder item = BillingFlowParams.ProductDetailsParams.newBuilder().setProductDetails(d);
        ProductDetails.OneTimePurchaseOfferDetails offer = offerOf(d);
        if (offer != null && offer.getOfferToken() != null && !offer.getOfferToken().isEmpty()) item.setOfferToken(offer.getOfferToken());
        BillingResult r = billing.launchBillingFlow(this, BillingFlowParams.newBuilder().setProductDetailsParamsList(Collections.singletonList(item.build())).build());
        int code = r.getResponseCode();
        if (code == BillingClient.BillingResponseCode.ITEM_ALREADY_OWNED) queryOwned(true);
        else if (code == BillingClient.BillingResponseCode.USER_CANCELED) tellFailed("canceled");
        else if (code != BillingClient.BillingResponseCode.OK) tellFailed("error");
    }

    @Override
    public void onDestroy() {
        stopOutputViz();
        stopCapture();
        if (billing != null) billing.endConnection();
        if (updates != null) updates.unregisterListener(updateListener);
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
            if (!otherAppsOn()) { extState = "error"; return extState; }
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
        // (PURCHASES, above: the prices and what's owned, as the game opens; BUY; RESTORE PURCHASES)
        @JavascriptInterface
        public void billingStart() { runOnUiThread(() -> withBilling(() -> queryProducts(() -> queryOwned(false)))); }
        @JavascriptInterface
        public void billingBuy(String id) {
            runOnUiThread(() -> withBilling(() -> {
                if (products.containsKey(id)) launchPurchase(id);
                else queryProducts(() -> launchPurchase(id)); // (the prices didn't come at the start: once more)
            }));
        }
        @JavascriptInterface
        public void billingRestore() { runOnUiThread(() -> withBilling(() -> queryOwned(true))); }
        @JavascriptInterface
        public void billingReset() { runOnUiThread(() -> withBilling(() -> consumeOwned())); }
        // IN-APP UPDATES (js/app-update.js): is there a newer version; get it; install it and restart
        @JavascriptInterface
        public void updateCheck() { runOnUiThread(() -> { updatesWanted = true; checkUpdate(); }); }
        @JavascriptInterface
        public void updateStart() { runOnUiThread(() -> startUpdate()); }
        @JavascriptInterface
        public void updateRestart() { runOnUiThread(() -> updates().completeUpdate()); }
    }

    // IN-APP UPDATES (Google Play's in-app updates; js/app-update.js asks, the Google Play release
    // only): a newer version on the player's track is told to the page ('available'), which shows
    // UPDATE on the main menu; a tap opens Google Play's own sheet (a FLEXIBLE update: it downloads
    // while the game goes on, 'downloading' with its percent), and once it's in ('ready') the page's
    // RESTART TO UPDATE has Google Play install it and start the game again
    private AppUpdateManager updates;
    private boolean updatesWanted = false; // (the page asked: checked again on each return to the app)
    private static final int UPDATE_REQUEST = 7001;
    private final InstallStateUpdatedListener updateListener = (state) -> {
        int s = state.installStatus();
        if (s == InstallStatus.DOWNLOADING) {
            long total = state.totalBytesToDownload();
            int pct = total > 0 ? (int) (state.bytesDownloaded() * 100 / total) : 0;
            tellUpdate("{\"state\":\"downloading\",\"percent\":" + pct + "}");
        } else if (s == InstallStatus.DOWNLOADED) tellUpdate("{\"state\":\"ready\"}");
        else if (s == InstallStatus.FAILED || s == InstallStatus.CANCELED) tellUpdate("{\"state\":\"failed\"}");
    };
    private void tellUpdate(String json) {
        runOnUiThread(() -> bridge.getWebView().evaluateJavascript("window.bytefallUpdate && window.bytefallUpdate(" + json + ")", null));
    }
    private AppUpdateManager updates() {
        if (updates == null) {
            updates = AppUpdateManagerFactory.create(this);
            updates.registerListener(updateListener);
        }
        return updates;
    }
    private void checkUpdate() {
        updates().getAppUpdateInfo().addOnSuccessListener((info) -> {
            if (info.installStatus() == InstallStatus.DOWNLOADED) tellUpdate("{\"state\":\"ready\"}");
            else if (info.updateAvailability() == UpdateAvailability.DEVELOPER_TRIGGERED_UPDATE_IN_PROGRESS) tellUpdate("{\"state\":\"downloading\",\"percent\":0}");
            else if (info.updateAvailability() == UpdateAvailability.UPDATE_AVAILABLE && info.isUpdateTypeAllowed(AppUpdateType.FLEXIBLE)) {
                tellUpdate("{\"state\":\"available\",\"version\":" + info.availableVersionCode() + "}");
            }
        }); // (not installed from Google Play, or no Play Store: it fails quietly, and nothing shows)
    }
    private void startUpdate() {
        updates().getAppUpdateInfo().addOnSuccessListener((info) -> {
            if (info.updateAvailability() != UpdateAvailability.UPDATE_AVAILABLE || !info.isUpdateTypeAllowed(AppUpdateType.FLEXIBLE)) { checkUpdate(); return; }
            try {
                updates().startUpdateFlowForResult(info, this, AppUpdateOptions.newBuilder(AppUpdateType.FLEXIBLE).build(), UPDATE_REQUEST);
            } catch (Exception e) {
                tellUpdate("{\"state\":\"failed\"}");
            }
        });
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().getDecorView().setBackgroundColor(Color.BLACK);
        WebView web = bridge.getWebView();
        web.setBackgroundColor(Color.BLACK);
        web.getSettings().setMediaPlaybackRequiresUserGesture(false);
        web.getSettings().setTextZoom(100); // (the game's text sizes, not the phone's FONT SIZE)
        web.addJavascriptInterface(new AppBridge(), "BytefallAndroid");
        getWindow().getDecorView().getViewTreeObserver().addOnGlobalLayoutListener(this::pinAdToPage);
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                bridge.getWebView().evaluateJavascript(
                    "window.bytefallBack ? window.bytefallBack() : false",
                    (handled) -> { if (!"true".equals(handled)) moveTaskToBack(true); });
            }
        });
    }

    // THE BANNER AD, pinned level with the top of the page: on Android 15 and later the ads plugin
    // moves it down by the status bar's room (though the game hides the bars, and the page already
    // starts below that room), which put it over the game's title. After each layout its top is
    // put back level with the page's, where the AD STRIP (js/ads.js, script.js) keeps room for it.
    private int pinnedMargin = Integer.MIN_VALUE; // (the margin last set: still off after it, the layout's not one this can move, so it's left be)
    private void pinAdToPage() {
        View content = findViewById(android.R.id.content);
        if (!(content instanceof ViewGroup)) return;
        View box = adBox((ViewGroup) content);
        if (box == null || !(box.getLayoutParams() instanceof ViewGroup.MarginLayoutParams)) return;
        int[] at = new int[2];
        int[] page = new int[2];
        box.getLocationOnScreen(at);
        bridge.getWebView().getLocationOnScreen(page);
        int off = page[1] - at[1];
        if (off == 0) return;
        ViewGroup.MarginLayoutParams lp = (ViewGroup.MarginLayoutParams) box.getLayoutParams();
        if (lp.topMargin == pinnedMargin) return;
        lp.topMargin += off;
        pinnedMargin = lp.topMargin;
        box.setLayoutParams(lp); // (laid out again: level then, so this stops)
    }
    // (the layout the plugin puts the banner in: the parent of Google's AdView, found by its class
    // name, as the ads library is the plugin's and not on this file's path)
    private View adBox(ViewGroup group) {
        for (int i = 0; i < group.getChildCount(); i++) {
            View v = group.getChildAt(i);
            if (isAdView(v)) return v.getParent() instanceof View ? (View) v.getParent() : null;
            if (v instanceof ViewGroup && !(v instanceof WebView)) {
                View found = adBox((ViewGroup) v);
                if (found != null) return found;
            }
        }
        return null;
    }
    private static boolean isAdView(View v) {
        for (Class<?> c = v.getClass(); c != null; c = c.getSuperclass()) {
            if ("com.google.android.gms.ads.BaseAdView".equals(c.getName())) return true;
        }
        return false;
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
        if (billingSetUp) queryOwned(false); // (a purchase paid, or refunded, while away)
        if (updatesWanted) checkUpdate(); // (an update downloaded, or a newer one out, while away)
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
