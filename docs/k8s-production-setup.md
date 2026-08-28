# Mxmobilz — Kubernetes Production Setup (Source of Truth)

> Yeh document is project ke **entire K8s work** ka single source-of-truth hai.
> Iska maqsad: koi bhi naya person (ya interviewer) isse padh kar poora
> samajh jaye — **konsi file kyun** bani, **kaunse commands** chalane hain,
> **kaise verify** karna hai, **kaise URL se access** karna hai, aur yeh kaam
> **kis level ka** hai (production-style ya nahi).
>
> Har section me 3 cheezein hamesha hain: **WHAT** (kya banaya), **WHY**
> (design decision / mindset — kyun aise kiya), **VERIFY** (kaise check kare
> ki yeh kaam kar raha hai), aur jagah-jagah **ALTERNATIVE** (aur kya kar
> sakte the).

---

## 1. The Big Picture (Ek nazar)

Project 3 services — sab Kubernetes (Kind) ke andar chalta hai:

| Service | What | Image | Port (container) |
|---|---|---|---|
| **MySQL** | Database | `mysql:8.0` | 3306 |
| **Backend** | Laravel API (PHP-FPM) | `hamzasarfraz862/backend-app:1.0.0` | 9000 (FPM) / 8000 (nginx) |
| **Frontend** | React SPA (nginx) | `hamzasarfraz862/front-end-app:1.0.0` | 80 |

**Yahan ek BADHA maayne ka technical point:** Backend image sirf **PHP-FPM**
hai (port 9000, fastcgi protocol) — usme koi web server nahi. Isliye humne
deployment me ek **nginx sidecar** daala jo HTTP port 8000 pe serve karta hai
aur Laravel requests ko FPM (127.0.0.1:9000) tak pahunchata hai. Yeh production
ka standard pattern hai — PHP app always ek web server ke peeche hota hai.
(Iske baare me section 6.3 me detail.)

**Current live state (verified):** backend 3 replicas, frontend 2 replicas,
MySQL 1 pod, sab `Running` & `Ready`. Ingress se `/` (frontend) aur `/api`
(backend) dono `200` dete hain.

---

## 2. Architecture Diagram

```
                    Browser / curl
                 /               \
        (ingress :80)        (NodePort direct)
    host: mxmobilz.local          |        |
             /                    |        |
     [Ingress Controller]   :30080      :30081
            |              (frontend)  (backend)
     /------------------\      |          |
    (/)                 (/api) |          |
     |                    |    |          |
 [frontend-service:80]  [backend-backend-helm:8000]
   (NodePort 30080)      (NodePort 30081)
     |                    |
 [frontend pods x2]   [backend pods x3]
 (nginx / React)      (nginx sidecar :8000 -> FPM :9000)
                            |
                      [mysql svc]  (headless, :3306)
                            |
                      [mysql-0 pod]
                      (StatefulSet)
                            |
                      [PVC data-mysql-0, 5Gi]
```

**Do exposure levels** (production me dono ek saath hote hain):
1. **Ingress (L7 gateway)** — `:80`, host+routing, sabse recommended external entry.
2. **NodePort services** — `frontend :30080`, `backend :30081` — direct service-level
   exposure (kluster-internal / debugging / scaling a single component).

Traffic flow for one API call:
```
Browser --/api/products--> Ingress --> backend service :8000
  --> nginx sidecar :8000 --> fastcgi--> PHP-FPM :9000 --> Laravel
  --> DB_HOST=mysql:3306 --> MySQL
```

---

## 3. Why Kubernetes at all? (vs Docker Compose)

Project me pehle **Docker Compose** working tha (same 3 services).
Ye compare hai — kaun kyun chuna:

| Aspect | Docker Compose (dev) | Kubernetes (prod) |
|---|---|---|
| Scaling | Manual | Auto (HPA) / `replicas` |
| Self-healing | Nahi | Pod crash → auto restart |
| Service discovery | Compose network | DNS `svc.ns.svc.cluster.local` |
| Secrets | env file (plain) | `Secret` + `secretKeyRef` |
| Storage | volume (host-bound) | PVC + StorageClass |
| Rollout/rollback | Rebuild manually | Rolling update + rollback |
| Multi-node | Single host | Multi-worker nodes |
| Abstraction for cloud | Nahi | EKS/AKS/GKE = same manifests |

