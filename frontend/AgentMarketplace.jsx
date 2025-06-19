import React, { useEffect, useMemo, useState } from "react";
import agentMetadata from "../agents/agent-metadata.json";

export default function AgentMarketplace() {
  const [benchmarks, setBenchmarks] = useState({});
  const [category, setCategory] = useState("all");
  const [sortKey, setSortKey] = useState("popularity");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/logs/agent-benchmarks.json");
        const json = await res.json();
        if (Array.isArray(json)) {
          const map = {};
          json.forEach(entry => {
            map[entry.agent] = entry;
          });
          setBenchmarks(map);
        }
      } catch {
        setBenchmarks({});
      }
    };
    fetchData();
  }, []);

  const categories = useMemo(
    () => [...new Set(Object.values(agentMetadata).map(a => a.category).filter(Boolean))],
    []
  );

  const agents = useMemo(() => {
    return Object.entries(agentMetadata)
      .filter(([id, meta]) => category === "all" || meta.category === category)
      .sort(([idA, metaA], [idB, metaB]) => {
        const aBench = benchmarks[idA] || {};
        const bBench = benchmarks[idB] || {};
        if (sortKey === "popularity") {
          return (bBench.successRate || 0) - (aBench.successRate || 0);
        }
        if (sortKey === "recent") {
          return new Date(bBench.lastUsed || 0) - new Date(aBench.lastUsed || 0);
        }
        return metaA.name.localeCompare(metaB.name);
      });
  }, [category, sortKey, benchmarks]);

  const addToBuilder = id => {
    try {
      const saved = localStorage.getItem("agentPipeline");
      const pipeline = saved ? JSON.parse(saved) : [];
      if (!pipeline.some(p => p.id === id)) {
        pipeline.push({ id, params: {} });
        localStorage.setItem("agentPipeline", JSON.stringify(pipeline));
        setNotice("Added to builder");
      } else {
        setNotice("Already in builder");
      }
    } catch {
      setNotice("Failed to add");
    }
    setTimeout(() => setNotice(""), 2000);
  };

  return (
    <div className="p-6 text-white">
      <h1 className="text-3xl font-bold mb-4">Agent Marketplace</h1>
      <div className="flex gap-4 mb-4">
        <label>
          Category:
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
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
          Sort by:
          <select
            value={sortKey}
            onChange={e => setSortKey(e.target.value)}
            className="ml-2 p-1 rounded text-black"
          >
            <option value="popularity">Popularity</option>
            <option value="recent">Recent Use</option>
            <option value="name">Name</option>
          </select>
        </label>
      </div>
      {notice && <div className="mb-4 text-green-300">{notice}</div>}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agents.map(([id, meta]) => {
          const bench = benchmarks[id] || {};
          return (
            <div key={id} className="bg-white/10 p-4 rounded-lg">
              <h2 className="text-lg font-semibold mb-1">{meta.name}</h2>
              <p className="text-sm text-gray-300 mb-2">{meta.description}</p>
              <p className="text-xs text-gray-400 mb-1">Category: {meta.category}</p>
              {bench.successRate != null && (
                <p className="text-xs text-gray-400 mb-1">
                  Popularity: {(bench.successRate * 100).toFixed(0)}%
                </p>
              )}
              {bench.lastUsed && (
                <p className="text-xs text-gray-400 mb-2">
                  Last Used: {new Date(bench.lastUsed).toLocaleDateString()}
                </p>
              )}
              <button
                onClick={() => addToBuilder(id)}
                className="mt-2 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded"
              >
                Add to Builder
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
