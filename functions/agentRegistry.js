const { writeDocument, readCollection } = require('./db');

async function registerAgent(orgId, req, res) {
  const { agentId, displayName, description, defaultSOP, renderComponent = '' } = req.body || {};
  if (!agentId || !displayName || !description || !defaultSOP) {
    return res.status(400).json({ error: 'agentId, displayName, description and defaultSOP are required' });
  }
  try {
    await writeDocument(`orgs/${orgId}/agents`, agentId, {
      displayName,
      description,
      defaultSOP,
      renderComponent
    });
    res.json({ success: true });
  } catch (err) {
    console.error('Failed to register agent:', err);
    res.status(500).json({ error: 'Failed to register agent' });
  }
}

async function listRegisteredAgents(orgId, _req, res) {
  try {
    const agents = await readCollection(`orgs/${orgId}/agents`);
    res.json(agents);
  } catch (err) {
    console.error('Failed to read agents:', err);
    res.status(500).json({ error: 'Failed to read agents' });
  }
}

module.exports = { registerAgent, listRegisteredAgents };
