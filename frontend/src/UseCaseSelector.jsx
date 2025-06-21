import React from 'react';

const useCases = [
  { id: 'market-analysis', name: 'Market Analysis', desc: 'Understand your market with AI insights.' },
  { id: 'sales-outreach', name: 'Sales Outreach', desc: 'Draft personalized sales outreach at scale.' },
  { id: 'content-planning', name: 'Content Planning', desc: 'Plan engaging content ideas.' }
];

export default function UseCaseSelector() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-3xl font-bold mb-6">Explore Use Cases</h1>
      <div className="grid gap-4 md:grid-cols-3">
        {useCases.map(u => (
          <div key={u.id} className="border rounded-lg p-4 bg-white shadow-sm">
            <h2 className="font-semibold mb-1">{u.name}</h2>
            <p className="text-sm text-gray-600 mb-4">{u.desc}</p>
            <a href={`/demo?case=${u.id}`} className="text-blue-600 hover:underline">Run Demo</a>
          </div>
        ))}
      </div>
    </div>
  );
}
