import * as Haptics from 'expo-haptics';

// A light, quick tap-feel used across primary buttons and key actions.
// Wrapped in try/catch since haptics can silently fail on some devices/emulators.
export function tapFeedback() {
  try {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch (e) {
    // ignore — haptics are a nice-to-have, never worth crashing over
  }
}

export function successFeedback() {
  try {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch (e) {}
}
