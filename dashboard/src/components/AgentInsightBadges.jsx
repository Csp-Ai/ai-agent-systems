import React from 'react';

const patterns = [
  { regex: /site\s*map|sitemap|scanned/i, label: '🔍 Scanned site map' },
  { regex: /trend/i, label: '📊 Trend detected' },
  { regex: /anomaly|flagged/i, label: '⚠️ Anomaly flagged' }
];

export default function AgentInsightBadges({ logs = [] }) {
  const badges = [];

  for (const entry of logs) {
    const text =
      typeof entry === 'string'
        ? entry
        : entry.message || entry.output || entry.text || '';
    for (const { regex, label } of patterns) {
      if (regex.test(text)) badges.push(label);
    }
  }

  const unique = Array.from(new Set(badges));

  if (!unique.length) return null;

  return (
    <div className="flex flex-wrap gap-1">
      {unique.map((label, idx) => (
        <span
          key={idx}
          className="bg-blue-700 text-white rounded-full text-xs px-2 py-0.5"
        >
          {label}
        </span>
      ))}
    </div>
  );
}
