import { requestHasAdminSession } from "@/lib/admin-auth";
import { fail, friendlyDatabaseError, ok } from "@/lib/api";
import { getReservationBundle } from "@/lib/reservations";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { sendTicketEmail } from "@/lib/ticket-email";
import { validateBuyer } from "@/lib/validation";
import { eventConfig } from "@/config/event";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!requestHasAdminSession(request)) {
    return fail("Nao autorizado.", 401);
  }

  const body = await request.json().catch(() => null);

  if (!body || typeof body !== "object") {
    return fail("Envie os dados da cortesia.");
  }

  const parsed = validateBuyer({
    buyerName: body.buyerName,
    buyerPhone: body.buyerPhone,
    buyerCpf: body.buyerCpf,
    buyerEmail: body.buyerEmail,
    ticketType: "courtesy",
    quantity: typeof body.quantity === "number" ? body.quantity : Number(body.quantity)
  });

  if (!parsed.ok) {
    return fail("Revise os campos obrigatorios.", 422, parsed.errors);
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.rpc("reserve_tickets_by_quantity", {
    p_event_id: eventConfig.id,
    p_quantity: parsed.data.quantity,
    p_ticket_type: "courtesy",
    p_ticket_price: 0,
    p_buyer_name: parsed.data.buyerName,
    p_buyer_phone: parsed.data.buyerPhone,
    p_buyer_cpf: parsed.data.buyerCpf,
    p_buyer_email: parsed.data.buyerEmail
  });

  if (error) {
    return fail(friendlyDatabaseError(error.message), 400, error.message);
  }

  const reservations = Array.isArray(data) ? data : data ? [data] : [];
  const firstReservation = reservations[0];

  if (!firstReservation) {
    return fail("Nao foi possivel criar a cortesia.", 500);
  }

  const { data: tickets, error: confirmError } = await supabase.rpc("confirm_reservation_payment", {
    p_order_id: firstReservation.order_id
  });

  if (confirmError) {
    return fail(friendlyDatabaseError(confirmError.message), 400, confirmError.message);
  }

  const rows = Array.isArray(tickets) ? tickets : tickets ? [tickets] : [];
  const bundle = await getReservationBundle(firstReservation.reservation_code);
  const email = bundle ? await sendTicketEmail(bundle) : { ok: false, skipped: true, reason: "Reserva nao encontrada." };

  return ok(
    {
      reservationCode: firstReservation.reservation_code,
      ticketCodes: rows.map((row) => row.ticket_code).filter(Boolean),
      email
    },
    { status: 201 }
  );
}
