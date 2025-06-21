module.exports = {
  run: async ({ sessionId, firestore, fetch, log, shell }) => {
    log("\uD83E\uDD16 SWAT agent activated: scanning AI Agent System...");

    // 1. Check sessionId status API
    const statusURL = `/status/${sessionId}`;
    const statusRes = await fetch(statusURL);
    const status = await statusRes.json();

    if (!Array.isArray(status) || status.length === 0) {
      log("\u274C No steps returned from status API. API may be down or invalid sessionId.");
      await shell("vercel deploy --prod");
      return;
    }

    // 2. Check Firestore logs activity
    const logSnap = await firestore
      .getCollection("logs")
      .where("sessionId", "==", sessionId)
      .limit(5)
      .get();
    if (logSnap.empty) {
      log("\u274C No logs written to Firestore — agents may not be executing.");
    } else {
      log(`\u2705 Found ${logSnap.size} logs for session ${sessionId}`);
    }

    // 3. Check if agents are registered
    const agentRes = await fetch("/registered-agents");
    const agentList = await agentRes.json();
    if (!Array.isArray(agentList) || agentList.length === 0) {
      log("\u274C No agents registered. Reinitializing from metadata...");
      await shell("node scripts/init-agents-from-metadata.js");
    } else {
      log(`\u2705 ${agentList.length} agents registered.`);
    }

    // 4. Re-trigger first agent (if not started)
    if (!status.find(step => step.status === "active")) {
      log("\u26A0\uFE0F No agent marked as active. Forcing step 0 to start.");
      await firestore.collection("logs").add({
        sessionId,
        message: "Force-activated Website Analysis",
        timestamp: new Date()
      });
    }

    log("🚀 System scan complete. SWAT agent exiting.");
  }
};

