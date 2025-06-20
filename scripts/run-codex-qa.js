#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const agent = require('../agents/codex-qa-agent');

(async () => {
  const url = process.env.CLOUD_RUN_URL || process.argv[2] || 'http://localhost:8080';
  try {
    const result = await agent.run({ url });
    const logPath = path.join(__dirname, '..', 'logs', 'qa-results.json');
    let data = [];
    if (fs.existsSync(logPath)) {
      try {
        data = JSON.parse(fs.readFileSync(logPath, 'utf8'));
      } catch {}
    }
    data.push({ timestamp: new Date().toISOString(), result });
    fs.mkdirSync(path.dirname(logPath), { recursive: true });
    fs.writeFileSync(logPath, JSON.stringify(data, null, 2));
    console.log(JSON.stringify(result, null, 2));
    if (!result.success) process.exit(1);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
