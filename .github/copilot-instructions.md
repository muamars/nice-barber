This repository is a small Next.js app (app router) used as a barbershop appointment register backed by Supabase. The file set is intentionally small — use the notes below to get productive quickly.

1. Big-picture architecture

- Next.js (app router) frontend lives under `src/app/`. `src/app/page.tsx` is the main UI that lists "Hadir hari ini" and contains the add modal.
- Server/API routes use the Next.js app-router route handlers in `src/app/api/**/route.ts`:
  - `/api/appointments` (GET today's appointments; POST create appointment — server sets date/time)
  - `/api/customers` (GET search by `q`, POST create customer)
  - `/api/masters` (GET treatments + capsters master lists)
  - `/api/export` (POST to export today's appointments — currently returns the records; placeholder for Google Sheets integration)
- Supabase access utilities are in `src/lib/supabaseClient.ts`:
  - `supabase` - client initialized from `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` for public reads
  - `supabaseAdmin()` - factory for an admin client using `SUPABASE_SERVICE_ROLE_KEY` (server only) for privileged reads/writes

2. Data model and flows (what to change when adding features)

- Core tables expected (see README.md): `customers`, `treatments`, `capsters`, `appointments`.
- Appointment creation flow:
  1. Client posts to `/api/appointments` with { customer_id, treatment_id, capster_id }
  2. The route handler writes `date` (YYYY-MM-DD) and `time` (HH:MM:SS) server-side before insert.
  3. Home page reads `/api/appointments` (GET) which filters by today's date server-side and orders by time.
- Customer search flow: client calls `/api/customers?q=NAME` and selects id or posts a new customer to `/api/customers`.

3. Integration points / externals

- Supabase: required env vars
  - NEXT_PUBLIC_SUPABASE_URL (public)
  - NEXT_PUBLIC_SUPABASE_ANON_KEY (public)
  - SUPABASE_SERVICE_ROLE_KEY (server-only, for scheduled export/use admin client)
- Google Sheets: placeholder helper at `src/lib/googleSheets.ts`. The repo does NOT include service-account credentials. To implement pushing to Google Sheets:
  - Use `googleapis` (install) and a service account JSON stored in `GOOGLE_SERVICE_ACCOUNT_KEY` env var and the sheet id in `GOOGLE_SHEET_ID`.
  - Wire that implementation into `src/app/api/export/route.ts` so POST does: fetch today's appointments (admin client) -> push rows -> return result.
  - NOTE: this repo now includes an implementation of `pushRowsToSheet` in `src/lib/googleSheets.ts` and `/api/export` will call it when `GOOGLE_SERVICE_ACCOUNT_KEY` + `GOOGLE_SHEET_ID` are present in the environment. The helper appends rows to `Sheet1!A:F` by default.

4. Developer workflows & commands

- Install dependencies (includes `@supabase/supabase-js`):
  - `npm install`
- Seed local masters + sample customer (uses service role key):
  - `npm run seed` (runs `scripts/seed.mjs`) — ensure `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are in env.
- Run dev server:
  - `npm run dev`
- Scheduler to call the export route: use Vercel Cron Jobs or GitHub Actions to POST `/api/export` at 22:00 and optionally write results to Google Sheets. `README.md` contains examples.

5. Project-specific conventions and gotchas

- No authentication: API routes assume app is internal; protect production `SUPABASE_SERVICE_ROLE_KEY` (server only) and do not expose it client-side.
- Date/time handling: appointment date is stored as `YYYY-MM-DD` and time is `HH:MM:SS` (server-generated). When changing this, update both `src/app/api/appointments/route.ts` and any export logic.
- UI is client-heavy and lives in `src/app/page.tsx` (currently a single file with modal + table). When splitting components, keep API calls matching the existing routes.
- Minimal shadcn style: components use Tailwind utility classes mimicking shadcn style but the repo does not use the official `shadcn/ui` package. Installing and replacing with `shadcn` components is possible but will require additional setup and packages.

6. Where to start editing for common tasks

- Add a field to appointments (e.g. price): update DB schema, update `src/app/api/appointments/route.ts` POST to accept/store it, update GET SELECT and the UI table in `src/app/page.tsx`.
- Implement Google Sheets push: implement `pushRowsToSheet` in `src/lib/googleSheets.ts` using `googleapis`, call it from `/api/export` after fetching today's appointments via `supabaseAdmin()`.
  - Already implemented: `src/lib/googleSheets.ts` uses dynamic import of `googleapis` and expects `GOOGLE_SERVICE_ACCOUNT_KEY` (JSON string) and `GOOGLE_SHEET_ID`.
- Add more master data or admin pages: add API routes in `src/app/api/*` and front-end pages under `src/app`.

7. Files to reference (quick map)

- UI: `src/app/page.tsx`
- API: `src/app/api/appointments/route.ts`, `src/app/api/customers/route.ts`, `src/app/api/masters/route.ts`, `src/app/api/export/route.ts`
- DB client: `src/lib/supabaseClient.ts`
- Google Sheets helper (placeholder): `src/lib/googleSheets.ts`
- Seed script: `scripts/seed.mjs`
- Project root docs: `README.md`

If you want, I can also:

- implement the Google Sheets push (requires `GOOGLE_SERVICE_ACCOUNT_KEY` + `GOOGLE_SHEET_ID` env vars), or
- swap the UI over to official `shadcn/ui` components and wire a small design-system folder.

Please tell me which follow-up you prefer or if any part of the architecture is unclear.
