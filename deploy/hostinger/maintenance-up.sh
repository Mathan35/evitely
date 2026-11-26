#!/usr/bin/env bash
# Take the site out of maintenance after deploy finishes.
# Usage (on server): bash deploy/hostinger/maintenance-up.sh
set -euo pipefail

APP_DIR="${APP_DIR:-$HOME/domains/invidora.com/invidora}"
cd "$APP_DIR"

php artisan up
echo "Maintenance OFF — site is live again."
