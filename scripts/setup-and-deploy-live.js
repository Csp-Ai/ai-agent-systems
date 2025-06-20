#!/usr/bin/env node
console.log("\ud83d\ude80 Live deploy script initialized");

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const clipboardy = require('clipboardy');

const color = {
  red: text => `\x1b[31m${text}\x1b[0m`,
  green: text => `\x1b[32m${text}\x1b[0m`,
  yellow: text => `\x1b[33m${text}\x1b[0m`,
  cyan: text => `\x1b[36m${text}\x1b[0m`,
  magenta: text => `\x1b[35m${text}\x1b[0m`,
};

const rootDir = path.resolve(__dirname, '..');
process.chdir(rootDir);

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

function openUrl(url) {
  try {
    log(color.green, `\n🌐 Deployed site: ${url}`);
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

function ensureHostingDir() {
  const configPath = path.join(rootDir, 'firebase.json');
  const expected = 'public/dashboard';
  const data = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  if (data.hosting?.public !== expected) {
    log(color.yellow, `⚠️  Updating firebase.json hosting public directory to ${expected}`);
    if (!data.hosting) data.hosting = {};
    data.hosting.public = expected;
    fs.writeFileSync(configPath, JSON.stringify(data, null, 2));
  }
  return data.hosting.public;
}

function isRepoClean() {
  try {
    return exec('git status --porcelain', { capture: true }).trim() === '';
  } catch {
    return false;
  }
}

function formatTag(date) {
  const pad = n => n.toString().padStart(2, '0');
  return `v${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}`;
}

function tagAndPush(date) {
  const tag = formatTag(date);
  try {
    exec(`git tag ${tag}`);
    exec(`git push origin ${tag}`);
    log(color.green, `Git tag ${tag} pushed to origin.`);
  } catch (err) {
    log(color.red, `❌ Failed to push git tag ${tag}`);
    if (err.stdout) process.stdout.write(err.stdout.toString());
    if (err.stderr) process.stderr.write(err.stderr.toString());
  }
}

async function main() {
  log(color.magenta, '\n🚀 Live Setup & Deployment Pipeline');

  await ensureFirebaseCLI();

  if (!isLoggedIn()) {
    runStep('Firebase login', 'firebase login', { retries: 2 });
  }

  const hostingDir = ensureHostingDir();

  runStep('Firebase setup', 'npm run setup:firebase', { retryAuth: true, retries: 2 });
  const buildOutput = runStep('Deploy dashboard', 'npm run deploy:dashboard', {
    capture: true,
    retryAuth: true,
    retries: 2,
  });

  const sizeRegex = /public\/dashboard\/[^\s]+\s+\d+\.\d+ kB.*$/gm;
  const sizeLines = (buildOutput.match(sizeRegex) || []).map(l => l.trim());
  const deployOutput = runStep('Firebase deploy', 'npm run deploy', {
    capture: true,
    retryAuth: true,
    retries: 2,
  });
  const hostingMatch = deployOutput.match(/Hosting URL[:\s]+(https?:\/\/[^\s]+)/i);
  const url = hostingMatch ? hostingMatch[1] : (deployOutput.match(/https?:\/\/[^\s]+/) || [])[0];
  if (url) {
    openUrl(url);
    try {
      clipboardy.writeSync(url);
      log(color.cyan, '📋 Hosting URL copied to clipboard.');
    } catch {
      log(color.yellow, '⚠️  Failed to copy URL to clipboard.');
    }
  }

  const date = new Date();
  const timestamp = date.toISOString();
  if (sizeLines.length) {
    log(color.cyan, '\nDeployed file sizes:\n' + sizeLines.join('\n'));
  }
  log(color.green, `\n✅ Deployment finished at ${timestamp}`);
  if (url) {
    log(color.green, `URL: ${url}`);
  }
  log(color.green, `Directory used: ${hostingDir}`);

  if (isRepoClean()) {
    tagAndPush(date);
  } else {
    log(color.yellow, '⚠️  Repository has uncommitted changes; skipping git tag.');
  }
}

main().catch(() => {
  log(color.red, '\n🔥 Setup & deployment process terminated due to errors.');
  process.exit(1);
});
