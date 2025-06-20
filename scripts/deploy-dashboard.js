const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function logSuccess(msg) {
  console.log(`\x1b[32m✅ ${msg}\x1b[0m`);
}

function logFailure(msg) {
  console.error(`\x1b[31m❌ ${msg}\x1b[0m`);
}

function logInfo(msg) {
  console.log(`\x1b[34mℹ️  ${msg}\x1b[0m`);
}

// Ensure script runs from repository root
const rootDir = path.resolve(__dirname, '..');
if (process.cwd() !== rootDir) {
  logInfo(`Switching to repository root: ${rootDir}`);
  process.chdir(rootDir);
}

const dashboardDir = path.join(rootDir, 'dashboard');
const destDir = path.join(rootDir, 'public', 'dashboard');

// Clean any existing build output
if (fs.existsSync(destDir)) {
  logInfo('Cleaning old dashboard build...');
  fs.rmSync(destDir, { recursive: true, force: true });
}

try {
  logInfo('Installing dashboard dependencies...');
  execSync('npm install', { cwd: dashboardDir, stdio: 'inherit' });
  logInfo('Building dashboard...');
  execSync('npm run build', { cwd: dashboardDir, stdio: 'inherit' });
} catch (err) {
  logFailure(`Failed to build dashboard: ${err.message}`);
  process.exit(1);
}

const distDir = path.join(dashboardDir, 'dist');
const buildDir = path.join(dashboardDir, 'build');
let sourceDir = null;

if (fs.existsSync(destDir)) {
  sourceDir = destDir;
} else if (fs.existsSync(distDir)) {
  sourceDir = distDir;
} else if (fs.existsSync(buildDir)) {
  sourceDir = buildDir;
}

if (!sourceDir) {
  logFailure('No dashboard output found after build');
  process.exit(1);
}

if (sourceDir !== destDir) {
  logInfo(`Build source directory: ${sourceDir}`);
  logInfo(`Destination directory: ${destDir}`);
  try {
    fs.mkdirSync(destDir, { recursive: true });
    logInfo('Copying dashboard build output...');
    if (process.platform === 'win32') {
      execSync(`xcopy "${sourceDir}" "${destDir}" /E /I /Y`);
    } else {
      execSync(`cp -R "${sourceDir}/." "${destDir}"`);
    }
    logSuccess(`Copied ${sourceDir} to ${destDir}`);
  } catch (err) {
    logFailure(`Failed to copy dashboard files: ${err.message}`);
    process.exit(1);
  }
} else {
  logSuccess(`Dashboard built in ${destDir}`);
}

