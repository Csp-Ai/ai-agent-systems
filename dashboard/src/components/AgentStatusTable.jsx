import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useOrg } from '../OrgContext';
import OrgBadge from './OrgBadge';

const statusColors = {
  development: 'bg-blue-100 text-blue-800',
  testing: 'bg-yellow-100 text-yellow-800',
  production: 'bg-green-100 text-green-800',
  retired: 'bg-gray-200 text-gray-800',
};

export default function AgentStatusTable() {
  const [agents, setAgents] = useState([]);
  const { orgId, agents: orgAgents, orgs } = useOrg();

  useEffect(() => {
    if (orgAgents && orgAgents.length) {
      setAgents(orgAgents);
      return;
    }
    if (!orgId) return;
    const agentsCol = collection(db, 'orgs', orgId, 'agents');
    const metaCol = collection(db, 'orgs', orgId, 'agent-metadata');
    const unsubAgents = onSnapshot(agentsCol, snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      if (data.length) setAgents(data);
    });
    const unsubMeta = onSnapshot(metaCol, snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setAgents(prev => (prev.length ? prev : data));
    });
    return () => { unsubAgents(); unsubMeta(); };
  }, [orgId, orgAgents]);

  return (
    <div className="p-4 overflow-auto">
      <h2 className="text-xl font-semibold mb-4">Agent Status</h2>
      <table className="min-w-full text-sm">
        <thead>
          <tr className="text-left">
            <th className="p-2">Name</th>
            <th className="p-2">Alignment</th>
            <th className="p-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {agents.map(a => {
            const org = orgs.find(o => o.id === orgId);
            return (
              <tr key={a.id} className="border-t border-gray-200 dark:border-gray-700">
                <td className="p-2 flex items-center">
                  {a.name || a.id}
                  <OrgBadge code={org?.shortCode} />
                </td>
                <td className="p-2">{a.alignmentScore ?? '-'}</td>
                <td className="p-2">{a.status || a.lifecycle || 'unknown'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
