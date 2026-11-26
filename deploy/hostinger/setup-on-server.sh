#!/usr/bin/env bash
# Run ON Hostinger via SSH after code is in place.
# Typical path: ~/domains/invidora.com/invidora
set -euo pipefail

APP_DIR="${APP_DIR:-$HOME/domains/invidora.com/invidora}"
DOMAIN_DIR="${DOMAIN_DIR:-$HOME/domains/invidora.com}"

cd "$APP_DIR"

echo "==> PHP / Composer"
php -v
composer2 --version || composer --version

echo "==> Install PHP deps"
# Hostinger often disables proc_open; Apple Sign In also needs ext-sodium (enable in hPanel).
COMPOSER_BIN="composer"
if command -v composer2 >/dev/null 2>&1; then
  COMPOSER_BIN="composer2"
fi

COMPOSER_FLAGS=(install --no-dev --optimize-autoloader --no-interaction)
# Allow install when sodium isn't enabled yet (Apple OAuth). Prefer enabling sodium in hPanel.
if ! php -m 2>/dev/null | grep -qi '^sodium$'; then
  echo "WARN: PHP ext-sodium missing — enable it in hPanel → PHP Config → Extensions."
  echo "      Continuing with --ignore-platform-req=ext-sodium for now."
  COMPOSER_FLAGS+=(--ignore-platform-req=ext-sodium)
fi

if ! $COMPOSER_BIN "${COMPOSER_FLAGS[@]}"; then
  echo "Composer scripts failed (often missing proc_open). Retrying with --no-scripts..."
  $COMPOSER_BIN "${COMPOSER_FLAGS[@]}" --no-scripts
  php artisan package:discover --ansi || true
fi

if [[ ! -f .env ]]; then
  if [[ -f .env.hostinger.example ]]; then
    cp .env.hostinger.example .env
  else
    cp .env.example .env
  fi
  php artisan key:generate --force
  echo ""
  echo "Created .env — edit DB_* passwords from hPanel, then re-run this script."
  echo "  nano $APP_DIR/.env"
  exit 0
fi

echo "==> Maintenance (friendly wait page for visitors)"
MAINTENANCE_SECRET="${MAINTENANCE_SECRET:-deploy-bypass}"
php artisan down \
  --render="maintenance" \
  --retry=30 \
  --refresh=12 \
  --secret="$MAINTENANCE_SECRET" \
  --status=503 || true

cleanup_maintenance() {
  php artisan up || true
}
trap cleanup_maintenance EXIT

echo "==> Laravel setup"
php artisan migrate --force --no-interaction
php artisan storage:link --force || true
# Always rebuild caches so new routes (e.g. /auth/google/redirect) are live after git pull.
php artisan optimize:clear || true
php artisan config:cache
php artisan route:cache
php artisan view:cache || true
php artisan event:cache || true

echo "==> Bring site back online"
php artisan up
trap - EXIT

echo "==> Permissions"
chmod -R ug+rwx storage bootstrap/cache || true

echo "==> Point public_html → public/ (symlink)"
cd "$DOMAIN_DIR"
if [[ -L public_html ]]; then
  echo "public_html already a symlink → $(readlink public_html)"
elif [[ -d public_html ]]; then
  TS="$(date +%Y%m%d%H%M%S)"
  mv public_html "public_html_backup_$TS"
  ln -s "$APP_DIR/public" public_html
  echo "Backed up old public_html → public_html_backup_$TS"
  echo "Linked public_html → $APP_DIR/public"
else
  ln -s "$APP_DIR/public" public_html
  echo "Linked public_html → $APP_DIR/public"
fi

echo ""
echo "OK. Visit https://invidora.com"
echo "If blank/500: check storage/logs/laravel.log and .env DB credentials."
