import React, { useEffect, useState } from 'react';

export default function BillingPanel() {
  const [plan, setPlan] = useState('free');
  const [usage, setUsage] = useState({ totalRuns: 0 });
  const [status, setStatus] = useState('inactive');
  const [daysRemaining, setDaysRemaining] = useState(null);
  const [warning, setWarning] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/billing/info', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` }
        });
        const data = await res.json();
        setPlan(data.plan || 'free');
        setUsage(data.usage || { totalRuns: 0 });
        setStatus(data.status || 'inactive');
        setDaysRemaining(data.daysRemaining);
        if (data.status === 'past_due') {
          setWarning('Payment failed. Please update your billing details.');
        } else if (data.status === 'canceled') {
          setWarning('Subscription canceled. Upgrade to resume access.');
        }
        if (data.daysRemaining !== null && data.daysRemaining <= 2 && data.plan !== 'pro') {
          setWarning('Trial ending soon. Upgrade to keep running agents.');
        }
      } catch (err) {
        console.error('Failed to load billing info', err);
      }
    };
    load();
  }, []);

  const upgrade = async () => {
    try {
      const res = await fetch('/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({})
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {
      alert('Upgrade failed');
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Billing</h1>
      {warning && (
        <div className="mb-4 p-2 rounded bg-yellow-300 text-black">
          {warning}
        </div>
      )}
      <p className="mb-2">Current Plan: {plan === 'pro' ? 'Pro' : 'Free'}</p>
      <p className="mb-2">Analyses this month: {usage.totalRuns}</p>
      {usage.agents && (
        <div className="mb-2 text-sm text-gray-300">
          {Object.entries(usage.agents).map(([name, count]) => (
            <p key={name}>{name}: {count}</p>
          ))}
        </div>
      )}
      {plan !== 'pro' && (
        <p className="mb-4 text-sm text-gray-300">
          Usage remaining: {Math.max(0, 3 - usage.totalRuns)}
        </p>
      )}
      {daysRemaining !== null && plan !== 'pro' && (
        <p className="mb-2 text-sm text-gray-300">
          Trial days remaining: {Math.max(0, daysRemaining)}
        </p>
      )}
      {plan !== 'pro' && (
        <button
          onClick={upgrade}
          className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
        >
          Upgrade to Pro
        </button>
      )}
    </div>
  );
}
