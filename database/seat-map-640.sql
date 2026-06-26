-- Atualiza o evento para o mapa oficial de 640 lugares.
-- Use este script no Supabase SQL Editor quando o banco ja existir.
-- Ele aborta se ja houver pedidos, para nao apagar assentos ligados a reservas/vendas.

do $$
begin
  if exists (
    select 1
    from orders
    where event_id = '9a5773b8-2367-4ced-a455-03263f191f89'
  ) then
    raise exception 'Existem pedidos para este evento. Cancele/migre as reservas antes de recriar o mapa de assentos.';
  end if;
end $$;

update events
set
  name = 'Sob a Luz da Dança',
  description = '14ª Mostra de Dança dos Alunos realizada pela Dança & Tradição Studio de Danças.',
  date = '2026-11-15',
  time = '20:00',
  location = 'Teatro CENSUPEG (antigo Teatro da CNEC)',
  ticket_price = 80.00
where id = '9a5773b8-2367-4ced-a455-03263f191f89';

delete from seats
where event_id = '9a5773b8-2367-4ced-a455-03263f191f89';

with seat_layout as (
  select *
  from (values
    ('Plateia esquerda', 'PE', 6, array['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P']::text[]),
    ('Plateia central', 'PC', 20, array['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P']::text[]),
    ('Plateia direita', 'PD', 6, array['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P']::text[]),
    ('2º piso', '2P', 16, array['A','B','C','D','E','F','G','H']::text[])
  ) as layout(sector, prefix, seats_per_row, rows)
), expanded_rows as (
  select
    sector,
    prefix,
    seats_per_row,
    row_name
  from seat_layout
  cross join unnest(rows) as row_name
)
insert into seats (event_id, sector, "row", number, label, status)
select
  '9a5773b8-2367-4ced-a455-03263f191f89',
  expanded_rows.sector,
  expanded_rows.row_name,
  numbers.seat_number,
  expanded_rows.prefix || '-' || expanded_rows.row_name || lpad(numbers.seat_number::text, 2, '0'),
  'available'
from expanded_rows
cross join lateral generate_series(1, expanded_rows.seats_per_row) as numbers(seat_number);