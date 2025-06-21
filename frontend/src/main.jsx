import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import LandingPage from './LandingPage.jsx'
import AgentsGallery from '../AgentsGallery.jsx'
import UseCaseSelector from './UseCaseSelector.jsx'
import DevToolsPanel from './DevToolsPanel.jsx'

const path = window.location.pathname;

let page = <LandingPage />;
if (path.startsWith('/gallery')) page = <AgentsGallery />;
if (path.startsWith('/use-cases')) page = <UseCaseSelector />;

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <>
      {page}
      <DevToolsPanel />
    </>
  </StrictMode>
)
