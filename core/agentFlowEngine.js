const fs = require('fs');
const path = require('path');
const { writeDocument } = require('../functions/db');

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
 * Execute a multi-agent flow defined in /flows/{flowId}.json
 * @param {Object} input Initial user input
 * @param {string} flowId Flow config file name without extension
 * @param {Object} opts Additional options { userId }
 */
async function runAgentFlow(input, flowId, opts = {}) {
  const { userId = 'anon' } = opts;
  const config = loadFlowConfig(flowId);
  const flowState = {
    id: flowId,
    userId,
    started: new Date().toISOString(),
    steps: []
  };

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
        await writeDocument(`flows/${userId}`, flowId, flowState).catch(() => {});
        return flowState;
      }
    }

    flowState.steps.push(state);
    await writeDocument(`flows/${userId}`, flowId, flowState).catch(() => {});
  }

  flowState.completed = true;
  flowState.finished = new Date().toISOString();
  await writeDocument(`flows/${userId}`, flowId, flowState).catch(() => {});
  return flowState;
}

module.exports = { runAgentFlow };
