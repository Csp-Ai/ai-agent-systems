import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import AgentDetailsModal from './AgentDetailsModal';
import { db } from '../firebase';
import { useOrg } from '../OrgContext';

export default function DepartmentDashboard({ department }) {
  const [agents, setAgents] = useState([]);
  const [logs, setLogs] = useState([]);
  const [active, setActive] = useState(null);
  const { orgId } = useOrg();

  useEffect(() => {
    Promise.all([
      fetch('/agents/agent-catalog.json').then(r => r.json()),
      fetch('/agents/agent-metadata.json').then(r => r.json()),
    ])
      .then(([catalog, meta]) => {
        const ids = catalog[department] || [];
        const list = ids.map(id => ({ id, ...meta[id] })).filter(a => a);
        setAgents(list);
      })
      .catch(() => setAgents([]));
  }, [department]);

  useEffect(() => {
    if (!orgId || !agents.length) { setLogs([]); return; }
    const ids = agents.map(a => a.id);
    const chunks = [];
    for (let i = 0; i < ids.length; i += 10) {
      const q = query(
        collection(db, 'orgs', orgId, 'logs'),
        where('agent', 'in', ids.slice(i, i + 10)),
        orderBy('timestamp', 'desc')
      );
      chunks.push(q);
    }
    const unsubs = chunks.map(q => onSnapshot(q, snap => {
      setLogs(prev => {
        const filtered = prev.filter(l => !ids.includes(l.agent));
        const arr = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        return [...filtered, ...arr].sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
      });
    }));
    return () => unsubs.forEach(u => u());
  }, [orgId, agents]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold capitalize mb-2">{department} Department</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map(a => (
            <div key={a.id} className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="p-3">
                <h4 className="font-semibold">{a.name || a.id}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">{a.description}</p>
              </div>
              <div className="p-3 flex gap-2">
                <button onClick={() => setActive(a)} className="flex-1 bg-blue-500 hover:bg-blue-600 text-white text-sm px-2 py-1 rounded">Run</button>
                <button onClick={() => setActive(a)} className="flex-1 bg-gray-300 hover:bg-gray-400 text-sm rounded dark:bg-gray-600 dark:hover:bg-gray-500">Logs</button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h3 className="font-medium mb-2">Team Collaboration</h3>
        <div className="bg-white dark:bg-gray-800 p-3 rounded text-sm">
          {agents.map(a => a.name || a.id).join(' \u2192 ')}
        </div>
      </div>
      <div>
        <h3 className="font-medium mb-2">Recent Activity</h3>
        <ul className="space-y-2 max-h-[40vh] overflow-auto">
          {logs.map(log => (
            <li key={log.id} className="border rounded p-2 text-sm dark:border-gray-700">
              <div className="text-gray-500">
                {new Date(log.timestamp).toLocaleString()} - {log.agent}
              </div>
              <div className="whitespace-pre-wrap">{log.outputSnippet || log.output || ''}</div>
            </li>
          ))}
        </ul>
      </div>
      {active && <AgentDetailsModal agent={active} onClose={() => setActive(null)} orgId={orgId} />}
    </div>
  );
}
