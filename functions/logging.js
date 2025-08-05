const express = require('express');
const { appendToCollection, readCollection } = require('./db');

/**
 * Logging utilities and endpoints.
 * Handles reading and appending application logs.
 */

function appendLog(entry) {
  appendToCollection('logs', entry).catch(() => {});
}

async function readLogs() {
  return await readCollection('logs');
}

const router = express.Router();

// Return all accumulated logs
router.get('/logs', async (_req, res) => {
  res.json(await readLogs());
});

// Append a new log entry
router.post('/logs', async (req, res) => {
  appendLog(req.body || {});
  res.json({ success: true });
});

// Simple report endpoint used by the dashboard
router.get('/report', async (_req, res) => {
  res.json(await readLogs());
});

module.exports = {
  router,
  appendLog,
  readLogs,
};
