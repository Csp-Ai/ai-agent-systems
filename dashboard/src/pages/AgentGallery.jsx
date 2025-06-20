import { useEffect, useState } from 'react';
import AgentDetailsModal from '../components/AgentDetailsModal';
import { useOrg } from '../OrgContext';

export default function AgentGallery() {
  const [agents, setAgents] = useState([]);
  const [active, setActive] = useState(null);
  const { orgId } = useOrg();

  useEffect(() => {
    fetch('/agents/agent-metadata.json')
      .then(res => res.json())
      .then(data => {
        const list = Object.entries(data).map(([id, meta]) => ({ id, ...meta }));
        setAgents(list);
      })
      .catch(() => setAgents([]));
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Agent Systems Gallery</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map(a => (
          <div
            key={a.id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transform hover:-translate-y-1 transition"
          >
            <div className="p-4 flex items-start">
              <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mr-3">
                <span className="text-xl">🤖</span>
              </div>
              <div className="flex-1">
                <h3 className="font-medium">{a.name || a.id}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {a.description}
                </p>
              </div>
              <span
                className={`ml-2 w-3 h-3 rounded-full ${a.enabled ? 'bg-green-500' : 'bg-yellow-500'}`}
              />
            </div>
            <ul className="px-4 pb-2 list-disc list-inside text-sm text-gray-600 dark:text-gray-300">
              <li>Category: {a.category}</li>
              <li>Lifecycle: {a.lifecycle}</li>
              <li>Version: {a.version}</li>
            </ul>
            <div className="px-4 pb-4 flex gap-2">
              <button
                onClick={() => setActive(a)}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white text-sm px-2 py-1 rounded"
              >
                Learn More
              </button>
              <button
                onClick={() => setActive(a)}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white text-sm px-2 py-1 rounded"
              >
                Test Agent
              </button>
            </div>
          </div>
        ))}
      </div>
      {active && (
        <AgentDetailsModal agent={active} orgId={orgId} onClose={() => setActive(null)} />
      )}
    </div>
  );
}
