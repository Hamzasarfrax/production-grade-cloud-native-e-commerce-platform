# AGENTS.md — Project Memory File

> Ye file har session ke liye "memory" hai. Jab bhi session dobara open ho, koi bhi AI agent
> pehle ye file parhe aur wahan se current state + next steps samjhe. Har kaam ke baad isko
> update karna jaruri hai.

## Project Overview

##################

"Mxmobilz" — E-commerce web app (mobile phones). Microservices architecture.

| Service   | Tech              | Folder    | Port  |
|-----------|-------------------|-----------|-------|
| API       | Laravel (PHP 8.3) | `backend/`| 8000  |
| Database  | MySQL             | —         | 3306  |
| Web (UI)  | React 19 + Vite + TS | `frontend/` | 3000 |

## Current State (last updated: 2026-08-31)

- [x] Git initialized at root (commits exist: `cloud-native-app`).
- [x] `frontend/` — Full React e-commerce UI (Landing, Shop, Compare, Trade-in, Cart,
      Checkout, Contact, Admin Dashboard). Data abhi `src/data/mockData.ts` + localStorage
      se aata hai.
- [x] `backend/` — Pure JSON API (Laravel 13). Starter kit ka React/TSX/Inertia/Fortify/Chisel
      frontend REMOVE ho chuka hai (resources/js, views, web routes, vite/npm tooling sab deleted).
      Sirf `routes/api.php` + Api controllers + models + migrations + seeders hain.
- [x] Backend API done: models, migrations, seeders, controllers, `routes/api.php`, CORS. MySQL `.env`.
- [x] Backend Docker (backend/docker-compose.yml: FPM app + nginx :8080 + mysql) — live verified.
      Nginx conf mount fix (`docker/nginx/default.conf`), models me explicit `$table` set
      (CustomerInquiry->inquiries, PromoCode->promos). Stale bootstrap/cache issue bhi fix hua
      (docs/troubleshooting.md dekho).
- [x] Frontend <-> Backend API connection done (`src/api.ts`, App.tsx hydration, Vite proxy).
- [x] Admin panel dynamic — API se data load + mutations (products/orders/inquiries + KPIs).
- [x] docker-compose.yml done (mysql/api/web). Dockerfiles in `frontend/` + `backend/`.
- [x] ROOT `docker-compose.yml` ab ACTIVE full stack hai (purana backend/docker-compose.yml
      delete ho chuka): front-end-app :3000 (nginx, /api proxy via BACKEND_URL env) ->
      backend-nginx :8000->80 -> backend-app FPM :9000 + mysql :3306. 2026-08-21 live verified:
      migrate --seed ke baad :8000/api/products 200, :3000/api/orders 200, :3000/api/stats JSON.
      Fixes is run me: nginx conf path (`default.conf`, stray `docker/nginx/backend.conf/` dir
      Docker ne auto-create ki thi — deleted), corrupt mysql volume (`down -v` se reset),
      DB name/user root `.env` me backend/.env se match (`cloud-native`), Dockerfile base
      php:8.3-cli->php:8.3-fpm CMD php-fpm, canonical path `/var/www/html` (WORKDIR = nginx
      root = compose mount). Migrate container me: `docker compose exec backend-app php artisan migrate --seed --force`.
- [x] AUTO-SETUP (2026-08-21): `backend/docker/entrypoint.sh` — har start par DB wait +
      `migrate --force` + seed SIRF empty DB par (products count check), phir php-fpm exec.
      mysql healthcheck (`mysqladmin ping`) + backend `depends_on: condition: service_healthy`.
      Naye user ke liye sirf `docker compose up -d --build` kafi hai — verified: fresh
      volume par auto migrate+seed, restart par "skipping seed" (no duplicates).
- [x] Backend Dockerfile MULTI-STAGE rewrite (2026-08-21, user ne kiya): `vendor`
      (composer:2.8, --no-dev) → production (php:8.3-fpm-bookworm + pdo_mysql/zip/gd/opcache,
      USER www-data). Fixes is rewrite me: composer binary `COPY --from=vendor /usr/bin/composer`,
      entrypoint COPY/chmod ko USER www-data se PEHLE (non-root chmod denied), stale
      bootstrap/cache ka permanent ilaaj (.dockerignore `bootstrap/cache/*.php` + build-time rm),
      DNS flake (`auth.docker.io no such host`) transient tha. Verified: backend-app:1.0.2,
      fresh volume auto-setup, :8000 + :3000 dono 200. Details: docs/docker-trouble.md Incident 2.
