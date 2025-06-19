import React, { useEffect, useState } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { detectLocale, t } from './i18n';

export default function ClientPortal({ reports = [] }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('reports');
  const [feed, setFeed] = useState([]);
  const [locale, setLocale] = useState('en');

  useEffect(() => {
    setLocale(detectLocale());
    const fetchLogs = async () => {
      try {
        const res = await fetch('/audit?limit=20');
        const data = await res.json();
        setFeed(data);
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
      <div className={`bg-gray-800 transition-all duration-300 ${sidebarOpen ? 'w-48' : 'w-12'} overflow-hidden`}>
        <button className="p-2 focus:outline-none" onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? '❮' : '❯'}
        </button>
        {sidebarOpen && (
          <ul className="mt-4 space-y-2">
            {['reports', 'activity', 'billing'].map((key) => (
              <li key={key}>
                <button
                  onClick={() => setActiveTab(key)}
                  className={`w-full text-left px-3 py-1 rounded hover:bg-gray-700 transition-colors ${
                    activeTab === key ? 'font-bold' : ''
                  }`}
                >
                  {t(locale, key)}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="flex-1 p-6">
        {activeTab === 'reports' && (
          <div>
            <h1 className="text-2xl font-bold mb-4">{t(locale, 'yourReports')}</h1>
            {reports.length === 0 ? (
              <p>{t(locale, 'noReports')}</p>
            ) : (
              <ul className="list-disc pl-5 space-y-2">
                {reports.map((link, idx) => (
                  <li key={idx} className="flex items-center gap-3">
                    <a href={link} className="text-blue-400 underline" target="_blank" rel="noopener noreferrer">
                      {link.split('/').pop()}
                    </a>
                    <button onClick={() => exportZip(link)} className="text-sm text-green-400 underline">
                      {t(locale, 'exportZip')}
                    </button>
                    <button onClick={() => copyLink(link)} className="text-sm text-yellow-400 underline">
                      {t(locale, 'copyShareLink')}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {activeTab === 'activity' && (
          <div>
            <h1 className="text-2xl font-bold mb-4">{t(locale, 'recentActivity')}</h1>
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

        {activeTab === 'billing' && (
          <div>
            <h1 className="text-2xl font-bold mb-4">{t(locale, 'billing')}</h1>
            <p>{t(locale, 'billingSoon')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
