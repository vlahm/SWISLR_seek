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
docker compose exec -T drupal drush sql-dump \
  > "$BACKUP_DIR/db-${TIMESTAMP}.sql" \
  2>"$BACKUP_DIR/db-err-${TIMESTAMP}.log"
DB_EXIT=$?
if [ $DB_EXIT -ne 0 ] || [ ! -s "$BACKUP_DIR/db-${TIMESTAMP}.sql" ]; then
  echo "    ERROR: database dump failed (exit=$DB_EXIT, size=$(stat -c%s "$BACKUP_DIR/db-${TIMESTAMP}.sql" 2>/dev/null || echo 0))."
  echo "    stderr log:"
  cat "$BACKUP_DIR/db-err-${TIMESTAMP}.log"
  echo "    First 5 lines of output:"
  head -5 "$BACKUP_DIR/db-${TIMESTAMP}.sql"
  echo ""
  echo "    Trying alternative: mysqldump directly..."
  docker compose exec -T drupal bash -c \
    'mysqldump -h db -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE"' \
    > "$BACKUP_DIR/db-${TIMESTAMP}.sql" \
    2>"$BACKUP_DIR/db-err-${TIMESTAMP}.log"
  DB_EXIT=$?
  if [ $DB_EXIT -ne 0 ] || [ ! -s "$BACKUP_DIR/db-${TIMESTAMP}.sql" ]; then
    echo "    ERROR: mysqldump also failed (exit=$DB_EXIT)."
    cat "$BACKUP_DIR/db-err-${TIMESTAMP}.log"
  fi
fi
if [ -s "$BACKUP_DIR/db-${TIMESTAMP}.sql" ]; then
  gzip "$BACKUP_DIR/db-${TIMESTAMP}.sql"
  echo "    Database dump OK."
else
  rm -f "$BACKUP_DIR/db-${TIMESTAMP}.sql"
  echo "    WARNING: No database dump produced."
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
