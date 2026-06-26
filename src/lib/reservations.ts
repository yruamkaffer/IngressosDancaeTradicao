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

export async function getReservationBundle(reservationCode: string): Promise<ReservationBundle | null> {
  const supabase = getSupabaseAdmin();
  const code = reservationCode.toUpperCase();

  const { data, error } = await supabase
    .from("orders")
    .select("id,buyer_name,buyer_phone,buyer_cpf,buyer_email,reservation_code,status,created_at,seats(label),tickets(ticket_code)")
    .eq("event_id", eventConfig.id)
    .eq("reservation_code", code)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const orders = data ?? [];
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