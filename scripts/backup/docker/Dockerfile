# Daily Supabase database backup job — runs as a scheduled ECS Fargate task.
# postgres:17 matches the Supabase project's Postgres major version (pg_dump
# must be >= the server version). Bump this tag when Supabase upgrades.
FROM postgres:17-alpine

RUN apk add --no-cache aws-cli bash

COPY run-backup.sh /usr/local/bin/run-backup.sh
RUN chmod +x /usr/local/bin/run-backup.sh

ENTRYPOINT ["/usr/local/bin/run-backup.sh"]
