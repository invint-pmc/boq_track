-- =====================================================================
-- BOQ Project Tracker — Migration 0005
-- Entry Editing / Delete + Invoice Amount.
-- Minimal, additive changes only. No new tables. No architecture change.
-- No changes to authentication, RLS roles, or any other module's schema.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Invoice Amount on entry_header.
-- A single nullable column, populated only for entry_type = 'Invoice'.
-- entry_header.remarks already exists and is reused as-is (no change
-- needed there) to satisfy the "Remarks" part of Invoice Improvements.
-- ---------------------------------------------------------------------
alter table entry_header
  add column if not exists invoice_amount numeric(16,2);

-- ---------------------------------------------------------------------
-- No RLS policy changes required for Entry Editing or Delete Wrong
-- Entries.
--
-- Editing (update) and Delete of entry_header / entry_details are
-- already covered by the "admin update entry_header",
-- "admin update entry_details", "admin delete entry_header" and
-- "admin delete entry_details" policies created in migration 0003.
-- Managers remain read-only, enforced at the database level exactly
-- as before.
--
-- Deleting an entry_header row cascades to its entry_details rows via
-- the existing `entry_details.entry_header_id ... on delete cascade`
-- foreign key from migration 0001 — no other table references an
-- entry, so no delete ever "breaks" a relationship or another
-- historical record; the boq_item_progress view simply recalculates
-- from whatever entry_details remain.
--
-- boq_items still has no delete policy and the UI still never issues
-- a delete against boq_items (Archive/Restore only, per migration
-- 0004) — so a BOQ item with dependent delivery/invoice/installation/
-- storage records can never be deleted, satisfying that requirement
-- without any new guard logic.
-- ---------------------------------------------------------------------
