# Disaster Recovery & Business Continuity Plan

## Overview

This guide covers disaster recovery (DR) procedures, backup strategies, and recovery time objectives (RTO/RPO) for Mxmobilz platform.

## Table of Contents

1. [Backup Strategy](#backup-strategy)
2. [Recovery Objectives](#recovery-objectives)
3. [Backup Procedures](#backup-procedures)
4. [Recovery Procedures](#recovery-procedures)
5. [Failure Scenarios](#failure-scenarios)
6. [Testing & Drills](#testing--drills)
7. [Monitoring & Alerts](#monitoring--alerts)

---

## Backup Strategy

### Database Backups

#### Automated RDS Snapshots

```bash
# Configuration via Terraform (infra/env/prod/main.tf)
backup_retention_period = 30  # 30-day retention in production

# Enabled through:
- Automated backups (daily at 03:00 UTC)
- Point-in-time recovery (last 30 days)
- Encrypted snapshots (KMS encryption)
- Cross-region backup replication (optional)
```

#### Manual Snapshots

```bash
# Create manual snapshot
aws rds create-db-snapshot \
  --db-instance-identifier mxmobilz-prod-mysql \
  --db-snapshot-identifier mxmobilz-prod-backup-$(date +%Y%m%d)

# List snapshots
aws rds describe-db-snapshots \
  --query 'DBSnapshots[*].[DBSnapshotIdentifier,SnapshotCreateTime,SnapshotType]'

# Copy snapshot to another region (disaster recovery)
aws rds copy-db-snapshot \
  --source-db-snapshot-identifier arn:aws:rds:us-east-1:123456789:snapshot:mxmobilz-prod-backup-20260902 \
  --target-db-snapshot-identifier mxmobilz-prod-backup-20260902-us-west-2 \
  --region us-west-2
```

### Application State Backups

#### Terraform State

```bash
# S3 backend automatically versions state
# Access state versions:
aws s3api list-object-versions \
  --bucket mxmobilz-terraform-state \
  --prefix prod/terraform.tfstate

# Restore previous version:
aws s3api get-object \
  --bucket mxmobilz-terraform-state \
  --key prod/terraform.tfstate \
  --version-id VersionIdHere \
  terraform.tfstate.backup
```

#### Kubernetes Resources

```bash
# Backup all resources to Git (GitOps)
cd gitops
git log --oneline  # View history
git checkout <commit-sha>  # Rollback to previous state

# Export specific resources
kubectl get deployments -n cloud-native-ecomerce-app -o yaml > backup-deployments.yaml
kubectl get configmaps -n cloud-native-ecomerce-app -o yaml > backup-configmaps.yaml
kubectl get secrets -n cloud-native-ecomerce-app -o yaml > backup-secrets.yaml  # ⚠️ ENCRYPTED!
```

### Application Code Backups

```bash
# Git is your backup
git log --oneline
git branch -a

# Tag releases
git tag -a v1.0.0 -m "Release 1.0.0"
git push origin v1.0.0

# Archive code
tar czf mxmobilz-code-backup.tar.gz .
aws s3 cp mxmobilz-code-backup.tar.gz s3://mxmobilz-backups/
```

---

## Recovery Objectives

### RTO/RPO by Component

| Component | RTO | RPO | Backup Frequency | Retention |
|-----------|-----|-----|------------------|-----------|
| **Database (Prod)** | 1 hour | 1 hour | Daily snapshots | 30 days |
| **Database (Staging)** | 4 hours | 4 hours | Daily snapshots | 14 days |
| **Kubernetes Cluster** | 30 mins | 0 (Git) | N/A | ∞ |
| **Application Code** | 5 mins | 0 (Git) | Per commit | ∞ |
| **Terraform State** | 10 mins | 0 (S3 versioning) | N/A | ∞ |

### Scaling Impact

```
Small Incident (single pod down)
└── RTO: < 1 minute (automatic restart)

Medium Incident (node down)
└── RTO: 2-5 minutes (pod reschedules to other node)

Large Incident (cluster down)
└── RTO: 15-30 minutes (cluster recovery + pod scheduling)

Catastrophic (database down)
└── RTO: 30-60 minutes (snapshot restore)
```

---

## Backup Procedures

### Daily Database Backup

```bash
#!/bin/bash
# backup-database.sh

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
SNAPSHOT_ID="mxmobilz-prod-backup-$TIMESTAMP"

echo "Creating RDS snapshot: $SNAPSHOT_ID"
aws rds create-db-snapshot \
  --db-instance-identifier mxmobilz-prod-mysql \
  --db-snapshot-identifier $SNAPSHOT_ID \
  --tags Key=BackupType,Value=Automated Key=CreatedBy,Value=backup-script

# Wait for snapshot completion
echo "Waiting for snapshot completion..."
aws rds wait db-snapshot-available \
  --db-snapshot-identifier $SNAPSHOT_ID

echo "✅ Backup completed: $SNAPSHOT_ID"

# Log backup
echo "$(date): $SNAPSHOT_ID created successfully" >> /var/log/mxmobilz-backups.log

# Cleanup old backups (keep last 30 days)
echo "Cleaning up old snapshots..."
aws rds describe-db-snapshots \
  --query "DBSnapshots[?DBInstanceIdentifier=='mxmobilz-prod-mysql'].DBSnapshotIdentifier" \
  --output text | \
while read snapshot; do
  SNAPSHOT_DATE=$(aws rds describe-db-snapshots \
    --db-snapshot-identifier $snapshot \
    --query 'DBSnapshots[0].SnapshotCreateTime' \
    --output text)
  
  DAYS_OLD=$(( ($(date +%s) - $(date -d "$SNAPSHOT_DATE" +%s)) / 86400 ))
  
  if [ $DAYS_OLD -gt 30 ]; then
    echo "Deleting old snapshot: $snapshot ($DAYS_OLD days old)"
    aws rds delete-db-snapshot --db-snapshot-identifier $snapshot
  fi
done

echo "✅ Backup procedure completed"
```

### Weekly Kubernetes Resource Backup

```bash
#!/bin/bash
# backup-kubernetes.sh

BACKUP_DIR="./backups/$(date +%Y%m%d)"
mkdir -p $BACKUP_DIR

echo "Backing up Kubernetes resources..."

# Backup deployments
kubectl get deployments -n cloud-native-ecomerce-app -o yaml > $BACKUP_DIR/deployments.yaml

# Backup statefulsets
kubectl get statefulsets -n cloud-native-ecomerce-app -o yaml > $BACKUP_DIR/statefulsets.yaml

# Backup services
kubectl get services -n cloud-native-ecomerce-app -o yaml > $BACKUP_DIR/services.yaml

# Backup configmaps
kubectl get configmaps -n cloud-native-ecomerce-app -o yaml > $BACKUP_DIR/configmaps.yaml

# Backup persistent volumes
kubectl get pvc -n cloud-native-ecomerce-app -o yaml > $BACKUP_DIR/pvcs.yaml

# ⚠️ Note: Secrets should be backed up separately with encryption
# Consider using: external-secrets operator or AWS Secrets Manager

echo "✅ Kubernetes backup completed"
echo "Location: $BACKUP_DIR"

# Upload to S3
aws s3 sync $BACKUP_DIR s3://mxmobilz-backups/k8s/$(date +%Y%m%d)/
```

---

## Recovery Procedures

### Scenario 1: Single Pod Crash

**Time to Recover:** < 1 minute (automatic)

```bash
# Kubernetes automatically restarts pod
# Monitor pod status
kubectl get pods -n cloud-native-ecomerce-app --watch

# Describe pod for error details
kubectl describe pod <pod-name> -n cloud-native-ecomerce-app

# View logs
kubectl logs <pod-name> -n cloud-native-ecomerce-app
kubectl logs <pod-name> -n cloud-native-ecomerce-app --previous  # Before crash
```

### Scenario 2: Node Failure

**Time to Recover:** 2-5 minutes (automatic rescheduling)

```bash
# Kubernetes automatically reschedules pods to healthy nodes
kubectl get nodes

# Cordon unhealthy node (prevent new pods)
kubectl cordon <node-name>

# Drain existing pods
kubectl drain <node-name> --ignore-daemonsets

# Monitor pod distribution
kubectl get pods -o wide

# AutoScaling group will replace the node automatically
aws autoscaling describe-auto-scaling-groups \
  --auto-scaling-group-names eks-worker-nodes-asg
```

### Scenario 3: Application Rollback

**Time to Recover:** 2-5 minutes

```bash
# Check deployment history
kubectl rollout history deployment/backend -n cloud-native-ecomerce-app

# View previous revision details
kubectl rollout history deployment/backend \
  --revision=2 \
  -n cloud-native-ecomerce-app

# Rollback to previous version
kubectl rollout undo deployment/backend \
  -n cloud-native-ecomerce-app

# Rollback to specific revision
kubectl rollout undo deployment/backend \
  --to-revision=2 \
  -n cloud-native-ecomerce-app

# Monitor rollback progress
kubectl rollout status deployment/backend \
  -n cloud-native-ecomerce-app --watch
```

### Scenario 4: Database Corruption

**Time to Recover:** 30-60 minutes

#### Step 1: Assess Damage

```bash
# Connect to database and check integrity
mysql -h mxmobilz-prod-mysql.xxxxx.rds.amazonaws.com \
      -u admin \
      -p mxmobilz_db

# Check for corruption
CHECK TABLE products;
CHECK TABLE orders;
REPAIR TABLE corrupted_table;
```

#### Step 2: Create Snapshot (if not done)

```bash
aws rds create-db-snapshot \
  --db-instance-identifier mxmobilz-prod-mysql \
  --db-snapshot-identifier mxmobilz-prod-manual-recovery-$(date +%s)
```

#### Step 3: Restore from Snapshot

```bash
# Option A: Restore to new instance (safer, faster)
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier mxmobilz-prod-mysql-restored \
  --db-snapshot-identifier mxmobilz-prod-backup-20260902

# Wait for restoration
aws rds wait db-instance-available \
  --db-instance-identifier mxmobilz-prod-mysql-restored

# Verify data integrity
mysql -h mxmobilz-prod-mysql-restored.xxxxx.rds.amazonaws.com \
      -u admin -p mxmobilz_db -e "SELECT COUNT(*) FROM products;"
```

#### Step 4: Update Application Connection

```bash
# Update Kubernetes secret
kubectl patch secret db-credentials \
  -p '{"data":{"host":"'$(echo -n mxmobilz-prod-mysql-restored.xxxxx.rds.amazonaws.com | base64)'"}}'

# Restart pods to pick up new connection string
kubectl rollout restart deployment/backend \
  -n cloud-native-ecomerce-app
```

#### Step 5: Verify and Clean Up

```bash
# Check application health
curl https://mxmobilz.com/api/products

# Delete old database (optional, keep for investigation)
aws rds delete-db-instance \
  --db-instance-identifier mxmobilz-prod-mysql \
  --skip-final-snapshot
```

### Scenario 5: Entire Cluster Loss

**Time to Recover:** 30-45 minutes

```bash
# Prerequisites: Terraform IaC + GitOps (ArgoCD) must be in Git

# Step 1: Recreate cluster
cd infra/env/prod
terraform apply

# Step 2: Wait for cluster to be ready
aws eks wait cluster-active --name mxmobilz-prod

# Step 3: Update kubeconfig
aws eks update-kubeconfig --name mxmobilz-prod

# Step 4: Install ArgoCD (bootstrap)
cd ../../gitops
./bootstrap-argocd.sh

# Step 5: Restore database from snapshot
# (Use Scenario 4 procedures above)

# Step 6: Verify system health
kubectl get all -n cloud-native-ecomerce-app
curl https://mxmobilz.com/api/products
```

---

## Failure Scenarios

### Scenario A: Database Backup Failure

**Detection:**
```bash
# CloudWatch alarm triggers
# Manual verification:
aws rds describe-db-instances \
  --db-instance-identifier mxmobilz-prod-mysql \
  --query 'DBInstances[0].LatestRestorableTime'

# Compare with current time (should be recent)
```

**Response:**
```bash
# Check RDS events
aws rds describe-events \
  --source-identifier mxmobilz-prod-mysql

# Trigger manual backup
aws rds create-db-snapshot \
  --db-instance-identifier mxmobilz-prod-mysql \
  --db-snapshot-identifier manual-backup-now

# Notify team
# Check disk space, backup window conflicts, IAM permissions
```

### Scenario B: Persistent Volume Failure

**Detection:**
```bash
kubectl get pvc -n cloud-native-ecomerce-app
# Look for "Pending" or "Lost" status

kubectl describe pvc mysql-data -n cloud-native-ecomerce-app
```

**Response:**
```bash
# Step 1: Create snapshot of current volume (if possible)
kubectl exec -it mysql-pod -c mysql -- mysqldump -u root -p all-databases > dump.sql

# Step 2: Delete PVC (data loss expected)
kubectl delete pvc mysql-data -n cloud-native-ecomerce-app

# Step 3: PVC recreated by StatefulSet
kubectl get pvc -w -n cloud-native-ecomerce-app

# Step 4: Restore from database backup
# Use procedures from Scenario 4 above
```

### Scenario C: Partial Data Loss

**Detection:**
```bash
# Application error rates spike
# User reports missing data
# Monitor logs for SQL errors
```

**Response:**
```bash
# Step 1: Identify what was deleted
# Query bin logs from RDS
aws rds describe-db-log-files \
  --db-instance-identifier mxmobilz-prod-mysql

# Step 2: Determine recovery point
# Point-in-time recovery available for last 30 days
aws rds describe-db-instances \
  --db-instance-identifier mxmobilz-prod-mysql \
  --query 'DBInstances[0].LatestRestorableTime'

# Step 3: Restore to point-in-time (creates new DB instance)
aws rds restore-db-instance-to-point-in-time \
  --source-db-instance-identifier mxmobilz-prod-mysql \
  --target-db-instance-identifier mxmobilz-prod-mysql-pitr \
  --restore-time 2026-09-01T10:00:00Z

# Step 4: Extract needed data
# Use mysqldump or SELECT queries

# Step 5: Migrate extracted data to production
```

---

## Testing & Drills

### Monthly Backup Verification Test

```bash
#!/bin/bash
# test-backups.sh - Run monthly

echo "=== Backup Testing Procedure ==="
echo "Date: $(date)"

# 1. List recent backups
echo "Recent snapshots:"
aws rds describe-db-snapshots \
  --query 'DBSnapshots[0:5].[DBSnapshotIdentifier,SnapshotCreateTime]' \
  --output table

# 2. Select a backup to restore
BACKUP_ID="mxmobilz-prod-backup-20260902"

# 3. Restore to test instance
echo "Restoring to test instance..."
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier mxmobilz-test-restore \
  --db-snapshot-identifier $BACKUP_ID \
  --publicly-accessible

# 4. Wait for completion
aws rds wait db-instance-available \
  --db-instance-identifier mxmobilz-test-restore

# 5. Verify data
echo "Verifying data integrity..."
mysql -h <test-instance-endpoint> -u admin -p mxmobilz_db \
  -e "SELECT COUNT(*) as product_count FROM products;
      SELECT COUNT(*) as order_count FROM orders;
      SELECT MAX(created_at) as latest_data FROM products;"

# 6. Document results
RESULT=$?
echo "Restoration test: $([ $RESULT -eq 0 ] && echo 'PASSED' || echo 'FAILED')" \
  >> /var/log/backup-tests.log

# 7. Clean up
aws rds delete-db-instance \
  --db-instance-identifier mxmobilz-test-restore \
  --skip-final-snapshot

echo "✅ Backup test completed"
```

### Quarterly Full System Recovery Drill

```bash
# Schedule: First week of quarter
# Duration: 2-4 hours
# Team: DevOps + SRE

1. Simulate complete cluster failure
   └── kubectl delete node <node> --force

2. Execute cluster recovery procedure
   └── terraform apply in staging environment

3. Restore from backup
   └── Point-in-time recovery to verify backup validity

4. Verify all applications working
   └── Health checks pass
   └── All services responding
   └── Data integrity verified

5. Document lessons learned
   └── What went well?
   └── What could be improved?
   └── Update runbooks

6. Calculate actual RTO/RPO
   └── Compare with objectives
   └── Identify gaps
```

---

## Monitoring & Alerts

### CloudWatch Alarms

```hcl
# Terraform configuration for backup monitoring

resource "aws_cloudwatch_metric_alarm" "backup_missing" {
  alarm_name          = "rds-backup-missing"
  comparison_operator = "LessThanOrEqualToThreshold"
  evaluation_periods  = 1
  metric_name         = "DBSnapshotStorageUsed"
  namespace           = "AWS/RDS"
  period              = 3600  # 1 hour
  statistic           = "Maximum"
  threshold           = 0
  alarm_description   = "Alert if no backups found"
  alarm_actions       = [aws_sns_topic.alerts.arn]
}

resource "aws_cloudwatch_metric_alarm" "backup_old" {
  alarm_name          = "rds-backup-old"
  comparison_operator = "LessThanOrEqualToThreshold"
  evaluation_periods  = 1
  metric_name         = "LatestRestorableTime"
  namespace           = "AWS/RDS"
  period              = 86400  # 24 hours
  statistic           = "Maximum"
  threshold           = 86400  # 1 day
  alarm_description   = "Alert if latest backup is old"
  alarm_actions       = [aws_sns_topic.alerts.arn]
}
```

### Log Monitoring

```bash
# Query for backup failures in CloudWatch Logs
aws logs filter-log-events \
  --log-group-name /aws/rds/mxmobilz-prod \
  --filter-pattern "ERROR backup failed" \
  --start-time $(date -d '24 hours ago' +%s)000

# Set up CloudWatch Insights query
fields @timestamp, @message
| filter @message like /backup/
| filter @message like /error|failed|warning/
| stats count() by bin(5m)
```

---

## Important Reminders

⚠️ **Backup Best Practices:**
- ✅ Test backups regularly (monthly minimum)
- ✅ Document recovery procedures
- ✅ Store backups in separate region (AWS recommends)
- ✅ Encrypt all backups
- ✅ Monitor backup completion
- ✅ Maintain audit trail of backups
- ✅ Automate backup procedures
- ✅ Document all assumptions and dependencies

---

**Last Updated:** September 2, 2026  
**Status:** Production Ready
