<!-- backend project -->


Framework       → Laravel
Language        → PHP
Runtime         → PHP 8.4
Process         → PHP-FPM
Dependency      → Composer
Web server      → Nginx
Database        → MySQL/RDS
Runtime OS      → Debian





FROM php:8.3-fpm
        ↓
Base image lo
PHP + PHP-FPM environment

WORKDIR /var/www/html
        ↓
Container mein application ki working directory set karo

COPY --from=composer:2 ...
        ↓
Composer ki official image se Composer binary copy karo

COPY . .
        ↓
Host/build-context ka Laravel code
container ke /var/www/html mein copy karo

RUN composer install
        ↓
Laravel ki PHP dependencies install karo

--no-dev
        ↓
Development dependencies skip

--optimize-autoloader
        ↓
Production ke liye autoloader optimize

--no-interaction
        ↓
Composer ko user input ka wait na karne do

RUN useradd ...
        ↓
Non-root application user create karo

RUN chown ...
        ↓
Laravel ke writable folders ka owner
backend-app-user banao

USER backend-app-user
        ↓
Ab application non-root user ke under chalegi

EXPOSE 9000
        ↓
Container ka PHP-FPM FastCGI port 9000 hai

CMD ["php-fpm"]
        ↓
Container start hote hi PHP-FPM run karo


# Docker Build & Troubleshooting Documentation

## Overview

This document describes the Dockerization and troubleshooting process for the Laravel backend and React frontend of the Ecommerce application.

The application uses:

- Laravel / PHP 8.4
- PHP-FPM
- Nginx
- MySQL 8.4
- Redis
- React / Node.js 22
- Docker Compose
- Composer
- Docker BuildKit

The goal was to create a reproducible multi-container development environment and troubleshoot Docker image build failures.

---

# 1. Project Architecture

The application consists of multiple services managed through Docker Compose.

```text
                    Docker Compose
                         |
        +----------------+----------------+
        |                |                |
        v                v                v
      Nginx             API             MySQL
        |             Laravel             |
        |             PHP-FPM             |
        |                |                |
        +----------------+----------------+
                         |
                       Redis

---

# 2. Frontend Image — Multi-Stage Build Optimization

## Tech Stack (frontend image)

| Component     | Technology            |
|---------------|-----------------------|
| Framework     | React 19 + TypeScript |
| Bundler       | Vite 6                |
| Styling       | Tailwind CSS v4       |
| Language      | Node.js 22 (build)    |
| Web server    | Nginx (runtime)       |
| Base OS       | Alpine Linux          |
| Strategy      | Multi-stage build     |

## Results — Before vs After

| Metric               | Single-Stage (`1.0.1`) | Multi-Stage (`1.0.2`) | Improvement           |
|----------------------|------------------------|------------------------|-----------------------|
| Final image size     | **650 MB**             | **95.9 MB**            | **-554 MB (-85%)**    |
| node_modules shipped | Yes (~300+ MB)         | No                     | Removed at runtime    |
| Node.js in runtime   | Yes                    | No                     | Smaller attack surface|
| Build tools shipped  | Yes (npm, Vite, esbuild)| No                    | Only static assets    |
| Rebuild speed        | Slow (no cache)        | Fast (layer cache)     | Deps cached per lockfile|

Verified with `docker images`:

```text
REPOSITORY      TAG     SIZE
front-end-app   1.0.2   95.9MB   <- multi-stage build (current)
front-end-app   1.0.1   650MB    <- old single-stage build
```

## Why the Old Image Was 650 MB

The first version used a single `FROM node:22` stage:

- The **entire Node.js runtime** went into production even though it is only needed at build time.
- `node_modules` (dev + prod dependencies: Vite, esbuild, TypeScript, Tailwind) stayed inside the image.
- npm cache and build artifacts were baked into layers.
- The final container served static files but carried a full JS toolchain it never used.

A React app compiles down to **static HTML/CSS/JS** — shipping a compiler just to serve static files is wasted space and a bigger security surface.

## The Fix — Multi-Stage Dockerfile

```dockerfile
# =========================
# Stage 1 — Build
# =========================
FROM node:22-alpine AS builder

