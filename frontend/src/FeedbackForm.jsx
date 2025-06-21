import React, { useState } from 'react';

export default function FeedbackForm() {
  const [msg, setMsg] = useState('');
  const [sent, setSent] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!msg) return;
    try {
      const res = await fetch('/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg })
      });
      if (res.ok) setSent(true);
    } catch {
      /* ignore */
    }
  };

  if (sent) {
    return (
      <div className="mt-4 p-4 bg-green-100 text-green-700 rounded animate-fade-out">
        Thanks for your feedback!
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-2 mt-4">
      <textarea
        value={msg}
        onChange={e => setMsg(e.target.value)}
        className="w-full p-2 rounded border text-black"
        placeholder="Share your thoughts..."
      />
      <button
        type="submit"
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
      >
        Send Feedback
      </button>
    </form>
  );
}
