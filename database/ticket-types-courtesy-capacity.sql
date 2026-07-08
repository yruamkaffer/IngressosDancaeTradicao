-- Migration for ticket types, hidden capacity control and admin courtesy tickets.
-- Run this file in a NEW Supabase SQL query tab after the previous schema/migrations.

create extension if not exists pgcrypto;

update events
   set ticket_price = 70
 where id = '9a5773b8-2367-4ced-a455-03263f191f89';

alter table orders add column if not exists buyer_email text;
update orders set buyer_email = '' where buyer_email is null;
alter table orders alter column buyer_email set default '';
alter table orders alter column buyer_email set not null;

alter table orders add column if not exists ticket_type text;
update orders set ticket_type = 'full' where ticket_type is null;
alter table orders alter column ticket_type set default 'full';
alter table orders alter column ticket_type set not null;
alter table orders drop constraint if exists orders_ticket_type_check;
alter table orders add constraint orders_ticket_type_check check (ticket_type in ('full', 'half', 'courtesy'));

alter table orders add column if not exists ticket_price numeric(10, 2);
update orders
   set ticket_price = case
     when ticket_type = 'half' then 35
     when ticket_type = 'courtesy' then 0
     else 70
   end
 where ticket_price is null;
alter table orders alter column ticket_price set default 70;
alter table orders alter column ticket_price set not null;
alter table orders drop constraint if exists orders_ticket_price_check;
alter table orders add constraint orders_ticket_price_check check (ticket_price >= 0);

alter table orders drop constraint if exists orders_reservation_code_key;
create index if not exists orders_reservation_code_idx on orders(reservation_code);
create index if not exists orders_event_ticket_type_idx on orders(event_id, ticket_type);

create or replace function reserve_tickets_by_quantity(
  p_event_id uuid,
  p_quantity integer,
  p_ticket_type text,
  p_ticket_price numeric,
  p_buyer_name text,
  p_buyer_phone text,
  p_buyer_cpf text,
  p_buyer_email text
)
returns table(order_id uuid, reservation_code text)
language plpgsql
security definer
set search_path = public
as $q$
declare
  l_ids uuid[];
  l_id uuid;
  l_code text;
  l_order_id uuid;
  l_phone text;
  l_cpf text;
  l_email text;
  l_quantity integer;
  l_ticket_type text;
  l_ticket_price numeric(10, 2);
begin
  l_quantity := coalesce(p_quantity, 0);
  l_ticket_type := lower(trim(coalesce(p_ticket_type, 'full')));
  l_ticket_price := coalesce(p_ticket_price, 0);

  if l_quantity < 1 or l_quantity > 10 then
    raise exception 'INVALID_SEAT_COUNT';
  end if;

  if l_ticket_type not in ('full', 'half', 'courtesy') then
    raise exception 'INVALID_TICKET_TYPE';
  end if;

  if l_ticket_price < 0 then
    raise exception 'INVALID_TICKET_PRICE';
  end if;

  l_phone := regexp_replace(coalesce(p_buyer_phone, ''), '[^0-9]', '', 'g');
  l_cpf := regexp_replace(coalesce(p_buyer_cpf, ''), '[^0-9]', '', 'g');
  l_email := lower(trim(coalesce(p_buyer_email, '')));

  if length(trim(coalesce(p_buyer_name, ''))) < 3
    or length(l_phone) < 10
    or length(l_phone) > 11
    or length(l_cpf) <> 11
    or l_email !~ '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$'
  then
    raise exception 'INVALID_BUYER_DATA';
  end if;

  select array_agg(available.id)
    into l_ids
    from (
      select seats.id
        from seats
       where seats.event_id = p_event_id
         and seats.status = 'available'
       order by seats."row" asc, seats.number asc
       limit l_quantity
       for update skip locked
    ) available;

  if coalesce(array_length(l_ids, 1), 0) <> l_quantity then
    raise exception 'SEAT_NOT_AVAILABLE';
  end if;

  loop
    l_code := 'RES-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    exit when not exists (select 1 from orders where orders.reservation_code = l_code);
  end loop;

  foreach l_id in array l_ids loop
    l_order_id := gen_random_uuid();

    insert into orders (
      id,
      event_id,
      seat_id,
      buyer_name,
      buyer_phone,
      buyer_cpf,
      buyer_email,
      ticket_type,
      ticket_price,
      reservation_code,
      status
    )
    values (
      l_order_id,
      p_event_id,
      l_id,
      trim(p_buyer_name),
      l_phone,
      l_cpf,
      l_email,
      l_ticket_type,
      l_ticket_price,
      l_code,
      'pending_payment'
    );

    update seats set status = 'reserved' where seats.id = l_id;

    return query select l_order_id, l_code;
  end loop;
