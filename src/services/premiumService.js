import AsyncStorage from '@react-native-async-storage/async-storage';

const PREMIUM_KEY = 'klarium_is_premium';

// Simple listener list so any screen showing premium-gated UI (like a banner
// ad, or a "Go Premium" button) can react immediately when the status
// changes, without needing to re-mount or poll AsyncStorage.
let listeners = [];

function notifyListeners(isPremium) {
  listeners.forEach((cb) => cb(isPremium));
}

export function subscribeToPremiumStatus(callback) {
  listeners.push(callback);
  return () => {
    listeners = listeners.filter((cb) => cb !== callback);
  };
}

export async function getIsPremium() {
  const value = await AsyncStorage.getItem(PREMIUM_KEY);
  return value === 'true';
}

async function setIsPremium(isPremium) {
  await AsyncStorage.setItem(PREMIUM_KEY, isPremium ? 'true' : 'false');
  notifyListeners(isPremium);
}

// Called once on every app launch (from App.js), right after reading this
// user's Firestore record. This makes the admin panel's "Grant Premium" /
// "Premium ON" toggle the actual source of truth — whatever the admin sets
// there takes effect the next time the student opens the app.
export async function syncPremiumFromServer(isPremiumFromServer) {
  await setIsPremium(!!isPremiumFromServer);
}

// PLACEHOLDER: Real purchases need Google Play Billing, which only works
// once this app has a Google Play Developer account and is uploaded to
// Play Console (at least on the Internal Testing track) with a subscription
// product created there. Until then, this just throws a clear error so the
// UI can show a "Coming soon" message instead of a broken payment flow.
//
// When ready to go live with real payments:
// 1. Install `react-native-iap` and its Expo config plugin.
// 2. Create a subscription product in Play Console (e.g. "klarium_premium_monthly").
// 3. Replace the body of this function with the real purchase flow, and
//    call setIsPremium(true) only after Play confirms a successful purchase
//    (and also write isPremium: true to the user's Firestore doc, so the
//    admin panel and this device agree).
export async function purchasePremium() {
  throw new Error('PREMIUM_NOT_AVAILABLE_YET');
}

export async function restorePremium() {
  throw new Error('PREMIUM_NOT_AVAILABLE_YET');
}

// Dev/testing helper only — lets you manually flip premium on/off while
// building the UI. Note: this will be overwritten the next time the app
// launches and syncs from the server (see syncPremiumFromServer above).
export async function _devSetPremium(isPremium) {
  await setIsPremium(isPremium);
}
