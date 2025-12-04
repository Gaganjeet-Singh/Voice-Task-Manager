// e.g. src/components/BrowserVoiceRecorder.jsx
import React, { useState, useEffect } from "react";

export default function BrowserVoiceRecorder({ onResult }) {
  const [recognition, setRecognition] = useState(null);
  const [listening, setListening] = useState(false);

  useEffect(() => {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) {
      alert("Sorry — your browser does not support speech recognition");
      return;
    }
    const rec = new SpeechRec();
    rec.continuous = false; // or true if you like
    rec.interimResults = false;
    rec.lang = "en-US";

    rec.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      onResult({ text: transcript });
    };
    rec.onerror = (e) => {
      console.error("Speech recognition error", e);
    };
    setRecognition(rec);
  }, []);

  const start = () => {
    if (recognition && !listening) {
      recognition.start();
      setListening(true);
    }
  };

  const stop = () => {
    if (recognition && listening) {
      recognition.stop();
      setListening(false);
    }
  };

  return (
    <div>
      <button onClick={start} disabled={listening}>🎙️ Start</button>
      <button onClick={stop} disabled={!listening}>Stop</button>
    </div>
  );
}
