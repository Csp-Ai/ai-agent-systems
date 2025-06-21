import React, { useEffect, useRef, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { motion } from 'framer-motion';
import parseLogs from '../utils/parseAgentLogs.js';
import styles from '../styles/AgentGraph.module.css';

export default function NeuralAgentMap({ agents = [], logEvents = [] }) {
  const [nodes, setNodes] = useState([]);
  const [links, setLinks] = useState([]);
  const graphRef = useRef();
  const expireMs = 15000;

  useEffect(() => {
    setNodes(agents.map(id => ({ id, name: id })));
  }, [agents]);

  useEffect(() => {
    if (logEvents.length) handleLogs(logEvents);
  }, [logEvents]);

  const handleLogs = events => {
    const updates = parseLogs(events);
    if (!updates.length) return;
    setLinks(curr => {
      const now = Date.now();
      const next = [...curr];
      updates.forEach(u => {
        const idx = next.findIndex(l => l.source === u.from && l.target === u.to);
        if (idx > -1) {
          next[idx] = { ...next[idx], lastActive: now };
        } else {
          next.push({ source: u.from, target: u.to, lastActive: now });
        }
      });
      return next;
    });
  };

  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      setLinks(ls => ls.filter(l => now - (l.lastActive || 0) < expireMs));
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const drawNode = (node, ctx, globalScale) => {
    const fontSize = 12 / globalScale;
    ctx.fillStyle = '#4f46e5';
    ctx.beginPath();
    ctx.arc(node.x, node.y, 6, 0, 2 * Math.PI, false);
    ctx.fill();
    ctx.font = `${fontSize}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff';
    ctx.fillText(node.name, node.x, node.y - 10);
  };

  return (
    <motion.div className={`w-full h-full ${styles.container}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <ForceGraph2D
        ref={graphRef}
        graphData={{ nodes, links }}
        nodeCanvasObject={drawNode}
        linkDirectionalParticles={2}
        linkDirectionalParticleSpeed={() => 0.005}
        linkDirectionalParticleWidth={() => 2}
        linkColor={() => '#888'}
        enableNodeDrag={false}
      />
    </motion.div>
  );
}
