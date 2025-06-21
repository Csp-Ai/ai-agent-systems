import React from 'react';
import { motion } from 'framer-motion';
import sanitize from '../utils/sanitize.js';

export default function StatusCard({ agent }) {
  const log = agent.log || {};
  const summary = sanitize(log.output || '').slice(0, 100);
  const ts = log.timestamp ? new Date(log.timestamp).toLocaleString() : '-';
  return (
    <motion.div layout className="bg-white dark:bg-gray-800 rounded p-4 space-y-1">
      <div className="font-semibold">{sanitize(agent.name || agent.id)}</div>
      <div className="text-xs opacity-80">{ts}</div>
      <div className="text-sm break-words">{summary}</div>
    </motion.div>
  );
}
