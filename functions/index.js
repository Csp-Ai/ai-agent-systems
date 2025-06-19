const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const loadAgents = require('./loadAgents');
const agentMetadata = require('../agents/agent-metadata.json');

// Load environment variables from .env if present
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const LOG_DIR = path.join(__dirname, '..', 'logs');
const LOG_FILE = path.join(LOG_DIR, 'logs.json');

// Ensure log directory and file exist
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
  } catch (err) {
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

// Append request info to log file
function logRequest(req) {
  appendLog({
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.originalUrl,
    body: req.body,
  });
}

// Request logging middleware
app.use((req, res, next) => {
  logRequest(req);
  next();
});

// Object to hold loaded agents keyed by file name (without extension)
const registeredAgents = loadAgents();

// Endpoint to execute a specific agent
app.post('/run-agent', async (req, res) => {
  const { agent: agentName, input = {} } = req.body || {};

  if (!agentName) {
    appendLog({
      timestamp: new Date().toISOString(),
      agent: agentName,
      input,
      error: 'Agent name not provided',
    });
    return res.status(400).json({ error: 'Agent name not provided' });
  }

  const metadata = agentMetadata[agentName];

  if (!metadata) {
    appendLog({
      timestamp: new Date().toISOString(),
      agent: agentName,
      input,
      error: `Agent '${agentName}' not found in metadata`,
    });
    return res.status(400).json({ error: `Agent '${agentName}' not found` });
  }

  if (!metadata.enabled) {
    appendLog({
      timestamp: new Date().toISOString(),
      agent: agentName,
      input,
      error: `Agent '${agentName}' is disabled`,
    });
    return res.status(400).json({ error: `Agent '${agentName}' is disabled` });
  }

  const expectedInputs = metadata.inputs || {};
  const missingInputs = Object.keys(expectedInputs).filter(
    (key) => !(key in input)
  );

  if (missingInputs.length > 0) {
    appendLog({
      timestamp: new Date().toISOString(),
      agent: agentName,
      input,
      error: `Missing required inputs: ${missingInputs.join(', ')}`,
    });
    return res
      .status(400)
      .json({ error: 'Missing required inputs', missing: missingInputs });
  }

  const agent = registeredAgents[agentName];

  if (!agent) {
    appendLog({
      timestamp: new Date().toISOString(),
      agent: agentName,
      input,
      error: `Agent '${agentName}' implementation not found`,
    });
    return res
      .status(404)
      .json({ error: `Agent '${agentName}' implementation not found` });
  }

  try {
    const result = await Promise.resolve(agent.run(input));
    appendLog({
      timestamp: new Date().toISOString(),
      agent: agentName,
      input,
      output: result,
    });
    return res.json({ result });
  } catch (err) {
    console.error(`Agent '${agentName}' failed to run:`, err);
    appendLog({
      timestamp: new Date().toISOString(),
      agent: agentName,
      input,
      error: err.message,
    });
    return res.status(500).json({ error: 'Agent execution failed', details: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

module.exports = app;
