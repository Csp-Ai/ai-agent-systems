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

const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;

if (apiKey) {
  const firebaseConfig = {
    apiKey,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  };

  try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
  } catch (err) {
    console.error('Failed to initialize Firebase:', err);
  }
} else {
  console.warn('VITE_FIREBASE_API_KEY is not defined. Using stub auth.');
  auth = createStubAuth();
}

export { db, auth, createStubAuth };
