import React, { useState, useEffect } from 'react';
import NeuralBackground from '../../components/NeuralBackground.jsx';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from './firebase';
import {
  Globe, Zap, Brain, FileText, CheckCircle, ArrowRight, Users, TrendingUp, Clock, Shield, Star, ChevronDown, Play, Pause, RotateCcw
} from 'lucide-react';
import AgentTracker from './AgentTracker';
import AgentConsoleView from './AgentConsoleView';
import AgentInteractionVisualizer from './AgentInteractionVisualizer';
import './LandingPage.css'; // 🧠 NEW import

const HeroCopy = () => {
  const text = 'Analyze any website. Discover hidden insights.';
  const [display, setDisplay] = useState('');
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      setDisplay(text);
      return;
    }
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setDisplay(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, 50);
    return () => clearInterval(id);
  }, []);
  return <span>{display}</span>;
};

const LandingPage = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [sessionId, setSessionId] = useState(null);
  const [stepStatus, setStepStatus] = useState([]);
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [emailSent, setEmailSent] = useState(false);
  const [logMessages, setLogMessages] = useState([]);
  const [registeredAgents, setRegisteredAgents] = useState([]);
  const [landingUrl, setLandingUrl] = useState('');

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const res = await fetch('/registered-agents');
        const data = await res.json();
        if (Array.isArray(data)) setRegisteredAgents(data);
      } catch {
        setRegisteredAgents([]);
      }
    };
    fetchAgents();
  }, []);

  const defaultSteps = [
    { icon: Globe, title: 'Website Analysis', description: 'Our AI scans your website architecture, content, and user flows' },
    { icon: Brain, title: 'Market Research', description: 'Analyzing your industry, competitors, and market opportunities' },
    { icon: TrendingUp, title: 'GTM Strategy', description: 'Identifying AI integration opportunities and growth potential' },
    { icon: FileText, title: 'Report Generation', description: 'Creating your personalized AI transformation roadmap' }
  ];

  const analysisSteps = registeredAgents.length
    ? registeredAgents.map(a => ({ icon: Globe, title: a.displayName, description: a.description }))
    : defaultSteps;

  const agentList = registeredAgents.length
    ? registeredAgents.map(a => a.agentId)
    : ['insights-agent', 'trends-agent', 'anomaly-agent', 'forecast-agent'];

  useEffect(() => {
    const saved = localStorage.getItem('sessionId');
    if (saved) {
      setSessionId(saved);
      fetchStatus(saved);
    }
  }, []);

  useEffect(() => {
    if (!isAnalyzing || analysisComplete || !sessionId) return;
    fetchStatus(sessionId);
    const interval = setInterval(() => {
      fetchStatus(sessionId);
    }, 3000);
    return () => clearInterval(interval);
  }, [isAnalyzing, analysisComplete, sessionId]);

  useEffect(() => {
    if (sessionId) {
      localStorage.setItem('sessionId', sessionId);
    } else {
      localStorage.removeItem('sessionId');
    }
  }, [sessionId]);

  const fetchStatus = async (id) => {
    try {
      const endpoint = process.env.NODE_ENV === 'production'
        ? `/status/${id}`
        : `http://localhost:3000/status/${id}`;
      const res = await fetch(endpoint);
      const data = await res.json();
      if (Array.isArray(data)) {
        const updated = analysisSteps.map((_, i) => {
          const step = data.find((s) => s.step === i);
          return step ? step.status : 'pending';
        });
        setStepStatus(updated);
        const next = updated.findIndex((s) => s !== 'completed');
        if (next === -1) {
          setAnalysisComplete(true);
        } else {
          setCurrentStep(next);
        }
      }
    } catch (err) {
      console.error('Failed to fetch status:', err);
    }
  };

  const handleAnalyze = async () => {
    if (!websiteUrl || !email || !companyName) return;
    setIsAnalyzing(true);
    setCurrentStep(0);
    setAnalysisResult(null);
    const id = Date.now().toString();
    setSessionId(id);
    setEmailSent(false);
    setStepStatus(analysisSteps.map((_, i) => (i === 0 ? 'active' : 'pending')));
  };

  const handleFlowSubmit = async (e) => {
    e.preventDefault();
    if (!landingUrl) return;
    const encoded = btoa(encodeURIComponent(landingUrl));
    try {
      await fetch('/run-flow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flowId: encoded })
      });
    } catch {}
    window.location.href = `/flows/${encodeURIComponent(encoded)}/view`;
  };

  const subscribeToLogs = () => {
    const q = query(collection(db, 'logs'), orderBy('timestamp'));
    return onSnapshot(q, snap => {
      snap.docChanges().forEach(change => {
        if (change.type === 'added') {
          const data = change.doc.data();
          const msg = data.message || data.outputSnippet || data.output || '';
          setLogMessages(prev => [...prev, msg]);
        }
      });
    });
  };

  useEffect(() => {
    if (!isAnalyzing) return;
    const unsub = subscribeToLogs();
    return () => {
      if (unsub) unsub();
    };
  }, [isAnalyzing]);

  useEffect(() => {
    if (analysisComplete && sessionId && !emailSent) {
      const sendReport = async () => {
        try {
          await fetch('/send-report', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId, email })
          });
          setEmailSent(true);
        } catch (err) {
          console.error('Email send failed:', err);
        }
      };
      sendReport();
    }
  }, [analysisComplete]);

  const resetAnalysis = () => {
    setIsAnalyzing(false);
    setAnalysisComplete(false);
    setCurrentStep(0);
    setShowPricing(false);
    setAnalysisResult(null);
    setEmailSent(false);
    setStepStatus([]);
    setSessionId(null);
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden text-white">
      <NeuralBackground className="absolute inset-0 pointer-events-none" />
      <div className="relative z-10">
        <section className="py-20 text-center">
          <h1 className="text-4xl font-bold mb-4">
            <HeroCopy />
          </h1>
          <form onSubmit={handleFlowSubmit} className="max-w-xl mx-auto flex">
            <input
              type="text"
              value={landingUrl}
              onChange={(e) => setLandingUrl(e.target.value)}
              placeholder="https://example.com"
              className="flex-1 p-2 rounded-l text-black"
            />
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 rounded-r"
            >
              Analyze
            </button>
          </form>
        </section>
        <section className="px-6 py-20 text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl font-bold text-white mb-6">Start Your AI Analysis</h1>
            <div className="bg-white/10 p-6 rounded-xl relative overflow-hidden">
              {!isAnalyzing && (
                <>
                  <input
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Company Name"
                    className="w-full mb-4 p-2 rounded"
                  />
                  <input
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    placeholder="Website URL"
                    className="w-full mb-4 p-2 rounded"
                  />
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email Address"
                    className="w-full mb-4 p-2 rounded"
                  />
                  <button
                    onClick={handleAnalyze}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white p-2 rounded"
                  >
                    Start Analysis
                  </button>
                </>
              )}

              {isAnalyzing && (
                <div className="relative">
                  <AgentTracker
                    steps={analysisSteps.map(s => s.title)}
                    currentStep={currentStep}
                    status={stepStatus}
                  />
                  {currentStep === 0 && (
                    <div className="relative mt-4 w-full">
                      <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
                        <AgentInteractionVisualizer
                          agents={agentList}
                          logMessages={logMessages}
                        />
                      </div>
                      <div className="relative z-10">
                        <AgentConsoleView />
                      </div>
                    </div>
                  )}

                  <div className="bg-black/60 text-green-400 font-mono rounded-lg max-h-64 overflow-y-auto mt-4 p-3">
                    {logMessages
                      .slice()
                      .reverse()
                      .map((log, idx) => {
                        const lower = log.toLowerCase();
                        const colorClass = lower.includes('error') || lower.includes('anomaly')
                          ? 'text-red-400'
                          : lower.includes('resolved')
                            ? 'text-emerald-400'
                            : 'text-green-400';
                        return (
                          <div key={idx} className={colorClass}>
                            {log}
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {analysisComplete && emailSent && (
                <div className="mt-4 flex flex-col items-center">
                  <p className="text-green-400">✅ Email Sent!</p>
                  {sessionId && (
                    <a
                      href={`/reports/${sessionId}.pdf`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded"
                    >
                      View Report
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default LandingPage;
