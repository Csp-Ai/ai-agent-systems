const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function deleteIfExists(file) {
  const fp = path.join(__dirname, '..', file);
  if (fs.existsSync(fp)) {
    fs.rmSync(fp, { recursive: true, force: true });
    return true;
  }
  return false;
}

module.exports = {
  run: async (input = {}) => {
    const actions = [];
    const result = { actions };

    // validate vercel.json
    try {
      const vPath = path.join(__dirname, '..', 'vercel.json');
      const config = JSON.parse(fs.readFileSync(vPath, 'utf8'));
      const hasFallback = Array.isArray(config.rewrites) &&
        config.rewrites.some(r => r.destination === '/index.html');
      if (!hasFallback) {
        throw new Error('Missing SPA fallback in vercel.json');
      }
      const distDir = config.builds?.[0]?.config?.distDir;
      if (distDir && distDir !== 'build') {
        throw new Error('distDir should be set to "build"');
      }
      actions.push('validated vercel.json');
    } catch (err) {
      result.error = `Validation failed: ${err.message}`;
      return result;
    }

    // patch firebase leftovers
    const leftovers = [
      'firebase.json',
      '.firebaserc',
      'public/index.html',
      'storage.rules',
      'firebase.js'
    ];
    leftovers.forEach(f => {
      if (deleteIfExists(f)) actions.push(`deleted ${f}`);
    });

    // annotate PR with deploy preview
    if (input.prNumber && input.project && input.branch) {
      const preview = `https://${input.project}-git-${input.branch}-username.vercel.app`;
      result.previewUrl = preview;
      actions.push(`preview ready at ${preview}`);
    }

    // trigger empty commit if frontend config changes
    if (input.triggerDeploy) {
      try {
        execSync("git commit --allow-empty -m 'trigger: vercel redeploy'");
        execSync('git push origin main');
        actions.push('triggered redeploy');
      } catch (err) {
        actions.push(`git push failed: ${err.message}`);
      }
    }

    // report deployment issues
    if (input.deploymentStatus === 'error') {
      actions.push(`deployment failed: ${input.deploymentError}`);
    }

    return result;
  }
};

if (require.main === module) {
  module.exports.run().then(res => {
    console.log(JSON.stringify(res, null, 2));
  }).catch(err => {
    console.error('vercel-ops-agent failed:', err);
    process.exit(1);
  });
}
