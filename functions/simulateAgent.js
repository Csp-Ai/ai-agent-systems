const { functions } = require('../firebase');
const { db } = require('./db');

async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { agentId, orgId, input } = req.body || {};
  if (!agentId) return res.status(400).json({ error: 'agentId required' });

  const response = { agentResponse: `\uD83E\uDD16 ${agentId} received your message!` };

  try {
    if (orgId) {
      await db
        .collection('orgs')
        .doc(orgId)
        .collection('simulations')
        .add({ agentId, input, userAgent: req.get('user-agent') || '', timestamp: new Date().toISOString() });
    }
  } catch (err) {
    console.error('Failed to log simulation:', err.message);
  }

  res.json(response);
}

exports.simulateAgent = functions.https.onRequest(handler);
