// ADS: ByteFall's Google AdMob IDs, in one place. js/ads.js shows the banner with them, and
// tools/setup-android.js writes the app ID into the Android app (Google's SDK won't start without it).
// appId is ByteFall's own; bannerId is still Google's sample banner till ByteFall's banner ad unit
// is made, and testing is on: test builds only ever show TEST ads, safe to tap (testing shows test
// ads whatever the IDs; a real ad tapped by its own developer can get the account suspended). For
// the release: ByteFall's banner ad unit ID in, and testing set to false.
//   appId:    AdMob → Apps → ByteFall → App settings → App ID (ca-app-pub-…~…)
//   bannerId: AdMob → Apps → ByteFall → Ad units → the banner's ad unit ID (ca-app-pub-…/…)
//   rewardedId: the same, for the rewarded ad unit (the STORE's WATCH AD: a free RESTORE POINT);
//             Google's sample rewarded unit till ByteFall's is made
window.BYTEFALL_ADS = {
  appId: 'ca-app-pub-2719124872952257~7594099653',
  bannerId: 'ca-app-pub-3940256099942544/9214589741', // (Google's sample adaptive banner)
  rewardedId: 'ca-app-pub-3940256099942544/5224354917', // (Google's sample rewarded ad)
  testing: true,
};
