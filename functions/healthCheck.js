const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');
const loadAgents = require('./loadAgents');
const agentMetadata = require('../agents/agent-metadata.json');
const { readAuditLogs } = require('./auditLogger');

const LT_URL = process.env.TRANSLATE_URL || 'https://libretranslate.de';

function createMockInput(inputs = {}) {
  const mock = {};
  for (const [key, type] of Object.entries(inputs)) {
    switch (type) {
      case 'string':
        mock[key] = 'test';
        break;
      case 'email':
        mock[key] = 'test@example.com';
        break;
      case 'url':
        mock[key] = 'https://example.com';
        break;
      case 'number':
        mock[key] = 0;
        break;
      case 'array':
        mock[key] = [];
        break;
      case 'object':
        mock[key] = {};
        break;
      default:
        mock[key] = null;
    }
  }
  return mock;
}

async function checkAgent(agentName, meta, agents) {
  const mockInput = createMockInput(meta.inputs);
  const agent = agents[agentName];
  const start = performance.now();
  let success = false;
  let error;
  try {
    if (!agent || typeof agent.run !== 'function') {
      throw new Error('Agent module not found');
    }
    await Promise.resolve(agent.run(mockInput));
    success = true;
  } catch (err) {
    error = err.message;
  }
  const latencyMs = Math.round(performance.now() - start);
  return { agent: agentName, success, latencyMs, error };
}

async function checkTranslation() {
  try {
    const resp = await fetch(`${LT_URL}/languages`);
    return resp.ok;
  } catch {
    return false;
  }
}

function checkAuditLogs() {
  try {
    const logs = readAuditLogs();
    if (!Array.isArray(logs) || !logs.length) return false;
    const last = logs[logs.length - 1];
    if (!last.timestamp) return false;
    const ts = new Date(last.timestamp).getTime();
    return Date.now() - ts < 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

async function runHealthChecks() {
  const agents = loadAgents();
  const agentResults = [];
  for (const [key, meta] of Object.entries(agentMetadata)) {
    if (meta.enabled && meta.lifecycle === 'production' && meta.critical) {
      agentResults.push(await checkAgent(key, meta, agents));
    }
  }
  const translation = await checkTranslation();
  const auditLogRecent = checkAuditLogs();
  const overall = agentResults.every(r => r.success) && translation && auditLogRecent;
  return { overall, agents: agentResults, translation, auditLogRecent };
}

module.exports = runHealthChecks;
