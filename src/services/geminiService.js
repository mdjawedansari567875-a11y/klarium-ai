import AsyncStorage from '@react-native-async-storage/async-storage';

// This model can return BOTH text and a generated illustrative image in one
// response — this is what lets KLARIUM AI "show and tell" like a real tutor.
const GEMINI_MODEL = 'gemini-2.5-flash-image';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const KEY_STORAGE = 'klarium_api_key';
const KEY_SAVED_AT_STORAGE = 'klarium_api_key_saved_at';
const KEY_LIFETIME_MS = 24 * 60 * 60 * 1000; // 24 hours

// The system instruction that makes the AI teach "like explaining to a child" —
// simple words, one topic at a time, plus a helpful picture, as requested.
const TUTOR_INSTRUCTION = (classNumber, board) => `
You are KLARIUM AI, a friendly tutor for a Class ${classNumber} student following the ${board} curriculum.
Rules for every answer:
- Explain like you're talking to a curious child — simple words, short sentences.
- Cover ONE topic/idea at a time. Do not overload with multiple concepts at once.
- Use a simple everyday example or analogy wherever possible.
- ALWAYS also generate one simple, colorful, clear illustration or diagram that
  visually explains the topic — like a picture from a children's textbook —
  alongside your text explanation, so the student can see it as well as read it.
- Keep answers encouraging and warm, never condescending.
- If the question is unclear, ask a gentle follow-up question (image optional in that case).
`;

// Call this from Settings right after the user saves a key, so the
// 24-hour window starts from that moment.
export async function markApiKeySaved() {
  await AsyncStorage.setItem(KEY_SAVED_AT_STORAGE, String(Date.now()));
}

// Returns milliseconds remaining before the key "expires" in-app, or 0 if expired/unset.
export async function getKeyTimeRemainingMs() {
  const savedAt = Number((await AsyncStorage.getItem(KEY_SAVED_AT_STORAGE)) || 0);
  if (!savedAt) return 0;
  const remaining = KEY_LIFETIME_MS - (Date.now() - savedAt);
  return remaining > 0 ? remaining : 0;
}

async function getValidApiKey() {
  const key = await AsyncStorage.getItem(KEY_STORAGE);
  if (!key) {
    throw new Error('NO_API_KEY');
  }
  const remaining = await getKeyTimeRemainingMs();
  if (remaining <= 0) {
    throw new Error('API_KEY_EXPIRED');
  }
  return key;
}

// Calls Gemini and returns both the text explanation and a generated image
// (as a data URI, ready to drop straight into an <Image> source), if one came back.
async function callGeminiWithImage(key, body) {
  const response = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': key,
    },
    body: JSON.stringify({
      ...body,
      generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
    }),
  });
  const data = await response.json();
  if (!response.ok) {
    throwGeminiError(response.status, data);
  }

  const parts = data?.candidates?.[0]?.content?.parts ?? [];
  let text = '';
  let image = null;
  for (const part of parts) {
    if (part.text) text += part.text;
    if (part.inlineData?.data) {
      image = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
    }
  }
  return { text: text.trim(), image };
}

// Free-tier Gemini keys stop working once the daily/monthly quota runs out.
// Google returns HTTP 429 with a RESOURCE_EXHAUSTED status in that case —
// this turns that into a clear, specific error the UI can act on.
function throwGeminiError(status, data) {
  const message = data?.error?.message || '';
  const errStatus = data?.error?.status || '';
  const isQuota =
    status === 429 ||
    errStatus === 'RESOURCE_EXHAUSTED' ||
    /quota|exceeded|upgrade|billing/i.test(message);

  if (isQuota) {
    throw new Error('QUOTA_EXCEEDED');
  }
  throw new Error(message || 'AI request failed');
}

// Text-only helper for things that must stay plain text (like quiz JSON) —
// no image generation, cheaper and faster.
async function callGeminiTextOnly(key, body) {
  const textModelUrl =
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
  const response = await fetch(textModelUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': key,
    },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) {
    throwGeminiError(response.status, data);
  }
  return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

// Ask the AI a text question. Returns { text, image } — image may be null
// if the model chose not to generate one (e.g. a clarifying question).
export async function askTutorText({ question, classNumber, board }) {
  const key = await getValidApiKey();
  return callGeminiWithImage(key, {
    systemInstruction: { parts: [{ text: TUTOR_INSTRUCTION(classNumber, board) }] },
    contents: [{ role: 'user', parts: [{ text: question }] }],
  });
}

// Ask the AI about a photo (e.g. a textbook page, a diagram, homework question).
// Returns { text, image } — the AI can both read the photo AND draw a fresh
// illustration to explain the concept further.
export async function askTutorPhoto({ base64Image, mimeType, question, classNumber, board }) {
  const key = await getValidApiKey();
  return callGeminiWithImage(key, {
    systemInstruction: { parts: [{ text: TUTOR_INSTRUCTION(classNumber, board) }] },
    contents: [
      {
        role: 'user',
        parts: [
          { text: question || 'Please explain what is shown in this image.' },
          { inline_data: { mime_type: mimeType, data: base64Image } },
        ],
      },
    ],
  });
}

// Generates a short quiz from the list of topics the student has learned this week.
// Text-only — quizzes don't need generated images.
export async function generateWeeklyQuiz({ topics, classNumber, board }) {
  const key = await getValidApiKey();
  const prompt = `
Create a 5-question multiple choice quiz for a Class ${classNumber} (${board}) student
based ONLY on these topics they studied this week: ${topics.join(', ')}.
Respond with ONLY valid JSON, no markdown, in this exact shape:
[{"question": "...", "options": ["A","B","C","D"], "correctIndex": 0}]
`;
  const raw = await callGeminiTextOnly(key, {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
  });
  const cleaned = raw.replace(/```json|```/g, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    return [];
  }
}