- [x] Image size result (2026-08-21): backend 1.05GB→767MB (~27% kam, multi-stage +
      cache layering + apt clean + --no-dev). Frontend 95.9MB (node builder → nginx:alpine,
      pehle se optimal). Purani image `backend-app:1.0.1` delete karne ke liye `docker rmi`.
      Numbers: docs/docker-trouble.md "Image Size Optimization" section.
- [x] docs/docker.md REWRITE (2026-08-22): purana single-stage backend walkthrough hata ke
      current multi-stage (backend+frontend) line-by-line, entrypoint auto-setup, compose
      architecture diagram, production best-practices review (~80% done; gaps: K8s migrate Job,
      registry-prefixed git-SHA tags, nginx pin, /up health endpoint), aur Registry Push Workflow
      (dono images alag repos me `docker.io/<user>/mxmobilz-{api,web}:<sha>` tag/push) add.
- [x] docs/k8s-production-setup.md (2026-08-27): complete K8s production setup documentation
      with WHAT/WHY/VERIFY/ALTERNATIVE for every component, architecture diagram, problems
      faced, honest level assessment.
- [x] docs/gitops-setup.md (2026-08-31): complete GitOps/ArgoCD documentation with repo
      structure, App of Apps pattern, Kustomize overlays, RBAC, bootstrap, verify, operations,
      secrets management, hardening checklist, troubleshooting.
- [ ] README/docs — deployment.md, runbook.md, security.md, disaster-recovery.md,
      troubleshooting.md abhi bhi pending.
- [ ] Auth (Laravel Sanctum) for protected admin + `/api` — pending.
- [x] K8s PRODUCTION-SETUP LIVE (2026-08-27): 3-node Kind cluster `mxmobilz-prod`
      (control-plane + 2 workers), namespace `cloud-native-ecomerce-app`. MySQL
      StatefulSet+PVC(headless svc, secret `mysql-app-secret`), Backend Helm chart
      (nginx sidecar :8000 + PHP-FPM :9000 + init app-copy, probes `/api/products`,
      env DB from secret), Frontend 2 replicas (BACKEND_URL=backend-backend-helm:8000),
      ingress-nginx controller + `ingress.yaml` (host mxmobilz.local, / -> frontend,
      /api -> backend-backend-helm). LIVE VERIFIED: /api/products 200 full-stack
      (nginx->fpm->Laravel->MySQL). Docs: `docs/k8s-production-setup.md` (source of
      truth, WHAT/WHY/VERIFY/ALTERNATIVE + honest level assessment).
- [x] GitOps/ArgoCD SETUP COMPLETE (2026-08-31): ArgoCD Project (`mxmobilz-project.yaml`)
      with RBAC roles (admin, developer, viewer, ci-cd), App-of-Apps root application
      (`mxmobilz-root`) managing dev/staging/prod applications. Kustomize base + overlays
      (dev/staging/prod) in `gitops/` with environment-specific patches (replicas, secrets,
      log levels). ArgoCD apps point to `gitops/overlays/{dev,staging,prod}`. Network policies
      + ExternalSecrets manifests ready. Docs: `docs/gitops-setup.md` (source of truth).

## Decisions / Facts

- DB agar change ho to `.env` me `DB_CONNECTION=mysql` (dalna). Ab MySQL configured hai:
  `mxmobilz_db` / `mxmobilz` / `mxmobilzsecret` (localhost:3306).
- Frontend data model `PhoneProduct`/`Order` etc. `frontend/src/types.ts` me hai — DB
  schema isi se match hota hai (JSON columns: storage_options, color_options, images, specs,
  shipping_details).
- API client: `frontend/src/api.ts`. API on mount hydrate hota hai; fail hone par mock +
  localStorage fallback (graceful degradation). `apiMode` flag App.tsx me.
- Admin panel `frontend/src/components/AdminDashboard.tsx` — props me optional `api` +
  `apiMode`; connected hone par sab mutations API se hote hain.
