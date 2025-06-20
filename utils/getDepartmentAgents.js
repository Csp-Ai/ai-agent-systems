const catalog = require('../agents/agent-catalog.json');
const metadata = require('../agents/agent-metadata.json');

function getDepartmentAgents(departmentName) {
  const ids = catalog[departmentName] || [];
  return ids
    .map(id => (metadata[id] ? { id, ...metadata[id] } : null))
    .filter(Boolean);
}

module.exports = getDepartmentAgents;
