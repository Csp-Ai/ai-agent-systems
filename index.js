const express = require('express');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const app = express();

const PORT = process.env.PORT || 8080;

const staticDir = path.join(__dirname, 'frontend', 'dist');
app.use(express.static(staticDir));

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const SUMMARY_FILE = path.join(__dirname, 'logs', 'summary.json');

function loadSummary() {
  try {
    return JSON.parse(fs.readFileSync(SUMMARY_FILE, 'utf8'));
  } catch {
    return null;
  }
}

app.get('/api/summary', (req, res) => {
  const data = loadSummary();
  if (!data) {
    return res.status(503).json({ error: 'Summary unavailable' });
  }
  res.json(data);
});

app.post('/api/refresh', (req, res) => {
  exec('npm run postdeploy:all', { cwd: __dirname }, () => {
    const data = loadSummary();
    if (!data) {
      return res.status(503).json({ error: 'Summary unavailable' });
    }
    res.json(data);
  });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(staticDir, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
