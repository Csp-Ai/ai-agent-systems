import React, { useEffect, useMemo, useState } from 'react';
import ReactFlow, { Background, Controls } from 'reactflow';
import 'reactflow/dist/style.css';

export default function AgentOrgChart() {
  const [metadata, setMetadata] = useState({});
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [enabledFilter, setEnabledFilter] = useState('all');

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const res = await fetch('/agents/agent-metadata.json');
        const data = await res.json();
        setMetadata(data);
      } catch {
        setMetadata({});
      }
    };
    fetchMetadata();
  }, []);

  const categories = useMemo(
    () => [...new Set(Object.values(metadata).map(m => m.category).filter(Boolean))],
    [metadata]
  );

  const filteredAgents = useMemo(
    () =>
      Object.entries(metadata).filter(([id, meta]) => {
        if (categoryFilter !== 'all' && meta.category !== categoryFilter) return false;
        if (enabledFilter === 'enabled' && !meta.enabled) return false;
        if (enabledFilter === 'disabled' && meta.enabled) return false;
        return true;
      }),
    [metadata, categoryFilter, enabledFilter]
  );

  const nodes = useMemo(
    () =>
      filteredAgents.map(([id, meta], idx) => ({
        id,
        data: { label: <div title={meta.description}>{meta.name}</div> },
        position: { x: idx * 250, y: 0 },
        style: { padding: 10, borderRadius: 4, background: meta.enabled ? '#fff' : '#f8d7da' }
      })),
    [filteredAgents]
  );

  const edges = useMemo(() => {
    const arr = [];
    filteredAgents.forEach(([id, meta]) => {
      if (meta.inputs && meta.inputs.results) {
        filteredAgents.forEach(([other]) => {
          if (other !== id) {
            arr.push({ id: `${other}-${id}`, source: other, target: id, animated: true });
          }
        });
      }
    });
    return arr;
  }, [filteredAgents]);

  return (
    <div className="h-[600px] w-full">
      <div className="flex gap-4 mb-4">
        <label>
          Category:
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="ml-2 p-1 rounded text-black"
          >
            <option value="all">All</option>
            {categories.map(c => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label>
          Status:
          <select
            value={enabledFilter}
            onChange={e => setEnabledFilter(e.target.value)}
            className="ml-2 p-1 rounded text-black"
          >
            <option value="all">All</option>
            <option value="enabled">Enabled</option>
            <option value="disabled">Disabled</option>
          </select>
        </label>
      </div>
      <ReactFlow nodes={nodes} edges={edges} fitView>
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}
