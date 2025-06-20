const fs = require('fs');
const path = require('path');

const LOG_FILE = path.join(__dirname, '..', 'logs', 'logs.json');
const META_FILE = path.join(__dirname, 'agent-metadata.json');
const SCORE_FILE = path.join(__dirname, '..', 'logs', 'alignment-scores.json');
const THRESHOLD = 0.6;

function readJson(file, fallback) {
  try {
    if (!fs.existsSync(file)) return fallback;
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return fallback;
  }
}

function writeJson(file, data) {
  const dir = path.dirname(file);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function analyzeTone(text = '') {
  const positive = ['success', 'completed', 'great', 'ok', 'good'];
  const negative = ['fail', 'error', 'bad', 'wrong', 'misaligned'];
  let score = 0.5;
  const lower = text.toLowerCase();
  for (const w of positive) if (lower.includes(w)) score += 0.1;
  for (const w of negative) if (lower.includes(w)) score -= 0.1;
  if (score > 1) score = 1;
  if (score < 0) score = 0;
  return score;
}

function computeScores(logs) {
  const totals = {};
  const counts = {};
  logs.forEach(entry => {
    const agent = entry.agent;
    if (!agent) return;
    const text = entry.error || JSON.stringify(entry.output || '');
    const s = analyzeTone(text);
    totals[agent] = (totals[agent] || 0) + s;
    counts[agent] = (counts[agent] || 0) + 1;
  });
  const scores = {};
  for (const [agent, total] of Object.entries(totals)) {
    scores[agent] = total / counts[agent];
  }
  return scores;
}

module.exports = {
  run: async () => {
    const logs = readJson(LOG_FILE, []);
    const scores = computeScores(logs);
    const metadata = readJson(META_FILE, {});
    let updated = false;
    for (const [agent, score] of Object.entries(scores)) {
      if (!metadata[agent]) continue;
      metadata[agent].alignmentScore = score;
      const flag = score < THRESHOLD;
      if (flag && !metadata[agent].misaligned) {
        metadata[agent].misaligned = true;
        updated = true;
      } else if (!flag && metadata[agent].misaligned) {
        metadata[agent].misaligned = false;
        updated = true;
      }
    }
    if (updated) writeJson(META_FILE, metadata);
    writeJson(SCORE_FILE, { timestamp: new Date().toISOString(), scores });
    return { scores, updated };
  }
};

if (require.main === module) {
  module.exports.run();
}
