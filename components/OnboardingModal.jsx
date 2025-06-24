import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function OnboardingModal({ show, onClose }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/50" onClick={onClose}></div>
          <motion.div
            className="relative bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl z-50 max-w-sm w-full text-center"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
          >
            <h2 className="text-xl font-semibold mb-2">Welcome to AI Agent Systems</h2>
            <p className="mb-4 text-sm">Get started by running a sample agent or browsing the library.</p>
            <div className="space-y-2">
              <a href="/agents" className="block bg-blue-600 text-white py-2 rounded">Run a sample agent</a>
              <a href="/agents" className="block bg-green-600 text-white py-2 rounded">View agent library</a>
              <a href="/billing" className="block bg-purple-600 text-white py-2 rounded">Connect billing</a>
            </div>
            <button onClick={onClose} className="mt-4 text-sm text-gray-500">Close</button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
