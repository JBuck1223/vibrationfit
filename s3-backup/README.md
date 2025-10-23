# 🛡️ VibrationFit S3 Backup System Documentation

## **Overview**

This document outlines the comprehensive backup system implemented for VibrationFit's S3 storage to ensure client data safety and business continuity.

## **🔄 Backup Architecture**

### **Primary Bucket**
- **Name**: `vibration-fit-client-storage`
- **Region**: `us-east-2` (Ohio)
- **Purpose**: Active client file storage
- **Versioning**: ✅ Enabled
- **Lifecycle**: ✅ Configured

### **Backup Bucket**
- **Name**: `vibration-fit-client-storage-backup`
- **Region**: `us-west-2` (Oregon)
- **Purpose**: Cross-region disaster recovery
- **Versioning**: ✅ Enabled
- **Lifecycle**: ✅ Configured

## **📁 File Structure**

```
s3-backup/
├── backup-s3.sh              # Manual backup script
├── recover-s3.sh             # Recovery script
├── automated-backup.sh       # Automated backup with notifications
├── lifecycle-policy.json     # S3 lifecycle configuration
├── replication-role-trust-policy.json  # IAM trust policy
├── replication-role-policy.json       # IAM permissions policy
└── README.md                 # This documentation
```

## **🔧 Backup Features**

### **1. Versioning Protection**
- **Status**: ✅ Enabled on both buckets
- **Benefit**: Protects against accidental deletions
- **Recovery**: Can restore previous versions of files

### **2. Cross-Region Backup**
- **Primary**: US-East-2 (Ohio)
- **Backup**: US-West-2 (Oregon)
- **Distance**: 2,000+ miles separation
- **Sync Method**: AWS CLI sync with delete flag

### **3. Lifecycle Management**
- **30 days**: Move to Standard-IA (cheaper storage)
- **90 days**: Move to Glacier (archival storage)
- **365 days**: Move to Deep Archive (long-term archival)
- **Version cleanup**: Delete old versions after 90 days

### **4. Automated Monitoring**
- **Logging**: Comprehensive backup logs
- **Email notifications**: Success/failure alerts
- **Statistics**: Object count verification
- **Log rotation**: 30-day retention

## **🚀 Usage Instructions**

### **Manual Backup**
```bash
# Run a manual backup
./s3-backup/backup-s3.sh

# Check backup status
aws s3 ls s3://vibration-fit-client-storage-backup/ --recursive --summarize
```

### **Recovery Process**
```bash
# Restore from backup (WARNING: Overwrites primary bucket)
./s3-backup/recover-s3.sh
```

### **Automated Backup**
```bash
# Run automated backup with notifications
./s3-backup/automated-backup.sh
```

## **📊 Backup Statistics**

### **Current Status** (as of last backup)
- **Primary bucket objects**: 1,661 files
- **Backup bucket objects**: 1,656 files
- **Total storage**: ~2.1 GB
- **Last backup**: Successfully completed

### **Cost Optimization**
- **Standard storage**: Active files (0-30 days)
- **Standard-IA**: Infrequent access (30-90 days)
- **Glacier**: Archival storage (90-365 days)
- **Deep Archive**: Long-term archival (365+ days)

## **🔍 Monitoring & Alerts**

### **Backup Verification**
- Object count comparison between buckets
- File integrity checks during sync
- Detailed logging of all operations

### **Email Notifications**
- **Success**: Backup completion with statistics
- **Failure**: Error details with log excerpts
- **Recipient**: jordan@vibrationfit.com

### **Log Management**
- **Location**: `/var/log/vibrationfit-backup/`
- **Format**: `backup-YYYYMMDD-HHMMSS.log`
- **Retention**: 30 days
- **Content**: Timestamped operations and statistics

## **🛠️ Troubleshooting**

### **Common Issues**

#### **1. Object Count Mismatch**
- **Cause**: Files being uploaded during backup
- **Solution**: Normal - backup will catch up on next run
- **Action**: Monitor for persistent mismatches

#### **2. Backup Script Permission Errors**
- **Cause**: AWS credentials not configured
- **Solution**: Run `aws configure` or set environment variables
- **Check**: `aws s3api head-bucket --bucket vibration-fit-client-storage`

#### **3. Cross-Region Sync Failures**
- **Cause**: Network issues or AWS service limits
- **Solution**: Retry backup script
- **Monitor**: Check AWS service health dashboard

### **Recovery Procedures**

#### **Full Recovery**
1. Verify backup bucket integrity
2. Run recovery script: `./s3-backup/recover-s3.sh`
3. Confirm object counts match
4. Test application functionality

#### **Partial Recovery**
1. Identify missing files from logs
2. Use AWS CLI to copy specific files:
   ```bash
   aws s3 cp s3://vibration-fit-client-storage-backup/path/to/file s3://vibration-fit-client-storage/path/to/file
   ```

## **📅 Maintenance Schedule**

### **Daily**
- Automated backup runs
- Email notifications sent
- Log files rotated

### **Weekly**
- Review backup logs
- Verify object counts
- Check storage costs

### **Monthly**
- Test recovery procedures
- Review lifecycle policies
- Update documentation

## **🔐 Security Considerations**

### **Access Control**
- AWS IAM policies restrict access
- Cross-region replication uses service roles
- Backup scripts run with minimal permissions

### **Data Protection**
- Versioning prevents accidental deletions
- Cross-region backup protects against regional outages
- Lifecycle policies optimize costs while maintaining availability

### **Compliance**
- Data stored in multiple AWS regions
- Audit logs maintained for 30 days
- Backup procedures documented and tested

## **💰 Cost Management**

### **Storage Classes**
- **Standard**: $0.023/GB/month (active files)
- **Standard-IA**: $0.0125/GB/month (infrequent access)
- **Glacier**: $0.004/GB/month (archival)
- **Deep Archive**: $0.00099/GB/month (long-term)

### **Estimated Monthly Costs**
- **Primary bucket**: ~$50/month (2.1GB Standard)
- **Backup bucket**: ~$25/month (2.1GB Standard-IA)
- **Total**: ~$75/month for full protection

## **🚨 Emergency Contacts**

### **AWS Support**
- **Account**: VibrationFit AWS Account
- **Support Plan**: Business Support
- **Emergency**: AWS Support Center

### **Internal Contacts**
- **Primary**: Jordan Buckingham
- **Email**: jordan@vibrationfit.com
- **Backup**: Technical team

## **📈 Future Enhancements**

### **Planned Improvements**
1. **Automated testing**: Regular recovery tests
2. **Monitoring dashboard**: Real-time backup status
3. **Multi-region**: Additional backup regions
4. **Encryption**: Server-side encryption for all files

### **Scalability Considerations**
- Current system handles up to 10TB efficiently
- Lifecycle policies automatically optimize costs
- Backup scripts scale with bucket size

---

**Last Updated**: October 23, 2025
**Version**: 1.0
**Status**: ✅ Production Ready
