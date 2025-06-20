const { readCollection, writeDocument } = require('../functions/db');

const THRESHOLD = 0.6;

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

async function readLogs() {
  return await readCollection('logs');
}

async function writeProposals(data) {
  await writeDocument('guardian', 'proposals', { data });
}

module.exports = {
  run: async () => {
    try {
      const logs = await readLogs();
      if (!logs.length) {
        return { summary: 'No logs available', misaligned: [] };
      }

      const scores = computeScores(logs);
      const proposals = [];
      const misaligned = [];

      for (const [agent, score] of Object.entries(scores)) {
        if (score < THRESHOLD) {
          misaligned.push(agent);
          proposals.push({ agent, suggestion: 'Tone deviates negatively from norms' });
        } else if (score < 0.75) {
          proposals.push({ agent, suggestion: 'Monitor communication tone' });
        }
      }

      if (proposals.length) await writeProposals(proposals);

      return {
        summary: `Analyzed ${logs.length} log entries`,
        misaligned,
        proposals,
        scores
      };
    } catch (err) {
      return { error: `Guardian agent failed: ${err.message}` };
    }
  }
};

if (require.main === module) {
  module.exports.run().then(console.log);
}


