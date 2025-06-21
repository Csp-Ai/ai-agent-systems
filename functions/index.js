const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const JSZip = require('jszip');
const nodemailer = require('nodemailer');
const { PDFDocument, StandardFonts: pdfFonts } = require('pdf-lib');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const loadAgents = require('./loadAgents');
const { registerAgentFromForm, getRegisteredAgents } = require('../utils/agentTools');
const agentMetadata = require('../agents/agent-metadata.json');
const { registerAgent, listRegisteredAgents } = require('./agentRegistry');
const {
  logAgentAction,
  readAuditLogs,
  appendAuditLog,
} = require('./auditLogger');
const runHealthChecks = require('./healthCheck');
const { appendUsageLog } = require('./usageLogger');
const { reportSOP } = require('./sopReporter');
const { recordRun, scheduleWeeklySummary } = require('../utils/agentHealthTracker');
const { admin, db } = require('../firebase');
const stripe = require('stripe')(process.env.STRIPE_KEY || '');

// Load environment variables from .env if present
dotenv.config();

const LT_URL = process.env.TRANSLATE_URL || 'https://libretranslate.de';
const LT_KEY = process.env.TRANSLATE_KEY || '';

const ADMIN_KEY = process.env.ADMIN_KEY || 'changeme';

async function translateText(text, target, source = 'en') {
  try {
    const resp = await fetch(`${LT_URL}/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: text, target, source, api_key: LT_KEY }),
    });
    const data = await resp.json();
    return data.translatedText || text;
  } catch {
    return text;
  }
}

async function translateOutput(output, target) {
  if (!target || target.toLowerCase().startsWith('en')) return output;

  if (typeof output === 'string') {
    return await translateText(output, target);
  }
  if (Array.isArray(output)) {
    const arr = [];
    for (const item of output) arr.push(await translateOutput(item, target));
    return arr;
  }
  if (output && typeof output === 'object') {
    const obj = {};
    for (const key of Object.keys(output)) {
      obj[key] = await translateOutput(output[key], target);
    }
    return obj;
  }
  return output;
}

function isAuthorized(req) {
  const key = req.headers['x-admin-key'] || req.query.key;
  return key === ADMIN_KEY;
}

const app = express();
scheduleWeeklySummary();
app.use(cors());
app.use(express.json());
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// In-memory store for login tokens
const loginTokens = new Map();

function generateToken(email) {
  const token = crypto.randomBytes(16).toString('hex');
  loginTokens.set(token, { email, expires: Date.now() + 15 * 60 * 1000 }); // 15m
  return token;
}

function validateToken(token) {
  const data = loginTokens.get(token);
  if (!data) return null;
  if (Date.now() > data.expires) {
    loginTokens.delete(token);
    return null;
  }
  loginTokens.delete(token);
  return data.email;
}

async function verifyUser(req) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return null;
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    return decoded.uid;
  } catch {
    return null;
  }
}

async function isOrgMember(orgId, userId) {
  if (!orgId || !userId) return false;
  try {
    const doc = await db
      .collection('orgs')
      .doc(orgId)
      .collection('members')
      .doc(userId)
      .get();
    return doc.exists;
  } catch {
    return false;
  }
}

function getOrgId(req) {
  return (
    req.params.orgId ||
    req.body?.orgId ||
    req.query.orgId ||
    req.headers['x-org-id'] ||
    ''
  );
}

async function getUserPlan(uid) {
  try {
    const doc = await db.collection('users').doc(uid).collection('subscription').doc('current').get();
    return doc.exists ? doc.data().plan || 'free' : 'free';
  } catch {
    return 'free';
  }
}

async function getUsageCount(uid) {
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  const snap = await db
    .collection('users')
    .doc(uid)
    .collection('usage')
    .where('timestamp', '>=', start.toISOString())
    .get();
  return snap.size;
}

async function recordUsage(uid, sessionId, increments = {}) {
  const ref = db.collection('users').doc(uid).collection('usage').doc(sessionId);
  const update = { timestamp: new Date().toISOString() };
  if (increments.stepCount)
    update.stepCount = admin.firestore.FieldValue.increment(increments.stepCount);
  if (increments.agentRuns)
    update.agentRuns = admin.firestore.FieldValue.increment(increments.agentRuns);
  if (increments.pdfGenerated)
    update.pdfGenerated = admin.firestore.FieldValue.increment(increments.pdfGenerated);
  await ref.set(update, { merge: true });
}

const LOG_DIR = path.join(__dirname, '..', 'logs');
const LOG_FILE = path.join(LOG_DIR, 'logs.json');
const SESSION_STATUS_FILE = path.join(LOG_DIR, 'sessionStatus.json');
const SESSION_LOG_DIR = path.join(LOG_DIR, 'sessions');
const REPORTS_DIR = path.join(LOG_DIR, 'reports');
const SIMULATION_DIR = path.join(LOG_DIR, 'simulations');
const DEMO_SESSION_DIR = path.join(LOG_DIR, 'demo-sessions');
const FEEDBACK_FILE = path.join(LOG_DIR, 'feedback.json');
const WELCOME_LOG_FILE = path.join(LOG_DIR, 'welcome.json');
const ANALYTICS_FILE = path.join(LOG_DIR, 'analytics.json');
const SIM_ACTIONS_DIR = path.join(LOG_DIR, 'simulation-actions');
const NEXT_STEPS_DIR = path.join(LOG_DIR, 'next-steps');

// Ensure reports directory exists so generated PDFs can be served
if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

if (!fs.existsSync(SIMULATION_DIR)) {
  fs.mkdirSync(SIMULATION_DIR, { recursive: true });
}

if (!fs.existsSync(SIM_ACTIONS_DIR)) {
  fs.mkdirSync(SIM_ACTIONS_DIR, { recursive: true });
}

if (!fs.existsSync(NEXT_STEPS_DIR)) {
  fs.mkdirSync(NEXT_STEPS_DIR, { recursive: true });
}

}

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

async function runLifecycleCheck() {
  try {
    const { evaluate } = require('../scripts/evaluate-lifecycle');
    await evaluate();
  } catch (err) {
    console.error('Lifecycle check failed:', err.message);
  }
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

function ensureSimulationDir() {
  if (!fs.existsSync(SIMULATION_DIR)) {
    fs.mkdirSync(SIMULATION_DIR, { recursive: true });
  }
}

function ensureDemoSessionDir() {
  if (!fs.existsSync(DEMO_SESSION_DIR)) {
    fs.mkdirSync(DEMO_SESSION_DIR, { recursive: true });
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

function saveSimulationLog(orgId, timestamp, data) {
  ensureSimulationDir();
  const dir = path.join(SIMULATION_DIR, orgId || 'default');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const file = path.join(dir, `${timestamp}.json`);
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function saveDemoSession(data) {
  ensureDemoSessionDir();
  const file = path.join(DEMO_SESSION_DIR, `${Date.now()}.json`);
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function readJson(file, defaultValue) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return defaultValue;
  }
}

function writeJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function appendFeedback(entry) {
  const list = readJson(FEEDBACK_FILE, []);
  list.push(entry);
  writeJson(FEEDBACK_FILE, list);
}

function appendWelcomeLog(entry) {
  const list = readJson(WELCOME_LOG_FILE, []);
  list.push(entry);
  writeJson(WELCOME_LOG_FILE, list);
}

function appendAnalytics(entry) {
  const list = readJson(ANALYTICS_FILE, []);
  list.push(entry);
  writeJson(ANALYTICS_FILE, list);
}

function readAnalytics() {
  return readJson(ANALYTICS_FILE, []);
}

function appendSimulationAction(id, action) {
  if (!fs.existsSync(SIM_ACTIONS_DIR)) {
    fs.mkdirSync(SIM_ACTIONS_DIR, { recursive: true });
  }
  const file = path.join(SIM_ACTIONS_DIR, `${id}.json`);
  const list = readJson(file, []);
  list.push({ timestamp: new Date().toISOString(), action });
  writeJson(file, list);
}

function readSimulationActions(id) {
  const file = path.join(SIM_ACTIONS_DIR, `${id}.json`);
  return readJson(file, []);
}

function saveNextSteps(id, data) {
  if (!fs.existsSync(NEXT_STEPS_DIR)) {
    fs.mkdirSync(NEXT_STEPS_DIR, { recursive: true });
  }
  writeJson(path.join(NEXT_STEPS_DIR, `${id}.json`), data);
}

function readNextSteps(id) {
  return readJson(path.join(NEXT_STEPS_DIR, `${id}.json`), {});
}

}


function getReportsForEmail(email) {
  ensureSessionFiles();
  const files = fs.readdirSync(SESSION_LOG_DIR).filter(f => f.endsWith('.json'));
  const sessions = [];
  for (const file of files) {
    try {
      const entries = JSON.parse(fs.readFileSync(path.join(SESSION_LOG_DIR, file), 'utf8'));
      if (!Array.isArray(entries) || entries.length === 0) continue;
      const first = entries[0];
      const sessionEmail = first.input?.email || '';
      if (sessionEmail.toLowerCase() === email.toLowerCase()) {
        const id = path.basename(file, '.json');
        const pdf = path.join(REPORTS_DIR, `${id}.pdf`);
        if (fs.existsSync(pdf)) {
          sessions.push(`/reports/${id}.pdf`);
        }
      }
    } catch {
      continue;
    }
  }
  return sessions;
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
let registeredAgents = getRegisteredAgents();

async function executeAgent(agentName, input, results = {}, stack = [], sessionId, step, orgId, userId) {
  if (results[agentName]) return results[agentName];

  if (stack.includes(agentName)) {
    throw new Error('Circular dependency detected: ' + [...stack, agentName].join(' -> '));
  }

  const metadata = agentMetadata[agentName];
  if (!metadata) {
    throw new Error(`Agent '${agentName}' not found`);
  }
  if (!metadata.enabled) {
    throw new Error(`Agent '${agentName}' is disabled`);
  }

  stack.push(agentName);

  const depResults = {};
  for (const dep of metadata.dependsOn || []) {
    depResults[dep] = await executeAgent(dep, input, results, stack, sessionId, step, orgId, userId);
  }

  const expectedInputs = metadata.inputs || {};
  const missingInputs = Object.keys(expectedInputs).filter(k => !(k in input));
  if (missingInputs.length > 0) {
    throw new Error(`Missing required inputs: ${missingInputs.join(', ')}`);
  }

  const agent = registeredAgents[agentName];
  if (!agent) {
    throw new Error(`Agent '${agentName}' implementation not found`);
  }

  const startTime = Date.now();
  const inputHash = crypto.createHash('sha256').update(JSON.stringify(input)).digest('hex');
  let result;
  try {
    if (sessionId !== undefined && step !== undefined) {
      updateSession(sessionId, step, agentName, 'active');
      saveSessionLog(sessionId, {
        timestamp: new Date().toISOString(),
        clientName: input.clientName,
        step,
        agent: agentName,
        status: 'active',
        input
      });
    }

    result = await Promise.resolve(agent.run({ ...input, dependencies: depResults }));

    if (sessionId !== undefined && step !== undefined) {
      updateSession(sessionId, step, agentName, 'completed');
      saveSessionLog(sessionId, {
        timestamp: new Date().toISOString(),
        clientName: input.clientName,
        step,
        agent: agentName,
        status: 'completed',
        output: result
      });
    }

    appendLog({
      timestamp: new Date().toISOString(),
      agent: agentName,
      input,
      output: result
    });
    appendUsageLog(orgId, agentName, {
      timestamp: new Date().toISOString(),
      userId,
      inputHash,
      status: 'success',
      duration: Date.now() - startTime
    });
    logAgentAction({ sessionId, agent: agentName, input, result });

    recordRun(agentName, true, Date.now() - startTime);

    results[agentName] = result;
    stack.pop();
    await reportSOP(agentName, {
      goal: metadata.description || '',
      steps: [{ name: 'run', durationMs: Date.now() - startTime }],
      errors: [],
      suggestions: [],
      durationMs: Date.now() - startTime
    });
    return result;
  } catch (err) {
    if (sessionId !== undefined && step !== undefined) {
      updateSession(sessionId, step, agentName, 'failed');
      saveSessionLog(sessionId, {
        timestamp: new Date().toISOString(),
        clientName: input.clientName,
        step,
        agent: agentName,
        status: 'failed',
        error: err.message
      });
    }
    appendLog({
      timestamp: new Date().toISOString(),
      agent: agentName,
      input,
      error: err.message
    });
    appendUsageLog(orgId, agentName, {
      timestamp: new Date().toISOString(),
      userId,
      inputHash,
      status: 'error',
      duration: Date.now() - startTime
    });
    logAgentAction({ sessionId, agent: agentName, input, result: { error: err.message } });
    stack.pop();
    recordRun(agentName, false, Date.now() - startTime);
    await reportSOP(agentName, {
      goal: metadata.description || '',
      steps: [{ name: 'run', durationMs: Date.now() - startTime }],
      errors: [err.message],
      suggestions: [],
      durationMs: Date.now() - startTime
    });
    throw err;
  }
}

app.use('/admin', (req, res, next) => {
  if (!isAuthorized(req)) return res.status(401).send('Unauthorized');
  next();
});

app.use('/admin', express.static(path.join(__dirname, '..', 'frontend', 'admin')));

// Serve client portal assets
app.use('/client', express.static(path.join(__dirname, '..', 'frontend', 'client')));
// Serve strategy board assets
app.use('/board', express.static(path.join(__dirname, '..', 'frontend', 'board')));

// Serve glossary assets
app.use('/glossary-assets', express.static(path.join(__dirname, '..', 'frontend', 'glossary')));

// Serve generated PDF reports from logs/reports
app.use('/reports', express.static('logs/reports'));

app.get('/logs/sessions', (req, res) => {
  if (!isAuthorized(req)) return res.status(401).json({ error: 'Unauthorized' });
  ensureSessionFiles();
  const { days } = req.query;
  const cutoff = days ? Date.now() - parseInt(days, 10) * 86400000 : null;
  const files = fs.readdirSync(SESSION_LOG_DIR).filter(f => f.endsWith('.json'));
  const sessions = files.map(file => {
    const id = path.basename(file, '.json');
    const entries = JSON.parse(fs.readFileSync(path.join(SESSION_LOG_DIR, file), 'utf8'));
    if (!Array.isArray(entries) || entries.length === 0) return null;
    const first = entries[0];
    const last = entries[entries.length - 1];
    const ts = first.timestamp || '';
    if (cutoff && new Date(ts).getTime() < cutoff) return null;
    const name = first.input?.clientName || first.input?.companyName || first.clientName || '';
    const email = first.input?.email || '';
    const agents = [...new Set(entries.map(e => e.agent).filter(Boolean))];
    const status = last.status || 'unknown';
    return { sessionId: id, name, email, date: ts, agents, status };
  }).filter(Boolean).sort((a, b) => new Date(b.date) - new Date(a.date));
  res.json(sessions);
});

app.get('/logs/sessions/:id', (req, res) => {
  if (!isAuthorized(req)) return res.status(401).send('Unauthorized');
  const file = path.join(SESSION_LOG_DIR, `${req.params.id}.json`);
  if (!fs.existsSync(file)) return res.status(404).json({ error: 'Not found' });
  res.download(file);
});

// Return session log JSON for viewing in the dashboard
app.get('/logs/sessions/:id/json', (req, res) => {
  if (!isAuthorized(req)) return res.status(401).json({ error: 'Unauthorized' });
  const file = path.join(SESSION_LOG_DIR, `${req.params.id}.json`);
  if (!fs.existsSync(file)) return res.status(404).json({ error: 'Not found' });
  try {
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    res.json(data);
  } catch {
    res.status(500).json({ error: 'Failed to read log' });
  }
});

const STAGING_DIR = path.join(__dirname, '..', 'agents', 'staging');

app.post('/submit-agent', upload.single('code'), async (req, res) => {
  if (!isAuthorized(req)) return res.status(401).json({ error: 'Unauthorized' });

  if (!req.body || !req.body.metadata) {
    return res.status(400).json({ error: 'Metadata is required' });
  }

  let metadata;
  try {
    metadata = JSON.parse(req.body.metadata);
  } catch {
    return res.status(400).json({ error: 'Invalid metadata JSON' });
  }

  const required = ['name', 'description', 'version', 'createdBy'];
  const missing = required.filter(f => !metadata[f]);
  if (missing.length) {
    return res.status(400).json({ error: `Missing fields: ${missing.join(', ')}` });
  }

  if (!req.file) return res.status(400).json({ error: 'Zip file is required' });

  try {
    const zip = await JSZip.loadAsync(req.file.buffer);
    const unsafe = [/require\(['"]child_process['"]\)/, /process\.exit/, /fs\.unlink/];
    for (const name of Object.keys(zip.files)) {
      const file = zip.files[name];
      if (file.dir) continue;
      const content = await file.async('string');
      if (unsafe.some(p => p.test(content))) {
        return res.status(400).json({ error: 'Unsafe code detected' });
      }
    }

    // run constitution check
    try {
      require('child_process').execSync('node scripts/constitution-check.js', { stdio: 'ignore' });
    } catch (err) {
      return res.status(400).json({ error: 'Constitution check failed' });
    }

    if (!fs.existsSync(STAGING_DIR)) fs.mkdirSync(STAGING_DIR, { recursive: true });
    const dest = path.join(STAGING_DIR, `${metadata.name}.zip`);
    fs.writeFileSync(dest, req.file.buffer);

    appendAuditLog({
      timestamp: new Date().toISOString(),
      agent: metadata.name,
      action: 'submission',
      status: 'pending review'
    });

    await require('../agents/board-agent').run();
    res.json({ success: true });
  } catch (err) {
    console.error('Agent submission failed:', err);
    res.status(500).json({ error: 'Failed to process submission' });
  }
});

// Endpoint to execute a specific agent
async function handleExecuteAgent(req, res) {
  const { agent: agentName, input = {}, sessionId, step, locale } = req.body || {};

  const uid = await verifyUser(req);
  if (!uid) return res.status(401).json({ error: 'Unauthorized' });
  const orgId = getOrgId(req);
  if (!(await isOrgMember(orgId, uid))) return res.status(403).json({ error: 'forbidden' });
  const plan = await getUserPlan(uid);
  const usage = await getUsageCount(uid);
  if (plan !== 'pro' && usage >= 3) {
    return res.status(403).json({ error: 'limit' });
  }

  if (!agentName) {
    appendLog({
      timestamp: new Date().toISOString(),
      agent: agentName,
      input,
      error: 'Agent name not provided',
    });
    logAgentAction({ sessionId, agent: agentName, input, result: { error: 'Agent name not provided' } });
    return res.status(400).json({ error: 'Agent name not provided' });
  }

  try {
    const results = {};
    let finalResult = await executeAgent(agentName, input, results, [], sessionId, step, orgId, uid);
    if (locale) {
      finalResult = await translateOutput(finalResult, locale);
      results[agentName] = finalResult;
    }
    const response = { result: finalResult, allResults: results };
    res.json(response);
    await recordUsage(uid, sessionId || Date.now().toString(), { stepCount: 1, agentRuns: 1 });
    runLifecycleCheck();
    return;
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

app.post('/run-agent', handleExecuteAgent);
app.post('/executeAgent', handleExecuteAgent);

// Endpoint to email report as PDF attachment
async function handleSendReport(req, res) {
  const { email, report = '', sessionId } = req.body || {};
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const uid = await verifyUser(req);
  if (!uid) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();
    const font = await pdfDoc.embedFont(pdfFonts.Helvetica);
    const { width, height } = page.getSize();
    const fontSize = 12;
    page.drawText(report || 'AI Agent Report', {
      x: 50,
      y: height - 50 - fontSize,
      size: fontSize,
      font,
      maxWidth: width - 100,
    });
    const pdfBuffer = await pdfDoc.save();

    if (sessionId) {
      if (!fs.existsSync(REPORTS_DIR)) {
        fs.mkdirSync(REPORTS_DIR, { recursive: true });
      }
      fs.writeFileSync(path.join(REPORTS_DIR, `${sessionId}.pdf`), pdfBuffer);
    }

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
    await recordUsage(uid, sessionId || Date.now().toString(), { pdfGenerated: 1 });
    runLifecycleCheck();
  } catch (err) {
    console.error('Failed to send report email:', err);
    res.status(500).json({ error: 'Failed to send email' });
  }
}

// Generate PDF report for a session
async function handleGenerateReport(req, res) {
  const { sessionId } = req.params;
  const orgId = getOrgId(req);
  const uid = await verifyUser(req);
  if (!uid) return res.status(401).json({ error: 'Unauthorized' });
  if (!(await isOrgMember(orgId, uid))) return res.status(403).json({ error: 'forbidden' });

  try {
    const doc = await db
      .collection('orgs')
      .doc(orgId)
      .collection('sessions')
      .doc(sessionId)
      .get();
    if (!doc.exists) return res.status(404).json({ error: 'not_found' });
    const data = doc.data() || {};
    const generator = require('./report-generator-agent');
    const { result, error } = await generator.run({ results: data.logs || [], clientName: data.clientName });
    if (error) return res.status(500).json({ error });

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();
    const font = await pdfDoc.embedFont(pdfFonts.Helvetica);
    const { width, height } = page.getSize();
    const fontSize = 12;
    page.drawText(result || 'AI Agent Report', {
      x: 50,
      y: height - 50 - fontSize,
      size: fontSize,
      font,
      maxWidth: width - 100,
    });
    const pdfBuffer = await pdfDoc.save();

    if (!fs.existsSync(REPORTS_DIR)) fs.mkdirSync(REPORTS_DIR, { recursive: true });
    fs.writeFileSync(path.join(REPORTS_DIR, `${sessionId}.pdf`), pdfBuffer);

    res.setHeader('Content-Type', 'application/pdf');
    res.send(pdfBuffer);
    await recordUsage(uid, sessionId, { pdfGenerated: 1 });
    runLifecycleCheck();
  } catch (err) {
    console.error('Failed to generate report:', err);
    res.status(500).json({ error: 'generation_failed' });
  }
}

app.post('/send-report', handleSendReport);
app.get('/generate-report/:sessionId', handleGenerateReport);

app.get('/billing/info', async (req, res) => {
  const uid = await verifyUser(req);
  if (!uid) return res.status(401).json({ error: 'Unauthorized' });
  const plan = await getUserPlan(uid);
  const usage = await getUsageCount(uid);
  res.json({ plan, usage });
});

app.post('/create-checkout-session', async (req, res) => {
  const uid = await verifyUser(req);
  if (!uid) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [
        { price: process.env.STRIPE_PRO_PRICE_ID, quantity: 1 }
      ],
      success_url: process.env.CHECKOUT_SUCCESS_URL || 'https://example.com?success=1',
      cancel_url: process.env.CHECKOUT_CANCEL_URL || 'https://example.com?canceled=1',
      metadata: { uid }
    });
    res.json({ url: session.url });
  } catch (err) {
    console.error('Stripe session error', err);
    res.status(500).json({ error: 'stripe' });
  }
});

app.post('/stripe/webhook', async (req, res) => {
  const event = req.body;
  if (event.type === 'invoice.paid') {
    const uid = event.data.object.metadata?.uid;
    if (uid) {
      await db
        .collection('users')
        .doc(uid)
        .collection('subscription')
        .doc('current')
        .set({ plan: 'pro', status: 'active' }, { merge: true });
    }
  }
  res.json({ received: true });
});

// Send magic login link to client email
app.post('/client/send-link', async (req, res) => {
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ error: 'Email is required' });

  try {
    const token = generateToken(email);
    const link = `${req.protocol}://${req.get('host')}/client/login?token=${token}`;

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
      subject: 'Your secure report link',
      text: `Access your reports here: ${link}`,
    });

    res.json({ success: true });
  } catch (err) {
    console.error('Failed to send login link:', err);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

// Validate token and render portal
app.get('/client/login', (req, res) => {
  const email = validateToken(req.query.token || '');
  if (!email) return res.status(400).send('Invalid or expired link');

  const reports = getReportsForEmail(email);

  res.send(`<!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <title>Client Portal</title>
    <script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin></script>
    <script src="https://unpkg.com/babel-standalone@6/babel.min.js"></script>
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2/dist/tailwind.min.css" rel="stylesheet">
  </head>
  <body class="bg-gray-900">
    <div id="root"></div>
    <script>window.reportLinks = ${JSON.stringify(reports)};</script>
    <script type="text/babel" src="/client/ClientPortal.jsx"></script>
    <script type="text/babel">ReactDOM.render(<ClientPortal reports={window.reportLinks} />, document.getElementById('root'));</script>
  </body>
  </html>`);
});

// Decode share token and redirect to viewer
app.get('/share/:token', (req, res) => {
  try {
    const decoded = Buffer.from(req.params.token, 'base64').toString('utf8');
    return res.redirect(`/viewer?file=${encodeURIComponent(decoded)}`);
  } catch {
    return res.status(400).send('Invalid token');
  }
});

// Public viewer page (read-only)
app.get('/viewer', (req, res) => {
  const file = req.query.file || '';
  if (!file.startsWith('/reports/')) return res.status(400).send('Invalid file');

  res.send(`<!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <title>Shared Report</title>
    <script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin></script>
    <script src="https://unpkg.com/babel-standalone@6/babel.min.js"></script>
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2/dist/tailwind.min.css" rel="stylesheet">
  </head>
  <body class="bg-gray-900">
    <div id="root"></div>
    <script>window.reportUrl = ${JSON.stringify(file)};</script>
    <script type="text/babel" src="/client/PublicViewer.jsx"></script>
    <script type="text/babel">ReactDOM.render(<PublicViewer url={window.reportUrl} />, document.getElementById('root'));</script>
  </body>
  </html>`);
});

// Strategy board dashboard
app.get('/strategy-board', async (req, res) => {
  try {
    const boardAgent = require('../agents/board-agent');
    const data = await boardAgent.run();
    res.send(`<!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Strategy Board</title>
      <script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin></script>
      <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin></script>
      <script src="https://unpkg.com/babel-standalone@6/babel.min.js"></script>
      <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2/dist/tailwind.min.css" rel="stylesheet">
    </head>
    <body class="bg-gray-900">
      <div id="root"></div>
      <script>window.boardData = ${JSON.stringify(data)};</script>
      <script type="text/babel" src="/board/StrategyBoard.jsx"></script>
      <script type="text/babel">ReactDOM.render(<StrategyBoard data={window.boardData} />, document.getElementById('root'));</script>
    </body>
    </html>`);
  } catch (err) {
    res.status(500).send('Failed to render board');
  }
});

// Agent glossary page
app.get('/glossary', (req, res) => {
  const list = Object.entries(agentMetadata).map(([id, meta]) => ({
    id,
    name: meta.name,
    description: meta.description,
    category: meta.category
  }));
  res.send(`<!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <title>Agent Glossary</title>
    <script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin></script>
    <script src="https://unpkg.com/babel-standalone@6/babel.min.js"></script>
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2/dist/tailwind.min.css" rel="stylesheet">
  </head>
  <body class="bg-gray-100">
    <div id="root"></div>
    <script>window.agentData = ${JSON.stringify(list)};</script>
    <script type="text/babel" src="/glossary-assets/Glossary.jsx"></script>
    <script type="text/babel">ReactDOM.render(<Glossary agents={window.agentData} />, document.getElementById('root'));</script>
  </body>
  </html>`);
});

// Return recent audit logs
app.get('/audit', (req, res) => {
  try {
    const limit = parseInt(req.query.limit || '50', 10);
    const logs = readAuditLogs().slice(-limit).reverse();
    res.json(logs);
  } catch {
    res.status(500).json({ error: 'Failed to read audit logs' });
  }
});

// Endpoint to fetch current session status
app.get('/status/:sessionId', async (req, res) => {
  const uid = await verifyUser(req);
  const orgId = getOrgId(req);
  if (!uid) return res.status(401).json({ error: 'Unauthorized' });
  if (!(await isOrgMember(orgId, uid))) return res.status(403).json({ error: 'forbidden' });

  try {
    const doc = await db
      .collection('orgs')
      .doc(orgId)
      .collection('sessions')
      .doc(req.params.sessionId)
      .get();
    const data = doc.exists ? doc.data().status || [] : [];
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch status' });
  }
});

// Endpoint to resume a previous session (status and logs)
app.get('/resume/:sessionId', async (req, res) => {
  const uid = await verifyUser(req);
  const orgId = getOrgId(req);
  if (!uid) return res.status(401).json({ error: 'Unauthorized' });
  if (!(await isOrgMember(orgId, uid))) return res.status(403).json({ error: 'forbidden' });

  try {
    const doc = await db
      .collection('orgs')
      .doc(orgId)
      .collection('sessions')
      .doc(req.params.sessionId)
      .get();
    const data = doc.exists ? doc.data() : {};
    res.json({ status: data.status || [], logs: data.logs || [] });
  } catch {
    res.status(500).json({ error: 'Failed to resume' });
  }
});

// Plugin system - list and register agents
app.get('/registered-agents', async (req, res) => {
  const uid = await verifyUser(req);
  const orgId = getOrgId(req);
  if (!uid) return res.status(401).json({ error: 'Unauthorized' });
  if (!(await isOrgMember(orgId, uid))) return res.status(403).json({ error: 'forbidden' });
  return listRegisteredAgents(orgId, req, res);
});

app.post('/register-agent', async (req, res) => {
  const uid = await verifyUser(req);
  const orgId = getOrgId(req);
  if (!uid) return res.status(401).json({ error: 'Unauthorized' });
  if (!(await isOrgMember(orgId, uid))) return res.status(403).json({ error: 'forbidden' });
  return registerAgent(orgId, req, res);
});

app.post('/add-agent', async (req, res) => {
  try {
    registerAgentFromForm(req.body || {});
    registeredAgents = getRegisteredAgents();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/logs/simulations', async (req, res) => {
  const uid = await verifyUser(req);
  const orgId = getOrgId(req);
  if (!uid) return res.status(401).json({ error: 'Unauthorized' });
  if (!(await isOrgMember(orgId, uid))) return res.status(403).json({ error: 'forbidden' });
  const { timestamp, agents = [], log = [] } = req.body || {};
  if (!timestamp || !Array.isArray(agents) || !Array.isArray(log)) {
    return res.status(400).json({ error: 'invalid payload' });
  }
  try {
    saveSimulationLog(orgId || 'default', timestamp, { agents, log });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'failed to save' });
  }
});

