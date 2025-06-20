const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function getRecentCommits(limit = 20) {
  try {
    return execSync(`git -c color.ui=never log -${limit} --pretty=%s`)
      .toString()
      .trim()
      .split('\n')
      .filter(Boolean);
  } catch {
    return [];
  }
}

function getRecentFiles(limit = 20) {
  try {
    const out = execSync(`git -c color.ui=never log -${limit} --name-status --pretty=""`)
      .toString()
      .trim();
    return out
      .split('\n')
      .filter(Boolean)
      .map(line => line.trim().split(/\s+/));
  } catch {
    return [];
  }
}

function checkRoadmap(commits) {
  const warnings = [];
  const roadmapPath = path.join(__dirname, '..', 'ROADMAP.md');
  let milestones = [];
  if (fs.existsSync(roadmapPath)) {
    const roadmap = fs.readFileSync(roadmapPath, 'utf8');
    milestones = roadmap.match(/M\d+/g) || [];
  } else {
    warnings.push('ROADMAP.md not found');
  }

  commits.forEach(msg => {
    if (/feat|feature/i.test(msg)) {
      const tagged = milestones.some(m => msg.includes(m));
      if (!tagged) {
        warnings.push(`Feature commit lacks milestone: "${msg}"`);
      }
    }
  });

  return warnings;
}

function checkNewAgents(files, metadata) {
  const missing = [];
  files.forEach(([status, file]) => {
    if (!file.startsWith('agents/') || !file.endsWith('-agent.js')) return;
    const id = path.basename(file, '.js');
    if (!metadata[id]) missing.push(id);
  });
  return missing;
}

function checkSOPs(metadata) {
  const issues = [];
  const dir = path.join(__dirname, '..', 'sops');
  const now = Date.now();
  for (const id of Object.keys(metadata)) {
    const pattern = new RegExp(`^${id}-\\d{4}-\\d{2}-\\d{2}\\.json$`);
    const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => pattern.test(f)) : [];
    if (!files.length) {
      issues.push(`${id}: missing SOP file`);
    } else {
      const latest = Math.max(...files.map(f => fs.statSync(path.join(dir, f)).mtimeMs));
      if (now - latest > 30 * 24 * 60 * 60 * 1000) {
        issues.push(`${id}: SOP outdated`);
      }
    }
  }
  return issues;
}

module.exports = {
  run: async () => {
    const metadata = require('./agent-metadata.json');
    const commits = getRecentCommits();
    const files = getRecentFiles();
    const featureWarnings = checkRoadmap(commits);
    const unknownAgents = checkNewAgents(files, metadata);
    const sopIssues = checkSOPs(metadata);
    return { featureWarnings, unknownAgents, sopIssues };
  }
};

if (require.main === module) {
  module.exports.run().then(res => {
    console.log(JSON.stringify(res, null, 2));
  }).catch(err => {
    console.error(err);
    process.exit(1);
  });
}
