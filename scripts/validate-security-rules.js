#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const files = ['firestore.rules', 'storage.rules'];

const color = {
  yellow: txt => `\x1b[33m${txt}\x1b[0m`,
  blue: txt => `\x1b[34m${txt}\x1b[0m`,
};

function logWarning(msg) {
  console.log(color.yellow(`⚠️  ${msg}`));
}

function logInfo(msg) {
  console.log(color.blue(`ℹ️  ${msg}`));
}

function checkFile(file) {
  const filePath = path.join(rootDir, file);
  if (!fs.existsSync(filePath)) return [];

  const content = fs.readFileSync(filePath, 'utf8');
  const regex = /match\s+\/[^\n]*\*\*[^\n]*{([\s\S]*?)}\s*/g;
  const warnings = [];
  let m;
  while ((m = regex.exec(content))) {
    const block = m[1];
    const lines = block.split(/\n/).map(l => l.trim());
    for (const line of lines) {
      if (/^allow\s+(?:read|write|read,\s*write)/.test(line) && !/false/.test(line)) {
        warnings.push(`${file}: ${line}`);
      }
    }
  }
  return warnings;
}

let anyWarnings = false;
for (const file of files) {
  const warnings = checkFile(file);
  if (warnings.length) {
    anyWarnings = true;
    warnings.forEach(w => logWarning(w));
  } else if (fs.existsSync(path.join(rootDir, file))) {
    logInfo(`${file} OK`);
  }
}

if (anyWarnings) {
  logWarning('Review security rules before deploying.');
}
