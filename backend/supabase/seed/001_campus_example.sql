-- ============================================================
-- Loka — Seed: Example Campus
--
-- IMPORTANT: This is an EXAMPLE campus for development/testing.
-- Replace with your real campus coordinates before going to production.
-- Do NOT hard-code a real campus here without permission.
--
-- To add your real campus:
-- 1. Replace the lat/lng values below with your campus centre coordinates
-- 2. Set boundary_radius_metres to the approximate radius of your campus in metres
-- 3. Add real buildings with their coordinates
-- 4. Update the timezone to your campus IANA timezone
-- ============================================================

-- Example campus (fictional coordinates)
insert into public.campuses (
  id,
  university_name,
  campus_name,
  timezone,
  boundary_center_lat,
  boundary_center_lng,
  boundary_radius_metres
) values (
  '00000000-0000-0000-0000-000000000001',
  'Example University',
  'Main Campus',
  'Africa/Johannesburg',   -- Update to your timezone
  -26.3054,                -- Update to your campus centre latitude
  31.1367,                 -- Update to your campus centre longitude
  600                      -- Update to your campus radius in metres
) on conflict (id) do nothing;

-- Example buildings
insert into public.campus_buildings (campus_id, name, abbreviation, lat, lng, radius_metres) values
  ('00000000-0000-0000-0000-000000000001', 'Science Block',      'SCI',  -26.3045, 31.1355, 60),
  ('00000000-0000-0000-0000-000000000001', 'Library',            'LIB',  -26.3060, 31.1370, 60),
  ('00000000-0000-0000-0000-000000000001', 'Student Centre',     'SC',   -26.3070, 31.1360, 60),
  ('00000000-0000-0000-0000-000000000001', 'Engineering Block',  'ENG',  -26.3050, 31.1380, 60),
  ('00000000-0000-0000-0000-000000000001', 'Main Hall',          'MH',   -26.3040, 31.1365, 70),
  ('00000000-0000-0000-0000-000000000001', 'Lecture Theatre I',  'LT.I', -26.3055, 31.1350, 50),
  ('00000000-0000-0000-0000-000000000001', 'Seminar Block',      'SLT',  -26.3065, 31.1345, 50)
on conflict do nothing;
