const express = require('express');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

const agentMetadata = require('./agents/agent-metadata.json');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.send('AI Agent Systems API running');
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/api/summary', (req, res) => {
  const deployLog = path.join(__dirname, 'logs', 'deployments.json');
  const qaLog = path.join(__dirname, 'logs', 'qa-results.json');
  let deployment = null;
  let qa = null;

  try {
    if (fs.existsSync(deployLog)) {
      const data = JSON.parse(fs.readFileSync(deployLog, 'utf8'));
      deployment = data[data.length - 1] || null;
    }
    if (fs.existsSync(qaLog)) {
      const data = JSON.parse(fs.readFileSync(qaLog, 'utf8'));
      qa = data[data.length - 1] || null;
    }
  } catch (err) {
    console.error('Failed to load summary data', err);
  }

  res.json({ deployment, agents: agentMetadata, qa });
});

app.post('/api/run-postdeploy', (req, res) => {
  exec('npm run postdeploy:all', { cwd: __dirname }, err => {
    if (err) {
      console.error('Postdeploy failed:', err.message);
      return res.status(500).json({ error: 'Postdeploy failed' });
    }
    res.json({ success: true });
  });
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
