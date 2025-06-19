const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');
const loadAgents = require('./loadAgents');
const agentMetadata = require('../agents/agent-metadata.json');

// Load environment variables from .env if present
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const LOG_DIR = path.join(__dirname, '..', 'logs');
const LOG_FILE = path.join(LOG_DIR, 'logs.json');
const SESSION_STATUS_FILE = path.join(LOG_DIR, 'sessionStatus.json');
const SESSION_LOG_DIR = path.join(LOG_DIR, 'sessions');

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

function ensureSessionFiles() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
  if (!fs.existsSync(SESSION_STATUS_FILE)) {
    fs.writeFileSync(SESSION_STATUS_FILE, '{}', 'utf8');
  }
  if (!fs.existsSync(SESSION_LOG_DIR)) {
    fs.mkdirSync(SESSION_LOG_DIR, { recursive: true });
  }
}

function readSessionStatus() {
  ensureSessionFiles();
  try {
    return JSON.parse(fs.readFileSync(SESSION_STATUS_FILE, 'utf8'));
  } catch {
    return {};
  }
}

function writeSessionStatus(data) {
  fs.writeFileSync(SESSION_STATUS_FILE, JSON.stringify(data, null, 2));
}

function updateSession(sessionId, step, agent, status) {
  const sessions = readSessionStatus();
  if (!sessions[sessionId]) sessions[sessionId] = [];
  const idx = sessions[sessionId].findIndex(s => s.step === step && s.agent === agent);
  if (idx !== -1) {
    sessions[sessionId][idx].status = status;
  } else {
    sessions[sessionId].push({ step, agent, status });
  }
  writeSessionStatus(sessions);
}

function saveSessionLog(sessionId, data) {
  ensureSessionFiles();
  const file = path.join(SESSION_LOG_DIR, `${sessionId}.json`);
  let logs = [];
  if (fs.existsSync(file)) {
    try {
      logs = JSON.parse(fs.readFileSync(file, 'utf8'));
      if (!Array.isArray(logs)) logs = [];
    } catch {
      logs = [];
    }
  }
  logs.push(data);
  fs.writeFileSync(file, JSON.stringify(logs, null, 2));
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
  const { agent: agentName, input = {}, sessionId, step } = req.body || {};

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
    if (sessionId !== undefined && step !== undefined) {
      updateSession(sessionId, step, agentName, 'active');
      saveSessionLog(sessionId, { timestamp: new Date().toISOString(), clientName: input.clientName, step, agent: agentName, status: 'active', input });
    }

    const result = await Promise.resolve(agent.run(input));

    if (sessionId !== undefined && step !== undefined) {
      updateSession(sessionId, step, agentName, 'completed');
      saveSessionLog(sessionId, { timestamp: new Date().toISOString(), clientName: input.clientName, step, agent: agentName, status: 'completed', output: result });
    }

    appendLog({
      timestamp: new Date().toISOString(),
      agent: agentName,
      input,
      output: result,
    });
    return res.json({ result });
  } catch (err) {
    if (sessionId !== undefined && step !== undefined) {
      updateSession(sessionId, step, agentName, 'failed');
      saveSessionLog(sessionId, { timestamp: new Date().toISOString(), clientName: input.clientName, step, agent: agentName, status: 'failed', error: err.message });
    }
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

// Endpoint to email report as PDF attachment
app.post('/send-report', async (req, res) => {
  const { email, report = '' } = req.body || {};
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    const pdfBuffer = await new Promise((resolve, reject) => {
      const doc = new PDFDocument();
      const buffers = [];
      doc.on('data', b => buffers.push(b));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);
      doc.text(report || 'AI Agent Report');
      doc.end();
    });

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.SMTP_USER,
      to: email,
      subject: 'Your AI Agent Report',
      text: 'Please find your AI agent report attached.',
      attachments: [
        {
          filename: 'report.pdf',
          content: pdfBuffer,
        },
      ],
    });

    res.json({ success: true });
  } catch (err) {
    console.error('Failed to send report email:', err);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

// Endpoint to fetch current session status
app.get('/status/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const sessions = readSessionStatus();
  const data = sessions[sessionId] || [];
  res.json(data);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

module.exports = app;
