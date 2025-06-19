const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');
const loadAgents = require('../functions/loadAgents');
const agentMetadata = require('../agents/agent-metadata.json');
const { logAgentAction } = require('../functions/auditLogger');

const BENCHMARK_FILE = path.join(__dirname, '..', 'logs', 'agent-benchmarks.json');
const LATENCY_THRESHOLD_MS = 5000;
const webhookUrl = process.env.SLACK_WEBHOOK_URL;

function ensureBenchmarkFile() {
  const dir = path.dirname(BENCHMARK_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(BENCHMARK_FILE)) {
    fs.writeFileSync(BENCHMARK_FILE, '[]', 'utf8');
  }
}

function readBenchmarks() {
  ensureBenchmarkFile();
  try {
    return JSON.parse(fs.readFileSync(BENCHMARK_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function writeBenchmarks(data) {
  fs.writeFileSync(BENCHMARK_FILE, JSON.stringify(data, null, 2));
}

function createMockInput(inputs) {
  const mock = {};
  for (const [key, type] of Object.entries(inputs || {})) {
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

async function postToSlack(message) {
  if (!webhookUrl) return;
  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: message }),
    });
  } catch (err) {
    console.error('Failed to post Slack alert:', err.message);
  }
}

async function main() {
  const benchmarks = readBenchmarks();
  const agents = loadAgents();
  const failing = [];

  for (const [key, meta] of Object.entries(agentMetadata)) {
    const mockInput = createMockInput(meta.inputs);
    const agent = agents[key];
    const start = performance.now();
    let success = false;
    let error;
    try {
      if (!agent || typeof agent.run !== 'function') {
        throw new Error('Agent module not found');
      }
      const result = await Promise.resolve(agent.run(mockInput));
      success = true;
    } catch (err) {
      error = err.message;
    }
    const latency = performance.now() - start;
    benchmarks.push({
      timestamp: new Date().toISOString(),
      agent: key,
      success,
      latencyMs: Math.round(latency),
    });
    if (!success || latency > LATENCY_THRESHOLD_MS) {
      failing.push({ agent: key, success, latencyMs: Math.round(latency), error });
    }
  }

  writeBenchmarks(benchmarks);

  if (failing.length) {
    const message = `Agent health check warnings:\n` + failing.map(f => `${f.agent} - ${f.success ? `slow (${f.latencyMs}ms)` : `failed: ${f.error}`}`).join('\n');
    await postToSlack(message);
    logAgentAction({
      sessionId: null,
      agent: 'agentHealthMonitor',
      input: { failing },
      result: { warning: message },
    });
  }
}

main();
