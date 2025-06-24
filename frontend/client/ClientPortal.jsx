import React, { useEffect, useState } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import BillingPanel from './BillingPanel.jsx';

export default function ClientPortal({ reports = [] }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('Reports');
  const [feed, setFeed] = useState([]);
  const [showOnboarding, setShowOnboarding] = useState(() => !localStorage.getItem('onboarded'));

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch('/audit?limit=20');
        const data = await res.json();
        setFeed(data);
        if (data.length === 0) setShowOnboarding(true);
      } catch (err) {
        console.error('Failed to load audit logs', err);
      }
    };
    fetchLogs();
    const id = setInterval(fetchLogs, 10000);
    return () => clearInterval(id);
  }, []);

  const addLocalEvent = (desc) => {
    setFeed((f) => [{ timestamp: new Date().toISOString(), description: desc }, ...f]);
  };

  const exportZip = async (url) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const zip = new JSZip();
      zip.file('report.pdf', blob);
      const meta = { url, exported: new Date().toISOString() };
      zip.file('metadata.json', JSON.stringify(meta, null, 2));
      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, `report-${Date.now()}.zip`);
      addLocalEvent(`Downloaded ${url.split('/').pop()}`);
    } catch {
      alert('Failed to export');
    }
  };

  const copyLink = (url) => {
    const token = btoa(url);
    const share = `${window.location.origin}/share/${encodeURIComponent(token)}`;
    navigator.clipboard
      .writeText(share)
      .then(() => {
        addLocalEvent(`Created share link for ${url.split('/').pop()}`);
        alert('Link copied!');
      })
      .catch(() => {
        alert('Copy failed');
      });
  };

  return (
    <div className="flex text-white">
      {showOnboarding && (
        <div className="fixed inset-x-0 top-0 bg-blue-700 text-white p-3 text-center z-10">
          Welcome! Run your first agent to see activity logs.
          <button
            className="ml-4 underline"
            onClick={() => {
              localStorage.setItem('onboarded', '1');
              setShowOnboarding(false);
            }}
          >
            Dismiss
          </button>
        </div>
      )}
      <div className={`bg-gray-800 transition-all duration-300 ${sidebarOpen ? 'w-48' : 'w-12'} overflow-hidden`}>
        <button className="p-2 focus:outline-none" onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? '❮' : '❯'}
        </button>
        {sidebarOpen && (
          <ul className="mt-4 space-y-2">
            {['Reports', 'Activity', 'Billing'].map((tab) => (
              <li key={tab}>
                <button
                  onClick={() => setActiveTab(tab)}
                  className={`group relative w-full text-left px-3 py-1 rounded hover:bg-gray-700 transition-colors ${
                    activeTab === tab ? 'font-bold' : ''
                  }`}
                >
                  {tab}
                  <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-1 text-xs bg-black text-white rounded opacity-0 group-hover:opacity-100 pointer-events-none">
                    {tab === 'Reports' ? '/reports' : tab === 'Activity' ? '/activity' : '/billing'}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="flex-1 p-6">
        {activeTab === 'Reports' && (
          <div>
            <h1 className="text-2xl font-bold mb-4">Your Reports</h1>
            {reports.length === 0 ? (
              <p>No reports available.</p>
            ) : (
              <ul className="list-disc pl-5 space-y-2">
                {reports.map((link, idx) => (
                  <li key={idx} className="flex items-center gap-3">
                    <a href={link} className="text-blue-400 underline" target="_blank" rel="noopener noreferrer">
                      {link.split('/').pop()}
                    </a>
                    <button onClick={() => exportZip(link)} className="text-sm text-green-400 underline">
                      Export to ZIP
                    </button>
                    <button onClick={() => copyLink(link)} className="text-sm text-yellow-400 underline">
                      Copy Shareable Link
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {activeTab === 'Activity' && (
          <div>
            <h1 className="text-2xl font-bold mb-4">Recent Activity</h1>
            <ul className="space-y-2">
              {feed.map((item, idx) => (
                <li
                  key={idx}
                  className="bg-gray-800 p-3 rounded transition-all duration-300 hover:bg-gray-700"
                >
                  <p className="text-sm text-gray-400">
                    {new Date(item.timestamp).toLocaleString()}
                  </p>
                  <p>{item.description || `${item.agent}: ${item.resultSummary || item.inputSummary}`}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {activeTab === 'Billing' && <BillingPanel />}
      </div>
    </div>
  );
}
