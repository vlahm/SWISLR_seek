FROM drupal:10-apache

# Install system tools
RUN apt-get update && apt-get install -y \
  vim \
  unzip \
  curl \
  git \
  && rm -rf /var/lib/apt/lists/*

# Install Drush (global, not project-local)
RUN curl -OL https://github.com/drush-ops/drush/releases/latest/download/drush.phar \
  && chmod +x drush.phar \
  && mv drush.phar /usr/local/bin/drush

# Set up default bashrc
COPY bashrc /root/.bashrc

