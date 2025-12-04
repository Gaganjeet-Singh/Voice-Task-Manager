// frontend/src/App.jsx
import React, { useEffect, useState } from "react";
import { auth, signInWithGooglePopup } from "./firebase";
import BrowserVoiceRecorder from "./components/BrowserVoiceRecorder";
import { getIdToken, signOut, onAuthStateChanged } from "firebase/auth";
import { sendVoiceCommand, listTasks, completeTask } from "./services/api";

export default function App() {
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [lastResult, setLastResult] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) loadTasks(u);
      else setTasks([]);
    });
    return () => unsub();
  }, []);

  async function login() {
    await signInWithGooglePopup();
  }

  async function logout() {
    await signOut(auth);
    setUser(null);
  }

  async function loadTasks(userObj = user) {
    if (!userObj) return;
    const token = await getIdToken(userObj);
    const res = await listTasks(token);
    setTasks(Array.isArray(res) ? res : res.tasks || []);
  }

  async function onVoiceResult(result) {
    if (!result.text) return;
    const token = await getIdToken(auth.currentUser);
    const res = await sendVoiceCommand(result.text, token);
    setLastResult(res);
    loadTasks(auth.currentUser);
  }

  async function onComplete(taskId) {
    const token = await getIdToken(auth.currentUser);
    await completeTask(taskId, token);
    loadTasks();
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>🎤 Voice Task Manager</h2>

      {!user ? (
        <>
          <p>Please sign in:</p>
          <button onClick={login}>Sign in with Google</button>
        </>
      ) : (
        <>
          <p>👤 {user.displayName || user.email}</p>
          <button onClick={logout}>Logout</button>

          <BrowserVoiceRecorder onResult={onVoiceResult} />

          <h3>Last Action</h3>
          <pre style={{ background: "#eee", padding: 10 }}>
            {JSON.stringify(lastResult, null, 2)}
          </pre>

          <h3>Your Tasks</h3>
          <button onClick={() => loadTasks()}>🔄 Refresh</button>

          <ul>
            {tasks.length === 0 && <li>No tasks yet</li>}
            {tasks.map((t) => (
              <li key={t.id} style={{ marginTop: 10 }}>
                {t.title}
                {!t.completed ? (
                  <button
                    onClick={() => onComplete(t.id)}
                    style={{ marginLeft: 12 }}
                  >
                    Complete
                  </button>
                ) : (
                  " ✅"
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
