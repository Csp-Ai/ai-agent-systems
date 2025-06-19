import React, { useEffect, useRef, useState } from 'react';

export default function AgentSuccessOverlay({ agentId, onClose }) {
  const [data, setData] = useState(null);
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (!agentId) return;
    const fetchData = async () => {
      try {
        const res = await fetch('/logs/agent-benchmarks.json');
        const json = await res.json();
        if (Array.isArray(json)) {
          const entry = json.find(d => d.agent === agentId);
          setData(entry || null);
        }
      } catch {
        setData(null);
      }
    };
    fetchData();
  }, [agentId]);

  useEffect(() => {
    if (!data || !chartRef.current) return;
    const ctx = chartRef.current.getContext('2d');
    if (chartInstance.current) chartInstance.current.destroy();
    const randomTrend = Array.from({ length: 7 }, () =>
      Math.max(0, data.successRate * 100 + Math.round((Math.random() - 0.5) * 10))
    );
    chartInstance.current = new window.Chart(ctx, {
      type: 'line',
      data: {
        labels: randomTrend.map((_, i) => i + 1),
        datasets: [
          {
            label: 'Success %',
            data: randomTrend,
            backgroundColor: 'rgba(16,185,129,0.3)',
            borderColor: 'rgb(16,185,129)',
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        scales: {
          y: { beginAtZero: true, max: 100 },
        },
        plugins: { legend: { display: false } },
      },
    });
  }, [data]);

  if (!agentId || !data) return null;

  return (
    <div className="fixed top-0 right-0 w-72 bg-gray-800 text-white p-4 border border-white/20 shadow-lg z-50">
      <button onClick={onClose} className="float-right text-white">✕</button>
      <h2 className="text-lg font-semibold mb-2">{data.name}</h2>
      <p className="text-sm mb-1">Avg Response Time: {data.avgResponseTime}ms</p>
      <p className="text-sm mb-1">Success Rate: {Math.round(data.successRate * 100)}%</p>
      <p className="text-sm mb-2">Last Run: {new Date(data.lastUsed).toLocaleString()}</p>
      <canvas ref={chartRef} height="100" />
    </div>
  );
}
