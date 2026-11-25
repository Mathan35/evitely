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
if command -v composer2 >/dev/null 2>&1; then
  composer2 install --no-dev --optimize-autoloader --no-interaction
else
  composer install --no-dev --optimize-autoloader --no-interaction
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

echo "==> Laravel setup"
php artisan migrate --force --no-interaction
php artisan storage:link --force || true
php artisan config:cache
php artisan route:cache
php artisan view:cache || true
php artisan event:cache || true

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
