import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase.js';
import AgentLogItem from './AgentLogItem.jsx';

export default function AgentLogList({ onSelect }) {
  const [logs, setLogs] = useState([]);
  const [agentFilter, setAgentFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [errorsOnly, setErrorsOnly] = useState(false);

  useEffect(() => {
    try {
      const q = query(collection(db, 'logs'), orderBy('timestamp', 'desc'), limit(100));
      const unsub = onSnapshot(q, (snap) => {
        setLogs(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      });
      return unsub;
    } catch (err) {
      console.warn('Firestore unavailable', err);
      setLogs([]);
    }
  }, []);

  const filtered = logs.filter((l) => {
    if (agentFilter && !l.agent?.toLowerCase().includes(agentFilter.toLowerCase())) {
      return false;
    }
    if (errorsOnly && !l.error) return false;
    if (startDate && new Date(l.timestamp) < new Date(startDate)) return false;
    if (endDate && new Date(l.timestamp) > new Date(endDate)) return false;
    return true;
  });

  if (!filtered.length) {
    return <div className="p-4 text-center">No agent activity yet.</div>;
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex flex-wrap gap-2 mb-2 text-sm">
        <input
          type="text"
          value={agentFilter}
          onChange={(e) => setAgentFilter(e.target.value)}
          placeholder="Filter by agent"
          className="border px-2 py-1 rounded"
        />
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="border px-2 py-1 rounded"
        />
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="border px-2 py-1 rounded"
        />
        <label className="flex items-center gap-1">
          <input
            type="checkbox"
            checked={errorsOnly}
            onChange={(e) => setErrorsOnly(e.target.checked)}
          />
          Errors only
        </label>
      </div>
      <div className="overflow-y-auto flex-1 divide-y divide-gray-200 dark:divide-gray-700">
        {filtered.map((log) => (
          <AgentLogItem key={log.id} log={log} onSelect={onSelect} />
        ))}
      </div>
    </div>
  );
}
