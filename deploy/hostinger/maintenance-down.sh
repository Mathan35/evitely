#!/usr/bin/env bash
# Put the site into a friendly "please wait" page before deploying.
# Usage (on server): bash deploy/hostinger/maintenance-down.sh
set -euo pipefail

APP_DIR="${APP_DIR:-$HOME/domains/invidora.com/invidora}"
cd "$APP_DIR"

SECRET="${MAINTENANCE_SECRET:-deploy-bypass}"
RETRY="${MAINTENANCE_RETRY:-30}"
REFRESH="${MAINTENANCE_REFRESH:-12}"

php artisan down \
  --render="maintenance" \
  --retry="$RETRY" \
  --refresh="$REFRESH" \
  --secret="$SECRET" \
  --status=503

echo "Maintenance ON — visitors see the wait page."
echo "Bypass (admins): open https://invidora.com/${SECRET} once, then browse normally."
