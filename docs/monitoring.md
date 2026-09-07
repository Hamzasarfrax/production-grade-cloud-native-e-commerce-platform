# Mxmobilz — Monitoring & Observability (Prometheus + Grafana)

> Yeh document project ke **complete monitoring setup** ka single source-of-truth hai.
> Iska maqsad: koi bhi person (ya interviewer) isse padh kar samjhe — **monitoring
> kyun zaroori hai**, **Prometheus + Grafana kaise setup hai**, **kaise dashboards
> import karein**, **alerts kaise kaam karti hain**, aur yeh kaam **kis level ka** hai.
>
> Har section me **WHAT** (kya banaya), **WHY** (mindset), **VERIFY** (kaise check kare),
> aur **ALTERNATIVE** (aur kya kar sakte the).

---

## 1. The Big Picture — Monitoring Kya Hai?

```
                    ┌──────────────────────────────────────┐
                    │         GRAFANA DASHBOARDS            │
                    │   (Visualize → What's happening?)     │
                    └──────────────────┬───────────────────┘
                                       │ Query (PromQL)
                    ┌──────────────────▼───────────────────┐
                    │         PROMETHEUS                    │
                    │   (Store → Time-series database)      │
                    │   Scrape interval: 15s                │
                    └──────────────────┬───────────────────┘
                                       │ Pull (HTTP)
         ┌─────────────┬───────────────┼───────────────┬──────────────┐
         ▼             ▼               ▼               ▼              ▼
   ┌──────────┐ ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
   │  Node    │ │ cAdvisor │   │  MySQL   │   │ PHP-FPM  │   │ Blackbox │
   │ Exporter │ │ (Docker) │   │ Exporter │   │ Exporter │   │  Probes  │
   │  :9100   │ │  :8080   │   │  :9104   │   │  :9253   │   │  :9115   │
   └──────────┘ └──────────┘   └──────────┘   └──────────┘   └──────────┘
    Host OS      Containers       MySQL DB       PHP App      HTTP Health
    CPU/RAM      CPU/RAM/Disk     Connections    Workers      API uptime
    Disk/Net     Restarts         Queries        Request rate Response time
```

### Observability Pillars

```
           Observability
        /      |      \
       /       |       \
  Logs     Metrics    Traces
   │          │          │
   ▼          ▼          ▼
Events    Numbers    Sequences
(What?)    (How?)    (Why?)
```

| Pillar | What | Tool | Status |
|--------|------|------|--------|
| **Metrics** | Numerical measurements | Prometheus + Grafana | **Done** |
| **Logs** | Event records | Application logs | Basic (console) |
| **Traces** | Request flow | Jaeger (future) | Pending |

**WHY Metrics first:** Metrics sabse kam storage leti hai aur sabse fast
alerting deti hai. Logs baad me, traces production me.

---

## 2. Architecture — Monitoring Stack

### Docker Compose (Local Dev)

```
                    ┌─────────────────────────────┐
                    │     :3001 Grafana            │
                    │   (Dashboard UI)             │
                    └──────────────┬──────────────┘
                                   │
                    ┌──────────────▼──────────────┐
                    │     :9090 Prometheus         │
                    │   (TSDB + PromQL engine)     │
                    │   Retention: 15 days         │
                    └──────────────┬──────────────┘
                                   │ Pull (15s interval)
         ┌─────────────────────────┼─────────────────────────┐
         │                         │                         │
  ┌──────▼───────┐  ┌──────────────▼──────┐  ┌──────────────▼──────┐
  │ :9100 Node   │  │ :9104 MySQL         │  │ :9253 PHP-FPM       │
  │ Exporter     │  │ Exporter            │  │ Exporter            │
  │              │  │                     │  │                     │
  │ CPU, RAM     │  │ Connections         │  │ Active/Idle procs   │
  │ Disk, Net    │  │ Query rate          │  │ Request rate        │
  │ Filesystem   │  │ Slow queries        │  │ Request duration    │
  └──────────────┘  └─────────────────────┘  └─────────────────────┘
         │                    │                        │
  ┌──────▼───────┐  ┌────────▼────────┐  ┌───────────▼───────────┐
  │ :8080        │  │ :9113 Nginx     │  │ :9115 Blackbox       │
  │ cAdvisor     │  │ Exporter        │  │ Exporter             │
  │              │  │                 │  │                      │
  │ Container    │  │ Connections     │  │ HTTP probe checks    │
  │ CPU/RAM      │  │ Request rate    │  │ API uptime           │
  │ Disk/Net     │  │ Status codes    │  │ Response time        │
  └──────────────┘  └─────────────────┘  └──────────────────────┘
```

### K8s (Production-like) Monitoring

