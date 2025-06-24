import React, { useEffect, useState, useMemo } from 'react';
import ReactFlow, { Background, Controls, MarkerType } from 'reactflow';
import 'reactflow/dist/style.css';
import useAgentStepStatus from '../hooks/useAgentStepStatus.js';
import loadFlowConfig from '../utils/loadFlowConfig.js';
import AgentDetailDrawer from './AgentDetailDrawer.jsx';
import exportFlowResult from '../utils/exportFlowResult.js';

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
  const { step, flowId, userId, onSelect, onStatus } = data;
  const { status, data: log } = useAgentStepStatus(userId, flowId, step.agent);

  useEffect(() => {
    onStatus && onStatus(status, log);
  }, [status, log]);
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

export default function FlowVisualizer({ flowId: propFlowId, runId: propRunId, configId: propConfigId, userId = 'demo' }) {
  const query =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search)
      : null;
  const flowId = propFlowId || (query && query.get('flowId')) || 'website-analysis';
  const runId = propRunId || (query && query.get('runId')) || flowId;
  const configId = propConfigId || (query && query.get('configId')) || flowId;

  const [config, setConfig] = useState(null);
  const [selected, setSelected] = useState(null);
  const [stepLogs, setStepLogs] = useState({});
  const [complete, setComplete] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    loadFlowConfig(configId).then(setConfig);
  }, [configId]);

  const nodes = useMemo(() => {
    if (!config) return [];
    return config.steps.map((step, idx) => ({
      id: step.id,
      type: 'stepNode',
      position: { x: idx * 250, y: idx * 120 },
      data: {
        step,
        flowId: runId,
        userId,
        onSelect: setSelected,
        onStatus: (status, log) => {
          setStepLogs(prev => ({
            ...prev,
            [step.id]: { ...log, status, agent: step.agent, timestamp: log?.timestamp }
          }));
        }
      }
    }));
  }, [config, runId, userId]);

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

  const downloadReport = () => {
    const data = exportFlowResult(flowId, config, stepLogs);
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${flowId}-report.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyLink = () => {
    const token = btoa(encodeURIComponent(runId));
    const link = `${window.location.origin}/flows/${encodeURIComponent(token)}/view`;
    navigator.clipboard.writeText(link);
  };

  useEffect(() => {
    if (!config) return;
    const done = config.steps.every(
      (s) => stepLogs[s.id] && ['complete', 'error'].includes(stepLogs[s.id].status)
    );
    setComplete(done);
    const hasError = Object.values(stepLogs).some((l) => l.status === 'error');
    setFailed(hasError);
  }, [stepLogs, config]);

  return (
    <div className="w-full h-[500px] relative">
      {config && (
        <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} fitView>
          <Background />
          <Controls />
        </ReactFlow>
      )}
      {complete && (
        <div className="absolute top-2 right-2 flex gap-2 z-10">
          <button
            onClick={downloadReport}
            className="bg-gray-800 text-white text-xs px-2 py-1 rounded"
          >
            Download Report
          </button>
          <button
            onClick={copyLink}
            className="bg-gray-800 text-white text-xs px-2 py-1 rounded"
          >
            Copy Share Link
          </button>
        </div>
      )}
      {failed && !complete && (
        <div className="absolute inset-x-0 bottom-2 text-center text-red-400 text-sm">
          Flow failed. Check logs for details.
        </div>
      )}
      <AgentDetailDrawer log={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
