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
  const warnings = [];
  const metadataAgents = Object.keys(metadata);
  const fileAgents = agentFiles.map(file => file.replace('.js', ''));

  metadataAgents.forEach(name => {
    const agent = metadata[name] || {};
    const isPlanned = agent.status === 'planned';
    if (!fileAgents.includes(name)) {
      if (isPlanned) {
        warnings.push(`Planned agent ${name} has no file and is exempt`);
      } else {
        errors.push(`Missing agent file: ${name}.js`);
      }
    }
  });

  fileAgents.forEach(name => {
    if (!metadataAgents.includes(name)) {
      errors.push(`Unregistered agent file: ${name}.js`);
    }
  });

  return { errors, warnings };
}

function checkRequiredFields(agent) {
  const required = [
    'name',
    'description',
    'inputs',
    'outputs',
    'category',
    'version',
    'createdBy',
    'lifecycle'
  ];
  return required.filter(key => !Object.prototype.hasOwnProperty.call(agent, key));
}

function scanForBannedPatterns(agentPath) {
  const code = fs.readFileSync(agentPath, 'utf-8');
  const sanitized = code
    .split(/\n/)
    .filter(line => !line.includes('BANNED_PATTERNS'))
    .join('\n');
  return BANNED_PATTERNS.filter(pattern => sanitized.includes(pattern));
}

function runChecks() {
  const metadata = loadMetadata();
  const agentFiles = listAgentFiles();
  const errors = [];
  const warnings = [];

  const consistency = checkAgentConsistency(metadata, agentFiles);
  errors.push(...consistency.errors);
  warnings.push(...consistency.warnings);

  Object.entries(metadata).forEach(([id, agent]) => {
    const missingFields = checkRequiredFields(agent);
    if (missingFields.length) {
      errors.push(`Agent ${id} missing fields: ${missingFields.join(', ')}`);
    }
    if (agent.status === 'planned' && agent.lifecycle !== 'incubation') {
      errors.push(`Planned agent ${id} must have lifecycle incubation`);
    }
    if (agent.misaligned && ['production', 'mature'].includes(agent.lifecycle)) {
      warnings.push(`Misaligned agent ${id} in ${agent.lifecycle} lifecycle`);
    }
  });

  agentFiles.forEach(file => {
    const fullPath = path.join(AGENT_FOLDER, file);
    const patterns = scanForBannedPatterns(fullPath);
    if (patterns.length) {
      errors.push(`Banned patterns in ${file}: ${patterns.join(', ')}`);
    }
  });

  if (warnings.length) {
    console.warn(warnings.join('\n'));
  }

  if (errors.length) {
    console.error('Constitution check failed:\n' + errors.join('\n'));
    process.exit(1);
  } else {
    console.log('Constitution check passed.');
  }
}

runChecks();
