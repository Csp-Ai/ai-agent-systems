import React from 'react';
import FlowVisualizer from '../../../components/FlowVisualizer.jsx';

export default function FlowViewPage({ flowId }) {
  return (
    <div className="p-4">
      <FlowVisualizer flowId={flowId} />
    </div>
  );
}
