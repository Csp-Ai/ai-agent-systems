import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AnimatePresence } from 'framer-motion';
import './index.css';
import LandingPage from './LandingPage.jsx';
import DevToolsPanel from './DevToolsPanel.jsx';
import DemoPage from './DemoPage.jsx';
import UseCaseSelector from './UseCaseSelector.jsx';
import WelcomeOverlay from './WelcomeOverlay.jsx';
import WelcomeExperience from './WelcomeExperience.jsx';
import OnboardingOverlay from './OnboardingOverlay.jsx';
import AgentsGallery from '../AgentsGallery.jsx';
import AdminDashboard from '../AdminDashboard.jsx';

const path = window.location.pathname;

function App() {
  const isDemo = path.startsWith('/demo');
  const isGallery = path.startsWith('/gallery');
  const isUseCases = path.startsWith('/use-cases');
  const isDashboard = path.startsWith('/dashboard');

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
  if (isDemo) {
    content = <DemoPage />;
  } else if (isGallery) {
    content = <AgentsGallery />;
  } else if (isUseCases) {
    content = <UseCaseSelector />;
  } else if (isDashboard) {
    content = <AdminDashboard />;
  } else {
    content = (
      <>
        <LandingPage />
        <DevToolsPanel />
      </>
    );
  }

  return (
    <>
      {content}
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
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);

