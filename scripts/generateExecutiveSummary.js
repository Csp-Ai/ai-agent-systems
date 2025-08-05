const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const META_FILE = path.join(__dirname, '..', 'agents', 'agent-metadata.json');
const INDEX_FILE = path.join(__dirname, '..', 'functions', 'index.js');
const FRONTEND_DIR = path.join(__dirname, '..', 'src');
const PROCESS_LOG = path.join(__dirname, '..', 'PROCESS_LOG.md');
const OUTPUT_MD = path.join(__dirname, '..', 'docs', 'executive-summary.md');

function countEndpoints() {
  const data = fs.readFileSync(INDEX_FILE, 'utf8');
  const matches = data.match(/app\.(get|post|put|delete)/g) || [];
  return matches.length;
}

function countComponents(dir) {
  if (!fs.existsSync(dir)) return 0;
  return fs.readdirSync(dir).filter(f => f.endsWith('.jsx') || f.endsWith('.js')).length;
}

function generate() {
  const metadata = JSON.parse(fs.readFileSync(META_FILE, 'utf8'));
  const numAgents = Object.keys(metadata).length;
  const numEndpoints = countEndpoints();
  const numFrontend = countComponents(FRONTEND_DIR);
  const merges = parseInt(execSync('git log --oneline --merges | wc -l').toString().trim(), 10);
  const processLog = fs.existsSync(PROCESS_LOG) ? fs.readFileSync(PROCESS_LOG, 'utf8').trim() : '';

  const tasks = [
    'Create agent-error-reporter.js to catch invalid responses from run() methods and log to /anomalies/',
    'Add \"export report as deck\" feature in PDF logic using cover + agent outputs',
    'Implement SOP templates for all agents under /sops',
    'Build department-level analytics dashboard using Firestore data',
    'Automate process-log agent execution in a GitHub Action post-merge'
  ];

  const md = `# Executive Summary\n\n` +
    `- Total Agents: ${numAgents}\n` +
    `- API Endpoints: ${numEndpoints}\n` +
    `- Frontend Components: ${numFrontend}\n` +
    `- Commits Merged: ${merges}\n\n` +
    `## Recent Process Log\n\n${processLog}\n\n` +
    `## Recommended Next Tasks\n\n` +
    tasks.map(t => `- [NEXT PRIORITY] ${t}`).join('\n') +
    `\n\nOverall, progress aligns with the vision of modular AI agents interconnected across frontend and backend systems.`;

  fs.writeFileSync(OUTPUT_MD, md);
  console.log('Executive summary generated.');
}

if (require.main === module) {
  generate();
}

module.exports = { generate };
