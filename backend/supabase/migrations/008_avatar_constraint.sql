alter table public.profiles
  drop constraint if exists avatar_url_format;
alter table public.profiles
  add constraint avatar_url_format
  check (
    avatar_url is null
    or (avatar_url like 'data:image/jpeg;base64,%' and char_length(avatar_url) <= 60000)
  );
