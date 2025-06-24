import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, onSnapshot } from 'firebase/firestore';
import AgentDetailDrawer from './AgentDetailDrawer.jsx';
import { db } from '../frontend/src/firebase.js';

const statusStyles = {
  waiting: 'border-gray-400 text-gray-400',
  running: 'border-blue-500 text-blue-500',
  complete: 'border-green-500 text-green-500',
  error: 'border-red-500 text-red-500'
};

export default function NeuralAgentFlow({ nodes: propNodes = [], edges: propEdges = [], flowId }) {
  const [nodes, setNodes] = useState(propNodes);
  const [edges, setEdges] = useState(propEdges);
  const [selected, setSelected] = useState(null);

  // Live updates from Firestore if flowId provided
  useEffect(() => {
    if (!flowId || !db.collection) return;
    const nodesCol = collection(db, 'flows', flowId, 'nodes');
    const edgesCol = collection(db, 'flows', flowId, 'edges');
    const unsubNodes = onSnapshot(nodesCol, snap => {
      const arr = [];
      snap.forEach(doc => arr.push({ id: doc.id, ...doc.data() }));
      setNodes(arr);
    });
    const unsubEdges = onSnapshot(edgesCol, snap => {
      const arr = [];
      snap.forEach(doc => arr.push({ id: doc.id, ...doc.data() }));
      setEdges(arr);
    });
    return () => {
      unsubNodes();
      unsubEdges();
    };
  }, [flowId]);

  useEffect(() => { setNodes(propNodes); }, [propNodes]);
  useEffect(() => { setEdges(propEdges); }, [propEdges]);

  const containerRef = useRef(null);
  const nodeRefs = useRef({});
  const [positions, setPositions] = useState({});

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pos = {};
    nodes.forEach(n => {
      const el = nodeRefs.current[n.id];
      if (el) {
        const r = el.getBoundingClientRect();
        pos[n.id] = { x: r.left + r.width / 2 - rect.left, y: r.top + r.height / 2 - rect.top };
      }
    });
    setPositions(pos);
  }, [nodes, edges]);

  return (
    <div className="relative w-full" ref={containerRef}>
      <div className="flex gap-8">
        {nodes.map((node, idx) => (
          <motion.div
            key={node.id}
            ref={el => (nodeRefs.current[node.id] = el)}
            onClick={() => setSelected(node)}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className={`cursor-pointer border-2 rounded-lg p-4 bg-gray-800 text-white w-52 ${statusStyles[node.status]}`}
          >
            <div className="font-semibold mb-1 text-sm">{node.name}</div>
            <div className="text-xs mb-1 capitalize">{node.status}</div>
            {node.status === 'complete' && (
              <div className="text-xs text-gray-300 truncate">{node.outputSnippet || ''}</div>
            )}
            {node.status === 'error' && (
              <div className="text-xs text-red-300">Error: {node.error}</div>
            )}
          </motion.div>
        ))}
      </div>
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <defs>
          <marker
            id="arrow"
            viewBox="0 0 10 10"
            refX="10"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#888" />
          </marker>
        </defs>
        {edges.map((e, i) => {
          const s = positions[e.from];
          const t = positions[e.to];
          if (!s || !t) return null;
          return (
            <line
              key={i}
              x1={s.x}
              y1={s.y}
              x2={t.x}
              y2={t.y}
              stroke="#888"
              strokeWidth="2"
              strokeDasharray="4 4"
              markerEnd="url(#arrow)"
            />
          );
        })}
      </svg>
      <AgentDetailDrawer log={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
