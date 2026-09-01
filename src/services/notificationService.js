import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Sets up a single daily reminder at 7 PM so the student doesn't break their
// streak. This is a local notification — completely free, no server needed.
export async function setupStreakReminder() {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('streak-reminders', {
      name: 'Streak Reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  // Cancel any previously scheduled reminder before scheduling a fresh one,
  // so this is safe to call every app launch without stacking duplicates.
  await Notifications.cancelAllScheduledNotificationsAsync();

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Don't lose your streak! 🔥",
      body: 'Come learn something new today on KLARIUM AI.',
    },
    trigger: {
      hour: 19,
      minute: 0,
      repeats: true,
    },
  });
}
