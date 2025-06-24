import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AgentsPage() {
  const [agents, setAgents] = useState([]);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({});
  const [output, setOutput] = useState(null);

  useEffect(() => {
    fetch('/agents.json')
      .then(r => r.json())
      .then(setAgents)
      .catch(() => setAgents([]));
  }, []);

  const open = (agent) => {
    setSelected(agent);
    setForm({ ...(agent.defaultInputs || {}) });
    setOutput(null);
  };

  const run = async () => {
    if (!selected) return;
    const res = await fetch('/run-agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agent: selected.id, input: form })
    });
    const data = await res.json();
    setOutput(data.result || data.response || data.error);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Agent Library</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {agents.map(a => (
          <div key={a.id} className="border rounded p-4 space-y-2">
            <div className="font-semibold">{a.name}</div>
            <div className="text-xs text-gray-500">{a.category}</div>
            <p className="text-sm">{a.summary}</p>
            <button onClick={() => open(a)} className="text-sm text-blue-600 underline">
              Run Now
            </button>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {selected && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
            <div className="absolute inset-0 bg-black/50" onClick={() => setSelected(null)}></div>
            <motion.div className="relative bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl z-50 max-w-sm w-full" initial={{scale:0.9, opacity:0}} animate={{scale:1, opacity:1}} exit={{scale:0.9, opacity:0}}>
              <h2 className="font-semibold mb-2">{selected.name}</h2>
              {Object.keys(form).map(key => (
                <input
                  key={key}
                  className="border w-full p-2 text-sm mb-2 rounded"
                  value={form[key]}
                  onChange={e => setForm({ ...form, [key]: e.target.value })}
                />
              ))}
              <div className="flex gap-2 mt-2">
                <button onClick={run} className="bg-blue-600 text-white px-3 py-1 rounded text-sm">Run</button>
                <button onClick={() => setSelected(null)} className="text-sm underline">Close</button>
              </div>
              {output && (
                <pre className="mt-4 text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded whitespace-pre-wrap">{typeof output === 'string' ? output : JSON.stringify(output, null, 2)}</pre>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
