import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { doc, setDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';

// Registers this device for push notifications and saves the resulting
// Expo push token onto the student's Firestore doc (users/{uid}). Runs
// silently in the background — any failure is only logged to the console,
// never shown to the student as a popup.
export async function registerForPushNotifications(uid) {
  if (!uid) return;

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
    return;
  }

  const projectId = Constants?.expoConfig?.extra?.eas?.projectId;
  const tokenResponse = await Notifications.getExpoPushTokenAsync({ projectId });
  const token = tokenResponse?.data;
  if (!token) return;

  await setDoc(
    doc(db, 'users', uid),
    { expoPushToken: token, updatedAt: Date.now() },
    { merge: true }
  );
}
