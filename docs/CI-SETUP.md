# One-time CI activation (2 minutes)

The pipeline file is written and committed at `.github/workflows/ci.yml` (visible in the repo
working tree / this PR diff), but the automation token used for the 2026-09-01 commit session
lacks the `workflows` permission, so GitHub refused that single push. Everything else landed.

**Activate it as the repo owner — pick either:**

**A) Web UI (fastest)**
1. GitHub repo → Add file → Create new file
2. Name it exactly: `.github/workflows/ci.yml`
3. Paste the contents of [`docs/ci.yml.example`](ci.yml.example) → Commit directly to `main`
   (or via PR). The pipeline runs immediately on the next push / from the Actions tab
   ("Run workflow" button appears once the file exists on the selected branch).

**B) From your terminal**
```bash
git checkout main   # or your working branch
# copy .github/workflows/ci.yml from the arena branch checkout / this repo folder, then:
git add .github/workflows/ci.yml && git commit -m "ci: add pipeline" && git push
```

After that, verify: repo → Actions → "CI" → should show `backend`, `docker-build`, `frontend`
(prints an honest skip notice until `frontend/` is committed), `k8s-manifests`, `terraform`,
`repo-audit` (report job). Dependabot (root `.github/dependabot.yml`) works regardless of A/B.

Keep `docs/ci.yml.example` in sync with the workflow if you edit either.
