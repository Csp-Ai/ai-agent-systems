import React, { useEffect, useState } from 'react';
import AgentTracker from './AgentTracker.jsx';

const workflows = {
  market: {
    name: 'AI Market Analysis',
    steps: ['website-scanner-agent', 'data-analyst-agent', 'insights-agent'],
    inputs: { company: 'Acme Corp', url: 'https://example.com' }
  },
  sales: {
    name: 'Sales Outreach Draft',
    steps: ['insights-agent', 'report-generator-agent'],
    inputs: { product: 'AI Widget', audience: 'Retailers' }
  },
  content: {
    name: 'Content Plan',
    steps: ['website-scanner-agent', 'insights-agent', 'report-generator-agent'],
    inputs: { topic: 'AI Trends', audience: 'Executives' }
  }
};

const sampleOutputs = {
  'website-scanner-agent': 'Scanned website and extracted key metadata.',
  'data-analyst-agent': 'Analyzed competitors and market positioning.',
  'insights-agent': 'Generated actionable insights based on findings.',
  'report-generator-agent': 'Compiled summary report for review.'
};

export default function DemoPage() {
  const [agents, setAgents] = useState([]);
  const [flow, setFlow] = useState('market');
  const [inputs, setInputs] = useState(workflows['market'].inputs);
  const [status, setStatus] = useState([]);
  const [results, setResults] = useState([]);

  useEffect(() => {
    fetch('/demo-agents')
      .then(r => r.json())
      .then(setAgents)
      .catch(() => setAgents([]));
  }, []);

  useEffect(() => {
    setInputs(workflows[flow].inputs);
  }, [flow]);

  const runDemo = () => {
    const steps = workflows[flow].steps;
    setStatus(steps.map((_, i) => (i === 0 ? 'active' : 'pending')));
    setResults([]);
    let idx = 0;
    const next = () => {
      if (idx >= steps.length) {
        fetch('/logs/demo-sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ workflow: flow, inputs })
        }).catch(() => {});
        return;
      }
      const agent = steps[idx];
      setTimeout(() => {
        setResults(r => [...r, { agent, output: sampleOutputs[agent] || 'Demo output' }]);
        setStatus(s => {
          const copy = [...s];
          copy[idx] = 'completed';
          if (idx + 1 < copy.length) copy[idx + 1] = 'active';
          return copy;
        });
        idx++;
        next();
      }, 600);
    };
    next();
  };

  const updateInput = (key, value) => setInputs(i => ({ ...i, [key]: value }));

  const flowData = workflows[flow];

  return (
    <div className="min-h-screen bg-gray-50 p-6 space-y-6">
      <h1 className="text-3xl font-bold text-center">Investor Demo Sandbox</h1>
      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-1/3 space-y-4">
          <select
            className="w-full p-2 rounded border"
            value={flow}
            onChange={e => setFlow(e.target.value)}
          >
            {Object.entries(workflows).map(([k, v]) => (
              <option key={k} value={k}>{v.name}</option>
            ))}
          </select>
          {Object.entries(inputs).map(([k, v]) => (
            <input
              key={k}
              value={v}
              onChange={e => updateInput(k, e.target.value)}
              className="w-full p-2 rounded border"
              placeholder={k}
            />
          ))}
          <button
            onClick={runDemo}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white p-2 rounded"
          >
            Run Simulation
          </button>
        </div>
        <div className="md:flex-1 space-y-4">
          <AgentTracker steps={flowData.steps} status={status} />
          {results.map((r, i) => (
            <div key={i} className="bg-white rounded shadow p-4">
              <h3 className="font-semibold mb-2">{r.agent}</h3>
              <pre className="text-sm whitespace-pre-wrap">{r.output}</pre>
            </div>
          ))}
        </div>
      </div>
      <div className="text-center space-x-4">
        <a href="/book" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">Book Demo</a>
        <a href="/waitlist" className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded">Join Waitlist</a>
        <a href="/dashboard" className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded">See Full Stack</a>
      </div>
      <p className="text-center text-sm text-gray-500">
        <a href="/docs/executive-summary.md" className="underline">Executive Summary</a>
      </p>
    </div>
  );
}
