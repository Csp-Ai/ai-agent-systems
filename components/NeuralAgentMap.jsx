import React, { useEffect, useRef, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import React, { useEffect, useRef, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { motion } from 'framer-motion';

export default function NeuralAgentMap({ agents = [], logEvents = [] }) {
  const fgRef = useRef();
  const [links, setLinks] = useState([]);

  // Apply force layout charge strength
  useEffect(() => {
    if (fgRef.current) {
      fgRef.current.d3Force('charge').strength(-80);
    }
  }, []);

  // Reheat simulation periodically to keep layout floating
  useEffect(() => {
    const t = setInterval(() => {
      if (fgRef.current) fgRef.current.d3ReheatSimulation();
    }, 3000);
    return () => clearInterval(t);
  }, []);

  // Convert log events into new or updated links
  useEffect(() => {
    if (!logEvents.length) return;
    const parsed = logEvents
      .map(msg => {
        const fromMatch = msg.match(/\[?([\w-]+)\]?/);
        const toMatch = msg.match(/->\s*([\w-]+)/) || msg.match(/to\s+\[?([\w-]+)\]?/);
        return fromMatch && toMatch ? { from: fromMatch[1], to: toMatch[1] } : null;
      })
      .filter(Boolean);
    if (!parsed.length) return;

    const now = Date.now();
    setLinks(curr => {
      const next = [...curr];
      parsed.forEach(p => {
        const idx = next.findIndex(l => l.source === p.from && l.target === p.to);
        if (idx > -1) next[idx].ts = now;
        else next.push({ source: p.from, target: p.to, ts: now });
      });
      return next;
    });
  }, [logEvents]);

  // Remove expired links (10s)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setLinks(ls => ls.filter(l => now - l.ts < 10000));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const nodes = agents.map(a => ({
    id: a.name,
    name: a.name,
    icon: a.icon,
    color: a.color
  }));

  const drawNode = (node, ctx, globalScale) => {
    const size = 12;
    const fontSize = 14 / globalScale;

    ctx.beginPath();
    ctx.arc(node.x, node.y, size, 0, 2 * Math.PI);
    ctx.fillStyle = node.color || '#4f46e5';
    ctx.fill();

    ctx.font = `${fontSize}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#fff';
    ctx.fillText(node.icon || '🤖', node.x, node.y + size);
  };

  return (
    <div className="rounded-lg overflow-hidden shadow-md h-[500px] bg-white dark:bg-gray-900">
      <ForceGraph2D
        ref={fgRef}
        graphData={{ nodes, links }}
        nodeCanvasObject={drawNode}
        nodePointerAreaPaint={drawNode}
        linkDirectionalParticles={1}
        linkDirectionalParticleSpeed={0.005}
      />
    </div>
  );
}
    ctx.fill();
    ctx.font = `${fontSize}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff';
return (
  <motion.div className="relative w-full h-[500px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
    <ForceGraph2D
      ref={fgRef}
      graphData={{ nodes, links }}
      nodeCanvasObject={(node, ctx, globalScale) => {
        const size = 12;
        const fontSize = 14 / globalScale;

        ctx.beginPath();
        ctx.arc(node.x, node.y, size, 0, 2 * Math.PI);
        ctx.fillStyle = node.color || '#4f46e5';
        ctx.fill();

        ctx.font = `${fontSize}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillStyle = '#fff';
        ctx.fillText(node.icon || '🤖', node.x, node.y + size);
      }}
      nodePointerAreaPaint={(node, color, ctx) => {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(node.x, node.y, 12, 0, 2 * Math.PI);
        ctx.fill();
      }}
      linkDirectionalParticles={2}
      linkDirectionalParticleSpeed={() => 0.005}
      linkDirectionalParticleWidth={() => 2}
      linkColor={() => '#aaa'}
      enableNodeDrag={false}
      onNodeClick={node => console.log(node.name)}
    />
    <div className="absolute bottom-2 left-2 space-y-1 text-xs pointer-events-none">
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
  </motion.div>
);
    </motion.div>
  );
}
