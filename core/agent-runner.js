const chalk = require('chalk');

/**
 * Run the Vercel SWAT agent with optional environment overrides.
 * @param {Object} params
 * @param {string} params.sessionId
 * @param {Array} params.registeredAgents
 * @param {Object} params.vercelConfig
 * @param {Object} [params.envOverrides]
 * @returns {Promise<Object>} log summary from the agent
 */
async function run({ sessionId = '', registeredAgents = [], vercelConfig = {}, envOverrides = {} } = {}) {
  try {
    if (envOverrides && typeof envOverrides === 'object') {
      for (const [key, value] of Object.entries(envOverrides)) {
        process.env[key] = value;
      }
    }

    const requiredDeps = ['node-fetch', 'firebase-admin'];
    const missing = requiredDeps.filter(dep => {
      try {
        require.resolve(dep);
        return false;
      } catch {
        return true;
      }
    });
    if (missing.length) {
      console.error(chalk.redBright(`Missing dependencies: ${missing.join(', ')}`));
      throw new Error('Required dependencies not installed');
    }

    const agentModule = await import('../agents/vercel-swat-agent.js');
    const agent = agentModule.default || agentModule;
    if (!agent || typeof agent.run !== 'function') {
      console.error(chalk.redBright('vercel-swat-agent.js is missing a valid exported `run()` function'));
      throw new Error('Invalid agent module');
    }

    console.log(chalk.cyanBright('\n🚀 Running Vercel SWAT Agent...'));
    const result = await agent.run({ sessionId, registeredAgents, vercelConfig });
    console.log(chalk.green('\n✅ SWAT Agent completed successfully.'));
    return result;
  } catch (err) {
    console.error(chalk.redBright('\n❌ Vercel SWAT Agent failed with reason:'), err.message);
    throw err;
  }
}

module.exports = { run };
