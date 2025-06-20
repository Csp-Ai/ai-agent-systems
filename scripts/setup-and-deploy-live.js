#!/usr/bin/env node

const { execSync } = require('child_process');

function run(command, banner) {
  console.log(`\n${banner}`);
  execSync(command, { stdio: 'inherit' });
}

try {
  run('npm run setup:firebase', '🔥 Setting up Firebase');
  run('npm run deploy:dashboard', '📦 Building and staging dashboard');
  run('npm run deploy', '🚀 Deploying to Firebase Hosting');
} catch (err) {
  process.exitCode = 1;
}