app.post('/logs/simulation-actions/:id', (req, res) => {
  const { id } = req.params;
  const { action } = req.body || {};
  if (!action) return res.status(400).json({ error: 'invalid payload' });
  try {
    appendSimulationAction(id, { timestamp: new Date().toISOString(), action });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'failed to save simulation action' });
  }
});

app.get('/demo-agents', (_req, res) => {
  const list = Object.entries(agentMetadata)
    .filter(([, m]) => m.visibleToDemo)
    .map(([id, m]) => ({ id, name: m.name, description: m.description }));
  res.json(list);
});

app.post('/logs/demo-sessions', (req, res) => {
  const { workflow = '', inputs = {} } = req.body || {};
  if (!workflow) return res.status(400).json({ error: 'workflow required' });
  try {
    saveDemoSession({ workflow, inputs, timestamp: new Date().toISOString() });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'failed to save' });
  }
});

    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'failed to save' });
  }
});

// General logs
app.get('/logs', (_req, res) => {
  res.json(readLogs());
});

app.post('/logs', (req, res) => {
  const entry = req.body || {};
  appendLog({ ...entry, timestamp: new Date().toISOString() });
  res.json({ success: true });
});

// Welcome page log
app.post('/welcome-log', (req, res) => {
  const { referrer = '', userAgent = '' } = req.body || {};
  appendWelcomeLog({ id: uuidv4(), referrer, userAgent, timestamp: new Date().toISOString() });
  res.json({ success: true });
});

