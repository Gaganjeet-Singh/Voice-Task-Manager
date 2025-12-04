// frontend/src/services/api.js
const API_BASE = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

async function authFetch(path, options = {}, idToken = null) {
  const headers = options.headers ? { ...options.headers } : {};
  if (idToken) headers["Authorization"] = `Bearer ${idToken}`;

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const text = await res.text().catch(() => "");
  try { return JSON.parse(text || "{}"); }
  catch { return text; }
}

export async function sendTextCommand(text, idToken) {
  return authFetch(
    "/api/voice-command",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transcript: text }),
    },
    idToken
  );
}

export async function listTasks(idToken) {
  return authFetch("/api/tasks", { method: "GET" }, idToken);
}

export async function completeTask(taskId, idToken) {
  return authFetch(`/api/tasks/${taskId}/complete`, { method: "POST" }, idToken);
}

export default { sendTextCommand, listTasks, completeTask };
