export default async function loadFlowConfig(flowId) {
  if (!flowId) return null;
  try {
    const res = await fetch(`/flows/${flowId}.json`);
    if (!res.ok) throw new Error('Failed to load flow');
    const data = await res.json();
    return data;
  } catch {
    return null;
  }
}
