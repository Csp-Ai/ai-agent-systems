const fs = require('fs');
const path = require('path');
const loadAgents = require('../functions/loadAgents');
const { validateAgentEntry } = require('./metadataValidator');

const agentsDir = path.join(__dirname, '..', 'agents');
const metadataPath = path.join(agentsDir, 'agent-metadata.json');

let registeredAgents = loadAgents();

function reloadAgents() {
  registeredAgents = loadAgents();
}

function getRegisteredAgents() {
  return registeredAgents;
}

function registerAgentFromForm({ agentId, displayName, description, version = '1.0.0', category = '', status = 'active', entryPoint }) {
  if (!agentId) throw new Error('agentId required');
  const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
  if (metadata[agentId]) {
    throw new Error('Agent already exists');
  }
  metadata[agentId] = {
    name: displayName || agentId,
    description: description || '',
    version,
    category,
    status,
    enabled: true,
    entryPoint: entryPoint || `${agentId}.js`,
    createdBy: 'dashboard',
    lastUpdated: new Date().toISOString().split('T')[0],
    inputs: {},
    outputs: {},
    critical: false,
    locales: ['en'],
    locale: 'en-US',
    misaligned: false
  };
  validateAgentEntry(agentId, metadata[agentId]);
  fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
  const filePath = path.join(agentsDir, `${agentId}.js`);
  if (!fs.existsSync(filePath)) {
    const content = `module.exports = {\n  async run(input) {\n    console.log('Running ${agentId}', input);\n    return { message: 'Hello from ${agentId}' };\n  }\n};\n`;
    fs.writeFileSync(filePath, content);
  }
  reloadAgents();
}

module.exports = { registerAgentFromForm, reloadAgents, getRegisteredAgents };
