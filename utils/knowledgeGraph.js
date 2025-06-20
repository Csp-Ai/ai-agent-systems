const { db } = require('../firebase');
const catalog = require('../agents/agent-catalog.json');

function getRelatedAgents(agentId) {
  for (const agents of Object.values(catalog)) {
    if (agents.includes(agentId)) {
      return agents.filter(a => a !== agentId);
    }
  }
  return [];
}

async function recordAgentInsight(orgId, agentId, insightType, data) {
  if (!orgId || !agentId) return;
  await db
    .collection('shared-insights')
    .doc(orgId)
    .collection(agentId)
    .add({ insightType, data, timestamp: new Date().toISOString() });
}

async function suggestAgentCollab(agentId /*, context*/ ) {
  return getRelatedAgents(agentId);
}

module.exports = {
  getRelatedAgents,
  recordAgentInsight,
  suggestAgentCollab,
};
