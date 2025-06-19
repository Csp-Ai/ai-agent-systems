const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(__dirname, '..', 'logs');
const AUDIT_FILE = path.join(LOG_DIR, 'audit.json');

function ensureAuditFile() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
  const today = new Date().toISOString().split('T')[0];
  if (fs.existsSync(AUDIT_FILE)) {
    try {
      const stats = fs.statSync(AUDIT_FILE);
      const fileDate = new Date(stats.mtime).toISOString().split('T')[0];
      if (fileDate !== today) {
        const archive = path.join(LOG_DIR, `audit-${fileDate}.json`);
        fs.renameSync(AUDIT_FILE, archive);
      }
    } catch {}
  }
  if (!fs.existsSync(AUDIT_FILE)) {
    fs.writeFileSync(AUDIT_FILE, '[]', 'utf8');
  }
}

function readAuditLogs() {
  ensureAuditFile();
  try {
    return JSON.parse(fs.readFileSync(AUDIT_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function writeAuditLogs(logs) {
  fs.writeFileSync(AUDIT_FILE, JSON.stringify(logs, null, 2));
}

function appendAuditLog(entry) {
  const logs = readAuditLogs();
  logs.push(entry);
  writeAuditLogs(logs);
}

function summarize(obj) {
  if (obj === undefined || obj === null) return '';
  let str;
  try {
    str = typeof obj === 'string' ? obj : JSON.stringify(obj);
  } catch {
    str = String(obj);
  }
  if (str.length > 200) str = str.slice(0, 200) + '...';
  return str;
}

function logAgentAction({ sessionId, agent, input, result }) {
  appendAuditLog({
    timestamp: new Date().toISOString(),
    sessionId: sessionId || null,
    agent,
    inputSummary: summarize(input),
    resultSummary: summarize(result),
  });
}

module.exports = { logAgentAction, readAuditLogs, appendAuditLog };
