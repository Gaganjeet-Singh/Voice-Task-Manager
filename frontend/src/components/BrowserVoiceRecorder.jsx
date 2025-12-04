// frontend/src/components/BrowserVoiceRecorder.jsx
import React, { useState, useEffect } from "react";
import { sendVoiceCommand } from "../services/api";
import { getIdToken } from "firebase/auth";
import { auth } from "../firebase";

export default function BrowserVoiceRecorder({ onResult }) {
  const [recognition, setRecognition] = useState(null);
  const [listening, setListening] = useState(false);

  useEffect(() => {
    const SpeechRec =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRec) {
      alert("Speech Recognition not supported!");
      return;
    }

    const rec = new SpeechRec();
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.continuous = false;

    rec.onresult = async (event) => {
      const transcript = event.results[0][0].transcript;
      console.log("Speech:", transcript);
      onResult({ text: transcript });

      const token = await getIdToken(auth.currentUser);
      await sendVoiceCommand(transcript, token);
    };

    rec.onerror = (err) => console.error("Speech error:", err);

    setRecognition(rec);
  }, []);

  const start = () => {
    recognition?.start();
    setListening(true);
  };

  const stop = () => {
    recognition?.stop();
    setListening(false);
  };

  return (
    <div style={{ marginTop: "12px" }}>
      <button onClick={start} disabled={listening}>🎤 Start</button>
      <button onClick={stop} disabled={!listening} style={{ marginLeft: "8px" }}>
        Stop
      </button>
    </div>
  );
}
