# SWISLR Seek

Drupal 10 site served at https://seek.swislr.org from Docker containers (caddy, drupal, mariadb).

- Production server layout, automated update/health-check jobs, backups, alerting, and change history: **OPERATIONS.md** (read before touching prod).
- Dev workflow and the full prod redeploy checklist: `notes` (section "REDEPLOY").
- Secrets live only in the gitignored `.env` (locally and on the server). Never print or commit their values; move them with shell substitution and verify by length.
