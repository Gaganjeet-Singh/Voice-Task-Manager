// backend/src/middlewares/authMiddleware.js
const admin = require('firebase-admin');

module.exports = async function (req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'No auth token' });
    const decoded = await admin.auth().verifyIdToken(token);
    req.uid = decoded.uid;
    req.auth = decoded;
    next();
  } catch (err) {
    console.error('authMiddleware error', err);
    return res.status(401).json({ error: 'Unauthorized', detail: err.message });
  }
};
