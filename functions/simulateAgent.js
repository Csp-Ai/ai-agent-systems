const { functions } = require('../firebase');
const { db } = require('./db');
const { getRegisteredAgents } = require('../utils/agentTools');

async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { agentId, orgId, input = {} } = req.body || {};
  if (!agentId) return res.status(400).json({ error: 'agentId required' });

  const agents = getRegisteredAgents();
  const agent = agents[agentId];
  if (!agent) return res.status(404).json({ error: 'agent not found' });

  let agentResponse = null;
  const log = [];
  try {
    log.push('executing agent');
    agentResponse = await Promise.resolve(agent.run(input));
    log.push('completed');
  } catch (err) {
    log.push('error: ' + err.message);
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
    } catch (err) {
      console.error('Failed to log simulation:', err.message);
    }
  }

  res.json({ agentResponse, log });
}

exports.simulateAgent = functions.https.onRequest(handler);
