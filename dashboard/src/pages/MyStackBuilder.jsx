import { useEffect, useState } from 'react';
import { Reorder } from 'framer-motion';
import { auth, db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';

export default function MyStackBuilder() {
  const [agents, setAgents] = useState([]);
  const [steps, setSteps] = useState([]);
  const [stackName, setStackName] = useState('');
  const [icon, setIcon] = useState('');
  const [logs, setLogs] = useState([]);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    fetch('/agents/agent-metadata.json')
      .then(r => r.json())
      .then(data => {
        const list = Object.entries(data).map(([id, meta]) => ({ id, ...meta }));
        setAgents(list);
      })
      .catch(() => setAgents([]));
  }, []);

  const addStep = id => {
    const meta = agents.find(a => a.id === id);
    if (!meta) return;
    setSteps([...steps, { id, label: '', input: {}, meta }]);
  };

  const updateStep = (index, key, value) => {
    const arr = [...steps];
    arr[index][key] = value;
    setSteps(arr);
  };

  const updateInput = (index, name, value) => {
    const arr = [...steps];
    arr[index].input[name] = value;
    setSteps(arr);
  };

  const runSimulation = async () => {
    setRunning(true);
    setLogs([]);
    for (const step of steps) {
      setLogs(prev => [...prev, `Running ${step.id}...`]);
      try {
        const res = await fetch('/run-agent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ agent: step.id, input: step.input })
        });
        const data = await res.json();
        if (data.error) {
          setLogs(prev => [...prev, `${step.id} error: ${data.error}`]);
        } else {
          setLogs(prev => [...prev, `${step.id} result: ${JSON.stringify(data.result)}`]);
        }
      } catch (err) {
        setLogs(prev => [...prev, `${step.id} failed: ${err.message}`]);
      }
    }
    setRunning(false);
  };

  const saveStack = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid || !stackName) return alert('Missing name or login');
    const ref = doc(db, 'userStacks', uid, stackName);
    await setDoc(ref, { icon, steps });
    alert('Stack saved');
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-semibold flex items-center gap-2">
        <span>{icon || '🗂️'}</span> Build a Stack
      </h2>
      <div className="flex gap-6">
        <div className="w-1/3">
          <h3 className="font-medium mb-2">Agents</h3>
          <ul className="space-y-2">
            {agents.map(a => (
              <li key={a.id}>
                <button
                  onClick={() => addStep(a.id)}
                  className="w-full text-left px-2 py-1 rounded bg-gray-200 dark:bg-gray-700"
                >
                  {a.name || a.id}
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex-1 space-y-2">
          <input
            type="text"
            placeholder="Stack name"
            value={stackName}
            onChange={e => setStackName(e.target.value)}
            className="w-full p-1 rounded bg-gray-200 dark:bg-gray-700"
          />
          <input
            type="text"
            placeholder="Emoji / icon"
            value={icon}
            onChange={e => setIcon(e.target.value)}
            className="w-full p-1 rounded bg-gray-200 dark:bg-gray-700"
          />
          <Reorder.Group axis="y" onReorder={setSteps} values={steps} className="space-y-2">
            {steps.map((step, idx) => (
              <Reorder.Item key={idx} value={step} className="p-2 rounded bg-white dark:bg-gray-800">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{step.meta?.name || step.id}</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-gray-700 text-white">
                    {step.meta?.status || 'idle'}
                  </span>
                </div>
                <input
                  type="text"
                  placeholder="Label"
                  value={step.label}
                  onChange={e => updateStep(idx, 'label', e.target.value)}
                  className="mt-1 w-full p-1 text-sm rounded bg-gray-200 dark:bg-gray-700"
                />
                {step.meta?.inputs &&
                  Object.keys(step.meta.inputs).map(key => (
                    <input
                      key={key}
                      type="text"
                      placeholder={key}
                      value={step.input[key] || ''}
                      onChange={e => updateInput(idx, key, e.target.value)}
                      className="mt-1 w-full p-1 text-sm rounded bg-gray-200 dark:bg-gray-700"
                    />
                  ))}
              </Reorder.Item>
            ))}
          </Reorder.Group>
          {steps.length > 0 && (
            <div className="space-x-2 mt-2">
              <button
                onClick={runSimulation}
                disabled={running}
                className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded"
              >
                {running ? 'Running...' : 'Run Simulation'}
              </button>
              <button
                onClick={saveStack}
                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded"
              >
                Save Stack
              </button>
            </div>
          )}
          {logs.length > 0 && (
            <pre className="mt-2 bg-black/60 p-2 rounded text-xs text-green-300 whitespace-pre-wrap max-h-40 overflow-auto">
              {logs.join('\n')}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
