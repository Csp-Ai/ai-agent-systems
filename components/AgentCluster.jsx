import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const randomRange = (min, max) => Math.random() * (max - min) + min;

const defaultAvatars = [
  {
    icon: '🧠',
    name: 'trends-agent',
    color: '#6366f1'
  },
  {
    icon: '📦',
    name: 'swat-agent',
    color: '#10b981'
  },
  {
    icon: '🧪',
    name: 'insights-agent',
    color: '#f59e0b'
  },
  {
    icon: '📈',
    name: 'forecast-agent',
    color: '#ef4444'
  }
];

const AgentCluster = ({ agents = defaultAvatars, logEvents = [] }) => {
  const radius = 70;
  const positions = useMemo(
    () =>
      agents.map((_, i) => {
        const angle = (i / agents.length) * Math.PI * 2;
        return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
      }),
    [agents]
  );

  return (
    <div className="relative w-64 h-64 sm:w-80 sm:h-80 rounded-lg bg-white/10 dark:bg-black/20 backdrop-blur p-4 shadow-xl">
      {/* Floating agents */}
      {positions.map((pos, idx) => {
        const agent = agents[idx];
        const floatX = randomRange(-10, 10);
        const floatY = randomRange(-10, 10);
        const dur = randomRange(4, 8);

        return (
          <motion.div
            key={agent.name}
            title={`${agent.icon} ${agent.name}`}
            className="absolute flex items-center justify-center w-10 h-10 rounded-full text-xl text-white shadow-md"
            style={{
              left: `calc(50% + ${pos.x}px)`,
              top: `calc(50% + ${pos.y}px)`,
              backgroundColor: agent.color
            }}
            animate={{
              x: [0, floatX, -floatX, 0],
              y: [0, floatY, -floatY, 0]
            }}
            transition={{
              duration: dur,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          >
            {agent.icon}
          </motion.div>
        );
      })}

      {/* Animated links */}
      <motion.svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        stroke="currentColor"
        fill="none"
      >
        {positions.map((p1, i) => {
          const p2 = positions[(i + 1) % positions.length];
          return (
            <motion.line
              key={i}
              x1={p1.x + 128}
              y1={p1.y + 128}
              x2={p2.x + 128}
              y2={p2.y + 128}
              strokeWidth="1"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: [0, 1, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          );
        })}
      </motion.svg>

      {/* Log overlay */}
      {logEvents.length > 0 && (
        <div className="absolute bottom-2 left-2 space-y-1 text-xs z-10">
          <AnimatePresence>
            {logEvents.slice(-3).map((log, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-black/70 text-white px-2 py-1 rounded"
              >
                {log}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default AgentCluster;

