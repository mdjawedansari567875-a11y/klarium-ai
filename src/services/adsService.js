import mobileAds, { MaxAdContentRating } from 'react-native-google-mobile-ads';

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
