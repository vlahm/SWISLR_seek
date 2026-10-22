# Operations: seek.swislr.org

How production is run, kept patched, and monitored. Feature development and
the full redeploy checklist live in `notes` (see "REDEPLOY").

## Housekeeping due

- **On or after 2026-11-05: delete the rollback image tags left by the Oct 2026 upgrades.**
  - Prod has run D11 without problems since 2026-10-22, and the tags take about 3.5 GB.
  - Rolling back to D10 now would also need a DB restore from before the cutover, which would lose all content since then.
  - The weekly job's `docker image prune` only removes untagged images, so these tags stay until someone deletes them.

  ```bash
  docker image rm swislr_seek-drupal:d10-final swislr_seek-drupal:pre-phase1 swislr_seek-drupal:pre-php-update
  docker image prune -f
  ```

  - Leave `swislr_seek-drupal:latest`, which is the running image.
  - The `seek-db-pre-*` dumps in the backup directory need no action. They match the weekly job's `seek-db-*` rotation and age out after 8 runs (about mid-Dec 2026).
  - The `backup/full_dump/*-20261022-*` files from the upgrade are small and can be deleted at the same time.
  - Remove this item once it's done.

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
- **drupal**: built locally from `Dockerfile` on `drupal:11-php8.4-apache` (Drupal 11, PHP 8.4, Apache). The PHP minor version is pinned on purpose: the plain `drupal:11-apache` tag moves to new PHP minors (8.5 as of Oct 2026), which should be adopted deliberately. Drupal core and modules come from `composer.lock`, not from the base image.
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

Coming up: MariaDB 10.11 is supported until Feb 2028. Drupal 11 is the
current major; Drupal 12 is scheduled for Dec 2026. `drupal/upgrade_status` (dev-only)
can scan for D12 readiness when it's time.

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
  - Dependabot immediately flagged Drupal core 10.6.5 (SQL injection, critical; XSS and object injection, medium). Updated core to 10.6.20 in dev (`composer update "drupal/core-*" -W`, no pending DB updates), then deployed per REDEPLOY in `notes`. `drush cim` was skipped because no config files changed; prod config status was clean.
- **2026-10-22, Drupal 11 prep (phase 1 of 3).** Drupal 10 reaches end of life 2026-12-09. These changes run on D10 and were deployed on their own:
  - webform 6.2.10 → 6.3.1. The webform module is effectively unused: `/contact` is core's contact form and prod has no webform submissions.
  - email_registration 1.4.0 → 2.0.0-rc9, the only D11-compatible line. 2.x dropped "require username on registration", which would have derived public display names from email addresses. `swislr_name_fix` restores the required username field with a form `#process` callback; a plain form alter lost to email_registration's alter.
  - All custom modules declare `^10 || ^11`. `upgrade_status` (dev-only) found no D11 issues in custom code.
  - Config changed by the module updates was exported from prod, not dev, so dev-only admin-UI differences didn't leak into `backup/sync`.
  - Removed the unused orcid module (never configured; empty data table). Uninstalled on prod first, then the code was removed.
- **Drupal 11 upgrade (phase 2, dev; branch `drupal-11`, since merged and deleted).** Dev was reset to a copy of prod's DB, files and config.
  - `composer require drupal/core-*:^11 drush/drush:^13 -W` gave Drupal 11.4.11 and drush 13.8. drush had to be included, because its code generator pinned Symfony 6.
  - D11's `index.php` needs `symfony/runtime`'s Composer plugin, so it was added to `allow-plugins`, matching Drupal's project template.
  - `drush updb` ran system/views/search/etc. updates. Search is split into `search_node`/`search_help`. Config was re-exported from dev (= prod + D11 changes).
  - Tested on a clean image build: crawl (anon 29 pages, admin 400 pages, all assets), registration with username, login by email and by username, every content type, story moderation, comments, invitations, GeoJSON feeds.
  - Unused but still installed: `react_comments` and `ctools` (not enabled), `webform` (no submissions). Candidates for removal later.
- **2026-10-22 18:05–18:08 UTC: prod cut over to Drupal 11.4.11 / PHP 8.4.27 (phase 3).** About 3.5 minutes in maintenance mode.
  - Rollback image: `swislr_seek-drupal:d10-final`. DB dumps: `seek-db-pre-d11-*` plus `backup/full_dump/*-20261022-180508*`. Rolling back needs **both** the image and a DB restore, because the D11 updates changed the schema.
  - `drush updb` ran cleanly. `drush cim` was **not** run: prod's updates created 8 config items (promote base-field overrides, search view modes) that matched dev's export except for UUIDs, so the import would have deleted and recreated them. Prod's versions were exported and committed instead.
  - Verified: anon and admin crawl, no new errors, cron ran, registration still requires a username.
  - Lesson for future major upgrades: items created by update hooks get fresh UUIDs on each site. After `updb` on prod, compare `config:status`. If the only differences are UUIDs, export from prod rather than importing.
  - Known, predates D11: Drupal builds `http://` redirect URLs (Caddy upgrades them with a 308) because `settings.php` has no reverse-proxy config. Fixing it needs `$settings['reverse_proxy']` plus the Caddy container's address.
