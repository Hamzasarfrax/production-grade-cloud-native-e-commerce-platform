# Terraform Quick Start Guide

## 📋 Prerequisites

Before you begin, ensure you have:

1. **AWS Account**: With appropriate permissions for EC2, EKS, RDS, CloudWatch, IAM
2. **AWS CLI**: Version 2.x
   ```bash
   aws --version
   aws configure  # Configure your AWS credentials
   ```
3. **Terraform**: Version 1.3 or higher
   ```bash
   terraform version
   ```
4. **kubectl**: For Kubernetes management
   ```bash
   kubectl version --client
   ```

## 🚀 Quick Start (5 minutes)

### Step 1: Initialize Backend (One-time)

```bash
cd infra

# Make scripts executable
chmod +x scripts/*.sh

# Run initialization script
./scripts/init.sh
```

This will:
- ✅ Check AWS credentials
- ✅ Create S3 buckets for Terraform state
- ✅ Create DynamoDB table for state locking
- ✅ Initialize Terraform for all environments

### Step 2: Deploy to Development

```bash
# Plan the infrastructure
./scripts/deploy.sh -e dev -a plan

# Review the plan output carefully, then apply
./scripts/deploy.sh -e dev -a apply
```

### Step 3: Get Outputs

```bash
cd env/dev
terraform output

# Key outputs:
# - eks_cluster_id: Use with kubectl
# - rds_endpoint: Database connection string
# - rds_password_secret_id: Get password from Secrets Manager
```

### Step 4: Configure kubectl

```bash
# Get the command from outputs
cd env/dev
aws eks update-kubeconfig \
  --region us-east-1 \
  --name $(terraform output -raw eks_cluster_id)

# Verify connection
kubectl get nodes
```

## 📊 Environment Configurations

### Development (`dev`)
- **Best for**: Testing and development
- **Costs**: Low (~$30-50/month)
- **Resources**:
  - EKS: t3.medium (2 nodes, 1-4 scaling)
  - RDS: db.t3.micro (20GB)
- **Deploy with**: 
  ```bash
  ./scripts/deploy.sh -e dev -a apply
  ```

### Staging (`stag`)
- **Best for**: Pre-production testing
- **Costs**: Medium (~$100-150/month)
- **Resources**:
  - EKS: t3.small (2 nodes, 2-6 scaling)
  - RDS: db.t3.small (50GB, Multi-AZ)
- **Deploy with**:
  ```bash
  ./scripts/deploy.sh -e stag -a apply
  ```

### Production (`prod`)
- **Best for**: Live traffic
- **Costs**: High (~$200-300/month)
- **Resources**:
  - EKS: t3.medium (3 nodes, 3-10 scaling)
  - RDS: db.t3.medium (100GB, Multi-AZ, backups)
- **Deploy with**:
  ```bash
  ./scripts/deploy.sh -e prod -a apply
  ```

## 🔧 Common Operations

### View Infrastructure Status
```bash
cd env/dev
terraform output
```

### Update Node Count
```bash
# Scale up EKS nodes for staging
./scripts/deploy.sh -e stag -a plan \
  -var="node_desired_size=4" \
  -var="node_max_size=8"
```

### Update Database Size
```bash
# Upgrade RDS for production
./scripts/deploy.sh -e prod -a plan \
  -var="rds_instance_class=db.t3.large" \
  -var="rds_allocated_storage=200"
```

### Get Database Password
```bash
cd env/dev

# View the secret
aws secretsmanager get-secret-value \
  --secret-id $(terraform output -raw rds_password_secret_id) \
  --query 'SecretString' \
  --output text | jq .

# Extract just the password
aws secretsmanager get-secret-value \
  --secret-id $(terraform output -raw rds_password_secret_id) \
  --query 'SecretString' \
  --output text | jq -r '.password'
```

### Connect to Database
```bash
cd env/dev

# Get connection details
DB_HOST=$(terraform output -raw rds_address)
DB_NAME=$(terraform output -raw rds_database_name)
DB_PORT=$(terraform output -raw rds_port)
DB_PASS=$(aws secretsmanager get-secret-value \
  --secret-id $(terraform output -raw rds_password_secret_id) \
  --query 'SecretString' --output text | jq -r '.password')

# Connect
mysql -h $DB_HOST -P $DB_PORT -u admin -p$DB_PASS $DB_NAME
```

