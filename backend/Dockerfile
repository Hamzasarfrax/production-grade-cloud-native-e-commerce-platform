# ============================================================
# Stage 1 — Composer dependencies
# ============================================================

FROM composer:2.8 AS vendor

WORKDIR /var/www/html

COPY composer.json composer.lock ./

RUN composer install \
    --no-dev \
    --no-interaction \
    --no-progress \
    --prefer-dist \
    --optimize-autoloader \
    --no-scripts


# ============================================================
# Stage 2 — Build PHP extensions
# ============================================================

FROM php:8.3-fpm-bookworm AS builder

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        libzip-dev \
        libpng-dev \
        libonig-dev \
    && docker-php-ext-install \
        pdo_mysql \
        zip \
        gd \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /var/www/html

COPY --from=vendor /var/www/html/vendor ./vendor

COPY . .

RUN composer dump-autoload \
    --optimize \
    --classmap-authoritative \
    --no-scripts


# ============================================================
# Stage 3 — Production
# ============================================================

FROM php:8.3-fpm-bookworm AS production

WORKDIR /var/www/html

# Copy PHP extensions and application
COPY --from=builder /usr/local/lib/php/extensions/ /usr/local/lib/php/extensions/
COPY --from=builder /usr/local/etc/php/conf.d/ /usr/local/etc/php/conf.d/

COPY --from=builder /var/www/html /var/www/html

# Laravel permissions
RUN chown -R www-data:www-data \
        storage \
        bootstrap/cache \
    && chmod -R 775 \
        storage \
        bootstrap/cache

USER www-data

EXPOSE 9000

CMD ["php-fpm", "-F"]
