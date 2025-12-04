// backend/src/services/gptService.js
const fetch = require('node-fetch');
const buildPrompt = require('../utils/buildPrompt');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

async function parseIntent(transcript, userContext = {}) {
  if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY not configured');

  const system = `You are a strict JSON output generator. Given a user's plain English transcript of a voice command, return ONLY a single JSON object that conforms to the schema described in the user prompt. Do not include extra explanation.`;

  const userPrompt = buildPrompt(transcript, userContext);

  const body = {
    model: 'gpt-4o-mini', // change if you prefer another model
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: userPrompt },
    ],
    max_tokens: 400,
    temperature: 0.0,
  };

  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`GPT API error: ${resp.status} ${txt}`);
  }

  const data = await resp.json();
  const content = data.choices?.[0]?.message?.content ?? '';

  // Attempt to parse JSON from model output
  try {
    const parsed = JSON.parse(content);
    return parsed;
  } catch (err) {
    // If parsing fails, return raw content for debugging
    return { intent: 'ParseError', raw: content };
  }
}

module.exports = { parseIntent };
