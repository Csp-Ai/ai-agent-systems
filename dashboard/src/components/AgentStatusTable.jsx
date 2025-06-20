import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

const statusColors = {
  development: 'bg-blue-100 text-blue-800',
  testing: 'bg-yellow-100 text-yellow-800',
  production: 'bg-green-100 text-green-800',
  retired: 'bg-gray-200 text-gray-800',
};

export default function AgentStatusTable({ orgId }) {
  const [agents, setAgents] = useState([]);

  useEffect(() => {
    if (!orgId) return () => {};
    const unsub = onSnapshot(collection(db, 'orgs', orgId, 'agents'), snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setAgents(data);
    });
    return unsub;
  }, [orgId]);

  return (
    <div className="p-4 overflow-auto">
      <h2 className="text-xl font-semibold mb-4">Agent Status</h2>
      <table className="min-w-full text-sm">
        <thead>
          <tr className="text-left">
            <th className="p-2">Name</th>
            <th className="p-2">Lifecycle</th>
            <th className="p-2">Alignment</th>
            <th className="p-2">Misaligned</th>
          </tr>
        </thead>
        <tbody>
          {agents.map(a => (
            <tr key={a.id} className="border-t border-gray-200 dark:border-gray-700">
              <td className="p-2">{a.name || a.id}</td>
              <td className="p-2">
                <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[a.lifecycle] || 'bg-gray-100 text-gray-800'}`}>
                  {a.lifecycle || 'unknown'}
                </span>
              </td>
              <td className="p-2">{a.alignmentScore ?? '-'}</td>
              <td className="p-2">{a.misaligned ? 'Yes' : 'No'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
