import React from 'react';
import { motion } from 'framer-motion';

export default function AgentNode({ icon, color = '#06b6d4', name, isActive }) {
  return (
    <motion.div
      className="flex items-center justify-center w-10 h-10 rounded-full text-xl text-white select-none"
      style={{ backgroundColor: color }}
      title={name}
      animate={isActive ? { scale: [1, 1.2, 1], boxShadow: '0 0 12px rgba(0,255,255,0.8)' } : { boxShadow: '0 0 4px rgba(0,0,0,0.5)' }}
      transition={isActive ? { repeat: Infinity, duration: 1.2 } : { duration: 0.3 }}
    >
      {icon}
    </motion.div>
  );
}
