const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dashboard', 'dist');
const destDir = path.join(rootDir, 'public', 'dashboard');

function log(message) {
  console.log(`[deploy-dashboard] ${message}`);
}

if (!fs.existsSync(distDir)) {
  console.error('No dashboard build output found. Run `npm run build` in the dashboard directory first.');
  process.exit(1);
}

try {
  if (fs.existsSync(destDir)) {
    fs.rmSync(destDir, { recursive: true, force: true });
  }
  fs.mkdirSync(destDir, { recursive: true });

  if (process.platform === 'win32') {
    execSync(`xcopy "${distDir}" "${destDir}" /E /I /Y`);
  } else {
    execSync(`cp -R ${distDir}/. ${destDir}`);
  }
  log(`Copied ${distDir} to ${destDir}`);
} catch (err) {
  console.error('Failed to copy dashboard files:', err.message);
  process.exit(1);
}

try {
  execSync('firebase deploy --only hosting', { stdio: 'inherit' });
  log('Firebase Hosting deployment complete.');
} catch (err) {
  console.error('Firebase deploy failed:', err.message);
  process.exit(1);
}
