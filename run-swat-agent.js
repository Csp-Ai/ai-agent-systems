#!/usr/bin/env node

const fs = require('fs');
const { execSync } = require('child_process');
const chalk = require('chalk');

// Ensure dotenv is installed
let pkg;
try {
  pkg = require('./package.json');
} catch (_) {
  pkg = { dependencies: {} };
}
if (!((pkg.dependencies && pkg.dependencies.dotenv) || (pkg.devDependencies && pkg.devDependencies.dotenv))) {
  console.log('Installing dotenv...');
  try {
    execSync('npm install dotenv', { stdio: 'inherit' });
  } catch (err) {
    console.error('Failed to install dotenv:', err.message);
  }
}

require('dotenv').config();

(async () => {
  try {
    const { run } = require('./core/agent-runner.js');
    const vercelConfig = JSON.parse(fs.readFileSync('./vercel.json', 'utf8'));

    const args = process.argv.slice(2);
    let sessionId = process.env.SESSION_ID || 'dev-session';
    const envOverrides = {};
    for (const arg of args) {
      if (arg.startsWith('--session=')) {
        sessionId = arg.slice('--session='.length);
      } else if (arg.startsWith('--env=')) {
        const pair = arg.slice('--env='.length);
        const [key, value] = pair.split('=');
        envOverrides[key] = value;
      }
    }

    const result = await run({ sessionId, registeredAgents: [], vercelConfig, envOverrides });
    console.log(JSON.stringify(result, null, 2));
    console.log(chalk.green('✅ SWAT Agent ran successfully and triggered recovery or status log'));
  } catch (err) {
    console.error(chalk.red.bold('❌ SWAT Agent failed'), err.message || err);
    process.exitCode = 1;
  }
})();
