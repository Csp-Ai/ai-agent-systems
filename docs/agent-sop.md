# Agent Standard Operating Procedures

This document outlines the lifecycle of agents in the platform and how personas expand over time.

## Lifecycle and Learning Loops
1. **Creation** – an agent module is added under `/agents` with metadata in `agent-metadata.json`.
2. **Execution** – agents run via `/run-agent` and log actions to `/logs` and `/analytics`.
3. **Feedback** – results can be rated through `/feedback`; these signals are analysed by the analytics pipeline.
4. **Iteration** – insights from feedback are used to refine agent prompts, skills and dependencies.
5. **Expansion** – new personas or capabilities are registered via `/register-agent` and surfaced in the gallery.

## Persona Expansion Steps
1. Start with a minimal goal oriented agent.
2. Monitor usage and success rates in `analytics.json`.
3. Collect improvement ideas from `/feedback` entries.
4. Add dependencies or new agents that fill the gaps.
5. Update metadata version and enable the agent.

## SOP for Feedback and Analytics
- Post feedback to `/feedback` with `{ type, message, sessionId }`.
- Analytics events are stored via `/analytics` and retrieved with `GET /analytics`.
- Periodically review analytics to adjust agent weighting and improve onboarding flows.
