#!/bin/sh
# Backend container entrypoint — auto-setup on every start:
#   1. DB ready hone ka intezar
#   2. migrate --force (idempotent — har bar safe)
#   3. db:seed SIRF fresh/empty DB par (duplicate seeding se bachao)
#   4. phir php-fpm (CMD) ko exec
set -e

echo "[entrypoint] Waiting for database ${DB_HOST}:${DB_PORT:-3306}..."
until php -r 'new PDO("mysql:host=".getenv("DB_HOST").";port=".(getenv("DB_PORT") ?: 3306), getenv("DB_USERNAME"), getenv("DB_PASSWORD"));' >/dev/null 2>&1; do
  sleep 2
done
echo "[entrypoint] Database reachable."

php artisan migrate --force

PRODUCTS=$(php -r '$pdo=new PDO("mysql:host=".getenv("DB_HOST").";dbname=".getenv("DB_DATABASE"), getenv("DB_USERNAME"), getenv("DB_PASSWORD")); echo $pdo->query("SELECT COUNT(*) FROM products")->fetchColumn();' 2>/dev/null || echo 0)
if [ "$PRODUCTS" = "0" ]; then
  echo "[entrypoint] Empty DB — seeding..."
  php artisan db:seed --force
else
  echo "[entrypoint] Data already present ($PRODUCTS products) — skipping seed."
fi

exec "$@"
