import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const personas = {
  builder: {
    title: 'Builder/Dev',
    message: 'Check out our agent simulation tools to rapidly prototype new ideas.',
    cta: { text: 'Open Simulators', href: '/agents' }
  },
  business: {
    title: 'Small Business Owner',
    message: 'Use the selector to discover high-impact agent use cases for your business.',
    cta: { text: 'See Use Cases', href: '/use-cases' }
  },
  investor: {
    title: 'Investor/Viewer',
    message: 'Review the executive summary or try the live demo to see agents in action.',
    cta: { text: 'View Demo', href: '/demo' }
  }
};

export default function WelcomeOverlay() {
  const [show, setShow] = useState(false);
  const [persona, setPersona] = useState('');

  useEffect(() => {
    const acknowledged = localStorage.getItem('welcomeAcknowledged');
    if (acknowledged) return;
    const stored = localStorage.getItem('userPersona');
    if (stored) setPersona(stored);
    setShow(true);
  }, []);

  const handlePersona = type => {
    localStorage.setItem('userPersona', type);
    setPersona(type);
  };

  const acknowledge = () => {
    localStorage.setItem('welcomeAcknowledged', 'true');
    setShow(false);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-40 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 backdrop-blur-sm bg-black/40" />
          <motion.div
            className="relative bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl z-50 max-w-sm w-full text-center"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
          >
            {!persona && (
              <>
                <h2 className="text-xl font-semibold mb-4">Welcome! Who are you?</h2>
                <div className="space-y-2">
                  {Object.keys(personas).map(key => (
                    <button
                      key={key}
                      onClick={() => handlePersona(key)}
                      className="w-full py-2 rounded-md bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                    >
                      {personas[key].title}
                    </button>
                  ))}
                </div>
                <button onClick={acknowledge} className="mt-4 text-sm text-gray-500">
                  Skip
                </button>
              </>
            )}
            {persona && (
              <>
                <h2 className="text-xl font-semibold mb-2">Welcome {personas[persona].title}!</h2>
                <p className="mb-4 text-sm">{personas[persona].message}</p>
                <a
                  href={personas[persona].cta.href}
                  className="block bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md mb-3"
                  onClick={acknowledge}
                >
                  {personas[persona].cta.text}
                </a>
                <button onClick={acknowledge} className="text-sm text-gray-500">
                  Close
                </button>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
