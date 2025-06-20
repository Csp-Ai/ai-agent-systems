import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import AgentStatusTable from './components/AgentStatusTable';
import MisalignmentProposalsPanel from './components/MisalignmentProposalsPanel';
import ExecutionLogViewer from './components/ExecutionLogViewer';
import AgentHealthDashboard from './components/AgentHealthDashboard';
import './index.css';

export default function App() {
  const [dark, setDark] = useState(
    localStorage.getItem('theme') === 'dark'
  );

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  return (
    <Router basename="/dashboard">
      <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <aside className="w-48 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4 flex flex-col">
          <nav className="flex flex-col space-y-2 flex-1">
            <Link to="/" className="hover:underline">Status</Link>
            <Link to="/health" className="hover:underline">Health</Link>
            <Link to="/proposals" className="hover:underline">Proposals</Link>
            <Link to="/logs" className="hover:underline">Logs</Link>
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
          </Routes>
        </main>
      </div>
    </Router>
  );
}
