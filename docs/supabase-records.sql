-- Extend public.records for unified form/admin storage
alter table public.records
  add column if not exists type text;

alter table public.records
  add column if not exists payload jsonb;

alter table public.records
  add column if not exists email text;

alter table public.records
  add column if not exists name text;

create index if not exists records_type_idx on public.records (type);
create index if not exists records_email_idx on public.records (email);
create index if not exists records_payload_gin on public.records using gin (payload);

-- RLS policies for anon access (adjust if you later add auth)
alter table public.records enable row level security;

drop policy if exists "records insert" on public.records;
create policy "records insert" on public.records
  for insert with check (true);

drop policy if exists "records select" on public.records;
create policy "records select" on public.records
  for select using (true);

drop policy if exists "records update" on public.records;
create policy "records update" on public.records
  for update using (true);

drop policy if exists "records delete" on public.records;
create policy "records delete" on public.records
  for delete using (true);
