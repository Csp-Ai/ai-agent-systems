#!/usr/bin/env bash

# Deploys the current directory to Google Cloud Run.
# Requirements:
#   - gcloud CLI installed
#   - Authenticated with gcloud (`gcloud auth login`)
#   - Project set via `gcloud config set project [PROJECT_ID]`

set -euo pipefail

# Auto-detect active project
PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
if [[ -z "$PROJECT_ID" ]]; then
  echo "❌ No active GCP project. Run: gcloud config set project [PROJECT_ID]" >&2
  exit 1
fi

SERVICE_NAME="ai-agent-systems"
REGION="us-central1"
IMAGE="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

check_gcloud() {
  if ! command -v gcloud >/dev/null 2>&1; then
    echo "❌ gcloud CLI not found. Install it from https://cloud.google.com/sdk/docs/install" >&2
    exit 1
  fi
}

check_auth() {
  if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q '@'; then
    echo "❌ No active gcloud account. Run 'gcloud auth login'" >&2
    exit 1
  fi
}

enable_api() {
  local api=$1
  if ! gcloud services list --enabled --format="value(config.name)" | grep -q "$api"; then
    echo "🔄 Enabling API: $api"
    gcloud services enable "$api"
  else
    echo "✅ API already enabled: $api"
  fi
}

build_image() {
  echo "📦 Building image: $IMAGE"
  gcloud builds submit --tag "$IMAGE" .
}

deploy_service() {
  echo "🚀 Deploying service: $SERVICE_NAME to region $REGION"
  gcloud run deploy "$SERVICE_NAME" \
    --image "$IMAGE" \
    --region "$REGION" \
    --platform managed \
    --allow-unauthenticated \
    --quiet

  local url
  url=$(gcloud run services describe "$SERVICE_NAME" --region "$REGION" --format='value(status.url)')
  if [[ -n "$url" ]]; then
    echo "✅ Deployment complete → $url"
  else
    echo "❌ Failed to retrieve service URL" >&2
    exit 1
  fi
}

main() {
  check_gcloud
  check_auth

  enable_api cloudbuild.googleapis.com
  enable_api run.googleapis.com
  enable_api artifactregistry.googleapis.com

  build_image
  deploy_service
}

main "$@"
