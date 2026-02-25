-- Migration 002: switch to UUID primary key + row_hash for true deduplication
-- A row is only a duplicate if every field is identical (same row_hash).

drop table if exists public.progress_logs;
drop table if exists public.contracts;

create table public.contracts (
  id uuid primary key default gen_random_uuid(),
  deal_id text not null,
  retailer_simple text,
  start_date date,
  end_date date,
  category_code text,
  country text,
  suggested_store_list text,
  retailer text,
  monthly_quota integer,
  notes text,
  months_of_collection integer,
  row_hash text unique,          -- MD5 of all fields; only exact-match rows are skipped
  created_at timestamptz default now()
);

create index idx_contracts_deal_id        on public.contracts(deal_id);
create index idx_contracts_retailer_simple on public.contracts(retailer_simple);
create index idx_contracts_country        on public.contracts(country);
create index idx_contracts_end_date       on public.contracts(end_date);
create index idx_contracts_category_code  on public.contracts(category_code);

-- Progress logs: keyed by (deal_id, retailer_simple, month) — no FK to contracts
-- so multiple contract rows for the same deal+retailer share one progress entry.
create table public.progress_logs (
  id uuid primary key default gen_random_uuid(),
  deal_id text not null,
  retailer_simple text not null default '',
  month date not null,
  responses_collected integer not null default 0,
  updated_by text,
  updated_at timestamptz default now(),
  unique(deal_id, retailer_simple, month)
);

create index idx_progress_logs_deal_id on public.progress_logs(deal_id);
create index idx_progress_logs_month   on public.progress_logs(month);

alter table public.contracts    enable row level security;
alter table public.progress_logs enable row level security;

create policy "Allow all for contracts"     on public.contracts     for all using (true) with check (true);
create policy "Allow all for progress_logs" on public.progress_logs for all using (true) with check (true);
