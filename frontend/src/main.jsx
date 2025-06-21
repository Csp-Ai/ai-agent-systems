import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import LandingPage from './LandingPage.jsx'
import DevToolsPanel from './DevToolsPanel.jsx'
import WelcomeExperience from './WelcomeExperience.jsx'

const sessionId = localStorage.getItem('sessionId')
const showWelcome = window.location.pathname === '/' && !sessionId

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {showWelcome ? (
      <WelcomeExperience />
    ) : (
      <>
        <LandingPage />
        <DevToolsPanel />
      </>
    )}
  </StrictMode>
)
