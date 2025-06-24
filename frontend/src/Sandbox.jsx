import React, { useEffect, useState } from 'react';
import FlowVisualizer from '../../components/FlowVisualizer.jsx';

export default function Sandbox() {
  const [flows, setFlows] = useState([]);
  const [flowId, setFlowId] = useState('');
  const [result, setResult] = useState(null);

  useEffect(() => {
    fetch('/flows')
      .then(r => r.json())
      .then(setFlows)
      .catch(() => setFlows([]));
  }, []);

  useEffect(() => {
    if (flows.length && !flowId) setFlowId(flows[0]);
  }, [flows, flowId]);

  const run = async () => {
    if (!flowId) return;
    const res = await fetch('/run-flow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ flowId, userId: 'dev-sandbox' })
    });
    const data = await res.json();
    setResult(data);
  };

  return (
    <div className="p-6 space-y-4 text-white">
      <h1 className="text-2xl font-bold">Flow Sandbox</h1>
      <div className="flex items-center gap-2">
        <select
          value={flowId}
          onChange={e => setFlowId(e.target.value)}
          className="p-2 rounded text-black"
        >
          {flows.map(f => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
        <button onClick={run} className="bg-blue-600 text-white px-3 py-1 rounded">
          Run Test
        </button>
      </div>
      {flowId && <FlowVisualizer flowId={flowId} userId="dev-sandbox" />}
      {result?.steps && (
        <div className="space-y-2">
          {result.steps.map((s, i) => (
            <details key={i} className="bg-white/10 p-2 rounded">
              <summary className="cursor-pointer">
                {s.agent} - {s.success ? '✅' : '❌'}
              </summary>
              {s.explanation && (
                <pre className="text-xs mt-2 whitespace-pre-wrap">
                  {s.explanation}
                </pre>
              )}
              {s.output && (
                <pre className="text-xs mt-2 whitespace-pre-wrap">
                  {typeof s.output === 'string'
                    ? s.output
                    : JSON.stringify(s.output, null, 2)}
                </pre>
              )}
              {s.error && (
                <div className="text-red-400 text-xs mt-2">{s.error}</div>
              )}
            </details>
          ))}
        </div>
      )}
    </div>
  );
}
