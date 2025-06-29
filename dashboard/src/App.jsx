import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import FeedbackFab from './components/FeedbackFab.jsx';
import { OrgProvider, useOrg } from './OrgContext';
import { PersonaProvider, usePersona } from './PersonaContext';
import PersonaDashboard from './PersonaDashboard';
import AgentStatusTable from './components/AgentStatusTable';
import MisalignmentProposalsPanel from './components/MisalignmentProposalsPanel';
import ExecutionLogViewer from './components/ExecutionLogViewer';
import AgentHealthDashboard from './components/AgentHealthDashboard';
import AgentGallery from './pages/AgentGallery';
import AgentBioPage from './pages/AgentBioPage';
import AgentAdminConsole from './pages/AgentAdminConsole';
import MyStackBuilder from './pages/MyStackBuilder';
import DepartmentRouter from './pages/DepartmentRouter';
import { startPageTimer } from './utils/analytics';
import SimulateAgent from './pages/SimulateAgent';
import FounderInsights from './pages/FounderInsights';
import './index.css';

function RouterShell() {
  const location = useLocation();
  const [dark, setDark] = useState(
    localStorage.getItem('theme') === 'dark'
  );
  const { orgId, setOrgId, orgs, loading } = useOrg();
  const { role } = usePersona();

  useEffect(() => startPageTimer(location.pathname), [location.pathname]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  if (loading) {
    return <div className="p-4 text-center text-white">Loading...</div>;
  }

  if (!orgId) {
    return (
      <div className="p-4 text-center text-white">No organizations available.</div>
    );
  }

  return (
    <>
      <select
        value={orgId}
        onChange={e => setOrgId(e.target.value)}
        className="fixed top-4 right-6 z-50 bg-gray-900 text-white rounded shadow-md px-2 py-1"
      >
        {orgs.map(o => (
          <option key={o.id} value={o.id}>
            {o.name || o.id}
          </option>
        ))}
      </select>
      <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <aside className="w-48 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4 flex flex-col">
          <nav className="flex flex-col space-y-2 flex-1">
            <Link to="/" className="hover:underline">Home</Link>
            <Link to="/status" className="hover:underline">Status</Link>
            <Link to="/health" className="hover:underline">Health</Link>
            <Link to="/proposals" className="hover:underline">Proposals</Link>
            <Link to="/logs" className="hover:underline">Logs</Link>
            <Link to="/agents" className="hover:underline">Agents</Link>
<Link to="/simulate-agent" className="hover:underline">Simulate</Link>
<Link to="/founder-insights" className="hover:underline">Founder Insights</Link>
<Link to="/stacks/new" className="hover:underline">+ New Stack</Link>

            <Link to="/admin" className="hover:underline">Admin</Link>
            <Link to="/departments/sales" className="hover:underline">Departments</Link>
            {role === 'Developer' && (
              <>
                <Link to="/api-keys" className="hover:underline">API Keys</Link>
                <Link to="/agents" className="hover:underline">Registry Tools</Link>
              </>
            )}
            {role === 'Marketing' && (
              <>
                <Link to="/agents#trend-analysis-agent" className="hover:underline">Trend Analysis</Link>
                <Link to="/agents#content-strategy-agent" className="hover:underline">Content Strategy</Link>
              </>
            )}
          </nav>
          <button onClick={() => setDark(!dark)} className="text-sm mt-4">
            Toggle {dark ? 'Light' : 'Dark'}
          </button>
        </aside>
        <main className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<PersonaDashboard />} />
            <Route path="/status" element={<AgentStatusTable />} />
            <Route path="/health" element={<AgentHealthDashboard />} />
            <Route path="/proposals" element={<MisalignmentProposalsPanel />} />
            <Route path="/logs" element={<ExecutionLogViewer />} />
            <Route path="/agents" element={<AgentGallery />} />
<Route path="/agents/:id" element={<AgentBioPage />} />
<Route path="/simulate-agent" element={<SimulateAgent />} />
<Route path="/founder-insights" element={<FounderInsights />} />
<Route path="/stacks/new" element={<MyStackBuilder />} />
            <Route path="/departments/:dept" element={<DepartmentRouter />} />
            <Route path="/admin" element={<AgentAdminConsole />} />
          </Routes>
        </main>
      </div>
  <FeedbackFab />
}

function Shell() {
  return (
    <Router basename="/dashboard">
      <RouterShell />
    </Router>
  );
}
    </Router>
  );
}

export default function App() {
  return (
    <OrgProvider>
      <PersonaProvider>
        <Shell />
      </PersonaProvider>
    </OrgProvider>
  );
}

