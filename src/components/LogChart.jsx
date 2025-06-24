import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function LogChart() {
  const [data, setData] = useState([]);

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
                };
              } catch {
                return null;
              }
            })
            .filter(Boolean);
          setData(parsed);
        });
    };

    fetchData();
    const interval = setInterval(fetchData, 5000); // auto-update every 5s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-4 mt-4 bg-white rounded shadow">
      <h2 className="text-lg font-semibold mb-2">Agent Metric Chart</h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="value" stroke="#8884d8" name="Metric Value" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
