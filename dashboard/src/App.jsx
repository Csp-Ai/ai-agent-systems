import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import FeedbackFab from './components/FeedbackFab.jsx';
import { OrgProvider, useOrg } from './OrgContext';
import AgentStatusTable from './components/AgentStatusTable';
import MisalignmentProposalsPanel from './components/MisalignmentProposalsPanel';
import ExecutionLogViewer from './components/ExecutionLogViewer';
import AgentHealthDashboard from './components/AgentHealthDashboard';
import AgentGallery from './pages/AgentGallery';
import AgentAdminConsole from './pages/AgentAdminConsole';
import DepartmentRouter from './pages/DepartmentRouter';
import './index.css';

function Shell() {
  const [dark, setDark] = useState(
    localStorage.getItem('theme') === 'dark'
  );
  const { orgId, setOrgId, orgs, loading } = useOrg();

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
    <Router basename="/dashboard">
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
            <Link to="/" className="hover:underline">Status</Link>
            <Link to="/health" className="hover:underline">Health</Link>
            <Link to="/proposals" className="hover:underline">Proposals</Link>
            <Link to="/logs" className="hover:underline">Logs</Link>
            <Link to="/agents" className="hover:underline">Agents</Link>
            <Link to="/admin" className="hover:underline">Admin</Link>
            <Link to="/departments/sales" className="hover:underline">Departments</Link>
          </nav>
          <button onClick={() => setDark(!dark)} className="text-sm mt-4">
            Toggle {dark ? 'Light' : 'Dark'}
          </button>
        </aside>
        <main className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<AgentStatusTable />} />
            <Route path="/health" element={<AgentHealthDashboard />} />
            <Route path="/proposals" element={<MisalignmentProposalsPanel />} />
            <Route path="/logs" element={<ExecutionLogViewer />} />
            <Route path="/agents" element={<AgentGallery />} />
            <Route path="/departments/:dept" element={<DepartmentRouter />} />
            <Route path="/admin" element={<AgentAdminConsole />} />
          </Routes>
        </main>
      </div>
      <FeedbackFab />
    </Router>
  );
}

export default function App() {
  return (
    <OrgProvider>
      <Shell />
    </OrgProvider>
  );
}

