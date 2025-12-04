// frontend/src/App.jsx
import React, { useEffect, useState } from "react";
import { auth, signInWithGooglePopup } from "./firebase";
import BrowserVoiceRecorder from "./components/BrowserVoiceRecorder";
import { getIdToken, signOut, onAuthStateChanged } from "firebase/auth";
import { sendTextCommand, listTasks, completeTask } from "./services/api";

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
    try {
      await signInWithGooglePopup();
    } catch (err) {
      console.error(err);
      alert("Login failed");
    }
  }

  async function logout() {
    await signOut(auth);
    setUser(null);
  }

  async function loadTasks(userObj = user) {
    if (!userObj) return;
    const token = await getIdToken(userObj);
    const res = await listTasks(token);

    if (Array.isArray(res)) setTasks(res);
    else if (res?.tasks) setTasks(res.tasks);
  }

  async function onVoiceResult(result) {
    if (!result?.text) return;

    const u = auth.currentUser;
    const token = await getIdToken(u);

    const res = await sendTextCommand(result.text, token);
    setLastResult(res);
    loadTasks(u);
  }

  async function onComplete(taskId) {
    const token = await getIdToken(auth.currentUser);
    await completeTask(taskId, token);
    loadTasks();
  }

  return (
    <div style={{ padding: 20, fontFamily: "system-ui, sans-serif" }}>
      <h2>Voice-Powered Task Manager (Demo)</h2>

      {!user ? (
        <>
          <p>Please sign in to use voice commands.</p>
          <button onClick={login}>Sign in with Google</button>
        </>
      ) : (
        <>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div>
              Signed in as <strong>{user.displayName || user.email}</strong>
            </div>
            <button onClick={logout}>Sign out</button>
          </div>

          <BrowserVoiceRecorder onResult={onVoiceResult} />

          <div style={{ marginTop: 12 }}>
            <h3>Last action result</h3>
            <pre style={{ background: "#f0f0f0", padding: 8 }}>
              {JSON.stringify(lastResult, null, 2)}
            </pre>
          </div>

          <div style={{ marginTop: 12 }}>
            <h3>Your tasks</h3>
            <button onClick={() => loadTasks()}>Refresh</button>

            <ul>
              {tasks.length === 0 && <li>No tasks yet</li>}
              {tasks.map((t) => (
                <li key={t.id} style={{ margin: "8px 0" }}>
                  <strong>{t.title || "Untitled"}</strong>
                  <div style={{ marginTop: 6 }}>
                    {!t.completed ? (
                      <button onClick={() => onComplete(t.id)}>Complete</button>
                    ) : (
                      <span>✅ Completed</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
