#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function getBackendRoutes() {
  const txt = fs.readFileSync(path.join(__dirname, '..', 'functions', 'index.js'), 'utf8');
  const regex = /app\.(get|post|put|delete)\(['"`]([^'"`]+)['"`]/g;
  const routes = {};
  const collisions = [];
  let m;
  while ((m = regex.exec(txt))) {
    const key = `${m[1].toUpperCase()} ${m[2]}`;
    if (routes[key]) collisions.push(key); else routes[key] = true;
  }
  return collisions;
}

function getFrontendRoutes() {
  const txt = fs.readFileSync(path.join(__dirname, '..', 'frontend', 'src', 'main.jsx'), 'utf8');
  const regex = /path\.startsWith\(['"`]([^'"`]+)['"`]\)/g;
  const seen = {};
  const collisions = [];
  let m;
  while ((m = regex.exec(txt))) {
    const key = m[1];
    if (seen[key]) collisions.push(key); else seen[key] = true;
  }
  return collisions;
}

const backend = getBackendRoutes();
const frontend = getFrontendRoutes();

if (backend.length || frontend.length) {
  console.error('Route collisions detected:');
  if (backend.length) console.error(' Backend:', backend.join(', '));
  if (frontend.length) console.error(' Frontend:', frontend.join(', '));
  process.exit(1);
} else {
  console.log('No route collisions detected.');
}
