// Full Access: the one-time purchase in the Android app (no ads, and every unlock
// straight away). Without it, unlocks are earned by playing (see progress.js),
// which is how the website works. In the app's RELEASE edition Google Play's billing
// (billing.js) tells own() what the account owns, at each launch and each purchase;
// what it last said is kept (bytefall-purchases), so the game opens as it was before
// Google Play answers (no banner flashing up for a FULL ACCESS owner). For testing,
// ?unlockall in the URL or DEV MODE (the dev page's switch, a flag in this browser; the test app's
// padlock; or the secret tap on the main menu's title, which the Play release keeps too) preview
// everything unlocked. REMOVE ADS is the other purchase (the STORE,
// store.js): no ads, nothing unlocked; Full Access includes it. The dev page's OWN
// REMOVE ADS switch previews owning it. In ByteFall Test with test ads, the STORE's BUY
// pretends (pretend(), kept in bytefall-test-purchases) and SETTINGS' TEST PURCHASES resets it.
const Unlocks = (() => {
  let full = false;
  let dev = false;
  let noAds = false;
  let devNoAds = false; // (the dev page's OWN REMOVE ADS switch)
  let purchased = false; // (a real purchase, reported by Google Play: not a dev preview)
  let paidFull = false; // (FULL ACCESS as Google Play says it's owned: the secret tap's unlock apart)
  const OWNED_KEY = 'bytefall-purchases';
  // (ByteFall Test with test ads: the STORE's BUY pretends, nothing charged, kept here; js/store.js)
  const PRETEND_KEY = 'bytefall-test-purchases';
  // (the Google Play release, tools/build-app.js: none of the dev previews, whatever's in storage)
  const release = !!(window.BYTEFALL_APP && window.BYTEFALL_APP.release);
  try {
    if (!release) {
      dev = new URLSearchParams(location.search).has('unlockall') || localStorage.getItem('bytefall-dev-unlockall') === 'on' || localStorage.getItem('bytefall-unlock-key') === 'open';
      const pretend = window.BYTEFALL_APP ? JSON.parse(localStorage.getItem(PRETEND_KEY) || '{}') : {};
      full = dev || !!pretend.full;
      devNoAds = localStorage.getItem('bytefall-dev-noads') === 'on';
      noAds = devNoAds || !!pretend.noAds;
    } else {
      const owned = JSON.parse(localStorage.getItem(OWNED_KEY) || '{}');
      dev = localStorage.getItem('bytefall-unlock-key') === 'open'; // (the secret tap: script.js's THE STORY KEY)
      paidFull = !!owned.full;
      full = paidFull || dev;
      noAds = !!owned.noAds;
      purchased = paidFull || noAds; // (the secret unlock isn't a purchase: no INDIE SUPPORTER for it)
    }
  } catch (e) {}
  const listeners = [];

  return {
    hasFullAccess: () => full,
    hasNoAds: () => full || noAds,
    hasPurchase: () => purchased,
    isDevUnlock: () => dev,
    owned: () => ({ full: release ? paidFull : full, noAds }),
    // (Google Play's word on what's owned: FULL ACCESS, REMOVE ADS; kept for the next launch. It comes
    // at every launch, so the secret tap's unlock is kept whatever it says: without that, the reload
    // after the tap brought Google Play's "not owned" and locked everything again)
    own(nowFull, nowNoAds) {
      const wasFull = full;
      const wasNoAds = noAds;
      paidFull = !!nowFull;
      full = paidFull || dev;
      noAds = !!nowNoAds;
      purchased = purchased || paidFull || noAds;
      try { localStorage.setItem(OWNED_KEY, JSON.stringify({ full: paidFull, noAds })); } catch (e) {}
      if (full !== wasFull || noAds !== wasNoAds) listeners.forEach((fn) => fn(full));
    },
    onChange(fn) {
      listeners.push(fn);
    },
    // (DEV MODE switched on or off from wherever it is (the secret tap, the test app's padlock, the dev
    // page): both of its flags at once, so switching it off from one never leaves the other on)
    setDevUnlock(on) {
      try {
        localStorage.setItem('bytefall-unlock-key', on ? 'open' : 'locked');
        localStorage.setItem('bytefall-dev-unlockall', on ? 'on' : 'off');
      } catch (e) {}
    },
    // (ByteFall Test's pretend purchases: owned or not, nothing charged, kept for the next launch)
    pretend(nowFull, nowNoAds) {
      if (release) return;
      const changed = full !== (!!nowFull || dev) || noAds !== (!!nowNoAds || devNoAds);
      full = !!nowFull || dev;
      noAds = !!nowNoAds || devNoAds;
      try { localStorage.setItem(PRETEND_KEY, JSON.stringify({ full: !!nowFull, noAds: !!nowNoAds })); } catch (e) {}
      if (changed) listeners.forEach((fn) => fn(full));
    },
  };
})();
