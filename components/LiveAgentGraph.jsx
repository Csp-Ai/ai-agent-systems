import React, { useEffect, useRef } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { motion, AnimatePresence } from 'framer-motion';

const sampleData = {
  nodes: [
    { id: 'status', emoji: '🧠' },
    { id: 'insights', emoji: '📊' },
    { id: 'logs', emoji: '⚙️' },
    { id: 'proposals', emoji: '📝' }
  ],
  links: [
    { source: 'status', target: 'insights' },
    { source: 'status', target: 'logs' },
    { source: 'logs', target: 'proposals' }
  ]
};

const LiveAgentGraph = ({ logs = [] }) => {
  const fgRef = useRef();

  useEffect(() => {
    if (fgRef.current) {
      fgRef.current.d3Force('charge').strength(-200);
    }
  }, []);

  return (
    <div className="relative h-64 w-full">
      <ForceGraph2D
        ref={fgRef}
        graphData={sampleData}
        nodeLabel="id"
        nodeCanvasObject={(node, ctx, globalScale) => {
          const label = node.emoji;
          ctx.font = `${12 / globalScale}px serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(label, node.x, node.y);
        }}
      />
      <div className="absolute bottom-2 left-2 space-y-1 text-xs">
        <AnimatePresence>
          {logs.slice(-3).map((log, idx) => (
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
    </div>
  );
};

export default LiveAgentGraph;

