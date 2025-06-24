/* eslint-env browser */

export function logAgentEvent(agent, event, timeSpent) {
  if (!agent || !event) return;
  fetch('/analytics/agents', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ agentId: agent.id, event, useCase: agent.category, timeSpent })
  }).catch(() => {});
}

export function startPageTimer(path) {
  const start = Date.now();
  function send() {
    const timeSpent = Date.now() - start;
    fetch('/analytics/pages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path, timeSpent })
    }).catch(() => {});
  }
  window.addEventListener('beforeunload', send);
  return () => {
    window.removeEventListener('beforeunload', send);
    send();
  };
}
