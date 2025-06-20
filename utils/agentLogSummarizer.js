const { db } = require('../firebase');
const getDepartmentAgents = require('./getDepartmentAgents');

async function agentLogSummarizer(orgId, department) {
  const agentMetas = getDepartmentAgents(department);
  const agentIds = agentMetas.map(a => a.id);
  const start = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const summary = {};

  for (const id of agentIds) {
    const snap = await db
      .collection('orgs')
      .doc(orgId)
      .collection('logs')
      .where('agent', '==', id)
      .where('timestamp', '>=', new Date(start).toISOString())
      .get();
    summary[id] = snap.size;
  }

  return summary;
}

module.exports = agentLogSummarizer;
