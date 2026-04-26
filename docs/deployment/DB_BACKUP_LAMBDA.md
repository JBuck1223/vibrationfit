# VibrationFit Database Backup Lambda

**Last Updated:** April 24, 2026  
**Status:** Active

## Overview

Automated daily backup of the Supabase PostgreSQL database to S3. A Docker-based Lambda function runs `pg_dump`, compresses the output, and uploads it to the backup bucket.

## Architecture

```
EventBridge (daily 4 AM UTC) → Lambda (pg_dump) → S3 (vibration-fit-client-storage-backup/db-backups/)
```

- **Lambda:** `vibrationfit-db-backup` — Docker image with PostgreSQL client
- **Schedule:** Daily at 4:00 AM UTC (12:00 AM ET)
- **S3 Destination:** `s3://vibration-fit-client-storage-backup/db-backups/`
- **Secret:** Supabase DB URL stored in AWS Secrets Manager (`vibrationfit/supabase-db-url`)

## Files

| File | Purpose |
|------|---------|
| `scripts/aws/db-backup/lambda_function.py` | Lambda handler — runs pg_dump, gzips, uploads to S3 |
| `scripts/aws/db-backup/Dockerfile` | Docker image with Python 3.12 + PostgreSQL client |
| `scripts/aws/setup-db-backup.sh` | One-command deployment script |

## Deploy (First Time)

1. Make sure Docker is running
2. Get your Supabase connection string from **Supabase Dashboard > Settings > Database > Connection string (URI)**
3. Run:

```bash
SUPABASE_DB_URL="postgresql://postgres.[ref]:[password]@aws-0-us-east-1.pooler.supabase.com:5432/postgres" \
  ./scripts/aws/setup-db-backup.sh
```

This creates everything: ECR repo, Docker image, IAM role, Secrets Manager secret, Lambda function, and EventBridge daily schedule.

## Update Lambda Code

After editing `lambda_function.py` or `Dockerfile`:

```bash
./scripts/aws/setup-db-backup.sh --update
```

This rebuilds the Docker image and updates the Lambda without touching IAM or EventBridge.

## Test Manually

```bash
aws lambda invoke --function-name vibrationfit-db-backup --region us-east-2 /dev/stdout
```

## View Logs

```bash
aws logs tail /aws/lambda/vibrationfit-db-backup --region us-east-2 --follow
```

## Restore from Backup

1. Download the backup:

```bash
aws s3 cp s3://vibration-fit-client-storage-backup/db-backups/vibrationfit_YYYYMMDD_HHMMSS.dump.gz .
gunzip vibrationfit_YYYYMMDD_HHMMSS.dump.gz
```

2. Restore to a database:

```bash
pg_restore -d "YOUR_DATABASE_URL" vibrationfit_YYYYMMDD_HHMMSS.dump
```

## Rotate Supabase Password

If you change your Supabase database password, update the secret:

```bash
aws secretsmanager put-secret-value \
  --secret-id vibrationfit/supabase-db-url \
  --secret-string "postgresql://postgres.[ref]:[NEW_PASSWORD]@..." \
  --region us-east-2
```
