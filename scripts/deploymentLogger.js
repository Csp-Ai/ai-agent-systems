const fs = require('fs');
const path = require('path');

const DEPLOY_DIR = path.join(__dirname, '..', 'logs', 'deployments');
const INDEX_FILE = path.join(DEPLOY_DIR, 'index.json');

function readJson(file, fallback) {
  try {
    if (!fs.existsSync(file)) return fallback;
    const data = fs.readFileSync(file, 'utf8');
    return JSON.parse(data);
  } catch {
    return fallback;
  }
}

function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function updateIndex() {
  if (!fs.existsSync(DEPLOY_DIR)) return;
  const files = fs.readdirSync(DEPLOY_DIR)
    .filter(f => f.endsWith('.json') && f !== 'index.json');
  const index = files.map(f => {
    const entries = readJson(path.join(DEPLOY_DIR, f), []);
    return { date: path.basename(f, '.json'), count: entries.length };
  }).sort((a, b) => b.date.localeCompare(a.date));
  writeJson(INDEX_FILE, index);
}

function logDeployment(entry) {
  const date = new Date().toISOString().slice(0, 10);
  const file = path.join(DEPLOY_DIR, `${date}.json`);
  const logs = readJson(file, []);
  logs.push(entry);
  writeJson(file, logs);
  updateIndex();
}

module.exports = { logDeployment };