WORKDIR /front-end-app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

# =========================
# Stage 2 — Production
# =========================
FROM nginx:alpine

COPY --from=builder /front-end-app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### Line-by-Line Walkthrough

```text
FROM node:22-alpine AS builder
        ↓
Stage 1: full Node.js toolchain sirf BUILD ke liye.
Alpine variant (debian base se kaafi chhota).
"builder" naam se stage tag hota hai.

WORKDIR /front-end-app
        ↓
Build environment ki working directory.

COPY package*.json ./
        ↓
SIRF dependency manifests pehle copy hote hain —
ye layer-caching ka core trick hai (neeche detail).

RUN npm ci
        ↓
Lockfile ke exact versions se reproducible install.
(npm install ke bajaye npm ci = deterministic builds)

COPY . .
        ↓
Ab source code copy hota hai.

RUN npm run build
        ↓
Vite production bundle banata hai → /front-end-app/dist

FROM nginx:alpine
        ↓
Stage 2: FRESH, minimal runtime — Stage 1 ka sab kuch discard.
Node.js, npm, node_modules — kuch nahi jaata is stage me.

COPY --from=builder /front-end-app/dist /usr/share/nginx/html
        ↓
Sirf final static bundle copy hota hai builder stage se.
Yahi multi-stage ka faida: output le raha hun, garbage nahi.

EXPOSE 80
        ↓
Nginx ka standard HTTP port.

CMD ["nginx", "-g", "daemon off;"]
        ↓
Foreground process — container ka PID 1 nginx rehta hai.
```

## Layer Caching Strategy

Docker har instruction ko layer me cache karta hai. Instruction ka order matters:

```text
COPY package*.json ./     <- manifest change ho TABHI invalidate hota hai
RUN npm ci                <- warna ye CACHED rehta hai (sabse slow step)
COPY . .                  <- code change par SIRF ye aage chalta hai
RUN npm run build
```

- Code edit karne par `npm ci` **re-run hi nahi hota** — package files unchanged → cache hit.
- Builds went from "har baar poora npm install" to "seconds me rebuild".
- Ye pattern real-world CI/CD pipelines me standard hai (GitHub Actions / GitLab CI cache equivalent).

## .dockerignore — Build Context Slimming

`.dockerignore` build context se junk nikal deta hai — chhota context = faster upload + koi accidental leak nahi:

```text
node_modules        # host ka 300MB+ folder — image me jana hi nahi chahiye
dist                # purana build output — fresh build banega
.git                # repo history — image me leak risk
.gitignore
Dockerfile          # khud ko copy karne ki zaroorat nahi
docker-compose.yml
README.md
.env                # CRITICAL: secrets kabhi image me nahi jane chahiye
.env.*
npm-debug.log*
.vscode
.idea
coverage
```

Key points:

- `.env` / `.env.*` ignore = **secrets kabhi image layers me persist nahi hote** (security best practice).
- `node_modules` ignore = host OS-specific native binaries (esbuild/SWC) image me ghuskar build todte hain — wo bug bhi fix.
- Build context hundreds of MBs se few MBs tak gaya → `docker build` ka context-transfer step practically instant.

## Security & Production Notes

- **No Node in production:** runtime me koi JS runtime nahi = supply-chain attack surface kam.
- **nginx:alpine** (~20 MB base) battle-tested static file server; gzip/caching headers yahan tune hote hain.
- `USER nginx` line intentionally commented — abhi default config; hardening backlog me hai (non-root + port 8080 ke sath).
- Image size kam = faster registry push/pull = faster deploys aur K8s scheduling (kind cluster ready).

## Takeaway

> Multi-stage builds ka rule simple hai: **build-time dependencies Stage 1 me rahen, runtime sirf utna le jo chalane ke liye chahiye.**
> Ek React SPA ka production footprint sirf 95.9 MB hai — usme se zyada tar nginx alpine base hai.
