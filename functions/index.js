const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

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

// Append request info to log file
function logRequest(req) {
  ensureLogFile();
  let logs = [];
  try {
    logs = JSON.parse(fs.readFileSync(LOG_FILE, 'utf8'));
  } catch (err) {
    // If parsing fails, reset logs
    logs = [];
  }
  logs.push({
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.originalUrl,
    body: req.body,
  });
  fs.writeFileSync(LOG_FILE, JSON.stringify(logs, null, 2));
}

// Request logging middleware
app.use((req, res, next) => {
  logRequest(req);
  next();
});

// Object to hold loaded agents keyed by file name (without extension)
const registeredAgents = {};

// Load agents from /agents directory
function loadAgents() {
  const agentsDir = path.join(__dirname, '..', 'agents');
  if (!fs.existsSync(agentsDir)) return;

  fs.readdirSync(agentsDir).forEach((file) => {
    const modulePath = path.join(agentsDir, file);
    if (fs.statSync(modulePath).isFile() && file.endsWith('.js')) {
      const agentName = path.basename(file, '.js');
      try {
        const agent = require(modulePath);
        if (agent && typeof agent.run === 'function') {
          registeredAgents[agentName] = agent;
          console.log(`Loaded agent: ${agentName}`);
        } else {
          console.warn(`Agent ${agentName} does not export a run() function`);
        }
      } catch (err) {
        console.error(`Failed to load agent ${agentName}:`, err);
      }
    }
  });
}

// Endpoint to execute a specific agent
app.post('/run-agent', async (req, res) => {
  const { agent: agentName, input } = req.body || {};

  if (!agentName) {
    return res.status(400).json({ error: 'Agent name not provided' });
  }

  const agent = registeredAgents[agentName];

  if (!agent) {
    return res.status(404).json({ error: `Agent '${agentName}' not found` });
  }

  try {
    const result = await Promise.resolve(agent.run(input));
    return res.json({ result });
  } catch (err) {
    console.error(`Agent '${agentName}' failed to run:`, err);
    return res.status(500).json({ error: 'Agent execution failed', details: err.message });
  }
});

loadAgents();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

module.exports = app;
