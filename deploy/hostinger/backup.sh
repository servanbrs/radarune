#!/usr/bin/env bash
set -euo pipefail

: "${BACKUP_ROOT:=/var/backups/radarune}"
: "${MYSQL_HOST:?MYSQL_HOST is required for backups}"
: "${MYSQL_PORT:=3306}"
: "${MYSQL_DATABASE:?MYSQL_DATABASE is required for backups}"
: "${MYSQL_USER:?MYSQL_USER is required for backups}"
: "${MYSQL_PASSWORD:?MYSQL_PASSWORD is required for backups}"
: "${STORAGE_PROVIDER:=LOCAL}"
: "${STORAGE_LOCAL_ROOT:=/var/lib/radarune/storage}"

timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
backup_dir="$BACKUP_ROOT/$timestamp"
mkdir -p "$backup_dir"

MYSQL_PWD="$MYSQL_PASSWORD" mysqldump --single-transaction --routines --triggers \
  --host "$MYSQL_HOST" --port "$MYSQL_PORT" --user "$MYSQL_USER" "$MYSQL_DATABASE" \
  | gzip -9 > "$backup_dir/database.sql.gz"

if [[ "$STORAGE_PROVIDER" == "LOCAL" ]]; then
  tar --warning=no-file-changed -C "$(dirname "$STORAGE_LOCAL_ROOT")" \
    -czf "$backup_dir/storage.tar.gz" "$(basename "$STORAGE_LOCAL_ROOT")"
fi

sha256sum "$backup_dir"/* > "$backup_dir/SHA256SUMS"
printf '%s\n' "$backup_dir"
