#!/bin/bash
set -e

drush en -y admin_toolbar admin_toolbar_tools
drush en -y content_moderation
drush en -y geofield geofield_map geocoder
drush en -y token pathauto
drush en -y entity_reference_revisions
drush en -y webform
drush en -y smtp
drush en -y honeypot
drush en -y email_registration
drush en -y leaflet block_class
drush en -y user_register_notify

# Fix private file warning
mkdir -p /opt/drupal_private
chown www-data:www-data /opt/drupal_private
chmod 700 /opt/drupal_private

drush cr

