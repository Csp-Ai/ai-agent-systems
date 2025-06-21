import React, { useEffect, useState } from 'react';

export default function AdminDashboard() {
  const [sessions, setSessions] = useState([]);
  const [days, setDays] = useState(7);
  const [selectedId, setSelectedId] = useState(null);
  const [sessionLogs, setSessionLogs] = useState([]);
  const [retryAgent, setRetryAgent] = useState('');
  const [retryInput, setRetryInput] = useState('');

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

  const viewSession = async id => {
    setSelectedId(id);
    setSessionLogs([]);
    setRetryAgent('');
    setRetryInput('');
    try {
      const res = await fetch(`/logs/sessions/${id}/json`, {
        headers: { 'x-admin-key': localStorage.getItem('adminKey') || '' }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setSessionLogs(data);
        const last = data[data.length - 1];
        if (last && last.input) {
          setRetryAgent(last.agent || '');
          setRetryInput(JSON.stringify(last.input, null, 2));
        }
      }
    } catch {}
  };

  const runAgain = async () => {
    if (!retryAgent) return;
    let input;
    try {
      input = JSON.parse(retryInput);
    } catch {
      alert('Invalid JSON');
      return;
    }
    try {
      const res = await fetch('/run-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent: retryAgent, input })
      });
      const data = await res.json();
      if (data.error) alert('Error: ' + data.error);
      else alert('Agent executed');
    } catch {
      alert('Request failed');
    }
  };

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
              <th className="p-2">View</th>
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
                <td className="p-2">
                  <button
                    onClick={() => viewSession(s.sessionId)}
                    className="text-blue-400 underline"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {selectedId && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-2">Session {selectedId}</h2>
          <pre className="bg-black/40 p-2 rounded text-green-300 whitespace-pre-wrap max-h-60 overflow-y-auto">
            {JSON.stringify(sessionLogs, null, 2)}
          </pre>
          {retryAgent && (
            <div className="mt-4 space-y-2">
              <h3 className="font-semibold">Try Again ({retryAgent})</h3>
              <textarea
                value={retryInput}
                onChange={e => setRetryInput(e.target.value)}
                className="w-full p-2 rounded text-black h-32"
              />
              <button onClick={runAgain} className="bg-blue-500 text-white px-3 py-1 rounded">
                Run
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
