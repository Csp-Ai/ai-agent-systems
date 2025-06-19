import React from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export default function ClientPortal({ reports = [] }) {
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
    } catch {
      alert('Failed to export');
    }
  };

  const copyLink = (url) => {
    const token = btoa(url);
    const share = `${window.location.origin}/share/${encodeURIComponent(token)}`;
    navigator.clipboard.writeText(share).then(() => {
      alert('Link copied!');
    }).catch(() => {
      alert('Copy failed');
    });
  };

  return (
    <div className="p-6 text-white">
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
  );
}
