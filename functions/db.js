const { admin } = require('../firebase');

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

async function isOrgMember(orgId, email) {
  if (!orgId || !email) return false;
  try {
    const snap = await db.collection('orgs').doc(orgId).get();
    if (!snap.exists) return false;
    const data = snap.data() || {};
    const members = Array.isArray(data.members) ? data.members : [];
    return members.map(m => m.toLowerCase()).includes(email.toLowerCase());
  } catch {
    return false;
  }
}

module.exports = { db, appendToCollection, readCollection, writeDocument, isOrgMember };
