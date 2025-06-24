const { admin, db } = require('../../firebase');

const FREE_LIMIT = 3;
const TRIAL_DAYS = 14;

function billingRef(uid) {
  return db
    .collection('users')
    .doc(uid)
    .collection('billingStatus')
    .doc('current');
}

async function ensureBilling(uid) {
  const ref = billingRef(uid);
  const snap = await ref.get();
  if (!snap.exists) {
    const data = {
      plan: 'free',
      trialStartedAt: new Date().toISOString(),
      usage: { totalRuns: 0, agents: {} }
    };
    await ref.set(data);
    return data;
  }
  return snap.data();
}

async function getBillingStatus(uid) {
  const status = await ensureBilling(uid);
  if (status.trialStartedAt) {
    const trialDate = new Date(status.trialStartedAt);
    status.daysRemaining = TRIAL_DAYS - Math.floor((Date.now() - trialDate.getTime()) / 86400000);
  } else {
    status.daysRemaining = null;
  }
  return status;
}

async function incrementUsage(uid, agent) {
  const ref = billingRef(uid);
  const updates = {
    'usage.totalRuns': admin.firestore.FieldValue.increment(1),
    [`usage.agents.${agent}`]: admin.firestore.FieldValue.increment(1)
  };
  await ref.set(updates, { merge: true });
}

async function verifyUser(req) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return null;
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    return decoded.uid;
  } catch {
    return null;
  }
}

async function billingMiddleware(req, res, next) {
  const uid = await verifyUser(req);
  if (!uid) return res.status(401).json({ error: 'Unauthorized' });
  req.uid = uid;
  const status = await getBillingStatus(uid);
  req.billing = status;

  const plan = status.plan || 'free';
  const runs = status.usage?.totalRuns || 0;
  const daysRemaining = status.daysRemaining;

  if (status.trialStartedAt && daysRemaining < 0 && plan !== 'pro') {
    return res
      .status(402)
      .json({
        error: 'trial_expired',
        message: 'Trial expired. Upgrade required.',
        redirect: '/create-checkout-session'
      });
  }

  if (plan !== 'pro' && runs >= FREE_LIMIT) {
    return res
      .status(402)
      .json({
        error: 'upgrade',
        message: 'Plan limit reached. Upgrade required.',
        redirect: '/create-checkout-session'
      });
  }

  req.billing.daysRemaining = daysRemaining;
  next();
}

module.exports = {
  billingMiddleware,
  getBillingStatus,
  incrementUsage,
  FREE_LIMIT,
  TRIAL_DAYS
};
