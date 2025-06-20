import React, { useState, useEffect, useMemo } from "react";
import ReactFlow, { Background, Controls, MarkerType } from "reactflow";
import "reactflow/dist/style.css";
import agentMetadata from "../agents/agent-metadata.json";

export default function AgentBuilder() {
  const availableAgents = Object.entries(agentMetadata).map(([id, meta]) => ({
    id,
    name: meta.name,
    inputs: meta.inputs || {}
  }));

  const [pipeline, setPipeline] = useState(() => {
    try {
      const saved = localStorage.getItem("agentPipeline");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [logs, setLogs] = useState([]);
  const [running, setRunning] = useState(false);

  const collectDependencies = (id, visited = new Set()) => {
    if (visited.has(id)) return [];
    visited.add(id);
    const deps = agentMetadata[id]?.dependsOn || [];
    let result = [];
    deps.forEach(dep => {
      result = [...result, ...collectDependencies(dep, visited), dep];
    });
    return result;
  };

  const nodes = useMemo(
    () =>
      pipeline.map((step, idx) => {
        const meta = agentMetadata[step.id] || {};
        return {
          id: String(idx),
          data: { label: meta.name || step.id },
          position: { x: idx * 200, y: 0 }
        };
      }),
    [pipeline]
  );

  const edges = useMemo(() => {
    const arr = [];
    pipeline.forEach((step, idx) => {
      const deps = agentMetadata[step.id]?.dependsOn || [];
      deps.forEach(dep => {
        const depIdx = pipeline.findIndex(p => p.id === dep);
        if (depIdx !== -1) {
          arr.push({
            id: `${depIdx}-${idx}`,
            source: String(depIdx),
            target: String(idx),
            animated: true,
            markerEnd: { type: MarkerType.ArrowClosed }
          });
        }
      });
    });
    return arr;
  }, [pipeline]);

  useEffect(() => {
    localStorage.setItem("agentPipeline", JSON.stringify(pipeline));
  }, [pipeline]);

  const handleAgentDragStart = (e, id) => {
    e.dataTransfer.setData("agentId", id);
  };

  const handleAddDrop = e => {
    e.preventDefault();
    const id = e.dataTransfer.getData("agentId");
    if (!id) return;
    const newPipeline = [...pipeline];

    const addWithDeps = agentId => {
      const deps = collectDependencies(agentId);
      deps.forEach(dep => {
        if (!newPipeline.some(p => p.id === dep)) {
          newPipeline.push({ id: dep, params: {} });
        }
      });
      if (!newPipeline.some(p => p.id === agentId)) {
        newPipeline.push({ id: agentId, params: {} });
      }
    };

    addWithDeps(id);
    setPipeline(newPipeline);
  };

  const handlePipelineDragStart = (e, index) => {
    e.dataTransfer.setData("pipelineIndex", index.toString());
  };

  const handlePipelineDrop = (e, index) => {
    e.preventDefault();
    const from = parseInt(e.dataTransfer.getData("pipelineIndex"), 10);
    if (isNaN(from)) return;
    if (from === index) return;
    const newPipeline = [...pipeline];
    const [moved] = newPipeline.splice(from, 1);
    newPipeline.splice(index, 0, moved);
    setPipeline(newPipeline);
  };

  const updateParam = (stepIndex, key, value) => {
    const newPipeline = [...pipeline];
    newPipeline[stepIndex].params[key] = value;
    setPipeline(newPipeline);
  };

  const runPipeline = async () => {
    setRunning(true);
    setLogs([]);
    for (const step of pipeline) {
      setLogs(prev => [...prev, `Running ${step.id}...`]);
      try {
        const res = await fetch("/run-agent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ agent: step.id, input: step.params })
        });
        if (res.status === 403) {
          alert("You've reached your monthly limit.");
          setRunning(false);
          return;
        }
        const data = await res.json();
        if (data.error) {
          setLogs(prev => [...prev, `${step.id} error: ${data.error}`]);
        } else {
          setLogs(prev => [...prev, `${step.id} result: ${JSON.stringify(data.result)}`]);
        }
      } catch (err) {
        setLogs(prev => [...prev, `${step.id} failed: ${err.message}`]);
      }
    }
    setRunning(false);
  };

  return (
    <div className="p-6 text-white">
      <h1 className="text-3xl font-bold mb-4">Agent Builder</h1>
      <div className="flex gap-8">
        <div className="w-1/3">
          <h2 className="text-xl font-semibold mb-2">Available Agents</h2>
          <ul>
            {availableAgents.map(a => (
              <li
                key={a.id}
                className="p-2 mb-2 bg-white/10 rounded cursor-move"
                draggable
                onDragStart={e => handleAgentDragStart(e, a.id)}
              >
                {a.name}
              </li>
            ))}
          </ul>
        </div>
        <div
          className="flex-1 min-h-[200px] p-4 bg-white/5 rounded"
          onDragOver={e => e.preventDefault()}
          onDrop={handleAddDrop}
        >
          <h2 className="text-xl font-semibold mb-2">Workflow Pipeline</h2>
          {pipeline.length === 0 && <p className="text-gray-400">Drag agents here</p>}
          {pipeline.map((step, idx) => {
            const meta = availableAgents.find(a => a.id === step.id);
            return (
              <div
                key={idx}
                className="mb-4 p-2 bg-white/10 rounded"
                draggable
                onDragStart={e => handlePipelineDragStart(e, idx)}
                onDrop={e => handlePipelineDrop(e, idx)}
                onDragOver={e => e.preventDefault()}
              >
                <div className="font-semibold mb-1">{meta ? meta.name : step.id}</div>
                {meta &&
                  Object.keys(meta.inputs).map(key => (
                    <input
                      key={key}
                      type="text"
                      placeholder={key}
                      value={step.params[key] || ""}
                      onChange={e => updateParam(idx, key, e.target.value)}
                      className="mb-1 w-full p-1 rounded bg-white/20"
                    />
                  ))}
              </div>
            );
          })}
        </div>
      </div>
      {pipeline.length > 0 && (
        <div className="h-64 my-4 bg-white/10 rounded">
          <ReactFlow nodes={nodes} edges={edges} fitView>
            <Background />
            <Controls />
          </ReactFlow>
        </div>
      )}
      {pipeline.length > 0 && (
        <div className="mt-4">
          <button
            onClick={runPipeline}
            disabled={running}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            {running ? "Running..." : "Run Workflow"}
          </button>
        </div>
      )}
      {logs.length > 0 && (
        <pre className="mt-4 bg-black/40 p-2 rounded text-green-300 whitespace-pre-wrap max-h-60 overflow-y-auto">
          {logs.join("\n")}
        </pre>
      )}
    </div>
  );
}
