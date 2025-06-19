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

// Placeholder endpoint for orchestrating agents
app.post('/run-agent', (req, res) => {
  // Future agent orchestration logic will go here
  return res.json({ message: 'Agent execution placeholder' });
});

// Load any agent modules from /agents (optional)
function loadAgents() {
  const agentsDir = path.join(__dirname, '..', 'agents');
  if (!fs.existsSync(agentsDir)) return;

  fs.readdirSync(agentsDir).forEach((file) => {
    const modulePath = path.join(agentsDir, file);
    if (fs.statSync(modulePath).isFile() && file.endsWith('.js')) {
      try {
        const agent = require(modulePath);
        if (typeof agent === 'function') {
          agent(app);
        }
      } catch (err) {
        console.error(`Failed to load agent ${file}:`, err);
      }
    }
  });
}

loadAgents();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

module.exports = app;
