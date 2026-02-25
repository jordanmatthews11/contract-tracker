-- Job Summary Export: uploads from JobSummaryExport CSV (columns A, E, F, K, L, N, O).

create table if not exists public.job_summary_export (
  id uuid primary key default gen_random_uuid(),
  job_id text,
  name text,
  client text,
  start_date date,
  end_date date,
  bounty numeric,
  charge numeric,
  imported_at timestamptz default now()
);

alter table public.job_summary_export enable row level security;
create policy "Allow all for job_summary_export" on public.job_summary_export
  for all using (true) with check (true);
