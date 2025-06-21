import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import sanitize from '../utils/sanitize.js';
import logDashboard from '../utils/logDashboard.js';

export default function AgentSidebar({ agents = [], collapsed = false, onToggle = () => {}, onSelect = () => {} }) {
  const toggle = () => {
    onToggle();
    logDashboard('toggle_sidebar', { collapsed: !collapsed });
  };

  return (
    <div className={`bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all duration-300 ${collapsed ? 'w-12' : 'w-56'} flex flex-col`}>
      <button onClick={toggle} className="p-2 text-left text-sm">{collapsed ? '▶' : '◀'}</button>
      <AnimatePresence initial={false}>
        {!collapsed && agents.map(a => (
          <motion.button
            key={a.id}
            layout
            onClick={() => { onSelect(a.id); logDashboard('select_agent', { id: a.id }); }}
            className="flex items-center justify-between px-2 py-1 text-sm hover:bg-gray-300 dark:hover:bg-gray-700"
          >
            <span>{sanitize(a.name || a.id)}</span>
            <span>{a.status === 'running' ? '🟢' : a.status === 'error' ? '🔴' : '🟡'}</span>
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  );
}
