const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 8080;

const distDir = path.join(__dirname, 'frontend', 'dist');
app.use(express.static(distDir));
app.use(express.json());

const LOG_FILE = path.join(__dirname, 'logs', 'welcome-log.json');

function appendLog(entry) {
  if (!fs.existsSync(LOG_FILE)) {
    fs.writeFileSync(LOG_FILE, '[]', 'utf8');
  }
  let data = [];
  try {
    data = JSON.parse(fs.readFileSync(LOG_FILE, 'utf8'));
    if (!Array.isArray(data)) data = [];
  } catch {
    data = [];
  }
  data.push({ ...entry, timestamp: new Date().toISOString() });
  fs.writeFileSync(LOG_FILE, JSON.stringify(data, null, 2));
}

// Health check endpoint for Cloud Run
app.get('/healthz', (_req, res) => {
  res.status(200).send('OK');
});

app.post('/welcome-log', (req, res) => {
  appendLog(req.body || {});
  res.json({ status: 'ok' });
});

// Serve the frontend entry for any route not matched by static assets
app.get(/.*/, (_req, res) => {
  res.sendFile(path.join(distDir, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
