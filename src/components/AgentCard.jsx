import React from 'react';
import { motion } from 'framer-motion';

const AgentCard = ({ icon, title, children }) => (
  <motion.div
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.97 }}
    className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 flex flex-col items-center text-center"
  >
    <div className="text-4xl mb-3">{icon}</div>
    <h3 className="font-semibold text-lg mb-2">{title}</h3>
    <p className="text-sm opacity-80">{children}</p>
  </motion.div>
);

export default AgentCard;

