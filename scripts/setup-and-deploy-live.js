#!/usr/bin/env node
console.log("\ud83d\ude80 Live deploy script initialized");

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
  const retries = opts.retries || 0;
  for (let attempt = 0; ; attempt++) {
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
  runStep('Install Firebase CLI', 'npm install -g firebase-tools', { retries: 1 });
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

const rootDir = path.resolve(__dirname, '..');
process.chdir(rootDir);

async function main() {
  log(color.magenta, '\n🚀 Live Setup & Deployment Pipeline');

  await ensureFirebaseCLI();

  if (!isLoggedIn()) {
    runStep('Firebase login', 'firebase login');
  }

  runStep('Firebase setup', 'npm run setup:firebase', { retryAuth: true, retries: 1 });
  runStep('Deploy dashboard', 'npm run deploy:dashboard', { retryAuth: true, retries: 1 });
  const deployOutput = runStep('Firebase deploy', 'npm run deploy', {
    capture: true,
    retryAuth: true,
    retries: 1,
  });
  const hostingMatch = deployOutput.match(/Hosting URL[:\s]+(https?:\/\/[^\s]+)/i);
  const url = hostingMatch ? hostingMatch[1] : (deployOutput.match(/https?:\/\/[^\s]+/) || [])[0];
  if (url) {
    openUrl(url);
  }

  log(color.green, '\n🎉 Deployment process finished!');
}

main().catch(() => {
  log(color.red, '\n🔥 Setup & deployment process terminated due to errors.');
  process.exit(1);
});
