create table if not exists public.push_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  endpoint    text not null unique,
  p256dh      text not null,
  auth        text not null,
  created_at  timestamptz not null default now(),
  constraint push_endpoint_https check (endpoint like 'https://%' and char_length(endpoint) <= 1000),
  constraint push_key_length check (char_length(p256dh) <= 200 and char_length(auth) <= 100)
);

create index if not exists push_subscriptions_user_idx on public.push_subscriptions(user_id);

alter table public.push_subscriptions enable row level security;

drop policy if exists "Users manage own push subscriptions" on public.push_subscriptions;
create policy "Users manage own push subscriptions"
  on public.push_subscriptions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

revoke all on public.push_subscriptions from anon;

create table if not exists public.notification_settings (
  user_id          uuid primary key references auth.users(id) on delete cascade,
  friend_requests  boolean not null default true,
  friend_accepted  boolean not null default true,
  updated_at       timestamptz not null default now()
);

alter table public.notification_settings enable row level security;

drop policy if exists "Users manage own notification settings" on public.notification_settings;
create policy "Users manage own notification settings"
  on public.notification_settings for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

revoke all on public.notification_settings from anon;
