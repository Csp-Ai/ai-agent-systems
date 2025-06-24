// Reusable agent runner for executing any agent via CLI or programmatically
// Uses CommonJS for Node.js v22+ compatibility

const { execSync } = require('child_process');
let chalk;

// Bootstrap chalk dependency so we can color logs even if not installed yet
try {
  chalk = require('chalk');
} catch (_) {
  try {
    console.log('Installing chalk...');
    execSync('npm install chalk', { stdio: 'inherit' });
    chalk = require('chalk');
  } catch (err) {
    // Fallback in case install fails
    chalk = {
      red: (msg) => msg,
      green: (msg) => msg,
      cyan: (msg) => msg,
    };
    console.error('Failed to install chalk:', err.message);
  }
}

// Load environment variables from .env if available
try {
  require('dotenv').config();
} catch (err) {
  // dotenv might be missing; attempt self install
  try {
    console.log('Installing dotenv...');
    execSync('npm install dotenv', { stdio: 'inherit' });
    require('dotenv').config();
  } catch (e) {
    console.error(chalk.red('Unable to load dotenv:'), e.message);
  }
}

/**
 * Ensure a dependency exists, installing it if needed.
 * @param {string} dep
 */
function ensureDependency(dep) {
  try {
    require.resolve(dep);
  } catch (_) {
    try {
      console.log(chalk.cyan(`Installing missing dependency ${dep}...`));
      execSync(`npm install ${dep}`, { stdio: 'inherit' });
    } catch (err) {
      console.error(chalk.red(`Failed to install ${dep}: ${err.message}`));
    }
  }
}

/**
 * Parse command line arguments of form --session=foo --env KEY=value
 * @param {string[]} argv
 * @returns {{sessionId?:string, envOverrides:Object}}
 */
function parseArgs(argv) {
  const envOverrides = {};
  let sessionId;
  for (const arg of argv) {
    if (arg.startsWith('--session=')) {
      sessionId = arg.slice('--session='.length);
    } else if (arg.startsWith('--env=')) {
      const pair = arg.slice('--env='.length);
      const [key, value] = pair.split('=');
      if (key) envOverrides[key] = value;
    }
  }
  return { sessionId, envOverrides };
}

/**
 * Run a specific agent by name.
 * @param {Object} options
 * @param {string} [options.agentName='vercel-swat-agent'] Agent file name sans extension
 * @param {string} [options.sessionId] Optional session identifier
 * @param {Object} [options.envOverrides] Environment vars to apply before run
 * @param {Array}  [options.registeredAgents] Extra metadata passed to agent
 * @param {Object} [options.args] Additional args for agent
 * @returns {Promise<*>}
 */
async function run(options = {}) {
  const {
    agentName = 'vercel-swat-agent',
    sessionId = process.env.SESSION_ID || 'dev-session',
    envOverrides = {},
    registeredAgents = [],
    args = {},
    vercelConfig = {},
  } = options;

  // apply env overrides
  if (envOverrides && typeof envOverrides === 'object') {
    for (const [k, v] of Object.entries(envOverrides)) {
      process.env[k] = v;
    }
  }

  // ensure core dependencies
  ['firebase-admin', 'node-fetch'].forEach(ensureDependency);

  let agent;
  try {
    agent = require(`../agents/${agentName}.js`);
  } catch (err) {
    console.error(chalk.red(`Failed to load agent ${agentName}: ${err.message}`));
    throw err;
  }

  if (!agent || typeof agent.run !== 'function') {
    const msg = `Agent ${agentName} does not export a run() function`;
    console.error(chalk.red(msg));
    throw new Error(msg);
  }

  try {
    console.log(chalk.cyan(`\n🚀 Running ${agentName}...`));
    const result = await agent.run({ sessionId, registeredAgents, vercelConfig, args });
    console.log(chalk.green(`\n✅ ${agentName} completed successfully.`));
    return result;
  } catch (err) {
    console.error(chalk.red(`\n❌ ${agentName} failed:`), err.message || err);
    return { status: 'failed', reason: err.message };
  }
}

module.exports = { run, parseArgs };

// CLI support if invoked directly
if (require.main === module) {
  (async () => {
    const [, , agentNameCli, ...rest] = process.argv;
    const { sessionId, envOverrides } = parseArgs(rest);
    try {
      await run({ agentName: agentNameCli || 'vercel-swat-agent', sessionId, envOverrides });
    } catch {
      process.exitCode = 1;
    }
  })();
}
