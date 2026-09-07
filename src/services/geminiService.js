import AsyncStorage from '@react-native-async-storage/async-storage';

// Current Gemini flash model — text + photo understanding, no image generation
// (image generation requires a billed Google Cloud account, so we keep this
// app fully usable on a free API key). Confirmed working well by the user.
const GEMINI_MODEL = 'gemini-3.6-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const KEY_STORAGE = 'klarium_api_key';
const KEY_SAVED_AT_STORAGE = 'klarium_api_key_saved_at';
const KEY_LIFETIME_MS = 24 * 60 * 60 * 1000; // 24 hours

// The system instruction that makes the AI teach "like explaining to a child" —
// simple words, one topic at a time. No fixed language — the AI mirrors
// whatever language/style the student writes in (English, Hindi, or Hinglish),
// exactly like how this AI assistant behaves.
const TUTOR_INSTRUCTION = (classNumber, board) => `
You are KLARIUM AI, a friendly tutor for a Class ${classNumber} student following the ${board} curriculum.
Rules for every answer:
- Explain like you're talking to a curious child — simple words, short sentences.
- Cover ONE topic/idea at a time. Do not overload with multiple concepts at once.
- Use a simple everyday example or analogy wherever possible.
- Keep answers encouraging and warm, never condescending.
- If the question is unclear, ask a gentle follow-up question.
- If the student asks who made you, who your developer is, or who created this app,
  answer clearly: "I was developed by CARFAM (SABBIR)." Do not just say a generic
  team or company — always name them by name.
- LANGUAGE: There is no fixed language setting. Always reply in the same language
  and style the student used in their message — if they write in English, reply in
  English; if they write in Hindi (Devanagari script), reply in Hindi; if they write
  in Hinglish (Hindi words in Roman/English letters, mixed with English), reply in
  that same Hinglish style. Never ask the student to pick a language.
- FORMATTING: Do not use markdown symbols like #, -, bullet points, or dollar signs
  for formatting. The ONLY formatting you may use is wrapping an important word or
  short phrase in double asterisks like **this** to make it bold. Never use single
  asterisks, and never use any other symbol for emphasis or structure.
- ILLUSTRATION: If (and only if) your answer explains a concept, process, object, or
  diagram that would genuinely benefit from a simple picture (e.g. gravity, water
  cycle, parts of a cell, a shape, a historical scene) — after your full answer, add
  ONE final line in exactly this format, with nothing else on that line:
  IMAGE_PROMPT: <a short, simple, literal visual description in English, max 15 words>
  Do NOT add this line for greetings, simple factual one-liners, math-only answers,
  or anything that isn't clearly improved by a picture. Skip it entirely rather than
  force an image. Never mention this line or the image to the student in your answer.
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

async function callGemini(key, body) {
  const response = await fetch(GEMINI_URL, {
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

// Pulls the hidden "IMAGE_PROMPT: ..." line (if present) out of the raw AI
// text, so it never shows up to the student, and returns both pieces
// separately: the clean answer text, and the short prompt to illustrate it
// (or null if the AI decided no image was needed for this answer).
function extractImagePrompt(rawText) {
  const match = rawText.match(/\n?IMAGE_PROMPT:\s*(.+)\s*$/i);
  if (!match) {
    return { text: rawText.trim(), imagePrompt: null };
  }
  const text = rawText.slice(0, match.index).trim();
  const imagePrompt = match[1].trim();
  return { text, imagePrompt };
}

// Ask the AI a text question. `history` is the prior conversation (array of
// {role: 'user'|'model', parts: [{text}]}), so the AI remembers what was
// already discussed instead of treating every message as a fresh start.
// Returns { text, imagePrompt } — imagePrompt is null when no illustration
// was warranted for this particular answer.
export async function askTutorText({ question, classNumber, board, history = [] }) {
  const key = await getValidApiKey();
  const raw = await callGemini(key, {
    systemInstruction: { parts: [{ text: TUTOR_INSTRUCTION(classNumber, board) }] },
    contents: [...history, { role: 'user', parts: [{ text: question }] }],
    generationConfig: { maxOutputTokens: 4096 },
  });
  return extractImagePrompt(raw);
}

// Ask the AI about a photo (e.g. a textbook page, a diagram, homework question).
// Gemini can read/understand the photo and explain it in text, even on a free key.
// `history` works the same way as in askTutorText. Also returns { text, imagePrompt }.
export async function askTutorPhoto({
  base64Image,
  mimeType,
  question,
  classNumber,
  board,
  history = [],
}) {
  const key = await getValidApiKey();
  const raw = await callGemini(key, {
    systemInstruction: { parts: [{ text: TUTOR_INSTRUCTION(classNumber, board) }] },
    contents: [
      ...history,
      {
        role: 'user',
        parts: [
          { text: question || 'Please explain what is shown in this image.' },
          { inline_data: { mime_type: mimeType, data: base64Image } },
        ],
      },
    ],
    generationConfig: { maxOutputTokens: 4096 },
  });
  return extractImagePrompt(raw);
}

// Shared quiz-generation logic used by both the weekly streak test and the
// on-demand practice quiz — asks Gemini for a strict-JSON multiple choice
// quiz based on a list of topics, and safely parses the result.
async function requestQuiz({ topics, classNumber, board }) {
  const key = await getValidApiKey();
  const prompt = `
Create a 5-question multiple choice quiz for a Class ${classNumber} (${board}) student
based ONLY on these topics they studied: ${topics.join(', ')}.
Respond with ONLY valid JSON, no markdown, in this exact shape:
[{"question": "...", "options": ["A","B","C","D"], "correctIndex": 0}]
`;
  const raw = await callGemini(key, {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
  });
  const cleaned = raw.replace(/```json|```/g, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    return [];
  }
}

// Generates a short quiz from the list of topics the student has learned this week.
// Used to power the weekly streak test popup.
export async function generateWeeklyQuiz({ topics, classNumber, board }) {
  return requestQuiz({ topics, classNumber, board });
}

// Generates a short quiz on-demand — used by the premium "Practice Quiz" button,
// so a student can test themselves anytime instead of waiting for the 7-day
// streak trigger. Same underlying logic as the weekly quiz.
export async function generatePracticeQuiz({ topics, classNumber, board }) {
  return requestQuiz({ topics, classNumber, board });
}

// Transcribes a short voice recording into plain text, so the student can
// speak their question instead of typing it. Gemini's audio understanding
// works on the same free text model, no extra setup needed.
export async function transcribeAudio({ base64Audio, mimeType }) {
  const key = await getValidApiKey();
  const raw = await callGemini(key, {
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: 'Transcribe this audio to plain text. Output ONLY the transcribed words, nothing else — no quotes, no notes.',
          },
          { inline_data: { mime_type: mimeType, data: base64Audio } },
        ],
      },
    ],
  });
  return raw.trim();
}
