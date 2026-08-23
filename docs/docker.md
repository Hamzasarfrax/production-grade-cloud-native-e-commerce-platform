# Docker Documentation — Mxmobilz E-Commerce

> Last verified: 2026-08-22 · Root `docker-compose.yml` live-verified (:8000/api/products 200,
> :3000 UI 200, fresh-volume auto-setup OK)

## Stack Overview

**Backend** (`backend/Dockerfile`):

| Component    | Technology                  |
|--------------|-----------------------------|
| Framework    | Laravel 13                  |
| Language     | PHP **8.3**                 |
| Process      | PHP-FPM                     |
| Web server   | Nginx (separate container)  |
| Database     | MySQL 8.4                   |
| Dependency   | Composer 2.8                |
| Runtime OS   | Debian bookworm             |

**Frontend** (`frontend/Dockerfile`):

| Component  | Technology            |
|------------|-----------------------|
| Framework  | React 19 + TypeScript |
| Bundler    | Vite 6                |
| Styling    | Tailwind CSS v4       |
| Build      | Node.js 22 (alpine)   |
| Runtime    | Nginx alpine          |
| Strategy   | Multi-stage build     |

---

# 1. Architecture (root docker-compose.yml)

```text
                    Docker Compose
                         |
        +----------------+------------------+
        |                |                  |
        v                v                  v
  front-end-app    backend-nginx         mysql :3306
  nginx :3000->80  :8000->80             healthcheck:
  static dist +    fastcgi_pass            mysqladmin ping
  /api proxy ----> backend-app:9000
                   Laravel PHP-FPM
                   (entrypoint: DB wait +
                    migrate + seed-if-empty)
```

- Frontend sirf relative `/api` call karta hai → apne nginx par reverse-proxy →
  `BACKEND_URL` env se backend-nginx tak.
- Backend-nginx code mount karke FPM ko fastcgi_pass karta hai (PHP-FPM khud HTTP nahi bolta).
- MySQL healthcheck ke baad hi backend start hota hai (`depends_on: service_healthy`).

---

# 2. Backend Image — Multi-Stage Build

## Results — Before vs After

| Metric              | Pehle (single-stage) | Ab (multi-stage)      | Improvement              |
|---------------------|----------------------|-----------------------|--------------------------|
| Final image size    | ~1.05 GB             | **767 MB**            | **~-280 MB (~27% kam)**  |
| Dev dependencies    | Shipped (--no-dev missing tha) | No          | Chhota attack surface    |
| Autoloader          | Default              | classmap-authoritative | Faster class resolution |
| Runtime user        | root                 | **www-data**          | Non-root production rule |
| Stale caches risk   | packages.php/services.php ghus jate the | build-time rm + .dockerignore | "Class not found" bug fix |

## Current Dockerfile (line-by-line)

### Stage 1 — Composer dependencies

```text
FROM composer:2.8 AS vendor
        ↓
Composer ki official image — dependency install ka dedicated stage.

COPY composer.json composer.lock ./
        ↓
SIRF manifests pehle copy — layer-cache trick (frontend jaisa hi):
lockfile change ho TABHI composer install dobara chalega,
warna cached layer hit hoga.

RUN composer install --no-dev --no-interaction
    --no-progress --prefer-dist --optimize-autoloader --no-scripts
        ↓
Production-only deps. --no-scripts isliye ke scripts ko app code
chahiye hota hai jo abhi copy nahi hua.
```

### Stage 2 — Production runtime

```text
FROM php:8.3-fpm-bookworm
        ↓
Fresh minimal runtime — Stage 1 ka composer cache yahan nahi aata.

apt-get install libzip-dev libpng-dev libonig-dev
+ docker-php-ext-install pdo_mysql zip gd + opcache enable
+ rm -rf /var/lib/apt/lists/*
        ↓
Sirf zaroori extensions, apt lists clean = chhoti layer.

COPY --from=vendor /usr/bin/composer /usr/bin/composer
        ↓
Composer binary bhi le lo — neeche dump-autoload chalana hai
(fpm image me composer hota hi nahi).

COPY --from=vendor /var/www/html/vendor ./vendor
        ↓
Vendor tree direct vendor-stage se — dobara install nahi hota.

COPY . .
        ↓
Application code.

RUN rm -f bootstrap/cache/packages.php bootstrap/cache/services.php
        ↓
Stale package caches clear — Pail/Fortify "not found" class errors
ka ilaaj. (.dockerignore bhi inhe block karta hai.)

RUN composer dump-autoload --optimize --classmap-authoritative --no-scripts
        ↓
Authoritative classmap — production standard, fast autoload.

RUN chown -R www-data storage bootstrap/cache && chmod -R 775 ...
        ↓
Laravel ke writable folders non-root user ko.

COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh && chmod +x
        ↓
IMPORTANT ORDER: ye USER www-data se PEHLE hona chahiye —
non-root user /usr/local/bin me chmod nahi kar sakta.
(Ye exact bug ek incident me mila tha — docs/docker-trouble.md Incident 2.)

USER www-data
        ↓
Non-root runtime — container escape hone par bhi attacker ko
root privileges nahi milte.

EXPOSE 9000 / CMD ["php-fpm", "-F"]
        ↓
FastCGI port; foreground process = container ka PID 1 php-fpm.
```

