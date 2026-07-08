-- GrowEasy AI CSV Importer schema
-- One import run produces many leads and (optionally) many skipped rows.

create extension if not exists "pgcrypto";

-- A single upload / extraction run.
create table if not exists imports (
  id             uuid primary key default gen_random_uuid(),
  filename       text        not null,
  total_rows     integer     not null default 0,
  total_imported integer     not null default 0,
  total_skipped  integer     not null default 0,
  mapping        jsonb       not null default '{}'::jsonb, -- Phase 1 column mapping
  status         text        not null default 'completed', -- processing | completed | failed
  created_at     timestamptz not null default now()
);

-- Successfully extracted CRM records.
create table if not exists leads (
  id                           uuid primary key default gen_random_uuid(),
  import_id                    uuid not null references imports(id) on delete cascade,
  created_at                   text default '',
  name                         text default '',
  email                        text default '',
  country_code                 text default '',
  mobile_without_country_code  text default '',
  company                      text default '',
  city                         text default '',
  state                        text default '',
  country                      text default '',
  lead_owner                   text default '',
  crm_status                   text default '',
  crm_note                     text default '',
  data_source                  text default '',
  possession_time              text default '',
  description                  text default '',
  inserted_at                  timestamptz not null default now()
);

-- Rows that were dropped, with the reason and the original data.
create table if not exists skipped_rows (
  id          uuid primary key default gen_random_uuid(),
  import_id   uuid not null references imports(id) on delete cascade,
  row_index   integer not null,
  reason      text    not null,
  raw         jsonb   not null default '{}'::jsonb,
  inserted_at timestamptz not null default now()
);

create index if not exists idx_leads_import_id        on leads(import_id);
create index if not exists idx_skipped_rows_import_id on skipped_rows(import_id);
create index if not exists idx_imports_created_at      on imports(created_at desc);
