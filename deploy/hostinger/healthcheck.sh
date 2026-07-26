#!/usr/bin/env bash
set -euo pipefail

: "${APP_URL:?APP_URL is required}"
curl --fail --silent --show-error --max-time 10 "$APP_URL/api/health/live" >/dev/null
curl --fail --silent --show-error --max-time 10 "$APP_URL/api/health/ready" >/dev/null
printf '%s\n' "Radarune health checks passed."
