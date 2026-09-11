#!/usr/bin/env bash
set -euo pipefail

# Validex API deploy script - runs on the OCI VM at /opt/apps/validex.
#
# Required env: IMAGE_OWNER, REPO_NAME, IMAGE_TAG, GHCR_USER, GHCR_TOKEN
#
# Order of operations matters: both images must be present before either is
# used, the migrator must succeed before the running API container is
# touched, and image.env is only updated after the new container is
# confirmed healthy - so a failed deploy never leaves the host pointing at
# a tag that isn't actually running.

: "${IMAGE_OWNER:?IMAGE_OWNER is required}"
: "${REPO_NAME:?REPO_NAME is required}"
: "${IMAGE_TAG:?IMAGE_TAG is required}"
: "${GHCR_USER:?GHCR_USER is required}"
: "${GHCR_TOKEN:?GHCR_TOKEN is required}"

APP_DIR="/opt/apps/validex"
API_IMAGE="ghcr.io/${IMAGE_OWNER}/${REPO_NAME}-api:${IMAGE_TAG}"
MIGRATOR_IMAGE="ghcr.io/${IMAGE_OWNER}/${REPO_NAME}-migrator:${IMAGE_TAG}"
HEALTH_URL="http://localhost:3003/v1/health"
HEALTH_RETRIES=10
HEALTH_DELAY_SECONDS=3

cd "$APP_DIR"

echo "==> Logging in to ghcr.io as ${GHCR_USER}"
echo "${GHCR_TOKEN}" | docker login ghcr.io --username "${GHCR_USER}" --password-stdin

echo "==> Pulling ${API_IMAGE}"
docker pull "${API_IMAGE}"

echo "==> Pulling ${MIGRATOR_IMAGE}"
docker pull "${MIGRATOR_IMAGE}"

echo "==> Logging out of ghcr.io"
docker logout ghcr.io

echo "==> Running database migrations"
if ! docker run --rm \
  --network alpha \
  --env-file "${APP_DIR}/.env" \
  "${MIGRATOR_IMAGE}"; then
  echo "!! Migration failed - aborting before touching the running container" >&2
  exit 1
fi

echo "==> Migrations succeeded - recreating validex-api"
docker rm -f validex-api >/dev/null 2>&1 || true
IMAGE_OWNER="${IMAGE_OWNER}" REPO_NAME="${REPO_NAME}" IMAGE_TAG="${IMAGE_TAG}" \
  docker compose -f "${APP_DIR}/compose.yml" up -d --force-recreate

echo "==> Waiting for ${HEALTH_URL} to report healthy"
attempt=0
until curl --fail --silent --show-error "${HEALTH_URL}" >/dev/null; do
  attempt=$((attempt + 1))
  if [ "${attempt}" -ge "${HEALTH_RETRIES}" ]; then
    echo "!! Health check failed after ${HEALTH_RETRIES} attempts" >&2
    exit 1
  fi
  sleep "${HEALTH_DELAY_SECONDS}"
done
echo "==> Health check passed"

echo "==> Recording deployed image tag"
IMAGE_ENV_TMP="$(mktemp "${APP_DIR}/.image.env.XXXXXX")"
{
  echo "IMAGE_OWNER=${IMAGE_OWNER}"
  echo "REPO_NAME=${REPO_NAME}"
  echo "IMAGE_TAG=${IMAGE_TAG}"
} > "${IMAGE_ENV_TMP}"
chmod 600 "${IMAGE_ENV_TMP}"
mv "${IMAGE_ENV_TMP}" "${APP_DIR}/image.env"

echo "==> Pruning unused images"
docker image prune -f

echo "==> Deploy complete: ${API_IMAGE}"
