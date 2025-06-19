# Agent Development Guide

This document explains how to add new agents to the **ai-agent-systems** repository. Agents automate specific tasks and are loaded dynamically by the Express backend.

## Directory Structure

Agents live in the `/agents` folder and are loaded at runtime by `functions/loadAgents.js`. Metadata describing each agent is stored in `/agents/agent-metadata.json`.

```
/agents             → JavaScript agent modules
/agents/agent-metadata.json → Registry of available agents
/functions          → Express API and agent loader
/logs/logs.json     → Execution logs
```

## Naming Convention

* Agent files must use kebab-case and end with `-agent.js` (e.g. `insights-agent.js`).
* The key in `agent-metadata.json` must match the file name without the extension.
* Place the file inside the `/agents` directory.

## Agent Interface

Each agent exports a single `run()` function which accepts an input object and returns a result. The function may be `async`.

```js
// agents/example-agent.js
module.exports = {
  run: async (input) => {
    // ...your logic here...
    return { result: "example output", confidence: 0.95 };
  }
};
```

### Required Metadata

Every agent must have an entry in `agents/agent-metadata.json`. A typical entry looks like this:

```json
"example-agent": {
  "name": "Example Agent",
  "description": "Explains what the agent does.",
  "inputs": { "someInput": "string" },
  "outputs": { "result": "string" },
  "category": "Utility",
  "enabled": true,
  "version": "1.0.0",
  "createdBy": "Your Name",
  "lastUpdated": "2025-06-19"
}
```

Fields like `inputs` and `outputs` describe the expected shape of the request and response. `enabled` controls whether the API will allow execution.

## API Usage

Agents are executed via the `/run-agent` endpoint exposed by `functions/index.js`:

```http
POST /run-agent
```

Example request body:

```json
{
  "agent": "example-agent",
  "input": {
    "someInput": "value"
  }
}
```

The response will contain the agent output or an error object.

```json
{ "result": { ... } }
```

All executions are appended to `logs/logs.json` with the timestamp, request payload, output, and any error.
Agent actions are also recorded in `logs/audit.json` with the timestamp, session ID, agent name, and short summaries of the input and result. This file rotates daily, producing archives like `audit-2025-06-20.json`.

## Testing Tips

1. Start the server with `npm start`. This runs `functions/index.js`.
2. Trigger your agent using `curl` or a REST client:

   ```bash
   curl -X POST http://localhost:3000/run-agent \
        -H "Content-Type: application/json" \
        -d '{"agent":"example-agent","input":{"someInput":"value"}}'
   ```
3. Check `logs/logs.json` to verify the request and output were recorded.
4. Run `npm test` to execute any configured tests.

Following this structure keeps new agents consistent and ensures they can be loaded by the backend.
