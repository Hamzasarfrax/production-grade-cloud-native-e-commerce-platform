# the base image debian based
FROM php:8.4-fpm-bookworm

# PHP extensions amd  OS packages

RUN apt-get update && apt-get install -y \
    git \
    curl \
    unzip \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    && rm -rf /var/lib/apt/lists/*

# things that need laravel to run apllictaions

RUN docker-php-ext-install \
    pdo_mysql \
    mbstring \
    exif \
    pcntl \
    bcmath \
    gd

# Composer install karne ke bajaye Composer ki official image se executable utha rahe hain

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# create user
RUN useradd -m -u 1000 backend-app-user

# make directory to copy the curent-context-host
WORKDIR /backend-app

# copy data

COPY . /backend-app/

# install the dependencies

RUN composer install \
    --no-dev \
    --optimize-autoloader \
    --no-interaction

# recursively changes the ownership of Laravel's writable directories to the www-data user and group

RUN chown -R backend-app-user:backend-app-user \
    storage \
    bootstrap/cache

# conatiner kay sary process through  backend-app-user chaly gay ab
USER backend-app-user

# PHP-FPM commonly FastCGI ke liye port 9000 use karta hai.

EXPOSE 9000

# after conatiner start/run it will run

CMD ["php-fpm"]
