import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform, Alert } from 'react-native';
import { doc, setDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';

// Registers this device for push notifications and saves the resulting
// Expo push token onto the student's Firestore doc (users/{uid}). The admin
// panel later reads all these tokens to broadcast a notification to every
// student's phone, via Expo's free push service — no paid backend needed.
//
// TEMPORARY DEBUG VERSION: shows an Alert popup at each step so we can see
// exactly where/why this is failing. Remove the Alert.alert() calls once
// it's working.
export async function registerForPushNotifications(uid) {
  if (!uid) return;

  try {
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
      Alert.alert('Push Debug', 'Permission NOT granted. Status: ' + finalStatus);
      return;
    }

    const projectId = Constants?.expoConfig?.extra?.eas?.projectId;
    if (!projectId) {
      Alert.alert('Push Debug', 'No projectId found in app config!');
      return;
    }

    const tokenResponse = await Notifications.getExpoPushTokenAsync({ projectId });
    const token = tokenResponse?.data;
    if (!token) {
      Alert.alert('Push Debug', 'Token came back empty.');
      return;
    }

    await setDoc(
      doc(db, 'users', uid),
      { expoPushToken: token, updatedAt: Date.now() },
      { merge: true }
    );

    Alert.alert('Push Debug', 'SUCCESS! Token saved: ' + token.slice(0, 25) + '...');
  } catch (e) {
    Alert.alert('Push Debug ERROR', e.message || String(e));
  }
}