```
    ┌─────────────────────────────────────────────┐
    │     monitoring namespace                     │
    │                                              │
    │  ┌──────────────┐  ┌──────────────────┐     │
    │  │ Prometheus   │  │ Grafana           │     │
    │  │ Operator     │  │ (dashboards)      │     │
    │  │ (helm chart) │  │                   │     │
    │  └──────────────┘  └──────────────────┘     │
    │                                              │
    │  ┌──────────────┐  ┌──────────────────┐     │
    │  │ Alertmanager │  │ kube-state-       │     │
    │  │              │  │ metrics           │     │
    │  └──────────────┘  └──────────────────┘     │
    └─────────────────────────────────────────────┘
                    │
    ┌───────────────┼───────────────┐
    ▼               ▼               ▼
┌────────┐    ┌─────────┐    ┌──────────┐
│ app    │    │ mysql   │    │ ingress  │
│ namespace│  │ namespace│   │ namespace│
│        │    │         │    │          │
│ pods   │    │ pods    │    │ pods     │
│ +Service│   │ +PVC    │    │ +svc     │
│Monitor │    │Monitor  │    │Monitor   │
└────────┘    └─────────┘    └──────────┘
```

---

## 3. Files — WHAT, WHY, VERIFY

```
monitoring/
├── docker-compose.yml                          # Local dev stack (9 services)
├── .env.exporter                               # MySQL exporter credentials
├── prometheus/
│   ├── prometheus.yml                          # Scrape config (all targets)
│   ├── alert-rules.yml                         # 20+ alert rules
│   ├── alertmanager.yml                        # Alert routing + notification
│   └── blackbox.yml                            # HTTP probe modules
├── grafana/
│   ├── provisioning/
│   │   ├── datasources/datasource.yml          # Auto-connect Prometheus
│   │   └── dashboards/dashboard.yml            # Auto-load dashboard JSONs
│   └── dashboards/
│       ├── mxmobilz-overview.json              # Main dashboard (services)
│       └── mxmobilz-kubernetes.json            # K8s cluster dashboard
├── k8s/                                        # K8s CRDs (production)
│   ├── install.sh                              # ONE command install
│   ├── servicemonitor-backend.yaml             # Backend scraping config
│   ├── servicemonitor-mysql.yaml               # MySQL scraping config
│   ├── prometheusrule-app-alerts.yaml          # App + PHP-FPM alerts
│   ├── prometheusrule-infra-alerts.yaml        # Infrastructure alerts
│   ├── prometheusrule-mysql-alerts.yaml        # MySQL alerts
│   └── grafana-dashboards-cm.yaml              # Dashboard auto-load
├── nginx-exporter/
│   └── default.conf                            # nginx stub_status enabled
└── php-fpm/
    └── status.conf                             # PHP-FPM status page config
```

### 3.1 `monitoring/docker-compose.yml` — Monitoring Stack

**WHAT:** 7 monitoring services — Prometheus, Grafana, Alertmanager, 5 exporters.

**WHY each exporter:**

| Exporter | Purpose | Metrics |
|----------|---------|---------|
| **node-exporter** | Host OS | CPU, RAM, disk, network |
| **cAdvisor** | Docker containers | Container CPU/RAM/disk/network |
| **mysqld-exporter** | MySQL database | Connections, queries, slow queries |
| **phpfpm-exporter** | PHP-FPM pool | Active/idle workers, request rate |
| **nginx-exporter** | nginx web server | Connections, request rate, status codes |
| **blackbox-exporter** | HTTP probes | API uptime, response time, SSL |

**WHY separate monitoring compose:** Clean separation of concerns. App stack
and monitoring stack independently manageable. Production me monitoring
alag cluster/namespace me hota hai.

**WHY `networks: app_newtwork: external: true`:** Monitoring stack ko app
containers se connect karna hai (metrics scrape karne ke liye). Bina
external network ke exporters app ko reach nahi kar paate.

**VERIFY:**
```bash
cd monitoring && docker compose up -d
docker compose ps    # 7 services running
curl http://localhost:9090   # Prometheus UI
curl http://localhost:3001   # Grafana UI
```

### 3.2 `prometheus/prometheus.yml` — Scrape Configuration

**WHAT:** Prometheus ko batata hai kahan se metrics collect karni hain.

**Key configs:**
```yaml
global:
  scrape_interval: 15s    # Har 15 sec sab targets scrape
  evaluation_interval: 15s # Har 15 sec alert rules check
```

**WHY 15s:** Balance between freshness and load. 5s = too frequent (high
storage), 60s = too slow (miss spikes). 15s = industry standard for
dev/staging.

**Scrape targets:**

