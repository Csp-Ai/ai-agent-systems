import React, { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AnimatePresence } from 'framer-motion';
import './index.css';

const query = new URLSearchParams(window.location.search);
const pending = localStorage.getItem('pendingFlowToken');
if (query.get('success') === '1' && pending) {
  localStorage.removeItem('pendingFlowToken');
  window.location.replace(`/flows/${encodeURIComponent(pending)}/view`);
}

import LandingPage from './LandingPage.jsx';
import DevToolsPanel from './DevToolsPanel.jsx';
import DemoPage from './DemoPage.jsx';
import UseCaseSelector from './UseCaseSelector.jsx';
import WelcomeOverlay from './WelcomeOverlay.jsx';
import WelcomeExperience from './WelcomeExperience.jsx';
import OnboardingOverlay from './OnboardingOverlay.jsx';
import Gallery from './Gallery.jsx';
import AgentsPage from '../pages/Agents.jsx';
import Dashboard from '../pages/Dashboard.jsx';
import FlowViewPage from '../pages/FlowViewPage.jsx';
import Sandbox from './Sandbox.jsx';
import FeedbackFab from './FeedbackFab.jsx';
import ErrorBoundary from './ErrorBoundary.jsx';

const path = window.location.pathname;

function App() {
  console.log("Path:", path);
  try {
    const isDemo = path.startsWith('/demo');
    const isGallery = path.startsWith('/gallery');
    const isAgents = path.startsWith('/agents');
    const isUseCases = path.startsWith('/use-cases');
    const isDashboard = path.startsWith('/dashboard');
    const flowViewMatch = path.match(/^\/flows\/([^/]+)\/view/); // ✅ merged
    const isFlowView = !!flowViewMatch;
    const isSandbox = path.startsWith('/sandbox');

    const [onboarded, setOnboarded] = useState(
      localStorage.getItem('onboarded') === 'true'
    );
    const [experienceSeen, setExperienceSeen] = useState(
      localStorage.getItem('welcomeExperienceSeen') === 'true'
    );
    const [welcomeDismissed, setWelcomeDismissed] = useState(
      localStorage.getItem('welcomeOverlayDismissed') === 'true'
    );

    const markOnboarded = () => {
      localStorage.setItem('onboarded', 'true');
      setOnboarded(true);
    };

    const finishExperience = () => {
      localStorage.setItem('welcomeExperienceSeen', 'true');
      setExperienceSeen(true);
    };

    const dismissWelcome = () => {
      localStorage.setItem('welcomeOverlayDismissed', 'true');
      setWelcomeDismissed(true);
    };

    let content;
    let unknownRoute = false;
    if (isDemo) {
      content = <DemoPage />;
    } else if (isGallery) {
      content = <Gallery />;
    } else if (isAgents) {
      content = <AgentsPage />;
    } else if (isUseCases) {
      content = <UseCaseSelector />;
    } else if (isDashboard) {
      content = <Dashboard />;
    } else if (isFlowView) {
      let decoded = flowViewMatch[1];
      try {
        decoded = atob(decodeURIComponent(decoded));
      } catch {}
      content = <FlowViewPage flowId={decoded} />;
    } else if (isSandbox) {
      content = <Sandbox />;
    } else if (path === '/' || path === '') {
      content = (
        <>
          <LandingPage />
          <DevToolsPanel />
        </>
      );
    } else {
      unknownRoute = true;
      content = <LandingPage />;
    }

    console.log({ isGallery, isDemo, isUseCases, unknownRoute, content });

    if (!content) {
      content = <LandingPage />;
    }

    return (
      <>
        {unknownRoute && <h1>Unknown route: {path}</h1>}
        {content}
        <FeedbackFab />
        <AnimatePresence>
          {!onboarded && <OnboardingOverlay onComplete={markOnboarded} />}
          {onboarded && !experienceSeen && (
            <WelcomeExperience onFinish={finishExperience} />
          )}
          {onboarded && experienceSeen && !welcomeDismissed && (
            <WelcomeOverlay onDismiss={dismissWelcome} />
          )}
        </AnimatePresence>
      </>
    );
  } catch (err) {
    console.error('App crashed:', err);
    return <LandingPage />;
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);

