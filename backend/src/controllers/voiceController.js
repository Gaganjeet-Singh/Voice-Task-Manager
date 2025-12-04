const admin = require("firebase-admin");
const db = admin.firestore();

async function handleVoiceCommand(req, res) {
  try {
    const uid = req.uid;
    if (!uid) return res.status(401).json({ error: "Unauthorized" });

    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: "Missing text field" });
    }

    const lower = text.toLowerCase();
    const tasksCol = db.collection("users").doc(uid).collection("tasks");

    // === CREATE TASK ===
    if (lower.includes("add task") || lower.includes("create task")) {
      const title = lower
        .replace("add task", "")
        .replace("create task", "")
        .trim();

      const doc = {
        title: title || "Untitled Task",
        completed: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      const newTask = await tasksCol.add(doc);

      return res.json({
        action: "task-created",
        taskId: newTask.id,
        title: doc.title,
      });
    }

    // === LIST TASKS ===
    if (
      lower.includes("list") ||
      lower.includes("show tasks") ||
      lower.includes("my tasks")
    ) {
      const snapshot = await tasksCol.orderBy("createdAt", "desc").get();
      const tasks = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

      return res.json({
        action: "tasks-list",
        count: tasks.length,
        tasks,
      });
    }

    // === COMPLETE TASK (first incomplete) ===
    if (lower.includes("complete task") || lower.includes("done")) {
      const incomplete = await tasksCol
        .where("completed", "==", false)
        .limit(1)
        .get();

      if (!incomplete.empty) {
        const doc = incomplete.docs[0];
        await tasksCol.doc(doc.id).update({
          completed: true,
          completedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        return res.json({
          action: "task-completed",
          taskId: doc.id,
        });
      }

      return res.json({
        action: "no-tasks",
        message: "No pending tasks to complete",
      });
    }

    return res.json({
      action: "unknown",
      message: "Command not recognized",
      text,
    });
  } catch (err) {
    console.error("handleVoiceCommand error", err);
    return res.status(500).json({ error: err.message });
  }
}

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
    return res.status(500).json({ error: err.message });
  }
}

async function completeTask(req, res) {
  try {
    const uid = req.uid;
    const taskId = req.params.id;
    if (!uid) return res.status(401).json({ error: "Unauthorized" });
    if (!taskId) return res.status(400).json({ error: "Missing task id" });

    await db
      .collection("users")
      .doc(uid)
      .collection("tasks")
      .doc(taskId)
      .update({
        completed: true,
        completedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

    return res.json({ success: true, taskId });
  } catch (err) {
    console.error("completeTask error", err);
    return res.status(500).json({ error: err.message });
  }
}

module.exports = { handleVoiceCommand, listTasks, completeTask };
