#!/usr/bin/env node

const { execSync } = require('child_process');

function run(cmd, description) {
  try {
    console.log(`\n🛠  ${description}...`);
    execSync(cmd, { stdio: 'inherit' });
  } catch (err) {
    console.error(`❌ Failed to ${description.toLowerCase()}.`);
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

console.log(`\n📦 Firebase Setup Utility\n`);

if (!hasFirebaseCLI()) {
  console.error(`❌ Firebase CLI not found.`);
  console.log(`➡ Run this command to install it globally:\n   npm install -g firebase-tools`);
  process.exit(1);
}

run('firebase login', 'Authenticate with Firebase');
run('firebase init hosting', 'Initialize Firebase Hosting');
console.log(`\n✅ Firebase project setup complete!\n`);