## Entrypoint Auto-Setup (`docker/entrypoint.sh`)

Har start par:

1. **DB wait** — PDO check loop jab tak MySQL reachable na ho
2. **`migrate --force`** — idempotent, har bar safe
3. **Seed SIRF empty DB par** — products table count check; data ho to skip
   (restart par duplicate seeding kabhi nahi)
4. **`exec "$@"`** — CMD (php-fpm) ko PID 1 banake handoff

Naye user ke liye sirf `docker compose up -d --build` kafi hai — DB user pehli dafa
aane par bhi stack khud migrate+seed ho jata hai.

> **Kubernetes note:** ye pattern dev/single-node ke liye best hai. K8s me multiple replicas
> ek sath migrate race karengi — wahan migrations **separate Job** ya CI/CD step me chalao,
> container sirf serve kare.

---

# 3. Frontend Image — Multi-Stage Build Optimization

## Results — Before vs After

| Metric               | Single-Stage (`1.0.1`) | Multi-Stage (`1.0.0`) | Improvement            |
|----------------------|------------------------|------------------------|------------------------|
| Final image size     | **650 MB**             | **95.9 MB**            | **-554 MB (-85%)**     |
| node_modules shipped | Yes (~300+ MB)         | No                     | Removed at runtime     |
| Node.js in runtime   | Yes                    | No                     | Smaller attack surface |
| Rebuild speed        | Slow (no cache)        | Fast (layer cache)     | Deps cached per lockfile|

## Current Dockerfile

```dockerfile
FROM node:22-alpine AS builder
WORKDIR /front-end-app
COPY package*.json ./
RUN npm ci                      # lockfile-exact, deterministic
COPY . .
RUN npm run build               # Vite -> /front-end-app/dist

FROM nginx:alpine
ENV BACKEND_URL=http://api:8000 # /api proxy ka upstream target
COPY docker/nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=builder /front-end-app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Key points

```text
FROM node:22-alpine AS builder
        ↓
Full Node toolchain SIRF build ke liye. Stage discard hota hai.

COPY package*.json ./ -> RUN npm ci -> COPY . .
        ↓
Layer-caching core trick (neeche detail).

FROM nginx:alpine
        ↓
Fresh minimal runtime — Node/npm/node_modules kuch nahi jaata.

ENV BACKEND_URL=http://api:8000
        ↓
Runtime-configurable upstream — rebuild ke baghair environment
badal sakte ho (standalone run: host.docker.internal:8000).

COPY .../templates/default.conf.template
        ↓