| Job | Target | What it collects |
|-----|--------|-----------------|
| `prometheus` | localhost:9090 | Self-monitoring |
| `node-exporter` | node-exporter:9100 | Host metrics |
| `cadvisor` | cadvisor:8080 | Container metrics |
| `mysqld-exporter` | mysqld-exporter:9104 | MySQL metrics |
| `phpfpm-exporter` | phpfpm-exporter:9253 | PHP-FPM metrics |
| `nginx-exporter` | nginx-exporter:9113 | Nginx metrics |
| `blackbox-http` | blackbox-exporter:9115 | API health probes |
| `blackbox-http-frontend` | blackbox-exporter:9115 | Frontend health probes |

**WHY blackbox probes:** External health check — sirf UP/DOWN nahi,
response time bhi measure hota hai. Agar backend API 5s leta hai to
alert trigger hota hai even if technically "UP".

**VERIFY:**
```bash
# Prometheus targets page
curl http://localhost:9090/api/v1/targets | python3 -m json.tool | head -50
# All targets should show "health: up"
```

### 3.3 `prometheus/alert-rules.yml` — Alert Rules

**WHAT:** 20+ pre-configured alert rules for e-commerce monitoring.

**Alert categories:**

| Group | Alerts | Severity |
|-------|--------|----------|
| **infrastructure** | HighCpu, HighMemory, DiskLow, ContainerRestart | warning/critical |
| **application** | BackendApiDown, HighErrorRate, HighLatency, FrontendDown | critical/warning |
| **php-fpm** | WorkersExhausted, PhpFpmDown, SlowRequests | warning/critical |
| **mysql** | MysqlDown, HighConnections, SlowQueries, ReplicationLag | critical/warning |
| **nginx** | HighConnections, High5xxRate | warning/critical |
| **synthetic** | CheckoutEndpointDown, CriticalEndpointSlow | critical/warning |

**Example rule (API down):**
```yaml
- alert: BackendApiDown
  expr: probe_success{job="blackbox-http"} == 0
  for: 1m              # 1 minute sustained down
  labels:
    severity: critical
  annotations:
    summary: "Backend API is DOWN"
```

**WHY `for: 1m`:** Transient failures hote hain (network blip). 1 min
sustained failure = real problem. Shorter = noisy, longer = slow response.

**WHY inhibition rules:** Agar backend DOWN hai to high-error-rate alert
mat bhejo (redundant). Noise kam karo.

**VERIFY:**
```bash
# Check if rules loaded
curl http://localhost:9090/api/v1/rules | python3 -m json.tool | grep -c "alert"
# Should show number of rules
```

### 3.4 `prometheus/alertmanager.yml` — Alert Routing

**WHAT:** Alerts ko route karta hai — critical alerts alag, team-wise routing.

**Routing logic:**
```
severity=critical → immediate (10s wait, 1h repeat)
severity=warning  → default (30s wait, 4h repeat)
team=backend      → backend-team receiver
team=database     → database-team receiver
```

**Production notification options:**
```yaml
# Slack
slack_configs:
  - api_url: 'https://hooks.slack.com/services/xxx'
    channel: '#alerts'
    title: '{{ .GroupLabels.alertname }}'
    text: '{{ .Annotations.summary }}'

# Email
email_configs:
  - to: 'team@mxmobilz.com'
    from: 'alertmanager@mxmobilz.com'
    smarthost: 'smtp.gmail.com:587'

# PagerDuty (for on-call)
pagerduty_configs:
  - service_key: 'xxx'
```

**WHY webhook first:** Dev me sirf logs dekhna hai. Production me Slack/PagerDuty
add karna hai (YAML me uncomment karke). Webhook = generic integration point.

**VERIFY:**
```bash
curl http://localhost:9093/api/v2/status | python3 -m json.tool
```

### 3.5 `grafana/provisioning/` — Auto-configuration

**WHAT:** Grafana start hote hi Prometheus datasource + dashboards auto-load.

**WHY provisioning (manual ke bajaye):** Har restart pe manually datasource
+ dashboard add karna = human error. Provisioning = GitOps for Grafana config.

**Datasource:** Prometheus `http://prometheus:9090` (Docker service name).
**Dashboards:** `/var/lib/grafana/dashboards/` se JSON files auto-load.

### 3.6 `grafana/dashboards/` — Pre-built Dashboards

**WHAT:** 2 ready-to-use Grafana dashboards (JSON format).

| Dashboard | UID | Panels | What it shows |
|-----------|-----|--------|---------------|
| **Mxmobilz - Application Overview** | `mxmobilz-overview` | 15 | Service health, request metrics, PHP-FPM, MySQL, containers |
| **Mxmobilz - Kubernetes Cluster** | `mxmobilz-k8s` | 10 | Pod count, CPU/memory, network, restarts |

**Import kaise karna hai (manual method bhi hai):**
1. Grafana khole → `http://localhost:3001`
2. Login: `admin` / `admin`
3. Left menu → Dashboards → Import
4. "Upload JSON file" → `grafana/dashboards/mxmobilz-overview.json`
5. Select Prometheus datasource → Import

