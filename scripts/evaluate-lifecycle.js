const fs = require('fs');
const path = require('path');
const { readCollection, writeDocument } = require('../functions/db');

const META_PATH = path.join(__dirname, '../agents/agent-metadata.json');
const STAGES = ['alpha', 'beta', 'production'];

function promote(stage) {
  const idx = STAGES.indexOf(stage);
  return idx >= 0 && idx < STAGES.length - 1 ? STAGES[idx + 1] : stage;
}

async function evaluate() {
  const metadata = JSON.parse(fs.readFileSync(META_PATH, 'utf8'));
  const benchmarks = await readCollection('agentBenchmarks');
  const log = await readCollection('lifecycle');
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
    fs.writeFileSync(META_PATH, JSON.stringify(metadata, null, 2));
    await writeDocument('lifecycle', 'log', { entries: [...log, { updates }] });
  }

  return updates;
}

if (require.main === module) {
  evaluate().then(changes => {
    if (changes.length) {
      console.log('Lifecycle updates:', changes);
    } else {
      console.log('No lifecycle updates');
    }
  });
}

module.exports = { evaluate };
