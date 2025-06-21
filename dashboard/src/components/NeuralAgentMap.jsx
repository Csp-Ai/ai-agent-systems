import React, { useEffect, useMemo, useRef, useState } from 'react';
import AgentNode from './AgentNode.jsx';
import AgentLink from './AgentLink.jsx';
import parseLogs from '../../../utils/parseAgentLogs.js';

export default function NeuralAgentMap({ agents = [], logEvents = [] }) {
  const containerRef = useRef(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [links, setLinks] = useState([]);
  const processed = useRef(0);
  const expireMs = 4000; // 3-5s

  useEffect(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setSize({ width: rect.width, height: rect.height });
  }, [agents]);

  useEffect(() => {
    const newMsgs = logEvents.slice(processed.current);
    processed.current = logEvents.length;
    const updates = parseLogs(newMsgs);
    if (updates.length) {
      const now = Date.now();
      setLinks(ls => [
        ...ls,
        ...updates.map(u => ({ ...u, key: now + Math.random(), expires: now + expireMs }))
      ]);
    }
  }, [logEvents]);

  useEffect(() => {
    const t = setInterval(() => {
      const now = Date.now();
      setLinks(ls => ls.filter(l => l.expires > now));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const indexMap = useMemo(() => {
    const m = {};
    agents.forEach((a, i) => { m[a.name] = i; });
    return m;
  }, [agents]);

  const positions = useMemo(() => {
    if (!size.width || !size.height) return [];
    const r = Math.min(size.width, size.height) / 2 - 30;
    return agents.map((_, i) => {
      const angle = (i / agents.length) * Math.PI * 2;
      return {
        x: size.width / 2 + Math.cos(angle) * r,
        y: size.height / 2 + Math.sin(angle) * r
      };
    });
  }, [size, agents]);

  const activeNodes = useMemo(() => {
    const s = new Set();
    links.forEach(l => { s.add(l.from); s.add(l.to); });
    return s;
  }, [links]);

  return (
    <div ref={containerRef} className="relative w-full h-full">
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        {links.map(link => {
          const sPos = positions[indexMap[link.from]];
          const tPos = positions[indexMap[link.to]];
          if (!sPos || !tPos) return null;
          return (
            <AgentLink key={link.key} source={sPos} target={tPos} isActive={true} />
          );
        })}
      </svg>
      {agents.map((agent, i) => {
        const pos = positions[i];
        if (!pos) return null;
        return (
          <div
            key={agent.name}
            style={{ position: 'absolute', left: pos.x, top: pos.y, transform: 'translate(-50%, -50%)' }}
          >
            <AgentNode
              icon={agent.icon}
              color={agent.color}
              name={agent.name}
              isActive={activeNodes.has(agent.name)}
            />
          </div>
        );
      })}
    </div>
  );
}
