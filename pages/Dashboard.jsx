import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { AnimatePresence } from 'framer-motion';
import AgentSidebar from '../components/AgentSidebar.jsx';
import RealTimeLogConsole from '../components/RealTimeLogConsole.jsx';
import StatusCard from '../components/StatusCard.jsx';
import NeuralAgentMap from '../components/NeuralAgentMap.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { db } from '../frontend/src/firebase';
import logDashboard from '../utils/logDashboard.js';

export default function Dashboard() {
  const { theme, toggleTheme } = useTheme();
  const [agents, setAgents] = useState([]);
  const [collapsed, setCollapsed] = useState(false);
  const [logs, setLogs] = useState({});
  const [decisionLogs, setDecisionLogs] = useState([]);

  useEffect(() => {
    fetch('/agents/agent-metadata.json')
      .then(r => r.json())
      .then(data => setAgents(Object.keys(data || {}).map(id => ({ id, ...data[id] }))))
      .catch(() => setAgents([]));
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'logs'), orderBy('timestamp', 'desc'));
    const unsub = onSnapshot(q, snap => {
      const grouped = {};
      snap.docs.forEach(d => {
        const data = d.data();
        const current = grouped[data.agent];
        if (!current || data.timestamp > current.timestamp) {
          grouped[data.agent] = data;
        }
      });
      setLogs(grouped);
    });
    return unsub;
  }, []);

  useEffect(() => {
    fetch('/logs/agent-decisions')
      .then(r => r.json())
      .then(data => setDecisionLogs(Array.isArray(data) ? data : []))
      .catch(() => setDecisionLogs([]));
  }, []);

  const agentStates = agents.map(a => {
    const log = logs[a.id];
    let status = 'idle';
    if (log) {
      const age = Date.now() - new Date(log.timestamp).getTime();
      status = log.error ? 'error' : age < 5 * 60 * 1000 ? 'running' : 'idle';
    }
    return { ...a, status, log };
  });

  const toggle = () => setCollapsed(c => !c);

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <AgentSidebar agents={agentStates} collapsed={collapsed} onToggle={toggle} onSelect={id => logDashboard('select_agent', { id })} />
      <div className="flex-1 p-4 space-y-4">
        <header className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Agent Dashboard</h1>
          <button onClick={toggleTheme} className="text-sm">Toggle {theme === 'dark' ? 'Light' : 'Dark'} Mode</button>
        </header>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {agentStates.map(a => (
              <StatusCard key={a.id} agent={a} />
            ))}
          </AnimatePresence>
        </div>
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
          logEvents={decisionLogs.map(d => `${d.agent} - ${d.action} (${d.context})`)}
        />
        <RealTimeLogConsole className="h-64" />
      </div>
    </div>
  );
}
