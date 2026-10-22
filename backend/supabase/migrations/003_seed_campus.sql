-- ============================================================
-- SEED: Kwaluseni campus and buildings
-- ============================================================
-- Derived from: KWALUSENI LECTURING TIMETABLE (FULL TIME) - UPDATED
-- Generated on 02 Oct 26 — 32-page timetable covering all programmes.
--
-- Location codes found in the timetable are used as-is so that
-- users can match them to what appears on their printed timetable.

-- Insert the default campus (University of Eswatini, Kwaluseni)
insert into public.campuses (id, university_name, campus_name)
values (
  'a0000000-0000-0000-0000-000000000001',
  'University of Eswatini',
  'Kwaluseni Campus'
)
on conflict (id) do update set
  university_name = excluded.university_name,
  campus_name     = excluded.campus_name;

-- ============================================================
-- Buildings / venues — keyed by the code that appears on timetables.
-- The `name` is the human-readable display label used in the app.
-- The `abbreviation` is the timetable code students recognise.
-- lat/lng are left as 0.0 — update when coordinates are known.
-- ============================================================
insert into public.campus_buildings (campus_id, name, abbreviation, lat, lng)
values
  -- G-block lecture rooms
  ('a0000000-0000-0000-0000-000000000001', 'G-Block Room 001',        'G.001',        0.0, 0.0),
  ('a0000000-0000-0000-0000-000000000001', 'G-Block Rooms 005/006',   'G.005/G.006',  0.0, 0.0),
  ('a0000000-0000-0000-0000-000000000001', 'G-Block Room 102',        'G.102',        0.0, 0.0),
  ('a0000000-0000-0000-0000-000000000001', 'G-Block Room 103',        'G.103',        0.0, 0.0),
  ('a0000000-0000-0000-0000-000000000001', 'G-Block Room 105',        'G.105',        0.0, 0.0),
  ('a0000000-0000-0000-0000-000000000001', 'G-Block Room 106',        'G.106',        0.0, 0.0),

  -- A-block (humanities / social sciences)
  ('a0000000-0000-0000-0000-000000000001', 'A-Block Room A2.1',       'A2.1',         0.0, 0.0),
  ('a0000000-0000-0000-0000-000000000001', 'A-Block Room A2.2',       'A2.2',         0.0, 0.0),
  ('a0000000-0000-0000-0000-000000000001', 'A-Block Room A2.3',       'A2.3',         0.0, 0.0),
  ('a0000000-0000-0000-0000-000000000001', 'A-Block Room A2.5',       'A2.5',         0.0, 0.0),
  ('a0000000-0000-0000-0000-000000000001', 'A-Block Room A2.6',       'A2.6',         0.0, 0.0),
  ('a0000000-0000-0000-0000-000000000001', 'A-Block Room A3.1',       'A3.1',         0.0, 0.0),
  ('a0000000-0000-0000-0000-000000000001', 'A-Block Room A3.2',       'A3.2',         0.0, 0.0),
  ('a0000000-0000-0000-0000-000000000001', 'A-Block Room A4.1',       'A4.1',         0.0, 0.0),
  ('a0000000-0000-0000-0000-000000000001', 'A-Block Room A4.2',       'A4.2',         0.0, 0.0),
  ('a0000000-0000-0000-0000-000000000001', 'A-Block Room A4.3',       'A4.3',         0.0, 0.0),
  ('a0000000-0000-0000-0000-000000000001', 'A-Block Room A4.4',       'A4.4',         0.0, 0.0),
  ('a0000000-0000-0000-0000-000000000001', 'A-Block Room A4.5',       'A4.5',         0.0, 0.0),

  -- B-block
  ('a0000000-0000-0000-0000-000000000001', 'B-Block Room B1.2',       'B.1.2',        0.0, 0.0),
  ('a0000000-0000-0000-0000-000000000001', 'B-Block Room B1.3',       'B.1.3',        0.0, 0.0),
  ('a0000000-0000-0000-0000-000000000001', 'B-Block Room B1.6',       'B.1.6',        0.0, 0.0),
  ('a0000000-0000-0000-0000-000000000001', 'B-Block Room B2.6',       'B.2.6',        0.0, 0.0),
  ('a0000000-0000-0000-0000-000000000001', 'B-Block Room B3.1',       'B.3.1',        0.0, 0.0),
  ('a0000000-0000-0000-0000-000000000001', 'B-Block Room B3.2',       'B.3.2',        0.0, 0.0),

  -- C-block
  ('a0000000-0000-0000-0000-000000000001', 'C-Block Room C1.8',       'C.1.8',        0.0, 0.0),
  ('a0000000-0000-0000-0000-000000000001', 'C-Block Room C1.9',       'C.1.9',        0.0, 0.0),
  ('a0000000-0000-0000-0000-000000000001', 'C-Block Room C1.10',      'C.1.10',       0.0, 0.0),

  -- Science block
  ('a0000000-0000-0000-0000-000000000001', 'Science Block S1.23',     'S.1.23',       0.0, 0.0),
  ('a0000000-0000-0000-0000-000000000001', 'Science Block S1.27',     'S.1.27',       0.0, 0.0),
  ('a0000000-0000-0000-0000-000000000001', 'Science Block S2.55',     'S.2.55',       0.0, 0.0),

  -- Chemistry labs
  ('a0000000-0000-0000-0000-000000000001', 'Chemistry Lab CH2.1',     'CH2.1',        0.0, 0.0),
  ('a0000000-0000-0000-0000-000000000001', 'Chemistry Lab CH2.8',     'CH2.8',        0.0, 0.0),

  -- Physics labs
  ('a0000000-0000-0000-0000-000000000001', 'Physics Lab PH2.1',       'PH2.1',        0.0, 0.0),
  ('a0000000-0000-0000-0000-000000000001', 'Physics Lab PH2.3',       'PH2.3',        0.0, 0.0),

  -- Biology labs
  ('a0000000-0000-0000-0000-000000000001', 'Biology Lab BL2.1',       'BL.2.1',       0.0, 0.0),
  ('a0000000-0000-0000-0000-000000000001', 'Biology Lab BL2.6',       'BL.2.6',       0.0, 0.0),

  -- Electrical Engineering labs
  ('a0000000-0000-0000-0000-000000000001', 'EE Lab EE2.1',            'EE 2.1',       0.0, 0.0),
  ('a0000000-0000-0000-0000-000000000001', 'EE Lab EE2.2',            'EE 2.2',       0.0, 0.0),
  ('a0000000-0000-0000-0000-000000000001', 'EE Lab EE2.3',            'EE 2.3',       0.0, 0.0),
  ('a0000000-0000-0000-0000-000000000001', 'EE Lab EE2.4',            'EE 2.4',       0.0, 0.0),

  -- Materials Science
  ('a0000000-0000-0000-0000-000000000001', 'Materials Science MS2.1', 'MS 2.1',       0.0, 0.0),
  ('a0000000-0000-0000-0000-000000000001', 'Materials Science MS2.3', 'MS 2.3',       0.0, 0.0),
  ('a0000000-0000-0000-0000-000000000001', 'Materials Science MS2.4', 'MS 2.4',       0.0, 0.0),

  -- SC Lecture Theatres
  ('a0000000-0000-0000-0000-000000000001', 'SC Lecture Theatre I',    'SC.LEC.TH.I',  0.0, 0.0),
  ('a0000000-0000-0000-0000-000000000001', 'SC Lecture Theatre II',   'SC.LEC.TH.II', 0.0, 0.0),

  -- MFAC rooms (Media, Film, Arts & Communications building)
  ('a0000000-0000-0000-0000-000000000001', 'MFAC Room 1',             'MFAC Room 1',  0.0, 0.0),
  ('a0000000-0000-0000-0000-000000000001', 'MFAC Room 2',             'MFAC Room 2',  0.0, 0.0),
  ('a0000000-0000-0000-0000-000000000001', 'MFAC Room 3',             'MFAC Room 3',  0.0, 0.0),
  ('a0000000-0000-0000-0000-000000000001', 'MFAC Room 4',             'MFAC Room 4',  0.0, 0.0),
  ('a0000000-0000-0000-0000-000000000001', 'MFAC Room 5',             'MFAC Room 5',  0.0, 0.0),

  -- Special venues
  ('a0000000-0000-0000-0000-000000000001', 'Multi-Purpose Hall',      'MPH',          0.0, 0.0),
  ('a0000000-0000-0000-0000-000000000001', 'Sports Emporium',         'Sports Emp.',  0.0, 0.0),
  ('a0000000-0000-0000-0000-000000000001', 'FNB Cyberspace',          'FNB CSpace',   0.0, 0.0),
  ('a0000000-0000-0000-0000-000000000001', 'JMC Studio',              'JMC Studio',   0.0, 0.0),
  ('a0000000-0000-0000-0000-000000000001', 'Tent 2',                  'Tent 2',       0.0, 0.0)

on conflict do nothing;

-- Assign all existing profiles to Kwaluseni campus (for development)
update public.profiles
set campus_id = 'a0000000-0000-0000-0000-000000000001'
where campus_id is null;