**BUT** provisioning se ye sab auto-load hota hai — manual import ki zaroorat nahi.

### 3.7 `nginx-exporter/default.conf` — stub_status

**WHAT:** nginx ke `/stub_status` endpoint enable karta hai jo
nginx-prometheus-exporter use karta hai.

**WHY:** nginx ki internal metrics (active connections, request rate)
nikalne ke liye. Bina stub_status ke nginx-exporter koi data nahi dega.

**Key addition:**
```nginx
location /stub_status {
    stub_status;
    allow 172.16.0.0/12;   # Docker network
    allow 10.0.0.0/8;      # K8s pods
    deny all;               # Bahar se block
}
```

**WHY `deny all`:** stub_status sensitive info hai (connection counts).
Sirf internal networks se access ho.

### 3.8 `php-fpm/status.conf` — PHP-FPM Status

**WHAT:** PHP-FPM ka `/fpm-status` endpoint enable karta hai.

**WHY:** PHP-FPM ki process pool health dekhne ke liye — kitne workers
active hain, kitne idle, request rate. Agar sab workers busy hain to
naye requests queue hote hain = slow responses.

---

## 4. How to Setup — Step by Step

### 4.1 Docker Compose (Local Dev) — 5 minutes

```bash
# Step 1: App stack chalu hai?
cd /path/to/project
docker compose ps    # front-end-app, backend-app, backend-nginx, mysql

# Step 2: MySQL exporter ke liye user banao
docker compose exec mysql mysql -uroot -p$$MYSQL_ROOT_PASSWORD -e "
  CREATE USER IF NOT EXISTS 'exporter'@'%' IDENTIFIED BY 'mxmobilzsecret';
  GRANT PROCESS, REPLICATION CLIENT ON *.* TO 'exporter'@'%';
  FLUSH PRIVILEGES;
"

# Step 3: PHP-FPM status page enable karo
# backend Dockerfile me ya docker-compose.yml me mount karo:
# /path/to/monitoring/php-fpm/status.conf -> /usr/local/etc/php-fpm.d/zz-status.conf

# Step 4: Monitoring stack start karo
cd monitoring
docker compose up -d

# Step 5: Verify
docker compose ps
# Should show: prometheus, grafana, alertmanager, node-exporter,
#              cadvisor, mysqld-exporter, phpfpm-exporter,
#              nginx-exporter, blackbox-exporter (9 services)
```

### 4.2 Grafana Access

```bash
# Browser me khole
http://localhost:3001

# Login
User:     admin
Password: admin

# Dashboards auto-load ho jayenge
# Left menu → Dashboards → Mxmobilz folder
```

### 4.3 Prometheus Access

```bash
# Browser me khole
http://localhost:9090

# Targets check karo
# Status → Targets → All should be "UP"

# PromQL query try karo
# Query bar me type karo:
rate(nginx_http_requests_total[5m])
# Ya:
mysql_global_status_threads_connected
```

### 4.4 Alertmanager Access

```bash
http://localhost:9093

# Alerts check karo
# Status → Alerts → Active/Pending alerts dikhenge
```

---

## 5. Dashboard Panels — Kya Kya Dikh Raha Hai

### 5.1 Application Overview Dashboard

#### Row 1: Service Health Status (6 panels)

| Panel | Metric | Green | Yellow | Red |
|-------|--------|-------|--------|-----|
| Backend API | `probe_success` | UP | — | DOWN |
| Frontend | `probe_success` | UP | — | DOWN |
| MySQL | `mysql_up` | UP | — | DOWN |
| PHP-FPM | `php_fpm_up` | UP | — | DOWN |
| Nginx | `nginx_up` | UP | — | DOWN |
| API Latency (p95) | `probe_duration_seconds` | < 1s | 1-3s | > 3s |

#### Row 2: Request Metrics (3 panels)

| Panel | What it shows | PromQL |
|-------|---------------|--------|
| **HTTP Request Rate** | Total requests/sec, success vs errors | `sum(rate(nginx_http_requests_total[5m]))` |
| **HTTP Response Codes** | Status code breakdown (2xx/4xx/5xx) | `sum by(status) (rate(nginx_http_requests_total[5m]))` |
| **API Response Time** | Blackbox probe duration per endpoint | `probe_duration_seconds{job="blackbox-http"}` |

#### Row 3: PHP-FPM & Nginx (3 panels)

| Panel | What it shows | PromQL |
|-------|---------------|--------|
| **PHP-FPM Process Pool** | Active/Idle/Total workers | `php_fpm_active_processes` |
| **PHP-FPM Request Rate** | Requests per second | `rate(php_fpm_request_duration_seconds_count[5m])` |
| **Nginx Connections** | Active/Waiting/Reading/Writing | `nginx_connections_active` |

