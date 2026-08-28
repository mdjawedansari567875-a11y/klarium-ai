import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebaseConfig';

// Called once when the app boots. Every user gets a real, unique Firebase
// account automatically (no email/password needed) — this is what lets
// each device's scores be tied to a stable ID in Firestore.
export function ensureSignedIn() {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (user) => {
        unsubscribe();
        if (user) {
          resolve(user.uid);
        } else {
          try {
            const result = await signInAnonymously(auth);
            resolve(result.user.uid);
          } catch (err) {
            reject(err);
          }
        }
      },
      reject
    );
  });
}

export function getCurrentUid() {
  return auth.currentUser?.uid ?? null;
}
