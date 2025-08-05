const express = require('express');
const { billingMiddleware, incrementUsage, getBillingStatus } = require('./middleware/billing');
const { verifyUser } = require('./auth');

/**
 * Billing related routes and helpers.
 * Exposes middleware and endpoints for querying billing status and usage.
 */
const router = express.Router();

router.get('/billing/info', async (req, res) => {
  const uid = await verifyUser(req);
  if (!uid) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const info = await getBillingStatus(uid);
    res.json(info);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch billing info' });
  }
});

router.get('/billing/usage', async (req, res) => {
  const uid = await verifyUser(req);
  if (!uid) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const info = await getBillingStatus(uid);
    res.json(info.usage || {});
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch usage' });
  }
});

module.exports = {
  router,
  billingMiddleware,
  incrementUsage,
  getBillingStatus,
};
