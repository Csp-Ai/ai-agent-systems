const fs = require('fs');
const path = require('path');

const HEALTH_FILE = path.join(__dirname, '..', 'logs', 'agent-health.json');
const REPORT_DIR = path.join(__dirname, '..', 'reports', 'agent-health');

function ensureFile() {
  const dir = path.dirname(HEALTH_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(HEALTH_FILE)) {
    fs.writeFileSync(HEALTH_FILE, '[]', 'utf8');
  }
  if (!fs.existsSync(REPORT_DIR)) {
    fs.mkdirSync(REPORT_DIR, { recursive: true });
  }
}

function readHealth() {
  ensureFile();
  try {
    return JSON.parse(fs.readFileSync(HEALTH_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function writeHealth(data) {
  fs.writeFileSync(HEALTH_FILE, JSON.stringify(data, null, 2));
}

function recordRun(agent, success, durationMs) {
  const health = readHealth();
  let entry = health.find(e => e.agent === agent);
  if (!entry) {
    entry = { agent, runs: 0, successes: 0, failures: 0, avgDuration: 0, lastActive: null };
    health.push(entry);
  }
  entry.runs += 1;
  if (success) entry.successes += 1; else entry.failures += 1;
  entry.avgDuration = Math.round((entry.avgDuration * (entry.runs - 1) + durationMs) / entry.runs);
  entry.lastActive = new Date().toISOString();
  writeHealth(health);
}

function generateWeeklySummary() {
  const data = readHealth();
  const summary = data.map(e => ({
    agent: e.agent,
    runs: e.runs,
    successRate: e.runs ? parseFloat((e.successes / e.runs).toFixed(2)) : 0,
    avgDuration: e.avgDuration,
    lastActive: e.lastActive
  }));
  const file = path.join(REPORT_DIR, `${Date.now()}.json`);
  fs.writeFileSync(file, JSON.stringify(summary, null, 2));
}

function scheduleWeeklySummary() {
  const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
  generateWeeklySummary();
  setInterval(generateWeeklySummary, WEEK_MS);
}

module.exports = { recordRun, scheduleWeeklySummary, generateWeeklySummary };
