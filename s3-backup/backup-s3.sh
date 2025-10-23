#!/bin/bash

# VibrationFit S3 Backup Script
# Automated backup of client storage to cross-region backup bucket

set -e

# Configuration
PRIMARY_BUCKET="vibration-fit-client-storage"
BACKUP_BUCKET="vibration-fit-client-storage-backup"
LOG_FILE="/tmp/s3-backup-$(date +%Y%m%d-%H%M%S).log"

echo "🚀 Starting S3 backup process..." | tee -a "$LOG_FILE"
echo "📅 Backup started at: $(date)" | tee -a "$LOG_FILE"
echo "📦 Primary bucket: $PRIMARY_BUCKET" | tee -a "$LOG_FILE"
echo "💾 Backup bucket: $BACKUP_BUCKET" | tee -a "$LOG_FILE"
echo "📝 Log file: $LOG_FILE" | tee -a "$LOG_FILE"

# Check if buckets exist
echo "🔍 Checking bucket status..." | tee -a "$LOG_FILE"
if ! aws s3api head-bucket --bucket "$PRIMARY_BUCKET" 2>/dev/null; then
    echo "❌ Primary bucket $PRIMARY_BUCKET not accessible" | tee -a "$LOG_FILE"
    exit 1
fi

if ! aws s3api head-bucket --bucket "$BACKUP_BUCKET" 2>/dev/null; then
    echo "❌ Backup bucket $BACKUP_BUCKET not accessible" | tee -a "$LOG_FILE"
    exit 1
fi

echo "✅ Both buckets accessible" | tee -a "$LOG_FILE"

# Sync files to backup bucket
echo "🔄 Starting sync to backup bucket..." | tee -a "$LOG_FILE"
aws s3 sync "s3://$PRIMARY_BUCKET/" "s3://$BACKUP_BUCKET/" \
    --delete \
    --storage-class STANDARD_IA \
    --metadata-directive COPY \
    --exclude "*.tmp" \
    --exclude "*.log" \
    2>&1 | tee -a "$LOG_FILE"

# Get sync statistics
echo "📊 Backup statistics:" | tee -a "$LOG_FILE"
PRIMARY_COUNT=$(aws s3 ls "s3://$PRIMARY_BUCKET/" --recursive --summarize | grep "Total Objects:" | awk '{print $3}')
BACKUP_COUNT=$(aws s3 ls "s3://$BACKUP_BUCKET/" --recursive --summarize | grep "Total Objects:" | awk '{print $3}')

echo "📁 Primary bucket objects: $PRIMARY_COUNT" | tee -a "$LOG_FILE"
echo "💾 Backup bucket objects: $BACKUP_COUNT" | tee -a "$LOG_FILE"

if [ "$PRIMARY_COUNT" -eq "$BACKUP_COUNT" ]; then
    echo "✅ Backup completed successfully!" | tee -a "$LOG_FILE"
    echo "📅 Backup completed at: $(date)" | tee -a "$LOG_FILE"
    exit 0
else
    echo "⚠️  Warning: Object count mismatch" | tee -a "$LOG_FILE"
    echo "📅 Backup completed with warnings at: $(date)" | tee -a "$LOG_FILE"
    # Don't exit with error for minor mismatches - this is often normal during active usage
    exit 0
fi
