const fs = require('fs');
const path = require('path');
const request = require('supertest');
const Module = require('module');

// Provide a mock firebase functions export so functions/index.js loads
const originalLoad = Module._load;
Module._load = function(request, parent, isMain) {
  if (request === '../firebase' || request === './firebase') {
    const doc = { doc: () => doc, collection: () => doc, set: async () => ({}) };
    const stub = {
      functions: { https: { onRequest: (h) => h, onCall: (h) => h } },
      db: { collection: () => doc }
    };
    return stub;
  }
  return originalLoad(request, parent, isMain);
};

const { expressApp } = require('../functions/index');

async function run() {
  const events = [
    { type: 'invoice.payment_failed', data: { object: { metadata: { uid: 'test-user' } } } },
    { type: 'customer.subscription.trial_will_end', data: { object: { metadata: { uid: 'test-user' } } } }
  ];
  const results = [];
  for (const event of events) {
    const res = await request(expressApp).post('/stripe/webhook').send(event);
    results.push({ event: event.type, status: res.statusCode });
  }
  const file = path.join(__dirname, '..', 'reports', 'billing-status.json');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify({ simulated: results }, null, 2));
  console.log('Stripe webhook simulation complete');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
