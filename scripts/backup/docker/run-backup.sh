#!/bin/bash
# Dumps the Supabase Postgres database and uploads it to the locked-down S3
# bucket. Runs inside ECS Fargate on a daily EventBridge schedule.
#
# Env (injected by the task definition):
#   DATABASE_URL  - from Secrets Manager (vibrationfit/db-backup-url)
#   S3_BUCKET     - target bucket (vibrationfit-db-backups)
#   S3_PREFIX     - key prefix (vibrationfit)
set -euo pipefail

STAMP=$(date -u '+%Y-%m-%d_%H%M')
DUMP_FILE="/tmp/db_${STAMP}.dump"
S3_KEY="${S3_PREFIX}/db_${STAMP}.dump"

echo "Starting backup db_${STAMP}.dump"

pg_dump "$DATABASE_URL" -Fc --no-owner --no-privileges -f "$DUMP_FILE"

SIZE=$(stat -c%s "$DUMP_FILE")
# A real dump of this database is far larger than 100KB
if [ "$SIZE" -lt 100000 ]; then
  echo "ERROR: dump suspiciously small ($SIZE bytes), refusing to upload"
  exit 1
fi
echo "Dump OK ($SIZE bytes)"

aws s3 cp "$DUMP_FILE" "s3://${S3_BUCKET}/${S3_KEY}"

echo "Backup complete: s3://${S3_BUCKET}/${S3_KEY}"
