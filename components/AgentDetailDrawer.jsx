import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export default function AgentDetailDrawer({ log, onClose }) {
  const ts = log?.timestamp ? new Date(log.timestamp).toLocaleString() : '';
  return (
    <AnimatePresence>
      {log && (
        <motion.div className="fixed inset-0 z-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-black/50" onClick={onClose}></div>
          <motion.div
            className="absolute right-0 top-0 h-full w-full sm:w-96 bg-white dark:bg-gray-800 shadow-xl overflow-y-auto p-4"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween' }}
          >
            <button onClick={onClose} className="text-sm mb-4">
              Close
            </button>
            <h2 className="text-lg font-bold mb-1">{log.agent}</h2>
            <div className="text-xs opacity-80 mb-4">{ts}</div>
            <pre className="whitespace-pre-wrap break-words text-sm mb-4">{log.output}</pre>
            <button
              onClick={() => navigator.clipboard.writeText(log.output || '')}
              className="text-xs underline"
            >
              Copy
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
