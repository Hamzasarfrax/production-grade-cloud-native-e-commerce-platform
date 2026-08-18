# Use the official PHP 8.4 PHP-FPM image based on Debian Bookworm
FROM php:8.4-fpm-bookworm


# Install required Linux packages and libraries for Laravel/PHP
RUN apt-get update && apt-get install -y \
    # Git is used for Composer dependencies and application packages
    git \
    # Curl is used for making HTTP requests and downloading resources
    curl \
    # Unzip is required for extracting ZIP archives
    unzip \
    # PNG development library required by the GD PHP extension
    libpng-dev \
    # Library required by the PHP mbstring extension
    libonig-dev \
    # XML development library required by PHP XML-related functionality
    libxml2-dev \
    # Library required for the PHP ZIP extension
    libzip-dev \
    # Development library required for JPEG image support
    libjpeg62-turbo-dev \
    # FreeType development library for font rendering support
    libfreetype6-dev \
    # Configure the GD extension with FreeType and JPEG support
    && docker-php-ext-configure gd \
        --with-freetype \
        --with-jpeg \
    # Install the required PHP extensions
    # -j$(nproc) uses available CPU cores to speed up compilation
    && docker-php-ext-install -j$(nproc) \
        # Enables Laravel/PHP to connect to MySQL databases
        pdo_mysql \
        # Provides support for multibyte strings such as UTF-8
        mbstring \
        # Enables reading and writing EXIF metadata from images
        exif \
        # Provides process control functions
        pcntl \
        # Provides high-precision mathematical calculations
        bcmath \
        # Provides image processing capabilities
        gd \
        # Provides ZIP file support
        zip \
    # Remove APT package lists to reduce the final image size
    && rm -rf /var/lib/apt/lists/*


# Copy the Composer executable from the official Composer image
# This avoids manually downloading and installing Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer


# Create a non-root user for running the Laravel application
# UID 1000 can help avoid file permission issues when working with the host
RUN useradd -m -u 1000 backend-app-user


# Set the working directory for the Laravel application inside the container
WORKDIR /backend-app


# Copy only the Composer dependency files first
# This allows Docker to reuse the Composer installation layer from its cache
COPY composer.json composer.lock ./


# Install Laravel's PHP dependencies
RUN composer install \
    # Install production dependencies only; exclude development packages
    --no-dev \
    # Disable interactive prompts during installation
    --no-interaction \
    # Disable unnecessary progress output
    --no-progress \
    # Generate an optimized Composer autoloader for production
    --optimize-autoloader


# Copy the rest of the Laravel application source code into the container
COPY . .


# Change ownership of Laravel's writable directories to the application user
# Laravel needs write access to storage and bootstrap/cache
RUN chown -R backend-app-user:backend-app-user \
    storage \
    bootstrap/cache


# Run the application as the non-root user instead of root
# This is an important security practice for production containers
USER backend-app-user


# Document that PHP-FPM listens on FastCGI port 9000
# This is not an HTTP port; Nginx normally communicates with PHP-FPM through this port
EXPOSE 9000


# Start PHP-FPM when the container starts
# -F runs PHP-FPM in the foreground, which is appropriate for Docker
CMD ["php-fpm", "-F"]
