# Mxmobilz — GitOps Setup with ArgoCD (Source of Truth)

> Yeh document project ke **entire GitOps workflow** ka single source-of-truth hai.
> Iska maqsad: koi bhi naya person (ya interviewer) isse padh kar poora
> samajh jaye — **GitOps kyun**, **ArgoCD kaise setup hua**, **kaunse files** hain,
> **kaise deploy karna hai**, aur **kaise verify** karna hai.

---

## 1. The Big Picture — GitOps Kya Hai?

**GitOps** = "Git as the single source of truth for declarative infrastructure and applications."

| Traditional CI/CD | GitOps (ArgoCD) |
|---|---|
| Push-based (pipeline pushes to cluster) | Pull-based (cluster pulls from Git) |
| Drift detection: manual/difficult | Drift detection: automatic (continuous sync) |
| Rollback: pipeline re-run | Rollback: `git revert` + auto-sync |
| Audit trail: pipeline logs | Audit trail: Git history |
| Multi-env: separate pipelines | Multi-env: same manifests, different overlays |

### WHY ArgoCD:
- **Pull model** — cluster state always matches Git (no drift)
- **Declarative** — YAML in Git = desired state
- **Multi-cluster** — manage dev/staging/prod from one ArgoCD
- **RBAC** — projects, roles, teams
- **UI** — visual sync status, diff, history, rollback

---

## 2. Repository Structure

```
gitops/
├── argocd/
│   ├── projects/
│   │   └── mxmobilz-project.yaml      # AppProject: RBAC, destinations, whitelist
│   └── applications/
│       ├── root-application.yaml      # App of Apps (manages all env apps)
│       ├── dev-application.yaml       # Dev environment
│       ├── staging-application.yaml   # Staging environment
│       └── prod-application.yaml      # Production environment
├── base/                              # Common Kustomize base (all envs share)
│   ├── kustomization.yaml
│   ├── namespace.yaml
│   ├── mysql/
│   │   ├── kustomization.yaml
│   │   ├── mysql-stack.yaml           # StatefulSet + headless svc + PVC
│   │   └── mysql-secret.yaml          # Dev credentials (overridden per env)
│   ├── backend/
│   │   ├── Chart.yaml                 # Helm chart metadata
│   │   ├── values.yaml                # Default values (replicas=3, probes, etc)
│   │   └── templates/
│   │       ├── deployment.yaml        # nginx sidecar + FPM + init container
│   │       ├── service.yaml           # ClusterIP + NodePort
│   │       ├── nginx-configmap.yaml   # nginx fastcgi -> FPM config
│   │       ├── hpa.yaml               # HPA (conditional)
│   │       ├── serviceaccount.yaml
│   │       └── _helpers.tpl
│   ├── frontend/
│   │   ├── kustomization.yaml
│   │   └── frontend-deployment.yaml   # React nginx + ClusterIP svc
│   ├── ingress/
│   │   ├── kustomization.yaml
│   │   └── ingress.yaml               # L7 routing: / -> frontend, /api -> backend
│   ├── network-policies/
│   │   ├── kustomization.yaml
│   │   ├── backend-networkpolicy.yaml
│   │   ├── frontend-networkpolicy.yaml
│   │   └── mysql-networkpolicy.yaml
│   └── external-secrets/              # Optional: External Secrets Operator
│       ├── kustomization.yaml
│       └── externalsecret.yaml        # ExternalSecret + ClusterSecretStore
└── overlays/                          # Environment-specific patches
    ├── dev/
    │   └── kustomization.yaml         # replicas=1, debug log, dev secrets
    ├── staging/
    │   └── kustomization.yaml         # replicas=2, info log, staging secrets
    └── prod/
        └── kustomization.yaml         # replicas=5/3, warn log, prod secrets (CHANGE_ME)
```

### ⚠️ CRITICAL: All base subdirectories MUST be tracked in git
If any directory (e.g., `backend/`) is untracked, ArgoCD/kustomize will fail with:
```
lstat <path>/gitops/base/backend: no such file or directory
Error: accumulating resources from 'backend': evalsymlink failure
```
**Fix:** Ensure `gitops/base/backend/` (and all subfolders) are committed to the repository before deploying.

---