// Feedback submission
app.post('/feedback', (req, res) => {
  const { type = 'general', message = '', sessionId = '' } = req.body || {};
  if (!message) return res.status(400).json({ error: 'message required' });
  appendFeedback({ id: uuidv4(), type, message, sessionId, timestamp: new Date().toISOString() });
  res.json({ success: true });
});

// Analytics events
app.get('/analytics', (_req, res) => {
  res.json(readAnalytics());
});

app.post('/analytics', (req, res) => {
  const { event = '', data = {} } = req.body || {};
  if (!event) return res.status(400).json({ error: 'event required' });
  appendAnalytics({ id: uuidv4(), event, data, timestamp: new Date().toISOString() });
  res.json({ success: true });
});

// Simulation actions
app.get('/simulation-actions/:id', (req, res) => {
  res.json(readSimulationActions(req.params.id));
});

app.post('/simulation-actions/:id', (req, res) => {
  const { action = '' } = req.body || {};
  if (!action) return res.status(400).json({ error: 'action required' });
  appendSimulationAction(req.params.id, { id: uuidv4(), action, timestamp: new Date().toISOString() });
  res.json({ success: true });
});

// Next steps data
app.get('/next-steps/:id', (req, res) => {
  res.json(readNextSteps(req.params.id));
});

