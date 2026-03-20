#!/usr/bin/env bash
# Back up both the Drupal database and uploaded files.
# Run from the project root (where docker-compose.yaml lives).
#
# Usage:  ./backup/backup_site.sh [backup_dir]
#   backup_dir defaults to ./backup

set -uo pipefail

# Resolve project root (one level up from this script's directory)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKUP_DIR="${1:-$SCRIPT_DIR/full_dump}"
cd "$PROJECT_ROOT"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo "==> Dumping database..."
if ! docker compose exec -T drupal drush sql-dump 2>"$BACKUP_DIR/db-err-${TIMESTAMP}.log" \
  | gzip > "$BACKUP_DIR/db-${TIMESTAMP}.sql.gz"; then
  echo "    ERROR: database dump failed. See $BACKUP_DIR/db-err-${TIMESTAMP}.log"
  cat "$BACKUP_DIR/db-err-${TIMESTAMP}.log"
fi

echo "==> Archiving uploaded files..."
if docker compose exec -T drupal test -d /opt/drupal/web/sites/default/files; then
  if ! docker compose exec -T drupal \
    tar czf - -C /opt/drupal/web/sites/default files \
    > "$BACKUP_DIR/files-${TIMESTAMP}.tar.gz" 2>"$BACKUP_DIR/files-err-${TIMESTAMP}.log"; then
    echo "    ERROR: files archive failed. See $BACKUP_DIR/files-err-${TIMESTAMP}.log"
    cat "$BACKUP_DIR/files-err-${TIMESTAMP}.log"
  fi
else
  echo "    (skipped — files directory not found)"
fi

echo "==> Archiving private files..."
if docker compose exec -T drupal test -d /var/www/private; then
  if ! docker compose exec -T drupal \
    tar czf - -C /var/www private \
    > "$BACKUP_DIR/private-${TIMESTAMP}.tar.gz" 2>"$BACKUP_DIR/private-err-${TIMESTAMP}.log"; then
    echo "    ERROR: private files archive failed. See $BACKUP_DIR/private-err-${TIMESTAMP}.log"
    cat "$BACKUP_DIR/private-err-${TIMESTAMP}.log"
  fi
else
  echo "    (skipped — private directory not found)"
fi

echo ""
echo "Done. Backups in ${BACKUP_DIR}/:"
ls -lh "$BACKUP_DIR"/*-${TIMESTAMP}.* 2>/dev/null || echo "  (no files found)"
