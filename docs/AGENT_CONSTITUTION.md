🧠 AGENT CONSTITUTION

HybridDancers AI System

Last updated: 2025-06-19

🔍 Purpose

The Agent Constitution defines the core values, lifecycle, governance, and operational principles that all AI agents in the HybridDancers platform must adhere to. It is a shared agreement for autonomous agents to:

Continuously grow through feedback

Collaborate across modular pipelines

Remain explainable, ethical, and observable

📐 Foundational Pillars

1. Modularity

All agents must be single-purpose.

Communication occurs only through well-defined inputs/outputs.

No direct state sharing. All state must be passed explicitly or logged.

2. Observability

Every agent action must log:

Timestamp

Inputs

Outputs

Status (active, completed, failed)

All logs are stored in logs/sessionStatus.json and logs/logs.json.

3. Ethical Design

No agents may access child_process, fs.unlink, or perform destructive actions without audit.

All user data must be anonymized and stored securely.

4. Lifecycle Classification

Each agent must declare:

{
  "lifecycle": "{alpha|beta|production|deprecated}"
}

Lifecycle state is used by the board-agent to:

Filter critical services

Alert on broken dependencies

Trigger promotion/demotion workflows

5. Localization Support

All agents must optionally support a locale parameter.

Summaries and outputs should be translatable using translateText() utilities.

⚙️ Agent Responsibilities

Role

Description

mentor-agent.js

Audits logs and performance data, writes plans to development-plans.json.

board-agent.js

Aggregates mentor and audit data, recommends lifecycle status.

data-analyst-agent.js

Compiles trends, benchmarks, and outlier metrics.

report-generator-agent.js

Generates readable markdown reports.

client-agent.js

Interface for users to interact with sessions and agents.

All new agents must:

Register in agent-metadata.json

Include inputs, outputs, category, version, createdBy

🔁 CI/CD Integration

✅ GitHub Workflow Requirements

Each agent PR must:

Pass npm test

Include a changelog entry

Update agent-metadata.json

Avoid modifying others’ outputs unless explicitly approved

🧪 Continuous Evaluation

Mentor and Board agents trigger regular evaluations of agent usage, error frequency, and growth compliance:

Stale or unused agents are marked deprecated

Emerging agents with sustained utility are promoted to beta/production

📤 Submission & Review

New agents must:

Be submitted via /submit-agent

Include:

name, description, version, inputs, outputs

A .zip containing a single agent.js file

Pass dry-run and security checks

Be reviewed by mentor-agent for integration

🔭 Vision

This constitution is a living document. It is meant to:

Encourage sustainable innovation

Promote collaboration between autonomous tools

Maintain clarity as the HybridDancers system scales

All agents must treat this constitution as the supreme reference point for operation, contribution, and evaluation.

File Reference: docs/AGENT_CONSTITUTION.md
Maintainer: board-agent.js

"Agents that grow together, thrive together."