#### Row 4: MySQL Database (3 panels)

| Panel | What it shows | PromQL |
|-------|---------------|--------|
| **MySQL Connections** | Connected/Running/Max | `mysql_global_status_threads_connected` |
| **MySQL Query Rate** | Queries per second | `rate(mysql_global_status_queries[5m])` |
| **MySQL Slow Queries** | Slow query rate (> threshold) | `rate(mysql_global_status_slow_queries[5m])` |

#### Row 5: Infrastructure (3 panels)

| Panel | What it shows | PromQL |
|-------|---------------|--------|
| **CPU Usage** | Host CPU utilization % | `100 - (avg(rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)` |
| **Memory Usage** | Used vs Total RAM | `node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes` |
| **Disk Usage** | Used vs Total disk | `node_filesystem_size_bytes - node_filesystem_avail_bytes` |

#### Row 6: Container Metrics (2 panels)

| Panel | What it shows | PromQL |
|-------|---------------|--------|
| **Container CPU** | Per-container CPU usage | `rate(container_cpu_usage_seconds_total{name=~"mxmobilz-.*"}[5m])` |
| **Container Memory** | Per-container memory usage | `container_memory_usage_bytes{name=~"mxmobilz-.*"}` |

### 5.2 Kubernetes Cluster Dashboard

- Running Pods count across namespaces
- Deployment count + available replicas
- CPU/Memory utilization vs requests
- Pod restart count
- Per-pod CPU and memory usage
- Network receive/transmit per pod

---

## 6. Alert Rules — Detailed Explanation

### 6.1 Infrastructure Alerts

```
HighCpuUsage     — CPU > 80% for 5 min     → warning
HighMemoryUsage  — RAM > 85% for 5 min     → warning
DiskSpaceLow     — Disk > 85% for 5 min    → critical
ContainerRestart — > 3 restarts in 15 min  → warning
```

### 6.2 Application Alerts

```
BackendApiDown    — HTTP probe fail for 1 min    → critical (SEV 1)
FrontendDown      — HTTP probe fail for 1 min    → critical (SEV 1)
HighErrorRate     — 5xx > 5% for 3 min           → critical (SEV 2)
HighApiLatency    — p95 > 2s for 5 min           → warning (SEV 2)
```

### 6.3 PHP-FPM Alerts

```
WorkersExhausted  — > 90% workers busy for 3 min → warning
PhpFpmDown        — Status page unreachable       → critical
SlowRequests      — Avg request time > 1s         → warning
```

### 6.4 MySQL Alerts

```
MysqlDown          — Exporter can't connect        → critical
HighConnections    — > 80% of max_connections      → warning
SlowQueries        — > 0.1 slow queries/sec        → warning
ReplicationLag     — Slave > 30s behind            → warning
```

### 6.5 E-commerce Specific Alerts

```
CheckoutEndpointDown — /api/products unreachable for 2 min → critical
CriticalEndpointSlow — Any probe > 5s for 3 min           → warning
```

---

## 7. K8s Monitoring (kube-prometheus-stack) — HOW TO RUN

### Files Structure

```
monitoring/k8s/
├── install.sh                          # ONE command to install everything
├── servicemonitor-backend.yaml         # Backend scraping (nginx + php-fpm)
├── servicemonitor-mysql.yaml           # MySQL scraping
├── prometheusrule-app-alerts.yaml      # Application alerts (12 rules)
├── prometheusrule-infra-alerts.yaml    # Infrastructure alerts (6 rules)
├── prometheusrule-mysql-alerts.yaml    # MySQL alerts (4 rules)
└── grafana-dashboards-cm.yaml          # Dashboard auto-load via ConfigMap
```

### 7.1 ONE Command Setup — `install.sh`

```bash
# Step 1: Make executable
chmod +x monitoring/k8s/install.sh

# Step 2: Run (Kind cluster must be running)
./monitoring/k8s/install.sh
```

**What this script does (step by step):**

```bash
# 1. Namespace banao
kubectl create namespace monitoring

# 2. Helm repos add karo
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

# 3. kube-prometheus-stack install karo (Prometheus + Grafana + Alertmanager + exporters)
helm install monitoring prometheus-community/kube-prometheus-stack \
  -n monitoring \
  --set grafana.adminPassword=admin \
  --set prometheus.prometheusSpec.retention=15d \
  --wait --timeout 300s

# 4. Custom monitoring configs apply karo (our YAMLs)
kubectl apply -f monitoring/k8s/grafana-dashboards-cm.yaml
kubectl apply -f monitoring/k8s/servicemonitor-backend.yaml
kubectl apply -f monitoring/k8s/servicemonitor-mysql.yaml
kubectl apply -f monitoring/k8s/prometheusrule-app-alerts.yaml
kubectl apply -f monitoring/k8s/prometheusrule-infra-alerts.yaml
kubectl apply -f monitoring/k8s/prometheusrule-mysql-alerts.yaml
```

