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
