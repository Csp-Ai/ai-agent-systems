import React, { useState, useEffect } from 'react';
import { Globe, Zap, Brain, FileText, CheckCircle, ArrowRight, Users, TrendingUp, Clock, Shield, Star, ChevronDown, Play, Pause, RotateCcw } from 'lucide-react';
import AgentTracker from './AgentTracker.jsx';

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
  const hasSavedSession = sessionId && stepStatus.some(s => s !== 'pending');

  const fetchStatus = async (id) => {
    try {
      const endpoint =
        process.env.NODE_ENV === 'production'
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

  useEffect(() => {
    const saved = localStorage.getItem('sessionId');
    if (saved) {
      setSessionId(saved);
      fetchStatus(saved);
    }
  }, []);

  useEffect(() => {
    if (sessionId) {
      localStorage.setItem('sessionId', sessionId);
    } else {
      localStorage.removeItem('sessionId');
    }
  }, [sessionId]);

  const analysisSteps = [
    { icon: Globe, title: "Website Analysis", description: "Our AI scans your website architecture, content, and user flows", duration: 3000 },
    { icon: Brain, title: "Market Research", description: "Analyzing your industry, competitors, and market opportunities", duration: 4000 },
    { icon: TrendingUp, title: "GTM Strategy", description: "Identifying AI integration opportunities and growth potential", duration: 3500 },
    { icon: FileText, title: "Report Generation", description: "Creating your personalized AI transformation roadmap", duration: 2500 }
  ];

  const pricingTiers = [
    {
      name: "Starter",
      price: "$15K",
      description: "Perfect for small businesses ready to automate core processes",
      features: [
        "2-3 Custom AI Agents",
        "Basic workflow automation",
        "Email & chat integration",
        "Simple dashboard",
        "4-week delivery",
        "30-day support"
      ],
      popular: false,
      color: "border-gray-200"
    },
    {
      name: "Growth",
      price: "$35K",
      description: "Ideal for growing companies seeking comprehensive AI integration",
      features: [
        "5-7 Custom AI Agents",
        "Advanced workflow orchestration",
        "CRM & tool integrations",
        "Analytics dashboard",
        "6-week delivery",
        "90-day support + training"
      ],
      popular: true,
      color: "border-blue-500 ring-2 ring-blue-200"
    },
    {
      name: "Enterprise",
      price: "$75K+",
      description: "Complete AI transformation for established organizations",
      features: [
        "10+ Custom AI Agents",
        "Multi-department integration",
        "Custom API development",
        "Advanced analytics & reporting",
        "8-week delivery",
        "1-year support + enablement"
      ],
      popular: false,
      color: "border-gray-200"
    }
  ];

  useEffect(() => {
    if (isAnalyzing && currentStep < analysisSteps.length && sessionId) {
      const step = analysisSteps[currentStep];
      setStepStatus(prev => {
        const arr = prev.length ? [...prev] : analysisSteps.map(() => 'pending');
        arr[currentStep] = 'active';
        return arr;
      });

      const runStep = async () => {
        const endpoint =
          process.env.NODE_ENV === 'production'
            ? '/run-agent'
            : 'http://localhost:3000/run-agent';

        try {
          await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              agent: 'insights-agent',
              input: { companyName, websiteUrl, email },
              sessionId,
              step: currentStep,
            }),
          });

          setStepStatus(prev => {
            const arr = [...prev];
            arr[currentStep] = 'completed';
            if (currentStep + 1 < arr.length) {
              arr[currentStep + 1] = 'active';
            }
            return arr;
          });
        } catch (error) {
          console.error('Error running agent:', error);
        }
      };

      runStep();

      const timer = setTimeout(() => {
        setCurrentStep(prev => prev + 1);
      }, step?.duration || 3000);

      if (currentStep === analysisSteps.length - 1) {
        setTimeout(() => {
          setAnalysisComplete(true);
          setIsAnalyzing(false);
        }, step?.duration || 2500);
      }

      return () => clearTimeout(timer);
    }
  }, [isAnalyzing, currentStep, sessionId]);

  // Poll session status from backend
  useEffect(() => {
    if (!sessionId) return;
    const interval = setInterval(async () => {
      try {
        const endpoint =
          process.env.NODE_ENV === 'production'
            ? `/status/${sessionId}`
            : `http://localhost:3000/status/${sessionId}`;
        const res = await fetch(endpoint);
        const data = await res.json();
        if (Array.isArray(data)) {
          const updated = analysisSteps.map((_, i) => {
            const step = data.find(s => s.step === i);
            return step ? step.status : 'pending';
          });
          setStepStatus(updated);
        }
      } catch (err) {
        console.error('Polling status failed:', err);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [sessionId]);

  const handleAnalyze = async () => {
    if (!websiteUrl || !email || !companyName) return;
    setIsAnalyzing(true);
    setCurrentStep(0);
    setAnalysisComplete(false);
    setAnalysisResult(null);
    const id = Date.now().toString();
    setSessionId(id);
    setStepStatus(analysisSteps.map((_, i) => (i === 0 ? 'active' : 'pending')));
  };

  const resumeExistingSession = () => {
    if (!sessionId) return;
    const next = stepStatus.findIndex(s => s !== 'completed');
    setCurrentStep(next === -1 ? analysisSteps.length - 1 : next);
    setIsAnalyzing(true);
  };

  const resetAnalysis = () => {
    setIsAnalyzing(false);
    setAnalysisComplete(false);
    setCurrentStep(0);
    setShowPricing(false);
    setAnalysisResult(null);
    setStepStatus([]);
    setSessionId(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -inset-10 opacity-50">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
          <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse delay-1000"></div>
          <div className="absolute bottom-1/4 left-1/2 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse delay-2000"></div>
        </div>
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="px-6 py-4">
          <nav className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Brain className="h-8 w-8 text-blue-400" />
              <span className="text-xl font-bold text-white">AI Agent Systems</span>
            </div>
            <div className="hidden md:flex space-x-8">
              <a href="#how-it-works" className="text-gray-300 hover:text-white transition-colors">How It Works</a>
              <a href="#pricing" className="text-gray-300 hover:text-white transition-colors">Pricing</a>
              <a href="#contact" className="text-gray-300 hover:text-white transition-colors">Contact</a>
            </div>
          </nav>
        </header>

        {/* Hero Section */}
        <section className="px-6 py-20 text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              Transform Your Business with
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent"> AI Agents</span>
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Get a personalized AI transformation roadmap in minutes. Our intelligent agents analyze your website and create a custom strategy to automate your operations.
            </p>
            
            {/* Interactive Analysis Form */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-2xl mx-auto border border-white/20">
              <h3 className="text-2xl font-semibold text-white mb-6">Get Your Free AI Analysis</h3>
              
              {!isAnalyzing && !analysisComplete && hasSavedSession && (
                <div className="space-y-4">
                  <AgentTracker
                    steps={analysisSteps.map(s => s.title)}
                    currentStep={currentStep}
                    status={stepStatus}
                  />
                  <div className="flex justify-center gap-4">
                    <button
                      onClick={resumeExistingSession}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                    >
                      Resume Analysis
                    </button>
                    <button
                      onClick={resetAnalysis}
                      className="border border-white/30 text-white px-4 py-2 rounded hover:bg-white/10"
                    >
                      Start Over
                    </button>
                  </div>
                </div>
              )}

              {!isAnalyzing && !analysisComplete && !hasSavedSession && (
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Company Name"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                  <input
                    type="url"
                    placeholder="Your Website URL (e.g., https://yourcompany.com)"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                  <input
                    type="email"
                    placeholder="Your Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                  <button
                    onClick={handleAnalyze}
                    disabled={!websiteUrl || !email || !companyName}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4 rounded-lg font-semibold text-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    <Zap className="h-5 w-5" />
                    <span>Start Free Analysis</span>
                  </button>
                </div>
              )}

              {/* Analysis Progress */}
              {isAnalyzing && (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="inline-flex items-center space-x-2 text-blue-400 mb-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400"></div>
                      <span className="text-lg font-medium">Analyzing {companyName}...</span>
                    </div>
                  </div>
                  
                  <AgentTracker
                    steps={analysisSteps.map(s => s.title)}
                    currentStep={currentStep}
                    status={stepStatus}
                  />
                </div>
              )}

              {/* Analysis Complete */}
              {analysisComplete && (
                <div className="text-center space-y-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500 rounded-full mb-4">
                    <CheckCircle className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-semibold text-white">Analysis Complete!</h3>
                  <p className="text-gray-300">
                    We've identified <span className="text-green-400 font-semibold">12 automation opportunities</span> that could save your team 
                    <span className="text-blue-400 font-semibold"> 25+ hours per week</span>
                  </p>
                  
                  <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-lg p-6 border border-green-400/30">
                    <h4 className="text-lg font-semibold text-white mb-3">Key Findings:</h4>
                    <ul className="text-left space-y-2 text-gray-300">
                      <li className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-400" />
                        <span>Customer support automation potential: 70%</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-400" />
                        <span>Lead qualification & follow-up opportunities</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-400" />
                        <span>Content & social media automation ready</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-400" />
                        <span>Data analysis & reporting streamlining</span>
                      </li>
                    </ul>
                    {analysisResult && (
                      <pre className="mt-4 text-gray-300 whitespace-pre-wrap">
                        {analysisResult}
                      </pre>
                    )}
                  </div>

                  <div className="flex space-x-4">
                    <button
                      onClick={() => setShowPricing(true)}
                      className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-300 flex items-center justify-center space-x-2"
                    >
                      <span>View Pricing Options</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                    <button
                      onClick={resetAnalysis}
                      className="px-4 py-3 border border-white/30 text-white rounded-lg hover:bg-white/10 transition-colors flex items-center space-x-2"
                    >
                      <RotateCcw className="h-4 w-4" />
                      <span>Try Another</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        {showPricing && (
          <section className="px-6 py-20 bg-black/20">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-4xl font-bold text-white mb-4">Choose Your AI Transformation Package</h2>
                <p className="text-xl text-gray-300">Custom AI agent systems delivered in 4-8 weeks</p>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                {pricingTiers.map((tier, index) => (
                  <div key={index} className={`bg-white/10 backdrop-blur-lg rounded-2xl p-8 border ${tier.color} ${tier.popular ? 'transform scale-105' : ''} transition-all duration-300`}>
                    {tier.popular && (
                      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-medium mb-4 text-center">
                        Most Popular
                      </div>
                    )}
                    
                    <div className="text-center mb-8">
                      <h3 className="text-2xl font-bold text-white mb-2">{tier.name}</h3>
                      <div className="text-4xl font-bold text-white mb-4">{tier.price}</div>
                      <p className="text-gray-300">{tier.description}</p>
                    </div>

                    <ul className="space-y-3 mb-8">
                      {tier.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center space-x-3">
                          <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0" />
                          <span className="text-gray-300">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <button className={`w-full py-3 rounded-lg font-semibold transition-all duration-300 ${
                      tier.popular 
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700'
                        : 'border border-white/30 text-white hover:bg-white/10'
                    }`}>
                      Get Started
                    </button>
                  </div>
                ))}
              </div>

              <div className="text-center mt-12">
                <p className="text-gray-300 mb-4">
                  Need a custom solution? We'll create a tailored package for your specific needs.
                </p>
                <button className="bg-white/10 border border-white/30 text-white px-8 py-3 rounded-lg hover:bg-white/20 transition-colors">
                  Schedule Custom Consultation
                </button>
              </div>
            </div>
          </section>
        )}

        {/* How It Works Section */}
        <section id="how-it-works" className="px-6 py-20">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-white mb-4">How We Transform Your Business</h2>
              <p className="text-xl text-gray-300">Our proven 6-week process delivers measurable results</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  week: "Week 1",
                  title: "Discovery & Mapping",
                  description: "Deep dive into your processes, pain points, and automation opportunities",
                  icon: Users
                },
                {
                  week: "Week 2",
                  title: "UX & Agent Design",
                  description: "Design intelligent workflows and create specifications for your custom agents",
                  icon: Brain
                },
                {
                  week: "Week 3-5",
                  title: "Build & Integration",
                  description: "Develop, test, and integrate your AI agents with existing systems",
                  icon: Zap
                },
                {
                  week: "Week 6",
                  title: "Launch & Training",
                  description: "Deploy your agents, train your team, and provide ongoing support",
                  icon: TrendingUp
                }
              ].map((phase, index) => (
                <div key={index} className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-6">
                    <phase.icon className="h-8 w-8 text-white" />
                  </div>
                  <div className="text-sm font-medium text-blue-400 mb-2">{phase.week}</div>
                  <h3 className="text-xl font-semibold text-white mb-4">{phase.title}</h3>
                  <p className="text-gray-300">{phase.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="px-6 py-20 bg-black/20">
          <div className="max-w-4xl mx-auto text-center">
            <div className="grid md:grid-cols-4 gap-8">
              {[
                { number: "500+", label: "Hours Saved Weekly", icon: Clock },
                { number: "95%", label: "Task Automation Rate", icon: Zap },
                { number: "50+", label: "Businesses Transformed", icon: TrendingUp },
                { number: "6 Weeks", label: "Average Delivery Time", icon: CheckCircle }
              ].map((stat, index) => (
                <div key={index} className="text-center">
                  <stat.icon className="h-8 w-8 text-blue-400 mx-auto mb-4" />
                  <div className="text-3xl font-bold text-white mb-2">{stat.number}</div>
                  <div className="text-gray-300">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="px-6 py-12 bg-black/40">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="flex items-center space-x-2 mb-4 md:mb-0">
                <Brain className="h-6 w-6 text-blue-400" />
                <span className="text-lg font-semibold text-white">AI Agent Systems</span>
              </div>
              <div className="text-gray-400 text-sm">
                © 2025 AI Agent Systems. Built by Chris Ponce, Zach Jefferys & Mark Ehrhardt
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default LandingPage;

