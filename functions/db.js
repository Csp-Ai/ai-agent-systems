const { admin } = require('../firebase');

const db = admin.firestore();

function coll(path) {
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
  await coll(path).add({ ...data, timestamp: new Date().toISOString() });
}

async function readCollection(path) {
  const snap = await coll(path).orderBy('timestamp').get();
  return snap.docs.map(d => d.data());
}

async function writeDocument(path, id, data) {
  await coll(path).doc(id).set(data, { merge: true });
}

module.exports = { db, appendToCollection, readCollection, writeDocument };
