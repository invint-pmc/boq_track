-- =====================================================================
-- BOQ Project Tracker — Migration 0002
-- Minimal, additive changes only. No new tables. No architecture change.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Project fields: Start Date + Status (single project, no hierarchy)
-- ---------------------------------------------------------------------
alter table projects
  add column if not exists start_date date,
  add column if not exists status text not null default 'Active';

alter table projects
  drop constraint if exists projects_status_check;

alter table projects
  add constraint projects_status_check
  check (status in ('Planning', 'Active', 'On Hold', 'Completed'));

-- ---------------------------------------------------------------------
-- Attachment readiness (scaffold only — no UI, no storage bucket wired
-- up yet). A single nullable column keeps entry_header future-ready for
-- attaching a scanned DC/invoice without adding a new table now.
-- ---------------------------------------------------------------------
alter table entry_header
  add column if not exists attachment_url text;
