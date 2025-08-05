const express = require('express');
const agentMetadata = require('../agents/agent-metadata.json');
const { getRegisteredAgents } = require('../utils/agentTools');
const { translateOutput } = require('./translation');
const { verifyUser, isOrgMember, getOrgId, recordUsage } = require('./auth');
const { billingMiddleware, incrementUsage } = require('./billing');
const { appendLog } = require('./logging');

/**
 * Agent orchestration routes.
 * Executes agents and handles dependency resolution.
 */
let registeredAgents = getRegisteredAgents();

async function executeAgent(agentName, input, results = {}, stack = []) {
  if (results[agentName]) return results[agentName];
  if (stack.includes(agentName)) {
    throw new Error('Circular dependency detected: ' + [...stack, agentName].join(' -> '));
  }
  const metadata = agentMetadata[agentName];
  if (!metadata || !metadata.enabled) {
    throw new Error(`Agent '${agentName}' not found`);
  }
  stack.push(agentName);
  const depResults = {};
  for (const dep of metadata.dependsOn || []) {
    depResults[dep] = await executeAgent(dep, input, results, stack);
  }
  const agent = registeredAgents[agentName];
  if (!agent) {
    throw new Error(`Agent '${agentName}' implementation not found`);
  }
  const result = await agent.run({ ...input, dependencies: depResults });
  results[agentName] = result;
  stack.pop();
  return result;
}

async function handleExecuteAgent(req, res) {
  const { agent: agentName, input = {}, sessionId, locale } = req.body || {};
  const uid = await verifyUser(req);
  if (!uid) return res.status(401).json({ error: 'Unauthorized' });
  const orgId = getOrgId(req);
  if (!(await isOrgMember(orgId, uid))) return res.status(403).json({ error: 'forbidden' });

  if (!agentName) {
    appendLog({
      timestamp: new Date().toISOString(),
      agent: agentName,
      input,
      error: 'Agent name not provided',
    });
    return res.status(400).json({ error: 'Agent name not provided' });
  }

  try {
    const results = {};
    let finalResult = await executeAgent(agentName, input, results);
    if (locale) {
      finalResult = await translateOutput(finalResult, locale);
      results[agentName] = finalResult;
    }
    res.json({ result: finalResult, allResults: results });
    await recordUsage(uid, sessionId || Date.now().toString(), { stepCount: 1, agentRuns: 1 });
    await incrementUsage(uid, agentName);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

const router = express.Router();
router.post('/run-agent', billingMiddleware, handleExecuteAgent);
router.post('/executeAgent', billingMiddleware, handleExecuteAgent);

module.exports = {
  router,
  executeAgent,
  handleExecuteAgent,
};
