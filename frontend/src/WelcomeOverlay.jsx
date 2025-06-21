import React from 'react';
import { motion } from 'framer-motion';

export default function WelcomeOverlay({ onDismiss }) {
  return (
    <motion.div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/60"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="bg-white rounded-lg p-6 text-center shadow-xl">
        <h2 className="text-2xl font-bold mb-4">Welcome!</h2>
        <p className="mb-4">Thanks for trying the AI agent demo.</p>
        <button
          onClick={onDismiss}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Continue
        </button>
      </div>
    </motion.div>
  );
}