### 7.2 Access URLs

```bash
# Grafana (dashboards + alerts visualization)
kubectl port-forward -n monitoring svc/monitoring-grafana 3001:80
# → http://localhost:3001  (admin / admin)

# Prometheus (raw metrics + PromQL queries)
kubectl port-forward -n monitoring svc/monitoring-kube-prom-prometheus 9090:9090
# → http://localhost:9090

# Alertmanager (alert routing + silence)
kubectl port-forward -n monitoring svc/monitoring-kube-prom-alertmanager 9093:9093
# → http://localhost:9093
```

### 7.3 How Each YAML Works

#### ServiceMonitor — "Kahan se metrics chahiye"

```
YAML apply hota hai
       │
       ▼
Prometheus Operator watches karta hai
       │
       ▼
Operator Prometheus ka config update karta hai (auto, no manual edit)
       │
       ▼
Prometheus targets page pe naya target dikhta hai
       │
       ▼
Har 15 sec scrape karta hai → metrics store hote hain
```

**Backend ServiceMonitor (`servicemonitor-backend.yaml`):**
```yaml
namespaceSelector:
  matchNames:
    - cloud-native-ecomerce-app    # Backend pods yahan hain
selector:
  matchLabels:
    app.kubernetes.io/name: backend  # Service ka label
endpoints:
  - port: nginx
    path: /stub_status              # Nginx metrics
    interval: 15s
  - port: nginx
    path: /fpm-status               # PHP-FPM metrics
    interval: 15s
```

**Verify:**
```bash
# ServiceMonitor created?
kubectl get servicemonitor -n monitoring
# NAME                 AGE
# mxmobilz-backend     5s
# mxmobilz-mysql       5s

# Prometheus target me aa gaya?
# Browser: http://localhost:9090 → Status → Targets
# "mxmobilz-backend" should show health: UP
```

#### PrometheusRule — "Alert kab fire ho"

```
YAML apply hota hai
       │
       ▼
Prometheus Operator watches karta hai
       │
       ▼
Prometheus alert rules load karta hai
       │
       ▼
Har 15 sec evaluate hota hai (condition check)
       │
       ▼
Condition true + "for" duration → Alertmanager ko alert bhejta hai
       │
       ▼
Alertmanager routing se notification bhejta hai (Slack/PagerDuty)
```

**Verify:**
```bash
# Rules loaded?
kubectl get prometheusrule -n monitoring
# NAME                       AGE
# mxmobilz-app-alerts        5s
# mxmobilz-infra-alerts      5s
# mxmobilz-mysql-alerts      5s

# Prometheus rules page:
# Browser: http://localhost:9090 → Alerts → Rules
# Should show all alert groups with "pending" or "inactive" state
```

#### Grafana Dashboard ConfigMap — "Dashboard kaise aaya"

```
ConfigMap apply hota hai (with label grafana_dashboard: "1")
       │
       ▼
Grafana sidecar watches karta hai
       │
       ▼
Sidecar ConfigMap ko /var/lib/grafana/dashboards/ me save karta hai
       │
       ▼
Grafana dashboard auto-load karta hai
       │
       ▼
Grafana UI → Dashboards → Mxmobilz folder → Mxmobilz Overview
```

**Verify:**
```bash
# ConfigMap created?
kubectl get configmap -n monitoring | grep grafana-dashboard
# grafana-dashboard-mxmobilz-overview   1      5s

# Dashboard loaded?
# Browser: http://localhost:3001 → Dashboards → Mxmobilz
# "Mxmobilz - Application Overview" should appear
```

### 7.4 Full Verification Checklist

```bash
# 1. Sab pods running?
kubectl get pods -n monitoring
# Expected: grafana-xxx, prometheus-xxx, alertmanager-xxx,
#           kube-state-metrics-xxx, node-exporter-xxx

# 2. ServiceMonitors applied?
kubectl get servicemonitor -n monitoring
# Expected: mxmobilz-backend, mxmobilz-mysql

# 3. PrometheusRules applied?
kubectl get prometheusrule -n monitoring
# Expected: mxmobilz-app-alerts, mxmobilz-infra-alerts, mxmobilz-mysql-alerts

# 4. ConfigMap dashboard applied?
kubectl get configmap -n monitoring | grep grafana
# Expected: grafana-dashboard-mxmobilz-overview

# 5. Prometheus targets healthy?
kubectl port-forward -n monitoring svc/monitoring-kube-prom-prometheus 9090:9090
# Browser: http://localhost:9090 → Status → Targets
# All targets should be "UP"

# 6. Grafana dashboard visible?
kubectl port-forward -n monitoring svc/monitoring-grafana 3001:80
# Browser: http://localhost:3001 → Dashboards
# "Mxmobilz - Application Overview" should show panels

# 7. Alert rules loaded?
# Browser: http://localhost:9090 → Alerts → Rules
# All rules should show "inactive" (no alerts firing)
```

