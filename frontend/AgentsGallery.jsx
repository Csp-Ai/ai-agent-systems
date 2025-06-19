import React, { useState } from "react";

const agents = [
  {
    id: "insights-agent",
    name: "Content Insights Agent",
    description: "Analyzes content engagement and suggests improvements.",
    tags: ["Marketing", "Analytics"]
  },
  {
    id: "website-scanner-agent",
    name: "Website Scanner",
    description: "Scrapes and summarizes your website structure.",
    tags: ["Scraping", "Data Extraction"]
  },
  {
    id: "market-research-agent",
    name: "Market Research Agent",
    description: "Analyzes industry and competitor trends.",
    tags: ["Business", "Research"]
  }
];

export default function AgentsGallery() {
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const [output, setOutput] = useState(null);

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
    const result = await res.json();
    setOutput(result.response || result.error);
  };

  return (
    <div className="p-6 text-white">
      <h1 className="text-4xl font-bold mb-8">View Our Agents</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {agents.map(agent => (
          <div key={agent.id} className="bg-white/10 backdrop-blur p-6 rounded-xl border border-white/20">
            <h2 className="text-xl font-semibold mb-2">{agent.name}</h2>
            <p className="text-gray-300 mb-2">{agent.description}</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {agent.tags.map(tag => (
                <span
                  key={tag}
                  className="text-xs px-2 py-1 bg-blue-500/30 rounded-full text-blue-100"
                >
                  {tag}
                </span>
              ))}
            </div>
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
    </div>
  );
}
