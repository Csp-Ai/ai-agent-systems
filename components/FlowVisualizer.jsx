import React, { useEffect, useState, useMemo } from 'react';
import ReactFlow, { Background, Controls, MarkerType } from 'reactflow';
import 'reactflow/dist/style.css';
import useAgentStepStatus from '../hooks/useAgentStepStatus.js';
import loadFlowConfig from '../utils/loadFlowConfig.js';
import AgentDetailDrawer from './AgentDetailDrawer.jsx';

const statusStyles = {
  waiting: 'bg-gray-500',
  running: 'bg-blue-500 animate-pulse',
  complete: 'bg-green-600',
  error: 'bg-red-600'
};

function extractInputs(input) {
  const str = JSON.stringify(input || {});
  const matches = str.match(/\$steps\.([\w-]+)\.output/g) || [];
  return matches.map(m => m.split('.')[1]);
}

function StepNode({ data }) {
  const { step, flowId, userId, onSelect } = data;
  const { status, data: log } = useAgentStepStatus(userId, flowId, step.agent);
  return (
    <div
      onClick={() => onSelect({ ...log, agent: step.agent })}
      className={`cursor-pointer text-white rounded-md px-3 py-2 shadow ${
        statusStyles[status] || statusStyles.waiting
      }`}
    >
      <div className="text-sm font-semibold">
        {step.displayName || step.agent}
      </div>
      <div className="text-xs capitalize opacity-80">{status}</div>
    </div>
  );
}

export default function FlowVisualizer({ flowId: propFlowId, userId = 'demo' }) {
  const query =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search)
      : null;
  const flowId = propFlowId || (query && query.get('flowId')) || 'website-analysis';

  const [config, setConfig] = useState(null);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    loadFlowConfig(flowId).then(setConfig);
  }, [flowId]);

  const nodes = useMemo(() => {
    if (!config) return [];
    return config.steps.map((step, idx) => ({
      id: step.id,
      type: 'stepNode',
      position: { x: idx * 250, y: idx * 120 },
      data: { step, flowId, userId, onSelect: setSelected }
    }));
  }, [config, flowId, userId]);

  const edges = useMemo(() => {
    if (!config) return [];
    const arr = [];
    config.steps.forEach(step => {
      const inputs = step.inputsFrom || extractInputs(step.input);
      inputs.forEach(inp => {
        arr.push({
          id: `${inp}-${step.id}`,
          source: inp,
          target: step.id,
          animated: true,
          markerEnd: { type: MarkerType.ArrowClosed }
        });
      });
    });
    return arr;
  }, [config]);

  const nodeTypes = useMemo(() => ({ stepNode: StepNode }), []);

  return (
    <div className="w-full h-[500px]">
      {config && (
        <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} fitView>
          <Background />
          <Controls />
        </ReactFlow>
      )}
      <AgentDetailDrawer log={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
