export default function exportFlowResult(flowId, config, logs = {}) {
  if (!config) return null;
  const steps = config.steps.map((step, idx) => {
    const entry = logs[step.id] || {};
    return {
      order: idx + 1,
      agent: step.agent,
      timestamp: entry.timestamp || null,
      input: entry.input,
      output: entry.output,
      explanation: entry.explanation,
    };
  });
  const input = steps[0]?.input || {};
  return { flowId, input, steps };
}
