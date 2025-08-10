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
#RUN curl -OL https://github.com/drush-ops/drush/releases/latest/download/drush.phar \
#  && chmod +x drush.phar \
#  && mv drush.phar /usr/local/bin/drush

# Misc
COPY bashrc /root/.bashrc
COPY post_install_steps.sh /opt/drupal/
COPY composer.json /opt/drupal/
RUN composer update --no-interaction
#RUN composer update --no-interaction #use this for deploy
#ENV PATH="/opt/vendor/bin:${PATH}"

# Install Composer dependencies early to leverage caching
RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer \
&& composer install --prefer-dist --no-dev --no-interaction

RUN chown -R www-data:www-data web/modules/contrib && chmod -R u+w web/modules/contrib
