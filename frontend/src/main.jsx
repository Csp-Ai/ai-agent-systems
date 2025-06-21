import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import LandingPage from './LandingPage.jsx'
import DevToolsPanel from './DevToolsPanel.jsx'
import DemoPage from './DemoPage.jsx'

const path = window.location.pathname;
const isDemo = path.startsWith('/demo');

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {isDemo ? (
      <DemoPage />
    ) : (
      <>
        <LandingPage />
        <DevToolsPanel />
      </>
    )}
  </StrictMode>
)
