import { useEffect, useState } from "react";

const thresholds = {
  latency: { good: 300, warning: 600 },
  accuracy: { good: 0.9, warning: 0.7 },
};

function getColor(metric, value) {
  const t = thresholds[metric] || {};
  if (metric === "accuracy") {
    if (value >= t.good) return "bg-green-500";
    if (value >= t.warning) return "bg-yellow-500";
    return "bg-red-500";
  } else {
    if (value <= t.good) return "bg-green-500";
    if (value <= t.warning) return "bg-yellow-500";
    return "bg-red-500";
  }
}

export default function AgentStatusStrip() {
  const [latest, setLatest] = useState([]);

  useEffect(() => {
    const fetchLog = () => {
      fetch("/logs/learning.log")
        .then((res) => res.text())
        .then((text) => {
          const lines = text.trim().split("\n");
          const entries = lines
            .map((line) => {
              try {
                return JSON.parse(line);
              } catch {
                return null;
              }
            })
            .filter(Boolean);

          const newestByAgent = {};
          for (let i = entries.length - 1; i >= 0; i--) {
            const e = entries[i];
            if (!newestByAgent[e.agent] && e.value !== undefined) {
              newestByAgent[e.agent] = e;
            }
          }

          setLatest(Object.values(newestByAgent));
        });
    };

    fetchLog();
    const interval = setInterval(fetchLog, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex gap-2 p-2 bg-gray-900 text-white text-sm overflow-x-auto">
      {latest.map(({ agent, metric, value }, i) => (
        <div
          key={i}
          className={`rounded px-3 py-1 font-mono ${getColor(metric, value)} text-black`}
        >
          {agent}: {metric} = {value}
        </div>
      ))}
    </div>
  );
}
