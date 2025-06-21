import React, { useState } from 'react';
import { motion } from 'framer-motion';
import AgentCard from '../components/AgentCard';
import LiveAgentGraph from '../components/LiveAgentGraph';
import AgentCluster from '../components/AgentCluster';
import PricingTiers from '../components/PricingTiers';
import { useTheme } from '../context/ThemeContext';
import TourOverlay from '../components/TourOverlay';

const pricing = [
  { title: 'Basic', price: 'Free', features: ['1 agent', 'Community support'] },
  { title: 'Pro', price: '$49/mo', features: ['Up to 5 agents', 'Email support'] },
  { title: 'Enterprise', price: 'Contact us', features: ['Unlimited agents', 'Dedicated support'] }
];

const testimonials = [
  { quote: 'These agents saved us countless hours!', author: 'Alex P.' },
  { quote: 'Insightful analytics and easy to use.', author: 'Jamie L.' },
  { quote: 'A must-have for automation projects.', author: 'Morgan K.' }
];

const heroAgents = [
  { name: 'insights-agent', icon: '🧠', color: '#8b5cf6' },
  { name: 'swat-agent', icon: '⚙️', color: '#0ea5e9' },
  { name: 'data-agent', icon: '📊', color: '#10b981' }
];

const Welcome = () => {
  const { theme, toggleTheme } = useTheme();
  const [company, setCompany] = useState('');
  const [url, setUrl] = useState('');
  const [email, setEmail] = useState('');

  const submit = e => {
    e.preventDefault();
    const data = { company, url, email };
    localStorage.setItem('onboarding', JSON.stringify(data));
    window.location.href = '/dashboard';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-800 to-indigo-950 text-white font-sans">
      <header className="p-6 flex justify-end">
        <button onClick={toggleTheme} className="text-sm">
          Toggle {theme === 'dark' ? 'Light' : 'Dark'} Mode
        </button>
      </header>
<main className="py-20 px-4 space-y-20">

        <div className="space-y-6">
          <h1 className="text-4xl md:text-5xl font-extrabold">Welcome to the Agent Platform</h1>
          <p className="opacity-80">Deploy smart agents that automate your workflows in minutes.</p>
          <motion.form
            onSubmit={submit}
            className="space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <input
              className="w-full rounded-md px-4 py-2 text-gray-900"
              placeholder="Company"
              value={company}
              onChange={e => setCompany(e.target.value)}
              required
            />
            <input
              className="w-full rounded-md px-4 py-2 text-gray-900"
              placeholder="Website URL"
              value={url}
              onChange={e => setUrl(e.target.value)}
              required
            />
            <input
              className="w-full rounded-md px-4 py-2 text-gray-900"
              placeholder="Work Email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-md"
              type="submit"
            >
              Get Started
            </motion.button>
          </motion.form>
        </div>
        <div className="hidden md:block">
          <AgentCluster />
        </div>
      </main>
      <section className="mt-20">
        <PricingTiers />
      </section>
      <section className="py-12 text-center opacity-80">
        <p>"These agents saved us countless hours!" - Happy Customer</p>
      </section>
    </div>
  );
};

export default Welcome;
