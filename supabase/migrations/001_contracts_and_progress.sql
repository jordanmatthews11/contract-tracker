-- Contract Tracker: contracts (from Mapping File CSV) and progress_logs (team updates)

-- One row per contract-retailer (same deal_id can have multiple retailers)
create table if not exists public.contracts (
  deal_id text not null,
  retailer_simple text not null,
  start_date date,
  end_date date,
  category_code text,
  country text,
  suggested_store_list text,
  retailer text,
  monthly_quota integer,
  notes text,
  months_of_collection integer,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  primary key (deal_id, retailer_simple)
);

create table if not exists public.progress_logs (
  id uuid primary key default gen_random_uuid(),
  deal_id text not null,
  retailer_simple text not null,
  month date not null,
  responses_collected integer not null default 0,
  updated_by text,
  updated_at timestamptz default now(),
  unique(deal_id, retailer_simple, month)
);

alter table public.progress_logs
  add constraint fk_progress_contract
  foreign key (deal_id, retailer_simple) references public.contracts(deal_id, retailer_simple) on delete cascade;

create index if not exists idx_progress_logs_deal_id on public.progress_logs(deal_id);
create index if not exists idx_progress_logs_month on public.progress_logs(month);
create index if not exists idx_contracts_country on public.contracts(country);
create index if not exists idx_contracts_category_code on public.contracts(category_code);
create index if not exists idx_contracts_end_date on public.contracts(end_date);

-- Allow service role and anon to read/write (for app use; tighten with RLS later if needed)
alter table public.contracts enable row level security;
alter table public.progress_logs enable row level security;

create policy "Allow all for contracts" on public.contracts for all using (true) with check (true);
create policy "Allow all for progress_logs" on public.progress_logs for all using (true) with check (true);
