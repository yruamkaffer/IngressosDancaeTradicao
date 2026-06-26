-- Compact migration for multi-seat reservations.
-- Paste this whole file in a NEW Supabase SQL query tab and run it with no partial selection.

create extension if not exists pgcrypto;

alter table orders add column if not exists buyer_email text;
update orders set buyer_email = '' where buyer_email is null;
alter table orders alter column buyer_email set default '';
alter table orders alter column buyer_email set not null;
alter table orders drop constraint if exists orders_reservation_code_key;
create index if not exists orders_reservation_code_idx on orders(reservation_code);

create or replace function reserve_seats(p_event_id uuid, p_seat_ids uuid[], p_buyer_name text, p_buyer_phone text, p_buyer_cpf text, p_buyer_email text)
returns table(order_id uuid, reservation_code text)
language plpgsql
security definer
set search_path = public
as $q$
declare
  l_id uuid;
  l_ids uuid[];
  l_code text;
  l_order_id uuid;
  l_status text;
  l_phone text;
  l_cpf text;
  l_email text;
begin
  select array_agg(distinct seat_id) into l_ids from unnest(coalesce(p_seat_ids, array[]::uuid[])) as selected_ids(seat_id) where seat_id is not null;
  if coalesce(array_length(l_ids, 1), 0) < 1 or coalesce(array_length(l_ids, 1), 0) > 5 then raise exception 'INVALID_SEAT_COUNT'; end if;
  l_phone := regexp_replace(coalesce(p_buyer_phone, ''), '[^0-9]', '', 'g');
  l_cpf := regexp_replace(coalesce(p_buyer_cpf, ''), '[^0-9]', '', 'g');
  l_email := lower(trim(coalesce(p_buyer_email, '')));
  if length(trim(coalesce(p_buyer_name, ''))) < 3 or length(l_phone) < 10 or length(l_phone) > 11 or length(l_cpf) <> 11 or l_email !~ '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$' then raise exception 'INVALID_BUYER_DATA'; end if;
  loop
    l_code := 'RES-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    exit when not exists (select 1 from orders where orders.reservation_code = l_code);
  end loop;
  foreach l_id in array l_ids loop
    select seats.status into l_status from seats where seats.id = l_id and seats.event_id = p_event_id for update;
    if not found then raise exception 'SEAT_NOT_FOUND'; end if;
    if l_status <> 'available' then raise exception 'SEAT_NOT_AVAILABLE'; end if;
    l_order_id := gen_random_uuid();
    insert into orders (id,event_id,seat_id,buyer_name,buyer_phone,buyer_cpf,buyer_email,reservation_code,status) values (l_order_id,p_event_id,l_id,trim(p_buyer_name),l_phone,l_cpf,l_email,l_code,'pending_payment');
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
  select orders.event_id, orders.reservation_code into l_event_id, l_code from orders where orders.id = p_order_id for update;
  if not found then raise exception 'ORDER_NOT_FOUND'; end if;
  if exists (select 1 from orders where orders.reservation_code = l_code and orders.event_id = l_event_id and orders.status = 'cancelled') then raise exception 'ORDER_NOT_PENDING'; end if;
  for l_order_id, l_seat_id, l_status in select orders.id, orders.seat_id, orders.status from orders where orders.reservation_code = l_code and orders.event_id = l_event_id order by orders.created_at asc for update loop
    if l_status = 'pending_payment' then
      update orders set status = 'paid' where orders.id = l_order_id;
      update seats set status = 'sold' where seats.id = l_seat_id;
    elsif l_status <> 'paid' then
      raise exception 'ORDER_NOT_PENDING';
    end if;
    l_ticket_id := null;
    l_ticket_code := null;
    select tickets.id, tickets.ticket_code into l_ticket_id, l_ticket_code from tickets where tickets.order_id = l_order_id;
    if l_ticket_id is null then
      l_ticket_id := gen_random_uuid();
      loop
        l_ticket_code := 'TCK-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));
        exit when not exists (select 1 from tickets where tickets.ticket_code = l_ticket_code);
      end loop;
      insert into tickets (id, order_id, ticket_code) values (l_ticket_id, l_order_id, l_ticket_code);
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
  select orders.event_id, orders.reservation_code into l_event_id, l_code from orders where orders.id = p_order_id for update;
  if not found then raise exception 'ORDER_NOT_FOUND'; end if;
  if exists (select 1 from orders where orders.reservation_code = l_code and orders.event_id = l_event_id and orders.status = 'paid') then raise exception 'ORDER_NOT_PENDING'; end if;
  for l_order_id, l_seat_id, l_status in select orders.id, orders.seat_id, orders.status from orders where orders.reservation_code = l_code and orders.event_id = l_event_id for update loop
    if l_status <> 'cancelled' then
      update orders set status = 'cancelled' where orders.id = l_order_id;
      update seats set status = 'available' where seats.id = l_seat_id and seats.status = 'reserved';
    end if;
  end loop;
end;
$q$;

select 'multi-seat-email-pdf migration ok' as status;