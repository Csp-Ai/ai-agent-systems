import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

const defaultNodes = [
  { id: 'scraper', name: 'Website Scraper', icon: '🌐', color: '#3b82f6' },
  { id: 'analyst', name: 'Data Analyst', icon: '📊', color: '#10b981' },
  { id: 'research', name: 'Market Research', icon: '📈', color: '#f59e0b' },
  { id: 'gtm', name: 'GTM Strategy', icon: '🎯', color: '#ef4444' },
  { id: 'dashboard', name: 'Dashboard Generator', icon: '🖥️', color: '#8b5cf6' }
];

export default function LaunchFlowHero({ autoplay = true, playOnce = false, className = '' }) {
  const [active, setActive] = useState(-1);
  const containerRef = useRef(null);
  const nodeRefs = useRef({});
  const [positions, setPositions] = useState({});

  useEffect(() => {
    if (!autoplay) return;
    let step = 0;
    setActive(0);
    const id = setInterval(() => {
      step += 1;
      if (step >= defaultNodes.length) {
        if (playOnce) {
          clearInterval(id);
        }
        step = 0;
      }
      setActive(step);
    }, 1200);
    return () => clearInterval(id);
  }, [autoplay, playOnce]);

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pos = {};
    defaultNodes.forEach(n => {
      const el = nodeRefs.current[n.id];
      if (el) {
        const r = el.getBoundingClientRect();
        pos[n.id] = { x: r.left + r.width / 2 - rect.left, y: r.top + r.height / 2 - rect.top };
      }
    });
    setPositions(pos);
  });

  return (
    <div
      ref={containerRef}
      className={`relative mx-auto max-w-3xl py-12 px-4 md:px-8 ${className}`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg" />
      <div className="relative flex flex-wrap justify-center gap-10">
        {defaultNodes.map((node, idx) => (
          <motion.div
            key={node.id}
            ref={el => (nodeRefs.current[node.id] = el)}
            className="flex flex-col items-center text-center"
            animate={idx === active ? { scale: 1.15, filter: 'brightness(1.2)' } : { scale: 1, filter: 'brightness(1)' }}
            transition={{ duration: 0.6 }}
          >
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-2xl font-semibold"
              style={{ border: `2px solid ${node.color}` }}
            >
              {node.icon}
            </div>
            <div className="mt-2 text-sm text-white w-24 leading-tight">{node.name}</div>
          </motion.div>
        ))}
      </div>
      <svg className="absolute inset-0 w-full h-full pointer-events-none" strokeWidth="2" fill="none">
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="white" />
          </marker>
        </defs>
        {defaultNodes.slice(0, -1).map((n, i) => {
          const s = positions[n.id];
          const t = positions[defaultNodes[i + 1].id];
          if (!s || !t) return null;
          return (
            <motion.line
              key={n.id}
              x1={s.x}
              y1={s.y}
              x2={t.x}
              y2={t.y}
              stroke="white"
              markerEnd="url(#arrow)"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: active >= i + 1 ? 1 : 0 }}
              transition={{ duration: 0.6 }}
            />
          );
        })}
      </svg>
      <motion.div
        className="relative mt-12 text-center text-lg font-medium text-white"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        "Explainable AI workflows. Built with agents you control."
      </motion.div>
    </div>
  );
}
