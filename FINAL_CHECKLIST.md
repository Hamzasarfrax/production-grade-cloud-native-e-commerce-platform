# Project Checklist — Honest Status (rewritten 2026-09-01)

> This file previously marked every item ✅ "COMPLETE & PRODUCTION-READY". A repo-wide audit
> disproved a chunk of it (see [docs/STATUS.md](docs/STATUS.md) rows 1–19), so it was rewritten
> to reality. Legend: ✅ true & verifiable from this repo · ⚠️ done on dev machine / not in repo
> · ❌ not done · 🔧 fixed during the 2026-09-01 pass.

## Application layer

- ❌ Frontend (React 19 + Vite + TS) — app exists **locally** (landing/shop/compare/trade-in/
  cart/checkout/contact/admin per AGENTS.md), but `frontend/` is empty in Git; until committed:
  full-stack `docker compose up` fails, load test has no target, no UI can be reviewed.
- ✅ Backend Laravel 13 JSON API — products/orders/inquiries/promos/stats + `/api/health`,
  matching `docs/architecture.md`.
- 🔧 `POST /api/products` regression fixed (`id` added to `Product` `#[Fillable]`) + tested.
- ⚠️ "Graceful frontend fallback to mock data" — described in AGENTS.md for the local copy;
  not reviewable from the repo.
- ❌ Auth (Sanctum), payments (stripe-php unused), email notifications, rate limiting.

## Tests & quality gates

- 🔧 First real test suite: `backend/tests/Feature/` (5 files, covers every controller incl.
  validation & 404 paths). `php artisan test` locally = exactly what CI runs.
- 🔧 CI at repo root: `.github/workflows/ci.yml` — pint, larastan L7, phpunit, docker build,
  kustomize (3 overlays), terraform fmt+validate, repo-audit summary. (Old
  `backend/.github/workflows/tests.yml` never ran — wrong location.)
- ❌ Coverage threshold, MySQL-level seeder tests, frontend tests, e2e tests — not set up.

## Containers & local stack

- ✅ `backend/Dockerfile` multi-stage (composer → php:8.3-fpm, non-root, opcache; CI builds it).
- ✅ `backend/docker/entrypoint.sh`: DB wait → `migrate --force` → seed only when empty.
- ✅ Root `docker-compose.yml` (mysql healthcheck + fpm + nginx :8000); ⚠️ full bring-up needs
  the missing frontend service — API side runs standalone (`docker compose up backend-nginx`).
- 🔧 Root `.env.example` added (compose `${DB_*}` interpolation).
- ⚠️ Registry push: manual procedure documented (`docs/docker.md`); no publish workflow,
  images on Docker Hub pinned `1.0.0` vs compose `1.0.2` → drift issue stands.

## Kubernetes & GitOps

- ✅ `gitops/base` manifests (namespace, MySQL StatefulSet, backend nginx+FPM deployment,
  frontend deployment, ingress, NetworkPolicies) — render-checked by CI (`kustomize build`).
- ✅ Overlays dev/staging/prod (replicas, config, CHANGE_ME secret patches) — CI-rendered.
- ✅ ArgoCD App-of-Apps + AppProject with roles — verified **on local Kind** (Aug 2026 logs:
  `docs/k8s-production-setup.md`, `docs/gitops-setup.md`, `docs/argocd.md`); nothing running now.
- ⚠️ ExternalSecrets manifests exist but are not part of any kustomization build; ClusterSecretStore
  not installed anywhere.
- ❌ TLS/cert-manager, HPA/metrics-server, Prometheus stack, Velero/backups in-cluster,
  securityContext `runAsNonRoot` on all pods.
- ❌ Production EKS cluster: never created (see Terraform).

## Terraform (AWS)

- ✅ Structure: `module/{vpc,eks,rds}` + `env/{dev,stag,prod}` + `remote-backend`
  (S3 versioned+locked+KMS state, DynamoDB lock).
- 🔧 Bugs fixed & now CI-enforced: LocalStack provider removed from `module/vpc` and from
  `remote-backend`; `aws_db_instance` ↔ secret-version dependency cycle removed in RDS module;
  empty `ouputs.tf` typo file deleted; missing `infra/scripts/{init,deploy}.sh` created
  (Makefile/README had referenced them).
- ⚠️ `terraform fmt/validate` passing in CI = configuration is *well-formed*, **not** that it
  works: `init/plan/apply` against a real AWS account has never been run (cost), node sizing &
  pricing untested, remote state not yet initialized, k8s version pin (1.28) outdated.
- ❌ Drift protection, policy checks (OPA/Sentinel), cost policy — none.

## Observability, resilience, security docs

- ⚠️ `docs/deployment.md`, `runbook.md`, `security.md`, `disaster-recovery.md`, `monitoring.md`:
  legitimate procedures/guides, but they are **plans**, not exercised runbooks — each carries a
  banner; treat "tested/rehearsed" phrasing inside them as intended-state prose.
- ✅ RDS Terraform *config* includes backups/PITR window, deletion protection flags, encryption;
  no restore drill was ever performed because there is no DB instance.
- ✅ Non-secret hygiene: no credentials committed (dev placeholders only); `.gitignore`s in
  place; dependabot root-level (composer + actions).

## Portfolio/docs layer

- ✅ README rewritten to truth-first (this is what an interviewer sees).
- 🔧 docs/STATUS.md added = the audited claims ledger (severity + evidence + how to re-verify).
- 🔧 PROJECT_SUMMARY.md and INTERVIEW_TALKING_POINTS.md recalibrated (no "99.9% uptime",
  no "implemented" for local-only work).
- 🔧 LICENSE (MIT) file added — badge and composer.json finally match a real file.
- ❌ Live demo URL — deliberately none until auth exists; a public writable API is not demo-safe.

## Scoreboard (what the audit + fixes changed)

| Area | Before (claimed / real) | After 2026-09-01 |
|---|---|---|
| CI | claimed "automation ready" / **nothing ran, workflow misplaced** | 6 gates running on every push/PR |
| Tests | "passing" / **none existed** | 5 real feature suites, green gate |
| API correctness | assumed OK / create-product 500 bug | fixed + regression test |
| Terraform | "production-grade" / validate-breaking bugs | fmt+validate green; still never applied (honestly labeled) |
| Frontend | "complete, connected" | **still the #1 gap** — local code must be committed |
| Claims hygiene | "production-ready, 100% interview ready" | audit ledger in docs/STATUS.md, docs carry reality levels |

## If you fork/clone this repo today

```bash
cp .env.example .env
docker compose up -d backend-nginx        # API + MySQL + fpm on :8000 — no frontend needed
curl localhost:8000/api/health
cd backend && php artisan test            # needs PHP 8.3 + composer
```

Everything else in this file is either in a repo folder (open it) or explicitly not done.
