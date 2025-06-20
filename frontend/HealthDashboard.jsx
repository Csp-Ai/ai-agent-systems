import React, { useEffect, useState } from 'react';

export default function HealthDashboard() {
  const [status, setStatus] = useState(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch('/health-check');
        const json = await res.json();
        setStatus(json);
      } catch {
        setStatus(null);
      }
    };
    fetchStatus();
  }, []);

  if (!status) {
    return <div className="p-6 text-white">Loading...</div>;
  }

  return (
    <div className="p-6 text-white">
      <h1 className="text-2xl font-bold mb-4">System Health</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className={`p-4 rounded ${status.translation ? 'bg-green-600/50' : 'bg-red-600/50'}`}> 
          <h2 className="text-sm">Translation API</h2>
          <p className="text-lg font-semibold">{status.translation ? 'Online' : 'Down'}</p>
        </div>
        <div className={`p-4 rounded ${status.auditLogRecent ? 'bg-green-600/50' : 'bg-red-600/50'}`}> 
          <h2 className="text-sm">Audit Logs</h2>
          <p className="text-lg font-semibold">{status.auditLogRecent ? 'Updating' : 'Stale'}</p>
        </div>
      </div>
      <table className="min-w-full text-sm">
        <thead>
          <tr className="text-left">
            <th className="p-2">Agent</th>
            <th className="p-2">Latency (ms)</th>
            <th className="p-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {status.agents.map(a => (
            <tr key={a.agent} className="border-t border-white/20">
              <td className="p-2">{a.agent}</td>
              <td className="p-2">{a.latencyMs}</td>
              <td className="p-2">{a.success ? '✅' : `❌ ${a.error || ''}`}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
