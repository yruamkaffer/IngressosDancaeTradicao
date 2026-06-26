import { eventConfig } from "@/config/event";
import { formatCurrency } from "@/lib/format";
import { firstRelation, relationTicketCode } from "@/lib/supabase/relations";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export type ReservationBundle = {
  reservationCode: string;
  buyerName: string;
  buyerPhone: string;
  buyerCpf: string;
  buyerEmail: string;
  status: string;
  orderIds: string[];
  seatLabels: string[];
  ticketCodes: string[];
  seatCount: number;
  total: number;
  totalFormatted: string;
  createdAt: string;
};

type ReservationOrder = {
  id: string;
  buyer_name: string;
  buyer_phone: string;
  buyer_cpf: string;
  buyer_email: string | null;
  reservation_code: string;
  status: string;
  created_at: string;
  seats: { label?: string | null } | Array<{ label?: string | null }> | null;
  tickets: { ticket_code?: string | null } | Array<{ ticket_code?: string | null }> | null;
};

function normalizeReservationCode(value: string) {
  const trimmed = value.trim();

  try {
    return decodeURIComponent(trimmed).trim().toUpperCase();
  } catch {
    return trimmed.toUpperCase();
  }
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function buildReservationBundle(orders: ReservationOrder[]): ReservationBundle | null {
  const firstOrder = orders[0];
  if (!firstOrder) {
    return null;
  }

  const seatLabels = orders
    .map((order) => firstRelation(order.seats)?.label ?? "")
    .filter(Boolean);
  const ticketCodes = orders
    .map((order) => relationTicketCode(order.tickets))
    .filter(Boolean) as string[];

  const allPaid = orders.every((order) => order.status === "paid");
  const allCancelled = orders.every((order) => order.status === "cancelled");
  const status = allPaid ? "paid" : allCancelled ? "cancelled" : "pending_payment";
  const total = orders.length * eventConfig.ticketPrice;

  return {
    reservationCode: firstOrder.reservation_code,
    buyerName: firstOrder.buyer_name,
    buyerPhone: firstOrder.buyer_phone,
    buyerCpf: firstOrder.buyer_cpf,
    buyerEmail: firstOrder.buyer_email ?? "",
    status,
    orderIds: orders.map((order) => order.id),
    seatLabels,
    ticketCodes,
    seatCount: orders.length,
    total,
    totalFormatted: formatCurrency(total),
    createdAt: firstOrder.created_at
  };
}

export async function getReservationBundle(reservationCode: string): Promise<ReservationBundle | null> {
  const supabase = getSupabaseAdmin();
  const code = normalizeReservationCode(reservationCode);

  if (!code) {
    return null;
  }

  const { data, error } = await supabase
    .from("orders")
    .select("id,buyer_name,buyer_phone,buyer_cpf,buyer_email,reservation_code,status,created_at,seats(label),tickets(ticket_code)")
    .ilike("reservation_code", code)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return buildReservationBundle((data ?? []) as ReservationOrder[]);
}

export async function getReservationBundleByOrderId(orderId: string): Promise<ReservationBundle | null> {
  if (!isUuid(orderId)) {
    return null;
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("orders")
    .select("reservation_code")
    .eq("id", orderId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data?.reservation_code) {
    return null;
  }

  return getReservationBundle(data.reservation_code);
}