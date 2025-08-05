const express = require('express');

/**
 * Translation utilities and endpoints using LibreTranslate.
 */
const LT_URL = process.env.TRANSLATE_URL || 'https://libretranslate.de';
const LT_KEY = process.env.TRANSLATE_KEY || '';

async function translateText(text, target, source = 'en') {
  try {
    const resp = await fetch(`${LT_URL}/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: text, target, source, api_key: LT_KEY }),
    });
    const data = await resp.json();
    return data.translatedText || text;
  } catch {
    return text;
  }
}

async function translateOutput(output, target) {
  if (!target || target.toLowerCase().startsWith('en')) return output;
  if (typeof output === 'string') {
    return await translateText(output, target);
  }
  if (Array.isArray(output)) {
    const arr = [];
    for (const item of output) arr.push(await translateOutput(item, target));
    return arr;
  }
  if (output && typeof output === 'object') {
    const obj = {};
    for (const key of Object.keys(output)) {
      obj[key] = await translateOutput(output[key], target);
    }
    return obj;
  }
  return output;
}

async function handleTranslate(req, res) {
  const { text, target, source } = req.body || {};
  if (!text || !target) {
    return res.status(400).json({ error: 'text and target are required' });
  }
  try {
    const resp = await fetch(`${LT_URL}/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: text, target, source, api_key: LT_KEY }),
    });
    const data = await resp.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Translation failed' });
  }
}

const router = express.Router();
router.post('/translate', handleTranslate);

module.exports = {
  router,
  translateOutput,
  handleTranslate,
};
