#!/bin/bash

# VibrationFit Automated S3 Backup Script
# Runs daily backups with email notifications

set -e

# Configuration
PRIMARY_BUCKET="vibration-fit-client-storage"
BACKUP_BUCKET="vibration-fit-client-storage-backup"
LOG_DIR="/Users/jordanbuckingham/Desktop/vibrationfit/s3-backup/logs"
LOG_FILE="$LOG_DIR/backup-$(date +%Y%m%d-%H%M%S).log"
EMAIL_RECIPIENT="jordan@vibrationfit.com"
SCRIPT_DIR="/Users/jordanbuckingham/Desktop/vibrationfit/s3-backup"

# Create log directory if it doesn't exist
mkdir -p "$LOG_DIR"

# Function to send email notification
send_notification() {
    local subject="$1"
    local body="$2"
    
    # If mail command is available, send email
    if command -v mail >/dev/null 2>&1; then
        echo "$body" | mail -s "$subject" "$EMAIL_RECIPIENT"
    else
        echo "Email notification: $subject"
        echo "$body"
    fi
}

# Function to log with timestamp
log_with_timestamp() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log_with_timestamp "🚀 Starting automated S3 backup process..."

# Check if backup script exists
if [ ! -f "$SCRIPT_DIR/backup-s3.sh" ]; then
    log_with_timestamp "❌ Backup script not found at $SCRIPT_DIR/backup-s3.sh"
    send_notification "VibrationFit Backup Failed" "Backup script not found"
    exit 1
fi

# Run the backup script
log_with_timestamp "🔄 Executing backup script..."
if "$SCRIPT_DIR/backup-s3.sh" >> "$LOG_FILE" 2>&1; then
    log_with_timestamp "✅ Backup completed successfully!"
    
    # Get backup statistics
    PRIMARY_COUNT=$(aws s3 ls "s3://$PRIMARY_BUCKET/" --recursive --summarize | grep "Total Objects:" | awk '{print $3}')
    BACKUP_COUNT=$(aws s3 ls "s3://$BACKUP_BUCKET/" --recursive --summarize | grep "Total Objects:" | awk '{print $3}')
    
    # Send success notification
    success_body="VibrationFit S3 backup completed successfully!
    
Primary bucket objects: $PRIMARY_COUNT
Backup bucket objects: $BACKUP_COUNT
Backup completed at: $(date)

Log file: $LOG_FILE"
    
    send_notification "VibrationFit Backup Success" "$success_body"
    
else
    log_with_timestamp "❌ Backup failed!"
    
    # Send failure notification
    failure_body="VibrationFit S3 backup failed!
    
Please check the log file: $LOG_FILE
Failed at: $(date)

Last 20 lines of log:
$(tail -20 "$LOG_FILE")"
    
    send_notification "VibrationFit Backup Failed" "$failure_body"
    exit 1
fi

# Clean up old log files (keep last 30 days)
find "$LOG_DIR" -name "backup-*.log" -mtime +30 -delete

log_with_timestamp "🏁 Automated backup process completed"
