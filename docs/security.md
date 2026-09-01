# Security Best Practices & Hardening Guide

> **⚠️ Status banner (2026-09-01):** mixed document. Enforced today: validation on all writes, non-root containers, NetworkPolicies, encrypted-by-design Terraform, Dependabot (see `docs/STATUS.md` §3). NOT implemented: auth, rate limiting, WAF, cert-manager/TLS, audit logging — this guide is the plan for those, not evidence of them.

## Overview

This guide covers security best practices, hardening procedures, and compliance considerations for the Mxmobilz platform. Security is implemented at multiple layers: application, infrastructure, and operational levels.

## Table of Contents

1. [Security Architecture](#security-architecture)
2. [Application Security](#application-security)
3. [Infrastructure Security](#infrastructure-security)
4. [Data Security](#data-security)
5. [Access Control & IAM](#access-control--iam)
6. [Network Security](#network-security)
7. [Secrets Management](#secrets-management)
8. [Compliance & Auditing](#compliance--auditing)
9. [Security Incident Response](#security-incident-response)
10. [Security Checklist](#security-checklist)

---

## Security Architecture

### Defense in Depth

```
┌─────────────────────────────────────────────────────────┐
│  DDoS Protection (AWS Shield, WAF)                      │
├─────────────────────────────────────────────────────────┤
│  TLS/SSL Encryption (Certificate Manager)              │
├─────────────────────────────────────────────────────────┤
│  Network Layer Security (Security Groups, NACLs)       │
├─────────────────────────────────────────────────────────┤
│  Container Security (Signed images, scanning)          │
├─────────────────────────────────────────────────────────┤
│  Kubernetes RBAC & Network Policies                    │
├─────────────────────────────────────────────────────────┤
│  Application Security (Input validation, auth)         │
├─────────────────────────────────────────────────────────┤
│  Data Layer Security (Encryption, access control)      │
└─────────────────────────────────────────────────────────┘
```

---

## Application Security

### Input Validation

#### Frontend

```typescript
// ✅ Validate inputs
const validateEmail = (email: string): boolean => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

const validatePhone = (phone: string): boolean => {
  const regex = /^\d{10}$/;
  return regex.test(phone);
};

// ✅ Sanitize outputs
const sanitizeHTML = (html: string): string => {
  const div = document.createElement('div');
  div.textContent = html;
  return div.innerHTML;
};
```

#### Backend

```php
// ✅ Validate all inputs
$request->validate([
    'email' => 'required|email|max:255',
    'phone' => 'required|regex:/^\d{10}$/',
    'quantity' => 'required|integer|min:1|max:100',
]);

// ✅ Use parameterized queries (Eloquent does this automatically)
$product = Product::where('id', $request->id)->first();

// ❌ NEVER use raw query strings
// $product = DB::select("SELECT * FROM products WHERE id = " . $request->id);
```

### Authentication & Authorization

#### Currently (Development)

```
Public API - no authentication
```

#### Production Setup (Recommended)

```bash
# Install Sanctum
php artisan install:api

# Create auth endpoints
php artisan make:controller Api/AuthController

# Protect routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/admin/products', [ProductController::class, 'store']);
    Route::put('/admin/products/{id}', [ProductController::class, 'update']);
    Route::delete('/admin/products/{id}', [ProductController::class, 'destroy']);
});
```

#### Kubernetes RBAC

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: app-role
  namespace: cloud-native-ecomerce-app
rules:
- apiGroups: [""]
  resources: ["configmaps", "secrets"]
  verbs: ["get", "list"]
- apiGroups: [""]
  resources: ["pods/logs"]
  verbs: ["get"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: app-rolebinding
  namespace: cloud-native-ecomerce-app
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: app-role
subjects:
- kind: ServiceAccount
  name: app-sa
  namespace: cloud-native-ecomerce-app
```

### API Security

#### Rate Limiting

```php
// middleware/ThrottleRequests.php
Route::middleware('throttle:60,1')->group(function () {
    Route::post('/api/orders', [OrderController::class, 'store']);
});
```

#### CORS Configuration

```php
// config/cors.php
'allowed_origins' => [
    'https://mxmobilz.com',
    'https://www.mxmobilz.com',
    'https://admin.mxmobilz.com',
],
'allowed_methods' => ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
'allowed_headers' => ['Content-Type', 'Authorization'],
'exposed_headers' => ['X-Total-Count'],
'max_age' => 86400,
```

#### HTTPS Only

```nginx
# nginx configuration
server {
    listen 80;
    server_name mxmobilz.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name mxmobilz.com;
    
    ssl_certificate /etc/ssl/certs/certificate.pem;
    ssl_certificate_key /etc/ssl/private/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
}
```

---

## Infrastructure Security

### AWS Security

#### VPC Configuration

```hcl
# Terraform: infra/module/vpc/main.tf

# ✅ Public subnets (only for NAT Gateway, Load Balancer)
# ✅ Private subnets (EKS nodes, RDS database)
# ✅ Security groups restrict traffic to what's needed
# ✅ NACLs for additional network layer protection
```

#### EKS Cluster Security

```hcl
# Cluster encryption
resource "aws_eks_cluster" "main" {
  encryption_config {
    provider {
      key_arn = aws_kms_key.eks.arn
    }
    resources = ["secrets"]
  }
}

# Endpoint protection
vpc_config {
  endpoint_private_access = true
  endpoint_public_access  = false  # Private only in production
  public_access_cidrs     = ["203.0.113.0/24"]  # Restrict to office IPs
}
```

#### RDS Database Security

```hcl
# Encryption at rest
storage_encrypted = true

# Encryption in transit
db_parameter_group {
  parameter {
    name  = "require_secure_transport"
    value = "1"
  }
}

# Multi-AZ for high availability
multi_az = true

# Backup configuration
backup_retention_period = 30
```

### Container Security

#### Base Images

```dockerfile
# ✅ Use verified, minimal base images
FROM php:8.3-fpm-bookworm
FROM nginx:1.25-alpine

# ✅ Scan images for vulnerabilities
# docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
#   aquasec/trivy image mxmobilz/api:latest

# ✅ Don't run as root
USER www-data
```

#### Image Scanning

```bash
# Scan before pushing to registry
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
  aquasec/trivy image --severity HIGH,CRITICAL \
  mxmobilz/api:v1.0.0

# Push only if no critical vulnerabilities
docker push mxmobilz/api:v1.0.0
```

#### Pod Security

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: backend
spec:
  securityContext:
    runAsNonRoot: true
    runAsUser: 33
    fsReadOnlyRootFilesystem: true
    capabilities:
      drop:
        - ALL
      add:
        - NET_BIND_SERVICE
  
  containers:
  - name: app
    securityContext:
      allowPrivilegeEscalation: false
      readOnlyRootFilesystem: true
    volumeMounts:
    - name: tmp
      mountPath: /tmp
    - name: var-run
      mountPath: /var/run
  
  volumes:
  - name: tmp
    emptyDir: {}
  - name: var-run
    emptyDir: {}
```

---

## Data Security

### Encryption at Rest

#### Database

```sql
-- MySQL 8 uses encrypted tables by default
-- Verify encryption:
SELECT table_schema, table_name, 
  IF(engine='InnoDB', 'Encrypted', 'Not Encrypted') as status
FROM information_schema.tables
WHERE table_schema = 'mxmobilz_db';
```

#### S3 State Files

```hcl
# Terraform backend encryption
terraform {
  backend "s3" {
    bucket         = "mxmobilz-terraform-state"
    encrypt        = true  # Enable encryption
    dynamodb_table = "terraform-locks"
  }
}
```

### Encryption in Transit

#### TLS/SSL Certificates

```bash
# Using cert-manager in Kubernetes
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# Create certificate issuer
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: admin@mxmobilz.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
```

#### Database Connections

```hcl
# RDS SSL/TLS enforcement
db_parameter_group {
  parameter {
    name  = "require_secure_transport"
    value = "1"
  }
  parameter {
    name  = "rds_aurora_mysql_log_error_verbosity"
    value = "2"
  }
}
```

### Data Access Control

#### Database User Permissions

```sql
-- Create restricted user for application
CREATE USER 'mxmobilz_app'@'%' IDENTIFIED BY 'strong_password';
GRANT SELECT, INSERT, UPDATE, DELETE ON mxmobilz_db.* TO 'mxmobilz_app'@'%';

-- Create read-only user for reports
CREATE USER 'mxmobilz_reader'@'%' IDENTIFIED BY 'strong_password';
GRANT SELECT ON mxmobilz_db.* TO 'mxmobilz_reader'@'%';

-- Create admin user (very restricted access)
CREATE USER 'mxmobilz_admin'@'127.0.0.1' IDENTIFIED BY 'very_strong_password';
GRANT ALL PRIVILEGES ON mxmobilz_db.* TO 'mxmobilz_admin'@'127.0.0.1';

-- Flush privileges
FLUSH PRIVILEGES;
```

---

## Access Control & IAM

### AWS IAM Policies

#### Least Privilege Example

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "EKSClusterAccess",
      "Effect": "Allow",
      "Action": [
        "eks:DescribeCluster",
        "eks:ListClusters"
      ],
      "Resource": "arn:aws:eks:us-east-1:123456789:cluster/mxmobilz-prod"
    },
    {
      "Sid": "AssumeEKSRole",
      "Effect": "Allow",
      "Action": "sts:AssumeRole",
      "Resource": "arn:aws:iam::123456789:role/eks-pod-execution-role"
    }
  ]
}
```

### Kubernetes RBAC

#### Developer Role

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: developer
  namespace: cloud-native-ecomerce-app
rules:
- apiGroups: ["apps"]
  resources: ["deployments", "statefulsets"]
  verbs: ["get", "list", "watch"]
- apiGroups: [""]
  resources: ["pods", "services"]
  verbs: ["get", "list"]
- apiGroups: [""]
  resources: ["pods/logs"]
  verbs: ["get"]
- apiGroups: [""]
  resources: ["configmaps"]
  verbs: ["get", "list"]
```

#### Admin Role

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: admin
rules:
- apiGroups: ["*"]
  resources: ["*"]
  verbs: ["*"]
```

---

## Network Security

### Network Policies

#### Deny All Ingress (Default)

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-ingress
  namespace: cloud-native-ecomerce-app
spec:
  podSelector: {}
  policyTypes:
  - Ingress
```

#### Allow Specific Traffic

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: backend-policy
  namespace: cloud-native-ecomerce-app
spec:
  podSelector:
    matchLabels:
      app: backend
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: ingress-nginx
    ports:
    - protocol: TCP
      port: 8000
  egress:
  - to:
    - podSelector:
        matchLabels:
          app: mysql
    ports:
    - protocol: TCP
      port: 3306
  - to:
    - namespaceSelector: {}
    ports:
    - protocol: TCP
      port: 53  # DNS
```

### Security Groups

```hcl
# Terraform configuration
resource "aws_security_group" "alb" {
  name = "mxmobilz-alb"
  
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]  # HTTPS only in production
  }
  
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "rds" {
  name = "mxmobilz-rds"
  
  ingress {
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.eks_nodes.id]
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}
```

---

## Secrets Management

### AWS Secrets Manager

#### Store Secrets

```bash
# Store database password
aws secretsmanager create-secret \
  --name mxmobilz/db/password \
  --secret-string '{"username":"admin","password":"securepassword"}'

# Store API keys
aws secretsmanager create-secret \
  --name mxmobilz/api-keys \
  --secret-string '{"stripe_key":"sk_live_xxx","sendgrid_key":"SG.xxx"}'
```

#### Retrieve in Application

```php
// Laravel configuration
'database' => [
    'default' => 'mysql',
    'connections' => [
        'mysql' => [
            'host' => env('DB_HOST'),
            'database' => env('DB_DATABASE'),
            'username' => env('DB_USERNAME'),
            'password' => env('DB_PASSWORD'),
        ],
    ],
],

// Use AWS Secrets Manager
$secret = json_decode(
    aws_secrets_manager_get('mxmobilz/db/password'),
    true
);
```

#### Kubernetes Secrets

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: db-credentials
  namespace: cloud-native-ecomerce-app
type: Opaque
stringData:
  username: mxmobilz_app
  password: strong_password
  host: mxmobilz-prod-mysql.xxxxx.rds.amazonaws.com

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
spec:
  template:
    spec:
      containers:
      - name: app
        env:
        - name: DB_HOST
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: host
        - name: DB_USERNAME
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: username
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: password
```

### Environment Variables

```bash
# ✅ SECURE
export DB_PASSWORD="$(aws secretsmanager get-secret-value --secret-id mxmobilz/db/password | jq -r '.SecretString')"

# ❌ INSECURE
export DB_PASSWORD="hardcoded_password"
git add .env  # Never commit secrets!
```

---

## Compliance & Auditing

### Audit Logging

#### AWS CloudTrail

```bash
# Enable CloudTrail logging
aws cloudtrail create-trail \
  --name mxmobilz-audit \
  --s3-bucket-name mxmobilz-cloudtrail-logs

aws cloudtrail start-logging --trail-name mxmobilz-audit

# Query audit logs
aws cloudtrail lookup-events \
  --lookup-attributes AttributeKey=ResourceType,AttributeValue=AWS::ECS::Cluster
```

#### Kubernetes Audit Logs

```yaml
apiVersion: audit.k8s.io/v1
kind: Policy
rules:
- level: RequestResponse
  verbs: ["create", "delete", "update", "patch"]
  resources: ["deployments", "statefulsets", "secrets"]
  
- level: Metadata
  verbs: ["get", "list", "watch"]
  
- level: None
  verbs: ["get"]
  resources: ["pods/log"]
```

#### Application Logging

```php
// Laravel logging
Log::channel('security')->warning('Failed login attempt', [
    'email' => $email,
    'ip' => request()->ip(),
    'timestamp' => now(),
]);

Log::channel('audit')->info('Admin created product', [
    'admin_id' => auth()->id(),
    'product_id' => $product->id,
    'action' => 'create',
    'timestamp' => now(),
]);
```

### Compliance Frameworks

#### GDPR Compliance

```php
// Data retention policy
Route::delete('/api/users/{id}', function ($id) {
    // Delete user data
    User::destroy($id);
    
    // Log deletion (for compliance)
    Log::channel('compliance')->info('User data deleted', [
        'user_id' => $id,
        'deleted_at' => now(),
    ]);
});

// Data export (right to access)
Route::get('/api/users/{id}/export', function ($id) {
    $user = User::find($id);
    return response()->json($user->toArray(), 200, [
        'Content-Disposition' => 'attachment; filename="user_data.json"',
    ]);
});
```

#### PCI DSS Compliance (for payment processing)

```
❌ Store credit card data yourself
✅ Use payment gateway (Stripe, PayPal)
✅ Store only payment processor token
✅ Use TLS for all communications
✅ Implement PCI compliance checklist
```

---

## Security Incident Response

### Incident Response Plan

#### 1. Detect

```bash
# Monitor CloudWatch alarms
aws cloudwatch describe-alarms --alarm-names security-violations

# Check logs
aws logs tail /aws/eks/mxmobilz-prod/cluster --follow
```

#### 2. Respond

```bash
# Immediately revoke compromised credentials
aws iam delete-access-key --access-key-id AKIAIOSFODNN7EXAMPLE

# Rotate secrets
aws secretsmanager rotate-secret --secret-id mxmobilz/db/password

# Block malicious IP
aws ec2 authorize-security-group-ingress \
  --group-id sg-123456 \
  --ip-permissions IpProtocol=tcp,FromPort=0,ToPort=65535,IpRanges='[{IpCidr=203.0.113.1/32}]'
```

#### 3. Investigate

```bash
# View CloudTrail logs
aws cloudtrail lookup-events --start-time 2026-09-01

# Check pod logs
kubectl logs <compromised-pod> --previous

# Network traffic analysis
kubectl exec <pod> -- tcpdump -i eth0
```

#### 4. Recover

```bash
# Rollback to previous version
kubectl rollout undo deployment/backend

# Restore from backup
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier mxmobilz-restored
```

#### 5. Document

```markdown
# Incident Report

**Date:** 2026-09-02  
**Severity:** High  
**Impact:** API unavailable for 30 minutes  

## Root Cause
SQL injection vulnerability in search endpoint

## Timeline
- 10:00 AM: Alert triggered
- 10:05 AM: Incident confirmed
- 10:15 AM: Hotfix deployed
- 10:30 AM: Service restored

## Actions Taken
- Patched vulnerability
- Rotated database credentials
- Reviewed logs for exploitation
- Updated WAF rules

## Prevention
- Added input validation
- Implemented rate limiting
- Enabled query logging
```

---

## Security Checklist

### Before Production Deployment

- [ ] Enable HTTPS/TLS with valid certificate
- [ ] Configure CORS to specific domains only
- [ ] Set up authentication (Sanctum, OAuth)
- [ ] Enable rate limiting
- [ ] Implement input validation
- [ ] Use parameterized queries
- [ ] Enable database encryption
- [ ] Set up database backups
- [ ] Configure IAM roles (least privilege)
- [ ] Set up CloudTrail logging
- [ ] Enable EKS audit logging
- [ ] Configure security groups
- [ ] Deploy network policies
- [ ] Scan container images
- [ ] Rotate secrets
- [ ] Set up monitoring/alerts
- [ ] Enable pod security policies
- [ ] Test disaster recovery
- [ ] Review code for vulnerabilities
- [ ] Document security procedures

### Ongoing Security

- [ ] Regular vulnerability scans (weekly)
- [ ] Dependency updates (monthly)
- [ ] Security patch management (critical: within 24h)
- [ ] Access review (quarterly)
- [ ] Penetration testing (annually)
- [ ] Disaster recovery drills (quarterly)
- [ ] Security training (annually)
- [ ] Audit log review (monthly)
- [ ] Backup restoration tests (quarterly)
- [ ] Security policy updates (as needed)

---

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [AWS Security Best Practices](https://aws.amazon.com/architecture/security-identity-compliance/)
- [Kubernetes Security Documentation](https://kubernetes.io/docs/concepts/security/)
- [Laravel Security](https://laravel.com/docs/10.x/security)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)

---

**Last Updated:** September 2, 2026  
**Status:** Production Ready
