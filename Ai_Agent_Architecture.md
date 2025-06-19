# 🤖 AI Agent Systems – Architecture & CI/CD Guidelines

_Last updated: June 19, 2025_

---

## 📦 Modular Architecture Overview

This project uses a modular, agent-based architecture designed to scale across industries and use cases. Each agent performs a specific, reusable function and adheres to a standard execution interface.

### 📁 Folder Structure
```
/functions        → Express backend (entry point, agent dispatcher)
/agents           → Modular AI agents (e.g., insights-agent.js)
/logs/logs.json   → Append-only agent execution logs
/sops             → SOP documentation (markdown-based)
/frontend         → React-based lead generation and UI flow
```

---

## 🧠 Agent Interface Contract

All agents must export a `run()` method and follow this structure:
```js
// /agents/example-agent.js
module.exports = {
  run: async (input) => {
    // process input
    return { result: "...", confidence: 0.95 };
  }
};
```

**Naming Convention:**  
- Agents are named like `insights-agent.js`, `forecast-agent.js`, etc.  
- Must be located in the `/agents/` directory

---

## 🔁 Agent Execution Lifecycle

Agents are invoked via a single API endpoint:
```http
POST /run-agent
```

### Request Format:
```json
{
  "agent": "insights-agent",
  "input": {
    "companyName": "...",
    "websiteUrl": "...",
    "email": "..."
  }
}
```

### Response Format:
```json
{
  "response": { ... },
  "error": null
}
```

Results and errors are logged to `logs/logs.json` for transparency and auditability.

---

## 🔧 CI/CD Guidelines

### ✅ Development Standards
- Use Node.js 18+ and CommonJS modules
- All agents must pass linting (`eslint` or `prettier`)
- All commits must preserve formatting

### ✅ Testing
- `npm test` must pass in CI (can include basic syntax or Jest/Playwright tests)
- Consider snapshot testing for agents returning structured results

### ✅ Logging & Monitoring
- Every `/run-agent` request is logged to `/logs/logs.json` with:
  - Timestamp
  - Agent name
  - Input payload
  - Output result
  - Error (if any)

---

## 🚀 Deployment Strategy

### 🧪 Staging
- Deploy to Railway, Render, or Firebase as a test instance
- Use dummy API keys and logs
- Manually verify UI analysis steps

### 🌐 Production
- Environment variables pulled from `.env` or Firebase secrets
- Logging, error handling, and CORS enabled
- Optional: Rate limit by IP or API key

---

## 🧱 Future Ideas
- Add `agent-metadata.json` to describe agent purpose and author
- Add OpenAI or Claude wrapper utilities to unify completions
- Support `agent.run(input, context)` pattern for internal chaining
- Build `report-generator-agent` to output Markdown and PDFs

---

Built by a builder-led team:  
Chris Ponce – Strategy + Ops  
Zach Jefferys – Full-stack AI  
Mark Ehrhardt – Innovation & Foresight  
