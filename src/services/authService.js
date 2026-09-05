import { signInAnonymously, onAuthStateChanged, GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { auth } from './firebaseConfig';

// This is the "Web client" OAuth ID from google-services.json (oauth_client
// with client_type: 3) — required by GoogleSignin.configure() even on
// Android, since it's used to verify the ID token with Firebase.
const WEB_CLIENT_ID = '246389408868-tu20s438vcgnbv3purp4il10v8okm82v.apps.googleusercontent.com';

let configured = false;
function ensureGoogleConfigured() {
  if (configured) return;
  GoogleSignin.configure({ webClientId: WEB_CLIENT_ID });
  configured = true;
}

// Called once when the app boots. Every user gets a real, unique Firebase
// account automatically (no email/password needed) — this is what lets
// each device's scores be tied to a stable ID in Firestore. This anonymous
// account is later "upgraded" in place when the student signs in with
// Google during onboarding (same uid carries over).
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

// Shows the native Google account picker, then signs the (already
// anonymously-signed-in) Firebase user into that Google account. Returns
// { email, displayName, photoURL } from the chosen Google account so the
// caller can store them (e.g. for the leaderboard photo and a future admin
// panel), while the student's typed name stays what's shown publicly.
export async function signInWithGoogle() {
  ensureGoogleConfigured();
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const userInfo = await GoogleSignin.signIn();
  const idToken = userInfo.data?.idToken ?? userInfo.idToken;
  if (!idToken) {
    throw new Error('GOOGLE_SIGNIN_NO_TOKEN');
  }
  const credential = GoogleAuthProvider.credential(idToken);
  const result = await signInWithCredential(auth, credential);
  return {
    email: result.user.email,
    displayName: result.user.displayName,
    photoURL: result.user.photoURL,
  };
}

export function getCurrentUid() {
  return auth.currentUser?.uid ?? null;
}
