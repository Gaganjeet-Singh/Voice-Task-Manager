// backend/src/services/whisperService.js
const fetch = require('node-fetch');
const FormData = require('form-data');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

async function transcribeAudioBuffer(buffer, filename = 'audio.webm', mimeType = 'audio/webm') {
  if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY not configured');

  const form = new FormData();
  form.append('file', buffer, { filename, contentType: mimeType });
  form.append('model', 'whisper-1'); // adjust if model name changes

  const resp = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      // Note: fetch + form-data manages Content-Type (boundary)
    },
    body: form,
  });

  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`Whisper API error: ${resp.status} ${txt}`);
  }
  const data = await resp.json();
  // OpenAI transcription response usually has `text` field
  return data.text || data;
}

module.exports = { transcribeAudioBuffer };
