import React, { useEffect, useState } from 'react';

export default function OutputViewer({ file = '' }) {
  const [text, setText] = useState('');
  useEffect(() => {
    if (!file) return;
    const load = async () => {
      try {
        const res = await fetch(file);
        const t = await res.text();
        setText(t);
      } catch {}
    };
    load();
  }, [file]);

  return (
    <div className="p-6 text-white">
      <h1 className="text-xl font-bold mb-4">Shared Output</h1>
      <pre className="bg-black/50 p-4 rounded whitespace-pre-wrap text-green-300">
        {text}
      </pre>
    </div>
  );
}
