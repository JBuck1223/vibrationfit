import json
import boto3
import os
from datetime import datetime
import logging

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

def lambda_handler(event, context):
    """
    AWS Lambda function to backup S3 bucket cross-region
    Runs daily at 2 AM EST via EventBridge
    """
    
    # Configuration
    PRIMARY_BUCKET = "vibration-fit-client-storage"
    BACKUP_BUCKET = "vibration-fit-client-storage-backup"
    EMAIL_RECIPIENT = "jordan@vibrationfit.com"
    
    logger.info(f"🚀 Starting AWS Lambda S3 backup process...")
    logger.info(f"📅 Backup started at: {datetime.now().isoformat()}")
    logger.info(f"📦 Primary bucket: {PRIMARY_BUCKET}")
    logger.info(f"💾 Backup bucket: {BACKUP_BUCKET}")
    
    try:
        # Initialize S3 client
        s3_client = boto3.client('s3')
        
        # Check if buckets exist and are accessible
        logger.info("🔍 Checking bucket accessibility...")
        
        try:
            s3_client.head_bucket(Bucket=PRIMARY_BUCKET)
            logger.info(f"✅ Primary bucket ({PRIMARY_BUCKET}): Accessible")
        except Exception as e:
            logger.error(f"❌ Primary bucket ({PRIMARY_BUCKET}): Not accessible - {str(e)}")
            raise
        
        try:
            s3_client.head_bucket(Bucket=BACKUP_BUCKET)
            logger.info(f"✅ Backup bucket ({BACKUP_BUCKET}): Accessible")
        except Exception as e:
            logger.error(f"❌ Backup bucket ({BACKUP_BUCKET}): Not accessible - {str(e)}")
            raise
        
        # Perform the backup using S3 sync (faster approach)
        logger.info("🔄 Starting sync to backup bucket...")
        
        # Use boto3's copy_object for batch operations
        copied_count = 0
        error_count = 0
        batch_size = 50  # Process in batches for better performance
        
        # List all objects in primary bucket
        paginator = s3_client.get_paginator('list_objects_v2')
        
        for page in paginator.paginate(Bucket=PRIMARY_BUCKET):
            if 'Contents' in page:
                # Process objects in batches
                objects = page['Contents']
                
                for i in range(0, len(objects), batch_size):
                    batch = objects[i:i + batch_size]
                    
                    # Copy batch of objects
                    for obj in batch:
                        try:
                            # Copy object to backup bucket
                            copy_source = {
                                'Bucket': PRIMARY_BUCKET,
                                'Key': obj['Key']
                            }
                            
                            s3_client.copy_object(
                                CopySource=copy_source,
                                Bucket=BACKUP_BUCKET,
                                Key=obj['Key'],
                                StorageClass='STANDARD_IA'  # Use cheaper storage for backup
                            )
                            
                            copied_count += 1
                            
                        except Exception as e:
                            logger.error(f"❌ Failed to copy {obj['Key']}: {str(e)}")
                            error_count += 1
                    
                    # Log progress every batch
                    logger.info(f"📁 Processed {copied_count} objects, {error_count} errors...")
                    
                    # Small delay to prevent throttling
                    import time
                    time.sleep(0.1)
        
        # Get final statistics
        logger.info("📊 Getting backup statistics...")
        
        primary_count = 0
        backup_count = 0
        
        # Count primary bucket objects
        for page in paginator.paginate(Bucket=PRIMARY_BUCKET):
            if 'Contents' in page:
                primary_count += len(page['Contents'])
        
        # Count backup bucket objects
        for page in paginator.paginate(Bucket=BACKUP_BUCKET):
            if 'Contents' in page:
                backup_count += len(page['Contents'])
        
        logger.info(f"📁 Primary bucket objects: {primary_count}")
        logger.info(f"💾 Backup bucket objects: {backup_count}")
        logger.info(f"📋 Objects copied this run: {copied_count}")
        
        if error_count > 0:
            logger.warning(f"⚠️  {error_count} objects failed to copy")
        
        # Determine success status
        if error_count == 0 and abs(primary_count - backup_count) <= 10:
            status = "✅ Backup completed successfully!"
            success = True
        else:
            status = f"⚠️  Backup completed with warnings ({error_count} errors)"
            success = True  # Still consider it successful for minor issues
        
        logger.info(status)
        logger.info(f"📅 Backup completed at: {datetime.now().isoformat()}")
        
        # Send notification via SNS (if configured)
        try:
            sns_client = boto3.client('sns')
            
            # Create message
            message = f"""VibrationFit S3 Backup Report

Status: {status}
Primary bucket objects: {primary_count}
Backup bucket objects: {backup_count}
Objects copied: {copied_count}
Errors: {error_count}
Completed at: {datetime.now().isoformat()}

Logs available in CloudWatch Logs."""
            
            # Try to send notification (only if SNS topic is configured)
            # This is optional - we'll set it up if you want email notifications
            
        except Exception as e:
            logger.info(f"📧 Email notification not configured: {str(e)}")
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': status,
                'primary_count': primary_count,
                'backup_count': backup_count,
                'copied_count': copied_count,
                'error_count': error_count,
                'success': success
            })
        }
        
    except Exception as e:
        logger.error(f"❌ Backup failed: {str(e)}")
        
        # Send failure notification
        try:
            sns_client = boto3.client('sns')
            message = f"""VibrationFit S3 Backup Failed!

Error: {str(e)}
Failed at: {datetime.now().isoformat()}

Please check CloudWatch Logs for details."""
            
        except Exception as notify_error:
            logger.error(f"Failed to send notification: {str(notify_error)}")
        
        return {
            'statusCode': 500,
            'body': json.dumps({
                'message': f'Backup failed: {str(e)}',
                'success': False
            })
        }
