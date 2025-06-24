const fs = require('fs');
const path = require('path');
const stripe = require('stripe')(process.env.STRIPE_KEY || '');

async function main() {
  let status = 'ok';
  try {
    await stripe.customers.list({ limit: 1 });
  } catch (err) {
    status = 'error';
  }
  const out = path.join(__dirname, '..', 'reports', 'billing-status.json');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify({ status, timestamp: new Date().toISOString() }, null, 2));
  console.log(`Billing status written to ${out}`);
}

main();
