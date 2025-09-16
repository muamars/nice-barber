This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

---

## Barbershop app specific

This project implements a simple appointment registration for a barbershop. It uses Supabase for data storage and provides an API route to export today's appointments (to be wired to Google Sheets).

Environment variables (set in your .env.local or in Vercel):

- NEXT_PUBLIC_SUPABASE_URL - your Supabase project URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY - public anon key
- SUPABASE_SERVICE_ROLE_KEY - service role key (server-only)
- GOOGLE_SERVICE_ACCOUNT_KEY - (optional) JSON service account credentials as a single-line JSON string for Google Sheets integration
- GOOGLE_SHEET_ID - (optional) Google Sheet ID to append export rows to

Database schema (recommended tables):

- customers: id (pk), name, whatsapp
- treatments: id (pk), name
- capsters: id (pk), name
- appointments: id (pk), date (YYYY-MM-DD), time (HH:MM:SS), customer_id (fk), treatment_id (fk), capster_id (fk)

How to run locally:

1. Install deps: npm install
2. Create .env.local with the env vars above. You can copy the template and fill values:

```powershell
copy .env.example .env.local
# then open .env.local in an editor and fill values
```

3. Seed master data: node scripts/seed.js
4. Run dev server: npm run dev

Export to Google Sheets:

- The route POST /api/export returns today's appointments and is intended to be called by a scheduler.
- You can implement a scheduled job (Vercel Cron Jobs, GitHub Actions scheduled workflow, or any server cron) that calls this route at 22:00 every day and writes the rows into a Google Sheet using a service account.

If you set `GOOGLE_SERVICE_ACCOUNT_KEY` and `GOOGLE_SHEET_ID`, the `/api/export` route will attempt to append today's appointments to `Sheet1` of that sheet when called.
