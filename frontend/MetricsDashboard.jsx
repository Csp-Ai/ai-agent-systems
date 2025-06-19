import React, { useEffect, useRef, useState } from 'react';

export default function MetricsDashboard() {
  const [metrics, setMetrics] = useState({
    totalRuns: 0,
    avgSuccess: 0,
    emailDelivery: 0,
    dailyActive: 0,
    growth: []
  });
  const [lastSync, setLastSync] = useState(null);
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const benchRes = await fetch('/logs/agent-benchmarks.json');
        const benchmarks = await benchRes.json();
        const auditRes = await fetch('/logs/audit.json');
        const audit = await auditRes.json();

        const totalRuns = Array.isArray(audit) ? audit.length : 0;
        const avgSuccess = Array.isArray(benchmarks) && benchmarks.length
          ? benchmarks.reduce((sum, a) => sum + (a.successRate || 0), 0) / benchmarks.length
          : 0;
        const emailEntries = Array.isArray(audit)
          ? audit.filter(e => (e.agent || '').toLowerCase().includes('email'))
          : [];
        const emailSuccess = emailEntries.filter(e => !/fail/i.test(e.resultSummary || '')).length;
        const emailDelivery = emailEntries.length ? emailSuccess / emailEntries.length : 0;
        const now = Date.now();
        const lastDay = now - 86400000;
        const dailyActive = new Set(
          (Array.isArray(audit) ? audit : [])
            .filter(e => e.sessionId && e.timestamp && new Date(e.timestamp).getTime() >= lastDay)
            .map(e => e.sessionId)
        ).size;
        const growth = Array.from({ length: 7 }, (_, i) => {
          const day = new Date(now - (6 - i) * 86400000);
          const dStr = day.toISOString().split('T')[0];
          const count = (Array.isArray(audit) ? audit : []).filter(e => e.timestamp && e.timestamp.startsWith(dStr)).length;
          return { date: dStr, count };
        });

        setMetrics({ totalRuns, avgSuccess, emailDelivery, dailyActive, growth });
        setLastSync(new Date().toLocaleString());
      } catch {
        setMetrics({ totalRuns: 0, avgSuccess: 0, emailDelivery: 0, dailyActive: 0, growth: [] });
        setLastSync(new Date().toLocaleString());
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (!chartRef.current) return;
    const labels = metrics.growth.map(g => g.date.slice(5));
    const dataPoints = metrics.growth.map(g => g.count);
    const ctx = chartRef.current.getContext('2d');
    if (chartInstance.current) chartInstance.current.destroy();
    chartInstance.current = new window.Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Agent Runs',
            data: dataPoints,
            backgroundColor: 'rgba(59,130,246,0.5)',
            borderColor: 'rgb(59,130,246)',
            fill: false
          }
        ]
      },
      options: {
        responsive: true,
        scales: {
          y: { beginAtZero: true }
        },
        plugins: { legend: { display: false } }
      }
    });
  }, [metrics]);

  return (
    <div className="p-6 text-white">
      <h1 className="text-2xl font-bold mb-4">Platform Metrics</h1>
      <p className="text-xs mb-4">Last sync: {lastSync || 'Loading...'}</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white/10 p-4 rounded">
          <h2 className="text-sm">Total Agent Runs</h2>
          <p className="text-xl font-semibold">{metrics.totalRuns}</p>
        </div>
        <div className="bg-white/10 p-4 rounded">
          <h2 className="text-sm">Avg Success</h2>
          <p className="text-xl font-semibold">{(metrics.avgSuccess * 100).toFixed(1)}%</p>
        </div>
        <div className="bg-white/10 p-4 rounded">
          <h2 className="text-sm">Email Delivery</h2>
          <p className="text-xl font-semibold">{(metrics.emailDelivery * 100).toFixed(1)}%</p>
        </div>
        <div className="bg-white/10 p-4 rounded">
          <h2 className="text-sm">Daily Active Users</h2>
          <p className="text-xl font-semibold">{metrics.dailyActive}</p>
        </div>
      </div>
      <div className="mb-4">
        <canvas ref={chartRef} height="120" />
      </div>
    </div>
  );
}
