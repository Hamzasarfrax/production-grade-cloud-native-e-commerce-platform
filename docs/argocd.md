# Mxmobilz — ArgoCD GitOps Setup (Step-by-Step)

> Is guide ka maqsad: **tumhara existing K8s setup** (jo `k8s/` folder me hai) ko **ArgoCD se manage** karna. Har step ka **command + verification** diya gaya hai.

---

## 📋 Prerequisites (Already Done ✅)

- [x] Kind cluster `mxmobilz-prod` running (3 nodes)
- [x] Namespace `cloud-native-ecomerce-app` exists
- [x] MySQL, Backend, Frontend, Ingress deployed via `bootstrap.sh`
- [x] Docker images on Docker Hub: `hamzasarfraz862/backend-app:1.0.0`, `hamzasarfraz862/front-end-app:1.0.0`
- [x] Git repo: `https://github.com/hamzasarfraz862/mxmobilz` (assumed — apna URL daalo)

---

## 🏗️ Step 1: GitOps Repository Structure Banao

### 1.1 Naya folder structure banao (current repo ke andar hi)
```bash
cd /mnt/e/Learnings/Cloud-cyber/Cloud-native/Ecomerce
mkdir -p gitops/argocd/{applications,projects}
mkdir -p gitops/base/{mysql,backend,frontend,ingress}
mkdir -p gitops/overlays/{dev,staging,prod}
```

### 1.2 Existing K8s manifests ko `gitops/base/` me copy karo
```bash
# MySQL
cp -r k8s/mysql/* gitops/base/mysql/

# Backend Helm chart
cp -r k8s/backend/backend-helm/* gitops/base/backend/

# Frontend
cp -r k8s/frontend/* gitops/base/frontend/

# Ingress
cp -r k8s/ingress/* gitops/base/ingress/

# Namespace
cp k8s/namespace.yaml gitops/base/
```

### 1.3 Verify structure
```bash
tree gitops/
# Output should be:
# gitops/
# ├── argocd/
# │   ├── applications/
# │   └── projects/
# ├── base/
# │   ├── mysql/
# │   ├── backend/
# │   ├── frontend/
# │   ├── ingress/
# │   └── namespace.yaml
# └── overlays/
#     ├── dev/
#     ├── staging/
#     └── prod/
```

---

## 🚀 Step 2: ArgoCD Install in Kind Cluster

### 2.1 ArgoCD namespace + CRDs install
```bash
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
```

### 2.2 Wait for all pods ready
```bash
kubectl wait --for=condition=Ready pods --all -n argocd --timeout=300s
```

### 2.3 Verify installation
```bash
kubectl get pods -n argocd
# Expected: argocd-application-controller, argocd-repo-server, argocd-server, argocd-dex-server, argocd-redis — all Running
```

---

## 🌐 Step 3: ArgoCD UI Access (Do options — ek choose karo)

### Option A: Port-Forward (Quick, Local Only)
```bash
kubectl port-forward -n argocd svc/argocd-server 8080:443
# Open browser: https://localhost:8080
# Accept self-signed cert warning
```

### Option B: Ingress (Production-Like — Recommended)
```bash
# 1. Create ArgoCD Ingress
cat <<EOF | kubectl apply -f -
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: argocd-server-ingress
  namespace: argocd
  annotations:
    nginx.ingress.kubernetes.io/ssl-passthrough: "true"
    nginx.ingress.kubernetes.io/backend-protocol: "HTTPS"
spec:
  ingressClassName: nginx
  rules:
  - host: argocd.mxmobilz.local
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: argocd-server
            port:
              number: 443
EOF

# 2. Add to /etc/hosts (Windows: C:\Windows\System32\drivers\etc\hosts)
# 127.0.0.1  argocd.mxmobilz.local

# 3. Open browser: https://argocd.mxmobilz.local
```

---

## 🔐 Step 4: ArgoCD Admin Password Nikalo

```bash
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d && echo
# Output: <password>  (copy this)

# Login credentials:
# Username: admin
# Password: <above output>
```

---

## 📦 Step 5: ArgoCD Project Create Karo