end;
$q$;

create or replace function confirm_reservation_payment(p_order_id uuid)
returns table(order_id uuid, ticket_id uuid, ticket_code text, reservation_code text)
language plpgsql
security definer
set search_path = public
as $q$
declare
  l_event_id uuid;
  l_code text;
  l_order_id uuid;
  l_seat_id uuid;
  l_status text;
  l_ticket_id uuid;
  l_ticket_code text;
begin
  select orders.event_id, orders.reservation_code
    into l_event_id, l_code
    from orders
   where orders.id = p_order_id
   for update;

  if not found then
    raise exception 'ORDER_NOT_FOUND';
  end if;

  if exists (
    select 1
      from orders
     where orders.reservation_code = l_code
       and orders.event_id = l_event_id
       and orders.status = 'cancelled'
  ) then
    raise exception 'ORDER_NOT_PENDING';
  end if;

  for l_order_id, l_seat_id, l_status in
    select orders.id, orders.seat_id, orders.status
      from orders
     where orders.reservation_code = l_code
       and orders.event_id = l_event_id
     order by orders.created_at asc
     for update
  loop
    if l_status = 'pending_payment' then
      update orders set status = 'paid' where orders.id = l_order_id;
      update seats set status = 'sold' where seats.id = l_seat_id;
    elsif l_status <> 'paid' then
      raise exception 'ORDER_NOT_PENDING';
    end if;

    l_ticket_id := null;
    l_ticket_code := null;

    select tickets.id, tickets.ticket_code
      into l_ticket_id, l_ticket_code
      from tickets
     where tickets.order_id = l_order_id;

    if l_ticket_id is null then
      l_ticket_id := gen_random_uuid();

      loop
        l_ticket_code := 'TCK-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));
        exit when not exists (select 1 from tickets where tickets.ticket_code = l_ticket_code);
      end loop;

      insert into tickets (id, order_id, ticket_code)
      values (l_ticket_id, l_order_id, l_ticket_code);
    end if;

    return query select l_order_id, l_ticket_id, l_ticket_code, l_code;
  end loop;
end;
$q$;

create or replace function cancel_reservation(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $q$
declare
  l_event_id uuid;
  l_code text;
  l_order_id uuid;
  l_seat_id uuid;
  l_status text;
begin
  select orders.event_id, orders.reservation_code
    into l_event_id, l_code
    from orders
   where orders.id = p_order_id
   for update;

  if not found then
    raise exception 'ORDER_NOT_FOUND';
  end if;

  if exists (
    select 1
      from orders
     where orders.reservation_code = l_code
       and orders.event_id = l_event_id
       and orders.status = 'paid'
  ) then
    raise exception 'ORDER_NOT_PENDING';
  end if;

  for l_order_id, l_seat_id, l_status in
    select orders.id, orders.seat_id, orders.status
      from orders
     where orders.reservation_code = l_code
       and orders.event_id = l_event_id
     for update
  loop
    if l_status <> 'cancelled' then
      update orders set status = 'cancelled' where orders.id = l_order_id;
      update seats set status = 'available' where seats.id = l_seat_id and seats.status = 'reserved';
    end if;
  end loop;
end;
$q$;

select 'ticket-types-courtesy-capacity migration ok' as status;
