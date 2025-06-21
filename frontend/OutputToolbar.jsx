import React from 'react';
import { FaFilePdf, FaMarkdown, FaLink } from 'react-icons/fa';
import { motion } from 'framer-motion';
import html2pdf from 'html2pdf.js';

export default function OutputToolbar({ content = '', sessionId = '' }) {
  if (!content) return null;

  const copyMarkdown = async () => {
    try {
      await navigator.clipboard.writeText(content);
    } catch {}
  };

  const downloadPDF = () => {
    const el = document.createElement('pre');
    el.textContent = content;
    document.body.appendChild(el);
    html2pdf()
      .set({ filename: `output-${sessionId || Date.now()}.pdf` })
      .from(el)
      .save()
      .finally(() => document.body.removeChild(el));
  };

  const shareLink = async () => {
    if (!sessionId) return;
    try {
      const res = await fetch(`/share-output/${sessionId}`, { method: 'POST' });
      const data = await res.json();
      if (data.url) {
        await navigator.clipboard.writeText(`${window.location.origin}${data.url}`);
        window.open(data.url, '_blank');
      }
    } catch {}
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      className="fixed bottom-4 right-4 bg-black/70 p-3 rounded-full flex gap-3 z-50"
    >
      <button onClick={downloadPDF} className="text-white hover:text-red-400" title="Download as PDF">
        <FaFilePdf />
      </button>
      <button onClick={copyMarkdown} className="text-white hover:text-green-400" title="Copy as Markdown">
        <FaMarkdown />
      </button>
      <button onClick={shareLink} className="text-white hover:text-blue-400" title="Copy Shareable Link">
        <FaLink />
      </button>
    </motion.div>
  );
}
