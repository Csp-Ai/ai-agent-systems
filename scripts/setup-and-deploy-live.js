#!/usr/bin/env node
console.log("\ud83d\ude80 Live deploy script initialized");

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
process.chdir(rootDir);

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
  const retries = opts.retries ?? 2;
  for (let attempt = 0; ; attempt++) {
    try {
      log(color.yellow, `\n➡ ${description}...`);
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
        } catch (loginErr) {
          log(color.red, '❌ Firebase login failed.');
          if (loginErr.stdout) process.stdout.write(loginErr.stdout.toString());
          if (loginErr.stderr) process.stderr.write(loginErr.stderr.toString());
        }
      }

      if (attempt < retries) {
        log(color.yellow, `➡ Retrying ${description.toLowerCase()} (${attempt + 1}/${retries})...`);
      } else {
        throw err;
      }
    }
  }
}

function hasFirebaseCLI() {
  try {
    exec('firebase --version', { capture: true });
    return true;
  } catch {
    return false;
  }
}

function isLoggedIn() {
  try {
    const output = exec('firebase login:list', { capture: true });
    return !/No authorized|not (currently )?logged in/i.test(output);
  } catch {
    return false;
  }
}

async function ensureFirebaseCLI() {
  if (hasFirebaseCLI()) return;
  log(color.yellow, 'Firebase CLI not found. Installing...');
  runStep('Install Firebase CLI', 'npm install -g firebase-tools', { retries: 2 });
}

function ensureHostingPath() {
  const firebasePath = path.join(rootDir, 'firebase.json');
  if (!fs.existsSync(firebasePath)) return;
  try {
    const config = JSON.parse(fs.readFileSync(firebasePath, 'utf8'));
    const current = config.hosting && config.hosting.public;
    if (current !== 'public/dashboard') {
      log(color.yellow, `⚠️  Hosting path mismatch: ${current} → public/dashboard`);
      config.hosting = config.hosting || {};
      const before = current || 'undefined';
      config.hosting.public = 'public/dashboard';
      fs.writeFileSync(firebasePath, JSON.stringify(config, null, 2));
      log(color.yellow, `Updated hosting path: ${before} → ${config.hosting.public}`);
    }
  } catch {
    log(color.red, '❌ Failed to verify firebase.json');
  }
}

function copyToClipboard(text) {
  try {
    if (process.platform === 'darwin') {
      execSync(`printf "${text}" | pbcopy`);
    } else if (process.platform === 'win32') {
      execSync(`echo ${text} | clip`, { shell: 'cmd.exe' });
    }
    log(color.green, '📋 URL copied to clipboard.');
  } catch {
    log(color.yellow, '⚠️  Failed to copy URL to clipboard.');
  }
}

function parseViteOutput(output) {
  const files = [];
  const gzipSizes = {};
  let duration = null;
  const lines = output.split(/\r?\n/);
  for (const line of lines) {
    const durMatch = line.match(/Built(?: completed)?(?: in)?\s*([0-9.]+\w+)/i);
    if (durMatch) duration = durMatch[1];
    const fileMatch = line.trim().match(/([^\s]+\.(?:js|css|html))\s+([0-9.]+\s*\wB)(?:.*gzip:\s*([0-9.]+\s*\wB))?/);
    if (fileMatch) {
      const name = fileMatch[1];
      files.push(name);
      if (fileMatch[3]) gzipSizes[name] = fileMatch[3];
    }
  }
  return { duration, files, gzipSizes };
}

function openUrl(url) {
  try {
    log(color.green, `\n🌐 View Live: ${url}`);
    copyToClipboard(url);
    log(color.cyan, `➡ Opening ${url}`);
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

async function main() {
  log(color.magenta, '\n🚀 Live Setup & Deployment Pipeline');

  await ensureFirebaseCLI();

  ensureHostingPath();

  if (!isLoggedIn()) {
    runStep('Firebase login', 'firebase login', { retries: 2 });
  }

  runStep('Firebase setup', 'npm run setup:firebase', { retryAuth: true, retries: 2 });
  const dashboardOutput = runStep('Deploy dashboard', 'npm run deploy:dashboard', {
    retryAuth: true,
    retries: 2,
    capture: true,
  });
  const buildInfo = parseViteOutput(dashboardOutput);
  if (buildInfo.files.length) {
    log(color.cyan, '\n📦 Vite Build Summary');
    log(color.cyan, `   Duration: ${buildInfo.duration || 'unknown'}`);
    buildInfo.files.forEach(f => {
      const size = buildInfo.gzipSizes[f];
      log(color.cyan, `   ${f}${size ? ` - gzip: ${size}` : ''}`);
    });
  }
  const deployOutput = runStep('Firebase deploy', 'npm run deploy', {
    capture: true,
    retryAuth: true,
    retries: 2,
  });
  const hostingMatch = deployOutput.match(/Hosting URL[:\s]+(https?:\/\/[^\s]+)/i);
  const url = hostingMatch ? hostingMatch[1] : (deployOutput.match(/https?:\/\/[^\s]+/) || [])[0];
  if (url) {
    openUrl(url);
  }

  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    url,
    files: buildInfo.files,
    gzipSizes: buildInfo.gzipSizes,
  };
  const logPath = path.join(rootDir, 'deployment-log.json');
  let logData = [];
  if (fs.existsSync(logPath)) {
    try { logData = JSON.parse(fs.readFileSync(logPath, 'utf8')); } catch {}
  }
  logData.push(logEntry);
  fs.writeFileSync(logPath, JSON.stringify(logData, null, 2));

  if (fs.existsSync(path.join(rootDir, '.git'))) {
    try {
      exec('git add -A');
      exec(`git commit -m "chore: deployed ${timestamp}"`);
      const tag = `deploy-${timestamp.replace(/[-:]/g, '').slice(0,13)}`;
      exec(`git tag ${tag}`);
      log(color.green, `Git commit and tag ${tag} created.`);
    } catch {
      log(color.yellow, '⚠️  Git commit or tag failed.');
    }
  }

  log(color.green, `\n✅ Deployment completed at ${timestamp}`);
}

main().catch(() => {
  log(color.red, '\n🔥 Setup & deployment process terminated due to errors.');
  process.exit(1);
});
