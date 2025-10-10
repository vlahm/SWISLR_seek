#!/bin/bash
set -e

drush en -y admin_toolbar admin_toolbar_tools
drush en -y content_moderation
drush en -y geofield geofield_map geocoder
drush en -y token pathauto
drush en -y entity_reference_revisions
drush en -y webform
drush en -y honeypot
drush en -y smtp
drush en -y email_registration
drush en -y leaflet block_class
drush en -y leaflet_views
drush en -y leaflet_markercluster
drush en -y user_register_notify
drush en -y swislr_homepage
drush en -y name
drush en -y auto_entitylabel
drush en -y orcid
drush en -y date_popup
drush en -y views_geojson
drush en -y content_moderation_notifications
drush en -y symfony_mailer
drush en -y swislr_story
drush en -y swislr_invites
drush en -y swislr_attach_theme_css
drush en -y swislr_comment_spice
drush en -y swislr_datasets


# Fix private file warning
mkdir -p /opt/drupal_private
chown www-data:www-data /opt/drupal_private
chmod 700 /opt/drupal_private

drush cr

