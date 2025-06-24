import React, { useEffect } from 'react';
import FlowVisualizer from '../components/FlowVisualizer.jsx';

export default function FlowViewPage({ flowId }) {
  useEffect(() => {
    const checkBilling = async () => {
      try {
        const res = await fetch('/billing/info', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token') || ''}`
          }
        });
        const data = await res.json();
        const remaining =
          data.plan === 'pro'
            ? Infinity
            : 3 - ((data.usage?.totalRuns || 0));
        const expired =
          data.daysRemaining !== null && data.daysRemaining < 0;
        if (expired || remaining <= 0) {
          localStorage.setItem(
            'pendingFlowToken',
            btoa(encodeURIComponent(flowId))
          );
          const r = await fetch('/create-checkout-session', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${localStorage.getItem('token') || ''}`
            },
            body: JSON.stringify({})
          });
          const ck = await r.json();
          if (ck.url) window.location.href = ck.url;
        }
      } catch (err) {
        console.error('Billing check failed', err);
      }
    };
    checkBilling();
  }, [flowId]);
  return (
    <div className="p-4">
      <FlowVisualizer flowId="website-analysis" runId={flowId} />
    </div>
  );
}
