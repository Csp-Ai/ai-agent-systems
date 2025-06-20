import React, { useState, useEffect } from "react";

export default function AgentsGallery() {
  const [agents, setAgents] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [selectedAgents, setSelectedAgents] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [output, setOutput] = useState(null);
  const [workflowOutput, setWorkflowOutput] = useState([]);

  useEffect(() => {
    const loadAgents = async () => {
      try {
        const res = await fetch('/registered-agents');
        const data = await res.json();
        if (Array.isArray(data)) setAgents(data.map(a => ({ id: a.agentId, name: a.displayName, description: a.description })));
      } catch {
        setAgents([]);
      }
    };
    loadAgents();
  }, []);

  const runDemo = async () => {
    if (!selectedAgent) return;
    const res = await fetch("/run-agent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        agent: selectedAgent.id,
        input: { text: inputValue || "Test input" }
      })
    });
    if (res.status === 403) {
      alert("You've reached your monthly limit.");
      return;
    }
    const result = await res.json();
    setOutput(result.response || result.error);
  };

  const toggleAgent = (agent) => {
    setWorkflowOutput([]);
    setSelectedAgents((prev) =>
      prev.some((a) => a.id === agent.id)
        ? prev.filter((a) => a.id !== agent.id)
        : [...prev, agent]
    );
  };

  const runWorkflow = async () => {
    const outputs = [];
    for (const agent of selectedAgents) {
      try {
        const res = await fetch("/run-agent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            agent: agent.id,
            input: { text: inputValue || "Test input" },
          }),
        });
        if (res.status === 403) {
          alert("You've reached your monthly limit.");
          return;
        }
        const result = await res.json();
        outputs.push({
          agent: agent.name,
          output: result.result || result.response || result.error,
        });
      } catch (err) {
        outputs.push({ agent: agent.name, output: err.message });
      }
    }
    setWorkflowOutput(outputs);
  };

  return (
    <div className="p-6 text-white">
      <h1 className="text-4xl font-bold mb-8">View Our Agents</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {agents.map(agent => (
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
              onClick={() => {
                setSelectedAgent(agent);
                setOutput(null);
              }}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            >
              Try Demo
            </button>
          </div>
        ))}
      </div>

      {selectedAgents.length > 0 && (
        <div className="mt-6">
          <button
            onClick={runWorkflow}
            className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded"
          >
            Run Workflow
          </button>
        </div>
      )}

      {selectedAgent && (
        <div className="mt-12 p-6 bg-white/10 rounded-xl border border-white/20">
          <h2 className="text-2xl font-semibold mb-4">Demo: {selectedAgent.name}</h2>
          <p className="text-gray-300 mb-2">{selectedAgent.description}</p>
          <input
            type="text"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            className="w-full p-2 rounded bg-white/20 border border-white/30 text-white placeholder-gray-400 mb-4"
            placeholder="Enter test input (optional)"
          />
          <div className="flex gap-4">
            <button
              onClick={runDemo}
              className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded text-white"
            >
              Run Agent
            </button>
            <button
              onClick={() => setSelectedAgent(null)}
              className="border border-white/30 px-4 py-2 rounded text-white hover:bg-white/10"
            >
              Close
            </button>
          </div>
          {output && (
            <div className="mt-6 bg-black/30 p-4 rounded-lg text-sm text-green-300 whitespace-pre-wrap">
              {typeof output === "string" ? output : JSON.stringify(output, null, 2)}
            </div>
          )}
        </div>
      )}

      {workflowOutput.length > 0 && (
        <div className="mt-12 p-6 bg-white/10 rounded-xl border border-white/20">
          <h2 className="text-2xl font-semibold mb-4">Workflow Output</h2>
          {workflowOutput.map(res => (
            <div key={res.agent} className="mb-6">
              <h3 className="text-lg font-semibold mb-2">{res.agent}</h3>
              <pre className="bg-black/30 p-4 rounded text-sm text-green-300 whitespace-pre-wrap">
                {typeof res.output === "string" ? res.output : JSON.stringify(res.output, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
