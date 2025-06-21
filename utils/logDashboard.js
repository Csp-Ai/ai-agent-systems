export default async function logDashboard(event, data = {}) {
  try {
    await fetch('/dashboard-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, data })
    });
  } catch (err) {
    console.warn('dashboard log failed', err);
  }
}
