-- =====================================================================
-- BOQ Project Tracker — Migration 0003
-- Simple role-based login (Supabase Auth, magic link) for exactly 6
-- named users. No signup, no user management UI, no new major tables.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Table: authorized_users
-- The only allow-list for who may use the app, and what role they hold.
-- Rows are managed directly in Supabase (table editor / SQL), never
-- from the application itself.
-- ---------------------------------------------------------------------
create table if not exists authorized_users (
  id uuid primary key default uuid_generate_v4(),
  email text not null unique,
  full_name text,
  role text not null check (role in ('Admin', 'Manager')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_authorized_users_email on authorized_users(email);

-- Seed 6 placeholder users (3 Admin, 3 Manager). Replace these emails
-- with real ones directly in Supabase — the app has no screen to do it.
insert into authorized_users (email, full_name, role) values
  ('admin1@yourcompany.com', 'Admin One', 'Admin'),
  ('admin2@yourcompany.com', 'Admin Two', 'Admin'),
  ('admin3@yourcompany.com', 'Admin Three', 'Admin'),
  ('manager1@yourcompany.com', 'Manager One', 'Manager'),
  ('manager2@yourcompany.com', 'Manager Two', 'Manager'),
  ('manager3@yourcompany.com', 'Manager Three', 'Manager')
on conflict (email) do nothing;

-- ---------------------------------------------------------------------
-- authorized_users RLS: a logged-in user may only ever read their own
-- row (enough for the app to resolve its own role). No insert/update/
-- delete policy exists at all, so the table is effectively read-only
-- to the application — it can only be changed directly in Supabase.
-- ---------------------------------------------------------------------
alter table authorized_users enable row level security;

drop policy if exists "self read authorized_users" on authorized_users;
create policy "self read authorized_users" on authorized_users
  for select
  using (email = auth.jwt() ->> 'email');

-- ---------------------------------------------------------------------
-- Helper functions used by policies below.
-- Both run with the caller's own privileges (not security definer),
-- which works because the policy above already lets a user read their
-- own authorized_users row — exactly the row these functions need.
-- ---------------------------------------------------------------------
create or replace function is_authorized_user()
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from authorized_users au
    where au.email = auth.jwt() ->> 'email' and au.active = true
  );
$$;

create or replace function current_app_role()
returns text
language sql
stable
as $$
  select au.role from authorized_users au
  where au.email = auth.jwt() ->> 'email' and au.active = true
  limit 1;
$$;

-- ---------------------------------------------------------------------
-- Replace the previous open ("allow all") policies with role-aware
-- ones. Read access requires being an active authorized user. Writes
-- (Import BOQ, Universal Entry, Project Settings) require the Admin
-- role — Managers are read-only everywhere, enforced at the database
-- level in addition to the UI hiding those actions.
-- ---------------------------------------------------------------------

-- projects — Admin can edit Project Settings, Manager can only read
drop policy if exists "allow all projects" on projects;
drop policy if exists "read projects" on projects;
drop policy if exists "admin write projects" on projects;
create policy "read projects" on projects
  for select using (is_authorized_user());
create policy "admin write projects" on projects
  for insert with check (current_app_role() = 'Admin');
create policy "admin update projects" on projects
  for update using (current_app_role() = 'Admin') with check (current_app_role() = 'Admin');
create policy "admin delete projects" on projects
  for delete using (current_app_role() = 'Admin');

-- categories — reference data, read-only in the app for everyone
drop policy if exists "allow all categories" on categories;
drop policy if exists "read categories" on categories;
drop policy if exists "admin write categories" on categories;
create policy "read categories" on categories
  for select using (is_authorized_user());
create policy "admin write categories" on categories
  for insert with check (current_app_role() = 'Admin');
create policy "admin update categories" on categories
  for update using (current_app_role() = 'Admin') with check (current_app_role() = 'Admin');
create policy "admin delete categories" on categories
  for delete using (current_app_role() = 'Admin');

-- boq_items — Import BOQ is Admin-only; both roles can read/export
drop policy if exists "allow all boq_items" on boq_items;
drop policy if exists "read boq_items" on boq_items;
drop policy if exists "admin write boq_items" on boq_items;
create policy "read boq_items" on boq_items
  for select using (is_authorized_user());
create policy "admin write boq_items" on boq_items
  for insert with check (current_app_role() = 'Admin');
create policy "admin update boq_items" on boq_items
  for update using (current_app_role() = 'Admin') with check (current_app_role() = 'Admin');
create policy "admin delete boq_items" on boq_items
  for delete using (current_app_role() = 'Admin');

-- entry_header — Universal Entry (create/edit/delete) is Admin-only
drop policy if exists "allow all entry_header" on entry_header;
drop policy if exists "read entry_header" on entry_header;
drop policy if exists "admin write entry_header" on entry_header;
create policy "read entry_header" on entry_header
  for select using (is_authorized_user());
create policy "admin write entry_header" on entry_header
  for insert with check (current_app_role() = 'Admin');
create policy "admin update entry_header" on entry_header
  for update using (current_app_role() = 'Admin') with check (current_app_role() = 'Admin');
create policy "admin delete entry_header" on entry_header
  for delete using (current_app_role() = 'Admin');

-- entry_details — same rule as entry_header, since they're one transaction
drop policy if exists "allow all entry_details" on entry_details;
drop policy if exists "read entry_details" on entry_details;
drop policy if exists "admin write entry_details" on entry_details;
create policy "read entry_details" on entry_details
  for select using (is_authorized_user());
create policy "admin write entry_details" on entry_details
  for insert with check (current_app_role() = 'Admin');
create policy "admin update entry_details" on entry_details
  for update using (current_app_role() = 'Admin') with check (current_app_role() = 'Admin');
create policy "admin delete entry_details" on entry_details
  for delete using (current_app_role() = 'Admin');
