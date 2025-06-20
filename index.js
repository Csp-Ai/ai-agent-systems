const express = require('express');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const app = express();

const PORT = process.env.PORT || 8080;

// Serve the compiled landing page assets
const frontendDir = path.join(__dirname, 'frontend', 'dist');
app.use(express.static(frontendDir));

// Governance dashboard assets built from /dashboard
const dashboardDir = path.join(__dirname, 'public', 'dashboard');
app.use('/dashboard', express.static(dashboardDir));
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(dashboardDir, 'index.html'));
});
app.get('/dashboard/*', (req, res) => {
  res.sendFile(path.join(dashboardDir, 'index.html'));
});

// Basic liveness probe used by Cloud Run and CI health checks
const healthHandler = (req, res) => {
  res.json({ status: 'ok' });
};
app.get('/health-check', healthHandler);
app.get('/health', healthHandler);

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

// Landing page served for the root and unmatched routes
app.get('/', (req, res) => {
  res.sendFile(path.join(frontendDir, 'index.html'));
});

app.get('*', (req, res) => {
  res.sendFile(path.join(frontendDir, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
