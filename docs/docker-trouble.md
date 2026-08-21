# Docker Troubleshooting — Full Stack Compose Incident (2026-08-21)

> Ye doc root `docker-compose.yml` (full stack: frontend + backend-nginx + FPM + mysql)
> ke pehle run par aaye saare errors, unki wajah, aur fix ka complete record hai.
> Related: `docs/troubleshooting.md` (purane backend/docker-compose.yml ke issues),
> `docs/docker.md` (architecture overview).

## Context

Root `docker-compose.yml` se pehli baar poora stack uThaya:
`front-end-app (:3000)` → `backend-nginx (:8000→80)` → `backend-app (FPM :9000)` → `mysql (:3306)`

---

## Symptoms (jo errors dikhe)

**Run 1** — nginx container start hi nahi hua:

```
error mounting ".../Ecomerce/docker/nginx/backend.conf" to rootfs
at "/etc/nginx/conf.d/default.conf": ... not a directory:
Are you trying to mount a directory onto a file (or vice-versa)?
```

**Run 2** (conf path edit karne ke baad) — MySQL crash:

```
[ERROR] [MY-012960] [InnoDB] Cannot create redo log files because data files
are corrupt or the database was not shut down cleanly after creating the data files.
[ERROR] [MY-010119] [Server] Aborting
```

**Run 3** (volume reset ke baad) — API par 404 "File not found":

```
curl http://localhost:8000/api/products  →  404, body: "File not found."
FPM log: "GET /index.php" 404
```

---

## Root Causes (5 issues mile) + Fixes

### RC1: nginx conf bind-mount ki file exist nahi karti thi

- **Kya tha:** Compose me mount tha `./backend/docker/nginx/backend.conf`, lekin asli
  file ka naam `backend/docker/nginx/default.conf` hai. `backend.conf` kabhi bana hi nahi tha.
- **Kyun ye error:** Jab bind-mount source file host par missing hoti hai, Docker us
  naam ki **directory** auto-create kar deta hai, phir us directory ko container ki
  **file** (`/etc/nginx/conf.d/default.conf`) par mount nahi kar sakta → "not a directory".
- **Saboot:** Root par stray khaali folder ban gaya tha: `docker/nginx/backend.conf/`
- **Fix:**
  - Compose mount path correct kiya → `./backend/docker/nginx/default.conf:/etc/nginx/conf.d/default.conf:ro`
  - Stray directory delete ki (`rmdir docker/nginx/backend.conf`)
- **Lesson:** Bind-mount source **file** hamesha pehle exist karni chahiye. Missing
  source ka error misleading hota hai ("directory onto a file") — asli wajah typo/missing path hoti hai.

### RC2: MySQL volume corrupt (interrupted initialization)

- **Kya tha:** Run 1 me MySQL ne datadir initialize karna shuru kiya, lekin nginx fail
  hone se poora stack ruk gaya → init adhoora reh gaya. Volume `ecomerce_mysql_data`
  ke andar half-written data files reh gaye.
- **Fix:** Fresh volume:
  ```bash
  docker compose down -v        # network + named volume dono remove
  docker compose up -d --build
  ```
- **Lesson:** Pehli MySQL init ko kabhi beech me na roko. Agar init interrupt ho jaye,
  volume delete karke fresh init hi lo — repair karne ki koshish mat karo.

### RC3: DB name/user mismatch (MySQL vs Laravel)

- **Kya tha:** Root `.env` me `MYSQL_DATABASE=ecommerce` / `MYSQL_USER=ecommerce_user`,
  lekin `backend/.env` (Laravel) expect karta tha `cloud-native` / `cloud-native`.
  MySQL alag db banata, Laravel alag dhoondta → access denied hota.
- **Fix:** Root `.env` ko backend/.env se match kar diya:
  ```
  DB_DATABASE=cloud-native
  DB_USERNAME=cloud-native
  DB_PASSWORD=cloud-native
  DB_ROOT_PASSWORD=cloud-native
  ```
  Aur compose me hardcode hata kar variables use kiye: `MYSQL_DATABASE: ${DB_DATABASE}`, etc.
- **Lesson:** DB credentials ka **single source of truth** = `backend/.env`. Root `.env`
  sirf usi ko mirror karta hai. Hardcoded names do jagah kabhi mat rakho.

### RC4: Backend image me PHP-FPM tha hi nahi

- **Kya tha:** `backend/Dockerfile` base `php:8.3-cli` + CMD `php artisan serve :8000`.
  Lekin compose ka `backend-nginx` FastCGI (`fastcgi_pass backend-app:9000`) se baat
  karta hai — `-cli` variant me `php-fpm` binary hota hi nahi.