**WHY:** Compose single-host tool hai. Recruiter-facing goal production-grade
orchestration dekhana hai — and that's exactly K8s ki domain. Also: same YAML
Cloud (EKS/AKS) pe bhi chalta. **isliye K8s.**

**Mindset:** koi bhi company me jo "microservices / container orchestrator"
ke kaam karta hai, wo aaj K8s expect karta hai. Compose sirf local dev.

---

## 4. Files — WHAT, WHY, VERIFY, ALTERNATIVE

Kaam **kitni hi file** hai, har ek ka purpose niche. `k8s/` tree (clean, sab use:

```
k8s/
├── kind.yaml                        # 3-node Kind cluster (production config)
├── namespace.yaml                   # app namespace
├── bootstrap.sh                     # ONE-command full setup
├── mysql/
│   ├── mysql-secret.yaml            # DB credentials (Secret)
│   └── mysql-stack.yaml             # MySQL StatefulSet + headless svc + PVC
├── backend/
│   └── backend-helm/                # Helm chart for backend
│       ├── Chart.yaml
│       ├── values.yaml              # image, replicas, probes, resources
│       └── templates/
│           ├── deployment.yaml      # nginx sidecar + FPM + secret env
│           ├── service.yaml         # ClusterIP :8000
│           ├── nginx-configmap.yaml # nginx sidecar config (fastcgi->FPM)
│           ├── serviceaccount.yaml
│           ├── hpa.yaml / ingress.yaml / httproute.yaml  # disabled by default
│           └── tests/test-connection.yaml
├── frontend/
│   └── frontend-deployment.yaml     # React(nginx) Deployment + ClusterIP svc
└── ingress/
    └── ingress.yaml                 # routes / -> frontend, /api -> backend
```

### 4.1 `k8s/kind.yaml` — Local multi-node cluster

```yaml
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
name: mxmobilz-prod
nodes:
  - role: control-plane
    kubeadmConfigPatches:
      - |
        kind: InitConfiguration
        nodeRegistration:
          kubeletExtraArgs:
            node-labels: "ingress-ready=true"
    extraPortMappings:
      - containerPort: 80; hostPort: 80
      - containerPort: 443; hostPort: 443
  - role: worker
  - role: worker
```

**WHAT:** 3-node Kind cluster (1 control-plane + 2 workers), production-like HA
topology.

**WHY (dono important configs):**
- **`ingress-ready=true` label** — ingress-nginx ka offical Kind manifest isi
  label wale node pe schedule hota hai. Bina iske controller `Pending` rehta
  hai (hum isko live dekhe — failed scheduling). Isliye control-plane pe lagaya.
- **`extraPortMappings` (hostPort 80/443)** — browser/curl se seedha
  `http://localhost:80` access karne ke liye. Iske bina sirf `kubectl
  port-forward` se pahunch sakte — jo "production-like" nahi lagta.

**WHY multi-node:** production me HA (kabhi ek node down ho to baaki chale).
Single-node (minikube) se ye demo nahi dikhta.

**VERIFY:**
```bash
kubectl get nodes          # 3 nodes, all Ready
kubectl get nodes --show-labels | grep ingress-ready   # control-plane pe label
```

**ALTERNATIVE:** minikube (single node, aasan), kubeadm (real prod, heavy),
managed EKS (asli company me). **Choice:** Kind = cheapest real multi-node.

---

### 4.2 `k8s/namespace.yaml` — Isolation

```yaml
kind: Namespace
metadata:
  name: cloud-native-ecomerce-app
```

**WHY:** saare app resources ek jagah, alag from system (kube-system etc.).
Clean management + RBAC boundary.

---

### 4.3 `k8s/mysql/mysql-secret.yaml` — Credentials (Secret)

```yaml
type: Opaque
stringData:
  mysql-root-password: root-dev-password
  mysql-password:      ecommerce-dev-password
  mysql-database:      ecommerce
  mysql-username:      ecommerce
```

**WHAT:** Kubernetes `Secret` — DB creds.

**WHY:** Passwords **kabhi bhi** manifest/image me hardcoded nahi hote. Backend
pods runtime me `secretKeyRef` se inhe read karte hain (API se, image me nahi).
Secret by default base64-encoded + apne namespace me RBAC-protected.

**WHAT IF NOT THERE:** Backend authenticate hi nahi kar pata →
`SQLSTATE[HY000] connection refused` → API 500 errors.

**VERIFY:**
```bash
kubectl get secret mysql-app-secret -n cloud-native-ecomerce-app -o yaml
```

**ALTERNATIVE:** Vault / External-Secrets-Operator (real prod, heavy), plain
env in YAML (BAD — visible in git). **Choice here:** native Secret = sahi demo.

---

### 4.4 `k8s/mysql/mysql-stack.yaml` — MySQL (StatefulSet + Service)

**WHAT:** StatefulSet (`mysql`, 1 replica) + headless Service (`mysql:3306`) +
volumeClaimTemplate (PVC 5Gi) + probes + resources.

**WHY StatefulSet (na ki Deployment) — BAHUT MAHATVPURNA interview point:**
- Database = **stateful** workload ko **stable identity** (`mysql-0`) aur
  **stable storage** chahiye.
- `volumeClaimTemplates` har pod ke liye apna `PVC` auto-provision karta hai.
  Pod mar jaye to naya pod **same PVC** le leta hai → **data safe**.
- `Deployment` use karte to pod reschedule par **data loss** hota.
- **Headless service** (`clusterIP: None`) → stable DNS
  `mysql-0.mysql.<ns>.svc.cluster.local` — backend isi se DB dhoonta hai.
- **probes** (`mysqladmin ping`) → readiness/liveness self-healing.

**WHY NOT Helm chart for MySQL:** pehle `mysql-values.yaml` (Bitnami chart)
thi wo sirf values tha — `kubectl apply` kuch karta nahi tha. Isliye raw
StatefulSet banaya jo **actually deploys** aur understanding dikhata hai.

**VERIFY:**
```bash
kubectl get pods -n cloud-native-ecomerce-app | grep mysql   # mysql-0 1/1 Running
kubectl get pvc -n cloud-native-ecomerce-app                 # data-mysql-0 Bound 5Gi
kubectl exec mysql-0 -n cloud-native-ecomerce-app -- \
  mysql -uecommerce -pecommerce-dev-password -e "SHOW DATABASES;"
```

**ALTERNATIVE:** managed RDS (real prod, ~70% companies), MySQL Operator
(CloudNativePG, auto-failover), ExternalName to VM DB. **Choice here:**
raw StatefulSet — lean + demonstrates YAML-level understanding.

---

### 4.5 `k8s/backend/backend-helm/` — Backend (Helm chart)

Helm = "template + values" — ek chart se alag env ke liye alag config.
`values.yaml` me sab knobs (image, replicas, probes, resources).

**Key files:**
- `values.yaml` — replicas=3, image, probes `/api/products`, resources.
- `templates/deployment.yaml` — **2 containers** (nginx sidecar + FPM) + init
  container + secret env.
- `templates/service.yaml` — **NodePort :8000** (exposed as `:30081`).
- `templates/nginx-configmap.yaml` — nginx sidecar config (fastcgi → FPM).

**VERIFY (render without applying):**
```bash
helm template backend k8s/backend/backend-helm -n cloud-native-ecomerce-app
```

---

### 4.6 Backend deployment — the critical piece (split into why)

Backend image sirf **PHP-FPM** hai (`CMD php-fpm -F`, `EXPOSE 9000`), koi web
server nahi. Production me PHP always nginx/apache ke peeche. Isliye humne
**2-container pod** (sidecar pattern) banaya:

```
pod/backend-backend-helm
├── init container: app-copy
│     image: backend-app
│     cp -r /var/www/html/. -> shared emptyDir (/var/www/html)
│     WHY: nginx container ko bhi Laravel code dikhe; 2 containers share karte
│           hain ek emptyDir volume.
│
├── container: nginx          (sidecar)
│     image: nginx:1.27-alpine
│     port 8000 (http)        <- service/probes isi se
│     config from nginx-configmap (fastcgi_pass 127.0.0.1:9000)
│     volumeMount: /var/www/html (shared)
│
└── container: backend-helm   (main, PHP-FPM)
      image: backend-app
      port 9000 (fpm)
      env DB_* from mysql-app-secret
      volumeMount: /var/www/html (shared)
```

**WHY sidecar over running nginx inside fpm image:** separations of concerns —
fpm image clean rehta hai; nginx layer server-level HTTP/config changes handle
karta hai. Real companies bhi PHP apps aise deploy karte hain (fpm + sidecar
nginx).

**Probes = `/api/products`** (HTTP 200) instead of `/`:
- Pehle probe `/` pe thi → **404** milta (Laravel ke paas `/` route hi nahi,
  sirf `/api/*`). 404 = liveness fail → pod crash-loop.
- `/api/products` full-stack verify karta hai (nginx → fpm → Laravel → MySQL)
  — true "am I really serving" health check. 200 = ready.

**DB env from secret:** `DB_HOST=mysql`, `DB_DATABASE/USERNAME/PASSWORD` from
`secretKeyRef`. **Without these:** backend ko DB milta hi nahi → 500s (issi
ko pehle live fix kiya — root cause tha).

**VERIFY:**
```bash
kubectl get pods -n cloud-native-ecomerce-app | grep backend   # 3x 2/2 Running
kubectl exec deploy/backend-backend-helm -n cloud-native-ecomerce-app -c backend-helm -- \
  php -r 'new PDO("mysql:host=mysql;dbname=ecommerce","ecommerce","ecommerce-dev-password"); echo "CONNECTED\n";'
```

---

### 4.7 `k8s/frontend/frontend-deployment.yaml` — React SPA

**WHAT:** 2 replicas, nginx serving built React app, **NodePort** svc on 80
(`:30080` expose), `BACKEND_URL=http://backend-backend-helm:8000` env, probes `/`.

**WHY BACKEND_URL:** prod nginx image me `/api` reverse-proxy built-in hai jo
`BACKEND_URL` env se backend service ko point karta hai. (envsubst se nginx
conf me inject hota hai.)

**BIG gotcha (fix kita):** pehle `BACKEND_URL=http://backend-helm:8000` likha
tha — but actual service **`backend-backend-helm`** hai (Helm fullname). Nginx
"host not found in upstream" error do ke CrashLoopBackOff. Fix:
`backend-backend-helm:8000`.

**VERIFY:**
```bash
kubectl get pods -n cloud-native-ecomerce-app | grep frontend   # 2x 1/1 Running
# nginx logs pe "host not found" error nahi hona chahiye
kubectl logs -l app=frontend-app -n cloud-native-ecomerce-app --tail=20
```

---

### 4.8 `k8s/ingress/ingress.yaml` — Single entry point (L7)

```yaml
rules:
  - host: mxmobilz.local
    paths:
      - path: /    -> frontend-service:80
      - path: /api -> backend-backend-helm:8000
```

**WHY:** production me ek hi gateway (L7 reverse proxy) hota hai — individual
NodePort nahi. Host-based + path-based routing, aur aage TLS termination ki
jagah yehi hoga.

**BIG gotcha (fix kita):** pehle `nginx.ingress.kubernetes.io/rewrite-target: /`
tha → `/api/products` ko `/products` strip kar ke backend bhejta tha, jo
Laravel me route nahi → **404**. Backend khud `/api/*` routes expect karta hai,
isliye rewrite-target HATA diya. Ab `/api/products` → backend `/api/products`
→ 200.

Also service name pahle `backend-helm` tha → `backend-backend-helm` kiya.

**VERIFY after install controller (section 6.5):**
```bash
kubectl get ingress -n cloud-native-ecomerce-app   # mxmobilz-ingress
```

---

## 5. The Design Mindset (WHAT we were thinking)

Ye core "khani" hai jo interviewer ko sunani hai — **kya sochke** decisions
liye:

1. **Start with correctness, not speed.** MySQL image digest issue, service
   names, probe paths — har ek ko verify kar ke chale (kabhi assume nahi kiya).
2. **Let Kubernetes do its job.** Pods restart karo (self-healing), probes
   laga ke "ready" define karo, PVC se data persist karo.
3. **Stateful vs Stateless ka farq samajhna.** DB = StatefulSet+PVC, app =
   Deployment (stateless, scalable).
4. **Secrets kabhi plaintext me nahi.** `secretKeyRef` se.
5. **One tool has one job.** MySQL=raw StatefulSet (control), backend=Helm
   (parameterization), frontend=simple YAML (static).
6. **Debug = read the logs, don't guess.** Har problem ke liye `kubectl
   describe/logs` dekha: probe 404, host-not-found, admin pingve — sab log se.

---

## 6. Actual Problems We Hit — and What They Taught Us

### 6.1 Backend pod `CrashLoopBackOff` — probe `tcpSocket :8000` refused
**Symptom:** ready raha nahi, logs "connection refused on :8000".
**Root cause:** Backend image sirf PHP-FPM hai (port **9000**), 8000 pe koi
web server listening hi nahi. Probe 8000 → refused.
**Fix:** nginx sidecar (8000) + fpm (9000). Service 8000 pe nginx hi hai.
**Lesson:** pehle pata karo port pe kya serve ho raha hai (`docker run --entrypoint
sh img -c "which nginx php-fpm"`), phir probes/service banaye.

### 6.2 Init container `cp` failed — "Operation not permitted"
**Symptom:** `app-copy` init container BackOff — `cp: preserving times`.
**Root cause:** `cp -a` emptyDir pe timestamps preserve nahi kar pata.
**Fix:** `cp -r` (+ `|| true`). Content copy ho gaya.
**Lesson:** ko command fail kyun hoti hai — error padho, uspare fix.

### 6.3 Probe `/` returned 404 → crash-loop
**Root cause:** Laravel ke paas `/` route nahi (sirf `/api/*`) — 404 = liveness
fail.
**Fix:** probe `/api/products` (200 = ready, full-stack health).
**Lesson:** probes ko **app ka real health-endpoint** lagao, landing page pe nahi.

### 6.4 Frontend "host not found in upstream backend-helm"
**Root cause:** service ka asli naam `backend-backend-helm` (Helm fullname),
env me `backend-helm` tha.
**Fix:** `BACKEND_URL=http://backend-backend-helm:8000`.
**Lesson:** Helm `{{ .Chart.Name }}-{{ .Release.Name }}` naming ka pata hona.

### 6.5 Ingress controller `Pending` (0/3 nodes)
**Root cause:** kind node pe `ingress-ready=true` label nahi.
**Fix:** kind.yaml control-plane pe label + hostPort mapping.
**Lesson:** ingress-nginx (kind) ko missi label chahiye; bina uske schedule nahi
hota.

### 6.6 Ingress `/api/products` 404 (JSON JSON from frontend, not backend)
**Root cause:** `rewrite-target: /` strip karta tha `/api`.
**Fix:** annotation hata diya. → 200.
**Lesson:** rewrite-target ka matlab samjho; API jo path expect kare wahi do.

### 6.7 MySQL image `kind load` digest not found
**Symptom:** `ctr: content digest not found`.
**Workaround:** direct DockerHub pull se cluster ko image mile (works ~3m).
**Lesson:** kind apna containerd chalt; kabhi local load fail ho to pull bhi kar
sakta.

---

## 7. How to Actually See It — URL se access

Ab jab sab ready hai, browser/curl me:

### Bahtar way (production-like) — hostPort mapping se (naya kind.yaml)
`kind.yaml` me control-plane `extraPortMappings: 80->80` hai. To naya cluster
(rebuild ke baad) me:

```bash
# /etc/hosts me ek line (Windows C:\Windows\System32\drivers\etc\hosts)
127.0.0.1  mxmobilz.local

# browser:
#   http://mxmobilz.local/          -> React store frontend
#   http://mxmobilz.local/api/products -> JSON API from backend+DB

# curl bhi:
curl -H "Host: mxmobilz.local" http://localhost/api/products
```

> Note: agar naya cluster hostPort ke bina banaya hai (purana), to
> `kubectl port-forward` use karo (neecha).

### Port-forward way (agar hostPort nahi hai)
```bash
# ingress controller ko local:8080 pe lao
kubectl port-forward -n ingress-nginx svc/ingress-nginx-controller 8080:80
# phir:
curl -H "Host: mxmobilz.local" http://localhost:8080/api/products
```

### Cluster-internal check (koi port-forward bina)
```bash
kubectl run curl-test -n cloud-native-ecomerce-app --rm -i --restart=Never \
  --image=curlimages/curl -- curl -s http://frontend-service/api/products
```

**VERIFY commands (sab ek saath):**
```bash
kubectl get pods,svc,ingress -n cloud-native-ecomerce-app
kubectl get pvc -n cloud-native-ecomerce-app
kubectl logs mysql-0 -n cloud-native-ecomerce-app --tail=20
```

---

## 8. How to Run — and WHY bootstrap.sh exists

### `k8s/bootstrap.sh` kya karta hai (9 steps)
1. Docker engine check (WSL integration).
2. Purane kind clusters delete (clean slate — drift avoid).
3. `kind create` fresh production cluster (naya kind.yaml: multi-node + label +
   hostPort).
4. Namespace + Secret apply.
5. Images `kind load` (backend/frontend/mysql) — taaki pods ImagePullBackOff na
   hon (kind apna containerd use karta hai, host Docker images na dekh sakta).
6. MySQL deploy + Ready ka wait (`kubectl wait`).
7. Backend `helm upgrade --install` (chart) `--wait`.
8. Frontend apply.
9. Ingress controller install + ingress apply + verify.

### Kya bootstrap.sh zaroori thi? Kisi aur tarah se kar sakte the?
**Zaroori nahi thi technically** — lekin **behter practise hai**. Alternatives:

| Approach | Pros | Cons |
|---|---|---|
| **bootstrap.sh (chuna)** | 1 command, reproducible, self-documenting | Script bhi maintain karna padta |
| Manual `kubectl apply ...` har alag | Full visibility | Human error, drift, repeatable nahi |
| **Helmfile / ArgoCD (GitOps)** | Real production CD, declarative, auto-sync | Setup heavy — local demo ke liye overkill |
| Makefile / Taskfile | Simple wrappers | Asli logic phir bhi script me |

**Real companies:** ArgoCD/Terraform/Helmfile use karti hain (declarative
GitOps). Humne `bootstrap.sh` isliye chuna kyunki local demo me teek rapid auth
reproducible hai aur koi extra infra nahi chahiye. **Yeh "nai tarah" ka
forward-pointer yehi hai: bootstrap.sh = poor-man's ArgoCD.** Ye interview me
kehnay ka good line hai.

**Run:**
```bash
# Prereq: Docker running, WSL integration ON, docker context default
cd k8s
bash bootstrap.sh
```

---

## 9. Level Assessment — realistic, honest (interview prep)

### Yeh kaam kis LEVEL ka hai?
**"Strong mid-to-senior production-aware EKS/K8s demo"** — detail:

**Jo strong hai (impressive):**
- Multi-node HA topology (Kind) — single-node nahi.
- StatefulSet vs Deployment ka **correct** use (DB stable identity + PVC).
- Headless service + stable DNS.
- Secrets via `secretKeyRef`, no plaintext.
- Probes (readiness/liveness) on a **real health endpoint** (`/api/products`).
- Resource requests/limits.
- Helm chart for backend (parameterized).
- nginx sidecar + FPM pattern (real-world PHP deployment).
- Ingress L7 routing + ingress-nginx controller.
- Persistent storage (PVC) — data survives pod death.
- One-command reproducible bootstrap.

**Jo GAPS hain (be-hesabi bolna — interviewer ko yahi impress karta hai):**
- **Security:**
  - `securityContext` empty (`runAsNonRoot` nahi, capabilities drop nahi).
  - Secrets base64 dev-passwords (not real, not rotated).
  - No TLS (HTTPS) on ingress — `ssl-redirect: false`.
  - No NetworkPolicy.
- **Observability:** no Prometheus/Grafana, no metrics-server, no centralized
  logs, no `/metrics`.
- **HPA:** `autoscaling.enabled: false` — na scaling auto.
- **DB high-availability:** MySQL sirf 1 replica, no failover, no backup job,
  no scheduled snapshot.
- **Rollout/CD:** bootstrap.sh manually — no ArgoCD/GitOps, no CI pipeline
  (actions), no image tag immutability (uses fixed `1.0.0` tag).
- **Ingress:** no TLS cert, no readiness for external LB.
- **Service account:** default SA (no least-privilege RBAC).

### Interviewer ko kaise bolna hai (honest tone)
> "Yeh production-inspired demo hai jo local multi-node cluster pe chal raha
> hai. Maine K8s ke core chune: StatefulSet for stateful DB with PVC, Helm for
> parameterized backend, sidecar nginx for PHP-FPM, ingress for single L7
> gateway, secrets via secretKeyRef. Main jaanta hoon asli production me iske
> aage NetworkPolicy, managed TLS, Prometheus, HPA aur GitOps (ArgoCD) +
> managed DB (RDS) aate hain — aur wo hi main production environment me
> use karunga. Is SSA demo ka point core mechanics ka correct understanding
> hai, production hardening ka next step hai."

Yehonest + self-aware — **last** impression hai jo interviewer ko yaad rehta.

---

## 10. Production Market Approaches (ref for interviewer)

Real company MySQL database ko K8s me kon run karta — 4 approaches:

| Approach | MySQL location | Scale | Backup | Complex | Cost | Use case |
|---|---|---|---|---|---|---|
| **Managed (AWS RDS/Aurora)** | Cloud outside cluster | Auto | Auto | Low | High | ~70% real prod |
| **StatefulSet (yeh project)** | Inside K8s + PVC | Manual | Manual | Med | Low | Dev/demo/small |
| **DB Operator (CloudNativePG)** | Inside K8s | Auto | Auto | High | Med | Enterprise scale |
| **ExternalName (VM DB)** | Outside VM | External | External | Low | — | Migration |

**Recommendation:** Demo ke liye StatefulSet + PVC sahi hai. Real prod me
managed RDS pointe karo (zero data-ops). Scaling ke liye CloudNativePG.

---

## 11. Commands Cheat-Sheet (quick reference)

```bash
# --- Cluster ---
kind create cluster --config k8s/kind.yaml
kubectl get nodes

# --- Namespace / secret / mysql ---
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/mysql/mysql-secret.yaml
kubectl apply -f k8s/mysql/mysql-stack.yaml
kubectl wait --for=condition=Ready pod/mysql-0 -n cloud-native-ecomerce-app --timeout=180s

# --- Backend (Helm) ---
helm upgrade --install backend k8s/backend/backend-helm -n cloud-native-ecomerce-app \
  --set image.repository=hamzasarfraz862/backend-app \
  --set image.tag=1.0.0 \
  --set replicaCount=3 --wait --timeout 180s

# --- Frontend ---
kubectl apply -f k8s/frontend/frontend-deployment.yaml

# --- Ingress ---
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.10.1/deploy/static/provider/kind/deploy.yaml
kubectl apply -f k8s/ingress/ingress.yaml

# --- Verify ---
kubectl get pods,svc,ingress -n cloud-native-ecomerce-app
kubectl get pvc -n cloud-native-ecomerce-app

# --- Access ---
# hostPort wale naye cluster pe:
curl -H "Host: mxmobilz.local" http://localhost/api/products
# ya port-forward:
kubectl port-forward -n ingress-nginx svc/ingress-nginx-controller 8080:80
curl -H "Host: mxmobilz.local" http://localhost:8080/api/products
```

---

## 12. Key Takeaways (impress-the-recruiter bullets)

1. **StatefulSet vs Deployment** — stateful workloads need stable identity+PVC.
2. **Headless service** — stable per-pod DNS (`mysql-0.mysql.<ns>.svc`).
3. **Secrets via secretKeyRef** — kabhi hardcoded creds nahi.
4. **Probes on real health endpoint** — `/api/products`, not `/`.
5. **Kind multi-node** = cheap production-like HA locally.
6. **Helm** — parameterized deployment, no copy-paste YAML.
7. **nginx sidecar + PHP-FPM** — real-world PHP serving pattern.
8. **Ingress L7** — single gateway, path routing (% + /api).
9. **PVC persistence** — data survives pod restart.
10. **bootstrap.sh** = reproducible one-command infra (poor-man's GitOps).
11. Understood **why** in-cluster StatefulSet now, but **managed RDS is
    market-preferred prod path**.
