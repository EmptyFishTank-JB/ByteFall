// BYTEFALL VIZ (visualizer/README.md): ByteFall's music visualizers (js/viz.js) for whatever the
// phone plays. In the app (visualizer/native/): the other apps' sound captured directly where they
// allow it (js/extsource.js, CaptureService), the microphone where they don't, and the song from
// any app with its art and play / pause / skip (NowPlayingService). On the web: on a computer,
// SCREEN AUDIO (the browser's screen share with its sound: a tab, or the whole computer's on
// Windows and ChromeOS), and the microphone.
(() => {
  const NATIVE = window.BytefallAndroid || null;
  const APP = !!(NATIVE && NATIVE.extStart);
  const NP = !!(NATIVE && NATIVE.npInfo);
  document.documentElement.classList.add(APP ? 'app' : 'web');
  const $ = (id) => document.getElementById(id);
  const store = {
    get(k, d) { try { const v = localStorage.getItem(`bfviz-${k}`); return v === null ? d : v; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(`bfviz-${k}`, v); } catch (e) {} },
  };

  // ---- SOURCE: AUTO (the app: the other apps directly, the microphone where they say no), OTHER
  // APPS (directly only), MICROPHONE
  // (the web: SCREEN AUDIO where the browser can share a screen with its sound, a computer's)
  const CAN_SCREEN = !APP && !!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) && !/Android|iPhone|iPad|Mobile/i.test(navigator.userAgent);
  const SOURCES = APP ? ['auto', 'apps', 'mic'] : CAN_SCREEN ? ['screen', 'mic'] : ['mic'];
  const SOURCE_NAMES = { auto: 'AUTO', apps: 'OTHER APPS', mic: 'MICROPHONE', screen: 'SCREEN AUDIO' };
  let source = SOURCES.includes(store.get('source', SOURCES[0])) ? store.get('source', SOURCES[0]) : SOURCES[0];
  let started = false;
  let capOn = false; // (capture listening)
  let capSince = 0;
  let capHeard = 0; // (when capture last heard anything but silence)
  let capDenied = false;
  let capEnded = false; // (stopped from its notification: a tap on SOURCE listens again)
  let mic = null; // ({ stream, ctx, an })
  let micFailed = false;
  let using = null; // ('cap', 'mic' or 'scr': where it's listening now)
  // SCREEN AUDIO (the web, a computer): the screen share's sound, left and right
  let scr = null; // ({ stream, ctx, an, pair })
  let scrNote = ''; // (why it's not listening: ENDED, NOT SHARED, NO AUDIO)
  async function startScreen() {
    if (scr) return;
    scrNote = '';
    let stream;
    try {
      // (the picture has to be asked for with the sound: kept tiny, and never shown)
      stream = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: 1, width: 320, height: 180 }, audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false }, systemAudio: 'include', selfBrowserSurface: 'exclude' });
    } catch (e) { scrNote = 'NOT SHARED'; return; }
    if (!stream.getAudioTracks().length) { stream.getTracks().forEach((t) => t.stop()); scrNote = 'NO AUDIO'; return; }
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const src = ctx.createMediaStreamSource(new MediaStream(stream.getAudioTracks()));
    const mk = () => { const a = ctx.createAnalyser(); a.fftSize = 2048; a.smoothingTimeConstant = 0.8; return a; };
    const an = mk();
    const l = mk();
    const r = mk();
    src.connect(an);
    const split = ctx.createChannelSplitter(2);
    src.connect(split);
    split.connect(l, 0);
    split.connect(r, 1);
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    stream.getAudioTracks()[0].addEventListener('ended', () => { stopScreen(); scrNote = 'ENDED'; });
    scr = { stream, ctx, an, pair: [l, r] };
  }
  function stopScreen() {
    if (!scr) return;
    scr.stream.getTracks().forEach((t) => t.stop());
    scr.ctx.close().catch(() => {});
    scr = null;
  }

  async function startMic() {
    if (mic || micFailed) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const an = ctx.createAnalyser();
      an.fftSize = 2048;
      an.smoothingTimeConstant = 0.8;
      ctx.createMediaStreamSource(stream).connect(an);
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});
      mic = { stream, ctx, an };
    } catch (e) {
      micFailed = true;
    }
  }
  function stopMic() {
    if (!mic) return;
    mic.stream.getTracks().forEach((t) => t.stop());
    mic.ctx.close().catch(() => {});
    mic = null;
  }
  async function startCapture() {
    if (capOn) return true;
    capEnded = false;
    const st = await ExtSource.start('apps');
    capOn = st === 'on';
    capDenied = !capOn;
    capSince = performance.now();
    capHeard = 0;
    return capOn;
  }
  function stopCapture() {
    if (!capOn && !ExtSource.isOn()) return;
    ExtSource.stop();
    capOn = false;
  }
  async function applySource() {
    using = null;
    if (source === 'screen') { stopMic(); await startScreen(); showSource(); return; }
    stopScreen();
    if (source === 'mic') { stopCapture(); micFailed = false; await startMic(); }
    else {
      if (source === 'apps') stopMic();
      const ok = await startCapture();
      if (!ok && source === 'auto') { micFailed = false; await startMic(); }
    }
    showSource();
  }
  // (the analyser to draw this frame, or null: the calm signal)
  function micLevel(an = mic && mic.an) {
    if (!an) return 0;
    const d = new Float32Array(an.fftSize);
    an.getFloatTimeDomainData(d);
    let m = 0;
    for (let i = 0; i < d.length; i++) m = Math.max(m, Math.abs(d[i]));
    return m;
  }
  function analyser() {
    if (!started) return null;
    if (source === 'screen') { using = scr ? 'scr' : null; return scr ? scr.an : null; }
    const now = performance.now();
    let capAn = null;
    if (capOn) {
      if (ExtSource.ended()) { ExtSource.stop(); capOn = false; capEnded = true; capHeard = 0; } else {
        capAn = ExtSource.analyser();
        if (ExtSource.level().peak > 0) capHeard = now;
      }
    }
    const capLive = capAn && now - capHeard < 1500;
    if (source === 'auto') {
      // (silence directly for 2s while something plays: that app says no, so the microphone)
      if (!capLive && !mic && !micFailed && (!capOn || now - capSince > 2000) && songPlaying() !== false) startMic();
      using = capLive ? 'cap' : mic ? 'mic' : capOn ? 'cap' : null;
    } else using = source === 'apps' ? (capOn ? 'cap' : null) : mic ? 'mic' : null;
    // (CALM WHEN PAUSED: the made-up calm signal while the song is paused, not the room's hum)
    if (calmWhenPaused && songPlaying() === false && using === 'mic') return null;
    if (using === 'cap') return capLive || source === 'apps' ? capAn : null;
    if (using === 'mic') return mic.an;
    return null;
  }
  function stereo() {
    if (using === 'scr' && scr) return scr.pair;
    if (using === 'cap') return ExtSource.stereo();
    if (using === 'mic' && mic) return [mic.an, mic.an];
    return null;
  }
  function showSource() {
    $('src-name').textContent = SOURCE_NAMES[source] + (source === 'auto' && using ? (using === 'cap' ? ' · DIRECT' : ' · MIC') : '');
    $('btn-source').textContent = `SOURCE: ${SOURCE_NAMES[source]}`;
  }
  function readout() {
    if (!started) return '';
    if (source === 'screen') {
      if (scr && scr.stream.getAudioTracks()[0].readyState === 'ended') { stopScreen(); scrNote = 'ENDED'; }
      if (scr) { const m = micLevel(scr.an); return m > 0 ? `${Math.round(20 * Math.log10(m))} DB` : 'SILENT'; }
      return scrNote === 'NO AUDIO' ? 'NO SOUND SHARED: TAP SOURCE' : scrNote ? `${scrNote}: TAP SOURCE` : '';
    }
    if (capEnded && source !== 'mic' && using !== 'mic') return 'STOPPED: TAP SOURCE';
    if (using === 'cap') {
      const { frames, peak } = ExtSource.level();
      return !frames ? 'NO DATA' : peak > 0 ? `${Math.round(20 * Math.log10(peak))} DB` : 'SILENT';
    }
    if (using === 'mic') { const m = micLevel(); return m > 0 ? `${Math.round(20 * Math.log10(m))} DB` : 'SILENT'; }
    if (capDenied && source !== 'mic') return 'NO ACCESS';
    if (micFailed) return 'NO MIC';
    return '';
  }

  // ---- the visualizer
  const ALL = ['bars', 'wave', 'scope', 'spectro', 'vu', 'radial', 'fluid', 'vector', 'vectorwide', 'lissajous', 'matrix', 'bitgrid', 'terrain', 'plasma', 'tunnel', 'orb', 'ocean', 'oceantri', 'oceanhex', 'oceantopo', 'topo', 'cloud'];
  const viz = createVisualizer($('viz'), analyser, { bars: 48, modes: ALL, key: 'bfviz-style', getStereo: stereo });
  const showStyle = () => { $('style-name').textContent = `// ${viz.name}`; };
  showStyle();
  function loop() {
    viz.draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
  let flashT = 0;
  function flash(text) {
    const f = $('flash');
    f.textContent = text;
    f.classList.add('show');
    clearTimeout(flashT);
    flashT = setTimeout(() => f.classList.remove('show'), 900);
  }
  function step(d) { viz.toggle(d); showStyle(); flash(viz.name); fillDrawer(); }

  // ---- the controls: shown on a tap, gone after a while untouched
  const ui = $('ui');
  let uiT = 0;
  function showUi(on = true) {
    ui.classList.toggle('gone', !on);
    clearTimeout(uiT);
    if (on) uiT = setTimeout(() => { if ($('drawer').hidden && $('more').hidden && $('np-ask').hidden) ui.classList.add('gone'); }, 5000);
  }
  $('viz').addEventListener('click', (e) => {
    if (!$('drawer').hidden || !$('more').hidden) { closePanels(); return; }
    const x = e.clientX / window.innerWidth;
    if (x < 0.25) step(-1);
    else if (x > 0.75) step(1);
    else showUi(ui.classList.contains('gone'));
  });
  ui.addEventListener('pointerdown', () => showUi(true));

  function closePanels() { $('drawer').hidden = true; $('more').hidden = true; showUi(true); }
  function fillDrawer() {
    const list = $('drawer-list');
    list.textContent = '';
    for (const s of viz.styles()) {
      const b = document.createElement('button');
      b.textContent = s.name;
      b.classList.toggle('lit', s.id === viz.mode);
      b.addEventListener('click', () => { viz.set(s.id); showStyle(); fillDrawer(); });
      list.append(b);
    }
  }
  $('btn-styles').addEventListener('click', () => { const open = $('drawer').hidden; closePanels(); $('drawer').hidden = !open; fillDrawer(); });
  $('btn-more').addEventListener('click', () => { const open = $('more').hidden; closePanels(); $('more').hidden = !open; });
  $('more-close').addEventListener('click', closePanels);
  $('btn-source').addEventListener('click', () => {
    if (!capEnded && !(source === 'screen' && !scr && scrNote)) source = SOURCES[(SOURCES.indexOf(source) + 1) % SOURCES.length];
    store.set('source', source);
    showSource();
    if (started) applySource();
  });
  window.vizBack = () => {
    if (!$('drawer').hidden || !$('more').hidden) { closePanels(); return true; }
    return false;
  };
  window.vizPip = (on) => { document.documentElement.classList.toggle('pip', !!on); };

  // ---- COLOR: from the song's art (ALBUM), or a fixed one
  const COLORS = [
    { id: 'album', name: 'ALBUM ART' },
    { id: 'matrix', name: 'MATRIX', fg: '57, 255, 143', accent: '255, 209, 102' },
    { id: 'cipher', name: 'CIPHER', fg: '63, 230, 255', accent: '255, 225, 77' },
    { id: 'amber', name: 'AMBER', fg: '255, 176, 0', accent: '255, 122, 31' },
    { id: 'magenta', name: 'NEON', fg: '255, 64, 200', accent: '64, 220, 255' },
    { id: 'mono', name: 'MONO', fg: '220, 220, 220', accent: '255, 255, 255' },
    { id: 'spectrum', name: 'SPECTRUM', fg: '57, 255, 143', accent: '255, 209, 102' },
  ];
  let color = COLORS.find((c) => c.id === store.get('color', 'album')) || COLORS[0];
  let artColors = null; // ({ fg, accent } from the art)
  function applyColor() {
    const root = document.documentElement;
    const c = color.id === 'album' ? (artColors || COLORS[1]) : color;
    root.style.setProperty('--fg-rgb', c.fg);
    root.style.setProperty('--accent-rgb', c.accent);
    if (color.id === 'spectrum') root.dataset.theme = 'spectrum'; else delete root.dataset.theme;
    $('btn-color').textContent = `COLOR: ${color.name}`;
  }
  $('btn-color').addEventListener('click', () => {
    color = COLORS[(COLORS.indexOf(color) + 1) % COLORS.length];
    store.set('color', color.id);
    applyColor();
  });
  // (the art's two strongest colors, made bright enough to glow: the vivid ones counted by hue)
  function colorsOf(img) {
    const n = 32;
    const c = document.createElement('canvas');
    c.width = n; c.height = n;
    const g = c.getContext('2d', { willReadFrequently: true });
    g.drawImage(img, 0, 0, n, n);
    const px = g.getImageData(0, 0, n, n).data;
    const bins = Array.from({ length: 18 }, () => ({ w: 0, r: 0, g: 0, b: 0 }));
    for (let i = 0; i < px.length; i += 4) {
      const r = px[i] / 255, gg = px[i + 1] / 255, b = px[i + 2] / 255;
      const max = Math.max(r, gg, b), min = Math.min(r, gg, b);
      const sat = max ? (max - min) / max : 0;
      const w = sat * sat * max;
      if (w < 0.02) continue;
      let h = 0;
      const d = max - min;
      if (max === r) h = ((gg - b) / d + 6) % 6; else if (max === gg) h = (b - r) / d + 2; else h = (r - gg) / d + 4;
      const bin = bins[Math.floor((h / 6) * 18) % 18];
      bin.w += w; bin.r += r * w; bin.g += gg * w; bin.b += b * w;
    }
    const order = bins.map((b, i) => ({ ...b, i })).filter((b) => b.w > 0).sort((a, b) => b.w - a.w);
    if (!order.length) return null; // (a grey cover: the fixed colors)
    const first = order[0];
    const second = order.find((b) => Math.min(Math.abs(b.i - first.i), 18 - Math.abs(b.i - first.i)) >= 3 && b.w > first.w * 0.08);
    const glow = (b) => { // (to a bright, full color)
      let r = b.r / b.w, gg = b.g / b.w, bb = b.b / b.w;
      const max = Math.max(r, gg, bb), min = Math.min(r, gg, bb);
      const s = 0.25; // (keep some of the softness)
      r = (r - min) / (max - min || 1); gg = (gg - min) / (max - min || 1); bb = (bb - min) / (max - min || 1);
      return [r, gg, bb].map((v) => Math.round(255 * (s + (1 - s) * v))).join(', ');
    };
    const fg = glow(first);
    let accent;
    if (second) accent = glow(second);
    else { const [r, gg, b] = fg.split(', ').map(Number); accent = [Math.min(255, r + 90), Math.min(255, gg + 90), Math.min(255, b + 90)].join(', '); }
    return { fg, accent };
  }

  // ---- NOW PLAYING (the app): the song from any app, its art, play / pause / skip
  let song = null;
  let songAt = 0;
  let artId = '';
  let showSong = store.get('song', 'on') === 'on';
  let askDismissed = store.get('ask-later', '') === '1';
  let calmWhenPaused = store.get('calm', 'on') === 'on';
  const songPlaying = () => (song && song.title ? !!song.playing : null); // (null: not known)
  function pollSong() {
    if (!NP) return;
    let info = null;
    try { info = JSON.parse(NATIVE.npInfo()); } catch (e) { info = null; }
    if (!info) return;
    const access = info.access === 'yes';
    $('np-ask').hidden = access || askDismissed || !showSong || !started;
    $('more-access').textContent = `NOTIFICATION ACCESS: ${access ? 'ON' : 'OFF'}`;
    song = access && info.pkg ? info : null;
    songAt = performance.now();
    $('np').hidden = !song || !showSong;
    if (!song) return;
    $('np-title').textContent = song.title || song.app;
    $('np-sub').textContent = [song.artist, song.app].filter(Boolean).join(' · ');
    $('np-toggle').innerHTML = song.playing ? '&#x23F8;' : '&#x25B6;';
    $('np-prev').disabled = !song.canPrev;
    $('np-next').disabled = !song.canNext;
    if (song.art !== artId) {
      artId = song.art;
      const url = artId ? NATIVE.npArt() : '';
      const img = $('np-art');
      if (!url) { img.removeAttribute('src'); artColors = null; applyColor(); } else {
        img.onload = () => { try { artColors = colorsOf(img); } catch (e) { artColors = null; } applyColor(); };
        img.src = url;
      }
    }
  }
  function tickSong() {
    if (!song || !song.dur) { $('np-fill').style.width = '0'; return; }
    const pos = song.pos + (song.playing ? (song.now - song.at + (performance.now() - songAt)) * (song.speed || 1) : 0);
    $('np-fill').style.width = `${Math.max(0, Math.min(100, (pos / song.dur) * 100))}%`;
  }
  const ctl = (what) => { try { NATIVE.npControl(what); } catch (e) {} setTimeout(pollSong, 250); showUi(true); };
  $('np-prev').addEventListener('click', () => ctl('prev'));
  $('np-next').addEventListener('click', () => ctl('next'));
  $('np-toggle').addEventListener('click', () => ctl('toggle'));
  $('np-allow').addEventListener('click', () => NATIVE.npAllow());
  $('more-access').addEventListener('click', () => NATIVE.npAllow());
  $('np-appinfo').addEventListener('click', (e) => { e.preventDefault(); NATIVE.openAppInfo(); });
  $('np-later').addEventListener('click', () => { askDismissed = true; store.set('ask-later', '1'); $('np-ask').hidden = true; showUi(true); });
  const showSongBtn = () => { $('btn-song').textContent = `SONG: ${showSong ? 'ON' : 'OFF'}`; };
  $('btn-song').addEventListener('click', () => {
    showSong = !showSong;
    store.set('song', showSong ? 'on' : 'off');
    if (showSong && NP) { askDismissed = false; store.set('ask-later', ''); }
    showSongBtn();
    pollSong();
  });
  if (!NP) $('btn-song').hidden = true;
  if (SOURCES.length < 2) $('btn-source').hidden = true;
  // (a computer: the mouse brings the controls up, and keys: ← → styles, F full screen, H hides)
  window.addEventListener('mousemove', () => { if (started && ui.classList.contains('gone')) showUi(true); });
  window.addEventListener('keydown', (e) => {
    if (e.target.closest && e.target.closest('input, textarea')) return;
    if (e.key === 'ArrowLeft') step(-1);
    else if (e.key === 'ArrowRight') step(1);
    else if (e.key === 'f' || e.key === 'F') $('more-full').click();
    else if (e.key === 'h' || e.key === 'H') showUi(ui.classList.contains('gone'));
    else if (e.key === 'Escape') closePanels();
  });

  // ---- MORE
  let pip = store.get('pip', 'on') === 'on';
  const showMore = () => {
    $('more-pip').textContent = `PICTURE IN PICTURE: ${pip ? 'ON' : 'OFF'}`;
    $('more-calm').textContent = `CALM WHEN PAUSED: ${calmWhenPaused ? 'ON' : 'OFF'}`;
    try { if (NATIVE && NATIVE.setPip) NATIVE.setPip(pip); } catch (e) {}
  };
  $('more-pip').addEventListener('click', () => { pip = !pip; store.set('pip', pip ? 'on' : 'off'); showMore(); });
  $('more-calm').addEventListener('click', () => { calmWhenPaused = !calmWhenPaused; store.set('calm', calmWhenPaused ? 'on' : 'off'); showMore(); });
  $('more-full').addEventListener('click', () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else document.documentElement.requestFullscreen().catch(() => {});
  });

  // ---- START: listening needs a tap first (Android's questions, the browser's microphone)
  $('start-text').textContent = APP
    ? 'Moves to whatever your phone plays. Android will ask to record or share the screen: that is how it hears the other apps (only the sound is used, nothing is recorded or kept). Apps that won\'t allow it, like Pandora, are heard through the microphone instead.'
    : CAN_SCREEN
      ? 'Moves to whatever your computer plays. The browser will ask what to share: pick the TAB that plays the music (Pandora, YouTube, ...), or on Windows the ENTIRE SCREEN for everything, and switch on its SHARE AUDIO. Only the sound is used, nothing is recorded or kept. (SOURCE: MICROPHONE hears the room instead.)'
      : 'Moves to whatever is playing near you, through the microphone. (The Android app hears the other apps on the phone directly.)';
  $('start-btn').addEventListener('click', async () => {
    $('start').hidden = true;
    started = true;
    store.set('started', '1');
    await applySource();
    pollSong();
    showUi(true);
  });

  applyColor();
  showSource();
  showSongBtn();
  showMore();
  setInterval(() => { $('src-in').textContent = readout(); showSource(); }, 300);
  setInterval(pollSong, 1000);
  setInterval(tickSong, 250);
  if (NP) pollSong();
  document.addEventListener('visibilitychange', () => { if (!document.hidden) pollSong(); });
})();
