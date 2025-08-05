import React from 'react';

const styles = {
  completed: 'bg-green-200 text-green-800',
  running: 'bg-yellow-200 text-yellow-800',
  failed: 'bg-red-200 text-red-800',
};

export default function FlowStatusBadge({ status = 'running' }) {
  let label = 'Running';
  let icon = '⏳';
  let key = 'running';
  if (status === 'completed' || status === 'complete') {
    label = 'Completed';
    icon = '✅';
    key = 'completed';
  } else if (status === 'failed' || status === 'error') {
    label = 'Failed';
    icon = '❌';
    key = 'failed';
  }
  return (
    <span className={`text-xs font-medium px-2 py-1 rounded ${styles[key]}`}> 
      {icon} {label}
    </span>
  );
}
