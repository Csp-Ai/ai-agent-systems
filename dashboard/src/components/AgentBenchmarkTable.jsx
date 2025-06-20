import { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { useOrg } from '../OrgContext';

function badgeColor(value) {
  if (value >= 80) return 'bg-green-600';
  if (value >= 50) return 'bg-yellow-500';
  return 'bg-red-600';
}

export default function AgentBenchmarkTable() {
  const { orgId, agents } = useOrg();
  const [rows, setRows] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!orgId || !agents?.length) {
        setRows([]);
        return;
      }
      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const results = [];
      for (const agent of agents) {
        try {
          const benchCol = collection(db, 'orgs', orgId, 'agents', agent.id, 'benchmarks');
          const q = query(benchCol, where('timestamp', '>=', since));
          const snap = await getDocs(q);
          const data = snap.docs.map(d => d.data());
          const count = data.length;
          if (count) {
            const totalDur = data.reduce((s, d) => s + (d.durationMs || 0), 0);
            const success = data.filter(d => d.success).length;
            const sop = data.reduce((s, d) => s + (d.sopCompliance || 0), 0);
            results.push({
              id: agent.id,
              avgDuration: Math.round(totalDur / count),
              successRate: Math.round((success / count) * 100),
              sopCompliance: Math.round((sop / count) * 100),
            });
          } else {
            results.push({ id: agent.id, avgDuration: 0, successRate: 0, sopCompliance: 0 });
          }
        } catch {
          results.push({ id: agent.id, avgDuration: 0, successRate: 0, sopCompliance: 0 });
        }
      }
      setRows(results);
    };
    fetchData();
  }, [orgId, agents]);

  return (
    <div className="p-4 overflow-auto">
      <h2 className="text-xl font-semibold mb-4">Agent Benchmarks</h2>
      <table className="min-w-full text-sm whitespace-nowrap">
        <thead>
          <tr className="text-left">
            <th className="p-2">Agent ID</th>
            <th className="p-2">Avg Task Duration (ms)</th>
            <th className="p-2">Success Rate</th>
            <th className="p-2">SOP Compliance</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.id} className="border-t border-gray-200 dark:border-gray-700">
              <td className="p-2">{r.id}</td>
              <td className="p-2">{r.avgDuration}</td>
              <td className="p-2">
                <span className={`text-white px-2 py-0.5 rounded ${badgeColor(r.successRate)}`}>{r.successRate}%</span>
              </td>
              <td className="p-2">
                <span className={`text-white px-2 py-0.5 rounded ${badgeColor(r.sopCompliance)}`}>{r.sopCompliance}%</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
