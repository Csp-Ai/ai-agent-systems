import React, { useEffect, useState } from 'react';

export default function BillingPanel() {
  const [plan, setPlan] = useState('free');
  const [usage, setUsage] = useState(0);
  const [status, setStatus] = useState('inactive');
  const [trialEndsAt, setTrialEndsAt] = useState(null);
  const [warning, setWarning] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/billing/info', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` }
        });
        const data = await res.json();
        setPlan(data.plan || 'free');
        setUsage(data.usage || 0);
        setStatus(data.status || 'inactive');
        setTrialEndsAt(data.trialEndsAt || null);
        if (data.status === 'past_due') {
          setWarning('Payment failed. Please update your billing details.');
        } else if (data.status === 'canceled') {
          setWarning('Subscription canceled. Upgrade to resume access.');
        } else if (data.trialEnding) {
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
      <p className="mb-2">Analyses this month: {usage}</p>
      {plan !== 'pro' && (
        <p className="mb-4 text-sm text-gray-300">
          Usage remaining: {Math.max(0, 3 - usage)}
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
