import React, { useRef, useEffect } from 'react';

// Renders an animated neural network background using canvas
export default function NeuralBackground({ className = '', children }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    const buffer = document.createElement('canvas');
    const bctx = buffer.getContext('2d');

    let width, height, nodes;
    let mouseX = 0;
    let mouseY = 0;
    let raf;
    let time = 0;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)')
      .matches;

    const isDark = document.documentElement.classList.contains('dark') ||
      window.matchMedia('(prefers-color-scheme: dark)').matches;

    const nodeColor = isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)';
    const lineBase = isDark ? '137,94,255' : '93,73,226';

    const init = () => {
      width = container.offsetWidth;
      height = container.offsetHeight;
      canvas.width = width;
      canvas.height = height;
      buffer.width = width;
      buffer.height = height;

      const count = Math.floor((width * height) * 0.00007);
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        r: 1.5 + Math.random() * 1.5,
        phase: Math.random() * Math.PI * 2
      }));
    };

    const resize = () => init();

    const draw = () => {
      bctx.clearRect(0, 0, width, height);
      time += 0.02;
      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > width) n.vx *= -1;
        if (n.y < 0 || n.y > height) n.vy *= -1;
      }

      bctx.lineWidth = 1;
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const max = 120;
          if (dist < max) {
            bctx.strokeStyle = `rgba(${lineBase},${1 - dist / max})`;
            bctx.beginPath();
            bctx.moveTo(a.x, a.y);
            bctx.lineTo(b.x, b.y);
            bctx.stroke();
          }
        }
      }

      for (const n of nodes) {
        const pulse = n.r + Math.sin(time + n.phase) * 0.8;
        bctx.fillStyle = nodeColor;
        bctx.beginPath();
        bctx.arc(n.x, n.y, pulse, 0, Math.PI * 2);
        bctx.fill();
      }

      const offsetX = (mouseX - width / 2) * 0.02;
      const offsetY = (mouseY - height / 2) * 0.02;

      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(buffer, offsetX, offsetY);
    };

    const loop = () => {
      draw();
      if (!prefersReduced) raf = requestAnimationFrame(loop);
    };

    init();
    loop();

    const handleMove = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    window.addEventListener('resize', resize);
    container.addEventListener('mousemove', handleMove);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      container.removeEventListener('mousemove', handleMove);
    };
  }, []);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-0"
        aria-hidden="true"
      />
      {children && <div className="relative z-10">{children}</div>}
    </div>
  );
}
