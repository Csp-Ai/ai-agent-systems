const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dashboard', 'dist');
const buildDir = path.join(rootDir, 'dashboard', 'build');
let sourceDir = null;

if (fs.existsSync(distDir)) {
  sourceDir = distDir;
} else if (fs.existsSync(buildDir)) {
  sourceDir = buildDir;
}

if (!sourceDir) {
  console.error('Error: No dashboard build output found. Please run `npm run build` in the dashboard directory.');
  process.exit(1);
}

const destDir = path.join(rootDir, 'public', 'dashboard');

if (fs.existsSync(destDir)) {
  fs.rmSync(destDir, { recursive: true, force: true });
}

fs.mkdirSync(destDir, { recursive: true });

try {
  // Use child_process to leverage system copy command for portability
  if (process.platform === 'win32') {
    execSync(`xcopy "${sourceDir}" "${destDir}" /E /I /Y`);
  } else {
    execSync(`cp -R ${sourceDir}/. ${destDir}`);
  }
  console.log(`Dashboard deployed: ${sourceDir} -> ${destDir}`);
} catch (err) {
  console.error('Error copying dashboard build output:', err.message);
  process.exit(1);
}
