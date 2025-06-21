const admin = require('firebase-admin');
const chalk = require('chalk');

let db = null;
try {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault()
    });
  }
  db = admin.firestore();
} catch {
  console.error(chalk.redBright("\uD83D\uDD25 Firebase config missing. Skipping initialization."));
}

module.exports = { admin, db };
