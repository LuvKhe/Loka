-- ============================================================
-- Loka — Migration 001: Initial Schema
-- ============================================================

-- Enable required extensions
create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- ============================================================
-- CAMPUSES
-- ============================================================

create table public.campuses (
  id                      uuid primary key default gen_random_uuid(),
  university_name         text not null,
  campus_name             text not null,
  timezone                text not null default 'UTC',
  boundary_center_lat     double precision not null,
  boundary_center_lng     double precision not null,
  boundary_radius_metres  integer not null default 500,
  created_at              timestamptz not null default now()
);

comment on table public.campuses is
  'University campuses. Configurable — not hard-coded to a single institution.';

create table public.campus_buildings (
  id              uuid primary key default gen_random_uuid(),
  campus_id       uuid not null references public.campuses(id) on delete cascade,
  name            text not null,
  abbreviation    text,
  lat             double precision not null,
  lng             double precision not null,
  radius_metres   integer not null default 50,
  created_at      timestamptz not null default now()
);

comment on table public.campus_buildings is
  'Named buildings on a campus. Used to convert GPS → place label.';

-- ============================================================
-- PROFILES
-- ============================================================

create table public.profiles (
  id                    uuid primary key references auth.users(id) on delete cascade,
  display_name          text not null,
  avatar_url            text,
  university            text not null,
  campus_id             uuid references public.campuses(id),
  loka_id               text not null unique,
  status_override       text check (status_override in ('free')),
  status_override_set_at timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

comment on column public.profiles.loka_id is
  'Public friend code. Random, human-readable, never derived from UUID. e.g. K7M2-P9RQ';
comment on column public.profiles.status_override is
  'null = automatic (from timetable). ''free'' = user manually set Free.';

-- Keep updated_at current
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ============================================================
-- RECOVERY CREDENTIALS
-- ============================================================

create table public.recovery_credentials (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null unique references auth.users(id) on delete cascade,
  recovery_hash   text not null,
  created_at      timestamptz not null default now()
);

comment on table public.recovery_credentials is
  'Only the bcrypt hash of the recovery code is stored. The code itself is never retained.';

-- ============================================================
-- PRIVACY SETTINGS
-- ============================================================

create table public.privacy_settings (
  user_id             uuid primary key references auth.users(id) on delete cascade,
  location_sharing    boolean not null default true,
  show_current_class  boolean not null default true,
  show_timetable      boolean not null default false,
  show_availability   boolean not null default true,
  friends_can_see_me  boolean not null default true,
  updated_at          timestamptz not null default now()
);

create trigger privacy_settings_updated_at
  before update on public.privacy_settings
  for each row execute function public.set_updated_at();

-- ============================================================
-- FRIEND REQUESTS
-- ============================================================

create table public.friend_requests (
  id            uuid primary key default gen_random_uuid(),
  from_user_id  uuid not null references auth.users(id) on delete cascade,
  to_user_id    uuid not null references auth.users(id) on delete cascade,
  status        text not null default 'pending'
                  check (status in ('pending', 'accepted', 'declined')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  -- Prevent duplicate requests in either direction
  constraint no_self_request check (from_user_id != to_user_id),
  unique (from_user_id, to_user_id)
);

create trigger friend_requests_updated_at
  before update on public.friend_requests
  for each row execute function public.set_updated_at();

-- ============================================================
-- FRIENDSHIPS
-- ============================================================

create table public.friendships (
  id          uuid primary key default gen_random_uuid(),
  user_a      uuid not null references auth.users(id) on delete cascade,
  user_b      uuid not null references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  -- Canonical ordering: smaller UUID first to prevent (A,B) and (B,A) duplicates
  constraint ordered_users check (user_a < user_b),
  unique (user_a, user_b)
);

-- Helper: check if two users are friends (used in RLS policies)
create or replace function public.are_friends(user_x uuid, user_y uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.friendships
    where (user_a = least(user_x, user_y) and user_b = greatest(user_x, user_y))
  );
$$;

-- ============================================================
-- TIMETABLE ENTRIES
-- ============================================================

create table public.timetable_entries (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  day_of_week   smallint not null check (day_of_week between 1 and 7),
  start_time    time not null,
  end_time      time not null,
  subject_code  text not null,
  subject_name  text,
  group_name    text,
  venue         text,
  room          text,
  lecturer      text,
  notes         text,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint end_after_start check (end_time > start_time)
);

comment on column public.timetable_entries.day_of_week is
  '1=Monday, 2=Tuesday, ..., 7=Sunday';

create index timetable_entries_user_day
  on public.timetable_entries (user_id, day_of_week)
  where is_active = true;

create trigger timetable_entries_updated_at
  before update on public.timetable_entries
  for each row execute function public.set_updated_at();

-- ============================================================
-- ACTIVE LOCATIONS
-- (one row per user — upserted, never appended)
-- Raw GPS is NEVER stored here.
-- ============================================================

create table public.active_locations (
  user_id             uuid primary key references auth.users(id) on delete cascade,
  campus_building_id  uuid references public.campus_buildings(id) on delete set null,
  place_label         text not null,
  updated_at          timestamptz not null default now()
);

comment on table public.active_locations is
  'Temporary live location — one row per user, upsert only.
   Contains only approximate place labels, never raw GPS coordinates.
   Row is deleted when user leaves campus or disables sharing.
   No location history is retained.';

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Enable RLS on all tables
alter table public.campuses           enable row level security;
alter table public.campus_buildings   enable row level security;
alter table public.profiles           enable row level security;
alter table public.recovery_credentials enable row level security;
alter table public.privacy_settings   enable row level security;
alter table public.friend_requests    enable row level security;
alter table public.friendships        enable row level security;
alter table public.timetable_entries  enable row level security;
alter table public.active_locations   enable row level security;

-- ---- Campuses (public read) ----
create policy "Anyone can read campuses"
  on public.campuses for select using (true);

create policy "Anyone can read campus buildings"
  on public.campus_buildings for select using (true);

-- ---- Profiles ----
create policy "Users read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Friends read public profile fields"
  on public.profiles for select
  using (public.are_friends(auth.uid(), id));

create policy "Users insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ---- Recovery credentials (owner only, never readable by others) ----
create policy "Users manage own recovery credentials"
  on public.recovery_credentials for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---- Privacy settings ----
create policy "Users manage own privacy settings"
  on public.privacy_settings for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---- Friend requests ----
create policy "Users see their own friend requests"
  on public.friend_requests for select
  using (auth.uid() = from_user_id or auth.uid() = to_user_id);

create policy "Users create friend requests from themselves"
  on public.friend_requests for insert
  with check (auth.uid() = from_user_id);

create policy "Recipient can update request status"
  on public.friend_requests for update
  using (auth.uid() = to_user_id)
  with check (auth.uid() = to_user_id);

-- ---- Friendships ----
create policy "Users see their own friendships"
  on public.friendships for select
  using (auth.uid() = user_a or auth.uid() = user_b);

-- Friendships are created server-side (edge function) only
-- No direct insert from client

-- ---- Timetable entries ----
create policy "Users manage own timetable"
  on public.timetable_entries for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Friends read timetable if show_timetable is enabled"
  on public.timetable_entries for select
  using (
    public.are_friends(auth.uid(), user_id)
    and exists (
      select 1 from public.privacy_settings ps
      where ps.user_id = timetable_entries.user_id
        and ps.show_timetable = true
        and ps.friends_can_see_me = true
    )
  );

-- ---- Active locations ----
create policy "Users manage own location"
  on public.active_locations for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Friends read location if sharing enabled"
  on public.active_locations for select
  using (
    public.are_friends(auth.uid(), user_id)
    and exists (
      select 1 from public.privacy_settings ps
      where ps.user_id = active_locations.user_id
        and ps.location_sharing = true
        and ps.friends_can_see_me = true
    )
  );
