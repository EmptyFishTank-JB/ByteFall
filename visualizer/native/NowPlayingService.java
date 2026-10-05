package com.emptyfishtank.bytefallviz;

import android.content.ComponentName;
import android.content.Context;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.media.MediaMetadata;
import android.media.session.MediaController;
import android.media.session.MediaSessionManager;
import android.media.session.PlaybackState;
import android.provider.Settings;
import android.service.notification.NotificationListenerService;
import android.util.Base64;
import java.io.ByteArrayOutputStream;
import java.util.List;
import org.json.JSONObject;

// NOW PLAYING: the song any app is playing (Pandora, Spotify, YouTube, ...), its art, and play,
// pause and skip, from Android's media sessions, the same that the lock screen and the quick
// settings' media player show. Android hands them only to an app the person has given
// NOTIFICATION ACCESS (Settings → Notifications → Device & app notifications), which is why this
// is a notification listener; it reads no notifications themselves, only the media sessions.
// Works even for apps that refuse to have their sound captured: the song's details aren't sound.
public class NowPlayingService extends NotificationListenerService {
    // (the person has given ByteFall Viz notification access)
    static boolean allowed(Context c) {
        String on = Settings.Secure.getString(c.getContentResolver(), "enabled_notification_listeners");
        return on != null && on.contains(new ComponentName(c, NowPlayingService.class).flattenToString());
    }

    // (the session to show: the one playing, else the first (the latest used))
    static MediaController current(Context c) {
        if (!allowed(c)) return null;
        try {
            MediaSessionManager msm = c.getSystemService(MediaSessionManager.class);
            List<MediaController> all = msm.getActiveSessions(new ComponentName(c, NowPlayingService.class));
            if (all == null || all.isEmpty()) return null;
            for (MediaController m : all) {
                PlaybackState st = m.getPlaybackState();
                if (st != null && st.getState() == PlaybackState.STATE_PLAYING) return m;
            }
            return all.get(0);
        } catch (Throwable e) {
            return null;
        }
    }

    private static String text(MediaMetadata md, String key) {
        CharSequence s = md == null ? null : md.getText(key);
        return s == null ? "" : s.toString();
    }

    // (what's playing, as JSON: access (no / yes), and with a session: pkg, app, title, artist,
    // album, playing, pos and dur (ms), at (when pos was, ms since boot, so the page can run it on),
    // speed, art (an id for the art, changing with it: "" with none))
    static String info(Context c) {
        JSONObject o = new JSONObject();
        try {
            o.put("access", allowed(c) ? "yes" : "no");
            MediaController m = current(c);
            if (m == null) return o.toString();
            MediaMetadata md = m.getMetadata();
            PlaybackState st = m.getPlaybackState();
            String pkg = m.getPackageName();
            String app = pkg;
            try {
                PackageManager pm = c.getPackageManager();
                ApplicationInfo ai = pm.getApplicationInfo(pkg, 0);
                app = pm.getApplicationLabel(ai).toString();
            } catch (Throwable e) {}
            String title = text(md, MediaMetadata.METADATA_KEY_TITLE);
            if (title.isEmpty()) title = text(md, MediaMetadata.METADATA_KEY_DISPLAY_TITLE);
            String artist = text(md, MediaMetadata.METADATA_KEY_ARTIST);
            if (artist.isEmpty()) artist = text(md, MediaMetadata.METADATA_KEY_ALBUM_ARTIST);
            if (artist.isEmpty()) artist = text(md, MediaMetadata.METADATA_KEY_DISPLAY_SUBTITLE);
            o.put("pkg", pkg);
            o.put("app", app);
            o.put("title", title);
            o.put("artist", artist);
            o.put("album", text(md, MediaMetadata.METADATA_KEY_ALBUM));
            o.put("dur", md == null ? 0 : md.getLong(MediaMetadata.METADATA_KEY_DURATION));
            o.put("playing", st != null && st.getState() == PlaybackState.STATE_PLAYING);
            o.put("pos", st == null ? 0 : st.getPosition());
            o.put("at", st == null ? 0 : st.getLastPositionUpdateTime());
            o.put("now", android.os.SystemClock.elapsedRealtime());
            o.put("speed", st == null ? 1 : st.getPlaybackSpeed());
            long actions = st == null ? 0 : st.getActions();
            o.put("canPrev", (actions & PlaybackState.ACTION_SKIP_TO_PREVIOUS) != 0);
            o.put("canNext", (actions & PlaybackState.ACTION_SKIP_TO_NEXT) != 0);
            Bitmap art = artOf(md);
            o.put("art", art == null ? "" : pkg + "|" + title + "|" + art.getGenerationId() + "|" + art.getWidth());
        } catch (Throwable e) {}
        return o.toString();
    }

    private static Bitmap artOf(MediaMetadata md) {
        if (md == null) return null;
        Bitmap b = md.getBitmap(MediaMetadata.METADATA_KEY_ALBUM_ART);
        if (b == null) b = md.getBitmap(MediaMetadata.METADATA_KEY_ART);
        if (b == null) b = md.getBitmap(MediaMetadata.METADATA_KEY_DISPLAY_ICON);
        return b;
    }

    // (the art as a data: URL, at most 512px across: asked for only when info()'s art id changes)
    static String art(Context c) {
        try {
            MediaController m = current(c);
            Bitmap b = m == null ? null : artOf(m.getMetadata());
            if (b == null) return "";
            int side = Math.max(b.getWidth(), b.getHeight());
            if (side > 512) b = Bitmap.createScaledBitmap(b, Math.max(1, b.getWidth() * 512 / side), Math.max(1, b.getHeight() * 512 / side), true);
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            b.compress(Bitmap.CompressFormat.JPEG, 86, out);
            return "data:image/jpeg;base64," + Base64.encodeToString(out.toByteArray(), Base64.NO_WRAP);
        } catch (Throwable e) {
            return "";
        }
    }

    // (play, pause, toggle, next, prev on the session shown)
    static boolean control(Context c, String what) {
        MediaController m = current(c);
        if (m == null) return false;
        MediaController.TransportControls t = m.getTransportControls();
        PlaybackState st = m.getPlaybackState();
        boolean playing = st != null && st.getState() == PlaybackState.STATE_PLAYING;
        switch (what) {
            case "play": t.play(); break;
            case "pause": t.pause(); break;
            case "toggle": if (playing) t.pause(); else t.play(); break;
            case "next": t.skipToNext(); break;
            case "prev": t.skipToPrevious(); break;
            default: return false;
        }
        return true;
    }
}
