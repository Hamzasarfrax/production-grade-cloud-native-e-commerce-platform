# API microservice — Laravel 13 + MySQL
# Build: docker compose build api
FROM php:8.3-cli

RUN apt-get update \
    && apt-get install -y --no-install-recommends git unzip libzip-dev libpng-dev libonig-dev \
    && docker-php-ext-install pdo_mysql zip gd \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www

COPY . .

RUN composer install --no-interaction --prefer-dist --no-scripts \
    && composer dump-autoload --optimize

RUN cp .env.example .env \
    && php -r "file_exists('database/database.sqlite') || touch('database/database.sqlite');" \
    && php artisan key:generate

RUN chmod -R 777 storage bootstrap/cache

EXPOSE 8000

CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]
