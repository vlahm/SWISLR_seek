#!/usr/bin/env bash
# Daily health check for seek.swislr.org; reports to healthchecks.io.
# Pings HEALTHCHECK_PING_URL (from .env) on success, "<url>/fail" with the
# problems as the request body on failure. Scheduled by scripts/seek-cron.

set -uo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SITE_URL=https://seek.swislr.org/
DISK_LIMIT=90

cd "$PROJECT_DIR" || exit 1
PING_URL="$(grep -E '^HEALTHCHECK_PING_URL=' .env 2>/dev/null | cut -d= -f2-)"
problems=()

for s in db drupal caddy; do
  [ "$(docker compose ps --status running -q "$s")" ] || problems+=("container $s is not running")
done

code=$(curl -s -o /dev/null -m 20 -w '%{http_code}' "$SITE_URL")
[ "$code" = 200 ] || problems+=("$SITE_URL returned $code")

docker compose exec -T drupal sh -c 'cd /opt/drupal && vendor/bin/drush status --field=bootstrap' 2>/dev/null \
  | grep -q Successful || problems+=("drush bootstrap failed")

disk=$(df --output=pcent / | tail -1 | tr -dc 0-9)
[ "$disk" -lt "$DISK_LIMIT" ] || problems+=("root disk ${disk}% full")

if [ ${#problems[@]} -eq 0 ]; then
  echo "[$(date '+%F %T')] healthy"
  [ -n "$PING_URL" ] && curl -fsS -m 10 --retry 3 "$PING_URL" >/dev/null
  exit 0
fi

msg=$(printf '%s\n' "${problems[@]}")
echo "[$(date '+%F %T')] UNHEALTHY: $msg"
[ -n "$PING_URL" ] && curl -fsS -m 10 --retry 3 --data-raw "$msg" "$PING_URL/fail" >/dev/null
exit 1
