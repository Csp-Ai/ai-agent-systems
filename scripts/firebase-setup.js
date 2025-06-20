const { execSync } = require('child_process');
const fs = require('fs');
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

function ensureRepoRoot() {
  const rootDir = path.resolve(__dirname, '..');
  if (process.cwd() !== rootDir) {
    logInfo(`Switching to repository root: ${rootDir}`);
    process.chdir(rootDir);
  }
}

function checkFirebaseCli() {
  try {
    execSync('firebase --version', { stdio: 'inherit' });
    logSuccess('Firebase CLI detected');
  } catch {
    logFailure('Firebase CLI not installed. Install via `npm install -g firebase-tools`');
    process.exit(1);
  }
}

function checkFirebaseLogin() {
  try {
    const out = execSync('firebase login:list', { encoding: 'utf8' });
    if (out.includes('No authorized')) {
      logFailure('No Firebase account logged in. Run `firebase login` and retry.');
      process.exit(1);
    }
    logSuccess('Firebase account authenticated');
  } catch (err) {
    logFailure(`Failed to check login status: ${err.message}`);
    process.exit(1);
  }
}

function ensureProjectId() {
  const rcPath = path.join(process.cwd(), '.firebaserc');
  if (!fs.existsSync(rcPath)) {
    logFailure('.firebaserc not found. Run `firebase use --add` to select your project.');
    process.exit(1);
  }
  try {
    const config = JSON.parse(fs.readFileSync(rcPath, 'utf8'));
    const id = config.projects && config.projects.default;
    if (!id) {
      throw new Error('Default project ID missing');
    }
    logSuccess(`Using Firebase project: ${id}`);
  } catch (err) {
    logFailure(`Error parsing .firebaserc: ${err.message}`);
    process.exit(1);
  }
}

function initHosting() {
  try {
    execSync('firebase init hosting', { stdio: 'inherit' });
    logSuccess('Firebase hosting initialized');
  } catch (err) {
    logFailure('`firebase init hosting` failed.');
    console.log('\nIf you encounter permission or project ID errors:');
    console.log('- Confirm you have Owner or Editor access in the Firebase Console.');
    console.log('- Visit https://console.firebase.google.com and add the project manually if needed.');
    console.log('- Use `firebase use --add` to link the correct project ID if already created remotely.');
    process.exit(1);
  }
}

function main() {
  ensureRepoRoot();
  checkFirebaseCli();
  checkFirebaseLogin();
  ensureProjectId();
  initHosting();
}

main();
