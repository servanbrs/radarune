#!/usr/bin/env bash
set -euo pipefail

APP_ROOT="${APP_ROOT:-/var/www/radarune}"
RELEASES_DIR="$APP_ROOT/releases"
SHARED_DIR="$APP_ROOT/shared"
ENV_FILE="${ENV_FILE:-$SHARED_DIR/.env}"
REPO_URL="${REPO_URL:?REPO_URL is required}"
GIT_REF="${GIT_REF:-main}"
RELEASE_ID="${RELEASE_ID:-$(date -u +%Y%m%dT%H%M%SZ)}"
RELEASE_DIR="$RELEASES_DIR/$RELEASE_ID"

[[ -f "$ENV_FILE" ]] || { printf '%s\n' "Missing environment file: $ENV_FILE" >&2; exit 1; }
mkdir -p "$RELEASES_DIR" "$SHARED_DIR"
set -a
# shellcheck disable=SC1090
. "$ENV_FILE"
set +a

if [[ -x "$APP_ROOT/current/deploy/hostinger/backup.sh" ]]; then
  "$APP_ROOT/current/deploy/hostinger/backup.sh"
fi
git clone --depth 1 --branch "$GIT_REF" "$REPO_URL" "$RELEASE_DIR"
ln -s "$ENV_FILE" "$RELEASE_DIR/.env"

cd "$RELEASE_DIR"
npm ci
npm run prisma:generate
npm run typecheck
npm run lint
npm test -- --run
npm run build
npm run prisma:migrate:deploy

if [[ -L "$APP_ROOT/current" ]]; then
  ln -sfn "$(readlink -f "$APP_ROOT/current")" "$APP_ROOT/previous"
fi
ln -sfn "$RELEASE_DIR" "$APP_ROOT/current"
pm2 startOrReload "$APP_ROOT/current/deploy/hostinger/ecosystem.config.cjs" --update-env

if ! APP_URL="${APP_URL:?APP_URL is required}" "$APP_ROOT/current/deploy/hostinger/healthcheck.sh"; then
  "$APP_ROOT/current/deploy/hostinger/rollback.sh"
  exit 1
fi

find "$RELEASES_DIR" -mindepth 1 -maxdepth 1 -type d -printf '%T@ %p\n' | sort -nr | tail -n +6 | cut -d' ' -f2- | xargs -r rm -rf
printf '%s\n' "Radarune deployment completed: $RELEASE_ID"
