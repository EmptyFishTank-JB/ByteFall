// ADS: ByteFall's Google AdMob IDs, in one place. js/ads.js shows the banner with them, and
// tools/setup-android.js writes the app ID into the Android app (Google's SDK won't start without it).
// Until ByteFall's own are in, these are Google's sample IDs: they only ever show TEST ads, safe to
// tap. With ByteFall's own in, set testing to false for the release (testing shows test ads
// whatever the IDs, and a real ad tapped while testing can get the account suspended).
//   appId:    AdMob → Apps → ByteFall → App settings → App ID (ca-app-pub-…~…)
//   bannerId: AdMob → Apps → ByteFall → Ad units → the banner's ad unit ID (ca-app-pub-…/…)
window.BYTEFALL_ADS = {
  appId: 'ca-app-pub-3940256099942544~3347511713',
  bannerId: 'ca-app-pub-3940256099942544/9214589741',
  testing: true,
};
