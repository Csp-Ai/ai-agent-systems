#!/usr/bin/env node
// Writes logs/post-deploy-summary.json to capture deployment details.
// Helps track iterations as we scale the ops-focused AI SaaS.
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (err) {
    console.error(`Failed to read ${filePath}: ${err.message}`);
    return null;
  }
}

function writeJson(filePath, data) {
  try {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(`Failed to write ${filePath}: ${err.message}`);
  }
}

function getCommitInfo() {
  try {
    const commitId = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
    const timestamp = execSync('git log -1 --format=%cI', { encoding: 'utf8' }).trim();
    return { commitId, timestamp };
  } catch (err) {
    console.error(`Failed to retrieve git info: ${err.message}`);
    return { commitId: null, timestamp: null };
  }
}

function getAgents(metaPath) {
  const metadata = readJson(metaPath) || {};
  return Object.entries(metadata).map(([key, value]) => ({
    id: key,
    name: value.name,
    description: value.description,
    version: value.version,
    enabled: value.enabled,
  }));
}

function main() {
  const rootDir = path.resolve(__dirname, '..');
  const summaryPath = path.join(rootDir, 'logs', 'post-deploy-summary.json');
  const qaPath = path.join(rootDir, 'logs', 'qa', 'codex-qa-agent.json');
  const deployPath = path.join(rootDir, 'logs', 'postdeploy', 'cloudrun-postdeploy.json');
  const metaPath = path.join(rootDir, 'agents', 'agent-metadata.json');

  const codexQAResults = readJson(qaPath);
  const cloudRunPostdeployResults = readJson(deployPath);
  const agents = getAgents(metaPath);
  const { commitId, timestamp } = getCommitInfo();
  const deploymentStatus = cloudRunPostdeployResults?.status ||
    cloudRunPostdeployResults?.deploymentStatus || null;

  const summary = {
    commitId,
    timestamp,
    deploymentStatus,
    codexQAResults,
    cloudRunPostdeployResults,
    agents,
  };

  writeJson(summaryPath, summary);
  console.log(`Summary written to ${summaryPath}`);
}

main();
