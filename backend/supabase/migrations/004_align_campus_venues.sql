delete from public.campus_buildings a
using public.campus_buildings b
where a.campus_id = b.campus_id
  and a.name = b.name
  and a.id > b.id;

delete from public.campus_buildings
where campus_id = 'a0000000-0000-0000-0000-000000000001'
  and name in ('A-Block Room A4.5', 'B-Block Room B2.6');

with wanted(name, abbreviation) as (
  values
    ('C-Block Room C1.6', 'C.1.6'),
    ('EE Lab EE2.7', 'EE 2.7'),
    ('Venue N1', null),
    ('Venue N2', null),
    ('Venue N3', null)
)
insert into public.campus_buildings (campus_id, name, abbreviation, lat, lng)
select 'a0000000-0000-0000-0000-000000000001', w.name, w.abbreviation, 0.0, 0.0
from wanted w
where not exists (
  select 1
  from public.campus_buildings b
  where b.campus_id = 'a0000000-0000-0000-0000-000000000001'
    and b.name = w.name
);
