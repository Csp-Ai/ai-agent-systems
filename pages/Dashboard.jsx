import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  doc,
  getDoc,
} from 'firebase/firestore';
import Sidebar from '../components/Sidebar.jsx';
import AgentLogList from '../components/AgentLogList.jsx';
import AgentDetailDrawer from '../components/AgentDetailDrawer.jsx';
import OnboardingModal from '../components/OnboardingModal.jsx';
import BillingPanel from '../frontend/client/BillingPanel.jsx';
import FlowStatusBadge from '../components/FlowStatusBadge.jsx';
import AgentUsageCard from '../components/AgentUsageCard.jsx';
import { db, auth } from '../frontend/src/firebase.js';
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
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [recentFlows, setRecentFlows] = useState([]);
  const [agentUsage, setAgentUsage] = useState({});
  const [trialBadge, setTrialBadge] = useState('');

  useEffect(() => {
    if (!localStorage.getItem('dashboardVisited')) {
      setFirstVisit(true);
      localStorage.setItem('dashboardVisited', 'true');
    }
  }, []);

  useEffect(() => {
    fetch('/logs')
      .then((r) => r.json())
      .then((data) => {
        if (!data.length && !localStorage.getItem('hasSeenOnboarding')) {
          setShowOnboarding(true);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch('/api/agents')
      .then((r) => r.json())
      .then((data) => Array.isArray(data) && setAgents(data))
      .catch(() => setAgents([]));
  }, []);

  useEffect(() => {
    try {
      const uid = auth.currentUser?.uid || 'demo';
      const q = query(
        collection(db, 'flows', uid),
        orderBy('started', 'desc'),
        limit(5)
      );
      const unsub = onSnapshot(q, (snap) => {
        setRecentFlows(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      });
      return unsub;
    } catch (err) {
      console.warn('Firestore unavailable', err);
      setRecentFlows([]);
    }
  }, []);

  useEffect(() => {
    try {
      const uid = auth.currentUser?.uid || 'demo';
      const ref = doc(db, 'users', uid, 'agentUsage', 'summary');
      getDoc(ref)
        .then((snap) => {
          setAgentUsage(snap.exists() ? snap.data() : {});
        })
        .catch(() => setAgentUsage({}));
    } catch (err) {
      console.warn('Firestore unavailable', err);
    }
  }, []);

  useEffect(() => {
    fetch('/billing/info', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` }
    })
      .then((r) => r.json())
      .then((data) => {
        if (
          data.daysRemaining !== null &&
          data.plan !== 'pro' &&
          data.daysRemaining <= 3
        ) {
          setTrialBadge(`Trial – ${data.daysRemaining} days left`);
        }
      })
      .catch(() => {});
  }, []);

  const sidebarItems = [
    { id: 'logs', label: 'Agent Logs' },
    { id: 'reports', label: 'Reports' },
    { id: 'status', label: 'Live Status' },
    { id: 'billing', label: 'Billing' },
  ];

  const runningAgents = agents.map((a) => ({
    id: a.id,
    name: a.name || a.id,
    status: 'running',
  }));

  function flowStatus(flow) {
    if (flow.completed) return 'completed';
    const last = (flow.steps || []).slice(-1)[0];
    if (last && last.error) return 'failed';
    return 'running';
  }

  function timeAgo(ts) {
    if (!ts) return '';
    const diff = Date.now() - new Date(ts).getTime();
    const s = Math.floor(diff / 1000);
    if (s < 60) return `${s}s ago`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    return `${d}d ago`;
  }

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
          {trialBadge && (
            <div className="p-2 bg-yellow-200 text-yellow-800 text-center text-xs">
              {trialBadge}
            </div>
          )}
          {firstVisit && (
            <div className="p-4 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              Welcome to AI Agent Systems — here you’ll see real-time insights, track agents, and monitor performance.
            </div>
          )}
          <div className="p-4 grid gap-4 md:grid-cols-2">
            <div className="border rounded p-4">
              <h2 className="font-semibold mb-2">Recent Flows</h2>
              {recentFlows.length === 0 && (
                <p className="text-sm">No recent flows.</p>
              )}
              {recentFlows.map((flow) => (
                <div key={flow.id} className="flex justify-between text-sm mb-1">
                  <span>{flow.name || flow.id}</span>
                  <FlowStatusBadge status={flowStatus(flow)} />
                  <span className="opacity-70">{timeAgo(flow.finished || flow.started)}</span>
                </div>
              ))}
            </div>
            <AgentUsageCard usage={agentUsage} />
          </div>
          {view === 'logs' && <AgentLogList onSelect={setSelectedLog} />}
          {view === 'status' && <AgentStatusPanel agents={runningAgents} />}
          {view === 'reports' && <div className="p-4">Reports coming soon...</div>}
          {view === 'billing' && (
            <div className="p-4">
              <BillingPanel />
            </div>
          )}
        </main>
      </div>
      <AgentDetailDrawer log={selectedLog} onClose={() => setSelectedLog(null)} />
      <OnboardingModal
        show={showOnboarding}
        onClose={() => {
          localStorage.setItem('hasSeenOnboarding', 'true');
          setShowOnboarding(false);
        }}
      />
    </div>
  );
}
