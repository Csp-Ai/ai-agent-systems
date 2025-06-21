# API Summary

Below is an overview of the primary backend routes exposed by `functions/index.js`.

| Method | Endpoint | Purpose |
| ------ | -------- | ------- |
| POST | `/run-agent` | Execute an agent with provided input |
| POST | `/executeAgent` | Alias of `/run-agent` |
| POST | `/send-report` | Email a PDF report for a session |
| GET  | `/generate-report/:sessionId` | Download session report |
| POST | `/submit-agent` | Upload new agent code for review |
| POST | `/welcome-log` | Record first-run events |
| POST | `/feedback` | Submit user feedback |
| GET/POST | `/analytics` | Read or write analytics events |
| GET/POST | `/simulation-actions/:id` | Track simulation interactions |
| GET/POST | `/next-steps/:id` | Store or fetch recommended next actions |
| POST | `/share` | Generate share token for a URL |
| GET  | `/registered-agents` | List agents available for demos |
| GET  | `/demo-agents` | Sample agent list for the demo page |
| GET  | `/health-check` | Run system health checks |

These endpoints store logs under `/logs`, `/analytics.json` and related files. Additional admin-only routes exist for viewing logs and managing agents.
