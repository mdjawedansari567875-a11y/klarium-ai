import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  doc,
  setDoc,
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
} from 'firebase/firestore';
import { db } from './firebaseConfig';
import { getCurrentUid } from './authService';

const ACTIVE_DAYS_KEY = 'klarium_active_days';
const TOPICS_KEY = 'klarium_week_topics';
const LAST_TEST_AT_KEY = 'klarium_last_test_active_day_count';

function todayKey() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

// Streak tracking stays on-device — it's just "did this phone open the app
// today", so there's no need to round-trip it through Firestore.

// Call this once whenever the user opens Home / asks the AI something.
// Records today as an "active day" (no duplicates for the same day),
// consecutive or not — matching "lagatar ya kabhi kabhi karke bhi 7 din".
export async function recordActiveDay() {
  const raw = await AsyncStorage.getItem(ACTIVE_DAYS_KEY);
  const days = raw ? JSON.parse(raw) : [];
  const today = todayKey();
  if (!days.includes(today)) {
    days.push(today);
    await AsyncStorage.setItem(ACTIVE_DAYS_KEY, JSON.stringify(days));
  }
  return days.length;
}

// Call this whenever the AI successfully explains a topic to the student,
// so the weekly quiz can be generated from real topics covered.
export async function recordTopic(topicSummary) {
  const raw = await AsyncStorage.getItem(TOPICS_KEY);
  const topics = raw ? JSON.parse(raw) : [];
  topics.push(topicSummary);
  await AsyncStorage.setItem(TOPICS_KEY, JSON.stringify(topics.slice(-50)));
}

export async function getWeekTopics() {
  const raw = await AsyncStorage.getItem(TOPICS_KEY);
  return raw ? JSON.parse(raw) : [];
}

// Returns true exactly once per every 7 new active days reached —
// this is what triggers the test popup.
export async function shouldTriggerWeeklyTest() {
  const raw = await AsyncStorage.getItem(ACTIVE_DAYS_KEY);
  const days = raw ? JSON.parse(raw) : [];
  const lastTestAt = Number((await AsyncStorage.getItem(LAST_TEST_AT_KEY)) || 0);

  if (days.length > 0 && days.length % 7 === 0 && days.length !== lastTestAt) {
    return true;
  }
  return false;
}

// Call after the popup test is completed (or dismissed) so it doesn't fire again
// until the next 7 active days are reached.
export async function markTestShown() {
  const raw = await AsyncStorage.getItem(ACTIVE_DAYS_KEY);
  const days = raw ? JSON.parse(raw) : [];
  await AsyncStorage.setItem(LAST_TEST_AT_KEY, String(days.length));
  // Clear topics so next week's quiz is based on fresh material
  await AsyncStorage.setItem(TOPICS_KEY, JSON.stringify([]));
}

// --- Firestore-backed leaderboard (this is the "online" part) ---
// Collection: "leaderboard", one document per user (keyed by their
// anonymous Firebase uid), holding their most recent weekly test result.
// Every user's app instance reads this same collection, so everyone
// sees everyone else's scores in real time.

export async function saveTestScore({ name, score, total }) {
  const uid = getCurrentUid();
  if (!uid) return; // not signed in yet — score simply won't sync this time
  await setDoc(doc(db, 'leaderboard', uid), {
    name: name || 'Student',
    score,
    total,
    date: todayKey(),
    updatedAt: Date.now(),
  });
}

// Subscribes to live leaderboard updates. Call the returned function to
// unsubscribe (e.g. in a screen's cleanup). Calls onChange(entries) every
// time the data changes, for any user, anywhere.
export function subscribeToLeaderboard(onChange, maxEntries = 50) {
  const q = query(
    collection(db, 'leaderboard'),
    orderBy('score', 'desc'),
    limit(maxEntries)
  );
  return onSnapshot(q, (snapshot) => {
    const entries = snapshot.docs.map((d) => d.data());
    onChange(entries);
  });
}
