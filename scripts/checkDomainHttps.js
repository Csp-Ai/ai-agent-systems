#!/usr/bin/env node
// Quick health check to ensure our custom .ai domain serves HTTPS
// before finalizing deployment. This protects the self-serve onboarding
// flow described in the business context.
const https = require('https');
const domain = process.argv[2];
if (!domain) {
  console.error('Usage: node checkDomainHttps.js <domain>');
  process.exit(1);
}
https
  .get(`https://${domain}`, res => {
    console.log(`HTTPS status for ${domain}: ${res.statusCode}`);
    process.exit(res.statusCode === 200 ? 0 : 1);
  })
  .on('error', err => {
    console.error(`HTTPS check failed: ${err.message}`);
    process.exit(1);
  });
