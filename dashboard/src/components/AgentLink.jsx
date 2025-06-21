import React from 'react';
import { motion } from 'framer-motion';

export default function AgentLink({ source, target, isActive }) {
  if (!source || !target) return null;
  const midX = (source.x + target.x) / 2;
  const midY = Math.min(source.y, target.y) - 40;
  const d = `M ${source.x} ${source.y} Q ${midX} ${midY} ${target.x} ${target.y}`;
  return (
    <motion.path
      d={d}
      stroke="#0ff"
      strokeWidth={2}
      fill="none"
      initial={false}
      animate={isActive ? { opacity: 1, pathLength: [0, 1, 0] } : { opacity: 0.4, pathLength: 1 }}
      transition={isActive ? { duration: 1.2, repeat: Infinity } : { duration: 0.4 }}
    />
  );
}
