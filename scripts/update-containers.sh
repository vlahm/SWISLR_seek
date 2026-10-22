#!/usr/bin/env bash
# Weekly container refresh for seek.swislr.org.
# Pulls/rebuilds all images within their pinned tags, recreates containers,
# health-checks the site, and rolls back to the previous images on failure.
#
# Install (as root on the server):
#   echo '0 4 * * 0 root /home/swislr/SWISLR_seek/scripts/update-containers.sh >> /var/log/seek-update.log 2>&1' > /etc/cron.d/seek-update
#
# Optional alerting: set UPDATE_PING_URL in .env to a healthchecks.io (or similar)
# ping URL. "/start" is pinged at start, the bare URL on success, "/fail" on failure.

set -uo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BACKUP_DIR=/root/backups
SITE_URL=https://seek.swislr.org/
KEEP_BACKUPS=8
SERVICES=(db drupal caddy)

cd "$PROJECT_DIR" || exit 1
PING_URL="$(grep -E '^UPDATE_PING_URL=' .env 2>/dev/null | cut -d= -f2-)"

log() { echo "[$(date '+%F %T')] $*"; }
ping_hc() { [ -n "$PING_URL" ] && curl -fsS -m 10 --retry 3 "$PING_URL$1" >/dev/null; true; }
container() { docker compose ps -q "$1"; }

healthy() {
  local code i
  for i in $(seq 1 30); do
    code=$(curl -s -o /dev/null -m 10 -w '%{http_code}' "$SITE_URL")
    [ "$code" = 200 ] && break
    sleep 5
  done
  [ "$code" = 200 ] || { log "site returned $code"; return 1; }
  docker compose exec -T drupal sh -c 'cd /opt/drupal && vendor/bin/drush status --field=bootstrap' \
    | grep -q Successful || { log "drush bootstrap failed"; return 1; }
}

ping_hc /start
log "=== starting container update ==="

# 1. Database backup
mkdir -p "$BACKUP_DIR"
backup="$BACKUP_DIR/seek-db-$(date +%Y%m%d-%H%M).sql.gz"
if ! docker compose exec -T db sh -c 'mariadb-dump -uroot -p"$MYSQL_ROOT_PASSWORD" --single-transaction --all-databases' \
    | gzip > "$backup" || ! zcat "$backup" | tail -1 | grep -q 'Dump completed'; then
  log "database backup failed; aborting"
  ping_hc /fail
  exit 1
fi
log "backup written: $backup"
ls -1t "$BACKUP_DIR"/seek-db-*.sql.gz | tail -n +$((KEEP_BACKUPS + 1)) | xargs -r rm --

# 2. Remember the image each service is running now, for rollback
declare -A old_image image_tag
for s in "${SERVICES[@]}"; do
  id=$(container "$s")
  old_image[$s]=$(docker inspect -f '{{.Image}}' "$id")
  image_tag[$s]=$(docker inspect -f '{{.Config.Image}}' "$id")
done

# 3. Fetch new images
if ! docker compose pull --quiet db caddy || ! docker compose build --pull --quiet drupal; then
  log "pull/build failed; nothing was changed"
  ping_hc /fail
  exit 1
fi

changed=0
for s in "${SERVICES[@]}"; do
  new=$(docker image inspect -f '{{.Id}}' "${image_tag[$s]}")
  [ "$new" != "${old_image[$s]}" ] && { log "$s: new image available"; changed=1; }
done
if [ "$changed" = 0 ]; then
  log "all images already current"
  ping_hc ""
  exit 0
fi

# 4. Recreate containers and verify
docker compose up -d --remove-orphans
if healthy; then
  log "update succeeded"
  docker image prune -f >/dev/null
  ping_hc ""
  exit 0
fi

# 5. Roll back to the previous images
log "health check failed; rolling back"
for s in "${SERVICES[@]}"; do
  docker tag "${old_image[$s]}" "${image_tag[$s]}"
done
docker compose up -d
if healthy; then
  log "rollback succeeded (site is on previous images)"
else
  log "ROLLBACK FAILED; manual attention needed. DB backup: $backup"
fi
ping_hc /fail
exit 1
