FROM drupal:10-apache

# Install system tools
RUN apt-get update && apt-get install -y \
  vim \
  unzip \
  curl \
  git \
#  mariadb-client \
  && rm -rf /var/lib/apt/lists/*

# Install Drush (global, not project-local)
#RUN curl -L https://github.com/drush-ops/drush-launcher/releases/latest/download/drush.phar \
#     -o /usr/local/bin/drush \
# && chmod +x /usr/local/bin/drush
#COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
# Drush launcher (no Composer project required)
RUN curl -L https://github.com/drush-ops/drush-launcher/releases/latest/download/drush.phar -o /usr/local/bin/drush \
 && chmod +x /usr/local/bin/drush

# Install global Drush and symlink to PATH
#RUN composer global require drush/drush:^13 --no-interaction --no-progress \
# && ln -s /root/.composer/vendor/bin/drush /usr/local/bin/drush

# Misc
COPY bashrc /root/.bashrc
COPY post_install_steps.sh /opt/drupal/
COPY composer.json /opt/drupal/
COPY misc_config/uploads.ini /usr/local/etc/php/conf.d/uploads.ini
#ENV PATH="/opt/vendor/bin:${PATH}"

# Install Composer dependencies early to leverage caching
#COPY composer.json composer.lock /var/www/html/
#RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer \
#&& composer install --prefer-dist --no-dev --no-interaction

#RUN composer update --no-interaction #for deploy only?

# ---- NEW: bake app code into the image (safe for dev; mounts override) ----
# Your repo layout: vendor/ and web/ at repo root.
# If you keep custom code outside web/ (you do), copy it in too.
COPY web/ /var/www/html/
COPY vendor/ /var/www/vendor/
COPY modules/custom/ /var/www/html/modules/custom/
COPY themes/custom/ /var/www/html/themes/custom/

# Files/permissions
#probably not necessary:
RUN chown -R www-data:www-data web/modules/contrib && chmod -R u+w web/modules/contrib
#necessary:
RUN mkdir -p /var/www/private \
 && chown -R www-data:www-data /var/www/html /var/www/private /var/www/vendor \
 && if [ -d /var/www/html/modules/contrib ]; then chmod -R u+w /var/www/html/modules/contrib; fi
