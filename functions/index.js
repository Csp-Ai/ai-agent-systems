const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

/**
 * Main entry point for Firebase functions.
 * Composes feature-focused routers for auth, translation, billing,
 * agent orchestration and logging.
 */
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const { router: authRouter } = require('./auth');
const { router: translationRouter, handleTranslate } = require('./translation');
const { router: billingRouter, billingMiddleware } = require('./billing');
const { router: agentRouter, handleExecuteAgent } = require('./agent');
const { router: loggingRouter, readLogs } = require('./logging');

app.use(authRouter);
app.use(translationRouter);
app.use(billingRouter);
app.use(agentRouter);
app.use(loggingRouter);

const { functions } = require('../firebase');

if (functions && functions.https) {
  module.exports.app = functions.https.onRequest(app);
} else {
  module.exports.app = app;
}
module.exports.expressApp = app;

// Cloud Function exports for direct invocation
if (functions && functions.https) {
  exports.translate = functions.https.onRequest(handleTranslate);
  exports.report = functions.https.onRequest((req, res) => {
    res.json(readLogs());
  });
  exports.executeAgent = functions.https.onRequest((req, res) => {
    billingMiddleware(req, res, () => handleExecuteAgent(req, res));
  });
}
