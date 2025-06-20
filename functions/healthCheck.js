const { performance } = require('perf_hooks');
const loadAgents = require('./loadAgents');
const agentMetadata = require('../agents/agent-metadata.json');
const { readCollection, appendToCollection } = require('./db');

const LT_URL = process.env.TRANSLATE_URL || 'https://libretranslate.de';

async function appendHealthStatus(entry) {
  await appendToCollection('healthStatus', entry);
}

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

function validateOutput(output, spec = {}) {
  if (!output || typeof output !== 'object') return false;
  for (const key of Object.keys(spec || {})) {
    if (!(key in output)) {
      return false;
    }
  }
  return true;
}

async function checkAgent(agentName, meta, agents) {
  const mockInput = createMockInput(meta.inputs);
  const agent = agents[agentName];
  const start = performance.now();
  let success = false;
  let error;
  let attempts = 0;
  let output;

  while (!success && attempts < 2) {
    attempts += 1;
    try {
      if (!agent || typeof agent.run !== 'function') {
        throw new Error('Agent module not found');
      }
      output = await Promise.resolve(agent.run(mockInput));
      if (!validateOutput(output, meta.outputs)) {
        throw new Error('output mismatch');
      }
      success = true;
    } catch (err) {
      error = err.message;
    }
  }

  const latencyMs = Math.round(performance.now() - start);
  const auditFailure = await hasRecentAuditFailure(agentName);
  return {
    agent: agentName,
    success,
    latencyMs,
    attempts,
    auditFailure,
    error,
    timestamp: new Date().toISOString()
  };
}

async function checkTranslation() {
  try {
    const resp = await fetch(`${LT_URL}/languages`);
    return resp.ok;
  } catch {
    return false;
  }
}

async function checkStripe() {
  const key = process.env.STRIPE_KEY;
  if (!key) return null;
  try {
    const resp = await fetch('https://api.stripe.com/v1/charges?limit=1', {
      headers: { Authorization: `Bearer ${key}` }
    });
    return resp.ok;
  } catch {
    return false;
  }
}

async function checkAuditLogs() {
  try {
    const logs = await readCollection('auditLogs');
    if (!Array.isArray(logs) || !logs.length) return false;
    const last = logs[logs.length - 1];
    if (!last.timestamp) return false;
    const ts = new Date(last.timestamp).getTime();
    return Date.now() - ts < 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

async function hasRecentAuditFailure(agentName) {
  try {
    const logs = await readCollection('auditLogs');
    if (!Array.isArray(logs)) return false;
    const recent = logs.slice(-20).reverse();
    for (const entry of recent) {
      if (entry.agent === agentName && /error|fail/i.test(entry.resultSummary || '')) {
        return true;
      }
    }
    return false;
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
  const stripe = await checkStripe();
  const auditLogRecent = await checkAuditLogs();
  const lastAudit = (() => null)();
  const overall =
    agentResults.every(r => r.success && !r.auditFailure) &&
    translation &&
    (stripe === null || stripe) &&
    auditLogRecent;
  const summary = {
    overall,
    agents: agentResults,
    services: { translation, stripe },
    auditLogRecent,
    lastAudit
  };
  await appendHealthStatus({ ...summary });
  return summary;
}

module.exports = runHealthChecks;
