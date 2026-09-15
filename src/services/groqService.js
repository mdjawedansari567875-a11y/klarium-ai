import AsyncStorage from '@react-native-async-storage/async-storage';

// Groq's OpenAI-compatible chat completions endpoint. Groq's free tier
// resets every minute (not once per day/month like Gemini's), so students
// who hit a limit only wait a short while instead of being stuck for the
// rest of the day.
const GROQ_MODEL = 'llama-3.3-70b-versatile';
// Groq's current vision-capable model — used as a fallback when Gemini's
// free quota runs out on a photo question, so photo help never fully stops.
const GROQ_VISION_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

const KEY_STORAGE = 'klarium_groq_api_key';
const KEY_SAVED_AT_STORAGE = 'klarium_groq_api_key_saved_at';
const KEY_LIFETIME_MS = 24 * 60 * 60 * 1000; // 24 hours, same policy as the Gemini key

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

export async function markGroqKeySaved() {
  await AsyncStorage.setItem(KEY_SAVED_AT_STORAGE, String(Date.now()));
}

export async function getGroqKeyTimeRemainingMs() {
  const savedAt = Number((await AsyncStorage.getItem(KEY_SAVED_AT_STORAGE)) || 0);
  if (!savedAt) return 0;
  const remaining = KEY_LIFETIME_MS - (Date.now() - savedAt);
  return remaining > 0 ? remaining : 0;
}

async function getValidGroqKey() {
  const key = await AsyncStorage.getItem(KEY_STORAGE);
  if (!key) {
    throw new Error('NO_API_KEY');
  }
  const remaining = await getGroqKeyTimeRemainingMs();
  if (remaining <= 0) {
    throw new Error('API_KEY_EXPIRED');
  }
  return key;
}

function throwGroqError(status, data) {
  const message = data?.error?.message || '';
  const isQuota = status === 429 || /rate limit|quota/i.test(message);
  if (isQuota) {
    throw new Error('QUOTA_EXCEEDED');
  }
  throw new Error(message || 'AI request failed');
}

async function callGroq(key, body) {
  const response = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) {
    throwGroqError(response.status, data);
  }
  return data?.choices?.[0]?.message?.content ?? '';
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

// `history` is a neutral array of { role: 'user' | 'assistant', content }.
// Returns { text, imagePrompt } — same shape askTutorPhoto (Gemini) returns,
// so HomeScreen doesn't need to care which provider answered.
export async function askTutorText({ question, classNumber, board, history = [] }) {
  const key = await getValidGroqKey();
  const raw = await callGroq(key, {
    model: GROQ_MODEL,
    messages: [
      { role: 'system', content: TUTOR_INSTRUCTION(classNumber, board) },
      ...history,
      { role: 'user', content: question },
    ],
    max_tokens: 4096,
  });
  return extractImagePrompt(raw);
}

// Fallback photo handler — used when Gemini's quota runs out on a photo
// question, so students aren't left stuck with no way to get help on a
// photo of a question. Same input/output shape as geminiService's
// askTutorPhoto, uses Groq's own separate free-tier key/quota.
export async function askTutorPhoto({
  base64Image,
  mimeType,
  question,
  classNumber,
  board,
}) {
  const key = await getValidGroqKey();
  const raw = await callGroq(key, {
    model: GROQ_VISION_MODEL,
    messages: [
      { role: 'system', content: TUTOR_INSTRUCTION(classNumber, board) },
      {
        role: 'user',
        content: [
          { type: 'text', text: question || 'Please explain what is shown in this image.' },
          {
            type: 'image_url',
            image_url: { url: `data:${mimeType};base64,${base64Image}` },
          },
        ],
      },
    ],
    max_tokens: 4096,
  });
  return extractImagePrompt(raw);
}

async function requestQuiz({ topics, classNumber, board, count = 5 }) {
  const key = await getValidGroqKey();
  const language = board === 'NCERT' ? 'Hindi (Devanagari script)' : 'English';
  const prompt = `
Create a ${count}-question multiple choice quiz for a Class ${classNumber} (${board}) student
based ONLY on these topics they studied: ${topics.join(', ')}.
Write the question text and all 4 options entirely in ${language}.
Respond with ONLY valid JSON, no markdown, in this exact shape:
[{"question": "...", "options": ["A","B","C","D"], "correctIndex": 0}]
The array must contain exactly ${count} questions.
`;
  const raw = await callGroq(key, {
    model: GROQ_MODEL,
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 8192,
  });
  const cleaned = raw.replace(/```json|```/g, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    return [];
  }
}

// Generates the weekly 7-day-streak test — 50 questions from this week's topics.
export async function generateWeeklyQuiz({ topics, classNumber, board }) {
  return requestQuiz({ topics, classNumber, board, count: 50 });
}

// Generates a short on-demand practice quiz (premium feature) — stays short (5).
export async function generatePracticeQuiz({ topics, classNumber, board }) {
  return requestQuiz({ topics, classNumber, board, count: 5 });
}
