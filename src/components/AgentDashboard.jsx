import { useEffect, useState } from 'react';
import LogChart from './LogChart';

export default function AgentDashboard() {
  const [log, setLog] = useState('');

  useEffect(() => {
    fetch('/logs/learning.log')
      .then(res => res.text())
      .then(data => setLog(data));
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold">Agent Log Output (Live)</h2>
      <pre className="bg-black text-green-400 p-2 mt-2 max-h-[500px] overflow-y-scroll rounded-lg shadow">
        {log}
      </pre>
      <LogChart />
    </div>
  );
}
