#!/usr/bin/env bash
# Shared start script for Render / Railway / Docker staging.
set -euo pipefail

cd /app

mkdir -p storage/framework/{cache,sessions,views} storage/logs bootstrap/cache
chmod -R ug+rwx storage bootstrap/cache || true

if [[ -z "${APP_KEY:-}" ]]; then
  export APP_KEY="base64:$(openssl rand -base64 32 | tr -d '\n')"
  echo "Generated ephemeral APP_KEY for this boot."
fi

# Prefer DATABASE_URL (Render Postgres). Fall back to DB_* (MySQL).
if [[ -n "${DATABASE_URL:-}" ]]; then
  echo "Waiting for DATABASE_URL..."
  for i in {1..40}; do
    if php -r '
      $url = getenv("DATABASE_URL");
      if (!$url) exit(1);
      $parts = parse_url($url);
      $scheme = $parts["scheme"] ?? "";
      $driver = str_starts_with($scheme, "postgres") ? "pgsql" : "mysql";
      $host = $parts["host"] ?? "127.0.0.1";
      $port = $parts["port"] ?? ($driver === "pgsql" ? 5432 : 3306);
      $db = ltrim($parts["path"] ?? "", "/");
      $user = urldecode($parts["user"] ?? "");
      $pass = urldecode($parts["pass"] ?? "");
      $dsn = $driver === "pgsql"
        ? "pgsql:host={$host};port={$port};dbname={$db}"
        : "mysql:host={$host};port={$port};dbname={$db}";
      try { new PDO($dsn, $user, $pass); exit(0); } catch (Throwable $e) { exit(1); }
    '; then
      echo "Database is ready."
      break
    fi
    sleep 3
  done
elif [[ -n "${DB_HOST:-}" ]]; then
  echo "Waiting for database ${DB_HOST}:${DB_PORT:-3306}..."
  for i in {1..40}; do
    if php -r "try { new PDO('mysql:host='.getenv('DB_HOST').';port='.(getenv('DB_PORT')?:3306).';dbname='.getenv('DB_DATABASE'), getenv('DB_USERNAME'), getenv('DB_PASSWORD') ?: ''); exit(0);} catch (Throwable \$e) { exit(1);}"; then
      echo "Database is ready."
      break
    fi
    sleep 3
  done
fi

# Render sets RENDER_EXTERNAL_URL — use as APP_URL when unset
if [[ -z "${APP_URL:-}" && -n "${RENDER_EXTERNAL_URL:-}" ]]; then
  export APP_URL="${RENDER_EXTERNAL_URL}"
fi

php artisan config:cache
php artisan route:cache
php artisan view:cache || true
php artisan storage:link --force || true
php artisan migrate --force --no-interaction

PORT="${PORT:-8000}"
echo "Starting Evitely on 0.0.0.0:${PORT} (APP_URL=${APP_URL:-unset})"
exec php artisan serve --host=0.0.0.0 --port="${PORT}"
