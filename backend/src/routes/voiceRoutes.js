// backend/src/routes/voiceRoutes.js
const express = require("express");
const router = express.Router();
const voiceController = require("../controllers/voiceController");
const authMiddleware = require("../middlewares/authMiddleware");

// JSON text only now
router.post("/voice-command", authMiddleware, voiceController.handleVoiceCommand);
router.get("/tasks", authMiddleware, voiceController.listTasks);
router.post("/tasks/:id/complete", authMiddleware, voiceController.completeTask);

module.exports = router;
