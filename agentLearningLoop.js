const fs = require('fs');
const path = require('path');

const profilesPath = path.join(__dirname, 'agents', 'metadata', 'agent-profiles.json');
const profiles = JSON.parse(fs.readFileSync(profilesPath, 'utf8'));

async function fetchSource(src) {
  if (/^https?:\/\//.test(src)) {
    const res = await fetch(src).catch(err => ({ ok: false, statusText: err.message }));
    if (!res.ok) throw new Error(`Failed to fetch ${src}: ${res.statusText}`);
    return await res.text();
  }
  return fs.readFileSync(path.join(__dirname, src), 'utf8');
}

async function absorbKnowledge() {
  for (const [id, profile] of Object.entries(profiles)) {
    if (!profile.learningSources || !profile.learningSources.length) continue;
    const results = [];
    for (const src of profile.learningSources) {
      try {
        const data = await fetchSource(src);
        const snippet = data.replace(/\s+/g, ' ').slice(0, 500);
        results.push({ source: src, snippet });
      } catch (err) {
        results.push({ source: src, error: err.message });
      }
    }
    if (results.length) {
      const dir = path.join(__dirname, 'logs', 'agent-knowledge', id);
      fs.mkdirSync(dir, { recursive: true });
      const payload = { timestamp: new Date().toISOString(), results };
      const file = path.join(dir, `${Date.now()}.json`);
      fs.writeFileSync(file, JSON.stringify(payload, null, 2));
      fs.writeFileSync(path.join(dir, 'latest.json'), JSON.stringify(payload, null, 2));
      console.log(`Logged learnings for ${id}`);
    }
  }
}

if (require.main === module) {
  absorbKnowledge();
}

module.exports = { absorbKnowledge };
