import { useEffect, useState } from 'react';
import AgentDetailsModal from '../components/AgentDetailsModal';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';

export default function AgentAdminConsole() {
  const [agents, setAgents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [benchmarks, setBenchmarks] = useState([]);
  const [missing, setMissing] = useState([]);
  const [filters, setFilters] = useState({ dept: 'all', status: 'all', version: '' });
  const [flags, setFlags] = useState({});
  const [active, setActive] = useState(null);

  useEffect(() => {
    Promise.all([
      fetch('/agents/agent-metadata.json').then(r => r.json()),
      fetch('/agents/agent-catalog.json').then(r => r.json()),
      fetch('/logs/system-audit.json').then(r => r.json()),
      fetch('/logs/agent-benchmarks.json').then(r => r.json())
    ])
      .then(([meta, catalog, audit, bench]) => {
        const list = Object.entries(meta).map(([id, info]) => {
          const dep = Object.keys(catalog).find(d => catalog[d].includes(id)) || 'unknown';
          const activity = info.lifecycle && info.lifecycle.includes('test') ? 'testing' : info.enabled ? 'active' : 'inactive';
          return { id, department: dep, activity, ...info };
        });
        setAgents(list);
        setDepartments(Object.keys(catalog));
        setMissing(audit[0]?.missingSOPs || []);
        setBenchmarks(Array.isArray(bench) ? bench : []);
      })
      .catch(() => {});
  }, []);

  const filteredAgents = agents.filter(a =>
    (filters.dept === 'all' || a.department === filters.dept) &&
    (filters.status === 'all' || a.activity === filters.status) &&
    (!filters.version || a.version === filters.version)
  );

  const toggleFlag = (id, key) => {
    setFlags(prev => ({
      ...prev,
      [id]: { ...prev[id], [key]: !prev[id]?.[key] }
    }));
  };

  const downloadCsv = range => {
    const now = Date.now();
    let since = 0;
    if (range === '24h') since = now - 24 * 60 * 60 * 1000;
    else if (range === '7d') since = now - 7 * 24 * 60 * 60 * 1000;
    const data = benchmarks.filter(b => !b.lastUsed || Date.parse(b.lastUsed) >= since);
    const csv = ['agent,name,category,avgResponseTime,successRate,lastUsed'];
    data.forEach(b => {
      csv.push(`${b.agent},${b.name},${b.category},${b.avgResponseTime},${b.successRate},${b.lastUsed}`);
    });
    const blob = new Blob([csv.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agent-logs-${range}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const needsSopAgents = agents.filter(a => missing.includes(a.id));

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Agent Admin Console</h2>
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Agents</TabsTrigger>
          <TabsTrigger value="sop">Needs SOP</TabsTrigger>
          <TabsTrigger value="logs">Logs & Analytics</TabsTrigger>
        </TabsList>
        <TabsContent value="all">
          <div className="flex gap-2 mb-4">
            <select
              value={filters.dept}
              onChange={e => setFilters({ ...filters, dept: e.target.value })}
              className="border px-2 py-1 rounded dark:bg-gray-800"
            >
              <option value="all">All Depts</option>
              {departments.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <select
              value={filters.status}
              onChange={e => setFilters({ ...filters, status: e.target.value })}
              className="border px-2 py-1 rounded dark:bg-gray-800"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="testing">Testing</option>
            </select>
            <input
              type="text"
              placeholder="Version"
              value={filters.version}
              onChange={e => setFilters({ ...filters, version: e.target.value })}
              className="border px-2 py-1 rounded w-24 dark:bg-gray-800"
            />
          </div>
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left">
                <th className="p-2">Name</th>
                <th className="p-2">Dept</th>
                <th className="p-2">Status</th>
                <th className="p-2">Version</th>
                <th className="p-2">Visible</th>
                <th className="p-2">Prod Ready</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAgents.map(a => (
                <tr key={a.id} className="border-t border-gray-200 dark:border-gray-700">
                  <td className="p-2">{a.name || a.id}</td>
                  <td className="p-2">{a.department}</td>
                  <td className="p-2">{a.activity}</td>
                  <td className="p-2">{a.version}</td>
                  <td className="p-2 text-center">
                    <input
                      type="checkbox"
                      checked={flags[a.id]?.visible || false}
                      onChange={() => toggleFlag(a.id, 'visible')}
                    />
                  </td>
                  <td className="p-2 text-center">
                    <input
                      type="checkbox"
                      checked={flags[a.id]?.prod || false}
                      onChange={() => toggleFlag(a.id, 'prod')}
                    />
                  </td>
                  <td className="p-2">
                    <button
                      onClick={() => setActive(a)}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-2 py-1 rounded"
                    >
                      Test
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TabsContent>
        <TabsContent value="sop">
          <ul className="list-disc list-inside space-y-1">
            {needsSopAgents.map(a => (
              <li key={a.id}>{a.name || a.id} - {a.department}</li>
            ))}
          </ul>
        </TabsContent>
        <TabsContent value="logs">
          <div className="mb-2 flex gap-2">
            <button
              onClick={() => downloadCsv('24h')}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-2 py-1 rounded"
            >
              Download 24h
            </button>
            <button
              onClick={() => downloadCsv('7d')}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-2 py-1 rounded"
            >
              Download 7d
            </button>
            <button
              onClick={() => downloadCsv('all')}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-2 py-1 rounded"
            >
              Download All
            </button>
          </div>
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left">
                <th className="p-2">Agent</th>
                <th className="p-2">Category</th>
                <th className="p-2">Avg Response</th>
                <th className="p-2">Success Rate</th>
                <th className="p-2">Last Used</th>
              </tr>
            </thead>
            <tbody>
              {benchmarks.map(b => (
                <tr key={b.agent} className="border-t border-gray-200 dark:border-gray-700">
                  <td className="p-2">{b.agent}</td>
                  <td className="p-2">{b.category}</td>
                  <td className="p-2">{b.avgResponseTime}</td>
                  <td className="p-2">{Math.round((b.successRate || 0) * 100)}%</td>
                  <td className="p-2">{b.lastUsed}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TabsContent>
      </Tabs>
      {active && (
        <AgentDetailsModal agent={active} onClose={() => setActive(null)} />
      )}
    </div>
  );
}
