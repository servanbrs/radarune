#!/usr/bin/env bash
set -euo pipefail

APP_ROOT="${APP_ROOT:-/var/www/radarune}"
if [[ ! -L "$APP_ROOT/previous" ]]; then
  printf '%s\n' "No previous release symlink exists." >&2
  exit 1
fi

previous="$(readlink -f "$APP_ROOT/previous")"
current="$(readlink -f "$APP_ROOT/current" 2>/dev/null || true)"
ln -sfn "$current" "$APP_ROOT/failed-release" 2>/dev/null || true
ln -sfn "$previous" "$APP_ROOT/current"
pm2 startOrReload "$APP_ROOT/current/deploy/hostinger/ecosystem.config.cjs" --update-env
printf '%s\n' "Rolled back to $previous"
