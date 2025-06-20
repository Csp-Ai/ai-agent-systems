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

function run(command, description, opts = {}) {
  try {
    log(color.cyan, `\n➡ ${description}...`);
    const result = execSync(command, { stdio: opts.capture ? 'pipe' : 'inherit', encoding: 'utf8', cwd: opts.cwd });
    if (opts.capture) process.stdout.write(result);
    log(color.green, `✅ ${description} complete.`);
    return result;
  } catch (err) {
    log(color.red, `❌ ${description} failed.`);
    if (err.stdout) process.stdout.write(err.stdout.toString());
    if (err.stderr) process.stderr.write(err.stderr.toString());
    process.exit(1);
  }
}

function openUrl(url) {
  try {
    log(color.cyan, `\n➡ Opening ${url}`);
    if (process.platform === 'win32') {
      execSync(`start ${url}`, { shell: 'cmd.exe' });
    } else if (process.platform === 'darwin') {
      execSync(`open ${url}`);
    } else {
      execSync(`xdg-open ${url}`);
    }
    log(color.green, '✅ Browser opened.');
  } catch {
    log(color.yellow, '⚠️  Failed to open browser automatically.');
  }
}

// Ensure we run from repository root
const rootDir = path.resolve(__dirname, '..');
process.chdir(rootDir);

log(color.magenta, '\n🚀 Live Setup & Deployment Pipeline');

run('node scripts/firebase-setup.js', 'Firebase setup');
run('npm --prefix dashboard run build', 'Building dashboard with Vite');

const deployOutput = run('firebase deploy --only hosting', 'Deploying to Firebase Hosting', { capture: true });
const match = deployOutput.match(/https?:\/\/[^\s]+/);
if (match) {
  openUrl(match[0]);
}

log(color.green, '\n🎉 Deployment process finished!');
