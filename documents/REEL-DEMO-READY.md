# Instagram Reel demo — global audience (production + local)

Polished **destination wedding** sample for worldwide Instagram reach.

## Sample account
- **Email:** `demo@invidora.com`
- **Password:** `InvidoraDemo2026!`
- **Couple:** Elena Rossi & Marcus Chen
- **Venue:** Canaves Oia Epitome, Santorini, Greece
- **Date:** 19 Sep 2026 · 5:00 PM (Europe/Athens)
- **Guests:** Sofia (IT), James (UK), Aya (JP)

## Production URLs (record these)
1. Login: https://invidora.com/login  
2. Card: https://invidora.com/events/{ID}/card  
3. Studio / share: https://invidora.com/events/{ID}  
4. Live site: https://elena-marcus.invidora.com  
5. Guest RSVP: see `storage/app/reel-demo-account.json` on server (or local `documents/reel-demo-account.json`)

Exact IDs/links are printed by:

```bash
php artisan reel:prepare-demo
```

## Re-seed anytime
```bash
php artisan reel:prepare-demo
```
