import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';

export default function AgentInteractionVisualizer({ agents = [], logMessages = [] }) {
  const containerRef = useRef(null);
  const agentRefs = useRef({});
  const [positions, setPositions] = useState({});
  const [connections, setConnections] = useState([]);
  const [active, setActive] = useState({});

  // Measure agent icon positions
  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const pos = {};
    agents.forEach((name) => {
      const el = agentRefs.current[name];
      if (el) {
        const rect = el.getBoundingClientRect();
        const parent = containerRef.current.getBoundingClientRect();
        pos[name] = {
          x: rect.left + rect.width / 2 - parent.left,
          y: rect.top + rect.height / 2 - parent.top,
        };
      }
    });
    setPositions(pos);
  }, [agents]);

  // Parse log messages for interactions
  useEffect(() => {
    logMessages.forEach((msg) => {
      const match = msg.match(/\[(.+?)\].*?\[(.+?)\]/);
      if (match) {
        const from = match[1];
        const to = match[2];
        const key = Date.now() + Math.random();
        setConnections((c) => [...c, { from, to, key }]);
        setActive((a) => ({ ...a, [from]: Date.now(), [to]: Date.now() }));
        setTimeout(() => {
          setConnections((c) => c.filter((x) => x.key !== key));
        }, 800);
        setTimeout(() => {
          setActive((a) => {
            const copy = { ...a };
            delete copy[from];
            delete copy[to];
            return copy;
          });
        }, 1200);
      }
    });
  }, [logMessages]);

  return (
    <div className="relative w-full" ref={containerRef}>
      <div className="flex justify-between">
        {agents.map((name) => (
          <div
            key={name}
            ref={(el) => (agentRefs.current[name] = el)}
            className={`relative flex flex-col items-center transition-transform duration-300 ${
              active[name] ? 'scale-110 drop-shadow-glow' : ''
            }`}
          >
            <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center text-white text-xs capitalize">
              {name.split('-')[0][0]}
            </div>
          </div>
        ))}
      </div>
      <svg className="absolute inset-0 pointer-events-none" width="100%" height="100%">
        {connections.map(({ from, to, key }) => {
          const p1 = positions[from];
          const p2 = positions[to];
          if (!p1 || !p2) return null;
          const midX = (p1.x + p2.x) / 2;
          const midY = Math.min(p1.y, p2.y) - 40;
          const path = `M ${p1.x} ${p1.y} Q ${midX} ${midY} ${p2.x} ${p2.y}`;
          return <path key={key} d={path} stroke="cyan" strokeWidth="2" fill="none" className="animate-arc" />;
        })}
      </svg>
    </div>
  );
}
