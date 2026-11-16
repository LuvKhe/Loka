do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'recovery_credentials' and column_name = 'code_hash'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'recovery_credentials' and column_name = 'recovery_hash'
  ) then
    alter table public.recovery_credentials rename column code_hash to recovery_hash;
  end if;
end $$;

alter table public.recovery_credentials add column if not exists recovery_hash text;

alter table public.recovery_credentials
  add column if not exists updated_at timestamptz not null default now();

revoke all on public.recovery_credentials from anon;
