const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(__dirname, '..', 'logs');
const BENCH_FILE = path.join(LOG_DIR, 'agent-benchmarks.json');
const AUDIT_FILE = path.join(LOG_DIR, 'audit.json');
const PLAN_FILE = path.join(LOG_DIR, 'development-plans.json');
const LOG_FILE = path.join(LOG_DIR, 'logs.json');
const LAST_FILE = path.join(LOG_DIR, 'mentor-last-run.json');
const GUIDE = path.join('docs', 'AGENT_CONSTITUTION.md');

function readJson(file, defaultValue) {
  try {
    if (!fs.existsSync(file)) return defaultValue;
    const data = fs.readFileSync(file, 'utf8');
    return JSON.parse(data);
  } catch {
    return defaultValue;
  }
}

function writeJson(file, data) {
  const dir = path.dirname(file);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function analyzeBenchmarks(benchmarks) {
  const issues = [];
  benchmarks.forEach(b => {
    if (b.successRate !== undefined && b.successRate < 0.9) {
      issues.push({
        agent: b.agent,
        suggestion: `Improve success rate (currently ${b.successRate})`,
        guideline: GUIDE
      });
    }
    if (b.avgResponseTime !== undefined && b.avgResponseTime > 1300) {
      issues.push({
        agent: b.agent,
        suggestion: `Reduce avg response time of ${b.avgResponseTime}ms`,
        guideline: GUIDE
      });
    }
  });
  return issues;
}

function analyzeAudit(auditLogs) {
  const errorCounts = {};
  auditLogs.forEach(entry => {
    const msg = entry.resultSummary || '';
    if (typeof msg === 'string' && msg.toLowerCase().includes('error')) {
      errorCounts[entry.agent] = (errorCounts[entry.agent] || 0) + 1;
    }
  });
  const plans = [];
  for (const [agent, count] of Object.entries(errorCounts)) {
    if (count > 3) {
      plans.push({
        agent,
        suggestion: `Investigate frequent errors (${count} recent)`,
        guideline: GUIDE
      });
    }
  }
  return plans;
}

function shouldRunWeekly() {
  const data = readJson(LAST_FILE, {});
  const last = data.lastRun ? new Date(data.lastRun).getTime() : 0;
  return Date.now() - last > 7 * 86400000;
}

function recordRun() {
  writeJson(LAST_FILE, { lastRun: new Date().toISOString() });
}

function analyzeUsage(logs) {
  const cutoff = Date.now() - 30 * 86400000;
  const counts = {};
  logs.filter(l => new Date(l.timestamp).getTime() > cutoff).forEach(l => {
    counts[l.agent] = (counts[l.agent] || 0) + 1;
  });
  return Object.entries(counts)
    .filter(([, c]) => c < 5)
    .map(([agent]) => agent);
}

async function createIssue(agent, message) {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPOSITORY;
  if (!token || !repo) return false;
  try {
    await fetch(`https://api.github.com/repos/${repo}/issues`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: `Improve ${agent}`,
        body: message,
        labels: ['agent-improvement']
      })
    });
    return true;
  } catch {
    return false;
  }
}

module.exports = {
  run: async () => {
    try {
      if (!shouldRunWeekly()) {
        return { skipped: true };
      }
      const benchmarks = readJson(BENCH_FILE, []);
      const auditLogs = readJson(AUDIT_FILE, []);
      const logs = readJson(LOG_FILE, []);
      const plans = [...analyzeBenchmarks(benchmarks), ...analyzeAudit(auditLogs)];
      const lowUsage = analyzeUsage(logs);
      const issues = [];
      for (const agent of lowUsage) {
        const created = await createIssue(agent, 'Agent has low usage over the last 30 days');
        if (created) issues.push(agent);
      }

      const summary = plans.length
        ? `Identified ${plans.length} improvement areas.`
        : 'No major issues detected.';
      const encouragement = 'Keep pushing forward—great work so far!';

      const existing = readJson(PLAN_FILE, []);
      existing.push({ timestamp: new Date().toISOString(), plans });
      writeJson(PLAN_FILE, existing);
      recordRun();

      return { summary, encouragement, plans, issuesCreated: issues };
    } catch (err) {
      return { error: `Mentor agent failed: ${err.message}` };
    }
  }
};
