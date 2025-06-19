import React, { useEffect, useState } from 'react';

export default function AdminDashboard() {
  const [sessions, setSessions] = useState([]);
  const [days, setDays] = useState(7);

  const fetchSessions = async () => {
    try {
      const res = await fetch(`/logs/sessions?days=${days}`, {
        headers: { 'x-admin-key': localStorage.getItem('adminKey') || '' }
      });
      const data = await res.json();
      if (!data.error) setSessions(data);
    } catch {
      setSessions([]);
    }
  };

  useEffect(() => { fetchSessions(); }, [days]);

  const downloadSession = async id => {
    try {
    const res = await fetch(`/logs/sessions/${id}`, {
      headers: { 'x-admin-key': localStorage.getItem('adminKey') || '' }
    });
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${id}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
    } catch {}
  };

  return (
    <div className="p-6 text-white">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
      <div className="mb-4 space-x-2">
        <label>
          Last
          <input
            type="number"
            value={days}
            onChange={e => setDays(e.target.value)}
            className="mx-2 w-16 p-1 rounded text-black"
          />
          days
        </label>
        <button
          onClick={fetchSessions}
          className="bg-blue-500 text-white px-2 py-1 rounded"
        >
          Refresh
        </button>
      </div>
      <div className="overflow-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left">
              <th className="p-2">Date</th>
              <th className="p-2">Name</th>
              <th className="p-2">Email</th>
              <th className="p-2">Agents</th>
              <th className="p-2">Status</th>
              <th className="p-2">Download</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map(s => (
              <tr key={s.sessionId} className="border-t border-white/20">
                <td className="p-2">{new Date(s.date).toLocaleString()}</td>
                <td className="p-2">{s.name || '-'}</td>
                <td className="p-2">{s.email || '-'}</td>
                <td className="p-2">{(s.agents || []).join(', ')}</td>
                <td className="p-2">{s.status}</td>
                <td className="p-2">
                  <button
                    onClick={() => downloadSession(s.sessionId)}
                    className="text-blue-400 underline"
                  >
                    JSON
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
