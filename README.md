# BOQ Project Tracker

A small-team web app for tracking BOQ execution across construction, HVAC and laboratory projects — Delivery, Invoice, Installation and Stored quantity against every BOQ item. Access is limited to 6 named users (3 Admin, 3 Manager) via Supabase magic-link login.

This is **not** an ERP and **not** accounting software. It tracks physical/document progress only.

## Tech stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS
- Supabase (Postgres)
- React Hook Form + Zod
- TanStack Table
- Recharts
- xlsx (Excel import/export)
- jsPDF (PDF export)

## 1. Set up the database

1. Create a Supabase project (or use the one already configured in `.env.local`).
2. Open the Supabase SQL editor and run, in order:
   - `supabase/migrations/0001_init.sql` — creates all tables, indexes, the `boq_item_progress` calculation view, seeds the 8 categories, and seeds a default project.
   - `supabase/migrations/0002_project_fields_and_attachment_ready.sql` — adds `start_date` and `status` to the project, and a nullable `attachment_url` scaffold column on `entry_header` for future document-attachment support (no UI yet, no new table).
   - `supabase/migrations/0003_auth_and_permissions.sql` — creates `authorized_users` (the app's allow-list), seeds 6 placeholder users, and replaces the earlier open RLS policies with role-aware ones: any active authorized user can read; only Admins can write (Import BOQ, Universal Entry, Project Settings).

3. In **Supabase → Authentication → Providers**, make sure **Email** is enabled with the **magic link / OTP** flow (this is the default — no password required).
4. In **Supabase → Authentication → URL Configuration**, set **Site URL** (and add a **Redirect URL**) to wherever you're running the app — e.g. `http://localhost:3000` for local dev and your Netlify URL for production. The magic link redirects back here.
5. Replace the 6 placeholder emails in `authorized_users` with your real ones, directly in the Supabase table editor (Name/Client/Location-style edits — there is no screen for this in the app by design):

   | Email | Role |
   |---|---|
   | admin1@yourcompany.com | Admin |
   | admin2@yourcompany.com | Admin |
   | admin3@yourcompany.com | Admin |
   | manager1@yourcompany.com | Manager |
   | manager2@yourcompany.com | Manager |
   | manager3@yourcompany.com | Manager |

   Set `active = false` on a row to revoke access without deleting it.

## 2. Configure environment variables

`.env.local` is already populated with the Supabase URL and anon key you provided:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

If you deploy to a different Supabase project, update these two values (see `.env.example`).

## 3. Install and run

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Pages

| Page | Path | Purpose |
|---|---|---|
| Dashboard | `/` | Total BOQ value, Delivered/Installed/Stored/Billed %, pending qty, today's activity, charts |
| BOQ Register | `/boq-register` | Full BOQ list with computed progress, search, category filter, Excel import/export, click-through history panel grouped by Deliveries / Invoices / Installations / Stored Entries |
| Universal Entry | `/universal-entry` | One form to log Delivery / Invoice / Installation / Stored transactions. Document header is only Entry Type, Date, Document Number, Vendor, Remarks — no category. Click "Add Item" to open the BOQ Search dialog (optional category filter + search + list showing BOQ Number, Description, Category, Unit, BOQ Qty), add as many items as needed across any mix of categories, then enter quantities. |
| Document Explorer | `/document-explorer` | Filter by document number, vendor, date range and document type; view a document's full line-item grid; print or export to PDF |

Click the project name in the top bar to edit Project Name, Client Name, Location, Start Date and Status — this remains a single-project app with no hierarchy or multi-company support. Only Admins see this as clickable; Managers see it as plain text.

## Login & roles

There is no signup. Enter your email on the login screen, click **Send Magic Link**, then click the link in your inbox — no password. If your email isn't in `authorized_users` (or is marked inactive), you'll see **ACCESS DENIED** and cannot proceed.

| | Admin | Manager |
|---|---|---|
| Dashboard, BOQ Register, Document Explorer | ✓ | ✓ |
| Print / Export PDF / Export Excel | ✓ | ✓ |
| Universal Entry (create/edit entries) | ✓ | Hidden — link and page both blocked |
| Import BOQ | ✓ | Button hidden |
| Project Settings (edit) | ✓ | Read-only, no edit affordance |

The Universal Entry nav link and Import BOQ button are hidden outright for Managers, not just disabled. Even if a Manager navigates to `/universal-entry` directly by URL, the page shows a read-only notice instead of the form — and every write (Import BOQ, create/edit/delete an entry, edit the project) is also blocked at the database level by Supabase Row Level Security, regardless of what the UI shows.

## Importing your BOQ

Go to **BOQ Register → Import Excel**. The file must have these columns (a template button is provided in the dialog):

```
BOQ Number | Category | Description | Unit | BOQ Qty | Rate | Amount
```

Category values should match one of: Exhaust, Fresh Air, Lab Furniture, Fume Hood, Scrubber, Electrical, Plumbing, Utility (unmatched categories still import, just uncategorized). Re-importing a BOQ Number already in the system updates that row in place.

## How progress is calculated

Every BOQ item's Delivered / Installed / Stored / Billed quantity is the **sum of Universal Entry line items** of the matching type recorded against it (via the `boq_item_progress` SQL view — always live, never manually maintained). Pending Delivery = BOQ Qty − Delivered; Pending Installation = BOQ Qty − Installed.

Quantities are **never blocked** from exceeding the BOQ quantity — Universal Entry only shows a non-blocking warning when a save would push a running total past the BOQ quantity, since real-world deliveries/installations sometimes do legitimately exceed the original BOQ.

## Deploying to Netlify

This repo includes `netlify.toml` configured for the official Next.js runtime plugin.

1. Push this project to a Git repository.
2. In Netlify: **Add new site → Import an existing project**, pick the repo.
3. Netlify auto-detects the build command (`npm run build`) and publish directory from `netlify.toml`.
4. Add the two environment variables from `.env.local` under **Site settings → Environment variables**.
5. Deploy.

## Project structure

```
app/                     Next.js App Router pages
  page.tsx               Dashboard
  boq-register/          BOQ Register
  universal-entry/        Universal Entry
  document-explorer/      Document Explorer
components/              Reusable UI + feature components
hooks/                   Data-fetching hooks (Supabase)
lib/                     Types, calculations, Excel/PDF utilities, Zod schemas, Supabase client
supabase/migrations/     SQL migration(s)
```
