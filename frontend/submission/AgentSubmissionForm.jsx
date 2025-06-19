import React, { useState } from 'react';

export default function AgentSubmissionForm() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [inputs, setInputs] = useState('{}');
  const [outputs, setOutputs] = useState('{}');
  const [file, setFile] = useState(null);
  const [dryRun, setDryRun] = useState(false);
  const [message, setMessage] = useState('');

  const parseJSON = (str) => {
    try {
      return JSON.parse(str || '{}');
    } catch {
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description);
    formData.append('category', category);
    formData.append('inputs', inputs);
    formData.append('outputs', outputs);
    if (file) formData.append('file', file);
    try {
      const res = await fetch(`/submit-agent?dryRun=${dryRun ? '1' : '0'}`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success && !dryRun) {
        window.location.href = '/submit-agent/success';
      } else if (data.success) {
        setMessage('Dry run successful.');
      } else {
        setMessage(data.error || 'Submission failed');
      }
    } catch {
      setMessage('Failed to submit');
    }
  };

  const metadata = {
    name,
    description,
    category,
    inputs: parseJSON(inputs),
    outputs: parseJSON(outputs),
  };

  return (
    <div className="p-6 text-white">
      <h1 className="text-3xl font-bold mb-4">Submit New Agent</h1>
      {message && <p className="mb-4 text-red-400">{message}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          className="w-full p-2 rounded bg-white/10"
        />
        <textarea
          required
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description"
          className="w-full p-2 rounded bg-white/10"
        />
        <input
          required
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="Category"
          className="w-full p-2 rounded bg-white/10"
        />
        <textarea
          value={inputs}
          onChange={(e) => setInputs(e.target.value)}
          placeholder="Inputs JSON"
          className="w-full p-2 rounded bg-white/10 font-mono text-sm"
        />
        <textarea
          value={outputs}
          onChange={(e) => setOutputs(e.target.value)}
          placeholder="Outputs JSON"
          className="w-full p-2 rounded bg-white/10 font-mono text-sm"
        />
        <input
          type="file"
          accept=".js"
          onChange={(e) => setFile(e.target.files[0])}
          className="text-white"
          required
        />
        <label className="block">
          <input
            type="checkbox"
            checked={dryRun}
            onChange={(e) => setDryRun(e.target.checked)}
            className="mr-2"
          />
          Dry Run Only
        </label>
        <button type="submit" className="bg-blue-500 px-4 py-2 rounded">
          Submit
        </button>
      </form>
      <h2 className="text-xl font-semibold mt-6">Metadata Preview</h2>
      <pre className="bg-black/30 p-4 rounded text-sm whitespace-pre-wrap">
        {JSON.stringify(metadata, null, 2)}
      </pre>
    </div>
  );
}
