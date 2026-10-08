// ADS (the Android app only): the free version's banner, from Google AdMob (the Capacitor plugin
// @capacitor-community/admob; its IDs in js/ads-config.js). Never on the web or with REMOVE ADS or
// FULL ACCESS owned.
// - first Google's consent form, where the law asks for one (the EU, the UK...); then the banner
// - an adaptive banner (the width of the screen, its height to suit) at the TOP of the screen, well
//   away from the drop buttons, so no tap meant for the game lands on it
// - Android draws it over the page, not in it: its height, as it reports it, goes to the game's AD
//   STRIP (script.js's setAdStrip), which keeps that much room at the top, so the game fits below it
//   (0 till one loads, so a failed one never leaves a gap)
// - bought off (REMOVE ADS, FULL ACCESS): gone at once, and the strip with it
// - SETTINGS' AD PRIVACY OPTIONS (shown where the law asks for it): the consent form again, to change
//   the choice made
// - builds with TEST ads (js/ads-config.js's testing): SETTINGS' TEST ADS says what the ads are doing
//   (started, the consent answer, a banner showing, or Google's reason there's none), and a consent
//   check that fails outright doesn't hold the test banner back
(() => {
  const cap = window.Capacitor;
  const cfg = window.BYTEFALL_ADS;
  if (!window.BYTEFALL_APP || !cfg || !cap || !cap.Plugins || !cap.Plugins.AdMob) return; // (the web, or an app built without it)
  const AdMob = cap.Plugins.AdMob;
  const RETRY_MS = 60000; // (a banner that failed to load tries again a minute later)
  let shown = false;
  let started = false;
  let allowed = false; // (consent settled: ads may be asked for)
  let retry = null;
  const owned = () => Unlocks.hasNoAds();
  const strip = (h) => { if (window.setAdStrip) window.setAdStrip(h); };
  const testBox = document.getElementById('ad-test');
  const statusEl = document.getElementById('ad-status');
  if (testBox) testBox.hidden = !cfg.testing;
  // (a line each for starting, the consent check and the banner, kept together)
  const notes = { ads: '', consent: '', banner: '' };
  const say = (key, text) => {
    notes[key] = text;
    if (statusEl) statusEl.textContent = Object.values(notes).filter(Boolean).join(' ');
  };
  const why = (e) => ((e && (e.message || e.errorMessage)) || String(e)).replace(/\.+$/, '');
  const OFF = 'Off: REMOVE ADS or FULL ACCESS is owned (in ByteFall Test, UNLOCK EVERYTHING counts too).';

  AdMob.addListener('bannerAdSizeChanged', (size) => strip(shown && !owned() ? (size && size.height) || 0 : 0));
  AdMob.addListener('bannerAdLoaded', () => say('banner', 'A TEST banner is showing at the top of the screen.'));
  AdMob.addListener('bannerAdFailedToLoad', (err) => {
    say('banner', `No banner from Google: ${err && err.code != null ? `error ${err.code}, ` : ''}${why(err)}. Asking again in a minute.`);
    strip(0);
    clearTimeout(retry);
    retry = setTimeout(() => { shown = false; showBanner(); }, RETRY_MS);
  });

  async function showBanner() {
    if (shown || !allowed || owned()) return;
    shown = true;
    say('banner', 'Asking Google for a banner...');
    try {
      await AdMob.showBanner({
        adId: cfg.bannerId,
        adSize: 'ADAPTIVE_BANNER',
        position: 'TOP_CENTER',
        margin: 0,
        isTesting: !!cfg.testing,
      });
    } catch (e) {
      shown = false;
      say('banner', `The banner couldn't be asked for: ${why(e)}.`);
    }
  }
  function removeBanner() {
    clearTimeout(retry);
    if (!shown) return;
    shown = false;
    strip(0);
    AdMob.removeBanner().catch(() => {});
  }

  // SETTINGS: AD PRIVACY OPTIONS, where Google's consent rules ask for a way to change the choice
  const privacy = document.getElementById('ad-privacy');
  const privacyBtn = document.getElementById('ad-privacy-btn');
  if (privacyBtn) {
    privacyBtn.addEventListener('click', () => {
      AdMob.showPrivacyOptionsForm().then(() => AdMob.requestConsentInfo()).then((info) => {
        allowed = info.canRequestAds !== false;
        if (allowed) showBanner();
        else removeBanner();
      }).catch(() => {});
    });
  }

  async function start() {
    if (started) return;
    if (owned()) { say('ads', OFF); return; }
    started = true;
    say('ads', "Google's ads started.");
    try {
      await AdMob.initialize({ initializeForTesting: !!cfg.testing });
    } catch (e) {
      started = false; // (tried again the next time the game comes back to the front)
      say('ads', `Google's ads didn't start: ${why(e)}.`);
      return;
    }
    try {
      let info = await AdMob.requestConsentInfo();
      if (info.isConsentFormAvailable && info.status === 'REQUIRED') info = await AdMob.showConsentForm();
      if (privacy) privacy.hidden = info.privacyOptionsRequirementStatus !== 'REQUIRED';
      allowed = info.canRequestAds !== false; // (false: the form not answered yet; asked again next launch)
      say('consent', `Consent: ${info.status}. ${allowed ? 'Ads allowed.' : 'No ads till the consent form is answered.'}`);
    } catch (e) {
      // (the consent check itself failed: an AdMob account or its privacy message still being set
      // up, say. TEST ads go ahead all the same, so the banner can be tested; real ones wait for a
      // check that works, tried again the next time the game comes back to the front)
      if (!cfg.testing) { started = false; return; }
      allowed = true;
      say('consent', `The consent check failed (${why(e)}). TEST ads go ahead anyway.`);
    }
    showBanner();
  }

  // A purchase (or RESTORE PURCHASES) takes them off; the dev page's switches can put them back
  Unlocks.onChange(() => {
    if (owned()) { removeBanner(); say('ads', OFF); say('consent', ''); say('banner', ''); }
    else if (started) showBanner();
    else start();
  });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) start(); });
  start();
})();
