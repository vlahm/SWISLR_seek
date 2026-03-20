#!/usr/bin/env bash
# Back up both the Drupal database and uploaded files.
# Run from the project root (where docker-compose.yaml lives).
#
# Usage:  ./backup/backup_site.sh [backup_dir]
#   backup_dir defaults to ./backup

set -euo pipefail

# Resolve project root (one level up from this script's directory)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKUP_DIR="${1:-$SCRIPT_DIR}"
cd "$PROJECT_ROOT"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo "==> Dumping database..."
docker compose exec -T drupal drush sql-dump --gzip \
  > "$BACKUP_DIR/db-${TIMESTAMP}.sql.gz"

echo "==> Archiving uploaded files..."
if docker compose exec -T drupal test -d /opt/drupal/web/sites/default/files; then
  docker compose exec -T drupal \
    tar czf - -C /opt/drupal/web/sites/default files \
    > "$BACKUP_DIR/files-${TIMESTAMP}.tar.gz"
else
  echo "    (skipped — files directory not found)"
fi

echo "==> Archiving private files..."
if docker compose exec -T drupal test -d /var/www/private; then
  docker compose exec -T drupal \
    tar czf - -C /var/www private \
    > "$BACKUP_DIR/private-${TIMESTAMP}.tar.gz"
else
  echo "    (skipped — private directory not found)"
fi

echo ""
echo "Done. Backups in ${BACKUP_DIR}/:"
ls -lh "$BACKUP_DIR"/*-${TIMESTAMP}.* 2>/dev/null || echo "  (no files found)"
