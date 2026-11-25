# Invidora — digital invitations & event sites

One platform for invitation cards, guest websites, RSVPs, and host studio tools — weddings and every other celebration.

Guests open a public page. They do not create an account. Hosts sign in to design, preview, publish, and read replies.

## Requirements

- PHP 8.3+
- Composer
- Node.js 20+
- MySQL 8

## Install

```bash
composer install
npm install
copy .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan storage:link
npm run dev
php artisan serve
```

On macOS or Linux, use `cp .env.example .env` instead of `copy`.

The seeded host is `test@example.com` / `password`.

## Architecture

Laravel, Inertia, and React render every screen. Controllers authorize with policies and delegate to services. Form requests validate input. `WeddingPageData` is the shared payload for the editor, preview, public page, and guest links.

Themes and catalogs live in `config/wedding.php` and `app/Support/*`. Billing entitlements live in `config/billing.php` (free trial toolkit, per-site day packs, dual Razorpay/Stripe checkout).

Public addresses:

- `/invite/{slug}` — guest site
- `/invite/{slug}/card` — card view
- `/invite/{slug}/g/{token}` — personal guest link
- Optional `{slug}.{INVITE_ROOT_DOMAIN}` when invite subdomains are enabled

## Routes that matter

| Path | Who |
| --- | --- |
| `/events` | Host — My Events |
| `/events?create=1` | Host — pick occasion → designs |
| `/events/{id}/edit` | Host — site studio |
| `/events/{id}/card` | Host — card studio |
| `/events/{id}/billing` | Host — site pack / trial |
| `/invite/{slug}` | Anyone (published) |
| `/privacy` `/terms` `/cookies` | Legal |
| `/up` | Health check |

## Invitations, guests, RSVP

Each guest gets a random token. Personal links mark the invitation viewed. RSVP accepts yes, sorry, or maybe, party size, meal, and events. Unapproved guestbook notes stay hidden. Analytics store a visitor hash, not a raw IP.

Music never autoplays. Free trial includes **one listed event**; paid packs unlock styles, longer live windows, and optional message credits. Public sites show a light Invidora badge unless `remove_branding` is unlocked.

## Hostinger + invidora.com

1. Point `invidora.com` (and `www`) at your Hostinger site / A record.
2. Use `.env.hostinger.example` as the server `.env` (`APP_URL=https://invidora.com`).
3. Upload code, install Composer/Node deps, `npm run build`, `php artisan migrate --force`, `storage:link`.
4. Enable free SSL in hPanel. Set document root to `/public`.

## Production checklist (manual)

1. `APP_ENV=production`, `APP_DEBUG=false`, `APP_URL=https://invidora.com`, strong `APP_KEY`
2. MySQL + `php artisan migrate --force` + `storage:link`
3. `QUEUE_CONNECTION=database|redis` + `php artisan queue:work`
4. Cron: `* * * * * php artisan schedule:run`
5. Mail: SendGrid/Resend keys + verified from-domain
6. Payments: Razorpay and/or Stripe keys + webhook secrets
7. Optional: Twilio SMS/WhatsApp, S3 (`FILESYSTEM_DISK=s3`), Sentry DSN
8. Optional subdomains: wildcard DNS/TLS, `INVITE_ROOT_DOMAIN`, `SESSION_DOMAIN`
9. `PLATFORM_ADMIN_EMAILS` (e.g. `bmathank555@gmail.com`) for the owner `/admin` console
10. Confirm Admin dashboard checklist green and smoke-test register → create → publish → RSVP → checkout

## Owner admin (`/admin`)

Email-allowlist only via `PLATFORM_ADMIN_EMAILS` (seeded owner: `bmathank555@gmail.com`). Billing emails do **not** grant `/admin`. Custom Inertia console — not Filament.

- **Sign in:** `/admin/login` (separate from studio `/login`; guests hitting `/admin` land here)
- **Hardening:** non-owners get **404** (not 403); login errors are generic; `noindex` + no-store headers; throttled login; no festive loaders / SW on admin
- **Dashboard** — readiness checklist, mini analytics, recent users/events/payments
- **Users** — plan/credits, verify, disable, password reset
- **Events** — publish, site billing overrides, restore soft-deletes
- **Guests / Moderation / Billing / Integrations / Queues / Analytics / Catalog / Audit**
- Mutating actions write `admin_audit_logs`
- Secrets stay in `.env` (Integrations shows status + safe tests only)
- Legacy `/settings/ops` redirects to `/admin`

## Checks

```bash
php artisan optimize:clear
php artisan route:list
php artisan migrate --seed
npm run build
php artisan test
npx tsc --noEmit
```
