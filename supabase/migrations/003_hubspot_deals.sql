-- HubSpot deals: additive table for HubSpot CSV import. Join to contracts by deal_id = hs_deal_id.

create table if not exists public.hubspot_deals (
  hs_deal_id text primary key,
  deal_name text,
  fa_arr_type text,
  hs_start_date date,
  hs_end_date date,
  hs_close_date date,
  deal_owner text,
  amount numeric,
  associated_company text,
  annual_recurring_revenue numeric,
  monthly_recurring_revenue numeric,
  deal_stage text,
  imported_at timestamptz default now()
);

alter table public.hubspot_deals enable row level security;

create policy "Allow all for hubspot_deals" on public.hubspot_deals
  for all using (true) with check (true);
