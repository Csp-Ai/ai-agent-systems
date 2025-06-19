// frontend/ReportViewer.jsx

import React from 'react';
import { CheckCircle, Copy, FileDown, FileText } from 'lucide-react';
import { saveAs } from 'file-saver';
import html2pdf from 'html2pdf.js';

export default function ReportViewer({ markdownText = "", onClose }) {
  const reportRef = React.useRef(null);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(markdownText);
      alert("Copied to clipboard!");
    } catch (err) {
      alert("Copy failed");
    }
  };

  const downloadAsFile = () => {
    const blob = new Blob([markdownText], { type: "text/markdown;charset=utf-8" });
    saveAs(blob, `ai-report-${Date.now()}.md`);
  };

  const downloadAsPDF = () => {
    if (!reportRef.current) return;
    const clone = reportRef.current.cloneNode(true);
    clone.style.background = '#fff';
    clone.style.color = '#000';
    clone.style.fontFamily = 'monospace';
    clone.style.padding = '20px';
    clone.style.whiteSpace = 'pre-wrap';
    document.body.appendChild(clone);

    const options = {
      margin:       10,
      filename:     `ai-report-${Date.now()}.pdf`,
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'pt', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(options).from(clone).save().then(() => {
      document.body.removeChild(clone);
    });
  };

  return (
    <div className="mt-12 bg-black/20 border border-white/30 rounded-xl p-6 text-white">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <CheckCircle className="text-green-400" /> AI Agent Report
        </h2>
        <div className="flex gap-3">
          <button onClick={copyToClipboard} title="Copy Markdown">
            <Copy className="w-5 h-5 text-white hover:text-blue-400" />
          </button>
          <button onClick={downloadAsFile} title="Download">
            <FileDown className="w-5 h-5 text-white hover:text-green-400" />
          </button>
          <button onClick={downloadAsPDF} title="Download PDF">
            <FileText className="w-5 h-5 text-white hover:text-red-400" />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="ml-4 border border-white/30 px-2 py-1 rounded hover:bg-white/10"
            >
              Close
            </button>
          )}
        </div>
      </div>

      <pre
        ref={reportRef}
        className="whitespace-pre-wrap text-green-300 text-sm bg-slate-900 p-4 rounded overflow-auto max-h-[600px]"
      >
        {markdownText}
      </pre>
    </div>
  );
}
