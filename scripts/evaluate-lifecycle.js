const fs = require('fs');
const path = require('path');

const META_PATH = path.join(__dirname, '../agents/agent-metadata.json');
const BENCH_PATH = path.join(__dirname, '../logs/agent-benchmarks.json');
const LOG_PATH = path.join(__dirname, '../logs/lifecycle-log.json');

const STAGES = ['alpha', 'beta', 'production'];

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return fallback;
  }
}

function writeJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function promote(stage) {
  const idx = STAGES.indexOf(stage);
  return idx >= 0 && idx < STAGES.length - 1 ? STAGES[idx + 1] : stage;
}

function evaluate() {
  const metadata = readJson(META_PATH, {});
  const benchmarks = readJson(BENCH_PATH, []);
  const log = readJson(LOG_PATH, []);
  const updates = [];

  for (const [id, meta] of Object.entries(metadata)) {
    const bench = benchmarks.find(b => b.agent === id) || {};
    const lastUsed = bench.lastUsed ? new Date(bench.lastUsed).getTime() : 0;
    const success = bench.successRate || 0;

    if (Date.now() - lastUsed > 30 * 86400000) {
      if (meta.lifecycle !== 'deprecated') {
        updates.push({ agent: id, from: meta.lifecycle, to: 'deprecated' });
        meta.lifecycle = 'deprecated';
      }
      continue;
    }

    if (success > 0.95 && lastUsed > Date.now() - 7 * 86400000) {
      const newStage = promote(meta.lifecycle);
      if (newStage !== meta.lifecycle) {
        updates.push({ agent: id, from: meta.lifecycle, to: newStage });
        meta.lifecycle = newStage;
      }
    }
  }

  if (updates.length) {
    writeJson(META_PATH, metadata);
    log.push({ timestamp: new Date().toISOString(), updates });
    writeJson(LOG_PATH, log);
  }

  return updates;
}

if (require.main === module) {
  const changes = evaluate();
  if (changes.length) {
    console.log('Lifecycle updates:', changes);
  } else {
    console.log('No lifecycle updates');
  }
}

module.exports = { evaluate };
