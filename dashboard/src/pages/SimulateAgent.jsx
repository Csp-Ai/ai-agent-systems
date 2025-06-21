import { useState } from 'react';
import AgentNetworkMap from '../components/AgentNetworkMap';

export default function SimulateAgent() {
  const [logs, setLogs] = useState([]);
  const agents = ['forecast-agent', 'trends-agent', 'ops-agent', 'sales-agent'];
  const [open, setOpen] = useState(true);

  const addLog = () => {
    const a = agents[Math.floor(Math.random() * agents.length)];
    const b = agents[Math.floor(Math.random() * agents.length)];
    setLogs(l => [...l, `[${a}] sent data to [${b}]`]);
  };

  return (
    <div className="p-4 h-full relative">
      <button onClick={() => setOpen(o => !o)} className="mb-2 bg-gray-700 text-white px-2 py-1 rounded">
        {open ? 'Hide' : 'Show'} Network
      </button>
      <button onClick={addLog} className="ml-2 bg-green-600 text-white px-2 py-1 rounded">Test Event</button>
      {open && (
        <div className="absolute inset-0 bg-gray-900/80">
          <AgentNetworkMap agents={agents} logMessages={logs} />
        </div>
      )}
    </div>
  );
}
