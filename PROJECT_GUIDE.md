# 🛍️ Mxmobilz — Complete Hands-On Project Guide (Real World, Step-by-Step)

> **Last Updated:** September 7, 2026
> **Purpose:** Yah guide tumhe **har ek command** batata hai — kya type karna hai,
> kya output dikha, kya check karna hai. Ye ek hands-on runbook hai — padh kar
> follow karo, kuch bhi skip nahi.
>
> **Flow:** Local (Docker) → Test → Monitoring → Load Test → GitHub Actions CI/CD →
> AWS EKS Deployment → Production Verification
>
> **Prereq (hardware/software):**
> - Windows WSL2 OR Linux/Mac
> - Docker Desktop (WSL integration ON) + Docker Compose
> - kubectl, helm, kind (for K8s)
> - terraform (for AWS)
> - k6 (for load testing)
> - GitHub account + AWS account

---

## 📋 Table of Contents

| Phase | What You Do | Where |
|-------|-------------|-------|
| [Phase 0](#phase-0---environment-setup) | Install all tools | Local machine |
| [Phase 1](#phase-1---run-locally-with-docker) | Start app locally | Docker Compose |
| [Phase 2](#phase-2---test-everything) | Verify all endpoints | Localhost |
| [Phase 3](#phase-3---monitoring-stack) | Prometheus + Grafana | Docker + K8s |
| [Phase 4](#phase-4---load-testing-with-k6) | Stress test the app | k6 |
| [Phase 5](#phase-5---github-actions-cicd) | CI/CD pipeline | GitHub |
| [Phase 6](#phase-6---local-kubernetes) | Kind cluster + K8s deploy | Kind |
| [Phase 7](#phase-7---aws-deployment) | Real AWS EKS + RDS | AWS |
| [Phase 8](#phase-8---production-verification) | Verify production | Browser/curl |

---

## Phase 0 — Environment Setup

### 0.1 Install Required Tools

**Check what you already have:**
```bash
node --version          # v18+
npm --version           # v9+
docker --version        # 20.10+
docker compose version  # v2+
git --version
php --version           # only if running Laravel natively (optional)
```

**Install missing tools (Windows WSL2 / Ubuntu):**

```bash
# Docker — already installed? Skip. If not:
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# kubectl (Kubernetes CLI)
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# kind (Kubernetes in Docker)
curl -Lo ./kind https://kind.sigs.k8s.io/dl/v0.23.0/kind-linux-amd64
chmod +x ./kind
sudo mv ./kind /usr/local/bin/kind

# helm (Kubernetes package manager)
curl -fsSL -o get_helm.sh https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3
chmod 700 get_helm.sh
./get_helm.sh

# terraform (Infrastructure as Code)
sudo apt-get update && sudo apt-get install -y gnupg software-properties-common
wget -O- https://apt.releases.hashicorp.com/gpg | sudo gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list
sudo apt update && sudo apt install terraform

# k6 (Load testing)
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/grafana-archive-keyring.gpg \
  --keyserver keyserver.ubuntu.com --recv-keys 8B8B57C0AA9E1FF0FA8A1E2F2F0B5F9A
sudo apt-get install -y k6

# Verify all
docker --version && kubectl version --client && helm version && terraform version && k6 version
```

**Windows-specific note (WSL2):**
```bash
# Docker Desktop → Settings → Resources → WSL Integration → Enable
# WSL me docker context set karo:
docker context use default
docker info | grep "Server Version"   # Should show "Server Version: 2x.x"
```

---

## Phase 1 — Run Locally with Docker

### 1.1 Setup .env Files

**Backend .env banao (copy from example):**
```bash
cd backend
cp .env.example .env

# .env file khole aur ye values SET karo:
# DB_CONNECTION=mysql
# DB_HOST=mysql
# DB_PORT=3306
# DB_DATABASE=mxmobilz_db
# DB_USERNAME=mxmobilz
# DB_PASSWORD=mxmobilzsecret
# DB_ROOT_PASSWORD=rootsecret
```

**Important:** `.env` ke andar `DB_HOST=mysql` hona chahiye (Docker service name).
Check kiya? Good.

### 1.2 Start the Full Stack

```bash
# Root directory se (jahan docker-compose.yml hai)
cd /mnt/e/Learnings/Cloud-cyber/Cloud-native/Ecomerce

# Build + start saare services (first time: takes 2-5 mins for build)
docker compose up --build -d

# Dekho kya ho raha hai
docker compose ps
```

**Expected output:**
```
NAME                    IMAGE               STATUS                 PORTS
ecommerce-backend-app   backend-app:1.0.2  Up (healthy)           9000
ecommerce-backend-nginx backend-nginx      Up (healthy)           0.0.0.0:8000->80
ecommerce-front-end-app front-end-app:1.0.0 Up (healthy)          0.0.0.0:3000->80
ecommerce-mysql         mysql:8.4          Up (healthy)           3306
```

**Agar koi service "Restarting"/"unhealthy" hai:**
```bash
# Logs dekho
docker compose logs backend-app
docker compose logs mysql

# MySQL healthcheck wait karo
docker compose ps | grep mysql   # should say "healthy"
```

### 1.3 Verify Database Auto-Setup

First boot pe entrypoint.sh automatically:
- MySQL wait karta hai (healthy hone tak)
- `php artisan migrate --force` chalta hai
- Seed data load hota hai (SIRF agar DB empty hai — no duplicates)

```bash
# Check DB se products mil rahe hain
docker compose exec backend-app php artisan tinker --execute="
echo 'Products: ' . \App\Models\PhoneProduct::count() . PHP_EOL;
echo 'Orders: ' . \App\Models\Order::count() . PHP_EOL;
echo 'Inquiries: ' . \App\Models\CustomerInquiry::count() . PHP_EOL;
"
```

**Expected output (approx):**
```
Products: 50
Orders: 1250
Inquiries: 342
```

---

## Phase 2 — Test Everything

### 2.1 Frontend (Browser)

**Open browser:**
```
http://localhost:3000
```

**Check these pages:**
| Page | URL | What to verify |
|------|-----|----------------|
| Landing | `/` | Hero, featured products |
| Shop | `/#shop` | Product grid loads from API |
| Admin | `/#admin` | KPIs, product/order/inquiries tables |
| Cart | `/cart` | Add item → appears |

### 2.2 API Endpoints (curl)

```bash
# Health check
curl http://localhost:8000/api/health
# → {"ok":true,"data":{"status":"healthy","timestamp":"..."}}

# Products list
curl http://localhost:8000/api/products
# → {"ok":true,"data":[{id:1,name:"iPhone 15 Pro",...}]}

# Products with filter
curl "http://localhost:8000/api/products?brand=Apple&search=iPhone"
# → filtered list

# Single product
curl http://localhost:8000/api/products/1
# → {"ok":true,"data":{id:1,...}}

# Orders (admin)
curl http://localhost:8000/api/orders?status=pending
# → {"ok":true,"data":[...]}

# Inquiries
curl http://localhost:8000/api/inquiries
# → {"ok":true,"data":[...]}

# Promos
curl http://localhost:8000/api/promos
# → {"ok":true,"data":[]}

# Stats (admin dashboard KPIs)
curl http://localhost:8000/api/stats
# → {"ok":true,"data":{"total_products":50,"total_orders":1250,...}}
```

### 2.3 Create a Test Order (POST)

```bash
curl -X POST http://localhost:8000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customer": {"name":"Test User","email":"test@example.com"},
    "items": [{"product_id":1,"quantity":1,"price":999.99}],
    "total": 999.99
  }'
# → {"ok":true,"data":{order_id:1251,status:"pending"}}
```

### 2.4 Create Test Inquiry (POST)

```bash
curl -X POST http://localhost:8000/api/inquiries \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","message":"Has this phone been repaired?"}'
# → {"ok":true,"data":{id:343,status:"new"}}
```

---

## Phase 3 — Monitoring Stack (Prometheus + Grafana)

### 3.1 Local Monitoring via Docker Compose

**Prereq:** App stack up & running (Phase 1).

```bash
# MySQL exporter ke liye monitoring user banao
docker compose exec mysql mysql -uroot -p$DB_ROOT_PASSWORD -e "
  CREATE USER IF NOT EXISTS 'exporter'@'%' IDENTIFIED BY 'mxmobilzsecret';
  GRANT PROCESS, REPLICATION CLIENT ON *.* TO 'exporter'@'%';
  FLUSH PRIVILEGES;
"

# Monitoring stack start karo
cd monitoring
docker compose up -d

# Verify 9 services running
docker compose ps
```

**Check .env.exporter exists:**
```bash
cat monitoring/.env.exporter
# MYSQL_EXPORTER_PASSWORD=mxmobilzsecret
```

**Start monitoring services:**
```bash
cd monitoring && docker compose up -d
```

**Expected outputs:**
```
prometheus           Up    0.0.0.0:9090->9090
grafana              Up    0.0.0.0:3001->3000
alertmanager         Up    0.0.0.0:9093->9093
node-exporter        Up    0.0.0.0:9100->9100
cadvisor             Up    0.0.0.0:8080->8080
mysqld-exporter      Up    0.0.0.0:9104->9104
phpfpm-exporter      Up    0.0.0.0:9253->9253
nginx-exporter       Up    0.0.0.0:9113->9113
blackbox-exporter    Up    0.0.0.0:9115->9115
```

### 3.2 Access Grafana — Check Dashboards

**IMAGE (screenshot check):**
```
Grafana:        http://localhost:3001     (login: admin / admin)
Prometheus:     http://localhost:9090
Alertmanager:   http://localhost:9093
```

**Dashboard check karo:**
1. Grafana kholo → `http://localhost:3001`
2. Login → `admin` / `admin`
3. Left menu → **Dashboards** → **Mxmobilz** folder
4. Click **"Mxmobilz - Application Overview"**
5. Ab tumhe 15 panels dikhne chahiye:
   - Row 1: Backend UP/DOWN, Frontend, MySQL, PHP-FPM Nginx
   - Row 2: HTTP request rate, response time
   - Row 3: PHP-FPM process pool, Nginx connections
   - Row 4: MySQL connections, query rate, slow queries
   - Row 5: CPU, memory, disk
   - Row 6: Container CPU, container memory

**Check Prometheus targets:**
```bash
# Browser: http://localhost:9090
# → Status → Targets
# Har target ke saamne "UP" hona chahiye:
#   prometheus, node-exporter, cadvisor, mysqld-exporter,
#   phpfpm-exporter, nginx-exporter, blackbox-http, blackbox-http-frontend
```

### 3.3 Check Alerts Are Loaded

```bash
# Browser: http://localhost:9090
# → Alerts → Rules
# Har rule "inactive" state me hona chahiye (koi alert nahi firing)
```

**Test an alert manually (kill backend temporarily):**
```bash
# Backend ko 2 min ke liye down karo
docker compose stop backend-app

# Wait 2 minutes... then:
# → Grafana me "Backend API" red (DOWN) ho jayega
# → Prometheus Alerts me "BackendApiDown" state "firing" ho jayega
# → Alertmanager me alert dikhega

# Wapas up karo
docker compose start backend-app

# → Alert "resolved" ho jayega automatically (waapas normal)
```

---

## Phase 4 — Load Testing with k6

### 4.1 Understand the load test

`load-test.js` already exists at root. It simulates:
- Ramp up: 0 → 10 users (30s)
- Steady: 50 users (1 min)
- Spike: 100 users (1 min)
- Ramp down: → 0 (30s)
- Thresholds: fail rate < 1%, p95 latency < 1s

```javascript
export const options = {
  stages: [
    { duration: '30s', target: 10 },   // warm-up
    { duration: '1m', target: 50 },    // ramp
    { duration: '1m', target: 100 },   // stress
    { duration: '30s', target: 0 },    // cool-down
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],    // <1% failures
    http_req_duration: ['p(95)<1000'], // p95 < 1s
  },
};
```

### 4.2 Run the Load Test

**Make sure main app is running (Phase 1).**
```bash
# Root directory se
cd /mnt/e/Learnings/Cloud-cyber/Cloud-native/Ecomerce

# Run load test (against frontend on :3000)
k6 run load-test.js
```

**Expected output (approximately):**
```
     data_received........: 12 MB  210 kB/s
     data_sent............: 952 KB  16 kB/s
     http_req_blocked.....: avg=54.2µs  min=1.3µs  med=8.9µs
     http_req_connecting..: avg=42.2µs  min=0s     med=0s
     http_req_duration....: avg=38.4ms  min=3.2ms  med=25.1ms  p(90)=85.2ms  p(95)=120.3ms
     http_req_failed......: 0.00%   ✓ { threshold: rate<0.01 }
     http_req_receiving...: avg=105.5µs min=4.2µs  med=89.2µs
     http_req_sending.....: avg=11.2µs  min=1.9µs  med=9.4µs
     http_req_waiting.....: avg=38.2ms  min=3.1ms  med=25.1ms
     http_reqs............: 5826    58.2/s
     iteration_duration...: avg=40.2ms  min=5.1ms  med=26.2ms
     iterations...........: 5826    58.2/s
     vus.................: 100     min=0     max=100
     vus_max.............: 100
```

**Agar threshold fail hua (p95 > 1s):**
- Backend me slow queries hain → MySQL slow query metric check karo
- PHP-FPM workers exhausted → Grafana me PHP-FPM panel check karo
- MySQL connections high → connection pool check karo

### 4.3 Watch Metrics During Load Test

**Tab 1 — Terminal:** `k6 run load-test.js`
**Tab 2 — Grafana:** Refresh **Application Overview** — request rate spike dikhegi
**Tab 3 — Prometheus:** Query `sum(rate(nginx_http_requests_total[1m]))` — live spike

---

## Phase 5 — GitHub Actions CI/CD

> **Important:** Abhi sirf `deploy.yml` hai jo **GitOps update** karta hai (Docker
> image tags kustomization me update karta hai). Neeche complete CI/CD pipeline
> setup karna hai — test, build, scan, push, deploy.

### 5.1 What the Pipeline Should Do

```
Push to main
      │
      ▼
┌──────────────────────────────┐
│ Job 1: CI — Lint & Test      │
│  ├─ backend: php lint,       │
│  │   phpstan, test           │
│  └─ frontend: npm ci,        │
│      lint, build             │
└──────────────┬───────────────┘
               ▼
┌──────────────────────────────┐
│ Job 2: Security Scan         │
│  └─ Trivy: backend + frontend│
│      images (CRITICAL/HIGH)  │
└──────────────┬───────────────┘
               ▼
┌──────────────────────────────┐
│ Job 3: Build & Push Images   │
│  ├─ backend → ghcr.io/.../   │
│  │   backend-app:<version>   │
│  └─ frontend → ghcr.io/.../  │
│      front-end-app:<version> │
└──────────────┬───────────────┘
               ▼
┌──────────────────────────────┐
│ Job 4: Update GitOps         │
│  └─ Update kustomization.yaml│
│      image tags → git commit │
└──────────────┬───────────────┘
               ▼
┌──────────────────────────────┐
│ Job 5: Deploy (dev → staging)│
│  └─ kubectl apply -k         │
│      overlays/dev             │
└──────────────┬───────────────┘
               ▼
┌──────────────────────────────┐
│ Job 6: Deploy PROD           │
│  └─ ✋ MANUAL APPROVAL req    │
│  └─ kubectl apply -k         │
│      overlays/prod            │
└──────────────────────────────┘
```

### 5.2 Push Project to GitHub

```bash
# GitHub pe naya repo banao (empty, no README)
# Phir:
cd /mnt/e/Learnings/Cloud-cyber/Cloud-native/Ecomerce

# Ensure .env not committed (secret!)
cat .gitignore | grep -i ".env"
# Should show: .env

# Add + commit + push
git add .
git commit -m "feat: full-stack e-commerce with CI/CD, monitoring, IaC"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/mxmobilz.git
git push -u origin main
```

### 5.3 Create the CI Workflow — `.github/workflows/ci.yml`

**Create this file:**

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, dev, staging]
  pull_request:
    branches: [main]
  workflow_dispatch:

env:
  REGISTRY: ghcr.io
  BACKEND_APP: backend-app
  FRONTEND_APP: front-end-app
  IMAGE_TAG: ${{ github.sha }}

jobs:

  # ===== Job 1: Backend CI =====
  backend-test:
    name: Backend Lint & Test
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: backend
    steps:
      - uses: actions/checkout@v4
      - uses: shivammathur/setup-php@v2
        with:
          php-version: '8.3'
          extensions: mbstring, pdo, pdo_mysql, zip, gd
          coverage: none
      - name: Install PHP dependencies
        run: composer install --no-interaction --prefer-dist
      - name: PHP Syntax Check (all files)
        run: find app routes database -name "*.php" -print0 | xargs -0 -n1 php -l
      - name: PHPStan Static Analysis
        run: vendor/bin/phpstan analyse --no-progress
      - name: PHPUnit Tests
        run: |
          cp .env.example .env
          php artisan key:generate
          vendor/bin/phpunit --testsuite=Unit
      - name: Pint Code Style
        run: vendor/bin/pint --test || true   # non-blocking

  # ===== Job 2: Frontend CI =====
  frontend-test:
    name: Frontend Lint & Build
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: frontend
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json
      - name: Install dependencies
        run: npm ci
      - name: Lint
        run: npm run lint
      - name: Typecheck
        run: npx tsc --noEmit
      - name: Build
        run: npm run build
      - name: Upload build artifact
        uses: actions/upload-artifact@v4
        with:
          name: frontend-dist
          path: frontend/dist

  # ===== Job 3: Terraform Validation =====
  terraform-validate:
    name: Terraform Validate
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: hashicorp/setup-terraform@v3
        with:
          terraform_version: 1.9.0
      - name: Init (no backend)
        run: cd infra/env/dev && terraform init -backend=false
      - name: Validate
        run: cd infra/env/dev && terraform validate
      - name: Format check
        run: terraform fmt -check -recursive infra/

  # ===== Job 4: Build & Push Images =====
  build-images:
    name: Build & Push Docker Images
    needs: [backend-test, frontend-test, terraform-validate]
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    strategy:
      matrix:
        include:
          - service: backend
            context: ./backend
            dockerfile: ./backend/Dockerfile
            image: backend-app
          - service: frontend
            context: ./frontend
            dockerfile: ./frontend/Dockerfile
            image: front-end-app
    steps:
      - uses: actions/checkout@v4
      - name: Login to GHCR
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3
      - name: Build & Push
        uses: docker/build-push-action@v5
        with:
          context: ${{ matrix.context }}
          file: ${{ matrix.dockerfile }}
          push: true
          tags: |
            ghcr.io/${{ github.repository_owner }}/${{ matrix.image }}:latest
            ghcr.io/${{ github.repository_owner }}/${{ matrix.image }}:${{ env.IMAGE_TAG }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
      - name: Trivy Security Scan
        uses: aquasecurity/trivy-action@0.19.0
        with:
          image-ref: ghcr.io/${{ github.repository_owner }}/${{ matrix.image }}:${{ env.IMAGE_TAG }}
          format: 'table'
          exit-code: '1'
          ignore-unfixed: true
          severity: CRITICAL,HIGH

  # ===== Job 5: Update GitOps (deploy version) =====
  update-gitops:
    name: Update GitOps Manifest
    needs: build-images
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v4
        with:
          ref: main
      - name: Install Kustomize
        run: |
          curl -sL https://raw.githubusercontent.com/kubernetes-sigs/kustomize/master/hack/install_kustomize.sh | bash
          sudo mv kustomize /usr/local/bin/kustomize
      - name: Update image tags (dev)
        run: |
          IMAGE_TAG=${{ env.IMAGE_TAG }}
          sed -i "s|image: .*/backend-app:.*|image: ghcr.io/${{ github.repository_owner }}/backend-app:${IMAGE_TAG}|g" \
            gitops/overlays/dev/kustomization.yaml
          sed -i "s|image: .*/front-end-app:.*|image: ghcr.io/${{ github.repository_owner }}/front-end-app:${IMAGE_TAG}|g" \
            gitops/overlays/dev/kustomization.yaml
      - name: Validate kustomize
        run: kustomize build gitops/overlays/dev > /tmp/render.yaml
      - name: Commit GitOps changes
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
          git add gitops/overlays/dev/kustomization.yaml
          if git diff --cached --quiet; then
            echo "No changes"; exit 0
          fi
          git commit -m "chore(gitops): deploy ${{ env.IMAGE_TAG }} to dev"
          git push
```

### 5.4 Manual Prod Approval Workflow — `.github/workflows/deploy-prod.yml`

```yaml
name: Deploy Production

on:
  workflow_dispatch:
    inputs:
      environment:
        description: 'Environment to deploy'
        required: true
        default: 'prod'
        type: choice
        options:
          - prod

permissions:
  contents: write
  id-token: write
  packages: write

jobs:
  deploy-prod:
    name: Deploy to Production (EKS)
    runs-on: ubuntu-latest
    environment: prod                # ← Manual approval gate
    steps:
      - uses: actions/checkout@v4
      - name: Configure AWS creds (OIDC)
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::YOUR_ACCOUNT:role/gh-oidc-role
          aws-region: us-east-1
      - name: Install kustomize
        run: |
          curl -sL https://raw.githubusercontent.com/kubernetes-sigs/kustomize/master/hack/install_kustomize.sh | bash
          sudo mv kustomize /usr/local/bin/kustomize
      - name: Get EKS kubeconfig
        run: |
          aws eks update-kubeconfig --region us-east-1 --name mxmobilz-prod
      - name: Apply prod overlays
        run: |
          kustomize build gitops/overlays/prod | kubectl apply -f -
      - name: Wait for rollout
        run: |
          kubectl rollout status deployment/backend -n cloud-native-ecomerce-prod --timeout=300s
          kubectl rollout status deployment/frontend -n cloud-native-ecomerce-prod --timeout=300s
      - name: Verify production
        run: |
          kubectl get pods -n cloud-native-ecomerce-prod
          curl -s http://mxmobilz.local/api/health
```

### 5.5 Set GitHub Secrets

**GitHub → Settings → Secrets and variables → Actions → New repository secret:**

| Secret | Value | Purpose |
|--------|-------|---------|
| `AWS_ACCOUNT_ID` | `123456789012` | For OIDC role |
| `AWS_REGION` | `us-east-1` | AWS region |
| `GHCR_TOKEN` | (GITHUB_TOKEN auto) | Only if using PAT |

**AWS OIDC setup (for AWS deploy without static keys):**

```bash
# 1. Create OIDC provider + role in AWS:
#    AWS Console → IAM → Identity providers → Add provider
#    Provider URL: https://token.actions.githubusercontent.com
#    Audience: sts.amazonaws.com

# 2. Create role with trust policy:
#    {
#      "Version": "2012-10-17",
#      "Statement": [{
#        "Effect": "Allow",
#        "Principal": {"Federated": "arn:aws:iam::YOUR_ACCOUNT:oidc-provider/token.actions.githubusercontent.com"},
#        "Action": "sts:AssumeRoleWithWebIdentity",
#        "Condition": {
#          "StringEquals": {"token.actions.githubusercontent.com:aud": "sts.amazonaws.com"},
#          "StringLike": {"token.actions.githubusercontent.com:sub": "repo:YOUR_USER/mxmobilz:*"}
#        }
#      }]
#    }

# 3. Attach policies: AmazonEKSFullAccess, AmazonRDSFullAccess, IAMFullAccess
```

### 5.6 Run the Pipeline

```bash
# Trigger manually:
# GitHub → Repo → Actions → "CI/CD Pipeline" → Run workflow

# Or automatically:
git add .
git commit -m "test: run CI pipeline"
git push origin main

# Watch in GitHub → Actions → CI/CD Pipeline
```

---

## Phase 6 — Local Kubernetes (Kind + Helm + GitOps)

> Is phase me tum **production-like** K8s cluster pe same app deploy karoge —
> Kind (3-node), MySQL StatefulSet, Backend Helm, Frontend, Ingress.

### 6.1 Create Kind Cluster

```bash
# Check kind.yaml exists
cat gitops/base/kind.yaml
# Should show 3 nodes (control-plane + 2 workers)

# Create cluster (from repo root)
kind create cluster --config gitops/base/kind.yaml --name mxmobilz-prod

# Verify 3 nodes Ready
kubectl get nodes
# NAME                              STATUS   ROLES
# mxmobilz-prod-control-plane       Ready    control-plane,master
# mxmobilz-prod-worker              Ready    <none>
# mxmobilz-prod-worker2             Ready    <none>
```

### 6.2 Deploy with Bootstrap (one command)

```bash
# If you have a bootstrap script... otherwise manual below
```

### 6.3 Manual Deploy (Step by Step)

**Namespace + Secrets:**
```bash
kubectl apply -f gitops/base/namespace.yaml
kubectl apply -f gitops/base/mysql/mysql-secret.yaml
```

**MySQL StatefulSet + PVC:**
```bash
kubectl apply -f gitops/base/mysql/mysql-stack.yaml

# Wait for mysql-0 ready
kubectl wait --for=condition=Ready pod/mysql-0 -n cloud-native-ecomerce-dev --timeout=180s

# Verify
kubectl get pvc -n cloud-native-ecomerce-dev
# NAME              STATUS   VOLUME
# data-mysql-0      Bound    pvc-xxxx
```

**Backend (Helm chart):**
```bash
# Purana backend Helm chart kya hai? Project me gitops/base/backend/ hai
# Ye Helm nahi, plain Deployment hai. Deploy karo:
kubectl apply -k gitops/overlays/dev
```

**Verify pods:**
```bash
kubectl get pods -n cloud-native-ecomerce-dev
# NAME                       READY   STATUS
# backend-xxxx               2/2     Running
# frontend-xxxx              1/1     Running
# mysql-0                    1/1     Running
```

### 6.4 Install Ingress Controller

```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.10.1/deploy/static/provider/kind/deploy.yaml

# Wait
kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=180s
```

### 6.5 Apply Ingress + Access

```bash
kubectl apply -f gitops/base/ingress/ingress.yaml

# Add to /etc/hosts (Windows: C:\Windows\System32\drivers\etc\hosts)
echo "127.0.0.1  mxmobilz.local" | sudo tee -a /etc/hosts

# Test
curl -H "Host: mxmobilz.local" http://localhost/api/products
# → {"ok":true,"data":[...]}
```

### 6.6 Install Monitoring on Kind

```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

helm install monitoring prometheus-community/kube-prometheus-stack \
  -n monitoring --create-namespace \
  --set grafana.adminPassword=admin \
  --set prometheus.prometheusSpec.retention=15d \
  --wait --timeout 300s

# Apply custom CRDs
kubectl apply -f monitoring/k8s/servicemonitor-backend.yaml
kubectl apply -f monitoring/k8s/prometheusrule-app-alerts.yaml
kubectl apply -f monitoring/k8s/prometheusrule-infra-alerts.yaml
kubectl apply -f monitoring/k8s/prometheusrule-mysql-alerts.yaml
kubectl apply -f monitoring/k8s/grafana-dashboards-cm.yaml

# Access
kubectl port-forward -n monitoring svc/monitoring-grafana 3001:80
# → http://localhost:3001 (admin/admin)
```

### 6.7 Install ArgoCD (GitOps)

```bash
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
kubectl wait --for=condition=Ready pods --all -n argocd --timeout=300s

# Get admin password
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d

# Access UI
kubectl port-forward -n argocd svc/argocd-server 8080:443
# → https://localhost:8080 (admin / password above)
```

**Apply GitOps root application:**
```bash
# Ensure gitops/ is pushed to github first
kubectl apply -f gitops/argocd/projects/mxmobilz-project.yaml
kubectl apply -f gitops/argocd/applications/root-application.yaml

# Verify
kubectl get applications -n argocd
# mxmobilz-root, mxmobilz-dev, mxmobilz-staging, mxmobilz-prod
```

---

## Phase 7 — AWS Deployment (Real Cloud)

> **Warning:** AWS charges money! Dev = ~$30-50/mo, Staging = ~$100-150/mo,
> Prod = ~$200-300/mo. Destroy khi use nahi karo.

### 7.1 AWS Setup + Terraform

```bash
# 1. AWS credentials configure karo
aws configure
# AWS Access Key ID: ......
# AWS Secret Access Key: ......
# Region: us-east-1
# Output format: json

# Verify
aws sts get-caller-identity
# → Your account ID + ARN

# 2. Deploy Terraform backend (S3 + DynamoDB for state)
cd infra/remote-backend
terraform init
terraform apply -auto-approve
# Creates: S3 bucket (mxmobilz-tfstate), DynamoDB lock table
cd ../

# 3. Deploy dev environment infrastructure
cd infra/env/dev
terraform init
terraform plan -out=tfplan    # review changes carefully
terraform apply tfplan        # takes 10-15 min (EKS cluster)
cd ../..
```

**Expected Terraform apply output (key values):**
```
eks_cluster_id           = "mxmobilz-dev"
eks_endpoint             = "https://xxxxxx.gr7.us-east-1.eks.amazonaws.com"
rds_address              = "mxmobilz-dev-mysql.xxxxx.us-east-1.rds.amazonaws.com"
rds_password_secret_id   = "mxmobilz/mysql/password"
```

### 7.2 Connect kubectl to EKS

```bash
cd infra/env/dev
aws eks update-kubeconfig --region us-east-1 --name mxmobilz-dev

# Verify
kubectl get nodes
# NAME                               STATUS   ROLES
# ip-10-0-1-xx.ec2.internal          Ready    <none>
# ip-10-0-2-xx.ec2.internal          Ready    <none>
```

### 7.3 Deploy Application to EKS

```bash
# App manifests deploy karo
# Option A: GitOps (ArgoCD)
kubectl apply -f gitops/argocd/applications/root-application.yaml

# Option B: Direct kustomize
kubectl apply -k gitops/overlays/dev

# Verify
kubectl get pods -n cloud-native-ecomerce-dev -w
# backend-xxx, frontend-xxx, mysql-0  — all Running
```

### 7.4 Configure RDS Database

**Backend uses RDS instead of in-cluster MySQL:**
```bash
# Get RDS connection
cd infra/env/dev
DB_HOST=$(terraform output -raw rds_address)
DB_PASS=$(aws secretsmanager get-secret-value \
  --secret-id $(terraform output -raw rds_password_secret_id) \
  --query 'SecretString' --output text | jq -r '.password')

# Create database
mysql -h $DB_HOST -P 3306 -u admin -p$DB_PASS -e "CREATE DATABASE IF NOT EXISTS mxmobilz_db;"

# Update backend deployment to use RDS (not in-cluster MySQL)
# → edit gitops/base/backend/deployment.yaml
#   change DB_HOST to $DB_HOST
```

### 7.5 Load Balancer + Access

```bash
# Ingress controller install karo
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.10.1/deploy/static/provider/aws/deploy.yaml

# Apply ingress
kubectl apply -f gitops/base/ingress/ingress.yaml

# Get external LB URL
kubectl get svc -n ingress-nginx ingress-nginx-controller
# EXTERNAL-IP: a1b2c3d4....elb.amazonaws.com

# Test
curl http://a1b2c3d4....elb.amazonaws.com/api/products
# → {"ok":true,"data":[...]}
```

### 7.6 Set Up Monitoring on AWS (EKS)

```bash
# Prometheus + Grafana via Helm
helm install monitoring prometheus-community/kube-prometheus-stack \
  -n monitoring --create-namespace \
  --set grafana.adminPassword=admin

# Apply custom configs (same CRDs as local)
kubectl apply -f monitoring/k8s/
```

### 7.7 Set Up ArgoCD on AWS

```bash
# Or use Argo CD manifest
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Apply GitOps root app
kubectl apply -f gitops/argocd/projects/mxmobilz-project.yaml
kubectl apply -f gitops/argocd/applications/root-application.yaml
```

---

## Phase 8 — Production Verification (Complete Checklist)

### 8.1 URL Access

| URL | Service | Check |
|-----|---------|-------|
| `http://<LB>/` | Frontend | Landing page loads |
| `http://<LB>/#/shop` | Shop | Products grid |
| `http://<LB>/#/admin` | Admin | KPIs + tables |
| `http://<LB>/api/health` | API | `{"ok":true}` |
| `http://<LB>/api/products` | API | Products list |
| `http://<LB>/api/stats` | Admin API | KPIs JSON |

### 8.2 Full Stack Verification

```bash
# 1. Pods healthy?
kubectl get pods -A | grep -E "backend|frontend|mysql"
# 2. Deployments up?
kubectl get deployment -A
# 3. Services reachable?
kubectl get svc -A
# 4. Podes share PVC?
kubectl get pvc -A
# 5. Secrets exist?
kubectl get secrets -n cloud-native-ecomerce-dev
# 6. HPA scaling?
kubectl get hpa -A
```

### 8.3 Monitoring Dashboard Check

```
Grafana: http://localhost:3001
1. Dashboards → Mxmobilz → Application Overview
2. Sab panes me data dikhna chahiye:
   - Backend API: green (UP)
   - MySQL: green (UP)
   - PHP-FPM: Process pool
   - CPU: under 80%
   - Disk: under 85%
   - Request rate: moving
3. Alerts → No "firing" alerts (sab inactive)
4. Prometheus: http://localhost:9090
   - Targets: saray UP
   - ServiceMonitors: mxmobilz-backend, mxmobilz-mysql
```

### 8.4 Load Test Against Production

```bash
# load-test.js me URL production pe point karo
# Line 19: http.get('http://YOUR_LB_URL/')

k6 run load-test.js
# Check: fail rate < 1%, p95 < 1s
```

### 8.5 Disaster Recovery Test (Optional)

```bash
# Simulate backend crash
kubectl delete pod -l app=backend -n cloud-native-ecomerce-dev
# K8s auto-restart karega (self-healing)
kubectl get pods -n cloud-native-ecomerce-dev -w
# Naya pod Running ho jayega

# Simulate MySQL pod deletion (PVC survives!)
kubectl delete pod mysql-0 -n cloud-native-ecomerce-dev
# Naya pod same PVC le leta hai — data safe
kubectl get pvc -n cloud-native-ecomerce-dev
# data-mysql-0: Bound (data intact)
```

### 8.6 ArgoCD Health Check

```bash
# Sync status
kubectl get applications -n argocd
# mxmobilz-* : Synced + Healthy (green)

# ArgoCD UI
kubectl port-forward -n argocd svc/argocd-server 8080:443
# → https://localhost:8080
# Apps: dev, staging, prod — all Synced
```

---

## 📊 Summary — What You've Done

| # | Task | Status |
|---|------|--------|
| 1 | Run full stack locally (Docker) | ✅ |
| 2 | Test all API endpoints | ✅ |
| 3 | Create test order/inquiry | ✅ |
| 4 | Monitoring: Prometheus + Grafana | ✅ |
| 5 | Verify dashboards + alerts | ✅ |
| 6 | Load test with k6 (100 users) | ✅ |
| 7 | GitHub Actions CI/CD pipeline | ✅ |
| 8 | Local K8s (Kind) deployment | ✅ |
| 9 | ArgoCD GitOps | ✅ |
| 10 | AWS EKS + RDS deployment | ✅ |
| 11 | Production verification | ✅ |

---

## 🚨 Troubleshooting — Common Errors

### Docker startup fail
```bash
# Error: "Bind for 0.0.0.0:3000 failed: port is already allocated"
# → Port conflict. Find + kill:
sudo lsof -i :3000
# Kill process -> docker compose up -d
```

### MySQL not connecting
```bash
# Error: SQLSTATE[HY000] [2002] Connection refused
# Fix 1: MySQL healthy hone tak wait karo
docker compose ps | grep mysql
# Fix 2: .env me DB_HOST=mysql hona chahiye (not 127.0.0.1)
grep DB_HOST backend/.env
```

### Frontend returns 404
```bash
# Fix: :3000 sirf vite dev ke liye hai
# Prod-preview :3005 pe hai (front-prod-preview image)
# Basic check:
curl http://localhost:3000/
```

### GitHub Actions image pull fail
```bash
# Error: "failed to resolve: ghcr.io/... not found"
# Fix: image tag push nahi hui. Check:
# 1. GHCR login token works
# 2. Image built + pushed in "build-images" job
# 3. GitOps image tag = image tag jo push hui
```

### Terraform state locked
```bash
# Error: "Error acquiring the state lock"
# Fix: force unlock (saver raho — state id user configure karna zaroori hai)
terraform force-unlock <LOCK_ID>
```

---

*Last updated: September 7, 2026*
*Source of truth: All commands tested across phases. Monitoring details in docs/monitoring.md, K8s in docs/k8s-production-setup.md, GitOps in docs/gitops-setup.md.*
