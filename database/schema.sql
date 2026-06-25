create extension if not exists pgcrypto;

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null,
  date date not null,
  time time not null,
  location text not null,
  ticket_price numeric(10, 2) not null check (ticket_price >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists seats (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  sector text not null default 'Plateia',
  "row" text not null,
  number integer not null check (number > 0),
  label text not null,
  status text not null default 'available' check (status in ('available', 'reserved', 'sold', 'blocked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, label)
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  seat_id uuid not null references seats(id) on delete restrict,
  buyer_name text not null,
  buyer_phone text not null,
  buyer_cpf text not null,
  reservation_code text not null unique,
  status text not null default 'pending_payment' check (status in ('pending_payment', 'paid', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists tickets (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references orders(id) on delete cascade,
  ticket_code text not null unique,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index if not exists orders_one_active_per_seat
  on orders(seat_id)
  where status in ('pending_payment', 'paid');

create index if not exists seats_event_status_idx on seats(event_id, status);
create index if not exists orders_event_status_idx on orders(event_id, status);
create index if not exists orders_reservation_code_idx on orders(reservation_code);
create index if not exists tickets_ticket_code_idx on tickets(ticket_code);

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_events_updated_at on events;
create trigger set_events_updated_at
before update on events
for each row execute function set_updated_at();

drop trigger if exists set_seats_updated_at on seats;
create trigger set_seats_updated_at
before update on seats
for each row execute function set_updated_at();

drop trigger if exists set_orders_updated_at on orders;
create trigger set_orders_updated_at
before update on orders
for each row execute function set_updated_at();

create or replace function reserve_seat(
  p_event_id uuid,
  p_seat_id uuid,
  p_buyer_name text,
  p_buyer_phone text,
  p_buyer_cpf text
)
returns table(order_id uuid, reservation_code text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_seat seats%rowtype;
  v_code text;
  v_order_id uuid;
begin
  if length(trim(coalesce(p_buyer_name, ''))) < 3
    or length(regexp_replace(coalesce(p_buyer_phone, ''), '\D', '', 'g')) not between 10 and 11
    or length(regexp_replace(coalesce(p_buyer_cpf, ''), '\D', '', 'g')) <> 11
  then
    raise exception 'INVALID_BUYER_DATA';
  end if;

  select *
    into v_seat
    from seats
   where id = p_seat_id
     and event_id = p_event_id
   for update;

  if not found then
    raise exception 'SEAT_NOT_FOUND';
  end if;

  if v_seat.status <> 'available' then
    raise exception 'SEAT_NOT_AVAILABLE';
  end if;

  loop
    v_code := 'RES-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    exit when not exists (select 1 from orders where orders.reservation_code = v_code);
  end loop;

  insert into orders (
    event_id,
    seat_id,
    buyer_name,
    buyer_phone,
    buyer_cpf,
    reservation_code,
    status
  )
  values (
    p_event_id,
    p_seat_id,
    trim(p_buyer_name),
    regexp_replace(p_buyer_phone, '\D', '', 'g'),
    regexp_replace(p_buyer_cpf, '\D', '', 'g'),
    v_code,
    'pending_payment'
  )
  returning id into v_order_id;

  update seats
     set status = 'reserved'
   where id = p_seat_id;

  return query select v_order_id, v_code;
end;
$$;

create or replace function confirm_order_payment(p_order_id uuid)
returns table(ticket_id uuid, ticket_code text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order orders%rowtype;
  v_ticket_id uuid;
  v_ticket_code text;
begin
  select *
    into v_order
    from orders
   where id = p_order_id
   for update;

  if not found then
    raise exception 'ORDER_NOT_FOUND';
  end if;

  if v_order.status = 'paid' then
    select tickets.id, tickets.ticket_code
      into v_ticket_id, v_ticket_code
      from tickets
     where tickets.order_id = p_order_id;

    return query select v_ticket_id, v_ticket_code;
    return;
  end if;

  if v_order.status <> 'pending_payment' then
    raise exception 'ORDER_NOT_PENDING';
  end if;

  update orders
     set status = 'paid'
   where id = p_order_id;

  update seats
     set status = 'sold'
   where id = v_order.seat_id;

  loop
    v_ticket_code := 'TCK-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));
    exit when not exists (select 1 from tickets where tickets.ticket_code = v_ticket_code);
  end loop;

  insert into tickets (order_id, ticket_code)
  values (p_order_id, v_ticket_code)
  returning id into v_ticket_id;

  return query select v_ticket_id, v_ticket_code;
end;
$$;

create or replace function cancel_order(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order orders%rowtype;
begin
  select *
    into v_order
    from orders
   where id = p_order_id
   for update;

  if not found then
    raise exception 'ORDER_NOT_FOUND';
  end if;

  if v_order.status = 'cancelled' then
    return;
  end if;

  if v_order.status <> 'pending_payment' then
    raise exception 'ORDER_NOT_PENDING';
  end if;

  update orders
     set status = 'cancelled'
   where id = p_order_id;

  update seats
     set status = 'available'
   where id = v_order.seat_id
     and status = 'reserved';
end;
$$;

create or replace function validate_ticket(p_ticket_code text)
returns table(ticket_code text, order_id uuid, used_at timestamptz, already_used boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ticket tickets%rowtype;
begin
  select *
    into v_ticket
    from tickets
   where tickets.ticket_code = upper(trim(p_ticket_code))
   for update;

  if not found then
    raise exception 'TICKET_NOT_FOUND';
  end if;

  if v_ticket.used_at is not null then
    return query select v_ticket.ticket_code, v_ticket.order_id, v_ticket.used_at, true;
    return;
  end if;

  update tickets
     set used_at = now()
   where id = v_ticket.id
   returning * into v_ticket;

  return query select v_ticket.ticket_code, v_ticket.order_id, v_ticket.used_at, false;
end;
$$;

alter table events enable row level security;
alter table seats enable row level security;
alter table orders enable row level security;
alter table tickets enable row level security;
