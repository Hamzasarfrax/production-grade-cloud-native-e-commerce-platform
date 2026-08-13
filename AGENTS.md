# AGENTS.md — Project Memory File

> Ye file har session ke liye "memory" hai. Jab bhi session dobara open ho, koi bhi AI agent
> pehle ye file parhe aur wahan se current state + next steps samjhe. Har kaam ke baad isko
> update karna jaruri hai.

## Project Overview

"Mxmobilz" — E-commerce web app (mobile phones). Microservices architecture.

| Service   | Tech              | Folder    | Port  |
|-----------|-------------------|-----------|-------|
| API       | Laravel (PHP 8.3) | `backend/`| 8000  |
| Database  | MySQL             | —         | 3306  |
| Web (UI)  | React 19 + Vite + TS | `frontend/` | 3000 |

## Current State (last updated: 2026-08-13)

- [x] Git initialized at root (commits exist: `cloud-native-app`).
- [x] `frontend/` — Full React e-commerce UI (Landing, Shop, Compare, Trade-in, Cart,
      Checkout, Contact, Admin Dashboard). Data abhi `src/data/mockData.ts` + localStorage
      se aata hai.
- [x] `backend/` — Fresh Laravel 13 (Chisel + Fortify + Inertia) bundle install kiya hua hai.
- [x] Backend API done: models, migrations, seeders, controllers, `routes/api.php`, CORS. MySQL `.env`.
- [x] Frontend <-> Backend API connection done (`src/api.ts`, App.tsx hydration, Vite proxy).
- [x] Admin panel dynamic — API se data load + mutations (products/orders/inquiries + KPIs).
- [x] docker-compose.yml done (mysql/api/web). Dockerfiles in `frontend/` + `backend/`.
- [ ] README/docs architecture — done, rest (deployment/runbook/security) pending.
- [ ] Auth (Laravel Sanctum) for protected admin + `/api` — pending.
- [ ] K8s + ArgoCD manifests fill (folders exist, empty) — pending.

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
- Note: Is WSL me PHP 8.3/MySQL/Docker install nahi hai (Windows `php.exe` 8.2 hai — Laravel
  13 chalta nahi). Frontend typecheck + build verified `npm run lint` / `vite build`. Backend
  PHP files syntax-lint passed (php -l). Actual run Docker/CI me hoga.

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
2. Fill K8s + ArgoCD manifests (folders `k8s/`, `argocd/` exist but empty).
3. Docs: deployment.md, runbook.md, security.md, disaster-recovery.md, troubleshooting.md.
4. Admin: product edit UI + promos management tab (API methods already exist in `src/api.ts`).

## Environment Quirks

- Frontend runs on port 3000; Vite proxy `/api` -> backend 8000 (see `frontend/vite.config.ts`).
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