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
# Stage 2 — Production
# ============================================================

FROM php:8.3-fpm-bookworm

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        libzip-dev \
        libpng-dev \
        libonig-dev \
    && docker-php-ext-install \
        pdo_mysql \
        zip \
        gd \
    && docker-php-ext-enable opcache \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /var/www/html

# Composer binary bhi le lo — dump-autoload neeche chalana hai (fpm image me hota nahi)
COPY --from=vendor /usr/bin/composer /usr/bin/composer
COPY --from=vendor /var/www/html/vendor ./vendor

COPY . .

# Stale package caches clear (Pail/Fortify "not found" class errors ka ilaaj —
# Laravel inhe zaroorat par khud regenerate karta hai)
RUN rm -f bootstrap/cache/packages.php bootstrap/cache/services.php

RUN composer dump-autoload \
        --optimize \
        --classmap-authoritative \
        --no-scripts

RUN chown -R www-data:www-data \
        storage \
        bootstrap/cache \
    && chmod -R 775 \
        storage \
        bootstrap/cache

# Auto-setup entrypoint: DB wait + migrate + conditional seed, phir CMD exec
# (root ke dauran — www-data /usr/local/bin me chmod nahi kar sakta)
COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh
ENTRYPOINT ["entrypoint.sh"]

USER www-data

EXPOSE 9000

CMD ["php-fpm", "-F"]
