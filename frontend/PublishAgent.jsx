import React, { useState } from 'react';

export default function PublishAgent() {
  const [name, setName] = useState('');
  const [version, setVersion] = useState('');
  const [inputs, setInputs] = useState('{}');
  const [outputs, setOutputs] = useState('{}');
  const [deps, setDeps] = useState('');
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('');

  const validateJSON = (val) => {
    try {
      const parsed = JSON.parse(val);
      if (typeof parsed !== 'object' || Array.isArray(parsed)) return 'Must be an object';
      return '';
    } catch {
      return 'Invalid JSON';
    }
  };

  const handleInputs = (e) => {
    const v = e.target.value;
    setInputs(v);
    setErrors(err => ({ ...err, inputs: validateJSON(v) }));
  };

  const handleOutputs = (e) => {
    const v = e.target.value;
    setOutputs(v);
    setErrors(err => ({ ...err, outputs: validateJSON(v) }));
  };

  const handleVersion = (e) => {
    const v = e.target.value;
    setVersion(v);
    setErrors(err => ({ ...err, version: /^\d+\.\d+\.\d+$/.test(v) ? '' : 'Use semver X.Y.Z' }));
  };

  const handleName = (e) => {
    const v = e.target.value;
    setName(v);
    setErrors(err => ({ ...err, name: v ? '' : 'Required' }));
  };

  const canSubmit = !errors.inputs && !errors.outputs && !errors.version && name && version;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    const metadata = {
      name,
      version,
      inputs: JSON.parse(inputs || '{}'),
      outputs: JSON.parse(outputs || '{}'),
      dependsOn: deps.split(',').map(s => s.trim()).filter(Boolean)
    };
    const form = new FormData();
    form.append('metadata', JSON.stringify(metadata));
    try {
      const res = await fetch('/submit-agent', {
        method: 'POST',
        headers: { 'x-admin-key': localStorage.getItem('adminKey') || '' },
        body: form
      });
      const data = await res.json();
      if (data.error) setStatus(`❌ ${data.error}`); else setStatus('✅ Submitted');
    } catch {
      setStatus('❌ Submission failed');
    }
  };

  return (
    <div className="p-6 text-white">
      <h1 className="text-2xl font-bold mb-4">Publish Agent</h1>
      <div className="space-y-3 max-w-xl">
        <input
          value={name}
          onChange={handleName}
          placeholder="Name"
          className="w-full p-2 rounded text-black"
        />
        {errors.name && <p className="text-red-400 text-sm">{errors.name}</p>}
        <input
          value={version}
          onChange={handleVersion}
          placeholder="Version (e.g. 1.0.0)"
          className="w-full p-2 rounded text-black"
        />
        {errors.version && <p className="text-red-400 text-sm">{errors.version}</p>}
        <textarea
          value={inputs}
          onChange={handleInputs}
          placeholder='{"field":"type"}'
          rows={4}
          className="w-full p-2 rounded text-black"
        />
        {errors.inputs && <p className="text-red-400 text-sm">{errors.inputs}</p>}
        <textarea
          value={outputs}
          onChange={handleOutputs}
          placeholder='{"field":"type"}'
          rows={4}
          className="w-full p-2 rounded text-black"
        />
        {errors.outputs && <p className="text-red-400 text-sm">{errors.outputs}</p>}
        <input
          value={deps}
          onChange={e => setDeps(e.target.value)}
          placeholder="Dependencies (comma separated)"
          className="w-full p-2 rounded text-black"
        />
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          Submit
        </button>
        {status && <p className="text-sm mt-2">{status}</p>}
      </div>
    </div>
  );
}
