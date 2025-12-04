// backend/src/controllers/voiceController.js
const admin = require("firebase-admin");

const db = admin.firestore();

/**
 * POST /api/voice-command
 * Body: { text: "string" }  (frontend sends this from BrowserVoiceRecorder)
 */
async function handleVoiceCommand(req, res) {
  try {
    const uid = req.uid;
    if (!uid) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Support either { text } or { transcript } just in case
    const text = (req.body && (req.body.text || req.body.transcript)) || "";
    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "Missing text field" });
    }

    const lower = text.toLowerCase().trim();
    const tasksCol = db.collection("users").doc(uid).collection("tasks");

    console.log("Voice command from", uid, "→", text);

    // === LIST TASKS ===
    if (
      lower.includes("list") ||
      lower.includes("show tasks") ||
      lower.includes("my tasks")
    ) {
      const snapshot = await tasksCol
        .orderBy("createdAt", "desc")
        .limit(50)
        .get();

      const tasks = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

      return res.json({
        action: "tasks-list",
        count: tasks.length,
        tasks,
        text,
      });
    }

    // === COMPLETE TASK (first incomplete) ===
    if (
      lower.includes("complete task") ||
      lower.includes("mark done") ||
      lower.includes("finish task") ||
      lower === "done" ||
      lower.includes("mark as done")
    ) {
      const incompleteSnap = await tasksCol
        .where("completed", "==", false)
        .orderBy("createdAt", "asc")
        .limit(1)
        .get();

      if (incompleteSnap.empty) {
        return res.json({
          action: "no-tasks",
          message: "No pending tasks to complete",
          text,
        });
      }

      const doc = incompleteSnap.docs[0];
      await tasksCol.doc(doc.id).update({
        completed: true,
        completedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return res.json({
        action: "task-completed",
        taskId: doc.id,
        title: doc.data().title || "Untitled Task",
        text,
      });
    }

    // === CREATE TASK (default for "add / create / remind / remember") ===
    if (
      lower.startsWith("add ") ||
      lower.startsWith("create ") ||
      lower.startsWith("remember ") ||
      lower.startsWith("remind ") ||
      lower.includes("add task") ||
      lower.includes("create task") ||
      lower.includes("remind me") ||
      lower.includes("remember to")
    ) {
      // Strip some common prefixes to get a nicer title
      let title = lower;
      title = title
        .replace("add task", "")
        .replace("create task", "")
        .replace("add", "")
        .replace("create", "")
        .replace("remember to", "")
        .replace("remember", "")
        .replace("remind me to", "")
        .replace("remind me", "")
        .trim();

      // Fall back to original text if we stripped too much
      if (!title) title = text.trim();

      const docData = {
        title: title || "Untitled Task",
        completed: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      const newDoc = await tasksCol.add(docData);

      return res.json({
        action: "task-created",
        taskId: newDoc.id,
        task: { id: newDoc.id, ...docData },
        text,
      });
    }

    // === UNKNOWN COMMAND ===
    return res.json({
      action: "unknown",
      message: "Command not recognized",
      text,
    });
  } catch (err) {
    console.error("handleVoiceCommand error", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
}

/**
 * GET /api/tasks
 */
async function listTasks(req, res) {
  try {
    const uid = req.uid;
    if (!uid) return res.status(401).json({ error: "Unauthorized" });

    const snapshot = await db
      .collection("users")
      .doc(uid)
      .collection("tasks")
      .orderBy("createdAt", "desc")
      .limit(100)
      .get();

    const tasks = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    return res.json(tasks);
  } catch (err) {
    console.error("listTasks error", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
}

/**
 * POST /api/tasks/:id/complete
 */
async function completeTask(req, res) {
  try {
    const uid = req.uid;
    const taskId = req.params.id;

    if (!uid) return res.status(401).json({ error: "Unauthorized" });
    if (!taskId) return res.status(400).json({ error: "Missing task id" });

    const docRef = db
      .collection("users")
      .doc(uid)
      .collection("tasks")
      .doc(taskId);

    await docRef.update({
      completed: true,
      completedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.json({ success: true, taskId });
  } catch (err) {
    console.error("completeTask error", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
}

module.exports = { handleVoiceCommand, listTasks, completeTask };
