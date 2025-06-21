import React, { useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import NeuralAgentMap from '../components/NeuralAgentMap.jsx';
import StatusCard from '../components/StatusCard.jsx';
import React, { useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import NeuralAgentMap from '../components/NeuralAgentMap.jsx';
import StatusCard from '../components/StatusCard.jsx';
import RealTimeLogConsole from '../components/RealTimeLogConsole.jsx';
import AgentSidebar from '../components/AgentSidebar.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';

export default function Dashboard() {
  const { theme, toggleTheme } = useTheme();
  const [agents, setAgents] = useState([]);
  const [collapsed, setCollapsed] = useState(false);
  const [logEvents, setLogEvents] = useState([]);

  useEffect(() => {
    const loadAgents = async () => {
      try {
        const res = await fetch('/api/agents');
        const data = await res.json();
        setAgents(data);
      } catch {
        setAgents(['insights-agent', 'swat-agent', 'data-agent']);
      }
    };
    loadAgents();
  }, []);

  useEffect(() => {
    const loadLogs = async () => {
      try {
        const res = await fetch('/api/dashboard-logs');
        const data = await res.json();
        setLogEvents(Array.isArray(data) ? data : []);
      } catch {
        setLogEvents([]);
      }
    };
    loadLogs();
  }, []);

  const agentStates = agents.map(id => {
    const log = logEvents.find(l => l.agent === id) || {};
    let status = 'idle';
    if (log.timestamp) {
      const age = Date.now() - new Date(log.timestamp).getTime();
      status = log.error ? 'error' : age < 5 * 60 * 1000 ? 'running' : 'idle';
    }
    return { id, status, log };
  });

  const toggle = () => setCollapsed(c => !c);

  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="p-4 space-y-4">
        <AgentSidebar agents={agentStates} collapsed={collapsed} onToggle={toggle} />
        <RealTimeLogConsole className="h-64" />
      </div>
      <div className="p-4 space-y-4">
        <header className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Agent Dashboard</h1>
          <button onClick={toggleTheme} className="text-sm">Toggle {theme === 'dark' ? 'Light' : 'Dark'} Mode</button>
        </header>
        <div className="grid gap-2 grid-cols-2 md:grid-cols-3">
          <AnimatePresence>
            {agentStates.map(a => (
              <StatusCard key={a.id} agent={a} />
            ))}
          </AnimatePresence>
        </div>
<div className="h-[500px]">
  <NeuralAgentMap
    agents={agentStates.map(a => ({
      name: a.id,
      icon: '🤖',
      color:
        a.status === 'running'
          ? '#10b981'
          : a.status === 'error'
          ? '#ef4444'
          : '#9ca3af'
    }))}
    logEvents={logEvents}
  />
</div>
<RealTimeLogConsole className="h-64" />
      </div>
    </div>
  );
}
