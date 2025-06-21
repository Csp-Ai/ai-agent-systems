const metadata = require('../agents/agent-metadata.json');

function canAccessAgent(agentId, user) {
  const agent = metadata[agentId];
  if (!agent) return false;
  const roles = agent.accessRoles;
  if (!roles || roles.length === 0) return true;
  const role = user && user.auth && user.auth.role;
  return roles.includes(role);
}

module.exports = { canAccessAgent };