### 5.1 `gitops/argocd/projects/mxmobilz-project.yaml` banao
```yaml
apiVersion: argoproj.io/v1alpha1
kind: AppProject
metadata:
  name: mxmobilz
  namespace: argocd
spec:
  description: Mxmobilz E-commerce Project
  sourceRepos:
  - 'https://github.com/hamzasarfraz862/mxmobilz.git'  # <-- APNA GITHUB REPO URL DAALO
  destinations:
  - namespace: 'cloud-native-ecomerce-app'
    server: https://kubernetes.default.svc
  clusterResourceWhitelist:
  - group: ''
    kind: Namespace
  namespaceResourceWhitelist:
  - group: ''
    kind: '*'
  - group: apps
    kind: Deployment
  - group: apps
    kind: StatefulSet
  - group: apps
    kind: ReplicaSet
  - group: ''
    kind: Service
  - group: ''
    kind: Secret
  - group: ''
    kind: ConfigMap
  - group: ''
    kind: PersistentVolumeClaim
  - group: networking.k8s.io
    kind: Ingress
```

### 5.2 Apply project
```bash
kubectl apply -f gitops/argocd/projects/mxmobilz-project.yaml
```

### 5.3 Verify
```bash
kubectl get appproject -n argocd
# Should show: mxmobilz
```

---

## 🎯 Step 6: ArgoCD Applications Create Karo (4 Applications)

### 6.1 Namespace Application (Sabse pehle — namespace exist karna chahiye)
```yaml
# gitops/argocd/applications/namespace-application.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: namespace
  namespace: argocd
  finalizers:
  - resources-finalizer.argocd.argoproj.io
spec:
  project: mxmobilz
  source:
    repoURL: 'https://github.com/hamzasarfraz862/mxmobilz.git'
    targetRevision: main
    path: gitops/base
  destination:
    server: https://kubernetes.default.svc
    namespace: cloud-native-ecomerce-app
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
    - CreateNamespace=true
```

### 6.2 MySQL Application
```yaml
# gitops/argocd/applications/mysql-application.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: mysql
  namespace: argocd
  finalizers:
  - resources-finalizer.argocd.argoproj.io
spec:
  project: mxmobilz
  source:
    repoURL: 'https://github.com/hamzasarfraz862/mxmobilz.git'
    targetRevision: main
    path: gitops/base/mysql
  destination:
    server: https://kubernetes.default.svc
    namespace: cloud-native-ecomerce-app
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
    - CreateNamespace=true
```

### 6.3 Backend Application (Helm)
```yaml
# gitops/argocd/applications/backend-application.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: backend
  namespace: argocd
  finalizers:
  - resources-finalizer.argocd.argoproj.io
spec:
  project: mxmobilz
  source:
    repoURL: 'https://github.com/hamzasarfraz862/mxmobilz.git'
    targetRevision: main
    path: gitops/base/backend
    helm:
      valueFiles:
      - values.yaml
      parameters:
      - name: image.repository
        value: hamzasarfraz862/backend-app
      - name: image.tag
        value: "1.0.0"
  destination:
    server: https://kubernetes.default.svc
    namespace: cloud-native-ecomerce-app
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
    - CreateNamespace=true
```

### 6.4 Frontend Application
```yaml
# gitops/argocd/applications/frontend-application.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: frontend
  namespace: argocd
  finalizers:
  - resources-finalizer.argocd.argoproj.io
spec:
  project: mxmobilz
  source:
    repoURL: 'https://github.com/hamzasarfraz862/mxmobilz.git'
    targetRevision: main
    path: gitops/base/frontend
  destination:
    server: https://kubernetes.default.svc
    namespace: cloud-native-ecomerce-app
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
    - CreateNamespace=true
```

### 6.5 Ingress Application
```yaml
# gitops/argocd/applications/ingress-application.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: ingress
  namespace: argocd
  finalizers:
  - resources-finalizer.argocd.argoproj.io
spec:
  project: mxmobilz
  source:
    repoURL: 'https://github.com/hamzasarfraz862/mxmobilz.git'
    targetRevision: main
    path: gitops/base/ingress
  destination:
    server: https://kubernetes.default.svc
    namespace: cloud-native-ecomerce-app
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
    - CreateNamespace=true
```

### 6.6 Sabhi Applications Apply Karo
```bash
kubectl apply -f gitops/argocd/applications/
```

