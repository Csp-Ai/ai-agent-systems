import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Link } from 'react-router-dom';
import AgentDetailsModal from '../components/AgentDetailsModal';
import AddAgentForm from '../components/AddAgentForm';
import { useOrg } from '../OrgContext';
import { logAgentEvent } from '../utils/analytics';

export default function AgentGallery() {
  const [agents, setAgents] = useState([]);
  const [active, setActive] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const { orgId } = useOrg();
  const prefersReduced = useReducedMotion();

  const load = () => {
    fetch('/agents/agent-metadata.json')
      .then(res => res.json())
      .then(data => {
        const list = Object.entries(data).map(([id, meta]) => ({ id, ...meta }));
        setAgents(list);
      })
      .catch(() => setAgents([]));
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Agent Systems Gallery</h2>
        <button
          onClick={() => setShowAdd(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-1 rounded"
        >
          + Add Agent
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map(a => (
          <motion.div
            key={a.id}
            whileHover={prefersReduced ? {} : { scale: 1.05, rotate: -1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className="rounded border bg-slate-800 text-white shadow-md"
          >
            <div className="p-4 flex items-start">
              <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mr-3">
                <span className="text-xl">🤖</span>
              </div>
              <div className="flex-1">
                <h3 className="font-medium">{a.name || a.id}</h3>
                <p className="text-sm text-gray-300">
                  {a.description}
                </p>
              </div>
              <span className="text-xs px-2 py-0.5 rounded bg-gray-700">{a.status || 'idle'}</span>
            </div>
            <ul className="px-4 pb-2 list-disc list-inside text-sm text-gray-300">
              <li>Category: {a.category}</li>
              <li>Lifecycle: {a.lifecycle}</li>
              <li>Version: {a.version}</li>
            </ul>
            <div className="px-4 pb-4 flex gap-2">
  <Link
    to={`/agents/${a.id}`}
    onClick={() => { logAgentEvent(a, 'click'); setActive(a); }}
    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white text-sm px-2 py-1 rounded text-center"
  >
    View
  </Link>
              >
                Persona
              </Link>
              <button
                onClick={() => { logAgentEvent(a, 'click'); setActive(a); }}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white text-sm px-2 py-1 rounded"
              >
                Test Agent
              </button>
            </div>
          </motion.div>
        ))}
      </div>
      {active && (
        <AgentDetailsModal agent={active} orgId={orgId} onClose={() => setActive(null)} />
      )}
      {showAdd && (
        <AddAgentForm
          onClose={() => setShowAdd(false)}
          onAdded={load}
        />
      )}
    </div>
  );
}
