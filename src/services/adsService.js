import mobileAds, {
  MaxAdContentRating,
  TestIds,
  InterstitialAd,
  AdEventType,
} from 'react-native-google-mobile-ads';

// KLARIUM AI is used by children (Class 1-12). Google requires ads on
// child-directed apps to be tagged accordingly — this disables personalized/
// behavioral ad targeting and restricts ad content to general audiences.
// Call this once when the app starts.
export function initAds() {
  mobileAds()
    .setRequestConfiguration({
      maxAdContentRating: MaxAdContentRating.G,
      tagForChildDirectedTreatment: true,
      tagForUnderAgeOfConsent: true,
    })
    .then(() => mobileAds().initialize())
    .catch(() => {
      // If ad init fails (e.g. no internet on first launch), the app should
      // simply run without ads rather than crash or block anything.
    });
}

// IMPORTANT: The app is not yet published on the Play Store. Using real ad
// unit IDs before publishing risks Google flagging the account for
// "invalid traffic" if the ads get viewed/tapped during your own testing.
// Keep USE_TEST_ADS = true until the app is actually live on the Play Store,
// then flip it to false to start showing real ads (banner + interstitial)
// and earning revenue.
const USE_TEST_ADS = true;

const REAL_BANNER_AD_UNIT_ID = 'ca-app-pub-4588188976164551/7783764395';
const REAL_INTERSTITIAL_AD_UNIT_ID = 'ca-app-pub-4588188976164551/7878073678';

export function getBannerAdUnitId() {
  return USE_TEST_ADS ? TestIds.BANNER : REAL_BANNER_AD_UNIT_ID;
}

function getInterstitialAdUnitId() {
  return USE_TEST_ADS ? TestIds.INTERSTITIAL : REAL_INTERSTITIAL_AD_UNIT_ID;
}

// Loads and shows a single full-screen interstitial ad, then resolves.
// Used for moments like tapping "Gemini API Key" in Settings — a natural
// break point in the flow. Free users only; call sites should check
// isPremium before calling this. Resolves either way (ad shown, failed to
// load, or timeout) so the calling screen's action never gets stuck.
export function showInterstitialAd() {
  return new Promise((resolve) => {
    const interstitial = InterstitialAd.createForAdRequest(getInterstitialAdUnitId());
    let settled = false;

    const finish = () => {
      if (settled) return;
      settled = true;
      resolve();
    };

    const unsubscribeLoaded = interstitial.addAdEventListener(AdEventType.LOADED, () => {
      interstitial.show();
    });
    const unsubscribeClosed = interstitial.addAdEventListener(AdEventType.CLOSED, () => {
      unsubscribeLoaded();
      unsubscribeClosed();
      unsubscribeError();
      finish();
    });
    const unsubscribeError = interstitial.addAdEventListener(AdEventType.ERROR, () => {
      unsubscribeLoaded();
      unsubscribeClosed();
      unsubscribeError();
      finish();
    });

    interstitial.load();

    // Safety timeout — if the ad neither loads nor errors within 4 seconds
    // (e.g. slow/no internet), don't block the student's action any longer.
    setTimeout(finish, 4000);
  });
}
