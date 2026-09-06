// Pollinations.ai — free image generation, no API key or account needed.
// You send a text prompt as part of a URL, and it returns a generated image
// directly at that URL. No billing, no signup, but also no uptime guarantee
// (it's a free community service) — if it's ever slow/down, the app should
// simply show the text answer without the image rather than break anything.

function randomSeed() {
  return Math.floor(Math.random() * 1000000);
}

// Builds a ready-to-use image URL from a short description. `width`/`height`
// are kept small (512) since this is just an illustrative sketch, not a
// high-res image — keeps load times fast on a student's phone.
export function buildIllustrationUrl(promptText) {
  if (!promptText) return null;
  const cleaned = promptText.trim().slice(0, 200); // keep prompts short
  const encoded = encodeURIComponent(
    `simple educational illustration, clean diagram style, ${cleaned}`
  );
  return `https://image.pollinations.ai/prompt/${encoded}?width=512&height=512&nologo=true&seed=${randomSeed()}`;
}