nginx:alpine ka templates feature: container START par
*.template files envsubst hokar /etc/nginx/conf.d/ me render hoti hain.
BACKEND_URL isi waqt inject hota hai.
```

## Nginx Config (`frontend/docker/nginx/default.conf.template`)

Same-origin API pattern:

```nginx
location /api/    { proxy_pass ${BACKEND_URL}; }   # API reverse proxy
location /assets/ { expires 1y; immutable }        # Vite hashed files
location /        { try_files $uri /index.html; }  # SPA fallback
```

- Frontend code **sirf relative `/api`** call karta hai — same-origin, CORS ka masla hi nahi.
- Alag domain par deploy ho to build-time `VITE_API_URL` set karo + backend CORS allowlist.

## Layer Caching Strategy

```text
COPY package*.json ./     <- manifest change ho TABHI invalidate
RUN npm ci                <- warna CACHED (sabse slow step)
COPY . .                  <- code change par SIRF ye aage chalta hai
RUN npm run build
```

Code edit par `npm ci` **re-run hi nahi hota** — builds seconds me.
Ye pattern real-world CI pipelines (GitHub Actions/GitLab) ka standard hai.

## Security & Production Notes

- **No Node in production** — supply-chain surface kam
- `.env` dono images me excluded (`.dockerignore`) — secrets layers me persist nahi hote
- Frontend `USER nginx` hardening backlog me hai (non-root + high port ke sath)
- Image size kam = faster registry push/pull = faster deploys aur K8s scheduling

---

# 4. .dockerignore — Build Context Slimming

Dono services me `.dockerignore` hai. Backend ka (richest):

```text
vendor/, node_modules/       # host deps — image me kabhi nahi
.env, .env.* (!.env.example) # CRITICAL: secrets image me nahi
storage/logs/*, framework caches/*
bootstrap/cache/*.php        # stale caches block
.git/, tests/, IDE files, README, compose files
```

- Build context hundreds of MBs → few MBs (context-transfer instant)
- Host OS-specific native binaries (esbuild/SWC) image me ghuskar build todte the — fixed

---

# 5. Production Best-Practices Review (2026-08-22)

Verdict: **~80% production-grade.** K8s ke liye ye gaps bache hain:

| ✅ Already best-practice | ⚠️ Gap (K8s ke liye) | Fix |
|---|---|---|
| Multi-stage builds dono taraf | Migrate entrypoint me hai — replicas race | Separate K8s **Job** / CI step |
| Non-root `www-data` backend | Tags bina registry prefix (`backend-app:1.0.2`) | `<registry>/<user>/<repo>:<git-sha>` immutable tags |
| `.env` excluded dono jagah | `nginx:alpine` unpinned | Pin: `nginx:1.27-alpine` |
| `npm ci`, `classmap-authoritative`, opcache | Koi health endpoint nahi | Laravel `/up` route + K8s probes |
| Pinned bases (`php:8.3-fpm-bookworm`, `node:22-alpine`, `composer:2.8`) | `storage/` ephemeral | Logs → stdout, uploads → S3/PVC |

---

# 6. Registry Push Workflow (K8s-Ready)

Concept: har service ki **apni repo** registry me, tag immutable (git SHA best).

```bash
# 1. Login
docker login                       # Docker Hub
# docker login ghcr.io -u <user>   # GHCR (PAT token)

# 2. Build + tag dono ALAG-ALAG (SHA + version dono tags)
docker build -t docker.io/<user>/mxmobilz-api:$(git rev-parse --short HEAD) \
             -t docker.io/<user>/mxmobilz-api:1.0.2 ./backend

docker build -t docker.io/<user>/mxmobilz-web:$(git rev-parse --short HEAD) \
             -t docker.io/<user>/mxmobilz-web:1.0.0 ./frontend

# 3. Push
docker push docker.io/<user>/mxmobilz-api:<sha>
docker push docker.io/<user>/mxmobilz-web:<sha>
```

Compose ke `image:` fields bhi inhi full names par update karna — local build aur
registry push same cheez rahe.

### Kubernetes me use

```yaml
containers:
  - name: api
    image: docker.io/<user>/mxmobilz-api:9fdbead   # kabhi :latest nahi
    imagePullPolicy: IfNotPresent
```

Private registry secret:

```bash
kubectl create secret docker-registry regcred \
  --docker-server=docker.io --docker-username=<user> --docker-password=<token>
# Deployment me: imagePullSecrets: [{name: regcred}]
```

### Do K8s-specific notes

1. **Migrations**: K8s Job ka `command:` ENTRYPOINT override karta hai —
   `command: ["php","artisan","migrate","--force"]` seed/DB-wait skip karke seedha
   migrate karega. Phir entrypoint.sh ko sirf php-fpm tak simplify karo.
2. **`BACKEND_URL`**: image default `http://api:8000` hai — backend Service ka naam
   `api` na ho to Deployment env me override karo.

Real-world flow: GitHub Actions merge par SHA-tagged images build+push karta hai →
ArgoCD rollout (`argocd/` folder isi ke liye pending hai).

---

# Takeaway

> **Build-time dependencies stages me rahen, runtime sirf utna le jo chalane ke liye chahiye.**
> Backend 767 MB (Laravel + extensions), frontend 95.9 MB (sirf static assets + nginx) —
> dono multi-stage, non-root (backend), secrets-free, registry-push ready.
