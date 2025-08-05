const express = require('express');
const { admin, db } = require('../firebase');

/**
 * Authentication utilities and lightweight auth routes.
 * Provides helpers for verifying users and checking org membership.
 */
async function verifyUser(req) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return null;
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    return decoded.uid;
  } catch {
    return null;
  }
}

async function isOrgMember(orgId, userId) {
  if (!orgId || !userId) return false;
  try {
    const doc = await db
      .collection('orgs')
      .doc(orgId)
      .collection('members')
      .doc(userId)
      .get();
    return doc.exists;
  } catch {
    return false;
  }
}

function getOrgId(req) {
  return (
    req.params.orgId ||
    req.body?.orgId ||
    req.query.orgId ||
    req.headers['x-org-id'] ||
    ''
  );
}

async function recordUsage(uid, sessionId, increments = {}) {
  const ref = db.collection('users').doc(uid).collection('usage').doc(sessionId);
  const update = { timestamp: new Date().toISOString() };
  if (increments.stepCount)
    update.stepCount = admin.firestore.FieldValue.increment(increments.stepCount);
  if (increments.agentRuns)
    update.agentRuns = admin.firestore.FieldValue.increment(increments.agentRuns);
  if (increments.pdfGenerated)
    update.pdfGenerated = admin.firestore.FieldValue.increment(increments.pdfGenerated);
  await ref.set(update, { merge: true });
}

const router = express.Router();

// Simple endpoint to verify auth token
router.get('/auth/status', async (req, res) => {
  const uid = await verifyUser(req);
  if (!uid) return res.status(401).json({ error: 'Unauthorized' });
  res.json({ uid });
});

module.exports = {
  router,
  verifyUser,
  isOrgMember,
  getOrgId,
  recordUsage,
};
