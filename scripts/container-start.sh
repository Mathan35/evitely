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

# Laravel uses DB_URL; some hosts still inject DATABASE_URL.
if [[ -z "${DB_URL:-}" && -n "${DATABASE_URL:-}" ]]; then
  export DB_URL="${DATABASE_URL}"
fi

db_ready=0
if [[ -n "${DB_URL:-}" ]]; then
  echo "Waiting for database (DB_URL)..."
  for i in {1..40}; do
    if php -r '
      $url = getenv("DB_URL") ?: getenv("DATABASE_URL");
      if (!$url) exit(1);
      $parts = parse_url($url);
      if ($parts === false) exit(1);
      $scheme = $parts["scheme"] ?? "";
      $driver = str_starts_with($scheme, "postgres") ? "pgsql" : "mysql";
      $host = $parts["host"] ?? "127.0.0.1";
      $port = $parts["port"] ?? ($driver === "pgsql" ? 5432 : 3306);
      $db = ltrim($parts["path"] ?? "", "/");
      $user = urldecode($parts["user"] ?? "");
      $pass = urldecode($parts["pass"] ?? "");
      $ssl = getenv("DB_SSLMODE") ?: "require";
      $dsn = $driver === "pgsql"
        ? "pgsql:host={$host};port={$port};dbname={$db};sslmode={$ssl}"
        : "mysql:host={$host};port={$port};dbname={$db}";
      try { new PDO($dsn, $user, $pass, [PDO::ATTR_TIMEOUT => 5]); exit(0); }
      catch (Throwable $e) { fwrite(STDERR, $e->getMessage() . PHP_EOL); exit(1); }
    '; then
      echo "Database is ready."
      db_ready=1
      break
    fi
    echo "  attempt ${i}/40 — retrying in 3s..."
    sleep 3
  done
elif [[ -n "${DB_HOST:-}" ]]; then
  echo "Waiting for database ${DB_HOST}:${DB_PORT:-3306}..."
  for i in {1..40}; do
    if php -r "try { new PDO('mysql:host='.getenv('DB_HOST').';port='.(getenv('DB_PORT')?:3306).';dbname='.getenv('DB_DATABASE'), getenv('DB_USERNAME'), getenv('DB_PASSWORD') ?: '', [PDO::ATTR_TIMEOUT => 5]); exit(0);} catch (Throwable \$e) { exit(1);}"; then
      echo "Database is ready."
      db_ready=1
      break
    fi
    sleep 3
  done
else
  echo "No DB_URL / DB_HOST set — skipping DB wait (sqlite?)."
  db_ready=1
fi

if [[ "${db_ready}" -ne 1 ]]; then
  echo "ERROR: database never became ready." >&2
  exit 1
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
echo "Starting Invidora on 0.0.0.0:${PORT} (APP_URL=${APP_URL:-unset})"
exec php artisan serve --host=0.0.0.0 --port="${PORT}"
