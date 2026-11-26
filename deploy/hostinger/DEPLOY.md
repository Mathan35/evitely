# Deploy Invidora to Hostinger (Unlimited + invidora.com)

## A) hPanel (once)

1. **Websites → invidora.com → Manage**
2. **Advanced → PHP Configuration** → **PHP 8.4** (or 8.3+)
   - Under **Extensions**, enable **sodium** (required for Apple Sign In / `lcobucci/jwt`)
   - Also ensure **proc_open** is not in disabled functions (Composer scripts)
3. **Databases → MySQL Databases**
   - Create database + user (Hostinger adds a prefix, e.g. `u123456789_invidora`)
   - Save: database name, username, password
4. **Advanced → SSH Access** → enable → copy host / user / port
5. **SSL** → enable free SSL for `invidora.com` + `www`

## B) Upload code (pick one)

### Option 1 — Git (recommended)

From your PC (after pushing `main` to GitHub):

```bash
ssh -p PORT USER@HOST
cd ~/domains/invidora.com
git clone https://github.com/Mathan35/evitely.git invidora
cd invidora
```

(Use your real repo URL if different.)

### Option 2 — File Manager / FTP

1. Locally run `npm run build` (already done before zip).
2. Zip the project **excluding** `node_modules`, `.git`, `tests`, `storage/logs/*`.
3. Upload zip to `domains/invidora.com/`, extract as folder `invidora`.
4. Do **not** put the whole Laravel app inside `public_html`.

## C) Server setup (SSH)

```bash
cd ~/domains/invidora.com/invidora
bash deploy/hostinger/setup-on-server.sh
# First run creates .env — edit DB_*, then run again:
nano .env
bash deploy/hostinger/setup-on-server.sh
```

### `.env` must include

```env
APP_NAME="Invidora"
APP_ENV=production
APP_DEBUG=false
APP_URL=https://invidora.com
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_DATABASE=uXXXX_invidora   # from hPanel
DB_USERNAME=uXXXX_invidora   # from hPanel
DB_PASSWORD=...
MAIL_FROM_ADDRESS="hello@invidora.com"
VITE_APP_NAME="Invidora"
```

Use values from `.env.hostinger.example` as a template.

## D) Assets

Shared hosting often has no Node. **Build on your PC**, commit/upload `public/build`:

```bash
npm ci
npm run build
```

Then push / re-upload so `public/build` exists on the server.

## E) Cron (optional but recommended)

hPanel → **Advanced → Cron Jobs** → every minute:

```text
cd /home/USER/domains/invidora.com/invidora && php artisan schedule:run >> /dev/null 2>&1
```

## Layout on disk

```text
domains/invidora.com/
  invidora/          ← full Laravel app
    app/, config/, public/, vendor/, .env, ...
  public_html → symlink to invidora/public
```

## Smoke test

1. https://invidora.com → marketing home  
2. https://invidora.com/up → health  
3. Register → create event → publish invite  

## If symlink fails

Copy only the **contents** of `invidora/public/*` into `public_html`, then edit `public_html/index.php` so paths point to `../invidora`:

```php
require __DIR__.'/../invidora/vendor/autoload.php';
$app = require_once __DIR__.'/../invidora/bootstrap/app.php';
```