## 3. ArgoCD Project — `mxmobilz-project.yaml`

**WHAT:** `AppProject` defines:
- **Source repos** allowed (this GitHub repo)
- **Destination clusters/namespaces** (dev/staging/prod namespaces)
- **Resource whitelist** (what K8s kinds can be deployed)
- **Roles & RBAC** (admin, developer, viewer, ci-cd)

**Key config:**
```yaml
sourceRepos:
- 'https://github.com/Hamzasarfrax/production-grade-cloud-native-e-commerce-platform'

destinations:
- namespace: 'cloud-native-ecomerce-dev'
  server: https://kubernetes.default.svc
- namespace: 'cloud-native-ecomerce-staging'
  server: https://kubernetes.default.svc
- namespace: 'cloud-native-ecomerce-prod'
  server: https://kubernetes.default.svc
- namespace: 'cloud-native-ecomerce-app'  # legacy/Kind namespace
  server: https://kubernetes.default.svc

roles:
- name: admin
  policies:
  - p, proj:mxmobilz:admin, applications, *, mxmobilz/*, allow
  groups: ["mxmobilz-admins"]
- name: developer
  policies:
  - p, proj:mxmobilz:developer, applications, sync, mxmobilz/*, allow
  groups: ["mxmobilz-developers"]
- name: viewer
  policies:
  - p, proj:mxmobilz:viewer, applications, get, mxmobilz/*, allow
  groups: ["mxmobilz-viewers"]
- name: ci-cd
  policies:
  - p, proj:mxmobilz:ci-cd, applications, sync, mxmobilz/*, allow
  groups: ["mxmobilz-ci-cd"]
```

**WHY:** Production-grade RBAC — teams get least-privilege access per environment.

**⚠️ Important:** The `mxmobilz-root` application deploys to `namespace: argocd`. Ensure the project whitelists the `argocd` namespace (added `group: ''` `kind: Namespace` to `namespaceResourceWhitelist`), otherwise you'll get:
```
InvalidSpecError: Unable to generate manifests — destination server/namespace not allowed
```

---

## 4. ArgoCD Applications — App of Apps Pattern

### 4.1 Root Application (`root-application.yaml`)

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: mxmobilz-root
  namespace: argocd
  finalizers:
  - resources-finalizer.argocd.argoproj.io
  annotations:
    argocd.argoproj.io/sync-wave: "-10"
spec:
  project: mxmobilz
  source:
    repoURL: 'https://github.com/Hamzasarfrax/production-grade-cloud-native-e-commerce-platform'
    targetRevision: main
    path: gitops/argocd/applications
  destination:
    server: https://kubernetes.default.svc
    namespace: argocd
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
      allowEmpty: false
    syncOptions:
    - CreateNamespace=true
    - PruneLast=true
    retry:
      limit: 5
      backoff:
        duration: 5s
        factor: 2
        maxDuration: 3m
```

**WHAT:** "App of Apps" — ArgoCD manages this ONE application, which in turn creates/manages the dev/staging/prod applications.

**WHY:** Single entry point. Add new environment → add new Application YAML in `gitops/argocd/applications/` → ArgoCD auto-discovers (sync-wave -10 runs first).

**Sync waves:** Root app runs first (-10), then dev (0), staging (10), prod (20).

### 4.2 Environment Applications

| Application | Path | Namespace | Sync Wave |
|---|---|---|---|
| `mxmobilz-dev` | `gitops/overlays/dev` | `cloud-native-ecomerce-dev` | 0 |
| `mxmobilz-staging` | `gitops/overlays/staging` | `cloud-native-ecomerce-staging` | 10 |
| `mxmobilz-prod` | `gitops/overlays/prod` | `cloud-native-ecomerce-prod` | 20 |

**Prod-specific sync options:**
```yaml
syncOptions:
- CreateNamespace=true
- PruneLast=true
- RespectIgnoreDifferences=true  # Ignore diff on immutable fields (e.g., PVC size)
```

---

## 5. Kustomize Base + Overlays

### 5.1 Base (`gitops/base/kustomization.yaml`)

```yaml
resources:
- namespace.yaml
- mysql/
- backend/
- frontend/
- ingress/
- network-policies/
# - external-secrets/  # Enable after installing External Secrets Operator

