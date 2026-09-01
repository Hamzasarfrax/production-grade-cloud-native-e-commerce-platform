# Mxmobilz — Project Summary (honest edition, 2026-09-01)

> Portfolio one-pager. Rewritten after a full repo audit: every ✅ below can be opened and run
> from this repository today; ⚠️ marks work that is real but local-only; ❌ marks not-done.
> The previous version claimed "production-ready / enterprise-grade / 100% complete", which the
> repo did not support — see [docs/STATUS.md](docs/STATUS.md) rows 1–19 for what was corrected.

## One-paragraph pitch

Mxmobilz is an e-commerce platform build-out in which the **backend and the entire delivery
pipeline are real and CI-gated** (Laravel 13 JSON API with tests, multi-stage non-root Docker,
Kustomize+ArgoCD GitOps verified on Kind, Terraform AWS modules for VPC/EKS/RDS validated in
CI), the **React storefront is built but not yet committed**, and the whole project is
documented with an audit ledger instead of marketing. The strongest engineering story here is
finding and fixing real defects (broken CI location, zero tests, an API 500 on product create,
a Terraform dependency cycle, a LocalStack provider committed into a module) and encoding them
as green gates.

## What is genuinely implemented (verifiable from this repo)

### Backend API — ✅
- Products, orders (+line items), inquiries, promo codes, admin stats — `routes/api.php`,
  5 controllers, 6 models, 8 migrations, idempotent seeders.
- Input validation on every write (typed rules incl. `Rule::in/unique`), uniform
  `{ok,data|message,errors}` envelope, 404/422 paths tested.
- Eloquent serializers (`toApi()`) mapping snake_case storage ↔ camelCase API.
- Quality: Pint + Larastan level 7 + 5 PHPUnit feature suites, all enforced in CI.

### CI/CD — ✅ (added 2026-09-01)
- Root `ci.yml`: backend (lint/static/tests) → docker build → kustomize (dev/staging/prod) →
  terraform fmt+validate (4 dirs) + non-blocking repo-audit report; Dependabot (actions, composer).
- History note: a prior workflow existed at `backend/.github/workflows/tests.yml` — GitHub never
  executes nested workflows, so CI had **zero runs** until the move. That, and "tests passing"
  with no `tests/` folder, are exactly the kind of claim gaps this audit caught.

### Containers — ✅
- Multi-stage backend image (composer vendor stage → `php:8.3-fpm`, extensions, opcache,
  `USER www-data`), image size 1.05GB→767MB with before/after recorded in `docs/docker-trouble.md`.
- Entrypoint auto-setup: MySQL wait → migrate → seed-if-empty; compose healthcheck +
  `service_healthy` dependency.
- Registry flow documented; **not** automated (no publish workflow) → K8s tags drift (known issue).

### Kubernetes + GitOps — ⚠️ (verified locally, Aug 2026 logs in docs)
- 3-node Kind cluster; MySQL StatefulSet+PVC+headless svc; backend as nginx-sidecar+PHP-FPM
  with probes; frontend deployment; ingress-nginx routing `/`→web, `/api`→backend; live
  `curl /api/products` 200 across the full nginx→fpm→Laravel→MySQL path.
- ArgoCD: AppProject (`mxmobilz`) with developer/viewer/ci-cd roles, root App-of-Apps →
  dev/staging/prod Applications tracking `main`, Kustomize overlays with per-env patches,
  sync waves, prune+selfHeal. Reproducible: `docs/k8s-production-setup.md`, `docs/gitops-setup.md`.
- Not present: TLS, HPA/metrics-server, Prometheus, RDS wiring (in-cluster MySQL in K8s vs
  RDS in TF — intentional split, documented), ExternalSecrets are manifest-only (not in build).

### Terraform AWS — ⚠️ (validated; never applied)
- `module/vpc`: public/private subnets, NAT, k8s tags, SG segmentation (nodes, 443→ingress
  only, RDS only from EKS SG); `module/eks`: managed node groups, control-plane logs, OIDC,
  IMDSv2 enforced; `module/rds`: MySQL 8, storage encryption, backups, PI, log exports,
  Secrets Manager password; `env/{dev,stag,prod}` with S3+DynamoDB remote-state configs;
  `remote-backend` bootstrap (versioning, object lock, KMS, access logs).
- Audit-fixed 2026-09-01: LocalStack debug provider removed from vpc module & remote-backend,
  RDS↔secret `depends_on` cycle removed (validate was failing), typo'd empty `ouputs.tf` deleted,
  missing `scripts/init.sh`/`deploy.sh` (referenced by Makefile/README) created.
- CI enforces `fmt -check` + `init -backend=false` + `validate`. A real
  `terraform apply`/`destroy` in dev with a $-bill is the missing evidence — planned, not done.

### Documentation — ✅
- 15+ files, split by honesty level: verified ops logs (docker, docker-trouble, k8s setup ×2,
  gitops, argocd, troubleshooting) vs planned runbooks (deployment, runbook, security, DR,
  monitoring — each banner-marked). `docs/STATUS.md` is the claim↔fact ledger; `AGENTS.md` the
  dated session history.

## Known gaps (the honest list)

1. ❌ `frontend/` empty in Git (local app not committed) → blocks full-stack compose, UI review, load test.
2. ❌ No auth anywhere; mutations are public. No rate limiting.
3. ❌ Checkout trusts client prices/totals; no stock check/decrement; order write not transactional.
4. ❌ Payments (Stripe pkg installed, unused), emails, invoices — none.
5. ⚠️ No live environment (K8s local-only Kind, AWS never applied, no demo URL by design until auth).
6. ⚠️ Image/tag drift between compose (`1.0.2`) and manifests (`1.0.0`); no auto-publish.
7. ⚠️ ID strategy (`MX-`+5 digits) collision-prone; string PKs fine for demo scale.
8. ⚠️ Terraform pin EKS 1.28 (aged), K8s version notes need bump before any apply.

## Metrics (real numbers only)

| Metric | Value |
|---|---|
| API endpoints (methods×routes) | 17 |
| Backend PHP LOC (app+routes+config+db) | ~1.9k |
| PHPUnit test methods | 15 (5 suites) — CI-gated |
| K8s manifests (base+overlays+argocd) | 24 files, all kustomize-render checked |
| Terraform modules / env stacks | 3 + 3 + bootstrap — fmt/validate CI-gated |
| Docs (lines) | ~8.8k, split verified vs planned |
| Docker image | backend ≈767MB multi-stage, non-root |
| CI jobs / duration | 6 (backend gate typically <2min) |
| Deploys to real clouds | 0 — stated plainly |

## What an interviewer should take away

This is a DevOps-heavy portfolio project where the platform (CI gates, Git, containers, K8s
manifests, IaC) genuinely works and is verifiable in minutes, the app layer is a solid small
API, and the documentation survives scrutiny because it was audited — including fixing bugs the
audit exposed (model mass-assignment, TF cycle, misplaced CI). It is honest about being a
portfolio: no fake production claims, no invented metrics, roadmap = the actual gaps above.