- **Fix (Dockerfile):**
  ```dockerfile
  FROM php:8.3-fpm      # cli → fpm
  ...
  EXPOSE 9000           # 8000 → 9000
  CMD ["php-fpm"]       # artisan serve → fpm
  ```
  (`php:8.3-fpm` me CLI bhi hota hai, to `php artisan key:generate` build me ab bhi chalta hai.)
- **Lesson:** nginx + FastCGI stack = FPM image zaroori. Artisan serve sirf dev/local
  ke liye hai, production pattern nahi.

### RC5: "File not found" 404 — SCRIPT_FILENAME path mismatch

- **Kya tha:** nginx conf `root /var/www/html/public` se `SCRIPT_FILENAME=/var/www/html/public/index.php`
  bhejta tha, lekin FPM container me code `/var/www` par tha (Dockerfile `WORKDIR /var/www`).
  FPM ko us path par file mili nahi → 404 "File not found." (ye Laravel ka 404 nahi,
  PHP-FPM ka hai).
- **Fix:** Canonical path rule — **ek hi path har jagah**:
  - Dockerfile: `WORKDIR /var/www/html`
  - nginx conf: `root /var/www/html/public;` + `fastcgi_pass backend-app:9000;`
  - compose (nginx): `./backend:/var/www/html`
- **Lesson:** nginx jo SCRIPT_FILENAME bhejta hai wo **FPM container ke andar** valid
  hona chahiye (nginx apna filesystem dekhta hai, FPM apna). Dono containers ka app
  path identical rakho.

---

## Files Changed (summary)

| File | Change |
|---|---|
| `backend/Dockerfile` | Base `php:8.3-cli` → `php:8.3-fpm`; `WORKDIR /var/www/html`; sqlite touch line removed; `EXPOSE 9000`; `CMD ["php-fpm"]` |
| `backend/docker/nginx/default.conf` | `root /backend-app/public` → `/var/www/html/public`; `fastcgi_pass app:9000` → `backend-app:9000` |
| `docker-compose.yml` | nginx conf mount path fix (`default.conf`); front-end-app me `BACKEND_URL: http://backend-nginx:80` env; backend-app me `depends_on: mysql`; mysql env `${DB_DATABASE}`/`${DB_USERNAME}` |
| `.env` (root) | `DB_DATABASE=cloud-native`, `DB_USERNAME=cloud-native` (backend/.env se match) |
| `docker/nginx/backend.conf/` | **REMOVED** — Docker ne auto-create ki thi (stray empty dir), `docker/nginx/` bhi ab deleted |

## Fix Sequence (commands)

> **Update:** Ab ye sab manual nahi karna padta — `backend/docker/entrypoint.sh`
> (DB wait + migrate + conditional seed) aur mysql healthcheck ki wajah se sirf
> `docker compose up -d --build` kafi hai. Neeche wale steps sirf emergency/manual
> recovery ke liye hain.

```bash
docker compose config --quiet          # syntax validate
docker compose down -v --remove-orphans  # corrupt volume + purane containers remove
docker compose up -d --build           # fresh build + start
docker compose exec backend-app php artisan migrate --seed --force   # tables + seed data
```

## Verification (2026-08-21 live tested)

```text
GET :8000/api/products  → HTTP 200   (nginx → FPM → MySQL chain OK)
GET :3000/api/orders    → HTTP 200   (frontend same-origin proxy OK)
GET :3000/api/stats     → {"ok":true,"data":{...real KPIs...}}
```

## Best Practices Checklist (dobara na ho, iske liye)

1. **Bind-mount file pehle check karo** — missing file par Docker chupke se directory
   bana deta hai. `ls -la` se confirm karo mount source file hai, dir nahi.
2. **Canonical app path** — Dockerfile WORKDIR, nginx root, compose mounts teeno ek hi
   path (`/var/www/html`) par. Path drift = "File not found".
3. **DB credentials single source of truth** — `backend/.env`; root `.env` mirror hai.
4. **Fresh volume for fresh init** — MySQL pehli baar start ho rahi ho to `down -v` se
   shuru karo; interrupted init ka volume corrupt hota hai.
5. **Same-origin proxy pattern** — frontend relative `/api` call karta hai, uska nginx
   `BACKEND_URL` env se backend tak pohanchata hai. No CORS, no hardcoded domains;
   K8s ingress me bhi yehi pattern chalega.
6. **Error layer se pehchano:**
   - `not a directory` (mount) → host path missing/galat type
   - `Cannot create redo log` (mysql) → corrupt volume, reset karo
   - `File not found.` plain text (404) → FPM ko SCRIPT_FILENAME nahi mila (path mismatch)
   - HTML 404 nginx page → request Laravel tak pahunchi hi nahi
   - JSON `{"message":"..."}` 404 → Laravel route nahi mila (routes check karo)
