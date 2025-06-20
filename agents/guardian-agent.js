const fs = require('fs');
const path = require('path');

const LOG_FILE = path.join(__dirname, '..', 'logs', 'logs.json');
const META_FILE = path.join(__dirname, 'agent-metadata.json');
const SCORE_FILE = path.join(__dirname, '..', 'logs', 'alignment-scores.json');
const PROPOSALS_FILE = path.join(__dirname, '..', 'logs', 'guardian-proposals.json');
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

function extractText(entry) {
  const parts = [];
  if (typeof entry.input === 'string') parts.push(entry.input);
  if (entry.input && typeof entry.input === 'object') {
    for (const val of Object.values(entry.input)) {
      if (typeof val === 'string') parts.push(val);
    }
  }
  if (typeof entry.output === 'string') parts.push(entry.output);
  if (entry.output && typeof entry.output === 'object') {
    for (const val of Object.values(entry.output)) {
      if (typeof val === 'string') parts.push(val);
    }
  }
  return parts.join(' ');
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
    const text = extractText(entry) || '';
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
    try {
      const logs = readJson(LOG_FILE, []);
      const scores = computeScores(logs);
      const metadata = readJson(META_FILE, {});
      const proposals = [];
      const misaligned = [];
      let updated = false;

      for (const [agent, score] of Object.entries(scores)) {
        if (!metadata[agent]) continue;

        metadata[agent].alignmentScore = score;

        const flag = score < TH

