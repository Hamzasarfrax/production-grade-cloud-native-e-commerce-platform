# Troubleshooting — Mxmobilz

> Root full-stack compose ke Docker issues (2026-08-21): `docker-trouble.md` dekho.

## Issue: `Class "Laravel\Pail\PailServiceProvider" not found` (php artisan serve)

Wajah: `bootstrap/cache/packages.php` + `services.php` stale caches (purane starter kit ke
providers reference karte thay — Pail/Fortify/Inertia), jabke packages installed nahi thay.

Fix:
```bash
# backend folder me:
rm bootstrap/cache/packages.php bootstrap/cache/services.php
composer install        # vendor ko naye composer.lock se sync karta hai
```
Note: Laravel ye files khud regenerate kar leta hai — delete karna safe hai.
Windows local serve ke liye `.env` me `DB_HOST=127.0.0.1` karo (Docker me `mysql` rehne do).

## Issue: Backend image build ho gaya par app run nahi ho rahi

Symptom: `docker ps` mein `backend-app` (backend-app:1.0.0) chal raha hai par
`http://localhost:8080` par nginx ki default "Welcome to nginx!" page aati hai,
ya `/api/*` par 500 error aata hai.

### Root Causes (3 issues mile)

1. **Nginx custom config mount nahi tha**
   - File misspelled thi: `backend/docker/nginx/deafult.conf` (typo, sahi naam `default.conf`).
   - `backend/docker-compose.yml` mein volume mount commented out tha (line ~47).
   - Fix: file rename kiya + mount uncomment kiya.
   - File: `backend/docker-compose.yml` → `backend/docker/nginx/default.conf`

2. **Database tables nahi thi (migrate kabhi nahi chala)**
   - `app_mysql` container mein sirf database bana tha, tables empty.
   - Fix: `docker exec backend-app php artisan migrate --force` chalaaya.

3. **Model table name mismatch**
   - Migration `inquiries` table banata hai par model `CustomerInquiry` default `customer_inquiries` dhoond raha tha.
   - Migration `promos` table banata hai par model `PromoCode` default `promo_codes` dhoond raha tha.
   - Fix: models mein `protected $table` explicitly set kiya.
   - Files:
     - `backend/app/Models/CustomerInquiry.php` → `protected $table = 'inquiries';`
     - `backend/app/Models/PromoCode.php` → `protected $table = 'promos';`

### Verify

```bash
docker ps                     # backend-app, backend-app-nginx, app_mysql up hone chahiye
curl http://localhost:8080/api/products   # {"ok":true,...}
curl http://localhost:8080/api/orders
curl http://localhost:8080/api/inquiries
curl http://localhost:8080/api/promos
curl http://localhost:8080/api/stats
```

Sab endpoints `200` aane chahiye.

### Commands used (fix ke liye)

```bash
# 1. nginx config file rename (directory conflict tha)
mv backend/docker/nginx/deafult.conf backend/docker/nginx/default.conf

# 2. backend/docker-compose.yml mein mount uncomment karo:
#    ./docker/nginx/default.conf:/etc/nginx/conf.d/default.conf:ro

# 3. containers recreate
docker compose up -d --build

# 4. migrations chalao (image rebuild ke baad bhi dobarah chala sakte ho, idempotent hai)
docker exec backend-app php artisan migrate --force

# 5. seed data (optional, admin panel ke liye)
docker exec backend-app php artisan db:seed --force

# 6. agar code edit kiya hai to image rebuild karo (running container mein baked code hota hai)
docker compose up -d --build app

# 7. nginx config change ke baad:
docker restart backend-app-nginx
```

### Important Notes

- `backend/docker-compose.yml` app container mein source mount nahi hai — code image mein baked hai. Koi bhi backend code change karne par `docker compose up -d --build app` chalao.
- Nginx container `./` (backend folder) ko `/backend-app` par mount karta hai (`ro`), isliye nginx `root /backend-app/public` serve karta hai (see `backend/docker/nginx/default.conf`).
- PHP-FPM container port 9000 expose karta hai (HTTP nahi) — nginx usi par `fastcgi_pass app:9000` bhejta hai.

## Related Docs

- [Architecture](docs/architecture.md)
- [Docker Setup](docs/docker.md)
- [Deployment](docs/deployment.md)
- [Runbook](docs/runbook.md)
- [Security](docs/security.md)
- [Disaster Recovery](docs/disaster-recovery.md)