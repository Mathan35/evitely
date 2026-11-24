#!/usr/bin/env bash
# Run ON the Oracle VM as ubuntu (or with sudo where noted).
# Usage:
#   cd /var/www/evitely-staging
#   bash deploy/oracle/deploy-staging.sh
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/evitely-staging}"
REPO_URL="${REPO_URL:-}"
BRANCH="${BRANCH:-main}"

cd "$APP_DIR"

if [[ ! -d .git ]]; then
  if [[ -z "$REPO_URL" ]]; then
    echo "Set REPO_URL=https://github.com/YOUR/evitely.git and re-run (first deploy)."
    exit 1
  fi
  git clone --branch "$BRANCH" "$REPO_URL" .
else
  git fetch origin
  git checkout "$BRANCH"
  git pull --ff-only origin "$BRANCH"
fi

if [[ ! -f .env ]]; then
  cp deploy/oracle/.env.staging.example .env
  php artisan key:generate --force
  echo "Created .env — edit APP_URL and DB_PASSWORD, then re-run this script."
  exit 0
fi

composer install --no-dev --optimize-autoloader --no-interaction
npm ci --include=dev
php artisan wayfinder:generate --with-form || true
npm run build
rm -rf node_modules

php artisan migrate --force --no-interaction
php artisan storage:link --force || true
php artisan config:cache
php artisan route:cache
php artisan view:cache || true

sudo cp deploy/oracle/nginx-staging.conf /etc/nginx/sites-available/evitely-staging
sudo ln -sfn /etc/nginx/sites-available/evitely-staging /etc/nginx/sites-enabled/evitely-staging
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx

sudo chown -R www-data:www-data storage bootstrap/cache
sudo chmod -R ug+rwx storage bootstrap/cache

echo "Staging deploy OK. Open http://$(curl -s ifconfig.me || echo YOUR_PUBLIC_IP)"
