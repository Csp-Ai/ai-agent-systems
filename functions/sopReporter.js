const fs = require('fs');
const path = require('path');

const BENCH_FILE = path.join(__dirname, '..', 'logs', 'agent-benchmarks.json');
const SOPS_DIR = path.join(__dirname, '..', 'sops');
const SLACK_WEBHOOK = process.env.SLACK_WEBHOOK_URL || process.env.SLACK_WEBHOOK;

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function readBenchmarks() {
  ensureDir(path.dirname(BENCH_FILE));
  if (!fs.existsSync(BENCH_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(BENCH_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function writeBenchmarks(data) {
  fs.writeFileSync(BENCH_FILE, JSON.stringify(data, null, 2));
}

async function postToSlack(message) {
  if (!SLACK_WEBHOOK) return;
  try {
    await fetch(SLACK_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: message })
    });
  } catch {
    // ignore slack failures
  }
}

async function reportSOP(agent, sop) {
  const date = new Date().toISOString().split('T')[0];
  ensureDir(SOPS_DIR);
  const file = path.join(SOPS_DIR, `${agent}-${date}.json`);
  let entries = [];
  if (fs.existsSync(file)) {
    try {
      entries = JSON.parse(fs.readFileSync(file, 'utf8'));
      if (!Array.isArray(entries)) entries = [];
    } catch {
      entries = [];
    }
  }

  const benches = readBenchmarks();
  let bench = benches.find(b => b.agent === agent);
  const now = new Date().toISOString();
  if (!bench) {
    bench = { agent, avgResponseTime: sop.durationMs, runs: 1, lastUsed: now };
    benches.push(bench);
  } else {
    const runs = bench.runs || 1;
    bench.avgResponseTime = Math.round((bench.avgResponseTime * runs + sop.durationMs) / (runs + 1));
    bench.runs = runs + 1;
    bench.lastUsed = now;
  }
  writeBenchmarks(benches);

  const prevAvg = bench.avgResponseTime;
  const improved = sop.durationMs <= prevAvg;
  sop.performanceImproved = improved;
  if (sop.durationMs > prevAvg * 1.2) {
    const msg = `Performance alert: ${agent} took ${sop.durationMs}ms (avg ${prevAvg}ms)`;
    console.warn(msg);
    await postToSlack(msg);
  }

  entries.push(sop);
  fs.writeFileSync(file, JSON.stringify(entries, null, 2));
}

module.exports = { reportSOP };
