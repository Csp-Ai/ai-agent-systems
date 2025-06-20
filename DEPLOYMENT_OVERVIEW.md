# Deployment Architecture & Frontend Integration

## Overview
The platform uses a Node.js + Express backend that can be deployed to Google Cloud Run using the `Dockerfile`. The same backend is also deployable to Firebase as Cloud Functions. A React landing page built with Vite and Tailwind CSS lives in `/frontend`. After `npm run build` the compiled assets are output to `/frontend/dist` and served by the Express app at the root route (`/`). The `/dashboard` directory contains a separate React app for governance dashboards. Its build outputs to `public/dashboard`.

Deployments can be triggered manually or from GitHub Actions. After each deploy the `postDeploySummary.js` script collects commit info and writes `logs/summary.json` which is exposed via `/api/summary`.

## Folder Structure
```
/frontend        → React landing page (Vite + Tailwind)
/frontend/dist   → Built static assets served at /
/dashboard       → Governance dashboard React app
/functions       → Express API and agent loader
/public          → Hosting assets including dashboard builds
```

## Build & Deployment Commands
- Build dashboard and deploy to Firebase Hosting:
  ```bash
  cd dashboard
  npm install
  npm run build
  npm run deploy
  ```
- Deploy backend to Cloud Run (example):
```bash
gcloud builds submit --tag gcr.io/PROJECT_ID/ai-agent-systems
gcloud run deploy ai-agent-systems --image gcr.io/PROJECT_ID/ai-agent-systems --region REGION
```
The Dockerfile builds the React frontend during the container build so the `/` route serves the compiled assets out of the box.
- Post-deploy summary:
  ```bash
  npm run postdeploy:cloudrun
  npm run postdeploy:summary
  ```

## Route Summary
 - `/` – Serves the Vite-built landing page (Cloud Run loads this by default).
- `/dashboard` – Governance dashboard UI.
- `/api/summary` – Returns the latest deployment summary from `logs/summary.json`.
 - `/healthz` – Basic service health endpoint used by Cloud Run.
- `/reports/*` – Generated PDF reports.

## Update Flow
1. Update React code in `/frontend` or `/dashboard`.
2. Run `npm run build` (in `frontend` or `dashboard`).
3. Commit changes to GitHub.
4. Trigger deployment via CI/CD or manually (`npm run deploy` or `gcloud run deploy`).
5. The `postDeploySummary.js` script runs, and `/api/summary` reflects the new build.
