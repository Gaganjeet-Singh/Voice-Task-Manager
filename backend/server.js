// backend/server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");
const path = require("path");

// --- Firebase Admin Initialization -------------------------
const firebaseProjectId = process.env.FIREBASE_PROJECT_ID;
const firebaseClientEmail = process.env.FIREBASE_CLIENT_EMAIL;
let firebasePrivateKey = process.env.FIREBASE_PRIVATE_KEY;
const firebaseStorageBucket = process.env.FIREBASE_STORAGE_BUCKET;

// In Render, PRIVATE_KEY often has literal "\n" – convert to real newlines
if (firebasePrivateKey && firebasePrivateKey.includes("\\n")) {
  firebasePrivateKey = firebasePrivateKey.replace(/\\n/g, "\n");
}

if (!admin.apps.length) {
  if (!firebaseProjectId || !firebaseClientEmail || !firebasePrivateKey) {
    console.error("❌ Missing Firebase admin env vars");
  } else {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: firebaseProjectId,
        clientEmail: firebaseClientEmail,
        privateKey: firebasePrivateKey,
      }),
      storageBucket: firebaseStorageBucket,
    });
    console.log("✅ Firebase Admin initialized");
  }
}

// --- Express App -------------------------------------------
const app = express();

app.use(cors());
app.use(express.json()); // IMPORTANT for reading req.body.text

// Routes
const voiceRoutes = require("./src/routes/voiceRoutes");
app.use("/api", voiceRoutes);

// Health check
app.get("/", (req, res) => {
  res.send("Backend deployed successfully!");
});

// Simple global error handler (for unhandled errors in routes)
app.use((err, req, res, next) => {
  console.error("Unhandled error", err);
  res.status(500).json({ error: err.message || "Server error" });
});

// Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