### 6.7 Verify Applications Created
```bash
kubectl get applications -n argocd
# Expected output:
# NAME        SYNC STATUS   HEALTH STATUS
# namespace   Synced        Healthy
# mysql       Synced        Healthy
# backend     Synced        Healthy
# frontend    Synced        Healthy
# ingress     Synced        Healthy
```

---

## ✅ Step 7: ArgoCD UI Se Verify Karo

### 7.1 ArgoCD UI kholo (Step 3 ka URL)
- Login: `admin` / `<password from step 4>`

### 7.2 Projects tab → `mxmobilz` project click karo
- Should show 5 applications

### 7.3 Applications tab → Har app click karo
- **SYNC STATUS**: Synced (green)
- **HEALTH STATUS**: Healthy (green)
- **Resources tree**: Sab pods/services green dikhne chahiye

---

## 🔄 Step 8: GitOps Flow Test Karo (End-to-End)

### 8.1 Koi change karo Git me (e.g., replica count badhao)
```bash
# Backend replicas 3 → 5 karo
sed -i 's/replicaCount: 3/replicaCount: 5/' gitops/base/backend/values.yaml

# Commit & push
git add gitops/base/backend/values.yaml
git commit -m "chore: scale backend to 5 replicas"
git push origin main
```

### 8.2 ArgoCD UI me dekho
- **Within 3 minutes** (default sync window): Application `backend` → **OutOfSync** → **Syncing** → **Synced**
- Pods count 3 → 5 ho jayega automatically

### 8.3 Verify via CLI
```bash
kubectl get pods -n cloud-native-ecomerce-app | grep backend
# Should show 5 backend pods
```

---

## 🧪 Step 9: Self-Heal Test Karo (Manual Tampering)

### 9.1 Ek pod manually delete karo
```bash
kubectl delete pod -n cloud-native-ecomerce-app -l app.kubernetes.io/name=backend
```

### 9.2 ArgoCD UI me dekho
- Application `backend` → **OutOfSync** (health degraded)
- **Auto-heal** enabled hai → ArgoCD wapas pod create karega
- **Synced** + **Healthy** wapas aa jayega

### 9.3 CLI se verify
```bash
kubectl get pods -n cloud-native-ecomerce-app | grep backend
# New pod should be Running
```

---

## 🗑️ Step 10: Prune Test Karo (Resource Delete from Git)

### 10.1 Koi resource Git se hatao
```bash
# Example: HPA disable karo (comment out in values.yaml)
# Phir commit push karo
```

### 10.2 ArgoCD UI me
- Application → **OutOfSync**
- **Sync** button dabao (ya auto hoga)
- ArgoCD cluster se wo resource **delete kar dega** (prune=true)

---

## 📝 Step 11: Overlays Setup (Environment-Specific Config)

### 11.1 Dev overlay values
```bash
# gitops/overlays/dev/kustomization.yaml
cat <<EOF > gitops/overlays/dev/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
resources:
- ../../base
patches:
- patch: |-
    apiVersion: apps/v1
    kind: Deployment
    metadata:
      name: backend-backend-helm
    spec:
      replicas: 1
  target:
    kind: Deployment
    labelSelector: app.kubernetes.io/name=backend
- patch: |-
    apiVersion: apps/v1
    kind: Deployment
    metadata:
      name: frontend-app
    spec:
      replicas: 1
  target:
    kind: Deployment
    labelSelector: app.kubernetes.io/name=frontend
EOF
```

### 11.2 Dev application (separate ArgoCD app for dev)
```yaml
# gitops/argocd/applications/dev-application.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: mxmobilz-dev
  namespace: argocd
spec:
  project: mxmobilz
  source:
    repoURL: 'https://github.com/hamzasarfraz862/mxmobilz.git'
    targetRevision: main
    path: gitops/overlays/dev
  destination:
    server: https://kubernetes.default.svc
    namespace: cloud-native-ecomerce-dev  # alag namespace
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
    - CreateNamespace=true
```

---

## 🚨 Step 12: Production Hardening (Next Steps)

ArgoCD setup ke baad ye **production gaps** fill karo:

