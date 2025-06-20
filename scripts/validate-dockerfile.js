 const fs = require('fs');
const path = require('path');

const dockerfilePath = path.join(__dirname, '..', 'Dockerfile');

function validateDockerfile() {
  const result = {
    exists: false,
    notEmpty: false,
    hasFrom: false,
    hasWorkdir: false,
    hasCopy: false,
    hasRun: false,
    hasExpose: false,
    hasCmd: false,
  };

  if (fs.existsSync(dockerfilePath)) {
    result.exists = true;
    const content = fs.readFileSync(dockerfilePath, 'utf-8');
    if (content.trim().length > 0) {
      result.notEmpty = true;
      result.hasFrom = /FROM\s+node/i.test(content);
      result.hasWorkdir = /WORKDIR/i.test(content);
      result.hasCopy = /COPY/i.test(content);
      result.hasRun = /RUN/i.test(content);
      result.hasExpose = /EXPOSE/i.test(content);
      result.hasCmd = /CMD/i.test(content);
    }
  }

  return result;
}

function printSummary(res) {
  console.log('🔍 Dockerfile Validation Summary:\n');
  for (const [key, value] of Object.entries(res)) {
    const mark = value ? '✔' : '✘';
    console.log(`${mark} ${key}`);
  }
  console.log('\n✅ Done.\n');
}

printSummary(validateDockerfile());