commonLabels:
  app.kubernetes.io/part-of: mxmobilz
  app.kubernetes.io/managed-by: argocd
```

**All environments inherit this base.** Overlays only patch what's different.

### 5.2 Overlay Examples

**Dev (`gitops/overlays/dev/kustomization.yaml`):**
```yaml
namespace: cloud-native-ecomerce-dev
patches:
- backend replicas: 1
- frontend replicas: 1
- mysql replicas: 1
configMapGenerator:
- name: env-config
  literals:
  - ENVIRONMENT=development
  - LOG_LEVEL=debug
commonLabels:
  environment: dev
```

**Prod (`gitops/overlays/prod/kustomization.yaml`):**
```yaml
namespace: cloud-native-ecomerce-prod
patches:
- backend replicas: 5
- frontend replicas: 3
- mysql replicas: 1
- mysql-secret: CHANGE_ME_PROD_ROOT_PASSWORD (MUST CHANGE BEFORE DEPLOY)
- Service types: ClusterIP (no NodePort)
configMapGenerator:
- name: env-config
  literals:
  - ENVIRONMENT=production
  - LOG_LEVEL=warn
commonLabels:
  environment: prod
```

**WHY overlays:** DRY principle. Base = 90% same. Overlays = 10% different (replicas, secrets, log levels, resource limits).

---

## 6. How to Install ArgoCD (Bootstrap)

### Option A: Quick Install (Kind/Dev Cluster)

```bash
# 1. Create namespace
kubectl create namespace argocd

# 2. Install ArgoCD (stable)
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# 3. Wait for pods
kubectl wait --for=condition=Ready pods --all -n argocd --timeout=300s

# 4. Get admin password
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d

# 5. Port-forward UI
kubectl port-forward -n argocd svc/argocd-server 8080:443
# Open https://localhost:8080 (user: admin, password from step 4)
```

### Option B: Production Install (Helm)

```bash
helm repo add argo https://argoproj.github.io/argo-helm
helm repo update
helm install argocd argo/argo-cd -n argocd --create-namespace \
  --set server.service.type=LoadBalancer \
  --set configs.params."server\.insecure"=true \
  --set controller.resources.limits.cpu=1000m \
  --set controller.resources.limits.memory=1Gi
```

---

## 7. Bootstrap GitOps (One Command)

After ArgoCD is running, apply the root application:

```bash
# Apply the root App (creates dev/staging/prod apps automatically)
kubectl apply -f gitops/argocd/applications/root-application.yaml

# Verify
kubectl get applications -n argocd
# Should show: mxmobilz-root, mxmobilz-dev, mxmobilz-staging, mxmobilz-prod
```

**ArgoCD UI:** Click each app → **SYNC** → watch resources deploy.

---

## 8. Verify Deployment

### Check Application Status
```bash
# All apps synced?
kubectl get applications -n argocd

# Resources in each env
kubectl get all -n cloud-native-ecomerce-dev
kubectl get all -n cloud-native-ecomerce-staging
kubectl get all -n cloud-native-ecomerce-prod
```

### Check Pods
```bash
# Dev
kubectl get pods -n cloud-native-ecomerce-dev
# Expect: backend-x1, frontend-x1, mysql-x1

# Staging
kubectl get pods -n cloud-native-ecomerce-staging
# Expect: backend-x2, frontend-x2, mysql-x1

# Prod
kubectl get pods -n cloud-native-ecomerce-prod
# Expect: backend-x5, frontend-x3, mysql-x1
```

### Check Ingress (if ingress-nginx installed)
```bash
kubectl get ingress -n cloud-native-ecomerce-prod
# Access: http://mxmobilz.local/ (add to /etc/hosts)
```

### Check Network Policies
```bash
kubectl get networkpolicy -n cloud-native-ecomerce-prod
# Should show: backend-network-policy, frontend-network-policy, mysql-network-policy
```

---

## 9. Day-to-Day Operations

### Deploy Changes (GitOps Way)
```bash
# 1. Make changes to manifests (e.g., increase replicas in prod overlay)
vim gitops/overlays/prod/kustomization.yaml

# 2. Commit & push
git add gitops/overlays/prod/kustomization.yaml
git commit -m "prod: scale backend to 5 replicas"
git push origin main