| Task | Command/File | Priority |
|------|--------------|----------|
| **TLS Certificates** | Install cert-manager + ClusterIssuer (Let's Encrypt) | 🔴 Critical |
| **Secrets Management** | External Secrets Operator + AWS Secrets Manager/Vault | 🔴 Critical |
| **Network Policies** | `gitops/base/network-policies/` + apply | 🔴 Critical |
| **HPA Enable** | `autoscaling.enabled: true` in `values.yaml` | 🟡 High |
| **Prometheus/Grafana** | kube-prometheus-stack Helm chart | 🟡 High |
| **RBAC** | Custom ServiceAccounts + Roles | 🟡 High |
| **Velero Backup** | Velero install + backup schedule | 🟡 High |
| **Image Scanning** | Trivy/Cosign in CI pipeline | 🟢 Medium |

---

## 🔧 Troubleshooting Common Issues

### Issue: Application stuck in `Progressing` / `Degraded`
```bash
# 1. Check application events
kubectl describe application <app-name> -n argocd

# 2. Check repo server logs
kubectl logs -n argocd -l app.kubernetes.io/name=argocd-repo-server --tail=50

# 3. Check application controller logs
kubectl logs -n argocd -l app.kubernetes.io/name=argocd-application-controller --tail=50
```

### Issue: `ImagePullBackOff` after image update
```bash
# 1. Verify image exists on Docker Hub
docker pull hamzasarfraz862/backend-app:<new-tag>

# 2. Check Kind has image (if using local images)
kind load docker-image hamzasarfraz862/backend-app:<new-tag> --name mxmobilz-prod

# 3. Force rollout
kubectl rollout restart deployment/backend-backend-helm -n cloud-native-ecomerce-app
```

### Issue: ArgoCD UI not accessible via Ingress
```bash
# 1. Check ingress controller logs
kubectl logs -n ingress-nginx -l app.kubernetes.io/name=ingress-nginx --tail=50

# 2. Verify ingress resource
kubectl get ingress -n argocd
kubectl describe ingress argocd-server-ingress -n argocd

# 3. Check SSL passthrough enabled in ingress-nginx
kubectl get configmap ingress-nginx-controller -n ingress-nginx -o yaml | grep ssl-passthrough
```

---

## 📋 Quick Reference Commands

```bash
# --- ArgoCD Management ---
kubectl get applications -n argocd                    # List all apps
kubectl get appproject -n argocd                      # List projects
argocd app list                                       # CLI (if argocd CLI installed)
argocd app sync <app-name>                            # Manual sync
argocd app logs <app-name>                            # View sync logs

# --- Force Operations ---
argocd app sync <app-name> --force --prune            # Force sync with prune
kubectl annotate application <app-name> -n argocd argocd.argoproj.io/refresh=hard --overwrite  # Hard refresh

# --- Debug ---
kubectl exec -n argocd deployment/argocd-repo-server -- argocd-repo-server version
kubectl exec -n argocd deployment/argocd-application-controller -- argocd-application-controller version

# --- Cleanup ---
kubectl delete -f gitops/argocd/applications/         # Delete all apps
kubectl delete -f gitops/argocd/projects/             # Delete project
kubectl delete namespace argocd                       # Full uninstall
```

---

## ✅ Final Verification Checklist

- [ ] ArgoCD UI accessible at `https://argocd.mxmobilz.local` (or localhost:8080)
- [ ] Project `mxmobilz` created and shows 5 applications
- [ ] All 5 applications: **Synced** + **Healthy**
- [ ] Git push → ArgoCD auto-syncs within 3 min
- [ ] Manual pod delete → ArgoCD self-heals (recreates pod)
- [ ] Git resource delete → ArgoCD prunes from cluster
- [ ] Dev overlay works (separate namespace, different replicas)
- [ ] Application URLs still work: `https://mxmobilz.local/` + `/api/products`

---

## 🎯 Interview Talking Points

> "Maine ArgoCD implement kiya hai GitOps ke liye. Mera setup:
> - **AppProject** for RBAC boundary (namespace-scoped)
> - **5 Applications**: namespace, mysql, backend (Helm), frontend, ingress
> - **Automated sync** with `prune=true` + `selfHeal=true`
> - **Kustomize overlays** for dev/staging/prod environments
> - **GitHub Actions CI** builds images with git-SHA tags → updates gitops repo → ArgoCD deploys
> - **Gaps I know**: TLS (cert-manager pending), External Secrets, NetworkPolicy, HPA — ye sab next sprint me add karunga."

---

**Next:** TLS setup with cert-manager → External Secrets → NetworkPolicy → HPA → Observability stack.