import React, { useState } from 'react';
import AgentTracker from './AgentTracker.jsx';
import OutputToolbar from '../OutputToolbar.jsx';

const flows = {
  sales: ['leads-agent', 'outreach-agent', 'followup-agent', 'dealtracker-agent'],
  marketing: ['trendwatch-agent', 'ad-copy-agent', 'brand-consistency-agent', 'seo-agent'],
  ops: ['insights-agent', 'anomaly-agent', 'forecast-agent']
};

export default function DepartmentSimulators() {
  const [department, setDepartment] = useState('sales');
  const [inputValue, setInputValue] = useState('');
  const [orgId, setOrgId] = useState('');
  const [log, setLog] = useState([]);
  const [status, setStatus] = useState([]);
  const [running, setRunning] = useState(false);

  const runFlow = async () => {
    const agents = flows[department] || [];
    if (!orgId || agents.length === 0 || running) return;
    setRunning(true);
    setStatus(agents.map((_, i) => (i === 0 ? 'active' : 'pending')));
    const entries = [];
    let current = { text: inputValue || 'test' };
    for (let i = 0; i < agents.length; i++) {
      const name = agents[i];
      try {
        const res = await fetch('/run-agent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ agent: name, input: current })
        });
        const data = await res.json();
        const success = !data.error;
        entries.push({ agent: name, input: current, output: success ? (data.result || data.response) : data.error, success });
        setStatus(s => {
          const copy = [...s];
          copy[i] = success ? 'completed' : 'failed';
          if (success && i + 1 < copy.length) copy[i + 1] = 'active';
          return copy;
        });
        if (!success) break;
        current = data.result || data.response || {};
      } catch (err) {
        entries.push({ agent: name, input: current, error: err.message, success: false });
        setStatus(s => {
          const copy = [...s];
          copy[i] = 'failed';
          return copy;
        });
        break;
      }
    }
    setLog(entries);
    const ts = Date.now().toString();
    try {
      await fetch('/logs/simulations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId, timestamp: ts, agents, log: entries })
      });
    } catch {
      // ignore write errors
    }
    setRunning(false);
  };

  const agents = flows[department] || [];

  return (
    <div className="p-4 space-y-4 text-white">
      <div className="flex flex-col sm:flex-row gap-2">
        <select value={department} onChange={e => setDepartment(e.target.value)} className="p-2 rounded text-black">
          <option value="sales">Sales</option>
          <option value="marketing">Marketing</option>
          <option value="ops">Ops</option>
        </select>
        <input
          placeholder="Org ID"
          value={orgId}
          onChange={e => setOrgId(e.target.value)}
          className="p-2 rounded text-black flex-1"
        />
        <input
          placeholder="Initial Input"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          className="p-2 rounded text-black flex-1"
        />
        <button onClick={runFlow} disabled={running} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
          {running ? 'Running...' : 'Run'}
        </button>
      </div>
      {agents.length > 0 && <AgentTracker steps={agents} status={status} />}
      {log.length > 0 && (
        <>
          <pre className="bg-black/60 p-3 rounded-lg text-green-400 font-mono text-xs whitespace-pre-wrap">
            {JSON.stringify({ agents, log }, null, 2)}
          </pre>
          <OutputToolbar content={JSON.stringify({ agents, log }, null, 2)} />
        </>
      )}
    </div>
  );
}

