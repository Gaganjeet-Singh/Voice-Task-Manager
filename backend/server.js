require("dotenv").config();
const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");

// Fix private key formatting for Render environment
let privateKey = process.env.FIREBASE_PRIVATE_KEY;
if (privateKey?.includes("\\n")) {
  privateKey = privateKey.replace(/\\n/g, "\n");
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: privateKey,
    }),
    databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`,
  });
}

const app = express();
app.use(cors());
app.use(express.json());

// Routes
const voiceRoutes = require("./src/routes/voiceRoutes");
app.use("/api", voiceRoutes);

app.get("/", (_, res) => res.send("Backend running 😎"));

// Global error logging
app.use((err, req, res, next) => {
  console.error("Unhandled backend error:", err);
  res.status(500).json({ error: err.message });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 Backend live on ${PORT}`));
