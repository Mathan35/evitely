# Evitely — staging container (Render free / Railway / Docker)
FROM php:8.3-cli-bookworm

ENV DEBIAN_FRONTEND=noninteractive \
    COMPOSER_ALLOW_SUPERUSER=1 \
    NODE_VERSION=22

RUN apt-get update && apt-get install -y --no-install-recommends \
        git unzip curl ca-certificates openssl \
        libzip-dev libpng-dev libjpeg62-turbo-dev libfreetype6-dev \
        libicu-dev libonig-dev libxml2-dev libpq-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) \
        pdo_mysql pdo_pgsql mbstring exif pcntl bcmath gd zip intl opcache \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

RUN curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY composer.json composer.lock ./
RUN composer install \
    --no-dev \
    --no-scripts \
    --no-interaction \
    --prefer-dist \
    --optimize-autoloader

COPY package.json package-lock.json ./
RUN npm ci --include=dev

COPY . .

RUN composer dump-autoload --optimize \
    && php artisan package:discover --ansi \
    && mkdir -p storage/framework/{cache,sessions,views} storage/logs bootstrap/cache \
    && php artisan wayfinder:generate --with-form || true \
    && npm run build \
    && rm -rf node_modules \
    && sed -i 's/\r$//' scripts/container-start.sh scripts/railway-start.sh \
    && chmod +x scripts/container-start.sh scripts/railway-start.sh

ENV APP_ENV=staging \
    APP_DEBUG=true \
    LOG_CHANNEL=stderr \
    LOG_LEVEL=debug \
    QUEUE_CONNECTION=sync \
    SESSION_DRIVER=database \
    CACHE_STORE=database \
    FILESYSTEM_DISK=local \
    INVITE_SUBDOMAINS_ENABLED=false \
    DB_CONNECTION=pgsql

EXPOSE 8000

CMD ["bash", "scripts/container-start.sh"]
