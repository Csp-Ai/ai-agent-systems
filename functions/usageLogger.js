const fs = require('fs');
const path = require('path');

const USAGE_DIR = path.join(__dirname, '..', 'logs', 'usage');

function ensureDir(orgId) {
  const dir = path.join(USAGE_DIR, orgId || 'default');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function appendUsageLog(orgId, agentId, entry) {
  const dir = ensureDir(orgId);
  const file = path.join(dir, `${agentId}.json`);
  let logs = [];
  if (fs.existsSync(file)) {
    try {
      logs = JSON.parse(fs.readFileSync(file, 'utf8'));
      if (!Array.isArray(logs)) logs = [];
    } catch {
      logs = [];
    }
  }
  logs.push(entry);
  fs.writeFileSync(file, JSON.stringify(logs, null, 2));
}

module.exports = { appendUsageLog };
