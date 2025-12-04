# Allowed Origins (CORS) for Edge Functions

This value configures CORS for public-facing Supabase Edge Functions (e.g., `karaoke-availability`, `karaoke-holds`, `karaoke-book`, `venue-config-api`, `karaoke-pay-and-book`, `send-email`).

Environment secret key: `ALLOWED_ORIGINS`

Current value:

```
https://gm-dashboard.getproductbox.com,https://api.getproductbox.com,https://booking-widget.getproductbox.com,http://localhost:8082,http://localhost:8083,http://localhost:5173
```

## How to update

1) Supabase Dashboard → Edge Functions → Secrets → Add/Update `ALLOWED_ORIGINS` (comma-separated, no trailing slashes).

2) Redeploy the affected functions so the new secret is picked up (all of these live in the `gm-dashboard` repo under `supabase/functions`, and are shared by the GM Dashboard, booking widget, and Manor website frontends):
   - `karaoke-availability`
   - `karaoke-holds`
   - `karaoke-book`
   - `venue-config-api`
   - `karaoke-pay-and-book`
   - `send-email`

## Notes

- Only exact origins are matched (scheme + host + optional port). Do not include trailing slashes.
- Keep local dev origins (`http://localhost:8082`, `http://localhost:8083`, `http://localhost:5173`) during development.
- Production dashboard UI origin (`https://gm-dashboard.getproductbox.com`) and API origin (`https://api.getproductbox.com`) should always be present.