# 3. ArgoCD auto-syncs (if automated) OR click SYNC in UI
# 4. Verify
kubectl get pods -n cloud-native-ecomerce-prod -l app.kubernetes.io/name=backend
```

### Rollback
```bash
# Option 1: Git revert (recommended)
git revert <commit-hash>
git push origin main
# ArgoCD auto-syncs to previous state

# Option 2: ArgoCD UI → History → Rollback to previous revision
```

### Add New Environment
1. Create `gitops/overlays/<env>/kustomization.yaml`
2. Create `gitops/argocd/applications/<env>-application.yaml` (copy from dev, change path/namespace/sync-wave)
3. Push to Git
4. ArgoCD root app auto-discovers (sync-wave) → new app appears → click SYNC

### Emergency Hotfix (bypass Git)
```bash
# NOT recommended for prod, but possible:
kubectl patch deployment backend-backend-helm -n cloud-native-ecomerce-prod -p '{"spec":{"replicas":10}}'
# ArgoCD will show "OutOfSync" → next Git push will reconcile
```

---

## 10. Secrets Management

### Current (Dev/Staging)
- **mysql-secret.yaml** in base has dev credentials
- Overlays patch the secret with env-specific values

### Production (TODO: External Secrets Operator)
```yaml
# gitops/base/external-secrets/externalsecret.yaml (already defined)
# Requires: External Secrets Operator + AWS SecretsManager / Vault
# Then uncomment in base/kustomization.yaml:
# - external-secrets/
```

**Production secret flow:**
1. Store secrets in AWS SecretsManager / HashiCorp Vault
2. Create `ClusterSecretStore` pointing to provider
3. `ExternalSecret` syncs to K8s `Secret` (mysql-app-secret, laravel-app-key)
4. Pods consume via `secretKeyRef` (no plaintext in Git)

---

## 11. Production Hardening Checklist (Post-GitOps)

| Area | Status | Action |
|---|---|---|
| **ArgoCD RBAC** | ✅ Done | Project + roles defined |
| **Network Policies** | ✅ Done | Default deny + explicit allow |
| **TLS/HTTPS** | ❌ Pending | cert-manager + Let's Encrypt on ingress |
| **Secrets** | ⚠️ Partial | External Secrets Operator needed |
| **HPA** | ⚠️ Disabled | Enable in values.yaml (`autoscaling.enabled: true`) |
| **Metrics/Monitoring** | ❌ Pending | Prometheus Operator + ServiceMonitors |
| **Backup/DR** | ❌ Pending | Velero for K8s resources + MySQL backup job |
| **Image Security** | ❌ Pending | Cosign signing, Kyverno admission policies |
| **Audit Logging** | ❌ Pending | ArgoCD audit logs + K8s audit policy |

---

## 12. Troubleshooting

### Application Stuck in "Progressing"
```bash
# Check application events
kubectl describe application mxmobilz-prod -n argocd

# Check pod events
kubectl describe pod <pod-name> -n cloud-native-ecomerce-prod
```

### Sync Fails — "Resource already exists"
```bash
# Force prune (careful!)
argocd app sync mxmobilz-prod --prune --force

# Or delete conflicting resource manually, then sync
```

### Drift Detected (OutOfSync)
```bash
# ArgoCD UI shows diff
# Click "Diff" to see what changed
# Either: fix in Git + push, or click "Sync" to reconcile
```

### ImagePullBackOff
```bash
# Check image exists in registry
# For Kind: kind load docker-image <image> --name mxmobilz-prod
# For prod: ensure registry credentials in imagePullSecrets
```

### Ingress Webhook Error — `configuration-snippet` denied
```bash
# The nginx.ingress.kubernetes.io/configuration-snippet annotation is disabled by the Ingress administrator
# Remove it from ingress.yaml and use alternative methods for security headers
# Options: MutatingWebhook, application-level headers, or request cluster admin to enable
```

---

## 13. Key Takeaways (Interview Bullets)

1. **App of Apps pattern** — single root app manages all environments
2. **Kustomize overlays** — base + env-specific patches (DRY, no copy-paste)
3. **ArgoCD Project RBAC** — multi-tenant isolation (dev/staging/prod)
4. **Sync waves** — ordered deployment (infra → apps)
5. **Automated sync + self-heal** — drift auto-corrected
6. **PruneLast** — namespace deleted last (safe cleanup)
7. **External Secrets ready** — ExternalSecret + ClusterSecretStore defined
8. **Network Policies** — zero-trust pod communication
9. **Git as source of truth** — all changes via PR, audit trail in Git history
10. **Rollback = git revert** — no manual cluster operations
11. **⚠️ All base subdirectories must be git-tracked** — untracked folders (e.g., `gitops/base/backend/`) cause `lstat: no such file or directory` errors in ArgoCD. Always `git add` new Kustomize components before deploying.

---

## 14. Commands Cheat-Sheet

```bash
# --- ArgoCD Install ---
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
kubectl wait --for=condition=Ready pods --all -n argocd --timeout=300s

