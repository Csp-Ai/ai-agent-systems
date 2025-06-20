const admin = require('firebase-admin');
const functions = require('firebase-functions');

// Replace these with your project's configuration values
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "YOUR_API_KEY",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "YOUR_PROJECT.firebaseapp.com",
  projectId: process.env.FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "YOUR_PROJECT.appspot.com",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "SENDER_ID",
  appId: process.env.FIREBASE_APP_ID || "APP_ID"
};

if (!admin.apps.length) {
  // Service account credentials should be provided via GOOGLE_APPLICATION_CREDENTIALS
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    ...firebaseConfig
  });
}

module.exports = { admin, functions, firebaseConfig };
