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

if [[ "$(id -u)" -eq 0 ]]; then
  printf '%s\n' "Bu script root olarak çalıştırılmamalıdır. radarune deploy kullanıcısı ile çalıştırın." >&2
  exit 1
fi
if [[ -e "$APP_ROOT/current" ]]; then
  printf '%s\n' "Mevcut kurulum bulundu. Güncelleme için deploy.sh kullanın." >&2
  exit 1
fi
if [[ ! -f "$ENV_FILE" ]]; then
  printf '%s\n' "Eksik env dosyası: $ENV_FILE" >&2
  printf '%s\n' "Önce .env.production.example dosyasını doldurun." >&2
  exit 1
fi

set -a
# shellcheck disable=SC1090
. "$ENV_FILE"
set +a

mkdir -p "$RELEASES_DIR" "$SHARED_DIR"
git clone --depth 1 --single-branch --branch "$GIT_REF" "$REPO_URL" "$RELEASE_DIR"
ln -s "$ENV_FILE" "$RELEASE_DIR/.env"

cd "$RELEASE_DIR"
npm ci
npm run prisma:generate
npm run validate:production
npm run typecheck
npm run lint
npm test -- --run
npm run build
npm run prisma:migrate:deploy

ln -sfn "$RELEASE_DIR" "$APP_ROOT/current"
pm2 startOrReload "$APP_ROOT/current/deploy/hostinger/ecosystem.config.cjs" --update-env

printf '%s\n' "İlk kurulum tamamlandı. Kurulum sihirbazı: ${APP_URL%/}/install"
