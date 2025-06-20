import React, { useEffect, useState } from 'react';
import { diffLines } from 'diff';

export default function SopDiffViewer({ agentId = '', orgId = '' }) {
  const [segments, setSegments] = useState([]);

  useEffect(() => {
    if (!agentId || !orgId) return;
    const fetchDiff = async () => {
      try {
        const [currRes, histRes] = await Promise.all([
          fetch(`/orgs/${orgId}/agents/${agentId}/sop`),
          fetch(`/orgs/${orgId}/agents/${agentId}/sopHistory/latest`)
        ]);
        const current = await currRes.text();
        const last = await histRes.text();
        setSegments(diffLines(last, current));
      } catch {
        setSegments([]);
      }
    };
    fetchDiff();
  }, [agentId, orgId]);

  const renderPart = (part, i) =>
    part.value.split('\n').map((line, j) => {
      if (j === part.value.split('\n').length - 1 && line === '') return null;
      const cls = part.added
        ? 'bg-green-900 text-green-300'
        : part.removed
          ? 'bg-red-900 text-red-300'
          : '';
      return (
        <div key={`${i}-${j}`} className={`whitespace-pre-wrap ${cls}`}>
          {line}
        </div>
      );
    });

  return (
    <div className="p-4 bg-black text-white rounded font-mono text-sm space-y-1">
      {segments.map((part, i) => renderPart(part, i))}
    </div>
  );
}