# --- Bootstrap GitOps ---
kubectl apply -f gitops/argocd/applications/root-application.yaml

# --- Verify ---
kubectl get applications -n argocd
kubectl get all -n cloud-native-ecomerce-prod
kubectl get networkpolicy -n cloud-native-ecomerce-prod

# --- Access ArgoCD UI ---
kubectl port-forward -n argocd svc/argocd-server 8080:443
# https://localhost:8080
# user: admin
# pass: kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d

# --- Deploy change ---
git add gitops/overlays/prod/kustomization.yaml
git commit -m "prod: update replica count"
git push origin main
# ArgoCD auto-syncs

# --- Rollback ---
git revert HEAD
git push origin main
```

---

## 15. How to Access the Application in Browser

### Option 1: Port-Forward (Local Development)
```bash
kubectl port-forward -n argocd svc/argocd-server 8080:443
# Open: https://localhost:8080
# Login: user: admin, password: <from step 4 above>
```

### Option 2: Direct Ingress Access (Production)
After deploying to prod environment:

```bash
# Add to /etc/hosts (Windows: C:\Windows\System32\drivers\etc\hosts)
# 127.0.0.1  mxmobilz.local

# Access:
# http://mxmobilz.local/          → React store frontend
# http://mxmobilz.local/api/products → JSON API from backend+DB
```

**Verify:**
```bash
curl -H "Host: mxmobilz.local" http://localhost/api/products
# Should return JSON response from Laravel API
```

### Option 3: ArgoCD UI Application Overview
1. Login to ArgoCD UI
2. Click any application (mxmobilz-dev, mxmobilz-staging, mxmobilz-prod)
3. View the **Resources** tree → see all deployed K8s resources
4. Click **SYNC** → manual sync if automated sync is disabled
5. View **Sync Details** → see live logs of deployment

### Browser Tabs in ArgoCD UI
| Tab | What You See |
|---|---|
| **Overview** | App status, sync health, resources tree |
| **Sync** | Sync history, manual sync button, prune options |
| **Settings** | Namespace, source path, destination, sync policy |
| **Health** | Pod status, resource health, error details |
| **Events** | Deployment events, warnings, failures |

---

## 16. Real-World Workflow (End-to-End)

### Day 1: Initial Setup
```bash
# 1. Ensure gitops/base/backend/ is tracked
git add gitops/base/backend/
git commit -m "feat: add backend kustomization"
git push origin dev

# 2. Install ArgoCD
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# 3. Apply project + apps
kubectl apply -f gitops/argocd/projects/mxmobilz-project.yaml
kubectl apply -f gitops/argocd/applications/root-application.yaml

# 4. Wait for auto-sync (or click SYNC)
# 5. Verify: kubectl get applications -n argocd

# 5. Access UI: kubectl port-forward -n argocd svc/argocd-server 8080:443
```

### Day 2: Add Feature (e.g., Scale Backend)
```bash
# 1. Edit overlay
vim gitops/overlays/prod/kustomization.yaml
# Change: backend replicas: 5

# 2. Commit & push
git add gitops/overlays/prod/kustomization.yaml
git commit -m "prod: scale backend to 5 replicas"
git push origin main

# 3. ArgoCD auto-syncs within 3 minutes
#    OR click SYNC in UI

