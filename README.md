# Mxmobilz — Cloud-Native E-commerce (Mobile Phones)

Microservices architecture: **React (Web)** + **Laravel (API)** + **MySQL (DB)**.

| Service | Tech | Folder | Port | URL |
|---------|------|--------|------|-----|
| Web | React 19 + Vite + TypeScript | `frontend/` | 3000 | http://localhost:3000 |
| API | Laravel 13 (PHP 8.3) | `backend/` | 8000 | http://localhost:8000/api |
| DB | MySQL 8 | — | 3306 | localhost:3306 |

## Features

- Public storefront: Landing, Shop, Compare, Trade-in, Cart, Checkout, Contact, Privacy.
- Admin Dashboard (`#admin` view in app): Analytics KPIs, Inventory CRUD, Order status,
  Inquiry replies — all backed by the live API when reachable, falls back to local mock data.
- API contract: `{ "ok": true, "data": ... }` — see `docs/architecture.md` for endpoint list.

## Quick Start (Docker — recommended)

```bash
docker compose up --build
# THEN OPEN http://localhost:3000
```

The API container auto-runs `migrate --seed` on first start (seed data = `frontend/src/data/mockData.ts`).

## Quick Start (Local / Manual)

Requirements: PHP 8.3, Composer, Node 18+, MySQL 8.

```bash
# 1) Database
#   create MySQL database `mxmobilz_db` with user/password `mxmobilz` / `mxmobilzsecret`
#   (or edit `backend/.env` to match your MySQL credentials)

# 2) API service  (:8000)
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan serve          # -> http://localhost:8000

# 3) Web service  (:3000)
cd frontend
npm install
npm run dev                # -> http://localhost:3000
```

Vite proxies `/api` -> `http://localhost:8000` (see `frontend/vite.config.ts`).
Override the API base with `VITE_API_URL` if you do not use the proxy.

## Environment

- Backend: `backend/.env` (never commit). Key values: `DB_CONNECTION=mysql`, `DB_DATABASE=mxmobilz_db`,
  `DB_USERNAME=mxmobilz`, `DB_PASSWORD=mxmobilzsecret`.
- Frontend: `VITE_API_URL` (default `/api`), `VITE_PROXY_TARGET` (default `http://localhost:8000`).

## Project Memory

See `AGENTS.md` — keep it updated each session so work is never lost.

## Docs

- `docs/architecture.md` — services, API endpoints, data flow.
- `docs/deployment.md`, `docs/runbook.md`, `docs/security.md`, `docs/disaster-recovery.md`,
  `docs/troubleshooting.md` — cloud-native ops (fill per environment).