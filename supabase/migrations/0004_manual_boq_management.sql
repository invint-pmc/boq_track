-- =====================================================================
-- BOQ Project Tracker — Migration 0004
-- Manual BOQ Management (Add / Edit / Archive / Restore).
-- Minimal, additive changes only. No new tables. No architecture change.
-- No changes to authentication, RLS roles, or any other module's schema.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Archive support on boq_items.
-- "archived" replaces permanent delete in the UI: archived rows are
-- filtered out of normal views but never removed, so all delivery /
-- installation / stored / billing history tied to them is preserved.
-- ---------------------------------------------------------------------
alter table boq_items
  add column if not exists archived boolean not null default false,
  add column if not exists archived_at timestamptz;

create index if not exists idx_boq_items_archived on boq_items(archived);

-- ---------------------------------------------------------------------
-- View: boq_item_progress
-- Recreated to additionally expose archived / archived_at so the BOQ
-- Register can filter active vs archived items. All previously
-- existing columns and joins are unchanged.
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
  b.archived,
  b.archived_at,
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
-- No RLS policy changes required.
-- Add BOQ / Edit BOQ / Archive / Restore are all plain inserts and
-- updates against boq_items, already covered by the existing
-- "admin write boq_items" / "admin update boq_items" policies from
-- migration 0003. No delete policy is added or used — the UI never
-- issues a delete against boq_items.
-- ---------------------------------------------------------------------
