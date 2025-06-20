import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useOrg } from '../OrgContext';

export default function ExecutionLogViewer() {
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState('');
  const { orgId } = useOrg();

  useEffect(() => {
    if (!orgId) return;
    const q = query(collection(db, 'orgs', orgId, 'logs'), orderBy('timestamp', 'desc'));
    const unsub = onSnapshot(q, snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setLogs(data);
    });
    return unsub;
  }, [orgId]);

  const filtered = filter
    ? logs.filter(l => (l.agent || '').includes(filter))
    : logs;

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Execution Logs</h2>
      <div className="mb-2">
        <input
          type="text"
          placeholder="Filter by agent"
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="border px-2 py-1 rounded w-48 dark:bg-gray-800"
        />
      </div>
      <ul className="space-y-2 max-h-[70vh] overflow-auto">
        {filtered.map(log => (
          <li key={log.id} className="border rounded p-3 dark:border-gray-700">
            <div className="text-sm text-gray-500">
              {new Date(log.timestamp).toLocaleString()} - {log.agent}
            </div>
            <div className="text-sm mt-1 whitespace-pre-wrap">
              {log.outputSnippet || log.output || ''}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

