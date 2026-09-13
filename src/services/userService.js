import { doc, setDoc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
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
//   referralCode - this student's own shareable code (Refer & Earn)
//   referredBy  - uid of the student whose code this account used (set once)
//   premiumBonuses - array of expiry timestamps (ms) from referral rewards;
//                    the largest one still in the future = active bonus premium
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
      referralCode: null,
      referredBy: null,
      premiumBonuses: [],
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
  // Every student gets a shareable referral code the first time their
  // username is set — used by the Refer & Earn feature.
  await ensureReferralCode(uid, username);
}

export async function getUserRecord(uid) {
  if (!uid) return null;
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? snap.data() : null;
}

// Builds a short, shareable code from the student's username, e.g.
// "SABIR482" — falls back to a generic prefix if no username is available.
function generateReferralCode(username) {
  const base =
    (username || 'STU').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5) || 'STU';
  const suffix = Math.floor(100 + Math.random() * 900); // 3 random digits
  return `${base}${suffix}`;
}

// Ensures this student has a referral code, creating one (and its public
// code -> uid lookup entry) the first time this is called. Safe to call
// repeatedly — returns the existing code if one is already set. Always
// returns the code so the Refer & Earn screen can display it immediately.
export async function ensureReferralCode(uid, username) {
  if (!uid) return null;
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  const existingCode = snap.exists() ? snap.data().referralCode : null;
  if (existingCode) return existingCode;

  const code = generateReferralCode(username);
  await setDoc(ref, { referralCode: code, updatedAt: Date.now() }, { merge: true });
  // Public code -> uid lookup, so other students can find this uid by code
  // without needing read access to this student's full profile document.
  await setDoc(doc(db, 'referralCodes', code), { uid, createdAt: Date.now() });
  return code;
}

// Looks up which uid owns a given referral code, via the public lookup
// collection. Returns null if the code doesn't exist.
export async function findUidByReferralCode(code) {
  if (!code) return null;
  const snap = await getDoc(doc(db, 'referralCodes', code.trim().toUpperCase()));
  return snap.exists() ? snap.data().uid : null;
}

const REFERRAL_BONUS_DAYS = 3;
const DAY_MS = 24 * 60 * 60 * 1000;

// Applies a referral code entered during onboarding: grants both the new
// student AND the referrer a few days of free premium. Safe to call only
// once per new account — returns { applied: false } if this account was
// already referred, the code doesn't match a real student, or it's the
// student's own code (self-referral).
export async function applyReferralCode(newUid, code) {
  if (!newUid || !code) return { applied: false };
  const trimmedCode = code.trim().toUpperCase();

  const newUserRef = doc(db, 'users', newUid);
  const newUserSnap = await getDoc(newUserRef);
  if (newUserSnap.exists() && newUserSnap.data().referredBy) {
    return { applied: false, reason: 'ALREADY_REFERRED' };
  }

  const referrerUid = await findUidByReferralCode(trimmedCode);
  if (!referrerUid || referrerUid === newUid) {
    return { applied: false, reason: 'INVALID_CODE' };
  }

  const now = Date.now();
  const bonusExpiry = now + REFERRAL_BONUS_DAYS * DAY_MS;

  // Reward the new student — arrayUnion just adds this expiry timestamp to
  // their list of active bonuses (premiumService reads the max of these).
  await setDoc(
    newUserRef,
    {
      referredBy: referrerUid,
      premiumBonuses: arrayUnion(bonusExpiry),
      updatedAt: now,
    },
    { merge: true }
  );

  // Reward the referrer too — this only ever touches premiumBonuses, which
  // Firestore rules specifically allow any signed-in student to do for
  // anyone else's document (see rules comment).
  await updateDoc(doc(db, 'users', referrerUid), {
    premiumBonuses: arrayUnion(bonusExpiry),
    updatedAt: now,
  });

  return { applied: true };
}
