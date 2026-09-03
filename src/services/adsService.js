import mobileAds, {
  MaxAdContentRating,
  TestIds,
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

// IMPORTANT: The app is not yet published on the Play Store. Using the real
// ad unit ID before publishing risks Google flagging the account for
// "invalid traffic" if the ad gets viewed/tapped during your own testing.
// Keep USE_TEST_ADS = true until the app is actually live on the Play Store,
// then flip it to false to start showing real ads and earning revenue.
const USE_TEST_ADS = true;

const REAL_BANNER_AD_UNIT_ID = 'ca-app-pub-4588188976164551/7783764395';

export function getBannerAdUnitId() {
  return USE_TEST_ADS ? TestIds.BANNER : REAL_BANNER_AD_UNIT_ID;
}
