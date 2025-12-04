// backend/src/controllers/voiceController.js
const admin = require('firebase-admin');
const { transcribeAudioBuffer } = require('../services/whisperService');
const { parseIntent } = require('../services/gptService');

const db = admin.firestore();

async function handleVoiceCommand(req, res) {
  try {
    const uid = req.uid;
    if (!uid) return res.status(401).json({ error: 'Unauthorized' });

    // audio file from multer (in memory)
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No audio file uploaded as "audio"' });

    // 1) Transcribe
    const transcript = await transcribeAudioBuffer(file.buffer, file.originalname, file.mimetype);

    // 2) Parse intent via GPT
    const parsed = await parseIntent(transcript, { timezone: 'UTC' }); // optionally pass user's timezone

    // 3) Handle parsed intent (simplified: only CreateTask and CompleteTask)
    const tasksCol = db.collection('users').doc(uid).collection('tasks');

    let actionResult = { action: 'none', parsed, transcript };

    if (parsed?.intent === 'CreateTask') {
      const dueAt = parsed.dueAt ? new Date(parsed.dueAt) : null;
      const doc = {
        title: parsed.title || 'Untitled',
        description: parsed.description || '',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        dueAt: dueAt ? admin.firestore.Timestamp.fromDate(dueAt) : null,
        completed: false,
        priority: parsed.priority || 'medium',
        tags: parsed.tags || [],
        reminders: (parsed.reminders || []).map(r => ({ reminderAt: admin.firestore.Timestamp.fromDate(new Date(r)), fcmSent: false })),
        meta: { source: 'voice', confidence: parsed.confidence ?? 0.9 },
      };
      const docRef = await tasksCol.add(doc);
      actionResult = { action: 'created', taskId: docRef.id, task: doc };
    } else if (parsed?.intent === 'CompleteTask') {
      const tid = parsed.taskId;
      if (!tid) {
        actionResult = { action: 'failed', reason: 'taskId missing' };
      } else {
        await tasksCol.doc(tid).update({ completed: true, completedAt: admin.firestore.FieldValue.serverTimestamp(), updatedAt: admin.firestore.FieldValue.serverTimestamp() });
        actionResult = { action: 'completed', taskId: tid };
      }
    } else if (parsed?.intent === 'ListTasks') {
      // return list as action result
      const snapshot = await tasksCol.orderBy('createdAt', 'desc').limit(50).get();
      const tasks = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      actionResult = { action: 'list', tasks };
    } else {
      actionResult = { action: 'unhandled', parsed };
    }

    return res.json({ transcript, parsed, actionResult });
  } catch (err) {
    console.error('handleVoiceCommand error', err);
    return res.status(500).json({ error: err.message });
  }
}

async function listTasks(req, res) {
  try {
    const uid = req.uid;
    if (!uid) return res.status(401).json({ error: 'Unauthorized' });
    const tasksCol = db.collection('users').doc(uid).collection('tasks');
    const snapshot = await tasksCol.orderBy('createdAt', 'desc').limit(100).get();
    const tasks = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    return res.json(tasks);
  } catch (err) {
    console.error('listTasks error', err);
    return res.status(500).json({ error: err.message });
  }
}

async function completeTask(req, res) {
  try {
    const uid = req.uid;
    const taskId = req.params.id;
    if (!uid) return res.status(401).json({ error: 'Unauthorized' });
    if (!taskId) return res.status(400).json({ error: 'Missing task id' });

    const docRef = db.collection('users').doc(uid).collection('tasks').doc(taskId);
    await docRef.update({ completed: true, completedAt: admin.firestore.FieldValue.serverTimestamp(), updatedAt: admin.firestore.FieldValue.serverTimestamp() });
    return res.json({ success: true, taskId });
  } catch (err) {
    console.error('completeTask error', err);
    return res.status(500).json({ error: err.message });
  }
}

module.exports = { handleVoiceCommand, listTasks, completeTask };
