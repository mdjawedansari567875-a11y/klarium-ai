import AsyncStorage from '@react-native-async-storage/async-storage';

const PREMIUM_KEY = 'klarium_is_premium';
// Stores the furthest-future referral bonus expiry (ms timestamp) so the UI
// can show "Premium active until..." if useful. 0 means no active bonus.
const PREMIUM_UNTIL_KEY = 'klarium_premium_until';
// When the dev toggle (Settings → "Turn Premium ON/OFF (test)") is used,
// this flag is set so that syncPremiumFromServer() won't silently flip it
// back on the next app launch. Without this, the dev toggle only "stuck"
// until the app was closed and reopened, since the server sync always ran
// right after and overwrote it back to whatever Firestore had.
const DEV_OVERRIDE_KEY = 'klarium_premium_dev_override';

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

// Returns the ms timestamp until which referral-bonus premium is active, or
// 0 if there's no active bonus right now. Useful for showing a countdown.
export async function getPremiumUntil() {
  const value = Number((await AsyncStorage.getItem(PREMIUM_UNTIL_KEY)) || 0);
  return value;
}

async function setIsPremium(isPremium) {
  await AsyncStorage.setItem(PREMIUM_KEY, isPremium ? 'true' : 'false');
  notifyListeners(isPremium);
}

// Called once on every app launch (from App.js), right after reading this
// user's Firestore record. This makes the admin panel's "Grant Premium" /
// "Premium ON" toggle the actual source of truth — whatever the admin sets
// there takes effect the next time the student opens the app. On top of
// that, `premiumBonuses` (an array of expiry timestamps earned via Refer &
// Earn) also grants premium as long as at least one bonus hasn't expired.
//
// Exception: if the dev toggle (Settings) was used, that override wins over
// both of the above, so testing premium features doesn't get undone every
// time the app restarts. Turning the dev toggle off again clears the
// override, letting server sync take over normally.
export async function syncPremiumFromServer(isPremiumFromServer, premiumBonuses) {
  const hasDevOverride = (await AsyncStorage.getItem(DEV_OVERRIDE_KEY)) === 'true';
  if (hasDevOverride) {
    return;
  }

  const bonusExpiry =
    Array.isArray(premiumBonuses) && premiumBonuses.length
      ? Math.max(...premiumBonuses)
      : 0;
  await AsyncStorage.setItem(PREMIUM_UNTIL_KEY, String(bonusExpiry));

  const effectivePremium = !!isPremiumFromServer || bonusExpiry > Date.now();
  await setIsPremium(effectivePremium);
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
// building the UI. Sets a local override flag so this sticks across app
// restarts instead of being silently overwritten by the next server sync.
export async function _devSetPremium(isPremium) {
  await AsyncStorage.setItem(DEV_OVERRIDE_KEY, 'true');
  await setIsPremium(isPremium);
}

// Clears the dev override, letting the next app launch's server sync take
// over normally again. Not wired to any UI yet — call this manually if you
// ever want to go back to pure server-controlled premium status for testing.
export async function _clearDevOverride() {
  await AsyncStorage.removeItem(DEV_OVERRIDE_KEY);
}
