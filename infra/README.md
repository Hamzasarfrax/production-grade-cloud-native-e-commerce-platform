# Terraform Infrastructure Setup

This directory contains Terraform configurations for provisioning the complete AWS infrastructure for the Mxmobilz e-commerce application.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                      AWS Account                        │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌──────────────────────────────────────────────────┐  │
│  │            VPC (10.0.0.0/16 - 10.2.0.0/16)       │  │
│  │                                                    │  │
│  │  ┌────────────────────────────────────────────┐  │  │
│  │  │   Public Subnets (IGW)                     │  │  │
│  │  │   - ALB                                    │  │  │
│  │  │   - NAT Gateway                           │  │  │
│  │  └────────────────────────────────────────────┘  │  │
│  │                                                    │  │
│  │  ┌────────────────────────────────────────────┐  │  │
│  │  │   Private Subnets (NAT)                    │  │  │
│  │  │   - EKS Cluster (2-3 nodes)               │  │  │
│  │  │   - RDS MySQL Database                    │  │  │
│  │  └────────────────────────────────────────────┘  │  │
│  │                                                    │  │
│  └──────────────────────────────────────────────────┘  │
│                                                           │
│  ┌──────────────────────────────────────────────────┐  │
│  │  CloudWatch Logs & Monitoring                    │  │
│  │  - EKS Cluster Logs                             │  │
│  │  - RDS Performance Logs                         │  │
│  └──────────────────────────────────────────────────┘  │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

## Directory Structure

```
infra/
├── module/                 # Reusable Terraform modules
│   ├── vpc/               # VPC, subnets, security groups
│   ├── eks/               # EKS cluster, node groups, add-ons
│   └── rds/               # RDS MySQL database
├── env/                   # Environment-specific configurations
│   ├── dev/               # Development environment
│   ├── stag/              # Staging environment
│   └── prod/              # Production environment
└── scripts/               # Helper scripts
```

## Modules Description

### VPC Module (`module/vpc/`)
- **VPC**: Main VPC with configurable CIDR block
- **Public Subnets**: For ALB and NAT Gateway (2 AZs)
- **Private Subnets**: For EKS nodes and RDS (2 AZs)
- **Internet Gateway**: For public subnet routing
- **NAT Gateway**: For private subnet outbound traffic
- **Security Groups**: Separate SGs for ALB, EKS nodes, and RDS
- **DB Subnet Group**: For RDS instance

### EKS Module (`module/eks/`)
- **EKS Cluster**: Managed Kubernetes cluster
  - Auto-logging to CloudWatch
  - RBAC enabled
  - API endpoint protection
- **Node Groups**: Auto-scaling worker nodes
  - Configurable instance type and disk size
  - IMDSv2 enforced
- **Add-ons**:
  - VPC CNI (networking)
  - CoreDNS (DNS)
  - kube-proxy (networking)
  - EBS CSI Driver (persistent volumes)

### RDS Module (`module/rds/`)
- **RDS Instance**: MySQL database
  - Encryption at rest and in transit
  - Automated backups with configurable retention
  - Enhanced monitoring
  - Secrets Manager integration
  - CloudWatch logging (error, general, slowquery)
- **Parameter Group**: MySQL-specific optimizations
- **Enhanced Monitoring**: CloudWatch metrics via IAM role

## Environment-Specific Configurations

### Development (`env/dev/`)
- **VPC CIDR**: 10.0.0.0/16
- **EKS Nodes**: t3.medium, 2 desired (1-4 max)
- **RDS**: db.t3.micro, 20GB, no Multi-AZ
- **Backups**: 7 days retention
- **Logs**: 7 days retention

### Staging (`env/stag/`)
- **VPC CIDR**: 10.1.0.0/16
- **EKS Nodes**: t3.small, 2 desired (2-6 max)
- **RDS**: db.t3.small, 50GB, Multi-AZ enabled
- **Backups**: 14 days retention
- **Logs**: 30 days retention

### Production (`env/prod/`)
- **VPC CIDR**: 10.2.0.0/16
- **EKS Nodes**: t3.medium, 3 desired (3-10 max)
- **RDS**: db.t3.medium, 100GB, Multi-AZ enabled
- **Backups**: 30 days retention
- **Logs**: 90 days retention
- **Enhanced Monitoring**: Enabled
- **Deletion Protection**: Enabled

## Prerequisites

1. **AWS Account**: Active AWS account with appropriate permissions
2. **AWS CLI**: Configured with valid credentials
   ```bash
   aws configure
   ```
3. **Terraform**: Version 1.3 or higher
   ```bash
   terraform version
   ```
4. **kubectl**: For interacting with EKS
   ```bash
   aws eks update-kubeconfig --region us-east-1 --name mxmobilz-dev
   ```

## S3 Backend Setup (One-time)

Before deploying, set up the S3 backend for state management:

```bash
cd infra/remote-backend

# Update provider.tf with real AWS credentials (not LocalStack)
terraform init
terraform apply -var="env=dev" -var="s3_bucket_name=mxmobilz-terraform-state-dev"
terraform apply -var="env=staging" -var="s3_bucket_name=mxmobilz-terraform-state-staging"
terraform apply -var="env=prod" -var="s3_bucket_name=mxmobilz-terraform-state-prod"
```

This creates:
- S3 buckets for state storage (versioned, encrypted, access logging)
- DynamoDB table for state locking
- KMS keys for encryption

## Deployment

### 1. Initialize Terraform

```bash
# For development
cd infra/env/dev
terraform init

# For staging
cd infra/env/stag
terraform init

# For production
cd infra/env/prod
terraform init
```

### 2. Plan Deployment

```bash
terraform plan -out=tfplan
```

