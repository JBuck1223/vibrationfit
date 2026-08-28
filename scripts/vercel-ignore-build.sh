#!/usr/bin/env bash
# Vercel Ignored Build Step.
# Exit 0 = skip the deployment. Exit 1 = build it.
#
# Production (main) only. Do not add preview, PR, or working-branch builds.

set -u

env="${VERCEL_ENV:-}"
ref="${VERCEL_GIT_COMMIT_REF:-}"

echo "Vercel ignore check: env=${env} ref=${ref}"

if [ "${env}" = "production" ]; then
  echo "Building production"
  exit 1
fi

echo "Skipping ${ref:-unknown branch} (production only)"
exit 0
