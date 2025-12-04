// backend/src/services/whisperService.js
const fetch = (...args) =>
  import('node-fetch').then(({ default: fetch }) => fetch(...args));
const FormData = require('form-data');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

async function transcribeAudioBuffer(buffer, filename = 'audio.webm', mimeType = 'audio/webm') {
  if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY not configured');

  const form = new FormData();
  form.append('file', buffer, { filename, contentType: mimeType });
  form.append('model', 'whisper-1');

  const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: form,
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Whisper error ${response.status}: ${text}`);
  }

  const result = JSON.parse(text);
  return result.text;
}

module.exports = { transcribeAudioBuffer };
