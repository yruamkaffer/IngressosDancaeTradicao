import { eventConfig } from "@/config/event";
import { fail, friendlyDatabaseError, ok } from "@/lib/api";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { validateBuyer } from "@/lib/validation";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);

  if (!body || typeof body !== "object") {
    return fail("Envie os dados da reserva.");
  }

  const parsed = validateBuyer({
    buyerName: body.buyerName,
    buyerPhone: body.buyerPhone,
    buyerCpf: body.buyerCpf,
    buyerEmail: body.buyerEmail,
    seatIds: Array.isArray(body.seatIds) ? body.seatIds : undefined,
    seatId: body.seatId
  });

  if (!parsed.ok) {
    return fail("Revise os campos obrigatorios.", 422, parsed.errors);
  }

  if (body.eventId && body.eventId !== eventConfig.id) {
    return fail("Evento invalido.", 422);
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.rpc("reserve_seats", {
    p_event_id: eventConfig.id,
    p_seat_ids: parsed.data.seatIds,
    p_buyer_name: parsed.data.buyerName,
    p_buyer_phone: parsed.data.buyerPhone,
    p_buyer_cpf: parsed.data.buyerCpf,
    p_buyer_email: parsed.data.buyerEmail
  });

  if (error) {
    const status = error.message.includes("SEAT_NOT_AVAILABLE") ? 409 : 400;
    return fail(friendlyDatabaseError(error.message), status, error.message);
  }

  const reservations = Array.isArray(data) ? data : data ? [data] : [];
  const firstReservation = reservations[0];
  if (!firstReservation) {
    return fail("Nao foi possivel criar a reserva.", 500);
  }

  return ok(
    {
      orderIds: reservations.map((reservation) => reservation.order_id),
      reservationCode: firstReservation.reservation_code,
      seatCount: reservations.length
    },
    { status: 201 }
  );
}