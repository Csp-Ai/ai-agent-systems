import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const CASES = [
  { key: 'ecommerce', label: '🛍 Ecommerce', desc: 'Optimize store operations and personalize the customer journey.' },
  { key: 'marketing', label: '📣 Marketing', desc: 'Automate campaigns and uncover engagement insights.' },
  { key: 'sales', label: '📊 Sales', desc: 'Streamline lead follow-up and close deals faster with AI.' },
  { key: 'finance', label: '🧾 Finance & Ops', desc: 'Stay on top of reporting and daily operations with smart automations.' },
  { key: 'custom', label: '🧠 Custom AI workflows', desc: 'Mix and match agents to build your own tailored automations.' },
];

const CATEGORY_MAP = {
  ecommerce: 'sales',
  marketing: 'marketing',
  sales: 'sales',
  finance: 'finance',
  custom: 'operations',
};

export default function UseCaseSelector() {
  const [active, setActive] = useState(null);
  const [agents, setAgents] = useState({});
  const [catalog, setCatalog] = useState({});

  useEffect(() => {
    fetch('/agents/agent-metadata.json')
      .then(res => res.json())
      .then(setAgents)
      .catch(() => setAgents({}));
    fetch('/agents/agent-catalog.json')
      .then(res => res.json())
      .then(setCatalog)
      .catch(() => setCatalog({}));
  }, []);

  const recommended = (key) => {
    const cat = CATEGORY_MAP[key];
    const ids = catalog[cat] || [];
    return ids.slice(0, 3).map(id => ({ id, ...agents[id] }));
  };

  const runSim = (keys) => {
    const ids = recommended(keys).map(a => a.id).join(',');
    window.location.href = `/gallery?agents=${encodeURIComponent(ids)}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center text-white p-6">
      <div className="w-full max-w-4xl">
        <h1 className="text-center text-4xl font-bold mb-8">What kind of work do you want to streamline today?</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {CASES.map(c => (
            <button
              key={c.key}
              onClick={() => setActive(c.key)}
              className={`rounded-xl p-5 border border-white/20 backdrop-blur hover:bg-white/10 transition ${active === c.key ? 'bg-white/10' : 'bg-white/5'}`}
            >
              <span className="text-2xl mr-2">{c.label.split(' ')[0]}</span>
              <span className="text-lg font-medium">{c.label.split(' ').slice(1).join(' ')}</span>
            </button>
          ))}
        </div>
        <AnimatePresence>
          {active && (
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-white/10 p-6 rounded-xl border border-white/20"
            >
              <h2 className="text-2xl font-semibold mb-2">
                {CASES.find(c => c.key === active).label}
              </h2>
              <p className="mb-4 text-gray-200">{CASES.find(c => c.key === active).desc}</p>
              <ul className="space-y-2 mb-4">
                {recommended(active).map(a => (
                  <li key={a.id} className="flex items-start">
                    <span className="mr-2">🤖</span>
                    <div>
                      <p className="font-medium">{a.name || a.id}</p>
                      <p className="text-sm text-gray-300">{a.description}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => runSim(active)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
              >
                Run Simulation
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

