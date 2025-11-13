### GM Dashboard Xero – Postman Quickstart

Prereqs
- API running locally: `cd apps/api && npm run dev`
- You have authorized once via browser: open `http://localhost:4000/xero/connect` and complete consent.

Files
- `docs/postman/GM-Xero.postman_collection.json`
- `docs/postman/GM-Local.postman_environment.json`

Steps (Postman)
1. Open Postman → Import → select the two files above (Collection + Environment).
2. In the top-right, choose Environment: `GM Local`.
3. Optional: adjust the environment variables:
   - `api_base_url` (default `http://localhost:4000`)
   - `start_date`, `end_date` (date range for P&L)
4. In the left sidebar → Collections → `GM Dashboard Xero (Local)`:
   - Run `Authorize (opens browser)` if you haven’t already authorized in a browser window.
   - Run `Accounts` → should return `{ accounts: [...] }`.
   - Run `Profit & Loss` → returns a JSON object with `period`, `totals`, `categories`, `uncategorized`, and `raw`.

Troubleshooting
- If auth fails with `invalid_scope`:
  - Ensure your `apps/api/.env` has: `XERO_SCOPES="offline_access accounting.settings.read accounting.reports.read"`
  - Restart the API and run `Authorize` again.
- If redirect mismatch:
  - In Xero Developer Portal, the Redirect URI must be exactly `http://localhost:4000/xero/callback`.

Next
- Update category mapping in `apps/api/src/xero/mapping.ts` to tailor totals (e.g., match on account codes/names).



