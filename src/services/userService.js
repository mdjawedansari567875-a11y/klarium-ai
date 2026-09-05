import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';

// Firestore "users" collection — one document per person, keyed by their
// Firebase uid (same uid used everywhere else, including the leaderboard).
// This is the data source the future admin panel will read from and write
// to (bump points, ban/unban, grant premium).
//
// Fields:
//   email       - real Gmail address from Google Sign-In (admin-only, never
//                 shown publicly in the app)
//   googleName  - the name on their Google account (admin reference only)
//   photoURL    - Google profile photo (safe to show publicly, e.g. leaderboard)
//   username    - the name they typed in onboarding (this is what's shown
//                 publicly everywhere, e.g. leaderboard)
//   points      - manually adjustable by the admin later; starts at 0
//   isPremium   - admin can flip this to true to grant premium for free
//   banned      - admin can flip this to true to block the account
//   classNumber, board - so the admin panel can filter/search students
//   createdAt   - first time this user ever signed in
//   updatedAt   - last time any of the above changed

export async function ensureUserRecord(uid, { email, googleName, photoURL }) {
  if (!uid) return;
  const ref = doc(db, 'users', uid);
  const existing = await getDoc(ref);

  if (!existing.exists()) {
    await setDoc(ref, {
      email: email || null,
      googleName: googleName || null,
      photoURL: photoURL || null,
      username: null,
      points: 0,
      isPremium: false,
      banned: false,
      classNumber: null,
      board: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  } else {
    await setDoc(
      ref,
      {
        email: email || existing.data().email || null,
        googleName: googleName || existing.data().googleName || null,
        photoURL: photoURL || existing.data().photoURL || null,
        updatedAt: Date.now(),
      },
      { merge: true }
    );
  }
}

// Called once the student picks a username + class/board in onboarding, so
// the admin panel shows the same public name/details used in the app.
export async function updateUserProfile(uid, { username, classNumber, board }) {
  if (!uid) return;
  await setDoc(
    doc(db, 'users', uid),
    {
      username: username || null,
      classNumber: classNumber ?? null,
      board: board || null,
      updatedAt: Date.now(),
    },
    { merge: true }
  );
}

export async function getUserRecord(uid) {
  if (!uid) return null;
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? snap.data() : null;
}
