import { useState } from 'react';

export default function AddAgentForm({ onClose, onAdded }) {
  const [form, setForm] = useState({
    agentId: '',
    displayName: '',
    description: '',
    version: '1.0.0',
    category: '',
    status: 'active',
    entryPoint: ''
  });
  const [loading, setLoading] = useState(false);
  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  const submit = async () => {
    setLoading(true);
    try {
      await fetch('/add-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      onAdded?.();
      onClose();
    } catch {
      // ignore
    }
    setLoading(false);
  };
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded p-4 w-96 transition-transform">
        <h3 className="text-lg font-semibold mb-2">Add New Agent</h3>
        {['agentId','displayName','description','version','category','status','entryPoint'].map(f => (
          <input
            key={f}
            name={f}
            value={form[f]}
            onChange={handleChange}
            placeholder={f}
            className="mb-2 w-full border rounded p-2 text-sm dark:bg-gray-700"
          />
        ))}
        <div className="flex gap-2 mt-2">
          <button onClick={submit} disabled={loading} className="flex-1 bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded">
            {loading ? 'Adding...' : 'Add'}
          </button>
          <button onClick={onClose} className="flex-1 bg-gray-300 hover:bg-gray-400 rounded dark:bg-gray-600 dark:hover:bg-gray-500">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
