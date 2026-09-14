import AsyncStorage from '@react-native-async-storage/async-storage';

// Current Gemini flash model — used ONLY for photo questions and voice
// transcription now. Regular text chat runs on Groq instead (groqService.js),
// since Groq's free tier resets every minute rather than once per day.
const GEMINI_MODEL = 'gemini-3.6-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const KEY_STORAGE = 'klarium_api_key';
const KEY_SAVED_AT_STORAGE = 'klarium_api_key_saved_at';
const KEY_LIFETIME_MS = 24 * 60 * 60 * 1000; // 24 hours

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

function extractImagePrompt(rawText) {
  const match = rawText.match(/\n?IMAGE_PROMPT:\s*(.+)\s*$/i);
  if (!match) {
    return { text: rawText.trim(), imagePrompt: null };
  }
  const text = rawText.slice(0, match.index).trim();
  const imagePrompt = match[1].trim();
  return { text, imagePrompt };
}

// Ask the AI about a photo (e.g. a textbook page, a diagram, homework question).
// Still runs on Gemini, since Groq's vision support isn't as reliable for this.
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

// Transcribes a short voice recording into plain text, so the student can
// speak their question instead of typing it. Stays on Gemini.
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
