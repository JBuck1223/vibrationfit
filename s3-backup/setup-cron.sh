#!/bin/bash

# VibrationFit S3 Backup Cron Setup Script
# This script helps you set up automated daily backups

echo "🛡️ VibrationFit S3 Backup Cron Setup"
echo "======================================"
echo ""

# Check if cron is available
if ! command -v crontab >/dev/null 2>&1; then
    echo "❌ Error: crontab command not found. Please install cron first."
    exit 1
fi

echo "📋 Current crontab entries:"
crontab -l 2>/dev/null || echo "No crontab entries found"
echo ""

# Get the script directory
SCRIPT_DIR="/Users/jordanbuckingham/Desktop/vibrationfit/s3-backup"
BACKUP_SCRIPT="$SCRIPT_DIR/automated-backup.sh"

# Check if backup script exists
if [ ! -f "$BACKUP_SCRIPT" ]; then
    echo "❌ Error: Backup script not found at $BACKUP_SCRIPT"
    exit 1
fi

echo "✅ Backup script found at: $BACKUP_SCRIPT"
echo ""

# Create the cron entry
CRON_ENTRY="0 2 * * * $BACKUP_SCRIPT"

echo "📅 Recommended cron entry (daily at 2 AM):"
echo "   $CRON_ENTRY"
echo ""

echo "🔄 Alternative schedules:"
echo "   Every 6 hours:  0 */6 * * * $BACKUP_SCRIPT"
echo "   Every 12 hours: 0 */12 * * * $BACKUP_SCRIPT"
echo "   Every day 6 AM: 0 6 * * * $BACKUP_SCRIPT"
echo ""

# Ask user if they want to add the cron job
read -p "Do you want to add the daily backup cron job? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Add the cron job
    (crontab -l 2>/dev/null; echo "$CRON_ENTRY") | crontab -
    
    if [ $? -eq 0 ]; then
        echo "✅ Cron job added successfully!"
        echo ""
        echo "📋 Updated crontab:"
        crontab -l
        echo ""
        echo "🎉 Automated backups will run daily at 2 AM"
        echo "📧 Email notifications will be sent to: jordan@vibrationfit.com"
    else
        echo "❌ Failed to add cron job"
        exit 1
    fi
else
    echo "ℹ️  Cron job not added. You can add it manually later with:"
    echo "   crontab -e"
    echo "   Then add: $CRON_ENTRY"
fi

echo ""
echo "🧪 To test the backup system manually:"
echo "   $BACKUP_SCRIPT"
echo ""
echo "📊 To check backup status:"
echo "   aws s3 ls s3://vibration-fit-client-storage-backup/ --recursive --summarize"
echo ""
echo "📝 Logs are stored in: $SCRIPT_DIR/logs/"
echo ""
echo "🛡️ Your VibrationFit S3 backup system is ready!"
