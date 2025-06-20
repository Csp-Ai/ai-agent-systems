# System Audit – June 20, 2025

This report summarizes the state of the **HybridDancers** agent network. Findings are based on `agents/agent-metadata.json`, recent logs, and the output of the mentor and board agents.

## Agent Flywheel Overview

- **mentor-agent** writes improvement plans to `logs/development-plans.json`.
- **board-agent** aggregates mentor recommendations and performs constitution checks.
- **data-analyst-agent** aggregates outputs for statistics and correlations.
- **report-generator-agent** is referenced in metadata but no implementation exists.
- **insights-agent** is referenced in metadata but no implementation exists.
- **website-scanner-agent** provides raw web data for other agents.

This creates a feedback loop where operational data flows from execution logs → mentor analysis → board governance → updated plans.

## Gaps & Issues

- **Missing agent implementations**: `insights-agent` and `report-generator-agent` exist in metadata but the corresponding files are absent, leading to constitution violations reported by board-agent.
- **False positives in constitution checks**: board-agent flags itself for banned patterns because the banned keywords appear in its own source code list.
- **Centralized governance**: board-agent currently performs all compliance checks, creating a single point of failure.
- **Lifecycle tracking**: `agent-benchmarks.json` includes a `market-research-agent` not present in metadata, causing orphaned metrics.

## Ranking by Importance & Growth Potential

| Agent | Importance | Growth Potential |
|-------|------------|-----------------|
| board-agent | **High** – enforces governance | Medium – refine checks, support plugins |
| mentor-agent | **High** – drives improvement plans | Medium – could expand metrics |
| website-scanner-agent | High – data gathering for other agents | Low – feature complete |
| data-analyst-agent | Medium – aggregates results | High – room for advanced analytics |
| insights-agent | Medium – potential marketing insights | Low until implemented |
| report-generator-agent | Medium – final client deliverables | Low until implemented |
| client-agent (planned) | Medium – user interface for sessions | High once built |

## CI/CD Flywheel Recommendations

- **Automated Promotion/Demotion**
  - Use benchmarks (`logs/agent-benchmarks.json`) to track success rate and latency for each agent.
  - If an agent maintains >95% success for 30 days, automatically update its lifecycle to `production` in `agent-metadata.json`.
  - Agents with success <80% or repeated audit failures should be demoted to `beta` or `deprecated`.
- **Mentor/Board Integration**
  - Mentor-agent should append summary metrics to a changelog file.
  - Board-agent can read these metrics and open PRs that update lifecycle fields.
- **Testing Gate**
  - Maintain `npm test` and static analysis in CI to ensure new agents comply with the [AGENT_CONSTITUTION](../docs/AGENT_CONSTITUTION.md).

## Preparing for Third‑Party Plugins

1. **Modular Loading** – Extend `functions/loadAgents.js` to allow loading agents from a plugins directory or remote registry. Each plugin must contain its own metadata file.
2. **Sandboxing** – Run third-party agents in isolated processes (e.g., worker threads) with restricted permissions to enforce the constitution’s banned patterns.
3. **License Strategy** – Consider licensing high-value agents (e.g., mentor-agent analytics) separately to create an IP moat while allowing others to build compatible plugins.
4. **Governance Hooks** – Require all plugins to register with board-agent for constitution compliance checks before activation.

## Conclusion

The agent network follows a modular design, but missing implementations and limited governance checks reduce scalability. Strengthening automated lifecycle management and introducing a plugin framework—while enforcing the constitution—will accelerate innovation without sacrificing oversight.
