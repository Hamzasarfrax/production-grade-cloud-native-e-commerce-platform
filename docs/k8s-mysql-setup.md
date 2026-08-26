# MySQL in Kubernetes — Complete Setup Guide

## Issues Found (Before Fix)

### Issue 1: No MySQL Deployment/StatefulSet
- **File:** `k8s/mysql/mysql-values.yaml` — sirf Bitnami Helm chart values tha
- **Problem:** Actual Kubernetes StatefulSet/Deployment manifest nahi tha
- **Fix:** `k8s/mysql/statefulset.yaml` create kiya with proper StatefulSet + headless Service

### Issue 2: Backend Missing DB Environment Variables
- **File:** `k8s/backend/backend-helm/templates/deployment.yaml`
- **Problem:** `env:` section missing tha — Laravel ko `DB_HOST`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD` nahi mil rahe the
- **Fix:** `env:` section add kiya with secretKeyRef for credentials

### Issue 3: Secret Incomplete
- **File:** `k8s/mysql/mysql-secret.yaml`
- **Problem:** Sirf `mysql-root-password` aur `mysql-password` tha — database name aur username missing
- **Fix:** `mysql-database` aur `mysql-username` keys add ki

### Issue 4: Frontend Deployment Missing
- **File:** `k8s/frontend/` folder mein sirf configmap tha, actual deployment nahi
- **Problem:** Frontend pods deploy nahi ho sakte the
- **Fix:** `k8s/frontend/frontend-deployment.yaml` create kiya with nginx + backend URL

### Issue 5: Backend Service Missing
- **File:** `k8s/backend/` folder mein Helm chart tha but standalone service nahi
- **Fix:** `k8s/backend/backend-service.yaml` create kiya for direct access

---

## Files Changed/Created

| File | Action | Purpose |
|---|---|---|
| `k8s/mysql/statefulset.yaml` | **Created** | MySQL StatefulSet + headless Service |
| `k8s/mysql/mysql-secret.yaml` | **Updated** | Added database + username keys |
| `k8s/backend/backend-helm/templates/deployment.yaml` | **Updated** | Added DB env vars |
| `k8s/frontend/frontend-deployment.yaml` | **Created** | Frontend Deployment + Service |
| `k8s/backend/backend-service.yaml` | **Created** | Backend ClusterIP Service |

---

## Architecture Diagram

```
                    Internet
                       |
                    [Ingress]
                    /       \
        [Frontend Service]  [Backend Service]
            /                      \
    [Frontend Pods]          [Backend Pods]
    (nginx:80)              (php-fpm:8000)
                                    |
                              [MySQL Service]
                                    |
                              [MySQL Pod]
                              (mysql:3306)
```

---

## Deployment Order (Step-by-Step)

```bash
# Step 1: Create Kind cluster
kind create cluster --config k8s/kind.yaml

# Step 2: Create namespace
kubectl apply -f k8s/namespace.yaml

# Step 3: Create secret (database credentials)
kubectl apply -f k8s/mysql/mysql-secret.yaml

# Step 4: Deploy MySQL
kubectl apply -f k8s/mysql/statefulset.yaml

# Step 5: Wait for MySQL to be ready
kubectl get pods -n cloud-native-ecomerce-app -w
# Wait till mysql-0 shows "Running" and "1/1"

# Step 6: Deploy Backend (via Helm)
cd k8s/backend/backend-helm
helm install backend . -n cloud-native-ecomerce-app

# Step 7: Deploy Frontend
kubectl apply -f k8s/frontend/frontend-deployment.yaml

# Step 8: Verify everything
kubectl get all -n cloud-native-ecomerce-app
```

---

## How to Verify

```bash
# Check MySQL is running
kubectl get pods -n cloud-native-ecomerce-app
# Should show: mysql-0 (Running), backend-helm-xxx (Running), frontend-xxx (Running)

# Test MySQL connection from backend pod
kubectl exec -it <backend-pod-name> -n cloud-native-ecomerce-app -- \
  php -r 'new PDO("mysql:host=mysql;dbname=ecommerce", "ecommerce", "ecommerce-dev-password"); echo "Connected!";'

# Check backend logs
kubectl logs <backend-pod-name> -n cloud-native-ecomerce-app

