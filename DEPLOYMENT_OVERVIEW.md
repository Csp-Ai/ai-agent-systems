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
- `/health-check` – Basic service health endpoint.
- `/reports/*` – Generated PDF reports.

## Update Flow
1. Update React code in `/frontend` or `/dashboard`.
2. Run `npm run build` (in `frontend` or `dashboard`).
3. Commit changes to GitHub.
4. Trigger deployment via CI/CD or manually (`npm run deploy` or `gcloud run deploy`).
5. The `postDeploySummary.js` script runs, and `/api/summary` reflects the new build.

## CI/CD via GitHub Actions
The workflow `.github/workflows/deploy.yml` builds the Docker image using `gcloud builds submit` and deploys it to Cloud Run whenever commits are pushed to `main`.

### Service Account Setup
1. Create a service account with Cloud Run and Cloud Build permissions:
   ```bash
   gcloud iam service-accounts create github-actions --display-name "GitHub Actions"
   gcloud projects add-iam-policy-binding ai-agent-systems \
       --member "serviceAccount:github-actions@ai-agent-systems.iam.gserviceaccount.com" \
       --role "roles/run.admin"
   gcloud projects add-iam-policy-binding ai-agent-systems \
       --member "serviceAccount:github-actions@ai-agent-systems.iam.gserviceaccount.com" \
       --role "roles/cloudbuild.builds.editor"
   ```
2. Generate a JSON key and download it:
   ```bash
   gcloud iam service-accounts keys create key.json \
       --iam-account github-actions@ai-agent-systems.iam.gserviceaccount.com
   ```
3. Upload the `key.json` contents to the repository secret named `GCLOUD_SERVICE_KEY`.

After deployment the workflow runs `npm run postdeploy:cloudrun` and `npm run postdeploy:summary` to record deployment details.
