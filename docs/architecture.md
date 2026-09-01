# Mxmobilz — Architecture

## Services (Microservices)

| Service | Folder  | Tech                 | Port  | Exposed via |
|---------|---------|----------------------|-------|-------------|
| web     | frontend| React 19 + Vite + TS | 3000  | http://localhost:3000 |
| api     | backend | Laravel 13 (PHP 8.3) | 8000  | http://localhost:8000 |
| db      | —       | MySQL 8              | 3306  | internal (api) + host |

- Each service is buildable/runable independently (own Dockerfile, own port, owns its data).
- `docker-compose.yml` orchestrates locally and is the reference for the real
  deployment (k8s manifests under `gitops/base/`, ArgoCD under `gitops/argocd/`).
- ⚠️ Reality check (2026-09-01): the `frontend/` directory is empty in this repo — the React
  app exists only in the developer's local working copy. Until it is committed, only the
  `api`+`db` row above can be run/reviewed from Git (see `docs/STATUS.md`).

## API Contract

All responses: `{ "ok": true, "data": ... }`. Errors: `{ "ok": false, "message": "..." }` (+ optional `errors` map).

| Method   | Path                | Description                          |
|----------|---------------------|--------------------------------------|
| GET      | /api/health         | Liveness probe                       |
| GET      | /api/products       | List (filters: `?brand=`, `?search=`)|
| GET      | /api/products/{id}  | Detail                               |
| POST     | /api/products       | Create (admin)                       |
| PUT      | /api/products/{id}  | Update (admin)                       |
| DELETE   | /api/products/{id}  | Delete (admin)                       |
| GET      | /api/orders         | List (filter: `?status=`)            |
| POST     | /api/orders         | Place order (checkout)               |
| PATCH    | /api/orders/{id}    | Update status/tracking (admin)       |
| GET      | /api/inquiries      | List (filter: `?status=`)            |
| POST     | /api/inquiries      | Contact form                         |
| PATCH    | /api/inquiries/{id} | Update status (admin)                |
| DELETE   | /api/inquiries/{id} | Delete (admin)                       |
| GET      | /api/promos         | List                                 |
| POST     | /api/promos         | Create (admin)                       |
| PUT      | /api/promos/{id}    | Update (admin)                       |
| DELETE   | /api/promos/{id}    | Delete (admin)                       |
| GET      | /api/stats          | Admin dashboard KPIs                 |

JSON keys are camelCase and match the frontend types in `frontend/src/types.ts`.

## Data Flow

```
Browser (React :3000)
   │  fetch('/api/...')          ┌─────────── Vite dev proxy ───────────┐
   ▼                              ▼                                      │
AdminDashboard/admin views ──> api.ts ──> /api (proxied) => Laravel :8000 ┘
                                              │  Eloquent Models
                                              ▼
                                          MySQL :3306
```

- `frontend/src/api.ts` is the single API client. On mount `App.tsx` tries to hydrate state
  from the API; if unreachable it gracefully falls back to `src/data/mockData.ts` + localStorage.
- No auth yet — API is public. Next step: Laravel Sanctum + login gating for `/admin`.

## Backend Structure (key files)

- `routes/api.php` — all API routes.
- `app/Http/Controllers/Api/*` — Product/Order/Inquiry/Promo/Stats controllers.
- `app/Models/*` — Eloquent models + `toApi()` serializers.
- `database/migrations/*` — schema (products, orders, order_items, inquiries, promos).
- `database/seeders/*` — seed data mirrored from frontend mock data.
- `app/Support/ApiResponse.php` — uniform `{ok,data}` response helper.

## Notes / Known Limits

- CORS open (`*`) for dev; restrict in production.
- Seeder + migrations are idempotent (`updateOrCreate`).
- MySQL stored via `backend/.env`; Docker overrides DB host to the `db` service.