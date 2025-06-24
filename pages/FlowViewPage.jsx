import React, { useEffect, useState } from 'react';
import FlowVisualizer from '../components/FlowVisualizer.jsx';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../frontend/src/firebase.js';
import loadFlowConfig from '../utils/loadFlowConfig.js';

export default function FlowViewPage({ flowId }) {
  const [complete, setComplete] = useState(false);
  const token = btoa(encodeURIComponent(flowId));

  useEffect(() => {
    let unsub = [];
    let statuses = {};
    let cfg;
    loadFlowConfig('website-analysis').then(config => {
      cfg = config;
      if (!cfg) return;
      if (db && db.app) {
        cfg.steps.forEach(step => {
          const ref = doc(db, 'flows', 'demo', flowId, 'steps', step.agent);
          const u = onSnapshot(ref, snap => {
            if (snap.exists()) {
              statuses[step.agent] = snap.data().status;
              const done = cfg.steps.every(s =>
                ['complete', 'error'].includes(statuses[s.agent])
              );
              setComplete(done);
            }
          });
          unsub.push(u);
        });
      } else {
        const t = setTimeout(() => setComplete(true), 4000);
        unsub.push(() => clearTimeout(t));
      }
    });

    return () => {
      unsub.forEach(fn => fn());
    };
  }, [flowId]);

  const download = async () => {
    const res = await fetch(`/export-report/${encodeURIComponent(token)}`);
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${flowId}-report.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4">
      {complete && (
        <button
          onClick={download}
          className="bg-blue-600 text-white text-sm px-2 py-1 rounded mb-2"
        >
          📄 Download Full Report
        </button>
      )}
      <FlowVisualizer flowId="website-analysis" runId={flowId} />
    </div>
  );
}
