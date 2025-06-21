import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import LandingPage from './LandingPage.jsx'
import DevToolsPanel from './DevToolsPanel.jsx'
import WelcomeOverlay from './WelcomeOverlay.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <>
      <LandingPage />
      <WelcomeOverlay />
      <DevToolsPanel />
    </>
  </StrictMode>
)
