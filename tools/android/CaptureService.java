package com.emptyfishtank.bytefall;

import android.app.Activity;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.media.AudioAttributes;
import android.media.AudioFormat;
import android.media.AudioPlaybackCaptureConfiguration;
import android.media.AudioRecord;
import android.media.projection.MediaProjection;
import android.media.projection.MediaProjectionManager;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;

// OTHER APPS (the music player's SOURCE, Android 10 and up): what the other apps are playing
// (Pandora, Spotify, ...), heard by Android's audio playback capture, the way a screen recorder
// hears it. Android asks the player each time ("start recording or casting?"; nothing is recorded
// or kept: the last moment of sound only, for the visualizer) and shows a notification while it
// listens, with STOP. Apps can say no to being heard (some do), and calls and alarms aren't heard.
// MainActivity starts it with the answer to Android's question; the page reads frame() through it
public class CaptureService extends Service {
    static final String STOP = "com.emptyfishtank.bytefall.STOP_CAPTURE";
    static final int RATE = 48000;
    static final int KEEP = 2048; // (frames handed over each time: the last 2048 of each channel)

    // (shared with MainActivity: off, on, ended (stopped by Android or the notification), error)
    static volatile String state = "off";
    static volatile long chunks = 0; // (how many reads have come in: none means NO DATA)
    private static final short[] ring = new short[KEEP * 2 * 2]; // (stereo, twice what's handed over)
    private static int at = 0; // (where the next frame goes, in frames)

    private MediaProjection projection = null;
    private AudioRecord record = null;
    private Thread reader = null;
    private volatile boolean running = false;

    // (the last KEEP frames, left and right interleaved, 16-bit little-endian)
    static byte[] frame() {
        byte[] out = new byte[KEEP * 2 * 2];
        synchronized (ring) {
            int frames = ring.length / 2;
            int start = (at - KEEP + frames) % frames;
            for (int i = 0; i < KEEP * 2; i++) {
                short s = ring[(start * 2 + i) % ring.length];
                out[2 * i] = (byte) s;
                out[2 * i + 1] = (byte) (s >> 8);
            }
        }
        return out;
    }

    @Override
    public IBinder onBind(Intent intent) { return null; }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent == null || STOP.equals(intent.getAction())) {
            if (intent != null && running) state = "ended";
            shutdown();
            stopSelf();
            return START_NOT_STICKY;
        }
        try {
            // (in the foreground first, as a projection must be from Android 14 on)
            NotificationManager nm = getSystemService(NotificationManager.class);
            nm.createNotificationChannel(new NotificationChannel("capture", "Visualizer listening", NotificationManager.IMPORTANCE_LOW));
            PendingIntent stop = PendingIntent.getService(this, 1, new Intent(this, CaptureService.class).setAction(STOP), PendingIntent.FLAG_IMMUTABLE);
            PendingIntent open = PendingIntent.getActivity(this, 2, new Intent(this, MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP), PendingIntent.FLAG_IMMUTABLE);
            Notification n = new Notification.Builder(this, "capture")
                .setSmallIcon(android.R.drawable.ic_media_play)
                .setContentTitle("ByteFall visualizer")
                .setContentText("Listening to what your apps play")
                .setContentIntent(open)
                .addAction(new Notification.Action.Builder(null, "STOP", stop).build())
                .setOngoing(true)
                .build();
            if (Build.VERSION.SDK_INT >= 29) startForeground(1, n, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PROJECTION);
            else startForeground(1, n);

            shutdown();
            int code = intent.getIntExtra("code", Activity.RESULT_CANCELED);
            Intent data = intent.getParcelableExtra("data");
            MediaProjectionManager mpm = getSystemService(MediaProjectionManager.class);
            final MediaProjection mine = mpm.getMediaProjection(code, data);
            projection = mine;
            mine.registerCallback(new MediaProjection.Callback() {
                @Override
                public void onStop() { // (stopped by Android: from the status bar, or the screen locked on some phones)
                    if (projection != mine) return; // (one we stopped ourselves)
                    if (running) state = "ended";
                    shutdown();
                    stopSelf();
                }
            }, new Handler(Looper.getMainLooper()));
            AudioPlaybackCaptureConfiguration cfg = new AudioPlaybackCaptureConfiguration.Builder(projection)
                .addMatchingUsage(AudioAttributes.USAGE_MEDIA)
                .addMatchingUsage(AudioAttributes.USAGE_GAME)
                .addMatchingUsage(AudioAttributes.USAGE_UNKNOWN)
                .build();
            AudioFormat fmt = new AudioFormat.Builder()
                .setEncoding(AudioFormat.ENCODING_PCM_16BIT)
                .setSampleRate(RATE)
                .setChannelMask(AudioFormat.CHANNEL_IN_STEREO)
                .build();
            int min = AudioRecord.getMinBufferSize(RATE, AudioFormat.CHANNEL_IN_STEREO, AudioFormat.ENCODING_PCM_16BIT);
            record = new AudioRecord.Builder()
                .setAudioFormat(fmt)
                .setBufferSizeInBytes(Math.max(min, 8192) * 2)
                .setAudioPlaybackCaptureConfig(cfg)
                .build();
            record.startRecording();
            running = true;
            chunks = 0;
            synchronized (ring) { java.util.Arrays.fill(ring, (short) 0); }
            state = "on";
            final AudioRecord rec = record;
            reader = new Thread(() -> {
                short[] buf = new short[1024]; // (512 frames: about 11ms)
                while (running) {
                    int n2 = rec.read(buf, 0, buf.length);
                    if (n2 <= 0) { if (n2 < 0) break; continue; }
                    synchronized (ring) {
                        int frames = ring.length / 2;
                        for (int i = 0; i + 1 < n2; i += 2) {
                            ring[at * 2] = buf[i];
                            ring[at * 2 + 1] = buf[i + 1];
                            at = (at + 1) % frames;
                        }
                    }
                    chunks++;
                }
            }, "bytefall-capture");
            reader.start();
        } catch (Throwable e) {
            state = "error";
            shutdown();
            stopSelf();
        }
        return START_NOT_STICKY;
    }

    private void shutdown() {
        running = false;
        if (reader != null) { try { reader.join(300); } catch (InterruptedException e) {} reader = null; }
        if (record != null) { try { record.stop(); } catch (Throwable e) {} record.release(); record = null; }
        if (projection != null) { MediaProjection p = projection; projection = null; try { p.stop(); } catch (Throwable e) {} }
    }

    @Override
    public void onDestroy() {
        shutdown();
        if (!"ended".equals(state) && !"error".equals(state)) state = "off";
        super.onDestroy();
    }
}
