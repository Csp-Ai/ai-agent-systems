import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const TourOverlay = ({ step, steps, onNext, onClose }) => (
  <AnimatePresence>
    {step !== null && (
      <motion.div
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white dark:bg-gray-800 rounded-lg p-6 text-center max-w-sm"
        >
          <p className="mb-4">{steps[step]}</p>
          <div className="space-x-4">
            {step < steps.length - 1 ? (
              <button onClick={onNext} className="bg-blue-600 text-white px-4 py-1 rounded">
                Next
              </button>
            ) : (
              <button onClick={onClose} className="bg-green-600 text-white px-4 py-1 rounded">
                Done
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

export default TourOverlay;

