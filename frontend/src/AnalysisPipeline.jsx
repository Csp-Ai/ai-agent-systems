import React, { useState, useEffect } from 'react';
import { Radar, BarChart2, Puzzle, FileText, CheckCircle } from 'lucide-react';

const pipelineSteps = [
  {
    id: 'insights-agent',
    status: 'Crawling site...',
    Icon: Radar,
    anim: 'animate-spin'
  },
  {
    id: 'trends-agent',
    status: 'Analyzing trends...',
    Icon: BarChart2,
    anim: 'animate-pulse'
  },
  {
    id: 'strategy-agent',
    status: 'Crafting strategy...',
    Icon: Puzzle,
    anim: 'animate-bounce'
  },
  {
    id: 'report-agent',
    status: 'Rendering PDF...',
    Icon: FileText,
    anim: 'animate-pulse'
  }
];

const AnalysisPipeline = ({ progress = 0 }) => {
  const [current, setCurrent] = useState(progress);
  const [eta, setEta] = useState(0);

  useEffect(() => {
    setCurrent(progress);
  }, [progress]);

  useEffect(() => {
    if (current >= pipelineSteps.length) return;
    const duration = Math.floor(Math.random() * 8) + 3; // 3-10 seconds
    setEta(duration);
    const timer = setInterval(() => {
      setEta(e => {
        if (e <= 1) {
          clearInterval(timer);
          setCurrent(c => Math.min(c + 1, pipelineSteps.length));
          return 0;
        }
        return e - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [current]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-gray-900 to-black">
      <div
        className="w-full max-w-md p-6 rounded-xl bg-gradient-to-br from-black via-slate-900 to-gray-800 text-white space-y-4"
        style={{ boxShadow: '0 0 20px rgba(0,255,255,0.4)' }}
      >
        {pipelineSteps.map((step, idx) => {
          const Icon = step.Icon;
          const state = idx < current ? 'done' : idx === current ? 'active' : 'pending';
          return (
            <div key={step.id} className="flex items-center gap-3 transition-all duration-500">
              {state === 'done' ? (
                <CheckCircle className="w-6 h-6 text-green-400 drop-shadow-[0_0_6px_rgba(0,255,0,0.5)]" />
              ) : (
                <Icon
                  className={`w-6 h-6 ${state === 'active' ? `${step.anim} text-blue-400 drop-shadow-[0_0_6px_rgba(0,219,255,0.7)]` : 'text-gray-500'}`}
                />
              )}
              <div>
                <p className="font-semibold capitalize">{step.id.replace(/-/g, ' ')}</p>
                <p className="text-sm text-gray-400">
                  {state === 'done' ? 'Completed' : state === 'active' ? `${step.status} ETA ${eta}s` : 'Pending'}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AnalysisPipeline;
