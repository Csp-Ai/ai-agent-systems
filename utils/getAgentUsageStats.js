const fs = require('fs');
const path = require('path');
const catalog = require('../agents/agent-catalog.json');

function getAgentUsageStats() {
  const usageDir = path.join(__dirname, '..', 'logs', 'usage');
  if (!fs.existsSync(usageDir)) {
    return { mostUsedAgents: [], avgRunTime: {}, totalInvocations: {} };
  }

  const deptByAgent = {};
  for (const [dept, ids] of Object.entries(catalog)) {
    for (const id of ids) {
      deptByAgent[id] = dept;
    }
  }

  const agentCounts = {};
  const durationTotals = {};
  const durationCounts = {};
  const orgStats = {};

  for (const org of fs.readdirSync(usageDir)) {
    const orgPath = path.join(usageDir, org);
    if (!fs.statSync(orgPath).isDirectory()) continue;
    const deptCounts = {};
    orgStats[org] = deptCounts;
    for (const file of fs.readdirSync(orgPath)) {
      if (!file.endsWith('.json')) continue;
      const agentId = path.basename(file, '.json');
      let entries;
      try {
        entries = JSON.parse(fs.readFileSync(path.join(orgPath, file), 'utf8'));
      } catch {
        entries = [];
      }
      if (!Array.isArray(entries)) continue;
      const count = entries.length;
      agentCounts[agentId] = (agentCounts[agentId] || 0) + count;
      const dept = deptByAgent[agentId] || 'unknown';
      deptCounts[dept] = (deptCounts[dept] || 0) + count;
      for (const e of entries) {
        durationTotals[agentId] = (durationTotals[agentId] || 0) + (e.duration || 0);
        durationCounts[agentId] = (durationCounts[agentId] || 0) + 1;
      }
    }
  }

  const mostUsedAgents = Object.entries(agentCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([agentId, count]) => ({ agentId, count }));

  const avgRunTime = {};
  for (const agentId of Object.keys(durationTotals)) {
    avgRunTime[agentId] = durationTotals[agentId] / (durationCounts[agentId] || 1);
  }

  return { mostUsedAgents, avgRunTime, totalInvocations: orgStats };
}

module.exports = getAgentUsageStats;
