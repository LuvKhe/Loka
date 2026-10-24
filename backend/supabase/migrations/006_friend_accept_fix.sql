drop policy if exists "Read profiles of pending requesters" on public.profiles;
create policy "Read profiles of pending requesters"
  on public.profiles for select
  using (
    exists (
      select 1
      from public.friend_requests r
      where r.from_user_id = profiles.id
        and r.to_user_id = auth.uid()
        and r.status = 'pending'
    )
  );

create or replace function public.accept_friend_request(
  p_request_id uuid,
  p_user_id    uuid
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_from uuid;
  v_to   uuid;
begin
  select from_user_id, to_user_id
  into   v_from, v_to
  from   public.friend_requests
  where  id = p_request_id
    and  to_user_id = p_user_id
    and  status in ('pending', 'accepted')
  for update;

  if not found then
    raise exception 'friend_request_not_found';
  end if;

  update public.friend_requests
  set    status = 'accepted'
  where  id = p_request_id;

  insert into public.friendships (user_a, user_b)
  values (least(v_from, v_to), greatest(v_from, v_to))
  on conflict (user_a, user_b) do nothing;

  return 'ok';
end;
$$;

revoke execute on function public.accept_friend_request(uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.accept_friend_request(uuid, uuid)
  to service_role;

insert into public.friendships (user_a, user_b)
select least(from_user_id, to_user_id), greatest(from_user_id, to_user_id)
from public.friend_requests
where status = 'accepted'
on conflict (user_a, user_b) do nothing;
