const fetch = global.fetch || require('node-fetch');

async function translateText(text, target) {
  try {
    const res = await fetch('https://libretranslate.de/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: text, source: 'en', target, format: 'text' })
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const data = await res.json();
    return data.translatedText || text;
  } catch (err) {
    console.error('Translation API error:', err.message);
    return text;
  }
}

module.exports = { translateText };
