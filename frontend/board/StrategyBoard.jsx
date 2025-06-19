import React from 'react';

export default function StrategyBoard({ data }) {
  const agents = data.agents || [];
  const growth = data.growth || [];
  const recs = data.recommendations || [];
  return (
    <div className="p-6 text-white">
      <h1 className="text-2xl font-bold mb-4">Strategy Board</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white/10 p-4 rounded">
          <h2 className="text-sm">Active Agents</h2>
          <p className="text-xl font-semibold">{agents.length}</p>
        </div>
        <div className="bg-white/10 p-4 rounded">
          <h2 className="text-sm mb-2">Board Recommendations</h2>
          <ul className="list-disc pl-4 text-sm space-y-1">
            {recs.map((r, i) => (
              <li key={i}>{r.suggestion || r}</li>
            ))}
          </ul>
        </div>
      </div>
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Lifecycle Phase</h2>
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left">
              <th className="p-2">Agent</th>
              <th className="p-2">Phase</th>
            </tr>
          </thead>
          <tbody>
            {agents.map(a => (
              <tr key={a.id} className="border-t border-white/20">
                <td className="p-2">{a.name}</td>
                <td className="p-2">{a.phase}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div>
        <h2 className="text-lg font-semibold mb-2">Growth Trends (Last 7 Days)</h2>
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left">
              <th className="p-2">Date</th>
              <th className="p-2">Runs</th>
            </tr>
          </thead>
          <tbody>
            {growth.map(g => (
              <tr key={g.date} className="border-t border-white/20">
                <td className="p-2">{g.date.slice(5)}</td>
                <td className="p-2">{g.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
