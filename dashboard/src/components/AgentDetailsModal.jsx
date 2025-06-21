import { useState, useEffect } from 'react';
import { auth } from '../firebase';
import { logAgentEvent } from '../utils/analytics';

export default function AgentDetailsModal({ agent, onClose, orgId }) {
  const [input, setInput] = useState('');
  const [response, setResponse] = useState(null);
  const [log, setLog] = useState([]);
  const [loading, setLoading] = useState(false);
  const [simulated, setSimulated] = useState(false);
  const openedAt = Date.now();

  const [showPanel, setShowPanel] = useState(false);
  const [sessionId] = useState(() => Math.random().toString(36).slice(2));

  useEffect(() => {
    if (response) setShowPanel(true);
  }, [response]);

  const trackAction = async action => {
    try {
      await fetch(`/logs/simulation-actions/${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
    } catch {
      // ignore
    }
  };

  const send = async () => {
    if (!auth.currentUser) {
      alert('Please sign in to run this agent.');
      return;
    }
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
      setLog(data.log || []);
      setSimulated(true);
      logAgentEvent(agent, 'simulate', Date.now() - openedAt);
    } catch (err) {
      setResponse(err.message);
    }
    setLoading(false);
  };

  const handleClose = () => {
    if (!simulated) {
      logAgentEvent(agent, 'abandon', Date.now() - openedAt);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 transition-opacity">
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
            onClick={handleClose}
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
        {log.length > 0 && (
          <div className="mt-2 bg-gray-800 text-gray-100 text-xs p-2 rounded max-h-40 overflow-auto whitespace-pre-wrap">
            {log.join('\n')}
          </div>
        )}
      </div>
      <div
        className={`fixed top-1/2 right-0 -translate-y-1/2 w-56 bg-white dark:bg-gray-800 border-l border-gray-300 dark:border-gray-700 shadow-lg p-4 transform transition-transform ${showPanel ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <h4 className="font-semibold mb-2">Next Steps</h4>
        <ul className="space-y-2 text-sm">
          <li>
            <button onClick={() => trackAction('save-pdf')} className="hover:underline">
              📄 Save this output as a PDF
            </button>
          </li>
          <li>
            <button onClick={() => trackAction('email-self')} className="hover:underline">
              📥 Email to myself
            </button>
          </li>
          <li>
            <button onClick={() => trackAction('add-workflow')} className="hover:underline">
              🧩 Add to a Workflow
            </button>
          </li>
          <li>
            <button onClick={() => trackAction('send-agent')} className="hover:underline">
              🛠 Send to another Agent
            </button>
          </li>
          <li>
            <button onClick={() => trackAction('feedback')} className="hover:underline">
              📝 Leave feedback on this result
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
}
