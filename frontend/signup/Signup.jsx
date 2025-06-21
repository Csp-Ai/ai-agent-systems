import React, { useState } from 'react';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [complete, setComplete] = useState(false);

  const roles = [
    'Product/Strategy',
    'Developer',
    'Marketing',
    'Small Business',
    'Just Exploring'
  ];

  const submit = async () => {
    if (!email || !role) return;
    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role })
      });
      const data = await res.json();
      if (data.uid) {
        localStorage.setItem('uid', data.uid);
        setComplete(true);
        setTimeout(() => { window.location.href = '/dashboard/'; }, 1200);
      }
    } catch {
      alert('Signup failed');
    }
  };

  if (complete) {
    return <div className="p-6 text-white">Signup complete! Redirecting...</div>;
  }

  return (
    <div className="p-6 text-white">
      <h1 className="text-2xl font-bold mb-4">Create Account</h1>
      <input
        className="w-full p-2 mb-4 rounded text-black"
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
      />
      <label className="block mb-2">What best describes your role?</label>
      <select
        className="w-full p-2 mb-4 rounded text-black"
        value={role}
        onChange={e => setRole(e.target.value)}
      >
        <option value="">Select...</option>
        {roles.map(r => (
          <option key={r} value={r}>{r}</option>
        ))}
      </select>
      <button
        onClick={submit}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
      >
        Sign Up
      </button>
    </div>
  );
}
