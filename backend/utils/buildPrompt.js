// backend/src/utils/buildPrompt.js
function toISOIfDateLike(s) {
  // placeholder — we'll just let GPT choose ISO if it can.
  return s;
}

module.exports = function buildPrompt(transcript, userContext = {}) {
  // userContext can include timezone, settings, etc.
  const timezone = userContext.timezone || 'UTC';

  return `User transcript: """${transcript}"""

Return ONLY valid JSON that matches this schema:

{
  "intent": one of ["CreateTask","UpdateTask","CompleteTask","DeleteTask","ListTasks","SnoozeReminder","RescheduleTask","AddNoteToTask"],
  "title": string or null,
  "description": string or null,
  "dueAt": ISO8601 datetime string or null,
  "taskId": string or null,
  "priority": "low"|"medium"|"high" or null,
  "tags": [strings] or null,
  "reminders": [ISO8601 datetime strings] or null,
  "confidence": number between 0.0 and 1.0
}

- Use the user's timezone: ${timezone}.
- If a date/time is ambiguous, choose the most likely and set confidence lower (e.g. 0.6).
- Date/time values must be ISO8601 when possible.
- Only return JSON. No surrounding text.`;
};
