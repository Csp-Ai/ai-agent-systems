🧠 AGENT CONSTITUTION

Ai Agent Systems

Last updated: 2025-06-21

🔍 Purpose

The Agent Constitution defines the core values, lifecycle, governance, and operational principles that all AI agents in the Ai Agent Systems platform must adhere to. It is a shared agreement for autonomous agents to:

- Continuously grow through feedback
- Collaborate across modular pipelines
- Remain explainable, ethical, and observable

📊 Current Agent Ecosystem

🔄 Pipeline Overview

| Stage | Agent(s) | Notes |
|-------|----------|-------|
| Data Capture | website-scanner-agent.js | Strong success rate (0.95) |
| Analysis | insights-agent.js, data-analyst-agent.js | Insights missing implementation; analyst in incubation |
| Governance | mentor-agent.js, board-agent.js, guardian-agent.js | Early stage, enforce constitution |
| Reporting | report-generator-agent.js | Mature, high reliability (0.97) |

Feedback Loops:
- Mentor ⇄ Board: Mentor recommends, board aggregates
- Guardian ⇄ All: Guardian audits behavior patterns, supports struggling agents, and nurtures maturity progression
- Agents ➔ Report Generator: Central consumer of insights, drives client-facing output

Gaps:
- logs/audit.json missing
- insights-agent.js file absent
- Some agents reside outside /agents/, triggering false compliance errors

💡 Foundational Pillars

1. **Modularity**
   - All agents must be single-purpose.
   - Communication occurs only through well-defined inputs/outputs.
   - No direct state sharing. All state must be passed explicitly or logged.
2. **Observability**
   - Every agent action must log:
     - Timestamp
     - Inputs
     - Outputs
     - Status (active, completed, failed)
   - Logs go to `logs/sessionStatus.json` and `logs/logs.json`
3. **Ethical Design**
   - No agents may access `child_process`, `fs.unlink`, or perform destructive actions without audit.
   - All user data must be anonymized and stored securely.
4. **Lifecycle Classification**
   ```
   {
     "lifecycle": "{incubation|alpha|beta|production|deprecated}"
   }
   ```
   Used by `board-agent.js` to trigger promotion, demotion, or alerts
5. **Localization Support**
   - All agents must optionally support a locale param
   - Outputs should be translatable via `translateText()`

⚙️ Agent Responsibilities

| Agent | Role |
|-------|------|
| mentor-agent.js | Audits logs, proposes plans, logs to `development-plans.json` |
| board-agent.js | Lifecycle governance, aggregates mentor reports, flags violations |
| guardian-agent.js | Enforces harmony, analyzes logs for tone and alignment, tags misaligned agents |
| data-analyst-agent.js | Summarizes stats, trends, outliers |
| report-generator-agent.js | Generates Markdown reports |
| client-agent.js | User interface access |

All agents must:
- Register in `agent-metadata.json`
- Include inputs, outputs, category, version, createdBy
- Optionally set `"status": "planned"` for agents not yet implemented. Planned agents are exempt from the file existence check but must still provide full metadata and remain in the `incubation` lifecycle.

⟳ CI/CD & Governance Engine

✅ GitHub Workflows
- Enforce `npm test`, changelog entry, agent metadata update
- mentor-agent and board-agent validate adherence to this constitution
- guardian-agent scores psychological alignment and updates `agent-metadata.json`
- Daily workflow runs guardian-agent and board-agent for automated governance

🔎 Continuous Evaluation
- Promote agents with >0.95 success over 30 days
- Demote agents with <0.8 or inactivity
- Raise GitHub issues for violations (via `board-agent.js`)
- Run health-checks to validate code/metadata consistency
- Misaligned agents are demoted one stage and trigger `alignment-violation` issues

🛄 Third-Party Plugin Pathway

**Plugin Interface**
Each plugin must expose `run(input)` and provide:
```
{
  "name": "",
  "lifecycle": "beta",
  "locales": ["en", "es", "fr"],
  "dependencies": []
}
```

**Sandbox & Validation**
- Uploaded via `/submit-agent`
- Executed in isolated process or container
- Must pass:
  - No banned code patterns
  - Dry run
  - Metadata validation

**Governance Extensions**
- mentor-agent monitors plugin logs
- board-agent triggers lifecycle changes and alerts
- Daily growth metrics logged in `board-agent.js`

🔍 IP and Scalability Strategy

**Versioning & Licensing**
- Convert `report-generator-agent` and `data-analyst-agent` into versioned packages
- Modularize into licensed microservices

**Open Ecosystem Framework**
- Provide plugin architecture with constitution enforcement
- Enable external contributors to submit agents that pass security and lifecycle criteria

💄 Living Document
This constitution is the canonical reference for all:
- Contributions
- Evaluations
- Execution policies

File Reference: docs/AGENT_CONSTITUTION.md
Maintainer: board-agent.js

"Agents that grow together, thrive together."
