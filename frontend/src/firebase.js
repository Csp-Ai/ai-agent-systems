import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

let app = null;
let db = {};

function createStubAuth() {
  return {
    currentUser: null,
    signInAnonymously: async () => {
      console.warn('Firebase auth stub invoked: signInAnonymously');
      return { user: null };
    },
  };
}

// Fallback auth stub so UI components can safely call auth methods
let auth = createStubAuth();

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
};

try {
  if (firebaseConfig.apiKey) {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
  } else {
    console.warn('Firebase env vars missing; using stubbed client');
  }
} catch (err) {
  console.error('Failed to initialize Firebase:', err);
  app = null;
  db = {};
  auth = createStubAuth();
}

export { db, auth, createStubAuth };
