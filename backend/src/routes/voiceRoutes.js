// backend/src/routes/voiceRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const voiceController = require('../controllers/voiceController');
const authMiddleware = require('../middlewares/authMiddleware');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 }});

// Voice command: accepts multipart/form-data with field "audio"
router.post('/voice-command', authMiddleware, upload.single('audio'), voiceController.handleVoiceCommand);

// Tasks
router.get('/tasks', authMiddleware, voiceController.listTasks);
router.post('/tasks/:id/complete', authMiddleware, voiceController.completeTask);

module.exports = router;
