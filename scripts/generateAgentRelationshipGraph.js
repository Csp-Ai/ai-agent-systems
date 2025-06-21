const fs = require('fs');
const path = require('path');

const META_FILE = path.join(__dirname, '..', 'agents', 'agent-metadata.json');
const LOG_FILE = path.join(__dirname, '..', 'logs', 'agent-graph.json');

function ensureLogDir() {
  const dir = path.dirname(LOG_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function generate() {
  const metadata = JSON.parse(fs.readFileSync(META_FILE, 'utf8'));
  const nodes = [];
  const edges = [];
  const edgeSet = new Set();

  const outputMap = {};

  for (const [id, info] of Object.entries(metadata)) {
    nodes.push({ id, name: info.name || id, department: info.category || 'Unknown' });

    if (info.outputs) {
      for (const key of Object.keys(info.outputs)) {
        if (!outputMap[key]) outputMap[key] = [];
        outputMap[key].push(id);
      }
    }
  }

  for (const [id, info] of Object.entries(metadata)) {
    if (Array.isArray(info.dependsOn)) {
      info.dependsOn.forEach(dep => {
        const key = `${dep}|${id}|dependency`;
        if (!edgeSet.has(key)) {
          edges.push({ from: dep, to: id, type: 'dependency' });
          edgeSet.add(key);
        }
      });
    }

    if (info.inputs) {
      for (const key of Object.keys(info.inputs)) {
        const providers = outputMap[key] || [];
        providers.forEach(p => {
          const edgeKey = `${p}|${id}|dataflow`;
          if (p !== id && !edgeSet.has(edgeKey)) {
            edges.push({ from: p, to: id, type: 'dataflow' });
            edgeSet.add(edgeKey);
          }
        });
      }
    }
  }

  const graph = { nodes, edges };
  ensureLogDir();
  fs.writeFileSync(LOG_FILE, JSON.stringify(graph, null, 2));
  console.log('Agent relationship graph generated.');
}

if (require.main === module) {
  generate();
}

module.exports = { generate };
