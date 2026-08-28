import { initializeApp, getApps } from 'firebase/app';
import { initializeAuth, getReactNativePersistence, getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Real KLARIUM AI Firebase project config.
const firebaseConfig = {
  apiKey: 'AIzaSyA8TjLvn0-tYhVDcWUqGtNlbtzHdS1UfPI',
  authDomain: 'klarium-ai.firebaseapp.com',
  projectId: 'klarium-ai',
  storageBucket: 'klarium-ai.firebasestorage.app',
  messagingSenderId: '246389408868',
  appId: '1:246389408868:web:37687b69b2f63f63ad0b71',
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

// On native (Android/iOS) we need AsyncStorage-backed persistence so the
// user's anonymous sign-in survives app restarts. On web fall back to getAuth.
let auth;
if (Platform.OS === 'web') {
  auth = getAuth(app);
} else {
  try {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch (e) {
    // initializeAuth throws if already initialized (e.g. fast refresh) — reuse existing instance.
    auth = getAuth(app);
  }
}

export { auth };
export const db = getFirestore(app);
export default app;
