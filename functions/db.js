const { db } = require('../firebase');
const chalk = require('chalk');

if (!db) {
  console.error(chalk.redBright("\uD83D\uDD25 Firebase config missing. Skipping initialization."));
}

function coll(path) {
  if (!db) return null;
  const parts = path.split('/').filter(Boolean);
  let ref = db;
  while (parts.length) {
    const col = parts.shift();
    ref = ref.collection(col);
    if (parts.length) {
      const doc = parts.shift();
      ref = ref.doc(doc);
    }
  }
  return ref;
}

async function appendToCollection(path, data) {
  const ref = coll(path);
  if (!ref) return;
  await ref.add({ ...data, timestamp: new Date().toISOString() });
}

async function readCollection(path) {
  const ref = coll(path);
  if (!ref) return [];
  const snap = await ref.orderBy('timestamp').get();
  return snap.docs.map(d => d.data());
}

async function writeDocument(path, id, data) {
  const ref = coll(path);
  if (!ref) return;
  await ref.doc(id).set(data, { merge: true });
}

module.exports = { db, appendToCollection, readCollection, writeDocument };
