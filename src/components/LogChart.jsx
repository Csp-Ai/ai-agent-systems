import { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

export default function LogChart() {
  const [data, setData] = useState([]);
  const [metric, setMetric] = useState('latency');

  useEffect(() => {
    const fetchData = () => {
      fetch('/logs/learning.log')
        .then(res => res.text())
        .then(text => {
          const parsed = text
            .split('\n')
            .filter(line => line.trim() && line.includes('{'))
            .map(line => {
              try {
                const json = JSON.parse(line);
                return {
                  time: new Date(json.timestamp).toLocaleTimeString(),
                  value: json.value,
                  agent: json.agent,
                  metric: json.metric,
                };
              } catch {
                return null;
              }
            })
            .filter(Boolean)
            .filter(entry => entry.metric === metric);
          setData(parsed);
        });
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [metric]);

  const agents = [...new Set(data.map(d => d.agent))];

  return (
    <div className="p-4 bg-white rounded shadow mt-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold">Agent Metric Chart</h2>
        <select
          value={metric}
          onChange={(e) => setMetric(e.target.value)}
          className="border rounded px-2 py-1 text-sm"
        >
          <option value="latency">Latency</option>
          <option value="accuracy">Accuracy</option>
          <option value="score">Score</option>
          <option value="loss">Loss</option>
        </select>
      </div>
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
              dataKey="value"
              data={data.filter(d => d.agent === agent)}
              stroke={`hsl(${idx * 90}, 70%, 50%)`}
              name={agent}
              dot={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
