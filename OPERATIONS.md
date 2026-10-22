# Operations: seek.swislr.org

How production is run, kept patched, and monitored. Feature development and
the full redeploy checklist live in `notes` (see "REDEPLOY").

## Layout

| What | Where |
|---|---|
| Server | Ubuntu 24.04 droplet, clock in UTC. Host-specific details (access, paths) are in `/root/README.md` on the server, not in this public repo. |
| Repo checkout | `/home/swislr/SWISLR_seek` (this repo, `main`). `docker compose` commands run from here. |
| Secrets | `.env` in the checkout (gitignored). Never commit or print values. |
| DB backups | Written by the weekly job (last 8 kept); location in `/root/README.md` |
| Logs | `/var/log/seek-update.log`, `/var/log/seek-health.log` |
| Cron | `/etc/cron.d/seek`, installed from `scripts/seek-cron` |

Three containers (`docker-compose.yaml`):

- **caddy** (`caddy:2`): TLS termination and reverse proxy (`Caddyfile`). Certificates live in the `caddy-data` volume.
- **drupal**: built locally from `Dockerfile` on `drupal:10-apache` (PHP 8.4, Apache). Drupal core and modules come from `composer.lock`, not from the base image.
- **db** (`mariadb:10.11`): data in the `drupal-db` volume. `MARIADB_AUTO_UPGRADE=1` upgrades system tables automatically after a version bump.

Host PHP (`php8.3-cli`) is only a CLI tool; it does not serve the site.
Ubuntu backports security fixes without changing the upstream number, so it
always reports "8.3.6". Scanners that flag that number can be ignored as long as
`apt upgrade` is current (`unattended-upgrades` is enabled).

## Automated jobs

**Weekly update**, Sundays 04:00 US Eastern (`scripts/update-containers.sh`):

1. Dumps all databases to the backup directory.
2. Records the image each container is running.
3. Runs `docker compose pull` for db and caddy and `docker compose build --pull` for drupal. These pick up patch releases within the pinned tags, e.g. PHP 8.4.x, MariaDB 10.11.x, Caddy 2.x.
4. Stops here if nothing changed. Otherwise it recreates the containers and checks that the site returns 200 and drush bootstraps.
5. If either check fails, it retags the previous images, recreates the containers again and reports a failure.

**Daily health check**, 11:00 UTC (`scripts/healthcheck.sh`): confirms all
containers are running, the site returns 200, drush bootstraps and the root
disk is under 90% full.

**Alerting:** both scripts ping the healthchecks.io check in
`HEALTHCHECK_PING_URL`, set to a daily period. If a run fails, or nothing pings
for a day, healthchecks.io sends an email. Failure pings include the problem
in the request body.

Important: the weekly job builds Drupal from whatever is checked out in
`/home/swislr/SWISLR_seek`. Never `git pull` there without completing the full
redeploy procedure (`drush updb`, `drush cim`, ...), or the next Sunday run
will put that code live without its database updates.

## Updates that are NOT automatic

- **Drupal core and modules.** Dependabot (`.github/dependabot.yml`) opens a grouped PR each week. Test the PR in the dev container (`drush updb`, `drush cr`, click through the site), merge it, then deploy with the REDEPLOY procedure in `notes`.
- **Major or minor version changes of base images.** Examples: MariaDB 10.11 → 11.4, Drupal 10 → 11, `caddy:2` → 3. Change the tag in `Dockerfile` or `docker-compose.yaml` and deploy by hand, with a fresh backup. Rollback is not safe after a database major upgrade, so restore from the dump instead.

Coming up: MariaDB 10.11 is supported until Feb 2028. Drupal 10 security
support is expected to end around Dec 2026, so plan the Drupal 11 migration.

## Common tasks

```bash
cd /home/swislr/SWISLR_seek
scripts/update-containers.sh        # run the weekly update now
scripts/healthcheck.sh              # run the health check now
tail -50 /var/log/seek-update.log

# Restore a DB backup (stop drupal first)
docker compose stop drupal
zcat <backup>.sql.gz | \
  docker compose exec -T db sh -c 'mariadb -uroot -p"$MYSQL_ROOT_PASSWORD"'
docker compose start drupal
```

## Change history

- **2026-10-22.** DigitalOcean flagged host PHP 8.3.6. The host package was already patched (`8.3.6-0ubuntu0.24.04.13`), but the Drupal container's PHP was stale (8.4.13, built Sept 2025).
  - Rebuilt the drupal image on a fresh base, bringing PHP to 8.4.27.
  - Upgraded MariaDB 10.6 (end of life since July 2026) to 10.11 and added `MARIADB_AUTO_UPGRADE`.
  - Added the weekly update job, the daily health check, healthchecks.io alerting, Dependabot and this document.
