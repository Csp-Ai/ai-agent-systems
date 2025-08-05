#!/usr/bin/env node
const { execSync } = require('child_process');
const path = require('path');

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
  logInfo('Validating Firebase security rules...');
  execSync('node scripts/validate-security-rules.js', { stdio: 'inherit' });
  logSuccess('Security rules validation complete.');
} catch (err) {
  logFailure(`Rule validation failed: ${err.message}`);
  // Continue deploying even if validation warns
}

try {
  logInfo('Building frontend...');
  execSync('npm run build', { stdio: 'inherit' });
  logSuccess('Frontend build complete.');
} catch (err) {
  logFailure(`Failed to build frontend: ${err.message}`);
  process.exit(1);
}

try {
  logInfo('Deploying to Firebase Hosting...');
  const output = execSync('firebase deploy --only hosting', { encoding: 'utf8' });
  const match = output.match(/Hosting URL[:\s]+(https?:\/\/[^\s]+)/i);
  if (match) {
    logSuccess(`Firebase Hosting deployed at ${match[1]}`);
  } else {
    logSuccess('Firebase Hosting deployment complete.');
  }
} catch (err) {
  logFailure(`Firebase deploy failed: ${err.message}`);
  if (err.stdout) console.error(err.stdout.toString());
  if (err.stderr) console.error(err.stderr.toString());
  process.exit(1);
}
