#!/usr/bin/env node

const fs = require('fs');
const { execSync } = require('child_process');

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
    const { run } = await import('./core/agent-runner.js');
    const vercelConfig = require('./vercel.json');
    const result = await run('vercel-swat-agent', {
      sessionId: 'dev-session',
      registeredAgents: [],
      vercelConfig,
    });
    console.log(JSON.stringify(result, null, 2));
    console.log('✅ Vercel SWAT Agent completed successfully');
  } catch (err) {
    console.error('❌ Vercel SWAT Agent failed with reason:', err.message || err);
    process.exitCode = 1;
  }
})();
