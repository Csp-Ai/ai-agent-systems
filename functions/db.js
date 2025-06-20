const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

async function appendToCollection(name, data) {
  await db.collection(name).add({ ...data, timestamp: new Date().toISOString() });
}

async function readCollection(name) {
  const snap = await db.collection(name).orderBy('timestamp').get();
  return snap.docs.map(d => d.data());
}

async function writeDocument(name, id, data) {
  await db.collection(name).doc(id).set(data, { merge: true });
}

module.exports = { db, appendToCollection, readCollection, writeDocument };
