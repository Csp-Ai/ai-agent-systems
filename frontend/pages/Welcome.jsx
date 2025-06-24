import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AgentCard from '../../components/AgentCard';
import LiveAgentGraph from '../../components/LiveAgentGraph';
import AgentCluster from '../../components/AgentCluster';
import PricingTiers from '../../components/PricingTiers';
import { useTheme } from '../../context/ThemeContext';
import TourOverlay from '../../components/TourOverlay';

const pricing = [
  { title: 'Basic', price: 'Free', features: ['1 agent', 'Community support'] },
  { title: 'Pro', price: '$49/mo', features: ['Up to 5 agents', 'Email support'] },
  { title: 'Enterprise', price: 'Contact us', features: ['Unlimited agents', 'Dedicated support'] }
];

const testimonials = [
  {
    quote: 'These agents saved us countless hours!',
    author: 'Alex P.',
    avatar: 'https://i.pravatar.cc/80?img=11'
  },
  {
    quote: 'Insightful analytics and easy to use.',
    author: 'Jamie L.',
    avatar: 'https://i.pravatar.cc/80?img=12'
  },
  {
    quote: 'A must-have for automation projects.',
    author: 'Morgan K.',
    avatar: 'https://i.pravatar.cc/80?img=13'
  }
];

const heroAgents = [
  { name: 'insights-agent', icon: '🧠', color: '#8b5cf6' },
  { name: 'swat-agent', icon: '⚙️', color: '#0ea5e9' },
  { name: 'data-agent', icon: '📊', color: '#10b981' }
];

const TestimonialCarousel = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex(i => (i + 1) % testimonials.length);
    }, 6000);
    return () => clearInterval(id);
  }, []);

  const variants = {
    enter: { x: 300, opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: -300, opacity: 0 }
  };

  return (
    <div className="relative overflow-hidden h-60">
      <AnimatePresence initial={false}>
        <motion.div
          key={index}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ type: 'tween', duration: 0.6 }}
          className="absolute inset-0 flex items-center justify-center px-6"
        >
          <div className="bg-white/10 rounded-xl p-6 text-center space-y-4">
            <img
              src={testimonials[index].avatar}
              alt={testimonials[index].author}
              className="w-16 h-16 rounded-full mx-auto"
            />
            <p className="italic">{testimonials[index].quote}</p>
            <p className="font-semibold">- {testimonials[index].author}</p>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

const Welcome = () => {
  const { theme, toggleTheme } = useTheme();
  const [company, setCompany] = useState('');
  const [url, setUrl] = useState('');
  const [email, setEmail] = useState('');

  const submit = e => {
    e.preventDefault();
    const data = { company, url, email };
    localStorage.setItem('onboarding', JSON.stringify(data));
    if (typeof window !== 'undefined') {
      window.location.href = '/dashboard';
    }
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
      <section className="my-24 px-4 max-w-5xl mx-auto">
        <TestimonialCarousel />
      </section>
    </div>
  );
};

export default Welcome;
