import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export default function Dashboard() {
  const [logs, setLogs] = useState('');
  const [data, setData] = useState([]);
  const [agents, setAgents] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    const fetchLogs = () => {
      fetch('/logs/learning.log')
        .then((res) => res.text())
        .then((text) => {
          setLogs(text.trim());
          const lines = text.trim().split('\n');
          if (!lines.length) return;
          const [, ...rows] = lines; // skip header
          const entries = rows.map((line) => {
            const [timestamp, agent, latency] = line.split(',');
            return {
              time: new Date(timestamp).toLocaleTimeString(),
              agent,
              latency: Number(latency),
            };
          });
          const byTime = {};
          entries.forEach((e) => {
            if (!byTime[e.time]) byTime[e.time] = { time: e.time };
            byTime[e.time][e.agent] = e.latency;
          });
          setData(Object.values(byTime));
          setAgents([...new Set(entries.map((e) => e.agent))]);
          setLastUpdated(new Date());
        });
    };

    fetchLogs();
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <header className="p-4 bg-gray-800 text-white">
        <h1 className="text-2xl font-bold">AI Agent Systems</h1>
      </header>
      <main className="flex-1 p-4 space-y-4">
        <section className="bg-white dark:bg-gray-800 rounded shadow p-4">
          <h2 className="text-xl font-semibold mb-2">Agent Log Output (Live)</h2>
          <pre className="bg-black text-green-400 p-2 rounded max-h-60 overflow-y-auto whitespace-pre-wrap">
            {logs}
          </pre>
        </section>
        <section className="bg-white dark:bg-gray-800 rounded shadow p-4">
          <h2 className="text-xl font-semibold mb-2">Agent Latency Over Time</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Legend />
              {agents.map((agent, idx) => (
                <Line
                  key={agent}
                  type="monotone"
                  dataKey={agent}
                  stroke={`hsl(${idx * 90}, 70%, 50%)`}
                  dot={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </section>
      </main>
      <footer className="p-4 text-center text-sm bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
        Last updated: {lastUpdated ? lastUpdated.toLocaleTimeString() : 'N/A'}
      </footer>
    </div>
  );
}
