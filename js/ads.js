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
// - REWARDED ADS (window.RewardAd, the STORE's WATCH AD): a full-screen ad the player chooses to
//   watch, the reward given only once it's watched through (Google's word: closed early, nothing).
//   Offered with or without REMOVE ADS (that takes the banner away; nobody has to watch one), behind
//   the same consent check as the banner
// - builds with TEST ads (js/ads-config.js's testing): SETTINGS' TEST ADS says what the ads are doing
//   (started, the consent answer, a banner showing, or Google's reason there's none; the rewarded
//   ads too), and a consent check that fails outright doesn't hold the test ads back
(() => {
  const cap = window.Capacitor;
  const cfg = window.BYTEFALL_ADS;
  if (!window.BYTEFALL_APP || !cfg || !cap || !cap.Plugins || !cap.Plugins.AdMob) return; // (the web, or an app built without it)
  const AdMob = cap.Plugins.AdMob;
  const RETRY_MS = 60000; // (a banner that failed to load tries again a minute later)
  let shown = false;
  let allowed = false; // (consent settled: ads may be asked for)
  let retry = null;
  const owned = () => Unlocks.hasNoAds();
  const strip = (h) => { if (window.setAdStrip) window.setAdStrip(h); };
  const testBox = document.getElementById('ad-test');
  const statusEl = document.getElementById('ad-status');
  if (testBox) testBox.hidden = !cfg.testing;
  // (a line each for starting, the consent check and the banner, kept together)
  const notes = { ads: '', consent: '', banner: '', reward: '' };
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

  // Google's ads started and the consent check done, once, for the banner and WATCH AD alike:
  // whether ads may be asked for. One that fails is tried again the next time it's needed (the game
  // back at the front, or WATCH AD); an unanswered form waits for the next launch
  let readying = null;
  function ready() {
    if (readying) return readying;
    readying = (async () => {
      try {
        await AdMob.initialize({ initializeForTesting: !!cfg.testing });
        say('ads', "Google's ads started.");
      } catch (e) {
        readying = null;
        say('ads', `Google's ads didn't start: ${why(e)}.`);
        return false;
      }
      try {
        let info = await AdMob.requestConsentInfo();
        if (info.isConsentFormAvailable && info.status === 'REQUIRED') info = await AdMob.showConsentForm();
        if (privacy) privacy.hidden = info.privacyOptionsRequirementStatus !== 'REQUIRED';
        allowed = info.canRequestAds !== false;
        say('consent', `Consent: ${info.status}. ${allowed ? 'Ads allowed.' : 'No ads till the consent form is answered.'}`);
      } catch (e) {
        // (the consent check itself failed: an AdMob account or its privacy message still being set
        // up, say. TEST ads go ahead all the same, so they can be tested; real ones wait for a check
        // that works)
        if (!cfg.testing) {
          readying = null;
          say('consent', `The consent check failed (${why(e)}). No ads till it works.`);
          return false;
        }
        allowed = true;
        say('consent', `The consent check failed (${why(e)}). TEST ads go ahead anyway.`);
      }
      return allowed;
    })();
    return readying;
  }
  async function start() {
    if (owned()) { say('ads', OFF); return; }
    if (await ready()) showBanner();
  }

  // WATCH AD: resolves { earned, error } once the ad's closed (error: it couldn't be had or shown)
  let watching = null; // (the one up: { earned, done })
  // (the app told when a full-screen ad is up: its pause then leaves the WebViews' timers running,
  // the ad's own included, which froze it: MainActivity's setFullscreenAd)
  const fullscreen = (open) => { if (window.BytefallAndroid && window.BytefallAndroid.setFullscreenAd) window.BytefallAndroid.setFullscreenAd(open); };
  const endWatch = (error) => {
    const w = watching;
    if (!w) return;
    watching = null;
    fullscreen(false);
    w.done({ earned: w.earned, error });
  };
  AdMob.addListener('onRewardedVideoAdReward', () => { if (watching) watching.earned = true; });
  // (closed: a moment's grace for the reward's word, should it come after the ad's gone)
  AdMob.addListener('onRewardedVideoAdDismissed', () => setTimeout(() => endWatch(null), 400));
  AdMob.addListener('onRewardedVideoAdFailedToShow', (e) => endWatch(why(e)));
  window.RewardAd = {
    available: () => !!cfg.rewardedId,
    busy: () => !!watching,
    async watch() {
      if (watching) return { earned: false, error: 'busy' };
      if (!(await ready())) return { earned: false, error: 'not allowed' };
      say('reward', 'Loading a rewarded ad...');
      try {
        await AdMob.prepareRewardVideoAd({ adId: cfg.rewardedId, isTesting: !!cfg.testing });
      } catch (e) {
        say('reward', `No rewarded ad from Google: ${why(e)}.`);
        return { earned: false, error: why(e) };
      }
      const r = await new Promise((done) => {
        watching = { earned: false, done };
        fullscreen(true);
        AdMob.showRewardVideoAd().then(() => { if (watching) watching.earned = true; }, (e) => endWatch(why(e)));
      });
      say('reward', r.earned ? 'Rewarded ad watched through: reward given.' : r.error ? `The rewarded ad didn't show: ${r.error}.` : 'Rewarded ad closed early: no reward.');
      return r;
    },
  };

  // A purchase (or RESTORE PURCHASES) takes them off; the dev page's switches can put them back
  Unlocks.onChange(() => {
    if (owned()) { removeBanner(); say('ads', OFF); say('banner', ''); }
    else start();
  });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) start(); });
  start();
})();
