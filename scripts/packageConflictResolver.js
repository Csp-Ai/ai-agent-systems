#!/usr/bin/env node
const fs = require('fs');
const path = process.argv[2] || 'package.json';

// Read raw file content
let raw;
try {
  raw = fs.readFileSync(path, 'utf8');
} catch (err) {
  console.error(`Failed to read ${path}:`, err.message);
  process.exit(1);
}

// Split HEAD and incoming versions
let headLines = [];
let incomingLines = [];
let mode = 'both';
for (const line of raw.split(/\r?\n/)) {
  if (line.startsWith('<<<<<<<')) { mode = 'head'; continue; }
  if (line.startsWith('=======')) { mode = 'incoming'; continue; }
  if (line.startsWith('>>>>>>>')) { mode = 'both'; continue; }
  if (mode === 'head') headLines.push(line);
  else if (mode === 'incoming') incomingLines.push(line);
  else { headLines.push(line); incomingLines.push(line); }
}

let headJson, incomingJson;
try {
  headJson = JSON.parse(headLines.join('\n'));
  incomingJson = JSON.parse(incomingLines.join('\n'));
} catch (err) {
  console.error('Error parsing package.json versions:', err.message);
  process.exit(1);
}

const headScripts = headJson.scripts || {};
const incomingScripts = incomingJson.scripts || {};

const mergedScripts = { ...headScripts };
const conflicts = [];
for (const [k, v] of Object.entries(incomingScripts)) {
  if (!(k in mergedScripts)) {
    mergedScripts[k] = v;
  } else if (mergedScripts[k] !== v) {
    conflicts.push({ key: k, headVal: mergedScripts[k], incomingVal: v });
  }
}

// Build merged object without conflicts
const mergedJson = { ...headJson, scripts: { ...mergedScripts } };
for (const c of conflicts) {
  delete mergedJson.scripts[c.key];
}

let outputLines = JSON.stringify(mergedJson, null, 2).split('\n');

// Locate scripts section boundaries
const start = outputLines.findIndex(l => l.trim().startsWith('"scripts"'));
if (start === -1) {
  console.error('No scripts section found in package.json');
  process.exit(1);
}
let open = 0;
let end = start;
for (let i = start; i < outputLines.length; i++) {
  if (outputLines[i].includes('{')) open += (outputLines[i].match(/{/g) || []).length;
  if (outputLines[i].includes('}')) open -= (outputLines[i].match(/}/g) || []).length;
  if (i !== start && open === 0) { end = i; break; }
}
const hasComma = outputLines[end].trim().endsWith(',');

function buildScriptLines(obj, conflicts, trailingComma) {
  const lines = ['  "scripts": {'];
  const groups = [];

  for (const [k, v] of Object.entries(obj)) {
    groups.push([`"${k}": "${v}"`]);
  }

  for (const c of conflicts) {
    groups.push([
      '<<<<<<< HEAD',
      `"${c.key}": "${c.headVal}"`,
      '=======',
      `"${c.key}": "${c.incomingVal}"`,
      '>>>>>>> incoming'
    ]);
  }

  for (let gi = 0; gi < groups.length; gi++) {
    const group = groups[gi];
    for (let li = 0; li < group.length; li++) {
      let line = '    ' + group[li];
      if (gi < groups.length - 1 && li === group.length - 1) line += ',';
      lines.push(line);
    }
  }

  lines.push(trailingComma ? '  },' : '  }');
  return lines;
}

const newScriptLines = buildScriptLines(mergedJson.scripts, conflicts, hasComma);
outputLines.splice(start, end - start + 1, ...newScriptLines);

fs.writeFileSync(path, outputLines.join('\n') + '\n');

if (conflicts.length) {
  console.warn('Warning: unresolved script conflicts for keys: ' + conflicts.map(c => c.key).join(', '));
}
