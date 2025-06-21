import React from 'react';
import { motion } from 'framer-motion';

export default function OnboardingOverlay({ onComplete }) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="bg-white rounded-lg p-6 text-center shadow-xl">
        <h2 className="text-2xl font-bold mb-4">Onboarding</h2>
        <p className="mb-4">Let's get you set up.</p>
        <button
          onClick={onComplete}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Start
        </button>
      </div>
    </motion.div>
  );
}
