#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

const color = {
  red: text => `\x1b[31m${text}\x1b[0m`,
  green: text => `\x1b[32m${text}\x1b[0m`,
  yellow: text => `\x1b[33m${text}\x1b[0m`,
  cyan: text => `\x1b[36m${text}\x1b[0m`,
  magenta: text => `\x1b[35m${text}\x1b[0m`,
};

function log(colorFn, message) {
  console.log(colorFn(message));
}

function run(cmd, description) {
  try {
    log(color.cyan, `\n🛠  ${description}...`);
    execSync(cmd, { stdio: 'inherit' });
  } catch (err) {
    log(color.red, `❌ Failed to ${description.toLowerCase()}.`);
    if (/init|login/i.test(description)) {
      log(color.yellow, '➡ Ensure you have access to the Firebase project and are logged in with the correct account.');
    }
    process.exit(1);
  }
}

function hasFirebaseCLI() {
  try {
    execSync('firebase --version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

// Ensure we run from repo root
const repoRoot = path.resolve(__dirname, '..');
process.chdir(repoRoot);

log(color.magenta, '\n📦 Firebase Setup Utility\n');

if (!hasFirebaseCLI()) {
  log(color.red, '❌ Firebase CLI not found.');
  log(color.yellow, '➡ Run this command to install it globally:\n   npm install -g firebase-tools');
  process.exit(1);
}

run('firebase login', 'Authenticate with Firebase');
run('firebase init hosting', 'Initialize Firebase Hosting');

log(color.green, '\n✅ Firebase project setup complete!\n');
