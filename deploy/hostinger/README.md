# Radarune Hostinger deployment

## Recommended profile

Use a Hostinger VPS for Radarune. The application has long-running distribution, intelligence and notification workers, database migrations, audio uploads and persistent local storage requirements. A Web App plan is only suitable when persistent storage and worker/cron execution are explicitly available; otherwise use S3/R2 and an external worker platform.

Recommended paths:

- Application: `/var/www/radarune/current`
- Releases: `/var/www/radarune/releases`
- Environment: `/var/www/radarune/shared/.env`
- Persistent local storage: `/var/lib/radarune/storage`
- Backups: `/var/backups/radarune`

## First-time setup

1. Create a non-root `radarune` user and grant it ownership of the application, storage and backup directories.
2. Install Node.js 20+, npm, PM2, Nginx, curl, gzip, tar and `mysqldump`.
3. Configure SSH key access and disable password-based SSH login.
4. Copy `.env.production.example` to `/var/www/radarune/shared/.env` and fill it through the server secret-management process.
5. Set `REPO_URL`, `GIT_REF`, `MYSQL_*` backup variables and `APP_URL` in the deployment shell environment.
6. Review the migration SQL and take a verified backup before the first `npm run prisma:migrate:deploy`.
7. Install the Nginx example after replacing certificate paths, then run `nginx -t`.
8. Run `pm2 startup` and `pm2 save` as the `radarune` user.

## Deploy and rollback

Run `deploy.sh` from a trusted deployment host. It builds in a new release directory, runs checks, applies migrations, switches the `current` symlink only after a successful build, reloads the existing worker processes and checks both health endpoints. It never copies `.env` into Git and does not print secrets.

The script uses only workers that exist in this repository: distribution, intelligence and notifications. There is no invented import worker process; imports are currently cron/database-scheduler driven.

If readiness fails after the symlink switch, run `rollback.sh`. Database rollback is not automatic: use only backward-compatible migrations or restore from the verified database backup after a deliberate incident review.

To verify and restore a backup, run `sha256sum -c SHA256SUMS`, then restore the database with `gunzip -c database.sql.gz | MYSQL_PWD="$MYSQL_PASSWORD" mysql --host "$MYSQL_HOST" --port "$MYSQL_PORT" --user "$MYSQL_USER" "$MYSQL_DATABASE"`. Restore `storage.tar.gz` only after stopping workers and confirming the target persistent path.

## Web App limitation

Do not use LOCAL storage on a Web App profile unless Hostinger confirms persistent storage outside the release directory. If persistence, workers or cron are unavailable, configure S3/R2 and run the workers elsewhere.
