#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { builtinModules } = require('module');
const minimist = require('minimist');
const chalk = require('chalk');
const { execSync } = require('child_process');

const argv = minimist(process.argv.slice(2));
const fix = argv.fix || false;

const ROOT = path.join(__dirname, '..');
const TARGETS = [
  { name: 'frontend', dir: path.join(ROOT, 'frontend'), pkg: path.join(ROOT, 'frontend', 'package.json') },
  { name: 'functions', dir: path.join(ROOT, 'functions'), pkg: path.join(ROOT, 'functions', 'package.json') },
  { name: 'agents', dir: path.join(ROOT, 'agents'), pkg: path.join(ROOT, 'package.json') },
];

function readJSON(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return {};
  }
}

function listFiles(dir, exts) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...listFiles(p, exts));
    else if (exts.some(e => entry.name.endsWith(e))) results.push(p);
  }
  return results;
}

function extractPackages(file) {
  const code = fs.readFileSync(file, 'utf8');
  const regex = /import\s+(?:[^'";]+\s+from\s+)?['"]([^'"]+)['"]|require\(\s*['"]([^'"]+)['"]\s*\)|import\(\s*['"]([^'"]+)['"]\s*\)/g;
  const pkgs = new Set();
  let m;
  while ((m = regex.exec(code))) {
    const mod = m[1] || m[2] || m[3];
    if (!mod) continue;
    if (mod.startsWith('.') || mod.startsWith('/')) continue;
    if (builtinModules.includes(mod)) continue;
    if (mod.startsWith('@/')) continue;
    const parts = mod.startsWith('@') ? mod.split('/').slice(0, 2).join('/') : mod.split('/')[0];
    pkgs.add(parts);
  }
  return pkgs;
}

function analyze(target) {
  const files = listFiles(target.dir, ['.js', '.jsx']);
  const used = new Set();
  files.forEach(f => extractPackages(f).forEach(p => used.add(p)));

  const pkgJson = readJSON(target.pkg);
  const declared = new Set([
    ...Object.keys(pkgJson.dependencies || {}),
    ...Object.keys(pkgJson.devDependencies || {}),
  ]);

  const missing = [...used].filter(p => !declared.has(p));
  const unused = [...declared].filter(p => !used.has(p));
  const valid = [...used].filter(p => declared.has(p));

  console.log(chalk.bold(`\n== ${target.name.toUpperCase()} ==`));
  if (valid.length) console.log(chalk.green('✅ Installed & used:'), valid.join(', '));
  if (missing.length) {
    console.log(chalk.red('⚠️ Missing packages:'), missing.join(', '));
    console.log(chalk.yellow(`   npm install ${missing.join(' ')} --prefix ${target.name === 'agents' ? '.' : target.name}`));
  }
  if (unused.length) console.log(chalk.cyan('🧹 Unused packages:'), unused.join(', '));

  if (fix && missing.length) {
    try {
      const cmd = `npm install ${missing.join(' ')} --prefix ${target.name === 'agents' ? ROOT : target.dir}`;
      execSync(cmd, { stdio: 'inherit' });
    } catch (err) {
      console.error(chalk.red('Failed to install packages for', target.name));
    }
  }

  return { missing };
}

function checkAgentMetadata() {
  const metaPath = path.join(ROOT, 'agents', 'agent-metadata.json');
  const meta = readJSON(metaPath);
  const deps = new Set();
  Object.values(meta).forEach(m => {
    if (Array.isArray(m.dependencies)) m.dependencies.forEach(d => deps.add(d));
  });
  if (!deps.size) return [];

  const rootPkg = readJSON(path.join(ROOT, 'package.json'));
  const funcPkg = readJSON(path.join(ROOT, 'functions', 'package.json'));
  const installed = new Set([
    ...Object.keys(rootPkg.dependencies || {}),
    ...Object.keys(rootPkg.devDependencies || {}),
    ...Object.keys(funcPkg.dependencies || {}),
    ...Object.keys(funcPkg.devDependencies || {}),
  ]);

  return [...deps].filter(d => !installed.has(d));
}

function main() {
  let missingCount = 0;
  TARGETS.forEach(t => {
    const result = analyze(t);
    missingCount += result.missing.length;
  });

  const metaMissing = checkAgentMetadata();
  if (metaMissing.length) {
    console.log(chalk.red('\n⚠️ agent-metadata.json missing dependencies:'), metaMissing.join(', '));
  }
  missingCount += metaMissing.length;

  if (missingCount && !fix) {
    console.log(chalk.red.bold('\nDependency issues found.'));    
  } else if (!missingCount) {
    console.log(chalk.green.bold('\nAll dependencies are satisfied.'));
  }

  if (missingCount) process.exitCode = 1;
}

if (require.main === module) {
  main();
}

module.exports = { analyze, checkAgentMetadata };
