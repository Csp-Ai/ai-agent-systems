import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import LandingPage from './LandingPage.jsx'
import DevToolsPanel from './DevToolsPanel.jsx'
import Gallery from './Gallery.jsx'

const path = window.location.pathname;
createRoot(document.getElementById('root')).render(
  <StrictMode>
    {path.startsWith('/gallery') ? (
      <Gallery />
    ) : (
      <>
        <LandingPage />
        <DevToolsPanel />
      </>
    )}
  </StrictMode>
)
