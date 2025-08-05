import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export default function AgentDetailDrawer({ log, onClose }) {
  const ts = log?.timestamp ? new Date(log.timestamp).toLocaleString() : '';
  const jsonData = JSON.stringify(
    {
      input: log?.input,
      output: log?.output,
      explanation: log?.explanation,
    },
    null,
    2
  );
  return (
    <AnimatePresence>
      {log && (
        <motion.div className="fixed inset-0 z-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-black/50" onClick={onClose}></div>
          <motion.div
            className="absolute right-0 top-0 h-full w-full sm:w-96 bg-white dark:bg-gray-800 shadow-xl overflow-y-auto p-4"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween' }}
          >
            <button onClick={onClose} className="text-sm mb-4">
              Close
            </button>
            <h2 className="text-lg font-bold mb-1">{log.agent}</h2>
            <div className="text-xs opacity-80 mb-2">{ts}</div>
            {log.input && (
              <div className="mb-2 text-sm">
                <div className="font-semibold mb-1">Input</div>
                <pre className="whitespace-pre-wrap break-words bg-gray-50 dark:bg-gray-700 p-2 rounded text-xs">{JSON.stringify(log.input, null, 2)}</pre>
              </div>
            )}
            {log.output && (
              <div className="mb-2 text-sm">
                <div className="font-semibold mb-1">Output</div>
                <pre className="whitespace-pre-wrap break-words bg-gray-50 dark:bg-gray-700 p-2 rounded text-xs">{typeof log.output === 'string' ? log.output : JSON.stringify(log.output, null, 2)}</pre>
              </div>
            )}
            {log.explanation && (
              <div className="mb-2 text-sm">
                <div className="font-semibold mb-1">Explanation</div>
                <pre className="whitespace-pre-wrap break-words bg-gray-50 dark:bg-gray-700 p-2 rounded text-xs">{log.explanation}</pre>
              </div>
            )}
            <div className="flex gap-4 mt-2">
              <button
                onClick={() => navigator.clipboard.writeText(jsonData)}
                className="text-xs underline"
              >
                Copy JSON
              </button>
              <a
                href={`data:application/json,${encodeURIComponent(jsonData)}`}
                download={`${log.agent}-output.json`}
                className="text-xs underline"
              >
                Download
              </a>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
