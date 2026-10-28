drop policy if exists "Friends read privacy settings" on public.privacy_settings;
create policy "Friends read privacy settings"
  on public.privacy_settings for select
  using (public.are_friends(auth.uid(), user_id));

alter table public.profiles
  add column if not exists bio text;

alter table public.profiles
  drop constraint if exists bio_length;
alter table public.profiles
  add constraint bio_length
  check (bio is null or char_length(bio) <= 160);

grant update (bio) on public.profiles to authenticated;

alter table public.profiles
  drop constraint if exists display_name_length;
alter table public.profiles
  add constraint display_name_length
  check (char_length(display_name) between 1 and 50) not valid;
