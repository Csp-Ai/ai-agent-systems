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
    const content = fs.readFileSync(dockerfilePath, 'utf8');
    if (content.trim().length > 0) {
      result.notEmpty = true;
      result.hasFrom = /^FROM\s+node:/im.test(content);
      result.hasWorkdir = /^WORKDIR\s+/im.test(content);
      result.hasCopy = /^COPY\s+/im.test(content);
      result.hasRun = /^RUN\s+/im.test(content);
      result.hasExpose = /^EXPOSE\s+/im.test(content);
      result.hasCmd = /^CMD\s+/im.test(content);
    }
  }
  return result;
}

function printSummary(res) {
  if (!res.exists) {
    console.log('Dockerfile not found in repository root.');
    return;
  }
  if (!res.notEmpty) {
    console.log('Dockerfile is empty.');
    return;
  }

  const missing = [];
  if (!res.hasFrom) missing.push('FROM node');
  if (!res.hasWorkdir) missing.push('WORKDIR');
  if (!res.hasCopy) missing.push('COPY');
  if (!res.hasRun) missing.push('RUN');
  if (!res.hasExpose) missing.push('EXPOSE');
  if (!res.hasCmd) missing.push('CMD');

  if (missing.length === 0) {
    console.log('Dockerfile validation successful: all required commands found.');
  } else {
    console.log('Dockerfile missing or invalid sections: ' + missing.join(', '));
  }
}

const result = validateDockerfile();
printSummary(result);
