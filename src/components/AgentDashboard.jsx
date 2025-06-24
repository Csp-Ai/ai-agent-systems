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
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <header className="p-4 bg-gray-800 text-white dark:bg-gray-900">
        <h1 className="text-lg font-semibold">AI Agent Systems</h1>
      </header>
      <main className="p-4 grid gap-4 md:grid-cols-2 flex-1">
        <section className="bg-white dark:bg-gray-800 rounded shadow p-4 flex flex-col">
          <AgentStatusStrip />
          <h2 className="text-xl font-bold mt-2">Agent Log Output (Live)</h2>
          <pre className="bg-black text-green-400 p-2 mt-2 max-h-[500px] overflow-y-scroll rounded">
            {log}
          </pre>
        </section>
        <section className="bg-white dark:bg-gray-800 rounded shadow p-4">
          <AgentMetricsChart />
        </section>
      </main>
    </div>
  );
}
