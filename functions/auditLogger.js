const { appendToCollection, readCollection } = require('./db');

async function readAuditLogs() {
  return await readCollection('auditLogs');
}

async function appendAuditLog(entry) {
  await appendToCollection('auditLogs', entry);
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

async function logAgentAction({ sessionId, agent, input, result }) {
  await appendAuditLog({
    sessionId: sessionId || null,
    agent,
    inputSummary: summarize(input),
    resultSummary: summarize(result)
  });
}

module.exports = { logAgentAction, readAuditLogs, appendAuditLog };
