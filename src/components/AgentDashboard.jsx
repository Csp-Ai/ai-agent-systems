import { useEffect, useState } from "react";
import AgentMetricsChart from "./AgentMetricsChart";
import AgentStatusStrip from "./AgentStatusStrip";

export default function AgentDashboard() {
  const [log, setLog] = useState("");

  useEffect(() => {
    const fetchLog = () => {
      fetch("/logs/learning.log")
        .then((res) => res.text())
        .then((data) => setLog(data));
    };

    fetchLog();
    const interval = setInterval(fetchLog, 3000); // Refresh every 3s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-4">
      <AgentStatusStrip />
      <h2 className="text-xl font-bold">Agent Log Output (Live)</h2>
      <pre className="bg-black text-green-400 p-2 mt-2 max-h-[500px] overflow-y-scroll rounded-lg shadow">
        {log}
      </pre>
      <AgentMetricsChart />
    </div>
  );
}
