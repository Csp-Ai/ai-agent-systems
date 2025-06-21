import React, { useState } from 'react';
import { motion } from 'framer-motion';
import AgentCard from '../components/AgentCard';
import LiveAgentGraph from '../components/LiveAgentGraph';
import { useTheme } from '../components/ThemeContext';
import TourOverlay from '../components/TourOverlay';

const Landing = () => {
  const { theme, toggleTheme } = useTheme();
  const [tourStep, setTourStep] = useState(0);
  const steps = [
    'Welcome! This dashboard shows your agent status.',
    'Each card represents a key area to explore.',
    'Preview a collaboration below then try it yourself.'
  ];

  const closeTour = () => setTourStep(null);
  const nextStep = () => {
    setTourStep(s => (s === null || s >= steps.length - 1 ? null : s + 1));
  };
  const [previewResult, setPreviewResult] = useState(null);
  const runPreview = () =>
    setPreviewResult('✅ Agent analyzed mock data and generated a sample report.');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <header className="py-6 px-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">AI Agent Platform</h1>
        <button onClick={toggleTheme} className="text-sm">
          Toggle {theme === 'dark' ? 'Light' : 'Dark'} Mode
        </button>
      </header>
      <section className="text-center py-20 px-4">
        <h2 className="text-4xl font-extrabold mb-4 font-sans">Deploy Trusted Agents Fast</h2>
        <p className="max-w-xl mx-auto mb-8 opacity-80">Automate operations and gain real-time insights with our plug-and-play agent framework.</p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setTourStep(0)}
          className="bg-blue-600 text-white py-3 px-6 rounded-lg shadow"
        >
          Try Agents Now
        </motion.button>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 px-4">
        <AgentCard icon="🧠" title="Status">Real-time health of all agents</AgentCard>
        <AgentCard icon="📊" title="Insights">Key metrics and trends</AgentCard>
        <AgentCard icon="⚙️" title="Logs">Detailed execution history</AgentCard>
        <AgentCard icon="📝" title="Proposals">Improvement suggestions</AgentCard>
      </section>

      <section className="px-4 my-12 text-center">
        <h3 className="text-xl font-semibold mb-4">Preview an agent run</h3>
        <button onClick={runPreview} className="bg-purple-600 text-white px-4 py-2 rounded shadow">
          Run Preview
        </button>
        {previewResult && <p className="mt-4 text-green-500">{previewResult}</p>}
      </section>

      <section className="my-16 px-4">
        <h3 className="text-2xl font-bold text-center mb-6">See how agents collaborate</h3>
        <LiveAgentGraph logs={[
          '🧠 trends-agent: Found 4 trending use cases',
          '📦 swat-agent: Suggested fix deployed to cloud@13:24'
        ]} />
      </section>

      <TourOverlay step={tourStep} steps={steps} onNext={nextStep} onClose={closeTour} />
    </div>
  );
};

export default Landing;


