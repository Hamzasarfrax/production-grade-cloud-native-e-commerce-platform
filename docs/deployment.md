# Deployment Strategies & Procedures

## Overview

This guide covers deployment strategies for Mxmobilz across different environments (local, staging, production) with emphasis on automation, reliability, and best practices.

## Table of Contents

1. [Local Development Deployment](#local-development-deployment)
2. [Container Registry & Image Management](#container-registry--image-management)
3. [Staging Deployment](#staging-deployment)
4. [Production Deployment](#production-deployment)
5. [Rolling Updates & Blue-Green Deployments](#rolling-updates--blue-green-deployments)
6. [Rollback Procedures](#rollback-procedures)
7. [Database Migrations](#database-migrations)
8. [Zero-Downtime Deployments](#zero-downtime-deployments)

---

## Local Development Deployment

### Quick Start

```bash
# Single command deployment
docker compose up --build

# Expected output:
# - MySQL database created and seeded
# - Laravel migrations auto-run
# - API starts on :8000
# - Frontend dev server on :3000
```

### Manual Setup

```bash
# 1. Database
mysql -u root -p < setup.sql

# 2. Backend
cd backend
composer install
php artisan migrate --seed
php artisan serve

# 3. Frontend
cd frontend
npm install
npm run dev
```

### Development Workflow

```bash
# Watch for changes (hot reload enabled)
frontend: npm run dev      # Vite with HMR
backend:  php artisan serve  # PHP dev server with reload

# Run tests
frontend: npm run test
backend:  php artisan test

# Format code
frontend: npm run lint
backend:  vendor/bin/pint
```

---

## Container Registry & Image Management

### Building Images

#### Frontend Image (Nginx)

```bash
cd frontend
docker build -t mxmobilz/web:latest -f Dockerfile .

# Multi-stage build: Node builder → Nginx alpine
# Result: ~95MB image
```

#### Backend Image (PHP-FPM)

```bash
cd backend
docker build -t mxmobilz/api:latest -f Dockerfile .

# Multi-stage build: Composer deps → PHP-FPM base
# Result: ~767MB image (optimized)
```

### Pushing to Registry

#### Docker Hub

```bash
# Tag images
docker tag mxmobilz/web:latest yourusername/mxmobilz-web:latest
docker tag mxmobilz/api:latest yourusername/mxmobilz-api:latest

# Push
docker login
docker push yourusername/mxmobilz-web:latest
docker push yourusername/mxmobilz-api:latest
```

#### AWS ECR

```bash
# Create repositories
aws ecr create-repository --repository-name mxmobilz/web --region us-east-1
aws ecr create-repository --repository-name mxmobilz/api --region us-east-1

# Login
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin 123456789.dkr.ecr.us-east-1.amazonaws.com

# Tag and push
docker tag mxmobilz/web:latest 123456789.dkr.ecr.us-east-1.amazonaws.com/mxmobilz/web:latest
docker push 123456789.dkr.ecr.us-east-1.amazonaws.com/mxmobilz/web:latest
```

### Versioning Strategy

Use semantic versioning with Git tags:

```bash
# Tag release
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0

# Build and push with version
docker build -t mxmobilz/web:v1.0.0 -f frontend/Dockerfile frontend/
docker push mxmobilz/web:v1.0.0
```

---

## Staging Deployment

### Prerequisites

1. AWS EKS cluster (created via Terraform)
2. Database credentials in AWS Secrets Manager
3. Docker images pushed to ECR
4. ArgoCD installed and configured

### Step 1: Prepare Infrastructure

```bash
cd infra/env/stag
terraform init
terraform plan
terraform apply
```

### Step 2: Deploy via ArgoCD

```bash
# Create ArgoCD application
kubectl apply -f gitops/argocd/applications/mxmobilz-staging.yaml

# Monitor deployment
kubectl get applications -n argocd
argocd app list

# Sync application
argocd app sync mxmobilz-staging
```

### Step 3: Verify Deployment

```bash
# Check pods
kubectl get pods -n cloud-native-ecomerce-app

# Check services
kubectl get svc -n cloud-native-ecomerce-app

# Check ingress
kubectl get ingress -n cloud-native-ecomerce-app

# Get ingress IP
INGRESS_IP=$(kubectl get ingress -n cloud-native-ecomerce-app -o jsonpath='{.items[0].status.loadBalancer.ingress[0].hostname}')
echo "Access at: http://$INGRESS_IP"

# Test API
curl http://$INGRESS_IP/api/health
```

### Step 4: Run Smoke Tests

```bash
# Check API endpoints
curl -s http://$INGRESS_IP/api/products | jq .
curl -s http://$INGRESS_IP/api/stats | jq .

# Check database connectivity
kubectl run -it --rm debug --image=mysql:8.0 -- \
  mysql -h $DB_HOST -u admin -p$DB_PASS -e "SELECT COUNT(*) FROM products;"
```

---

## Production Deployment

### Prerequisites Checklist

- [ ] All tests passing in CI/CD
- [ ] Code reviewed and approved
- [ ] Database backups taken
- [ ] Runbook prepared
- [ ] Team notified
- [ ] Monitoring/alerts configured
- [ ] Rollback plan ready

### Deployment Process

#### 1. Infrastructure

```bash
cd infra/env/prod
terraform init
terraform plan -out=tfplan
terraform apply tfplan

# Output includes:
# - EKS cluster ID
# - RDS endpoint
# - Database credentials (in Secrets Manager)
```

#### 2. Database Preparation

```bash
# Get database credentials
SECRET_ID=$(terraform output -raw rds_password_secret_id)
aws secretsmanager get-secret-value --secret-id $SECRET_ID

# Run migrations
kubectl run -it --rm migrator --image=mxmobilz/api:v1.0.0 -- \
  php artisan migrate --force

# Verify migration
kubectl logs -f job/db-migration
```

#### 3. Application Deployment

```bash
# Create/update ArgoCD application
kubectl apply -f gitops/argocd/applications/mxmobilz-prod.yaml

# Monitor deployment (watch real-time)
argocd app watch mxmobilz-prod

# Wait for rollout to complete
kubectl rollout status deployment/backend -n cloud-native-ecomerce-app
kubectl rollout status deployment/frontend -n cloud-native-ecomerce-app
```

#### 4. Health Checks

```bash
# API health
curl -s https://api.mxmobilz.com/api/health | jq .

# Check pod logs
kubectl logs -f deployment/backend -n cloud-native-ecomerce-app

# Check application metrics
# (via CloudWatch or Prometheus)
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name CPUUtilization \
  --start-time $(date -u -d '10 minutes ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average
```

#### 5. Smoke Tests

```bash
# Run test suite against production
npm run test:e2e -- --baseUrl=https://mxmobilz.com

# Manual checks
- Check homepage loads
- Browse products
- Check admin dashboard
- Place test order
- Verify confirmation email
```

---

## Rolling Updates & Blue-Green Deployments

### Rolling Update (Default)

```yaml
# In Kubernetes deployment spec
spec:
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
```

**Behavior:**
- One new pod starts while old pod runs
- Ensures zero downtime
- Old traffic gradually shifts to new version
- Automatic rollback if health checks fail

```bash
# Monitor rolling update
kubectl rollout status deployment/backend

# Watch progress in real-time
kubectl get pods -w
```

### Blue-Green Deployment

For critical updates, use blue-green:

```bash
# 1. Deploy new version (green) alongside current (blue)
kubectl set image deployment/backend \
  backend=mxmobilz/api:v1.1.0 \
  --record

# 2. Switch traffic once green is healthy
kubectl patch service backend -p '{"spec":{"selector":{"version":"green"}}}'

# 3. Keep blue running for quick rollback
# 4. Delete blue after stability confirmed
```

---

## Rollback Procedures

### Automatic Rollback (Health Checks)

Kubernetes automatically rolls back if health checks fail:

```yaml
livenessProbe:
  httpGet:
    path: /api/health
    port: 8000
  initialDelaySeconds: 30
  periodSeconds: 10
  failureThreshold: 3
```

### Manual Rollback

```bash
# View rollout history
kubectl rollout history deployment/backend

# Rollback to previous version
kubectl rollout undo deployment/backend

# Rollback to specific revision
kubectl rollout undo deployment/backend --to-revision=3

# Verify rollback
kubectl rollout status deployment/backend
```

### ArgoCD Rollback

```bash
# List all revisions
argocd app history mxmobilz-prod

# Rollback to previous sync
argocd app rollback mxmobilz-prod 1

# Verify
argocd app info mxmobilz-prod
```

---

## Database Migrations

### Pre-Deployment

```bash
# 1. Backup current database
aws rds create-db-snapshot \
  --db-instance-identifier mxmobilz-prod-mysql \
  --db-snapshot-identifier mxmobilz-prod-backup-$(date +%Y%m%d-%H%M%S)

# 2. Test migration in staging
kubectl run -it --rm migrator --image=mxmobilz/api:v1.0.0 -- \
  php artisan migrate --env=staging

# 3. Verify data integrity
kubectl run -it --rm test --image=mysql:8.0 -- \
  mysql -h $STAGING_DB -e "SELECT COUNT(*) FROM users;"
```

### During Deployment

```bash
# 1. Enable maintenance mode (optional)
kubectl set env deployment/backend APP_MODE=maintenance

# 2. Run migration
kubectl run -it --rm migrator --image=mxmobilz/api:v1.0.0 -- \
  php artisan migrate --force

# 3. Monitor migration logs
kubectl logs -f job/db-migration

# 4. Exit maintenance mode
kubectl set env deployment/backend APP_MODE=production
```

### Rollback Migration

```bash
# 1. Restore from backup
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier mxmobilz-prod-mysql-restored \
  --db-snapshot-identifier mxmobilz-prod-backup-20260902-120000

# 2. Update connection in Kubernetes
kubectl set env deployment/backend \
  DB_HOST=mxmobilz-prod-mysql-restored.xxxxx.rds.amazonaws.com

# 3. Verify connection
kubectl logs deployment/backend
```

---

## Zero-Downtime Deployments

### Strategy

1. **Database changes**: Deploy backward-compatible migrations first
2. **API changes**: Keep old API endpoints alongside new ones
3. **Frontend changes**: Deploy feature flagged code
4. **Coordinated cutover**: Switch to new implementation after verification

### Implementation

#### Step 1: Backward-Compatible Database Migrations

```sql
-- ✅ SAFE: Add new column with default
ALTER TABLE users ADD COLUMN phone_number VARCHAR(20) DEFAULT '';

-- ❌ UNSAFE: Remove column (old code might reference it)
ALTER TABLE users DROP COLUMN status;
```

#### Step 2: Dual API Endpoints

```php
// Old endpoint (keep for compatibility)
Route::get('/api/v1/products', [ProductController::class, 'indexV1']);

// New endpoint (improved version)
Route::get('/api/v2/products', [ProductController::class, 'indexV2']);
```

#### Step 3: Feature Flags

```php
if (config('features.new_checkout_flow')) {
    // Use new checkout
    return new CheckoutV2();
} else {
    // Use old checkout
    return new CheckoutV1();
}
```

#### Step 4: Deployment

```bash
# 1. Deploy database migration
kubectl apply -f k8s/migrations.yaml
kubectl wait --for=condition=complete job/db-migration

# 2. Deploy new code (supporting both versions)
kubectl set image deployment/backend \
  backend=mxmobilz/api:v1.1.0

# 3. Enable new feature gradually
kubectl patch configmap app-config --type merge \
  -p '{"data":{"FEATURE_NEW_CHECKOUT":"true"}}'

# 4. Monitor metrics
kubectl top pods

# 5. After stability period, remove old code
kubectl set image deployment/backend \
  backend=mxmobilz/api:v1.2.0
```

---

## Deployment Checklist

Before deploying to production:

- [ ] All tests passing
- [ ] Code reviewed
- [ ] Database backup taken
- [ ] Migrations tested in staging
- [ ] Configuration updated
- [ ] Secrets rotated
- [ ] SSL certificates valid
- [ ] Monitoring enabled
- [ ] Alerting configured
- [ ] Runbook prepared
- [ ] Team notified
- [ ] Rollback procedure tested

---

## Post-Deployment

### Monitoring

```bash
# Watch metrics for 30 minutes
kubectl top pods -w
kubectl logs -f deployment/backend --tail=50

# Check application metrics
argocd app get mxmobilz-prod

# Monitor resource usage
kubectl describe nodes
```

### Verification

```bash
# API responses
curl -s https://api.mxmobilz.com/api/health | jq .

# Database queries
kubectl run -it --rm test --image=mysql:8.0 -- \
  mysql -h $DB_HOST -e "SELECT COUNT(*) FROM orders;"

# User-facing functionality
# - Visit homepage
# - Search products
# - Place order
# - Check admin dashboard
```

### Documentation

```bash
# Document deployment
# - Date and time
# - Version deployed
# - Changes made
# - Any issues encountered
# - Performance impact
# - Rollback actions (if any)
```

---

## Troubleshooting

### Pod CrashLoopBackOff

```bash
kubectl logs <pod-name> --previous
kubectl describe pod <pod-name>
kubectl logs <pod-name> | tail -50
```

### Database Connection Refused

```bash
# Check credentials
aws secretsmanager get-secret-value --secret-id <secret-id>

# Test from pod
kubectl run -it --rm test --image=mysql:8.0 -- \
  mysql -h $DB_HOST -u admin -p$DB_PASS -e "SELECT 1;"
```

### Slow Deployment

```bash
kubectl describe deployment backend
kubectl get events -n cloud-native-ecomerce-app --sort-by='.lastTimestamp'
```

---

## Best Practices

✅ **DO:**
- Always test in staging first
- Take database backups before migrations
- Use health checks for automatic rollback
- Monitor metrics during and after deployment
- Document all deployments
- Keep rollback procedures ready
- Use feature flags for gradual rollouts
- Implement proper logging

❌ **DON'T:**
- Deploy to production on Friday
- Skip monitoring after deployment
- Deploy breaking database changes
- Ignore test failures
- Remove old code immediately
- Deploy without backup
- Make untested configuration changes
- Rush critical deployments

---

## Additional Resources

- [Kubernetes Rolling Updates](https://kubernetes.io/docs/tutorials/kubernetes-basics/update/update-intro/)
- [GitOps Best Practices](https://opengitops.dev/)
- [Database Migration Strategies](https://www.liquibase.org/get-started/best-practices)
- [Zero-Downtime Deployment](https://martinfowler.com/bliki/BlueGreenDeployment.html)

---

**Last Updated:** September 2, 2026
