export type SeatStatus = "available" | "reserved" | "sold" | "blocked";
export type OrderStatus = "pending_payment" | "paid" | "cancelled";
export type TicketType = "full" | "half" | "courtesy";

export type Seat = {
  id: string;
  event_id: string;
  sector: string;
  row: string;
  number: number;
  label: string;
  status: SeatStatus;
  created_at?: string;
  updated_at?: string;
};

export type Order = {
  id: string;
  event_id: string;
  seat_id: string;
  buyer_name: string;
  buyer_phone: string;
  buyer_cpf: string;
  buyer_email?: string | null;
  ticket_type: TicketType;
  ticket_price: number;
  reservation_code: string;
  status: OrderStatus;
  created_at: string;
  updated_at: string;
  seats?: Seat | Seat[] | null;
  tickets?: Ticket[] | null;
};

export type Ticket = {
  id: string;
  order_id: string;
  ticket_code: string;
  used_at: string | null;
  created_at: string;
};

export type AdminOrder = Order & {
  seats: Seat | Seat[] | null;
  tickets: Ticket[] | null;
};
