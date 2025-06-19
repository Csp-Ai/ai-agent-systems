import React, { useEffect, useRef, useState } from 'react';

function generateDemoData() {
  return [
    { agent: 'demo-agent-1', name: 'Demo Agent 1', category: 'Demo', avgResponseTime: 1000, successRate: 0.9, lastUsed: new Date().toISOString() },
    { agent: 'demo-agent-2', name: 'Demo Agent 2', category: 'Demo', avgResponseTime: 800, successRate: 0.95, lastUsed: new Date().toISOString() },
  ];
}

export default function AgentBenchmark() {
  const [data, setData] = useState([]);
  const [category, setCategory] = useState('all');
  const [sortKey, setSortKey] = useState('name');
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/logs/agent-benchmarks.json');
        const json = await res.json();
        if (Array.isArray(json)) setData(json);
        else setData(generateDemoData());
      } catch {
        setData(generateDemoData());
      }
    };
    fetchData();
  }, []);

  const categories = Array.from(new Set(data.map(d => d.category).filter(Boolean)));

  const filtered = data
    .filter(d => (category === 'all' ? true : d.category === category))
    .sort((a, b) => {
      if (sortKey === 'lastUsed') return new Date(b.lastUsed) - new Date(a.lastUsed);
      if (sortKey === 'avgResponseTime') return a.avgResponseTime - b.avgResponseTime;
      if (sortKey === 'successRate') return b.successRate - a.successRate;
      return a.name.localeCompare(b.name);
    });

  useEffect(() => {
    if (!chartRef.current) return;
    const labels = filtered.map(d => d.name);
    const respTimes = filtered.map(d => d.avgResponseTime);
    const successRates = filtered.map(d => d.successRate * 100);

    const ctx = chartRef.current.getContext('2d');
    if (chartInstance.current) chartInstance.current.destroy();
    chartInstance.current = new window.Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Avg Response Time (ms)',
            data: respTimes,
            backgroundColor: 'rgba(59, 130, 246, 0.5)',
            borderColor: 'rgb(59, 130, 246)',
            borderWidth: 1,
          },
          {
            label: 'Success Rate (%)',
            data: successRates,
            backgroundColor: 'rgba(16, 185, 129, 0.5)',
            borderColor: 'rgb(16, 185, 129)',
            borderWidth: 1,
            type: 'line',
            yAxisID: 'y1',
          },
        ],
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            title: { display: true, text: 'Milliseconds' },
          },
          y1: {
            beginAtZero: true,
            position: 'right',
            grid: { drawOnChartArea: false },
            title: { display: true, text: 'Success %' },
            ticks: { callback: val => val + '%' },
          },
        },
      },
    });
  }, [filtered]);

  return (
    <div className="p-6 text-white">
      <h1 className="text-2xl font-bold mb-4">Agent Benchmarking</h1>
      <div className="flex gap-4 mb-4">
        <label className="flex items-center gap-2">
          Category:
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="p-1 rounded text-black"
          >
            <option value="all">All</option>
            {categories.map(c => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2">
          Sort by:
          <select
            value={sortKey}
            onChange={e => setSortKey(e.target.value)}
            className="p-1 rounded text-black"
          >
            <option value="name">Name</option>
            <option value="avgResponseTime">Avg Response Time</option>
            <option value="successRate">Success Rate</option>
            <option value="lastUsed">Last Used</option>
          </select>
        </label>
      </div>
      <div className="mb-6">
        <canvas ref={chartRef} />
      </div>
      <div className="overflow-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left">
              <th className="p-2">Agent</th>
              <th className="p-2">Category</th>
              <th className="p-2">Avg Response Time (ms)</th>
              <th className="p-2">Success Rate</th>
              <th className="p-2">Last Used</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(a => (
              <tr key={a.agent} className="border-t border-white/20">
                <td className="p-2">{a.name}</td>
                <td className="p-2">{a.category}</td>
                <td className="p-2">{a.avgResponseTime}</td>
                <td className="p-2">{Math.round(a.successRate * 100)}%</td>
                <td className="p-2">{new Date(a.lastUsed).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
