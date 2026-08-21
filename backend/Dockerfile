# API microservice — Laravel 13 + MySQL (PHP-FPM, nginx isse FastCGI :9000 se baat karta hai)
# Build: docker compose build backend-app
FROM php:8.3-fpm

RUN apt-get update \
    && apt-get install -y --no-install-recommends git unzip libzip-dev libpng-dev libonig-dev \
    && docker-php-ext-install pdo_mysql zip gd \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2.8 /usr/bin/composer /usr/bin/composer

# Canonical app path: /var/www/html — nginx conf (root /var/www/html/public)
# aur compose mount (./backend:/var/www/html) isi se match karte hain.
WORKDIR /var/www/html

COPY . .

RUN composer install --no-interaction --prefer-dist --no-scripts \
    && composer dump-autoload --optimize

RUN cp .env.example .env \
    && php artisan key:generate

RUN chmod -R 777 storage bootstrap/cache

EXPOSE 9000

CMD ["php-fpm"]