app.post('/next-steps/:id', (req, res) => {
  saveNextSteps(req.params.id, req.body || {});
  res.json({ success: true });
});

// Generate share token for a URL
app.post('/share', (req, res) => {
  const { url } = req.body || {};
  if (!url) return res.status(400).json({ error:

// LibreTranslate - available languages
app.get('/locales', async (req, res) => {
  try {
    const resp = await fetch(`${LT_URL}/languages`);
    const data = await resp.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch locales' });
  }
});

// LibreTranslate - detect language
app.post('/detect-language', async (req, res) => {
  const { text } = req.body || {};
  if (!text) return res.status(400).json({ error: 'text is required' });
  try {
    const resp = await fetch(`${LT_URL}/detect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: text, api_key: LT_KEY }),
    });
    const data = await resp.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Language detection failed' });
  }
});

// LibreTranslate - translate text
async function handleTranslate(req, res) {
  const { text, target, source } = req.body || {};
  if (!text || !target) {
    return res.status(400).json({ error: 'text and target are required' });
  }
  try {
    const resp = await fetch(`${LT_URL}/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: text, target, source, api_key: LT_KEY }),
    });
    const data = await resp.json();
    res.json(data);
    runLifecycleCheck();
  } catch (err) {
    res.status(500).json({ error: 'Translation failed' });
  }
}

app.post('/translate', handleTranslate);

app.get('/report', (req, res) => {
  const logs = readLogs();
  res.json(logs);
  runLifecycleCheck();
});

// Health check summary
app.get('/health-check', async (req, res) => {
  try {
    const summary = await runHealthChecks();
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: 'Health check failed' });
  }
});

const { functions } = require('../firebase');

module.exports.app = functions.https.onRequest(app);

exports.runGuardian = functions.https.onCall(async (data) => {
  const agent = require('../agents/guardian-agent');
  return await agent.run(data);
});

exports.boardAgent = functions.https.onCall(async (data) => {
  const agent = require('../agents/board-agent');
  return await agent.run(data);
});

exports.evaluateLifecycle = functions.https.onCall(async () => {
  const { evaluate } = require('../scripts/evaluate-lifecycle');
  return await evaluate();
});

exports.constitutionCheck = functions.https.onCall(async () => {
  require('../scripts/constitution-check');
  return { result: 'done' };
});

exports.translate = functions.https.onRequest(handleTranslate);
exports.report = functions.https.onRequest((req, res) => {
  const logs = readLogs();
  res.json(logs);
  runLifecycleCheck();
});
exports.executeAgent = functions.https.onRequest(handleExecuteAgent);
