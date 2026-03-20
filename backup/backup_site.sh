#!/usr/bin/env bash
# Back up both the Drupal database and uploaded files.
# Run from the project root (where docker-compose.yaml lives).
#
# Usage:  ./backup/backup_site.sh [backup_dir]
#   backup_dir defaults to ./backup

set -euo pipefail

BACKUP_DIR="${1:-./backup}"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo "==> Dumping database..."
docker compose exec -T drupal drush sql-dump --gzip \
  > "$BACKUP_DIR/db-${TIMESTAMP}.sql.gz"

echo "==> Archiving uploaded files..."
docker compose exec -T drupal \
  tar czf - -C /opt/drupal/web/sites/default files \
  > "$BACKUP_DIR/files-${TIMESTAMP}.tar.gz"

echo "==> Archiving private files..."
docker compose exec -T drupal \
  tar czf - -C /var/www private \
  > "$BACKUP_DIR/private-${TIMESTAMP}.tar.gz"

echo ""
echo "Done. Backups in ${BACKUP_DIR}/:"
ls -lh "$BACKUP_DIR"/db-${TIMESTAMP}.sql.gz \
       "$BACKUP_DIR"/files-${TIMESTAMP}.tar.gz \
       "$BACKUP_DIR"/private-${TIMESTAMP}.tar.gz
