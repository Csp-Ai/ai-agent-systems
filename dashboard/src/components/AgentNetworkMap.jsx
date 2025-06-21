import { useEffect, useRef, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { motion } from 'framer-motion';
import parseLogs from '../../../utils/parseAgentLogs.js';
import styles from '../../../styles/AgentGraph.module.css';

export default function AgentNetworkMap({ agents = [], logMessages = [], devMode = false, frozen = false }) {
  const [nodes, setNodes] = useState([]);
  const [links, setLinks] = useState([]);
  const graphRef = useRef();
  const expireMs = 15000;

  // initialize nodes
  useEffect(() => {
    setNodes(agents.map(a => ({ id: a, name: a })));
  }, [agents]);

  // dev mode demo logs
  useEffect(() => {
    if (!devMode || logMessages.length) return;
    const interval = setInterval(() => {
      if (!agents.length) return;
      const a = agents[Math.floor(Math.random() * agents.length)];
      let b = agents[Math.floor(Math.random() * agents.length)];
      if (a === b) b = agents[(agents.indexOf(a) + 1) % agents.length];
      handleLogs([`${a} -> ${b}`]);
    }, 2000);
    return () => clearInterval(interval);
  }, [devMode, agents, logMessages]);

  // parse incoming logs
  useEffect(() => {
    if (logMessages.length) handleLogs(logMessages);
  }, [logMessages]);

  const handleLogs = msgs => {
    const updates = parseLogs(msgs);
    if (!updates.length) return;
    setLinks(curr => {
      const now = Date.now();
      const next = [...curr];
      updates.forEach(u => {
        const idx = next.findIndex(l => l.source === u.from && l.target === u.to);
        if (idx > -1) {
          next[idx] = { ...next[idx], lastActive: now, message: u.type };
        } else {
          next.push({ source: u.from, target: u.to, lastActive: now, message: u.type });
        }
      });
      return next;
    });
  };

  // expire old links
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      setLinks(ls => ls.filter(l => now - (l.lastActive || 0) < expireMs));
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const color = node => `hsl(${(node.id.charCodeAt(0) * 137) % 360},70%,60%)`;

  const drawNode = (node, ctx, globalScale) => {
    const label = node.name;
    const fontSize = 12 / globalScale;
    ctx.fillStyle = color(node);
    ctx.beginPath();
    ctx.arc(node.x, node.y, 6, 0, 2 * Math.PI, false);
    ctx.fill();
    ctx.font = `${fontSize}px Sans-Serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff';
    ctx.fillText(label, node.x, node.y - 10);
  };

  return (
    <motion.div className={`w-full h-full ${styles.container}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <ForceGraph2D
        ref={graphRef}
        graphData={{ nodes, links }}
        nodeCanvasObject={drawNode}
        linkDirectionalParticles={2}
        linkDirectionalParticleSpeed={d => 0.004}
        linkDirectionalParticleWidth={d => 2}
        linkColor={() => '#888'}
        enableNodeDrag={!frozen}
        width={window.innerWidth}
        height={window.innerHeight}
      />
    </motion.div>
  );
}
