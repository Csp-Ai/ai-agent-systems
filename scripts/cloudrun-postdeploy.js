#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function logSuccess(msg) {
  console.log(`\x1b[32m✅ ${msg}\x1b[0m`);
}

function logFailure(msg) {
  console.error(`\x1b[31m❌ ${msg}\x1b[0m`);
}

function logInfo(msg) {
  console.log(`\x1b[34mℹ️  ${msg}\x1b[0m`);
}

const SERVICE = process.env.SERVICE_NAME;
const REGION = process.env.REGION;
const PROJECT = process.env.PROJECT_ID;
const WEBHOOK = process.env.SLACK_WEBHOOK_URL || process.env.WEBHOOK_URL;

if (!SERVICE || !REGION) {
  logFailure('SERVICE_NAME and REGION environment variables are required.');
  process.exit(1);
}

const rootDir = path.resolve(__dirname, '..');
if (process.cwd() !== rootDir) {
  process.chdir(rootDir);
}

const DEPLOY_LOG = path.join(rootDir, 'logs', 'postdeploy', 'cloudrun-postdeploy.json');

function readLog() {
  try {
    return JSON.parse(fs.readFileSync(DEPLOY_LOG, 'utf8'));
  } catch {
    return [];
  }
}

function writeLog(data) {
  fs.mkdirSync(path.dirname(DEPLOY_LOG), { recursive: true });
  fs.writeFileSync(DEPLOY_LOG, JSON.stringify(data, null, 2));
}

async function postToWebhook(message) {
  if (!WEBHOOK) return;
  try {
    await fetch(WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: message })
    });
  } catch (err) {
    logFailure(`Failed to notify webhook: ${err.message}`);
  }
}

function getServiceUrl() {
  return execSync(`gcloud run services describe ${SERVICE} --region ${REGION} --format="value(status.url)"`, { encoding: 'utf8' }).trim();
}

function getRevisions() {
  const out = execSync(`gcloud run revisions list --service ${SERVICE} --region ${REGION} --sort-by \"~createTime\" --limit 2 --format=json`, { encoding: 'utf8' });
  return JSON.parse(out).map(r => r.metadata.name);
}

function rollbackTo(revision) {
  execSync(`gcloud run services update-traffic ${SERVICE} --region ${REGION} --to-revisions ${revision}=100`, { stdio: 'inherit' });
}

(async () => {
  const commit = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
  const url = getServiceUrl();
  const logEntry = {
    timestamp: new Date().toISOString(),
    commit,
    url
  };

  logInfo(`Pinging ${url}/healthz ...`);
  let healthy = false;
  try {
    const res = await fetch(`${url}/healthz`);
    healthy = res.ok;
  } catch (err) {
    logFailure(`Health check request failed: ${err.message}`);
  }

  logInfo(`Checking root route at ${url} ...`);
  let rootOk = false;
  try {
    const res = await fetch(url);
    rootOk = res.ok;
  } catch (err) {
    logFailure(`Root route request failed: ${err.message}`);
  }

  if (healthy) {
    logSuccess('Health check passed');
    logEntry.status = 'healthy';
  } else {
    logFailure('Health check failed, rolling back...');
    logEntry.status = 'rollback';
    const revs = getRevisions();
    if (revs.length > 1) {
      try {
        rollbackTo(revs[1]);
        logSuccess(`Rolled back to ${revs[1]}`);
        await postToWebhook(`Rolled back ${SERVICE} to ${revs[1]} after failed health check.`);
      } catch (err) {
        logFailure(`Rollback failed: ${err.message}`);
        logEntry.error = err.message;
      }
    } else {
      logFailure('No previous revision found to rollback to.');
      logEntry.error = 'No previous revision';
    }
  }

  logEntry.rootAccessible = rootOk;

  const data = readLog();
  data.push(logEntry);
  writeLog(data);
})();

