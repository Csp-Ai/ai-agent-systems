import React from 'react';

export default function ClientPortal({ reports = [] }) {
  return (
    <div className="p-6 text-white">
      <h1 className="text-2xl font-bold mb-4">Your Reports</h1>
      {reports.length === 0 ? (
        <p>No reports available.</p>
      ) : (
        <ul className="list-disc pl-5 space-y-2">
          {reports.map((link, idx) => (
            <li key={idx}>
              <a href={link} className="text-blue-400 underline" target="_blank" rel="noopener noreferrer">
                {link.split('/').pop()}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
