const admin = require('firebase-admin');
const functions = require('firebase-functions');

// Your Cloud Functions code here, using the imported admin and functions objects

+-----------------------------------------------------+
|                firebase.js                          |
+-----------------------------------------------------+
| 1. Import modules:                                  |
|    - firebase-admin                                 |
|    - firebase-functions                             |
+-----------------------------------------------------+
| 2. Define firebaseConfig:                           |
|    - Reads from environment variables               |
|    - Uses fallback/default values if not set        |
+-----------------------------------------------------+
| 3. Initialize Firebase Admin SDK:                   |
|    - Only if not already initialized                |
|    - Uses GOOGLE_APPLICATION_CREDENTIALS for auth   |
|    - Passes firebaseConfig                          |
+-----------------------------------------------------+
| 4. Export:                                          |
|    - admin (firebase-admin instance)                |
|    - functions (firebase-functions)                 |
|    - firebaseConfig                                 |
+-----------------------------------------------------+
