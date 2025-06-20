#!/usr/bin/env node
const { execSync } = require('child_process');
const path = require('path');
const { logDeployment } = require('./deploymentLogger');

function logSuccess(msg) {
  console.log(`\x1b[32m✅ ${msg}\x1b[0m`);
}

function logFailure(msg) {
  console.error(`\x1b[31m❌ ${msg}\x1b[0m`);
}

function logInfo(msg) {
  console.log(`\x1b[34mℹ️  ${msg}\x1b[0m`);
}

// Ensure script runs from repository root
const rootDir = path.resolve(__dirname, '..');
if (process.cwd() !== rootDir) {
  logInfo(`Switching to repository root: ${rootDir}`);
  process.chdir(rootDir);
}

try {
  logInfo('Building and copying dashboard...');
  execSync('node scripts/deploy-dashboard.js', { stdio: 'inherit' });
  logSuccess('Dashboard build step complete.');
} catch (err) {
  logFailure(`Failed to deploy dashboard: ${err.message}`);
  logDeployment({ timestamp: new Date().toISOString(), success: false, error: err.message });
  process.exit(1);
}

try {
  logInfo('Deploying to Firebase Hosting...');
  const output = execSync('firebase deploy --only hosting', { encoding: 'utf8' });
  const match = output.match(/Hosting URL[:\s]+(https?:\/\/[^\s]+)/i);
  if (match) {
    logSuccess(`Firebase Hosting deployed at ${match[1]}`);
    logDeployment({ timestamp: new Date().toISOString(), success: true, url: match[1] });
  } else {
    logSuccess('Firebase Hosting deployment complete.');
    logDeployment({ timestamp: new Date().toISOString(), success: true });
  }
} catch (err) {
  logFailure(`Firebase deploy failed: ${err.message}`);
  if (err.stdout) console.error(err.stdout.toString());
  if (err.stderr) console.error(err.stderr.toString());
  logDeployment({ timestamp: new Date().toISOString(), success: false, error: err.message });
  process.exit(1);
}
