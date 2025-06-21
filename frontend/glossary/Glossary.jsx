import React, { useState, useMemo } from 'react';

function fuzzyMatch(query, text) {
  let i = 0;
  query = query.toLowerCase();
  text = text.toLowerCase();
  for (const c of query) {
    i = text.indexOf(c, i);
    if (i === -1) return false;
    i++;
  }
  return true;
}

export default function Glossary({ agents = [] }) {
  const [search, setSearch] = useState('');

  const sorted = useMemo(() => {
    return [...agents].sort((a, b) => a.name.localeCompare(b.name));
  }, [agents]);

  const filtered = useMemo(() => {
    if (!search) return sorted;
    return sorted.filter(a =>
      fuzzyMatch(search, a.name) || fuzzyMatch(search, a.category || '')
    );
  }, [search, sorted]);

  const letters = useMemo(() => {
    return [...new Set(sorted.map(a => a.name[0].toUpperCase()))];
  }, [sorted]);

  const grouped = useMemo(() => {
    const map = {};
    for (const a of filtered) {
      const cat = a.category || 'Other';
      if (!map[cat]) map[cat] = [];
      map[cat].push(a);
    }
    Object.values(map).forEach(list => list.sort((a, b) => a.name.localeCompare(b.name)));
    return map;
  }, [filtered]);

  const seen = new Set();

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      <div className="max-w-5xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-4">Agent Glossary</h1>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search agents..."
          className="w-full p-2 border rounded mb-6"
        />
        <div className="flex">
          <div className="flex-1 space-y-6">
            {Object.keys(grouped).map(cat => (
              <div key={cat} className="mb-4">
                <h2 className="sticky top-0 bg-gray-100 py-1 font-semibold text-xl border-b border-gray-300">
                  {cat}
                </h2>
                {grouped[cat].map(agent => {
                  const letter = agent.name[0].toUpperCase();
                  const first = !seen.has(letter);
                  if (first) seen.add(letter);
                  return (
                    <div
                      key={agent.id}
                      id={first ? `letter-${letter}` : undefined}
                      className="py-2 border-b border-gray-200"
                    >
                      <h3 className="font-semibold text-lg">{agent.name}</h3>
                      <p className="text-sm mb-1">{agent.description}</p>
                      <a href={`/sops/${agent.id}.md`} className="text-blue-600 underline text-sm">
                        Full docs
                      </a>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
          <div className="ml-4 sticky top-20 hidden sm:block bg-white/60 rounded p-2 text-xs leading-5">
            {letters.map(l => (
              <a key={l} href={`#letter-${l}`} className="block px-1 hover:underline">
                {l}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
