#!/bin/bash

# VibrationFit S3 Backup Status Check
# Quick overview of backup system health

echo "🛡️ VibrationFit S3 Backup System Status"
echo "========================================"
echo ""

# Configuration
PRIMARY_BUCKET="vibration-fit-client-storage"
BACKUP_BUCKET="vibration-fit-client-storage-backup"

# Check bucket accessibility
echo "🔍 Checking bucket accessibility..."
if aws s3api head-bucket --bucket "$PRIMARY_BUCKET" >/dev/null 2>&1; then
    echo "✅ Primary bucket ($PRIMARY_BUCKET): Accessible"
else
    echo "❌ Primary bucket ($PRIMARY_BUCKET): Not accessible"
fi

if aws s3api head-bucket --bucket "$BACKUP_BUCKET" >/dev/null 2>&1; then
    echo "✅ Backup bucket ($BACKUP_BUCKET): Accessible"
else
    echo "❌ Backup bucket ($BACKUP_BUCKET): Not accessible"
fi

echo ""

# Check versioning status
echo "📋 Checking versioning status..."
PRIMARY_VERSIONING=$(aws s3api get-bucket-versioning --bucket "$PRIMARY_BUCKET" --query 'Status' --output text 2>/dev/null)
BACKUP_VERSIONING=$(aws s3api get-bucket-versioning --bucket "$BACKUP_BUCKET" --query 'Status' --output text 2>/dev/null)

if [ "$PRIMARY_VERSIONING" = "Enabled" ]; then
    echo "✅ Primary bucket versioning: Enabled"
else
    echo "❌ Primary bucket versioning: Disabled"
fi

if [ "$BACKUP_VERSIONING" = "Enabled" ]; then
    echo "✅ Backup bucket versioning: Enabled"
else
    echo "❌ Backup bucket versioning: Disabled"
fi

echo ""

# Get object counts
echo "📊 Object counts:"
PRIMARY_COUNT=$(aws s3 ls "s3://$PRIMARY_BUCKET/" --recursive --summarize | grep "Total Objects:" | awk '{print $3}')
BACKUP_COUNT=$(aws s3 ls "s3://$BACKUP_BUCKET/" --recursive --summarize | grep "Total Objects:" | awk '{print $3}')

echo "📁 Primary bucket objects: $PRIMARY_COUNT"
echo "💾 Backup bucket objects: $BACKUP_COUNT"

if [ "$PRIMARY_COUNT" -eq "$BACKUP_COUNT" ]; then
    echo "✅ Object counts match perfectly!"
elif [ $((PRIMARY_COUNT - BACKUP_COUNT)) -le 10 ]; then
    echo "⚠️  Minor object count difference (normal during active usage)"
else
    echo "⚠️  Significant object count difference - backup may be needed"
fi

echo ""

# Check recent backup logs
echo "📝 Recent backup activity:"
LOG_DIR="/Users/jordanbuckingham/Desktop/vibrationfit/s3-backup/logs"
if [ -d "$LOG_DIR" ]; then
    LATEST_LOG=$(ls -t "$LOG_DIR"/backup-*.log 2>/dev/null | head -1)
    if [ -n "$LATEST_LOG" ]; then
        echo "📄 Latest backup log: $(basename "$LATEST_LOG")"
        echo "📅 Last backup: $(grep "Backup completed" "$LATEST_LOG" | tail -1 | cut -d' ' -f3-4)"
        
        # Check if last backup was successful
        if grep -q "✅ Backup completed successfully" "$LATEST_LOG"; then
            echo "✅ Last backup: Successful"
        else
            echo "❌ Last backup: Failed or had warnings"
        fi
    else
        echo "📄 No backup logs found"
    fi
else
    echo "📄 Log directory not found"
fi

echo ""

# Check cron job status
echo "⏰ Cron job status:"
if crontab -l 2>/dev/null | grep -q "automated-backup.sh"; then
    echo "✅ Automated backup cron job: Active"
    CRON_SCHEDULE=$(crontab -l 2>/dev/null | grep "automated-backup.sh" | awk '{print $1, $2, $3, $4, $5}')
    echo "📅 Schedule: $CRON_SCHEDULE"
else
    echo "❌ Automated backup cron job: Not found"
    echo "💡 Run ./setup-cron.sh to set up automated backups"
fi

echo ""

# Storage costs estimate
echo "💰 Estimated monthly storage costs:"
PRIMARY_SIZE=$(aws s3 ls "s3://$PRIMARY_BUCKET/" --recursive --summarize | grep "Total Size:" | awk '{print $3}')
BACKUP_SIZE=$(aws s3 ls "s3://$BACKUP_BUCKET/" --recursive --summarize | grep "Total Size:" | awk '{print $3}')

if [ -n "$PRIMARY_SIZE" ] && [ -n "$BACKUP_SIZE" ]; then
    PRIMARY_GB=$((PRIMARY_SIZE / 1024 / 1024 / 1024))
    BACKUP_GB=$((BACKUP_SIZE / 1024 / 1024 / 1024))
    
    # Rough cost estimates (Standard storage)
    PRIMARY_COST=$(echo "scale=2; $PRIMARY_GB * 0.023" | bc 2>/dev/null || echo "0.05")
    BACKUP_COST=$(echo "scale=2; $BACKUP_GB * 0.0125" | bc 2>/dev/null || echo "0.03")  # Standard-IA after 30 days
    TOTAL_COST=$(echo "scale=2; $PRIMARY_COST + $BACKUP_COST" | bc 2>/dev/null || echo "0.08")
    
    echo "📦 Primary bucket: ${PRIMARY_GB}GB (~\$${PRIMARY_COST}/month)"
    echo "💾 Backup bucket: ${BACKUP_GB}GB (~\$${BACKUP_COST}/month)"
    echo "💵 Total estimated: ~\$${TOTAL_COST}/month"
fi

echo ""
echo "🛡️ Backup system health: $(if [ "$PRIMARY_COUNT" -eq "$BACKUP_COUNT" ] && [ "$PRIMARY_VERSIONING" = "Enabled" ] && [ "$BACKUP_VERSIONING" = "Enabled" ]; then echo "✅ EXCELLENT"; else echo "⚠️  NEEDS ATTENTION"; fi)"
echo ""
echo "🔧 Quick actions:"
echo "   Manual backup: ./backup-s3.sh"
echo "   Setup cron: ./setup-cron.sh"
echo "   View logs: ls -la logs/"
echo "   Test recovery: ./recover-s3.sh"