### 3. Apply Configuration

```bash
# Requires approval
terraform apply tfplan

# Or directly
terraform apply
```

### 4. Get Outputs

```bash
terraform output
```

Key outputs:
- `eks_cluster_id`: Cluster name for kubectl
- `rds_endpoint`: Database connection string
- `rds_password_secret_id`: Secrets Manager secret for DB password
- `configure_kubectl`: Command to configure kubectl

## Accessing the Database Password

The database password is stored in AWS Secrets Manager:

```bash
# Get the secret
aws secretsmanager get-secret-value \
  --secret-id $(terraform output -raw rds_password_secret_id) \
  --region us-east-1 \
  --query SecretString \
  --output text | jq .

# Extract just the password
aws secretsmanager get-secret-value \
  --secret-id $(terraform output -raw rds_password_secret_id) \
  --region us-east-1 \
  --query 'SecretString' \
  --output text | jq -r '.password'
```

## Configuring kubectl

After deployment, configure kubectl to access the EKS cluster:

```bash
# Get the command from Terraform output
terraform output -raw configure_kubectl

# Or directly
aws eks update-kubeconfig --region us-east-1 --name mxmobilz-dev

# Verify connection
kubectl get nodes
kubectl get pods --all-namespaces
```

## Connecting to the Database

Using the RDS endpoint and credentials:

```bash
# Get connection details
terraform output -json | jq '.rds_endpoint, .rds_address, .rds_port, .rds_database_name'

# Connect with mysql CLI
mysql -h $(terraform output -raw rds_address) \
  -u admin \
  -p \
  $(terraform output -raw rds_database_name)
```

## Scaling

Modify the node configuration in environment variables:

```bash
# For development
terraform apply -var="node_desired_size=3" -var="node_max_size=6"

# For production
terraform apply -var="node_desired_size=5" -var="rds_instance_class=db.t3.large"
```

## Updating Kubernetes Version

```bash
# Update the EKS cluster version
terraform apply -var="kubernetes_version=1.29"

# Update node group to match
terraform apply
```

## Destroying Infrastructure

```bash
# List what will be destroyed
terraform plan -destroy

# Destroy resources
terraform destroy

# Force destroy (use with caution)
terraform destroy -auto-approve
```

**Warning**: This will delete all resources including the database. Ensure backups are in place.

## Troubleshooting

### State Lock Issues

If you encounter state lock issues:

```bash
# View locks
aws dynamodb scan --table-name mxmobilz-terraform-locks --region us-east-1

# Force unlock (use with caution)
terraform force-unlock <LOCK_ID>
```

### EKS Cluster Access

If kubectl commands fail:

```bash
# Reconfigure kubectl
aws eks update-kubeconfig --region us-east-1 --name mxmobilz-dev --force

# Check cluster status
aws eks describe-cluster --name mxmobilz-dev --region us-east-1
```

### RDS Connection Issues

```bash
# Check security group
aws ec2 describe-security-groups --group-ids <SECURITY_GROUP_ID> --region us-east-1

# Test connectivity from EKS node
kubectl run debug --image=mysql:8.0 -it --rm -- \
  mysql -h <RDS_ENDPOINT> -u admin -p
```

## Cost Optimization

### Development
- Use smaller instance types (t3.micro, t3.small)
- Disable Multi-AZ
- Use shorter backup retention
- Consider stopping instances during off-hours

### Staging
- Use t3.small for EKS
- Enable Multi-AZ for better availability
- 14-day backup retention

### Production
- Use appropriate instance types based on load
- Always enable Multi-AZ for RDS
- 30-day backup retention
- Enable Performance Insights for monitoring

## Maintenance

### Regular Tasks

1. **Monitor CloudWatch Logs**
   ```bash
   # View EKS logs
   aws logs tail /aws/eks/mxmobilz-dev/cluster --follow
   
   # View RDS logs
   aws logs tail /aws/rds/mysql/mxmobilz-dev-mysql/error --follow
   ```

2. **Review IAM Permissions**
   ```bash
   # List IAM roles created by Terraform
   aws iam list-roles --query 'Roles[?contains(RoleName, `mxmobilz`)].{Name:RoleName,Created:CreateDate}'
   ```

3. **Update Add-ons**
   ```bash
   # Check available versions
   aws eks describe-addon-versions --addon-name vpc-cni
   
   # Update via Terraform
   terraform apply -var="kubernetes_version=1.29"
   ```

4. **Backup Database**
   ```bash
   # RDS automatic backups are handled by Terraform
   aws rds describe-db-instances \
     --db-instance-identifier mxmobilz-dev-mysql \
     --query 'DBInstances[0].{BackupRetentionPeriod,LatestRestorableTime}'
   ```

## Best Practices

1. **Use separate AWS accounts** for dev/staging/prod
2. **Enable MFA** for AWS console access
3. **Use IAM roles** instead of access keys
4. **Enable CloudTrail** for audit logging
5. **Set up AWS Budget alerts** for cost monitoring
6. **Use auto-scaling** for production workloads
7. **Enable backup encryption** and test restore procedures
8. **Implement network policies** in Kubernetes for pod-to-pod communication
9. **Use secrets** for sensitive data instead of environment variables
10. **Set up monitoring** with CloudWatch and custom metrics

## Additional Resources

- [AWS EKS Documentation](https://docs.aws.amazon.com/eks/)
- [AWS RDS Documentation](https://docs.aws.amazon.com/rds/)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest)
- [Kubernetes Documentation](https://kubernetes.io/docs/)

## Support & Contributing

For issues or improvements:
1. Check existing Terraform state
2. Review CloudWatch logs
3. Verify IAM permissions
4. Check AWS service limits
5. Create an issue with logs and configuration details
