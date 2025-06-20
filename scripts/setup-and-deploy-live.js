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

function exec(command, opts = {}) {
  return execSync(command, {
    stdio: opts.capture ? 'pipe' : 'inherit',
    encoding: 'utf8',
    cwd: opts.cwd,
  });
}

function runStep(description, command, opts = {}) {
  try {
    log(color.cyan, `\n➡ ${description}...`);
    const result = exec(command, opts);
    if (opts.capture) process.stdout.write(result);
    log(color.green, `✅ ${description} complete.`);
    return result;
  } catch (err) {
    log(color.red, `❌ ${description} failed.`);
    if (err.stdout) process.stdout.write(err.stdout.toString());
    if (err.stderr) process.stderr.write(err.stderr.toString());

    if (opts.retryAuth) {
      try {
        log(color.yellow, '➡ Attempting Firebase login...');
        exec('firebase login', { stdio: 'inherit' });
        log(color.green, '✅ Firebase login successful.');
        log(color.cyan, `Retrying ${description.toLowerCase()}...`);
        const retryResult = exec(command, opts);
        if (opts.capture) process.stdout.write(retryResult);
        log(color.green, `✅ ${description} complete.`);
        return retryResult;
      } catch (loginErr) {
        log(color.red, '❌ Firebase login failed.');
        if (loginErr.stdout) process.stdout.write(loginErr.stdout.toString());
        if (loginErr.stderr) process.stderr.write(loginErr.stderr.toString());
      }
    }

    throw err;
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

try {
  runStep('Firebase setup', 'npm run setup:firebase', { retryAuth: true });
  runStep('Building dashboard with Vite', 'npm --prefix dashboard run build');
  const deployOutput = runStep(
    'Deploying to Firebase Hosting',
    'firebase deploy --only hosting',
    { capture: true, retryAuth: true }
  );
  const match = deployOutput.match(/https?:\/\/[^\s]+/);
  if (match) {
    openUrl(match[0]);
  }
  log(color.green, '\n🎉 Deployment process finished!');
} catch {
  log(color.red, '\n🔥 Setup & deployment process terminated due to errors.');
  process.exit(1);
}
