# ai-agent-systems

Custom AI agent systems to streamline operations, automate tasks, and enhance decision-making. Built by a strategy-led, builder-driven team.

[**Agent Constitution**](docs/AGENT_CONSTITUTION.md) – official guidelines covering ethics, lifecycle policies and governance for all agents.

## 🧭 Project Overview

This repository supports rapid design, development, and deployment of AI agent systems that improve operational efficiency and scale intelligently across industries.

### Use Cases Include:
- Booking & scheduling automation  
- Admin, CX, or sales workflows  
- AI-powered insights dashboards  
- SOP generation and team enablement  
- Custom GPT-based copilots (internal or client-facing)

## 🧠 Core Team
- **Chris Ponce** – AI Strategist & Ops Architect  
- **Zach Jefferys** – Full-stack AI Developer  
- **Mark Ehrhardt** – Product Strategy & Innovation

## 🧱 System Modules

| Module              | Description                                             |
|---------------------|---------------------------------------------------------|
| `functions/`        | Server logic, APIs, agent orchestration                 |
| `agents/`           | Modular AI agents (e.g., insights-agent, forecast-agent)|
| `frontend/`         | Optional web dashboard or client UI                     |
| `logs/`             | JSON logs for transparency and explainability           |
| `sops/`             | Generated SOPs or training documentation                |

> 🔁 Agents are designed to be reusable across industries with minimal changes to input data or config files.

## 🚀 Workflow Phases

| Week | Focus                          | Deliverables                          |
|------|--------------------------------|---------------------------------------|
| 1    | Discovery & Use Case Mapping   | Opportunity matrix, process audit     |
| 2    | UX & Agent Design              | Workflow logic, specs, data schemas   |
| 3–5  | Build, Test, Integrate         | Deployed agent(s), dashboards, QA     |
| 6    | Handoff & Enablement           | Training, SOPs, post-launch support   |

## 🛠️ Tech Stack
- Node.js + Express (server-side)
- Firebase Auth + Hosting
- Stripe Checkout
- GPT-based agents (OpenAI API)
- Optional Python scripts for analytics

## 🔒 License
[Apache 2.0 License](LICENSE)

## 👣 Getting Started

```bash
# Clone the repo
git clone https://github.com/Csp-Ai/ai-agent-systems.git

# Navigate into project
cd ai-agent-systems

# Install dependencies
npm install

# Run development server
npm start

## 🌐 Localization & Submission Pipeline

The backend includes optional translation utilities powered by **LibreTranslate**. Pass a `locale` when calling `/run-agent` to automatically translate an agent's output. The API also exposes `/translate`, `/detect-language`, and `/locales` helpers for ad-hoc requests.

Developers can submit new agents through `/submit-agent` with metadata and a zip file. Submissions are staged for manual review before integration.

## 🔎 Governance Dashboard

The `/dashboard` directory contains a React application that connects to Firestore for real-time monitoring. To build the dashboard:

```bash
cd dashboard
npm install
npm run build
```

The compiled assets are output to `public/dashboard` and automatically served via Firebase Hosting.

## 🔥 Firebase Deployment

The `.firebaserc` already points to the production project `ai-agent-systems` and
`firebase.json` only defines the `functions` block so deployments target Cloud
Functions exclusively.

Initialize Firebase if needed and deploy the functions:

```bash
firebase init functions
firebase deploy --only functions
```

Once deployed the public endpoints are available under
`https://us-central1-ai-agent-systems.cloudfunctions.net/`:

```
- translate → https://us-central1-ai-agent-systems.cloudfunctions.net/translate
- report → https://us-central1-ai-agent-systems.cloudfunctions.net/report
- executeAgent → https://us-central1-ai-agent-systems.cloudfunctions.net/executeAgent
```

For local development you can start the emulator:

```bash
firebase emulators:start --only functions
# Example agent run
curl http://localhost:5001/ai-agent-systems/us-central1/executeAgent
```

If your environment blocks `firebase-public` domains and the emulator fails to
start, run the server directly instead:

```bash
node functions/index.js
```
