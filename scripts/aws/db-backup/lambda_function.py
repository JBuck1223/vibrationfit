import subprocess
import boto3
import os
import gzip
import shutil
from datetime import datetime, timezone

s3 = boto3.client("s3")
secrets = boto3.client("secretsmanager")


def get_db_url():
    secret_id = os.environ.get("DB_SECRET_ID", "vibrationfit/supabase-db-url")
    response = secrets.get_secret_value(SecretId=secret_id)
    return response["SecretString"]


def handler(event, context):
    bucket = os.environ["S3_BUCKET"]
    prefix = os.environ.get("S3_PREFIX", "db-backups")
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")

    dump_path = f"/tmp/vibrationfit_{timestamp}.dump"
    gz_path = f"{dump_path}.gz"

    db_url = get_db_url()

    print(f"Starting database backup at {timestamp}")
    print(f"Target: s3://{bucket}/{prefix}/")

    result = subprocess.run(
        ["pg_dump", db_url, "-F", "c", "-f", dump_path, "--no-owner", "--no-acl"],
        capture_output=True,
        text=True,
        timeout=240,
    )

    if result.returncode != 0:
        print(f"pg_dump stderr: {result.stderr}")
        raise Exception(f"pg_dump failed with exit code {result.returncode}")

    dump_size = os.path.getsize(dump_path)
    print(f"Dump complete: {dump_size / (1024 * 1024):.1f} MB")

    with open(dump_path, "rb") as f_in:
        with gzip.open(gz_path, "wb") as f_out:
            shutil.copyfileobj(f_in, f_out)

    gz_size = os.path.getsize(gz_path)
    print(f"Compressed: {gz_size / (1024 * 1024):.1f} MB")

    s3_key = f"{prefix}/vibrationfit_{timestamp}.dump.gz"
    s3.upload_file(gz_path, bucket, s3_key)
    print(f"Uploaded to s3://{bucket}/{s3_key}")

    os.remove(dump_path)
    os.remove(gz_path)

    return {
        "status": "success",
        "timestamp": timestamp,
        "s3_key": s3_key,
        "dump_size_mb": round(dump_size / (1024 * 1024), 1),
        "compressed_size_mb": round(gz_size / (1024 * 1024), 1),
    }
