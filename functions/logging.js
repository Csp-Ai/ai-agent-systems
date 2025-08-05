const express = require('express');
const fs = require('fs');
const path = require('path');

/**
 * Logging utilities and endpoints.
 * Handles reading and appending application logs.
 */
const LOG_DIR = path.join(__dirname, '..', 'logs');
const LOG_FILE = path.join(LOG_DIR, 'logs.json');

function ensureLogFile() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
  if (!fs.existsSync(LOG_FILE)) {
    fs.writeFileSync(LOG_FILE, '[]', 'utf8');
  }
}

function readLogs() {
  ensureLogFile();
  try {
    return JSON.parse(fs.readFileSync(LOG_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function writeLogs(logs) {
  fs.writeFileSync(LOG_FILE, JSON.stringify(logs, null, 2));
}

function appendLog(entry) {
  const logs = readLogs();
  logs.push(entry);
  writeLogs(logs);
}

const router = express.Router();

// Return all accumulated logs
router.get('/logs', (_req, res) => {
  res.json(readLogs());
});

// Append a new log entry
router.post('/logs', (req, res) => {
  appendLog(req.body || {});
  res.json({ success: true });
});

// Simple report endpoint used by the dashboard
router.get('/report', (_req, res) => {
  res.json(readLogs());
});

module.exports = {
  router,
  appendLog,
  readLogs,
};