# Check MySQL logs
kubectl logs mysql-0 -n cloud-native-ecomerce-app
```

---

## Production Market Approaches

### Approach 1: Managed Database (Cloud Provider) — MOST COMMON

**Examples:** AWS RDS, Azure MySQL, Google Cloud SQL

- MySQL server K8s ke BAHAR hota hai
- Backend pods sirf connection string use karte hain
- **Best practice** — production mein 90% companies yeh karti hain

**Kyun use karte hain:**
- Backup, scaling, patching sab cloud manage karta hai
- Multi-AZ (high availability) built-in
- Automated failover
- Point-in-time recovery

**Pros:** Zero ops, automated backups, multi-AZ
**Cons:** Cost, vendor lock-in

**Example Config:**
```yaml
env:
  - name: DB_HOST
    value: "mydb.cluster-xxx.us-east-1.rds.amazonaws.com"
  - name: DB_DATABASE
    value: "ecommerce"
```

---

### Approach 2: Bitnami/Operator Helm Chart — SELF-MANAGED K8s

**Examples:** Bitnami MySQL Helm, Oracle MySQL Operator

- MySQL K8s ke ANDAR chalta hai (StatefulSet)
- Tumhare project mein yeh approach hai

**Kyun use karte hain:**
- Full control over MySQL configuration
- K8s native — same namespace, same monitoring
- No vendor lock-in
- Cost effective (no RDS charges)

**Pros:** Full control, K8s native, portable
**Cons:** Backup/DR tumhe handle karna, upgrade manually

**Example Config:**
```bash
helm install mysql bitnami/mysql -f mysql-values.yaml -n cloud-native-ecomerce-app
```

---

### Approach 3: Database Operator — ENTERPRISE K8s

**Examples:** Percona XtraDB Operator, Vitess (YouTube scale), CloudNativePG

- Operator custom controller hai jo MySQL lifecycle manage karta hai
- Auto-failover, replication, backup, restore — sab automate
- Large scale productions mein use hota hai

**Kyun use karte hain:**
- Automated operations
- Replication built-in
- Point-in-time recovery
- Automated backups

**Pros:** Automated operations, replication built-in
**Cons:** Complex setup, learning curve

**Example Config:**
```yaml
apiVersion: mysql.percona.com/v1alpha1
kind: PerconaXtraDBCluster
metadata:
  name: mysql-cluster
spec:
  mysql:
    size: 3
  orchestrator:
    size: 3
  pxc:
    size: 3
```

---

### Approach 4: External Service (Pod-to-External)

**Examples:** ExternalName Service, headless Service pointing to VM

- MySQL bahar hai (VM/RDS), K8s sirf pods chalata hai
- K8s mein Service type `ExternalName` se external DB point karo

**Kyun use karte hain:**
- Simplest approach for small teams
- No MySQL ops in K8s at all
- Easy migration from VM to K8s

**Pros:** No MySQL ops in K8s at all
**Cons:** Network latency, single point of failure

**Example Config:**
```yaml
apiVersion: v1
kind: Service
metadata:
  name: mysql-external
spec:
  type: ExternalName
  externalName: mysql.internal.company.com
```

---

## Comparison Table

| Approach | Kahan MySQL | Scaling | Backup | Complexity | Cost | Best For |
|---|---|---|---|---|---|---|
| **Managed (RDS)** | Cloud mein | Auto | Auto | Low | High | Startups, Small teams |
| **Helm Chart** | K8s andar | Manual PVC | Manual | Medium | Low | Learning, Dev |
| **Operator** | K8s andar | Auto | Auto | High | Low | Enterprise, Scale |
| **External Service** | Bahar (VM) | Bahar se | Bahar se | Lowest | Medium | Migration |

---

## Market Statistics (General Practice)

```
Startup/Small team  → Managed DB (RDS/Aurora)      — 70%
Mid-size            → Managed + some self-managed    — 20%
Enterprise/Scale    → Operators (Vitess, Percona)    — 10%
```

---

## Tere Project Ke Liye Recommendation

```
Development/learning → Tera current approach (StatefulSet) sahi hai
Production           → RDS/Aurora use karo, K8s mein mat chalao
```

**Key Points:**
1. K8s mein MySQL chalana **possible** hai but **recommended nahi** production ke liye
2. Managed DB (RDS) use karo agar production hai — less ops, more reliability
3. StatefulSet use karo agar learning/development hai
4. Operator use karo agar large scale hai aur team hai operations ke liye
