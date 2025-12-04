const express = require("express");
const router = express.Router();
const { handleVoiceCommand, listTasks, completeTask } = require("../controllers/voiceController");
const authMiddleware = require("../middlewares/authMiddleware");

router.post("/voice-command", authMiddleware, express.json(), handleVoiceCommand);
router.get("/tasks", authMiddleware, listTasks);
router.post("/tasks/:id/complete", authMiddleware, completeTask);

module.exports = router;
