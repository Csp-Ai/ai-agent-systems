import React, { useEffect, useState } from 'react';
import { auth } from './firebase';

export default function Gallery() {
  const params = new URLSearchParams(window.location.search);
  const [demoMode, setDemoMode] = useState(params.get('mode') === 'public-preview');
  const [agents, setAgents] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [output, setOutput] = useState(null);
  const [selectedAgents, setSelectedAgents] = useState([]);
  const [workflowOutput, setWorkflowOutput] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/agents/agent-metadata.json');
        const data = await res.json();
        const list = Object.entries(data).map(([id, meta]) => ({ id, ...meta }));
        setAgents(list);
      } catch {
        setAgents([]);
      }
    };
    load();
  }, []);

  const displayAgents = demoMode ? agents.filter(a => a.public) : agents;

  const runDemo = async () => {
    if (!selectedAgent) return;
    const res = await fetch('/run-agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agent: selectedAgent.id, input: { text: inputValue || 'Test input' } })
    });
    const result = await res.json();
    setOutput(result.response || result.error);
  };

  const toggleAgent = (agent) => {
    setWorkflowOutput([]);
    setSelectedAgents(prev => prev.some(a => a.id === agent.id)
      ? prev.filter(a => a.id !== agent.id)
      : [...prev, agent]
    );
  };

  const runWorkflow = async () => {
    const outputs = [];
    for (const agent of selectedAgents) {
      try {
        const res = await fetch('/run-agent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ agent: agent.id, input: { text: inputValue || 'Test input' } })
        });
        const result = await res.json();
        outputs.push({ agent: agent.name, output: result.result || result.response || result.error });
      } catch (err) {
        outputs.push({ agent: agent.name, output: err.message });
      }
    }
    setWorkflowOutput(outputs);
  };

  const notSignedIn = !auth.currentUser;

  return (
    <div className="p-6 text-white">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-4xl font-bold">Agents Gallery</h1>
        <label className="flex items-center gap-2 text-sm">
          <span>Demo Mode</span>
          <input
            type="checkbox"
            checked={demoMode}
            onChange={() => setDemoMode(!demoMode)}
            className="form-checkbox h-4 w-4 text-blue-500"
          />
        </label>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {displayAgents.map(agent => (
          demoMode ? (
            <div key={agent.id} className="bg-white/10 backdrop-blur p-6 rounded-xl border border-white/20">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">🤖</span>
                <h2 className="text-xl font-semibold">{agent.name}</h2>
              </div>
              <p className="text-gray-300 mb-4">{agent.description}</p>
              <p className="text-sm text-gray-400">v{agent.version || '1.0.0'}</p>
              <div className="mt-4 text-center text-blue-400">Sign In to Run This Agent</div>
            </div>
          ) : (
            <div key={agent.id} className="bg-white/10 backdrop-blur p-6 rounded-xl border border-white/20">
              <div className="flex items-start justify-between mb-2">
                <h2 className="text-xl font-semibold">{agent.name}</h2>
                <input
                  type="checkbox"
                  checked={selectedAgents.some(a => a.id === agent.id)}
                  onChange={() => toggleAgent(agent)}
                  className="form-checkbox h-4 w-4 text-blue-500"
                />
              </div>
              <p className="text-gray-300 mb-4">{agent.description}</p>
              <button
                onClick={() => { setSelectedAgent(agent); setOutput(null); }}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                disabled={notSignedIn}
              >
                {notSignedIn ? 'Sign In to Run' : 'Try Demo'}
              </button>
            </div>
          )
        ))}
      </div>

      {!demoMode && selectedAgents.length > 0 && (
        <div className="mt-6">
          <button onClick={runWorkflow} className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded" disabled={notSignedIn}>
            {notSignedIn ? 'Sign In to Run' : 'Run Workflow'}
          </button>
        </div>
      )}

      {!demoMode && selectedAgent && (
        <div className="mt-12 p-6 bg-white/10 rounded-xl border border-white/20">
          <h2 className="text-2xl font-semibold mb-4">Demo: {selectedAgent.name}</h2>
          <p className="text-gray-300 mb-2">{selectedAgent.description}</p>
          <input
            type="text"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            className="w-full p-2 rounded bg-white/20 border border-white/30 text-white placeholder-gray-400 mb-4"
            placeholder="Enter test input (optional)"
            disabled={notSignedIn}
          />
          <div className="flex gap-4">
            <button onClick={runDemo} className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded text-white" disabled={notSignedIn}>
              {notSignedIn ? 'Sign In to Run' : 'Run Agent'}
            </button>
            <button onClick={() => setSelectedAgent(null)} className="border border-white/30 px-4 py-2 rounded text-white hover:bg-white/10">
              Close
            </button>
          </div>
          {output && (
            <div className="mt-6 bg-black/30 p-4 rounded-lg text-sm text-green-300 whitespace-pre-wrap">
              {typeof output === 'string' ? output : JSON.stringify(output, null, 2)}
            </div>
          )}
        </div>
      )}

      {!demoMode && workflowOutput.length > 0 && (
        <div className="mt-12 p-6 bg-white/10 rounded-xl border border-white/20">
          <h2 className="text-2xl font-semibold mb-4">Workflow Output</h2>
          {workflowOutput.map(res => (
            <div key={res.agent} className="mb-6">
              <h3 className="text-lg font-semibold mb-2">{res.agent}</h3>
              <pre className="bg-black/30 p-4 rounded text-sm text-green-300 whitespace-pre-wrap">
                {typeof res.output === 'string' ? res.output : JSON.stringify(res.output, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
