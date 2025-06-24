import { useEffect, useRef, useState } from 'react';
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

export default function AgentMetricsChart() {
  const [data, setData] = useState([]);
  const [agents, setAgents] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    const fetchData = () => {
      fetch('/logs/learning.log')
        .then(res => res.text())
        .then(text => {
          const lines = text.trim().split('\n');
          if (!lines.length) return;
          const [, ...rows] = lines; // skip header
          const entries = rows.map(line => {
            const [timestamp, agent, latency] = line.split(',');
            return { timestamp, agent, latency: Number(latency) };
          });
          const byTime = {};
          entries.forEach(e => {
            const t = new Date(e.timestamp).toLocaleTimeString();
            if (!byTime[t]) byTime[t] = { time: t };
            byTime[t][e.agent] = e.latency;
          });
          setData(Object.values(byTime));
          setAgents([...new Set(entries.map(e => e.agent))]);
          setLastUpdated(new Date());
        });
    };

    fetchData();
    intervalRef.current = setInterval(fetchData, 10000); // poll every 10s
    return () => clearInterval(intervalRef.current);
  }, []);

  return (
    <div className="p-4 bg-white rounded shadow mt-4">
      <h2 className="text-lg font-semibold mb-2">Agent Latency Over Time</h2>
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
      <p className="text-xs text-gray-500 mt-2">
        Last updated: {lastUpdated ? lastUpdated.toLocaleTimeString() : 'N/A'}
      </p>
    </div>
  );
}