### 7.5 How to Add New Alerts (Production Workflow)

```yaml
# 1. Edit the PrometheusRule YAML
# monitoring/k8s/prometheusrule-app-alerts.yaml

# 2. Add new rule
- alert: NewCustomAlert
  expr: some_metric > threshold
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "Custom alert description"

# 3. Apply
kubectl apply -f monitoring/k8s/prometheusrule-app-alerts.yaml

# 4. Verify
kubectl get prometheusrule mxmobilz-app-alerts -n monitoring -o yaml
# Browser: http://localhost:9090 → Alerts → Rules → new rule visible
```

### 7.6 How to Add New Dashboard Panels

```yaml
# 1. Edit the ConfigMap
# monitoring/k8s/grafana-dashboards-cm.yaml

# 2. Add new panel to "panels" array
{
  "id": 50,
  "title": "New Panel",
  "type": "timeseries",
  "targets": [{ "expr": "some_metric", "legendFormat": "{{ pod }}" }],
  ...
}

# 3. Apply
kubectl apply -f monitoring/k8s/grafana-dashboards-cm.yaml

# 4. Verify
# Browser: http://localhost:3001 → Dashboard → new panel visible
```

---

## 8. Common PromQL Queries — Cheat Sheet

### Application Metrics

```promql
# Request rate (per second)
sum(rate(nginx_http_requests_total[5m]))

# Error rate (5xx percentage)
sum(rate(nginx_http_requests_total{status=~"5.."}[5m]))
/ sum(rate(nginx_http_requests_total[5m])) * 100

# Response time (p95)
histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))

# Requests by status code
sum by(status) (rate(nginx_http_requests_total[5m]))
```

### PHP-FPM Metrics

```promql
# Active workers
php_fpm_active_processes

# Worker utilization %
php_fpm_active_processes / php_fpm_total_processes * 100

# Request rate
rate(php_fpm_request_duration_seconds_count[5m])
```

### MySQL Metrics

```promql
# Active connections
mysql_global_status_threads_connected

# Connection utilization %
mysql_global_status_threads_connected / mysql_global_variables_max_connections * 100

# Slow queries per second
rate(mysql_global_status_slow_queries[5m])

# Query rate
rate(mysql_global_status_queries[5m])
```

### Infrastructure Metrics

```promql
# CPU usage %
100 - (avg(rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)

# Memory usage %
(1 - node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes) * 100

# Disk usage %
(1 - node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes{mountpoint="/"}) * 100

# Container CPU (by name)
rate(container_cpu_usage_seconds_total{name=~"mxmobilz-.*"}[5m]) * 100

# Container memory (by name)
container_memory_usage_bytes{name=~"mxmobilz-.*"}
```

---

## 9. Production Hardening — What's Next

### Current State

| Component | Status | Level |
|-----------|--------|-------|
| Prometheus + Grafana | **Done** | Local dev + K8s ready |
| Alert rules (20+) | **Done** | Production-grade |
| Node/cAdvisor exporters | **Done** | Full coverage |
| MySQL exporter | **Done** | Connection + query metrics |
| PHP-FPM exporter | **Done** | Process pool + request metrics |
| Nginx exporter | **Done** | Connection + request metrics |
| Blackbox probes | **Done** | HTTP health + response time |
| Auto-provisioned dashboards | **Done** | 2 dashboards (overview + K8s) |
| Alertmanager routing | **Done** | Team-wise routing |

### Gaps (Honest — interview ke liye)

| Gap | Why it matters | How to fix |
|-----|---------------|------------|
| **No TLS** | Metrics endpoints unencrypted | Add TLS to Prometheus/Grafana |
| **No auth on Grafana** | Anyone can see dashboards | OAuth / LDAP integration |
| **No external notification** | Alerts sirf UI me dikhte | Slack/PagerDuty/Email config |
| **No log aggregation** | Logs alag se dekhne padte | Loki + Promtail |
| **No distributed tracing** | Request flow pata nahi | Jaeger / Tempo |
| **No custom Laravel metrics** | App-level metrics missing | `promphp/laravel-prometheus` package |
| **No SLO/SLA tracking** | Business metrics nahi | Custom metrics + burn rate alerts |
| **Fixed scrape interval** | 15s sabke liye same | Per-job intervals |

### Production Recommendations

