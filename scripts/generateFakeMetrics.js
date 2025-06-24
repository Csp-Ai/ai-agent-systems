const fs = require('fs');
const path = require('path');

const logPath = path.join(__dirname, '../public/logs/learning.log');

const agents = ['alpha', 'beta', 'gamma'];
const metrics = ['latency', 'accuracy'];

function getRandomValue(metric) {
  return metric === 'latency'
    ? Math.floor(Math.random() * 700 + 100)
    : Math.random().toFixed(2);
}

function logSampleData() {
  const metric = metrics[Math.floor(Math.random() * metrics.length)];
  const agent = agents[Math.floor(Math.random() * agents.length)];
  const value = getRandomValue(metric);

  const logEntry = JSON.stringify({
    agent,
    metric,
    value: parseFloat(value),
    timestamp: new Date().toISOString(),
  });

  fs.appendFileSync(logPath, logEntry + '\n');
  console.log('Wrote:', logEntry);
}

setInterval(logSampleData, 3000); // every 3s
