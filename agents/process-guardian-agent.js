const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function latestCommit() {
  const message = execSync('git -c color.ui=never log -1 --pretty=%s').toString().trim();
  const files = execSync('git -c color.ui=never show --name-only --pretty="" -1').toString().trim().split('\n').filter(Boolean);
  return { message, files };
}

function categorize(files, message) {
  const cats = new Set();
  const msg = message.toLowerCase();
  if (files.some(f => /frontend|public|dashboard/.test(f))) cats.add('Frontend');
  if (files.some(f => /agents|functions|scripts/.test(f))) cats.add('Agent Logic');
  if (files.some(f => /Dockerfile|package.json|\.github|deploy|firebase/.test(f))) cats.add('Infra');
  if (files.some(f => /\.md$|docs\//.test(f)) || /docs?|documentation/.test(msg)) cats.add('Docs');
  if (files.some(f => /ROADMAP.md|VISION.md|TECH_ARCH.md/i.test(f)) || /vision|roadmap|tech arch/.test(msg)) cats.add('Vision');
  if (!cats.size) cats.add('Infra');
  return Array.from(cats);
}

function updateLog(categories, message, files) {
  const logPath = path.join(__dirname, '..', 'PROCESS_LOG.md');
  const date = new Date().toISOString().slice(0, 10);
  const strategic = files.some(f => /ROADMAP.md|VISION.md|TECH_ARCH.md/i.test(f)) ? ' \ud83d\udccc Strategic Update' : '';
  const entryLines = categories.map(c => `\u2705 ${c} \u2014 ${message}${strategic}`);
  let text = '';
  if (fs.existsSync(logPath)) text = fs.readFileSync(logPath, 'utf8');
  if (!text.startsWith('# Process Log')) {
    text = `# Process Log\n\n${text}`.trim() + '\n';
  }
  const lines = text.split('\n');
  let idx = lines.findIndex(l => l.startsWith(`## [${date}]`));
  if (idx === -1) {
    lines.push('', `## [${date}]`);
    idx = lines.length - 1;
  }
  lines.splice(idx + 1, 0, ...entryLines);
  fs.writeFileSync(logPath, lines.join('\n') + '\n');
}

module.exports = {
  run: async () => {
    const { message, files } = latestCommit();
    const categories = categorize(files, message);
    updateLog(categories, message, files);
    return { categories, message };
  }
};

if (require.main === module) {
  module.exports.run().catch(err => {
    console.error('process-guardian-agent failed:', err);
    process.exit(1);
  });
}
