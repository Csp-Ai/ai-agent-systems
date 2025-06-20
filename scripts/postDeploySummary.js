#!/usr/bin/env node
const { execSync } = require('child_process');
const nodemailer = require('nodemailer');

function run(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf8' }).trim();
  } catch {
    return '';
  }
}

async function checkApi(url) {
  if (!url) return false;
  try {
    const res = await fetch(url);
    return res.ok;
  } catch {
    return false;
  }
}

async function sendSlack(message) {
  const webhook = process.env.SLACK_DEPLOY_WEBHOOK_URL || process.env.SLACK_WEBHOOK_URL;
  if (!webhook) return;
  try {
    await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: message }),
    });
  } catch (err) {
    console.error('Failed to post Slack message:', err.message);
  }
}

async function sendEmail(message) {
  const emails = (process.env.DEPLOY_NOTIFY_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean);
  if (!emails.length) return;
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.SMTP_USER,
      to: emails.join(','),
      subject: 'Cloud Run Deployment Summary',
      text: message,
    });
  } catch (err) {
    console.error('Failed to send summary email:', err.message);
  }
}

async function main() {
  const status = process.env.DEPLOY_STATUS || process.argv[2] || 'unknown';
  const commit = process.env.COMMIT_SHA || run('git rev-parse HEAD');
  const commitMsg = run('git log -1 --pretty=%B');
  const changes = run('git diff --name-only HEAD~1..HEAD');
  const url = process.env.CLOUD_RUN_URL || '';
  const apiReady = await checkApi(url);

  const summary = [
    `Deployment status: ${status}`,
    `Commit: ${commit}`,
    `Message: ${commitMsg.trim()}`,
    changes ? `Changed files:\n${changes}` : 'Changed files: N/A',
    `Live URL: ${url || 'N/A'}`,
    `API ready: ${apiReady ? 'Yes' : 'No'}`,
  ].join('\n');

  console.log('\n' + summary + '\n');
  await sendSlack(summary);
  await sendEmail(summary);
}

main();
