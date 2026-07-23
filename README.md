# BOQ Project Tracker

A small-team web app for tracking BOQ execution across construction, HVAC and laboratory projects — Delivery, Invoice, Installation and Stored quantity against every BOQ item. Access is limited to 6 named users (3 Admin, 3 Manager) via Supabase email + password login.

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

Database migrations are applied with the **Supabase CLI** — never by copy/pasting SQL into the dashboard's SQL editor. This is both safer (every apply is the exact, version-controlled file in this repo) and required in this project specifically: the SQL editor and `supabase db push` both run a migration file as a single transaction, and a partially-broken paste can silently leave you with an empty database, which is exactly the failure mode this workflow avoids.

There are two ways to run migrations. Use whichever matches how you work; most teams do both — CLI locally while developing, CI for the actual deploy.

### Option A — One-time / local (Supabase CLI)

```bash
npm install                              # installs the Supabase CLI as a project dependency
npm run db:login                         # opens a browser to authenticate the CLI
npm run db:link -- --project-ref <your-project-ref>   # find the ref in your Supabase project URL / Settings → General
npm run db:push                          # applies every migration in supabase/migrations/, in order
```

`db push` tracks what's already been applied in a `supabase_migrations.schema_migrations` table it creates in your database, so it's always safe to re-run — it only applies migrations that haven't run yet.

This creates:
- `projects`, `categories`, `boq_items`, `entry_header`, `entry_details` — all core tables, indexes, the `boq_item_progress` calculation view, and `updated_at` triggers, plus the 8 seeded categories and a seeded default project (`0001_init.sql`)
- `start_date` / `status` on `projects` and `attachment_url` on `entry_header` (`0002_project_fields_and_attachment_ready.sql`)
- `authorized_users` (the app's login allow-list), seeded with 6 placeholder rows, plus role-aware Row Level Security replacing the earlier open policies: any active authorized user can read; only Admins can write (`0003_auth_and_permissions.sql`)

### Option B — Automatic on every merge (GitHub Actions)

This repo includes `.github/workflows/supabase-migrations.yml`, which runs `supabase db push` automatically whenever a commit touching `supabase/migrations/**` lands on `main`. Once this is set up, nobody ever needs to run a migration by hand again — merging the PR *is* the deploy step.

To enable it, add these three repository secrets (**GitHub repo → Settings → Secrets and variables → Actions → New repository secret**):

| Secret | Where to find it |
|---|---|
| `SUPABASE_ACCESS_TOKEN` | Supabase dashboard → Account → Access Tokens → Generate new token |
| `SUPABASE_PROJECT_REF` | Supabase dashboard → Project Settings → General → Reference ID |
| `SUPABASE_DB_PASSWORD` | The database password set when the project was created (reset it under Project Settings → Database if you don't have it) |

After adding the secrets, you can trigger the workflow immediately without waiting for a migration-touching commit: **Actions tab → Deploy Supabase Migrations → Run workflow**.

### Then, either way:

1. In **Supabase → Authentication → Providers**, make sure **Email** is enabled. This app uses **email + password** sign-in — under **Auth → Providers → Email**, "Confirm email" can stay on or off depending on whether you want new users to verify their address, but there's no other config needed; magic link / OTP is not used anywhere in the app.
2. In **Supabase → Authentication → URL Configuration**, set **Site URL** (and add a **Redirect URL**) to wherever you're running the app — e.g. `http://localhost:3000` for local dev and your Netlify URL for production, and add `<your-app-url>/reset-password` as an additional Redirect URL. The password-reset email link redirects there.
3. **Create the actual Supabase Auth accounts for your 6 users.** There is no self-signup and no in-app "create user" flow (that's intentionally out of scope for now) — for each person, go to **Supabase → Authentication → Users → Add user**, enter their email, and either set a temporary password directly or leave it unset and have them use **Forgot Password** on the login screen once their `authorized_users` row exists.
3. Replace the 6 placeholder emails in `authorized_users` with your real ones, directly in the Supabase table editor (Name/Client/Location-style edits — there is no screen for this in the app by design):

   | Email | Role |
   |---|---|
   | admin1@yourcompany.com | Admin |
   | admin2@yourcompany.com | Admin |
   | admin3@yourcompany.com | Admin |
   | manager1@yourcompany.com | Manager |
   | manager2@yourcompany.com | Manager |
   | manager3@yourcompany.com | Manager |

   Set `active = false` on a row to revoke access without deleting it.

### If you forget to run migrations

Nothing breaks. If the app can reach Supabase but the schema hasn't been applied yet, it shows a **"Database Not Initialized"** screen with the exact commands above, instead of a broken login flow or a misleading "Access Denied" — see [`components/SetupRequired.tsx`](./components/SetupRequired.tsx).

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

There is no self-signup. Sign in with your email and password on the login screen. If your email isn't in `authorized_users` (or is marked inactive, or has no role assigned), you'll see **Access Denied** after signing in and cannot proceed.

- **Forgot Password** on the login screen sends a reset link to `/reset-password`, where you set a new password; you're then signed out of that temporary session and returned to the login screen to sign in normally with it.
- **Remember Me** (checked by default) keeps you signed in across browser restarts. Unchecked, your session still survives a page refresh but clears when you close the browser.
- Passwords are managed entirely by Supabase Auth — this app never stores or sees a plaintext password.

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

**Netlify only builds and serves the Next.js frontend — it has no awareness of Supabase and never runs SQL migrations.** Database setup (see [§1](#1-set-up-the-database)) is a separate step, done once via the Supabase CLI or automatically via the included GitHub Actions workflow. If you deploy to Netlify without having applied migrations yet, the app will detect this and show a "Database Not Initialized" screen rather than failing — but you still need to actually run the migrations for the app to be usable.

1. Push this project to a Git repository.
2. In Netlify: **Add new site → Import an existing project**, pick the repo.
3. Netlify auto-detects the build command (`npm run build`) and publish directory from `netlify.toml`.
4. Add the two environment variables from `.env.local` under **Site settings → Environment variables**.
5. Deploy.
6. Separately, apply database migrations using [Option A or Option B above](#1-set-up-the-database) — do this once per Supabase project, before or after the Netlify deploy, in either order.

## Project structure

```
app/                             Next.js App Router pages
  page.tsx                       Dashboard
  boq-register/                  BOQ Register
  universal-entry/                Universal Entry
  document-explorer/              Document Explorer
components/                      Reusable UI + feature components
  SetupRequired.tsx               "Database Not Initialized" screen
hooks/                           Data-fetching hooks (Supabase)
  useDatabaseStatus.ts            Detects whether migrations have been applied
lib/                             Types, calculations, Excel/PDF utilities, Zod schemas, Supabase client
supabase/
  config.toml                    Supabase CLI project config
  migrations/                    SQL migrations, applied in filename order
.github/workflows/
  supabase-migrations.yml        Auto-applies migrations to Supabase on merge to main
```

## Known issues fixed

- **`0001_init.sql` — extension created after use.** The `pg_trgm` extension was created *after* an index that depended on it (`gin_trgm_ops`). On a clean database this failed with `operator class "gin_trgm_ops" does not exist`, and because both `supabase db push` and the SQL editor apply a migration file as a single transaction, the error rolled back the *entire* migration — silently leaving the database with **zero tables**, even though every statement before the failing one looked like it succeeded. Fixed by moving the `create extension pg_trgm` line before the index that uses it. Verified by running all three migrations against a clean Postgres 16 database end-to-end with no errors.
