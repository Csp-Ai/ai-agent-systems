import React from 'react';
import { motion } from 'framer-motion';
import sanitize from '../utils/sanitize.js';

export default function AgentLogItem({ log, onSelect }) {
  const ts = log.timestamp ? new Date(log.timestamp).toLocaleString() : '';
  const summary = sanitize(log.output || '').slice(0, 120);
  const status = log.error ? 'Error' : 'Success';
  return (
    <motion.div
      layout
      onClick={() => onSelect(log)}
      className="cursor-pointer p-2 hover:bg-gray-50 dark:hover:bg-gray-700"
    >
      <div className="flex justify-between text-sm font-medium">
        <span>{log.agent}</span>
        <span>{ts}</span>
      </div>
      <div className="text-xs mb-1">{summary}</div>
      <div className="text-xs">
        {log.error ? (
          <span className="text-red-500">❌ {status}</span>
        ) : (
          <span className="text-green-500">✅ {status}</span>
        )}
      </div>
    </motion.div>
  );
}
