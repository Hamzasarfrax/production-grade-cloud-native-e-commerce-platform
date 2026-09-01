# 🛍️ Mxmobilz — Cloud-Native E-commerce Platform (Portfolio Project)

> A **full-stack e-commerce API** (Laravel 13 + MySQL) with the surrounding cloud-native
> platform work: Docker, Kubernetes (Kind, EKS-ready), ArgoCD GitOps, Terraform (AWS
> dev/staging/prod) and a real CI pipeline. **This is a portfolio/learning project, not a
> live production deployment** — and this README tells you exactly what is verified, what is
> local-only, and what is pending. No marketing.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
![CI](https://github.com/Hamzasarfrax/production-grade-cloud-native-e-commerce-platform/actions/workflows/ci.yml/badge.svg)
[![Status: Development](https://img.shields.io/badge/Status-Development-orange)]()

**Start here if you want the unvarnished facts:** [docs/STATUS.md](docs/STATUS.md) — every
claim in this repo, marked ✅ verified / ⚠️ partial / ❌ not done, with the command to
re-verify it.

---

## 📋 Table of Contents

- [What actually exists (reality check)](#-what-actually-exists-reality-check)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [CI pipeline (GitHub Actions)](#-ci-pipeline-github-actions)
- [Quick Start (backend API)](#-quick-start-backend-api)
- [API reference](#-api-reference)
- [Testing](#-testing)
- [Docker & Kubernetes & GitOps](#-docker--kubernetes--gitops)
- [Infrastructure as Code (Terraform)](#-infrastructure-as-code-terraform)
- [Security posture (honest)](#-security-posture-honest)
- [Known issues & limitations](#-known-issues--limitations)
- [Roadmap](#-roadmap)
- [Documentation index](#-documentation-index)

---

## ✅❌ What actually exists (reality check)

| Component | State | Details |
|---|---|---|
| **Backend API** (Laravel 13) | ✅ In repo | 5 resource controllers (products, orders, inquiries, promos, stats) + health. Validation on every write. String-PK models with `toApi()` serializers. Migrations + idempotent seeders. |
| **Docker stack (API side)** | ✅ In repo | Multi-stage `backend/Dockerfile` (composer → php:8.3-fpm, non-root), auto-setup `entrypoint.sh` (DB wait → migrate → seed-if-empty), root `docker-compose.yml` (mysql 8.4 + php-fpm + nginx). Live-verified on the dev machine (2026-08-21), logs in `docs/docker-trouble.md`. |
| **Tests** | ✅ In repo (added 2026-09-01) | `backend/tests` — PHPUnit feature suite for health, product CRUD + validation, order placement + status flow, inquiry + stats aggregation, promos. Runs in CI on every PR. |
| **CI pipeline** | ✅ In repo (added 2026-09-01) | Root `.github/workflows/ci.yml` — Pint, Larastan (level 7), tests, Docker build, kustomize build of all overlays, `terraform fmt`+`validate` for 3 envs, plus a repo-audit report job. Dependabot for actions + composer. (Earlier CI attempt sat in `backend/.github/` — GitHub never runs workflows there; that is now fixed and the dead copy removed.) |
| **Kubernetes manifests + GitOps** | ✅ In repo | `gitops/` — Kustomize base + `dev`/`staging`/`prod` overlays, MySQL StatefulSet, backend (nginx sidecar + PHP-FPM), NetworkPolicies, ArgoCD App-of-Apps, ExternalSecrets manifests (not wired into the build yet). |
| **Kind cluster (local K8s)** | ⚠️ Verified locally only | 3-node Kind cluster ran full stack with ArgoCD on the dev machine (2026-08-27/31). Reproducible via `docs/k8s-production-setup.md` + `docs/gitops-setup.md`, but it does not live in this repo and nothing is running right now. |
| **AWS via Terraform** | ⚠️ Validated, never applied | VPC/EKS/RDS modules + dev/stag/prod envs + S3/DynamoDB state bootstrap. CI runs `terraform fmt`/`validate`; it has **never been applied against a real AWS account** (that costs money; not done yet). Two real bugs were found and fixed on 2026-09-01: a LocalStack debug provider committed inside `module/vpc`, and a circular dependency in the RDS module (`terraform validate` failed on both). |
| **Frontend (React + Vite + TS)** | ❌ Not in this repo | The storefront/admin SPA exists only in the developer's local working copy (its status log: `AGENTS.md`). Until it is committed: the repo has an empty `frontend/`, `docker compose up` fails at the frontend build, and no frontend features in any doc should be assumed available. This is the #1 open item. |
| **Live production URL** | ❌ None | There is no deployed public instance of this project. Any doc mentioning a live URL describes the procedure, not a running service. |
| **Auth / payments / email** | ❌ Not implemented | No Sanctum routes, no Stripe integration code (package is required in composer.json but unused), no mail flows. |

---

## 🏗️ Architecture

```
                        ┌────────────────────────────┐
   Browser ───────────► │  Frontend (React+Vite)    │  ⚠️ local copy only, not committed
                        │  nginx :3000 (or vite dev)│
                        └────────────┬───────────────┘
                                     │ /api (same-origin reverse proxy / Vite proxy)
                        ┌────────────▼───────────────┐
                        │  nginx :8000 ──► PHP-FPM   │  ✅ backend/ (Dockerfile, entrypoint)
                        │  Laravel 13 JSON API       │
                        └────────────┬───────────────┘
                                     │ Eloquent / mysql:3306
                        ┌────────────▼───────────────┐
                        │  MySQL 8                   │  local: compose container · kind: StatefulSet · aws: RDS (Terraform, never applied)
                        └────────────────────────────┘

 Delivery: GitHub (source of truth) → CI (GitHub Actions) → [manual] docker push
          → ArgoCD (App-of-Apps) → Kustomize overlays (dev/staging/prod) → Kind (local) / EKS (planned)
```

- Two deployable artifacts: **backend API image** and **frontend static image** (the latter
  pending the frontend commit). They are *separate deployables*, not a mesh of microservices —
  don't oversell them as such.
- Everything flows through the Git repo: manifests under `gitops/` are what ArgoCD syncs.
- Standard response envelope: `{"ok": true, "data": ...}` / `{"ok": false, "message": "..."}`.

### Where the data lives per environment

| Environment | Database | Status |
|---|---|---|
| Local `docker compose` | MySQL 8.4 container, volume-persisted | ✅ wired, auto-migrated + seeded by `backend/docker/entrypoint.sh` |
| Kind cluster (`gitops/overlays/dev` etc.) | in-cluster MySQL StatefulSet + PVC | ⚠️ verified locally, manifests in repo |
| AWS (Terraform `env/prod`) | RDS MySQL, private subnets, encrypted, Secrets Manager password | ❌ code validated in CI, never applied |

Note the honest mismatch: the K8s manifests talk to the **in-cluster** MySQL StatefulSet, while
Terraform provisions **RDS**. Wiring the app to RDS (via the ExternalSecrets manifests already
in `gitops/base/external-secrets/`, which are not yet part of the kustomize build) is on the
roadmap.

---

## 💻 Tech Stack

| Layer | Technology | Note |
|-------|-----------|------|
| Frontend | React 19 + Vite + TypeScript | local copy — not yet committed (see reality check) |
| Backend | Laravel 13, PHP 8.3 | pure JSON API, `routes/api.php` |
| Database | MySQL 8 | Eloquent, string PKs, JSON columns |
| Containers | Docker (multi-stage), Compose | non-root fpm image, entrypoint auto-setup |
| Orchestration | Kubernetes | local Kind (verified), AWS EKS (Terraform, unapplied) |
| IaC | Terraform ≥1.3 | vpc/eks/rds modules, dev/stag/prod, S3+DynamoDB state bootstrap |
| GitOps | ArgoCD + Kustomize | App-of-Apps, RBAC project, 3 overlays |
| CI | GitHub Actions | `.github/workflows/ci.yml` — added 2026-09-01 |
| Load test | k6 | `load-test.js` targets the frontend URL — only runnable once frontend is served |

---

## 🚦 CI pipeline (GitHub Actions)

`.github/workflows/ci.yml` runs on push (`main`, `dev`), every PR, and manual dispatch:

| Job | Gate | What it proves |
|---|---|---|
| `backend` | ✅ fails CI | Pint style, Larastan level 7, PHPUnit suite (sqlite in-memory, `RefreshDatabase`) |
| `docker-build` | ✅ fails CI | `backend/Dockerfile` actually builds; image smoke-runs `php -v` |
| `frontend` | honest skip | Builds `frontend/` **if** it is committed; prints a notice until then (it currently isn't) |
| `k8s-manifests` | ✅ fails CI | `kustomize build` of dev/staging/prod overlays renders |
| `terraform` | ✅ fails CI | `fmt -check`, `init -backend=false`, `validate` for dev/stag/prod + remote-backend |
| `repo-audit` | report only | Writes a status table into the run summary: frontend missing? auth? transactions? LICENSE? — it never fails, it just tells the truth |

Check the actual current state: repo → **Actions** tab → latest run. Green means the gates
above pass at that commit; anything listed red in `repo-audit` is a known gap, not a flake.

Dependencies are refreshed by **Dependabot** (`.github/dependabot.yml`: actions + composer).

> **First-run note:** the workflow file (`.github/workflows/ci.yml`) is written in-repo, but the
> automation used during the 2026-09-01 audit commit could not push into `.github/workflows/`
> (GitHub App permission). One-time 2-minute activation: follow
> [docs/CI-SETUP.md](docs/CI-SETUP.md) (paste [`docs/ci.yml.example`](docs/ci.yml.example) as
> `.github/workflows/ci.yml`). Until that happens the Actions tab is legitimately empty —
> this paragraph is the honest status, not a missing badge.

---

## 🚀 Quick Start (backend API)

### Prerequisites

Docker (or PHP 8.3 + Composer + MySQL 8), Linux/macOS/WSL.

### Option A — Docker (API + MySQL)

```bash
cp .env.example .env          # mysql root/user/password for the compose stack
docker compose up -d --build backend-app backend-nginx mysql
# NOTE: do NOT run plain `docker compose up` yet — the front-end-app service builds
# from ./frontend/Dockerfile, which is still missing from the repo (see reality check).
curl localhost:8000/api/health
curl localhost:8000/api/products
```

The backend container auto-waits for MySQL, runs `migrate --force`, and seeds only when the
database is empty (`backend/docker/entrypoint.sh`).

### Option B — Bare metal

```bash
cd backend
composer install              # or: composer setup
cp .env.example .env          # point DB_* at a local MySQL (or switch to sqlite for a taste)
php artisan key:generate
php artisan migrate --seed
php artisan serve             # http://localhost:8000/api
php artisan test              # the CI test suite, same as GitHub Actions runs
```

### Frontend

Not in this repo yet. Until `frontend/` is committed, there is no storefront to start;
`AGENTS.md` documents what the local copy does (landing/shop/compare/trade-in/cart/checkout/
contact + admin dashboard, Vite proxy `/api` → `:8000`).

---

## 📡 API reference

Implemented in `backend/routes/api.php` — this table matches the code, endpoint-for-endpoint.
**All routes are currently public (no auth) — see known issues.**

| Method | Path | Notes |
|---|---|---|
| GET | `/api/health` | liveness |
| GET, POST | `/api/products` | list supports `?brand=`, `?search=`, `?featured=1`; create takes camelCase payload, id defaults to a slug |
| GET, PUT/PATCH, DELETE | `/api/products/{id}` | `{ok:false, message}` 404 on unknown id |
| GET, POST | `/api/orders` | list `?status=`; create persists shipping + line items (currently **not** wrapped in a DB transaction) |
| PATCH | `/api/orders/{id}` | status (Pending/Processing/Shipped/Delivered/Cancelled) + tracking |
| GET, POST | `/api/inquiries` | contact form; id `INQ-xxx` |
| PATCH, DELETE | `/api/inquiries/{id}` | |
| GET, POST, PUT/PATCH, DELETE | `/api/promos` | code uppercased, unique |
| GET | `/api/stats` | admin KPIs: revenue, counts, avg order value, low-stock, recent orders/inquiries |

Laravel also serves `/up`. See [docs/architecture.md](docs/architecture.md) for the data flow.

---

## 🧪 Testing

Reality: before 2026-09-01 this project had **zero tests** (phpunit.xml pointed at a
non-existent `tests/` dir and the only "CI" sat in the wrong folder). That is fixed:

- `backend/tests/Feature/` — 5 suites / ~15 assertions groups covering every controller's
  happy path + validation/404 paths (health, product CRUD + filters, order place/update/filter,
  inquiry + stats math, promo unique rules).
- Run locally: `cd backend && php artisan test` (sqlite in-memory — no database needed).
- What is **not** covered yet: seeders idempotency under MySQL, auth (doesn't exist), the
  frontend (not in repo), k8s manifests beyond rendering. No coverage threshold is enforced —
  honest starting point, expand it with every feature.

---

## 🐳 Docker & Kubernetes & GitOps

### Containers (in repo)

- `backend/Dockerfile` — multi-stage: `composer:2.8` deps (`--no-dev`) → `php:8.3-fpm-bookworm`
  + pdo_mysql/zip/gd/opcache, `USER www-data`, ~767MB (was 1.05GB; walk-through in
  `docs/docker.md`, incident history in `docs/docker-trouble.md`).
- Root `docker-compose.yml` — `mysql` (healthcheck + depends_on) → `backend-app` (fpm:9000)
  → `backend-nginx` (:8000) → (pending) `front-end-app` (:3000 with `/api` proxy via
  `BACKEND_URL`).

### Kubernetes (`gitops/`)

Kustomize base: namespace, MySQL StatefulSet+Secret, backend Deployment (nginx sidecar + FPM,
probes on `/api/products`), frontend Deployment, ingress, NetworkPolicies. Overlays
`dev`/`staging`/`prod` patch replicas/config/secrets. ArgoCD: `mxmobilz` AppProject with
roles, root App-of-Apps → per-env Applications tracking `main`.

Verified **locally** (not by CI): Kind 3-node cluster + ArgoCD sync + `/api/products` 200
end-to-end — procedure in `docs/k8s-production-setup.md`, `docs/gitops-setup.md`,
`docs/k8s-mysql-setup.md`. Bootstrapping ArgoCD on a fresh cluster:

```bash
kubectl cluster-info && bash gitops/bootstrap-argocd.sh   # installs ArgoCD, applies project + root app
```

Caveats to know about: images are pulled from `hamzasarfraz862/*` on Docker Hub pinned to
`1.0.0` while compose builds `1.0.2` — there is **no registry-push automation**, so K8s
manifests go stale after any backend change (roadmap item). `mysql-secret.yaml` in `base/mysql`
holds dev-only placeholder passwords — replace via overlays/ExternalSecrets; do not put real
secrets in Git.

### EKS

Nothing is running on AWS. `infra/` is validated code only (fmt/validate in CI). To attempt a
real apply you need an AWS account, then:

```bash
cd infra
./scripts/init.sh                      # bootstraps S3 state bucket + DynamoDB lock (reads confirmation)
./scripts/deploy.sh -e dev -a plan     # plan/apply/destroy per env
aws eks update-kubeconfig --region us-east-1 --name mxmobilz-dev
```

---

## 🛠️ Infrastructure as Code (Terraform)

- `infra/module/vpc` — VPC, public/private subnets, NAT, SGs (public→443, EKS nodes, RDS only
  from EKS SG), k8s-style subnet tags. Modules are provider-free by design now — a committed
  LocalStack override in the module was found and removed 2026-09-01 (it would have pointed
  every environment at `localhost:4566`).
- `infra/module/eks` — cluster + managed node groups (scaling config per env), control-plane
  logs, OIDC, IMDSv2 required, CloudWatch retention.
- `infra/module/rds` — MySQL 8, encrypted, backups, Performance Insights, CloudWatch log
  groups, Secrets Manager password rotation-free storage. The `aws_db_instance` ↔
  `aws_secretsmanager_secret_version` cycle was fixed 2026-09-01 (it failed `terraform
  validate` before that).
- `infra/env/{dev,stag,prod}` — three isolated root stacks with S3 remote state;
  `terraform.tfvars.example` per env. Staging is named `stag/` (folder) but tags `staging`.
- `infra/remote-backend` — one-time state bootstrap (bucket + versioning + object lock + KMS
  + DynamoDB lock table + access logging); its LocalStack-only provider block (hard-coded
  fake credentials) was removed 2026-09-01.

**What has not been done:** no `terraform plan` against a real account, no cost-tested
node sizing, no state migration (remote backend config is aspirational until
`init.sh` has been run by you).

---

## 🔒 Security posture (honest)

**Implemented:** request validation on every write endpoint; mass-assignment whitelists;
non-root containers; MySQL not publicly reachable in compose/K8s (NetworkPolicies); secrets
not committed (dev placeholders only); Terraform: encrypted RDS + KMS-encrypted state bucket,
IMDSv2 enforced, private subnets for nodes/DB; Dependabot; CI gates on lint/static analysis.

**Not implemented (would block a real store):**

1. **No authentication/authorization** — anyone can `POST/PUT/DELETE` products, orders, promos.
   Sanctum package is installed but no routes use it. Treat the API as read-only demo.
2. **Client-trusted money** — order `subtotal/totalAmount` come from the request; prices are
   never recomputed server-side, no stock check/decrement, no payment verification.
3. **No rate limiting / WAF / audit log.**
4. **CORS is `*`, `APP_DEBUG=true` in the example env** — both must change for any real deploy.
5. ID generation `MX-` + 5 random digits (collision → duplicate-key 500) and
   `INQ-` + 3 digits; needs a real sequence/ULID strategy.

Details & intended fixes: [docs/security.md](docs/security.md) (marked there as plan, not
status), roadmap below.

---

## 🐞 Known issues & limitations

Tracked honestly (full audit with evidence: [docs/STATUS.md](docs/STATUS.md)):

1. `frontend/` is empty in the repo → full-stack compose fails at build; UI claims unverifiable. **(Top priority: commit the local app.)**
2. No auth, no server-side price/stock logic, order write not transactional (a failed line item can orphan a half-saved order).
3. `POST /api/products` used to be broken (the `id` was not mass-assignable on the model → 500); fixed 2026-09-01 along with the first regression test for it.
4. K8s images drift from code (tag `1.0.0` vs compose `1.0.2`); no publish workflow.
5. Terraform never applied; EKS 1.28 baseline is old — pin a supported version before applying.
6. `gitops/base/external-secrets/` manifests exist but are not in the kustomize build; `EnvironmentVariable`/ClusterSecretStore setup not done.
7. Docs in `docs/` are a mix of *verified logs* (docker/k8s/gitops/troubleshooting) and *planned procedures* (deployment/runbook/security/DR/monitoring) — each header says which.
8. No TLS (ingress annotates ssl-redirect off), no backups beyond RDS config in unapplied TF, no real monitoring stack running.

## 🗺️ Roadmap (real next steps, in order)

- [ ] Commit `frontend/` so compose + CI frontend job + reviewer flow all work
- [ ] Sanctum auth: register/login + `auth:sanctum` on mutation routes, admin role gate
- [ ] Wrap order creation in `DB::transaction`, recompute totals server-side, decrement stock
- [ ] Real order-id strategy (ULID) + unique-violation handling
- [ ] `docker-publish.yml` workflow (SHA-tagged images to a registry) + bump gitops image tags from CI
- [ ] Wire ExternalSecrets + RDS into `gitops` for prod; cert-manager TLS
- [ ] First real `terraform apply` in dev (smallest nodeset), tear down after demo
- [ ] HPA + metrics-server, Prometheus stack, DB backup drill, seed tests against MySQL service container in CI
- [ ] Rate limiting (throttle), pagination on list endpoints, pagination/sorting for admin grids

---

## 📚 Documentation index

| Doc | Reality level | Purpose |
|---|---|---|
| [docs/STATUS.md](docs/STATUS.md) | ✅ audit record | Full claims-to-facts table, how to re-verify anything here |
| [docs/architecture.md](docs/architecture.md) | ✅ code-accurate | Services, API contract, data flow |
| [docs/docker.md](docs/docker.md) | ✅ verified locally | Images, multi-stage build, registry push procedure (manual) |
| [docs/docker-trouble.md](docs/docker-trouble.md) | ✅ verified | Real incidents + fixes (compose/nginx/volume/image size) |
| [docs/k8s-production-setup.md](docs/k8s-production-setup.md) | ✅ verified on Kind | The actual local K8s build-out, WHAT/WHY/VERIFY per manifest |
| [docs/k8s-mysql-setup.md](docs/k8s-mysql-setup.md) | ✅ verified on Kind | MySQL StatefulSet journey |
| [docs/gitops-setup.md](docs/gitops-setup.md) | ✅ verified on Kind | ArgoCD, App-of-Apps, overlays, RBAC |
| [docs/argocd.md](docs/argocd.md) | ✅ verified on Kind | k8s/→gitops/ migration log + operations |
| [docs/troubleshooting.md](docs/troubleshooting.md) | ✅ verified | Known failures & fixes |
| [docs/deployment.md](docs/deployment.md) | ⚠️ planned procedures | Multi-env deploy playbook (untested against AWS) |
| [docs/runbook.md](docs/runbook.md) | ⚠️ planned procedures | Ops routines (not exercised in production) |
| [docs/security.md](docs/security.md) | ⚠️ mostly planned | Hardening plan + what is actually enforced today |
| [docs/disaster-recovery.md](docs/disaster-recovery.md) | ⚠️ planned, never drilled | RTO/RPO + recovery playbooks |
| [docs/monitoring.md](docs/monitoring.md) | ⚠️ planned | CloudWatch/Prometheus setup steps (no stack running) |
| [AGENTS.md](AGENTS.md) | ✅ session memory | Chronological project log incl. local-only work |
| [FINAL_CHECKLIST.md](FINAL_CHECKLIST.md) | ✅ rewritten honest | What's done/not-done (this used to be 100% ✅ — see STATUS) |
| [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) / [INTERVIEW_TALKING_POINTS.md](INTERVIEW_TALKING_POINTS.md) | ✅ rewritten honest | Portfolio/interview framing based on real state |

---

## 🤝 Contributing / conventions

- Backend: PSR-12 via Pint, Larastan level 7 — CI enforces both; write a feature test with
  every endpoint change.
- Keep docs honest: when you add something, update [docs/STATUS.md](docs/STATUS.md) in the
  same PR (✅ = someone can verify it from this repo or a link).
- PRs run the same CI as this README describes; don't merge red.

## 📄 License

MIT — see [LICENSE](LICENSE).

**Author:** Muhammad Hamza. This repository documents a learning/portfolio build-out: the
journey logs (docker/K8s/GitOps docs, AGENTS.md) are the point.
