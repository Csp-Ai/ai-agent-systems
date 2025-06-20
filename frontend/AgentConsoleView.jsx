import React, { useState, useEffect } from 'react';

export default function AgentConsoleView() {
  const [logs, setLogs] = useState([]);
  const [agents, setAgents] = useState([
    { id: 'insights-agent', label: 'Insights', status: 'idle' },
    { id: 'trends-agent', label: 'Trends', status: 'idle' },
    { id: 'strategy-agent', label: 'Strategy', status: 'idle' },
    { id: 'report-agent', label: 'Report', status: 'idle' },
  ]);

  useEffect(() => {
    const eventSource = new EventSource('/api/agent-logs');
    eventSource.onmessage = e => {
      const msg = JSON.parse(e.data);
      setLogs(prev => [...prev.slice(-50), msg.log]);
      setAgents(prev =>
        prev.map(agent =>
          agent.id === msg.agent ? { ...agent, status: msg.status } : agent
        )
      );
    };
    return () => eventSource.close();
  }, []);

  return (
    <div className="grid grid-cols-2 gap-4 p-4">
      <div className="bg-black text-green-400 text-xs font-mono p-3 rounded-xl max-h-60 overflow-y-auto">
        {logs.map((line, idx) => (
          <div key={idx} className="whitespace-pre-wrap">{line}</div>
        ))}
      </div>

      <div className="relative w-full h-60 bg-purple-900 rounded-xl flex items-center justify-around">
        {agents.map(agent => (
          <div key={agent.id} className="flex flex-col items-center text-white">
            <div
              className={`w-4 h-4 mb-2 rounded-full animate-ping ${
                agent.status === 'working'
                  ? 'bg-blue-400'
                  : agent.status === 'done'
                    ? 'bg-green-400'
                    : 'bg-gray-400'
              }`}
            />
            <div className="text-sm">{agent.label}</div>
          </div>
        ))}

        {/* Visual connector arcs go here in Prompt 2 */}
      </div>
    </div>
  );
}
