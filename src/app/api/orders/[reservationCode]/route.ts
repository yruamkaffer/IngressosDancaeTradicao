import { eventConfig } from "@/config/event";
import { fail, ok } from "@/lib/api";
import { formatPhone, maskCpf } from "@/lib/format";
import { firstRelation, relationTicketCode } from "@/lib/supabase/relations";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  { params }: { params: { reservationCode: string } }
) {
  const supabase = getSupabaseAdmin();
  const reservationCode = params.reservationCode.toUpperCase();

  const { data, error } = await supabase
    .from("orders")
    .select(
      "id,event_id,seat_id,buyer_name,buyer_phone,buyer_cpf,buyer_email,ticket_type,ticket_price,reservation_code,status,created_at,updated_at,seats(id,label,row,number,status),tickets(id,ticket_code,used_at,created_at)"
    )
    .eq("event_id", eventConfig.id)
    .eq("reservation_code", reservationCode)
    .order("created_at", { ascending: true });

  if (error) {
    return fail("Nao foi possivel buscar a reserva.", 500, error.message);
  }

  const orders = data ?? [];
  const firstOrder = orders[0];

  if (!firstOrder) {
    return fail("Reserva nao encontrada.", 404);
  }

  const allPaid = orders.every((order) => order.status === "paid");
  const allCancelled = orders.every((order) => order.status === "cancelled");
  const total = orders.reduce((sum, order) => {
    const ticketType = order.ticket_type === "half" ? "half" : order.ticket_type === "courtesy" ? "courtesy" : "full";
    return sum + Number(order.ticket_price ?? eventConfig.ticketTypes[ticketType].price);
  }, 0);

  return ok({
    id: firstOrder.id,
    status: allPaid ? "paid" : allCancelled ? "cancelled" : "pending_payment",
    reservationCode: firstOrder.reservation_code,
    buyerName: firstOrder.buyer_name,
    buyerPhone: formatPhone(firstOrder.buyer_phone),
    buyerEmail: firstOrder.buyer_email,
    buyerCpfMasked: maskCpf(firstOrder.buyer_cpf),
    seats: orders.map((order) => firstRelation(order.seats)).filter(Boolean),
    ticketType: firstOrder.ticket_type ?? "full",
    ticketCount: orders.length,
    total,
    ticketCodes: orders.map((order) => relationTicketCode(order.tickets)).filter(Boolean),
    createdAt: firstOrder.created_at
  });
}
