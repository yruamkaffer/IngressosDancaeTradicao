import { eventConfig } from "@/config/event";
import { fail, friendlyDatabaseError, ok } from "@/lib/api";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { validateBuyer } from "@/lib/validation";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);

  if (!body || typeof body !== "object") {
    return fail("Envie os dados da reserva.");
  }

  const parsed = validateBuyer({
    buyerName: body.buyerName,
    buyerPhone: body.buyerPhone,
    buyerCpf: body.buyerCpf,
    seatId: body.seatId
  });

  if (!parsed.ok) {
    return fail("Revise os campos obrigatorios.", 422, parsed.errors);
  }

  if (body.eventId && body.eventId !== eventConfig.id) {
    return fail("Evento invalido.", 422);
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.rpc("reserve_seat", {
    p_event_id: eventConfig.id,
    p_seat_id: parsed.data.seatId,
    p_buyer_name: parsed.data.buyerName,
    p_buyer_phone: parsed.data.buyerPhone,
    p_buyer_cpf: parsed.data.buyerCpf
  });

  if (error) {
    const status = error.message.includes("SEAT_NOT_AVAILABLE") ? 409 : 400;
    return fail(friendlyDatabaseError(error.message), status, error.message);
  }

  const reservation = Array.isArray(data) ? data[0] : data;
  if (!reservation) {
    return fail("Nao foi possivel criar a reserva.", 500);
  }

  return ok(
    {
      orderId: reservation.order_id,
      reservationCode: reservation.reservation_code
    },
    { status: 201 }
  );
}
