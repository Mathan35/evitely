#!/usr/bin/env bash
# One-shot production update with a friendly wait page for visitors.
# Usage (on server): bash deploy/hostinger/deploy-git.sh
set -euo pipefail

APP_DIR="${APP_DIR:-$HOME/domains/invidora.com/invidora}"
cd "$APP_DIR"

# Hostinger SSH defaults can be older PHP; prefer 8.4 for artisan/composer.
if [[ -x /opt/alt/php84/usr/bin/php ]]; then
  export PATH=/opt/alt/php84/usr/bin:$PATH
fi

bash "$APP_DIR/deploy/hostinger/maintenance-down.sh"

cleanup() {
  bash "$APP_DIR/deploy/hostinger/maintenance-up.sh" || true
}
trap cleanup EXIT

echo "==> Pull latest"
git fetch origin
git reset --hard origin/main

echo "==> Optimize"
php artisan migrate --force --no-interaction || true
php artisan optimize || true

echo "==> Done pulling — bringing site back"
php artisan up
trap - EXIT
echo "Live again."
