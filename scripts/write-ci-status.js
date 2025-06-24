const fs = require('fs');
const path = require('path');

const status = {
  lint: process.env.LINT_STATUS || 'unknown',
  tests: process.env.TEST_STATUS || 'unknown',
  build: process.env.BUILD_STATUS || 'unknown'
};

const file = path.join(__dirname, '..', 'reports', 'ci-status.json');
fs.mkdirSync(path.dirname(file), { recursive: true });
fs.writeFileSync(file, JSON.stringify(status, null, 2));
console.log(`CI status written to ${file}`);
