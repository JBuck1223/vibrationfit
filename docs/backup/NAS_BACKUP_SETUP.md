# Daily Database Backup — AWS-Native + Synology Mirror

Daily `pg_dump` of the Supabase database (project `nxjhqibnlbwzzphewncj`, Postgres 17),
independent of any local hardware:

```
EventBridge (3:00 AM ET, retries x2)
   └─> ECS Fargate task (pg_dump in postgres:17 container)
          └─> S3: vibrationfit-db-backups  (immutable 30d, expires 90d)
                 └─> Synology Cloud Sync mirrors bucket -> NAS (read-only pull)
```

The AWS side runs entirely on its own. The NAS is just a mirror — if it's off
for a week, it catches up when it comes back; backups were never at risk.

## AWS resources (account 428923191740, us-east-2)

| Resource | Purpose |
|---|---|
| S3 `vibrationfit-db-backups` | Versioned, Object Lock GOVERNANCE 30 days (immutable), public access blocked, SSE-S3, lifecycle: expire after 90 days |
| ECR `vibrationfit-db-backup` | Backup container image (`postgres:17-alpine` + aws-cli). Source: `scripts/backup/docker/` |
| ECS cluster `vibrationfit-jobs`, task def `vibrationfit-db-backup` | Fargate task that runs the dump (ARM64, 0.5 vCPU / 1GB) |
| Secrets Manager `vibrationfit/db-backup-url` | `DATABASE_URL` connection string, injected into the task |
| EventBridge schedule `vibrationfit-db-backup-daily` | Daily 3:00 AM America/New_York, 2 retries |
| IAM role `vibrationfit-backup-exec-role` | Pull image, read the secret, write logs |
| IAM role `vibrationfit-backup-task-role` | `s3:PutObject` to the backup prefix only |
| IAM role `vibrationfit-backup-scheduler-role` | Lets EventBridge start the task |
| IAM user `vibrationfit-nas-sync` | **Read-only** (Get/List on this bucket only) — used by Synology Cloud Sync |
| CloudWatch `/ecs/vibrationfit-db-backup` | Job logs, 30-day retention |

## One-time: set the real database password

The secret was created with a placeholder. Get the connection string from
Supabase Dashboard → Project Settings → Database → Connection string
(**Session pooler**, port 5432), then:

```bash
aws secretsmanager put-secret-value \
  --secret-id vibrationfit/db-backup-url \
  --secret-string 'postgresql://postgres.nxjhqibnlbwzzphewncj:REAL_PASSWORD@<pooler-host>:5432/postgres'
```

Then trigger a run to confirm (or wait for 3 AM):

```bash
aws ecs run-task --cluster vibrationfit-jobs --task-definition vibrationfit-db-backup \
  --launch-type FARGATE --network-configuration \
  '{"awsvpcConfiguration":{"subnets":["subnet-0361ecd5815a6beb8","subnet-06d75b2a78732a0c3","subnet-060f5d597abb2470c"],"assignPublicIp":"ENABLED"}}'

# a couple minutes later:
aws s3 ls s3://vibrationfit-db-backups/vibrationfit/   # needs admin creds
aws logs tail /ecs/vibrationfit-db-backup --since 15m
```

## One-time: Synology Cloud Sync (~5 minutes, all GUI)

1. Package Center → install **Cloud Sync**.
2. Cloud Sync → **+** → **Amazon S3**.
3. Enter the read-only credentials (IAM user `vibrationfit-nas-sync`; the key
   was shown once during setup — if lost, run
   `aws iam create-access-key --user-name vibrationfit-nas-sync`).
4. Bucket: `vibrationfit-db-backups`.
5. Local path: create/select `/volume1/backups/vibrationfit`.
   Remote path: `/vibrationfit`.
6. Sync direction: **Download remote changes only**.
7. IMPORTANT: in settings, do NOT enable "remove files in the destination
   when they are removed from the source" — then the NAS keeps every backup
   even after S3's 90-day lifecycle expires them (NAS becomes long-term archive).
   Enable it instead if you want the NAS to also keep only 90 days.

No Docker, scripts, or Task Scheduler needed on the NAS.

## Restore procedure

Test once now. On any machine with Docker:

```bash
docker run -d --name restore-test -e POSTGRES_PASSWORD=test -p 5433:5432 postgres:17
docker cp db_2026-08-18_0300.dump restore-test:/tmp/
docker exec restore-test pg_restore -U postgres -d postgres --no-owner /tmp/db_2026-08-18_0300.dump
docker exec -it restore-test psql -U postgres   # verify, then:
docker rm -f restore-test
```

Dumps are on the NAS at `/volume1/backups/vibrationfit/` or in S3 (admin creds).

## Maintenance

- **Postgres upgrades**: when Supabase bumps the project past 17.x, update the
  base image in `scripts/backup/docker/Dockerfile`, rebuild and push:

  ```bash
  aws ecr get-login-password | docker login --username AWS --password-stdin 428923191740.dkr.ecr.us-east-2.amazonaws.com
  docker build --platform linux/arm64 -t 428923191740.dkr.ecr.us-east-2.amazonaws.com/vibrationfit-db-backup:latest scripts/backup/docker
  docker push 428923191740.dkr.ecr.us-east-2.amazonaws.com/vibrationfit-db-backup:latest
  ```

  The task definition pins `:latest`, so no other change is needed.
- **Failure visibility**: the schedule retries twice; job output is in
  CloudWatch `/ecs/vibrationfit-db-backup`. The simplest health check is that
  new files keep appearing in the NAS folder (or S3).
- `pg_dump` covers the **database only** — Supabase Storage buckets (user
  uploads) would need a separate `rclone` sync job.
- Task definition source of truth: `scripts/backup/task-definition.json`.
- Deleting a locked backup early requires an admin using
  `--bypass-governance-retention`; normal credentials cannot delete at all.
