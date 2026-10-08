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

  AdMob.addListener('bannerAdSizeChanged', (size) => strip(shown && !owned() ? (size && size.height) || 0 : 0));
  AdMob.addListener('bannerAdFailedToLoad', () => {
    strip(0);
    clearTimeout(retry);
    retry = setTimeout(() => { shown = false; showBanner(); }, RETRY_MS);
  });

  async function showBanner() {
    if (shown || !allowed || owned()) return;
    shown = true;
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
    if (started || owned()) return;
    started = true;
    try {
      await AdMob.initialize({ initializeForTesting: !!cfg.testing });
      let info = await AdMob.requestConsentInfo();
      if (info.isConsentFormAvailable && info.status === 'REQUIRED') info = await AdMob.showConsentForm();
      if (privacy) privacy.hidden = info.privacyOptionsRequirementStatus !== 'REQUIRED';
      allowed = info.canRequestAds !== false; // (false: the form not answered yet; asked again next launch)
      showBanner();
    } catch (e) {
      started = false; // (tried again the next time the game comes back to the front)
    }
  }

  // A purchase (or RESTORE PURCHASES) takes them off; the dev page's switches can put them back
  Unlocks.onChange(() => {
    if (owned()) removeBanner();
    else if (started) showBanner();
    else start();
  });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) start(); });
  start();
})();
