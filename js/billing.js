// BILLING: the STORE's purchases through Google Play, in the app's RELEASE edition only (the website
// and ByteFall Test keep the STORE's preview). Three one-time products, their IDs Play Console's
// (Monetize with Play → Products → One-time products; an ID is for good, never changed or reused):
//   remove_ads           REMOVE ADS
//   full_access          FULL ACCESS
//   full_access_upgrade  FULL ACCESS for those who own REMOVE ADS already, at the difference
// MainActivity.java does the billing (window.BytefallAndroid's billingStart, billingBuy and
// billingRestore) and answers through window.bytefallBilling, an event at a time:
//   { type: 'products', prices }                   Google Play's prices, in the player's currency
//   { type: 'owned', owned, pending, restore }     all the account owns: as the game opens, when the
//                                                  app comes back to the front, RESTORE PURCHASES
//   { type: 'bought', owned, pending }             a purchase just made (or paid at last)
//   { type: 'failed', reason }                     'canceled', 'unavailable' or 'error'
// What's owned goes to Unlocks (unlocks.js), which ads.js and the STORE follow.
const Billing = (() => {
  const REMOVE_ADS = 'remove_ads';
  const FULL = 'full_access';
  const UPGRADE = 'full_access_upgrade';
  const app = window.BytefallAndroid;
  const on = !!(window.BYTEFALL_APP && window.BYTEFALL_APP.release && app && app.billingStart);
  const prices = {};
  const listeners = [];
  // (what's owned, as Google Play last said; to start, as it said last time)
  let owned = new Set();
  const was = Unlocks.owned();
  if (was.full) owned.add(FULL);
  if (was.noAds) owned.add(REMOVE_ADS);
  // (bought this session: kept even if a check made as the purchase sheet closed missed it)
  const boughtNow = new Set();
  const apply = () => Unlocks.own(owned.has(FULL) || owned.has(UPGRADE), owned.has(REMOVE_ADS));

  window.bytefallBilling = (e) => {
    if (e.type === 'products') Object.assign(prices, e.prices);
    else if (e.type === 'owned') {
      owned = new Set([...e.owned, ...boughtNow]);
      apply();
    } else if (e.type === 'bought') {
      e.owned.forEach((id) => { owned.add(id); boughtNow.add(id); });
      apply();
    }
    listeners.forEach((fn) => fn(e));
  };
  if (on) app.billingStart();

  return {
    on,
    REMOVE_ADS,
    FULL,
    UPGRADE,
    price: (id) => prices[id] || '',
    buy(id) { if (on) app.billingBuy(id); },
    restore() { if (on) app.billingRestore(); },
    // (TEST PURCHASES, builds with test ads only: what's owned used up, to buy again with the test card)
    reset() {
      if (!on || !app.billingReset) return false;
      boughtNow.clear();
      app.billingReset();
      return true;
    },
    onEvent(fn) { listeners.push(fn); },
  };
})();
