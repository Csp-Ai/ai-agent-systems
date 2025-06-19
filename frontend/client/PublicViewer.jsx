import React from 'react';

export default function PublicViewer({ url = '' }) {
  return (
    <div className="p-6 text-white">
      <h1 className="text-xl font-bold mb-4">Shared Report</h1>
      {url ? (
        <object data={url} type="application/pdf" className="w-full h-screen">
          <p className="text-center">
            PDF preview not available. <a href={url} className="underline" target="_blank" rel="noopener noreferrer">Download</a>
          </p>
        </object>
      ) : (
        <p>No report found.</p>
      )}
    </div>
  );
}
