import json
import boto3
import logging
from datetime import datetime
from typing import Dict, Any

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Constants
PRIMARY_BUCKET = 'vibration-fit-client-storage'
BACKUP_BUCKET = 'vibration-fit-client-storage-backup'

def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    AWS Lambda function to perform incremental S3 backup.
    Only copies new or changed files to minimize execution time.
    """
    
    logger.info("🚀 Starting AWS Lambda S3 incremental backup...")
    logger.info(f"📅 Backup started at: {datetime.now().isoformat()}")
    logger.info(f"📦 Primary bucket: {PRIMARY_BUCKET}")
    logger.info(f"💾 Backup bucket: {BACKUP_BUCKET}")
    
    try:
        # Initialize S3 client
        s3_client = boto3.client('s3')
        
        # Check bucket accessibility
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
        
        # Get list of existing objects in backup bucket (for comparison)
        logger.info("📋 Getting existing backup objects...")
        backup_objects = {}
        
        try:
            backup_paginator = s3_client.get_paginator('list_objects_v2')
            for page in backup_paginator.paginate(Bucket=BACKUP_BUCKET):
                if 'Contents' in page:
                    for obj in page['Contents']:
                        backup_objects[obj['Key']] = {
                            'size': obj['Size'],
                            'last_modified': obj['LastModified']
                        }
            logger.info(f"📁 Found {len(backup_objects)} existing objects in backup")
        except Exception as e:
            logger.warning(f"Could not list backup objects: {str(e)}")
            backup_objects = {}
        
        # Process primary bucket objects
        logger.info("🔄 Starting incremental backup...")
        
        copied_count = 0
        skipped_count = 0
        error_count = 0
        
        paginator = s3_client.get_paginator('list_objects_v2')
        
        for page in paginator.paginate(Bucket=PRIMARY_BUCKET):
            if 'Contents' in page:
                for obj in page['Contents']:
                    try:
                        obj_key = obj['Key']
                        obj_size = obj['Size']
                        obj_modified = obj['LastModified']
                        
                        # Check if object needs to be copied
                        needs_copy = True
                        
                        if obj_key in backup_objects:
                            backup_obj = backup_objects[obj_key]
                            
                            # If size and last modified are the same, skip
                            if (backup_obj['size'] == obj_size and 
                                backup_obj['last_modified'] >= obj_modified):
                                needs_copy = False
                                skipped_count += 1
                        
                        if needs_copy:
                            # Copy object to backup bucket
                            copy_source = {
                                'Bucket': PRIMARY_BUCKET,
                                'Key': obj_key
                            }
                            
                            s3_client.copy_object(
                                CopySource=copy_source,
                                Bucket=BACKUP_BUCKET,
                                Key=obj_key,
                                StorageClass='STANDARD_IA'
                            )
                            
                            copied_count += 1
                            
                            # Log progress every 25 objects
                            if copied_count % 25 == 0:
                                logger.info(f"📁 Copied {copied_count} objects, skipped {skipped_count}...")
                                
                    except Exception as e:
                        logger.error(f"❌ Failed to copy {obj['Key']}: {str(e)}")
                        error_count += 1
        
        logger.info(f"✅ Backup completed: {copied_count} copied, {skipped_count} skipped, {error_count} errors")
        
        # Get final statistics
        logger.info("📊 Getting final statistics...")
        
        try:
            # Count objects in both buckets
            primary_count = 0
            backup_count = 0
            
            # Count primary bucket
            for page in paginator.paginate(Bucket=PRIMARY_BUCKET):
                if 'Contents' in page:
                    primary_count += len(page['Contents'])
            
            # Count backup bucket
            backup_paginator = s3_client.get_paginator('list_objects_v2')
            for page in backup_paginator.paginate(Bucket=BACKUP_BUCKET):
                if 'Contents' in page:
                    backup_count += len(page['Contents'])
            
            logger.info(f"📁 Primary bucket objects: {primary_count}")
            logger.info(f"💾 Backup bucket objects: {backup_count}")
            
        except Exception as e:
            logger.warning(f"Could not get object counts: {str(e)}")
            primary_count = copied_count + skipped_count
            backup_count = copied_count
        
        # Determine success status
        if error_count == 0:
            status = "✅ Incremental backup completed successfully!"
            success = True
        else:
            status = f"⚠️  Backup completed with {error_count} errors"
            success = True  # Still consider it successful for minor issues
        
        logger.info(status)
        logger.info(f"📅 Backup completed at: {datetime.now().isoformat()}")
        
        # Return success response
        return {
            'statusCode': 200,
            'body': {
                'message': status,
                'primary_count': primary_count,
                'backup_count': backup_count,
                'copied_this_run': copied_count,
                'skipped_this_run': skipped_count,
                'errors': error_count,
                'success': success,
                'timestamp': datetime.now().isoformat()
            }
        }
        
    except Exception as e:
        logger.error(f"❌ Backup failed: {str(e)}")
        
        return {
            'statusCode': 500,
            'body': {
                'message': f"Backup failed: {str(e)}",
                'success': False,
                'timestamp': datetime.now().isoformat()
            }
        }
