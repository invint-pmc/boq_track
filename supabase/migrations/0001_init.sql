-- =====================================================================
-- BOQ Project Tracker — Initial Schema
-- Single-user BOQ execution tracker (Delivery / Invoice / Installation / Stored)
-- =====================================================================

-- ---------------------------------------------------------------------
-- Extensions
-- Both must exist before any table/index below uses them:
--   uuid-ossp -> uuid_generate_v4() (used by every primary key default)
--   pg_trgm   -> gin_trgm_ops (used by the boq_items description index)
-- Creating pg_trgm here, up front, instead of next to the index that
-- needs it, is the fix for a bug where the index was created before
-- the extension existed — which failed on a clean database and, since
-- `supabase db push` (and the Supabase SQL editor's "Run") execute a
-- migration file as one transaction, rolled back the ENTIRE migration,
-- silently leaving the database with zero tables.
-- ---------------------------------------------------------------------
create extension if not exists "uuid-ossp";
create extension if not exists pg_trgm;

-- ---------------------------------------------------------------------
-- Table: projects
-- ---------------------------------------------------------------------
create table if not exists projects (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  client_name text,
  location text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Table: categories
-- ---------------------------------------------------------------------
create table if not exists categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

insert into categories (name, sort_order) values
  ('Exhaust', 1),
  ('Fresh Air', 2),
  ('Lab Furniture', 3),
  ('Fume Hood', 4),
  ('Scrubber', 5),
  ('Electrical', 6),
  ('Plumbing', 7),
  ('Utility', 8)
on conflict (name) do nothing;

-- ---------------------------------------------------------------------
-- Table: boq_items
-- ---------------------------------------------------------------------
create table if not exists boq_items (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references projects(id) on delete cascade,
  category_id uuid references categories(id) on delete set null,
  boq_number text not null,
  description text not null,
  unit text not null default 'Nos',
  boq_qty numeric(14,3) not null default 0,
  rate numeric(14,2) not null default 0,
  amount numeric(16,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, boq_number)
);

create index if not exists idx_boq_items_project on boq_items(project_id);
create index if not exists idx_boq_items_category on boq_items(category_id);
create index if not exists idx_boq_items_boq_number on boq_items(boq_number);
create index if not exists idx_boq_items_description_trgm on boq_items using gin (description gin_trgm_ops);

-- ---------------------------------------------------------------------
-- Table: entry_header
-- One header per Delivery / Invoice / Installation / Stored transaction
-- ---------------------------------------------------------------------
create table if not exists entry_header (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references projects(id) on delete cascade,
  entry_type text not null check (entry_type in ('Delivery','Invoice','Installation','Stored')),
  document_number text not null,
  entry_date date not null default current_date,
  vendor text,
  remarks text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_entry_header_type on entry_header(entry_type);
create index if not exists idx_entry_header_docnum on entry_header(document_number);
create index if not exists idx_entry_header_date on entry_header(entry_date);
create index if not exists idx_entry_header_project on entry_header(project_id);

-- ---------------------------------------------------------------------
-- Table: entry_details
-- Line items under an entry header, referencing a BOQ item
-- ---------------------------------------------------------------------
create table if not exists entry_details (
  id uuid primary key default uuid_generate_v4(),
  entry_header_id uuid not null references entry_header(id) on delete cascade,
  boq_item_id uuid not null references boq_items(id) on delete cascade,
  quantity numeric(14,3) not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_entry_details_header on entry_details(entry_header_id);
create index if not exists idx_entry_details_boq_item on entry_details(boq_item_id);

-- ---------------------------------------------------------------------
-- View: boq_item_progress
-- Auto-calculated Delivered / Installed / Stored / Billed / Pending qty
-- ---------------------------------------------------------------------
create or replace view boq_item_progress as
select
  b.id as boq_item_id,
  b.project_id,
  b.category_id,
  b.boq_number,
  b.description,
  b.unit,
  b.boq_qty,
  b.rate,
  b.amount,
  coalesce(d.qty, 0) as delivered_qty,
  coalesce(i.qty, 0) as installed_qty,
  coalesce(s.qty, 0) as stored_qty,
  coalesce(inv.qty, 0) as billed_qty,
  (b.boq_qty - coalesce(d.qty, 0)) as pending_delivery_qty,
  (b.boq_qty - coalesce(i.qty, 0)) as pending_installation_qty
from boq_items b
left join (
  select ed.boq_item_id, sum(ed.quantity) as qty
  from entry_details ed
  join entry_header eh on eh.id = ed.entry_header_id
  where eh.entry_type = 'Delivery'
  group by ed.boq_item_id
) d on d.boq_item_id = b.id
left join (
  select ed.boq_item_id, sum(ed.quantity) as qty
  from entry_details ed
  join entry_header eh on eh.id = ed.entry_header_id
  where eh.entry_type = 'Installation'
  group by ed.boq_item_id
) i on i.boq_item_id = b.id
left join (
  select ed.boq_item_id, sum(ed.quantity) as qty
  from entry_details ed
  join entry_header eh on eh.id = ed.entry_header_id
  where eh.entry_type = 'Stored'
  group by ed.boq_item_id
) s on s.boq_item_id = b.id
left join (
  select ed.boq_item_id, sum(ed.quantity) as qty
  from entry_details ed
  join entry_header eh on eh.id = ed.entry_header_id
  where eh.entry_type = 'Invoice'
  group by ed.boq_item_id
) inv on inv.boq_item_id = b.id;

-- ---------------------------------------------------------------------
-- Trigger: keep updated_at fresh
-- ---------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_boq_items_updated on boq_items;
create trigger trg_boq_items_updated before update on boq_items
  for each row execute function set_updated_at();

drop trigger if exists trg_entry_header_updated on entry_header;
create trigger trg_entry_header_updated before update on entry_header
  for each row execute function set_updated_at();

drop trigger if exists trg_projects_updated on projects;
create trigger trg_projects_updated before update on projects
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------
-- Seed a default project (single-user app — one active project to start)
-- ---------------------------------------------------------------------
insert into projects (name, client_name, location)
select 'Default Project', 'Client', 'Site'
where not exists (select 1 from projects);

-- ---------------------------------------------------------------------
-- Row Level Security — single user app, open policies (anon key access)
-- ---------------------------------------------------------------------
alter table projects enable row level security;
alter table categories enable row level security;
alter table boq_items enable row level security;
alter table entry_header enable row level security;
alter table entry_details enable row level security;

drop policy if exists "allow all projects" on projects;
create policy "allow all projects" on projects for all using (true) with check (true);

drop policy if exists "allow all categories" on categories;
create policy "allow all categories" on categories for all using (true) with check (true);

drop policy if exists "allow all boq_items" on boq_items;
create policy "allow all boq_items" on boq_items for all using (true) with check (true);

drop policy if exists "allow all entry_header" on entry_header;
create policy "allow all entry_header" on entry_header for all using (true) with check (true);

drop policy if exists "allow all entry_details" on entry_details;
create policy "allow all entry_details" on entry_details for all using (true) with check (true);