```
┌─────────────────────────────────────────────────────────┐
│                    PRODUCTION STACK                      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Metrics:     Prometheus Operator (Helm)                │
│  Dashboards:  Grafana + Loki (logs) + Tempo (traces)   │
│  Alerts:      Alertmanager → Slack/PagerDuty/OpsGenie  │
│  Logs:        Loki + Promtail                           │
│  Traces:      Jaeger / Tempo                            │
│  APM:         New Relic / Datadog (alternative)         │
│                                                          │
│  K8s specific:                                          │
│  - kube-prometheus-stack (all-in-one Helm chart)       │
│  - ServiceMonitor CRDs per microservice                 │
│  - PrometheusRule CRDs per service                      │
│  - Grafana Operator for dashboard management            │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 10. Commands Cheat-Sheet

### Docker Compose (Local)

```bash
# Start monitoring stack
cd monitoring && docker compose up -d

# Stop monitoring stack
cd monitoring && docker compose down

# View logs
docker compose logs -f prometheus
docker compose logs -f grafana

# Restart single service
docker compose restart grafana

# Check targets
curl -s http://localhost:9090/api/v1/targets | python3 -m json.tool | grep '"health"'

# Check alerts
curl -s http://localhost:9090/api/v1/alerts | python3 -m json.tool

# Prometheus reload (after config change)
curl -X POST http://localhost:9090/-/reload
```

### K8s (Production-like)

```bash
# Install monitoring stack
helm install monitoring prometheus-community/kube-prometheus-stack \
  -n monitoring --create-namespace

# Verify
kubectl get pods -n monitoring
kubectl get svc -n monitoring

# Access Grafana
kubectl port-forward -n monitoring svc/monitoring-grafana 3001:80

# Access Prometheus
kubectl port-forward -n monitoring svc/monitoring-kube-prom-prometheus 9090:9090

# Get Grafana password
kubectl get secret monitoring-grafana -n monitoring \
  -o jsonpath="{.data.admin-password}" | base64 -d && echo

# Check alert rules
kubectl get prometheusrule -n monitoring

# Check ServiceMonitors
kubectl get servicemonitor -n monitoring
```

### Troubleshooting

```bash
# Prometheus targets DOWN?
# 1. Check exporter container
docker ps | grep exporter
docker logs mxmobilz-mysqld-exporter

# 2. Check network
docker network inspect monitoring_app_newtwork

# 3. Check Prometheus config
curl http://localhost:9090/api/v1/status/config

# Grafana dashboards empty?
# 1. Check datasource
curl -s http://localhost:3001/api/datasources

# 2. Check dashboards loaded
curl -s http://localhost:3001/api/search

# MySQL exporter not connecting?
# 1. Check user exists
docker compose exec mysql mysql -uroot -p$$MYSQL_ROOT_PASSWORD \
  -e "SELECT user,host FROM mysql.user WHERE user='exporter';"

# 2. Test connection
docker compose exec mysqld-exporter \
  mysql -uexporter -pmxmobilzsecret -hmysql -e "SELECT 1;"
```

---

## 11. Level Assessment — Interview Prep

### Yeh kaam kis LEVEL ka hai?

**"Strong mid-level monitoring setup with production patterns"** — detail:

**Jo strong hai:**
- Multi-exporter architecture (6 exporters, not just node-exporter)
- Application-specific monitoring (PHP-FPM, MySQL, Nginx)
- Blackbox probing (synthetic monitoring — real user experience)
- Pre-configured alert rules (20+ rules with severity + runbook URLs)
- Auto-provisioned Grafana dashboards (no manual import)
- Team-based alert routing (backend, database, infrastructure)
- Alert inhibition (no redundant alerts)
- Docker Compose + K8s dual setup
- Production-appropriate alert thresholds (based on SRE practices)

**Jo GAPS hain:**
- No TLS on metrics endpoints
- No auth on Grafana (admin/admin)
- No external notification integration (Slack/PagerDuty)
- No log aggregation (Loki)
- No distributed tracing (Jaeger/Tempo)
- No custom Laravel application metrics
- No SLO/SLA tracking
- No on-call rotation integration

### Interviewer ko kaise bolna hai

> "Maine Prometheus + Grafana based monitoring stack set up kiya hai jo
> 6 alag exporters se metrics collect karta hai — node, container, MySQL,
> PHP-FPM, nginx, aur blackbox HTTP probes. 20+ alert rules hain jo
> infrastructure, application, database, aur synthetic monitoring cover
> karti hain. Grafana dashboards auto-provision hoti hain — manual import
> ki zaroorat nahi. Production me main iske saath Loki (logs), Tempo
> (traces), aur Slack/PagerDuty (notifications) add karunga. Yeh
> monitoring baseline hai jo kisi bhi microservices project me kaam aata hai."

---

**Last Updated:** September 4, 2026
**Status:** Production Ready (local dev + K8s compatible)
