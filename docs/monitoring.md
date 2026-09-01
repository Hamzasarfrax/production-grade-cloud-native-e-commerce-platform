
# Monitoring, Logging & Observability

> **⚠️ Status banner (2026-09-01):** setup guide for stacks that are **not running** anywhere today (no CloudWatch targets — Terraform never applied; no Prometheus/Grafana deployment). Commands below are the intended path, documented but unexecuted.

## Overview

This guide covers the complete monitoring and observability strategy for Mxmobilz, including CloudWatch setup, Prometheus integration, alerting, and dashboarding.

## Table of Contents

1. [Observability Pillars](#observability-pillars)
2. [CloudWatch Integration](#cloudwatch-integration)
3. [Application Logging](#application-logging)
4. [Metrics & Monitoring](#metrics--monitoring)
5. [Prometheus Setup](#prometheus-setup)
6. [Alerting Strategy](#alerting-strategy)
7. [Dashboards](#dashboards)
8. [Log Analysis](#log-analysis)

---

## Observability Pillars

```
               Observability
            /      |      \
           /       |       \
      Logs     Metrics    Traces
       │          │          │
       ▼          ▼          ▼
   Events    Numbers    Sequences
 (What?)     (How?)     (Why?)
```

### Logs
**Purpose:** Detailed event recording  
**What:** Application events, errors, user actions  
**Where:** CloudWatch Logs, application logs  
**Query Tool:** CloudWatch Insights, grep, ELK

### Metrics
**Purpose:** Numerical measurements  
**What:** CPU, memory, latency, request count  
**Where:** CloudWatch, Prometheus  
**Query Tool:** CloudWatch Metrics, Grafana

### Traces
**Purpose:** Request flow tracking  
**What:** Request paths through system  
**Where:** AWS X-Ray, Jaeger (future)  
**Query Tool:** X-Ray service map

---

## CloudWatch Integration

### EKS Cluster Logging

#### Enable Cluster Logs

```bash
# Enable cluster logs via Terraform
# See: infra/module/eks/main.tf

# Verify logs are being collected
aws logs describe-log-groups --query 'logGroups[?contains(logGroupName, `/aws/eks/`)]'
```

#### Query Cluster Logs

```bash
# View logs in real-time
aws logs tail /aws/eks/mxmobilz-prod/cluster --follow

# Search for errors
aws logs filter-log-events \
  --log-group-name /aws/eks/mxmobilz-prod/cluster \
  --filter-pattern "ERROR" \
  --start-time $(date -d '1 hour ago' +%s)000
```

### RDS Logging

#### Configure RDS Logs

```bash
# Slow query logs
aws rds modify-db-instance \
  --db-instance-identifier mxmobilz-prod-mysql \
  --enable-cloudwatch-logs-exports slowquery

# Error logs
aws rds modify-db-instance \
  --db-instance-identifier mxmobilz-prod-mysql \
  --enable-cloudwatch-logs-exports error

# General logs (high volume, use sparingly)
aws rds modify-db-instance \
  --db-instance-identifier mxmobilz-prod-mysql \
  --enable-cloudwatch-logs-exports general
```

#### Query RDS Logs

```bash
# View slow queries
aws logs tail /aws/rds/mxmobilz-prod/slowquery --follow

# Find slow queries in last hour
aws logs filter-log-events \
  --log-group-name /aws/rds/mxmobilz-prod/slowquery \
  --start-time $(date -d '1 hour ago' +%s)000
```

---

## Application Logging

### Laravel Application Logging

```php
// backend/routes/api.php - Add logging to endpoints
Log::info('API Request', [
    'endpoint' => request()->path(),
    'method' => request()->method(),
    'user_id' => auth()->id(),
]);
```

### Frontend Logging

```typescript
// frontend/src/App.tsx
console.log('Application started');
console.error('Error occurred', error);
```

---

## Metrics & Monitoring

### Key Metrics to Monitor

```
Application Metrics
├─ Request Rate (requests/sec)
├─ Response Time (latency)
├─ Error Rate (% failed requests)
└─ Active Connections

Infrastructure Metrics
├─ CPU Utilization (%)
├─ Memory Usage (MB)
├─ Disk Usage (%)
└─ Pod Restart Count

Database Metrics
├─ Query Count
├─ Connection Count
└─ Disk Space Usage
```

---

## Prometheus Setup

### Install Prometheus Stack

```bash
# Add Helm repository
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

# Install kube-prometheus-stack
helm install monitoring prometheus-community/kube-prometheus-stack \
  -n monitoring \
  --create-namespace

# Verify installation
kubectl get pods -n monitoring

# Access Prometheus
kubectl port-forward \
  -n monitoring \
  svc/monitoring-prometheus \
  9090:9090 &
# Visit: http://localhost:9090

# Access Grafana
kubectl port-forward \
  -n monitoring \
  svc/monitoring-grafana \
  3000:80 &

# Get Grafana admin password
kubectl get secret monitoring-grafana \
  -n monitoring \
  -o jsonpath="{.data.admin-password}" | base64 -d && echo
```

---

## Alerting Strategy

### Alert Priorities

```
SEV 1: Critical (Page on-call immediately)
- Service down (all users affected)
- Database unavailable
- Cluster unhealthy

SEV 2: High (Create incident, investigate)
- High error rate (> 5%)
- High latency (> 2 seconds)
- High CPU (> 80%)

SEV 3: Medium (Log notification)
- Pod restarts
- Disk nearly full
- Memory pressure

SEV 4: Low (Dashboard only)
- Deprecated API usage
- Slow query detected
```

### CloudWatch Alarms

```bash
# Create critical alert for API down
aws cloudwatch put-metric-alarm \
  --alarm-name mxmobilz-api-down \
  --alarm-description "API returning 5xx errors" \
  --metric-name HTTPServerErrors \
  --namespace AWS/ApplicationELB \
  --statistic Sum \
  --period 60 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2

# Create alert for database down
aws cloudwatch put-metric-alarm \
  --alarm-name mxmobilz-database-down \
  --alarm-description "Database connections = 0" \
  --metric-name DatabaseConnections \
  --namespace AWS/RDS \
  --statistic Average \
  --period 60 \
  --threshold 0 \
  --comparison-operator LessThanThreshold
```

---

## Dashboards

### Kubernetes Dashboard

```bash
# Install Kubernetes Dashboard
kubectl apply -f https://raw.githubusercontent.com/kubernetes/dashboard/v2.7.0/aio/deploy/recommended.yaml

# Access via proxy
kubectl proxy
# Visit: http://localhost:8001/api/v1/namespaces/kubernetes-dashboard/services/https:kubernetes-dashboard:/proxy/
```

---

## Log Analysis

### CloudWatch Insights Queries

```
# Find error rate by endpoint
fields @timestamp, httpMethod, resourcePath, statusCode
| filter statusCode >= 400
| stats count() as errors by resourcePath

# Find slowest queries
fields @duration
| filter @duration > 1
| sort @duration desc

# Find top errors
fields @message
| filter @message like /error/
| stats count() by @message
| sort count() desc
```

---

**Last Updated:** September 2, 2026  
**Status:** Production Ready