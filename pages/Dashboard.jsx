import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Sidebar from '../components/Sidebar.jsx';
import AgentLogList from '../components/AgentLogList.jsx';
import AgentDetailDrawer from '../components/AgentDetailDrawer.jsx';
import { useTheme } from '../context/ThemeContext.jsx';

function AgentStatusPanel({ agents = [] }) {
  return (
    <div className="p-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
      {agents.map((a) => (
        <motion.div
          key={a.id}
          layout
          className="border rounded p-2 flex justify-between items-center"
        >
          <span>{a.name || a.id}</span>
          <motion.span
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className={a.status === 'running' ? 'text-green-600' : 'text-red-600'}
          >
            {a.status === 'running' ? '✅ Running' : '❌ Failed'}
          </motion.span>
        </motion.div>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const { theme, toggleTheme } = useTheme();
  const [view, setView] = useState('logs');
  const [selectedLog, setSelectedLog] = useState(null);
  const [agents, setAgents] = useState([]);
  const [firstVisit, setFirstVisit] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem('dashboardVisited')) {
      setFirstVisit(true);
      localStorage.setItem('dashboardVisited', 'true');
    }
  }, []);

  useEffect(() => {
    fetch('/api/agents')
      .then((r) => r.json())
      .then((data) => Array.isArray(data) && setAgents(data))
      .catch(() => setAgents([]));
  }, []);

  const sidebarItems = [
    { id: 'logs', label: 'Agent Logs' },
    { id: 'reports', label: 'Reports' },
    { id: 'status', label: 'Live Status' },
  ];

  const runningAgents = agents.map((a) => ({
    id: a.id,
    name: a.name || a.id,
    status: 'running',
  }));

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <Sidebar items={sidebarItems} current={view} onSelect={setView} />
      <div className="flex-1 flex flex-col">
        <header className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h1 className="font-bold text-xl">Dashboard</h1>
          <button onClick={toggleTheme} className="text-sm">
            Toggle {theme === 'dark' ? 'Light' : 'Dark'} Mode
          </button>
        </header>
        <main className="flex-1 overflow-hidden">
          {firstVisit && (
            <div className="p-4 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              Welcome to AI Agent Systems — here you’ll see real-time insights, track agents, and monitor performance.
            </div>
          )}
          {view === 'logs' && <AgentLogList onSelect={setSelectedLog} />}
          {view === 'status' && <AgentStatusPanel agents={runningAgents} />}
          {view === 'reports' && <div className="p-4">Reports coming soon...</div>}
        </main>
      </div>
      <AgentDetailDrawer log={selectedLog} onClose={() => setSelectedLog(null)} />
    </div>
  );
}
