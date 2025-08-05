const fs = require('fs');
const path = require('path');
const { validateAgentMetadata } = require('../utils/metadataValidator');

/**
 * Load all agents from the ../agents directory.
 * Returns an object with agent names as keys and agent modules as values.
 */
const metadataPath = path.join(__dirname, '..', 'agents', 'agent-metadata.json');

function loadAgents() {
  const agents = {};
  const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
  validateAgentMetadata(metadata);
  const agentsDir = path.join(__dirname, '..', 'agents');
  if (!fs.existsSync(agentsDir)) {
    return agents;
  }

  fs.readdirSync(agentsDir).forEach((file) => {
    const modulePath = path.join(agentsDir, file);
    if (fs.statSync(modulePath).isFile() && file.endsWith('.js')) {
      const agentName = path.basename(file, '.js');
      try {
        const agent = require(modulePath);
        if (agent && typeof agent.run === 'function' && agent.run.constructor.name === 'AsyncFunction') {
          agents[agentName] = agent;
          console.log(`Loaded agent: ${agentName}`);
        } else {
          console.warn(`Agent ${agentName} does not export a valid async run() function`);
        }
      } catch (err) {
        console.error(`Failed to load agent ${agentName}:`, err);
      }
    }
  });

  return agents;
}

module.exports = loadAgents;