# 4. Verify deployment
kubectl get pods -n cloud-native-ecomerce-prod -l app.kubernetes.io/name=backend
# Should show 5 pods running
```

### Day 3: Hotfix (Emergency)
```bash
# 1. Emergency patch (bypass Git - NOT recommended)
kubectl patch deployment backend-backend-helm -n cloud-native-ecomerce-prod -p '{"spec":{"replicas":10}}'

# 2. ArgoCD shows "OutOfSync"
# 3. Next git push will reconcile to previous state
#    OR click "SYNC" in ArgoCD UI → "Prune"

# 4. Or proper rollback:
git revert <bad-commit-hash>
git push origin main
# ArgoCD auto-syncs to previous state
```

### Day 4: New Environment (Staging)
```bash
# 1. Create overlay
cp -r gitops/overlays/dev gitops/overlays/staging
# Edit: change replicas, log level, secrets

# 2. Create application
cp gitops/argocd/applications/dev-application.yaml gitops/argocd/applications/staging-application.yaml
# Edit: change path, namespace, sync-wave

# 3. Push to Git
git add gitops/overlays/staging/ gitops/argocd/applications/staging-application.yaml
git commit -m "feat: add staging environment"
git push origin main

# 4. ArgoCD root app auto-discovers
# 5. Click SYNC on new mxmobilz-staging app
```

---

## 17. Git Operations (PR-Based Workflow)

### Feature Branch Workflow
```bash
# 1. Create feature branch
git checkout -b feature/add-promo-codes

# 2. Make changes to manifests
vim gitops/overlays/prod/kustomization.yaml
# Add: promo code config

# 3. Commit & push
git add gitops/
git commit -m "feat: add promo codes overlay"
git push origin feature/add-promo-codes

# 4. Create Pull Request
#    - Reviewers check manifest changes
#    - No direct cluster access needed

# 5. Merge PR
# 6. ArgoCD auto-syncs merged changes

# 7. Verify
kubectl get pods -n cloud-native-ecomerce-prod
```

### Pull Request Template
```markdown
## Description
Add promo codes management to production environment.

## Changes
- Updated `gitops/overlays/prod/kustomization.yaml` with promo code config
- Added new ConfigMap for promo code defaults

## Verification
- [ ] ArgoCD shows synced status (green)
- [ ] `kubectl get pods` shows correct replica counts
- [ ] API endpoint `/api/promos` returns expected data

## Rollback Plan
- `git revert <commit-hash>` if issues found
- ArgoCD will auto-reconcile to previous state
```

---

## 18. Level Assessment — Interview Preparation

### Strong Points (Impressive)
- ✅ Multi-node HA topology (Kind) — single-node nahi
- ✅ StatefulSet vs Deployment ka **correct** use (DB stable identity + PVC)
- ✅ Headless service + stable DNS
- ✅ Secrets via `secretKeyRef`, no plaintext
- ✅ Probes on real health endpoint (`/api/products`, not `/`)
- ✅ Kind multi-node = cheap production-like HA locally
- ✅ Helm chart for backend (parameterized)
- ✅ nginx sidecar + FPM pattern (real-world PHP deployment)
- ✅ Ingress L7 routing + ingress-nginx controller
- ✅ PVC persistence — data survives pod restart
- ✅ App of Apps pattern with ArgoCD
- ✅ Kustomize overlays for dev/staging/prod
- ✅ Git as source of truth with RBAC

### Gaps (Honest — interviewer ko impress karta hai)
- ⚠️ **Security:** `securityContext` empty, no `runAsNonRoot`, no capabilities drop
- ⚠️ **TLS:** No HTTPS on ingress — `ssl-redirect: false`
- ⚠️ **Observability:** No Prometheus/Grafana, no metrics-server
- ⚠️ **HPA:** `autoscaling.enabled: false` — no auto-scaling
- ⚠️ **DB HA:** MySQL sirf 1 replica, no failover, no backup job
- ⚠️ **Rollout/CD:** bootstrap.sh manually — no CI pipeline (Actions)
- ⚠️ **Image tags:** Fixed `1.0.0` tag — no git-SHA immutability
- ⚠️ **NetworkPolicy:** Defined but cluster-level implementation varies
- ⚠️ **Ingress:** No TLS cert, no readiness for external LB


---
*Document last updated: 2026-09-01*
*Source of truth for entire GitOps workflow — mxmobilz e-commerce platform*