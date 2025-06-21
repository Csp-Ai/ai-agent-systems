import React, { useEffect, useState } from 'react';

export default function AgentHealthDashboard() {
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/logs/agent-health.json');
        const json = await res.json();
        if (Array.isArray(json)) setData(json);
      } catch {
        setData([]);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="p-6 text-white">
      <h1 className="text-2xl font-bold mb-4">Agent Health</h1>
      <div className="overflow-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left">
              <th className="p-2">Agent</th>
              <th className="p-2">Runs</th>
              <th className="p-2">Success %</th>
              <th className="p-2">Avg Duration (ms)</th>
              <th className="p-2">Last Active</th>
            </tr>
          </thead>
          <tbody>
            {data.map(a => {
              const successRate = a.runs ? Math.round((a.successes / a.runs) * 100) : 0;
              const rowClass = successRate < 50 ? 'text-red-400' : '';
              return (
                <tr key={a.agent} className={`border-t border-white/20 ${rowClass}`}> 
                  <td className="p-2">{a.agent}</td>
                  <td className="p-2">{a.runs}</td>
                  <td className="p-2">{successRate}%</td>
                  <td className="p-2">{a.avgDuration}</td>
                  <td className="p-2">{a.lastActive ? new Date(a.lastActive).toLocaleString() : '-'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
