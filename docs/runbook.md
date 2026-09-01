# Operational Runbook

> **⚠️ Status banner (2026-09-01):** planned operations procedures. No live environment exists to run them against (Kind-era commands are logged in `docs/k8s-production-setup.md` / `docs/argocd.md`; AWS commands here are unexecuted). Verified vs planned: `docs/STATUS.md`.

## Overview

This document contains step-by-step procedures for common operational tasks. Use this as a reference during on-call shifts and for routine maintenance.

## Table of Contents

1. [Startup Procedures](#startup-procedures)
2. [Daily Operations](#daily-operations)
3. [Scaling Operations](#scaling-operations)
4. [Database Operations](#database-operations)
5. [Troubleshooting Quick Reference](#troubleshooting-quick-reference)
6. [Incident Response](#incident-response)
7. [Maintenance Windows](#maintenance-windows)

---

## Startup Procedures

### Initial Deployment to AWS

**Prerequisites:**
- AWS account with appropriate permissions
- Terraform installed (v1.3+)
- kubectl installed and configured
- Docker installed (for local testing)

**Time Required:** 30-45 minutes

```bash
# 1. Prepare AWS credentials
export AWS_ACCESS_KEY_ID=your_key
export AWS_SECRET_ACCESS_KEY=your_secret
export AWS_DEFAULT_REGION=us-east-1

# 2. Initialize Terraform backend
cd infra
./scripts/init.sh
# Follow prompts to set up S3 buckets and DynamoDB

# 3. Deploy infrastructure
cd env/prod
terraform init
terraform plan -out=tfplan
terraform apply tfplan

# 4. Configure kubectl
aws eks update-kubeconfig \
  --name mxmobilz-prod \
  --region us-east-1

# 5. Verify cluster connectivity
kubectl cluster-info
kubectl get nodes

# 6. Install ArgoCD for GitOps
cd ../../gitops
./bootstrap-argocd.sh

# 7. Apply ArgoCD applications
kubectl apply -f argocd/projects/mxmobilz-project.yaml
kubectl apply -f argocd/applications/

# 8. Wait for applications to sync
kubectl get applications -n argocd --watch

# 9. Verify all services
kubectl get all -n cloud-native-ecomerce-app
curl https://mxmobilz.com/api/products

# ✅ Deployment complete
```

### Starting Local Development Stack

**Time Required:** 5 minutes

```bash
# 1. Navigate to project root
cd ~/mxmobilz

# 2. Start Docker Compose
docker compose up --build

# 3. Verify services are running
docker compose ps

# 4. Check application health
curl http://localhost:8000/api/products  # Backend
curl http://localhost:3000                # Frontend

# 5. Access applications
# Frontend: http://localhost:3000
# Backend: http://localhost:8000
# phpMyAdmin (optional): http://localhost:8081

# ✅ Development environment ready
```

---

## Daily Operations

### Morning Health Check

**Frequency:** Once daily (recommended: 09:00 AM)  
**Time Required:** 10 minutes

```bash
#!/bin/bash
# run-health-check.sh

echo "=== Morning Health Check ==="
echo "Time: $(date)"

# 1. Check cluster health
echo -e "\n1. Kubernetes Cluster Status:"
kubectl cluster-info
kubectl get nodes
kubectl get nodes -o wide | grep -E "NotReady|SchedulingDisabled"

# 2. Check pod status
echo -e "\n2. Pod Status:"
kubectl get pods -n cloud-native-ecomerce-app
kubectl get pods -n cloud-native-ecomerce-app | grep -E "Pending|CrashLoop|Error"

# 3. Check database connectivity
echo -e "\n3. Database Status:"
kubectl exec -it mysql-0 -n cloud-native-ecomerce-app -- \
  mysqladmin -u root -p$MYSQL_ROOT_PASSWORD status

# 4. Check RDS status
echo -e "\n4. RDS Instance Status:"
aws rds describe-db-instances \
  --db-instance-identifier mxmobilz-prod-mysql \
  --query 'DBInstances[0].{DBInstanceStatus:DBInstanceStatus,MultiAZ:MultiAZ,LatestRestorableTime:LatestRestorableTime}' \
  --output table

# 5. Check API endpoints
echo -e "\n5. API Health:"
for endpoint in /api/products /api/orders /api/stats; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://mxmobilz.com$endpoint)
  echo "  $endpoint: HTTP $STATUS"
done

# 6. Check error logs
echo -e "\n6. Recent Errors (last hour):"
kubectl logs -n cloud-native-ecomerce-app \
  -l app=backend \
  --since=1h \
  | grep -i "error\|warning\|exception" | tail -10

# 7. Check resource usage
echo -e "\n7. Resource Usage:"
kubectl top nodes
kubectl top pods -n cloud-native-ecomerce-app

# Summary
echo -e "\n=== Health Check Complete ==="
```

### Backup Verification

**Frequency:** Daily  
**Time Required:** 5 minutes

```bash
#!/bin/bash
# verify-backups.sh

echo "Verifying daily backups..."

# 1. Check latest RDS snapshot
echo "Latest RDS Snapshot:"
aws rds describe-db-snapshots \
  --db-instance-identifier mxmobilz-prod-mysql \
  --query 'DBSnapshots[0].[DBSnapshotIdentifier,SnapshotCreateTime,Status]' \
  --output table

# 2. Check latest backup age
LAST_BACKUP=$(aws rds describe-db-instances \
  --db-instance-identifier mxmobilz-prod-mysql \
  --query 'DBInstances[0].LatestRestorableTime' \
  --output text)

HOURS_OLD=$(( ($(date +%s) - $(date -d "$LAST_BACKUP" +%s)) / 3600 ))

if [ $HOURS_OLD -gt 24 ]; then
  echo "⚠️ WARNING: Last backup is $HOURS_OLD hours old"
  # Send alert
else
  echo "✅ Backup status: OK (${HOURS_OLD}h old)"
fi

# 3. Check snapshot retention
SNAPSHOT_COUNT=$(aws rds describe-db-snapshots \
  --db-instance-identifier mxmobilz-prod-mysql \
  --query 'length(DBSnapshots)')

echo "Snapshots retained: $SNAPSHOT_COUNT"
```

### Log Review

**Frequency:** Daily or when problems reported  
**Time Required:** 10-15 minutes

```bash
# 1. Check recent application errors
kubectl logs -n cloud-native-ecomerce-app \
  -l app=backend \
  --since=1h \
  --tail=50

# 2. Check system pod errors
kubectl logs -n kube-system \
  --since=1h \
  --tail=50

# 3. Check pod restarts
kubectl get pods -n cloud-native-ecomerce-app \
  -o jsonpath='{range .items[*]}{.metadata.name}{":\t"}{.status.containerStatuses[0].restartCount}{"\n"}{end}'

# 4. CloudWatch log insights
aws logs filter-log-events \
  --log-group-name /aws/eks/mxmobilz-prod/cluster \
  --filter-pattern "ERROR" \
  --start-time $(date -d '24 hours ago' +%s)000

# 5. Export logs for analysis
mkdir -p ./logs/$(date +%Y%m%d)
kubectl logs -n cloud-native-ecomerce-app -l app=backend > ./logs/$(date +%Y%m%d)/backend.log
kubectl logs -n cloud-native-ecomerce-app -l app=frontend > ./logs/$(date +%Y%m%d)/frontend.log
```

---

## Scaling Operations

### Horizontal Scaling - Increase Replicas

**When:** Traffic spike, high CPU/memory usage  
**Time Required:** 2-5 minutes

```bash
# 1. Check current replicas
kubectl get deployment backend -n cloud-native-ecomerce-app

# 2. Scale backend to 5 replicas
kubectl scale deployment backend \
  --replicas=5 \
  -n cloud-native-ecomerce-app

# 3. Monitor scaling progress
kubectl get pods -n cloud-native-ecomerce-app --watch

# 4. Verify health of new pods
kubectl get pods -n cloud-native-ecomerce-app -o wide

# 5. Check load distribution
kubectl top pods -n cloud-native-ecomerce-app
```

### Vertical Scaling - Upgrade Node Instances

**When:** Persistent high resource utilization  
**Time Required:** 30-60 minutes

```bash
# 1. Plan capacity upgrade
aws eks describe-nodegroup \
  --cluster-name mxmobilz-prod \
  --nodegroup-name worker-nodes

# 2. Create new node group with larger instance type
aws eks create-nodegroup \
  --cluster-name mxmobilz-prod \
  --nodegroup-name worker-nodes-large \
  --subnets subnet-xxxxx subnet-xxxxx \
  --node-role arn:aws:iam::123456789:role/eks-node-role \
  --instance-types t3.large \
  --scaling-config minSize=1,maxSize=10,desiredSize=3

# 3. Wait for new nodes to be ready
kubectl get nodes --watch

# 4. Drain old nodes (reschedule pods)
kubectl cordon node-old-1 node-old-2 node-old-3
kubectl drain node-old-1 --ignore-daemonsets
kubectl drain node-old-2 --ignore-daemonsets
kubectl drain node-old-3 --ignore-daemonsets

# 5. Delete old node group
aws eks delete-nodegroup \
  --cluster-name mxmobilz-prod \
  --nodegroup-name worker-nodes

# 6. Verify all pods are running
kubectl get pods -n cloud-native-ecomerce-app
```

### Database Scaling - Increase Instance Type

**When:** Persistent slow queries, high CPU/connections  
**Time Required:** 30-60 minutes (with maintenance window)

```bash
# 1. Create snapshot before changes
aws rds create-db-snapshot \
  --db-instance-identifier mxmobilz-prod-mysql \
  --db-snapshot-identifier pre-scale-backup-$(date +%s)

# 2. Modify instance type (during maintenance window)
aws rds modify-db-instance \
  --db-instance-identifier mxmobilz-prod-mysql \
  --db-instance-class db.t3.large \
  --apply-immediately  # or --no-apply-immediately for next maintenance window

# 3. Monitor modification
aws rds describe-db-instances \
  --db-instance-identifier mxmobilz-prod-mysql \
  --query 'DBInstances[0].{Status:DBInstanceStatus,PendingModifiedValues:PendingModifiedValues}'

# 4. Verify performance improvement
# Run queries and check response times
```

---

## Database Operations

### Connect to Database

```bash
# 1. Get RDS endpoint
aws rds describe-db-instances \
  --db-instance-identifier mxmobilz-prod-mysql \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text

# 2. Get password from Secrets Manager
aws secretsmanager get-secret-value \
  --secret-id mxmobilz/db/password \
  --query 'SecretString' \
  --output text | jq -r '.password'

# 3. Connect to database
mysql -h mxmobilz-prod-mysql.xxxxx.rds.amazonaws.com \
      -u mxmobilz_app \
      -p \
      mxmobilz_db
```

### Database Maintenance

#### Check Table Status

```bash
# Connect to database and run:
SHOW TABLES;
CHECK TABLE products;
CHECK TABLE orders;
CHECK TABLE inquiries;
CHECK TABLE promos;

# If corrupt, repair:
REPAIR TABLE corrupted_table;
```

#### Optimize Tables

```bash
# Regular maintenance (run weekly)
OPTIMIZE TABLE products;
OPTIMIZE TABLE orders;
OPTIMIZE TABLE inquiries;
OPTIMIZE TABLE promos;
OPTIMIZE TABLE customers;

# Check table size
SELECT table_name, ROUND(data_length / 1024 / 1024, 2) AS size_mb
FROM information_schema.tables
WHERE table_schema = 'mxmobilz_db'
ORDER BY data_length DESC;
```

#### Slow Query Analysis

```bash
# Enable slow query log (already configured via RDS parameter group)
# Query CloudWatch for slow queries
aws logs filter-log-events \
  --log-group-name /aws/rds/mxmobilz-prod/error \
  --filter-pattern "Query_time" \
  --start-time $(date -d '24 hours ago' +%s)000

# Or access directly from RDS:
# Connect to DB and query:
SELECT * FROM mysql.slow_log ORDER BY query_time DESC LIMIT 10;
```

---

## Troubleshooting Quick Reference

### Pod Stuck in Pending

```bash
# 1. Describe pod for details
kubectl describe pod <pod-name> -n cloud-native-ecomerce-app

# 2. Check node capacity
kubectl top nodes
kubectl describe nodes

# 3. Check PVC status (if using volumes)
kubectl get pvc -n cloud-native-ecomerce-app
kubectl describe pvc <pvc-name> -n cloud-native-ecomerce-app

# Solutions:
# - Add more nodes: kubectl scale nodegroup...
# - Free resources: delete unused pods
# - Increase storage: resize PVC
```

### High Pod Restart Rate

```bash
# 1. Check restart count
kubectl get pods -n cloud-native-ecomerce-app

# 2. Check previous logs
kubectl logs <pod-name> -n cloud-native-ecomerce-app --previous

# 3. Check events
kubectl describe pod <pod-name> -n cloud-native-ecomerce-app

# 4. Check resource limits
kubectl describe pod <pod-name> -n cloud-native-ecomerce-app | grep -i limits
kubectl top pod <pod-name> -n cloud-native-ecomerce-app

# Solutions:
# - Increase resource limits in deployment
# - Check application for memory leaks
# - Increase node resources
```

### API Latency Spike

```bash
# 1. Check pod resources
kubectl top pods -n cloud-native-ecomerce-app

# 2. Check database connection pool
# Connect to DB and run:
SHOW PROCESSLIST;

# 3. Check slow queries
aws logs filter-log-events \
  --log-group-name /aws/rds/mxmobilz-prod/slowquery

# 4. Check pod logs for errors
kubectl logs -l app=backend -n cloud-native-ecomerce-app --tail=100

# Solutions:
# - Scale horizontally: increase replicas
# - Optimize slow queries
# - Increase database memory
# - Clear cache if applicable
```

### Database Connection Refused

```bash
# 1. Check RDS status
aws rds describe-db-instances \
  --db-instance-identifier mxmobilz-prod-mysql \
  --query 'DBInstances[0].DBInstanceStatus'

# 2. Check security group
aws ec2 describe-security-groups \
  --group-ids sg-xxxxx

# 3. Check credentials
# Verify DB_HOST, DB_USERNAME, DB_PASSWORD in pod
kubectl get secret db-credentials -n cloud-native-ecomerce-app -o yaml

# 4. Test connectivity from pod
kubectl exec -it <pod> -n cloud-native-ecomerce-app -- \
  mysql -h <db-host> -u <user> -p <pass> -e "SELECT 1"

# Solutions:
# - Update security group ingress rules
# - Restart RDS instance
# - Rotate credentials
# - Update connection string
```

---

## Incident Response

### On-Call Escalation

**Priority Levels:**

```
SEV 1 (Critical): Service completely down, all users affected
└─ Notify: Entire team immediately
└─ Response: Start incident response, begin debugging
└─ Communication: Update status every 15 minutes

SEV 2 (High): Partial service degradation, multiple users affected
└─ Notify: On-call engineer + team lead
└─ Response: Start investigation, page if needed
└─ Communication: Update every 30 minutes

SEV 3 (Medium): Service issues, limited users affected
└─ Notify: On-call engineer
└─ Response: Investigate during next business hours
└─ Communication: Summary after resolution

SEV 4 (Low): Non-critical issues, cosmetic bugs
└─ Notify: Dev team lead
└─ Response: Schedule in sprint
└─ Communication: JIRA ticket only
```

### Incident Response Template

```bash
#!/bin/bash
# incident-response.sh - Use when SEV 1/2 incident occurs

INCIDENT_ID="INC-$(date +%Y%m%d-%H%M%S)"
INCIDENT_LOG="/var/log/incidents/$INCIDENT_ID.log"

echo "INCIDENT: $INCIDENT_ID" | tee $INCIDENT_LOG
echo "Started: $(date)" | tee -a $INCIDENT_LOG

# 1. Gather system state
echo "=== Gathering System State ===" | tee -a $INCIDENT_LOG
echo "Cluster Status:" | tee -a $INCIDENT_LOG
kubectl get all -n cloud-native-ecomerce-app | tee -a $INCIDENT_LOG

# 2. Check recent logs
echo "=== Recent Errors ===" | tee -a $INCIDENT_LOG
kubectl logs -n cloud-native-ecomerce-app -l app=backend --since=30m | grep -i error | tee -a $INCIDENT_LOG

# 3. Check resources
echo "=== Resource Usage ===" | tee -a $INCIDENT_LOG
kubectl top nodes | tee -a $INCIDENT_LOG
kubectl top pods -n cloud-native-ecomerce-app | tee -a $INCIDENT_LOG

# 4. Check recent changes
echo "=== Recent Deployments ===" | tee -a $INCIDENT_LOG
kubectl rollout history deployment/backend -n cloud-native-ecomerce-app | tee -a $INCIDENT_LOG

# 5. Quick fixes
echo "=== Attempting Quick Fixes ===" | tee -a $INCIDENT_LOG

# Option 1: Restart pods
echo "Option 1: Restart pods"
# kubectl rollout restart deployment/backend -n cloud-native-ecomerce-app

# Option 2: Rollback
echo "Option 2: Rollback to previous version"
# kubectl rollout undo deployment/backend -n cloud-native-ecomerce-app

# Option 3: Scale up
echo "Option 3: Scale up replicas"
# kubectl scale deployment/backend --replicas=5 -n cloud-native-ecomerce-app

# 6. Verify recovery
echo "=== Verifying Recovery ===" | tee -a $INCIDENT_LOG
curl https://mxmobilz.com/api/products | tee -a $INCIDENT_LOG

echo "Resolved: $(date)" | tee -a $INCIDENT_LOG
echo "Incident log: $INCIDENT_LOG"
```

---

## Maintenance Windows

### Weekly Maintenance

**Recommended Window:** Sunday 02:00-04:00 UTC

```bash
# 1. Update base images (if critical patches available)
docker pull php:8.3-fpm-bookworm
docker pull nginx:1.25-alpine

# 2. Rebuild images
docker compose build

# 3. Update Kubernetes add-ons
aws eks update-addon \
  --cluster-name mxmobilz-prod \
  --addon-name coredns

# 4. Validate cluster
kubectl get nodes
kubectl get pods -n cloud-native-ecomerce-app

# 5. Run health checks
./run-health-check.sh

# 6. Document changes
git commit -am "Weekly maintenance: $(date +%Y-%m-%d)"
```

### Monthly Maintenance

**Recommended Window:** First Sunday of month, 01:00-05:00 UTC

```bash
# 1. Update Terraform
terraform init -upgrade
terraform plan

# 2. Review and apply changes
terraform apply

# 3. Update container images
# Pick latest stable versions

# 4. Test disaster recovery procedure
./test-backups.sh

# 5. Review and update documentation
# - Update README if procedures changed
# - Review security checklist

# 6. Capacity planning
# - Review CloudWatch metrics for 30 days
# - Project resource needs for next month
# - Order capacity if needed (for large systems)

# 7. Team knowledge sharing
# - Share incident reports
# - Document lessons learned
# - Update runbooks if needed
```

### Quarterly Maintenance

**Recommended Window:** First week of quarter

```bash
# 1. Major version updates (if stable)
# - PHP update
# - MySQL update
# - Kubernetes patch

# 2. Security audit
./run-security-audit.sh

# 3. Full disaster recovery drill
# See disaster-recovery.md for procedures

# 4. Performance review
# - Query optimization
# - Index analysis
# - Cache effectiveness

# 5. Documentation review
# - Update all runbooks
# - Review security policies
# - Update architecture diagrams

# 6. Cost review
# - Analyze spending trends
# - Optimize instance types
# - Review unused resources
```

---

## Important Phone Numbers & Contacts

```
Primary On-Call:    [Name] +[Phone]
Secondary On-Call:  [Name] +[Phone]
Team Lead:          [Name] +[Phone]
AWS Support:        1-844-472-7639
Incident Slack:     #incidents
Status Page:        https://status.mxmobilz.com
```

---

**Last Updated:** September 2, 2026  
**Status:** Production Ready  
**Next Review:** Quarterly
