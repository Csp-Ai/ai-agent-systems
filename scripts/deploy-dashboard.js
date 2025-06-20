const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Ensure script runs from repository root
const rootDir = path.resolve(__dirname, '..');
if (process.cwd() !== rootDir) {
  process.chdir(rootDir);
}

const distDir = path.join(rootDir, 'dashboard', 'dist');
const buildDir = path.join(rootDir, 'dashboard', 'build');
let sourceDir = null;

if (fs.existsSync(distDir)) {
  sourceDir = distDir;
} else if (fs.existsSync(buildDir)) {
  sourceDir = buildDir;
}

if (!sourceDir) {
  console.error('\x1b[31m❌ No dashboard output found in dashboard/dist or dashboard/build\x1b[0m');
  process.exit(1);
}

const destDir = path.join(rootDir, 'public', 'dashboard');

function logSuccess(msg) {
  console.log(`\x1b[32m✅ ${msg}\x1b[0m`);
}

function logFailure(msg) {
  console.error(`\x1b[31m❌ ${msg}\x1b[0m`);
}

try {
  if (fs.existsSync(destDir)) {
    fs.rmSync(destDir, { recursive: true, force: true });
  }
  fs.mkdirSync(destDir, { recursive: true });

  if (process.platform === 'win32') {
    execSync(`xcopy "${sourceDir}" "${destDir}" /E /I /Y`);
  } else {
    execSync(`cp -R ${sourceDir}/. ${destDir}`);
  }
  logSuccess(`Copied ${sourceDir} to ${destDir}`);
} catch (err) {
  logFailure(`Failed to copy dashboard files: ${err.message}`);
  process.exit(1);
}

try {
  execSync('firebase deploy --only hosting', { stdio: 'inherit' });
  logSuccess('Firebase Hosting deployment complete');
} catch (err) {
  logFailure(`Firebase deploy failed: ${err.message}`);
  process.exit(1);
}
