const fs = require('fs');
const path = require('path');

const AGENTS_DIR = path.join(__dirname, '..', 'agents');
const META_FILE = path.join(AGENTS_DIR, 'agent-metadata.json');
const SOPS_DIR = path.join(__dirname, '..', 'sops');
const LOG_FILE = path.join(__dirname, '..', 'logs', 'system-audit.json');

function ensureLogFile() {
  const dir = path.dirname(LOG_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(LOG_FILE)) fs.writeFileSync(LOG_FILE, '[]', 'utf8');
}

function readLog() {
  ensureLogFile();
  try {
    return JSON.parse(fs.readFileSync(LOG_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function writeLog(data) {
  fs.writeFileSync(LOG_FILE, JSON.stringify(data, null, 2));
}

function sopExists(id) {
  const exts = ['.md', '.json', '.txt'];
  return exts.some(ext => fs.existsSync(path.join(SOPS_DIR, id + ext)));
}

function checkRunExport(id) {
  const file = path.join(AGENTS_DIR, `${id}.js`);
  if (!fs.existsSync(file)) return false;
  try {
    const mod = require(file);
    return typeof mod.run === 'function';
  } catch {
    return false;
  }
}

function audit() {
  const metadata = JSON.parse(fs.readFileSync(META_FILE, 'utf8'));
  const agentFiles = fs.readdirSync(AGENTS_DIR).filter(f => f.endsWith('.js'));
  const results = [];
  const counts = {};
  const seen = new Set();
  const duplicates = [];

  const allAgents = new Set([
    ...Object.keys(metadata),
    ...agentFiles.map(f => path.basename(f, '.js')),
  ]);

  for (const id of allAgents) {
    const meta = metadata[id];
    if (seen.has(id)) duplicates.push(id);
    seen.add(id);
    const active = meta ? !!meta.enabled : false;
    const dept = meta ? meta.category || 'Unknown' : 'Unknown';
    if (active) counts[dept] = (counts[dept] || 0) + 1;
    results.push({
      agent: id,
      department: dept,
      active,
      hasRun: checkRunExport(id),
      hasMetadata: !!meta,
      hasSOP: sopExists(id),
    });
  }

  const summary = {
    timestamp: new Date().toISOString(),
    activeCounts: counts,
    duplicates,
    missingSOPs: results.filter(r => !r.hasSOP).map(r => r.agent),
    inactiveAgents: results.filter(r => !r.active).map(r => r.agent),
    table: results,
  };

  const log = readLog();
  log.push(summary);
  writeLog(log);
  console.log(JSON.stringify(summary, null, 2));
}

if (require.main === module) {
  audit();
}

module.exports = { audit };
