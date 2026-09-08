import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { doc, setDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';

// Registers this device for push notifications and saves the resulting
// Expo push token onto the student's Firestore doc (users/{uid}). The admin
// panel later reads all these tokens to broadcast a notification to every
// student's phone, via Expo's free push service — no paid backend needed.
export async function registerForPushNotifications(uid) {
  if (!uid) return;

  // Android requires a notification channel to be set up before showing
  // notifications with custom importance/sound.
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.DEFAULT,
      lightColor: '#D4AF37',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    // Student declined notification permission — nothing more to do.
    return;
  }

  const projectId = Constants?.expoConfig?.extra?.eas?.projectId;
  const tokenResponse = await Notifications.getExpoPushTokenAsync({ projectId });
  const token = tokenResponse?.data;
  if (!token) return;

  // merge: true so this never overwrites other fields already on the doc.
  await setDoc(
    doc(db, 'users', uid),
    { expoPushToken: token, updatedAt: Date.now() },
    { merge: true }
  );
}
