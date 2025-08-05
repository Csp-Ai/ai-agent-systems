const fs = require('fs').promises;
const path = require('path');

const HEALTH_FILE = path.join(__dirname, '..', 'logs', 'agent-health.json');
const REPORT_DIR = path.join(__dirname, '..', 'reports', 'agent-health');

async function ensureFile() {
  try {
    await fs.mkdir(path.dirname(HEALTH_FILE), { recursive: true });
    await fs.mkdir(REPORT_DIR, { recursive: true });
    await fs.access(HEALTH_FILE).catch(() => fs.writeFile(HEALTH_FILE, '[]', 'utf8'));
  } catch (err) {
    console.error('Failed to initialize health tracking file', err);
  }
}

async function readHealth() {
  await ensureFile();
  try {
    const data = await fs.readFile(HEALTH_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Failed to read health data', err);
    return [];
  }
}

const FLUSH_DELAY = 50;
let pendingUpdates = [];
let flushTimer = null;
let flushing = false;

function queueWrite(update) {
  pendingUpdates.push(update);
  if (!flushTimer && !flushing) {
    flushTimer = setTimeout(flushWrites, FLUSH_DELAY);
  }
}

async function flushWrites() {
  flushTimer = null;
  if (flushing) return;
  flushing = true;
  const updates = pendingUpdates;
  pendingUpdates = [];
  try {
    const health = await readHealth();
    for (const { agent, success, durationMs } of updates) {
      let entry = health.find(e => e.agent === agent);
      if (!entry) {
        entry = { agent, runs: 0, successes: 0, failures: 0, avgDuration: 0, lastActive: null };
        health.push(entry);
      }
      entry.runs += 1;
      if (success) entry.successes += 1; else entry.failures += 1;
      entry.avgDuration = Math.round((entry.avgDuration * (entry.runs - 1) + durationMs) / entry.runs);
      entry.lastActive = new Date().toISOString();
    }
    await fs.writeFile(HEALTH_FILE, JSON.stringify(health, null, 2));
  } catch (err) {
    console.error('Failed to write health data', err);
  } finally {
    flushing = false;
    if (pendingUpdates.length) {
      flushTimer = setTimeout(flushWrites, FLUSH_DELAY);
    }
  }
}

function recordRun(agent, success, durationMs) {
  queueWrite({ agent, success, durationMs });
}

async function generateWeeklySummary() {
  try {
    const data = await readHealth();
    const summary = data.map(e => ({
      agent: e.agent,
      runs: e.runs,
      successRate: e.runs ? parseFloat((e.successes / e.runs).toFixed(2)) : 0,
      avgDuration: e.avgDuration,
      lastActive: e.lastActive
    }));
    await fs.mkdir(REPORT_DIR, { recursive: true });
    const file = path.join(REPORT_DIR, `${Date.now()}.json`);
    await fs.writeFile(file, JSON.stringify(summary, null, 2));
  } catch (err) {
    console.error('Failed to generate weekly summary', err);
  }
}

function scheduleWeeklySummary() {
  const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
  generateWeeklySummary().catch(err => console.error('Weekly summary failed', err));
  setInterval(() => {
    generateWeeklySummary().catch(err => console.error('Weekly summary failed', err));
  }, WEEK_MS);
}

module.exports = { recordRun, scheduleWeeklySummary, generateWeeklySummary };
