const fs = require('fs');
const path = require('path');

const AGENT_FOLDER = path.join(__dirname, '../agents');
const METADATA_FILE = path.join(AGENT_FOLDER, 'agent-metadata.json');
const BANNED_PATTERNS = [
  'eval(',
  'require("child_process"',
  'execSync',
  'child_process',
  'fs.unlink',
  'rm -rf'
];

function loadMetadata() {
  if (!fs.existsSync(METADATA_FILE)) throw new Error('agent-metadata.json missing');
  const data = fs.readFileSync(METADATA_FILE, 'utf-8');
  return JSON.parse(data);
}

function listAgentFiles() {
  return fs.readdirSync(AGENT_FOLDER).filter(f => f.endsWith('.js'));
}

function checkAgentConsistency(metadata, agentFiles) {
  const errors = [];
  const metadataAgents = Object.keys(metadata);
  const fileAgents = agentFiles.map(file => file.replace('.js', ''));

  metadataAgents.forEach(name => {
    if (!fileAgents.includes(name)) {
      errors.push(`Missing agent file: ${name}.js`);
    }
  });

  fileAgents.forEach(name => {
    if (!metadataAgents.includes(name)) {
      errors.push(`Unregistered agent file: ${name}.js`);
    }
  });

  return errors;
}

function checkRequiredFields(agent) {
  const required = ['name', 'description', 'lifecycle', 'dependencies', 'maturity'];
  return required.filter(key => !agent.hasOwnProperty(key));
}

function scanForBannedPatterns(agentPath) {
  const code = fs.readFileSync(agentPath, 'utf-8');
  return BANNED_PATTERNS.filter(pattern => code.includes(pattern));
}

function runChecks() {
  const metadata = loadMetadata();
  const agentFiles = listAgentFiles();
  const errors = [];

  errors.push(...checkAgentConsistency(metadata, agentFiles));

  Object.entries(metadata).forEach(([id, agent]) => {
    const missingFields = checkRequiredFields(agent);
    if (missingFields.length) {
      errors.push(`Agent ${id} missing fields: ${missingFields.join(', ')}`);
    }
  });

  agentFiles.forEach(file => {
    const fullPath = path.join(AGENT_FOLDER, file);
    const patterns = scanForBannedPatterns(fullPath);
    if (patterns.length) {
      errors.push(`Banned patterns in ${file}: ${patterns.join(', ')}`);
    }
  });

  if (errors.length) {
    console.error('Constitution check failed:\n' + errors.join('\n'));
    process.exit(1);
  } else {
    console.log('Constitution check passed.');
  }
}

runChecks();
