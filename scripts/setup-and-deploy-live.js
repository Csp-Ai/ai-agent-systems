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

function run(command, description) {
  try {
    log(color.cyan, `\n➡ ${description}...`);
    execSync(command, { stdio: 'inherit' });
    log(color.green, `✅ ${description} complete.`);
  } catch (err) {
    log(color.red, `❌ ${description} failed.`);
    process.exit(1);
  }
}

// Ensure we run from repository root
const rootDir = path.resolve(__dirname, '..');
process.chdir(rootDir);

log(color.magenta, '\n🚀 Full Live Setup & Deployment\n');

run('node scripts/firebase-setup.js', 'Firebase setup');
run('node scripts/deploy-dashboard.js', 'Dashboard build');
run('firebase deploy --only hosting', 'Firebase Hosting deploy');
run('firebase open hosting:site', 'Opening live site');

log(color.green, '\n🎉 Live site should now be open!\n');
