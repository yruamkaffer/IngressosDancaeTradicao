insert into events (
  id,
  name,
  description,
  date,
  time,
  location,
  ticket_price
)
values (
  '9a5773b8-2367-4ced-a455-03263f191f89',
  'Vozes em Movimento',
  'Um espetaculo de danca contemporanea sobre encontros, memoria e presenca, criado para uma noite intimista no teatro.',
  '2026-09-19',
  '20:00',
  'Teatro Municipal - Sala Principal',
  80.00
)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  date = excluded.date,
  time = excluded.time,
  location = excluded.location,
  ticket_price = excluded.ticket_price;

insert into seats (event_id, sector, "row", number, label, status)
select
  '9a5773b8-2367-4ced-a455-03263f191f89',
  'Plateia',
  rows.row_name,
  numbers.seat_number,
  rows.row_name || numbers.seat_number::text,
  case
    when rows.row_name = 'E' and numbers.seat_number = 10 then 'blocked'
    else 'available'
  end
from unnest(array['A', 'B', 'C', 'D', 'E']) as rows(row_name)
cross join generate_series(1, 10) as numbers(seat_number)
on conflict (event_id, label) do nothing;
