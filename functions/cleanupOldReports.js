const { admin, functions } = require('../firebase');

async function deleteOldReports() {
  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000; // 30 days
  try {
    const [files] = await admin.storage().bucket().getFiles({ prefix: 'reports/' });
    for (const file of files) {
      if (!file.name.endsWith('.pdf')) continue;
      const [metadata] = await file.getMetadata();
      const updated = new Date(metadata.updated || metadata.timeCreated || 0).getTime();
      if (updated < cutoff) {
        await file.delete();
        console.log(`Deleted ${file.name}`);
      }
    }
  } catch (err) {
    console.error('Failed to cleanup reports:', err);
  }
}

const cleanupOldReports = functions.pubsub
  .schedule('every 24 hours')
  .onRun(deleteOldReports);

module.exports = { cleanupOldReports };
