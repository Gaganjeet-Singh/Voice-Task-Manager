// backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin using Render environment variables
const firebaseProjectId = process.env.FIREBASE_PROJECT_ID;
const firebaseClientEmail = process.env.FIREBASE_CLIENT_EMAIL;
let firebasePrivateKey = process.env.FIREBASE_PRIVATE_KEY;

// Render may store multiline keys correctly, but sometimes keys contain escaped \n characters.
// Replace literal "\n" sequences with actual newlines to be safe.
if (firebasePrivateKey && firebasePrivateKey.indexOf('\\n') !== -1) {
  firebasePrivateKey = firebasePrivateKey.replace(/\\n/g, '\n');
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: firebaseProjectId,
      clientEmail: firebaseClientEmail,
      privateKey: firebasePrivateKey,
    }),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  });
}

const app = express();
app.use(cors());
app.use(express.json());

// Mount routes
const voiceRoutes = require('./src/routes/voiceRoutes');
app.use('/api', voiceRoutes);

// Health check
app.get('/', (req, res) => res.send('Backend deployed successfully!'));

// Error handler (simple)
app.use((err, req, res, next) => {
  console.error('Unhandled error', err);
  res.status(500).json({ error: err.message || 'Server error' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
