FROM php:8.2-fpm

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libicu-dev \
    libfreetype6-dev \
    libjpeg62-turbo-dev \
    libpng-dev \
    libxml2-dev \
    libzip-dev \
    libonig-dev \
    liblua5.1-0-dev \
    unzip \
    git \
    wget \
    imagemagick \
    python3 \
    lua5.1 \
    && rm -rf /var/lib/apt/lists/*

# Install PHP extensions needed by MediaWiki 1.43
RUN docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) \
        mysqli \
        pdo_mysql \
        intl \
        gd \
        opcache \
        mbstring \
        xml \
        zip \
        calendar

# Install APCu
RUN pecl install apcu && docker-php-ext-enable apcu

# PHP configuration for MediaWiki
RUN echo "opcache.enable=1" >> /usr/local/etc/php/conf.d/mediawiki.ini \
    && echo "opcache.memory_consumption=256" >> /usr/local/etc/php/conf.d/mediawiki.ini \
    && echo "opcache.max_accelerated_files=10000" >> /usr/local/etc/php/conf.d/mediawiki.ini \
    && echo "upload_max_filesize = 100M" >> /usr/local/etc/php/conf.d/mediawiki.ini \
    && echo "post_max_size = 100M" >> /usr/local/etc/php/conf.d/mediawiki.ini \
    && echo "memory_limit = 512M" >> /usr/local/etc/php/conf.d/mediawiki.ini \
    && echo "max_execution_time = 300" >> /usr/local/etc/php/conf.d/mediawiki.ini \
    && echo "apc.enable_cli=1" >> /usr/local/etc/php/conf.d/mediawiki.ini

# Download MediaWiki 1.43 LTS
WORKDIR /var/www/html
RUN wget -q https://releases.wikimedia.org/mediawiki/1.43/mediawiki-1.43.0.tar.gz \
    && tar xzf mediawiki-1.43.0.tar.gz \
    && mv mediawiki-1.43.0 w \
    && rm mediawiki-1.43.0.tar.gz

# Install Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Install SMW via Composer
WORKDIR /var/www/html/w
RUN echo '{ "require": { "mediawiki/semantic-media-wiki": "~5.0" } }' > composer.local.json \
    && COMPOSER_ALLOW_SUPERUSER=1 composer config --no-plugins audit.block-insecure false \
    && COMPOSER_ALLOW_SUPERUSER=1 composer update --no-dev --no-interaction

# Fix ownership
RUN chown -R www-data:www-data /var/www/html/w

WORKDIR /var/www/html