### Deploy Application to EKS
```bash
cd env/dev

# Configure kubectl
aws eks update-kubeconfig --region us-east-1 --name mxmobilz-dev

# Verify cluster access
kubectl get nodes

# Deploy your application
kubectl apply -f your-app-manifests/
```

### View Logs
```bash
# EKS cluster logs
aws logs tail /aws/eks/mxmobilz-dev/cluster --follow

# RDS logs
aws logs tail /aws/rds/mysql/mxmobilz-dev-mysql/error --follow
```

### Destroy Infrastructure
```bash
# Careful! This deletes everything
./scripts/deploy.sh -e dev -a destroy

# With auto-approve (no confirmation)
./scripts/deploy.sh -e dev -a destroy --auto-approve
```

## 📈 Monitoring & Maintenance

### CloudWatch Metrics
```bash
# CPU usage for EKS nodes
aws cloudwatch get-metric-statistics \
  --namespace AWS/EC2 \
  --metric-name CPUUtilization \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average
```

### Check Backup Status
```bash
aws rds describe-db-instances \
  --db-instance-identifier mxmobilz-dev-mysql \
  --query 'DBInstances[0].{Status:DBInstanceStatus,BackupRetentionPeriod:BackupRetentionPeriod,LatestRestorableTime:LatestRestorableTime}'
```

### View CloudFormation Events
```bash
# See what Terraform is creating
aws cloudformation describe-stack-events \
  --stack-name mxmobilz-dev
```

## 🆘 Troubleshooting

### Terraform State Lock
```bash
# Check for locks
aws dynamodb scan \
  --table-name mxmobilz-terraform-locks \
  --region us-east-1

# Force unlock (use with caution!)
terraform force-unlock <LOCK_ID>
```

### EKS Cluster Not Accessible
```bash
# Reconfigure kubectl
aws eks update-kubeconfig \
  --region us-east-1 \
  --name mxmobilz-dev \
  --force

# Check cluster status
aws eks describe-cluster \
  --name mxmobilz-dev \
  --region us-east-1 \
  --query 'cluster.status'
```

### RDS Connection Refused
```bash
# Check security group rules
aws ec2 describe-security-groups \
  --group-ids <SECURITY_GROUP_ID> \
  --region us-east-1 \
  --query 'SecurityGroups[0].IpPermissions'

# Test from EKS pod
kubectl run debug --image=mysql:8.0 -it --rm -- \
  mysql -h <RDS_ENDPOINT> -u admin -p
```

### Insufficient Capacity
```bash
# Change instance type if you get "InsufficientInstanceCapacity"
./scripts/deploy.sh -e dev -a plan \
  -var="node_instance_type=t3.small"
```

## 📝 Important Notes

1. **AWS Costs**: Even small instances incur charges. Remember to destroy non-production environments when not in use.

2. **Database Passwords**: Stored securely in AWS Secrets Manager. Never commit passwords to version control.

3. **State File Security**: Terraform state is stored in encrypted S3 buckets with versioning enabled.

4. **Backups**: Automated backups are enabled. Verify backup restoration procedures regularly.

5. **Updates**: Keep Kubernetes and RDS versions updated for security patches.

6. **Monitoring**: Set up CloudWatch alarms for production workloads.

## 🔗 Additional Resources

- [Terraform Documentation](https://www.terraform.io/docs)
- [AWS EKS Documentation](https://docs.aws.amazon.com/eks/)
- [AWS RDS Documentation](https://docs.aws.amazon.com/rds/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [AWS CLI Reference](https://docs.aws.amazon.com/cli/latest/)

## ✅ Next Steps

1. ✅ Review the infrastructure diagram in [README.md](./README.md)
2. ✅ Understand the module architecture
3. ✅ Deploy to dev and test
4. ✅ Monitor CloudWatch logs
5. ✅ Deploy to staging
6. ✅ Perform load testing
7. ✅ Deploy to production

Good luck! 🚀
