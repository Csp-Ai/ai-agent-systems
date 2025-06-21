#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const AGENTS_DIR = path.join(__dirname, '..', 'agents');
const META_FILE = path.join(AGENTS_DIR, 'agent-metadata.json');
const LOG_FILE = path.join(__dirname, '..', 'logs', 'test-results.json');

function ensureLogFile() {
  const dir = path.dirname(LOG_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function readMetadata() {
  try {
    return JSON.parse(fs.readFileSync(META_FILE, 'utf8'));
  } catch {
    return {};
  }
}

async function runAgent(agentPath, inputs) {
  const agent = require(agentPath);
  if (!agent || typeof agent.run !== 'function') {
    throw new Error('Agent missing run() export');
  }
  const results = [];
  for (const input of inputs) {
    try {
      const output = await agent.run(input);
      const valid = output && typeof output === 'object';
      results.push({ input, success: valid, output: valid ? output : undefined, error: valid ? undefined : 'Invalid output' });
    } catch (err) {
      results.push({ input, success: false, error: err.message });
    }
  }
  return results;
}

(async () => {
  ensureLogFile();
  const metadata = readMetadata();
  const files = fs.readdirSync(AGENTS_DIR).filter(f => f.endsWith('.js') && f !== 'agent-metadata.json' && f !== 'agent-catalog.json');
  const summary = { timestamp: new Date().toISOString(), results: {} };

  for (const file of files) {
    const id = path.basename(file, '.js');
    const tests = (metadata[id] && metadata[id].testInputs) || [{}];
    const agentPath = path.join(AGENTS_DIR, file);
    let results;
    try {
      results = await runAgent(agentPath, Array.isArray(tests) ? tests : [tests]);
    } catch (err) {
      summary.results[id] = { passed: false, cases: [], error: `Load failed: ${err.message}` };
      console.error(`\x1b[31m❌ ${id} failed to load\x1b[0m`);
      console.error('  ', err.message);
      continue;
    }

    const passed = results.every(r => r.success);
    summary.results[id] = { passed, cases: results };
    if (passed) {
      console.log(`\x1b[32m✅ ${id} passed\x1b[0m`);
    } else {
      console.error(`\x1b[31m❌ ${id} failed\x1b[0m`);
      results.filter(r => !r.success).forEach(r => console.error('  ', r.error));
    }
  }

  fs.writeFileSync(LOG_FILE, JSON.stringify(summary, null, 2));
})();

