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
      result.hasFrom = /FROM\s+node/.test(content);
      result.hasWorkdir = /WORKDIR/.test(content);
      result.hasCopy = /COPY/.test(content);
      result.hasRun = /RUN/.test(content);
      result.hasExpose = /EXPOSE/.test(content);
      result.hasCmd = /CMD/.test(content);
    }
  }

  return result;
}

function printSummary(res) {
  console.log('Dockerfile Validation Summary:');
  for (const [key, value] of Object.entries(res)) {
    const mark = value ? '✔' : '❌';
    console.log(`${mark} ${key}`);
  }
}

printSummary(validateDockerfile());
