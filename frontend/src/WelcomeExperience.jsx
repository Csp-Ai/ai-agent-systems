import React from 'react';
import { motion } from 'framer-motion';

export default function WelcomeExperience({ onFinish }) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="bg-white rounded-lg p-6 max-w-md text-center shadow-xl">
        <h2 className="text-2xl font-bold mb-4">Getting Started</h2>
        <p className="mb-4">This short tour will walk you through the basics.</p>
        <button
          onClick={onFinish}
          className="px-4 py-2 bg-green-600 text-white rounded"
        >
          Finish
        </button>
      </div>
    </motion.div>
  );
}
