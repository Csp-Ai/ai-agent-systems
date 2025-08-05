const fs = require('fs');
const path = require('path');
const { writeDocument, appendToCollection } = require('../functions/db');

function appendLog(entry) {
  appendToCollection('logs', entry).catch(() => {});
}

function loadFlowConfig(flowId) {
  const fp = path.join(__dirname, '..', 'flows', `${flowId}.json`);
  if (!fs.existsSync(fp)) {
    throw new Error(`Flow config ${flowId} not found`);
  }
  return JSON.parse(fs.readFileSync(fp, 'utf8'));
}

function loadAgent(agentName) {
  const agentPath = path.join(__dirname, '..', 'agents', `${agentName}.js`);
  try {
    const mod = require(agentPath);
    if (!mod || typeof mod.run !== 'function') {
      throw new Error('missing run() export');
    }
    return mod;
  } catch (err) {
    throw new Error(`Failed to load agent '${agentName}': ${err.message}`);
  }
}

async function runAgent(agentName, input) {
  const agent = loadAgent(agentName);
  return agent.run(input);
}

function resolvePlaceholders(obj, context) {
  if (Array.isArray(obj)) {
    return obj.map(v => resolvePlaceholders(v, context));
  }
  if (obj && typeof obj === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
      out[k] = resolvePlaceholders(v, context);
    }
    return out;
  }
  if (typeof obj === 'string' && obj.startsWith('$')) {
    const pathParts = obj.slice(1).split('.');
    let val = context;
    for (const p of pathParts) {
      if (val == null) return undefined;
      val = val[p];
    }
    return val;
  }
  return obj;
}

/**
 * Execute the website-analysis flow for a given URL
 * @param {string} url Website to analyze
 * @param {string} runId Identifier used for logging
 * @param {Object} opts Additional options { userId, configId }
 */
async function runAgentFlow(url, runId, opts = {}) {
  const { userId = 'anon', configId = 'website-analysis' } = opts;
  const config = loadFlowConfig(configId);
  const flowState = {
    id: runId,
    userId,
    started: new Date().toISOString(),
    steps: []
  };

  const input = { url };
  const ctx = { input, steps: {} };

  for (const step of config.steps) {
    const id = step.id || step.agent;
    const state = { id, agent: step.agent, started: new Date().toISOString() };
    const stepInput = resolvePlaceholders(step.input || {}, { input, steps: ctx.steps });

    try {
      const result = await runAgent(step.agent, stepInput);
      state.output = result.output;
      state.explanation = result.explanation;
      state.success = result.success !== false;
      ctx.steps[id] = { output: result.output };
    } catch (err) {
      state.error = err.message;
      state.success = false;
      if (step.onError === 'warn') {
        console.warn(`Flow step ${id} failed: ${err.message}`);
      } else if (step.onError === 'fallback' && step.fallbackAgent) {
        try {
          const fbRes = await runAgent(step.fallbackAgent, stepInput);
          state.fallback = { agent: step.fallbackAgent, output: fbRes.output };
          state.success = fbRes.success !== false;
          ctx.steps[id] = { output: fbRes.output };
        } catch (fbErr) {
          state.fallbackError = fbErr.message;
        }
      } else if (step.onError !== 'continue') {
        flowState.steps.push(state);
        await writeDocument(`flows/${userId}`, runId, flowState).catch(() => {});
        appendLog({ flowId: runId, step: id, status: 'error', error: err.message, timestamp: new Date().toISOString() });
        return flowState;
      }
    }

    flowState.steps.push(state);
    await writeDocument(`flows/${userId}`, runId, flowState).catch(() => {});
    appendLog({ flowId: runId, step: id, status: state.success ? 'complete' : 'error', timestamp: new Date().toISOString() });
  }

  flowState.completed = true;
  flowState.finished = new Date().toISOString();
  await writeDocument(`flows/${userId}`, runId, flowState).catch(() => {});
  appendLog({ flowId: runId, status: 'complete', timestamp: new Date().toISOString() });
  return flowState;
}

module.exports = { runAgentFlow };
