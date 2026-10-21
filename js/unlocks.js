// Full Access: the one-time purchase in the Android app (no ads, and every unlock
// straight away). Without it, unlocks are earned by playing (see progress.js),
// which is how the website works. In the app's RELEASE edition Google Play's billing
// (billing.js) tells own() what the account owns, at each launch and each purchase;
// what it last said is kept (bytefall-purchases), so the game opens as it was before
// Google Play answers (no banner flashing up for a FULL ACCESS owner). For testing,
// ?unlockall in the URL or DEV MODE (the dev page's switch, a flag in this browser; or the secret tap
// on the main menu's title, which the Play release keeps too) preview everything unlocked, switched on
// and off in the running game (setDevUnlock), no reload. REMOVE ADS is the other purchase (the STORE,
// store.js): no ads, nothing unlocked; Full Access includes it. The dev page's OWN
// REMOVE ADS switch previews owning it. In ByteFall Test with test ads, the STORE's BUY
// pretends (pretend(), kept in bytefall-test-purchases) and SETTINGS' TEST PURCHASES resets it.
// DAY ONE is Google Play's PRE-REGISTRATION REWARD (billing.js's day_one): the four DAY ONE themes
// in SETTINGS and the badge on RECORDS. DEV MODE and the dev page's PRE-REGISTERED switch preview it.
const Unlocks = (() => {
  let full = false;
  let dev = false;
  let noAds = false;
  let devNoAds = false; // (the dev page's OWN REMOVE ADS switch)
  let dayOne = false; // (pre-registered: Google Play's reward, or the dev page's PRE-REGISTERED switch)
  let purchased = false; // (a real purchase, reported by Google Play: not a dev preview)
  let paidFull = false; // (FULL ACCESS as Google Play says it's owned: the secret tap's unlock apart)
  let pretendFull = false; // (ByteFall Test's pretend FULL ACCESS: DEV MODE apart)
  const OWNED_KEY = 'bytefall-purchases';
  // (ByteFall Test with test ads: the STORE's BUY pretends, nothing charged, kept here; js/store.js)
  const PRETEND_KEY = 'bytefall-test-purchases';
  // (the Google Play release, tools/build-app.js: none of the dev previews, whatever's in storage)
  const release = !!(window.BYTEFALL_APP && window.BYTEFALL_APP.release);
  try {
    if (!release) {
      dev = new URLSearchParams(location.search).has('unlockall') || localStorage.getItem('bytefall-dev-unlockall') === 'on' || localStorage.getItem('bytefall-unlock-key') === 'open';
      const pretend = window.BYTEFALL_APP ? JSON.parse(localStorage.getItem(PRETEND_KEY) || '{}') : {};
      pretendFull = !!pretend.full;
      full = dev || pretendFull;
      devNoAds = localStorage.getItem('bytefall-dev-noads') === 'on';
      noAds = devNoAds || !!pretend.noAds;
      dayOne = localStorage.getItem('bytefall-dev-dayone') === 'on';
    } else {
      const owned = JSON.parse(localStorage.getItem(OWNED_KEY) || '{}');
      dev = localStorage.getItem('bytefall-unlock-key') === 'open'; // (the secret tap: script.js's THE STORY KEY)
      paidFull = !!owned.full;
      full = paidFull || dev;
      noAds = !!owned.noAds;
      dayOne = !!owned.dayOne;
      purchased = paidFull || noAds; // (the secret unlock isn't a purchase: no INDIE SUPPORTER for it)
    }
  } catch (e) {}
  const listeners = [];

  return {
    hasFullAccess: () => full,
    hasNoAds: () => full || noAds,
    hasPurchase: () => purchased,
    isDevUnlock: () => dev,
    // (DAY ONE: the pre-registration reward's themes and badge)
    hasDayOne: () => dayOne || dev,
    owned: () => ({ full: release ? paidFull : full, noAds, dayOne }),
    // (Google Play's word on what's owned: FULL ACCESS, REMOVE ADS, the DAY ONE reward; kept for the next
    // launch. It comes at every launch, so the secret tap's unlock is kept whatever it says: without that,
    // the reload after the tap brought Google Play's "not owned" and locked everything again)
    own(nowFull, nowNoAds, nowDayOne) {
      const wasFull = full;
      const wasNoAds = noAds;
      const wasDayOne = dayOne;
      paidFull = !!nowFull;
      full = paidFull || dev;
      noAds = !!nowNoAds;
      dayOne = !!nowDayOne;
      purchased = purchased || paidFull || noAds;
      try { localStorage.setItem(OWNED_KEY, JSON.stringify({ full: paidFull, noAds, dayOne })); } catch (e) {}
      if (full !== wasFull || noAds !== wasNoAds || dayOne !== wasDayOne) listeners.forEach((fn) => fn(full));
    },
    onChange(fn) {
      listeners.push(fn);
    },
    // (DEV MODE switched on or off from wherever it is (the secret tap, the dev page): both of its flags
    // at once, so switching it off from one never leaves the other on; and the running game told, as a
    // purchase does, so it changes in place: a reload in the live test app could land on a stale copy)
    setDevUnlock(on) {
      try {
        localStorage.setItem('bytefall-unlock-key', on ? 'open' : 'locked');
        localStorage.setItem('bytefall-dev-unlockall', on ? 'on' : 'off');
      } catch (e) {}
      const wasFull = full;
      const wasDev = dev;
      dev = !!on;
      full = (release ? paidFull : pretendFull) || dev;
      if (full !== wasFull || dev !== wasDev) listeners.forEach((fn) => fn(full, 'dev')); // ('dev': nothing announced for it)
    },
    // (ByteFall Test's pretend purchases: owned or not, nothing charged, kept for the next launch)
    pretend(nowFull, nowNoAds) {
      if (release) return;
      const changed = full !== (!!nowFull || dev) || noAds !== (!!nowNoAds || devNoAds);
      pretendFull = !!nowFull;
      full = pretendFull || dev;
      noAds = !!nowNoAds || devNoAds;
      try { localStorage.setItem(PRETEND_KEY, JSON.stringify({ full: !!nowFull, noAds: !!nowNoAds })); } catch (e) {}
      if (changed) listeners.forEach((fn) => fn(full));
    },
  };
})();
