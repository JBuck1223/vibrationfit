#!/bin/bash

# VibrationFit S3 Recovery Script
# Restore files from backup bucket to primary bucket

set -e

# Configuration
PRIMARY_BUCKET="vibration-fit-client-storage"
BACKUP_BUCKET="vibration-fit-client-storage-backup"
LOG_FILE="/tmp/s3-recovery-$(date +%Y%m%d-%H%M%S).log"

echo "🔄 Starting S3 recovery process..." | tee -a "$LOG_FILE"
echo "📅 Recovery started at: $(date)" | tee -a "$LOG_FILE"
echo "📦 Primary bucket: $PRIMARY_BUCKET" | tee -a "$LOG_FILE"
echo "💾 Backup bucket: $BACKUP_BUCKET" | tee -a "$LOG_FILE"
echo "📝 Log file: $LOG_FILE" | tee -a "$LOG_FILE"

# Check if buckets exist
echo "🔍 Checking bucket status..." | tee -a "$LOG_FILE"
if ! aws s3api head-bucket --bucket "$BACKUP_BUCKET" 2>/dev/null; then
    echo "❌ Backup bucket $BACKUP_BUCKET not accessible" | tee -a "$LOG_FILE"
    exit 1
fi

if ! aws s3api head-bucket --bucket "$PRIMARY_BUCKET" 2>/dev/null; then
    echo "❌ Primary bucket $PRIMARY_BUCKET not accessible" | tee -a "$LOG_FILE"
    exit 1
fi

echo "✅ Both buckets accessible" | tee -a "$LOG_FILE"

# Show backup contents
echo "📋 Available backups:" | tee -a "$LOG_FILE"
aws s3 ls "s3://$BACKUP_BUCKET/" --recursive --summarize | tee -a "$LOG_FILE"

# Confirm recovery
echo ""
echo "⚠️  WARNING: This will overwrite files in the primary bucket!"
echo "📦 Primary bucket: $PRIMARY_BUCKET"
echo "💾 Backup bucket: $BACKUP_BUCKET"
echo ""
read -p "Are you sure you want to proceed? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ Recovery cancelled by user" | tee -a "$LOG_FILE"
    exit 0
fi

# Sync files from backup to primary
echo "🔄 Starting recovery from backup bucket..." | tee -a "$LOG_FILE"
aws s3 sync "s3://$BACKUP_BUCKET/" "s3://$PRIMARY_BUCKET/" \
    --delete \
    --storage-class STANDARD \
    --metadata-directive COPY \
    2>&1 | tee -a "$LOG_FILE"

# Get recovery statistics
echo "📊 Recovery statistics:" | tee -a "$LOG_FILE"
PRIMARY_COUNT=$(aws s3 ls "s3://$PRIMARY_BUCKET/" --recursive --summarize | grep "Total Objects:" | awk '{print $3}')
BACKUP_COUNT=$(aws s3 ls "s3://$BACKUP_BUCKET/" --recursive --summarize | grep "Total Objects:" | awk '{print $3}')

echo "📁 Primary bucket objects: $PRIMARY_COUNT" | tee -a "$LOG_FILE"
echo "💾 Backup bucket objects: $BACKUP_COUNT" | tee -a "$LOG_FILE"

if [ "$PRIMARY_COUNT" -eq "$BACKUP_COUNT" ]; then
    echo "✅ Recovery completed successfully!" | tee -a "$LOG_FILE"
    echo "📅 Recovery completed at: $(date)" | tee -a "$LOG_FILE"
else
    echo "⚠️  Warning: Object count mismatch" | tee -a "$LOG_FILE"
    echo "📅 Recovery completed with warnings at: $(date)" | tee -a "$LOG_FILE"
fi
