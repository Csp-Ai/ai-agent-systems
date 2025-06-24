import React, { useEffect, useState } from 'react';
import FlowVisualizer from '../FlowVisualizer.jsx';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../src/firebase.js';
import loadFlowConfig from '../../utils/loadFlowConfig.js';

export default function FlowViewPage({ flowId }) {
  const [complete, setComplete] = useState(false);
  const token = btoa(encodeURIComponent(flowId));

  useEffect(() => {
    // Billing check
    const checkBilling = async () => {
      try {
        const res = await fetch('/billing/info', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token') || ''}`
          }
        });
        const data = await res.json();
        const remaining =
          data.plan === 'pro' ? Infinity : 3 - (data.usage?.totalRuns || 0);
        const expired = data.daysRemaining !== null && data.daysRemaining < 0;
        if (expired || remaining <= 0) {
          localStorage.setItem('pendingFlowToken', token);
          const r = await fetch('/create-checkout-session', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${localStorage.getItem('token') || ''}`
            },
            body: JSON.stringify({})
          });
          const ck = await r.json();
          if (ck.url && typeof window !== 'undefined') {
            window.location.href = ck.url;
          }
        }
      } catch (err) {
        console.error('Billing check failed', err);
      }
    };
    checkBilling();
  }, [flowId]);

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

  return (
    <div className="p-4">
      <FlowVisualizer flowId="website-analysis" runId={flowId} />
    </div>
  );
}

