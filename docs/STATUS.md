# Project STATUS — verified claims audit (2026-09-01)

> **Why this file exists:** the earlier docs (README, FINAL_CHECKLIST, PROJECT_SUMMARY) marked
> everything as done / "production-ready" / "100% interview ready". A re-audit of the actual
> repository found that several of those claims were not true of the repo (frontend code, CI,
> tests, LICENSE, working Terraform). This file is now the single honest status ledger — when
> something changes, move the row, don't edit history.
>
> Legend: ✅ real & in repo · ⚠️ real but local-only / partial · ❌ claimed but absent · 🔧 fixed 2026-09-01.

## 1. Audit findings

| # | Claim (old doc) | Reality at audit (2026-09-01) | Action taken |
|---|---|---|---|
| 1 | "Full-stack platform: React frontend in `frontend/`" | `frontend/` is an **empty directory** in Git. The React app exists only on the developer's machine (per AGENTS.md logs) | ❌→tracked as top roadmap item; README rewritten; CI has an honest skip-until-present frontend job |
| 2 | "CI/CD: GitHub Actions automation ready" (badge in README) | Root `.github/` **did not exist**. A workflow + dependabot sat in `backend/.github/` — GitHub only discovers workflows at repo root, so **zero CI runs had ever happened** (verified: `GET /actions/runs` returned none) | 🔧 New root `.github/workflows/ci.yml` + root `dependabot.yml`; dead nested copies removed |
| 3 | "php artisan test — all passing" | No `backend/tests/` directory at all; `phpunit.xml` pointed at `tests/Unit` + `tests/Feature` which didn't exist | 🔧 First real test suite added: 5 feature files covering all controllers (health/products/orders/inquiries/stats/promos) |
| 4 | "Transaction support for order placement" (README Features) | `OrderController::store()` writes order + items **without** `DB::transaction` — a failing line item leaves a half-written order | ❌ documented as known issue #2; on roadmap |
| 5 | "Filtering, pagination, aggregation" | Filtering ✅, aggregation (stats) ✅, **pagination: not implemented** (lists return everything) | ❌ documented; roadmap |
| 6 | "Sanctum authentication ready" | `laravel/sanctum` is in composer.json; **no** auth routes, no middleware on any API route; all CRUD is public. README's own "Recommended" list contradicted the "Implemented" list | ❌ documented honestly |
| 7 | Stripe payments | `stripe/stripe-php` required but **zero references in code** | ❌ documented; either integrate or drop the dependency (roadmap) |
| 8 | "Docker stack verified" (AGENTS.md, with dates) | Credible: compose + multi-stage Dockerfile + entrypoint auto-seed are coherent; image-size numbers documented in `docs/docker-trouble.md`. But `docker compose up` fails for a fresh clone because `./frontend/Dockerfile` doesn't exist and root `.env` (needed by `${DB_*}` interpolation) had no template | 🔧 root `.env.example` added; README quick-start documents API-only bring-up; frontend item blocks full-stack compose |
| 9 | `POST /api/products` with client id works (implied by admin CRUD claims) | Real bug: `id` was **not in the Product `#[Fillable]` list** → controller's `$data['id']` was silently dropped → insert with NULL PK → 500 | 🔧 `'id'` added to Fillable + regression test `test_can_create_product_with_client_id` |
| 10 | "Terraform: production-grade, apply-ready dev/stag/prod" | `terraform init/validate` had never been run in CI. Findings: (a) `infra/module/vpc/provider.tf` contained a **LocalStack debug provider** (`access_key="test"`, endpoints → `localhost:4566`) inside the module — any real apply would have been pointed at localhost; (b) same pattern in `infra/remote-backend/provider.tf`; (c) RDS module had an explicit `depends_on` creating a **dependency cycle** (`aws_db_instance` ↔ its own Secrets Manager version, which reads `aws_db_instance.address`) — `terraform validate` fails on cycles; (d) empty typo file `infra/env/dev/ouputs.tf` | 🔧 (a)(b) LocalStack overrides removed (modules now inherit the environment's provider), (c) cycle removed with explanation comment, (d) deleted. CI now runs `terraform fmt -check` + `init -backend=false` + `validate` on all 4 dirs. **Still ⚠️: never applied against real AWS — that remains unverified.** |
| 11 | "init.sh / deploy.sh" in project structure + README "Option 3" (`./scripts/init.sh`, `deploy.sh -e dev -a apply`) | `infra/scripts/` did not exist; `Makefile init` referenced it | 🔧 Minimal real `init.sh` + `deploy.sh` added and executable |
| 12 | LICENSE badge / "MIT" | No `LICENSE` file existed (composer.json did say MIT) | 🔧 MIT LICENSE added (author per GitHub account) |
| 13 | "kubectl apply -f bootstrap-argocd.sh" (README Option 3) | That's a shell script, not a manifest; file also lives at `gitops/bootstrap-argocd.sh`, not `gitops/` root of a `cd`-able path as written; README referenced `argocd/applications/mxmobilz-prod.yaml` — actual file: `prod-application.yaml` | 🔧 README corrected to `bash gitops/bootstrap-argocd.sh` |
| 14 | "K8s + ArgoCD: LIVE" (AGENTS.md, 2026-08) | True **on the dev machine's Kind cluster** at the time (with verification logs); nothing is running today; no cluster resources exist in this repo besides manifests. `gitops/base/external-secrets/` is manifest-only, not included in any kustomization build | ⚠️ kept as "verified locally" with that exact wording; gaps documented |
| 15 | ArgoCD apps track `targetRevision: main` while dev branch work happens | Correct pattern (GitOps = main is truth) — but combined with images pinned `1.0.0` (compose builds `1.0.2`) there is **no pipeline that ever updates image tags**; ArgoCD can only stay up to date if CI pushes new tags (roadmap) | ❌ documented as image-drift issue #4 |
| 16 | "150+ pages of professional documentation, enterprise-grade" | 13 files / ~8.6k lines exist. The *verified* subset (docker-trouble, k8s-*, gitops-setup, argocd, troubleshooting) is genuinely detailed and matches repo paths. `deployment.md`, `runbook.md`, `security.md`, `disaster-recovery.md`, `monitoring.md` are **playbooks/proposals** (correct commands, unexecuted; e.g. deployment.md referenced a non-existent `setup.sql` and `k8s/` paths from the old layout) | ⚠️ each got a status banner; dead references being fixed |
| 17 | "FINAL_CHECKLIST: all ✅, 'code examples tested & verified', 'no hardcoded secrets'" | Checklist contradicted the repo (items 1–3, 10–12 above); "no hardcoded secrets" — LocalStack dummy creds (fixed) and dev placeholder passwords in `gitops/base/mysql/mysql-secret.yaml` (dev-only, overlays use placeholders; real secrets → ExternalSecrets) | 🔧 file rewritten as honest status doc |
| 18 | "99.9% uptime SLA achievable", "zero-downtime deployments implemented" (INTERVIEW_TALKING_POINTS.md) | No production exists; rolling-update *manifests* (maxSurge/maxUnavailable) are configured, which is honest talk; SLA claim is not | ⚠️ doc got a reality banner; claims reframed as design, not measured |
| 19 | Repo hygiene | Default branch `main`; only 2 commits total; branch `dev` referenced in AGENTS.md history exists only as PR #4 merge | ℹ️ documented; work here lands via PR |

## 2. What CI now proves on every PR

| Gate | File(s) | Meaning if red |
|---|---|---|
| Pint | `backend/app,config,database,routes,tests` | style drift |
| Larastan level 7 | `backend/phpstan.neon` | type/contract regression in controllers/models |
| PHPUnit | `backend/tests/Feature` | API behavior regression (all endpoints, validation, 404s, stats math) |
| Docker build | `backend/Dockerfile` | image no longer builds |
| kustomize build | `gitops/overlays/{dev,staging,prod}` | a manifest/patch broke rendering |
| terraform fmt+validate | `infra/env/{dev,stag,prod}`, `infra/remote-backend` | syntax, undeclared refs, or dependency cycles returned |
| repo-audit (non-blocking) | — | prints the state table (frontend? auth? transactions? LICENSE?) in the run summary |

Reproduce any of it locally:

```bash
cd backend && composer install && cp .env.example .env && php artisan key:generate
vendor/bin/pint --test && vendor/bin/phpstan analyse && php artisan test
# infra: terraform -chdir=infra/env/dev fmt -check -recursive && terraform init -backend=false && terraform validate
```

## 3. Honest overall rating (as of 2026-09-01)

| Dimension | Grade | Reasoning |
|---|---|---|
| Production readiness of a **store** | **Not production ready** — D+ | No auth, no payments, client-trusted pricing, no TLS, nothing deployed, no monitoring stack running |
| Backend **code** quality | C+ → B- | Clean layering, validation everywhere, consistent envelope; now tested & typed (level 7); missing: auth, transactions, pagination |
| Docker / local devops | B | Multi-stage non-root images, auto-migrate/seed entrypoint, healthchecked deps; gaps: registry automation, tag freshness |
| Kubernetes + GitOps | B- (Kind-verified) | Real StatefulSet/sidecar/network-policy/ArgoCD practice with logs; not EKS, no TLS/HPA, secret wiring half-done, image drift |
| Terraform | C+ | Structured modules, encryption/lockdown patterns, CI-validated now — never applied, EKS 1.28 outdated, Karpenter/IRSA depth not present |
| Documentation | B (was D for honesty, now recalibrated) | Verified ops logs are strong; aspirational marketing prose stripped; STATUS.md is the ledger |
| **As a portfolio project** | **Solid** — genuinely above average | The interesting story is the audit itself: found and fixed real bugs (Fillable-id, TF cycle, LocalStack provider, misplaced CI), added tests + CI, and documented everything honestly. That's what reviewers should probe |

## 4. Open risks / next evidence to produce

1. Commit the React frontend → makes full-stack compose, CI frontend job, load test, and the
   "full-stack" claim all true at once.
2. Auth (Sanctum) + `auth:sanctum` on mutations → flips known-issue #1 and enables exposing the
   API safely for demos.
3. `docker-publish.yml` (build → push → bump `gitops` tag) → closes the image-drift loop that
   makes GitOps end-to-end real.
4. One `terraform apply` in dev + `terraform destroy` → converts the entire `infra/` folder
   from "validated" to "proven".
5. Order write → `DB::transaction` + server-side totals → prerequisite for any checkout demo.

*Audit method: full read of backend routes/controllers/models/migrations/Docker/compose, all
`gitops/` manifests, all `infra/` TF files, every markdown doc; GitHub API checked workflows
and run history (none existed at audit time); remote tree confirmed empty `frontend/` on
`main`. Nothing in this table is inferred without a file to open.*
