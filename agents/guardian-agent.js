const fs = require('fs');
const path = require('path');

const LOG_FILE = path.join(__dirname, '..', 'logs', 'logs.json');
const PROPOSALS_FILE = path.join(__dirname, '..', 'logs', 'guardian-proposals.json');

function readLogs() {
  if (!fs.existsSync(LOG_FILE)) return [];
  try {
    const data = fs.readFileSync(LOG_FILE, 'utf8');
    const logs = JSON.parse(data);
    return Array.isArray(logs) ? logs : [];
  } catch {
    return [];
  }
}

function writeProposals(data) {
  const dir = path.dirname(PROPOSALS_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(PROPOSALS_FILE, JSON.stringify(data, null, 2));
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

function toneScore(text) {
  const positive = ['great', 'good', 'excellent', 'positive', 'success'];
  const negative = ['bad', 'fail', 'error', 'negative', 'problem'];
  let score = 0;
  const lower = text.toLowerCase();
  positive.forEach(w => { if (lower.includes(w)) score += 1; });
  negative.forEach(w => { if (lower.includes(w)) score -= 1; });
  return score;
}

module.exports = {
  run: async () => {
    try {
      const logs = readLogs();
      if (!logs.length) {
        return { summary: 'No logs available', misaligned: [] };
      }

      const toneByAgent = {};
      logs.forEach(entry => {
        if (!entry.agent) return;
        const text = extractText(entry);
        const score = toneScore(text);
        if (!toneByAgent[entry.agent]) toneByAgent[entry.agent] = { total: 0, count: 0 };
        toneByAgent[entry.agent].total += score;
        toneByAgent[entry.agent].count += 1;
      });

      const misaligned = [];
      const proposals = [];
      for (const [agent, data] of Object.entries(toneByAgent)) {
        const avg = data.total / data.count;
        if (avg < -0.5) {
          misaligned.push(agent);
          proposals.push({ agent, suggestion: 'Tone deviates negatively from norms' });
        } else if (avg < 0) {
          proposals.push({ agent, suggestion: 'Monitor communication tone' });
        }
      }

      if (proposals.length) writeProposals(proposals);

      return { summary: `Checked ${logs.length} log entries`, misaligned, proposals };
    } catch (err) {
      return { error: `Guardian agent failed: ${err.message}` };
    }
  }
};
