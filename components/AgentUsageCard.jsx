import React from 'react';

export default function AgentUsageCard({ usage = {} }) {
  const entries = Object.entries(usage)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  if (!entries.length) {
    return (
      <div className="p-4 border rounded">No agent usage yet.</div>
    );
  }
  return (
    <div className="p-4 border rounded">
      <h2 className="font-semibold mb-2">Top Used Agents</h2>
      <ul className="space-y-1 text-sm">
        {entries.map(([name, count]) => (
          <li key={name} className="flex justify-between">
            <span>{name}</span>
            <span className="font-medium">{count}x</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
