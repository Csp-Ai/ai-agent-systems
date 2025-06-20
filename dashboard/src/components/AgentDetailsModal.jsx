import { useState } from 'react';

export default function AgentDetailsModal({ agent, onClose, orgId }) {
  const [input, setInput] = useState('');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);

  const send = async () => {
    setLoading(true);
    setResponse(null);
    try {
      const res = await fetch('/simulate-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: agent.id, orgId, input })
      });
      const data = await res.json();
      setResponse(data.agentResponse || data.error);
    } catch (err) {
      setResponse(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-96 max-w-full p-6">
        <h3 className="text-lg font-semibold mb-2">{agent.name || agent.id}</h3>
        <p className="text-sm mb-2">{agent.description}</p>
        <ul className="list-disc list-inside text-sm mb-4">
          <li>Version: {agent.version}</li>
          <li>Last SOP Update: {agent.lastUpdated}</li>
          {agent.dependsOn && agent.dependsOn.length > 0 && (
            <li>Dependencies: {agent.dependsOn.join(', ')}</li>
          )}
          <li>Owner: {agent.createdBy}</li>
        </ul>
        <input
          className="w-full border rounded p-2 mb-3 text-sm dark:bg-gray-700"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Send a command"
        />
        <div className="flex gap-2 mb-2">
          <button
            onClick={send}
            disabled={loading}
            className="flex-1 bg-green-500 hover:bg-green-600 text-white text-sm px-2 py-1 rounded"
          >
            {loading ? 'Sending...' : 'Send'}
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-300 hover:bg-gray-400 text-sm rounded dark:bg-gray-600 dark:hover:bg-gray-500"
          >
            Close
          </button>
        </div>
        {response && (
          <div className="mt-2 text-sm bg-gray-100 dark:bg-gray-700 p-2 rounded">
            {response}
          </div>
        )}
      </div>
    </div>
  );
}
