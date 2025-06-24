import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { AnimatePresence, motion } from 'framer-motion';
import { db } from '../src/firebase.js';
import sanitize from '../../utils/sanitize.js';

export default function RealTimeLogConsole({ className = '' }) {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const q = query(collection(db, 'logs'), orderBy('timestamp', 'desc'), limit(20));
    const unsub = onSnapshot(q, snap => {
      setLogs(snap.docs.map(d => d.data()));
    });
    return unsub;
  }, []);

  return (
    <div className={`bg-gray-900 text-gray-100 p-4 rounded overflow-y-auto ${className}`}>
      <AnimatePresence initial={false}>
        {logs.map((log, i) => (
          <motion.div
            key={log.timestamp + i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-xs font-mono"
          >
            <span className="text-green-400 mr-1">{log.agent}</span>
            {sanitize(log.output || '').slice(0, 120)}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
