// Full Access: the one-time purchase in the Android app (no ads, and every unlock
// straight away). Without it, unlocks are earned by playing (see progress.js),
// which is how the website works. In the app's RELEASE edition Google Play's billing
// (billing.js) tells own() what the account owns, at each launch and each purchase;
// what it last said is kept (bytefall-purchases), so the game opens as it was before
// Google Play answers (no banner flashing up for a FULL ACCESS owner). For testing,
// ?unlockall in the URL or the dev page's UNLOCK EVERYTHING switch (a flag in this
// browser) preview everything unlocked. REMOVE ADS is the other purchase (the STORE,
// store.js): no ads, nothing unlocked; Full Access includes it. The dev page's OWN
// REMOVE ADS switch previews owning it.
const Unlocks = (() => {
  let full = false;
  let dev = false;
  let noAds = false;
  let purchased = false; // (a real purchase, reported by Google Play: not a dev preview)
  const OWNED_KEY = 'bytefall-purchases';
  // (the Google Play release, tools/build-app.js: none of the dev previews, whatever's in storage)
  const release = !!(window.BYTEFALL_APP && window.BYTEFALL_APP.release);
  try {
    if (!release) {
      dev = new URLSearchParams(location.search).has('unlockall') || localStorage.getItem('bytefall-dev-unlockall') === 'on';
      full = dev;
      noAds = localStorage.getItem('bytefall-dev-noads') === 'on';
    } else {
      const owned = JSON.parse(localStorage.getItem(OWNED_KEY) || '{}');
      full = !!owned.full;
      noAds = !!owned.noAds;
      purchased = full || noAds;
    }
  } catch (e) {}
  const listeners = [];

  return {
    hasFullAccess: () => full,
    hasNoAds: () => full || noAds,
    hasPurchase: () => purchased,
    isDevUnlock: () => dev,
    owned: () => ({ full, noAds }),
    // (Google Play's word on what's owned: FULL ACCESS, REMOVE ADS; kept for the next launch)
    own(nowFull, nowNoAds) {
      const changed = full !== !!nowFull || noAds !== !!nowNoAds;
      full = !!nowFull;
      noAds = !!nowNoAds;
      purchased = purchased || full || noAds;
      try { localStorage.setItem(OWNED_KEY, JSON.stringify({ full, noAds })); } catch (e) {}
      if (changed) listeners.forEach((fn) => fn(full));
    },
    onChange(fn) {
      listeners.push(fn);
    },
  };
})();
