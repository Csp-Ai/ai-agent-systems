const fs = require('fs');
const path = require('path');
const mentor = require('./mentor-agent');

const LOG_DIR = path.join(__dirname, '..', 'logs');
const BENCH_FILE = path.join(LOG_DIR, 'agent-benchmarks.json');
const AUDIT_FILE = path.join(LOG_DIR, 'audit.json');
const DEV_FILE = path.join(LOG_DIR, 'development-plans.json');
const METADATA_FILE = path.join(__dirname, 'agent-metadata.json');

function constitutionCheck(id, meta) {
  const issues = [];
  const allowed = ['alpha', 'beta', 'production', 'deprecated'];
  if (!allowed.includes(meta.lifecycle)) {
    issues.push('invalid lifecycle');
  }
  ['name', 'description', 'inputs', 'outputs', 'version'].forEach(f => {
    if (!meta[f]) issues.push(`missing ${f}`);
  });
  const filePath = path.join(__dirname, `${id}.js`);
  if (fs.existsSync(filePath)) {
    try {
      const code = fs.readFileSync(filePath, 'utf8');
      const banned = ['child_process', 'fs.unlink', 'rimraf', 'rm -rf'];
      banned.forEach(p => {
        if (code.includes(p)) issues.push(`banned pattern ${p}`);
      });
    } catch (err) {
      issues.push('error scanning file');
    }
  } else {
    issues.push('missing agent file');
  }
  return issues;
}

function readJson(file, fallback) {
  try {
    if (!fs.existsSync(file)) return fallback;
    const data = fs.readFileSync(file, 'utf8');
    return JSON.parse(data);
  } catch {
    return fallback;
  }
}

module.exports = {
  run: async () => {
    try {
      const metadata = readJson(METADATA_FILE, {});
      const benchmarks = readJson(BENCH_FILE, []);
      const audit = readJson(AUDIT_FILE, []);
      const devPlans = readJson(DEV_FILE, []);
      const mentorOutput = await mentor.run();

      const agents = Object.entries(metadata)
        .filter(([, meta]) => meta.enabled)
        .map(([id, meta]) => {
          const bench = benchmarks.find(b => b.agent === id);
          const lastUsed = bench ? bench.lastUsed : null;
          const phase = lastUsed
            ? (Date.now() - new Date(lastUsed).getTime() > 30 * 86400000
                ? 'mature'
                : 'growth')
            : 'incubating';
          return { id, name: meta.name, phase };
        });

      const now = Date.now();
      const growth = Array.from({ length: 7 }, (_, i) => {
        const day = new Date(now - (6 - i) * 86400000);
        const dStr = day.toISOString().split('T')[0];
        const count = (Array.isArray(audit) ? audit : [])
          .filter(e => e.timestamp && e.timestamp.startsWith(dStr)).length;
        return { date: dStr, count };
      });

      const recommendations = [
        ...(mentorOutput.plans || []),
        ...devPlans.flatMap(p => p.plans || [])
      ];

      for (const [id, meta] of Object.entries(metadata)) {
        const issues = constitutionCheck(id, meta);
        if (issues.length) {
          recommendations.push({
            agent: id,
            suggestion: `Constitution violations: ${issues.join('; ')}`,
            guideline: 'docs/AGENT_CONSTITUTION.md'
          });
        }
      }

      return {
        agents,
        growth,
        recommendations,
        mentorSummary: mentorOutput.summary || ''
      };
    } catch (err) {
      return { error: `Board agent failed: ${err.message}` };
    }
  }
};
