// frontend/src/components/VoiceRecorder.jsx
import React, { useState, useRef } from "react";
import { auth } from "../firebase";
import { sendVoiceCommand } from "../services/api";
import { getIdToken } from "firebase/auth";

export default function VoiceRecorder({ onResult }) {
  const [recording, setRecording] = useState(false);
  const [status, setStatus] = useState("Idle");
  const mediaRef = useRef(null);
  const chunksRef = useRef([]);

  async function startRecording() {
    try {
      setStatus("Requesting microphone...");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      mediaRef.current = mr;
      chunksRef.current = [];
      mr.ondataavailable = (e) => chunksRef.current.push(e.data);
      mr.onstop = async () => {
        setStatus("Uploading audio...");
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const fd = new FormData();
        fd.append("audio", blob, "command.webm");
        // include optional metadata
        const user = auth.currentUser;
        const idToken = user ? await getIdToken(user) : null;
        try {
          const res = await sendVoiceCommand(fd, idToken);
          setStatus("Done");
          if (onResult) onResult(res);
        } catch (err) {
          console.error(err);
          setStatus("Upload failed");
        }
      };
      mr.start();
      setRecording(true);
      setStatus("Recording...");
    } catch (err) {
      console.error(err);
      setStatus("Microphone error");
    }
  }

  function stopRecording() {
    try {
      mediaRef.current?.stop();
      setRecording(false);
      setStatus("Processing...");
    } catch (err) {
      console.error(err);
      setStatus("Stop error");
    }
  }

  return (
    <div style={{ margin: "1rem 0" }}>
      <button onClick={() => (recording ? stopRecording() : startRecording())}>
        {recording ? "Stop Recording" : "Record Voice Command"}
      </button>
      <div style={{ marginTop: 8 }}>{status}</div>
    </div>
  );
}
