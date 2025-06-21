const { functions } = require('../firebase');
const { db } = require('./db');
const { getRegisteredAgents } = require('../utils/agentTools');
const crypto = require('crypto');
const { appendUsageLog } = require('./usageLogger');

async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { agentId, orgId, input = {} } = req.body || {};
  if (!agentId) return res.status(400).json({ error: 'agentId required' });

  const agents = getRegisteredAgents();
  const agent = agents[agentId];
  if (!agent) return res.status(404).json({ error: 'agent not found' });

  let agentResponse = null;
  const log = [];
  const start = Date.now();
  const inputHash = crypto.createHash('sha256').update(JSON.stringify(input)).digest('hex');
  let status = 'success';
  try {
    log.push('executing agent');
    agentResponse = await Promise.resolve(agent.run(input));
    log.push('completed');
  } catch (err) {
    log.push('error: ' + err.message);
    status = 'error';
    return res.status(500).json({ error: err.message, log });
  } finally {
    try {
      if (orgId) {
        const ts = Date.now().toString();
        await db
          .collection('orgs')
          .doc(orgId)
          .collection('simulations')
          .doc(ts)
          .set({ agentId, input, response: agentResponse, log, timestamp: new Date().toISOString() });
      }
      appendUsageLog(orgId || 'default', agentId, {
        timestamp: new Date().toISOString(),
        userId: req.body.userId || null,
        inputHash,
        status,
        duration: Date.now() - start
      });
    } catch (err) {
      console.error('Failed to log simulation:', err.message);
    }
  }

  res.json({ agentResponse, log });
}

exports.simulateAgent = functions.https.onRequest(handler);
