alter table public.profiles
  add column if not exists terms_version text,
  add column if not exists terms_accepted_at timestamptz;

revoke update on public.profiles from anon, authenticated;
grant update (
  display_name,
  avatar_url,
  status_override,
  status_override_set_at,
  terms_version,
  terms_accepted_at
) on public.profiles to authenticated;

revoke update on public.friend_requests from anon, authenticated;
grant update (status) on public.friend_requests to authenticated;

drop policy if exists "Users create friend requests from themselves" on public.friend_requests;
create policy "Users create friend requests from themselves"
  on public.friend_requests for insert
  with check (
    auth.uid() = from_user_id
    and from_user_id <> to_user_id
    and status = 'pending'
  );

drop policy if exists "Recipient can update request status" on public.friend_requests;
create policy "Recipient can update request status"
  on public.friend_requests for update
  using (auth.uid() = to_user_id)
  with check (auth.uid() = to_user_id and status in ('accepted', 'declined'));

alter function public.are_friends(uuid, uuid) set search_path = public;

alter table public.profiles
  drop constraint if exists display_name_length;
alter table public.profiles
  add constraint display_name_length
  check (char_length(display_name) between 1 and 40) not valid;

create table if not exists public.rate_limits (
  user_id       uuid not null,
  action        text not null,
  window_start  timestamptz not null default now(),
  hits          integer not null default 0,
  primary key (user_id, action)
);

alter table public.rate_limits enable row level security;

revoke all on public.rate_limits from anon, authenticated;

create or replace function public.hit_rate_limit(
  p_user_id        uuid,
  p_action         text,
  p_max_hits       integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hits integer;
begin
  insert into public.rate_limits as r (user_id, action, window_start, hits)
  values (p_user_id, p_action, now(), 1)
  on conflict (user_id, action) do update
    set window_start = case
          when r.window_start < now() - make_interval(secs => p_window_seconds)
          then now()
          else r.window_start
        end,
        hits = case
          when r.window_start < now() - make_interval(secs => p_window_seconds)
          then 1
          else r.hits + 1
        end
  returning r.hits into v_hits;

  return v_hits <= p_max_hits;
end;
$$;

revoke execute on function public.hit_rate_limit(uuid, text, integer, integer)
  from public, anon, authenticated;
grant execute on function public.hit_rate_limit(uuid, text, integer, integer)
  to service_role;
