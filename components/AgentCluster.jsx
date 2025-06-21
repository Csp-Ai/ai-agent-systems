import React from 'react';
import { motion } from 'framer-motion';

const avatars = [
  'https://placekitten.com/80/80',
  'https://placekitten.com/81/81',
  'https://placekitten.com/82/82',
  'https://placekitten.com/83/83'
];

const generatePosition = () => ({
  x: Math.random() * 100 - 50,
  y: Math.random() * 100 - 50
});

const AgentCluster = () => {
  return (
    <div className="relative w-full h-80 sm:h-full">
      {avatars.map((src, idx) => (
        <motion.img
          key={idx}
          src={src}
          className="absolute w-16 h-16 rounded-full border-2 border-white shadow-lg"
          style={{ top: '50%', left: '50%', marginTop: -32, marginLeft: -32 }}
          animate={generatePosition()}
          transition={{
            duration: 4,
            repeat: Infinity,
            repeatType: 'mirror',
            ease: 'easeInOut',
            delay: idx * 0.3
          }}
        />
      ))}
    </div>
  );
};

export default AgentCluster;
