import { eventConfig } from "@/config/event";
import { requestHasAdminSession } from "@/lib/admin-auth";
import { fail, ok } from "@/lib/api";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type OrderRow = {
  id: string;
  event_id: string;
  reservation_code: string;
  seat_id: string;
  status: string;
};

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!requestHasAdminSession(request)) {
    return fail("Nao autorizado.", 401);
  }

  const supabase = getSupabaseAdmin();
  const { data: targetOrder, error: targetError } = await supabase
    .from("orders")
    .select("id,event_id,reservation_code")
    .eq("id", params.id)
    .maybeSingle();

  if (targetError) {
    return fail("Nao foi possivel localizar a reserva.", 500, targetError.message);
  }

  if (!targetOrder) {
    return fail("Reserva nao encontrada.", 404);
  }

  if (targetOrder.event_id !== eventConfig.id) {
    return fail("Reserva de outro evento nao pode ser excluida por este painel.", 403);
  }

  const { data: orders, error: ordersError } = await supabase
    .from("orders")
    .select("id,event_id,reservation_code,seat_id,status")
    .eq("event_id", targetOrder.event_id)
    .ilike("reservation_code", targetOrder.reservation_code.trim());

  if (ordersError) {
    return fail("Nao foi possivel carregar os pedidos da reserva.", 500, ordersError.message);
  }

  const reservationOrders = (orders ?? []) as OrderRow[];
  if (reservationOrders.length === 0) {
    return fail("Reserva nao encontrada.", 404);
  }

  const orderIds = reservationOrders.map((order) => order.id);
  const seatIds = Array.from(new Set(reservationOrders.map((order) => order.seat_id).filter(Boolean)));

  const { error: ticketsError } = await supabase
    .from("tickets")
    .delete()
    .in("order_id", orderIds);

  if (ticketsError) {
    return fail("Nao foi possivel excluir os tickets da reserva.", 500, ticketsError.message);
  }

  const { data: deletedOrders, error: deleteError } = await supabase
    .from("orders")
    .delete()
    .in("id", orderIds)
    .select("id");

  if (deleteError) {
    return fail("Nao foi possivel excluir a reserva.", 500, deleteError.message);
  }

  if (seatIds.length > 0) {
    const { error: seatsError } = await supabase
      .from("seats")
      .update({ status: "available" })
      .in("id", seatIds)
      .in("status", ["reserved", "sold"]);

    if (seatsError) {
      return fail("Reserva excluida, mas nao foi possivel liberar todos os assentos.", 500, seatsError.message);
    }
  }

  return ok({ deleted: deletedOrders?.length ?? orderIds.length, releasedSeats: seatIds.length });
}