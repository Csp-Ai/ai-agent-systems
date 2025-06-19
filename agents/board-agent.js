const fs = require('fs');
const path = require('path');
const mentor = require('./mentor-agent');

const LOG_DIR = path.join(__dirname, '..', 'logs');
const BENCH_FILE = path.join(LOG_DIR, 'agent-benchmarks.json');
const AUDIT_FILE = path.join(LOG_DIR, 'audit.json');
const DEV_FILE = path.join(LOG_DIR, 'development-plans.json');
const METADATA_FILE = path.join(__dirname, 'agent-metadata.json');

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