- Backend JSON keys camelCase hain — `toApi()` on models + `resolveProductAttributes()` in
  ProductController camelCase->snake_case map karta hai.
- Note: Is WSL me PHP/MySQL install nahi hai, Docker hai. Windows `php.exe` 8.3.14 hai —
  `php artisan serve` (Windows :8000) verified working. Frontend typecheck + build verified
  `npm run lint` / `vite build`. Backend PHP files syntax-lint passed (php -l).
- DB_HOST split (2026-08-21): `.env` me `DB_HOST=127.0.0.1` (local serve ke liye);
  docker-compose.yml backend-app me `environment: DB_HOST=mysql` override hai. Dono stacks
  ek sath chal sakte hain bina .env edit kiye.
- Warning: WSL me stray `python3 -m http.server 8000` WSL localhost-forwarding se Windows
  ke :8000 ko hijack kar leta hai (Python 404 pages dikhte hain). Aisa server 8000 par mat
  chalana; ho to kill karo (`ss -tlnp | grep 8000`).

## API Contract (target)

All paths under `/api` (base `http://localhost:8000`):

- `GET/POST /api/products`, `PUT/DELETE /api/products/{id}`
- `GET/POST /api/orders`, `PATCH /api/orders/{id}`
- `GET/POST /api/inquiries`, `PATCH/DELETE /api/inquiries/{id}`
- `GET/POST /api/promos`, `PATCH/DELETE /api/promos/{id}`
- `GET /api/stats` (admin dashboard)

Response shape: `{ "ok": true, "data": ... }`.

## Next Steps (todo)

1. Auth — Laravel Sanctum (login/register) for protected admin + `/api` routes.
2. K8s core setup DONE (kind multi-node, MySQL StatefulSet, backend Helm+sidecar,
   frontend, ingress). ArgoCD GitOps pipeline COMPLETE (App-of-Apps, Kustomize overlays,
   RBAC). Baki: production hardening (TLS/cert-manager, HPA enable, Prometheus/
   metrics-server, runAsNonRoot, backup job/Velero, image signing).
3. Docs: deployment.md, runbook.md, security.md, disaster-recovery.md, troubleshooting.md.
4. Admin: product edit UI + promos management tab (API methods already exist in `src/api.ts`).

## Environment Quirks

- Frontend runs on port 3000; Vite proxy `/api` -> backend 8000 (see `frontend/vite.config.ts`).
- Vite proxy target `127.0.0.1` hai (localhost nahi) — artisan serve IPv4-only bind karta hai,
  Node `::1` pehle try karta hai to proxy fail hota.
- Frontend prod image me `/api` reverse-proxy built-in hai: `docker/nginx/default.conf.template`
  + `BACKEND_URL` env (nginx templates). Compose: `http://api:8000`; host backend ke sath:
  `-e BACKEND_URL=http://host.docker.internal:8000`. Prod-preview container **:3005** par
  chalao (`front-prod-preview`), :3000 sirf vite dev ke liye — warna 404 confusion hota hai.
- Production URL pattern: frontend relative `/api` hi call karta hai; same-origin reverse
  proxy (nginx/K8s ingress) backend tak pohanchata hai. Alag domain ho to build-time
  `VITE_API_URL=https://api.domain.com` set karo + backend CORS allowlist.
- Frontend `node_modules` WINDOWS se install karo (`npm install` PowerShell me). WSL se
  install karne par `.bin/` me `vite.cmd` shims nahi bante aur `npm run dev` fail hota hai.
- Windows PowerShell execution policy ab CurrentUser=RemoteSigned set hai (npm.ps1 chalane
  ke liye, 2026-08-21).
- Bulk file ops (`rm -rf`) WSL se `/mnt/e` par "Cannot allocate memory" de sakte hain —
  Windows side se karo (`Remove-Item -Recurse -Force`).
- Laravel env: `backend/.env` (DO NOT commit). Seed data source: `frontend/src/data/mockData.ts`.

## Running Locally (once PHP + MySQL ready)

```bash
# backend
cd backend && composer install && cp .env.example .env
# set .env: DB_CONNECTION=mysql, DB_DATABASE, DB_USERNAME, DB_PASSWORD
php artisan key:generate && php artisan migrate --seed
php artisan serve  # :8000

# frontend
cd frontend && npm install && npm run dev  # :3000
```