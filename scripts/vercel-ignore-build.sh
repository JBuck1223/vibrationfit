#!/usr/bin/env bash
# Vercel Ignored Build Step.
# Exit 0 = skip the deployment. Exit 1 = build it.
#
# The dashboard was set to production-only, which canceled every PR preview
# (including /viva mobile fixes that have to be tested on a phone).
# vercel.json ignoreCommand overrides that setting.

set -u

ref="${VERCEL_GIT_COMMIT_REF:-}"
pr="${VERCEL_GIT_PULL_REQUEST_ID:-}"
env="${VERCEL_ENV:-}"

echo "Vercel ignore check: env=${env} ref=${ref} pr=${pr}"

if [ "${env}" = "production" ]; then
  echo "Building production"
  exit 1
fi

if [ -n "${pr}" ] && [ "${pr}" != "0" ]; then
  echo "Building pull request #${pr}"
  exit 1
fi

case "${ref}" in
  main|dev|jordan|jvmacmini|cursor/*)
    echo "Building branch ${ref}"
    exit 1
    ;;
esac

echo "Skipping ${ref:-unknown branch}"
exit 0
