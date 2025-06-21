import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import LandingPage from './LandingPage.jsx'
import DevToolsPanel from './DevToolsPanel.jsx'
import FeedbackFab from './FeedbackFab.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <>
      <LandingPage />
      <DevToolsPanel />
      <FeedbackFab />
    </>
  </StrictMode>
)
