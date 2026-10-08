// Full Access: the one-time purchase planned for the Android app (no ads, and
// every unlock straight away). Without it, unlocks are earned by playing (see
// progress.js), which is how the website works. The app will call Unlocks.set()
// with the Google Play purchase state. For testing, ?unlockall in the URL or the
// dev page's UNLOCK EVERYTHING switch (a flag in this browser) preview everything
// unlocked. REMOVE ADS is the other purchase (the STORE, store.js): no ads, nothing unlocked;
// Full Access includes it. The dev page's OWN REMOVE ADS switch previews owning it.
const Unlocks = (() => {
  let full = false;
  let dev = false;
  let noAds = false;
  let purchased = false; // (a real purchase this session, reported by the app: not a dev preview)
  // (the Google Play release, tools/build-app.js: none of the dev previews, whatever's in storage)
  const release = !!(window.BYTEFALL_APP && window.BYTEFALL_APP.release);
  try {
    if (!release) {
      dev = new URLSearchParams(location.search).has('unlockall') || localStorage.getItem('bytefall-dev-unlockall') === 'on';
      full = dev;
      noAds = localStorage.getItem('bytefall-dev-noads') === 'on';
    }
  } catch (e) {}
  const listeners = [];

  return {
    hasFullAccess: () => full,
    hasNoAds: () => full || noAds,
    hasPurchase: () => purchased,
    isDevUnlock: () => dev,
    set(owned) {
      full = !!owned;
      purchased = purchased || full;
      listeners.forEach((fn) => fn(full));
    },
    setNoAds(owned) {
      noAds = !!owned;
      purchased = purchased || noAds;
      listeners.forEach((fn) => fn(full));
    },
    onChange(fn) {
      listeners.push(fn);
    },
  };
})();
